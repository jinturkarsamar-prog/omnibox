import { PlatformType, FormatType, SavedItem } from '../types';

// Helper to extract YouTube video ID instantly (supports watch, youtu.be, shorts, live, embed)
export function getYoutubeId(url: string): string | null {
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

// Extract the first http(s) URL from pasted/shared text
export function extractFirstUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s<>"']+/i);
  return match ? match[0] : null;
}

// Clean and extract human title/caption from shared text or URL
export function extractTitleAndNote(shareTitle?: string, shareText?: string, targetUrl?: string): { title: string; note: string } {
  let title = shareTitle ? shareTitle.trim() : '';
  let note = '';

  if (shareText && shareText.trim()) {
    const textWithoutUrl = shareText.replace(/https?:\/\/[^\s]+/g, '').trim();
    if (textWithoutUrl) {
      note = textWithoutUrl;
      if (!title) {
        // Take first sentence or first 60 characters as title
        const firstLine = textWithoutUrl.split('\n')[0].trim();
        title = firstLine.length > 65 ? firstLine.substring(0, 62) + '...' : firstLine;
      }
    }
  }

  return { title, note };
}

const RESERVED_INSTAGRAM_SEGMENTS = new Set([
  'p',
  'reel',
  'reels',
  'tv',
  'stories',
  'explore',
  'accounts',
  'direct',
  'about',
  'legal',
  'developer',
  'directory',
  'share',
  's',
  '_u',
  'ar',
  'audio',
  'tags',
  'locations',
]);

const INSTAGRAM_PROFILE_TABS = new Set(['reels', 'tagged', 'channel', 'guides', 'live']);

/**
 * Classifies an Instagram URL into Reel, Post, or Profile and extracts a profile handle when present.
 */
export function classifyInstagramUrl(targetUrl: string): { format: 'Reel' | 'Post' | 'Profile'; username: string | null } {
  try {
    const parsed = new URL(targetUrl);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const lowerSegments = segments.map((s) => s.toLowerCase());

    if (
      lowerSegments.includes('reel') ||
      lowerSegments.includes('tv') ||
      (lowerSegments[0] === 'reels' && lowerSegments.length >= 2) ||
      (lowerSegments[0] === 'share' && lowerSegments[1] === 'reel')
    ) {
      return { format: 'Reel', username: null };
    }

    if (
      lowerSegments.includes('p') ||
      lowerSegments[0] === 'stories' ||
      lowerSegments[0] === 'share' ||
      lowerSegments[0] === 's'
    ) {
      return { format: 'Post', username: null };
    }

    if (lowerSegments[0] === '_u' && segments[1]) {
      return { format: 'Profile', username: segments[1].replace(/^@/, '') };
    }

    if (segments.length === 1 && !RESERVED_INSTAGRAM_SEGMENTS.has(lowerSegments[0])) {
      return { format: 'Profile', username: segments[0].replace(/^@/, '') };
    }

    if (
      segments.length === 2 &&
      !RESERVED_INSTAGRAM_SEGMENTS.has(lowerSegments[0]) &&
      INSTAGRAM_PROFILE_TABS.has(lowerSegments[1])
    ) {
      return { format: 'Profile', username: segments[0].replace(/^@/, '') };
    }
  } catch {
    const lower = targetUrl.toLowerCase();
    if (lower.includes('/reel/') || lower.includes('/reels/')) {
      return { format: 'Reel', username: null };
    }
  }

  return { format: 'Post', username: null };
}

export interface QuickParseResult {
  header: string;
  note: string;
  platform: PlatformType;
  format: FormatType;
  previewUrl: string;
  brandColor: string;
  tags: string[];
}

export function quickParseUrl(targetUrl: string, shareTitle?: string, shareText?: string): QuickParseResult {
  const lowerUrl = targetUrl.toLowerCase();
  const { title: extractedTitle, note: extractedNote } = extractTitleAndNote(shareTitle, shareText, targetUrl);

  // Default values
  let platform: PlatformType = 'Other';
  let format: FormatType = 'Website';
  let header = extractedTitle || 'Saved Web Link';
  let note = extractedNote || 'Quick-saved via OmniBox';
  let previewUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80';
  let brandColor = '#3b82f6';
  let tags: string[] = ['Inbox'];

  // 1. Instagram Reels, Posts & Profiles
  if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) {
    platform = 'Instagram';
    brandColor = '#E1306C';
    const ig = classifyInstagramUrl(targetUrl);

    if (ig.format === 'Reel') {
      format = 'Reel';
      header = extractedTitle || 'Instagram Reel';
      tags = ['Instagram', 'Reels', 'Inbox'];
      previewUrl = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80';
    } else if (ig.format === 'Profile') {
      format = 'Profile';
      header = extractedTitle || (ig.username ? `Instagram (@${ig.username})` : 'Instagram Profile');
      tags = ['Instagram', 'Profile', 'Inbox'];
      previewUrl = 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=800&q=80';
    } else {
      format = 'Post';
      header = extractedTitle || 'Instagram Post';
      tags = ['Instagram', 'Post', 'Inbox'];
      previewUrl = 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=800&q=80';
    }
  } 
  // 2. YouTube, YouTube Shorts & YouTube Music
  else if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    const ytId = getYoutubeId(targetUrl);
    if (ytId) {
      previewUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    } else {
      previewUrl = 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&q=80';
    }

    if (lowerUrl.includes('music.youtube.com')) {
      platform = 'Music';
      brandColor = '#FF0000';
      if (lowerUrl.includes('list=')) {
        format = 'Playlist';
        header = extractedTitle || 'YouTube Music Playlist';
        tags = ['Music', 'Playlist', 'Inbox'];
      } else {
        format = 'Song';
        header = extractedTitle || 'YouTube Music Track';
        tags = ['Music', 'Song', 'Inbox'];
      }
    } else {
      platform = 'YouTube';
      brandColor = '#FF0000';

      if (lowerUrl.includes('/shorts/')) {
        format = 'Reel';
        header = extractedTitle || 'YouTube Short';
        tags = ['YouTube', 'Shorts', 'Inbox'];
      } else if (lowerUrl.includes('list=') && !ytId) {
        format = 'Playlist';
        header = extractedTitle || 'YouTube Playlist';
        tags = ['YouTube', 'Playlist', 'Inbox'];
      } else {
        format = 'Video';
        header = extractedTitle || 'YouTube Video';
        tags = ['YouTube', 'Video', 'Inbox'];
      }
    }
  } 
  // 3. TikTok
  else if (lowerUrl.includes('tiktok.com')) {
    platform = 'TikTok';
    format = 'Reel';
    header = extractedTitle || 'TikTok Video';
    brandColor = '#000000';
    tags = ['TikTok', 'Reels', 'Inbox'];
    previewUrl = 'https://images.unsplash.com/photo-1596558450255-7c0b7be9d56a?w=800&q=80';
  }
  // 4. Pinterest
  else if (lowerUrl.includes('pinterest.com') || lowerUrl.includes('pin.it')) {
    platform = 'Pinterest';
    format = 'Image';
    header = extractedTitle || 'Pinterest Pin';
    brandColor = '#E60023';
    tags = ['Pinterest', 'Inspiration', 'Inbox'];
    previewUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80';
  }
  // 5. X / Twitter
  else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
    platform = 'X / Twitter';
    format = 'Post';
    header = extractedTitle || 'X / Twitter Post';
    brandColor = '#1DA1F2';
    tags = ['Twitter', 'Post', 'Inbox'];
    previewUrl = 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=800&q=80';
  }
  // 6. Threads
  else if (lowerUrl.includes('threads.net')) {
    platform = 'Threads';
    format = 'Thread';
    header = extractedTitle || 'Threads Conversation';
    brandColor = '#000000';
    tags = ['Threads', 'Inbox'];
    previewUrl = 'https://images.unsplash.com/photo-1515260268569-9271009adfdb?w=800&q=80';
  }
  // 7. Spotify
  else if (lowerUrl.includes('spotify.com')) {
    platform = 'Spotify';
    format = 'Audio';
    header = extractedTitle || 'Spotify Track';
    brandColor = '#1DB954';
    tags = ['Spotify', 'Audio', 'Inbox'];
    previewUrl = 'https://images.unsplash.com/photo-1614680376593-902f749f7fdc?w=800&q=80';
  }
  // 8. Direct Images
  else if (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(lowerUrl)) {
    format = 'Image';
    header = extractedTitle || 'Direct Image Asset';
    previewUrl = targetUrl;
    tags = ['Image', 'Inbox'];
  }

  return {
    header,
    note,
    platform,
    format,
    previewUrl,
    brandColor,
    tags,
  };
}
