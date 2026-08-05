'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Account, CategoryType } from '@/types';
import { AntiDetectProfileManager } from '@/lib/antidetect/profile-manager';
import {
  Monitor,
  Play,
  Square,
  Download,
  Copy as CopyIcon,
  Check,
  Globe2,
  ShieldCheck,
  Activity,
  RefreshCw,
  Layers,
  Terminal,
  ExternalLink,
  Flame,
  ShoppingBag,
  Zap,
  FileCode2,
  Info,
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
  const [activeTab, setActiveTab] = useState<'profiles' | 'bulk' | 'tutorial' | 'launcher'>('profiles');
  const [copiedScript, setCopiedScript] = useState(false);

  const activeCount = Object.values(sessionStatuses).filter((s) => s === 'ACTIVE').length;
  const launchingCount = Object.values(sessionStatuses).filter((s) => s === 'LAUNCHING').length;

  // ─── Gera o script .bat para Windows ──────────────────────────────────────
  const generateWindowsLauncher = (acc: Account): string => {
    const profileDir = `C:\\OmniMedia\\Profiles\\${acc.id}`;
    const proxyStr =
      acc.proxy.protocol === 'SOCKS5'
        ? `socks5://${acc.proxy.ip}:${acc.proxy.port}`
        : `${acc.proxy.protocol.toLowerCase()}://${acc.proxy.ip}:${acc.proxy.port}`;

    return `@echo off
chcp 65001 >nul
title OmniMedia — ${acc.name} (${acc.country})
echo ============================================
echo   Abrindo Chrome: ${acc.name}
echo   Pais: ${acc.country} ^| Proxy: ${proxyStr}
echo ============================================
echo.

if not exist "${profileDir}" mkdir "${profileDir}"

set "CHROME="
for %%P in (
  "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
  "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
  "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"
  "%ProgramFiles%\\Chromium\\Application\\chrome.exe"
) do (
  if exist "%%~P" if not defined CHROME set "CHROME=%%~P"
)

if not defined CHROME (
  echo ERRO: Chrome nao encontrado!
  echo Instale o Google Chrome e tente novamente.
  pause
  exit /b 1
)

echo Iniciando Chrome Anonimo com proxy...
start "" "%CHROME%" ^
  --proxy-server="${proxyStr}" ^
  --user-data-dir="${profileDir}" ^
  --lang=${acc.languageCode.toLowerCase()} ^
  --incognito ^
  --no-first-run ^
  --no-default-browser-check ^
  --disable-sync ^
  --disable-translate ^
  --disable-extensions ^
  --window-size=1280,800 ^
  --window-position=100,50 ^
  https://whoer.net

echo Chrome aberto! Feche esta janela se desejar.
timeout /t 3 >nul
`;
  };

  // ─── Script mestre (abre todos os Chromes de uma vez) ─────────────────────
  const generateMasterLauncher = (): string => {
    const accounts_to_open = filteredAccounts.slice(0, 10); // max 10 simultâneos
    const blocks = accounts_to_open.map((acc, i) => {
      const profileDir = `C:\\OmniMedia\\Profiles\\${acc.id}`;
      const proxyStr =
        acc.proxy.protocol === 'SOCKS5'
          ? `socks5://${acc.proxy.ip}:${acc.proxy.port}`
          : `${acc.proxy.protocol.toLowerCase()}://${acc.proxy.ip}:${acc.proxy.port}`;
      return `:: Conta ${i + 1}: ${acc.name}
start "" "%CHROME%" --proxy-server="${proxyStr}" --user-data-dir="${profileDir}" --lang=${acc.languageCode.toLowerCase()} --incognito --no-first-run --no-default-browser-check --disable-sync --window-size=1280,800 https://whoer.net
timeout /t 2 >nul`;
    });

    return `@echo off
chcp 65001 >nul
title OmniMedia — Lançador em Lote (${accounts_to_open.length} contas)
echo Iniciando ${accounts_to_open.length} instâncias do Chrome...
echo.

:: Detectar Chrome
set "CHROME="
for %%P in (
  "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
  "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
  "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"
) do (
  if exist "%%~P" if not defined CHROME set "CHROME=%%~P"
)

if not defined CHROME (
  echo ERRO: Google Chrome nao encontrado!
  pause & exit /b 1
)

:: Criar pastas de perfil
${filteredAccounts.slice(0, 10).map(acc => `if not exist "C:\\OmniMedia\\Profiles\\${acc.id}" mkdir "C:\\OmniMedia\\Profiles\\${acc.id}"`).join('\n')}

:: Abrir cada Chrome com intervalo de 2s
${blocks.join('\n\n')}

echo.
echo Todas as instâncias foram abertas!
pause
`;
  };

  // ─── Download de um launcher individual ───────────────────────────────────
  const handleDownloadLauncher = (acc: Account) => {
    const script = generateWindowsLauncher(acc);
    const blob = new Blob(['\ufeff' + script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chrome_${acc.countryCode}_${acc.id.slice(-4)}.bat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ─── Simula abertura (já que não podemos controlar o PC do browser) ────────
  const handleLaunch = (acc: Account) => {
    setSessionStatuses((prev) => ({ ...prev, [acc.id]: 'LAUNCHING' }));
    // Baixa o launcher e simula sessão ativa
    handleDownloadLauncher(acc);
    setTimeout(() => {
      setSessionStatuses((prev) => ({ ...prev, [acc.id]: 'ACTIVE' }));
    }, 2000);
  };

  const handleStop = (accountId: string) => {
    setSessionStatuses((prev) => ({ ...prev, [accountId]: 'IDLE' }));
  };

  const handleLaunchAll = () => {
    const blob = new Blob(['\ufeff' + generateMasterLauncher()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnimedia_abrir_todos_${filteredAccounts.length}_chromes.bat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Simula status
    filteredAccounts.forEach((acc, i) => {
      setTimeout(() => {
        setSessionStatuses((prev) => ({ ...prev, [acc.id]: 'LAUNCHING' }));
        setTimeout(() => {
          setSessionStatuses((prev) => ({ ...prev, [acc.id]: 'ACTIVE' }));
        }, 2000);
      }, i * 200);
    });
  };

  const handleStopAll = () => {
    setSessionStatuses(Object.fromEntries(accounts.map((a) => [a.id, 'IDLE' as BrowserSessionStatus])));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Script de instrução do launcher
  const setupGuideScript = `:: =====================================================
:: OmniMedia — Script de Setup Inicial (Execute 1x só)
:: =====================================================
@echo off
chcp 65001 >nul
echo Criando estrutura de pastas OmniMedia...
if not exist "C:\\OmniMedia\\Profiles" mkdir "C:\\OmniMedia\\Profiles"
if not exist "C:\\OmniMedia\\Launchers" mkdir "C:\\OmniMedia\\Launchers"
echo Pronto! Agora baixe os launchers individuais e coloque em C:\\OmniMedia\\Launchers\\
echo Dê duplo clique em qualquer .bat para abrir o Chrome com o proxy correto.
pause`;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Monitor className="w-5 h-5 text-indigo-500" />
            Gerenciador de Navegadores Anti-Detect
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Baixe o launcher <code className="bg-[var(--bg-card)] px-1 rounded text-indigo-400">.bat</code> de cada conta e dê <strong>duplo clique</strong> para abrir o Chrome isolado com proxy — sem instalar nada.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLaunchAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all hover:scale-105"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar Launcher de Todos ({filteredAccounts.length})
          </button>
          <button
            onClick={handleStopAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 font-bold text-xs transition-all"
          >
            <Square className="w-3.5 h-3.5" />
            Resetar Status
          </button>
        </div>
      </div>

      {/* ⚠️ Aviso importante */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-300">Como usar o Navegador Anti-Detect</p>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Por limitações de segurança do browser, não é possível abrir programas do computador diretamente por um site. 
            Clique em <span className="text-emerald-400 font-semibold">↓ Baixar Launcher</span> para obter o arquivo <code className="bg-black/30 px-1 rounded">.bat</code> da conta.
            Dê <strong>duplo clique</strong> no arquivo baixado para abrir o Chrome com o proxy configurado.
            Salve os launchers em <code className="bg-black/30 px-1 rounded">C:\OmniMedia\Launchers\</code> para não precisar baixar novamente.
          </p>
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
          <div className="text-xs text-[var(--text-muted)]">Launchers Baixados</div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center">
          <div className="text-2xl font-black text-amber-500 font-mono">{launchingCount}</div>
          <div className="text-xs text-[var(--text-muted)]">Baixando...</div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center">
          <div className="text-2xl font-black text-purple-500 font-mono">{filteredAccounts.length - activeCount}</div>
          <div className="text-xs text-[var(--text-muted)]">Pendentes</div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2 overflow-x-auto">
        {[
          { id: 'profiles', label: 'Perfis por Conta' },
          { id: 'bulk', label: 'Exportar (AdsPower / GoLogin)' },
          { id: 'tutorial', label: 'Como Funciona' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profiles Grid */}
      {activeTab === 'profiles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAccounts.map((acc) => {
            const status = sessionStatuses[acc.id];
            const puppeteerScript = AntiDetectProfileManager.generatePuppeteerLaunchScript(acc);
            const isExpanded = expandedScript === acc.id;

            return (
              <div
                key={acc.id}
                className={`rounded-2xl bg-[var(--bg-card)] border transition-all shadow-sm overflow-hidden ${
                  status === 'ACTIVE'
                    ? 'border-emerald-500/40 shadow-emerald-500/10'
                    : status === 'LAUNCHING'
                    ? 'border-amber-500/40 shadow-amber-500/10 animate-pulse'
                    : 'border-[var(--border-color)]'
                }`}
              >
                {/* Status Strip */}
                <div
                  className={`h-1.5 w-full ${
                    status === 'ACTIVE'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : status === 'LAUNCHING'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : 'bg-[var(--border-color)]'
                  }`}
                />

                <div className="p-5 space-y-4">
                  {/* Header */}
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
                          status === 'ACTIVE' ? 'bg-emerald-500' : status === 'LAUNCHING' ? 'bg-amber-500' : 'bg-slate-500'
                        }`}
                      />
                      {status === 'ACTIVE' ? 'Launcher Baixado ✓' : status === 'LAUNCHING' ? 'Baixando...' : 'Aguardando'}
                    </span>
                  </div>

                  {/* Proxy Info */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs">
                    <div>
                      <span className="text-[var(--text-muted)] text-[10px] block">Proxy</span>
                      <span className="font-mono font-bold text-purple-400">{acc.proxy.ip}:{acc.proxy.port}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] text-[10px] block">Protocolo</span>
                      <span className="font-mono font-bold text-indigo-400">{acc.proxy.protocol}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] text-[10px] block">Fingerprint</span>
                      <span className="font-mono font-bold text-emerald-400">{acc.languageCode} / {acc.timezone.split('/')[1] || acc.timezone}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] text-[10px] block">Latência</span>
                      <span className="font-mono font-bold text-amber-400">{acc.proxy.latencyMs}ms</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {status !== 'LAUNCHING' && (
                      <button
                        onClick={() => handleLaunch(acc)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all hover:scale-[1.02] ${
                          status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/30'
                        }`}
                        title="Baixa o arquivo .bat — dê duplo clique para abrir o Chrome com proxy"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {status === 'ACTIVE' ? '↓ Baixar Novamente' : '↓ Baixar Launcher .bat'}
                      </button>
                    )}

                    {status === 'LAUNCHING' && (
                      <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Preparando launcher...
                      </div>
                    )}

                    {status === 'ACTIVE' && (
                      <button
                        onClick={() => handleStop(acc.id)}
                        className="px-3 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 font-bold text-xs transition-all"
                        title="Marcar como inativo"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedScript(isExpanded ? null : acc.id)}
                      className="px-3 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-indigo-500/40 text-[var(--text-muted)] hover:text-indigo-400 font-bold text-xs transition-all"
                      title="Ver script Puppeteer"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Dica quando já baixou */}
                  {status === 'ACTIVE' && (
                    <div className="text-[10px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-3 py-2 font-mono">
                      ✅ Dê <strong>duplo clique</strong> no arquivo <code>chrome_{acc.countryCode}_{acc.id.slice(-4)}.bat</code> para abrir o Chrome com proxy.
                    </div>
                  )}

                  {/* Script Viewer */}
                  {isExpanded && (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-muted)] font-semibold">Script Puppeteer Stealth</span>
                        <button
                          onClick={() => handleCopy(acc.id, puppeteerScript)}
                          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          {copiedId === acc.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5" />}
                          {copiedId === acc.id ? 'Copiado!' : 'Copiar'}
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
              {/* AdsPower */}
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-3">
                <div className="font-bold text-sm text-[var(--text-primary)]">AdsPower</div>
                <p className="text-xs text-[var(--text-secondary)]">JSON formatado para importar todos os perfis no AdsPower via API ou arquivo de importação em lote.</p>
                <button
                  onClick={() => {
                    const data = filteredAccounts.map((acc) => AntiDetectProfileManager.generateAdsPowerApiJson(acc));
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'adspower_profiles.json'; a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar JSON AdsPower ({filteredAccounts.length} perfis)
                </button>
              </div>

              {/* GoLogin */}
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-3">
                <div className="font-bold text-sm text-[var(--text-primary)]">GoLogin</div>
                <p className="text-xs text-[var(--text-secondary)]">Perfis no formato GoLogin para importação e automação com fingerprints únicos por conta.</p>
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
                    a.href = url; a.download = 'gologin_profiles.json'; a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar JSON GoLogin ({filteredAccounts.length} perfis)
                </button>
              </div>

              {/* Puppeteer */}
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-3">
                <div className="font-bold text-sm text-[var(--text-primary)]">Scripts .bat (Todos)</div>
                <p className="text-xs text-[var(--text-secondary)]">Baixa um único <code>.bat</code> mestre que abre todos os Chromes com proxy, um por vez com intervalo de 2s.</p>
                <button
                  onClick={handleLaunchAll}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar Launcher Mestre ({filteredAccounts.length} contas)
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
            Como usar o Navegador Anti-Detect
          </h3>

          <div className="space-y-3">
            {[
              {
                step: '1',
                title: 'Baixe o Launcher da conta',
                desc: 'Clique em "↓ Baixar Launcher .bat" no card da conta desejada. Um arquivo .bat será baixado para a pasta Downloads do seu PC.',
                color: 'indigo',
              },
              {
                step: '2',
                title: 'Salve em C:\\OmniMedia\\Launchers\\ (opcional)',
                desc: 'Para não precisar baixar toda vez, mova o arquivo .bat para C:\\OmniMedia\\Launchers\\ e use o atalho sempre que quiser abrir aquele Chrome.',
                color: 'purple',
              },
              {
                step: '3',
                title: 'Duplo clique no arquivo .bat',
                desc: 'Dê duplo clique no arquivo baixado. O Chrome abrirá automaticamente com o proxy da conta configurado, perfil isolado e fingerprint exclusivo.',
                color: 'emerald',
              },
              {
                step: '4',
                title: 'Chrome abre no whoer.net',
                desc: 'O Chrome abre direto no whoer.net para você confirmar que o proxy está ativo e o IP correto está sendo exibido.',
                color: 'amber',
              },
              {
                step: '5',
                title: 'Para abrir múltiplos — use o Launcher Mestre',
                desc: 'Na aba "Exportar", clique em "Baixar Launcher Mestre" para ter um único .bat que abre todos os Chromes de uma vez com intervalo de 2 segundos entre cada um.',
                color: 'rose',
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black font-mono shrink-0 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30`}>
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
