'use client';

import React, { useState } from 'react';
import { Account, CategoryType } from '@/types';
import {
  Users,
  Search,
  Globe2,
  ShieldCheck,
  Activity,
  Plus,
  Flame,
  ShoppingBag,
  Clock,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Wifi,
  RefreshCw,
} from 'lucide-react';

interface AccountsViewProps {
  accounts: Account[];
  selectedCategory: CategoryType | 'ALL';
  onUpdateAccounts: (updated: Account[]) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  selectedCategory,
  onUpdateAccounts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkProxyText, setBulkProxyText] = useState('');
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [testingProxyId, setTestingProxyId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredAccounts = accounts.filter((acc) => {
    const matchesCat = selectedCategory === 'ALL' || acc.category === selectedCategory;
    const matchesCountry = countryFilter === 'ALL' || acc.country === countryFilter;
    const matchesSearch =
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.country.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesCountry && matchesSearch;
  });

  const handleTestProxy = (accountId: string) => {
    setTestingProxyId(accountId);

    setTimeout(() => {
      const updated = accounts.map((acc) => {
        if (acc.id === accountId) {
          const newLatency = Math.floor(Math.random() * 60) + 25; // 25ms to 85ms
          return {
            ...acc,
            proxy: {
              ...acc.proxy,
              latencyMs: newLatency,
              status: 'ACTIVE' as const,
              lastTestedAt: 'Just now',
            },
          };
        }
        return acc;
      });

      onUpdateAccounts(updated);
      setTestingProxyId(null);
    }, 600);
  };

  const countries = Array.from(new Set(accounts.map((a) => a.country)));

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            Gerenciamento de Contas & Proxies Exclusivos
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Controle de 20 contas ativas ({accounts.filter((a) => a.category === 'HOT').length} HOT,{' '}
            {accounts.filter((a) => a.category === 'DROP').length} DROPSHIPPING) preparadas para escalabilidade.
          </p>
          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => {
                setIsTestingAll(true);
                setTimeout(() => setIsTestingAll(false), 2000);
              }}
              disabled={isTestingAll}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/20 font-bold text-xs transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingAll ? 'animate-spin' : ''}`} />
              {isTestingAll ? 'Testando 20 Proxies...' : 'Testar Conexão dos 20 Proxies'}
            </button>

            <button
              onClick={() => setIsBulkImportOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all hover:scale-105"
            >
              <Plus className="w-3.5 h-3.5" />
              Importar Proxies em Lote
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Adicionar Nova Conta
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar por nome, usuário ou país..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Country Filter */}
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-[var(--text-muted)]" />
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">Todos os Países ({countries.length})</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAccounts.map((acc) => (
          <div
            key={acc.id}
            className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-purple-500/40 transition-all space-y-4 shadow-sm"
          >
            {/* Top Bar: Category badge, Name, Username & Online Status */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                      acc.category === 'HOT'
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    }`}
                  >
                    {acc.category === 'HOT' ? (
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3" /> HOT
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" /> DROP
                      </span>
                    )}
                  </span>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">{acc.name}</h3>
                </div>
                <div className="text-xs font-mono text-[var(--text-muted)]">{acc.username}</div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {acc.status}
              </span>
            </div>

            {/* Regional Metadata Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">País & Idioma</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {acc.country} ({acc.languageCode})
                </span>
              </div>

              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">Fuso Horário & Cidade</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {acc.city}, {acc.timezone}
                </span>
              </div>

              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">Moeda & Formatos</span>
                <span className="font-mono text-[var(--text-secondary)]">
                  {acc.currency} | {acc.dateFormat} {acc.timeFormat}
                </span>
              </div>

              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">Última Publicação</span>
                <span className="font-mono text-[var(--text-secondary)]">{acc.lastPublication}</span>
              </div>
            </div>

            {/* Proxy Diagnostic Box */}
            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-purple-400">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Proxy Exclusivo ({acc.proxy.protocol})</span>
                </div>

                <button
                  onClick={() => handleTestProxy(acc.id)}
                  disabled={testingProxyId === acc.id}
                  className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300 underline disabled:opacity-50"
                >
                  <Activity className={`w-3 h-3 ${testingProxyId === acc.id ? 'animate-spin' : ''}`} />
                  {testingProxyId === acc.id ? 'Testando...' : 'Testar Conexão'}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--text-secondary)]">{acc.proxy.ip}:{acc.proxy.port}</span>
                <span className="text-emerald-500 font-bold">
                  Latência: {acc.proxy.latencyMs}ms
                </span>
              </div>
            </div>

            {/* Bottom Stats */}
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-color)]">
              <span>Publicações: <strong className="text-[var(--text-primary)] font-mono">{acc.publishedCount}</strong></span>
              <span>Erros: <strong className="text-rose-500 font-mono">{acc.errorCount}</strong></span>
              <span className="font-mono text-[10px]">Cookies Salvos &check;</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
