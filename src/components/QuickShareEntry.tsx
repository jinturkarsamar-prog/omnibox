import React, { useEffect, useState } from 'react';
import { db, migrateFromLocalStorage } from '../db';
import { AutoRule, Folder, SavedItem, Tag, ThemeConfig } from '../types';
import { THEME_PRESETS } from '../theme';
import { extractFirstUrl, quickParseUrl } from '../utils/quickParse';
import { QuickShareOverlay } from './QuickShareOverlay';

const PENDING_ENRICH_KEY = 'omnibox_pending_enrichments';

function applySavedTheme() {
  try {
    const activeId = localStorage.getItem('omnibox_active_theme_id') || 'light-normal';
    const customRaw = localStorage.getItem('omnibox_custom_themes');
    const customThemes: ThemeConfig[] = customRaw ? JSON.parse(customRaw) : [];
    const theme = [...THEME_PRESETS, ...customThemes].find((t) => t.id === activeId) || THEME_PRESETS[0];
    const root = document.documentElement;
    root.style.setProperty('--theme-bg-app', theme.bgApp);
    root.style.setProperty('--theme-bg-sidebar', theme.bgSidebar);
    root.style.setProperty('--theme-bg-card', theme.bgCard);
    root.style.setProperty('--theme-border-color', theme.borderColor);
    root.style.setProperty('--theme-text-primary', theme.textPrimary);
    root.style.setProperty('--theme-text-muted', theme.textMuted);
    root.style.setProperty('--theme-accent-color', theme.accentColor);
    root.style.setProperty('--theme-accent-hover', theme.accentHover);
  } catch {
    // Ignore storage read errors
  }
}

function enqueuePendingEnrichment(itemId: string, url: string) {
  try {
    const raw = localStorage.getItem(PENDING_ENRICH_KEY);
    const list: Array<{ itemId: string; url: string }> = raw ? JSON.parse(raw) : [];
    if (!list.some((q) => q.itemId === itemId)) {
      localStorage.setItem(PENDING_ENRICH_KEY, JSON.stringify([...list, { itemId, url }].slice(-30)));
    }
  } catch {
    // Ignore storage quota errors
  }
}

function dequeuePendingEnrichment(itemId: string) {
  try {
    const raw = localStorage.getItem(PENDING_ENRICH_KEY);
    const list: Array<{ itemId: string; url: string }> = raw ? JSON.parse(raw) : [];
    localStorage.setItem(
      PENDING_ENRICH_KEY,
      JSON.stringify(list.filter((q) => q.itemId !== itemId))
    );
  } catch {
    // Ignore
  }
}

function applyRules(item: SavedItem, rules: AutoRule[]): SavedItem {
  const modified = { ...item };
  for (const rule of rules) {
    const targetVal = modified[rule.triggerField]?.toLowerCase() || '';
    const isTriggered =
      rule.triggerOperator === 'contains'
        ? targetVal.includes(rule.triggerValue.toLowerCase())
        : targetVal === rule.triggerValue.toLowerCase();

    if (isTriggered) {
      if (rule.actionType === 'add_tag') {
        if (!modified.tags.includes(rule.actionValue)) {
          modified.tags = [...modified.tags, rule.actionValue];
        }
      } else if (rule.actionType === 'move_to_folder') {
        modified.folderId = rule.actionValue;
      }
    }
  }
  return modified;
}

async function enrichInBackground(itemId: string, targetUrl: string, onUpdated: (item: SavedItem) => void) {
  enqueuePendingEnrichment(itemId, targetUrl);
  try {
    let data: any = null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        signal: controller.signal,
        body: JSON.stringify({
          url: targetUrl,
        }),
      });
      clearTimeout(timer);
      if (response.ok) {
        data = await response.json();
      }
    } catch {
      clearTimeout(timer);
    }

    if (!data && (targetUrl.toLowerCase().includes('youtube.com') || targetUrl.toLowerCase().includes('youtu.be'))) {
      try {
        const res = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`,
          { keepalive: true }
        );
        if (res.ok) {
          const yt = await res.json();
          data = {
            title: yt.title,
            note: yt.author_name ? `By ${yt.author_name} on YouTube` : undefined,
            previewUrl: yt.thumbnail_url,
          };
        }
      } catch {
        // Ignore
      }
    }

    if (!data) return;

    const existing = await db.items.get(itemId);
    if (!existing || existing.deletedAt) {
      dequeuePendingEnrichment(itemId);
      return;
    }

    const updated: SavedItem = {
      ...existing,
      header:
        data.title && data.title !== 'Saved Web URL' && data.title !== 'Saved Link'
          ? data.title
          : existing.header,
      note:
        data.note && data.note !== 'Pasted Link' && data.note !== 'Saved on OmniBox'
          ? data.note
          : existing.note,
      previewUrl: data.previewUrl || existing.previewUrl,
      tags: Array.from(new Set([...existing.tags, ...(data.tags || [])])),
      platform: data.platform || existing.platform,
      format: data.format || existing.format,
      quoteText: data.quoteText || existing.quoteText,
      brandColor: data.brandColor || existing.brandColor,
    };

    await db.items.put(updated);
    dequeuePendingEnrichment(itemId);
    onUpdated(updated);

    if (updated.tags.length > 0) {
      const existingTags = await db.tags.toArray();
      const newTags: Tag[] = [];
      for (const tagName of updated.tags) {
        if (!existingTags.some((t) => t.name.toLowerCase() === tagName.toLowerCase())) {
          newTags.push({
            id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: tagName,
            color: '#3b82f6',
          });
        }
      }
      if (newTags.length > 0) {
        await db.tags.bulkPut(newTags);
      }
    }
  } catch {
    // Pending entry stays in localStorage for retry on next full app launch
  }
}

interface QuickShareEntryProps {
  onOpenFullApp: () => void;
}

export const QuickShareEntry: React.FC<QuickShareEntryProps> = ({ onOpenFullApp }) => {
  const [item, setItem] = useState<SavedItem | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [autoCloseEnabled, setAutoCloseEnabled] = useState(true);

  useEffect(() => {
    applySavedTheme();

    let cancelled = false;

    const runQuickSave = async () => {
      const params = new URLSearchParams(window.location.search);
      const shareUrl = params.get('share_url') || params.get('url');
      const shareText = params.get('share_text') || params.get('text');
      const shareTitle = params.get('share_title') || params.get('title');
      const forceAutoClose = params.get('auto_close') === '1';
      const userPrefAutoClose = localStorage.getItem('omnibox_auto_close_share') !== 'false';
      setAutoCloseEnabled(forceAutoClose || userPrefAutoClose);

      const targetUrl =
        shareUrl ||
        (shareText ? extractFirstUrl(shareText) || shareText : '');

      // Clean URL immediately so refresh doesn't re-trigger
      window.history.replaceState({}, document.title, window.location.pathname);

      await migrateFromLocalStorage();

      const [loadedFolders, recentItems, activeRules] = await Promise.all([
        db.folders.toArray(),
        db.items.orderBy('createdAt').reverse().limit(10).toArray(),
        db.rules.toArray(),
      ]);

      if (!cancelled) {
        setFolders(loadedFolders);
      }

      if (!targetUrl) {
        onOpenFullApp();
        return;
      }

      const fiveSecondsAgo = Date.now() - 5000;
      const duplicate = recentItems.find(
        (i) =>
          i.deletedAt === null &&
          i.url === targetUrl &&
          new Date(i.createdAt).getTime() >= fiveSecondsAgo
      );

      let savedItem: SavedItem;
      if (duplicate) {
        savedItem = duplicate;
      } else {
        const parsed = quickParseUrl(targetUrl, shareTitle || '', shareText || '');
        const baseItem: SavedItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          header: parsed.header,
          note: parsed.note,
          tags: parsed.tags,
          previewUrl: parsed.previewUrl,
          url: targetUrl,
          platform: parsed.platform,
          format: parsed.format,
          brandColor: parsed.brandColor,
          folderId: null,
          createdAt: new Date().toISOString(),
          deletedAt: null,
        };
        savedItem = applyRules(baseItem, activeRules);
        await db.items.put(savedItem);
      }

      if (!cancelled) {
        setItem(savedItem);
      }

      void enrichInBackground(savedItem.id, targetUrl, (enriched) => {
        if (!cancelled) {
          setItem((prev) => (prev && prev.id === enriched.id ? enriched : prev));
        }
      });
    };

    void runQuickSave();

    return () => {
      cancelled = true;
    };
  }, [onOpenFullApp]);

  return (
    <QuickShareOverlay
      item={item}
      folders={folders}
      autoCloseEnabled={autoCloseEnabled}
      onAssignFolder={async (itemId, folderId) => {
        const existing = await db.items.get(itemId);
        if (existing) {
          const updated = { ...existing, folderId };
          await db.items.put(updated);
          setItem(updated);
        }
      }}
      onUndo={async (itemId) => {
        const existing = await db.items.get(itemId);
        if (existing) {
          await db.items.put({ ...existing, deletedAt: new Date().toISOString() });
        }
      }}
      onOpenLibrary={onOpenFullApp}
    />
  );
};
