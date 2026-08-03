'use client';

import React from 'react';
import { ExecutionLog } from '@/types';
import { History, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface ExecutionHistoryViewProps {
  executionLogs: ExecutionLog[];
}

export const ExecutionHistoryView: React.FC<ExecutionHistoryViewProps> = ({ executionLogs }) => {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" />
          Histórico Completo de Execuções de Publicação
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Registro detalhado de payloads, hashtags, cópias, status HTTP e logs de resposta dos proxies.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] font-semibold">
              <th className="pb-3">Data / Hora</th>
              <th className="pb-3">Conta / Categoria</th>
              <th className="pb-3">Plataforma / Idioma</th>
              <th className="pb-3">Mídia Utilizada</th>
              <th className="pb-3">Tempo / Status</th>
              <th className="pb-3 text-right">Log de Execução</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)] font-mono">
            {executionLogs.map((log) => (
              <tr key={log.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                <td className="py-3 text-[var(--text-secondary)]">{log.timestamp}</td>
                <td className="py-3">
                  <div className="font-bold text-[var(--text-primary)]">{log.accountName}</div>
                  <div className="text-[10px] text-purple-400 font-semibold">{log.category}</div>
                </td>
                <td className="py-3">
                  <span className="font-bold text-indigo-400">{log.platform.toUpperCase()}</span>
                  <span className="text-[10px] text-[var(--text-muted)] block">{log.languageCode}</span>
                </td>
                <td className="py-3 text-[var(--text-secondary)] font-sans">{log.mediaTitle}</td>
                <td className="py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3" /> 200 OK ({log.executionTimeMs}ms)
                  </span>
                </td>
                <td className="py-3 text-right text-[11px] text-[var(--text-muted)] truncate max-w-[200px]">
                  {log.logDetail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
