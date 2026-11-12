import { useLiveQuery } from "dexie-react-hooks";
import { db, migrateFromLocalStorage, INITIAL_ITEMS, INITIAL_FOLDERS, INITIAL_TAGS, INITIAL_RULES } from "./db";
import React, { useState, useEffect, useRef } from 'react';
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
  CheckSquare,
  X,
  FolderOpen,
  ExternalLink,
  Copy,
  Check,
  Download,
  Send,
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
import { useBackHandler, BackStackLayer } from './utils/backNavigation';
import {
  buildObsidianVaultZip,
  downloadBlob,
  getGokoClipUri,
  itemToObsidianMarkdown,
} from './utils/obsidianExport';

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

  // Navigation & Filter States (persisted across phone app close/reopen)
  const [activeSection, setActiveSection] = useState<string>(() => {
    if (typeof window === 'undefined') return 'all';
    return localStorage.getItem('omnibox_active_section') || 'all';
  });
  const [activeFolderId, setActiveFolderId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const savedSection = localStorage.getItem('omnibox_active_section') || 'all';
    if (savedSection.startsWith('folder-')) {
      return savedSection.replace('folder-', '');
    }
    return localStorage.getItem('omnibox_active_folder_id') || null;
  });
  const [sectionHistory, setSectionHistory] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['all'];
    const savedSection = localStorage.getItem('omnibox_active_section') || 'all';
    try {
      const raw = localStorage.getItem('omnibox_section_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[parsed.length - 1] === savedSection) {
          return parsed;
        }
      }
    } catch {
      // Ignore malformed stored history
    }
    return savedSection === 'all' ? ['all'] : ['all', savedSection];
  });

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
  const [showYouTubeViewer, setShowYouTubeViewer] = useState<boolean>(() => {
    return localStorage.getItem('omnibox_show_youtube_viewer') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('omnibox_show_tags', String(showTagsInFeed));
  }, [showTagsInFeed]);
  useEffect(() => {
    localStorage.setItem('omnibox_show_badges', String(showPlatformBadges));
  }, [showPlatformBadges]);
  useEffect(() => {
    localStorage.setItem('omnibox_show_youtube_viewer', String(showYouTubeViewer));
  }, [showYouTubeViewer]);
  
  // Sidebar Toggle (Desktop only >= 1024px; mobile uses BottomNavigation)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let prevIsDesktop = window.innerWidth >= 1024;
    const handleResize = () => {
      const nowDesktop = window.innerWidth >= 1024;
      if (nowDesktop !== prevIsDesktop) {
        prevIsDesktop = nowDesktop;
        setIsSidebarOpen(nowDesktop);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [autoCloseOnShare, setAutoCloseOnShare] = useState<boolean>(() => {
    return localStorage.getItem('omnibox_auto_close_share') !== 'false';
  });
  useEffect(() => {
    localStorage.setItem('omnibox_auto_close_share', String(autoCloseOnShare));
  }, [autoCloseOnShare]);

  // Search & Filter state (persisted across reopen)
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('omnibox_search_query') || '';
  });
  const [platformFilter, setPlatformFilter] = useState<string>(() => {
    if (typeof window === 'undefined') return 'All';
    return localStorage.getItem('omnibox_platform_filter') || 'All';
  });
  const [formatFilter, setFormatFilter] = useState<string>(() => {
    if (typeof window === 'undefined') return 'All';
    return localStorage.getItem('omnibox_format_filter') || 'All';
  });

  // Popup Dialog States
  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null);
  const [showFullDetailSheet, setShowFullDetailSheet] = useState(false);

  const mainScrollRef = useRef<HTMLDivElement>(null);
  const hasRestoredSelectedRef = useRef(false);
  const hasRestoredScrollRef = useRef(false);
  const scrollSaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('omnibox_active_section', activeSection);
    if (activeFolderId) {
      localStorage.setItem('omnibox_active_folder_id', activeFolderId);
    } else {
      localStorage.removeItem('omnibox_active_folder_id');
    }
  }, [activeSection, activeFolderId]);

  useEffect(() => {
    try {
      localStorage.setItem('omnibox_section_history', JSON.stringify(sectionHistory));
    } catch {
      // Ignore storage quota errors
    }
  }, [sectionHistory]);

  useEffect(() => {
    localStorage.setItem('omnibox_search_query', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem('omnibox_platform_filter', platformFilter);
  }, [platformFilter]);

  useEffect(() => {
    localStorage.setItem('omnibox_format_filter', formatFilter);
  }, [formatFilter]);

  useEffect(() => {
    if (!selectedItem) {
      setShowFullDetailSheet(false);
      if (hasRestoredSelectedRef.current) {
        localStorage.removeItem('omnibox_selected_item_id');
      }
    } else {
      localStorage.setItem('omnibox_selected_item_id', selectedItem.id);
    }
  }, [selectedItem]);

  // Restore open item & scroll position when items load after closing/reopening PWA
  useEffect(() => {
    if (isQuickShareMode || items.length === 0) return;

    if (!hasRestoredSelectedRef.current) {
      hasRestoredSelectedRef.current = true;
      const savedId = localStorage.getItem('omnibox_selected_item_id');
      if (savedId) {
        const match = items.find((i) => i.id === savedId);
        if (match) {
          setSelectedItem(match);
        } else {
          localStorage.removeItem('omnibox_selected_item_id');
        }
      }
    }

    if (!hasRestoredScrollRef.current && mainScrollRef.current) {
      hasRestoredScrollRef.current = true;
      const savedScroll = parseInt(localStorage.getItem('omnibox_scroll_top') || '0', 10);
      if (savedScroll > 0) {
        requestAnimationFrame(() => {
          if (mainScrollRef.current) {
            mainScrollRef.current.scrollTop = savedScroll;
          }
        });
      }
    }
  }, [items, isQuickShareMode]);

  // Persist scroll position when backgrounding/closing PWA
  useEffect(() => {
    const flushScroll = () => {
      if (mainScrollRef.current) {
        localStorage.setItem('omnibox_scroll_top', String(mainScrollRef.current.scrollTop));
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flushScroll();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', flushScroll);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', flushScroll);
    };
  }, []);

  const [showAddDialog, setShowAddDialog] = useState(false);

  // Mobile & Swipe Optimization States
  const [prefillData, setPrefillData] = useState<{ url?: string; header?: string; note?: string } | null>(null);
  const [swipeActiveItem, setSwipeActiveItem] = useState<SavedItem | null>(null);
  const [showFolderSwipeSheet, setShowFolderSwipeSheet] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [quickActionItem, setQuickActionItem] = useState<SavedItem | null>(null);
  const [copiedQuickActionMd, setCopiedQuickActionMd] = useState(false);
  const [showBulkMoveSheet, setShowBulkMoveSheet] = useState(false);
  const [showBulkTagSheet, setShowBulkTagSheet] = useState(false);

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

    if (section === 'all') {
      setSectionHistory(['all']);
    } else {
      setSectionHistory((prev) => {
        if (prev[prev.length - 1] === section) return prev;
        return [...prev, section].slice(-8);
      });
    }

    localStorage.setItem('omnibox_scroll_top', '0');
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  };

  const handleNavigateBackSection = () => {
    setSectionHistory((prev) => {
      const nextHistory = prev.length > 1 ? prev.slice(0, -1) : ['all'];
      const targetSection = nextHistory[nextHistory.length - 1] || 'all';
      setActiveSection(targetSection);
      if (targetSection.startsWith('folder-')) {
        setActiveFolderId(targetSection.replace('folder-', ''));
      } else {
        setActiveFolderId(null);
      }
      return nextHistory;
    });
  };

  // Android / browser universal back handlers for top-level overlays
  useBackHandler(isSelectionMode, () => {
    setIsSelectionMode(false);
    setSelectedItemIds([]);
  });
  useBackHandler(isCommandPaletteOpen, () => setIsCommandPaletteOpen(false));
  useBackHandler(Boolean(contextMenu), () => setContextMenu(null));
  useBackHandler(Boolean(selectedItem) && isWideScreen && !showFullDetailSheet, () =>
    setSelectedItem(null)
  );

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
    setIsSelectionMode(false);
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
    all: items.filter((i) => i.deletedAt === null).length,
    inbox: items.filter((i) => i.deletedAt === null && i.folderId === null).length,
    trash: items.filter((i) => i.deletedAt !== null).length,
  };

  // Filter items list depending on active section and query inputs

  const handleTagClick = (tagName: string, type: 'user' | 'platform' | 'format') => {
    if (type === 'platform') {
      const matched = PLATFORM_CHIPS.find(p => p.toLowerCase() === tagName.toLowerCase());
      setPlatformFilter(matched || tagName);
      handleNavigate('all');
    } else if (type === 'format') {
      const matched = FORMAT_CHIPS.find(f => f.toLowerCase() === tagName.toLowerCase());
      setFormatFilter(matched || tagName);
      handleNavigate('all');
    } else if (type === 'user') {
      setSearchQuery(tagName);
      handleNavigate('all');
    }
  };

  const getFilteredItems = (): SavedItem[] => {

    let pool: SavedItem[] = [];

    // Filter by main sidebar navigation
    if (activeSection === 'inbox') {
      pool = items.filter((item) => item.deletedAt === null && item.folderId === null);
    } else if (activeSection === 'all') {
      pool = items.filter((item) => item.deletedAt === null);
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
    <div className="flex h-dvh overflow-hidden bg-theme-app font-sans antialiased text-theme-text transition-colors duration-200">
      {sectionHistory.slice(1).map((sec, idx) => (
        <BackStackLayer key={`${idx}-${sec}`} onBack={handleNavigateBackSection} />
      ))}

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
        <header className="min-h-14 sm:min-h-16 pt-safe shrink-0 border-b border-theme-border flex items-center justify-between px-3 sm:px-6 bg-theme-sidebar/85 backdrop-blur-md sticky top-0 z-30 transition-colors duration-200 text-theme-text">
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Brand Logo (Home on mobile, collapses sidebar on desktop) */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                  setIsSidebarOpen((prev) => !prev);
                } else {
                  handleNavigate('all');
                }
              }}
              className="flex items-center space-x-2 cursor-pointer hover:opacity-85 active:scale-95 transition-all text-left focus:outline-none py-1 pr-2 rounded-xl"
              title="OmniBox"
            >
              <Logo size={36} />
              <span className="font-display italic text-theme-text text-lg tracking-tight">
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

          {/* Right Action Menu (Desktop Add only; phone uses centered BottomNavigation + button) */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowAddDialog(true)}
              className="hidden lg:flex items-center space-x-1.5 bg-theme-accent hover:bg-theme-hover text-white font-semibold px-4 py-2 rounded-xl text-xs transition shrink-0 shadow-lg active:scale-95 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>
        </header>

        {/* Dashboard Panels Scroll Frame */}
        <div
          ref={mainScrollRef}
          onScroll={(e) => {
            const top = e.currentTarget.scrollTop;
            if (scrollSaveTimerRef.current !== null) {
              window.clearTimeout(scrollSaveTimerRef.current);
            }
            scrollSaveTimerRef.current = window.setTimeout(() => {
              localStorage.setItem('omnibox_scroll_top', String(top));
            }, 150);
          }}
          className="flex-1 overflow-y-auto p-4 sm:p-6 pb-28 lg:pb-6 scrollbar-thin"
        >
          {activeSection === 'inbox' ? (
            // =========================================================
            // LANDING INBOX PROCESSING BOARD
            // =========================================================
            <InboxSection layout={layout} setLayout={setLayout}
              showYouTubeViewer={showYouTubeViewer}
              onTagClick={handleTagClick}
              inboxItems={items.filter((i) => i.deletedAt === null && i.folderId === null)}
              folders={folders}
              tags={tags}
              onSelectItem={(item) => setSelectedItem(item)}
              onMoveItemsToFolder={handleMassMove}
              onAssignTagsToItems={handleMassTag}
              onDeleteItems={handleMassDelete}
              onContextMenu={handleContextMenu}
              onSwipeRightItem={(item) => {
                setSwipeActiveItem(item);
                setShowFolderSwipeSheet(true);
              }}
            />
          ) : activeSection === 'trash' ? (
            // =========================================================
            // RECOVERY ARCHIVE TRASH VAULT
            // =========================================================
            <TrashSection
              onTagClick={handleTagClick} layout={layout} setLayout={setLayout}
              showYouTubeViewer={showYouTubeViewer}
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
              showYouTubeViewer={showYouTubeViewer}
              setShowYouTubeViewer={setShowYouTubeViewer}
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
              autoCloseOnShare={autoCloseOnShare}
              setAutoCloseOnShare={setAutoCloseOnShare}
            />
          ) : (
            // =========================================================
            // ALL MEDIA TILES & GRID TIERS
            // =========================================================
            <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
              {/* Header Context row */}
              <div className="flex items-center justify-between gap-3 border-b border-theme-border pb-3 md:pb-4">
                <div className="min-w-0">
                  <h1 className="text-lg md:text-xl font-bold text-theme-text tracking-tight truncate">
                    {activeSection === 'all'
                      ? 'Saved Media Library'
                      : folders.find((f) => f.id === activeFolderId)?.name || 'Media Library'}
                  </h1>
                  <p className="text-xs text-theme-muted mt-0.5">
                    {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                  </p>
                </div>

                {/* Multi-Select Mode + Grid vs List toggles */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (isSelectionMode) {
                        setIsSelectionMode(false);
                        setSelectedItemIds([]);
                      } else {
                        setIsSelectionMode(true);
                      }
                    }}
                    className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      isSelectionMode
                        ? 'bg-theme-accent border-theme-accent text-white shadow-sm'
                        : 'bg-theme-card border-theme-border text-theme-muted hover:text-theme-text'
                    }`}
                    title={isSelectionMode ? 'Done selecting' : 'Select multiple items'}
                  >
                    <CheckSquare size={14} />
                    <span>{isSelectionMode ? 'Done' : 'Select'}</span>
                  </button>

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

              {/* Mobile Search + Collapsible Filters Bar */}
              <div className="md:hidden space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <div className="absolute inset-y-0 left-3 flex items-center text-theme-muted pointer-events-none">
                      <Search size={15} />
                    </div>
                    <input
                      type="text"
                      placeholder="Search saved items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-theme-card border border-theme-border rounded-xl pl-9 pr-8 py-2 text-base sm:text-xs text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-theme-accent transition shadow-inner"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search"
                        className="absolute inset-y-0 right-2 flex items-center text-theme-muted hover:text-theme-text px-1 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters((prev) => !prev)}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-semibold shrink-0 transition cursor-pointer ${
                      showMobileFilters || platformFilter !== 'All' || formatFilter !== 'All'
                        ? 'bg-theme-accent/10 border-theme-accent text-theme-accent'
                        : 'bg-theme-card border-theme-border text-theme-text'
                    }`}
                  >
                    <SlidersHorizontal size={14} />
                    <span>Filters</span>
                    {(platformFilter !== 'All' || formatFilter !== 'All') && (
                      <span className="w-4 h-4 rounded-full bg-theme-accent text-white text-[10px] font-bold flex items-center justify-center">
                        {(platformFilter !== 'All' ? 1 : 0) + (formatFilter !== 'All' ? 1 : 0)}
                      </span>
                    )}
                  </button>
                </div>

                {!showMobileFilters && (platformFilter !== 'All' || formatFilter !== 'All') && (
                  <div className="flex items-center flex-wrap gap-1.5">
                    {platformFilter !== 'All' && (
                      <button
                        type="button"
                        onClick={() => setPlatformFilter('All')}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-theme-accent/15 border border-theme-accent/40 text-theme-accent text-[11px] font-semibold cursor-pointer"
                      >
                        <span>{platformFilter}</span>
                        <X size={11} />
                      </button>
                    )}
                    {formatFilter !== 'All' && (
                      <button
                        type="button"
                        onClick={() => setFormatFilter('All')}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-theme-accent/15 border border-theme-accent/40 text-theme-accent text-[11px] font-semibold cursor-pointer"
                      >
                        <span>{formatFilter}</span>
                        <X size={11} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Platform & Format Filters (Visible on Desktop, Collapsible on Phone) */}
              <div className={showMobileFilters ? 'space-y-3 p-3 bg-theme-sidebar border border-theme-border rounded-xl md:p-0 md:bg-transparent md:border-0 md:rounded-none' : 'hidden md:block space-y-3'}>
                {/* Quick Platform Chips Filter Row */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest block">
                    Quick Filter Platforms
                  </span>
                  <div className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-none sm:flex-wrap sm:overflow-visible sm:pb-0">
                    {PLATFORM_CHIPS.map((p) => {
                      const isActive = platformFilter === p;
                      return (
                        <button
                          key={p}
                          onClick={() => setPlatformFilter(p)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition-all duration-150 shadow-xs shrink-0 sm:shrink cursor-pointer ${
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
                <div className="space-y-2 pt-2 border-t border-theme-border/60">
                  <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest block">
                    Quick Filter Formats
                  </span>
                  <div className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-none sm:flex-wrap sm:overflow-visible sm:pb-0">
                    {FORMAT_CHIPS.map((f) => {
                      const isActive = formatFilter === f;
                      return (
                        <button
                          key={f}
                          onClick={() => setFormatFilter(f)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition-all duration-150 shadow-xs shrink-0 sm:shrink cursor-pointer ${
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
              </div>

              {/* Core media grid feed */}
              <div className={selectedItemIds.length > 0 ? 'pb-20 md:pb-16' : ''}>
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
                  showYouTubeViewer={showYouTubeViewer}
                  isSelectionMode={isSelectionMode}
                  selectedItemIds={selectedItemIds}
                  onSelectItem={(item) => setSelectedItem(item)}
                  onDeleteItem={handleDeleteItem}
                  onToggleSelectItem={handleToggleSelectItem}
                  onContextMenu={handleContextMenu}
                  onQuickActions={(item) => {
                    setCopiedQuickActionMd(false);
                    setQuickActionItem(item);
                  }}
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
          showYouTubeViewer={showYouTubeViewer}
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
          showYouTubeViewer={showYouTubeViewer}
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
        tags={tags}
        itemsCount={itemsCount}
        getFolderItemsCount={getFolderItemsCount}
        onAddFolder={handleAddFolder}
        onEditFolder={handleEditFolder}
        onDeleteFolder={handleDeleteFolder}
        onAddTag={handleAddTag}
        onDeleteTag={handleDeleteTag}
        onTagClick={handleTagClick}
      />

      {/* Floating Multi-Select Bulk Action Bar */}
      {selectedItemIds.length > 0 && activeSection !== 'inbox' && activeSection !== 'trash' && (
        <div className="fixed bottom-[76px] inset-x-3 z-40 lg:bottom-6 lg:left-1/2 lg:-translate-x-1/2 lg:w-auto lg:min-w-[420px] bg-theme-sidebar/95 backdrop-blur-md border border-theme-accent/40 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 pl-1.5">
            <span className="text-xs font-bold text-theme-text">
              {selectedItemIds.length} selected
            </span>
            <button
              type="button"
              onClick={() => {
                if (selectedItemIds.length === filteredItems.length) {
                  setSelectedItemIds([]);
                } else {
                  setSelectedItemIds(filteredItems.map((i) => i.id));
                }
              }}
              className="text-[11px] font-semibold text-theme-accent hover:underline cursor-pointer"
            >
              {selectedItemIds.length === filteredItems.length ? 'None' : 'All'}
            </button>
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                const chosen = items.filter((item) => selectedItemIds.includes(item.id));
                if (chosen.length === 0) return;
                const zipBlob = buildObsidianVaultZip(chosen, folders);
                const dateStr = new Date().toISOString().split('T')[0];
                downloadBlob(zipBlob, `omnibox-goko-selected-${dateStr}.zip`);
                addToast({
                  id: `goko-export-${Date.now()}`,
                  type: 'info',
                  title: `Exported ${chosen.length} note${chosen.length === 1 ? '' : 's'} for Goko`,
                  message: 'Unzip into your Obsidian vault root (Clippings/).',
                });
              }}
              className="flex items-center space-x-1 px-2.5 py-2 rounded-xl bg-theme-accent/15 border border-theme-accent/40 text-xs font-semibold text-theme-accent hover:bg-theme-accent/25 cursor-pointer"
              title="Export selected items into a Goko-ready Clippings/ .zip"
            >
              <Download size={13} />
              <span>Goko</span>
            </button>
            <button
              type="button"
              onClick={() => setShowBulkMoveSheet(true)}
              className="flex items-center space-x-1 px-2.5 py-2 rounded-xl bg-theme-card border border-theme-border text-xs font-semibold text-theme-text hover:bg-theme-hover cursor-pointer"
            >
              <FolderOpen size={13} className="text-theme-accent" />
              <span>Move</span>
            </button>
            <button
              type="button"
              onClick={() => setShowBulkTagSheet(true)}
              className="flex items-center space-x-1 px-2.5 py-2 rounded-xl bg-theme-card border border-theme-border text-xs font-semibold text-theme-text hover:bg-theme-hover cursor-pointer"
            >
              <TagIcon size={13} className="text-theme-accent" />
              <span>Tag</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                await handleMassDelete(selectedItemIds);
                setSelectedItemIds([]);
                setIsSelectionMode(false);
              }}
              className="flex items-center space-x-1 px-2.5 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs font-semibold text-rose-400 hover:bg-rose-500/25 cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Trash</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedItemIds([]);
                setIsSelectionMode(false);
              }}
              aria-label="Cancel selection"
              className="p-2 rounded-xl text-theme-muted hover:text-theme-text cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Touch Quick Actions Bottom Sheet */}
      <BottomSheet
        isOpen={Boolean(quickActionItem)}
        onClose={() => setQuickActionItem(null)}
        title={quickActionItem?.header || 'Item Actions'}
      >
        {quickActionItem && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <a
                href={quickActionItem.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-theme-card border border-theme-border text-xs font-semibold text-theme-text"
              >
                <ExternalLink size={14} className="text-theme-accent" />
                <span>Open on {quickActionItem.platform}</span>
              </a>
              {quickActionItem.url && (
                <a
                  href={getGokoClipUri(quickActionItem.url)}
                  onClick={() => setQuickActionItem(null)}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-theme-accent/15 border border-theme-accent/40 text-xs font-semibold text-theme-accent"
                >
                  <Send size={14} />
                  <span>Goko</span>
                </a>
              )}
              <button
                type="button"
                onClick={async () => {
                  const md = itemToObsidianMarkdown(quickActionItem, folders);
                  try {
                    await navigator.clipboard.writeText(md);
                    setCopiedQuickActionMd(true);
                    setTimeout(() => setCopiedQuickActionMd(false), 1800);
                  } catch {
                    // Ignore clipboard failures
                  }
                }}
                className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-theme-card border border-theme-border text-xs font-semibold text-theme-text cursor-pointer"
              >
                {copiedQuickActionMd ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-theme-accent" />}
                <span>{copiedQuickActionMd ? 'Copied!' : 'Copy .md'}</span>
              </button>
            </div>

            {/* Quick Folder Assignment */}
            <div className="space-y-2 border-t border-theme-border/60 pt-3">
              <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">
                Move to Folder
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await handleMassMove([quickActionItem.id], null);
                    setQuickActionItem(null);
                  }}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    quickActionItem.folderId === null
                      ? 'bg-theme-accent/15 border-theme-accent text-theme-accent'
                      : 'bg-theme-card border-theme-border text-theme-text'
                  }`}
                >
                  Inbox
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={async () => {
                      await handleMassMove([quickActionItem.id], folder.id);
                      setQuickActionItem(null);
                    }}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                      quickActionItem.folderId === folder.id
                        ? 'bg-theme-accent/15 border-theme-accent text-theme-accent'
                        : 'bg-theme-card border-theme-border text-theme-text'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: folder.color }} />
                    <span>{folder.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Tag Toggle */}
            {tags.length > 0 && (
              <div className="space-y-2 border-t border-theme-border/60 pt-3">
                <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">
                  Toggle Tags
                </span>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const hasTag = quickActionItem.tags.includes(tag.name);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={async () => {
                          const nextTags = hasTag
                            ? quickActionItem.tags.filter((t) => t !== tag.name)
                            : [...quickActionItem.tags, tag.name];
                          const updated = { ...quickActionItem, tags: nextTags };
                          await handleUpdateItem(updated);
                          setQuickActionItem(updated);
                        }}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                          hasTag
                            ? 'bg-theme-accent/15 border-theme-accent text-theme-text'
                            : 'bg-theme-card border-theme-border text-theme-muted'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                        <span>#{tag.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={async () => {
                await handleDeleteItem(quickActionItem.id);
                setQuickActionItem(null);
              }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Move to Trash</span>
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Bulk Move Bottom Sheet */}
      <BottomSheet
        isOpen={showBulkMoveSheet}
        onClose={() => setShowBulkMoveSheet(false)}
        title={`Move ${selectedItemIds.length} Item${selectedItemIds.length === 1 ? '' : 's'}`}
      >
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          <button
            type="button"
            onClick={async () => {
              await handleMassMove(selectedItemIds, null);
              setShowBulkMoveSheet(false);
              setSelectedItemIds([]);
              setIsSelectionMode(false);
            }}
            className="w-full flex items-center space-x-3 p-3.5 bg-theme-card border border-theme-border rounded-xl text-left font-semibold text-sm text-theme-text cursor-pointer"
          >
            <Inbox size={15} className="text-theme-muted" />
            <span>Inbox (No Folder)</span>
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={async () => {
                await handleMassMove(selectedItemIds, folder.id);
                setShowBulkMoveSheet(false);
                setSelectedItemIds([]);
                setIsSelectionMode(false);
              }}
              className="w-full flex items-center space-x-3.5 p-3.5 bg-theme-card border border-theme-border rounded-xl text-left font-semibold text-sm text-theme-text cursor-pointer"
            >
              <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
              <span className="truncate">{folder.name}</span>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Bulk Tag Bottom Sheet */}
      <BottomSheet
        isOpen={showBulkTagSheet}
        onClose={() => setShowBulkTagSheet(false)}
        title={`Tag ${selectedItemIds.length} Item${selectedItemIds.length === 1 ? '' : 's'}`}
      >
        {tags.length === 0 ? (
          <p className="text-xs text-theme-muted text-center py-6">No tags yet. Create tags from More → Tags.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={async () => {
                  await handleMassTag(selectedItemIds, [tag.name]);
                  setShowBulkTagSheet(false);
                  setSelectedItemIds([]);
                  setIsSelectionMode(false);
                }}
                className="flex items-center space-x-2 px-3.5 py-2.5 bg-theme-card border border-theme-border rounded-xl text-xs font-semibold text-theme-text cursor-pointer"
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                <span>#{tag.name}</span>
              </button>
            ))}
          </div>
        )}
      </BottomSheet>

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
