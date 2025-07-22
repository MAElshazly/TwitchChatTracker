import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { TwitchIrcClient } from "./services/twitchIrc";
import { insertChannelSchema, insertChatFiltersSchema } from "@shared/schema";

let twitchClient: TwitchIrcClient;
let wss: WebSocketServer;
const connectedClients = new Set<WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize Twitch IRC client
  twitchClient = new TwitchIrcClient();

  // Setup WebSocket server
  wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    connectedClients.add(ws);
    console.log('Client connected to WebSocket');

    // Send initial connection status
    const status = twitchClient.getConnectionStatus();
    ws.send(JSON.stringify({
      type: 'connection_status',
      data: status
    }));

    ws.on('close', () => {
      connectedClients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connectedClients.delete(ws);
    });
  });

  // Handle Twitch IRC messages and broadcast to all clients
  twitchClient.onMessage((message) => {
    broadcastToClients(message);
  });

  // API Routes

  // Get all channels
  app.get('/api/channels', async (req, res) => {
    try {
      const channels = await storage.getChannels();
      res.json(channels);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch channels' });
    }
  });

  // Add a new channel
  app.post('/api/channels', async (req, res) => {
    try {
      const result = insertChannelSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid channel data', details: result.error });
      }

      const channelName = result.data.name.toLowerCase();
      
      // Check if channel already exists
      const existingChannel = await storage.getChannel(channelName);
      if (existingChannel) {
        return res.status(409).json({ error: 'Channel already exists' });
      }

      // Create channel in storage
      const channel = await storage.createChannel(result.data);
      
      // Join channel in Twitch IRC
      const joined = twitchClient.joinChannel(channelName);
      if (joined) {
        console.log(`Joined Twitch channel: ${channelName}`);
      }

      // Broadcast channel update
      broadcastToClients({
        type: 'channel_update',
        data: { action: 'added', channel }
      });

      res.status(201).json(channel);
    } catch (error) {
      console.error('Error adding channel:', error);
      res.status(500).json({ error: 'Failed to add channel' });
    }
  });

  // Remove a channel
  app.delete('/api/channels/:name', async (req, res) => {
    try {
      const channelName = req.params.name.toLowerCase();
      
      const deleted = await storage.deleteChannel(channelName);
      if (!deleted) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      // Leave channel in Twitch IRC
      const left = twitchClient.leaveChannel(channelName);
      if (left) {
        console.log(`Left Twitch channel: ${channelName}`);
      }

      // Broadcast channel update
      broadcastToClients({
        type: 'channel_update',
        data: { action: 'removed', channelName }
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error removing channel:', error);
      res.status(500).json({ error: 'Failed to remove channel' });
    }
  });

  // Get chat messages for a channel
  app.get('/api/channels/:name/messages', async (req, res) => {
    try {
      const channelName = req.params.name;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const messages = await storage.getChatMessages(channelName, limit);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // Clear chat messages for a channel
  app.delete('/api/channels/:name/messages', async (req, res) => {
    try {
      const channelName = req.params.name;
      
      const cleared = await storage.clearChatMessages(channelName);
      if (!cleared) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing messages:', error);
      res.status(500).json({ error: 'Failed to clear messages' });
    }
  });

  // Get chat filters
  app.get('/api/filters', async (req, res) => {
    try {
      const filters = await storage.getChatFilters();
      res.json(filters);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch filters' });
    }
  });

  // Update chat filters
  app.put('/api/filters', async (req, res) => {
    try {
      const result = insertChatFiltersSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid filter data', details: result.error });
      }

      const filters = await storage.updateChatFilters(result.data);
      res.json(filters);
    } catch (error) {
      console.error('Error updating filters:', error);
      res.status(500).json({ error: 'Failed to update filters' });
    }
  });

  // Get connection status
  app.get('/api/status', async (req, res) => {
    try {
      const status = twitchClient.getConnectionStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get status' });
    }
  });

  return httpServer;
}

function broadcastToClients(message: any) {
  const messageStr = JSON.stringify(message);
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}
