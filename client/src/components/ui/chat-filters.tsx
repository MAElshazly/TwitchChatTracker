import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { Label } from "./label";
import type { ChatFilters } from "@shared/schema";

interface ChatFiltersProps {
  filters: ChatFilters;
  onUpdateFilters: (filters: Partial<ChatFilters>) => void;
}

export function ChatFilters({ filters, onUpdateFilters }: ChatFiltersProps) {
  return (
    <div className="p-4 border-b twitch-border">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Chat Filters</h3>
      
      {/* Filter Options */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="showTimestamps"
            checked={filters.showTimestamps}
            onCheckedChange={(checked) => 
              onUpdateFilters({ showTimestamps: !!checked })
            }
            className="border-gray-600 text-purple-500"
          />
          <Label htmlFor="showTimestamps" className="text-sm text-gray-300">
            Show timestamps
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="highlightMentions"
            checked={filters.highlightMentions}
            onCheckedChange={(checked) => 
              onUpdateFilters({ highlightMentions: !!checked })
            }
            className="border-gray-600 text-purple-500"
          />
          <Label htmlFor="highlightMentions" className="text-sm text-gray-300">
            Highlight mentions
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="filterBots"
            checked={filters.filterBots}
            onCheckedChange={(checked) => 
              onUpdateFilters({ filterBots: !!checked })
            }
            className="border-gray-600 text-purple-500"
          />
          <Label htmlFor="filterBots" className="text-sm text-gray-300">
            Filter bot messages
          </Label>
        </div>
      </div>

      {/* Keyword Filter */}
      <div>
        <Label htmlFor="keywords" className="text-xs text-gray-400 mb-1 block">
          Keyword Filter
        </Label>
        <Input
          id="keywords"
          type="text"
          placeholder="Enter keywords..."
          value={filters.keywords || ""}
          onChange={(e) => onUpdateFilters({ keywords: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
      </div>
    </div>
  );
}
