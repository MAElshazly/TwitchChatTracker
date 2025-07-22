import type { ChatStatistics } from "@shared/schema";

interface ChatStatisticsProps {
  statistics: ChatStatistics;
}

export function ChatStatistics({ statistics }: ChatStatisticsProps) {
  return (
    <div className="p-4 flex-1">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Statistics</h3>
      <div className="space-y-3 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">Messages/min:</span>
          <span className="text-white font-medium">{statistics.messagesPerMinute}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Unique users:</span>
          <span className="text-white font-medium">{statistics.uniqueUsers}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Avg. msg length:</span>
          <span className="text-white font-medium">{statistics.avgMessageLength} chars</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Peak activity:</span>
          <span className="text-white font-medium">{statistics.peakActivity}</span>
        </div>
      </div>
    </div>
  );
}
