'use client';

import { useState } from 'react';
import type { Conversation, Message, ToolCall } from '@/lib/queries';

interface ExportButtonProps {
  conversation: Conversation;
  messages: Message[];
  toolCalls: Record<string, ToolCall[]>;
}

export default function ExportButton({ conversation, messages, toolCalls }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const exportAsJSON = () => {
    const data = {
      conversation,
      messages,
      toolCalls,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `conversation-${conversation.sessionId.substring(0, 8)}.json`);
    setIsOpen(false);
  };

  const exportAsCSV = () => {
    const headers = ['Timestamp', 'Role', 'Message', 'Latency (ms)', 'Tools Used', 'Escalated'];
    const rows = messages.map((msg) => [
      msg.createdAt,
      msg.role,
      `"${msg.text.replace(/"/g, '""')}"`,
      msg.latencyMs || '',
      toolCalls[msg.id]?.map((t) => t.toolName).join('; ') || '',
      msg.escalated ? 'Yes' : 'No',
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadBlob(blob, `conversation-${conversation.sessionId.substring(0, 8)}.csv`);
    setIsOpen(false);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white border border-surface-200 shadow-lg z-20 overflow-hidden">
            <button
              onClick={exportAsJSON}
              className="w-full px-4 py-2.5 text-left text-sm text-surface-700 hover:bg-surface-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export as JSON
            </button>
            <button
              onClick={exportAsCSV}
              className="w-full px-4 py-2.5 text-left text-sm text-surface-700 hover:bg-surface-50 flex items-center gap-2 border-t border-surface-100"
            >
              <svg className="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Export as CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
}

