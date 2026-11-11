import React, { useRef, useState, useEffect } from 'react';
import {
  Layout,
  SlidersHorizontal,
  Database,
  Download,
  Upload,
  RotateCcw,
  Check,
  AlertCircle,
  LayoutGrid,
  List,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Paintbrush,
  Plus,
  Trash2,
  Sparkles,
  Cpu,
  Key,
  Eye,
  EyeOff,
  Info,
  ShieldAlert,
  Gauge,
} from 'lucide-react';
import { SavedItem, Folder, Tag, AutoRule, ThemeConfig } from '../types';
import { THEME_PRESETS } from '../theme';

interface SettingsSectionProps {
  layout: 'gallery' | 'list';
  setLayout: (l: 'gallery' | 'list') => void;
  gallerySize: 'comfortable' | 'standard' | 'compact';
  setGallerySize: (s: 'comfortable' | 'standard' | 'compact') => void;
  listDensity: 'comfortable' | 'compact';
  setListDensity: (s: 'comfortable' | 'compact') => void;
  showNotesInFeed: boolean;
  setShowNotesInFeed: (s: boolean) => void;
  showTagsInFeed: boolean;
  setShowTagsInFeed: (s: boolean) => void;
  showPlatformBadges: boolean;
  setShowPlatformBadges: (s: boolean) => void;
  items: SavedItem[];
  folders: Folder[];
  tags: Tag[];
  rules: AutoRule[];
  onAddRule: (rule: Omit<AutoRule, 'id'>) => void;
  onDeleteRule: (id: string) => void;
  onResetData: () => void;
  onImportData: (data: { items: SavedItem[]; folders: Folder[]; tags: Tag[]; rules: AutoRule[] }) => void;
  activeThemeId: string;
  setActiveThemeId: (id: string) => void;
  customThemes: ThemeConfig[];
  setCustomThemes: React.Dispatch<React.SetStateAction<ThemeConfig[]>>;
  aiMode: 'built-in' | 'custom' | 'openai' | 'ollama' | 'lm-studio' | 'none';
  setAiMode: (m: 'built-in' | 'custom' | 'openai' | 'ollama' | 'lm-studio' | 'none') => void;
  customAiApiKey: string;
  setCustomAiApiKey: (k: string) => void;
  customAiApiUrl: string;
  setCustomAiApiUrl: (u: string) => void;
  customAiModel: string;
  setCustomAiModel: (m: string) => void;
  aiCustomInstructions: string;
  setAiCustomInstructions: (i: string) => void;
  aiTemperature: number;
  setAiTemperature: (t: number) => void;
  aiDefaultTags: string;
  setAiDefaultTags: (tags: string) => void;
  aiDefaultThumbnail: string;
  setAiDefaultThumbnail: (thumb: string) => void;
  autoCloseOnShare: boolean;
  setAutoCloseOnShare: (v: boolean) => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  layout,
  setLayout,
  gallerySize,
  setGallerySize,
  listDensity,
  setListDensity,
  showNotesInFeed,
  setShowNotesInFeed,
  showTagsInFeed,
  setShowTagsInFeed,
  showPlatformBadges,
  setShowPlatformBadges,
  items,
  folders,
  tags,
  rules,
  onAddRule,
  onDeleteRule,
  onResetData,
  onImportData,
  activeThemeId,
  setActiveThemeId,
  customThemes,
  setCustomThemes,
  aiMode,
  setAiMode,
  customAiApiKey,
  setCustomAiApiKey,
  customAiApiUrl,
  setCustomAiApiUrl,
  customAiModel,
  setCustomAiModel,
  aiCustomInstructions,
  setAiCustomInstructions,
  aiTemperature,
  setAiTemperature,
  aiDefaultTags,
  setAiDefaultTags,
  aiDefaultThumbnail,
  setAiDefaultThumbnail,
  autoCloseOnShare,
  setAutoCloseOnShare,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  const [activeTab, setActiveTab] = useState<'appearance' | 'ai' | 'system'>(() => {
    return (localStorage.getItem('omnibox_settings_active_tab') as any) || 'appearance';
  });

  useEffect(() => {
    localStorage.setItem('omnibox_settings_active_tab', activeTab);
  }, [activeTab]);

  // AI status tracking
  const [builtInAvailable, setBuiltInAvailable] = useState<boolean | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        setBuiltInAvailable(!!data.builtInGeminiAvailable);
      })
      .catch(() => {
        setBuiltInAvailable(false);
      });
  }, []);

  // Selected mode to filter/view presets
  const currentActiveTheme = [...THEME_PRESETS, ...customThemes].find(t => t.id === activeThemeId) || THEME_PRESETS[0];

  // Custom Theme builder form state
  const [newThemeName, setNewThemeName] = useState('');
  const [customBgApp, setCustomBgApp] = useState(currentActiveTheme.bgApp);
  const [customBgSidebar, setCustomBgSidebar] = useState(currentActiveTheme.bgSidebar);
  const [customBgCard, setCustomBgCard] = useState(currentActiveTheme.bgCard);
  const [customBorderColor, setCustomBorderColor] = useState(currentActiveTheme.borderColor);
  const [customTextPrimary, setCustomTextPrimary] = useState(currentActiveTheme.textPrimary);
  const [customTextMuted, setCustomTextMuted] = useState(currentActiveTheme.textMuted);
  const [customAccentColor, setCustomAccentColor] = useState(currentActiveTheme.accentColor);
  const [customAccentHover, setCustomAccentHover] = useState(currentActiveTheme.accentHover);
  const [customFontSans, setCustomFontSans] = useState(currentActiveTheme.fontSans || "\"Plus Jakarta Sans\", sans-serif");
  const [customFontDisplay, setCustomFontDisplay] = useState(currentActiveTheme.fontDisplay || "\"Outfit\", sans-serif");
  const [customFontMono, setCustomFontMono] = useState(currentActiveTheme.fontMono || "\"JetBrains Mono\", monospace");

  // Prefill color picker from currently active theme values
    const [newRuleField, setNewRuleField] = useState<'url' | 'header' | 'note'>('url');
  const [newRuleOperator, setNewRuleOperator] = useState<'contains' | 'equals'>('contains');
  const [newRuleValue, setNewRuleValue] = useState('');
  const [newRuleAction, setNewRuleAction] = useState<'add_tag' | 'move_to_folder'>('add_tag');
  const [newRuleActionValue, setNewRuleActionValue] = useState('');

  const handleCreateRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleValue.trim() || !newRuleActionValue.trim()) return;
    onAddRule({
      triggerField: newRuleField,
      triggerOperator: newRuleOperator,
      triggerValue: newRuleValue.trim().toLowerCase(),
      actionType: newRuleAction,
      actionValue: newRuleActionValue,
    });
    setNewRuleValue('');
    setNewRuleActionValue('');
  };

  const handlePrepopulateColors = () => {
    setCustomBgApp(currentActiveTheme.bgApp);
    setCustomBgSidebar(currentActiveTheme.bgSidebar);
    setCustomBgCard(currentActiveTheme.bgCard);
    setCustomBorderColor(currentActiveTheme.borderColor);
    setCustomTextPrimary(currentActiveTheme.textPrimary);
    setCustomTextMuted(currentActiveTheme.textMuted);
    setCustomAccentColor(currentActiveTheme.accentColor);
    setCustomAccentHover(currentActiveTheme.accentHover);
    setCustomFontSans(currentActiveTheme.fontSans || "\"Plus Jakarta Sans\", sans-serif");
    setCustomFontDisplay(currentActiveTheme.fontDisplay || "\"Outfit\", sans-serif");
    setCustomFontMono(currentActiveTheme.fontMono || "\"JetBrains Mono\", monospace");
  };

  const handleCreateCustomTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThemeName.trim()) return;

    const newTheme: ThemeConfig = {
      id: `custom-${Date.now()}`,
      name: `${newThemeName.trim()} (Custom)`,
      preset: 'custom',
      bgApp: customBgApp,
      bgSidebar: customBgSidebar,
      bgCard: customBgCard,
      borderColor: customBorderColor,
      textPrimary: customTextPrimary,
      textMuted: customTextMuted,
      accentColor: customAccentColor,
      accentHover: customAccentHover,
      fontSans: customFontSans,
      fontDisplay: customFontDisplay,
      fontMono: customFontMono,
    };

    setCustomThemes((prev) => [...prev, newTheme]);
    setActiveThemeId(newTheme.id);
    setNewThemeName('');
  };

  const handleDeleteCustomTheme = (themeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeThemeId === themeId) {
      // Revert to a default preset
      setActiveThemeId('light-normal');
    }
    setCustomThemes((prev) => prev.filter((t) => t.id !== themeId));
  };

  // Calculate actual LocalStorage usage or approximate bytes
  const calculateStorageStats = () => {
    return {
      usedKB: 'IndexedDB (Offline)',
      percent: '0',
      totalItems: items.length,
      inboxItems: items.filter((i) => i.folderId === null && i.deletedAt === null).length,
      deletedItems: items.filter((i) => i.deletedAt !== null).length,
      totalFolders: folders.length,
      totalTags: tags.length,
      totalRules: rules.length,
      totalCustomThemes: customThemes.length,
    };
  };

  const stats = calculateStorageStats();

  const handleExport = () => {
    const backupData = {
      items,
      folders,
      tags,
      rules,
      customThemes,
      version: '1.1',
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnibox-backup-with-themes-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (
          parsed &&
          Array.isArray(parsed.items) &&
          Array.isArray(parsed.folders) &&
          Array.isArray(parsed.tags) &&
          Array.isArray(parsed.rules)
        ) {
          onImportData({
            items: parsed.items,
            folders: parsed.folders,
            tags: parsed.tags,
            rules: parsed.rules,
          });
          if (Array.isArray(parsed.customThemes)) {
            setCustomThemes(parsed.customThemes);
          }
          setImportStatus('success');
          setTimeout(() => setImportStatus('idle'), 4000);
        } else {
          throw new Error('Invalid JSON structure. Missing items, folders, tags, or rules arrays.');
        }
      } catch (err: any) {
        setImportStatus('error');
        setErrorMessage(err.message || 'Failed to parse JSON file.');
        setTimeout(() => setImportStatus('idle'), 5000);
      }
    };
    reader.readAsText(file);
  };

  const currentModeThemes = [...THEME_PRESETS, ...customThemes];
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 pb-12 animate-fade-in text-theme-text" id="settings-section">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme-border pb-5">
        <div>
          <h1 className="text-2xl font-display italic text-theme-text tracking-tight flex items-center space-x-2.5">
            <SlidersHorizontal className="text-theme-muted" size={22} />
            <span>Settings & Appearance</span>
          </h1>
          <p className="text-xs text-theme-muted mt-1">
            Personalize your layout, select beautiful pre-designed themes, or configure local/cloud AI engines.
          </p>
        </div>

        {/* Tab Navigation Row */}
        <div className="flex bg-black/15 p-1 rounded-xl border border-theme-border/50 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center space-x-2 py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
              activeTab === 'appearance'
                ? 'bg-theme-card text-theme-text shadow-xs border border-theme-border/40 font-bold'
                : 'text-theme-muted hover:text-theme-text'
            }`}
          >
            <Paintbrush size={14} className={activeTab === 'appearance' ? 'text-theme-accent' : ''} />
            <span className="hidden sm:inline">Appearance</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex items-center space-x-2 py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-theme-card text-theme-text shadow-xs border border-theme-border/40 font-bold'
                : 'text-theme-muted hover:text-theme-text'
            }`}
          >
            <Sparkles size={14} className={activeTab === 'ai' ? 'text-theme-accent animate-pulse' : ''} />
            <span className="hidden sm:inline">AI Engine</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`flex items-center space-x-2 py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
              activeTab === 'system'
                ? 'bg-theme-card text-theme-text shadow-xs border border-theme-border/40 font-bold'
                : 'text-theme-muted hover:text-theme-text'
            }`}
          >
            <Database size={14} className={activeTab === 'system' ? 'text-theme-accent' : ''} />
            <span className="hidden sm:inline">System & Data</span>
          </button>
        </div>
      </div>

      {/* APPEARANCE TAB CONTENT */}
      {activeTab === 'appearance' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 gap-6">
            
            {/* THEME SELECTOR WIDGET */}
            <div className="border border-theme-border bg-theme-sidebar rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-semibold text-theme-text uppercase tracking-wider flex items-center space-x-2 border-b border-theme-border pb-3">
                  <Paintbrush size={14} className="text-theme-accent" />
                  <span>App Theme</span>
                </h2>


                {/* PRESETS GRID FOR SELECTED MODE */}
                <div className="space-y-2 mt-4">
                  <span className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">Crafted Theme Presets</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {currentModeThemes.map((theme) => {
                      const isActive = theme.id === activeThemeId;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setActiveThemeId(theme.id)}
                          className={`flex flex-col p-2 rounded-xl border text-left transition relative cursor-pointer group ${
                            isActive
                              ? 'bg-theme-card border-theme-accent ring-1 ring-theme-accent'
                              : 'bg-black/10 border-theme-border hover:border-theme-accent hover:bg-black/20'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className={`text-xs font-bold truncate ${isActive ? 'text-theme-text' : 'text-theme-muted group-hover:text-theme-text'}`}>
                              {theme.name}
                            </span>
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-xl bg-theme-accent"></span>
                            )}
                          </div>

                          {/* Swatch Previews */}
                          <div className="flex items-center space-x-1.5 mt-1.5">
                            {[theme.bgApp, theme.bgSidebar, theme.borderColor, theme.accentColor].map((col, idx) => (
                              <div
                                key={idx}
                                className="w-4 h-4 rounded-md border border-black/10 shadow-xs"
                                style={{ backgroundColor: col }}
                              />
                            ))}
                          </div>

                          {/* Custom Theme Delete Button */}
                          {theme.preset === 'custom' && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomTheme(theme.id, e)}
                              title="Delete Custom Theme"
                              className="absolute bottom-1.5 right-1.5 p-1 rounded-xl hover:bg-red-500/10 text-theme-muted hover:text-red-400 transition"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            </div>

          {/* FEED & LAYOUT PREFERENCES */}
          <div className="border border-theme-border bg-theme-sidebar rounded-xl p-5 space-y-4 shadow-sm">
            <div className="border-b border-theme-border pb-3">
              <h2 className="text-sm font-semibold text-theme-text uppercase tracking-wider flex items-center space-x-2">
                <Layout size={14} className="text-theme-muted" />
                <span>App-Wide Layout Preferences</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-1">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                  Gallery Column Density
                </label>
                <div className="flex bg-black/20 rounded-xl p-0.5 border border-theme-border">
                  {[
                    { id: 'compact', label: 'Compact' },
                    { id: 'standard', label: 'Standard' },
                    { id: 'comfortable', label: 'Spacious' }
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setGallerySize(sz.id as 'compact' | 'standard' | 'comfortable')}
                      className={`flex-1 py-1.5 text-xs rounded-xl font-semibold transition cursor-pointer ${
                        gallerySize === sz.id ? 'bg-theme-card text-theme-text shadow-xs border border-theme-border/50' : 'text-theme-muted hover:text-theme-text'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                  List Row Density
                </label>
                <div className="flex bg-black/20 rounded-xl p-0.5 border border-theme-border">
                  {[
                    { id: 'compact', label: 'Compact' },
                    { id: 'comfortable', label: 'Comfortable' }
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setListDensity(sz.id as 'compact' | 'comfortable')}
                      className={`flex-1 py-1.5 text-xs rounded-xl font-semibold transition cursor-pointer ${
                        listDensity === sz.id ? 'bg-theme-card text-theme-text shadow-xs border border-theme-border/50' : 'text-theme-muted hover:text-theme-text'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                  Feed Content Details
                </label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center cursor-pointer" onClick={() => setShowNotesInFeed(!showNotesInFeed)}>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex-shrink-0 ${showNotesInFeed ? 'bg-theme-accent' : 'bg-black/30 border border-theme-border'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${showNotesInFeed ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <span className="ml-3 text-xs font-semibold text-theme-text">Show Descriptions</span>
                  </div>
                  
                  <div className="flex items-center cursor-pointer" onClick={() => setShowTagsInFeed(!showTagsInFeed)}>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex-shrink-0 ${showTagsInFeed ? 'bg-theme-accent' : 'bg-black/30 border border-theme-border'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${showTagsInFeed ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <span className="ml-3 text-xs font-semibold text-theme-text">Show Tags</span>
                  </div>
                  
                  <div className="flex items-center cursor-pointer" onClick={() => setShowPlatformBadges(!showPlatformBadges)}>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex-shrink-0 ${showPlatformBadges ? 'bg-theme-accent' : 'bg-black/30 border border-theme-border'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${showPlatformBadges ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <span className="ml-3 text-xs font-semibold text-theme-text">Show Platform Badges</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC CUSTOM THEME BUILDER (Span full width) */}
          <div className="border border-theme-border bg-theme-sidebar rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <h2 className="text-sm font-semibold text-theme-text uppercase tracking-wider flex items-center space-x-2">
                <Paintbrush size={14} className="text-theme-muted" />
                <span>Create Your Own Theme</span>
              </h2>
              <button
                type="button"
                onClick={handlePrepopulateColors}
                className="text-[10px] uppercase tracking-wider text-theme-accent hover:underline font-bold transition cursor-pointer"
              >
                Copy Current Colors
              </button>
            </div>

            <form onSubmit={handleCreateCustomTheme} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Theme Name */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">Theme Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lavender Velvet"
                    value={newThemeName}
                    onChange={(e) => setNewThemeName(e.target.value)}
                    className="w-full bg-black/20 border border-theme-border rounded-xl px-3.5 py-2 text-xs text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-theme-accent transition"
                  />
                </div>
              
              </div>

              {/* Grid of Color Pickers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 pt-2">
                {[
                  { label: 'App Bg', val: customBgApp, setter: setCustomBgApp },
                  { label: 'Sidebar', val: customBgSidebar, setter: setCustomBgSidebar },
                  { label: 'Card Bg', val: customBgCard, setter: setCustomBgCard },
                  { label: 'Border', val: customBorderColor, setter: setCustomBorderColor },
                  { label: 'Primary Text', val: customTextPrimary, setter: setCustomTextPrimary },
                  { label: 'Muted Text', val: customTextMuted, setter: setCustomTextMuted },
                  { label: 'Accent Color', val: customAccentColor, setter: setCustomAccentColor },
                  { label: 'Accent Hover', val: customAccentHover, setter: setCustomAccentHover }
                ].map((color, idx) => (
                  <div key={idx} className="bg-black/10 border border-theme-border rounded-xl p-1.5 flex flex-col items-center justify-between">
                    <span className="text-[8px] font-bold text-theme-muted text-center leading-none truncate w-full mb-1">{color.label}</span>
                    <input
                      type="color"
                      value={color.val}
                      onChange={(e) => color.setter(e.target.value)}
                      className="w-8 h-7 rounded-xl border border-theme-border/20 cursor-pointer p-0 bg-transparent"
                    />
                    <span className="text-[8px] font-mono text-theme-muted uppercase mt-1">{color.val}</span>
                  </div>
                ))}

              </div>

              {/* Live Preview Window */}
              <div className="pt-4 pb-2">
                <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-3">Live Card Preview</label>
                <div className="w-full flex justify-center items-center p-6 rounded-xl border border-theme-border/50" style={{ backgroundColor: customBgApp }}>
                  <div 
                    className="w-full max-w-[280px] rounded-xl overflow-hidden shadow-sm transition-all duration-300"
                    style={{ 
                      backgroundColor: customBgCard, 
                      borderColor: customBorderColor,
                      borderWidth: 1,
                      borderStyle: 'solid'
                    }}
                  >
                    <div className="aspect-video relative bg-black/10 flex items-center justify-center overflow-hidden">
                      <Sparkles size={24} style={{ color: customAccentColor, opacity: 0.5 }} />
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider" style={{ backgroundColor: customAccentColor, color: '#fff' }}>
                        Platform
                      </div>
                    </div>
                    <div className="p-3.5 space-y-2">
                      <h3 className="text-sm font-semibold leading-tight line-clamp-2" style={{ color: customTextPrimary, fontFamily: customFontDisplay }}>
                        A beautiful mock title for your saved media
                      </h3>
                      <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: customTextMuted, fontFamily: customFontSans }}>
                        This is a simulated description text showing exactly how your typography, colors, and background contrast will look.
                      </p>
                      
                      <div className="flex items-center justify-between pt-2 mt-2" style={{ borderTop: `1px solid ${customBorderColor}` }}>
                        <div className="flex items-center space-x-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ backgroundColor: `${customAccentColor}22`, color: customAccentColor }}>#design</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ backgroundColor: `${customAccentColor}22`, color: customAccentColor }}>#inspo</span>
                        </div>
                        <button type="button" className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-opacity" style={{ backgroundColor: `${customAccentColor}15`, color: customAccentColor }}>
                          <LayoutGrid size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-theme-muted uppercase">Base Font (Sans)</span>
                  <select 
                    value={customFontSans} 
                    onChange={(e) => setCustomFontSans(e.target.value)}
                    className="w-full bg-theme-card border border-theme-border rounded-xl px-2 py-1.5 text-xs text-theme-text focus:outline-none focus:border-theme-accent"
                  >
                    <option value='"Plus Jakarta Sans", sans-serif'>Plus Jakarta Sans (Minimal)</option>
                    <option value='"DM Sans", sans-serif'>DM Sans (Vibrant)</option>
                    <option value='"Rajdhani", sans-serif'>Rajdhani (Cyber)</option>
                    <option value='"Mali", cursive'>Mali (Cute)</option>
                    <option value='"Lato", sans-serif'>Lato (Clean)</option>
                    <option value='"Inter", sans-serif'>Inter (Neutral)</option>
                    <option value='"Roboto", sans-serif'>Roboto (Standard)</option>
                    <option value='"Poppins", sans-serif'>Poppins (Geometric)</option>
                    <option value='"Montserrat", sans-serif'>Montserrat (Modern)</option>
                    <option value='"Nunito", sans-serif'>Nunito (Rounded)</option>
                    <option value='"Open Sans", sans-serif'>Open Sans (Classic)</option>
                    <option value='"Oswald", sans-serif'>Oswald (Condensed)</option>
                    <option value='"Raleway", sans-serif'>Raleway (Elegant)</option>
                    <option value='"Ubuntu", sans-serif'>Ubuntu (Friendly)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-theme-muted uppercase">Display Font</span>
                  <select 
                    value={customFontDisplay} 
                    onChange={(e) => setCustomFontDisplay(e.target.value)}
                    className="w-full bg-theme-card border border-theme-border rounded-xl px-2 py-1.5 text-xs text-theme-text focus:outline-none focus:border-theme-accent"
                  >
                    <option value='"Outfit", sans-serif'>Outfit (Minimal)</option>
                    <option value='"Space Grotesk", sans-serif'>Space Grotesk (Vibrant)</option>
                    <option value='"Orbitron", sans-serif'>Orbitron (Cyber)</option>
                    <option value='"Fredoka", sans-serif'>Fredoka (Cute)</option>
                    <option value='"Pacifico", cursive'>Pacifico (Stylized)</option>
                    <option value='"Playfair Display", serif'>Playfair Display (Serif)</option>
                    <option value='"Righteous", cursive'>Righteous (Display)</option>
                    <option value='"Bebas Neue", sans-serif'>Bebas Neue (Bold)</option>
                    <option value='"Bungee", cursive'>Bungee (Chunky)</option>
                    <option value='"Cinzel", serif'>Cinzel (Classic)</option>
                    <option value='"Abril Fatface", serif'>Abril Fatface (Elegant)</option>
                    <option value='"Permanent Marker", cursive'>Permanent Marker (Hand)</option>
                    <option value='"Comfortaa", cursive'>Comfortaa (Rounded)</option>
                    <option value='"Baloo 2", cursive'>Baloo 2 (Bubbly)</option>
                    <option value='"Lobster", cursive'>Lobster (Script)</option>
                    <option value='"Anton", sans-serif'>Anton (Bold Display)</option>
                    <option value='"Cormorant Garamond", serif'>Cormorant (Refined)</option>
                    <option value='"Alfa Slab One", cursive'>Alfa Slab One (Heavy)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-theme-muted uppercase">Mono Font</span>
                  <select 
                    value={customFontMono} 
                    onChange={(e) => setCustomFontMono(e.target.value)}
                    className="w-full bg-theme-card border border-theme-border rounded-xl px-2 py-1.5 text-xs text-theme-text focus:outline-none focus:border-theme-accent"
                  >
                    <option value='"JetBrains Mono", monospace'>JetBrains Mono</option>
                    <option value='"VT323", monospace'>VT323 (Retro)</option>
                    <option value='"Fira Code", monospace'>Fira Code</option>
                    <option value='"Source Code Pro", monospace'>Source Code Pro</option>
                    <option value='"Courier Prime", monospace'>Courier Prime</option>
                    <option value='"IBM Plex Mono", monospace'>IBM Plex Mono</option>
                    <option value='"Space Mono", monospace'>Space Mono</option>
                    <option value='"Inconsolata", monospace'>Inconsolata</option>
                    <option value='"Anonymous Pro", monospace'>Anonymous Pro</option>
                    <option value='"Ubuntu Mono", monospace'>Ubuntu Mono</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-theme-accent hover:bg-theme-hover text-white py-2.5 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <Plus size={14} />
                <span>Save & Apply Custom Theme</span>
              </button>
            </form>
          </div>

        </div>
      )}

      {/* AI ENGINE TAB CONTENT */}
      {activeTab === 'ai' && (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
          {/* AI Metadata Engine Card */}
          <div className="border border-theme-border bg-theme-sidebar rounded-xl p-5 space-y-5 shadow-sm">
            <h2 className="text-sm font-semibold text-theme-text uppercase tracking-wider flex items-center space-x-2 border-b border-theme-border pb-3">
              <Sparkles size={14} className="text-theme-accent" />
              <span>AI Metadata Engine</span>
            </h2>

            <div className="space-y-4">
              <p className="text-[11px] text-theme-muted leading-normal">
                Configure how OmniBox processes incoming URLs. Using an AI model allows advanced categorization and summarizing, while heuristic mode offers instant results with zero API latency.
              </p>

              {/* Mode Selection Grid */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">Inference Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'built-in' as const,
                      title: 'OmniBox Gemini',
                      badge: builtInAvailable === true ? 'Active' : builtInAvailable === false ? 'No Server Key' : 'Checking...',
                      badgeClass: builtInAvailable === true ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400',
                      desc: 'Use the pre-configured backend Gemini 3.5 Flash model. Safe, secure, and hassle-free.',
                      icon: Sparkles
                    },
                    {
                      id: 'custom' as const,
                      title: 'My Custom Gemini Key',
                      badge: 'Direct Key',
                      badgeClass: 'bg-blue-500/10 text-blue-400',
                      desc: 'Input your personal Google Gemini API Key. Kept secure inside your browser storage.',
                      icon: Cpu
                    },
                    {
                      id: 'openai' as const,
                      title: 'OpenAI API Gateway',
                      badge: 'GPT-4o / Compatible',
                      badgeClass: 'bg-purple-500/10 text-purple-400',
                      desc: 'Connect to OpenAI or any OpenAI-compatible custom gateway.',
                      icon: Sparkles
                    },
                    {
                      id: 'ollama' as const,
                      title: 'Ollama Local AI',
                      badge: '100% Offline',
                      badgeClass: 'bg-orange-500/10 text-orange-400',
                      desc: 'Use a local Ollama server (e.g., Llama 3) for 100% private client processing.',
                      icon: Cpu
                    },
                    {
                      id: 'lm-studio' as const,
                      title: 'LM Studio Local AI',
                      badge: '100% Offline',
                      badgeClass: 'bg-amber-500/10 text-amber-400',
                      desc: 'Connect to a local LM Studio server running any custom GGUF model.',
                      icon: Cpu
                    },
                    {
                      id: 'none' as const,
                      title: 'No AI (Fast Heuristic)',
                      badge: '0ms Latency',
                      badgeClass: 'bg-sky-500/10 text-sky-400',
                      desc: 'Parse URLs instantly using crawlers and regex scrapers. 100% free and lightning fast.',
                      icon: RotateCcw
                    }
                  ].map((mode) => {
                    const isActive = aiMode === mode.id;
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setAiMode(mode.id)}
                        className={`flex flex-col p-3 rounded-xl border text-left transition cursor-pointer group ${
                          isActive
                            ? 'bg-theme-card border-theme-accent text-theme-text ring-1 ring-theme-accent'
                            : 'bg-black/10 border-theme-border text-theme-muted hover:border-zinc-700 hover:text-theme-text'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <Icon size={12} className={isActive ? 'text-theme-accent' : 'text-theme-muted'} />
                          <span className={`text-[8px] font-mono px-1 rounded-xl ${mode.badgeClass}`}>{mode.badge}</span>
                        </div>
                        <span className="text-[11px] font-bold mt-1 block">{mode.title}</span>
                        <span className="text-[9px] text-theme-muted leading-normal mt-1 block flex-1">{mode.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Credential Fields */}
              {aiMode === 'custom' && (
                <div className="space-y-1.5 bg-black/10 border border-theme-border rounded-xl p-3.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider flex items-center space-x-1">
                      <Key size={10} />
                      <span>Gemini API Key</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-[10px] text-theme-accent hover:underline cursor-pointer flex items-center space-x-1"
                    >
                      {showApiKey ? <EyeOff size={10} /> : <Eye size={10} />}
                      <span>{showApiKey ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={customAiApiKey}
                    onChange={(e) => setCustomAiApiKey(e.target.value)}
                    placeholder="Enter AI Studio Gemini API Key..."
                    className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-xs font-mono text-theme-text focus:outline-none focus:border-theme-accent"
                  />
                  <div className="flex items-center space-x-1 text-[9px] text-theme-muted mt-1">
                    <span>Retrieve your API key from the</span>
                    <a
                      href="https://aistudio.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-theme-accent hover:underline"
                    >
                      Google AI Studio Console
                    </a>
                  </div>
                </div>
              )}

              {aiMode === 'openai' && (
                <div className="space-y-3 bg-black/10 border border-theme-border rounded-xl p-3.5">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider flex items-center space-x-1">
                        <Key size={10} />
                        <span>OpenAI API Key</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-[10px] text-theme-accent hover:underline cursor-pointer flex items-center space-x-1"
                      >
                        {showApiKey ? <EyeOff size={10} /> : <Eye size={10} />}
                        <span>{showApiKey ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={customAiApiKey}
                      onChange={(e) => setCustomAiApiKey(e.target.value)}
                      placeholder="Enter OpenAI API Key (sk-...)"
                      className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-xs font-mono text-theme-text focus:outline-none focus:border-theme-accent"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-theme-muted uppercase tracking-wider">Model Name</label>
                      <input
                        type="text"
                        value={customAiModel}
                        onChange={(e) => setCustomAiModel(e.target.value)}
                        placeholder="gpt-4o-mini"
                        className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-2.5 py-1.5 text-xs font-mono text-theme-text focus:outline-none focus:border-theme-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-theme-muted uppercase tracking-wider">API Endpoint URL</label>
                      <input
                        type="text"
                        value={customAiApiUrl}
                        onChange={(e) => setCustomAiApiUrl(e.target.value)}
                        placeholder="https://api.openai.com/v1"
                        className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-2.5 py-1.5 text-xs font-mono text-theme-text focus:outline-none focus:border-theme-accent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {aiMode === 'ollama' && (
                <div className="space-y-3 bg-black/10 border border-theme-border rounded-xl p-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">Ollama Server API URL</label>
                      <input
                        type="text"
                        value={customAiApiUrl}
                        onChange={(e) => setCustomAiApiUrl(e.target.value)}
                        placeholder="http://localhost:11434/v1"
                        className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-xs font-mono text-theme-text focus:outline-none focus:border-theme-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">Ollama Model Name</label>
                      <input
                        type="text"
                        value={customAiModel}
                        onChange={(e) => setCustomAiModel(e.target.value)}
                        placeholder="llama3"
                        className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-xs font-mono text-theme-text focus:outline-none focus:border-theme-accent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {aiMode === 'lm-studio' && (
                <div className="space-y-3 bg-black/10 border border-theme-border rounded-xl p-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">LM Studio API URL</label>
                      <input
                        type="text"
                        value={customAiApiUrl}
                        onChange={(e) => setCustomAiApiUrl(e.target.value)}
                        placeholder="http://localhost:1234/v1"
                        className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-xs font-mono text-theme-text focus:outline-none focus:border-theme-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">Model Name (Optional)</label>
                      <input
                        type="text"
                        value={customAiModel}
                        onChange={(e) => setCustomAiModel(e.target.value)}
                        placeholder="unspecified"
                        className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-xs font-mono text-theme-text focus:outline-none focus:border-theme-accent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced System Directives & Tuning */}
              {aiMode !== 'none' && (
                <div className="mt-5 pt-5 border-t border-theme-border/60 space-y-4">
                  <div className="text-[11px] font-bold text-theme-text uppercase tracking-wider flex items-center space-x-1.5">
                    <SlidersHorizontal size={12} className="text-theme-accent" />
                    <span>Engine Tuning & Custom Directives</span>
                  </div>

                  {/* Custom System Directives */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider flex items-center justify-between">
                      <span>Custom System Directives</span>
                      <span className="text-[8px] font-normal text-theme-accent normal-case">Steers AI parsing behavior</span>
                    </label>
                    <textarea
                      value={aiCustomInstructions}
                      onChange={(e) => setAiCustomInstructions(e.target.value)}
                      placeholder="e.g., 'Always translate note summaries to French', 'Prefix all titles with [READ]'..."
                      rows={2}
                      className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-xs text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-theme-accent resize-none font-sans leading-normal"
                    />
                  </div>

                  {/* Temperature & Default Tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Temperature Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                        <span>Model Temperature</span>
                        <span className="font-mono text-theme-accent text-[11px]">{aiTemperature.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center space-x-3 bg-black/15 px-3 py-2 border border-theme-border/50 rounded-xl">
                        <span className="text-[9px] text-theme-muted">Focused</span>
                        <input
                          type="range"
                          min="0.0"
                          max="1.0"
                          step="0.1"
                          value={aiTemperature}
                          onChange={(e) => setAiTemperature(parseFloat(e.target.value))}
                          className="flex-1 h-1 bg-theme-border rounded-xl appearance-none cursor-pointer accent-theme-accent"
                        />
                        <span className="text-[9px] text-theme-muted">Creative</span>
                      </div>
                    </div>

                    {/* Default Tags */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                        <span>Always-On Default Tags</span>
                      </label>
                      <input
                        type="text"
                        value={aiDefaultTags}
                        onChange={(e) => setAiDefaultTags(e.target.value)}
                        placeholder="e.g., 'inbox, unchecked, auto-scraped'"
                        className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-xs font-mono text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-theme-accent"
                      />
                    </div>
                  </div>

                  {/* Fallback Thumbnail */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">Custom Fallback Thumbnail URL</label>
                    <input
                      type="text"
                      value={aiDefaultThumbnail}
                      onChange={(e) => setAiDefaultThumbnail(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"
                      className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-xs font-mono text-theme-text focus:outline-none focus:border-theme-accent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>



                              {/* AUTO-ORGANIZE RULES */}
          <div className="border border-theme-border bg-theme-sidebar rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <h2 className="text-sm font-semibold text-theme-text uppercase tracking-wider flex items-center space-x-2">
                <Sparkles size={14} className="text-theme-accent" />
                <span>Auto-Organize Rules</span>
              </h2>
            </div>
            
            <form onSubmit={handleCreateRuleSubmit} className="space-y-4 text-sm text-theme-text">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">If item's</label>
                  <select
                    value={newRuleField}
                    onChange={(e) => setNewRuleField(e.target.value as any)}
                    className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-theme-text focus:outline-none focus:border-theme-accent cursor-pointer text-xs"
                  >
                    <option value="url">Source URL</option>
                    <option value="header">Title / Header</option>
                    <option value="note">Personal Note</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">Condition</label>
                  <select
                    value={newRuleOperator}
                    onChange={(e) => setNewRuleOperator(e.target.value as any)}
                    className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-theme-text focus:outline-none focus:border-theme-accent cursor-pointer text-xs"
                  >
                    <option value="contains">Contains text</option>
                    <option value="equals">Equals exactly</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">Value to match</label>
                  <input
                    type="text"
                    placeholder="e.g. youtube, design, recipes"
                    value={newRuleValue}
                    onChange={(e) => setNewRuleValue(e.target.value)}
                    className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-theme-accent text-xs"
                    required
                  />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">Then auto-organize</label>
                  <select
                    value={newRuleAction}
                    onChange={(e) => setNewRuleAction(e.target.value as any)}
                    className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-theme-text focus:outline-none focus:border-theme-accent cursor-pointer text-xs"
                  >
                    <option value="add_tag">Assign Tag</option>
                    <option value="move_to_folder">Move to Folder</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">Target</label>
                  {newRuleAction === 'add_tag' ? (
                    <input
                      type="text"
                      placeholder="Enter tag name"
                      value={newRuleActionValue}
                      onChange={(e) => setNewRuleActionValue(e.target.value)}
                      className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-theme-accent text-xs"
                      required
                    />
                  ) : (
                    <select
                      value={newRuleActionValue}
                      onChange={(e) => setNewRuleActionValue(e.target.value)}
                      className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-theme-text focus:outline-none focus:border-theme-accent cursor-pointer text-xs"
                      required
                    >
                      <option value="">-- Choose Folder --</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-1.5 bg-theme-accent hover:bg-theme-hover text-white font-bold py-2 rounded-xl transition text-xs shadow mt-2 cursor-pointer"
              >
                <Plus size={14} />
                <span>Save Magic Rule</span>
              </button>
            </form>

            {/* List existing rules */}
            {rules.length > 0 && (
              <div className="space-y-2.5 pt-4 border-t border-theme-border">
                <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Active Rules ({rules.length})</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {rules.map((rule) => {
                     const folderName = rule.actionType === 'move_to_folder'
                       ? folders.find((f) => f.id === rule.actionValue)?.name || 'Unknown Folder'
                       : '';
                    return (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-theme-card/50 border border-theme-border text-theme-text/80 text-xs shadow-sm hover:shadow transition group"
                      >
                        <span className="truncate pr-2">
                          If <strong className="text-theme-text">{rule.triggerField}</strong> {rule.triggerOperator}{' '}
                          <span className="text-theme-accent font-mono bg-theme-accent/10 px-1 rounded">"{rule.triggerValue}"</span><br/>
                          <span className="text-theme-muted text-[10px] flex items-center space-x-1 mt-1">
                            <span>↳ {rule.actionType === 'add_tag' ? 'Assign Tag:' : 'Move to Folder:'}</span>
                            <strong className="text-theme-text">"{rule.actionType === 'add_tag' ? rule.actionValue : folderName}"</strong>
                          </span>
                        </span>
                        <button
                          onClick={() => onDeleteRule(rule.id)}
                          title="Delete Rule"
                          className="text-theme-muted hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-xl transition opacity-50 group-hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* SYSTEM & DATA TAB CONTENT */}
      {activeTab === 'system' && (
        <div className="space-y-6 animate-fade-in">
          {/* Zero-Interruption Quick Capture Card */}
          <div className="border border-theme-border bg-theme-sidebar rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-theme-border pb-3">
              <h2 className="text-sm font-semibold text-theme-text uppercase tracking-wider flex items-center space-x-2">
                <Sparkles size={14} className="text-theme-accent" />
                <span>Zero-Interruption Quick Capture</span>
              </h2>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                YouTube &amp; Instagram Reels Flow
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="space-y-2">
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => setAutoCloseOnShare(!autoCloseOnShare)}
                >
                  <div
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex-shrink-0 ${
                      autoCloseOnShare ? 'bg-theme-accent' : 'bg-black/30 border border-theme-border'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
                        autoCloseOnShare ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                  <span className="ml-3 text-xs font-semibold text-theme-text">
                    Auto-return to video after Share / Bookmarklet save
                  </span>
                </div>
                <p className="text-[11px] text-theme-muted leading-relaxed">
                  When sharing from YouTube/Instagram or using the bookmarklet, OmniBox saves in &lt;10ms and automatically closes the capture card so your video keeps playing.
                </p>
                <p className="text-[10px] text-theme-muted">
                  Desktop tip: press <kbd className="px-1.5 py-0.5 rounded bg-theme-card border border-theme-border font-mono">Cmd/Ctrl+V</kbd> anywhere outside an input to save a copied URL with zero dialogs.
                </p>
              </div>

              {/* 1-Click Bookmarklet Generator */}
              <div className="bg-black/10 border border-theme-border rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">
                    1-Click Browser Bookmarklet
                  </span>
                  <span className="text-[9px] text-theme-accent font-semibold">Drag to Bookmarks Bar</span>
                </div>
                {(() => {
                  const baseUrl =
                    typeof window !== 'undefined'
                      ? `${window.location.origin}${window.location.pathname}`
                      : 'https://localhost:3000/';
                  const bookmarkletCode = `javascript:(function(){var u=encodeURIComponent(location.href),t=encodeURIComponent(document.title);window.open('${baseUrl}?share_url='+u+'&share_title='+t+'&auto_close=1','omnibox_quick_save','width=440,height=380,noopener');})();`;
                  return (
                    <div className="flex items-center gap-2">
                      <a
                        href={bookmarkletCode}
                        onClick={(e) => e.preventDefault()}
                        draggable
                        className="flex-1 text-center px-3 py-2 rounded-xl bg-theme-accent hover:bg-theme-hover text-white text-xs font-bold shadow-sm cursor-grab active:cursor-grabbing truncate"
                        title="Drag this button to your browser bookmarks bar"
                      >
                        ⚡ Save to OmniBox
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(bookmarkletCode);
                          setCopiedBookmarklet(true);
                          setTimeout(() => setCopiedBookmarklet(false), 2000);
                        }}
                        className="px-3 py-2 rounded-xl bg-theme-card border border-theme-border hover:border-theme-accent text-xs font-semibold text-theme-text transition cursor-pointer shrink-0"
                      >
                        {copiedBookmarklet ? 'Copied!' : 'Copy Code'}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Library Statistics */}
          <div className="border border-theme-border bg-theme-sidebar rounded-xl p-5 space-y-5 shadow-sm">
            <h2 className="text-sm font-semibold text-theme-text uppercase tracking-wider flex items-center space-x-2 border-b border-theme-border pb-3">
              <Gauge size={14} className="text-theme-muted" />
              <span>Library Statistics</span>
            </h2>

            {/* Memory Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-theme-muted">
                <span>IndexedDB Storage</span>
                <span className="font-mono">Offline / Local First</span>
              </div>
              <div className="w-full bg-black/30 border border-theme-border h-2 rounded-xl overflow-hidden">
                <div
                  className="bg-theme-accent h-full transition-all duration-500"
                  style={{ width: '10%' }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-theme-muted">
                <span>Virtually Unlimited</span>
                <span>Available: ~GBs</span>
              </div>
            </div>

            {/* Micro DB Table */}
            <div className="pt-2 grid grid-cols-2 gap-3 text-xs">
              {[
                { name: 'Saved Items', value: stats.totalItems },
                { name: 'New Links', value: stats.inboxItems },
                { name: 'Custom Themes', value: stats.totalCustomThemes },
                { name: 'Magic Rules', value: stats.totalRules }
              ].map((stat, i) => (
                <div key={i} className="bg-black/10 border border-theme-border rounded-xl p-3 space-y-1">
                  <span className="text-theme-muted block text-[10px] uppercase tracking-wider font-semibold">{stat.name}</span>
                  <span className="text-lg font-semibold text-theme-text font-mono">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Backup, Import, and Reset Card */}
          <div className="border border-theme-border bg-theme-sidebar rounded-xl p-5 space-y-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-theme-text uppercase tracking-wider flex items-center space-x-2 border-b border-theme-border pb-3">
                <Database size={14} className="text-theme-muted" />
                <span>Backup & Share Library</span>
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {/* Export Button */}
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex items-center justify-center space-x-2 bg-theme-card border border-theme-border hover:bg-black/20 text-theme-text py-2.5 px-4 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  <Download size={14} className="text-theme-accent" />
                  <span>Download</span>
                </button>

                {/* Import Button */}
                <button
                  type="button"
                  onClick={handleImportClick}
                  className="flex items-center justify-center space-x-2 bg-theme-card border border-theme-border hover:bg-black/20 text-theme-text py-2.5 px-4 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  <Upload size={14} className="text-theme-accent" />
                  <span>Upload</span>
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />

              {/* Notification triggers */}
              {importStatus === 'success' && (
                <div className="flex items-center space-x-2 p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-xl text-xs">
                  <Check size={14} />
                  <span>Your saved library data and themes have been successfully imported!</span>
                </div>
              )}

              {importStatus === 'error' && (
                <div className="flex items-start space-x-2 p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold block">Failed to read backup file:</span>
                    <span className="text-red-300">{errorMessage}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-theme-border space-y-3">
              <div>
                <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center space-x-1">
                  <ShieldAlert size={12} />
                  <span>Reset Library Data</span>
                </h3>

              </div>


              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      'Are you absolutely sure you want to reset OmniBox? All custom links, folders, and custom themes will be replaced with initial seed presets.'
                    )
                  ) {
                    onResetData();
                    setActiveThemeId('light-normal');
                  }
                }}
                className="flex items-center justify-center space-x-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 py-2 px-4 rounded-xl text-xs font-semibold transition cursor-pointer w-full"
              >
                <RotateCcw size={14} />
                <span>Reset All Data</span>
              </button>
            </div>
          </div>

        </div>
        </div>
      )}
    </div>
  );
};
