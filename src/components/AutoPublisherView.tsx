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

  const defaultDemoAccount: Account = {
    id: 'acc_demo_pub',
    name: 'Conta Demonstrativa (PT)',
    username: '@hot_vip_pt01',
    passwordHash: 'vault_encrypted',
    category: 'HOT',
    country: 'Portugal',
    countryCode: 'PT',
    language: 'Português (Portugal)',
    languageCode: 'PT-PT',
    timezone: 'Europe/Lisbon',
    city: 'Lisboa',
    state: 'LIS',
    currency: 'EUR (€)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    proxy: {
      id: 'px_demo',
      ip: '185.220.101.5',
      port: 8080,
      protocol: 'SOCKS5',
      latencyMs: 35,
      status: 'ACTIVE',
    },
    cookies: 'session_active=true',
    status: 'ONLINE',
    lastLogin: new Date().toISOString(),
    lastPublication: 'Sem publicações',
    publishedCount: 0,
    errorCount: 0,
    notes: 'Conta demonstrativa',
    tags: ['HOT', 'PT'],
  };

  const defaultDemoMedia: MediaAsset = {
    id: 'media_demo_pub',
    title: 'Post 9:16 Demonstrativo',
    type: 'VIDEO',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop',
    category: 'HOT',
    languageCode: 'PT-PT',
    countryCode: 'PT',
    tags: ['9:16', 'REELS'],
    status: 'READY',
    dimensions: '1080x1920 (9:16)',
    durationSeconds: 15,
    sizeMb: 6.5,
    createdAt: new Date().toISOString(),
    variantsCount: 3,
  };

  const [selectedAccount, setSelectedAccount] = useState<Account>(availableAccounts[0] || accounts[0] || defaultDemoAccount);
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset>(mediaAssets[0] || defaultDemoMedia);

  const currentAccount = selectedAccount || availableAccounts[0] || accounts[0] || defaultDemoAccount;
  const currentMedia = selectedMedia || mediaAssets[0] || defaultDemoMedia;

  const [customCaption, setCustomCaption] = useState<string>('🔥 Conteúdo exclusivo liberado hoje!');
  const [publishPlatforms, setPublishPlatforms] = useState<string[]>(['instagram', 'tiktok', 'youtube_shorts', 'x_twitter']);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any | null>(null);

  const ctaText = LocalizationEngine.getCtaForLanguage(currentAccount.languageCode);
  const hashtags = LocalizationEngine.rotateHashtags([]);

  // --- Puppeteer Robot State ---
  const [botVideoPath, setBotVideoPath] = useState('C:\\OmniMedia\\Lotes\\MeuLote\\video_001.mp4');
  const [botCaption, setBotCaption] = useState('🔥 Conteúdo exclusivo! Vem conferir');
  const [botHashtags, setBotHashtags] = useState('#HOT #FYP #Viral #Reels #Shorts');
  const [botCdpPort, setBotCdpPort] = useState('11800');
  const [botResults, setBotResults] = useState<Record<string, any>>({});
  const [botPosting, setBotPosting] = useState<Record<string, boolean>>({});

  const handleBotPublish = async (platform: string) => {
    setBotPosting(prev => ({ ...prev, [platform]: true }));
    try {
      const res = await fetch('/api/autopost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          profileId: currentAccount.id,
          cdpPort: parseInt(botCdpPort, 10),
          videoPath: botVideoPath,
          caption: botCaption,
          hashtags: botHashtags,
        }),
      });
      const data = await res.json();
      setBotResults(prev => ({ ...prev, [platform]: data }));
    } catch (err: any) {
      setBotResults(prev => ({ ...prev, [platform]: { success: false, error: err.message } }));
    } finally {
      setBotPosting(prev => ({ ...prev, [platform]: false }));
    }
  };

  const handlePublishNow = async () => {
    if (publishPlatforms.length === 0) return;
    setIsPublishing(true);
    setPublishResult(null);

    const results: any[] = [];

    for (const plat of publishPlatforms) {
      const adapter = PlatformIntegrationRegistry.getAdapter(plat);
      const authCheck = await adapter.validateAuth(currentAccount);

      if (!authCheck.valid) {
        results.push({ platform: plat, success: false, error: authCheck.message });
        continue;
      }

      const res = await adapter.publishContent({
        accountId: currentAccount.id,
        accountUsername: currentAccount.username,
        proxy: currentAccount.proxy,
        cookies: currentAccount.cookies,
        mediaUrl: currentMedia.url,
        mediaType: currentMedia.type,
        caption: customCaption,
        hashtags,
        cta: ctaText,
        scheduledTime: new Date().toISOString(),
      });

      results.push({ platform: plat, ...res });

      if (res.success) {
        onPublishSuccess({
          id: `log_${Math.random().toString(36).substring(2, 8)}`,
          jobId: `job_${Math.random().toString(36).substring(2, 8)}`,
          accountId: currentAccount.id,
          accountName: currentAccount.name,
          category: currentAccount.category,
          platform: plat,
          languageCode: currentAccount.languageCode,
          countryCode: currentAccount.countryCode,
          mediaTitle: currentMedia.title,
          copyUsed: customCaption,
          hashtagsUsed: hashtags,
          ctaUsed: ctaText,
          executionTimeMs: res.executionTimeMs,
          result: 'SUCCESS',
          statusCode: 200,
          logDetail: `[PublishEngine] Disparo efetuado com sucesso via ${adapter.platformName}. Post ID: ${res.postId}`,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    }

    setPublishResult({
      success: results.every((r) => r.success),
      platformsCount: results.length,
      details: results,
    });
    setIsPublishing(false);
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

          {/* 4. Platform Selector */}
          <div className="space-y-2 text-xs">
            <label className="font-semibold text-[var(--text-secondary)] flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-indigo-400" />
              4. Plataformas de Destino (multi-seleção)
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'instagram', label: 'Instagram', icon: '📸', color: 'border-pink-500/50 bg-pink-500/10 text-pink-400' },
                { id: 'tiktok', label: 'TikTok', icon: '🎵', color: 'border-slate-400/50 bg-slate-700/20 text-slate-300' },
                { id: 'youtube_shorts', label: 'YouTube Shorts', icon: '▶️', color: 'border-red-500/50 bg-red-500/10 text-red-400' },
                { id: 'x_twitter', label: 'X (Twitter)', icon: '𝕏', color: 'border-blue-500/50 bg-blue-500/10 text-blue-400' },
              ].map((pl) => {
                const isOn = publishPlatforms.includes(pl.id);
                return (
                  <button
                    key={pl.id}
                    onClick={() =>
                      setPublishPlatforms((prev) =>
                        prev.includes(pl.id) ? prev.filter((p) => p !== pl.id) : [...prev, pl.id]
                      )
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 font-bold text-xs transition-all ${
                      isOn ? pl.color + ' shadow-md scale-105' : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] opacity-50'
                    }`}
                  >
                    <span>{pl.icon}</span>
                    <span>{pl.label}</span>
                    {isOn && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
            {publishPlatforms.length === 0 && (
              <p className="text-rose-400 text-[10px] font-mono">⚠️ Selecione ao menos 1 plataforma</p>
            )}
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

      {/* === PUPPETEER ROBOT SECTION === */}
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-indigo-500/30 space-y-5 shadow-sm">
        <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
          <RefreshCw className="w-4 h-4 text-indigo-400" />
          Robô de Publicação Automática (Puppeteer)
          <span className="ml-auto px-2 py-0.5 text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">BETA</span>
        </h3>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Com o Chrome do perfil <strong className="text-white">{currentAccount.name}</strong> aberto via o .bat, o robô vai se conectar invisívelmente e fazer o upload do vídeo em cada rede social.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Caminho do Vídeo (Local)</label>
            <input
              type="text"
              value={botVideoPath}
              onChange={(e) => setBotVideoPath(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              placeholder="C:\OmniMedia\Lotes\MeuLote\video_001.mp4"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Porta CDP (Debug Port)</label>
            <input
              type="text"
              value={botCdpPort}
              onChange={(e) => setBotCdpPort(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              placeholder="11800"
            />
            <p className="text-[10px] text-[var(--text-muted)]">Porta gerada automaticamente no .bat do perfil.</p>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Legenda (Caption)</label>
            <input
              type="text"
              value={botCaption}
              onChange={(e) => setBotCaption(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Hashtags</label>
            <input
              type="text"
              value={botHashtags}
              onChange={(e) => setBotHashtags(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { id: 'tiktok', label: 'TikTok', icon: '🎵', color: 'bg-slate-700 hover:bg-slate-600 border-slate-500' },
            { id: 'youtube', label: 'YouTube Shorts', icon: '▶️', color: 'bg-red-900/40 hover:bg-red-800/50 border-red-700/50' },
            { id: 'instagram', label: 'Instagram Reels', icon: '📸', color: 'bg-pink-900/40 hover:bg-pink-800/50 border-pink-700/50' },
            { id: 'x_twitter', label: 'X (Twitter)', icon: '𝕏', color: 'bg-blue-900/40 hover:bg-blue-800/50 border-blue-700/50' },
          ].map((pl) => {
            const isPosting = botPosting[pl.id];
            const result = botResults[pl.id];
            return (
              <div key={pl.id} className="space-y-2">
                <button
                  onClick={() => handleBotPublish(pl.id)}
                  disabled={isPosting}
                  className={`w-full py-2.5 rounded-xl border text-white font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${pl.color}`}
                >
                  {isPosting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>{pl.icon}</span>}
                  {isPosting ? 'Postando...' : pl.label}
                </button>
                {result && (
                  <p className={`text-[10px] font-bold text-center rounded-lg px-2 py-1 ${result.success ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                    {result.success ? '✓ Publicado!' : `✗ ${result.error?.slice(0, 40) || 'Erro'}`}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[10px] text-amber-400 leading-relaxed">
          <strong>Como usar:</strong> Abra o Chrome do perfil clicando em "↓ Baixar Launcher .bat" na aba de Contas. Faça login nas 4 redes sociais. Depois volte aqui, informe o caminho do vídeo do lote e a porta CDP gerada no .bat, e clique no botão da rede social desejada.
        </div>
      </div>

    </div>
  );
};
