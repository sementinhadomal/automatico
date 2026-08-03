'use client';

import React, { useState } from 'react';
import { MediaAsset, VideoProcessingOptions } from '@/types';
import { FFmpegVideoProcessor } from '@/lib/editors/video-editor';
import {
  Video as VideoIcon,
  Sliders,
  Sparkles,
  Play,
  Volume2,
  Scissors,
  Layers,
  Terminal,
  CheckCircle2,
  Zap,
} from 'lucide-react';

interface VideoStudioViewProps {
  mediaAssets: MediaAsset[];
}

export const VideoStudioView: React.FC<VideoStudioViewProps> = ({ mediaAssets }) => {
  const videoAssets = mediaAssets.filter((m) => m.type === 'VIDEO');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset>(videoAssets[0] || mediaAssets[0]);

  const [options, setOptions] = useState<VideoProcessingOptions>(FFmpegVideoProcessor.getDefaultOptions());
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const ffmpegCommand = FFmpegVideoProcessor.buildFFmpegCommandString(options);

  const handleGenerateVariations = async () => {
    setIsProcessing(true);
    const variants = await FFmpegVideoProcessor.generateAutoVariations(selectedAsset, 4);
    setGeneratedVariants(variants);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <VideoIcon className="w-5 h-5 text-purple-500" />
            Editor Automático de Vídeos (FFmpeg Engine)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Alterações automáticas de velocidade, corte de quadros inicial/final, espelhamento, mixagem de áudio, legendas e logo overlay.
          </p>
        </div>

        <button
          onClick={handleGenerateVariations}
          disabled={isProcessing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all hover:scale-105 disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
          {isProcessing ? 'Executando Pipeline FFmpeg...' : 'Exportar 4 Mutações de Vídeo'}
        </button>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Video Selector & Player Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {videoAssets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold shrink-0 transition-all ${
                  selectedAsset.id === asset.id
                    ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                    : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)]'
                }`}
              >
                <img src={asset.thumbnailUrl} alt={asset.title} className="w-8 h-8 rounded-lg object-cover" />
                <span className="truncate max-w-[120px]">{asset.title}</span>
              </button>
            ))}
          </div>

          {/* Player Box */}
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm text-center">
            <div className="relative inline-block max-w-full overflow-hidden rounded-xl bg-black border border-slate-800">
              <video
                src={selectedAsset.url}
                controls
                className="max-h-[380px] rounded-lg"
                style={{
                  filter: `brightness(${100 + options.brightness}%) contrast(${100 + options.contrast}%)`,
                  transform: `scale(${options.zoom}) scaleX(${options.mirror ? -1 : 1})`,
                }}
              />

              {options.subtitleText && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/80 text-yellow-400 font-bold text-xs rounded-lg border border-yellow-400/30">
                  {options.subtitleText}
                </div>
              )}
            </div>

            {/* Generated FFmpeg CLI Command */}
            <div className="p-3 rounded-xl bg-slate-950 text-left space-y-1 font-mono border border-slate-800">
              <div className="text-[10px] text-purple-400 font-bold flex items-center gap-1">
                <Terminal className="w-3 h-3" /> FFmpeg Pipeline Executable Command:
              </div>
              <div className="text-xs text-slate-300 overflow-x-auto whitespace-nowrap">{ffmpegCommand}</div>
            </div>
          </div>
        </div>

        {/* Right: FFmpeg Controls */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <Sliders className="w-4 h-4 text-purple-500" />
            Parâmetros FFmpeg
          </h3>

          <div className="space-y-4 text-xs">
            {/* Speed Multiplier */}
            <div className="space-y-1">
              <div className="flex justify-between font-medium text-[var(--text-secondary)]">
                <span>Velocidade de Reprodução</span>
                <span className="font-mono">{options.speedMultiplier}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.01"
                value={options.speedMultiplier}
                onChange={(e) => setOptions({ ...options, speedMultiplier: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Trim Frame Start/End */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[var(--text-secondary)] font-medium block">Corte Inicial (s)</label>
                <input
                  type="number"
                  step="0.1"
                  value={options.trimStartSec}
                  onChange={(e) => setOptions({ ...options, trimStartSec: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="text-[var(--text-secondary)] font-medium block">Corte Final (s)</label>
                <input
                  type="number"
                  step="0.1"
                  value={options.trimEndSec}
                  onChange={(e) => setOptions({ ...options, trimEndSec: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)]"
                />
              </div>
            </div>

            {/* Subtitle Input */}
            <div className="space-y-1">
              <label className="font-medium text-[var(--text-secondary)] block">Legenda Overlay</label>
              <input
                type="text"
                placeholder="Ex: 🔥 PROMOÇÃO LIMITADA HOJE!"
                value={options.subtitleText || ''}
                onChange={(e) => setOptions({ ...options, subtitleText: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Generated Video Mutations Output */}
      {generatedVariants.length > 0 && (
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Mutações de Vídeo Geradas pelo FFmpeg Pipeline
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {generatedVariants.map((v) => (
              <div key={v.id} className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-2">
                <div className="font-bold text-xs text-[var(--text-primary)]">{v.name}</div>
                <div className="text-[10px] text-purple-400 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                  {v.ffmpegCmd}
                </div>
                <div className="text-[10px] text-emerald-500 font-mono font-bold">Codec H.264 Ready &check;</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
