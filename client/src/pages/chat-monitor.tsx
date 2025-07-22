import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ConnectionStatus } from "@/components/ui/connection-status";
import { ChannelManager } from "@/components/ui/channel-manager";
import { ChatFilters } from "@/components/ui/chat-filters";
import { ChatStatistics } from "@/components/ui/chat-statistics";
import { ChatMessage } from "@/components/ui/chat-message";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Pause, Play, Trash2, Download } from "lucide-react";
import type { Channel, ChatMessage as ChatMessageType, ChatFilters as ChatFiltersType, ConnectionStatus as ConnectionStatusType, ChatStatistics as ChatStatisticsType } from "@shared/schema";

export default function ChatMonitor() {
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusType>({
    connected: false,
    channelCount: 0,
    messageCount: 0,
    uptime: "00:00:00"
  });
  const [statistics, setStatistics] = useState<ChatStatisticsType>({
    messagesPerMinute: 0,
    uniqueUsers: 0,
    avgMessageLength: 0,
    peakActivity: "00:00"
  });
  const [isPaused, setIsPaused] = useState(false);
  const [startTime] = useState(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch channels
  const { data: channels = [], isLoading: channelsLoading } = useQuery<Channel[]>({
    queryKey: ['/api/channels'],
  });

  // Fetch chat filters
  const { data: filters, isLoading: filtersLoading } = useQuery<ChatFiltersType>({
    queryKey: ['/api/filters'],
  });

  // Fetch messages for selected channel
  const { data: channelMessages = [] } = useQuery<ChatMessageType[]>({
    queryKey: ['/api/channels', selectedChannel, 'messages'],
    enabled: !!selectedChannel,
  });

  // Update messages when channel changes
  useEffect(() => {
    if (selectedChannel && channelMessages) {
      setMessages(channelMessages);
    }
  }, [selectedChannel, channelMessages]);

  // Auto-select first channel
  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0].name);
    }
  }, [channels, selectedChannel]);

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to WebSocket');
        setConnectionStatus(prev => ({ ...prev, connected: true }));
      };

      ws.onmessage = (event) => {
        if (isPaused) return;

        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'chat_message':
              const chatMsg = message.data as ChatMessageType;
              setMessages(prev => [...prev.slice(-999), chatMsg]); // Keep last 1000 messages
              setConnectionStatus(prev => ({ 
                ...prev, 
                messageCount: prev.messageCount + 1 
              }));
              break;
              
            case 'connection_status':
              setConnectionStatus(prev => ({ 
                ...prev, 
                ...message.data,
                messageCount: prev.messageCount 
              }));
              break;
              
            case 'channel_update':
              queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
              break;
              
            case 'error':
              toast({
                title: "Connection Error",
                description: message.data.message || "An error occurred",
                variant: "destructive",
              });
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from WebSocket');
        setConnectionStatus(prev => ({ ...prev, connected: false }));
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (wsRef.current?.readyState !== WebSocket.OPEN) {
            console.log('Attempting to reconnect...');
            // Trigger re-render to recreate connection
            window.location.reload();
          }
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus(prev => ({ ...prev, connected: false }));
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to chat server",
        variant: "destructive",
      });
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isPaused, toast, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!isPaused && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isPaused]);

  // Update uptime
  useEffect(() => {
    const interval = setInterval(() => {
      const uptime = Date.now() - startTime;
      const hours = Math.floor(uptime / (1000 * 60 * 60));
      const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
      
      setConnectionStatus(prev => ({
        ...prev,
        uptime: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Calculate statistics
  useEffect(() => {
    const uniqueUsers = new Set(messages.map(m => m.username)).size;
    const avgLength = messages.length > 0 
      ? Math.round(messages.reduce((sum, m) => sum + m.message.length, 0) / messages.length)
      : 0;
    
    // Calculate messages per minute (last 60 seconds)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentMessages = messages.filter(m => new Date(m.timestamp) > oneMinuteAgo);
    
    setStatistics({
      messagesPerMinute: recentMessages.length,
      uniqueUsers,
      avgMessageLength: avgLength,
      peakActivity: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    });
  }, [messages]);

  // Mutations
  const addChannelMutation = useMutation({
    mutationFn: async (channelName: string) => {
      const response = await apiRequest('POST', '/api/channels', { name: channelName });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
      toast({
        title: "Channel Added",
        description: "Successfully joined the channel",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add channel",
        variant: "destructive",
      });
    },
  });

  const removeChannelMutation = useMutation({
    mutationFn: async (channelName: string) => {
      const response = await apiRequest('DELETE', `/api/channels/${channelName}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
      toast({
        title: "Channel Removed",
        description: "Successfully left the channel",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove channel",
        variant: "destructive",
      });
    },
  });

  const updateFiltersMutation = useMutation({
    mutationFn: async (newFilters: Partial<ChatFiltersType>) => {
      const response = await apiRequest('PUT', '/api/filters', newFilters);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/filters'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update filters",
        variant: "destructive",
      });
    },
  });

  const clearMessagesMutation = useMutation({
    mutationFn: async () => {
      if (!selectedChannel) return;
      const response = await apiRequest('DELETE', `/api/channels/${selectedChannel}/messages`);
      return response.json();
    },
    onSuccess: () => {
      setMessages([]);
      toast({
        title: "Chat Cleared",
        description: "All messages have been cleared",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear chat",
        variant: "destructive",
      });
    },
  });

  const handleExport = () => {
    if (messages.length === 0) {
      toast({
        title: "No Messages",
        description: "There are no messages to export",
        variant: "destructive",
      });
      return;
    }

    const exportData = messages.map(msg => ({
      timestamp: new Date(msg.timestamp).toISOString(),
      channel: msg.channelName,
      username: msg.displayName,
      message: msg.message
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twitch-chat-${selectedChannel}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Chat messages have been exported to JSON",
    });
  };

  // Filter messages based on current filters
  const filteredMessages = messages.filter(msg => {
    if (filters?.filterBots && (msg.username.toLowerCase().includes('bot') || msg.username.toLowerCase().includes('streamlabs'))) {
      return false;
    }
    
    if (filters?.keywords && filters.keywords.trim()) {
      const keywords = filters.keywords.toLowerCase().split(',').map(k => k.trim());
      return keywords.some(keyword => 
        msg.message.toLowerCase().includes(keyword) || 
        msg.displayName.toLowerCase().includes(keyword)
      );
    }
    
    return true;
  });

  if (channelsLoading || filtersLoading) {
    return (
      <div className="min-h-screen twitch-bg flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen twitch-bg text-gray-100 flex overflow-hidden">
      {/* Sidebar Controls */}
      <div className="w-80 twitch-surface border-r twitch-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b twitch-border">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <i className="fab fa-twitch text-purple-500"></i>
            Chat Monitor
          </h1>
          <p className="text-sm text-gray-400 mt-1">Real-time Twitch chat monitoring</p>
        </div>

        {/* Connection Status */}
        <ConnectionStatus 
          isConnected={connectionStatus.connected}
          channelCount={connectionStatus.channelCount}
          messageCount={connectionStatus.messageCount}
          uptime={connectionStatus.uptime}
        />

        {/* Channel Management */}
        <ChannelManager
          channels={channels}
          onAddChannel={(name) => addChannelMutation.mutate(name)}
          onRemoveChannel={(name) => removeChannelMutation.mutate(name)}
          selectedChannel={selectedChannel}
          onSelectChannel={setSelectedChannel}
        />

        {/* Chat Filters */}
        {filters && (
          <ChatFilters
            filters={filters}
            onUpdateFilters={(newFilters) => updateFiltersMutation.mutate(newFilters)}
          />
        )}

        {/* Statistics */}
        <ChatStatistics statistics={statistics} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="twitch-surface border-b twitch-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">Live Chat</h2>
            {selectedChannel && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <i className="fas fa-eye"></i>
                <span>{selectedChannel}</span>
                <span>•</span>
                <span>{filteredMessages.length} messages</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPaused(!isPaused)}
              className="border-gray-600 hover:border-gray-400"
            >
              {isPaused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => clearMessagesMutation.mutate()}
              disabled={clearMessagesMutation.isPending}
              className="border-gray-600 hover:border-gray-400"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              className="border-gray-600 hover:border-gray-400"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {!selectedChannel ? (
            <div className="text-center py-8 text-gray-500">
              Select a channel to view chat messages
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No messages yet. Waiting for chat activity...
            </div>
          ) : (
            filteredMessages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                showTimestamps={filters?.showTimestamps || false}
                highlightMentions={filters?.highlightMentions || false}
              />
            ))
          )}
          
          {/* Auto-scroll indicator */}
          {selectedChannel && !isPaused && (
            <div className="text-center py-2">
              <div className="inline-flex items-center gap-2 text-xs text-gray-500">
                <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse"></div>
                <span>Listening for new messages...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
