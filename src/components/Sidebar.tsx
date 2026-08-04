'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Image as ImageIcon,
  Video as VideoIcon,
  CalendarDays,
  Send,
  History,
  BarChart3,
  TrendingUp,
  FileCode2,
  Terminal,
  Sparkles,
  Monitor,
  Download,
} from 'lucide-react';

export type TabType =
  | 'antidetect_browser'
  | 'dashboard'
  | 'analytics'
  | 'accounts'
  | 'library'
  | 'media_downloader'
  | 'sharp_editor'
  | 'ffmpeg_editor'
  | 'campaigns'
  | 'auto_publisher'
  | 'history'
  | 'reports'
  | 'swagger_api'
  | 'winston_queue';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems: Array<{ id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Análise de Engajamento', icon: TrendingUp, badge: 'PRO' },
    { id: 'antidetect_browser', label: 'Navegadores Anti-Detect', icon: Monitor, badge: 'NEW' },
    { id: 'accounts', label: 'Contas & Proxies', icon: Users, badge: '20' },
    { id: 'library', label: 'Biblioteca Central', icon: FolderKanban },
    { id: 'media_downloader', label: 'Downloader HD por Link', icon: Download, badge: 'HD' },
    { id: 'sharp_editor', label: 'Editor Sharp (Foto)', icon: ImageIcon, badge: 'Auto' },
    { id: 'ffmpeg_editor', label: 'Editor FFmpeg (Vídeo)', icon: VideoIcon, badge: 'Auto' },
    { id: 'campaigns', label: 'Campanhas & Agenda', icon: CalendarDays },
    { id: 'auto_publisher', label: 'Motor de Publicação', icon: Send },
    { id: 'history', label: 'Histórico de Posts', icon: History },
    { id: 'reports', label: 'Relatórios & Métricas', icon: BarChart3 },
    { id: 'swagger_api', label: 'Documentação API REST', icon: FileCode2 },
    { id: 'winston_queue', label: 'Logs Winston & BullMQ', icon: Terminal },
  ];

  return (
    <aside className="w-64 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 shrink-0 transition-colors duration-200 z-20">
      {/* Brand Header */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/20 text-white font-bold text-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-[var(--text-primary)]">OMNIMEDIA</h1>
            <p className="text-[10px] font-mono text-purple-500 uppercase tracking-widest font-semibold">Private SaaS v2.4</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20 font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[var(--text-muted)]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[var(--bg-primary)] text-purple-500 border border-purple-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
        <div className="text-[11px] text-[var(--text-muted)] space-y-1">
          <div className="flex items-center justify-between">
            <span>BullMQ Cluster</span>
            <span className="font-mono text-emerald-500 font-semibold">ONLINE</span>
          </div>
          <div className="flex items-center justify-between">
            <span>S3 Storage</span>
            <span className="font-mono text-indigo-500 font-semibold">24.2 GB</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
