import { Injectable, Logger } from '@nestjs/common';
import { Account, BrowserSession, BrowserSessionStatus } from '../../common/types';

@Injectable()
export class BrowserService {
  private readonly logger = new Logger(BrowserService.name);
  private activeSessions: Map<string, BrowserSession> = new Map();

  async launchBrowser(account: Account): Promise<BrowserSession> {
    this.logger.log(`Iniciando navegador para conta: ${account.name} (${account.username})`);
    
    const session: BrowserSession = {
      accountId: account.id,
      accountName: account.name,
      status: 'LAUNCHING',
      proxyUsed: `${account.proxy.ip}:${account.proxy.port} (${account.proxy.protocol})`,
      launchedAt: new Date(),
    };

    this.activeSessions.set(account.id, session);

    // Simulação de lançamento Puppeteer com Stealth e Proxy
    setTimeout(() => {
      session.status = 'ACTIVE';
      session.pageUrl = 'https://instagram.com';
      session.pid = Math.floor(Math.random() * 90000) + 10000;
      this.logger.log(`Navegador ativo [PID ${session.pid}] para conta: ${account.name}`);
    }, 1500);

    return session;
  }

  async stopBrowser(accountId: string): Promise<boolean> {
    const session = this.activeSessions.get(accountId);
    if (!session) {
      return false;
    }

    this.logger.log(`Encerrando navegador da conta ${accountId} (PID: ${session.pid})`);
    session.status = 'CLOSING';
    
    setTimeout(() => {
      this.activeSessions.delete(accountId);
    }, 500);

    return true;
  }

  getActiveSessions(): BrowserSession[] {
    return Array.from(this.activeSessions.values());
  }

  getSessionStatus(accountId: string): BrowserSessionStatus {
    const session = this.activeSessions.get(accountId);
    return session ? session.status : 'IDLE';
  }
}
