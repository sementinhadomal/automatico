"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const browser_service_1 = require("./browser.service");
let BrowserController = class BrowserController {
    browserService;
    constructor(browserService) {
        this.browserService = browserService;
    }
    async launchBrowser(account) {
        return this.browserService.launchBrowser(account);
    }
    async stopBrowser(accountId) {
        const success = await this.browserService.stopBrowser(accountId);
        return { success };
    }
    getActiveSessions() {
        return this.browserService.getActiveSessions();
    }
};
exports.BrowserController = BrowserController;
__decorate([
    (0, common_1.Post)('launch'),
    (0, swagger_1.ApiOperation)({ summary: 'Inicia uma instância isolada do navegador com proxy e cookies' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sessão do navegador iniciada com sucesso' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BrowserController.prototype, "launchBrowser", null);
__decorate([
    (0, common_1.Delete)('stop/:accountId'),
    (0, swagger_1.ApiOperation)({ summary: 'Encerra a sessão do navegador de uma conta específica' }),
    __param(0, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BrowserController.prototype, "stopBrowser", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, swagger_1.ApiOperation)({ summary: 'Lista todas as sessões ativas de navegadores anti-detect' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], BrowserController.prototype, "getActiveSessions", null);
exports.BrowserController = BrowserController = __decorate([
    (0, swagger_1.ApiTags)('browser'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('browser'),
    __metadata("design:paramtypes", [browser_service_1.BrowserService])
], BrowserController);
//# sourceMappingURL=browser.controller.js.map