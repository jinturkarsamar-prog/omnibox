var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
function getYoutubeId(url) {
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}
function shouldBypassFetch(url) {
  const lower = url.toLowerCase();
  return lower.includes("pinterest.com") || lower.includes("pin.it") || lower.includes("instagram.com") || lower.includes("instagr.am") || lower.includes("tiktok.com") || lower.includes("twitter.com") || lower.includes("x.com") || lower.includes("facebook.com") || lower.includes("threads.net");
}
async function fetchWithTimeout(url, timeoutMs = 1500, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        ...options.headers || {}
      },
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}
function extractHtmlMetadata(html, url) {
  const result = {};
  try {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      result.title = titleMatch[1].trim().replace(/\s+/g, " ").replace(/ - Pinterest$/i, "").replace(/ \| Pinterest$/i, "");
    }
    const ogTitleMatch = html.match(/<meta[^>]+(?:property|name)="og:title"[^>]+content="([^"]+)"/i) || html.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:title"/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      result.title = ogTitleMatch[1].trim();
    }
    const ogImageMatch = html.match(/<meta[^>]+(?:property|name)="og:image"[^>]+content="([^"]+)"/i) || html.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:image"/i) || html.match(/<meta[^>]+(?:property|name)="twitter:image"[^>]+content="([^"]+)"/i) || html.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="twitter:image"/i);
    if (ogImageMatch && ogImageMatch[1]) {
      result.previewUrl = ogImageMatch[1];
    }
    const descMatch = html.match(/<meta[^>]+(?:property|name)="og:description"[^>]+content="([^"]+)"/i) || html.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:description"/i) || html.match(/<meta[^>]+(?:property|name)="description"[^>]+content="([^"]+)"/i) || html.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="description"/i);
    if (descMatch && descMatch[1]) {
      result.note = descMatch[1].trim();
    }
  } catch (err) {
    console.error("[OmniBox] Metadata parser error:", err);
  }
  return result;
}
function heuristicScrape(url) {
  const lowercaseUrl = url.toLowerCase();
  let platform = "Other";
  let format = "Website";
  let title = "Saved Link";
  let note = "Saved on OmniBox";
  let previewUrl = "";
  let brandColor = "#3b82f6";
  let tags = ["Inbox"];
  let quoteText = "";
  if (lowercaseUrl.includes("pinimg.com") || /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(lowercaseUrl)) {
    platform = lowercaseUrl.includes("pinimg.com") ? "Pinterest" : "Other";
    format = "Image";
    brandColor = lowercaseUrl.includes("pinimg.com") ? "#bd081c" : "#3b82f6";
    tags = ["Image", "Inspo", "Inbox"];
    title = lowercaseUrl.includes("pinimg.com") ? "Pinterest Image" : "Direct Image Asset";
    previewUrl = url;
    note = "Direct image asset parsed successfully.";
    return { title, note, platform, format, previewUrl, tags, brandColor, quoteText };
  }
  if (lowercaseUrl.includes("youtube.com") || lowercaseUrl.includes("youtu.be")) {
    if (lowercaseUrl.includes("music.youtube.com")) {
      platform = "Music";
      format = lowercaseUrl.includes("list=") ? "Playlist" : "Song";
      brandColor = "#ff0000";
      tags = ["Music", "Inbox"];
      title = format === "Playlist" ? "Music Playlist" : "Music Track";
    } else {
      platform = "YouTube";
      const isShort = lowercaseUrl.includes("/shorts/");
      format = isShort ? "Reel" : lowercaseUrl.includes("list=") ? "Playlist" : "Video";
      brandColor = "#ff0000";
      tags = [isShort ? "Shorts" : format === "Playlist" ? "Playlist" : "Video", "YouTube", "Inbox"];
      title = isShort ? "YouTube Short" : format === "Playlist" ? "YouTube Playlist" : "YouTube Video";
      const ytId = getYoutubeId(url);
      if (ytId) {
        previewUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }
    }
  } else if (lowercaseUrl.includes("instagram.com") || lowercaseUrl.includes("instagr.am")) {
    platform = "Instagram";
    brandColor = "#e1306c";
    previewUrl = "";
    const reserved = /* @__PURE__ */ new Set([
      "p",
      "reel",
      "reels",
      "tv",
      "stories",
      "explore",
      "accounts",
      "direct",
      "about",
      "legal",
      "developer",
      "directory",
      "share",
      "s",
      "_u"
    ]);
    let segs = [];
    try {
      segs = new URL(url).pathname.split("/").filter(Boolean);
    } catch {
      segs = [];
    }
    const lowerSegs = segs.map((s) => s.toLowerCase());
    const isReel = lowerSegs.includes("reel") || lowerSegs.includes("tv") || lowerSegs[0] === "reels" && lowerSegs.length >= 2 || lowerSegs[0] === "share" && lowerSegs[1] === "reel";
    const isPost = lowerSegs.includes("p") || lowerSegs[0] === "stories" || lowerSegs[0] === "share" || lowerSegs[0] === "s";
    const profileHandle = lowerSegs[0] === "_u" && segs[1] ? segs[1].replace(/^@/, "") : segs.length === 1 && !reserved.has(lowerSegs[0]) ? segs[0].replace(/^@/, "") : segs.length === 2 && !reserved.has(lowerSegs[0]) && ["reels", "tagged", "channel", "guides", "live"].includes(lowerSegs[1]) ? segs[0].replace(/^@/, "") : null;
    if (isReel) {
      format = "Reel";
      tags = ["Reels", "Instagram", "Inbox"];
      title = "Instagram Reel";
    } else if (!isPost && profileHandle) {
      format = "Profile";
      tags = ["Profile", "Instagram", "Inbox"];
      title = `Instagram (@${profileHandle})`;
    } else {
      format = "Post";
      tags = ["Social", "Instagram", "Inbox"];
      title = "Instagram Post";
    }
  } else if (lowercaseUrl.includes("tiktok.com")) {
    platform = "TikTok";
    format = "Reel";
    brandColor = "#000000";
    tags = ["TikTok", "Reels", "Inbox"];
    title = "TikTok Video";
  } else if (lowercaseUrl.includes("spotify.com")) {
    platform = "Spotify";
    format = "Audio";
    brandColor = "#1db954";
    tags = ["Spotify", "Audio", "Inbox"];
    title = "Spotify Track";
  } else if (lowercaseUrl.includes("twitter.com") || lowercaseUrl.includes("x.com")) {
    platform = "X / Twitter";
    format = "Post";
    brandColor = "#1da1f2";
    tags = ["Twitter", "Post", "Inbox"];
    title = "X / Twitter Post";
  } else if (lowercaseUrl.includes("pinterest.com") || lowercaseUrl.includes("pin.it")) {
    platform = "Pinterest";
    format = "Image";
    brandColor = "#bd081c";
    tags = ["Inspo", "Design", "Inbox"];
    title = "Pinterest Pin";
    previewUrl = "";
  } else if (lowercaseUrl.includes("threads.net")) {
    platform = "Threads";
    format = "Thread";
    brandColor = "#000000";
    tags = ["Social", "Inbox"];
    title = "Threads Post";
    quoteText = "A thread on Threads";
  } else if (lowercaseUrl.includes("play.google.com")) {
    platform = "Play Store";
    format = lowercaseUrl.includes("/books/") ? "Book" : "App";
    brandColor = "#00a170";
    tags = ["Apps", "Inbox"];
    title = "Google Play Item";
  } else if (lowercaseUrl.includes("google.com") || lowercaseUrl.includes("wikipedia.org") || lowercaseUrl.includes(".org") || lowercaseUrl.includes(".edu") || lowercaseUrl.includes(".com")) {
    platform = "Google";
    format = "Article";
    brandColor = "#4285f4";
    tags = ["Article", "Inbox"];
    title = "Web Article";
  }
  return { title, note, platform, format, previewUrl, tags, brandColor, quoteText };
}
app.post("/api/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }
  let isValidUrl = false;
  try {
    new URL(url);
    isValidUrl = true;
  } catch (_) {
  }
  if (!isValidUrl) {
    return res.status(400).json({ error: "Invalid URL format. Please paste a valid absolute URL (e.g. https://...)" });
  }
  const lowercaseUrl = url.toLowerCase();
  const isDirectImage = lowercaseUrl.includes("pinimg.com") || /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(lowercaseUrl);
  if (isDirectImage) {
    const fallback2 = heuristicScrape(url);
    console.log(`[OmniBox] Direct image detected: ${url}. Returning instantly.`);
    return res.json(fallback2);
  }
  const isInstagram = lowercaseUrl.includes("instagram.com") || lowercaseUrl.includes("instagr.am");
  if (isInstagram) {
    try {
      console.log(`[OmniBox] Instagram URL detected: ${url}. Initiating concurrent proxy scraper...`);
      const shortcodeMatch = url.match(/(?:\/p\/|\/reel\/|\/reels\/|\/tv\/)([^/?#&]+)/i);
      const shortcode = shortcodeMatch ? shortcodeMatch[1] : null;
      const isReel = lowercaseUrl.includes("/reel/") || lowercaseUrl.includes("/reels/");
      if (shortcode) {
        const proxyHosts = ["vxinstagram.com", "ddinstagram.com"];
        const fetchInstagramProxy = async (host) => {
          const proxyUrl = `https://${host}/${isReel ? "reel" : "p"}/${shortcode}/`;
          const proxyRes = await fetchWithTimeout(proxyUrl, 2500, {
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
              "Accept-Language": "en-US,en;q=0.9"
            }
          });
          if (!proxyRes.ok) {
            throw new Error(`${host} status ${proxyRes.status}`);
          }
          const proxyHtml = await proxyRes.text();
          let previewUrl = "";
          const ogImageMatch = proxyHtml.match(/<meta[^>]+(?:property|name)="og:image"[^>]+content="([^"]+)"/i) || proxyHtml.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:image"/i) || proxyHtml.match(/<meta[^>]+(?:property|name)="twitter:image"[^>]+content="([^"]+)"/i) || proxyHtml.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="twitter:image"/i);
          if (ogImageMatch && ogImageMatch[1]) {
            previewUrl = ogImageMatch[1].replace(/&amp;/g, "&");
          }
          let title = isReel ? "Instagram Reel" : "Instagram Post";
          const ogTitleMatch = proxyHtml.match(/<meta[^>]+(?:property|name)="og:title"[^>]+content="([^"]+)"/i) || proxyHtml.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:title"/i);
          if (ogTitleMatch && ogTitleMatch[1]) {
            title = ogTitleMatch[1].trim().replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");
          }
          let note = "View this post on Instagram.";
          const ogDescMatch = proxyHtml.match(/<meta[^>]+(?:property|name)="og:description"[^>]+content="([^"]+)"/i) || proxyHtml.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:description"/i) || proxyHtml.match(/<meta[^>]+(?:property|name)="twitter:description"[^>]+content="([^"]+)"/i) || proxyHtml.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="twitter:description"/i);
          if (ogDescMatch && ogDescMatch[1]) {
            note = ogDescMatch[1].trim().replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");
          }
          if (!previewUrl) {
            throw new Error(`${host} returned no preview image`);
          }
          return {
            title: title.replace(/ - Instagram$/i, "").replace(/ \| Instagram$/i, ""),
            note,
            platform: "Instagram",
            format: isReel ? "Reel" : "Post",
            previewUrl,
            tags: [isReel ? "Reels" : "Social", "Inspo", "Instagram"],
            brandColor: "#e1306c",
            quoteText: null
          };
        };
        const result = await Promise.any(proxyHosts.map(fetchInstagramProxy));
        console.log(`[OmniBox] Instagram concurrent proxy succeeded! Image: ${result.previewUrl}`);
        return res.json(result);
      }
    } catch (err) {
      console.error("[OmniBox] Instagram scraper failed, falling back to heuristics:", err);
    }
  }
  const isPinterest = lowercaseUrl.includes("pinterest.com") || lowercaseUrl.includes("pin.it");
  if (isPinterest) {
    try {
      console.log(`[OmniBox] Pinterest URL detected: ${url}. Fetching official oEmbed...`);
      let resolvedUrl = url;
      if (lowercaseUrl.includes("pin.it")) {
        try {
          const redirectRes = await fetchWithTimeout(url, 1500, {
            method: "HEAD",
            redirect: "manual",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
          });
          const location = redirectRes.headers.get("location");
          if (location) {
            resolvedUrl = location;
            console.log(`[OmniBox] Resolved pin.it redirect to: ${resolvedUrl}`);
          }
        } catch (err) {
          console.error("[OmniBox] HEAD redirect failed, trying GET:", err);
          const redirectRes = await fetchWithTimeout(url, 1500);
          resolvedUrl = redirectRes.url;
        }
      }
      const oembedUrl = `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(resolvedUrl)}`;
      const oembedRes = await fetchWithTimeout(oembedUrl, 1500);
      if (oembedRes.ok) {
        const oembedJson = await oembedRes.json();
        const previewUrl = oembedJson.thumbnail_url || "";
        const title = oembedJson.title || "Pinterest Inspiration";
        const note = oembedJson.author_name ? `Pinned by ${oembedJson.author_name} on Pinterest.` : "Pinterest visual inspiration board.";
        console.log(`[OmniBox] Pinterest oEmbed API succeeded! Image: ${previewUrl}`);
        return res.json({
          title,
          note,
          platform: "Pinterest",
          format: "Image",
          previewUrl,
          tags: ["Inspo", "Design", "Pinterest"],
          brandColor: "#bd081c",
          quoteText: null
        });
      }
      const pinIdMatch = resolvedUrl.match(/\/pin\/(\d+)/);
      if (pinIdMatch) {
        const pinId = pinIdMatch[1];
        console.log(`[OmniBox] Requesting Pinterest pidgets API for pinId: ${pinId}`);
        const pidgetsResponse = await fetchWithTimeout(`https://api.pinterest.com/v3/pidgets/pin/${pinId}/`, 1500);
        if (pidgetsResponse.ok) {
          const pidgetsJson = await pidgetsResponse.json();
          if (pidgetsJson.status === "success" && pidgetsJson.data) {
            const pinData = pidgetsJson.data;
            const images = pinData.images || {};
            let previewUrl = images.originals && images.originals.url || images["736x"] && images["736x"].url || images["564x"] && images["564x"].url;
            if (!previewUrl) {
              const keys = Object.keys(images);
              if (keys.length > 0) {
                previewUrl = images[keys[0]].url;
              }
            }
            previewUrl = previewUrl || "";
            const title = pinData.description ? pinData.description.length > 50 ? pinData.description.substring(0, 47) + "..." : pinData.description : "Pinterest Pin";
            const note = pinData.description || "A pinned image on Pinterest";
            console.log(`[OmniBox] Pinterest pidgets API succeeded! Image: ${previewUrl}`);
            return res.json({
              title,
              note,
              platform: "Pinterest",
              format: "Image",
              previewUrl,
              tags: ["Inspo", "Design", "Pinterest"],
              brandColor: "#bd081c",
              quoteText: null
            });
          }
        }
      }
      console.log(`[OmniBox] Trying direct HTML scrape of Pinterest URL: ${resolvedUrl} with Social Bot User-Agent...`);
      const pinPageRes = await fetchWithTimeout(resolvedUrl, 2e3, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });
      if (pinPageRes.ok) {
        const pageHtml = await pinPageRes.text();
        console.log(`[OmniBox] Successfully fetched Pinterest page HTML directly.`);
        let title = "";
        const ogTitleMatch = pageHtml.match(/<meta[^>]+(?:property|name)="og:title"[^>]+content="([^"]+)"/i) || pageHtml.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:title"/i);
        if (ogTitleMatch && ogTitleMatch[1]) {
          title = ogTitleMatch[1].trim().replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
        } else {
          const titleMatch = pageHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].trim();
          }
        }
        let previewUrl = "";
        const ogImageMatch = pageHtml.match(/<meta[^>]+(?:property|name)="og:image"[^>]+content="([^"]+)"/i) || pageHtml.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:image"/i);
        if (ogImageMatch && ogImageMatch[1]) {
          previewUrl = ogImageMatch[1].replace(/&amp;/g, "&");
        }
        let note = "";
        const ogDescMatch = pageHtml.match(/<meta[^>]+(?:property|name)="og:description"[^>]+content="([^"]+)"/i) || pageHtml.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:description"/i);
        if (ogDescMatch && ogDescMatch[1]) {
          note = ogDescMatch[1].trim().replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
        }
        if (previewUrl) {
          console.log(`[OmniBox] Direct Pinterest scrape succeeded! Image: ${previewUrl}`);
          return res.json({
            title: title.replace(/ - Pinterest$/i, "").replace(/ \| Pinterest$/i, "") || "Pinterest Inspiration",
            note: note || "Visual pin on Pinterest.",
            platform: "Pinterest",
            format: "Image",
            previewUrl,
            tags: ["Inspo", "Design", "Pinterest"],
            brandColor: "#bd081c",
            quoteText: null
          });
        }
      }
    } catch (err) {
      console.error("[OmniBox] Pinterest custom scraper failed, falling back to general parsing:", err);
    }
  }
  const fallback = heuristicScrape(url);
  let enrichedMetadata = {};
  const isYouTube = lowercaseUrl.includes("youtube.com") || lowercaseUrl.includes("youtu.be");
  if (isYouTube) {
    try {
      const oembedRes = await fetchWithTimeout(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        1800
      );
      if (oembedRes.ok) {
        const oembed = await oembedRes.json();
        if (oembed.title) enrichedMetadata.title = oembed.title;
        if (oembed.author_name) enrichedMetadata.note = `By ${oembed.author_name} on YouTube`;
        if (oembed.thumbnail_url && !fallback.previewUrl) {
          enrichedMetadata.previewUrl = oembed.thumbnail_url;
        }
      }
    } catch {
    }
  }
  if (!shouldBypassFetch(url) && !(isYouTube && enrichedMetadata.title)) {
    try {
      console.log(`[OmniBox] Crawling URL: ${url}`);
      const response = await fetchWithTimeout(url, 1500);
      const contentType = response.headers.get("content-type") || "";
      if (response.ok && contentType.includes("text")) {
        const fullText = await response.text();
        enrichedMetadata = extractHtmlMetadata(fullText, url);
        console.log(`[OmniBox] Fast crawled page successfully. Enriched title: "${enrichedMetadata.title}", image: "${enrichedMetadata.previewUrl}"`);
      }
    } catch (e) {
      console.log(`[OmniBox] Fast crawl bypassed or timed out for URL: ${url}.`);
    }
  }
  if (enrichedMetadata.title) fallback.title = enrichedMetadata.title;
  if (enrichedMetadata.note) fallback.note = enrichedMetadata.note;
  if (enrichedMetadata.previewUrl) fallback.previewUrl = enrichedMetadata.previewUrl;
  return res.json(fallback);
});
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OmniBox backend running on http://0.0.0.0:${PORT}`);
  });
}
start();
//# sourceMappingURL=server.cjs.map
