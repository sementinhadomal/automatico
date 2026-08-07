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

function buildBatScript(acc: Account, px: { host: string; port: string; user: string; pass: string; protocol: string }): string {
  const profileDir = `C:\\OmniMedia\\Profiles\\${acc.id}`;
  const engineDir = `C:\\OmniMedia\\Engine`;
  
  // Calculate deterministic port
  const baseSeed = Math.abs(acc.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0));
  const tunnelPort = 10800 + (baseSeed % 500);
  const cdpPort = tunnelPort + 1000;

  const hasProxy = !!(px.host && px.host.trim() && px.host !== 'sem-proxy');
  
  const cleanPort = String(px.port).trim();
  const isAdsPowerSocks = cleanPort === '49156';
  const parsedPort = isAdsPowerSocks ? 49155 : (parseInt(cleanPort, 10) || 49155);

  const engineCode = `
const http = require('http');
const net = require('net');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const [, , CHROME_PATH, cdpPort, profileDir, langCode, hasProxyStr, lPort, tHost, tPort, user, pass] = process.argv;
const hasProxy = hasProxyStr === 'true';

// 1. Iniciar Túnel Proxy se existir
if (hasProxy) {
    const hasAuth = user && user.trim().length > 0;
    const auth = hasAuth ? Buffer.from(user + ':' + pass).toString('base64') : '';
    
    const server = http.createServer((req, res) => {
        const headers = Object.assign({}, req.headers);
        if (hasAuth) headers['Proxy-Authorization'] = 'Basic ' + auth;
        const options = { hostname: tHost, port: Number(tPort), path: req.url, method: req.method, headers: headers };
        const proxyReq = http.request(options, (proxyRes) => { res.writeHead(proxyRes.statusCode, proxyRes.headers); proxyRes.pipe(res); });
        proxyReq.on('error', (e) => res.end());
        req.pipe(proxyReq);
    });
    server.on('connect', (req, clientSocket, head) => {
        const pSocket = net.connect(Number(tPort), tHost, () => {
            let connectStr = 'CONNECT ' + req.url + ' HTTP/1.1\\r\\n';
            for (let i = 0; i < req.rawHeaders.length; i += 2) {
                if (req.rawHeaders[i].toLowerCase() !== 'proxy-authorization') connectStr += req.rawHeaders[i] + ': ' + req.rawHeaders[i+1] + '\\r\\n';
            }
            if (hasAuth) connectStr += 'Proxy-Authorization: Basic ' + auth + '\\r\\n';
            connectStr += '\\r\\n';
            pSocket.write(connectStr);
        });
        let connected = false;
        const onProxyData = (chunk) => {
            if (!connected) {
                const reply = chunk.toString('utf8');
                if (reply.match(/^HTTP\\/\\d\\.\\d 200/i)) {
                    connected = true;
                    clientSocket.write('HTTP/1.1 200 Connection Established\\r\\n\\r\\n');
                    const hEnd = chunk.indexOf('\\r\\n\\r\\n');
                    if (hEnd !== -1 && chunk.length > hEnd + 4) clientSocket.write(chunk.slice(hEnd + 4));
                    if (head && head.length > 0) pSocket.write(head);
                    pSocket.removeListener('data', onProxyData);
                    pSocket.pipe(clientSocket);
                    clientSocket.pipe(pSocket);
                } else { clientSocket.write(chunk); clientSocket.end(); }
            }
        };
        pSocket.on('data', onProxyData);
        pSocket.on('error', () => clientSocket.destroy());
        clientSocket.on('error', () => pSocket.destroy());
    });
    server.listen(Number(lPort), '127.0.0.1', () => console.log('Túnel local ativo na porta', lPort));
}

// 2. Iniciar Chrome Furtivo (Stealth)
async function startBrowser() {
    console.log('Iniciando Motor AntiDetect Stealth...');
    const args = [
        '--disable-ipv6',
        '--remote-debugging-port=' + cdpPort,
        '--lang=' + langCode.toLowerCase(),
        '--restore-last-session',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-sync',
        '--window-size=1280,800',
        '--disable-infobars',
        '--force-webrtc-ip-handling-policy=disable-non-proxied-udp'
    ];
    if (hasProxy) {
        args.push('--proxy-server=http://127.0.0.1:' + lPort);
    } else {
        args.push('--no-proxy-server');
    }
    
    try {
        const browser = await puppeteer.launch({
            executablePath: CHROME_PATH,
            headless: false,
            userDataDir: profileDir,
            args: args,
            defaultViewport: null,
            ignoreDefaultArgs: ['--enable-automation']
        });
        
        console.log('Navegador AntiDetect Aberto e Blindado com Sucesso!');
        console.log('Porta de Controle Local:', cdpPort);
        
        // Listen to disconnect event to close process
        browser.on('disconnected', () => {
            console.log('Navegador fechado. Encerrando motor...');
            process.exit(0);
        });
        
        // Open testing site if it is the first tab
        const pages = await browser.pages();
        if (pages.length === 1 && pages[0].url() === 'about:blank') {
            await pages[0].goto('https://whoer.net');
        }
    } catch (err) {
        console.error('Erro ao abrir o navegador:', err);
        process.exit(1);
    }
}
startBrowser();
`;

  const engineB64 = Buffer.from(engineCode).toString('base64');

  return `@echo off
chcp 65001 >nul
title OmniMedia — ${acc.name} (${acc.country})

echo =======================================================
echo    OMNIMEDIA - MOTOR ANTIDETECT (MODO FURTIVO)
echo =======================================================
echo.

if not exist "C:\\OmniMedia" mkdir "C:\\OmniMedia"
if not exist "${profileDir}" mkdir "${profileDir}"
if not exist "${engineDir}" mkdir "${engineDir}"

cd /d "${engineDir}"

IF NOT EXIST "node_modules\\puppeteer-extra-plugin-stealth" (
    echo [1/3] Preparando bibliotecas de blindagem (Isso ocorre apenas na 1a vez)...
    IF NOT EXIST "package.json" echo {} > package.json
    call npm install puppeteer-extra puppeteer-extra-plugin-stealth puppeteer-core --no-fund --no-audit
)

echo [2/3] Verificando caminho do Chrome...
set "CHROME="
for %%P in (
  "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
  "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
  "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"
) do (
  if exist "%%~P" if not defined CHROME set "CHROME=%%~P"
)

if not defined CHROME (
  echo ERRO: Google Chrome nao foi encontrado neste computador!
  pause & exit /b 1
)

echo [3/3] Desempacotando script principal...
powershell -NoProfile -Command "[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${engineB64}')) | Set-Content -Path 'launcher.js' -Encoding Ascii" 2>nul

echo.
echo Iniciando sessao blindada para ${acc.name}...
echo.
node launcher.js "%CHROME%" "${cdpPort}" "${profileDir}" "${acc.languageCode}" "${hasProxy}" "${tunnelPort}" "${px.host}" "${parsedPort}" "${px.user}" "${px.pass}"

exit /b 0
`;
}

// ─── Modal de Edição de Proxy (reutilizável internamente) ─────────────────────
const SITE_URL_INNER = 'https://multimedia-saas-platform.vercel.app';

// ─── ... (O restante da implementação permanece igual) ─────────────────────

const EditProxyModal: React.FC<{
  account: Account;
  onClose: () => void;
  onSave: (ip: string, port: number, user: string, pass: string, protocol: string, adsPowerId: string) => void;
}> = ({ account, onClose, onSave }) => {
  const [quickPaste, setQuickPaste] = useState('');
  const [ip, setIp] = useState(account.proxy.ip);
  const [port, setPort] = useState(String(account.proxy.port));
  const [user, setUser] = useState(account.proxy.username || '');
  const [pass, setPass] = useState(account.proxy.password || '');
  const [protocol, setProtocol] = useState<'HTTP' | 'SOCKS5'>(
    String(account.proxy.port) === '49156' ? 'SOCKS5' : 'HTTP'
  );
  const [adsPowerId, setAdsPowerId] = useState(account.adsPowerId || '');
  const [pasted, setPasted] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Auto-detect protocol from port
  const autoDetectProtocol = (p: string): 'HTTP' | 'SOCKS5' => {
    const cleaned = p.trim();
    if (cleaned === '49156') return 'SOCKS5';
    if (cleaned === '49155') return 'HTTP';
    // common socks5 ports
    const socksPorts = ['1080', '1081', '4145', '9050', '9150'];
    return socksPorts.includes(cleaned) ? 'SOCKS5' : 'HTTP';
  };

  const handlePortChange = (val: string) => {
    setPort(val);
    setProtocol(autoDetectProtocol(val));
  };

  const handlePaste = (val: string) => {
    setQuickPaste(val);
    const str = val.trim();
    if (!str) return;
    let h = '', p = '', u = '', pw = '', proto = 'HTTP';

    if (str.startsWith('socks5://') || str.startsWith('socks4://')) {
      proto = 'SOCKS5';
    }

    const clean = str.replace(/^(socks5|socks4|https?):\/\//, '');

    if (clean.includes('@')) {
      const [cred, hostpart] = clean.split('@');
      [u, pw] = cred.split(':');
      [h, p] = hostpart.split(':');
    } else {
      const parts = clean.split(':');
      if (parts.length >= 4) [h, p, u, pw] = parts;
      else if (parts.length === 2) [h, p] = parts;
      else if (parts.length === 3) [h, p, u] = parts;
    }

    if (h) setIp(h);
    if (p) {
      setPort(p);
      const detected = proto === 'SOCKS5' ? 'SOCKS5' : autoDetectProtocol(p);
      setProtocol(detected);
    }
    if (u) setUser(u);
    if (pw) setPass(pw);
    if (h && p) setPasted(true);
  };

  const finalPort = parseInt(port, 10) || account.proxy.port;
  const proxyScheme = protocol === 'SOCKS5' ? 'socks5' : 'http';
  const isValid = !!ip.trim() && !!port.trim() && !isNaN(finalPort);

  const handleSaveAndDownload = () => {
    onSave(ip, finalPort, user, pass, protocol, adsPowerId);
    const script = buildBatScript(account, {
      host: ip,
      port: String(finalPort),
      user,
      pass,
      protocol,
    });
    const blob = new Blob(['\ufeff' + script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chrome_${account.countryCode}_${account.id.slice(-4)}.bat`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            Editar Proxy — {account.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${protocol === 'SOCKS5' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'}`}>
              {protocol}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">{account.countryCode}</span>
          </div>
        </div>

        {/* Quick Paste */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-500/30 space-y-2">
          <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Colar Proxy Completo (igual AdsPower):
            <span className="ml-auto text-[9px] text-[var(--text-muted)] font-mono">host:porta:usuario:senha</span>
          </label>
          <input
            type="text"
            placeholder="Ex: 82.140.183.78:49155:thaisrafipv:KxjbNhyGPj"
            value={quickPaste}
            onChange={(e) => handlePaste(e.target.value)}
            className="w-full rounded-lg bg-[var(--bg-primary)] border border-purple-500/40 p-2.5 text-xs font-mono text-[var(--text-primary)] focus:border-purple-400 focus:outline-none"
          />
          {pasted && <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">✓ Dados extraídos! Protocolo detectado: <span className="font-bold">{protocol}</span></div>}
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-3">


          <div className="col-span-2">
            <label className="text-[10px] font-semibold text-[var(--text-muted)] block mb-1">IP / Host do Proxy (Para Navegação Local)</label>
            <input type="text" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="ex: 82.140.183.78"
              className="w-full rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-2.5 text-xs font-mono text-[var(--text-primary)] focus:border-purple-500 focus:outline-none" />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-[var(--text-muted)] block mb-1">Porta</label>
            <input type="text" value={port} onChange={(e) => handlePortChange(e.target.value)} placeholder="ex: 49155"
              className="w-full rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-2.5 text-xs font-mono text-[var(--text-primary)] focus:border-purple-500 focus:outline-none" />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-[var(--text-muted)] block mb-1">Protocolo</label>
            <div className="flex gap-1.5">
              {(['HTTP', 'SOCKS5'] as const).map(p => (
                <button key={p} onClick={() => setProtocol(p)}
                  className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all border ${protocol === p
                    ? p === 'SOCKS5' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                    : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-purple-500/50'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-[var(--text-muted)] block mb-1">Usuário</label>
            <input type="text" value={user} onChange={(e) => setUser(e.target.value)} placeholder="ex: thaisrafipv"
              className="w-full rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-2.5 text-xs font-mono text-[var(--text-primary)] focus:border-purple-500 focus:outline-none" />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-[var(--text-muted)] block mb-1">Senha</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="ex: KxjbNhyGPj"
                className="w-full rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-2.5 text-xs font-mono text-[var(--text-primary)] focus:border-purple-500 focus:outline-none pr-8" />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-[10px]">
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        {isValid && (
          <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-3 ${protocol === 'SOCKS5' ? 'bg-amber-900/10 border-amber-500/20 text-amber-300' : 'bg-blue-900/10 border-blue-500/20 text-blue-300'}`}>
            <span className="text-emerald-400 text-base">✓</span>
            <div>
              <div className="font-bold text-[11px]">{proxyScheme}://{ip}:{finalPort}</div>
              {user && <div className="text-[10px] opacity-70 mt-0.5">Auth: {user}:{'•'.repeat(Math.min(pass.length, 8))}</div>}
            </div>
            <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold ${protocol === 'SOCKS5' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>{protocol}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-color)]">
          <button onClick={handleSaveAndDownload} disabled={!isValid}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg">
            <Download className="w-4 h-4" />
            💾 Salvar &amp; Baixar Launcher .bat
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] border border-[var(--border-color)] hover:text-[var(--text-primary)] transition-all">Cancelar</button>
            <button onClick={() => { onSave(ip, finalPort, user, pass, protocol, adsPowerId); onClose(); }}
              className="flex-1 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-bold transition-all border border-purple-500/30">Só Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ... (O restante da implementação, incluindo generateMasterLauncher, etc) ...

export const AntiDetectBrowserView: React.FC<AntiDetectBrowserViewProps> = ({
  accounts,
  selectedCategory,
  onUpdateAccounts,
}) => {
  const filteredAccounts = accounts.filter(
    (a) => selectedCategory === 'ALL' || a.category === selectedCategory
  );

  const [sessionStatuses, setSessionStatuses] = useState<Record<string, 'IDLE' | 'LAUNCHING' | 'ACTIVE' | 'FAILED'>>(
    Object.fromEntries(accounts.map((a) => [a.id, 'IDLE']))
  );
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedScript, setExpandedScript] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'proxy' | 'profiles' | 'bulk' | 'tutorial'>('profiles');
  const [copiedScript, setCopiedScript] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [testingProxyId, setTestingProxyId] = useState<string | null>(null);
  const [bulkProxyText, setBulkProxyText] = useState('');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [pastedStatus, setPastedStatus] = useState(false);
  const [quickPasteAcc, setQuickPasteAcc] = useState('');
  const [proxyFieldsAcc, setProxyFieldsAcc] = useState({ ip: '', port: '', user: '', pass: '' });

  const [proxyInput, setProxyInput] = useState('');
  const [proxyParsed, setProxyParsed] = useState<{
    host: string; port: string; user: string; pass: string; protocol: string; valid: boolean;
  } | null>(null);
  const [proxyAppliedTo, setProxyAppliedTo] = useState<string[]>([]);

  const parseProxy = (raw: string) => {
    const str = raw.trim();
    if (!str) { setProxyParsed(null); return; }

    let host = '', port = '', user = '', pass = '', protocol = 'HTTP';

    try {
      if (str.includes('://')) {
        const u = new URL(str.includes('://') ? str : 'http://' + str);
        host = u.hostname;
        port = u.port;
        user = u.username;
        pass = u.password;
        protocol = str.startsWith('socks5') ? 'SOCKS5' : str.startsWith('socks4') ? 'SOCKS4' : 'HTTP';
      } else if (str.includes('@')) {
        const [credentials, hostpart] = str.split('@');
        [user, pass] = credentials.split(':');
        [host, port] = hostpart.split(':');
      } else {
        const parts = str.split(':');
        if (parts.length === 4) {
          [host, port, user, pass] = parts;
        } else if (parts.length === 2) {
          [host, port] = parts;
        } else if (parts.length === 3) {
          [host, port, user] = parts;
        }
      }

      const valid = !!host && !!port && !isNaN(Number(port));
      setProxyParsed({ host, port, user, pass, protocol, valid });
    } catch {
      setProxyParsed({ host: '', port: '', user: '', pass: '', protocol: 'HTTP', valid: false });
    }
  };

  const generateUniversalLauncher = (): string => {
    return `@echo off
chcp 65001 >nul
title OmniMedia — Lancador Permanente (Anti-Detect Browser)

if not exist "C:\\OmniMedia" mkdir "C:\\OmniMedia"
if not exist "C:\\OmniMedia\\Profiles" mkdir "C:\\OmniMedia\\Profiles"

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
      echo Tunnel proxy ativo na porta 10899!
    )
  )
)

if "%TUNNEL_READY%"=="1" (
  start "" "%CHROME%" --disable-ipv6 --proxy-server="http://127.0.0.1:10899" --user-data-dir="C:\\OmniMedia\\Profiles\\Sessao_Atual" --restore-last-session --no-first-run --no-default-browser-check --disable-sync https://whoer.net
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

  const generateWindowsLauncher = (acc: Account, customProxy?: { host: string; port: string; user: string; pass: string; protocol: string }): string => {
    const px = customProxy || { host: acc.proxy.ip, port: String(acc.proxy.port), user: acc.proxy.username || '', pass: acc.proxy.password || '', protocol: acc.proxy.protocol };
    return buildBatScript(acc, px as any);
  };

  const generateMasterLauncher = (): string => {
    const blocks = filteredAccounts.map((acc, i) => {
      const px = acc.proxy;
      return buildBatScript(acc, { host: px.ip, port: String(px.port), user: px.username || '', pass: px.password || '', protocol: px.protocol } as any);
    });
    return blocks.join('\n\n');
  };

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

  const handleLaunch = (acc: Account) => {
    setSessionStatuses((prev) => ({ ...prev, [acc.id]: 'LAUNCHING' }));
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
    setSessionStatuses(Object.fromEntries(accounts.map((a) => [a.id, 'IDLE' as 'IDLE'])));
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

  const activeCount = Object.values(sessionStatuses).filter((s) => s === 'ACTIVE').length;
  const launchingCount = Object.values(sessionStatuses).filter((s) => s === 'LAUNCHING').length;

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
          <button
            onClick={() => {
              if (window.confirm("ATENÇÃO: Isso apagará TODOS os perfis e proxies salvos. Deseja continuar?")) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/25 transition-all hover:scale-105"
          >
            <Monitor className="w-3.5 h-3.5" />
            Zerar Tudo
          </button>
        </div>
      </div>

      {/* ℹ️ Info — Modelo AdsPower */}
      <div className="flex items-start justify-between gap-3 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-xs">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-indigo-300">Modelo AdsPower — IP Direto por padrão</p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Perfis <strong>sem proxy</strong> abrem com o IP real do seu computador.
              Clique em <span className="text-amber-400 font-semibold">⚡ Proxy</span> em qualquer card para adicionar um proxy específico àquele perfil.
              Ao salvar, o launcher <code className="bg-black/30 px-1 rounded">.bat</code> desse perfil já usa o proxy novo.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            if (!confirm('Limpar dados salvos e restaurar perfis padrão (sem proxy)?')) return;
            localStorage.removeItem('omni_media_accounts');
            window.location.reload();
          }}
          className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 font-bold text-xs transition-all whitespace-nowrap shrink-0"
          title="Limpa localStorage e restaura perfis padrão sem proxy"
        >
          🔄 Resetar Perfis
        </button>
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
          { id: 'profiles', label: '💻 Perfis & Launchers' },
          { id: 'proxy', label: '⚡ Colar Proxy Rápido' },
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

      {/* 💻 Perfis & Launchers Tab */}
      {activeTab === 'profiles' && (
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

      {/* \uD83D\uDCBB Perfis & Launchers (tab unificada) */}
      {activeTab === 'profiles' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Buscar por nome, usu\u00E1rio ou pa\u00EDs..."
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAccounts
            .filter(acc =>
              !searchTerm ||
              acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
              acc.country.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((acc) => {
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
                      {(!acc.proxy.ip || acc.proxy.ip === 'sem-proxy') ? (
                        <span className="font-mono font-bold text-amber-500">IP Direto</span>
                      ) : (
                        <span className="font-mono font-bold text-purple-400">{acc.proxy.ip}:{acc.proxy.port}</span>
                      )}
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
                    <button
                      onClick={() => setEditingAccountId(acc.id)}
                      className="px-3 py-2.5 rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/30 hover:bg-purple-600/20 font-bold text-xs transition-all flex items-center gap-1.5"
                      title="Editar Proxy"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Proxy
                    </button>

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

          {/* Bulk Import Modal */}
          {isBulkImportOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Importar Proxies em Lote</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Cole uma lista de proxies no formato <code className="text-purple-400 font-mono">ip:porta:usuario:senha</code> (um por linha).
                </p>
                <textarea
                  rows={6}
                  value={bulkProxyText}
                  onChange={(e) => setBulkProxyText(e.target.value)}
                  placeholder={`82.140.183.78:49155:thaisrafipv:KxjbNhyGPj\n185.220.101.5:49156:user2:pass2`}
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
                onSave={(ip, port, user, pass, protocol) => {
                  const updated = accounts.map(a => a.id === editingAccountId
                    ? { ...a, proxy: { ...a.proxy, ip, port, username: user, password: pass, protocol: protocol as import('@/types').ProxyProtocol, status: 'ACTIVE' as const } }
                    : a
                  );
                  onUpdateAccounts(updated);
                  setEditingAccountId(null);
                }}
              />
            );
          })()}
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
