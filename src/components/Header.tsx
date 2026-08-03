'use client';

import React, { useState } from 'react';
import { CategoryType, SystemUser } from '@/types';
import { INITIAL_USERS } from '@/lib/mockData';
import {
  Flame,
  ShoppingBag,
  Layers,
  Moon,
  Sun,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Activity,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  selectedCategory: CategoryType | 'ALL';
  setSelectedCategory: (cat: CategoryType | 'ALL') => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  currentUser: SystemUser;
  setCurrentUser: (user: SystemUser) => void;
  onToggle2FA: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedCategory,
  setSelectedCategory,
  isDarkMode,
  setIsDarkMode,
  currentUser,
  setCurrentUser,
  onToggle2FA,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="h-16 px-6 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors duration-200">
      {/* Category Switcher & Brand Subtitle */}
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border-color)]">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            TODAS (20)
          </button>
          <button
            onClick={() => setSelectedCategory('HOT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'HOT'
                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                : 'text-[var(--text-muted)] hover:text-rose-500'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            HOT (10)
          </button>
          <button
            onClick={() => setSelectedCategory('DROP')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'DROP'
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                : 'text-[var(--text-muted)] hover:text-emerald-500'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
            DROPSHIPPING (10)
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Rede Privada Conectada</span>
        </div>
      </div>

      {/* System Quick Controls */}
      <div className="flex items-center gap-3">
        {/* Server Latency Telemetry */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
          <Activity className="w-3.5 h-3.5 text-indigo-500" />
          <span>Servidor: <strong className="text-[var(--text-primary)]">24ms</strong></span>
        </div>

        {/* 2FA Toggle Button */}
        <button
          onClick={onToggle2FA}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            currentUser.twoFactorEnabled
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
          }`}
          title="Segurança 2FA"
        >
          {currentUser.twoFactorEnabled ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>2FA Ativo</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>2FA Opcional</span>
            </>
          )}
        </button>

        {/* Dark / Light Theme Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] transition-colors"
          title="Alternar Tema"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* User Account Dropdown (Authorized 6 users limit) */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-lg object-cover border border-purple-500/30"
            />
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{currentUser.name}</div>
              <div className="text-[10px] text-purple-500 font-mono font-bold leading-tight">{currentUser.role}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-[var(--border-color)] mb-1">
                <div className="text-xs font-semibold text-[var(--text-primary)]">Usuários Autorizados</div>
                <div className="text-[10px] text-[var(--text-muted)]">Sistema restrito (Máx. 6 usuários)</div>
              </div>
              <div className="space-y-1">
                {INITIAL_USERS.map((usr) => (
                  <button
                    key={usr.id}
                    onClick={() => {
                      setCurrentUser(usr);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
                      currentUser.id === usr.id
                        ? 'bg-purple-500/10 text-purple-500 font-semibold'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                    }`}
                  >
                    <img src={usr.avatar} alt={usr.name} className="w-6 h-6 rounded-md object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs font-medium">{usr.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">{usr.role}</div>
                    </div>
                    {currentUser.id === usr.id && <UserCheck className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
