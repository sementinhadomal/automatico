import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';

interface PostJob {
  platform: 'tiktok' | 'youtube' | 'instagram' | 'x_twitter';
  profileId: string;
  cdpPort: number;
  videoPath: string;
  caption: string;
  hashtags: string;
}

// TikTok upload flow
async function postToTikTok(page: any, videoPath: string, caption: string, hashtags: string) {
  try {
    await page.goto('https://www.tiktok.com/upload', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('input[type="file"]', { timeout: 15000 });
    const fileInput = await page.$('input[type="file"]');
    await fileInput?.uploadFile(videoPath);
    await page.waitForSelector('[data-e2e="caption-input"], .DraftEditor-root, [contenteditable="true"]', { timeout: 20000 });
    await page.click('[data-e2e="caption-input"], .DraftEditor-root, [contenteditable="true"]');
    await page.keyboard.type(`${caption} ${hashtags}`, { delay: 50 });
    // Wait for video to process
    await page.waitForTimeout(5000);
    // Click post button
    const postBtn = await page.$('[data-e2e="post-btn"], button[class*="post"]');
    if (postBtn) {
      await postBtn.click();
      return { success: true, platform: 'tiktok' };
    }
    return { success: false, platform: 'tiktok', error: 'Post button not found' };
  } catch (err: any) {
    return { success: false, platform: 'tiktok', error: err.message };
  }
}

// YouTube Shorts upload flow
async function postToYouTube(page: any, videoPath: string, caption: string, hashtags: string) {
  try {
    await page.goto('https://studio.youtube.com', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('#upload-btn, ytcp-button#create-icon', { timeout: 15000 });
    await page.click('#upload-btn, ytcp-button#create-icon');
    await page.waitForSelector('input[type="file"]', { timeout: 10000 });
    const fileInput = await page.$('input[type="file"]');
    await fileInput?.uploadFile(videoPath);
    await page.waitForSelector('#title-textarea', { timeout: 20000 });
    await page.click('#title-textarea');
    await page.keyboard.type(`${caption} ${hashtags} #Shorts`, { delay: 50 });
    // Click "Next" button 3 times then "Publish"
    for (let i = 0; i < 3; i++) {
      await page.waitForSelector('#next-button', { timeout: 10000 });
      await page.click('#next-button');
      await page.waitForTimeout(1500);
    }
    await page.waitForSelector('#done-button', { timeout: 10000 });
    await page.click('#done-button');
    return { success: true, platform: 'youtube' };
  } catch (err: any) {
    return { success: false, platform: 'youtube', error: err.message };
  }
}

// Instagram Reels upload flow
async function postToInstagram(page: any, videoPath: string, caption: string, hashtags: string) {
  try {
    await page.goto('https://www.instagram.com', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('svg[aria-label="New post"], a[href="/create/select/"]', { timeout: 15000 });
    await page.click('svg[aria-label="New post"], a[href="/create/select/"]');
    await page.waitForSelector('input[type="file"]', { timeout: 10000 });
    const fileInput = await page.$('input[type="file"]');
    await fileInput?.uploadFile(videoPath);
    // Navigate through the upload steps
    await page.waitForTimeout(3000);
    const nextBtn = await page.$('button:has-text("Next"), div[role="button"]:has-text("Next")');
    if (nextBtn) await nextBtn.click();
    await page.waitForTimeout(2000);
    const nextBtn2 = await page.$('button:has-text("Next"), div[role="button"]:has-text("Next")');
    if (nextBtn2) await nextBtn2.click();
    await page.waitForTimeout(1000);
    const captionField = await page.$('textarea[aria-label="Write a caption..."], div[contenteditable="true"]');
    if (captionField) {
      await captionField.click();
      await page.keyboard.type(`${caption} ${hashtags}`, { delay: 50 });
    }
    const shareBtn = await page.$('button:has-text("Share"), div[role="button"]:has-text("Share")');
    if (shareBtn) {
      await shareBtn.click();
      return { success: true, platform: 'instagram' };
    }
    return { success: false, platform: 'instagram', error: 'Share button not found' };
  } catch (err: any) {
    return { success: false, platform: 'instagram', error: err.message };
  }
}

// X/Twitter upload flow
async function postToX(page: any, videoPath: string, caption: string, hashtags: string) {
  try {
    await page.goto('https://x.com', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('[data-testid="tweetButtonInline"], a[href="/compose/post"]', { timeout: 15000 });
    await page.click('[data-testid="tweetButtonInline"], a[href="/compose/post"]');
    await page.waitForSelector('[data-testid="fileInput"]', { timeout: 10000 });
    const fileInput = await page.$('[data-testid="fileInput"]');
    await fileInput?.uploadFile(videoPath);
    await page.waitForTimeout(3000);
    await page.click('[data-testid="tweetTextarea_0"], div[contenteditable="true"]');
    await page.keyboard.type(`${caption} ${hashtags}`, { delay: 50 });
    await page.waitForTimeout(2000);
    const tweetBtn = await page.$('[data-testid="tweetButton"]');
    if (tweetBtn) {
      await tweetBtn.click();
      return { success: true, platform: 'x_twitter' };
    }
    return { success: false, platform: 'x_twitter', error: 'Tweet button not found' };
  } catch (err: any) {
    return { success: false, platform: 'x_twitter', error: err.message };
  }
}

export async function POST(req: Request) {
  let browser: any = null;
  try {
    const body = await req.json() as PostJob;
    const { platform, cdpPort, videoPath, caption, hashtags } = body;

    // Connect to the already-open Chrome via CDP (no new browser launch needed)
    browser = await puppeteer.connect({
      browserURL: `http://127.0.0.1:${cdpPort}`,
      defaultViewport: null,
    });

    const pages = await browser.pages();
    let page = pages[0];

    // Open a new tab for the post
    page = await browser.newPage();

    let result;
    switch (platform) {
      case 'tiktok':
        result = await postToTikTok(page, videoPath, caption, hashtags);
        break;
      case 'youtube':
        result = await postToYouTube(page, videoPath, caption, hashtags);
        break;
      case 'instagram':
        result = await postToInstagram(page, videoPath, caption, hashtags);
        break;
      case 'x_twitter':
        result = await postToX(page, videoPath, caption, hashtags);
        break;
      default:
        result = { success: false, error: 'Platform not supported' };
    }

    await page.close();

    return NextResponse.json(result);

  } catch (err: any) {
    console.error('[AutoPost] Error:', err.message);
    return NextResponse.json({
      success: false,
      error: err.message,
      hint: 'Make sure the Chrome browser is open and was launched via the OmniMedia .bat file.',
    }, { status: 500 });
  } finally {
    // Disconnect without closing the browser (it stays open for the user)
    if (browser) browser.disconnect();
  }
}
