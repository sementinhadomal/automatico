'use client';

import React from 'react';
import { Account, CategoryType } from '@/types';
import { BarChart3, PieChart, TrendingUp, Globe2, Layers, CheckCircle2 } from 'lucide-react';

interface ReportsViewProps {
  accounts: Account[];
  selectedCategory: CategoryType | 'ALL';
}

export const ReportsView: React.FC<ReportsViewProps> = ({ accounts, selectedCategory }) => {
  const filteredAccounts = accounts.filter(
    (a) => selectedCategory === 'ALL' || a.category === selectedCategory
  );

  const countries = Array.from(new Set(filteredAccounts.map((a) => a.country)));

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-500" />
          Relatórios & Desempenho Operacional
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Relatórios de publicação por conta, país, idioma, categoria, taxa de sucesso de envio e latência média.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Country Breakdown */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <Globe2 className="w-4 h-4 text-indigo-500" />
            Distribuição por País
          </h3>

          <div className="space-y-3 font-mono text-xs">
            {countries.map((c) => {
              const count = filteredAccounts.filter((a) => a.country === c).length;
              const pct = Math.round((count / filteredAccounts.length) * 100);

              return (
                <div key={c} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">{c}</span>
                    <span className="font-bold text-indigo-400">{count} contas ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[var(--bg-primary)] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <Layers className="w-4 h-4 text-purple-500" />
            Proporção de Conteúdo (HOT vs DROP)
          </h3>

          <div className="space-y-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex justify-between items-center">
              <div>
                <span className="font-bold text-rose-500 block text-sm">HOT Operational Tier</span>
                <span className="text-[var(--text-muted)] text-[10px]">10 Contas Ativas</span>
              </div>
              <span className="text-xl font-black text-rose-500">50%</span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
              <div>
                <span className="font-bold text-emerald-500 block text-sm">DROPSHIPPING Tier</span>
                <span className="text-[var(--text-muted)] text-[10px]">10 Contas Ativas</span>
              </div>
              <span className="text-xl font-black text-emerald-500">50%</span>
            </div>
          </div>
        </div>

        {/* Metrics Summary */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Métricas Globais de Conexão
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex justify-between">
              <span className="text-[var(--text-muted)]">Taxa de Sucesso dos Envios</span>
              <span className="font-bold text-emerald-500 font-mono">99.2%</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex justify-between">
              <span className="text-[var(--text-muted)]">Tempo Médio de Resposta Proxy</span>
              <span className="font-bold text-indigo-400 font-mono">72ms</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex justify-between">
              <span className="text-[var(--text-muted)]">Tempo Médio Renderização FFmpeg</span>
              <span className="font-bold text-purple-400 font-mono">610ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
