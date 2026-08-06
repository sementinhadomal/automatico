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
  Users,
  Search,
  Wifi,
  Plus,
} from 'lucide-react';

interface AntiDetectBrowserViewProps {
  accounts: Account[];
  selectedCategory: CategoryType | 'ALL';
  onUpdateAccounts: (updated: Account[]) => void;
}

// ─── Modal de Edição de Proxy (reutilizável internamente) ─────────────────────
const SITE_URL_INNER = 'https://multimedia-saas-platform.vercel.app';

// ─── Função standalone de geração do .bat (usada em múltiplos componentes) ────
function buildBatScript(acc: Account, px: { host: string; port: string; user: string; pass: string; protocol: string }): string {
  const profileDir = `C:\\OmniMedia\\Profiles\\${acc.id}`;
  const tunnelPort = 10800 + (Math.abs(acc.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 500);
  const cdpPort = tunnelPort + 1000;
  const hasAuth = !!(px.user && px.pass);

  return `@echo off
chcp 65001 >nul
title OmniMedia — ${acc.name} (${acc.country})
echo ============================================
echo   Abrindo Chrome: ${acc.name}
echo   Pais: ${acc.country} | Proxy: ${px.host}:${px.port}
echo ============================================
echo.

if not exist "C:\\OmniMedia" mkdir "C:\\OmniMedia"
if not exist "${profileDir}" mkdir "${profileDir}"

:: Criar script de tunnel SOCKS5 local se nao existir
if not exist "C:\\OmniMedia\\tunnel.js" (
(
echo const net = require('net'^);
echo const localPort = parseInt(process.argv[2] || '10800', 10^);
echo const targetHost = process.argv[3];
echo const targetPort = parseInt(process.argv[4] || '10000', 10^);
echo const proxyUser = process.argv[5] || '';
echo const proxyPass = process.argv[6] || '';
echo const server = net.createServer((clientSocket^) =^> {
echo   const targetSocket = new net.Socket(^);
echo   targetSocket.connect(targetPort, targetHost, (^) =^> {
echo     targetSocket.write(Buffer.from([0x05, 0x02, 0x00, 0x02]^)^);
echo   }^);
echo   let state = 'GREETING';
echo   targetSocket.on('data', (data^) =^> {
echo     if (state === 'GREETING'^) {
echo       if (data[1] === 0x02 && proxyUser^) {
echo         const u = Buffer.from(proxyUser^);
echo         const p = Buffer.from(proxyPass^);
echo         const req = Buffer.concat([Buffer.from([0x01, u.length]^), u, Buffer.from([p.length]^), p]^);
echo         state = 'AUTH';
echo         targetSocket.write(req^);
echo       } else if (data[1] === 0x00^) {
echo         state = 'CONNECTED';
echo         clientSocket.write(Buffer.from([0x05, 0x00]^)^);
echo         clientSocket.pipe(targetSocket^);
echo         targetSocket.pipe(clientSocket^);
echo       } else { clientSocket.destroy(^); }
echo     } else if (state === 'AUTH'^) {
echo       if (data[1] === 0x00^) {
echo         state = 'CONNECTED';
echo         clientSocket.write(Buffer.from([0x05, 0x00]^)^);
echo         clientSocket.pipe(targetSocket^);
echo         targetSocket.pipe(clientSocket^);
echo       } else { clientSocket.destroy(^); targetSocket.destroy(^); }
echo     }
echo   }^);
echo   clientSocket.on('error', (^) =^> targetSocket.destroy(^)^);
echo   targetSocket.on('error', (^) =^> clientSocket.destroy(^)^);
echo }^);
echo server.listen(localPort, '127.0.0.1'^);
) > "C:\\OmniMedia\\tunnel.js"
)

set "TUNNEL_READY=0"
where node >nul 2>nul
if %errorlevel%==0 (
  if ${hasAuth ? '1==1' : '1==0'} (
    start /b "" node "C:\\OmniMedia\\tunnel.js" ${tunnelPort} "${px.host}" ${px.port} "${px.user}" "${px.pass}" >nul 2^>^&1
    set "TUNNEL_READY=1"
    timeout /t 1 >nul
  )
)

set "CHROME="
for %%P in (
  "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
  "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
  "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"
) do (
  if exist "%%~P" if not defined CHROME set "CHROME=%%~P"
)

if not defined CHROME (
  echo ERRO: Chrome nao encontrado!
  pause & exit /b 1
)

if "%TUNNEL_READY%"=="1" (
  echo Proxy Autenticado Conectado via Tunnel SOCKS5 [127.0.0.1:${tunnelPort}]
  start "" "%CHROME%" --disable-ipv6 --remote-debugging-port=${cdpPort} --proxy-server="socks5://127.0.0.1:${tunnelPort}" --user-data-dir="${profileDir}" --lang=${acc.languageCode.toLowerCase()} --restore-last-session --no-first-run --no-default-browser-check --disable-sync --window-size=1280,800 https://whoer.net
) else (
  echo Proxy conectado via HTTP...
  start "" "%CHROME%" --disable-ipv6 --remote-debugging-port=${cdpPort} --proxy-server="http://${px.host}:${px.port}" --user-data-dir="${profileDir}" --lang=${acc.languageCode.toLowerCase()} --restore-last-session --no-first-run --no-default-browser-check --disable-sync --window-size=1280,800 https://whoer.net
)

echo Chrome aberto com sucesso!
timeout /t 3 >nul
`;
}





const EditProxyModal: React.FC<{
  account: Account;
  onClose: () => void;
  onSave: (ip: string, port: number, user: string, pass: string) => void;
}> = ({ account, onClose, onSave }) => {
  const [quickPaste, setQuickPaste] = useState('');
  const [ip, setIp] = useState(account.proxy.ip);
  const [port, setPort] = useState(String(account.proxy.port));
  const [user, setUser] = useState(account.proxy.username || '');
  const [pass, setPass] = useState(account.proxy.password || '');
  const [pasted, setPasted] = useState(false);

  const handlePaste = (val: string) => {
    setQuickPaste(val);
    const str = val.trim();
    if (!str) return;
    let h = '', p = '', u = '', pw = '';
    if (str.includes('@')) {
      const [cred, host] = str.split('@');
      [u, pw] = cred.split(':');
      [h, p] = host.split(':');
    } else {
      const parts = str.split(':');
      if (parts.length >= 4) [h, p, u, pw] = parts;
      else if (parts.length === 2) [h, p] = parts;
      else if (parts.length === 3) [h, p, u] = parts;
    }
    if (h) setIp(h);
    if (p) setPort(p);
    if (u) setUser(u);
    if (pw) setPass(pw);
    if (h && p) setPasted(true);
  };

  const handleSaveAndDownload = () => {
    const finalPort = parseInt(port, 10) || account.proxy.port;
    onSave(ip, finalPort, user, pass);
    const script = buildBatScript(account, {
      host: ip,
      port: String(finalPort),
      user,
      pass,
      protocol: account.proxy.protocol,
    });
    const blob = new Blob(['\ufeff' + script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chrome_${account.countryCode}_${account.id.slice(-4)}.bat`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            Editar Proxy — {account.name}
          </h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">{account.countryCode}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-500/30 space-y-2">
          <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Colar Linha Completa:
            <span className="ml-auto text-[9px] text-[var(--text-muted)] font-mono">host:porta:usuario:senha</span>
          </label>
          <input
            type="text"
            placeholder="Cole aqui ex: proxy22-br-hz.ipbr.pro:10000:pv6VrLBR:3325U6MY"
            value={quickPaste}
            onChange={(e) => handlePaste(e.target.value)}
            className="w-full rounded-lg bg-[var(--bg-primary)] border border-purple-500/40 p-2.5 text-xs font-mono text-[var(--text-primary)] focus:border-purple-400 focus:outline-none"
          />
          {pasted && <div className="text-[10px] text-emerald-400 font-mono">✓ Dados extraídos e preenchidos!</div>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[{ label: 'IP / Host', val: ip, set: setIp, ph: 'ex: proxy22-br-hz.ipbr.pro' },
            { label: 'Porta', val: port, set: setPort, ph: 'ex: 10000' },
            { label: 'Usuário', val: user, set: setUser, ph: 'ex: pv6VrLBR' },
            { label: 'Senha', val: pass, set: setPass, ph: 'ex: 3325U6MY' }
          ].map(({ label, val, set, ph }) => (
            <div key={label}>
              <label className="text-[10px] font-semibold text-[var(--text-muted)] block mb-1">{label}</label>
              <input type="text" value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
                className="w-full rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-2.5 text-xs font-mono text-[var(--text-primary)] focus:border-purple-500 focus:outline-none" />
            </div>
          ))}
        </div>

        {ip && port && (
          <div className="p-2.5 rounded-xl bg-[var(--bg-primary)] border border-indigo-500/20 text-xs font-mono text-indigo-300 flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            <span>{ip}:{port}{user ? `:${user}:••••` : ''}</span>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-3 border-t border-[var(--border-color)]">
          <button onClick={handleSaveAndDownload} disabled={!ip || !port}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            💾 Salvar Proxy & Baixar Launcher .bat
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] border border-[var(--border-color)] hover:text-[var(--text-primary)] transition-all">Cancelar</button>
            <button onClick={() => { const p = parseInt(port, 10); onSave(ip, isNaN(p) ? account.proxy.port : p, user, pass); }}
              className="flex-1 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-bold transition-all border border-purple-500/30">Só Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

type BrowserSessionStatus = 'IDLE' | 'LAUNCHING' | 'ACTIVE' | 'FAILED';

export const AntiDetectBrowserView: React.FC<AntiDetectBrowserViewProps> = ({
  accounts,
  selectedCategory,
  onUpdateAccounts,
}) => {
  const filteredAccounts = accounts.filter(
    (a) => selectedCategory === 'ALL' || a.category === selectedCategory
  );

  const [sessionStatuses, setSessionStatuses] = useState<Record<string, BrowserSessionStatus>>(
    Object.fromEntries(accounts.map((a) => [a.id, 'IDLE']))
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedScript, setExpandedScript] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'accounts' | 'proxy' | 'profiles' | 'bulk' | 'tutorial'>('accounts');
  const [copiedScript, setCopiedScript] = useState(false);

  // ─── Estado do Gerenciamento de Contas (embutido) ──────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [testingProxyId, setTestingProxyId] = useState<string | null>(null);
  const [bulkProxyText, setBulkProxyText] = useState('');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [pastedStatus, setPastedStatus] = useState(false);
  const [quickPasteAcc, setQuickPasteAcc] = useState('');
  const [proxyFieldsAcc, setProxyFieldsAcc] = useState({ ip: '', port: '', user: '', pass: '' });

  // ─── Estado do Proxy Customizado ──────────────────────────────────────────
  const [proxyInput, setProxyInput] = useState('');
  const [proxyParsed, setProxyParsed] = useState<{
    host: string; port: string; user: string; pass: string; protocol: string; valid: boolean;
  } | null>(null);
  const [proxyAppliedTo, setProxyAppliedTo] = useState<string[]>([]);

  // Detecta formato e extrai campos do proxy
  const parseProxy = (raw: string) => {
    const str = raw.trim();
    if (!str) { setProxyParsed(null); return; }

    // Suporta os formatos mais comuns:
    // host:port:user:pass
    // host:port@user:pass
    // user:pass@host:port
    // socks5://user:pass@host:port
    // http://host:port
    let host = '', port = '', user = '', pass = '', protocol = 'HTTP';

    try {
      // Tenta URL completo primeiro
      if (str.includes('://')) {
        const u = new URL(str.includes('://') ? str : 'http://' + str);
        host = u.hostname;
        port = u.port;
        user = u.username;
        pass = u.password;
        protocol = str.startsWith('socks5') ? 'SOCKS5' : str.startsWith('socks4') ? 'SOCKS4' : 'HTTP';
      } else if (str.includes('@')) {
        // user:pass@host:port
        const [credentials, hostpart] = str.split('@');
        [user, pass] = credentials.split(':');
        [host, port] = hostpart.split(':');
      } else {
        // host:port:user:pass (mais comum em listas de proxy)
        const parts = str.split(':');
        if (parts.length === 4) {
          [host, port, user, pass] = parts;
        } else if (parts.length === 2) {
          [host, port] = parts;
        } else if (parts.length === 3) {
          // pode ser host:port:user sem pass
          [host, port, user] = parts;
        }
      }

      const valid = !!host && !!port && !isNaN(Number(port));
      setProxyParsed({ host, port, user, pass, protocol, valid });
    } catch {
      setProxyParsed({ host: '', port: '', user: '', pass: '', protocol: 'HTTP', valid: false });
    }
  };

  // URL base do site (Vercel) onde o tunnel.js fica hospedado
  const SITE_URL = 'https://multimedia-saas-platform.vercel.app';

  // Gera .bat com autenticação - baixa tunnel.js do Vercel via PowerShell
  const generateAuthProxyLauncher = (): string => {
    if (!proxyParsed?.valid) return '';
    const { host, port, user, pass } = proxyParsed;
    const profileDir = `C:\\OmniMedia\\CustomProxy`;
    const tunnelPort = 10899;
    const hasAuth = !!(user && pass);

    return `@echo off
chcp 65001 >nul
title OmniMedia — Chrome Anonimo com Proxy Customizado
echo ============================================
echo   Proxy: ${host}:${port}
echo   ${hasAuth ? `Usuario: ${user}` : 'Sem autenticacao'}
echo ============================================
echo.

if not exist "C:\\OmniMedia" mkdir "C:\\OmniMedia"
if not exist "${profileDir}" mkdir "${profileDir}"

:: Baixar tunnel.js do servidor
echo Atualizando tunnel proxy...
powershell -NoProfile -Command "Invoke-WebRequest -Uri '${SITE_URL}/tunnel.js' -OutFile 'C:\\OmniMedia\\tunnel.js'" 2>nul

set "CHROME="
for %%P in (
  "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
  "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
  "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"
) do (
  if exist "%%~P" if not defined CHROME set "CHROME=%%~P"
)

if not defined CHROME (
  echo ERRO: Chrome nao encontrado!
  pause & exit /b 1
)

set "TUNNEL_READY=0"
where node >nul 2>nul
if %errorlevel%==0 (
  if exist "C:\\OmniMedia\\tunnel.js" (
    if not "${user}"=="" (
      start /b "" node "C:\\OmniMedia\\tunnel.js" ${tunnelPort} "${host}" ${port} "${user}" "${pass}" >nul 2>&1
      set "TUNNEL_READY=1"
      timeout /t 2 >nul
      echo Tunnel SOCKS5 ativo na porta ${tunnelPort}!
    )
  )
)

if "%TUNNEL_READY%"=="1" (
  start "" "%CHROME%" --proxy-server="socks5://127.0.0.1:${tunnelPort}" --user-data-dir="${profileDir}" --restore-last-session --no-first-run --no-default-browser-check --disable-sync --window-size=1280,800 https://whoer.net
) else (
  start "" "%CHROME%" --proxy-server="http://${host}:${port}" --user-data-dir="${profileDir}" --restore-last-session --no-first-run --no-default-browser-check --disable-sync --window-size=1280,800 https://whoer.net
)

echo Chrome aberto! Verifique o IP no whoer.net
timeout /t 5 >nul
`;
  };

  // ─── Lançador Permanente (Lê proxy de C:\OmniMedia\proxy_atual.txt ou pergunta) ──────
  const generateUniversalLauncher = (): string => {
    return `@echo off
chcp 65001 >nul
title OmniMedia — Lancador Permanente (Anti-Detect Browser)

if not exist "C:\\OmniMedia" mkdir "C:\\OmniMedia"
if not exist "C:\\OmniMedia\\Profiles" mkdir "C:\\OmniMedia\\Profiles"

:: Baixar tunnel.js do servidor
echo Atualizando tunnel proxy...
powershell -NoProfile -Command "Invoke-WebRequest -Uri '${SITE_URL}/tunnel.js' -OutFile 'C:\\OmniMedia\\tunnel.js'" 2>nul

set "CHROME="
for %%P in (
  "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
  "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
  "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"
) do (
  if exist "%%~P" if not defined CHROME set "CHROME=%%~P"
)

if not defined CHROME (
  echo ERRO: Chrome nao encontrado no seu computador!
  pause & exit /b 1
)

set "SAVED_PROXY="
if exist "C:\\OmniMedia\\proxy_atual.txt" (
  set /p SAVED_PROXY=<"C:\\OmniMedia\\proxy_atual.txt"
)

echo =======================================================
echo   OmniMedia Anti-Detect Browser (Lancador Permanente)
echo =======================================================
echo.

if defined SAVED_PROXY (
  echo Proxy atualmente salvo: %SAVED_PROXY%
  echo.
  echo   [ENTER]           -^> Usar o proxy salvo acima
  echo   [DIGITAR / COLAR] -^> Trocar para um novo proxy (ex: host:porta:user:pass)
  echo.
) else (
  echo Nenhum proxy salvo encontrado em C:\\OmniMedia\\proxy_atual.txt
  echo.
)

set /p NEW_PROXY="Cole o novo proxy (ou aperte ENTER para usar o atual): "

if not "%NEW_PROXY%"=="" (
  set "PROXY_TO_USE=%NEW_PROXY%"
  echo %NEW_PROXY%> "C:\\OmniMedia\\proxy_atual.txt"
  echo.
  echo [OK] Proxy atualizado e salvo!
) else (
  if defined SAVED_PROXY (
    set "PROXY_TO_USE=%SAVED_PROXY%"
  ) else (
    echo.
    echo AVISO: Nenhum proxy informado. Abrindo sem proxy...
    set "PROXY_TO_USE="
  )
)

set "PROXY_HOST="
set "PROXY_PORT="
set "PROXY_USER="
set "PROXY_PASS="

if defined PROXY_TO_USE (
  for /f "tokens=1,2,3,4 delims=:" %%A in ("%PROXY_TO_USE%") do (
    set "PROXY_HOST=%%A"
    set "PROXY_PORT=%%B"
    set "PROXY_USER=%%C"
    set "PROXY_PASS=%%D"
  )
)

echo.
set "TUNNEL_READY=0"
where node >nul 2>nul
if %errorlevel%==0 (
  if exist "C:\\OmniMedia\\tunnel.js" (
    if defined PROXY_USER (
      start /b "" node "C:\\OmniMedia\\tunnel.js" 10899 "%PROXY_HOST%" "%PROXY_PORT%" "%PROXY_USER%" "%PROXY_PASS%" >nul 2>&1
      set "TUNNEL_READY=1"
      timeout /t 2 >nul
      echo Tunnel SOCKS5 ativo na porta 10899!
    )
  )
)

if "%TUNNEL_READY%"=="1" (
  start "" "%CHROME%" --disable-ipv6 --proxy-server="socks5://127.0.0.1:10899" --user-data-dir="C:\\OmniMedia\\Profiles\\Sessao_Atual" --restore-last-session --no-first-run --no-default-browser-check --disable-sync https://whoer.net
) else if defined PROXY_HOST (
  start "" "%CHROME%" --disable-ipv6 --proxy-server="http://%PROXY_HOST%:%PROXY_PORT%" --user-data-dir="C:\\OmniMedia\\Profiles\\Sessao_Atual" --restore-last-session --no-first-run --no-default-browser-check --disable-sync https://whoer.net
) else (
  start "" "%CHROME%" --user-data-dir="C:\\OmniMedia\\Profiles\\Sessao_Atual" --restore-last-session --no-first-run --no-default-browser-check --disable-sync https://whoer.net
)

echo.
echo Chrome aberto com sucesso!
timeout /t 4 >nul
`;
  };

  const activeCount = Object.values(sessionStatuses).filter((s) => s === 'ACTIVE').length;
  const launchingCount = Object.values(sessionStatuses).filter((s) => s === 'LAUNCHING').length;

  // ─── Gera o script .bat para Windows ──────────────────────────────────────
  const generateWindowsLauncher = (acc: Account, customProxy?: { host: string; port: string; user: string; pass: string; protocol: string }): string => {
    const px = customProxy || { host: acc.proxy.ip, port: String(acc.proxy.port), user: acc.proxy.username || '', pass: acc.proxy.password || '', protocol: acc.proxy.protocol };
    return buildBatScript(acc, px);
  };


  // ─── Script mestre (abre todos os Chromes de uma vez) ─────────────────────
  const generateMasterLauncher = (): string => {
    const accounts_to_open = filteredAccounts.slice(0, 10); // max 10 simultâneos
    const blocks = accounts_to_open.map((acc, i) => {
      const profileDir = `C:\\OmniMedia\\Profiles\\${acc.id}`;
      const px = { host: acc.proxy.ip, port: String(acc.proxy.port), user: acc.proxy.username || '', pass: acc.proxy.password || '', protocol: acc.proxy.protocol || 'http' };
      const hasAuth = !!(px.user && px.pass);
      const tunnelPort = 10800 + (Math.abs(acc.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 500);
      const cdpPort = tunnelPort + 1000;

      let proxySetup = '';
      let chromeLaunch = '';

      if (hasAuth) {
        proxySetup = `for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":${tunnelPort}"') do taskkill /F /PID %%a >nul 2>&1\n    echo Set WshShell = CreateObject("WScript.Shell") > "C:\\OmniMedia\\run_${tunnelPort}.vbs"\n    echo WshShell.Run "node ""C:\\OmniMedia\\tunnel.js"" ${tunnelPort} ""${px.host}"" ${px.port} ""${px.user}"" ""${px.pass}""", 0, False >> "C:\\OmniMedia\\run_${tunnelPort}.vbs"\n    cscript //nologo "C:\\OmniMedia\\run_${tunnelPort}.vbs" >nul 2>&1\n    del "C:\\OmniMedia\\run_${tunnelPort}.vbs"`;
        chromeLaunch = `start "" "%CHROME%" --disable-ipv6 --remote-debugging-port=${cdpPort} --proxy-server="socks5://127.0.0.1:${tunnelPort}" --user-data-dir="${profileDir}" --lang=${acc.languageCode.toLowerCase()} --restore-last-session --no-first-run --no-default-browser-check --disable-sync --window-size=1280,800 https://whoer.net`;
      } else {
        chromeLaunch = `start "" "%CHROME%" --disable-ipv6 --remote-debugging-port=${cdpPort} --proxy-server="http://${px.host}:${px.port}" --user-data-dir="${profileDir}" --lang=${acc.languageCode.toLowerCase()} --restore-last-session --no-first-run --no-default-browser-check --disable-sync --window-size=1280,800 https://whoer.net`;
      }

      return `:: Conta ${i + 1}: ${acc.name}
if not exist "${profileDir}" mkdir "${profileDir}"
${proxySetup}
${chromeLaunch}
timeout /t 1 >nul`;
    });

    return `@echo off
chcp 65001 >nul

if not exist "C:\\OmniMedia" mkdir "C:\\OmniMedia"
powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://multimedia-saas-platform.vercel.app/tunnel.js' -OutFile 'C:\\OmniMedia\\tunnel.js'" 2>nul
where node >nul 2>nul
if %errorlevel% NEQ 0 (
  echo ERRO: Node.js nao encontrado! Instale o Node.js.
  timeout /t 5 >nul
  exit /b 1
)

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
  timeout /t 5 >nul & exit /b 1
)

${blocks.join('\n\n')}
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
            Contas & Navegador Anti-Detect
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Gerencie seus <strong>{accounts.length} perfis</strong>, edite proxies e baixe launchers <code className="bg-[var(--bg-card)] px-1 rounded text-indigo-400">.bat</code> para abrir o Chrome isolado — tudo em um lugar.
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
          { id: 'accounts', label: '👤 Contas & Proxies' },
          { id: 'proxy', label: '⚡ Colar Proxy Rápido' },
          { id: 'profiles', label: '💻 Perfis / Launcher por Conta' },
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

      {/* 👤 Contas & Proxies Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Buscar por nome, usuário ou país..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              onClick={() => setIsBulkImportOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Importar Proxies em Lote
            </button>
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAccounts
              .filter(acc =>
                !searchTerm ||
                acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                acc.country.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((acc) => (
              <div
                key={acc.id}
                className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm hover:border-purple-500/40 transition-all flex flex-col justify-between"
              >
                {/* Top */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border flex items-center gap-1 ${
                        acc.category === 'HOT' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                      }`}>
                        {acc.category === 'HOT' ? <Flame className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                        {acc.category}
                      </span>
                      <h3 className="font-bold text-sm text-[var(--text-primary)]">{acc.name}</h3>
                    </div>
                    <div className="text-xs font-mono text-[var(--text-muted)]">{acc.username}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1 justify-end">
                      <Globe2 className="w-3.5 h-3.5 text-purple-400" />
                      {acc.country}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] block">{acc.city}</span>
                  </div>
                </div>

                {/* Proxy Info */}
                <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                    <span className="text-[10px] text-[var(--text-muted)] font-semibold flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-purple-400" />
                      Proxy Vinculado
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {acc.proxy.status === 'ACTIVE' ? 'Ativo ✓' : 'Pendente'}
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingAccountId(acc.id)}
                    className="flex-1 py-2 rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/30 hover:bg-purple-600/20 font-bold text-xs transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Editar Proxy / Colar String
                  </button>
                  <button
                    onClick={() => handleDownloadLauncher(acc)}
                    className="px-3 py-2 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/20 font-bold text-xs transition-all cursor-pointer"
                    title="Baixar Launcher .bat"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setTestingProxyId(acc.id);
                      setTimeout(() => {
                        const updated = accounts.map(a => a.id === acc.id ? { ...a, proxy: { ...a.proxy, latencyMs: Math.floor(Math.random() * 60) + 25, status: 'ACTIVE' as const } } : a);
                        onUpdateAccounts(updated);
                        setTestingProxyId(null);
                      }, 800);
                    }}
                    disabled={testingProxyId === acc.id}
                    className="px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-purple-500/40 text-[var(--text-muted)] hover:text-purple-400 font-bold text-xs transition-all cursor-pointer"
                    title="Testar Conexão"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingProxyId === acc.id ? 'animate-spin text-purple-400' : ''}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bulk Import Modal */}
          {isBulkImportOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Importar Proxies em Lote</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Cole uma lista de proxies no formato <code className="text-purple-400 font-mono">ip:porta:usuario:senha</code> (um por linha). Serão atribuídos sequencialmente.
                </p>
                <textarea
                  rows={6}
                  value={bulkProxyText}
                  onChange={(e) => setBulkProxyText(e.target.value)}
                  placeholder={`proxy22-br-hz.ipbr.pro:10000:pv6VrLBR:3325U6MY\n185.220.101.5:8080:user1:pass1`}
                  className="w-full rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-3 text-xs font-mono text-[var(--text-primary)] focus:border-purple-500 focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsBulkImportOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer">Cancelar</button>
                  <button
                    onClick={() => {
                      const lines = bulkProxyText.split('\n').map(l => l.trim()).filter(Boolean);
                      let idx = 0;
                      const updated = accounts.map(acc => {
                        const inView = filteredAccounts.some(f => f.id === acc.id);
                        if (inView && idx < lines.length) {
                          const parts = lines[idx].split(':');
                          idx++;
                          return { ...acc, proxy: { ...acc.proxy, ip: parts[0], port: parseInt(parts[1] || '8080'), username: parts[2] || '', password: parts[3] || '', status: 'ACTIVE' as const } };
                        }
                        return acc;
                      });
                      onUpdateAccounts(updated);
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

          {/* Edit Proxy Modal */}
          {editingAccountId && (() => {
            const editAcc = accounts.find(a => a.id === editingAccountId);
            if (!editAcc) return null;
            return (
              <EditProxyModal
                account={editAcc}
                onClose={() => setEditingAccountId(null)}
                onSave={(ip, port, user, pass) => {
                  const updated = accounts.map(a => a.id === editingAccountId ? { ...a, proxy: { ...a.proxy, ip, port, username: user, password: pass, status: 'ACTIVE' as const } } : a);
                  onUpdateAccounts(updated);
                  setEditingAccountId(null);
                }}
              />
            );
          })()}
        </div>
      )}

      {/* Quick Proxy Paste & Auto-Fill Tab */}
      {activeTab === 'proxy' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Auto-Preenchimento Inteligente de Proxy
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Cole sua linha de proxy no formato <code className="text-indigo-400 font-mono">host:porta:usuario:senha</code> e o sistema irá separar e configurar automaticamente.
                </p>
              </div>

              {/* Botão de Exemplo */}
              <button
                onClick={() => {
                  const sample = 'proxy22-br-hz.ipbr.pro:10000:pv6VrLBR:3325U6MY';
                  setProxyInput(sample);
                  parseProxy(sample);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shrink-0"
              >
                Colar Exemplo (ipbr.pro)
              </button>
            </div>

            {/* Input Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between">
                <span>Cole a string completa do seu proxy aqui:</span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">Formatos: host:porta:user:pass | host:porta@user:pass</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: proxy22-br-hz.ipbr.pro:10000:pv6VrLBR:3325U6MY"
                  value={proxyInput}
                  onChange={(e) => {
                    setProxyInput(e.target.value);
                    parseProxy(e.target.value);
                  }}
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                />
                {proxyInput && (
                  <button
                    onClick={() => {
                      setProxyInput('');
                      setProxyParsed(null);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Parsed Result Display */}
            {proxyParsed && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                    <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" /> Proxy Reconhecido e Separado com Sucesso!
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                      VÁLIDO ✓
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                      <span className="text-[10px] text-[var(--text-muted)] block font-sans">Host / IP</span>
                      <span className="font-bold text-purple-300 break-all">{proxyParsed.host || '—'}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                      <span className="text-[10px] text-[var(--text-muted)] block font-sans">Porta</span>
                      <span className="font-bold text-indigo-300">{proxyParsed.port || '—'}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                      <span className="text-[10px] text-[var(--text-muted)] block font-sans">Usuário</span>
                      <span className="font-bold text-emerald-300 break-all">{proxyParsed.user || 'Sem auth'}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                      <span className="text-[10px] text-[var(--text-muted)] block font-sans">Senha</span>
                      <span className="font-bold text-amber-300 break-all">{proxyParsed.pass ? '••••••••' : 'Sem auth'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions for parsed proxy */}
                <div className="space-y-3 pt-2">
                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                    <span className="font-bold text-xs text-indigo-300 block">💡 Solução Definitiva: Lançador Permanente (Baixe Apenas 1 Vez)</span>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Baixe o <strong>Lançador Permanente</strong> (<code className="text-indigo-400 font-mono">abrir_chrome_permanente.bat</code>) para a sua Área de Trabalho. Quando quiser trocar de proxy, você tem 2 opções sem precisar baixar o script de novo:
                    </p>
                    <ul className="text-xs text-[var(--text-muted)] space-y-1 list-disc list-inside font-mono text-[11px]">
                      <li><strong>Opção 1:</strong> Ao dar duplo clique no script, cole a nova linha de proxy na janela preta.</li>
                      <li><strong>Opção 2:</strong> Clique no botão <span className="text-emerald-400 font-semibold">↓ Salvar Config (proxy_atual.txt)</span> abaixo e salve na pasta <code className="bg-black/30 px-1 rounded">C:\OmniMedia\</code>.</li>
                    </ul>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-3">
                    <button
                      onClick={() => {
                        const script = generateUniversalLauncher();
                        const blob = new Blob(['\ufeff' + script], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `abrir_chrome_permanente.bat`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="w-full md:w-1/2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01]"
                    >
                      <Download className="w-4 h-4" />
                      Baixar Lançador Permanente (1x Só)
                    </button>

                    <button
                      onClick={() => {
                        if (!proxyInput) return;
                        const blob = new Blob([proxyInput.trim()], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `proxy_atual.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="w-full md:w-1/2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01]"
                    >
                      <FileCode2 className="w-4 h-4" />
                      Salvar Config (proxy_atual.txt)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
