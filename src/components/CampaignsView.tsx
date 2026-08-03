'use client';

import React, { useState } from 'react';
import { Campaign, Account, CategoryType } from '@/types';
import { INITIAL_CAMPAIGNS } from '@/lib/mockData';
import {
  CalendarDays,
  Plus,
  Flame,
  ShoppingBag,
  Clock,
  Globe2,
  Users,
  CheckCircle2,
} from 'lucide-react';

interface CampaignsViewProps {
  accounts: Account[];
  selectedCategory: CategoryType | 'ALL';
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({ accounts, selectedCategory }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [viewMode, setViewMode] = useState<'campaigns' | 'calendar'>('campaigns');

  const filteredCampaigns = campaigns.filter(
    (c) => selectedCategory === 'ALL' || c.category === selectedCategory
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-purple-500" />
            Campanhas & Agendamento por Fuso Horário
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Programação de publicações automáticas com adequação ao horário local das contas (ex: 09:00 Nova York, 09:00 Lisboa, 09:00 São Paulo).
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)]">
          <button
            onClick={() => setViewMode('campaigns')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'campaigns'
                ? 'bg-purple-600 text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Lista de Campanhas
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'calendar'
                ? 'bg-purple-600 text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Agenda Geral
          </button>
        </div>
      </div>

      {viewMode === 'campaigns' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCampaigns.map((camp) => (
            <div key={camp.id} className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                  camp.category === 'HOT' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                }`}>
                  {camp.category}
                </span>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                  {camp.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">{camp.name}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{camp.objective}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px]">Período da Campanha</span>
                  <span className="font-mono text-[var(--text-primary)]">{camp.startDate} a {camp.endDate}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px]">Horários Programados (Locais)</span>
                  <span className="font-mono text-purple-400 font-bold">{camp.scheduleTimes.join(', ')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-color)]">
                <span>{camp.accountIds.length} Contas Associadas</span>
                <span className="font-mono text-indigo-400 font-bold">{camp.languageCode}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-[var(--text-primary)]">Calendário de Distribuição Semanal</h3>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono">
            {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((day) => (
              <div key={day} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] font-bold">
                {day}
                <div className="mt-2 text-[10px] font-normal text-purple-400 space-y-1">
                  <div className="p-1 rounded bg-purple-500/10 border border-purple-500/20">09:00 (NY)</div>
                  <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20">15:00 (SP)</div>
                  <div className="p-1 rounded bg-indigo-500/10 border border-indigo-500/20">21:00 (LIS)</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
