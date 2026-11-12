import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Plus,
  Check,
  FolderOpen,
  Tag as TagIcon,
  Sparkles,
  Link as LinkIcon,
  Globe,
  ClipboardPaste,
  FileText,
} from 'lucide-react';
import { PlatformType, FormatType, Folder, Tag } from '../types';
import { quickParseUrl, extractFirstUrl, formatSeriesWithChapter } from '../utils/quickParse';
import { useBackHandler } from '../utils/backNavigation';

interface AddMediaDialogProps {
  folders: Folder[];
  tags: Tag[];
  onClose: () => void;
  onSave: (data: {
    header: string;
    note: string;
    url: string;
    platform: PlatformType;
    format: FormatType;
    previewUrl: string;
    customPreviewUrl?: string;
    customPreviewType?: 'image' | 'video' | null;
    tags: string[];
    folderId: string | null;
  }) => void;
  onScrape?: (url: string) => Promise<void>;
  prefillData?: { url?: string; header?: string; note?: string } | null;
}

const PRESET_UNSPLASH_PLACEHOLDERS = [
  { name: 'Abstract Gradient', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80' },
  { name: 'Neon Hologram', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80' },
  { name: 'Cyberpunk Grid', url: 'https://images.unsplash.com/photo-1515260268569-9271009adfdb?w=800&q=80' },
  { name: 'Minimal Workspace', url: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&q=80' },
];

export const AddMediaDialog: React.FC<AddMediaDialogProps> = ({
  folders,
  tags,
  onClose,
  onSave,
  onScrape,
  prefillData,
}) => {
  useBackHandler(true, onClose);

  // Input fields state
  const [entryMode, setEntryMode] = useState<'link' | 'note'>(
    prefillData?.header && !prefillData?.url ? 'note' : 'link'
  );
  const [isExpanded, setIsExpanded] = useState(prefillData?.header && prefillData?.url ? true : false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  const [header, setHeader] = useState(prefillData?.header || '');
  const [chapterInput, setChapterInput] = useState('');
  const [note, setNote] = useState(prefillData?.note || '');
  const [url, setUrl] = useState(prefillData?.url || '');
  const [platform, setPlatform] = useState<PlatformType>('Other');
  const [format, setFormat] = useState<FormatType>('Website');
  const [previewUrl, setPreviewUrl] = useState(PRESET_UNSPLASH_PLACEHOLDERS[0].url);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // File Upload states (for base64 storage)
  const [customPreviewUrl, setCustomPreviewUrl] = useState<string | undefined>(undefined);
  const [customPreviewType, setCustomPreviewType] = useState<'image' | 'video' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tag creation/input state
  const [tagInput, setTagInput] = useState('');

  const handleFileUpload = (file: File) => {
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('Only image or video files are supported for preview customization.');
      return;
    }

    // Limit base64 storage size to ~8MB to fit smoothly in IndexedDB
    if (file.size > 50 * 1024 * 1024) {
      alert('File is too large. Please select a compressed media file below 50MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomPreviewUrl(reader.result);
        setCustomPreviewType(isImage ? 'image' : 'video');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName],
    );
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = tagInput.trim();
    if (cleanTag && !selectedTags.includes(cleanTag)) {
      setSelectedTags((prev) => [...prev, cleanTag]);
    }
    setTagInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!header.trim()) return;

    const trimmedUrl = url.trim();
    const resolvedPreviewUrl =
      format === 'Note' && !customPreviewUrl ? '' : previewUrl;

    onSave({
      header: header.trim(),
      note: note.trim(),
      url: trimmedUrl,
      platform,
      format,
      previewUrl: resolvedPreviewUrl,
      customPreviewUrl,
      customPreviewType,
      tags: selectedTags,
      folderId,
    });
  };

  const handleQuickNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!header.trim()) return;

    const cleanOptionalUrl = url.trim();
    const parsedUrl = cleanOptionalUrl ? quickParseUrl(cleanOptionalUrl) : null;
    const formattedHeader = formatSeriesWithChapter(header, chapterInput);

    onSave({
      header: formattedHeader,
      note: note.trim(),
      url: cleanOptionalUrl,
      platform: parsedUrl ? parsedUrl.platform : 'Other',
      format: 'Note',
      previewUrl: '',
      customPreviewUrl,
      customPreviewType,
      tags: selectedTags,
      folderId,
    });
    onClose();
  };

  const saveQuickUrl = (rawInput: string) => {
    const cleanInput = rawInput.trim();
    const targetUrl = extractFirstUrl(cleanInput) || cleanInput;
    if (!targetUrl) return;

    if (onScrape) {
      onClose();
      void onScrape(targetUrl);
      return;
    }

    const parsed = quickParseUrl(targetUrl, header, note);
    onSave({
      header: header.trim() || parsed.header,
      note: note.trim() || parsed.note,
      url: targetUrl,
      platform: platform !== 'Other' ? platform : parsed.platform,
      format: format !== 'Website' ? format : parsed.format,
      previewUrl: previewUrl || parsed.previewUrl,
      customPreviewUrl,
      customPreviewType,
      tags: selectedTags.length > 0 ? selectedTags : parsed.tags,
      folderId,
    });
    onClose();
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    saveQuickUrl(url);
  };

  const handlePasteAndSave = async () => {
    setScrapeError(null);
    try {
      if (!navigator.clipboard?.readText) {
        setScrapeError('Clipboard access unavailable. Paste into the box above instead.');
        return;
      }
      const clipText = (await navigator.clipboard.readText()).trim();
      const extracted = extractFirstUrl(clipText);
      if (!extracted) {
        setScrapeError('No valid http(s) URL found in your clipboard.');
        return;
      }
      saveQuickUrl(extracted);
    } catch {
      setScrapeError('Clipboard permission denied. Paste manually into the box above.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      {/* Click backdrop to close */}
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />

      <motion.div
        initial={{ y: '100%', opacity: 0.9 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.9 }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        drag="y"
        dragDirectionLock
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 0.4 }}
        onDragEnd={(e, info) => {
          // On mobile screens, swipe down past 150px or swipe fast down to dismiss
          if (window.innerWidth < 768 && (info.offset.y > 150 || info.velocity.y > 400)) {
            onClose();
          }
        }}
        className="relative w-full max-w-2xl bg-theme-sidebar border-t md:border border-theme-border rounded-t-3xl md:rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90dvh] h-auto pb-safe z-10"
      >
        {/* Android Pull-to-Dismiss Visual Handle Tab */}
        <div className="w-12 h-1.5 bg-theme-border rounded-xl mx-auto mt-3.5 mb-1 shrink-0 md:hidden opacity-80" />

        {/* Header toolbar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-theme-border shrink-0 bg-theme-sidebar gap-3">
          <div className="flex items-center space-x-2 min-w-0">
            {entryMode === 'note' && !isExpanded ? (
              <FileText className="text-theme-accent shrink-0" size={18} />
            ) : (
              <Sparkles className="text-theme-muted shrink-0" size={18} />
            )}
            <h2 className="text-sm font-semibold text-theme-text uppercase tracking-wider truncate">
              {isExpanded
                ? 'Add Custom Item'
                : entryMode === 'note'
                  ? 'Text / Chapter Note'
                  : 'Paste Media Link'}
            </h2>
          </div>

          {!isExpanded && (
            <div className="flex items-center bg-theme-card border border-theme-border rounded-xl p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setEntryMode('link')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  entryMode === 'link'
                    ? 'bg-theme-accent text-white shadow-xs'
                    : 'text-theme-muted hover:text-theme-text'
                }`}
              >
                Link
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('note')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  entryMode === 'note'
                    ? 'bg-theme-accent text-white shadow-xs'
                    : 'text-theme-muted hover:text-theme-text'
                }`}
              >
                Text Note
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-card transition shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Content */}
        {!isExpanded && entryMode === 'note' ? (
          <form onSubmit={handleQuickNoteSubmit} className="flex-1 p-5 sm:p-6 space-y-4 overflow-y-auto">
            <p className="text-xs text-theme-muted">
              Save a text-only entry (like <span className="text-theme-text font-medium">All Hail the Sect Leader Chapter 349</span>) without any video embed or link required.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8">
                <label className="block text-xs font-semibold text-theme-muted mb-1">
                  Name / Series *
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. All Hail the Sect Leader"
                  value={header}
                  onChange={(e) => setHeader(e.target.value)}
                  className="w-full bg-theme-card border border-theme-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-theme-text focus:outline-none focus:border-theme-accent transition placeholder-theme-muted/50"
                  required
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-theme-muted mb-1">
                  Chap / Ep
                </label>
                <input
                  type="text"
                  placeholder="e.g. 349 or Ep 12"
                  value={chapterInput}
                  onChange={(e) => setChapterInput(e.target.value)}
                  className="w-full bg-theme-card border border-theme-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-theme-text focus:outline-none focus:border-theme-accent transition placeholder-theme-muted/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-theme-muted mb-1">
                Description / Recap Notes
              </label>
              <textarea
                rows={3}
                placeholder="What is it about, where you stopped, or channel notes..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-theme-card border border-theme-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-theme-text focus:outline-none focus:border-theme-accent transition resize-none placeholder-theme-muted/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">
                  Folder (Optional)
                </label>
                <select
                  value={folderId || ''}
                  onChange={(e) => setFolderId(e.target.value || null)}
                  className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-sm text-theme-text focus:outline-none focus:border-theme-accent"
                >
                  <option value="">The Inbox (Uncategorized)</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">
                  Reference URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="Optional YouTube/series link..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-sm text-theme-text focus:outline-none focus:border-theme-accent transition placeholder-theme-muted/50"
                />
              </div>
            </div>

            {/* Quick Tag selector */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => {
                  const isSelected = selectedTags.includes(t.name);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.name)}
                      style={{
                        borderColor: isSelected ? t.color : 'var(--color-theme-border)',
                        backgroundColor: isSelected ? `${t.color}15` : 'var(--color-theme-card)',
                        color: isSelected ? t.color : 'var(--color-theme-text)',
                      }}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-xl border transition cursor-pointer"
                    >
                      {t.name}
                    </button>
                  );
                })}
                {selectedTags
                  .filter((name) => !tags.some((t) => t.name === name))
                  .map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleTag(name)}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-xl border border-theme-accent bg-theme-accent/15 text-theme-accent transition cursor-pointer"
                    >
                      {name} ×
                    </button>
                  ))}
              </div>
              <div className="flex space-x-1.5">
                <input
                  type="text"
                  placeholder="Add tag (e.g. manhwa, recap)..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag(e);
                    }
                  }}
                  className="flex-1 bg-theme-card border border-theme-border rounded-xl px-3 py-1.5 text-xs text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-theme-accent"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="bg-theme-card hover:bg-theme-hover text-theme-text border border-theme-border px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Add Tag
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="text-xs text-theme-muted hover:text-theme-text transition underline decoration-theme-muted/50 underline-offset-4 cursor-pointer"
              >
                Full custom form
              </button>
              <button
                type="submit"
                className="bg-theme-accent hover:bg-theme-hover text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition flex items-center space-x-1.5 shadow-md cursor-pointer"
              >
                <Check size={16} />
                <span>Save Note</span>
              </button>
            </div>
          </form>
        ) : !isExpanded ? (
          <form onSubmit={handleQuickSubmit} className="flex-1 p-5 sm:p-6 space-y-4 overflow-y-auto">
            <p className="text-xs text-theme-muted">
              Saves instantly (&lt;5ms) and enriches title &amp; thumbnail silently in the background. Tip: press <kbd className="px-1.5 py-0.5 rounded bg-theme-card border border-theme-border font-mono text-[10px]">Cmd/Ctrl+V</kbd> anywhere in the app to instant-save!
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <div className="relative flex-1 w-full">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-theme-muted">
                  <LinkIcon size={14} />
                </div>
                <input
                  type="url"
                  autoFocus
                  placeholder="Paste YouTube, Instagram, Pinterest, Threads or Web URL here..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isScraping}
                  className="w-full bg-theme-card border border-theme-border rounded-xl pl-9 pr-3.5 py-3 text-base sm:text-sm text-theme-text focus:outline-none focus:border-theme-accent transition placeholder-theme-muted/50 disabled:opacity-50"
                  required
                />
              </div>
              <button
                type="button"
                onClick={handlePasteAndSave}
                disabled={isScraping}
                title="Read URL from clipboard and save in 1 tap"
                className="bg-theme-card hover:bg-theme-sidebar border border-theme-border text-theme-text font-semibold px-4 py-3 rounded-xl text-sm transition flex items-center justify-center space-x-1.5 w-full sm:w-auto shrink-0 cursor-pointer"
              >
                <ClipboardPaste size={16} className="text-theme-accent" />
                <span>Paste &amp; Save</span>
              </button>
              <button
                type="submit"
                disabled={isScraping}
                className="bg-theme-accent hover:bg-theme-hover disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl text-sm transition flex items-center justify-center space-x-1.5 w-full sm:w-auto shrink-0 shadow-md cursor-pointer"
              >
                {isScraping ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                <span>{isScraping ? 'Parsing...' : 'Save Link'}</span>
              </button>
            </div>
            
            {scrapeError && (
              <div className="flex items-center space-x-2 text-xs bg-red-500/15 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl mt-2">
                <span>{scrapeError}</span>
              </div>
            )}

            <div className="pt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="text-xs text-theme-muted hover:text-theme-text transition underline decoration-theme-muted/50 underline-offset-4"
              >
                More (Add extra info manually)
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
            {/* Section: Title & Link */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">
                  Header / Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cinematic Retro Aesthetic Art"
                  value={header}
                  onChange={(e) => setHeader(e.target.value)}
                  className="w-full bg-theme-card border border-theme-border rounded-xl px-3.5 py-2 text-sm text-theme-text focus:outline-none focus:border-theme-accent transition placeholder-theme-muted/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">
                  Source Link URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-theme-muted">
                    <LinkIcon size={14} />
                  </div>
                  <input
                    type="url"
                    placeholder="e.g. https://pinterest.com/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-theme-card border border-theme-border rounded-xl pl-9 pr-3.5 py-2 text-sm text-theme-text focus:outline-none focus:border-theme-accent transition placeholder-theme-muted/50"
                  />
                </div>
              </div>
            </div>

          {/* Section: Platform & Format selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-theme-muted mb-1">Platform Category</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformType)}
                className="w-full bg-theme-card border border-theme-border rounded-xl px-3.5 py-2 text-sm text-theme-text focus:outline-none focus:border-theme-accent"
              >
                <option value="Other">Other Platform</option>
                <option value="YouTube">YouTube</option>
                <option value="Music">Music</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="Threads">Threads</option>
                <option value="X / Twitter">X / Twitter</option>
                <option value="Pinterest">Pinterest</option>
                <option value="Spotify">Spotify</option>
                <option value="Google">Google Articles / Sites</option>
                <option value="Play Store">Play Store</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-theme-muted mb-1">Content Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as FormatType)}
                className="w-full bg-theme-card border border-theme-border rounded-xl px-3.5 py-2 text-sm text-theme-text focus:outline-none focus:border-theme-accent"
              >
                <option value="Website">Website</option>
                <option value="Note">Text / Chapter Note</option>
                <option value="Video">Video</option>
                <option value="Reel">Reel / Short</option>
                <option value="Image">Image</option>
                <option value="Post">Social Post</option>
                <option value="Thread">Conversation Thread</option>
                <option value="Comment">Platform Comment</option>
                <option value="Profile">Profile / Channel</option>
                <option value="Song">Song / Audio</option>
                <option value="Audio">Audio</option>
                <option value="Playlist">Playlist</option>
                <option value="Artist">Artist Bio</option>
                <option value="App">App / Utility</option>
                <option value="Book">Book / PDF</option>
                <option value="Article">Article / Paper</option>
              </select>
            </div>
          </div>

          {/* Section: Personal notes */}
          <div>
            <label className="block text-xs font-semibold text-theme-muted mb-1">
              Personal Context Note
            </label>
            <textarea
              rows={2}
              placeholder="Write your personal context summary, ideas, thoughts..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-theme-card border border-theme-border rounded-xl px-3.5 py-2.5 text-sm text-theme-text focus:outline-none focus:border-theme-accent transition resize-none placeholder-theme-muted/50"
            />
          </div>

          {/* Section: Drag & Drop local custom overrides (base64 storage) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-theme-muted">
              Custom Preview Cover Override (Drag & Drop or Select)
            </label>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center ${
                isDragging
                  ? 'border-theme-accent bg-theme-card/80'
                  : 'border-theme-border bg-theme-card hover:bg-theme-sidebar hover:border-theme-accent'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                className="hidden"
              />

              {customPreviewUrl ? (
                <div className="space-y-3">
                  <div className="w-48 h-28 mx-auto rounded-xl overflow-hidden bg-black border border-theme-border flex items-center justify-center relative">
                    {customPreviewType === 'video' ? (
                      <video
                        src={customPreviewUrl}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img src={customPreviewUrl} alt="custom" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomPreviewUrl(undefined);
                        setCustomPreviewType(null);
                      }}
                      className="absolute top-1 right-1 bg-black/80 hover:bg-black rounded-xl p-1 text-red-400 hover:text-red-300"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <span className="text-[10px] font-bold text-theme-accent block uppercase tracking-wider">
                    Custom {customPreviewType} override applied successfully!
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-theme-sidebar flex items-center justify-center border border-theme-border text-theme-muted mb-2">
                    <Upload size={16} />
                  </div>
                  <span className="text-xs font-medium text-theme-text">
                    Drag and drop your cover file here or click to browse
                  </span>
                  <span className="text-[10px] text-theme-muted block mt-1.5 leading-snug">
                    Supports high-contrast PNG, JPEG or small MP4/WebM video loops under 8MB.
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Section: Fallback Thumbnail presets */}
          {!customPreviewUrl && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-theme-muted">
                Or choose a fallback Cover Image placeholder
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_UNSPLASH_PLACEHOLDERS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setPreviewUrl(p.url)}
                    className={`relative rounded-xl overflow-hidden aspect-video border transition ${
                      previewUrl === p.url ? 'border-theme-accent ring-2 ring-theme-accent/20' : 'border-theme-border hover:border-theme-accent'
                    }`}
                  >
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                    {previewUrl === p.url && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                        <Check size={16} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section: Folders and Tags Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-theme-border">
            <div>
              <label className="block text-xs font-semibold text-theme-muted mb-1.5">
                Assign into Folder (Optional)
              </label>
              <select
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value || null)}
                className="w-full bg-theme-card border border-theme-border rounded-xl px-3.5 py-2 text-sm text-theme-text focus:outline-none focus:border-theme-accent"
              >
                <option value="">The Inbox (Uncategorized)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-theme-muted">
                Choose Central Pool Tags
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 border border-theme-border bg-theme-card rounded-xl">
                {tags.length === 0 ? (
                  <span className="text-[11px] text-theme-muted p-1.5 italic">
                    Central tag database is empty. Add tag on sidebar first.
                  </span>
                ) : (
                  tags.map((t) => {
                    const isSelected = selectedTags.includes(t.name);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTag(t.name)}
                        style={{
                          borderColor: isSelected ? t.color : 'var(--color-theme-border)',
                          backgroundColor: isSelected ? `${t.color}15` : 'var(--color-theme-sidebar)',
                          color: isSelected ? t.color : 'var(--color-theme-text)',
                        }}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-xl border transition"
                      >
                        {t.name}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Add tag in-dialog */}
              <div className="flex space-x-1.5">
                <input
                  type="text"
                  placeholder="Create custom item tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="flex-1 bg-theme-card border border-theme-border rounded-xl px-2.5 py-1 text-xs text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-theme-accent"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="bg-theme-card hover:bg-theme-hover text-theme-text border border-theme-border px-2.5 py-1 rounded-xl text-xs font-semibold transition"
                >
                  Add Tag
                </button>
              </div>
            </div>
          </div>

          {/* Save toolbar button */}
          <div className="pt-4 border-t border-theme-border flex justify-end shrink-0">
            <button
              type="submit"
              className="px-8 py-2 bg-theme-accent hover:bg-theme-hover text-white font-semibold rounded-xl text-sm transition shadow-lg"
            >
              Save Custom Item
            </button>
          </div>
        </form>
        )}
      </motion.div>
    </div>
  );
};
