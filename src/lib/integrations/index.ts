import { Account, SocialPublishPayload, PublishResult } from '@/types';

/**
 * Clean Architecture Interface for Social Platform Integration Adapters.
 * Decouples all core content, scheduling, localization, queue, and editor logic
 * from target platforms (Instagram, TikTok, YouTube, X/Twitter, Telegram, Webhook).
 */
export interface ISocialPlatformAdapter {
  platformId: string;
  platformName: string;
  supportedMediaTypes: Array<'IMAGE' | 'VIDEO'>;
  
  /**
   * Validates account credentials & proxy status prior to publishing.
   */
  validateAuth(account: Account): Promise<{ valid: boolean; message: string; latencyMs: number }>;

  /**
   * Publishes media asset with localized caption, hashtags, and CTA.
   */
  publishContent(payload: SocialPublishPayload): Promise<PublishResult>;

  /**
   * Retrieves post performance telemetry.
   */
  getPostAnalytics(postId: string): Promise<{ views: number; likes: number; shares: number; comments: number }>;
}

export class InstagramPlatformAdapter implements ISocialPlatformAdapter {
  platformId = 'instagram';
  platformName = 'Instagram Reels / Feed';
  supportedMediaTypes: Array<'IMAGE' | 'VIDEO'> = ['IMAGE', 'VIDEO'];

  async validateAuth(account: Account) {
    // Simulated authentication check over proxy
    const isSuccess = account.proxy.status === 'ACTIVE' && account.status !== 'OFFLINE';
    return {
      valid: isSuccess,
      message: isSuccess ? 'Instagram Graph API session valid via proxy' : 'Proxy latency timeout or session expired',
      latencyMs: account.proxy.latencyMs || 120,
    };
  }

  async publishContent(payload: SocialPublishPayload): Promise<PublishResult> {
    const startTime = Date.now();
    // Simulate API delay over proxy
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (payload.accountUsername.includes('error')) {
      return {
        success: false,
        error: 'Instagram API RateLimitExceeded: Proxy IP throttled (429)',
        executionTimeMs: Date.now() - startTime,
      };
    }

    const mockPostId = `ig_${Math.random().toString(36).substring(2, 10)}`;
    return {
      success: true,
      postId: mockPostId,
      platformResponse: {
        status: 'published',
        media_id: mockPostId,
        permalink: `https://instagram.com/p/${mockPostId}`,
        timestamp: new Date().toISOString(),
      },
      executionTimeMs: Date.now() - startTime,
    };
  }

  async getPostAnalytics(postId: string) {
    return {
      views: Math.floor(Math.random() * 15000) + 1200,
      likes: Math.floor(Math.random() * 2400) + 180,
      shares: Math.floor(Math.random() * 450) + 30,
      comments: Math.floor(Math.random() * 120) + 12,
    };
  }
}

export class TikTokPlatformAdapter implements ISocialPlatformAdapter {
  platformId = 'tiktok';
  platformName = 'TikTok Video Engine';
  supportedMediaTypes: Array<'IMAGE' | 'VIDEO'> = ['VIDEO'];

  async validateAuth(account: Account) {
    return {
      valid: true,
      message: 'TikTok Open API OAuth token active',
      latencyMs: account.proxy.latencyMs || 95,
    };
  }

  async publishContent(payload: SocialPublishPayload): Promise<PublishResult> {
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 650));

    const mockPostId = `tt_${Math.random().toString(36).substring(2, 10)}`;
    return {
      success: true,
      postId: mockPostId,
      platformResponse: {
        share_id: mockPostId,
        status: 'PUBLIC',
        embed_link: `https://tiktok.com/@${payload.accountUsername}/video/${mockPostId}`,
      },
      executionTimeMs: Date.now() - startTime,
    };
  }

  async getPostAnalytics(postId: string) {
    return {
      views: Math.floor(Math.random() * 45000) + 3500,
      likes: Math.floor(Math.random() * 6800) + 400,
      shares: Math.floor(Math.random() * 1200) + 90,
      comments: Math.floor(Math.random() * 310) + 25,
    };
  }
}

export class YouTubeShortsPlatformAdapter implements ISocialPlatformAdapter {
  platformId = 'youtube_shorts';
  platformName = 'YouTube Shorts API';
  supportedMediaTypes: Array<'IMAGE' | 'VIDEO'> = ['VIDEO'];

  async validateAuth(account: Account) {
    return {
      valid: true,
      message: 'YouTube Data API v3 Refresh Token verified',
      latencyMs: account.proxy.latencyMs || 80,
    };
  }

  async publishContent(payload: SocialPublishPayload): Promise<PublishResult> {
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 900));

    const mockPostId = `yt_${Math.random().toString(36).substring(2, 10)}`;
    return {
      success: true,
      postId: mockPostId,
      platformResponse: {
        videoId: mockPostId,
        url: `https://youtube.com/shorts/${mockPostId}`,
      },
      executionTimeMs: Date.now() - startTime,
    };
  }

  async getPostAnalytics(postId: string) {
    return {
      views: Math.floor(Math.random() * 28000) + 2000,
      likes: Math.floor(Math.random() * 3200) + 250,
      shares: Math.floor(Math.random() * 300) + 20,
      comments: Math.floor(Math.random() * 180) + 15,
    };
  }
}

export class TwitterXPlatformAdapter implements ISocialPlatformAdapter {
  platformId = 'twitter_x';
  platformName = 'X / Twitter Media API';
  supportedMediaTypes: Array<'IMAGE' | 'VIDEO'> = ['IMAGE', 'VIDEO'];

  async validateAuth(account: Account) {
    return {
      valid: true,
      message: 'X OAuth 2.0 User Token Verified',
      latencyMs: account.proxy.latencyMs || 110,
    };
  }

  async publishContent(payload: SocialPublishPayload): Promise<PublishResult> {
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 550));

    const mockPostId = `tw_${Math.random().toString(36).substring(2, 10)}`;
    return {
      success: true,
      postId: mockPostId,
      platformResponse: {
        tweet_id: mockPostId,
        text: payload.caption,
      },
      executionTimeMs: Date.now() - startTime,
    };
  }

  async getPostAnalytics(postId: string) {
    return {
      views: Math.floor(Math.random() * 19000) + 1100,
      likes: Math.floor(Math.random() * 1500) + 120,
      shares: Math.floor(Math.random() * 210) + 18,
      comments: Math.floor(Math.random() * 85) + 8,
    };
  }
}

export class GenericWebhookAdapter implements ISocialPlatformAdapter {
  platformId = 'webhook';
  platformName = 'Custom Automation Webhook (n8n / Make / OnlyFans / Fansly)';
  supportedMediaTypes: Array<'IMAGE' | 'VIDEO'> = ['IMAGE', 'VIDEO'];

  async validateAuth(account: Account) {
    return {
      valid: true,
      message: 'Webhook HTTP Endpoint reachable',
      latencyMs: 45,
    };
  }

  async publishContent(payload: SocialPublishPayload): Promise<PublishResult> {
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 350));

    return {
      success: true,
      postId: `wh_${Math.random().toString(36).substring(2, 10)}`,
      platformResponse: {
        delivered: true,
        endpoint: 'https://api.automation.internal/v1/dispatch',
      },
      executionTimeMs: Date.now() - startTime,
    };
  }

  async getPostAnalytics(postId: string) {
    return { views: 5000, likes: 450, shares: 80, comments: 25 };
  }
}

/**
 * Registry Pattern for managing integration adapters dynamically.
 */
export class PlatformIntegrationRegistry {
  private static adapters: Map<string, ISocialPlatformAdapter> = new Map([
    ['instagram', new InstagramPlatformAdapter()],
    ['tiktok', new TikTokPlatformAdapter()],
    ['youtube_shorts', new YouTubeShortsPlatformAdapter()],
    ['twitter_x', new TwitterXPlatformAdapter()],
    ['webhook', new GenericWebhookAdapter()],
  ]);

  public static getAdapter(platformId: string): ISocialPlatformAdapter {
    const adapter = this.adapters.get(platformId);
    if (!adapter) {
      return this.adapters.get('instagram')!;
    }
    return adapter;
  }

  public static registerAdapter(adapter: ISocialPlatformAdapter) {
    this.adapters.set(adapter.platformId, adapter);
  }

  public static getAllAdapters(): ISocialPlatformAdapter[] {
    return Array.from(this.adapters.values());
  }
}
