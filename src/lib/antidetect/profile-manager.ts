import { Account, ProxyConfig } from '@/types';

/**
 * Interface para exportação de perfis de navegadores anti-detect.
 */
export interface AntiDetectProfileExport {
  profileId: string;
  name: string;
  category: string;
  targetUrl: string;
  proxy: {
    protocol: string;
    host: string;
    port: number;
    username?: string;
    password?: string;
  };
  userAgent: string;
  fingerprint: {
    language: string;
    timezone: string;
    webGLVendor: string;
    canvasNoise: string;
  };
  puppeteerLaunchArgs: string[];
}

/**
 * Anti-Detect Browser Profile Manager.
 * Exporta configurações e scripts de inicialização de instâncias isoladas
 * compatíveis com AdsPower, GoLogin, Multilogin ou Puppeteer/Playwright headless.
 */
export class AntiDetectProfileManager {
  /**
   * Gera script executável do Puppeteer/Playwright para abrir o navegador com o proxy da conta.
   */
  public static generatePuppeteerLaunchScript(account: Account): string {
    const p = account.proxy;
    const proxyAuth = p.username && p.password ? `${p.username}:${p.password}@` : '';
    const proxyServerUrl = `${p.protocol.toLowerCase()}://${proxyAuth}${p.ip}:${p.port}`;

    return `// Script de Inicialização de Instância Isolada tipo AdsPower para ${account.name} (${account.username})
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  console.log('[AntiDetect Engine] Iniciando navegador com Proxy Exclusivo...');
  
  const browser = await puppeteer.launch({
    headless: false, // Abre a janela do Chrome igual ao AdsPower
    args: [
      '--proxy-server=${proxyServerUrl}',
      '--lang=${account.languageCode}',
      '--timezone=${account.timezone}',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();
  
  // Injeta cookies de sessão salvos
  const cookiesStr = '${account.cookies}';
  if (cookiesStr) {
    console.log('[AntiDetect Engine] Restaurando cookies de sessão salvas...');
    // Lógica de restauração de cookies
  }

  await page.goto('https://instagram.com');
  console.log('[AntiDetect Engine] Sessão iniciada com sucesso via Proxy ${p.ip}:${p.port}');
})();`;
  }

  /**
   * Gera configuração em formato JSON compatível com a API do AdsPower.
   */
  public static generateAdsPowerApiJson(account: Account): AntiDetectProfileExport {
    return {
      profileId: `adspower_${account.id}`,
      name: `${account.name} (${account.countryCode})`,
      category: account.category,
      targetUrl: 'https://instagram.com',
      proxy: {
        protocol: account.proxy.protocol.toLowerCase(),
        host: account.proxy.ip,
        port: account.proxy.port,
        username: account.proxy.username,
        password: account.proxy.password,
      },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/122.0.0.0 Safari/537.36',
      fingerprint: {
        language: account.languageCode,
        timezone: account.timezone,
        webGLVendor: 'Google Inc. (NVIDIA)',
        canvasNoise: 'enabled',
      },
      puppeteerLaunchArgs: [
        `--proxy-server=${account.proxy.protocol.toLowerCase()}://${account.proxy.ip}:${account.proxy.port}`,
        `--timezone=${account.timezone}`,
      ],
    };
  }
}
