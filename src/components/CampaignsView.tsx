'use client';

import React, { useState } from 'react';
import { Campaign, Account, CategoryType, MediaAsset, QueueJob } from '@/types';
import { INITIAL_CAMPAIGNS } from '@/lib/mockData';
import { BatchAutoSchedulerEngine, BatchScheduleResult } from '@/lib/scheduling/auto-scheduler';
import { IndividualAutoSchedulerEngine } from '@/lib/scheduling/individual-auto-scheduler';
import {
  CalendarDays,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame,
  ShoppingBag,
  Layers,
  Bot,
  User,
  Settings2,
  ListOrdered,
  Shuffle,
  Send,
  Plus,
  Globe2,
  Zap,
} from 'lucide-react';

interface CampaignsViewProps {
  accounts: Account[];
  mediaAssets: MediaAsset[];
  selectedCategory: CategoryType | 'ALL';
  onScheduleGenerated?: (jobs: QueueJob[]) => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  accounts,
  mediaAssets,
  selectedCategory,
  onScheduleGenerated,
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [viewMode, setViewMode] = useState<'auto_50days' | 'campaigns' | 'calendar'>('auto_50days');

  // Auto-Scheduler Parameters
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [postsPerDay, setPostsPerDay] = useState<number>(3);
  const [daysCount, setDaysCount] = useState<number>(50);
  const [useTimeVariance, setUseTimeVariance] = useState<boolean>(true);
  const [timeSlots, setTimeSlots] = useState<string>('09:00, 15:00, 21:00');

  // Platform Selection
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'tiktok']);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const platformOptions = [
    { id: 'instagram', label: 'Instagram Reels', icon: '📸', color: 'from-pink-600 to-purple-600', border: 'border-pink-500/40', bg: 'bg-pink-500/10', text: 'text-pink-400' },
    { id: 'tiktok', label: 'TikTok Vídeo', icon: '🎵', color: 'from-slate-900 to-slate-800', border: 'border-slate-400/40', bg: 'bg-slate-700/20', text: 'text-slate-300' },
    { id: 'youtube_shorts', label: 'YouTube Shorts', icon: '▶️', color: 'from-red-700 to-red-600', border: 'border-red-500/40', bg: 'bg-red-500/10', text: 'text-red-400' },
  ];
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [scheduleResult, setScheduleResult] = useState<BatchScheduleResult | null>(null);
  const [individualScheduleResults, setIndividualScheduleResults] = useState<QueueJob[] | null>(null);

  const filteredCampaigns = campaigns.filter(
    (c) => selectedCategory === 'ALL' || c.category === selectedCategory
  );

  const filteredAccounts = accounts.filter(
    (a) => selectedCategory === 'ALL' || a.category === selectedCategory
  );

  const handleRunIndividualSchedule = () => {
    if (selectedAccountId === 'ALL') {
      const result = BatchAutoSchedulerEngine.generateBatchSchedule(mediaAssets, filteredAccounts, {
        daysCount,
        postsPerDay,
        targetAccountIds: [],
        scheduleTimes: ['09:00', '15:00', '21:00'],
        category: selectedCategory,
      });
      setScheduleResult(result);
      setIndividualScheduleResults(null);
    } else {
      const targetAcc = accounts.find((a) => a.id === selectedAccountId);
      if (!targetAcc) return;

      const jobs = IndividualAutoSchedulerEngine.generateIndividual50DaysSchedule(targetAcc, mediaAssets, {
        accountId: targetAcc.id,
        postsPerDay,
        daysCount,
      });
      setIndividualScheduleResults(jobs);
      setScheduleResult(null);
    }
  };

  const handleRun50DaysAutoSchedule = () => {
    setIsGenerating(true);

    setTimeout(() => {
      const timesArray = timeSlots.split(',').map((t) => t.trim());
      const res = BatchAutoSchedulerEngine.generateBatchSchedule(mediaAssets, accounts, {
        daysCount,
        postsPerDay,
        targetAccountIds: filteredAccounts.map((a) => a.id),
        scheduleTimes: timesArray,
        category: selectedCategory,
        randomizeTimeVarianceMinutes: useTimeVariance ? 8 : 0,
        platforms: selectedPlatforms,
      });

      setScheduleResult(res);
      setIsGenerating(false);

      if (onScheduleGenerated) {
        onScheduleGenerated(res.jobs);
      }
    }, 500);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-purple-500" />
            Agendamento Automático em Lote & Campanhas
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Programe 50 dias de posts automáticos para 150 mídias de forma totalmente autônoma e otimizada por fuso horário.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)]">
          <button
            onClick={() => setViewMode('auto_50days')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'auto_50days'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Motor 50 Dias Auto
          </button>

          <button
            onClick={() => setViewMode('campaigns')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'campaigns'
                ? 'bg-purple-600 text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Campanhas
          </button>

          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'calendar'
                ? 'bg-purple-600 text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Agenda
          </button>
        </div>
      </div>

      {/* 50-Days Auto Scheduler Engine View */}
      {viewMode === 'auto_50days' && (
        <div className="space-y-6">
          {/* Setup Panel */}
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Gerador Automático de {daysCount} Dias de Publicações ({daysCount * postsPerDay} Posts por Conta)
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Distribuição automática das mídias editadas nos horários de pico de cada país com rotação de copys e hashtags.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {daysCount} Dias &bull; {postsPerDay} Posts/Dia &bull; {filteredAccounts.length} Contas
              </span>
            </div>

            {/* Platform Selector */}
            <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-3">
              <div className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-bold text-[var(--text-secondary)]">Plataformas de Publicação (selecione onde postar)</span>
                {selectedPlatforms.length === 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    ⚠️ Selecione pelo menos 1 plataforma
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {platformOptions.map((platform) => {
                  const isSelected = selectedPlatforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 text-xs font-bold transition-all hover:scale-105 ${
                        isSelected
                          ? `${platform.bg} ${platform.border} ${platform.text} shadow-md`
                          : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] opacity-50'
                      }`}
                    >
                      <span className="text-base">{platform.icon}</span>
                      <span>{platform.label}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedPlatforms.length > 0 && (
                <p className="text-[10px] text-[var(--text-muted)] font-mono">
                  ✅ Cada post será publicado em: {selectedPlatforms.map((p) => platformOptions.find((o) => o.id === p)?.label).join(' + ')}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              {/* Horizon Days */}
              <div className="space-y-1">
                <label className="font-semibold text-[var(--text-secondary)]">Duração da Automação (Dias)</label>
                <select
                  value={daysCount}
                  onChange={(e) => setDaysCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] font-mono text-xs font-bold text-[var(--text-primary)]"
                >
                  <option value={30}>30 Dias (1 Mês)</option>
                  <option value={50}>50 Dias (Padrão)</option>
                  <option value={60}>60 Dias (2 Meses)</option>
                  <option value={90}>90 Dias (3 Meses)</option>
                  <option value={120}>120 Dias (4 Meses)</option>
                </select>
              </div>

              {/* Posts per Day */}
              <div className="space-y-1">
                <label className="font-semibold text-[var(--text-secondary)]">Posts por Dia (por Conta)</label>
                <select
                  value={postsPerDay}
                  onChange={(e) => setPostsPerDay(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] font-mono text-xs font-bold text-[var(--text-primary)]"
                >
                  <option value={1}>1 Post / dia ({daysCount * 1} Posts total)</option>
                  <option value={2}>2 Posts / dia ({daysCount * 2} Posts total)</option>
                  <option value={3}>3 Posts / dia ({daysCount * 3} Posts total)</option>
                  <option value={4}>4 Posts / dia ({daysCount * 4} Posts total)</option>
                </select>
              </div>

              {/* Time Slots */}
              <div className="space-y-1">
                <label className="font-semibold text-[var(--text-secondary)]">Horários Locais Diários</label>
                <input
                  type="text"
                  value={timeSlots}
                  onChange={(e) => setTimeSlots(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] font-mono text-xs text-[var(--text-primary)]"
                />
              </div>

              {/* Individual vs Bulk Account Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Selecione a Conta para Agendar
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">🌐 Todas as {filteredAccounts.length} Contas (Em Lote)</option>
                {filteredAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.category === 'HOT' ? '🔥' : '🛍️'} {acc.name} — {acc.country} ({acc.username})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
                Posts por Dia para esta Conta
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={postsPerDay}
                onChange={(e) => setPostsPerDay(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                Duração da Automação (Dias)
              </label>
              <select
                value={daysCount}
                onChange={(e) => setDaysCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-bold focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value={30}>30 Dias (1 Mês)</option>
                <option value={50}>50 Dias (Padrão)</option>
                <option value={60}>60 Dias (2 Meses)</option>
                <option value={90}>90 Dias (3 Meses)</option>
                <option value={120}>120 Dias (4 Meses)</option>
              </select>
            </div>
          </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="variance"
                  checked={useTimeVariance}
                  onChange={(e) => setUseTimeVariance(e.target.checked)}
                  className="w-4 h-4 accent-purple-500 rounded"
                />
                <label htmlFor="variance" className="text-xs font-semibold text-[var(--text-secondary)] cursor-pointer">
                  Variação Orgânica (+/- 8 min)
                </label>
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRun50DaysAutoSchedule}
              disabled={isGenerating}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating
                ? 'Calculando e Enfileirando 50 Dias de Publicações...'
                : `🚀 Gerar Agendamento Automático de ${daysCount} Dias (${daysCount * postsPerDay * filteredAccounts.length} Posts Totais)`}
            </button>
          </div>

          {/* Schedule Result Overview */}
          {scheduleResult && (
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-5 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">
                    Agendamento de {scheduleResult.daysCovered} Dias Concluído com Sucesso!
                  </h3>
                </div>

                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  {scheduleResult.totalJobsGenerated} Posts Agendados no BullMQ
                </span>
              </div>

              {/* Schedule Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)] text-[10px] block">Período de Agendamento</span>
                  <span className="font-bold text-indigo-400">
                    {scheduleResult.startDate} até {scheduleResult.endDate}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)] text-[10px] block">Contas Cobertas</span>
                  <span className="font-bold text-purple-400">
                    {Object.keys(scheduleResult.jobsPerAccount).length} Contas ({postsPerDay * daysCount} posts/conta)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)] text-[10px] block">Automação de Rotação</span>
                  <span className="font-bold text-emerald-400">Copys, Hashtags e CTAs Aplicados &check;</span>
                </div>
              </div>

              {/* Scheduled Jobs Table Preview */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[var(--text-primary)]">
                  Amostra da Fila Agendada para os Próximos 50 Dias (Primeiros 8 posts):
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)]">
                        <th className="pb-2">Data / Hora Programada</th>
                        <th className="pb-2">Conta Alvo</th>
                        <th className="pb-2">Horário Local da Conta</th>
                        <th className="pb-2">Mídia Vinculada</th>
                        <th className="pb-2 text-right">Status na Fila</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {scheduleResult.jobs.slice(0, 8).map((job) => (
                        <tr key={job.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                          <td className="py-2.5 text-[var(--text-primary)] font-bold">{job.scheduledFor}</td>
                          <td className="py-2.5 text-indigo-400 font-bold">{job.accountName}</td>
                          <td className="py-2.5 text-purple-400">{job.accountLocalTime}</td>
                          <td className="py-2.5 text-[var(--text-secondary)] font-sans">{job.mediaTitle}</td>
                          <td className="py-2.5 text-right">
                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                              QUEUED (BullMQ)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Standard Campaigns List */}
      {viewMode === 'campaigns' && (
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
            </div>
          ))}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
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
