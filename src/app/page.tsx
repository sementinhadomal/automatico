'use client';

import React, { useState, useEffect } from 'react';
import { CategoryType, SystemUser, Account, MediaAsset, QueueJob, ExecutionLog } from '@/types';
import {
  INITIAL_USERS,
  INITIAL_ACCOUNTS,
  INITIAL_MEDIA_ASSETS,
  INITIAL_QUEUE_JOBS,
  INITIAL_EXECUTION_LOGS,
} from '@/lib/mockData';
import { Header } from '@/components/Header';
import { Sidebar, TabType } from '@/components/Sidebar';
import { DashboardView } from '@/components/DashboardView';
import { AccountsView } from '@/components/AccountsView';
import { CentralLibraryView } from '@/components/CentralLibraryView';
import { ImageStudioView } from '@/components/ImageStudioView';
import { VideoStudioView } from '@/components/VideoStudioView';
import { CampaignsView } from '@/components/CampaignsView';
import { AutoPublisherView } from '@/components/AutoPublisherView';
import { ExecutionHistoryView } from '@/components/ExecutionHistoryView';
import { ReportsView } from '@/components/ReportsView';
import { SwaggerDocsView } from '@/components/SwaggerDocsView';
import { SystemLogsQueueView } from '@/components/SystemLogsQueueView';
import { AntiDetectBrowserView } from '@/components/AntiDetectBrowserView';
import { AnalyticsDashboardView } from '@/components/AnalyticsDashboardView';
import { MediaDownloaderView } from '@/components/MediaDownloaderView';
import { VideoLabView } from '@/components/VideoLabView';

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'ALL'>('ALL');
  const [currentUser, setCurrentUser] = useState<SystemUser>(INITIAL_USERS[0]);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(INITIAL_MEDIA_ASSETS);
  const [queueJobs, setQueueJobs] = useState<QueueJob[]>(INITIAL_QUEUE_JOBS);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>(INITIAL_EXECUTION_LOGS);
  
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  useEffect(() => {
    const savedAccounts = localStorage.getItem('omni_media_accounts');
    if (savedAccounts) {
      try {
        setAccounts(JSON.parse(savedAccounts));
      } catch (e) {}
    }
    setIsStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (isStorageLoaded) {
      localStorage.setItem('omni_media_accounts', JSON.stringify(accounts));
    }
  }, [accounts, isStorageLoaded]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleToggle2FA = () => {
    setCurrentUser((prev) => ({
      ...prev,
      twoFactorEnabled: !prev.twoFactorEnabled,
    }));
  };

  const handleNewExecutionLog = (newLog: ExecutionLog) => {
    setExecutionLogs((prev) => [newLog, ...prev]);
  };

  const handleBatchScheduleGenerated = (newJobs: QueueJob[]) => {
    setQueueJobs((prev) => [...newJobs, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Header */}
      <Header
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        onToggle2FA={handleToggle2FA}
      />

      {/* Main Layout Container */}
      <div className="flex">
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Main View Area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto min-w-0">
          {activeTab === 'antidetect_browser' && (
            <AntiDetectBrowserView
              accounts={accounts}
              selectedCategory={selectedCategory}
              onUpdateAccounts={(updated) => setAccounts(updated)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboardView
              accounts={accounts}
              selectedCategory={selectedCategory}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              accounts={accounts}
              mediaAssets={mediaAssets}
              queueJobs={queueJobs}
              executionLogs={executionLogs}
              selectedCategory={selectedCategory}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}


          {activeTab === 'library' && (
            <CentralLibraryView 
              mediaAssets={mediaAssets}
              accounts={accounts}
              selectedCategory={selectedCategory} 
              onUpdateMediaAssets={setMediaAssets}
            />
          )}

          {activeTab === 'media_downloader' && (
            <MediaDownloaderView
              accounts={accounts}
              mediaAssets={mediaAssets}
              selectedCategory={selectedCategory}
              onImportToLibrary={(newAssets) => setMediaAssets([...newAssets, ...mediaAssets])}
            />
          )}

          {activeTab === 'sharp_editor' && <ImageStudioView mediaAssets={mediaAssets} />}

          {activeTab === 'ffmpeg_editor' && <VideoStudioView mediaAssets={mediaAssets} />}

          {activeTab === 'video_lab_pro' && <VideoLabView />}

          {activeTab === 'campaigns' && (
            <CampaignsView
              accounts={accounts}
              mediaAssets={mediaAssets}
              selectedCategory={selectedCategory}
              onScheduleGenerated={handleBatchScheduleGenerated}
            />
          )}

          {activeTab === 'auto_publisher' && (
            <AutoPublisherView
              accounts={accounts}
              mediaAssets={mediaAssets}
              selectedCategory={selectedCategory}
              onPublishSuccess={handleNewExecutionLog}
            />
          )}

          {activeTab === 'history' && <ExecutionHistoryView executionLogs={executionLogs} />}

          {activeTab === 'reports' && (
            <ReportsView accounts={accounts} selectedCategory={selectedCategory} />
          )}

          {activeTab === 'swagger_api' && <SwaggerDocsView />}

          {activeTab === 'winston_queue' && <SystemLogsQueueView />}
        </main>
      </div>
    </div>
  );
}
