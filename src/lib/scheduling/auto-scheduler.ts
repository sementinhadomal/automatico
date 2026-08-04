import { Account, MediaAsset, QueueJob, CategoryType } from '@/types';
import { INITIAL_COPYS, INITIAL_HASHTAGS } from '@/lib/mockData';
import { LocalizationEngine } from '@/lib/localization/engine';

export interface AutoScheduleOptions {
  daysCount: number; // e.g. 50 days
  postsPerDay: number; // e.g. 3 posts per day
  targetAccountIds: string[];
  scheduleTimes: string[]; // e.g. ["09:00", "15:00", "21:00"]
  category: CategoryType | 'ALL';
  randomizeTimeVarianceMinutes?: number; // e.g. +/- 10 mins variance to prevent strict bot patterns
}

export interface BatchScheduleResult {
  totalJobsGenerated: number;
  startDate: string;
  endDate: string;
  daysCovered: number;
  jobsPerAccount: Record<string, number>;
  jobs: QueueJob[];
}

/**
 * Batch Auto-Scheduler Engine.
 * Automatically distributes N media assets (e.g. 150 assets) over D days (e.g. 50 days)
 * across target accounts, matching target local timezones, localized copys, hashtag rotation, and CTAs.
 */
export class BatchAutoSchedulerEngine {
  /**
   * Generates a 50-day automatic publication schedule.
   */
  public static generateBatchSchedule(
    mediaAssets: MediaAsset[],
    accounts: Account[],
    options: AutoScheduleOptions
  ): BatchScheduleResult {
    const filteredAccounts = accounts.filter(
      (a) =>
        (options.category === 'ALL' || a.category === options.category) &&
        (options.targetAccountIds.length === 0 || options.targetAccountIds.includes(a.id))
    );

    const availableMedia = mediaAssets.filter(
      (m) => options.category === 'ALL' || m.category === options.category
    );

    const mediaPool = availableMedia.length > 0 ? availableMedia : mediaAssets;

    const jobs: QueueJob[] = [];
    const jobsPerAccount: Record<string, number> = {};

    filteredAccounts.forEach((acc) => {
      jobsPerAccount[acc.id] = 0;
    });

    const now = new Date();
    let mediaIndex = 0;

    for (let day = 1; day <= options.daysCount; day++) {
      const currentDate = new Date(now);
      currentDate.setDate(now.getDate() + day);
      const dateString = currentDate.toISOString().split('T')[0];

      filteredAccounts.forEach((acc) => {
        // Pick schedule times up to postsPerDay
        const timesToSchedule = options.scheduleTimes.slice(0, options.postsPerDay);

        timesToSchedule.forEach((timeStr) => {
          // Seleção estrita de mídias exclusivas da conta (Modelo HOT ou Produto DROP específico)
          const accountSpecificMedia = mediaAssets.filter((m) => m.accountId === acc.id);
          const targetAccountMediaPool = accountSpecificMedia.length > 0 ? accountSpecificMedia : mediaPool;

          const mediaItem = targetAccountMediaPool[mediaIndex % targetAccountMediaPool.length];
          mediaIndex++;

          // Select localized copy
          const categoryCopys = INITIAL_COPYS.filter(
            (c) => c.category === acc.category || c.languageCode === acc.languageCode
          );
          const selectedCopy =
            categoryCopys.length > 0
              ? categoryCopys[mediaIndex % categoryCopys.length]
              : INITIAL_COPYS[0];

          // Select hashtag set
          const categoryHashtags = INITIAL_HASHTAGS.filter(
            (h) => h.category === acc.category || h.languageCode === acc.languageCode
          );
          const selectedHashtagSet =
            categoryHashtags.length > 0
              ? categoryHashtags[mediaIndex % categoryHashtags.length]
              : INITIAL_HASHTAGS[0];

          const ctaText = LocalizationEngine.getCtaForLanguage(acc.languageCode);

          // Apply slight random time variance if requested (+/- 7 mins)
          let finalTimeStr = timeStr;
          if (options.randomizeTimeVarianceMinutes) {
            const [hh, mm] = timeStr.split(':').map(Number);
            const randomVariance = Math.floor((Math.random() - 0.5) * options.randomizeTimeVarianceMinutes * 2);
            const totalMinutes = Math.max(0, Math.min(1439, hh * 60 + mm + randomVariance));
            const newH = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
            const newM = String(totalMinutes % 60).padStart(2, '0');
            finalTimeStr = `${newH}:${newM}`;
          }

          const scheduledFor = `${dateString} ${finalTimeStr}:00`;
          const accountLocalTime = `${finalTimeStr} (${acc.timezone.split('/')[1] || acc.timezone})`;

          const job: QueueJob = {
            id: `auto_job_${Math.random().toString(36).substring(2, 10)}`,
            accountId: acc.id,
            accountName: acc.name,
            category: acc.category,
            platform: 'instagram',
            mediaId: mediaItem.id,
            mediaTitle: `${mediaItem.title} (Dia ${day})`,
            mediaType: mediaItem.type,
            copyId: selectedCopy.id,
            hashtagId: selectedHashtagSet.id,
            ctaId: `cta_${acc.languageCode}`,
            scheduledFor,
            accountLocalTime,
            status: 'QUEUED',
            attempts: 0,
            createdAt: new Date().toISOString(),
          };

          jobs.push(job);
          jobsPerAccount[acc.id] = (jobsPerAccount[acc.id] || 0) + 1;
        });
      });
    }

    const startDateStr = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
    const endDateObj = new Date(now);
    endDateObj.setDate(now.getDate() + options.daysCount);
    const endDateStr = endDateObj.toISOString().split('T')[0];

    return {
      totalJobsGenerated: jobs.length,
      startDate: startDateStr,
      endDate: endDateStr,
      daysCovered: options.daysCount,
      jobsPerAccount,
      jobs,
    };
  }
}
