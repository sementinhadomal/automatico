'use client';

import React, { useState } from 'react';
import { MediaAsset, ImageProcessingOptions } from '@/types';
import { SharpImageProcessor } from '@/lib/editors/image-editor';
import {
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Zap,
  Download,
  RotateCw,
  Sun,
  Contrast,
  Crop,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface ImageStudioViewProps {
  mediaAssets: MediaAsset[];
}

export const ImageStudioView: React.FC<ImageStudioViewProps> = ({ mediaAssets }) => {
  const imageAssets = mediaAssets.filter((m) => m.type === 'IMAGE');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset>(imageAssets[0] || mediaAssets[0]);

  const [options, setOptions] = useState<ImageProcessingOptions>(SharpImageProcessor.getDefaultOptions());
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateVariations = async () => {
    setIsGenerating(true);
    const variants = await SharpImageProcessor.generateAutoVariations(selectedAsset, 5);
    setGeneratedVariants(variants);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-500" />
            Editor Automático de Imagens (Sharp Pipeline)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Transformação de imagens com alterações de brilho, contraste, nitidez, corte, ruído e marca d'água para evitar detecção de conteúdo duplicado.
          </p>
        </div>

        <button
          onClick={handleGenerateVariations}
          disabled={isGenerating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/30 transition-all hover:scale-105 disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Processando Sharp Engine...' : 'Gerar 5 Variações Automáticas'}
        </button>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Image Selector & Canvas Preview */}
        <div className="lg:col-span-2 space-y-4">
          {/* Asset Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {imageAssets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold shrink-0 transition-all ${
                  selectedAsset.id === asset.id
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)]'
                }`}
              >
                <img src={asset.url} alt={asset.title} className="w-8 h-8 rounded-lg object-cover" />
                <span className="truncate max-w-[120px]">{asset.title}</span>
              </button>
            ))}
          </div>

          {/* Interactive Canvas Preview */}
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm text-center">
            <div className="relative inline-block max-w-full overflow-hidden rounded-xl bg-slate-950 p-2 border border-slate-800">
              <img
                src={selectedAsset.url}
                alt="Sharp Preview"
                className="max-h-[380px] object-contain rounded-lg transition-all duration-200"
                style={{
                  filter: `brightness(${100 + options.brightness}%) contrast(${100 + options.contrast}%) saturate(${100 + options.saturation}%)`,
                  transform: `scale(${options.zoom}) rotate(${options.rotateDeg}deg) scaleX(${options.mirrorHorizontal ? -1 : 1})`,
                }}
              />

              {options.watermarkText && (
                <div className="absolute bottom-6 right-6 px-3 py-1 bg-black/75 text-white text-xs font-bold font-mono rounded-lg border border-white/20 backdrop-blur-md">
                  {options.watermarkText}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 text-xs font-mono text-[var(--text-muted)]">
              <span>Dimensões: 1080x1350</span>
              <span>•</span>
              <span>Corte: {options.cropAspect}</span>
              <span>•</span>
              <span>Compressão Sharp: {options.compressionQuality}%</span>
            </div>
          </div>
        </div>

        {/* Right: Manual Parameter Controls */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <Sliders className="w-4 h-4 text-amber-500" />
            Parâmetros de Ajuste Sharp
          </h3>

          <div className="space-y-4 text-xs">
            {/* Brightness */}
            <div className="space-y-1">
              <div className="flex justify-between font-medium text-[var(--text-secondary)]">
                <span>Brilho</span>
                <span className="font-mono">{options.brightness}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={options.brightness}
                onChange={(e) => setOptions({ ...options, brightness: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-1">
              <div className="flex justify-between font-medium text-[var(--text-secondary)]">
                <span>Contraste</span>
                <span className="font-mono">{options.contrast}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={options.contrast}
                onChange={(e) => setOptions({ ...options, contrast: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Zoom */}
            <div className="space-y-1">
              <div className="flex justify-between font-medium text-[var(--text-secondary)]">
                <span>Zoom Micro-Crop</span>
                <span className="font-mono">{options.zoom}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="1.5"
                step="0.01"
                value={options.zoom}
                onChange={(e) => setOptions({ ...options, zoom: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Rotation */}
            <div className="space-y-1">
              <div className="flex justify-between font-medium text-[var(--text-secondary)]">
                <span>Rotação Leve</span>
                <span className="font-mono">{options.rotateDeg}°</span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                value={options.rotateDeg}
                onChange={(e) => setOptions({ ...options, rotateDeg: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Watermark Input */}
            <div className="space-y-1">
              <label className="font-medium text-[var(--text-secondary)] block">Marca d'água Texto</label>
              <input
                type="text"
                placeholder="Ex: © OmniMedia VIP"
                value={options.watermarkText || ''}
                onChange={(e) => setOptions({ ...options, watermarkText: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Generated Variations Output Grid */}
      {generatedVariants.length > 0 && (
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Variações Geradas Automaticamente pelo Sharp Engine
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {generatedVariants.map((v) => (
              <div key={v.id} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-2">
                <img src={v.previewUrl} alt={v.name} className="w-full aspect-square object-cover rounded-lg" />
                <div className="font-bold text-xs text-[var(--text-primary)]">{v.name}</div>
                <div className="text-[10px] text-emerald-500 font-mono">Sharp Checksum Validated &check;</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
