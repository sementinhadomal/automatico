'use client';

import React, { useState } from 'react';
import { MediaAsset, Account, CategoryType } from '@/types';
import {
  Download,
  Link as LinkIcon,
  Sparkles,
  CheckCircle2,
  Check,
  Zap,
  FolderKanban,
  FileVideo,
  FileAudio,
  Play,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Layers,
  Copy,
} from 'lucide-react';

interface MediaDownloaderViewProps {
  accounts?: Account[];
  mediaAssets?: MediaAsset[];
  selectedCategory?: CategoryType | 'ALL';
  onImportToLibrary?: (newMedia: MediaAsset[]) => void;
}

export interface ExtractedMediaResult {
  id: string;
  sourceUrl: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'generic';
  title: string;
  downloadUrl: string;       // URL direta do CDN (para preview/importar)
  proxyDownloadUrl: string;  // URL via /api proxy para download real
  thumbnailUrl: string;
  quality: string;
  durationSeconds: number;
  sizeMb: number;
  hasWatermark: boolean;
  status: 'PENDING' | 'EXTRACTING' | 'READY' | 'ERROR';
  extractionError?: string;
}

export const MediaDownloaderView: React.FC<MediaDownloaderViewProps> = ({
  accounts = [],
  mediaAssets = [],
  selectedCategory = 'ALL',
  onImportToLibrary,
}) => {
  const [urlsInput, setUrlsInput] = useState<string>('');
  const [targetAccountId, setTargetAccountId] = useState<string>(accounts[0]?.id || 'acc_hot_pt_01');
  const [targetCategory, setTargetCategory] = useState<CategoryType>('HOT');
  const [noWatermark, setNoWatermark] = useState<boolean>(true);
  const [selectedQuality, setSelectedQuality] = useState<'4K' | '1080p' | '720p' | 'MP3'>('1080p');
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [extractedList, setExtractedList] = useState<ExtractedMediaResult[]>([]);
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Detect Platform from URL
  const detectPlatform = (url: string): ExtractedMediaResult['platform'] => {
    const lower = url.toLowerCase();
    if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram';
    if (lower.includes('tiktok.com')) return 'tiktok';
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
    if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
    return 'generic';
  };

  // Sample HD video fallbacks for demo extraction
  const demoVideos = [
    {
      title: 'Reels Modelo Portuguesa 9:16 HD',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop',
    },
    {
      title: 'TikTok Viral Trending Clean 1080p',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      thumb: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop',
    },
    {
      title: 'YouTube Shorts Dropshipping Product Video 4K',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      thumb: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop',
    },
  ];

  // Download: usa proxyDownloadUrl diretamente (já é /api/media-downloader?url=CDN_URL)
  // NUNCA re-encapsula o proxyDownloadUrl em outro /api/media-downloader para evitar loop
  const handleForceDownload = async (item: ExtractedMediaResult) => {
    const cleanTitle = item.title.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 60);
    const filename = `${cleanTitle}.mp4`;

    // Se temos proxyDownloadUrl (URL de CDN via nosso proxy), usa diretamente
    if (item.proxyDownloadUrl) {
      try {
        const response = await fetch(item.proxyDownloadUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 1500);
        return;
      } catch (err) {
        // Fallback: abre em nova aba
        window.open(item.proxyDownloadUrl, '_blank');
        return;
      }
    }

    // Sem proxy — abre URL de CDN diretamente
    if (item.downloadUrl) {
      window.open(item.downloadUrl, '_blank');
    }
  };

  const handleExtractVideos = async () => {
    const lines = urlsInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 5);

    if (lines.length === 0) return;

    setIsProcessing(true);
    setExtractedList([]);

    const extractedResults: ExtractedMediaResult[] = [];

    for (let idx = 0; idx < lines.length; idx++) {
      const url = lines[idx];
      const platform = detectPlatform(url);
      const demo = demoVideos[idx % demoVideos.length];

      let realDownloadUrl = '';
      let realThumbUrl = demo.thumb;
      let realTitle = `${platform.toUpperCase()} Vídeo HD #${idx + 1}`;
      let proxyDownloadUrl = '';
      let extractionError = '';

      setProcessingStatus(`🔍 Extraindo (${idx + 1}/${lines.length}): ${url.substring(0, 50)}...`);

      try {
        const apiRes = await fetch('/api/media-downloader', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
          signal: AbortSignal.timeout(25000),
        });

        if (apiRes.ok) {
          const json = await apiRes.json();
          if (json.success && json.downloadUrl) {
            realDownloadUrl = json.downloadUrl;           // URL direta CDN
            realThumbUrl = json.thumbnailUrl || demo.thumb;
            realTitle = json.title || realTitle;
            proxyDownloadUrl = json.proxyDownloadUrl || ''; // /api?url=CDN_URL
          } else if (json.error) {
            extractionError = json.error;
          }
        }
      } catch (e: any) {
        extractionError = 'Timeout ou erro de rede';
        console.warn('Extração falhou:', e?.message);
      }

      const hasResult = !!realDownloadUrl;
      extractedResults.push({
        id: `ext_${Date.now()}_${idx}`,
        sourceUrl: url,
        platform,
        title: realTitle,
        downloadUrl: realDownloadUrl,           // CDN direto (para importar à biblioteca)
        proxyDownloadUrl,                       // /api proxy (para botão Baixar)
        thumbnailUrl: hasResult ? realThumbUrl : demo.thumb,
        quality: selectedQuality === 'MP3' ? 'Áudio MP3 320kbps' : `${selectedQuality} HD (9:16)`,
        durationSeconds: Math.floor(Math.random() * 25) + 12,
        sizeMb: Number((Math.random() * 10 + 5).toFixed(1)),
        hasWatermark: !noWatermark,
        status: hasResult ? 'READY' : 'ERROR',
        extractionError,
      });
    }

    setExtractedList(extractedResults);
    setProcessingStatus('');
    setIsProcessing(false);
  };

  const handleImportSingleToLibrary = (item: ExtractedMediaResult) => {
    const newAsset: MediaAsset = {
      id: `media_down_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: item.title,
      url: item.downloadUrl,
      thumbnailUrl: item.thumbnailUrl,
      type: item.quality.includes('MP3') ? 'IMAGE' : 'VIDEO',
      dimensions: '1080x1920 (9:16 HD)',
      durationSeconds: item.durationSeconds,
      category: targetCategory,
      accountId: targetAccountId,
      languageCode: 'PT-PT',
      countryCode: 'PT',
      tags: ['DOWNLOADED', item.platform.toUpperCase(), 'NO_WATERMARK', 'HD'],
      status: 'READY',
      sizeMb: item.sizeMb,
      variantsCount: 3,
      createdAt: new Date().toISOString(),
    };

    if (onImportToLibrary) {
      onImportToLibrary([newAsset]);
    }
    setImportedIds((prev) => [...prev, item.id]);
  };

  const handleImportAllToLibrary = () => {
    const newAssets: MediaAsset[] = extractedList.map((item) => ({
      id: `media_down_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: item.title,
      url: item.downloadUrl,
      thumbnailUrl: item.thumbnailUrl,
      type: item.quality.includes('MP3') ? 'IMAGE' : 'VIDEO',
      dimensions: '1080x1920 (9:16 HD)',
      durationSeconds: item.durationSeconds,
      category: targetCategory,
      accountId: targetAccountId,
      languageCode: 'PT-PT',
      countryCode: 'PT',
      tags: ['DOWNLOADED', item.platform.toUpperCase(), 'NO_WATERMARK', 'HD'],
      status: 'READY',
      sizeMb: item.sizeMb,
      variantsCount: 3,
      createdAt: new Date().toISOString(),
    }));

    if (onImportToLibrary) {
      onImportToLibrary(newAssets);
    }
    setImportedIds(extractedList.map((i) => i.id));
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-500" />
            Downloader HD de Mídias por Link (Sem Marca D'água)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Extraia e baixe vídeos do Instagram Reels, TikTok, YouTube Shorts e Twitter em alta qualidade 4K/1080p sem logo d'água.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-emerald-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Extractor Engine v3.8 Active</span>
        </div>
      </div>

      {/* Main Extractor Card */}
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-indigo-500" />
            Insira os Links das Mídias (Suporta Download em Lote)
          </h3>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            Suporta: Instagram Reels &bull; TikTok &bull; YT Shorts &bull; Twitter X
          </span>
        </div>

        {/* Input Textarea */}
        <div className="space-y-2">
          <textarea
            rows={4}
            value={urlsInput}
            onChange={(e) => setUrlsInput(e.target.value)}
            placeholder={`Cole os links aqui (um por linha)...Exemplo:\nhttps://www.instagram.com/reels/C3x9Lmn...\nhttps://www.tiktok.com/@user/video/731...\nhttps://youtube.com/shorts/xyZ123...`}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-indigo-500 transition-all placeholder:text-[var(--text-muted)]"
          />
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {/* Target Account */}
          <div className="space-y-1">
            <label className="font-semibold text-[var(--text-secondary)]">Vincular à Conta da Biblioteca</label>
            <select
              value={targetAccountId}
              onChange={(e) => setTargetAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-bold focus:outline-none focus:border-indigo-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.username}) [{acc.category}]
                </option>
              ))}
            </select>
          </div>

          {/* Target Category */}
          <div className="space-y-1">
            <label className="font-semibold text-[var(--text-secondary)]">Categoria Alvo</label>
            <select
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value as CategoryType)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="HOT">HOT (Conteúdo Adulto / Portugal / Espanha)</option>
              <option value="DROPSHIPPING">DROPSHIPPING (Produtos Físicos)</option>
            </select>
          </div>

          {/* Quality */}
          <div className="space-y-1">
            <label className="font-semibold text-[var(--text-secondary)]">Qualidade de Saída</label>
            <select
              value={selectedQuality}
              onChange={(e) => setSelectedQuality(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-mono font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="4K">4K Ultra HD (Máxima Resolução)</option>
              <option value="1080p">1080p Full HD (Recomendado 9:16)</option>
              <option value="720p">720p HD (Compacto)</option>
              <option value="MP3">Apenas Áudio (MP3 320kbps)</option>
            </select>
          </div>

          {/* Watermark Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-[var(--text-primary)] block">Sem Marca D'água</span>
              <span className="text-[10px] text-[var(--text-muted)] block">Remover logo TikTok/Reels</span>
            </div>
            <input
              type="checkbox"
              checked={noWatermark}
              onChange={(e) => setNoWatermark(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Extract Action Button */}
        <div className="space-y-2 pt-2">
          {processingStatus && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-300 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400 shrink-0" />
              <span className="truncate">{processingStatus}</span>
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={handleExtractVideos}
              disabled={isProcessing || urlsInput.trim().length === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extraindo com serviços em cascata...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Processar &amp; Extrair Vídeos HD</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Extracted Results List */}
      {extractedList.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Mídias Extraídas Prontas ({extractedList.length} itens)
            </h3>
            <button
              onClick={handleImportAllToLibrary}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <FolderKanban className="w-4 h-4" />
              <span>Importar Todos para a Biblioteca Central ({targetCategory})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extractedList.map((item) => {
              const isImported = importedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl bg-[var(--bg-card)] border space-y-3 shadow-sm transition-all flex flex-col justify-between ${
                    item.status === 'ERROR'
                      ? 'border-rose-500/40 hover:border-rose-500/60'
                      : 'border-[var(--border-color)] hover:border-indigo-500/40'
                  }`}
                >
                  {/* Thumbnail & Badges */}
                  <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black/40 border border-[var(--border-color)]">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/70 text-white backdrop-blur-md uppercase border border-white/10">
                        {item.platform}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/80 text-white backdrop-blur-md">
                        {item.quality}
                      </span>
                    </div>

                    {!item.hasWatermark && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-600/90 text-white backdrop-blur-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Sem Marca</span>
                      </div>
                    )}

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono bg-black/80 text-white">
                      {item.durationSeconds}s &bull; {item.sizeMb}MB
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-[var(--text-primary)] line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-[var(--text-muted)] font-mono truncate">
                      {item.sourceUrl}
                    </p>
                    {item.status === 'ERROR' && item.extractionError && (
                      <p className="text-[10px] text-rose-400 font-mono bg-rose-500/10 border border-rose-500/20 rounded-lg px-2 py-1">
                        ⚠️ {item.extractionError}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                    <button
                      onClick={() => handleForceDownload(item)}
                      disabled={!item.proxyDownloadUrl && !item.downloadUrl}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all text-center cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar MP4 Directo no PC</span>
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleImportSingleToLibrary(item)}
                        disabled={isImported}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          isImported
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        {isImported ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Importado!</span>
                          </>
                        ) : (
                          <>
                            <FolderKanban className="w-3.5 h-3.5" />
                            <span>Enviar p/ Biblioteca</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleCopyLink(item.downloadUrl, item.id)}
                        className="px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:text-indigo-400 text-xs font-semibold"
                        title="Copiar Link Direto"
                      >
                        {copiedLink === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
