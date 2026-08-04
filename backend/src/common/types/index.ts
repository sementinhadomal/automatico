// Tipagem da configuração de proxy da conta
export interface ProxyConfig {
  id: string;
  ip: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'HTTP' | 'HTTPS' | 'SOCKS5';
  latencyMs: number;
  status: 'ACTIVE' | 'FAILED' | 'TESTING';
}

// Tipagem completa de uma conta gerenciada
export interface Account {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  category: 'HOT' | 'DROP';
  country: string;
  countryCode: string;
  language: string;
  languageCode: string;
  timezone: string;
  city: string;
  state: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  proxy: ProxyConfig;
  cookies: string;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR' | 'SYNCING';
  lastLogin: string;
  lastPublication: string;
  publishedCount: number;
  errorCount: number;
  notes: string;
  tags: string[];
}

// Resultado de publicação
export interface PublishResult {
  success: boolean;
  postId?: string;
  platformResponse?: any;
  error?: string;
  executionTimeMs: number;
}

// Status de sessão do navegador
export type BrowserSessionStatus = 'IDLE' | 'LAUNCHING' | 'ACTIVE' | 'FAILED' | 'CLOSING';

// Sessão ativa do navegador por conta
export interface BrowserSession {
  accountId: string;
  accountName: string;
  status: BrowserSessionStatus;
  launchedAt?: Date;
  proxyUsed: string;
  pageUrl?: string;
  pid?: number;
}
