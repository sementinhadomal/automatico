import { Account, BrowserSession, BrowserSessionStatus } from '../../common/types';
export declare class BrowserService {
    private readonly logger;
    private activeSessions;
    launchBrowser(account: Account): Promise<BrowserSession>;
    stopBrowser(accountId: string): Promise<boolean>;
    getActiveSessions(): BrowserSession[];
    getSessionStatus(accountId: string): BrowserSessionStatus;
}
