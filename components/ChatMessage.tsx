
import React from 'react';
import { Message } from '../types';
import { UserCircleIcon, SparklesIcon } from './icons'; 
import { parseBoldMarkdown } from '../utils/textUtils'; 

interface ChatMessageProps {
  message: Message;
}

const ChatMessageInner: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const aiTextColor = 'text-gray-100'; 
  const userTextColor = 'text-white'; 
  const aiTimestampColor = 'text-gray-400'; 
  const userTimestampColor = 'text-purple-200'; 

  const formatTimestamp = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const messageContent = message.text || message.text_content || '';

  return (
    <div className={`flex items-start mb-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && <SparklesIcon className={`w-8 h-8 text-purple-400 mr-3 flex-shrink-0 mt-1`} />}
      <div
        className={`max-w-[75%] p-3 rounded-lg shadow ${
          isUser 
            ? 'bg-purple-600 text-white rounded-br-none' 
            : `bg-gray-700 ${aiTextColor} rounded-bl-none` 
        }`}
      >
        <div className="text-sm whitespace-pre-wrap break-words">
          {isUser ? messageContent : parseBoldMarkdown(messageContent)}
          {message.isStreaming && <span className="animate-pulse">...</span>}
        </div>
        <p className={`text-xs mt-1 ${isUser ? `${userTimestampColor} text-right` : aiTimestampColor}`}>
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
      {isUser && <UserCircleIcon className={`w-8 h-8 text-gray-400 ml-3 flex-shrink-0 mt-1`} />}
    </div>
  );
};

const ChatMessage = React.memo(ChatMessageInner);
export default ChatMessage;