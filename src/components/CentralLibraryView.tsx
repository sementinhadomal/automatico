'use client';

import React, { useState } from 'react';
import { MediaAsset, CopyItem, HashtagSet, CategoryType, Account } from '@/types';
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
  User,
  Upload,
  Plus,
  Trash2,
} from 'lucide-react';

interface CentralLibraryViewProps {
  mediaAssets: MediaAsset[];
  accounts?: Account[];
  selectedCategory: CategoryType | 'ALL';
  onUpdateMediaAssets?: (updated: MediaAsset[]) => void;
}

export const CentralLibraryView: React.FC<CentralLibraryViewProps> = ({
  mediaAssets,
  accounts = [],
  selectedCategory,
  onUpdateMediaAssets,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'media' | 'copys' | 'hashtags' | 'ctas' | 'music'>('media');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
  const [langFilter, setLangFilter] = useState<string>('ALL');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Form states para o Upload de Mídia
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryType>('HOT');
  const [newType, setNewType] = useState<'IMAGE' | 'VIDEO'>('VIDEO');
  const [newAccountId, setNewAccountId] = useState<string>('acc_hot_pt_01');
  const [newUrl, setNewUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const filteredMedia = mediaAssets.filter(
    (m) =>
      (selectedCategory === 'ALL' || m.category === selectedCategory) &&
      (filterType === 'ALL' || m.type === filterType) &&
      (selectedAccountFilter === 'ALL' || m.accountId === selectedAccountFilter)
  );

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    
    const newAssets: MediaAsset[] = fileArray.map((file, index) => {
      const isVideo = file.type.startsWith('video');
      const objectUrl = URL.createObjectURL(file);

      return {
        id: `media_${Date.now()}_${index}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        url: objectUrl,
        thumbnailUrl: isVideo ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop' : objectUrl,
        type: isVideo ? 'VIDEO' : 'IMAGE',
        dimensions: '1080x1920 (9:16 Vertical)',
        durationSeconds: isVideo ? 15 : undefined,
        category: newCategory,
        accountId: newAccountId,
        languageCode: 'PT-PT',
        countryCode: 'PT',
        tags: ['9:16', 'REELS', newCategory],
        status: 'READY',
        sizeMb: Number((file.size / (1024 * 1024)).toFixed(1)) || 5.2,
        variantsCount: 3,
        createdAt: new Date().toISOString(),
      };
    });

    if (onUpdateMediaAssets) {
      onUpdateMediaAssets([...newAssets, ...mediaAssets]);
    }
    setIsUploadModalOpen(false);
    setNewTitle('');
    setNewUrl('');
  };

  const handleGenerateBulkDemoMedia = (accId: string, count: number = 150) => {
    const acc = accounts.find((a) => a.id === accId);
    const category = acc ? acc.category : newCategory;
    const sampleAssets: MediaAsset[] = Array.from({ length: count }, (_, i) => ({
      id: `bulk_demo_${accId}_${Date.now()}_${i + 1}`,
      title: `Mídia 9:16 #${i + 1} — ${acc ? acc.name : 'Conta'}`,
      url: i % 2 === 0 
        ? 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop',
      thumbnailUrl: i % 2 === 0
        ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop',
      type: i % 2 === 0 ? 'VIDEO' : 'IMAGE',
      dimensions: '1080x1920 (9:16 Vertical)',
      durationSeconds: i % 2 === 0 ? 15 : undefined,
      category,
      accountId: accId,
      languageCode: acc ? acc.languageCode : 'PT-PT',
      countryCode: acc ? acc.countryCode : 'PT',
      tags: ['9:16', 'AUTOMATION_50_DAYS', category],
      status: 'READY',
      sizeMb: 6.8,
      variantsCount: 3,
      createdAt: new Date().toISOString(),
    }));

    if (onUpdateMediaAssets) {
      onUpdateMediaAssets([...sampleAssets, ...mediaAssets]);
    }
    setIsUploadModalOpen(false);
  };

  const handleManualAdd = () => {
    if (!newTitle.trim()) return;
    const newAsset: MediaAsset = {
      id: `media_${Date.now()}`,
      title: newTitle,
      url: newUrl || (newType === 'VIDEO' ? 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop'),
      thumbnailUrl: newType === 'VIDEO' ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop' : (newUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop'),
      type: newType,
      dimensions: '1080x1920 (9:16 Vertical)',
      durationSeconds: newType === 'VIDEO' ? 30 : undefined,
      category: newCategory,
      accountId: newAccountId,
      languageCode: 'PT-PT',
      countryCode: 'PT',
      tags: ['9:16', 'REELS', newCategory],
      status: 'READY',
      sizeMb: 8.5,
      variantsCount: 3,
      createdAt: new Date().toISOString(),
    };

    if (onUpdateMediaAssets) {
      onUpdateMediaAssets([newAsset, ...mediaAssets]);
    }
    setIsUploadModalOpen(false);
    setNewTitle('');
    setNewUrl('');
  };

  const handleDeleteMedia = (id: string) => {
    if (onUpdateMediaAssets) {
      onUpdateMediaAssets(mediaAssets.filter((m) => m.id !== id));
    }
  };

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
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-500" />
            Biblioteca Central de Ativos 9:16
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Organização centralizada de vídeos/fotos verticais 9:16 (Reels, TikTok, Shorts), copys, hashtags e CTAs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
          >
            <Upload className="w-4 h-4" />
            Importar Mídias 9:16 (Fotos/Vídeos)
          </button>

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
      </div>

      {/* Sub Tabs Navigation & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('media')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'media'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Imagens e Vídeos 9:16 ({filteredMedia.length})
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

        {activeSubTab === 'media' && (
          <div className="flex items-center gap-2 text-xs">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Todos os Formatos</option>
              <option value="VIDEO">Vídeos Verticais 9:16</option>
              <option value="IMAGE">Fotos Verticais 9:16</option>
            </select>

            {accounts.length > 0 && (
              <select
                value={selectedAccountFilter}
                onChange={(e) => setSelectedAccountFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">Todas as Contas ({accounts.length})</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.countryCode})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Content based on Active Sub Tab */}
      {activeSubTab === 'media' && (
        <>
          {filteredMedia.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
              <ImageIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Nenhuma mídia 9:16 cadastrada para o filtro selecionado</h3>
              <p className="text-xs text-[var(--text-muted)]">Clique em "Importar Mídias 9:16" para adicionar fotos ou vídeos verticais para esta conta.</p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
              >
                Importar Agora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {filteredMedia.map((asset) => (
                <div
                  key={asset.id}
                  className="group rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col"
                >
                  {/* Media Thumbnail em proporção 9:16 (Vertical) */}
                  <div className="relative aspect-[9/16] bg-slate-950 overflow-hidden">
                    {asset.type === 'VIDEO' ? (
                      <video
                        src={asset.url}
                        poster={asset.thumbnailUrl}
                        controls
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <img
                        src={asset.thumbnailUrl || asset.url}
                        alt={asset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <span
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        asset.category === 'HOT' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {asset.category}
                    </span>

                    <button
                      onClick={() => handleDeleteMedia(asset.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white transition-all opacity-0 group-hover:opacity-100"
                      title="Excluir Mídia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/70 text-white backdrop-blur-md">
                      {asset.type === 'VIDEO' ? `${asset.durationSeconds || 15}s (9:16)` : '9:16 Foto'}
                    </span>
                  </div>

                  {/* Asset Info */}
                  <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                    <h4 className="font-bold text-xs text-[var(--text-primary)] truncate" title={asset.title}>
                      {asset.title}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                      <span className="truncate">{accounts.find((a) => a.id === asset.accountId)?.name || 'Global'}</span>
                      <span className="text-indigo-400 font-bold">9:16 ✓</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
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
      {/* Upload Media Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-500" />
                Importar Mídias Verticais 9:16 (Reels/Shorts/TikTok)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
                Padronizado 9:16 (1080x1920)
              </span>
            </div>

            {/* Drag and Drop Zone for local files */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileUpload(e.dataTransfer.files); }}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                  : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-indigo-500/50'
              }`}
            >
              <input
                type="file"
                id="media-file-upload"
                accept="video/*,image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <label htmlFor="media-file-upload" className="cursor-pointer block space-y-2">
                <Upload className="w-8 h-8 text-indigo-400 mx-auto animate-bounce" />
                <div className="font-bold text-xs text-[var(--text-primary)]">
                  Clique aqui ou arraste seus arquivos MP4/MOV/JPG/PNG (9:16)
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  Os vídeos e fotos serão importados e associados à conta selecionada
                </div>
              </label>
            </div>

            <div className="relative flex items-center my-2">
              <div className="flex-grow border-t border-[var(--border-color)]"></div>
              <span className="flex-shrink mx-4 text-[10px] text-[var(--text-muted)] font-mono uppercase">Ou Adicionar por URL / Título</span>
              <div className="flex-grow border-t border-[var(--border-color)]"></div>
            </div>

            {/* Manual Form */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-[var(--text-muted)] block mb-1">Título da Mídia / Post</label>
                <input
                  type="text"
                  placeholder="Ex: Reel Produto Verão 9:16"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-2.5 text-xs text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[var(--text-muted)] block mb-1">Tipo de Formato</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-2.5 text-xs text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="VIDEO">Vídeo Vertical 9:16 (MP4/MOV)</option>
                    <option value="IMAGE">Imagem Vertical 9:16 (JPG/PNG)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[var(--text-muted)] block mb-1">Categoria do SaaS</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-2.5 text-xs text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="HOT">HOT</option>
                    <option value="DROP">DROPSHIPPING</option>
                  </select>
                </div>
              </div>

              {accounts.length > 0 && (
                <div>
                  <label className="text-[10px] text-[var(--text-muted)] block mb-1">Vincular a uma Conta Específica</label>
                  <select
                    value={newAccountId}
                    onChange={(e) => setNewAccountId(e.target.value)}
                    className="w-full rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-2.5 text-xs text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.country}) - {a.category}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] text-[var(--text-muted)] block mb-1">URL da Mídia (Opcional se usar upload local)</label>
                <input
                  type="text"
                  placeholder="https://sua-cdn.com/video-9-16.mp4"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-2.5 text-xs text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
              <button
                onClick={() => handleGenerateBulkDemoMedia(newAccountId, 150)}
                className="px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold transition-all"
                title="Gera 150 mídias 9:16 prontas vinculadas a esta conta para testar o piloto automático de 50 dias"
              >
                ⚡ Gerar 150 Mídias 9:16 em Lote
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleManualAdd}
                  disabled={!newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md"
                >
                  Adicionar Mídia
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

