'use client';

import { useState } from 'react';
import { formatLatency } from '@/lib/queries';
import type { Message, ToolCall } from '@/lib/queries';

interface MessageBubbleProps {
  message: Message;
  toolCalls?: ToolCall[];
}

export default function MessageBubble({ message, toolCalls }: MessageBubbleProps) {
  const [showToolCalls, setShowToolCalls] = useState(false);
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-2 rounded-lg bg-surface-100 text-surface-600 text-sm">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} message-bubble`}>
      <div className={`max-w-[75%] ${isUser ? 'order-1' : 'order-2'}`}>
        {/* Message bubble */}
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-brand-600 text-white rounded-br-md'
              : 'bg-white border border-surface-200 text-surface-900 rounded-bl-md shadow-sm'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        </div>

        {/* Metadata row */}
        <div className={`flex items-center gap-2 mt-1.5 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-surface-400">
            {formatTime(message.createdAt)}
          </span>
          
          {!isUser && message.latencyMs && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-surface-100 text-surface-500">
              <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatLatency(message.latencyMs)}
            </span>
          )}

          {message.escalated && (
            <span className="badge badge-warning text-xs">
              Escalated
            </span>
          )}

          {message.toolUsed && toolCalls && toolCalls.length > 0 && (
            <button
              onClick={() => setShowToolCalls(!showToolCalls)}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
            >
              <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {toolCalls.length} tool{toolCalls.length !== 1 ? 's' : ''}
              <svg
                className={`w-3 h-3 ml-0.5 transition-transform ${showToolCalls ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Tool calls expandable section */}
        {showToolCalls && toolCalls && toolCalls.length > 0 && (
          <div className="mt-2 p-3 rounded-lg bg-surface-50 border border-surface-200 space-y-2">
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Tool Calls</p>
            {toolCalls.map((tool) => (
              <div
                key={tool.id}
                className="flex items-center justify-between p-2 rounded bg-white border border-surface-100"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${tool.status === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium text-surface-700">{tool.toolName}</span>
                </div>
                <span className="text-xs text-surface-500">
                  {tool.durationMs ? `${tool.durationMs}ms` : '-'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className={`flex-shrink-0 ${isUser ? 'order-2 ml-2' : 'order-1 mr-2'}`}>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-brand-100' : 'bg-purple-100'
          }`}
        >
          {isUser ? (
            <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

