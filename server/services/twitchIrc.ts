import WebSocket from 'ws';
import { storage } from '../storage';
import type { InsertChatMessage } from '@shared/schema';

export class TwitchIrcClient {
  private socket: WebSocket | null = null;
  private channels: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private messageHandlers: ((message: any) => void)[] = [];

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      this.socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
      
      this.socket.onopen = () => {
        console.log('Connected to Twitch IRC');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Send authentication (anonymous)
        this.socket?.send('PASS SCHMOOPIIE');
        this.socket?.send('NICK justinfan12345');
        
        // Request capabilities for better message parsing
        this.socket?.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
        
        // Rejoin channels after reconnection
        this.channels.forEach(channel => {
          this.socket?.send(`JOIN #${channel}`);
        });
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.socket.onclose = () => {
        console.log('Disconnected from Twitch IRC');
        this.isConnected = false;
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('Twitch IRC error:', error);
      };

    } catch (error) {
      console.error('Failed to connect to Twitch IRC:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private handleMessage(data: string) {
    const lines = data.trim().split('\r\n');
    
    for (const line of lines) {
      if (line.startsWith('PING')) {
        this.socket?.send('PONG :tmi.twitch.tv');
        continue;
      }

      if (line.includes('PRIVMSG')) {
        this.parsePrivMsg(line);
      }
    }
  }

  private parsePrivMsg(line: string) {
    try {
      // Parse IRC message format more carefully
      // Format: @tags :username!user@host PRIVMSG #channel :message
      
      let workingLine = line;
      let tags = '';
      
      // Extract tags if present
      if (workingLine.startsWith('@')) {
        const spaceIndex = workingLine.indexOf(' ');
        if (spaceIndex !== -1) {
          tags = workingLine.substring(1, spaceIndex);
          workingLine = workingLine.substring(spaceIndex + 1);
        }
      }
      
      // Extract username from prefix
      const prefixMatch = workingLine.match(/^:(\w+)!/);
      const username = prefixMatch ? prefixMatch[1] : 'unknown';
      
      // Find PRIVMSG and channel
      const privmsgMatch = workingLine.match(/PRIVMSG (#\w+) :/);
      if (!privmsgMatch) return;
      
      const channel = privmsgMatch[1].substring(1); // Remove #
      
      // Extract the actual message after the final colon
      const messageStart = workingLine.indexOf(' :', workingLine.indexOf('PRIVMSG'));
      if (messageStart === -1) return;
      
      const message = workingLine.substring(messageStart + 2);
      
      // Parse tags if available
      let displayName = username;
      let isSubscriber = false;
      let isModerator = false;
      let badges: string[] = [];

      if (tags) {
        const tagPairs = tags.split(';');
        
        for (const tag of tagPairs) {
          const [key, value] = tag.split('=');
          switch (key) {
            case 'display-name':
              displayName = value || username;
              break;
            case 'subscriber':
              isSubscriber = value === '1';
              break;
            case 'mod':
              isModerator = value === '1';
              break;
            case 'badges':
              badges = value ? value.split(',').map(badge => badge.split('/')[0]) : [];
              break;
          }
        }
      }

      const chatMessage: InsertChatMessage = {
        channelName: channel,
        username,
        displayName,
        message,
        isHighlighted: message.toLowerCase().includes('@' + channel.toLowerCase()),
        isSubscriber,
        isModerator,
        badges,
        emotes: [],
      };

      // Store message and notify handlers
      storage.addChatMessage(chatMessage).then(storedMessage => {
        this.messageHandlers.forEach(handler => {
          handler({
            type: 'chat_message',
            data: storedMessage
          });
        });
      });

    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  joinChannel(channelName: string): boolean {
    const channel = channelName.toLowerCase();
    
    if (this.channels.has(channel)) {
      return false; // Already joined
    }

    this.channels.add(channel);
    
    if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(`JOIN #${channel}`);
    }

    return true;
  }

  leaveChannel(channelName: string): boolean {
    const channel = channelName.toLowerCase();
    
    if (!this.channels.has(channel)) {
      return false; // Not joined
    }

    this.channels.delete(channel);
    
    if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(`PART #${channel}`);
    }

    return true;
  }

  getConnectedChannels(): string[] {
    return Array.from(this.channels);
  }

  isChannelConnected(channelName: string): boolean {
    return this.channels.has(channelName.toLowerCase());
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      channelCount: this.channels.size,
    };
  }

  onMessage(handler: (message: any) => void) {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: (message: any) => void) {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.channels.clear();
  }
}
