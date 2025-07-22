import type { ChatMessage } from "@shared/schema";

interface ChatMessageProps {
  message: ChatMessage;
  showTimestamps: boolean;
  highlightMentions: boolean;
}

export function ChatMessage({ message, showTimestamps, highlightMentions }: ChatMessageProps) {
  const getAvatarColor = (username: string) => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-green-500 to-blue-500',
      'from-yellow-500 to-orange-500',
      'from-blue-500 to-cyan-500',
      'from-red-500 to-pink-500',
      'from-indigo-500 to-purple-500',
    ];
    const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getUsernameColor = (username: string) => {
    const colors = [
      'text-purple-400',
      'text-green-400',
      'text-yellow-400',
      'text-blue-400',
      'text-red-400',
      'text-pink-400',
    ];
    const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getInitials = (displayName: string) => {
    return displayName.substring(0, 2).toUpperCase();
  };

  const isHighlighted = highlightMentions && (message.isHighlighted || message.message.includes('@'));
  const isSpecialMessage = message.isSubscriber || message.badges.includes('subscriber') || message.badges.includes('moderator');

  let borderClass = '';
  let backgroundClass = '';

  if (isHighlighted) {
    borderClass = 'border-l-4 border-yellow-500';
    backgroundClass = 'bg-yellow-500 bg-opacity-10';
  } else if (message.isSubscriber || message.badges.includes('subscriber')) {
    borderClass = 'border-l-4 border-purple-500';
    backgroundClass = 'bg-purple-500 bg-opacity-10';
  } else if (message.badges.includes('moderator')) {
    borderClass = 'border-l-4 border-green-500';
    backgroundClass = 'bg-green-500 bg-opacity-10';
  }

  return (
    <div className={`group hover:bg-gray-800 hover:bg-opacity-50 rounded-lg p-2 transition-colors animate-slide-in ${borderClass} ${backgroundClass}`}>
      <div className="flex items-start gap-3">
        {/* User Avatar */}
        <div className={`w-8 h-8 bg-gradient-to-br ${getAvatarColor(message.username)} rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
          {message.badges.includes('subscriber') ? (
            <i className="fas fa-star" />
          ) : message.badges.includes('moderator') ? (
            <i className="fas fa-shield" />
          ) : (
            getInitials(message.displayName)
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`font-semibold text-sm ${getUsernameColor(message.username)}`}>
              {message.displayName}
            </span>
            
            {/* Badges */}
            {message.isSubscriber && (
              <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded font-medium">
                SUB
              </span>
            )}
            {message.badges.includes('moderator') && (
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded font-medium">
                MOD
              </span>
            )}
            
            {showTimestamps && (
              <span className="text-xs text-gray-500">
                {formatTimestamp(message.timestamp)}
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-200 break-words leading-relaxed">
            {message.message}
          </p>
        </div>
      </div>
    </div>
  );
}
