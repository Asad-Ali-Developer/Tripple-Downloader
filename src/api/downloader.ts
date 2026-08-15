import { MediaPreview, Platform } from '../types';

/**
 * NOTE ON RELIABILITY
 * -------------------
 * TikTok, Instagram, and YouTube do not offer official "download this video"
 * endpoints. This app relies on two free, key-free, community-run services:
 *
 *  1. tikwm.com  -> TikTok only, returns a clean no-watermark link. Generally
 *     stable and the primary path for TikTok.
 *
 *  2. Cobalt (public instance, https://github.com/imputnet/cobalt) -> an
 *     open-source, actively maintained downloader that supports TikTok,
 *     Instagram, and YouTube through one API. Used as the primary path for
 *     Instagram/YouTube and as a fallback for TikTok.
 *
 * Because these are unofficial/community services (not run by Anthropic or
 * by TikTok/Instagram/YouTube), they can change their API shape, add rate
 * limits, or go down without notice. If that happens, update COBALT_API
 * below to whatever the current public instance URL is (check
 * https://github.com/imputnet/cobalt for the latest), or self-host your own
 * Cobalt instance for full reliability (see README.md).
 */

const COBALT_API = 'https://api.cobalt.tools/api/json';
const TIKWM_API = 'https://www.tikwm.com/api/';

async function fetchTikTokViaTikwm(url: string): Promise<MediaPreview> {
  const res = await fetch(`${TIKWM_API}?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error('TikTok service unavailable right now');
  const json = await res.json();
  if (json.code !== 0 || !json.data) {
    throw new Error('Could not read that TikTok link. Make sure it is public.');
  }
  const d = json.data;
  return {
    title: d.title || 'TikTok video',
    thumbnail: d.cover,
    author: d.author?.nickname,
    downloadUrl: d.play, // no-watermark direct mp4 link
    type: 'video',
  };
}

async function fetchViaCobalt(url: string, platform: Platform): Promise<MediaPreview> {
  const res = await fetch(COBALT_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      url,
      vQuality: '720',
      isAudioOnly: false,
      filenamePattern: 'basic',
    }),
  });

  if (!res.ok) {
    throw new Error(
      platform === 'youtube'
        ? 'YouTube link could not be processed. Very long videos or age-restricted/private videos are not supported.'
        : 'Instagram link could not be processed. Make sure the post is public.'
    );
  }

  const data = await res.json();

  if (data.status === 'error' || !data.url) {
    throw new Error(data.text || 'This link could not be resolved.');
  }

  return {
    title: data.title || (platform === 'youtube' ? 'YouTube video' : 'Instagram video'),
    thumbnail: data.thumb || '',
    downloadUrl: data.url,
    type: data.audio ? 'video' : 'video',
  };
}

export async function fetchPreview(platform: Platform, rawUrl: string): Promise<MediaPreview> {
  const url = rawUrl.trim();
  if (!url) throw new Error('Please paste a link first.');
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('That does not look like a valid URL.');
  }

  if (platform === 'tiktok') {
    try {
      return await fetchTikTokViaTikwm(url);
    } catch (primaryError) {
      // Fall back to Cobalt if tikwm fails or is down
      return await fetchViaCobalt(url, platform);
    }
  }

  return await fetchViaCobalt(url, platform);
}
