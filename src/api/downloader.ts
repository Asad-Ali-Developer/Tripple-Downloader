import { MediaPreview, Platform } from "../types";

/**
 * NOTE ON RELIABILITY
 * -------------------
 * TikTok, Instagram, and YouTube do not offer official "download" APIs, so
 * this app relies on two free, community-run services:
 *
 *  1. tikwm.com  -> TikTok only, returns a clean no-watermark link. Stable
 *     and used as the primary path for TikTok.
 *
 *  2. Cobalt (open-source, https://github.com/imputnet/cobalt) -> supports
 *     TikTok, Instagram, and YouTube through one API. Used for Instagram/
 *     YouTube and as a fallback for TikTok.
 *
 * IMPORTANT — YouTube specifically:
 * As of mid-2026, YouTube actively blocks the public cobalt.tools instance
 * at the network level, so YouTube links will frequently fail no matter how
 * this code is written — that's a platform-side block, not a bug here.
 * TikTok and Instagram are not affected the same way.
 *
 * The real fix for reliable YouTube support is running your OWN free Cobalt
 * instance (e.g. Railway's one-click deploy: https://railway.com/deploy/cobalt-youtube-downloader).
 * Once you have your own instance URL, just change COBALT_API below to it
 * (e.g. "https://your-app.up.railway.app") and everything else keeps working
 * unchanged.
 */

const COBALT_API = "https://api.cobalt.tools/"; // swap for your own self-hosted URL for reliable YouTube
const TIKWM_API = "https://www.tikwm.com/api/";

async function fetchTikTokViaTikwm(url: string): Promise<MediaPreview> {
  const res = await fetch(`${TIKWM_API}?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error("TikTok service unavailable right now");
  const json = await res.json();
  if (json.code !== 0 || !json.data) {
    throw new Error("Could not read that TikTok link. Make sure it is public.");
  }
  const d = json.data;
  return {
    title: d.title || "TikTok video",
    thumbnail: d.cover,
    author: d.author?.nickname,
    downloadUrl: d.play, // no-watermark direct mp4 link
    type: "video",
  };
}

async function fetchViaCobalt(
  url: string,
  platform: Platform,
): Promise<MediaPreview> {
  let res: Response;
  try {
    res = await fetch(COBALT_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        url,
        videoQuality: "720",
        downloadMode: "auto",
        filenameStyle: "basic",
      }),
    });
  } catch {
    throw new Error(
      "Could not reach the download service. Check your connection and try again.",
    );
  }

  const data = await res.json().catch(() => null);

  if (!data) {
    throw new Error("The download service returned an unexpected response.");
  }

  if (data.status === "error") {
    const code: string = data.error?.code || "";
    if (platform === "youtube" && /youtube|bot|forbidden/i.test(code)) {
      throw new Error(
        "YouTube is blocking the free public download service right now. This is a known platform-side block, not an app bug — see README.md for how to fix it with a free self-hosted instance.",
      );
    }
    throw new Error(
      "This link could not be resolved. It may be private, region-locked, or unsupported.",
    );
  }

  // tunnel / redirect -> single direct file
  if (data.status === "tunnel" || data.status === "redirect") {
    return {
      title:
        data.filename ||
        (platform === "youtube" ? "YouTube video" : "Instagram video"),
      thumbnail: "",
      downloadUrl: data.url,
      type: "video",
    };
  }

  // picker -> multiple items (e.g. Instagram carousel), take the first video/photo
  if (
    data.status === "picker" &&
    Array.isArray(data.picker) &&
    data.picker.length > 0
  ) {
    const first =
      data.picker.find((p: any) => p.type === "video") || data.picker[0];
    return {
      title: platform === "youtube" ? "YouTube video" : "Instagram post",
      thumbnail: first.thumb || "",
      downloadUrl: first.url,
      type: first.type === "photo" ? "image" : "video",
    };
  }

  throw new Error("This link could not be resolved.");
}

export async function fetchPreview(
  platform: Platform,
  rawUrl: string,
): Promise<MediaPreview> {
  const url = rawUrl.trim();
  if (!url) throw new Error("Please paste a link first.");
  if (!/^https?:\/\//i.test(url)) {
    throw new Error("That does not look like a valid URL.");
  }

  if (platform === "tiktok") {
    try {
      return await fetchTikTokViaTikwm(url);
    } catch {
      return await fetchViaCobalt(url, platform);
    }
  }

  return await fetchViaCobalt(url, platform);
}
