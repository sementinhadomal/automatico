import { Controller, Post, Get, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BrowserService } from './browser.service';
import type { Account, BrowserSession } from '../../common/types';

@ApiTags('browser')
@ApiBearerAuth('JWT-auth')
@Controller('browser')
export class BrowserController {
  constructor(private readonly browserService: BrowserService) {}

  @Post('launch')
  @ApiOperation({ summary: 'Inicia uma instância isolada do navegador com proxy e cookies' })
  @ApiResponse({ status: 200, description: 'Sessão do navegador iniciada com sucesso' })
  async launchBrowser(@Body() account: Account): Promise<BrowserSession> {
    return this.browserService.launchBrowser(account);
  }

  @Delete('stop/:accountId')
  @ApiOperation({ summary: 'Encerra a sessão do navegador de uma conta específica' })
  async stopBrowser(@Param('accountId') accountId: string): Promise<{ success: boolean }> {
    const success = await this.browserService.stopBrowser(accountId);
    return { success };
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Lista todas as sessões ativas de navegadores anti-detect' })
  getActiveSessions(): BrowserSession[] {
    return this.browserService.getActiveSessions();
  }
}
