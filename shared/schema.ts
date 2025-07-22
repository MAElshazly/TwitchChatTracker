import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  viewerCount: integer("viewer_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  channelName: text("channel_name").notNull(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  isHighlighted: boolean("is_highlighted").default(false),
  isSubscriber: boolean("is_subscriber").default(false),
  isModerator: boolean("is_moderator").default(false),
  badges: text("badges").array().default([]),
  emotes: text("emotes").array().default([]),
});

export const chatFilters = pgTable("chat_filters", {
  id: serial("id").primaryKey(),
  showTimestamps: boolean("show_timestamps").default(true),
  highlightMentions: boolean("highlight_mentions").default(false),
  filterBots: boolean("filter_bots").default(false),
  keywords: text("keywords").default(""),
});

export const insertChannelSchema = createInsertSchema(channels).pick({
  name: true,
  isActive: true,
  viewerCount: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  channelName: true,
  username: true,
  displayName: true,
  message: true,
  isHighlighted: true,
  isSubscriber: true,
  isModerator: true,
  badges: true,
  emotes: true,
});

export const insertChatFiltersSchema = createInsertSchema(chatFilters).pick({
  showTimestamps: true,
  highlightMentions: true,
  filterBots: true,
  keywords: true,
});

export type Channel = typeof channels.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatFilters = typeof chatFilters.$inferSelect;
export type InsertChatFilters = z.infer<typeof insertChatFiltersSchema>;

// WebSocket message types
export type WSMessage = {
  type: 'chat_message' | 'channel_update' | 'connection_status' | 'error';
  data: any;
};

export type ConnectionStatus = {
  connected: boolean;
  channelCount: number;
  messageCount: number;
  uptime: string;
};

export type ChatStatistics = {
  messagesPerMinute: number;
  uniqueUsers: number;
  avgMessageLength: number;
  peakActivity: string;
};
