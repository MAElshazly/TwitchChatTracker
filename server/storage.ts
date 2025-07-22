import { 
  channels, 
  chatMessages, 
  chatFilters,
  type Channel, 
  type InsertChannel,
  type ChatMessage,
  type InsertChatMessage,
  type ChatFilters,
  type InsertChatFilters
} from "@shared/schema";

export interface IStorage {
  // Channel operations
  getChannels(): Promise<Channel[]>;
  getChannel(name: string): Promise<Channel | undefined>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  updateChannel(name: string, updates: Partial<InsertChannel>): Promise<Channel | undefined>;
  deleteChannel(name: string): Promise<boolean>;

  // Chat message operations
  getChatMessages(channelName: string, limit?: number): Promise<ChatMessage[]>;
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatMessages(channelName: string): Promise<boolean>;

  // Filter operations
  getChatFilters(): Promise<ChatFilters | undefined>;
  updateChatFilters(filters: Partial<InsertChatFilters>): Promise<ChatFilters>;
}

export class MemStorage implements IStorage {
  private channels: Map<string, Channel>;
  private chatMessages: Map<string, ChatMessage[]>;
  private chatFilters: ChatFilters;
  private currentChannelId: number;
  private currentMessageId: number;

  constructor() {
    this.channels = new Map();
    this.chatMessages = new Map();
    this.currentChannelId = 1;
    this.currentMessageId = 1;
    this.chatFilters = {
      id: 1,
      showTimestamps: true,
      highlightMentions: false,
      filterBots: false,
      keywords: "",
    };
  }

  async getChannels(): Promise<Channel[]> {
    return Array.from(this.channels.values());
  }

  async getChannel(name: string): Promise<Channel | undefined> {
    return this.channels.get(name.toLowerCase());
  }

  async createChannel(insertChannel: InsertChannel): Promise<Channel> {
    const channelName = insertChannel.name.toLowerCase();
    const channel: Channel = {
      ...insertChannel,
      id: this.currentChannelId++,
      name: channelName,
      createdAt: new Date(),
    };
    this.channels.set(channelName, channel);
    this.chatMessages.set(channelName, []);
    return channel;
  }

  async updateChannel(name: string, updates: Partial<InsertChannel>): Promise<Channel | undefined> {
    const channelName = name.toLowerCase();
    const channel = this.channels.get(channelName);
    if (!channel) return undefined;

    const updatedChannel = { ...channel, ...updates };
    this.channels.set(channelName, updatedChannel);
    return updatedChannel;
  }

  async deleteChannel(name: string): Promise<boolean> {
    const channelName = name.toLowerCase();
    const deleted = this.channels.delete(channelName);
    if (deleted) {
      this.chatMessages.delete(channelName);
    }
    return deleted;
  }

  async getChatMessages(channelName: string, limit = 100): Promise<ChatMessage[]> {
    const messages = this.chatMessages.get(channelName.toLowerCase()) || [];
    return messages.slice(-limit);
  }

  async addChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const message: ChatMessage = {
      ...insertMessage,
      id: this.currentMessageId++,
      timestamp: new Date(),
    };

    const channelName = insertMessage.channelName.toLowerCase();
    const messages = this.chatMessages.get(channelName) || [];
    messages.push(message);
    
    // Keep only last 1000 messages per channel
    if (messages.length > 1000) {
      messages.splice(0, messages.length - 1000);
    }
    
    this.chatMessages.set(channelName, messages);
    return message;
  }

  async clearChatMessages(channelName: string): Promise<boolean> {
    const channelKey = channelName.toLowerCase();
    if (this.chatMessages.has(channelKey)) {
      this.chatMessages.set(channelKey, []);
      return true;
    }
    return false;
  }

  async getChatFilters(): Promise<ChatFilters | undefined> {
    return this.chatFilters;
  }

  async updateChatFilters(filters: Partial<InsertChatFilters>): Promise<ChatFilters> {
    this.chatFilters = { ...this.chatFilters, ...filters };
    return this.chatFilters;
  }
}

export const storage = new MemStorage();
