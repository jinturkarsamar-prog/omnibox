export type PlatformType =
  | 'YouTube'
  | 'Music'
  | 'Instagram'
  | 'Threads'
  | 'Pinterest'
  | 'Google'
  | 'Play Store'
  | 'TikTok'
  | 'Spotify'
  | 'X / Twitter'
  | 'Other';

export type FormatType =
  | 'Video'
  | 'Reel'
  | 'Article'
  | 'Profile'
  | 'Comment'
  | 'Song' | 'Playlist'
  | 'Artist'
  | 'Audio'
  | 'App'
  | 'Book'
  | 'Thread'
  | 'Image'
  | 'Post'
  | 'Note'
  | 'Website'
  | 'Other';

export interface SavedItem {
  id: string;
  header: string;
  note: string;
  tags: string[];
  previewUrl: string; // standard platform preview fallback url
  customPreviewUrl?: string; // local custom uploaded base64 dataurl or path
  customPreviewType?: 'image' | 'video' | null;
  url: string; // original source url
  platform: PlatformType;
  format: FormatType;
  quoteText?: string; // used for comments/texts to style as a quote card
  brandColor?: string; // fallback color styling
  folderId: string | null; // null means "Inbox" or root if uncategorized
  createdAt: string;
  deletedAt: string | null; // populated when moved to trash bin
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null; // for infinite depth nested structures
  color: string; // solid color hex
  coverUrl: string | null; // optional custom cover image URL or base64
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface AutoRule {
  id: string;
  triggerField: 'url' | 'header' | 'note';
  triggerOperator: 'contains' | 'equals';
  triggerValue: string;
  actionType: 'add_tag' | 'move_to_folder';
  actionValue: string; // tag name or folder ID
}

export interface ThemeConfig {
  id: string;
  name: string;
  preset: 'minimalist' | 'vibrant' | 'cyberpunk' | 'anime' | 'custom';
  bgApp: string;
  bgSidebar: string;
  bgCard: string;
  borderColor: string;
  textPrimary: string;
  textMuted: string;
  accentColor: string;
  accentHover: string;
  fontSans?: string;
  fontDisplay?: string;
  fontMono?: string;
}

