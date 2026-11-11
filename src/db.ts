import Dexie, { Table } from 'dexie';
import { SavedItem, Folder, Tag, AutoRule } from './types';
import { classifyInstagramUrl } from './utils/quickParse';

const DEMO_SEED_ITEM_IDS = ['item-1', 'item-2', 'item-3', 'item-4'];

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

export const INITIAL_ITEMS: SavedItem[] = [];

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

  if (!isMigrated) {
    try {
      const itemsStr = localStorage.getItem('omnibox_items');
      const foldersStr = localStorage.getItem('omnibox_folders');
      const tagsStr = localStorage.getItem('omnibox_tags');
      const rulesStr = localStorage.getItem('omnibox_rules');

      // Only populate starter folders/tags/rules if localStorage was entirely empty (no demo items)
      if (!itemsStr && !foldersStr && !tagsStr && !rulesStr) {
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

  // One-time cleanup: remove old demo seed items & fix existing misclassified Instagram profiles
  if (!localStorage.getItem('omnibox_cleaned_demo_and_ig_profiles_v1')) {
    try {
      await db.items.bulkDelete(DEMO_SEED_ITEM_IDS);
      const igPosts = await db.items.where('platform').equals('Instagram').toArray();
      const profileUpdates: SavedItem[] = [];
      for (const item of igPosts) {
        if (item.format === 'Post') {
          const parsed = classifyInstagramUrl(item.url);
          if (parsed.format === 'Profile') {
            profileUpdates.push({
              ...item,
              format: 'Profile',
              tags: item.tags.map((t) => (t === 'Post' ? 'Profile' : t)),
            });
          }
        }
      }
      if (profileUpdates.length > 0) {
        await db.items.bulkPut(profileUpdates);
      }
      localStorage.setItem('omnibox_cleaned_demo_and_ig_profiles_v1', 'true');
    } catch (error) {
      console.error('Failed to run demo item and Instagram profile cleanup', error);
    }
  }
}
