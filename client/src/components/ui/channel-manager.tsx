import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { X, Plus, Eye } from "lucide-react";
import type { Channel } from "@shared/schema";

interface ChannelManagerProps {
  channels: Channel[];
  onAddChannel: (channelName: string) => void;
  onRemoveChannel: (channelName: string) => void;
  selectedChannel?: string;
  onSelectChannel?: (channelName: string) => void;
}

export function ChannelManager({ 
  channels, 
  onAddChannel, 
  onRemoveChannel, 
  selectedChannel,
  onSelectChannel 
}: ChannelManagerProps) {
  const [newChannelName, setNewChannelName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChannelName.trim()) {
      onAddChannel(newChannelName.trim());
      setNewChannelName("");
    }
  };

  return (
    <div className="p-4 border-b twitch-border">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Channel Management</h3>
      
      {/* Add Channel Form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <Input 
            type="text" 
            placeholder="Enter channel name..."
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-800 border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
          <Button 
            type="submit"
            size="sm"
            className="px-3 py-2 twitch-primary hover:twitch-primary-hover rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Active Channels List */}
      <div className="space-y-2">
        {channels.map((channel) => (
          <div 
            key={channel.id}
            className={`flex items-center justify-between p-2 bg-gray-800 rounded-lg border transition-colors cursor-pointer ${
              selectedChannel === channel.name 
                ? 'border-purple-500' 
                : 'border-gray-600 hover:border-purple-500'
            }`}
            onClick={() => onSelectChannel?.(channel.name)}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm font-medium text-white">{channel.name}</span>
              {channel.viewerCount !== undefined && (
                <span className="text-xs text-gray-400">
                  ({channel.viewerCount > 1000 
                    ? `${(channel.viewerCount / 1000).toFixed(1)}k` 
                    : channel.viewerCount.toLocaleString()})
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveChannel(channel.name);
              }}
              className="text-gray-400 hover:text-red-400 transition-colors p-1 h-auto"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        
        {channels.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No channels added yet
          </div>
        )}
      </div>
    </div>
  );
}
