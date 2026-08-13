import React, { useState, useEffect, useRef } from 'react';
import { Search, Folder, Palette, Layout, Settings, Sparkles, Inbox, Trash2, Layers, Check, ArrowRight } from 'lucide-react';
import { Folder as FolderType, SavedItem, ThemeConfig } from '../types';
import { THEME_PRESETS } from '../theme';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  folders: FolderType[];
  items: SavedItem[];
  currentThemeId: string;
  onSelectTheme: (id: string) => void;
  onNavigate: (section: string) => void;
  onSelectItem: (item: SavedItem) => void;
  onAddCustomItem: () => void;
  onToggleLayout: () => void;
  onResetData: () => void;
  currentLayout: 'gallery' | 'list';
}

interface PaletteOption {
  id: string;
  label: string;
  subtitle?: string;
  category: 'Navigation' | 'Actions' | 'Themes' | 'Matching Items';
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  folders,
  items,
  currentThemeId,
  onSelectTheme,
  onNavigate,
  onSelectItem,
  onAddCustomItem,
  onToggleLayout,
  onResetData,
  currentLayout,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Let's delay focus slightly to ensure the component is mounted
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Build options list
  const getOptions = (): PaletteOption[] => {
    const options: PaletteOption[] = [];

    // --- NAVIGATION OPTIONS ---
    options.push({
      id: 'nav-inbox',
      label: 'Go to Inbox',
      subtitle: 'Process new unorganized saves',
      category: 'Navigation',
      icon: <Inbox size={15} />,
      action: () => { onNavigate('inbox'); onClose(); },
    });
    options.push({
      id: 'nav-all',
      label: 'Go to All Saved Items',
      subtitle: 'View the complete library',
      category: 'Navigation',
      icon: <Layers size={15} />,
      action: () => { onNavigate('all'); onClose(); },
    });
    options.push({
      id: 'nav-trash',
      label: 'Go to Trash Bin',
      subtitle: 'Recover or purge items',
      category: 'Navigation',
      icon: <Trash2 size={15} />,
      action: () => { onNavigate('trash'); onClose(); },
    });
    options.push({
      id: 'nav-settings',
      label: 'Go to Settings',
      subtitle: 'Import, export, and themes configuration',
      category: 'Navigation',
      icon: <Settings size={15} />,
      action: () => { onNavigate('settings'); onClose(); },
    });

    // Folders
    folders.forEach(f => {
      options.push({
        id: `nav-folder-${f.id}`,
        label: `Jump to Folder: ${f.name}`,
        subtitle: `Browse contents of this folder`,
        category: 'Navigation',
        icon: <Folder size={15} style={{ color: f.color }} />,
        action: () => { onNavigate(`folder-${f.id}`); onClose(); },
      });
    });

    // --- ACTIONS ---
    options.push({
      id: 'act-add',
      label: 'Add Custom Item',
      subtitle: 'Open form to paste URL or upload media cover',
      category: 'Actions',
      icon: <Sparkles size={15} className="text-amber-500" />,
      action: () => { onAddCustomItem(); onClose(); },
    });
    options.push({
      id: 'act-layout',
      label: `Toggle Layout View (Currently: ${currentLayout === 'gallery' ? 'Gallery Masonry' : 'Compact List'})`,
      subtitle: 'Switch display of library cards',
      category: 'Actions',
      icon: <Layout size={15} />,
      action: () => { onToggleLayout(); onClose(); },
    });
    options.push({
      id: 'act-reset',
      label: 'Reset Workspace to Defaults',
      subtitle: 'Warning: Resets local storage back to INITIAL seed items',
      category: 'Actions',
      icon: <Trash2 size={15} className="text-red-500" />,
      action: () => {
        if (confirm('Are you sure you want to reset all data back to seed defaults? This clears custom entries.')) {
          onResetData();
          onClose();
        }
      },
    });

    // --- THEME SWITCHERS ---
    THEME_PRESETS.forEach(theme => {
      options.push({
        id: `theme-${theme.id}`,
        label: `Switch Theme: ${theme.name}`,
        subtitle: `Change look and feel to ${theme.name}`,
        category: 'Themes',
        icon: <Palette size={15} style={{ color: theme.accentColor }} />,
        action: () => { onSelectTheme(theme.id); },
      });
    });

    // --- ITEM MATCHES ---
    // Search across non-deleted library items
    const nonDeleted = items.filter(item => item.deletedAt === null);
    nonDeleted.forEach(item => {
      options.push({
        id: `item-${item.id}`,
        label: item.header,
        subtitle: `${item.platform} • ${item.format} • ${item.note || 'No description note'}`,
        category: 'Matching Items',
        icon: <ArrowRight size={14} className="text-theme-accent" />,
        action: () => { onSelectItem(item); onClose(); },
      });
    });

    // Filter based on input query
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      return options.filter(
        opt =>
          opt.label.toLowerCase().includes(q) ||
          (opt.subtitle && opt.subtitle.toLowerCase().includes(q)) ||
          opt.category.toLowerCase().includes(q)
      );
    }

    // Default top recommendations when query is empty
    return options.slice(0, 12); // Limit to top 12 items for clean display when empty
  };

  const filteredOptions = getOptions();

  // Keyboard Navigation Event Listener
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[selectedIndex]) {
        filteredOptions[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Group filtered options by category for beautiful layout
  const categories = Array.from(new Set(filteredOptions.map(opt => opt.category)));

  // Calculate absolute index in flat filtered list for hover highlighting
  let flatIndexCounter = 0;

  return (
    <div
      className="fixed inset-0 z-55 flex items-start justify-center p-4 pt-[10vh] bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-theme-sidebar border border-theme-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-fade-in duration-200 text-theme-text"
        onKeyDown={handleKeyDown}
      >
        {/* Search header bar */}
        <div className="flex items-center space-x-3.5 px-5 py-4 border-b border-theme-border bg-theme-sidebar/95">
          <Search size={18} className="text-theme-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, folder name, theme name, or saved item title..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm text-theme-text placeholder-theme-muted/50 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center h-5 select-none px-1.5 font-mono text-[10px] font-bold text-theme-muted bg-theme-card border border-theme-border rounded-xl">
            ESC
          </kbd>
        </div>

        {/* Dynamic results scroll viewport */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4.5 scrollbar-thin scrollbar-thumb-white/10">
          {filteredOptions.length === 0 ? (
            <div className="text-center py-12 text-sm text-theme-muted italic">
              No matching commands, folders, or items found.
            </div>
          ) : (
            categories.map(category => {
              const categoryOptions = filteredOptions.filter(opt => opt.category === category);
              return (
                <div key={category} className="space-y-1">
                  {/* Category Title Header */}
                  <span className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-theme-muted block mb-1">
                    {category}
                  </span>

                  <div className="space-y-0.5">
                    {categoryOptions.map(opt => {
                      const currentFlatIndex = flatIndexCounter++;
                      const isSelected = selectedIndex === currentFlatIndex;

                      return (
                        <div
                          key={opt.id}
                          onClick={() => opt.action()}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                            isSelected
                              ? 'bg-theme-card text-theme-text border-l-4 border-theme-accent pl-2.5 shadow-sm'
                              : 'text-theme-muted hover:bg-theme-card/30 hover:text-theme-text'
                          }`}
                        >
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <div className={`p-1.5 rounded-xl border flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-theme-sidebar border-theme-border text-theme-accent' : 'bg-transparent border-theme-border/40 text-theme-muted'
                            }`}>
                              {opt.icon}
                            </div>
                            <div className="truncate text-left">
                              <div className={`text-xs font-semibold ${isSelected ? 'text-theme-text' : 'text-theme-text/90'}`}>
                                {opt.label}
                              </div>
                              {opt.subtitle && (
                                <div className="text-[10px] text-theme-muted truncate max-w-md sm:max-w-xl mt-0.5">
                                  {opt.subtitle}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Extra indicator */}
                          {isSelected && (
                            <kbd className="hidden sm:inline-block font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-xl border border-theme-border/60 bg-theme-sidebar text-theme-muted">
                              ENTER
                            </kbd>
                          )}
                          {opt.id.startsWith('theme-') && opt.id.replace('theme-', '') === currentThemeId && (
                            <div className="p-1 rounded-xl bg-theme-accent/20 border border-theme-accent/30 text-theme-accent flex items-center justify-center">
                              <Check size={11} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Command palette legend footer */}
        <div className="px-5 py-3 border-t border-theme-border bg-theme-sidebar/95 flex items-center justify-between text-[10px] text-theme-muted font-medium shrink-0">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 rounded-xl border border-theme-border bg-theme-card">↑↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 rounded-xl border border-theme-border bg-theme-card">Enter</kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 rounded-xl border border-theme-border bg-theme-card">Esc</kbd>
              <span>to dismiss</span>
            </span>
          </div>
          <div className="hidden sm:block">
            OmniBox-v2 Quick Spotlight Control Panel
          </div>
        </div>
      </div>
    </div>
  );
};
