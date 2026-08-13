import Dexie, { Table } from 'dexie';
import { SavedItem, Folder, Tag, AutoRule } from './types';

export const INITIAL_FOLDERS: Folder[] = [
  { id: 'f-design', name: 'Design & Aesthetics', parentId: null, color: '#ec4899', coverUrl: null },
  { id: 'f-ui-ux', name: 'Mobile Interfaces', parentId: 'f-design', color: '#3b82f6', coverUrl: null },
  { id: 'f-web-dev', name: 'Dev Engineering', parentId: 'f-design', color: '#10b981', coverUrl: null },
  { id: 'f-music', name: 'Soundscapes & Chill', parentId: null, color: '#f59e0b', coverUrl: null },
];

export const INITIAL_TAGS: Tag[] = [
  { id: 't-inspo', name: 'Inspiration', color: '#ec4899' },
  { id: 't-video', name: 'Video Loop', color: '#3b82f6' },
  { id: 't-code', name: 'Clean Code', color: '#8b5cf6' },
  { id: 't-minimal', name: 'Minimalist', color: '#14b8a6' },
  { id: 't-reference', name: 'Reference', color: '#94a3b8' },
];

export const INITIAL_RULES: AutoRule[] = [
  {
    id: 'r-yt',
    triggerField: 'url',
    triggerOperator: 'contains',
    triggerValue: 'youtube.com',
    actionType: 'add_tag',
    actionValue: 'Video Loop',
  },
  {
    id: 'r-music',
    triggerField: 'url',
    triggerOperator: 'contains',
    triggerValue: 'music.youtube.com',
    actionType: 'move_to_folder',
    actionValue: 'f-music',
  },
];

export const INITIAL_ITEMS: SavedItem[] = [
  {
    id: 'item-1',
    header: 'Rick Astley - Never Gonna Give You Up (Official Video)',
    note: 'The absolute legendary masterpiece. Saved for historical internet reference.',
    tags: ['Video Loop', 'Reference'],
    previewUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    platform: 'YouTube',
    format: 'Video',
    folderId: 'f-music',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    deletedAt: null,
  },
  {
    id: 'item-2',
    header: 'Modern Glassmorphism Portfolio UI Layout',
    note: 'Love the frosted glass texture overlay, neon pink border highlights, and fluid scroll layout. Perfect Pinterest find!',
    tags: ['Inspiration', 'Minimalist'],
    previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
    url: 'https://www.pinterest.com/pin/123456789/',
    platform: 'Pinterest',
    format: 'Image',
    folderId: 'f-ui-ux',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    deletedAt: null,
  },
  {
    id: 'item-3',
    header: 'Threads Conversation: Web Development in 2026',
    note: 'Discussion regarding native Type Stripping in Node v23 and native ESM bundling speed improvements.',
    tags: ['Clean Code', 'Reference'],
    previewUrl: 'https://images.unsplash.com/photo-1515260268569-9271009adfdb?w=800&q=80',
    url: 'https://www.threads.net/@zuck/post/C6H5i82NSpq',
    platform: 'Threads',
    format: 'Thread',
    quoteText: 'Node v23 native Type Stripping means you can boot TS directly without external compilers, transforming server setups.',
    brandColor: '#000000',
    folderId: null,
    createdAt: new Date().toISOString(),
    deletedAt: null,
  },
  {
    id: 'item-4',
    header: 'OmniBox Productivity Assistant',
    note: 'High-res Play Store utility to save and sync favorite media clips seamlessly across platforms.',
    tags: ['Minimalist'],
    previewUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80',
    url: 'https://play.google.com/store/apps/details?id=com.omnibox.app',
    platform: 'Play Store',
    format: 'App',
    folderId: 'f-web-dev',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    deletedAt: null,
  },
];

export class OmniBoxDB extends Dexie {
  items!: Table<SavedItem, string>;
  folders!: Table<Folder, string>;
  tags!: Table<Tag, string>;
  rules!: Table<AutoRule, string>;

  constructor() {
    super('OmniBoxDatabase');
    this.version(1).stores({
      items: 'id, folderId, createdAt, deletedAt, platform, format',
      folders: 'id, parentId',
      tags: 'id, name',
      rules: 'id'
    });
  }
}

export const db = new OmniBoxDB();

export async function migrateFromLocalStorage() {
  const isMigrated = localStorage.getItem('omnibox_migrated_to_idb');
  
  if (isMigrated) return;

  try {
    const itemsStr = localStorage.getItem('omnibox_items');
    const foldersStr = localStorage.getItem('omnibox_folders');
    const tagsStr = localStorage.getItem('omnibox_tags');
    const rulesStr = localStorage.getItem('omnibox_rules');

    // Only populate INITIAL_ITEMS if localStorage was entirely empty
    if (!itemsStr && !foldersStr && !tagsStr && !rulesStr) {
      await db.items.bulkPut(INITIAL_ITEMS);
      await db.folders.bulkPut(INITIAL_FOLDERS);
      await db.tags.bulkPut(INITIAL_TAGS);
      await db.rules.bulkPut(INITIAL_RULES);
    } else {
      if (itemsStr) {
        const items = JSON.parse(itemsStr);
        if (items.length > 0) {
          await db.items.bulkPut(items);
        }
      }
      if (foldersStr) {
        const folders = JSON.parse(foldersStr);
        if (folders.length > 0) {
          await db.folders.bulkPut(folders);
        }
      }
      if (tagsStr) {
        const tags = JSON.parse(tagsStr);
        if (tags.length > 0) {
          await db.tags.bulkPut(tags);
        }
      }
      if (rulesStr) {
        const rules = JSON.parse(rulesStr);
        if (rules.length > 0) {
          await db.rules.bulkPut(rules);
        }
      }
    }

    localStorage.setItem('omnibox_migrated_to_idb', 'true');
  } catch (error) {
    console.error('Failed to migrate data from localStorage to IndexedDB', error);
  }
}
