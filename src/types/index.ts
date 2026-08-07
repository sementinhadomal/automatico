export type CategoryType = 'HOT' | 'DROP';

export type AccountStatus = 'ONLINE' | 'OFFLINE' | 'ERROR' | 'SYNCING';

export type ProxyProtocol = 'HTTP' | 'HTTPS' | 'SOCKS5';

export interface ProxyConfig {
  id: string;
  ip: string;
  port: number;
  username?: string;
  password?: string;
  protocol: ProxyProtocol;
  latencyMs: number;
  status: 'ACTIVE' | 'FAILED' | 'TESTING';
  lastTestedAt?: string;
}

export interface Account {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  category: CategoryType;
  country: string;
  countryCode: string;
  language: string;
  languageCode: string;
  timezone: string; // e.g. 'America/New_York'
  city: string;
  state: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  proxy: ProxyConfig;
  cookies: string;
  status: AccountStatus;
  lastLogin: string;
  lastPublication: string;
  publishedCount: number;
  errorCount: number;
  notes: string;
  tags: string[];
  adsPowerId?: string;
}

export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO';

export interface MediaAsset {
  id: string;
  title: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  category: CategoryType;
  accountId?: string; // ID da conta exclusiva da mídia
  languageCode: string;
  countryCode: string;
  tags: string[];
  status: 'READY' | 'PROCESSING' | 'ARCHIVED';
  dimensions?: string;
  durationSeconds?: number;
  sizeMb: number;
  createdAt: string;
  variantsCount: number;
}

export interface CopyItem {
  id: string;
  title: string;
  text: string;
  languageCode: string;
  category: CategoryType;
  tags: string[];
  status: 'ACTIVE' | 'DRAFT';
  usedCount: number;
}

export interface HashtagSet {
  id: string;
  title: string;
  hashtags: string[];
  languageCode: string;
  countryCode: string;
  category: CategoryType;
  tags: string[];
  status: 'ACTIVE';
}

export interface CtaItem {
  id: string;
  languageCode: string;
  actionText: string;
  context: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  durationSeconds: number;
  trendingRank: number;
}

export interface Campaign {
  id: string;
  name: string;
  category: CategoryType;
  accountIds: string[];
  mediaIds: string[];
  startDate: string;
  endDate: string;
  scheduleTimes: string[]; // e.g. ["09:00", "15:00", "21:00"]
  languageCode: string;
  countryCode: string;
  objective: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT';
}

export type QueueJobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DELAYED';

export interface QueueJob {
  id: string;
  accountId: string;
  accountName: string;
  category: CategoryType;
  platform: string;
  mediaId: string;
  mediaTitle: string;
  mediaType: MediaType;
  copyId: string;
  hashtagId: string;
  ctaId: string;
  scheduledFor: string;
  accountLocalTime: string;
  status: QueueJobStatus;
  attempts: number;
  errorMessage?: string;
  createdAt: string;
}

export interface ExecutionLog {
  id: string;
  jobId: string;
  accountId: string;
  accountName: string;
  category: CategoryType;
  platform: string;
  languageCode: string;
  countryCode: string;
  mediaTitle: string;
  copyUsed: string;
  hashtagsUsed: string[];
  ctaUsed: string;
  executionTimeMs: number;
  result: 'SUCCESS' | 'ERROR';
  statusCode: number;
  logDetail: string;
  timestamp: string;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EDITOR';
  avatar: string;
  twoFactorEnabled: boolean;
  lastActive: string;
}

export interface ImageProcessingOptions {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  sharpness: number; // 0 to 100
  zoom: number; // 1.0 to 2.0
  cropAspect: '1:1' | '9:16' | '4:5' | '16:9' | 'original';
  mirrorHorizontal: boolean;
  mirrorVertical: boolean;
  rotateDeg: number; // -15 to 15
  noiseLevel: number; // 0 to 100
  borderWidth: number; // 0 to 50
  borderColor: string;
  watermarkText?: string;
  compressionQuality: number; // 1 to 100
}

export interface VideoProcessingOptions {
  zoom: number; // 1.0 to 2.0
  cropAspect: '9:16' | '16:9' | '1:1';
  speedMultiplier: number; // 0.5 to 2.0
  mirror: boolean;
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
  colorShift: number; // -50 to 50
  sharpness: number; // 0 to 100
  noise: number; // 0 to 100
  blur: number; // 0 to 50
  compressionBitrate: string; // e.g. '4M', '2M'
  trimStartSec: number;
  trimEndSec: number;
  fadeInSec: number;
  fadeOutSec: number;
  subtitleText?: string;
  overlayLogoUrl?: string;
  musicTrackId?: string;
  audioVolume: number; // 0 to 100
  musicVolume: number; // 0 to 100
}

export interface SocialPublishPayload {
  accountId: string;
  accountUsername: string;
  proxy: ProxyConfig;
  cookies: string;
  mediaUrl: string;
  mediaType: MediaType;
  caption: string;
  hashtags: string[];
  cta: string;
  scheduledTime: string;
}

export interface PublishResult {
  success: boolean;
  postId?: string;
  platformResponse?: any;
  error?: string;
  executionTimeMs: number;
}
