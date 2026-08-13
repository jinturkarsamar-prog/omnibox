import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to extract YouTube video ID
function getYoutubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Bypasses HTTP crawling for platforms that aggressively block scrapers and cause hangs.
function shouldBypassFetch(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes('pinterest.com') ||
    lower.includes('pin.it') ||
    lower.includes('instagram.com') ||
    lower.includes('tiktok.com') ||
    lower.includes('twitter.com') ||
    lower.includes('x.com') ||
    lower.includes('facebook.com') ||
    lower.includes('threads.net')
  );
}

// Bulletproof fetch with an AbortController and strict 1500ms timeout
async function fetchWithTimeout(url: string, timeoutMs = 1500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Extract essential Open Graph / standard HTML meta tags without heavy external parsers
function extractHtmlMetadata(html: string, url: string): { title?: string; note?: string; previewUrl?: string } {
  const result: { title?: string; note?: string; previewUrl?: string } = {};
  
  try {
    // Extract <title>
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      result.title = titleMatch[1].trim()
        .replace(/\s+/g, ' ')
        .replace(/ - Pinterest$/i, '')
        .replace(/ \| Pinterest$/i, '');
    }

    // Extract og:title
    const ogTitleMatch = html.match(/<meta[^>]+(?:property|name)="og:title"[^>]+content="([^"]+)"/i) ||
                         html.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:title"/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      result.title = ogTitleMatch[1].trim();
    }

    // Extract og:image / twitter:image
    const ogImageMatch = html.match(/<meta[^>]+(?:property|name)="og:image"[^>]+content="([^"]+)"/i) ||
                         html.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:image"/i) ||
                         html.match(/<meta[^>]+(?:property|name)="twitter:image"[^>]+content="([^"]+)"/i) ||
                         html.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="twitter:image"/i);
    if (ogImageMatch && ogImageMatch[1]) {
      result.previewUrl = ogImageMatch[1];
    }

    // Extract description / og:description
    const descMatch = html.match(/<meta[^>]+(?:property|name)="og:description"[^>]+content="([^"]+)"/i) ||
                      html.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:description"/i) ||
                      html.match(/<meta[^>]+(?:property|name)="description"[^>]+content="([^"]+)"/i) ||
                      html.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="description"/i);
    if (descMatch && descMatch[1]) {
      result.note = descMatch[1].trim();
    }
  } catch (err) {
    console.error('[OmniBox] Metadata parser error:', err);
  }

  return result;
}

// Simple heuristic fallback scraper
function heuristicScrape(url: string): any {
  const lowercaseUrl = url.toLowerCase();
  let platform: string = 'Other';
  let format: string = 'Website';
  let title = 'Saved Link';
  let note = 'Saved on OmniBox';
  let previewUrl = '';
  let brandColor = '#3b82f6';
  let tags: string[] = ['Inbox'];
  let quoteText = '';

  // Classify direct images or Pinterest direct images first
  if (lowercaseUrl.includes('pinimg.com') || /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(lowercaseUrl)) {
    platform = lowercaseUrl.includes('pinimg.com') ? 'Pinterest' : 'Other';
    format = 'Image';
    brandColor = lowercaseUrl.includes('pinimg.com') ? '#bd081c' : '#3b82f6';
    tags = ['Image', 'Inspo', 'Inbox'];
    title = lowercaseUrl.includes('pinimg.com') ? 'Pinterest Image' : 'Direct Image Asset';
    previewUrl = url;
    note = 'Direct image asset parsed successfully.';
    return { title, note, platform, format, previewUrl, tags, brandColor, quoteText };
  }

  // Classify based on domain names
  if (lowercaseUrl.includes('youtube.com') || lowercaseUrl.includes('youtu.be')) {
    if (lowercaseUrl.includes('music.youtube.com')) {
      platform = 'Music';
      format = lowercaseUrl.includes('list=') ? 'Playlist' : 'Song';
      brandColor = '#ff0000';
      tags = ['Music', 'Inbox'];
      title = format === 'Playlist' ? 'Music Playlist' : 'Music Track';
    } else {
      platform = 'YouTube';
      format = lowercaseUrl.includes('list=') ? 'Playlist' : 'Video';
      brandColor = '#ff0000';
      tags = [format === 'Playlist' ? 'Playlist' : 'Video', 'Inbox'];
      title = format === 'Playlist' ? 'YouTube Playlist' : 'YouTube Video';
      const ytId = getYoutubeId(url);
      if (ytId) {
        previewUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        if (format !== 'Playlist') {
          title = `YouTube Video (${ytId})`;
        }
      }
    }
  } else if (lowercaseUrl.includes('instagram.com')) {
    platform = 'Instagram';
    format = lowercaseUrl.includes('/reel/') || lowercaseUrl.includes('/reels/') ? 'Video' : 'Post';
    brandColor = '#e1306c';
    tags = ['Social', 'Inspo', 'Inbox'];
    title = 'Instagram Post';
    previewUrl = '';
  } else if (lowercaseUrl.includes('pinterest.com') || lowercaseUrl.includes('pin.it')) {
    platform = 'Pinterest';
    format = 'Image';
    brandColor = '#bd081c';
    tags = ['Inspo', 'Design', 'Inbox'];
    title = 'Pinterest Pin';
    previewUrl = '';
  } else if (lowercaseUrl.includes('threads.net')) {
    platform = 'Threads';
    format = 'Thread';
    brandColor = '#000000';
    tags = ['Social', 'Inbox'];
    title = 'Threads Post';
    quoteText = 'A thread on Threads';
  } else if (lowercaseUrl.includes('play.google.com')) {
    platform = 'Play Store';
    format = lowercaseUrl.includes('/books/') ? 'Book' : 'App';
    brandColor = '#00a170';
    tags = ['Apps', 'Inbox'];
    title = 'Google Play Item';
  } else if (lowercaseUrl.includes('google.com') || lowercaseUrl.includes('wikipedia.org') || lowercaseUrl.includes('.org') || lowercaseUrl.includes('.edu') || lowercaseUrl.includes('.com')) {
    platform = 'Google';
    format = 'Article';
    brandColor = '#4285f4';
    tags = ['Article', 'Inbox'];
    title = 'Web Article';
  }

  return { title, note, platform, format, previewUrl, tags, brandColor, quoteText };
}

// Initialize Gemini Client
const aiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (aiApiKey) {
  ai = new GoogleGenAI({
    apiKey: aiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  console.log('Gemini AI successfully initialized for OmniBox server-side link scraping!');
} else {
  console.log('Gemini AI API Key not found. Falling back to fast heuristic metadata extraction.');
}

// Server status endpoint (to check built-in AI availability)
app.get('/api/status', (req, res) => {
  res.json({
    builtInGeminiAvailable: !!process.env.GEMINI_API_KEY,
  });
});

// Scrape URL endpoint
app.post('/api/scrape', async (req, res) => {
  const { 
    url, 
    aiMode = 'built-in', 
    customAiApiKey, 
    customAiApiUrl, 
    customAiModel,
    aiCustomInstructions = '',
    aiTemperature = 0.2,
    aiDefaultTags = '',
    aiDefaultThumbnail = '',
  } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL structure early to prevent Node fetch crash
  let isValidUrl = false;
  try {
    new URL(url);
    isValidUrl = true;
  } catch (_) {}

  if (!isValidUrl) {
    return res.status(400).json({ error: 'Invalid URL format. Please paste a valid absolute URL (e.g. https://...)' });
  }

  const lowercaseUrl = url.toLowerCase();

  // 1. Direct Image or Pinterest CDN Image check (Instant response, 0ms latency!)
  const isDirectImage = lowercaseUrl.includes('pinimg.com') || /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(lowercaseUrl);
  if (isDirectImage) {
    const fallback = heuristicScrape(url);
    console.log(`[OmniBox] Direct image detected: ${url}. Returning instantly.`);
    return res.json(fallback);
  }

  // 2. Instagram and Pinterest custom high-fidelity scrapers (Bypasses standard LLM or provides enriched fallbacks)
  const isInstagram = lowercaseUrl.includes('instagram.com');
  if (isInstagram) {
    try {
      console.log(`[OmniBox] Instagram URL detected: ${url}. Initiating high-fidelity vxinstagram scraper...`);
      const shortcodeMatch = url.match(/(?:\/p\/|\/reel\/|\/reels\/|\/tv\/)([^/?#&]+)/i);
      const shortcode = shortcodeMatch ? shortcodeMatch[1] : null;

      if (shortcode) {
        // Try multiple proxies for premium resilience!
        const proxyHosts = ['vxinstagram.com', 'ddinstagram.com'];
        for (const host of proxyHosts) {
          const proxyUrl = `https://${host}/p/${shortcode}/`;
          console.log(`[OmniBox] Querying Instagram proxy helper: ${proxyUrl}`);
          try {
            const proxyRes = await fetch(proxyUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
                'Accept-Language': 'en-US,en;q=0.9',
              },
            });

            if (proxyRes.ok) {
              const proxyHtml = await proxyRes.text();
              console.log(`[OmniBox] Successfully fetched Instagram proxy HTML from ${host}`);

              let previewUrl = '';
              const ogImageMatch = proxyHtml.match(/<meta[^>]+(?:property|name)="og:image"[^>]+content="([^"]+)"/i) ||
                                   proxyHtml.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:image"/i) ||
                                   proxyHtml.match(/<meta[^>]+(?:property|name)="twitter:image"[^>]+content="([^"]+)"/i) ||
                                   proxyHtml.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="twitter:image"/i);
              if (ogImageMatch && ogImageMatch[1]) {
                previewUrl = ogImageMatch[1].replace(/&amp;/g, '&');
              }

              let title = 'Instagram Post';
              const ogTitleMatch = proxyHtml.match(/<meta[^>]+(?:property|name)="og:title"[^>]+content="([^"]+)"/i) ||
                                   proxyHtml.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:title"/i);
              if (ogTitleMatch && ogTitleMatch[1]) {
                title = ogTitleMatch[1].trim()
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'")
                  .replace(/&amp;/g, '&')
                  .replace(/\s+/g, ' ');
              }

              let note = 'View this post on Instagram.';
              const ogDescMatch = proxyHtml.match(/<meta[^>]+(?:property|name)="og:description"[^>]+content="([^"]+)"/i) ||
                                  proxyHtml.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:description"/i) ||
                                  proxyHtml.match(/<meta[^>]+(?:property|name)="twitter:description"[^>]+content="([^"]+)"/i) ||
                                  proxyHtml.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="twitter:description"/i);
              
              if (ogDescMatch && ogDescMatch[1]) {
                note = ogDescMatch[1].trim()
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'")
                  .replace(/&amp;/g, '&')
                  .replace(/\s+/g, ' ');
              }

              if (previewUrl) {
                console.log(`[OmniBox] Proxy ${host} succeeded! Image: ${previewUrl}`);
                const isReel = lowercaseUrl.includes('/reel/') || lowercaseUrl.includes('/reels/');
                return res.json({
                  title: title.replace(/ - Instagram$/i, '').replace(/ \| Instagram$/i, ''),
                  note,
                  platform: 'Instagram',
                  format: isReel ? 'Video' : 'Post',
                  previewUrl,
                  tags: ['Social', 'Inspo', 'Instagram'],
                  brandColor: '#e1306c',
                  quoteText: null
                });
              }
            }
          } catch (innerErr) {
            console.error(`[OmniBox] Inner proxy fetch failed for ${host}:`, innerErr);
          }
        }
      }
    } catch (err) {
      console.error('[OmniBox] Instagram scraper failed:', err);
    }
  }

  const isPinterest = lowercaseUrl.includes('pinterest.com') || lowercaseUrl.includes('pin.it');
  if (isPinterest) {
    try {
      console.log(`[OmniBox] Pinterest URL detected: ${url}. Fetching official oEmbed...`);
      let resolvedUrl = url;
      if (lowercaseUrl.includes('pin.it')) {
        try {
          const redirectRes = await fetch(url, {
            method: 'HEAD',
            redirect: 'manual',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            }
          });
          const location = redirectRes.headers.get('location');
          if (location) {
            resolvedUrl = location;
            console.log(`[OmniBox] Resolved pin.it redirect to: ${resolvedUrl}`);
          }
        } catch (err) {
          console.error('[OmniBox] HEAD redirect failed, trying GET:', err);
          const redirectRes = await fetchWithTimeout(url, 1500);
          resolvedUrl = redirectRes.url;
        }
      }

      // Try Pinterest official oEmbed first
      const oembedUrl = `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(resolvedUrl)}`;
      const oembedRes = await fetchWithTimeout(oembedUrl, 1500);
      if (oembedRes.ok) {
        const oembedJson = await oembedRes.json();
        const previewUrl = oembedJson.thumbnail_url || '';
        const title = oembedJson.title || 'Pinterest Inspiration';
        const note = oembedJson.author_name ? `Pinned by ${oembedJson.author_name} on Pinterest.` : 'Pinterest visual inspiration board.';
        
        console.log(`[OmniBox] Pinterest oEmbed API succeeded! Image: ${previewUrl}`);
        return res.json({
          title,
          note,
          platform: 'Pinterest',
          format: 'Image',
          previewUrl,
          tags: ['Inspo', 'Design', 'Pinterest'],
          brandColor: '#bd081c',
          quoteText: null
        });
      }

      // Fallback 1: Try Pinterest widgets API for individual Pins
      const pinIdMatch = resolvedUrl.match(/\/pin\/(\d+)/);
      if (pinIdMatch) {
        const pinId = pinIdMatch[1];
        console.log(`[OmniBox] Requesting Pinterest pidgets API for pinId: ${pinId}`);
        const pidgetsResponse = await fetchWithTimeout(`https://api.pinterest.com/v3/pidgets/pin/${pinId}/`, 1500);
        if (pidgetsResponse.ok) {
          const pidgetsJson = await pidgetsResponse.json();
          if (pidgetsJson.status === 'success' && pidgetsJson.data) {
            const pinData = pidgetsJson.data;
            const images = pinData.images || {};
            let previewUrl = (images.originals && images.originals.url) || 
                             (images['736x'] && images['736x'].url) || 
                             (images['564x'] && images['564x'].url);
                             
            if (!previewUrl) {
              const keys = Object.keys(images);
              if (keys.length > 0) {
                previewUrl = images[keys[0]].url;
              }
            }
            previewUrl = previewUrl || '';
            const title = pinData.description 
              ? (pinData.description.length > 50 ? pinData.description.substring(0, 47) + '...' : pinData.description)
              : 'Pinterest Pin';
            const note = pinData.description || 'A pinned image on Pinterest';
            
            console.log(`[OmniBox] Pinterest pidgets API succeeded! Image: ${previewUrl}`);
            return res.json({
              title,
              note,
              platform: 'Pinterest',
              format: 'Image',
              previewUrl,
              tags: ['Inspo', 'Design', 'Pinterest'],
              brandColor: '#bd081c',
              quoteText: null
            });
          }
        }
      }

      // Fallback 2: General HTML scraping using Discord Social Bot User-Agent (highly robust for boards, profiles, or failed APIs!)
      console.log(`[OmniBox] Trying direct HTML scrape of Pinterest URL: ${resolvedUrl} with Social Bot User-Agent...`);
      const pinPageRes = await fetch(resolvedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });

      if (pinPageRes.ok) {
        const pageHtml = await pinPageRes.text();
        console.log(`[OmniBox] Successfully fetched Pinterest page HTML directly.`);

        let title = '';
        const ogTitleMatch = pageHtml.match(/<meta[^>]+(?:property|name)="og:title"[^>]+content="([^"]+)"/i) ||
                             pageHtml.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:title"/i);
        if (ogTitleMatch && ogTitleMatch[1]) {
          title = ogTitleMatch[1].trim()
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&');
        } else {
          const titleMatch = pageHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].trim();
          }
        }

        let previewUrl = '';
        const ogImageMatch = pageHtml.match(/<meta[^>]+(?:property|name)="og:image"[^>]+content="([^"]+)"/i) ||
                             pageHtml.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:image"/i);
        if (ogImageMatch && ogImageMatch[1]) {
          previewUrl = ogImageMatch[1].replace(/&amp;/g, '&');
        }

        let note = '';
        const ogDescMatch = pageHtml.match(/<meta[^>]+(?:property|name)="og:description"[^>]+content="([^"]+)"/i) ||
                            pageHtml.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:description"/i);
        if (ogDescMatch && ogDescMatch[1]) {
          note = ogDescMatch[1].trim()
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&');
        }

        if (previewUrl) {
          console.log(`[OmniBox] Direct Pinterest scrape succeeded! Image: ${previewUrl}`);
          return res.json({
            title: title.replace(/ - Pinterest$/i, '').replace(/ \| Pinterest$/i, '') || 'Pinterest Inspiration',
            note: note || 'Visual pin on Pinterest.',
            platform: 'Pinterest',
            format: 'Image',
            previewUrl,
            tags: ['Inspo', 'Design', 'Pinterest'],
            brandColor: '#bd081c',
            quoteText: null
          });
        }
      }
    } catch (err) {
      console.error('[OmniBox] Pinterest custom scraper failed, falling back to general parsing:', err);
    }
  }

  // 3. General scraping flow: Heuristic base, crawled metadata enrichment, and optional Gemini parsing
  const fallback = heuristicScrape(url);
  let htmlContent = '';
  let enrichedMetadata: { title?: string; note?: string; previewUrl?: string } = {};

  // Crawl website with timeout if not bypassed
  if (!shouldBypassFetch(url)) {
    try {
      console.log(`[OmniBox] Crawling URL: ${url}`);
      const response = await fetchWithTimeout(url, 1500);
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('text')) {
        const fullText = await response.text();
        
        // Fast regex extract of title, preview images, open-graph tags
        enrichedMetadata = extractHtmlMetadata(fullText, url);
        console.log(`[OmniBox] Fast crawled page successfully. Enriched title: "${enrichedMetadata.title}", image: "${enrichedMetadata.previewUrl}"`);

        // Snippet matching for LLM input
        const headMatch = fullText.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
        if (headMatch) {
          htmlContent = headMatch[1].substring(0, 15000);
        } else {
          htmlContent = fullText.substring(0, 8000);
        }
      }
    } catch (e) {
      console.log(`[OmniBox] Fast crawl bypassed or timed out for URL: ${url}.`);
    }
  }

  // Inject crawled metadata into fallback so the offline/no-ai mode is high fidelity!
  if (enrichedMetadata.title) fallback.title = enrichedMetadata.title;
  if (enrichedMetadata.note) fallback.note = enrichedMetadata.note;
  if (enrichedMetadata.previewUrl) fallback.previewUrl = enrichedMetadata.previewUrl;

  // Check active AI choice
  let activeAi = ai;
  let useOpenAiCompatible = false;
  let openAiEndpoint = '';
  let openAiKey = '';
  let openAiModel = '';

  if (aiMode === 'none') {
    activeAi = null;
    console.log(`[OmniBox] AI disabled by settings. Returning enriched heuristic fallback instantly.`);
    return res.json(fallback);
  } else if (aiMode === 'custom') {
    if (customAiApiKey && customAiApiKey.trim()) {
      try {
        console.log(`[OmniBox] Using custom client-side Gemini API key.`);
        activeAi = new GoogleGenAI({
          apiKey: customAiApiKey.trim(),
          httpOptions: {
            headers: { 'User-Agent': 'aistudio-build' }
          }
        });
      } catch (e) {
        console.error('[OmniBox] Failed to initialize custom client-side Gemini:', e);
        activeAi = null;
      }
    } else {
      console.log(`[OmniBox] Custom AI mode requested but no Custom API Key was provided. Falling back to heuristics.`);
      activeAi = null;
    }
  } else if (aiMode === 'openai' || aiMode === 'ollama' || aiMode === 'lm-studio') {
    useOpenAiCompatible = true;
    activeAi = null;

    // Resolve endpoint URL
    let targetEndpoint = (customAiApiUrl || '').trim();
    if (!targetEndpoint) {
      if (aiMode === 'openai') {
        targetEndpoint = 'https://api.openai.com/v1/chat/completions';
      } else if (aiMode === 'ollama') {
        targetEndpoint = 'http://localhost:11434/v1/chat/completions';
      } else if (aiMode === 'lm-studio') {
        targetEndpoint = 'http://localhost:1234/v1/chat/completions';
      }
    } else {
      if (!targetEndpoint.endsWith('/chat/completions') && !targetEndpoint.endsWith('/chat/completions/')) {
        targetEndpoint = targetEndpoint.replace(/\/$/, '');
        targetEndpoint = `${targetEndpoint}/chat/completions`;
      }
    }
    openAiEndpoint = targetEndpoint;

    // Resolve API key
    openAiKey = (customAiApiKey || '').trim();

    // Resolve model name
    let targetModel = (customAiModel || '').trim();
    if (!targetModel) {
      if (aiMode === 'openai') {
        targetModel = 'gpt-4o-mini';
      } else if (aiMode === 'ollama') {
        targetModel = 'llama3';
      } else if (aiMode === 'lm-studio') {
        targetModel = 'unspecified';
      }
    }
    openAiModel = targetModel;
  }

  // If no AI is available and not using OpenAI compatible flow, return the enriched fallback instantly!
  if (!activeAi && !useOpenAiCompatible) {
    return res.json(fallback);
  }

  const systemPrompt = `You are OmniBox AI, a high-quality metadata parser and media aggregator. Your task is to analyze the user's provided URL and optional HTML tags, and return a clean, highly polished and categorized media item metadata.
Categorize into one of the exact Platform choices: YouTube, Music, Instagram, Threads, Pinterest, Google, Play Store, Other.
Categorize into one of the exact Format choices: Video, Article, Profile, Comment, Song, Playlist, Artist, App, Book, Thread, Image, Post, Website, Other.

GUIDELINES:
- Title: Extremely clean, short, human-readable. Keep it engaging.
- Note: A neat, context-rich 1-2 sentence description summarizing the content.
- Platform & Format: Correctly match the domain or content type.
- PreviewUrl: Select a valid image URL from the scraped HTML (og:image, twitter:image, thumbnail) or use the crawled previewUrl if provided. If none, return an empty string for previewUrl. DO NOT invent placeholders.
- Tags: Suggest 2-3 logical tags.
- BrandColor: Return the hex brand color code (e.g., #ff0000 for YouTube, #e1306c for Instagram, #000000 for Threads, #bd081c for Pinterest).
- QuoteText: If format is Comment, Thread, or Post, parse and extract the core text snippet to use as a stylized Quote card.

IMPORTANT: Return ONLY a valid JSON object matching this schema. Do NOT wrap it in markdown codeblocks or say anything else besides the raw JSON string:
{
  "title": "...",
  "note": "...",
  "platform": "...",
  "format": "...",
  "previewUrl": "...",
  "tags": ["...", "..."],
  "brandColor": "...",
  "quoteText": "..."
}`;

  let finalSystemPrompt = systemPrompt;
  if (aiCustomInstructions && aiCustomInstructions.trim()) {
    finalSystemPrompt = `${systemPrompt}\n\nUSER-SPECIFIED CUSTOM DIRECTIVES:\n${aiCustomInstructions.trim()}`;
  }

  let defaultTagsList: string[] = [];
  if (aiDefaultTags && aiDefaultTags.trim()) {
    defaultTagsList = aiDefaultTags.split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
  }

  const contents = `URL: ${url}
Crawled Title: ${enrichedMetadata.title || 'Unknown'}
Crawled Preview Image: ${enrichedMetadata.previewUrl || 'None'}
HTML Context Snippet:
${htmlContent || 'No HTML context available (Direct URL inference needed)'}`;

  if (useOpenAiCompatible) {
    try {
      console.log(`[OmniBox] Routing to OpenAI-compatible provider. Endpoint: ${openAiEndpoint}, Model: ${openAiModel}`);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (openAiKey) {
        headers['Authorization'] = `Bearer ${openAiKey}`;
      }

      const body: any = {
        model: openAiModel,
        messages: [
          { role: 'system', content: finalSystemPrompt },
          { role: 'user', content: contents }
        ],
        temperature: typeof aiTemperature === 'number' ? aiTemperature : 0.2
      };

      if (openAiEndpoint.includes('api.openai.com')) {
        body.response_format = { type: 'json_object' };
      }

      const openAiRes = await fetch(openAiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (openAiRes.ok) {
        const jsonResult = await openAiRes.json();
        const rawText = jsonResult.choices?.[0]?.message?.content || '';
        if (rawText) {
          let cleanText = rawText.trim();
          if (cleanText.startsWith('```')) {
            const match = cleanText.match(/```(?:json)?([\s\S]*?)```/);
            if (match) {
              cleanText = match[1].trim();
            }
          }
          const parsed = JSON.parse(cleanText);
          const ytId = getYoutubeId(url);
          if (ytId) {
            parsed.previewUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
          }

          let finalPreviewUrl = parsed.previewUrl || fallback.previewUrl;
          if (aiDefaultThumbnail && aiDefaultThumbnail.trim()) {
            if (!finalPreviewUrl || finalPreviewUrl.includes('images.unsplash.com') || finalPreviewUrl.includes('placeholder')) {
              finalPreviewUrl = aiDefaultThumbnail.trim();
            }
          }

          let finalTags = parsed.tags && parsed.tags.length > 0 ? parsed.tags : fallback.tags;
          if (defaultTagsList.length > 0) {
            finalTags = Array.from(new Set([...finalTags, ...defaultTagsList]));
          }

          return res.json({
            title: parsed.title || fallback.title,
            note: parsed.note || fallback.note,
            platform: parsed.platform || fallback.platform,
            format: parsed.format || fallback.format,
            previewUrl: finalPreviewUrl,
            tags: finalTags,
            brandColor: parsed.brandColor || fallback.brandColor,
            quoteText: parsed.quoteText || fallback.quoteText
          });
        }
      } else {
        const errText = await openAiRes.text();
        console.error(`[OmniBox] OpenAI-compatible completion failed with status ${openAiRes.status}:`, errText);
      }
    } catch (err) {
      console.error('[OmniBox] OpenAI-compatible metadata generation failed:', err);
    }

    return res.json(fallback);
  }

  try {
    console.log(`[OmniBox] Calling Gemini AI for advanced parsing...`);
    const response = await activeAi.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: finalSystemPrompt,
        temperature: typeof aiTemperature === 'number' ? aiTemperature : 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Clean, appealing title for the media content.' },
            note: { type: Type.STRING, description: 'A highly readable summary or note describing what this is.' },
            platform: { type: Type.STRING, description: 'YouTube, Music, Instagram, Threads, Pinterest, Google, Play Store, or Other' },
            format: { type: Type.STRING, description: 'Video, Article, Profile, Comment, Song, Playlist, Artist, App, Book, Thread, Image, Post, Website, or Other' },
            previewUrl: { type: Type.STRING, description: 'High-res image URL (og:image, thumbnail, or polished Unsplash placeholder).' },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of 2-3 recommended tags.'
            },
            brandColor: { type: Type.STRING, description: 'Primary branding hex color code, starting with #' },
            quoteText: { type: Type.STRING, description: 'If Comment or Thread or Post, the quote text itself. Keep it below 280 characters.' }
          },
          required: ['title', 'note', 'platform', 'format', 'previewUrl', 'tags']
        }
      }
    });

    const textResult = response.text;
    if (textResult) {
      const parsed = JSON.parse(textResult.trim());
      // Re-apply special YouTube thumbnail tricks if Gemini generated a generic link
      const ytId = getYoutubeId(url);
      if (ytId) {
        parsed.previewUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }

      let finalPreviewUrl = parsed.previewUrl || fallback.previewUrl;
      if (aiDefaultThumbnail && aiDefaultThumbnail.trim()) {
        if (!finalPreviewUrl || finalPreviewUrl.includes('images.unsplash.com') || finalPreviewUrl.includes('placeholder')) {
          finalPreviewUrl = aiDefaultThumbnail.trim();
        }
      }

      let finalTags = parsed.tags && parsed.tags.length > 0 ? parsed.tags : fallback.tags;
      if (defaultTagsList.length > 0) {
        finalTags = Array.from(new Set([...finalTags, ...defaultTagsList]));
      }

      return res.json({
        title: parsed.title || fallback.title,
        note: parsed.note || fallback.note,
        platform: parsed.platform || fallback.platform,
        format: parsed.format || fallback.format,
        previewUrl: finalPreviewUrl,
        tags: finalTags,
        brandColor: parsed.brandColor || fallback.brandColor,
        quoteText: parsed.quoteText || fallback.quoteText
      });
    }
  } catch (err) {
    console.error('[OmniBox] Gemini metadata parsing failed, returning enriched heuristic scraping result instead:', err);
  }

  // Graceful fallback to enriched heuristics
  return res.json(fallback);
});

// Vite Setup
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OmniBox backend running on http://0.0.0.0:${PORT}`);
  });
}

start();
