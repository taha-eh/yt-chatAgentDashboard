'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthenticator } from '@aws-amplify/ui-react';
import DashboardLayout from '@/components/DashboardLayout';
import MessageBubble from '@/components/MessageBubble';
import ExportButton from '@/components/ExportButton';
import {
  getUserProfile,
  getConversation,
  getMessagesByConversation,
  getToolCallsByMessage,
  formatRelativeTime,
  type Conversation,
  type Message,
  type ToolCall,
} from '@/lib/queries';

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthenticator((context) => [context.user]);
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [toolCalls, setToolCalls] = useState<Record<string, ToolCall[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const conversationId = params.id as string;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch conversation
      const conv = await getConversation(conversationId);
      if (!conv) {
        setError('Conversation not found');
        setLoading(false);
        return;
      }

      // Verify the user has access (check orgId matches)
      if (user?.userId) {
        const profile = await getUserProfile(user.userId);
        if (profile && conv.orgId !== profile.orgId) {
          setError('You do not have access to this conversation');
          setLoading(false);
          return;
        }
      }

      setConversation(conv);

      // Fetch messages
      const { messages: msgData } = await getMessagesByConversation(conversationId);
      setMessages(msgData);

      // Fetch tool calls for each assistant message
      const toolCallsMap: Record<string, ToolCall[]> = {};
      for (const msg of msgData) {
        if (msg.role === 'assistant' && msg.toolUsed) {
          const calls = await getToolCallsByMessage(msg.id);
          if (calls.length > 0) {
            toolCallsMap[msg.id] = calls;
          }
        }
      }
      setToolCalls(toolCallsMap);
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [conversationId, user?.userId]);

  useEffect(() => {
    if (conversationId) {
      fetchData();
    }
  }, [conversationId, fetchData]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-8 h-8 skeleton rounded"></div>
            <div className="space-y-2">
              <div className="w-48 h-6 skeleton rounded"></div>
              <div className="w-32 h-4 skeleton rounded"></div>
            </div>
          </div>

          {/* Messages skeleton */}
          <div className="card p-6 space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className="flex items-end gap-2">
                  {i % 2 !== 0 && <div className="w-8 h-8 skeleton rounded-full"></div>}
                  <div className={`${i % 2 === 0 ? 'w-64' : 'w-80'} h-16 skeleton rounded-2xl`}></div>
                  {i % 2 === 0 && <div className="w-8 h-8 skeleton rounded-full"></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-surface-900 mb-1">{error}</h3>
          <p className="text-surface-500 mb-4">Please check the URL and try again.</p>
          <button onClick={() => router.push('/conversations')} className="btn-primary">
            Back to Conversations
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!conversation) {
    return null;
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/conversations')}
            className="p-2 rounded-lg hover:bg-surface-100 transition-colors"
          >
            <svg className="w-5 h-5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-surface-900">
                Session {conversation.sessionId.substring(0, 12)}...
              </h1>
              <span className={`badge ${conversation.status === 'ok' ? 'badge-success' : 'badge-error'}`}>
                {conversation.status === 'ok' ? 'OK' : 'Error'}
              </span>
              {conversation.escalationCount > 0 && (
                <span className="badge badge-warning">
                  {conversation.escalationCount} escalation{conversation.escalationCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-sm text-surface-500 mt-0.5">
              {conversation.messageCount} messages · Started {formatRelativeTime(conversation.createdAt)}
            </p>
          </div>
        </div>
        <ExportButton
          conversation={conversation}
          messages={messages}
          toolCalls={toolCalls}
        />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Messages</p>
          <p className="text-2xl font-semibold text-surface-900 mt-1">{messages.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Tools Used</p>
          <p className="text-2xl font-semibold text-surface-900 mt-1">
            {Object.values(toolCalls).flat().length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Duration</p>
          <p className="text-2xl font-semibold text-surface-900 mt-1">
            {messages.length >= 2
              ? formatDuration(
                  new Date(messages[messages.length - 1].createdAt).getTime() -
                    new Date(messages[0].createdAt).getTime()
                )
              : '-'}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Avg Latency</p>
          <p className="text-2xl font-semibold text-surface-900 mt-1">
            {calculateAvgLatency(messages)}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="card">
        <div className="px-6 py-4 border-b border-surface-200">
          <h2 className="font-semibold text-surface-900">Conversation Transcript</h2>
        </div>
        <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto bg-surface-50">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-surface-500">No messages in this conversation</p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                toolCalls={toolCalls[message.id]}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function formatDuration(ms: number): string {
  if (ms < 60000) {
    return `${Math.round(ms / 1000)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function calculateAvgLatency(messages: Message[]): string {
  const latencies = messages
    .filter((m) => m.role === 'assistant' && m.latencyMs)
    .map((m) => m.latencyMs!);
  
  if (latencies.length === 0) return '-';
  
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  return avg < 1000 ? `${Math.round(avg)}ms` : `${(avg / 1000).toFixed(1)}s`;
}

