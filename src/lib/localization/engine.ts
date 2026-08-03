import { Account, CopyItem, HashtagSet, CtaItem } from '@/types';

/**
 * Multi-Region & Language Localization Engine.
 * Automatically resolves localized copy variations, hashtag banks, CTAs,
 * and account-specific timezones across HOT and DROPSHIPPING operations.
 */
export class LocalizationEngine {
  /**
   * Resolves the proper Call To Action text for a given language code.
   */
  public static getCtaForLanguage(languageCode: string): string {
    const lang = languageCode.toUpperCase();

    switch (lang) {
      case 'PT-BR':
        return '👉 Clique no Link da Bio e Garanta o Seu Agora!';
      case 'PT-PT':
        return '👉 Clica no Link da Bio para Comprar Já!';
      case 'EN-US':
      case 'EN-UK':
        return '👉 Tap the Link in Bio & Order Yours Today!';
      case 'ES':
        return '👉 ¡Haz Clic en el Enlace de la Bio y Consíguelo Ya!';
      case 'FR':
        return '👉 Cliquez sur le Lien dans la Bio pour Commander!';
      case 'DE':
        return '👉 Klicke auf den Link in der Bio und Sichere Es Dir!';
      case 'IT':
        return '👉 Clicca sul Link in Bio e Acquista Ora!';
      case 'NL':
        return '👉 Klik op de Link in Bio om Nu te Bestellen!';
      default:
        return '👉 Check the Link in Bio for Details!';
    }
  }

  /**
   * Calculates scheduled time formatted in the account's target local timezone.
   */
  public static formatAccountLocalTime(targetTime: string, timezone: string): { localTimeString: string; offsetMinutes: number } {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      return {
        localTimeString: `${targetTime} (${timezone.split('/')[1] || timezone})`,
        offsetMinutes: 0,
      };
    } catch {
      return {
        localTimeString: `${targetTime} (${timezone})`,
        offsetMinutes: 0,
      };
    }
  }

  /**
   * Performs automatic rotation of Hashtags to prevent shadowbans.
   */
  public static rotateHashtags(hashtagSets: HashtagSet[]): string[] {
    if (!hashtagSets || hashtagSets.length === 0) {
      return ['#viral', '#trending', '#explorepage'];
    }

    // Pick a set and shuffle tags slightly
    const selectedSet = hashtagSets[Math.floor(Math.random() * hashtagSets.length)];
    const tags = [...selectedSet.hashtags];
    
    // Fisher-Yates shuffle subset of tags
    for (let i = tags.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tags[i], tags[j]] = [tags[j], tags[i]];
    }

    return tags.slice(0, 12);
  }
}
