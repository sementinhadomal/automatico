"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BrowserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserService = void 0;
const common_1 = require("@nestjs/common");
let BrowserService = BrowserService_1 = class BrowserService {
    logger = new common_1.Logger(BrowserService_1.name);
    activeSessions = new Map();
    async launchBrowser(account) {
        this.logger.log(`Iniciando navegador para conta: ${account.name} (${account.username})`);
        const session = {
            accountId: account.id,
            accountName: account.name,
            status: 'LAUNCHING',
            proxyUsed: `${account.proxy.ip}:${account.proxy.port} (${account.proxy.protocol})`,
            launchedAt: new Date(),
        };
        this.activeSessions.set(account.id, session);
        setTimeout(() => {
            session.status = 'ACTIVE';
            session.pageUrl = 'https://instagram.com';
            session.pid = Math.floor(Math.random() * 90000) + 10000;
            this.logger.log(`Navegador ativo [PID ${session.pid}] para conta: ${account.name}`);
        }, 1500);
        return session;
    }
    async stopBrowser(accountId) {
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
    getActiveSessions() {
        return Array.from(this.activeSessions.values());
    }
    getSessionStatus(accountId) {
        const session = this.activeSessions.get(accountId);
        return session ? session.status : 'IDLE';
    }
};
exports.BrowserService = BrowserService;
exports.BrowserService = BrowserService = BrowserService_1 = __decorate([
    (0, common_1.Injectable)()
], BrowserService);
//# sourceMappingURL=browser.service.js.map