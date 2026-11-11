import { useLiveQuery } from "dexie-react-hooks";
import { db, migrateFromLocalStorage, INITIAL_ITEMS, INITIAL_FOLDERS, INITIAL_TAGS, INITIAL_RULES } from "./db";
import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Grid,
  List,
  Columns,
  Plus,
  Inbox,
  Trash2,
  Sparkles,
  SlidersHorizontal,
  Smartphone,
  Globe,
  Tag as TagIcon,
  HelpCircle,
  Menu,
} from 'lucide-react';
import { SavedItem, Folder, Tag, AutoRule, PlatformType, FormatType, ThemeConfig } from './types';
import { THEME_PRESETS } from './theme';
import { Sidebar } from './components/Sidebar';
import { Logo } from './components/Logo';
import { Feed } from './components/Feed';
import { DetailSheet } from './components/DetailSheet';
import { InboxSection } from './components/InboxSection';
import { TrashSection } from './components/TrashSection';
import { AddMediaDialog } from './components/AddMediaDialog';
import { SettingsSection } from './components/SettingsSection';
import { CommandPalette } from './components/CommandPalette';
import { ContextMenu } from './components/ContextMenu';
import { InspectorPanel } from './components/InspectorPanel';
import { BottomNavigation } from './components/BottomNavigation';
import { BottomSheet } from './components/BottomSheet';
import { ToastNotification, ToastMessage } from './components/ToastNotification';
import { QuickShareOverlay } from './components/QuickShareOverlay';
import { quickParseUrl, extractFirstUrl } from './utils/quickParse';

const PENDING_ENRICH_KEY = 'omnibox_pending_enrichments';

interface PendingEnrichment {
  itemId: string;
  url: string;
}

function readPendingEnrichments(): PendingEnrichment[] {
  try {
    const raw = localStorage.getItem(PENDING_ENRICH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writePendingEnrichments(queue: PendingEnrichment[]) {
  try {
    localStorage.setItem(PENDING_ENRICH_KEY, JSON.stringify(queue.slice(-30)));
  } catch {
    // Ignore storage quota errors
  }
}

// =========================================================
// INITIAL SEED DATA FOR FIRST RUN IMPACT
// =========================================================




export default function App() {
  // =========================================================
  // CORE STORAGE SYNCHRONIZATION
  // =========================================================
  const [isQuickShareMode, setIsQuickShareMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return !!(
      params.get('share_url') ||
      params.get('url') ||
      params.get('share_text') ||
      params.get('text')
    );
  });

  const items = useLiveQuery(
    () => (isQuickShareMode ? Promise.resolve([] as SavedItem[]) : db.items.orderBy("createdAt").reverse().toArray()),
    [isQuickShareMode]
  ) || [];

  const folders = useLiveQuery(() => db.folders.toArray()) || [];

  const tags = useLiveQuery(
    () => (isQuickShareMode ? Promise.resolve([] as Tag[]) : db.tags.toArray()),
    [isQuickShareMode]
  ) || [];

  const rules = useLiveQuery(
    () => (isQuickShareMode ? Promise.resolve([] as AutoRule[]) : db.rules.toArray()),
    [isQuickShareMode]
  ) || [];

  // Navigation & Filter States
  const [activeSection, setActiveSection] = useState('all'); // 'all' | 'inbox' | 'trash' | 'folder-[id]'
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // Theme Settings state
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    return localStorage.getItem('omnibox_active_theme_id') || 'light-normal';
  });
  const [customThemes, setCustomThemes] = useState<ThemeConfig[]>(() => {
    const saved = localStorage.getItem('omnibox_custom_themes');
    return saved ? JSON.parse(saved) : [];
  });

  const currentTheme = [...THEME_PRESETS, ...customThemes].find(t => t.id === activeThemeId) || THEME_PRESETS[0];

  // Layout View Preferences
  const [layout, setLayout] = useState<'gallery' | 'list'>(() => {
    return (localStorage.getItem('omnibox_layout') as any) || 'gallery';
  });
  const [gallerySize, setGallerySize] = useState<'comfortable' | 'standard' | 'compact'>(() => {
    return (localStorage.getItem('omnibox_gallery_size') as any) || 'standard';
  });
  const [listDensity, setListDensity] = useState<'comfortable' | 'compact'>(() => {
    return (localStorage.getItem('omnibox_list_density') as any) || 'comfortable';
  });
  const [showNotesInFeed, setShowNotesInFeed] = useState<boolean>(() => {
    return localStorage.getItem('omnibox_show_notes') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('omnibox_gallery_size', gallerySize);
  }, [gallerySize]);
  useEffect(() => {
    localStorage.setItem('omnibox_list_density', listDensity);
  }, [listDensity]);
  useEffect(() => {
    localStorage.setItem('omnibox_show_notes', String(showNotesInFeed));
  }, [showNotesInFeed]);
  const [showTagsInFeed, setShowTagsInFeed] = useState<boolean>(() => {
    return localStorage.getItem('omnibox_show_tags') !== 'false';
  });
  const [showPlatformBadges, setShowPlatformBadges] = useState<boolean>(() => {
    return localStorage.getItem('omnibox_show_badges') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('omnibox_show_tags', String(showTagsInFeed));
  }, [showTagsInFeed]);
  useEffect(() => {
    localStorage.setItem('omnibox_show_badges', String(showPlatformBadges));
  }, [showPlatformBadges]);
  
  // Sidebar Toggles (for Mobile Android & Desktop)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1280; // xl breakpoint is 1280px
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1280);
    };
    window.addEventListener('resize', handleResize);
    // Trigger on mount to ensure correct initial state
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // AI settings (Built-in, Custom, OpenAI, Ollama, LM Studio, or None)
  const [aiMode, setAiMode] = useState<'built-in' | 'custom' | 'openai' | 'ollama' | 'lm-studio' | 'none'>(() => {
    return (localStorage.getItem('omnibox_ai_mode') as any) || 'none';
  });
  const [autoCloseOnShare, setAutoCloseOnShare] = useState<boolean>(() => {
    return localStorage.getItem('omnibox_auto_close_share') !== 'false';
  });
  useEffect(() => {
    localStorage.setItem('omnibox_auto_close_share', String(autoCloseOnShare));
  }, [autoCloseOnShare]);
  const [customAiApiKey, setCustomAiApiKey] = useState<string>(() => {
    return localStorage.getItem('omnibox_custom_ai_api_key') || '';
  });
  const [customAiApiUrl, setCustomAiApiUrl] = useState<string>(() => {
    return localStorage.getItem('omnibox_custom_ai_api_url') || 'http://localhost:1234/v1';
  });
  const [customAiModel, setCustomAiModel] = useState<string>(() => {
    return localStorage.getItem('omnibox_custom_ai_model') || '';
  });
  const [aiCustomInstructions, setAiCustomInstructions] = useState<string>(() => {
    return localStorage.getItem('omnibox_ai_custom_instructions') || '';
  });
  const [aiTemperature, setAiTemperature] = useState<number>(() => {
    const saved = localStorage.getItem('omnibox_ai_temperature');
    return saved !== null ? parseFloat(saved) : 0.2;
  });
  const [aiDefaultTags, setAiDefaultTags] = useState<string>(() => {
    return localStorage.getItem('omnibox_ai_default_tags') || '';
  });
  const [aiDefaultThumbnail, setAiDefaultThumbnail] = useState<string>(() => {
    return localStorage.getItem('omnibox_ai_default_thumbnail') || '';
  });

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  const [formatFilter, setFormatFilter] = useState<string>('All');

  // Popup Dialog States
  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null);
  const [showFullDetailSheet, setShowFullDetailSheet] = useState(false);

  useEffect(() => {
    if (!selectedItem) {
      setShowFullDetailSheet(false);
    }
  }, [selectedItem]);

  const [showAddDialog, setShowAddDialog] = useState(false);

  // Mobile & Swipe Optimization States
  const [prefillData, setPrefillData] = useState<{ url?: string; header?: string; note?: string } | null>(null);
  const [swipeActiveItem, setSwipeActiveItem] = useState<SavedItem | null>(null);
  const [showFolderSwipeSheet, setShowFolderSwipeSheet] = useState(false);

  // Desktop Optimization States
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: SavedItem } | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [quickShareItem, setQuickShareItem] = useState<SavedItem | null>(null);
  const [quickShareAutoClose, setQuickShareAutoClose] = useState<boolean>(false);
  const [isWideScreen, setIsWideScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1280;
    }
    return false;
  });

  const addToast = (toast: ToastMessage) => {
    setToasts((prev) => [...prev.slice(-3), toast]);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const createAndSaveQuickItem = async (
    targetUrl: string,
    shareTitle = '',
    shareText = '',
    options: { silentToast?: boolean } = {}
  ): Promise<SavedItem> => {
    const recentItems = await db.items.orderBy('createdAt').reverse().limit(10).toArray();
    const fiveSecondsAgo = Date.now() - 5000;
    const duplicate = recentItems.find(
      (i) =>
        i.deletedAt === null &&
        i.url === targetUrl &&
        new Date(i.createdAt).getTime() >= fiveSecondsAgo
    );

    if (duplicate) {
      return duplicate;
    }

    const parsed = quickParseUrl(targetUrl, shareTitle, shareText);
    const activeRules = await db.rules.toArray();

    let newItem: SavedItem = {
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

    newItem = applyAutomationRulesOnItem(newItem, activeRules);

    await db.items.put(newItem);

    if (!options.silentToast) {
      addToast({
        id: `toast-${Date.now()}`,
        type: 'quick-save',
        title: `⚡ ${newItem.platform} ${newItem.format} Saved!`,
        message: newItem.header,
        actionText: 'View',
        onAction: () => {
          setSelectedItem(newItem);
        },
        onUndo: () => {
          handleDeleteItem(newItem.id);
        },
      });
    }

    void enrichItemInBackground(newItem.id, targetUrl, { silentToast: options.silentToast });
    return newItem;
  };

  const handleQuickShareTarget = async (targetUrl: string, shareTitle: string, shareText: string) => {
    const saved = await createAndSaveQuickItem(targetUrl, shareTitle, shareText, {
      silentToast: true,
    });
    setQuickShareItem(saved);
  };

  // Handle Android/Mobile incoming web shares & pending background enrichments on mount
  useEffect(() => {
    let cancelled = false;

    const initApp = async () => {
      await migrateFromLocalStorage();

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const shareUrl = params.get('share_url') || params.get('url');
        const shareText = params.get('share_text') || params.get('text');
        const shareTitle = params.get('share_title') || params.get('title');
        const forceAutoClose = params.get('auto_close') === '1';

        let targetUrl = '';
        if (shareUrl) {
          targetUrl = shareUrl;
        } else if (shareText) {
          targetUrl = extractFirstUrl(shareText) || shareText;
        }

        if (targetUrl && !cancelled) {
          setQuickShareAutoClose(forceAutoClose || autoCloseOnShare);
          setIsQuickShareMode(true);
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          await handleQuickShareTarget(targetUrl, shareTitle || '', shareText || '');
          return;
        }
      }

      // Retry any enrichments that didn't finish before a quick-share popup closed
      const flushPending = () => {
        const pending = readPendingEnrichments();
        if (pending.length > 0 && !cancelled) {
          for (const entry of pending) {
            void enrichItemInBackground(entry.itemId, entry.url, { silentToast: true });
          }
        }
      };

      flushPending();
      window.addEventListener('online', flushPending);
      return () => {
        window.removeEventListener('online', flushPending);
      };
    };

    let cleanupOnline: (() => void) | undefined;
    void initApp().then((cleanup) => {
      if (typeof cleanup === 'function') cleanupOnline = cleanup;
    });

    return () => {
      cancelled = true;
      cleanupOnline?.();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('omnibox_layout', layout);
  }, [layout]);

  
  useEffect(() => {
    localStorage.setItem('omnibox_active_theme_id', activeThemeId);
  }, [activeThemeId]);

  useEffect(() => {
    localStorage.setItem('omnibox_custom_themes', JSON.stringify(customThemes));
  }, [customThemes]);

  useEffect(() => {
    localStorage.setItem('omnibox_ai_mode', aiMode);
  }, [aiMode]);

  useEffect(() => {
    localStorage.setItem('omnibox_custom_ai_api_key', customAiApiKey);
  }, [customAiApiKey]);

  useEffect(() => {
    localStorage.setItem('omnibox_custom_ai_api_url', customAiApiUrl);
  }, [customAiApiUrl]);

  useEffect(() => {
    localStorage.setItem('omnibox_custom_ai_model', customAiModel);
  }, [customAiModel]);

  useEffect(() => {
    localStorage.setItem('omnibox_ai_custom_instructions', aiCustomInstructions);
  }, [aiCustomInstructions]);

  useEffect(() => {
    localStorage.setItem('omnibox_ai_temperature', aiTemperature.toString());
  }, [aiTemperature]);

  useEffect(() => {
    localStorage.setItem('omnibox_ai_default_tags', aiDefaultTags);
  }, [aiDefaultTags]);

  useEffect(() => {
    localStorage.setItem('omnibox_ai_default_thumbnail', aiDefaultThumbnail);
  }, [aiDefaultThumbnail]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-bg-app', currentTheme.bgApp);
    root.style.setProperty('--theme-bg-sidebar', currentTheme.bgSidebar);
    root.style.setProperty('--theme-bg-card', currentTheme.bgCard);
    root.style.setProperty('--theme-border-color', currentTheme.borderColor);
    root.style.setProperty('--theme-text-primary', currentTheme.textPrimary);
    root.style.setProperty('--theme-text-muted', currentTheme.textMuted);
    root.style.setProperty('--theme-accent-color', currentTheme.accentColor);
    root.style.setProperty('--theme-accent-hover', currentTheme.accentHover);

    root.style.setProperty('--theme-font-sans', currentTheme.fontSans || '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif');
    root.style.setProperty('--theme-font-display', currentTheme.fontDisplay || '"Outfit", sans-serif');
    root.style.setProperty('--theme-font-mono', currentTheme.fontMono || '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace');


    root.classList.remove('dark');
  }, [currentTheme]);

  // Handle active folder context changes
  const handleNavigate = (section: string) => {
    setActiveSection(section);
    if (section.startsWith('folder-')) {
      setActiveFolderId(section.replace('folder-', ''));
    } else {
      setActiveFolderId(null);
    }
    setIsSidebarOpen(false); // Close drawer on mobile navigate
  };

  // =========================================================
  // ACTIONS: FOLDER PIPELINES
  // =========================================================
  const handleAddFolder = async (
    name: string,
    parentId: string | null,
    color: string,
    coverUrl: string | null,
  ) => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name,
      parentId,
      color,
      coverUrl,
    };
    await db.folders.put(newFolder);
  };
  const handleEditFolder = async (updatedFolder: Folder) => {
    await db.folders.put(updatedFolder);
  };
  const handleDeleteFolder = async (folderId: string) => {
    // Cascade deletion strategy: Find this folder and all recursively nested subfolders
    const gatherFolderIds = (id: string): string[] => {
      let ids = [id];
      const children = folders.filter((f) => f.parentId === id);
      children.forEach((child) => {
        ids = [...ids, ...gatherFolderIds(child.id)];
      });
      return ids;
    };

    const targetFolderIds = gatherFolderIds(folderId);

    // Delete folders from structure
    await db.folders.bulkDelete(targetFolderIds);

    const nowStr = new Date().toISOString();
    const itemsToUpdate = items
      .filter((item) => item.folderId && targetFolderIds.includes(item.folderId))
      .map((item) => ({ ...item, folderId: null, deletedAt: nowStr }));
    if (itemsToUpdate.length > 0) {
      await db.items.bulkPut(itemsToUpdate);
    }

    if (activeFolderId && targetFolderIds.includes(activeFolderId)) {
      setActiveSection('all');
      setActiveFolderId(null);
    }
  };

  // =========================================================
  // ACTIONS: TAGS PIPELINES
  // =========================================================
  const handleAddTag = async (name: string, color: string) => {
    if (tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      alert('Tag name already exists in the central pool!');
      return;
    }
    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name,
      color,
    };
    await db.tags.put(newTag);
  };

  const handleEditTag = async (tagId: string, newName: string, newColor: string) => {
    const oldTag = tags.find((t) => t.id === tagId);
    if (!oldTag) return;

    await db.tags.put({ ...oldTag, name: newName, color: newColor });

    if (oldTag.name !== newName) {
      const itemsToUpdate = items
        .filter(item => item.tags.includes(oldTag.name))
        .map(item => ({
          ...item,
          tags: item.tags.map((t) => (t === oldTag.name ? newName : t)),
        }));
      if (itemsToUpdate.length > 0) {
        await db.items.bulkPut(itemsToUpdate);
      }
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    const oldTag = tags.find((t) => t.id === tagId);
    if (!oldTag) return;

    await db.tags.delete(tagId);

    // Delete tag reference globally from all items
    const itemsToUpdate = items
      .filter((item) => item.tags.includes(oldTag.name))
      .map((item) => ({
        ...item,
        tags: item.tags.filter((t) => t !== oldTag.name),
      }));
    if (itemsToUpdate.length > 0) {
      await db.items.bulkPut(itemsToUpdate);
    }
  };

  // =========================================================
  // ACTIONS: SMART RULES PIPELINES
  // =========================================================
  const handleAddRule = async (newRuleData: Omit<AutoRule, 'id'>) => {
    const newRule: AutoRule = {
      id: `rule-${Date.now()}`,
      ...newRuleData,
    };
    await db.rules.put(newRule);
  };

  const handleDeleteRule = async (id: string) => {
    await db.rules.delete(id);
  };

  const handleResetData = async () => {
    await db.items.clear();
    await db.folders.clear();
    await db.tags.clear();
    await db.rules.clear();
    await db.items.bulkPut(INITIAL_ITEMS);
    await db.folders.bulkPut(INITIAL_FOLDERS);
    await db.tags.bulkPut(INITIAL_TAGS);
    await db.rules.bulkPut(INITIAL_RULES);
    setActiveSection('all');
    setActiveFolderId(null);
    setSelectedItemIds([]);
    setSelectedItem(null);
  };

  // Clear batch multi-selects when active navigation changes to keep context-safe
  useEffect(() => {
    setSelectedItemIds([]);
  }, [activeSection]);

  // Track viewport changes for permanent side-panel inspector
  useEffect(() => {
    const handleResize = () => {
      setIsWideScreen(window.innerWidth >= 1280);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Global Keyboard Shortcuts (Desktop Focus)
  useEffect(() => {
    let keySequence = '';

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if typing in inputs to avoid capturing normal workflows
      const activeElement = document.activeElement;
      const isInputActive = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );

      // 1. Command Palette Toggle (Cmd+K / Ctrl+K)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (isInputActive) return;

      // 2. Add New Save item form (Press 'A')
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setShowAddDialog(true);
        return;
      }

      // 3. Move selected items to trash bin (Backspace / Delete)
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedItemIds.length > 0) {
          e.preventDefault();
          handleMassDelete(selectedItemIds);
          setSelectedItemIds([]);
        }
        return;
      }

      // 4. Close any active popup, sheet, context menu, palette (Escape)
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedItem(null);
        setShowAddDialog(false);
        setContextMenu(null);
        setIsCommandPaletteOpen(false);
        return;
      }

      // 5. Sequence: Press 'G' then 'I' to Jump to Inbox
      const char = e.key.toLowerCase();
      if (char === 'g' || char === 'i') {
        keySequence += char;
        if (keySequence === 'gi') {
          handleNavigate('inbox');
          keySequence = '';
        }
        // Timeout to reset sequence buffer
        setTimeout(() => {
          keySequence = '';
        }, 1000);
      } else {
        keySequence = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedItemIds]);

  // Global Instant Paste-to-Save (Cmd/Ctrl+V anywhere outside inputs)
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (isQuickShareMode || showAddDialog || isCommandPaletteOpen) return;

      const activeElement = document.activeElement;
      const isInputActive = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );
      if (isInputActive) return;

      const pastedText = e.clipboardData?.getData('text/plain')?.trim();
      if (!pastedText) return;

      const extractedUrl = extractFirstUrl(pastedText);
      if (!extractedUrl) return;

      e.preventDefault();
      void handleScrapeAndAddLink(extractedUrl);
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [isQuickShareMode, showAddDialog, isCommandPaletteOpen]);

  const handleToggleSelectItem = (id: string, isMeta: boolean) => {
    setSelectedItemIds((prev) => {
      const isSelected = prev.includes(id);
      if (isMeta) {
        if (isSelected) {
          return prev.filter((itemId) => itemId !== id);
        } else {
          return [...prev, id];
        }
      } else {
        if (isSelected && prev.length === 1) {
          return [];
        } else {
          return [id];
        }
      }
    });
  };

  const handleContextMenu = (e: React.MouseEvent, item: SavedItem) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
    });
  };

  const handleMassRestore = async (ids: string[]) => {
    const itemsToUpdate = items
      .filter(item => ids.includes(item.id))
      .map(item => ({ ...item, deletedAt: null }));
    if (itemsToUpdate.length > 0) {
      await db.items.bulkPut(itemsToUpdate);
    }
  };

  const handleMassPermanentDelete = async (ids: string[]) => {
    await db.items.bulkDelete(ids);
  };

  const handleImportData = async (data: { items: SavedItem[]; folders: Folder[]; tags: Tag[]; rules: AutoRule[] }) => {
    await db.items.clear();
    await db.folders.clear();
    await db.tags.clear();
    await db.rules.clear();
    if (data.items?.length) await db.items.bulkPut(data.items);
    if (data.folders?.length) await db.folders.bulkPut(data.folders);
    if (data.tags?.length) await db.tags.bulkPut(data.tags);
    if (data.rules?.length) await db.rules.bulkPut(data.rules);
    setActiveSection('all');
    setActiveFolderId(null);
  };

  // Apply automation rules engine on a newly parsed saved item
  const applyAutomationRulesOnItem = (item: SavedItem, activeRules: AutoRule[] = rules): SavedItem => {
    let modified = { ...item };

    activeRules.forEach((rule) => {
      let isTriggered = false;
      const targetVal = modified[rule.triggerField]?.toLowerCase() || '';

      if (rule.triggerOperator === 'contains') {
        isTriggered = targetVal.includes(rule.triggerValue.toLowerCase());
      } else {
        isTriggered = targetVal === rule.triggerValue.toLowerCase();
      }

      if (isTriggered) {
        if (rule.actionType === 'add_tag') {
          if (!modified.tags.includes(rule.actionValue)) {
            modified.tags = [...modified.tags, rule.actionValue];
          }
        } else if (rule.actionType === 'move_to_folder') {
          modified.folderId = rule.actionValue;
        }
      }
    });

    return modified;
  };

  const fetchYouTubeOEmbedFallback = async (targetUrl: string): Promise<any | null> => {
    const lower = targetUrl.toLowerCase();
    if (!lower.includes('youtube.com') && !lower.includes('youtu.be')) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`,
        { signal: controller.signal }
      );
      clearTimeout(timer);
      if (!res.ok) return null;
      const data = await res.json();
      return {
        title: data.title,
        note: data.author_name ? `By ${data.author_name} on YouTube` : undefined,
        previewUrl: data.thumbnail_url,
      };
    } catch {
      clearTimeout(timer);
      return null;
    }
  };

  const enrichItemInBackground = async (
    itemId: string,
    targetUrl: string,
    options: { silentToast?: boolean } = {}
  ) => {
    const currentQueue = readPendingEnrichments();
    if (!currentQueue.some((q) => q.itemId === itemId)) {
      writePendingEnrichments([...currentQueue, { itemId, url: targetUrl }]);
    }

    const removePending = () => {
      writePendingEnrichments(readPendingEnrichments().filter((q) => q.itemId !== itemId));
    };

    try {
      let data: any = null;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6500);

      try {
        const response = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          signal: controller.signal,
          body: JSON.stringify({
            url: targetUrl,
            aiMode,
            customAiApiKey,
            customAiApiUrl,
            customAiModel,
            aiCustomInstructions,
            aiTemperature,
            aiDefaultTags,
            aiDefaultThumbnail,
          }),
        });
        clearTimeout(timer);
        if (response.ok) {
          data = await response.json();
        }
      } catch {
        clearTimeout(timer);
      }

      // Static PWA / offline-backend fallback for YouTube & Shorts
      if (!data) {
        data = await fetchYouTubeOEmbedFallback(targetUrl);
      }

      if (!data) {
        return;
      }

      const existingItem = await db.items.get(itemId);
      if (!existingItem || existingItem.deletedAt) {
        removePending();
        return;
      }

      const updatedItem: SavedItem = {
        ...existingItem,
        header:
          data.title && data.title !== 'Saved Web URL' && data.title !== 'Saved Link'
            ? data.title
            : existingItem.header,
        note:
          data.note && data.note !== 'Pasted Link' && data.note !== 'Saved on OmniBox'
            ? data.note
            : existingItem.note,
        previewUrl: data.previewUrl || existingItem.previewUrl,
        tags: Array.from(new Set([...existingItem.tags, ...(data.tags || [])])),
        platform: data.platform || existingItem.platform,
        format: data.format || existingItem.format,
        quoteText: data.quoteText || existingItem.quoteText,
        brandColor: data.brandColor || existingItem.brandColor,
      };

      await db.items.put(updatedItem);
      removePending();

      setQuickShareItem((prev) => (prev && prev.id === updatedItem.id ? updatedItem : prev));

      if (updatedItem.tags.length > 0) {
        const existingTags = await db.tags.toArray();
        const newTagsToInsert: Tag[] = [];
        updatedItem.tags.forEach((tagName) => {
          if (!existingTags.some((t) => t.name.toLowerCase() === tagName.toLowerCase())) {
            newTagsToInsert.push({
              id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: tagName,
              color: '#3b82f6',
            });
          }
        });
        if (newTagsToInsert.length > 0) {
          await db.tags.bulkPut(newTagsToInsert);
        }
      }

      const metadataImproved =
        updatedItem.header !== existingItem.header || updatedItem.note !== existingItem.note;
      if (!options.silentToast && metadataImproved) {
        addToast({
          id: `enrich-${Date.now()}`,
          type: 'enriched',
          title: `✨ Metadata Enriched`,
          message: updatedItem.header,
          actionText: 'View',
          onAction: () => {
            setSelectedItem(updatedItem);
          },
        });
      }
    } catch {
      console.log('[OmniBox] Background enrichment completed with fallback');
    }
  };

  // =========================================================
  // ACTIONS: SAVED ITEMS PIPELINES
  // =========================================================
  const handleScrapeAndAddLink = async (targetUrl: string) => {
    await createAndSaveQuickItem(targetUrl);
  };

  const handleSaveManualItem = async (manualData: any) => {
    const newItem: SavedItem = {
      id: `item-${Date.now()}`,
      header: manualData.header,
      note: manualData.note,
      url: manualData.url,
      platform: manualData.platform,
      format: manualData.format,
      previewUrl: manualData.previewUrl,
      customPreviewUrl: manualData.customPreviewUrl,
      customPreviewType: manualData.customPreviewType,
      tags: manualData.tags,
      folderId: manualData.folderId,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };

    await db.items.put(newItem);
    setShowAddDialog(false);
  };

  const handleUpdateItem = async (updatedItem: SavedItem) => {
    await db.items.put(updatedItem);
    setSelectedItem(updatedItem);
  };

  const handleDeleteItem = async (id: string) => {
    const item = items.find((i) => i.id === id) || (await db.items.get(id));
    if (item) {
      await db.items.put({ ...item, deletedAt: new Date().toISOString() });
    }
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  };
  const handleReorderItems = async (draggedId: string, targetId: string, position: 'before' | 'after') => {
    const dragIndex = items.findIndex((item) => item.id === draggedId);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    if (dragIndex === -1 || targetIndex === -1 || dragIndex === targetIndex) return;
    const targetItem = items[targetIndex];
    let newTime = new Date(targetItem.createdAt).getTime();
    if (position === 'before') {
      newTime += 1000;
    } else {
      newTime -= 1000;
    }
    const draggedItem = items[dragIndex];
    await db.items.put({ ...draggedItem, createdAt: new Date(newTime).toISOString() });
  };

  // Bulk actions from Inbox
  const handleMassMove = async (ids: string[], folderId: string | null) => {
    const itemsToUpdate = items
      .filter(item => ids.includes(item.id))
      .map(item => ({ ...item, folderId }));
    if (itemsToUpdate.length > 0) {
      await db.items.bulkPut(itemsToUpdate);
    }
  };

  const handleMassTag = async (ids: string[], tagNames: string[]) => {
    const itemsToUpdate = items
      .filter((item) => ids.includes(item.id))
      .map((item) => {
        const combined = Array.from(new Set([...item.tags, ...tagNames]));
        return { ...item, tags: combined };
      });
    if (itemsToUpdate.length > 0) {
      await db.items.bulkPut(itemsToUpdate);
    }
  };

  const handleMassDelete = async (ids: string[]) => {
    const nowStr = new Date().toISOString();
    const itemsToUpdate = items
      .filter((item) => ids.includes(item.id))
      .map((item) => ({ ...item, deletedAt: nowStr }));
    if (itemsToUpdate.length > 0) {
      await db.items.bulkPut(itemsToUpdate);
    }
  };

  // Trash actions
  const handleRestoreItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      await db.items.put({ ...item, deletedAt: null });
    }
  };

  const handlePermanentDelete = async (id: string) => {
    await db.items.delete(id);
  };

  const handleEmptyTrash = async () => {
    const trashItems = items.filter((item) => item.deletedAt !== null);
    if (trashItems.length > 0) {
      await db.items.bulkDelete(trashItems.map((i) => i.id));
    }
  };

  // =========================================================
  // COUNTERS & FILTER CALCULATIONS
  // =========================================================
  const getFolderItemsCount = (folderId: string): number => {
    // Count items inside this folder (and recursively inside child folders)
    const gatherFolderIds = (id: string): string[] => {
      let ids = [id];
      const children = folders.filter((f) => f.parentId === id);
      children.forEach((child) => {
        ids = [...ids, ...gatherFolderIds(child.id)];
      });
      return ids;
    };

    const targetFolderIds = gatherFolderIds(folderId);
    return items.filter((item) => item.deletedAt === null && item.folderId && targetFolderIds.includes(item.folderId)).length;
  };

  const itemsCount = {
    all: items.filter((i) => i.deletedAt === null && i.folderId !== null).length,
    inbox: items.filter((i) => i.deletedAt === null && i.folderId === null).length,
    trash: items.filter((i) => i.deletedAt !== null).length,
  };

  // Filter items list depending on active section and query inputs

  const handleTagClick = (tagName: string, type: 'user' | 'platform' | 'format') => {
    if (type === 'platform') {
      const matched = PLATFORM_CHIPS.find(p => p.toLowerCase() === tagName.toLowerCase());
      setPlatformFilter(matched || tagName);
      setActiveSection('all');
    } else if (type === 'format') {
      const matched = FORMAT_CHIPS.find(f => f.toLowerCase() === tagName.toLowerCase());
      setFormatFilter(matched || tagName);
      setActiveSection('all');
    } else if (type === 'user') {
      setSearchQuery(tagName);
      setActiveSection('all');
    }
  };

  const getFilteredItems = (): SavedItem[] => {

    let pool: SavedItem[] = [];

    // Filter by main sidebar navigation
    if (activeSection === 'inbox') {
      pool = items.filter((item) => item.deletedAt === null && item.folderId === null);
    } else if (activeSection === 'all') {
      pool = items.filter((item) => item.deletedAt === null && item.folderId !== null);
    } else if (activeSection === 'trash') {
      pool = items.filter((item) => item.deletedAt !== null);
    } else if (activeSection.startsWith('folder-')) {
      const currentId = activeSection.replace('folder-', '');
      pool = items.filter((item) => item.deletedAt === null && item.folderId === currentId);
    }

    // Filter by search queries
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      pool = pool.filter(
        (item) =>
          item.header.toLowerCase().includes(q) ||
          item.note.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q)) ||
          item.url.toLowerCase().includes(q),
      );
    }

    // Filter by platform chip
    if (platformFilter !== 'All') {
      pool = pool.filter((item) => (item.platform || '').toLowerCase() === platformFilter.toLowerCase());
    }

    // Filter by format chip
    if (formatFilter !== 'All') {
      pool = pool.filter((item) => (item.format || '').toLowerCase() === formatFilter.toLowerCase());
    }

    return pool;
  };

  const filteredItems = getFilteredItems();

  const PLATFORM_CHIPS = ['All', 'YouTube', 'Instagram', 'TikTok', 'Music', 'Spotify', 'Threads', 'X / Twitter', 'Pinterest'];
  const FORMAT_CHIPS = ['All', 'Video', 'Reel', 'Image', 'Post', 'Thread', 'Comment', 'Profile', 'Song', 'Audio', 'Playlist'];

  if (isQuickShareMode) {
    return (
      <QuickShareOverlay
        item={quickShareItem}
        folders={folders}
        autoCloseEnabled={quickShareAutoClose}
        onAssignFolder={async (itemId, folderId) => {
          const item = await db.items.get(itemId);
          if (item) {
            const updated = { ...item, folderId };
            await db.items.put(updated);
            setQuickShareItem(updated);
          }
        }}
        onUndo={async (itemId) => {
          await handleDeleteItem(itemId);
        }}
        onOpenLibrary={() => {
          setIsQuickShareMode(false);
          setActiveSection('inbox');
        }}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-theme-app font-sans antialiased text-theme-text transition-colors duration-200">
      {/* Recursively nested Sidebar Panel */}
      <Sidebar
        folders={folders}
        tags={tags}
        rules={rules}
        activeSection={activeSection}
        activeFolderId={activeFolderId}
        onTagClick={handleTagClick}
        itemsCount={itemsCount}
        getFolderItemsCount={getFolderItemsCount}
        onNavigate={handleNavigate}
        onAddFolder={handleAddFolder}
        onEditFolder={handleEditFolder}
        onDeleteFolder={handleDeleteFolder}
        onAddTag={handleAddTag}
        onEditTag={handleEditTag}
        onDeleteTag={handleDeleteTag}
        onAddRule={handleAddRule}
        onDeleteRule={handleDeleteRule}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onMoveItemsToFolder={handleMassMove}
        onMoveItemsToTrash={handleMassDelete}
      />

      {/* Main Content Dashboard Frame */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-theme-app transition-colors duration-200">
        {/* Navbar */}
        <header className="h-16 shrink-0 border-b border-theme-border flex items-center justify-between px-4 sm:px-6 bg-theme-sidebar/85 backdrop-blur-md sticky top-0 z-30 transition-colors duration-200 text-theme-text">
          <div className="flex items-center space-x-3">
            {/* Elegant Logo (Click to toggle Sidebar collapse/expand) */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center space-x-2.5 cursor-pointer hover:opacity-85 active:scale-95 transition-all text-left focus:outline-none"
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <Logo size={32} />
              <span className="font-display italic text-theme-text text-lg tracking-tight hidden sm:block">
                OmniBox
              </span>
            </button>
          </div>

          {/* Center search bar */}
          <div className="hidden md:flex items-center relative w-96 max-w-sm">
            <div className="absolute inset-y-0 left-3 flex items-center text-theme-muted pointer-events-none">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search OmniBox (titles, notes, #tags, URLs)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-theme-card border border-theme-border rounded-xl pl-10 pr-4 py-2 text-xs text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-theme-accent transition-colors"
            />
          </div>

          {/* Right Action Menu */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center space-x-1 sm:space-x-1.5 bg-theme-accent hover:bg-theme-hover text-white font-semibold px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs transition shrink-0 shadow-lg"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Add</span>
              <span className="inline sm:hidden">Add</span>
            </button>
          </div>
        </header>

        {/* Dashboard Panels Scroll Frame */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6 scrollbar-thin">
          {activeSection === 'inbox' ? (
            // =========================================================
            // LANDING INBOX PROCESSING BOARD
            // =========================================================
            <InboxSection layout={layout} setLayout={setLayout}
              onTagClick={handleTagClick}
              inboxItems={items.filter((i) => i.deletedAt === null && i.folderId === null)}
              folders={folders}
              tags={tags}
              onSelectItem={(item) => setSelectedItem(item)}
              onMoveItemsToFolder={handleMassMove}
              onAssignTagsToItems={handleMassTag}
              onDeleteItems={handleMassDelete}
              onContextMenu={handleContextMenu}
            />
          ) : activeSection === 'trash' ? (
            // =========================================================
            // RECOVERY ARCHIVE TRASH VAULT
            // =========================================================
            <TrashSection
              onTagClick={handleTagClick} layout={layout} setLayout={setLayout}
              trashItems={items.filter((i) => i.deletedAt !== null)}
              onRestoreItem={handleRestoreItem}
              onPermanentDeleteItem={handlePermanentDelete}
              onEmptyTrash={handleEmptyTrash}
              onContextMenu={handleContextMenu}
            />
          ) : activeSection === 'settings' ? (
            // =========================================================
            // SETTINGS & SYSTEM UTILITY PANEL
            // =========================================================
            <SettingsSection
              layout={layout}
              setLayout={setLayout}
              gallerySize={gallerySize}
              setGallerySize={setGallerySize}
              listDensity={listDensity}
              setListDensity={setListDensity}
              showNotesInFeed={showNotesInFeed}
              setShowNotesInFeed={setShowNotesInFeed}
              showTagsInFeed={showTagsInFeed}
              setShowTagsInFeed={setShowTagsInFeed}
              showPlatformBadges={showPlatformBadges}
              setShowPlatformBadges={setShowPlatformBadges}
              items={items}
              folders={folders}
              tags={tags}
              rules={rules}
              onAddRule={handleAddRule}
              onDeleteRule={handleDeleteRule}
              onResetData={handleResetData}
              onImportData={handleImportData}
              activeThemeId={activeThemeId}
              setActiveThemeId={setActiveThemeId}
              customThemes={customThemes}
              setCustomThemes={setCustomThemes}
              aiMode={aiMode}
              setAiMode={setAiMode}
              customAiApiKey={customAiApiKey}
              setCustomAiApiKey={setCustomAiApiKey}
              customAiApiUrl={customAiApiUrl}
              setCustomAiApiUrl={setCustomAiApiUrl}
              customAiModel={customAiModel}
              setCustomAiModel={setCustomAiModel}
              aiCustomInstructions={aiCustomInstructions}
              setAiCustomInstructions={setAiCustomInstructions}
              aiTemperature={aiTemperature}
              setAiTemperature={setAiTemperature}
              aiDefaultTags={aiDefaultTags}
              setAiDefaultTags={setAiDefaultTags}
              aiDefaultThumbnail={aiDefaultThumbnail}
              setAiDefaultThumbnail={setAiDefaultThumbnail}
              autoCloseOnShare={autoCloseOnShare}
              setAutoCloseOnShare={setAutoCloseOnShare}
            />
          ) : (
            // =========================================================
            // ALL MEDIA TILES & GRID TIERS
            // =========================================================
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Header Context row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-theme-border pb-4">
                <div>
                  <h1 className="text-xl font-bold text-theme-text tracking-tight">
                    {activeSection === 'all'
                      ? 'Saved Media Library'
                      : folders.find((f) => f.id === activeFolderId)?.name || 'Media Library'}
                  </h1>
                  <p className="text-xs text-theme-muted mt-0.5">
                    Viewing {filteredItems.length} curated media cards in this section.
                  </p>
                </div>

                {/* Grid vs List toggles & visual layout densities */}
                <div className="flex items-center space-x-3 self-end md:self-auto">
                  {/* Grid vs List layout buttons */}
                  <div className="flex items-center bg-theme-card border border-theme-border rounded-xl p-0.5 text-theme-muted">
                    <button
                      onClick={() => setLayout('gallery')}
                      title="Gallery Masonry View"
                      className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                        layout === 'gallery' ? 'bg-theme-sidebar text-theme-text' : 'hover:text-theme-text'
                      }`}
                    >
                      <Grid size={15} />
                    </button>
                    <button
                      onClick={() => setLayout('list')}
                      title="Compact List View"
                      className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                        layout === 'list' ? 'bg-theme-sidebar text-theme-text' : 'hover:text-theme-text'
                      }`}
                    >
                      <List size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Search block */}
              <div className="flex md:hidden items-center relative">
                <div className="absolute inset-y-0 left-3 flex items-center text-theme-muted pointer-events-none">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Search titles, notes, #tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-theme-card border border-theme-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-theme-accent transition shadow-inner"
                />
              </div>

              {/* Quick Platform Chips Filter Row */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest block">
                  Quick Filter Platforms
                </span>
                <div className="flex overflow-x-auto gap-1.5 pb-2 -mx-6 px-6 scrollbar-none sm:flex-wrap sm:overflow-visible sm:pb-0 sm:-mx-0 sm:px-0">
                  {PLATFORM_CHIPS.map((p) => {
                    const isActive = platformFilter === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setPlatformFilter(p)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition-all duration-150 shadow-xs shrink-0 sm:shrink ${
                          isActive
                            ? 'bg-theme-card border-theme-accent text-theme-text font-bold ring-2 ring-theme-accent/15'
                            : 'bg-theme-card border-theme-border text-theme-muted hover:text-theme-text hover:border-theme-muted'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Format Chips Filter Row */}
              <div className="space-y-2 pt-1 border-t border-theme-border/60">
                <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest block">
                  Quick Filter Formats
                </span>
                <div className="flex overflow-x-auto gap-1.5 pb-2 -mx-6 px-6 scrollbar-none sm:flex-wrap sm:overflow-visible sm:pb-0 sm:-mx-0 sm:px-0">
                  {FORMAT_CHIPS.map((f) => {
                    const isActive = formatFilter === f;
                    return (
                      <button
                        key={f}
                        onClick={() => setFormatFilter(f)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition-all duration-150 shadow-xs shrink-0 sm:shrink ${
                          isActive
                            ? 'bg-theme-card border-theme-accent text-theme-text font-bold ring-2 ring-theme-accent/15'
                            : 'bg-theme-card border-theme-border text-theme-muted hover:text-theme-text hover:border-theme-muted'
                        }`}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Core media grid feed */}
              <div className="pt-2">
                <Feed
                  onTagClick={handleTagClick}
                  items={filteredItems}
                  folders={folders}
                  tags={tags}
                  layout={layout}
                  gallerySize={gallerySize}
                  listDensity={listDensity}
                      showNotesInFeed={showNotesInFeed}
                  showTagsInFeed={showTagsInFeed}
                  showPlatformBadges={showPlatformBadges}
                  selectedItemIds={selectedItemIds}
                  onSelectItem={(item) => setSelectedItem(item)}
                  onDeleteItem={handleDeleteItem}
                  onToggleSelectItem={handleToggleSelectItem}
                  onContextMenu={handleContextMenu}
                  onReorderItems={handleReorderItems}
                  onSwipeRightItem={(item) => {
                    setSwipeActiveItem(item);
                    setShowFolderSwipeSheet(true);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Pane 3: Permanent Inspector Column for wide viewports */}
      {selectedItem && isWideScreen && (
        <InspectorPanel
          item={selectedItem}
          allItems={items}
          folders={folders}
          tags={tags}
          onClose={() => setSelectedItem(null)}
          onUpdateItem={handleUpdateItem}
          onTagClick={handleTagClick}
          onDeleteItem={handleDeleteItem}
          onMaximize={() => setShowFullDetailSheet(true)}
        />
      )}

      {/* Slide-up Detail sheet with multi-level stacking recommendations stack (mobile/tablet only or maximized desktop) */}
      {selectedItem && (!isWideScreen || showFullDetailSheet) && (
        <DetailSheet
          item={selectedItem}
          allItems={items}
          folders={folders}
          tags={tags}
          onClose={() => setSelectedItem(null)}
          onUpdateItem={handleUpdateItem}
          onTagClick={handleTagClick}
          onDeleteItem={handleDeleteItem}
        />
      )}

      {/* Manual creation dialog with drag-drop image and video override base64 storage */}
      {showAddDialog && (
        <AddMediaDialog
          folders={folders}
          tags={tags}
          onClose={() => {
            setShowAddDialog(false);
            setPrefillData(null);
          }}
          onSave={(data) => {
            handleSaveManualItem(data);
            setPrefillData(null);
          }}
          onScrape={handleScrapeAndAddLink}
          prefillData={prefillData}
        />
      )}

      {/* Mobile Sticky Bottom Navigation Bar */}
      <BottomNavigation
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onAddClick={() => {
          setPrefillData(null);
          setShowAddDialog(true);
        }}
        folders={folders}
        itemsCount={itemsCount}
      />

      {/* Folder Move/Archive swipe-right bottom sheet */}
      <BottomSheet
        isOpen={showFolderSwipeSheet}
        onClose={() => {
          setShowFolderSwipeSheet(false);
          setSwipeActiveItem(null);
        }}
        title="Move to Folder"
      >
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {/* Option: Send back to General Inbox (null folder) */}
          <button
            onClick={() => {
              if (swipeActiveItem) {
                handleMassMove([swipeActiveItem.id], null);
                if (navigator.vibrate) {
                  navigator.vibrate(30);
                }
              }
              setShowFolderSwipeSheet(false);
              setSwipeActiveItem(null);
            }}
            className="w-full flex items-center space-x-3 p-3.5 bg-theme-card border border-theme-border rounded-xl text-left font-semibold text-sm hover:bg-theme-hover transition cursor-pointer"
          >
            <div className="w-5 h-5 rounded-xl bg-theme-muted/10 border border-theme-border flex items-center justify-center text-xs text-theme-muted font-bold">
              ∅
            </div>
            <span className="text-theme-text flex-1">Move to Inbox (No Folder)</span>
          </button>

          {/* Folder mappings */}
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => {
                if (swipeActiveItem) {
                  handleMassMove([swipeActiveItem.id], folder.id);
                  if (navigator.vibrate) {
                    navigator.vibrate(40);
                  }
                }
                setShowFolderSwipeSheet(false);
                setSwipeActiveItem(null);
              }}
              className="w-full flex items-center space-x-3.5 p-3.5 bg-theme-card border border-theme-border rounded-xl text-left font-semibold text-sm hover:bg-theme-hover transition cursor-pointer"
            >
              <div
                className="w-3.5 h-3.5 rounded-xl flex-shrink-0"
                style={{ backgroundColor: folder.color }}
              />
              <span className="text-theme-text flex-1 truncate">{folder.name}</span>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Global command palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        folders={folders}
        items={items}
        currentThemeId={activeThemeId}
        onSelectTheme={(id) => setActiveThemeId(id)}
        onNavigate={handleNavigate}
        onSelectItem={(item) => setSelectedItem(item)}
        onAddCustomItem={() => setShowAddDialog(true)}
        onToggleLayout={() => setLayout(layout === 'gallery' ? 'list' : 'gallery')}
        onResetData={handleResetData}
        currentLayout={layout}
      />

      {/* Global desktop context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          folders={folders}
          tags={tags}
          selectedItemIds={selectedItemIds}
          isTrashView={activeSection === 'trash'}
          onClose={() => setContextMenu(null)}
          onMoveItemsToFolder={handleMassMove}
          onAssignTagsToItems={handleMassTag}
          onDeleteItems={handleMassDelete}
          onRestoreItems={handleMassRestore}
          onPermanentDelete={handleMassPermanentDelete}
        />
      )}

      {/* Global Toast Notifications for Instant Feedbacks */}
      <ToastNotification toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
