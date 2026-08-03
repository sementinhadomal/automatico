'use client';

import React, { useState } from 'react';
import { MediaAsset, CopyItem, HashtagSet, CategoryType } from '@/types';
import {
  INITIAL_COPYS,
  INITIAL_HASHTAGS,
} from '@/lib/mockData';
import { LocalizationEngine } from '@/lib/localization/engine';
import {
  FolderKanban,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Hash,
  MessageSquare,
  Music,
  Copy as CopyIcon,
  Check,
  Globe2,
  Sparkles,
} from 'lucide-react';

interface CentralLibraryViewProps {
  mediaAssets: MediaAsset[];
  selectedCategory: CategoryType | 'ALL';
}

export const CentralLibraryView: React.FC<CentralLibraryViewProps> = ({
  mediaAssets,
  selectedCategory,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'media' | 'copys' | 'hashtags' | 'ctas' | 'music'>('media');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [langFilter, setLangFilter] = useState<string>('ALL');

  const filteredMedia = mediaAssets.filter(
    (m) => (selectedCategory === 'ALL' || m.category === selectedCategory) &&
           (langFilter === 'ALL' || m.languageCode === langFilter)
  );

  const filteredCopys = INITIAL_COPYS.filter(
    (c) => (selectedCategory === 'ALL' || c.category === selectedCategory) &&
           (langFilter === 'ALL' || c.languageCode === langFilter)
  );

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const languages = ['PT-BR', 'PT-PT', 'EN-US', 'EN-UK', 'ES', 'FR', 'DE', 'IT', 'NL'];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-500" />
            Biblioteca Central de Ativos de Mídia
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Organização centralizada de mídias, copys, hashtags rotativas, CTAs por idioma e banco de áudios.
          </p>
        </div>

        {/* Language Filter */}
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-[var(--text-muted)]" />
          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Todos os Idiomas</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('media')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'media'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Imagens e Vídeos ({filteredMedia.length})
        </button>

        <button
          onClick={() => setActiveSubTab('copys')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'copys'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FileText className="w-4 h-4" />
          Banco de Copys ({filteredCopys.length})
        </button>

        <button
          onClick={() => setActiveSubTab('hashtags')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'hashtags'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Hash className="w-4 h-4" />
          Hashtags Rotativas
        </button>

        <button
          onClick={() => setActiveSubTab('ctas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'ctas'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          CTAs por Idioma
        </button>
      </div>

      {/* Content based on Active Sub Tab */}
      {activeSubTab === 'media' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {filteredMedia.map((asset) => (
            <div
              key={asset.id}
              className="group rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden shadow-sm hover:shadow-xl transition-all"
            >
              {/* Media Thumbnail */}
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                <img
                  src={asset.thumbnailUrl || asset.url}
                  alt={asset.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span
                  className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                    asset.category === 'HOT' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {asset.category}
                </span>

                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/70 text-white backdrop-blur-md">
                  {asset.type === 'VIDEO' ? `${asset.durationSeconds}s` : asset.dimensions}
                </span>
              </div>

              {/* Asset Info */}
              <div className="p-4 space-y-2">
                <h4 className="font-bold text-xs text-[var(--text-primary)] truncate">{asset.title}</h4>
                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
                  <span>{asset.languageCode}</span>
                  <span>{asset.variantsCount} variações Sharp/FFmpeg</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Copys Tab */}
      {activeSubTab === 'copys' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCopys.map((copy) => (
            <div key={copy.id} className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {copy.languageCode} | {copy.category}
                </span>

                <button
                  onClick={() => handleCopyText(copy.id, copy.text)}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300"
                >
                  {copiedId === copy.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                  {copiedId === copy.id ? 'Copiado!' : 'Copiar Copy'}
                </button>
              </div>

              <h4 className="font-bold text-sm text-[var(--text-primary)]">{copy.title}</h4>
              <p className="text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-color)] font-sans">
                {copy.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Hashtags Tab */}
      {activeSubTab === 'hashtags' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INITIAL_HASHTAGS.map((set) => (
            <div key={set.id} className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[var(--text-primary)]">{set.title}</h4>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {set.languageCode}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {set.hashtags.map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs font-mono text-purple-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTAs Tab */}
      {activeSubTab === 'ctas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {languages.map((lang) => (
            <div key={lang} className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
              <div className="text-xs font-bold text-indigo-400 font-mono">Idioma: {lang}</div>
              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)]">
                {LocalizationEngine.getCtaForLanguage(lang)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
