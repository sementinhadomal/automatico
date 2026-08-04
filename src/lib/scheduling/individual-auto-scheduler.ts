import { Account, MediaAsset, QueueJob } from '@/types';
import { LocalizationEngine } from '../localization/engine';

export interface IndividualScheduleConfig {
  accountId: string;
  postsPerDay: number;
  daysCount: number; // padrão: 50 dias
  preferredHours?: number[]; // ex: [9, 14, 20] -> 9h, 14h e 20h no fuso local
}

export class IndividualAutoSchedulerEngine {
  /**
   * Gera o agendamento individual de 50 dias para uma conta específica.
   */
  public static generateIndividual50DaysSchedule(
    account: Account,
    mediaPool: MediaAsset[],
    config: IndividualScheduleConfig
  ): QueueJob[] {
    const jobs: QueueJob[] = [];
    const postsPerDay = config.postsPerDay || 3;
    const daysCount = config.daysCount || 50;

    // Filtrar mídias exclusivas da conta selecionada, ou mídias da mesma categoria se não houver vinculação direta
    const accountMedia = mediaPool.filter((m) => m.accountId === account.id);
    const targetMediaPool = accountMedia.length > 0
      ? accountMedia
      : mediaPool.filter((m) => m.category === account.category);

    if (targetMediaPool.length === 0) return [];

    let mediaIndex = 0;
    const startDate = new Date();

    for (let day = 0; day < daysCount; day++) {
      const currentDayDate = new Date(startDate);
      currentDayDate.setDate(startDate.getDate() + day);

      const defaultHours = [9, 14, 20, 11, 17, 22];
      const targetHours = config.preferredHours && config.preferredHours.length > 0
        ? config.preferredHours
        : defaultHours.slice(0, postsPerDay);

      for (let postIndex = 0; postIndex < targetHours.length; postIndex++) {
        const media = targetMediaPool[mediaIndex % targetMediaPool.length];
        mediaIndex++;

        const scheduledTime = new Date(currentDayDate);
        scheduledTime.setHours(targetHours[postIndex], Math.floor(Math.random() * 30), 0);

        const jobId = `job_${account.id}_day${day + 1}_post${postIndex + 1}_${Date.now().toString(36)}`;

        jobs.push({
          id: jobId,
          accountId: account.id,
          accountName: account.name,
          category: account.category,
          platform: 'Instagram / TikTok',
          mediaId: media.id,
          mediaTitle: media.title,
          mediaType: media.type,
          copyId: `copy_auto_${mediaIndex}`,
          hashtagId: `tag_auto_${mediaIndex}`,
          ctaId: `cta_auto_${mediaIndex}`,
          scheduledFor: scheduledTime.toISOString(),
          accountLocalTime: `${targetHours[postIndex]}:00 (${account.timezone.split('/')[1] || account.timezone})`,
          status: 'QUEUED',
          attempts: 0,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return jobs;
  }
}
