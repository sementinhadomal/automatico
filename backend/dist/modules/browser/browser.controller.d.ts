import { BrowserService } from './browser.service';
import type { Account, BrowserSession } from '../../common/types';
export declare class BrowserController {
    private readonly browserService;
    constructor(browserService: BrowserService);
    launchBrowser(account: Account): Promise<BrowserSession>;
    stopBrowser(accountId: string): Promise<{
        success: boolean;
    }>;
    getActiveSessions(): BrowserSession[];
}
