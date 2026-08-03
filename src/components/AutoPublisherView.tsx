'use client';

import React, { useState } from 'react';
import { Account, MediaAsset, CategoryType } from '@/types';
import { LocalizationEngine } from '@/lib/localization/engine';
import { PlatformIntegrationRegistry } from '@/lib/integrations';
import {
  Send,
  CheckCircle2,
  Globe2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface AutoPublisherViewProps {
  accounts: Account[];
  mediaAssets: MediaAsset[];
  selectedCategory: CategoryType | 'ALL';
  onPublishSuccess: (log: any) => void;
}

export const AutoPublisherView: React.FC<AutoPublisherViewProps> = ({
  accounts,
  mediaAssets,
  selectedCategory,
  onPublishSuccess,
}) => {
  const availableAccounts = accounts.filter(
    (a) => selectedCategory === 'ALL' || a.category === selectedCategory
  );

  const [selectedAccount, setSelectedAccount] = useState<Account>(availableAccounts[0] || accounts[0]);
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset>(mediaAssets[0]);
  const [customCaption, setCustomCaption] = useState<string>('🔥 Conteúdo exclusivo liberado hoje!');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any | null>(null);

  const ctaText = LocalizationEngine.getCtaForLanguage(selectedAccount.languageCode);
  const hashtags = LocalizationEngine.rotateHashtags([]);

  const handlePublishNow = async () => {
    setIsPublishing(true);
    setPublishResult(null);

    const adapter = PlatformIntegrationRegistry.getAdapter('instagram');
    const authCheck = await adapter.validateAuth(selectedAccount);

    if (!authCheck.valid) {
      setPublishResult({
        success: false,
        error: authCheck.message,
      });
      setIsPublishing(false);
      return;
    }

    const res = await adapter.publishContent({
      accountId: selectedAccount.id,
      accountUsername: selectedAccount.username,
      proxy: selectedAccount.proxy,
      cookies: selectedAccount.cookies,
      mediaUrl: selectedMedia.url,
      mediaType: selectedMedia.type,
      caption: customCaption,
      hashtags,
      cta: ctaText,
      scheduledTime: new Date().toISOString(),
    });

    setPublishResult(res);
    setIsPublishing(false);

    if (res.success) {
      onPublishSuccess({
        id: `log_${Math.random().toString(36).substring(2, 8)}`,
        jobId: `job_${Math.random().toString(36).substring(2, 8)}`,
        accountId: selectedAccount.id,
        accountName: selectedAccount.name,
        category: selectedAccount.category,
        platform: adapter.platformId,
        languageCode: selectedAccount.languageCode,
        countryCode: selectedAccount.countryCode,
        mediaTitle: selectedMedia.title,
        copyUsed: customCaption,
        hashtagsUsed: hashtags,
        ctaUsed: ctaText,
        executionTimeMs: res.executionTimeMs,
        result: 'SUCCESS',
        statusCode: 200,
        logDetail: `[PublishEngine] Dispatch success over proxy ${selectedAccount.proxy.ip}. Post ID: ${res.postId}`,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Send className="w-5 h-5 text-indigo-500" />
          Motor de Montagem & Publicação Automatizada
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Fluxo sequencial inteligente: Selecionar Conta &rarr; Auto-Matching Local &rarr; Mídia Variada &rarr; Fila BullMQ.
        </p>
      </div>

      {/* Assembly Motor Workflow Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Controls */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Configuração do Disparo
          </h3>

          {/* 1. Select Account */}
          <div className="space-y-1 text-xs">
            <label className="font-semibold text-[var(--text-secondary)]">1. Selecionar Conta Alvo</label>
            <select
              value={selectedAccount.id}
              onChange={(e) => {
                const acc = accounts.find((a) => a.id === e.target.value);
                if (acc) setSelectedAccount(acc);
              }}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-bold focus:outline-none focus:border-indigo-500"
            >
              {availableAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.username}) - {acc.country} [{acc.category}]
                </option>
              ))}
            </select>
          </div>

          {/* Auto Matched Metadata */}
          <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[var(--text-muted)] text-[10px] block">Idioma Resolvido</span>
              <span className="font-bold text-indigo-400">{selectedAccount.languageCode}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] text-[10px] block">Fuso Horário Local</span>
              <span className="font-bold text-indigo-400">{selectedAccount.timezone}</span>
            </div>
          </div>

          {/* 2. Select Media */}
          <div className="space-y-1 text-xs">
            <label className="font-semibold text-[var(--text-secondary)]">2. Selecionar Variante de Mídia</label>
            <select
              value={selectedMedia.id}
              onChange={(e) => {
                const m = mediaAssets.find((item) => item.id === e.target.value);
                if (m) setSelectedMedia(m);
              }}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            >
              {mediaAssets.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.type} - {m.sizeMb}MB)
                </option>
              ))}
            </select>
          </div>

          {/* 3. Copy text */}
          <div className="space-y-1 text-xs">
            <label className="font-semibold text-[var(--text-secondary)]">3. Copy Adaptada</label>
            <textarea
              rows={3}
              value={customCaption}
              onChange={(e) => setCustomCaption(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Execute Button */}
          <button
            onClick={handlePublishNow}
            disabled={isPublishing}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className={`w-4 h-4 ${isPublishing ? 'animate-spin' : ''}`} />
            {isPublishing ? 'Disparando via Proxy & Worker...' : 'Criar & Publicar Agora'}
          </button>
        </div>

        {/* Right Live Payload Preview */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <Globe2 className="w-4 h-4 text-emerald-500" />
            Preview da Publicação Montada
          </h3>

          <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-3">
            <div className="flex items-center gap-3">
              <img src={selectedMedia.thumbnailUrl || selectedMedia.url} alt="Media" className="w-12 h-12 rounded-lg object-cover" />
              <div>
                <div className="font-bold text-xs text-[var(--text-primary)]">{selectedAccount.name}</div>
                <div className="text-[10px] text-[var(--text-muted)] font-mono">Proxy: {selectedAccount.proxy.ip}</div>
              </div>
            </div>

            <div className="text-xs text-[var(--text-secondary)] whitespace-pre-line border-t border-[var(--border-color)] pt-3">
              {customCaption}
            </div>

            <div className="text-xs text-indigo-400 font-bold">{ctaText}</div>

            <div className="flex flex-wrap gap-1 text-[10px] font-mono text-purple-400">
              {hashtags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>

          {/* Result Banner */}
          {publishResult && (
            <div
              className={`p-4 rounded-xl border text-xs font-mono space-y-1 ${
                publishResult.success
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              <div className="font-bold">
                {publishResult.success ? '✓ Publicação Concluída com Sucesso!' : '❌ Falha no Envio'}
              </div>
              {publishResult.success ? (
                <div>Post ID: {publishResult.postId} ({publishResult.executionTimeMs}ms)</div>
              ) : (
                <div>Erro: {publishResult.error}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
