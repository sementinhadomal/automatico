import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BrowserModule } from './modules/browser/browser.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { PublisherModule } from './modules/publisher/publisher.module';
import { AuthModule } from './modules/auth/auth.module';
import { LibraryModule } from './modules/library/library.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    // Configuração global de variáveis de ambiente
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Módulos de domínio (Clean Architecture)
    AuthModule,
    AccountsModule,
    BrowserModule,
    LibraryModule,
    SchedulerModule,
    PublisherModule,
    ReportsModule,
  ],
})
export class AppModule {}
