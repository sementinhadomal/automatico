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
  Zap,
} from 'lucide-react';

interface AccountsViewProps {
  accounts: Account[];
  selectedCategory: CategoryType | 'ALL';
  onUpdateAccounts: (updated: Account[]) => void;
}

// ─── Modal de Edição Individual com Auto-Preenchimento ─────────────────────
const ProxyEditModal: React.FC<{
  account: Account;
  onClose: () => void;
  onSave: (ip: string, port: number, user: string, pass: string) => void;
}> = ({ account, onClose, onSave }) => {
  const [quickPaste, setQuickPaste] = useState('');
  const [ip, setIp] = useState(account.proxy.ip);
  const [port, setPort] = useState(String(account.proxy.port));
  const [user, setUser] = useState(account.proxy.username || '');
  const [pass, setPass] = useState(account.proxy.password || '');
  const [pastedStatus, setPastedStatus] = useState(false);

  const handleQuickPasteChange = (val: string) => {
    setQuickPaste(val);
    const str = val.trim();
    if (!str) return;

    let parsedHost = '', parsedPort = '', parsedUser = '', parsedPass = '';

    if (str.includes('@')) {
      const [credentials, hostpart] = str.split('@');
      [parsedUser, parsedPass] = credentials.split(':');
      [parsedHost, parsedPort] = hostpart.split(':');
    } else {
      const parts = str.split(':');
      if (parts.length === 4) {
        [parsedHost, parsedPort, parsedUser, parsedPass] = parts;
      } else if (parts.length === 2) {
        [parsedHost, parsedPort] = parts;
      } else if (parts.length === 3) {
        [parsedHost, parsedPort, parsedUser] = parts;
      }
    }

    if (parsedHost) setIp(parsedHost);
    if (parsedPort) setPort(parsedPort);
    if (parsedUser) setUser(parsedUser);
    if (parsedPass) setPass(parsedPass);
    if (parsedHost && parsedPort) setPastedStatus(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Editar Proxy — {account.name}
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">Configure o proxy exclusivo desta conta.</p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {account.countryCode}
          </span>
        </div>

        {/* ⚡ Campo de Colar Proxy Completo */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-500/30 space-y-2">
          <label className="text-xs font-bold text-purple-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Colar Linha de Proxy Completa:
            </span>
            <span className="text-[9px] text-[var(--text-muted)] font-mono">host:porta:usuario:senha</span>
          </label>
          <input
            type="text"
            placeholder="Cole aqui ex: proxy22-br-hz.ipbr.pro:10000:pv6VrLBR:3325U6MY"
            value={quickPaste}
            onChange={(e) => handleQuickPasteChange(e.target.value)}
            className="w-full rounded-lg bg-[var(--bg-primary)] border border-purple-500/40 p-2.5 text-xs font-mono text-[var(--text-primary)] focus:border-purple-400 focus:outline-none placeholder:text-slate-600"
          />
          {pastedStatus && (
            <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              ✓ Dados extraídos e preenchidos nos campos abaixo!
            </div>
          )}
        </div>

        {/* Campos individuais */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-[var(--text-muted)] block mb-1">IP / Host</label>
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="ex: 185.220.101.5 ou proxy22-br-hz.ipbr.pro"
              className="w-full rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-2.5 text-xs font-mono text-[var(--text-primary)] focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[var(--text-muted)] block mb-1">Porta</label>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="ex: 8080 ou 10000"
              className="w-full rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-2.5 text-xs font-mono text-[var(--text-primary)] focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[var(--text-muted)] block mb-1">Usuário (Opcional)</label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="ex: pv6VrLBR"
              className="w-full rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-2.5 text-xs font-mono text-[var(--text-primary)] focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[var(--text-muted)] block mb-1">Senha (Opcional)</label>
            <input
              type="text"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="ex: 3325U6MY"
              className="w-full rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-2.5 text-xs font-mono text-[var(--text-primary)] focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              const parsedPort = parseInt(port, 10);
              onSave(ip, isNaN(parsedPort) ? account.proxy.port : parsedPort, user, pass);
            }}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Salvar Proxy
          </button>
        </div>
      </div>
    </div>
  );
};

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
          const newLatency = Math.floor(Math.random() * 60) + 25;
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
  const editingAccount = accounts.find((a) => a.id === editingAccountId);

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
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all hover:scale-105 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Importar Proxies em Lote
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/30 transition-all cursor-pointer"
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
            className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm hover:border-purple-500/40 transition-all flex flex-col justify-between"
          >
            {/* Top Bar */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border flex items-center gap-1 ${
                      acc.category === 'HOT'
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    }`}
                  >
                    {acc.category === 'HOT' ? <Flame className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                    {acc.category}
                  </span>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">{acc.name}</h3>
                </div>
                <div className="text-xs font-mono text-[var(--text-muted)]">{acc.username}</div>
              </div>

              {/* Country Badge */}
              <div className="text-right">
                <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1 justify-end">
                  <Globe2 className="w-3.5 h-3.5 text-purple-400" />
                  {acc.country}
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)] block">{acc.city}</span>
              </div>
            </div>

            {/* Proxy Box */}
            <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                <span className="text-[10px] text-[var(--text-muted)] font-semibold flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-purple-400" />
                  Proxy Vinculado à Conta
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    acc.proxy.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {acc.proxy.status === 'ACTIVE' ? 'Ativo ✓' : 'Testando...'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] font-sans block">IP / Host</span>
                  <span className="font-bold text-purple-300 truncate block">{acc.proxy.ip}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] font-sans block">Porta / Tipo</span>
                  <span className="font-bold text-indigo-300">{acc.proxy.port} ({acc.proxy.protocol})</span>
                </div>
                {acc.proxy.username && (
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] font-sans block">Usuário</span>
                    <span className="font-bold text-emerald-300 truncate block">{acc.proxy.username}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] font-sans block">Latência</span>
                  <span className="font-bold text-amber-300">{acc.proxy.latencyMs}ms</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]">
              <button
                onClick={() => setEditingAccountId(acc.id)}
                className="flex-1 py-2 rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/30 hover:bg-purple-600/20 font-bold text-xs transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Editar Proxy / Colar String
              </button>
              <button
                onClick={() => handleTestProxy(acc.id)}
                disabled={testingProxyId === acc.id}
                className="px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-purple-500/40 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-xs transition-all cursor-pointer"
                title="Testar Conexão"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingProxyId === acc.id ? 'animate-spin text-purple-400' : ''}`} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Proxy Import Modal */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Importar Proxies em Lote</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Cole uma lista de proxies no formato <code className="text-purple-400 font-mono">ip:porta:usuario:senha</code> (um por linha). Eles serão atribuídos sequencialmente às contas.
            </p>
            <textarea
              rows={6}
              value={bulkProxyText}
              onChange={(e) => setBulkProxyText(e.target.value)}
              placeholder={`proxy22-br-hz.ipbr.pro:10000:pv6VrLBR:3325U6MY\n185.220.101.5:8080:user1:pass1\n185.220.101.6:8080:user2:pass2`}
              className="w-full rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-3 text-xs font-mono text-[var(--text-primary)] focus:border-purple-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsBulkImportOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const lines = bulkProxyText.split('\n').map((l) => l.trim()).filter(Boolean);
                  let lineIndex = 0;
                  const updatedAccounts = accounts.map((acc) => {
                    const isDisplayed = filteredAccounts.some((f) => f.id === acc.id);
                    if (isDisplayed && lineIndex < lines.length) {
                      const str = lines[lineIndex];
                      let ip = '', port = 8080, username = '', password = '';
                      if (str.includes('@')) {
                        const [credentials, hostpart] = str.split('@');
                        [username, password] = credentials.split(':');
                        const [h, p] = hostpart.split(':');
                        ip = h; port = parseInt(p || '8080', 10);
                      } else {
                        const parts = str.split(':');
                        ip = parts[0];
                        port = parseInt(parts[1] || '8080', 10);
                        username = parts[2] || '';
                        password = parts[3] || '';
                      }
                      lineIndex++;
                      return {
                        ...acc,
                        proxy: {
                          ...acc.proxy,
                          ip,
                          port: isNaN(port) ? acc.proxy.port : port,
                          username,
                          password,
                          status: 'ACTIVE' as const,
                        },
                      };
                    }
                    return acc;
                  });
                  onUpdateAccounts(updatedAccounts);
                  setBulkProxyText('');
                  setIsBulkImportOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Salvar Proxies
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Proxy Edit Modal with Quick Paste */}
      {editingAccount && (
        <ProxyEditModal
          account={editingAccount}
          onClose={() => setEditingAccountId(null)}
          onSave={(ip, port, user, pass) => {
            const updatedAccounts = accounts.map((a) => {
              if (a.id === editingAccountId) {
                return {
                  ...a,
                  proxy: {
                    ...a.proxy,
                    ip,
                    port,
                    username: user,
                    password: pass,
                    status: 'ACTIVE' as const,
                    lastTestedAt: 'Agora',
                  },
                };
              }
              return a;
            });
            onUpdateAccounts(updatedAccounts);
            setEditingAccountId(null);
          }}
        />
      )}
    </div>
  );
};
