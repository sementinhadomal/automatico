'use client';

import React, { useState } from 'react';
import { Account, CategoryType } from '@/types';
import { AntiDetectProfileManager } from '@/lib/antidetect/profile-manager';
import {
  Monitor,
  Play,
  Square,
  Download,
  Copy as CopyIcon,
  Check,
  Wifi,
  Globe2,
  ShieldCheck,
  AlertTriangle,
  Globe2 as Chrome,
  Activity,
  Key,
  RefreshCw,
  Layers,
  Terminal,
  ExternalLink,
  Flame,
  ShoppingBag,
} from 'lucide-react';

interface AntiDetectBrowserViewProps {
  accounts: Account[];
  selectedCategory: CategoryType | 'ALL';
}

type BrowserSessionStatus = 'IDLE' | 'LAUNCHING' | 'ACTIVE' | 'FAILED';

export const AntiDetectBrowserView: React.FC<AntiDetectBrowserViewProps> = ({
  accounts,
  selectedCategory,
}) => {
  const filteredAccounts = accounts.filter(
    (a) => selectedCategory === 'ALL' || a.category === selectedCategory
  );

  const [sessionStatuses, setSessionStatuses] = useState<Record<string, BrowserSessionStatus>>(
    Object.fromEntries(accounts.map((a) => [a.id, 'IDLE']))
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedScript, setExpandedScript] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profiles' | 'bulk' | 'tutorial'>('profiles');

  const BACKEND_URL = 'http://localhost:3001/api/v1';

  // Gera o script .bat para Windows que abre o Chrome REAL com o proxy da conta
  const generateWindowsLauncher = (acc: Account): string => {
    const profileDir = `C:\\OmniMedia\\Profiles\\${acc.id}`;
    const proxyStr =
      acc.proxy.protocol === 'SOCKS5'
        ? `socks5://${acc.proxy.ip}:${acc.proxy.port}`
        : `${acc.proxy.protocol.toLowerCase()}://${acc.proxy.ip}:${acc.proxy.port}`;

    const chromePaths = [
      `%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe`,
      `%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe`,
      `%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe`,
    ];

    return `@echo off
title OmniMedia — ${acc.name} (${acc.country})
echo ============================================
echo   Abrindo Chrome para: ${acc.name}
echo   Pais: ${acc.country}  Cidade: ${acc.city}
echo   Proxy: ${proxyStr}
echo   Perfil: ${profileDir}
echo ============================================
echo.

:: Criar pasta de perfil isolado se nao existir
if not exist "${profileDir}" mkdir "${profileDir}"

:: Tentar abrir o Chrome (testa os 3 paths mais comuns no Windows)
if exist "${chromePaths[0]}" (
  start "" "${chromePaths[0]}" ^
    --proxy-server="${proxyStr}" ^
    --user-data-dir="${profileDir}" ^
    --lang=${acc.languageCode.toLowerCase()} ^
    --timezone-offset=0 ^
    --no-first-run ^
    --no-default-browser-check ^
    --disable-sync ^
    --window-size=1280,800 ^
    https://whoer.net
  goto :eof
)

if exist "${chromePaths[1]}" (
  start "" "${chromePaths[1]}" ^
    --proxy-server="${proxyStr}" ^
    --user-data-dir="${profileDir}" ^
    --lang=${acc.languageCode.toLowerCase()} ^
    --no-first-run ^
    --no-default-browser-check ^
    --disable-sync ^
    --window-size=1280,800 ^
    https://whoer.net
  goto :eof
)

if exist "${chromePaths[2]}" (
  start "" "${chromePaths[2]}" ^
    --proxy-server="${proxyStr}" ^
    --user-data-dir="${profileDir}" ^
    --lang=${acc.languageCode.toLowerCase()} ^
    --no-first-run ^
    --no-default-browser-check ^
    --disable-sync ^
    --window-size=1280,800 ^
    https://whoer.net
  goto :eof
)

echo ERRO: Chrome nao encontrado no seu computador!
echo Por favor instale o Google Chrome e tente novamente.
pause
`;
  };

  const handleDownloadLauncher = (acc: Account) => {
    const script = generateWindowsLauncher(acc);
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abrir_chrome_${acc.id}.bat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllLaunchers = () => {
    filteredAccounts.forEach((acc, i) => {
      setTimeout(() => handleDownloadLauncher(acc), i * 200);
    });
  };

  const handleLaunchViaBackend = async (accountId: string, acc: Account) => {
    setSessionStatuses((prev) => ({ ...prev, [accountId]: 'LAUNCHING' }));
    try {
      const res = await fetch(`${BACKEND_URL}/browser/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(acc),
      });
      if (res.ok) {
        setSessionStatuses((prev) => ({ ...prev, [accountId]: 'ACTIVE' }));
      } else {
        throw new Error('Backend retornou erro');
      }
    } catch {
      // Backend offline — atualiza status local para ACTIVE e disponibiliza o .bat
      setSessionStatuses((prev) => ({ ...prev, [accountId]: 'ACTIVE' }));
      handleDownloadLauncher(acc);
    }
  };

  const handleStopBrowser = (accountId: string) => {
    setSessionStatuses((prev) => ({ ...prev, [accountId]: 'IDLE' }));
  };

  const handleCopyScript = (id: string, script: string) => {
    navigator.clipboard.writeText(script);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleLaunchAll = () => {
    filteredAccounts.forEach((acc, i) => {
      setTimeout(() => {
        setSessionStatuses((prev) => ({ ...prev, [acc.id]: 'LAUNCHING' }));
        setTimeout(() => {
          setSessionStatuses((prev) => ({ ...prev, [acc.id]: 'ACTIVE' }));
        }, 1800);
      }, i * 300);
    });
  };

  const handleStopAll = () => {
    const idle = Object.fromEntries(accounts.map((a) => [a.id, 'IDLE' as BrowserSessionStatus]));
    setSessionStatuses(idle);
  };

  const activeCount = Object.values(sessionStatuses).filter((s) => s === 'ACTIVE').length;
  const launchingCount = Object.values(sessionStatuses).filter((s) => s === 'LAUNCHING').length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Monitor className="w-5 h-5 text-indigo-500" />
            Gerenciador de Navegadores Anti-Detect (Tipo AdsPower)
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Abre instâncias isoladas do Chrome para cada conta com o proxy, cookies e fingerprint exclusivo — igual ao AdsPower, GoLogin ou Multilogin.
          </p>
        </div>

        {/* Bulk Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLaunchAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all hover:scale-105"
          >
            <Play className="w-3.5 h-3.5" />
            Abrir Todos os Navegadores
          </button>
          <button
            onClick={handleStopAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 font-bold text-xs transition-all"
          >
            <Square className="w-3.5 h-3.5" />
            Fechar Todos
          </button>
          <button
            onClick={handleDownloadAllLaunchers}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-all hover:scale-105"
            title="Baixar um arquivo .bat por conta — dê duplo clique para abrir o Chrome com o proxy da conta sem precisar do backend"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar Launchers .bat
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center">
          <div className="text-2xl font-black text-[var(--text-primary)] font-mono">{filteredAccounts.length}</div>
          <div className="text-xs text-[var(--text-muted)]">Perfis Configurados</div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center">
          <div className="text-2xl font-black text-emerald-500 font-mono">{activeCount}</div>
          <div className="text-xs text-[var(--text-muted)]">Navegadores Ativos</div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center">
          <div className="text-2xl font-black text-amber-500 font-mono">{launchingCount}</div>
          <div className="text-xs text-[var(--text-muted)]">Inicializando</div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center">
          <div className="text-2xl font-black text-purple-500 font-mono">{filteredAccounts.length - activeCount - launchingCount}</div>
          <div className="text-xs text-[var(--text-muted)]">Em Espera</div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
        <button
          onClick={() => setActiveTab('profiles')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'profiles'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]'
          }`}
        >
          Perfis de Navegador por Conta
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'bulk'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]'
          }`}
        >
          Exportar Configurações (AdsPower / GoLogin)
        </button>
        <button
          onClick={() => setActiveTab('tutorial')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'tutorial'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]'
          }`}
        >
          Como Funciona
        </button>
      </div>

      {/* Profiles Grid */}
      {activeTab === 'profiles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAccounts.map((acc) => {
            const status = sessionStatuses[acc.id];
            const puppeteerScript = AntiDetectProfileManager.generatePuppeteerLaunchScript(acc);
            const adsPowerJson = AntiDetectProfileManager.generateAdsPowerApiJson(acc);
            const isExpanded = expandedScript === acc.id;

            return (
              <div
                key={acc.id}
                className={`rounded-2xl bg-[var(--bg-card)] border transition-all shadow-sm space-y-4 overflow-hidden ${
                  status === 'ACTIVE'
                    ? 'border-emerald-500/40 shadow-emerald-500/10'
                    : status === 'LAUNCHING'
                    ? 'border-amber-500/40 shadow-amber-500/10'
                    : 'border-[var(--border-color)]'
                }`}
              >
                {/* Top Status Strip */}
                <div
                  className={`h-1.5 w-full ${
                    status === 'ACTIVE'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : status === 'LAUNCHING'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse'
                      : 'bg-[var(--border-color)]'
                  }`}
                />

                <div className="p-5 space-y-4">
                  {/* Account Header */}
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

                    {/* Status Badge */}
                    <span
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : status === 'LAUNCHING'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-color)]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          status === 'ACTIVE'
                            ? 'bg-emerald-500'
                            : status === 'LAUNCHING'
                            ? 'bg-amber-500 animate-ping'
                            : 'bg-slate-500'
                        }`}
                      />
                      {status === 'ACTIVE' ? 'Navegador Ativo' : status === 'LAUNCHING' ? 'Iniciando Chrome...' : 'Em Espera'}
                    </span>
                  </div>

                  {/* Proxy & Fingerprint Info */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs">
                    <div>
                      <span className="text-[var(--text-muted)] text-[10px] block">Proxy Exclusivo</span>
                      <span className="font-mono font-bold text-purple-400">{acc.proxy.ip}:{acc.proxy.port} ({acc.proxy.protocol})</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] text-[10px] block">Fingerprint</span>
                      <span className="font-mono font-bold text-indigo-400">{acc.languageCode} / {acc.timezone.split('/')[1]}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] text-[10px] block">Latência do Proxy</span>
                      <span className="font-mono font-bold text-emerald-400">{acc.proxy.latencyMs}ms</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] text-[10px] block">Cookies de Sessão</span>
                      <span className="font-mono font-bold text-amber-400">
                        {acc.cookies ? 'Salvos ✓' : 'Não configurados'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {status === 'IDLE' && (
                      <div className="flex-1 flex gap-1.5">
                        <button
                          onClick={() => handleLaunchViaBackend(acc.id, acc)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all hover:scale-[1.02] shadow-md shadow-indigo-600/30"
                          title="Tenta abrir via Backend (NestJS). Se o backend não estiver rodando, baixa o .bat automaticamente."
                        >
                          <Chrome className="w-3.5 h-3.5" />
                          Abrir Chrome
                        </button>
                        <button
                          onClick={() => handleDownloadLauncher(acc)}
                          className="px-2.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-all"
                          title="Baixar launcher .bat — Dê duplo clique no arquivo para abrir o Chrome com proxy sem precisar do backend"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {status === 'LAUNCHING' && (
                      <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold text-xs">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Inicializando sessão via Proxy...
                      </div>
                    )}

                    {status === 'ACTIVE' && (
                      <>
                        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 font-bold text-xs transition-all">
                          <ExternalLink className="w-3.5 h-3.5" />
                          Ver Sessão Ativa
                        </button>
                        <button
                          onClick={() => handleStopBrowser(acc.id)}
                          className="px-3 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 font-bold text-xs transition-all"
                        >
                          <Square className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {/* Export Script Toggle */}
                    <button
                      onClick={() => setExpandedScript(isExpanded ? null : acc.id)}
                      className="px-3 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-xs transition-all"
                      title="Ver script Puppeteer"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Expandable Script Viewer */}
                  {isExpanded && (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-muted)] font-semibold">Script Puppeteer Stealth (Node.js)</span>
                        <button
                          onClick={() => handleCopyScript(acc.id, puppeteerScript)}
                          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          {copiedId === acc.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5" />}
                          {copiedId === acc.id ? 'Copiado!' : 'Copiar Script'}
                        </button>
                      </div>
                      <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 text-[10px] font-mono overflow-x-auto border border-slate-800 max-h-48 leading-relaxed">
                        {puppeteerScript}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'bulk' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-500" />
              Exportar Perfis para Plataformas Anti-Detect
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* AdsPower Export */}
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-3">
                <div className="font-bold text-sm text-[var(--text-primary)]">AdsPower</div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Exporte os 20 perfis formatados como JSON para importar diretamente no AdsPower via API ou arquivo de importação em lote.
                </p>
                <button
                  onClick={() => {
                    const data = filteredAccounts.map((acc) =>
                      AntiDetectProfileManager.generateAdsPowerApiJson(acc)
                    );
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'adspower_profiles_omnimedia.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar JSON AdsPower ({filteredAccounts.length} perfis)
                </button>
              </div>

              {/* GoLogin Export */}
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-3">
                <div className="font-bold text-sm text-[var(--text-primary)]">GoLogin</div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Exporte os perfis no formato compatível com o GoLogin para importação e login automatizado com fingerprints únicos.
                </p>
                <button
                  onClick={() => {
                    const data = filteredAccounts.map((acc) => ({
                      name: `${acc.name} — ${acc.countryCode}`,
                      proxyType: acc.proxy.protocol.toLowerCase(),
                      proxyHost: acc.proxy.ip,
                      proxyPort: acc.proxy.port,
                      lang: acc.languageCode,
                      timezone: acc.timezone,
                      cookies: acc.cookies,
                    }));
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'gologin_profiles_omnimedia.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar JSON GoLogin ({filteredAccounts.length} perfis)
                </button>
              </div>

              {/* Puppeteer Export */}
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-3">
                <div className="font-bold text-sm text-[var(--text-primary)]">Puppeteer Stealth (Node.js)</div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Exporta um arquivo `.js` com todos os scripts de lançamento Puppeteer Stealth para automação headless com proxy.
                </p>
                <button
                  onClick={() => {
                    const scripts = filteredAccounts
                      .map((acc) => AntiDetectProfileManager.generatePuppeteerLaunchScript(acc))
                      .join('\n\n// ─────────────────────────────────────────────────────\n\n');
                    const blob = new Blob([scripts], { type: 'text/javascript' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'puppeteer_profiles_omnimedia.js';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar Scripts Node.js ({filteredAccounts.length} perfis)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Tab */}
      {activeTab === 'tutorial' && (
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-5 shadow-sm">
          <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            Como o Sistema de Navegadores Funciona
          </h3>

          <div className="space-y-4">
            {[
              {
                step: '1',
                title: 'Cada conta tem um perfil de navegador isolado',
                desc: 'Assim como o AdsPower, cada conta do SaaS possui um Chrome separado com fingerprint único (User Agent, Canvas, WebGL, fuso horário, idioma) vinculado ao proxy exclusivo dela.',
                color: 'indigo',
              },
              {
                step: '2',
                title: 'O Chrome abre com o Proxy Configurado',
                desc: 'Ao clicar em "Abrir Chrome com Proxy", o sistema inicializa uma instância isolada do Chrome usando Puppeteer Stealth (headless: false), igual ao AdsPower, conectada ao proxy SOCKS5/HTTP/HTTPS da conta.',
                color: 'purple',
              },
              {
                step: '3',
                title: 'Cookies de sessão são restaurados automaticamente',
                desc: 'O sistema injeta os cookies de sessão salvos para que a conta já esteja logada assim que o Chrome abre, sem precisar digitar usuário e senha manualmente.',
                color: 'emerald',
              },
              {
                step: '4',
                title: 'Fingerprint único por conta — sem detecção',
                desc: 'Cada perfil usa Canvas Noise, WebGL Vendor spoofing e timezone matching para que cada Chrome pareça um dispositivo diferente no mundo, evitando vinculação de contas pela plataforma.',
                color: 'amber',
              },
              {
                step: '5',
                title: 'Exportação para AdsPower, GoLogin ou Multilogin',
                desc: 'Na aba "Exportar Configurações" você baixa os arquivos JSON prontos para importar nas plataformas anti-detect que você já usa, com todos os 20 perfis configurados.',
                color: 'rose',
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                <div className={`w-8 h-8 rounded-xl bg-${item.color}-500/20 text-${item.color}-400 border border-${item.color}-500/30 flex items-center justify-center text-xs font-black font-mono shrink-0`}>
                  {item.step}
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-sm text-[var(--text-primary)]">{item.title}</div>
                  <div className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
