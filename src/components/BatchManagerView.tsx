'use client';

import React, { useState, useRef } from 'react';
import { Account, CategoryType } from '@/types';
import { UploadCloud, CheckCircle2, Play, Video, Bot, Image as ImageIcon, Trash2 } from 'lucide-react';

interface BatchManagerViewProps {
  accounts: Account[];
  selectedCategory: CategoryType | 'ALL';
}

export const BatchManagerView: React.FC<BatchManagerViewProps> = ({ accounts, selectedCategory }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [globalCaption, setGlobalCaption] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [postsPerDay, setPostsPerDay] = useState(3);
  const [durationMonths, setDurationMonths] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAccounts = accounts.filter(
    (a) => selectedCategory === 'ALL' || a.category === selectedCategory
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUploadAndSchedule = async () => {
    if (files.length === 0 || !selectedAccountId) return;
    
    setIsUploading(true);
    const uploadedUrls: string[] = [];

    // 1. Upload logic to Vercel Blob
    try {
      for (const file of files) {
        const response = await fetch(`/api/batch/upload?filename=${encodeURIComponent(file.name)}`, {
          method: 'POST',
          body: file,
        });
        const newBlob = await response.json();
        if (newBlob.url) {
          uploadedUrls.push(newBlob.url);
        }
      }
    } catch (e) {
      alert('Erro no upload. Verifique sua conexão.');
      setIsUploading(false);
      return;
    }
    
    // 2. Generate Puppeteer Script for local posting
    const targetAccount = accounts.find(a => a.id === selectedAccountId);
    if (!targetAccount) return;

    // Generate Agenda
    const agenda = [];
    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0); // Start of day
    
    // Spread posts throughout the day (e.g. 9 AM to 8 PM = 11 hours)
    // 11 hours = 660 minutes.
    
    // Shuffle uploaded urls to randomize video order
    const shuffledUrls = [...uploadedUrls].sort(() => Math.random() - 0.5);

    const totalDays = durationMonths * 30;
    const totalSlots = totalDays * postsPerDay;
    
    for (let i = 0; i < totalSlots; i++) {
      const dayIndex = Math.floor(i / postsPerDay);
      const postInDay = i % postsPerDay;
      
      const postDate = new Date(currentDate);
      postDate.setDate(postDate.getDate() + dayIndex);
      
      // Randomize hour between 9 and 20
      const randomHour = 9 + Math.floor(Math.random() * 11);
      const randomMinute = Math.floor(Math.random() * 60);
      postDate.setHours(randomHour, randomMinute, 0, 0);
      
      // Re-use videos if there are more slots than videos
      const videoUrl = shuffledUrls.length > 0 ? shuffledUrls[i % shuffledUrls.length] : '';
      
      agenda.push({
        id: `post_${Date.now()}_${i}`,
        url: videoUrl,
        caption: globalCaption,
        scheduledFor: postDate.toISOString(),
        done: false
      });
    }

    const agendaJson = JSON.stringify(agenda, null, 2);

    const puppeteerScript = `
const http = require('http');
const net = require('net');
const fs = require('fs');
const https = require('https');
const path = require('path');
const puppeteerCore = require('puppeteer-core');
const { addExtra } = require('puppeteer-extra');
const puppeteer = addExtra(puppeteerCore);
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const [, , CHROME_PATH, cdpPort, profileDir, langCode, hasProxyStr, lPort, tHost, tPort, user, pass] = process.argv;
const hasProxy = hasProxyStr === 'true';

const agendaPath = path.join(__dirname, 'agenda.json');
if (!fs.existsSync(agendaPath)) {
    console.log('Nenhuma agenda encontrada.');
    process.exit(0);
}

const agenda = JSON.parse(fs.readFileSync(agendaPath, 'utf8'));
const pendingPosts = agenda.filter(p => !p.done && new Date(p.scheduledFor) <= new Date());

if (pendingPosts.length === 0) {
    console.log('[' + new Date().toISOString() + '] Nenhum post agendado para o momento atual.');
    process.exit(0);
}

// Post apenas o primeiro da fila para nao sobrecarregar
const postToRun = pendingPosts[0];

async function downloadVideo(url, dest) {
  return new Promise((resolve, reject) => {
    if (url.includes('mock-blob-storage')) {
      console.log('Simulated Blob url detected. Skipping download.');
      fs.writeFileSync(dest, 'mock video data');
      return resolve();
    }
    const file = fs.createWriteStream(dest);
    https.get(url, function(response) {
      response.pipe(file);
      file.on('finish', function() { file.close(resolve); });
    }).on('error', function(err) { fs.unlink(dest, () => {}); reject(err); });
  });
}

// 1. Iniciar Túnel Proxy se existir
let proxyServer = null;
if (hasProxy) {
    const hasAuth = user && user.trim().length > 0;
    const auth = hasAuth ? Buffer.from(user + ':' + pass).toString('base64') : '';
    
    proxyServer = http.createServer((req, res) => {
        const headers = Object.assign({}, req.headers);
        if (hasAuth) headers['Proxy-Authorization'] = 'Basic ' + auth;
        const options = { hostname: tHost, port: Number(tPort), path: req.url, method: req.method, headers: headers };
        const proxyReq = http.request(options, (proxyRes) => { res.writeHead(proxyRes.statusCode, proxyRes.headers); proxyRes.pipe(res); });
        proxyReq.on('error', (e) => res.end());
        req.pipe(proxyReq);
    });
    proxyServer.on('connect', (req, clientSocket, head) => {
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
    proxyServer.listen(Number(lPort), '127.0.0.1');
}

// 2. Iniciar Chrome Furtivo (Stealth) e Postar
async function run() {
  console.log('Iniciando Motor para Postagem Agendada:', postToRun.id);
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

  let browser;
  try {
    browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true, // Modo Invisivel (Fantasma)
        userDataDir: profileDir,
        args: args,
        defaultViewport: null,
        ignoreDefaultArgs: ['--enable-automation']
    });
    
    const pages = await browser.pages();
    let igPage = pages.find(p => p.url().includes('instagram.com'));
    
    if (!igPage) {
       igPage = await browser.newPage();
       await igPage.goto('https://www.instagram.com/', { waitUntil: 'networkidle2' });
    } else {
       await igPage.bringToFront();
    }
    
    console.log('[WORKER] Baixando vídeo da nuvem...');
    const tempPath = path.join(__dirname, 'temp_video.mp4');
    await downloadVideo(postToRun.url, tempPath);
    
    console.log('[WORKER] Clicando em Nova Publicação...');
    await igPage.waitForSelector('svg[aria-label="New post"]', { timeout: 15000 }).catch(()=>null);
    await igPage.evaluate(() => {
       const svgs = Array.from(document.querySelectorAll('svg[aria-label="New post"]'));
       if (svgs.length > 0) svgs[0].closest('a, [role="button"]').click();
    });
    
    await igPage.waitForTimeout(3000);
    const [fileChooser] = await Promise.all([
      igPage.waitForFileChooser(),
      igPage.evaluate(() => {
         const btns = Array.from(document.querySelectorAll('button'));
         const select = btns.find(b => b.innerText.includes('Select from computer') || b.innerText.includes('Selecionar do computador'));
         if (select) select.click();
      })
    ]);
    await fileChooser.accept([tempPath]);
    
    console.log('[WORKER] Avançando opções...');
    await igPage.waitForTimeout(3000);
    await igPage.evaluate(() => {
       const nexts = Array.from(document.querySelectorAll('div[role="button"]'));
       const n = nexts.find(b => b.innerText === 'Next' || b.innerText === 'Avançar');
       if (n) n.click();
    });
    await igPage.waitForTimeout(2000);
    await igPage.evaluate(() => {
       const nexts = Array.from(document.querySelectorAll('div[role="button"]'));
       const n = nexts.find(b => b.innerText === 'Next' || b.innerText === 'Avançar');
       if (n) n.click();
    });
    
    console.log('[WORKER] Inserindo Legenda...');
    await igPage.waitForTimeout(2000);
    await igPage.evaluate((caption) => {
       const el = document.querySelector('div[aria-label="Write a caption..."], div[aria-label="Escreva uma legenda..."]');
       if (el) {
           el.focus();
           document.execCommand('insertText', false, caption);
       }
    }, postToRun.caption);
    
    console.log('[WORKER] Compartilhando!');
    await igPage.waitForTimeout(1500);
    await igPage.evaluate(() => {
       const share = Array.from(document.querySelectorAll('div[role="button"]'));
       const s = share.find(b => b.innerText === 'Share' || b.innerText === 'Compartilhar');
       if (s) s.click();
    });
    
    console.log('[WORKER] Aguardando upload finalizar...');
    await igPage.waitForTimeout(15000);
    fs.unlinkSync(tempPath);
    
    console.log('[WORKER] Post efetuado com sucesso!');
    
    // Mark as done
    postToRun.done = true;
    const itemIndex = agenda.findIndex(p => p.id === postToRun.id);
    if (itemIndex > -1) agenda[itemIndex] = postToRun;
    fs.writeFileSync(agendaPath, JSON.stringify(agenda, null, 2));

    await browser.close();
    if (proxyServer) proxyServer.close();
    process.exit(0);
  } catch (err) {
    console.error('Erro no Worker:', err);
    if (browser) await browser.close();
    if (proxyServer) proxyServer.close();
    process.exit(1);
  }
}
run();
`;

    const b64Script = Buffer.from(puppeteerScript).toString('base64');
    const b64Agenda = Buffer.from(agendaJson).toString('base64');
    
    // Proxy parsing logic
    const px = targetAccount.proxy;
    const hasProxy = !!(px.ip && px.ip.trim() && px.ip !== 'sem-proxy');
    const cleanPort = String(px.port).trim();
    const isAdsPowerSocks = cleanPort === '49156';
    const parsedPort = isAdsPowerSocks ? 49155 : (parseInt(cleanPort, 10) || 49155);
    const tunnelPort = 10800 + (Math.abs(targetAccount.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 500);
    const cdpPort = tunnelPort + 1000;
    const profileDir = `C:\\OmniMedia\\Profiles\\${targetAccount.id}`;

    const batScript = `@echo off
chcp 65001 >nul
echo =======================================================
echo     ROBO PUBLICADOR OMNIMEDIA - INSTALADOR DE AGENDA
echo     Conta Alvo: ${targetAccount.name}
echo =======================================================
echo.

IF NOT EXIST "C:\\OmniMedia\\Profiles\\${targetAccount.id}" (
    echo ERRO: O perfil dessa conta ainda nao existe!
    echo Voce precisa abrir a conta pelo menos 1 vez na tela de 'Contas' para salvar seu login.
    pause & exit /b 1
)

set "ENGINE=C:\\OmniMedia\\Engine"
set "ACC_DIR=%ENGINE%\\${targetAccount.id}"

IF NOT EXIST "%ENGINE%" mkdir "%ENGINE%"
cd /d "%ENGINE%"

IF NOT EXIST "node_modules\\puppeteer-extra-plugin-stealth" (
    echo [1/3] Preparando bibliotecas de automacao furtiva...
    IF NOT EXIST "package.json" echo {} > package.json
    call npm install puppeteer-extra puppeteer-extra-plugin-stealth puppeteer-core --no-fund --no-audit
)

IF NOT EXIST "%ACC_DIR%" mkdir "%ACC_DIR%"

echo [2/3] Criando arquivos da agenda...
powershell -NoProfile -Command "[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${b64Script}')) | Set-Content -Path '%ACC_DIR%\\worker.js' -Encoding Ascii" 2>nul
powershell -NoProfile -Command "[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${b64Agenda}')) | Set-Content -Path '%ACC_DIR%\\agenda.json' -Encoding Ascii" 2>nul

echo set WshShell = CreateObject("WScript.Shell") > "%ACC_DIR%\\invisible.vbs"
echo WshShell.Run chr(34) ^& "%ACC_DIR%\\run.bat" ^& Chr(34), 0 >> "%ACC_DIR%\\invisible.vbs"
echo set WshShell = Nothing >> "%ACC_DIR%\\invisible.vbs"

echo @echo off > "%ACC_DIR%\\run.bat"
echo chcp 65001 ^^>nul >> "%ACC_DIR%\\run.bat"
echo cd /d "%ACC_DIR%" >> "%ACC_DIR%\\run.bat"
echo set "CHROME=" >> "%ACC_DIR%\\run.bat"
echo for %%%%P in ("%%ProgramFiles%%\\Google\\Chrome\\Application\\chrome.exe" "%%ProgramFiles(x86)%%\\Google\\Chrome\\Application\\chrome.exe" "%%LocalAppData%%\\Google\\Chrome\\Application\\chrome.exe") do if exist "%%%%~P" if not defined CHROME set "CHROME=%%%%~P" >> "%ACC_DIR%\\run.bat"
echo node worker.js "%%CHROME%%" "${cdpPort}" "${profileDir}" "${targetAccount.languageCode}" "${hasProxy}" "${tunnelPort}" "${px.ip}" "${parsedPort}" "${px.username || ''}" "${px.password || ''}" >> "%ACC_DIR%\\run.bat"

echo [3/3] Registrando Despertador no Windows...
schtasks /create /sc minute /mo 30 /tn "OmniMedia_${targetAccount.id}" /tr "wscript \\"%ACC_DIR%\\invisible.vbs\\"" /f

echo.
echo ======================================================================
echo PARABENS! A Agenda da conta ${targetAccount.name} foi ativada.
echo O Windows vai checar a agenda de hora em hora silenciosamente e
echo postar seus conteudos furtivamente nas datas marcadas.
echo ======================================================================
pause
`;

    const blob = new Blob([batScript], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postar_lote_${targetAccount.username}.bat`;
    a.click();
    
    setIsUploading(false);
    setFiles([]);
    setGlobalCaption('');
    alert('Lote enviado e Robô Postador baixado!');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-500" />
            Upload em Lote & Auto-Postagem
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Suba dezenas de vídeos prontos de uma vez, defina uma legenda global e baixe o robô postador.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Upload Files */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs">1</span>
            Selecione os Vídeos (Reels)
          </h3>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--border-color)] rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all"
          >
            <input 
              type="file" 
              multiple 
              accept="video/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Video className="w-10 h-10 mx-auto text-indigo-400 mb-3" />
            <p className="text-sm font-bold text-[var(--text-primary)]">Clique ou arraste vídeos para cá</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{files.length} arquivos selecionados</p>
          </div>

          {files.length > 0 && (
            <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] max-h-40 overflow-y-auto">
              <ul className="divide-y divide-[var(--border-color)]">
                {files.map((file, idx) => (
                  <li key={idx} className="p-3 text-xs flex items-center justify-between">
                    <span className="text-[var(--text-primary)] truncate max-w-[200px] font-mono">{file.name}</span>
                    <span className="text-[var(--text-muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Step 2: Configuration & Launch */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-5">
          <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs">2</span>
            Configuração do Lote
          </h3>

          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5">Legenda Global (aplicada em todos)</label>
            <textarea
              rows={4}
              value={globalCaption}
              onChange={(e) => setGlobalCaption(e.target.value)}
              placeholder="Escreva a legenda e hashtags que serão aplicadas em todos os vídeos..."
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5">Conta Antidetect de Destino</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Selecione a conta --</option>
              {filteredAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.username})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5">Posts por Dia</label>
              <input
                type="number"
                min="1"
                max="10"
                value={postsPerDay}
                onChange={(e) => setPostsPerDay(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5">Duração do Lote</label>
              <select
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
              >
                <option value={1}>1 Mês (30 dias)</option>
                <option value={2}>2 Meses (60 dias)</option>
                <option value={3}>3 Meses (90 dias)</option>
                <option value={4}>4 Meses (120 dias)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5">Data de Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={handleUploadAndSchedule}
            disabled={isUploading || files.length === 0 || !selectedAccountId}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isUploading ? (
              <span className="animate-pulse">Processando Uploads...</span>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                Upload para Nuvem & Gerar Robô de Postagem
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
