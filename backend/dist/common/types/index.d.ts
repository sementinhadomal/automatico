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
export interface PublishResult {
    success: boolean;
    postId?: string;
    platformResponse?: any;
    error?: string;
    executionTimeMs: number;
}
export type BrowserSessionStatus = 'IDLE' | 'LAUNCHING' | 'ACTIVE' | 'FAILED' | 'CLOSING';
export interface BrowserSession {
    accountId: string;
    accountName: string;
    status: BrowserSessionStatus;
    launchedAt?: Date;
    proxyUsed: string;
    pageUrl?: string;
    pid?: number;
}
