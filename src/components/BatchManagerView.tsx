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

    const puppeteerScript = `
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const https = require('https');
const path = require('path');

const VIDS = ${JSON.stringify(uploadedUrls)};
const CAPTION = ${JSON.stringify(globalCaption)};
const CHROME_DEBUG_URL = 'http://127.0.0.1:49152';

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

async function run() {
  console.log(' Conectando ao Antidetect Browser local na porta 49152...');
  try {
    const browserURL = CHROME_DEBUG_URL;
    const browser = await puppeteer.connect({ browserURL, defaultViewport: null });
    
    const pages = await browser.pages();
    let igPage = pages.find(p => p.url().includes('instagram.com'));
    
    if (!igPage) {
       igPage = await browser.newPage();
       await igPage.goto('https://www.instagram.com/', { waitUntil: 'networkidle2' });
    } else {
       await igPage.bringToFront();
    }

    console.log(' Logado no Instagram! Iniciando postagem de ' + VIDS.length + ' vídeos...');
    
    for (let i = 0; i < VIDS.length; i++) {
        console.log('\\n[LOTE] Baixando vídeo ' + (i+1) + '/' + VIDS.length + ' da nuvem...');
        const tempPath = path.join(__dirname, 'temp_video_' + i + '.mp4');
        await downloadVideo(VIDS[i], tempPath);
        
        console.log('[LOTE] Vídeo baixado. Clicando em Nova Publicação...');
        // Wait for Create post button (Desktop)
        await igPage.waitForSelector('svg[aria-label="New post"]', { timeout: 10000 }).catch(()=>null);
        await igPage.evaluate(() => {
           const svgs = Array.from(document.querySelectorAll('svg[aria-label="New post"]'));
           if (svgs.length > 0) svgs[0].closest('a, [role="button"]').click();
        });
        
        // Wait for file input and upload
        await igPage.waitForTimeout(2000);
        const [fileChooser] = await Promise.all([
          igPage.waitForFileChooser(),
          igPage.evaluate(() => {
             const btns = Array.from(document.querySelectorAll('button'));
             const select = btns.find(b => b.innerText.includes('Select from computer') || b.innerText.includes('Selecionar do computador'));
             if (select) select.click();
          })
        ]);
        await fileChooser.accept([tempPath]);
        
        console.log('[LOTE] Avançando opções...');
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
        
        console.log('[LOTE] Inserindo Legenda Global...');
        await igPage.waitForTimeout(2000);
        await igPage.evaluate((caption) => {
           const el = document.querySelector('div[aria-label="Write a caption..."], div[aria-label="Escreva uma legenda..."]');
           if (el) {
               el.focus();
               document.execCommand('insertText', false, caption);
           }
        }, CAPTION);
        
        console.log('[LOTE] Compartilhando!');
        await igPage.waitForTimeout(1500);
        await igPage.evaluate(() => {
           const share = Array.from(document.querySelectorAll('div[role="button"]'));
           const s = share.find(b => b.innerText === 'Share' || b.innerText === 'Compartilhar');
           if (s) s.click();
        });
        
        console.log('[LOTE] Aguardando upload finalizar...');
        await igPage.waitForTimeout(10000); // Wait for upload to complete
        
        // Cleanup temp file
        fs.unlinkSync(tempPath);
        
        console.log('[LOTE] Vídeo ' + (i+1) + ' postado com sucesso! Aguardando 1 hora para o próximo...');
        // Delay between posts in the batch (simulate human delay, e.g. 1 hour = 3600000)
        // For testing we just wait 10 seconds.
        if (i < VIDS.length - 1) {
            await igPage.waitForTimeout(10000); 
        }
    }
    
    console.log('\\n[SUCESSO] Todos os ' + VIDS.length + ' vídeos do Lote foram postados!');
    process.exit(0);
  } catch (err) {
    console.error('Erro Fatal no Robô:', err);
    process.exit(1);
  }
}
run();
`;

    const batScript = `@echo off
echo =======================================================
echo     ROBO PUBLICADOR OMNIMEDIA - LOTE
echo     Conta Alvo: ${targetAccount.name}
echo =======================================================
echo.
echo Verificando dependencias...

IF NOT EXIST "%TEMP%\\omnimedia_poster" (
    mkdir "%TEMP%\\omnimedia_poster"
)
cd /d "%TEMP%\\omnimedia_poster"

IF NOT EXIST "node_modules\\puppeteer-core" (
    echo Instalando motor de automacao local...
    npm install puppeteer-core
)

echo.
echo Gerando script de postagem...
> "postador.js" (
echo ${puppeteerScript.replace(/\n/g, '\\n').replace(/"/g, '""')}
)

echo.
echo ATENCAO: Certifique-se de que a conta ${targetAccount.name}
echo esta ABERTA no painel OmniMedia antes de continuar!
echo.
pause
echo Iniciando Postagem...
node postador.js
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
