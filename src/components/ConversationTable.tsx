'use client';

import Link from 'next/link';
import { formatRelativeTime } from '@/lib/queries';
import type { Conversation } from '@/lib/queries';

interface ConversationTableProps {
  conversations: Conversation[];
  loading?: boolean;
}

export default function ConversationTable({ conversations, loading }: ConversationTableProps) {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                Session
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                Last Message
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                Messages
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                Escalations
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i}>
                <td className="py-4 px-4">
                  <div className="w-24 h-5 skeleton rounded"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="w-48 h-5 skeleton rounded"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="w-12 h-5 skeleton rounded"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="w-14 h-5 skeleton rounded"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="w-8 h-5 skeleton rounded"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="w-20 h-5 skeleton rounded"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-surface-900 mb-1">No conversations found</h3>
        <p className="text-surface-500">
          Try adjusting your filters or wait for new conversations to come in.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-200">
            <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
              Session
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
              Last Message
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
              Messages
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
              Status
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
              Escalations
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {conversations.map((conv) => (
            <tr key={conv.id} className="hover:bg-surface-50 transition-colors">
              <td className="py-4 px-4">
                <Link
                  href={`/conversations/${conv.id}`}
                  className="font-medium text-brand-600 hover:text-brand-700"
                >
                  {conv.sessionId.substring(0, 12)}...
                </Link>
              </td>
              <td className="py-4 px-4">
                <p className="text-surface-700 truncate max-w-xs">
                  {conv.lastUserMessagePreview || '-'}
                </p>
              </td>
              <td className="py-4 px-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-100 text-surface-700">
                  {conv.messageCount}
                </span>
              </td>
              <td className="py-4 px-4">
                <span className={`badge ${conv.status === 'ok' ? 'badge-success' : 'badge-error'}`}>
                  {conv.status === 'ok' ? 'OK' : 'Error'}
                </span>
              </td>
              <td className="py-4 px-4">
                {conv.escalationCount > 0 ? (
                  <span className="badge badge-warning">{conv.escalationCount}</span>
                ) : (
                  <span className="text-surface-400">-</span>
                )}
              </td>
              <td className="py-4 px-4 text-sm text-surface-500">
                {formatRelativeTime(conv.lastMessageAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

