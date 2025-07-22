import { useEffect, useState } from "react";

interface ConnectionStatusProps {
  isConnected: boolean;
  channelCount: number;
  messageCount: number;
  uptime: string;
}

export function ConnectionStatus({ isConnected, channelCount, messageCount, uptime }: ConnectionStatusProps) {
  return (
    <div className="p-4 border-b twitch-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-300">Connection Status</span>
        <div className="flex items-center gap-2">
          <div 
            className={`w-2 h-2 rounded-full ${
              isConnected 
                ? 'bg-green-500 animate-pulse-slow' 
                : 'bg-red-500'
            }`}
          />
          <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      <div className="text-xs text-gray-400 space-y-1">
        <div className="flex justify-between">
          <span>Channels:</span>
          <span className="text-white font-medium">{channelCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Messages:</span>
          <span className="text-white font-medium">{messageCount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Uptime:</span>
          <span className="text-white font-medium">{uptime}</span>
        </div>
      </div>
    </div>
  );
}
