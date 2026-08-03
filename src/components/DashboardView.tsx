'use client';

import React from 'react';
import { Account, CategoryType, MediaAsset, QueueJob, ExecutionLog } from '@/types';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Clock,
  Flame,
  ShoppingBag,
  TrendingUp,
  Server,
  HardDrive,
  Cpu,
  RefreshCw,
  Send,
  Zap,
  ShieldCheck,
  Globe2,
} from 'lucide-react';

interface DashboardViewProps {
  accounts: Account[];
  mediaAssets: MediaAsset[];
  queueJobs: QueueJob[];
  executionLogs: ExecutionLog[];
  selectedCategory: CategoryType | 'ALL';
  onNavigateToTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  mediaAssets,
  queueJobs,
  executionLogs,
  selectedCategory,
  onNavigateToTab,
}) => {
  const filteredAccounts =
    selectedCategory === 'ALL' ? accounts : accounts.filter((a) => a.category === selectedCategory);

  const onlineAccounts = filteredAccounts.filter((a) => a.status === 'ONLINE').length;
  const offlineAccounts = filteredAccounts.filter((a) => a.status === 'OFFLINE' || a.status === 'ERROR').length;

  const hotAccountsCount = accounts.filter((a) => a.category === 'HOT').length;
  const dropAccountsCount = accounts.filter((a) => a.category === 'DROP').length;

  const totalPublished = filteredAccounts.reduce((acc, curr) => acc + curr.publishedCount, 0);
  const totalErrors = filteredAccounts.reduce((acc, curr) => acc + curr.errorCount, 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900/40 border border-purple-500/20 glass-panel">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
             Painel de Controle Operacional
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-400 font-mono border border-purple-500/30">
              {selectedCategory === 'ALL' ? 'HOT & DROPSHIPPING' : selectedCategory}
            </span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Gerenciamento automatizado de mídias, edição Sharp/FFmpeg, localização por país/idioma e fila BullMQ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToTab('auto_publisher')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
          >
            <Send className="w-4 h-4" />
            Publicar Agora
          </button>
          <button
            onClick={() => onNavigateToTab('sharp_editor')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] font-semibold text-xs transition-all"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            Gerar Variações
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Total Accounts */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-medium">Contas Gerenciadas</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)] font-mono">{filteredAccounts.length}</div>
          <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{hotAccountsCount} HOT</span>
            <span>{dropAccountsCount} DROP</span>
          </div>
        </div>

        {/* Online Status */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-medium">Contas Online</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-500 font-mono">{onlineAccounts}</div>
          <div className="text-[10px] text-[var(--text-muted)] font-mono">100% Proxies Ativos</div>
        </div>

        {/* Offline / Errors */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-medium">Erros / Inativos</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-500 font-mono">{offlineAccounts}</div>
          <div className="text-[10px] text-[var(--text-muted)] font-mono">{totalErrors} falhas no mês</div>
        </div>

        {/* Total Published */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-medium">Publicações Mês</span>
            <FileCheck2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-500 font-mono">{totalPublished}</div>
          <div className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +14.2% esta semana
          </div>
        </div>

        {/* Pending Queue */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-medium">Fila Agendada</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500 font-mono">{queueJobs.length}</div>
          <div className="text-[10px] text-[var(--text-muted)] font-mono">Próximo post em 15m</div>
        </div>

        {/* Available Media Assets */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-medium">Biblioteca de Mídias</span>
            <HardDrive className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-500 font-mono">{mediaAssets.length}</div>
          <div className="text-[10px] text-[var(--text-muted)] font-mono">23 variações geradas</div>
        </div>
      </div>

      {/* Middle Section: Server Telemetry & Account Regional Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Server & Cluster Health Telemetry */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-500" />
              Telemetria do Servidor & Docker
            </h3>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>

          <div className="space-y-3">
            {/* CPU */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-500" /> Processador (Cluster)
                </span>
                <span className="font-mono text-purple-400 font-bold">14.2%</span>
              </div>
              <div className="w-full bg-[var(--bg-primary)] h-2 rounded-full overflow-hidden border border-[var(--border-color)]">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full w-[14%]"></div>
              </div>
            </div>

            {/* RAM */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-blue-500" /> Memória RAM (Redis + Node)
                </span>
                <span className="font-mono text-blue-400 font-bold">3.2 GB / 16 GB (20%)</span>
              </div>
              <div className="w-full bg-[var(--bg-primary)] h-2 rounded-full overflow-hidden border border-[var(--border-color)]">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full w-[20%]"></div>
              </div>
            </div>

            {/* Storage S3 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-emerald-500" /> Armazenamento S3 Compatible
                </span>
                <span className="font-mono text-emerald-400 font-bold">24.2 GB / 500 GB</span>
              </div>
              <div className="w-full bg-[var(--bg-primary)] h-2 rounded-full overflow-hidden border border-[var(--border-color)]">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full w-[5%]"></div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border-color)] grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-center">
              <span className="text-[var(--text-muted)] block text-[10px]">Redis BullMQ Status</span>
              <span className="text-emerald-500 font-bold">ACTIVE (5 Workers)</span>
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-center">
              <span className="text-[var(--text-muted)] block text-[10px]">Sharp & FFmpeg</span>
              <span className="text-indigo-500 font-bold">READY (GPU Acceleration)</span>
            </div>
          </div>
        </div>

        {/* Regional & Accounts Status Table Preview */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-purple-500" />
              Contas Multirregiões (Brasil, EUA, Europa, Canadá)
            </h3>
            <button
              onClick={() => onNavigateToTab('accounts')}
              className="text-xs font-semibold text-purple-500 hover:underline"
            >
              Ver todas as 20 contas &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] font-semibold">
                  <th className="pb-2">Conta / Categoria</th>
                  <th className="pb-2">País / Fuso Horário</th>
                  <th className="pb-2">Proxy / Latência</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Posts Realizados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredAccounts.slice(0, 5).map((acc) => (
                  <tr key={acc.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="py-2.5">
                      <div className="font-semibold text-[var(--text-primary)]">{acc.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">{acc.username}</div>
                    </td>
                    <td className="py-2.5">
                      <div className="font-medium text-[var(--text-secondary)]">{acc.country}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">{acc.timezone}</div>
                    </td>
                    <td className="py-2.5 font-mono text-[11px]">
                      <span className="text-[var(--text-secondary)]">{acc.proxy.ip}</span>
                      <span className="ml-2 text-emerald-500 font-bold">{acc.proxy.latencyMs}ms</span>
                    </td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {acc.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-[var(--text-primary)]">
                      {acc.publishedCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Execution Logs */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-500" />
            Últimas Execuções de Publicação Automatizada
          </h3>
          <button
            onClick={() => onNavigateToTab('history')}
            className="text-xs font-semibold text-purple-500 hover:underline"
          >
            Ver histórico completo &rarr;
          </button>
        </div>

        <div className="space-y-2">
          {executionLogs.slice(0, 4).map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {log.accountName} ({log.platform.toUpperCase()})
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono">{log.logDetail}</div>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-emerald-500 font-bold">{log.executionTimeMs}ms</span>
                <span className="text-[10px] text-[var(--text-muted)] block">{log.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
