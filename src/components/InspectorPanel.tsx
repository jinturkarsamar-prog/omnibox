import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  FolderOpen,
  Calendar,
  Save,
  Tag as TagIcon,
  Plus,
  ArrowLeft,
  Globe,
  Edit2,
  Minimize2,
  Maximize2,
  Copy,
  Check,
  Download,
  Send,
} from 'lucide-react';
import { SavedItem, Folder, Tag } from '../types';
import { PlatformIcon, FormatIcon, getPlatformBadgeColor } from './PlatformIcon';
import {
  downloadBlob,
  getGokoClipUri,
  getItemMarkdownFilename,
  itemToObsidianMarkdown,
} from '../utils/obsidianExport';
import { getYouTubeVideoId } from '../utils/youtube';
import { isExternalHttpUrl } from '../utils/quickParse';
import { ChapterProgressStepper } from './ChapterProgressStepper';

interface InspectorPanelProps {
  item: SavedItem;
  allItems: SavedItem[];
  folders: Folder[];
  tags: Tag[];
  showYouTubeViewer?: boolean;
  onClose: () => void;
  onUpdateItem: (updated: SavedItem) => void;
  onTagClick?: (tagName: string) => void;
  onDeleteItem: (id: string) => void;
  onMaximize?: () => void;
  onMarkExportedToGoko?: (ids: string[]) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  item: initialItem,
  allItems,
  folders,
  tags,
  showYouTubeViewer = true,
  onClose,
  onUpdateItem,
  onTagClick,
  onDeleteItem,
  onMaximize,
  onMarkExportedToGoko,
}) => {
  // Navigation stack for deep recommendation browsing
  const [historyStack, setHistoryStack] = useState<SavedItem[]>([initialItem]);
  const activeItem = historyStack[historyStack.length - 1];

  // Editable States
  const [isEditing, setIsEditing] = useState(false);
  const [editHeader, setEditHeader] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editFolderId, setEditFolderId] = useState<string | null>(null);
  const [editTags, setEditTags] = useState<string[]>([]);

  // Tag search/adding state
  const [tagInput, setTagInput] = useState('');

  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  // Sync active item state
  useEffect(() => {
    if (activeItem) {
      setEditHeader(activeItem.header);
      setEditNote(activeItem.note);
      setEditFolderId(activeItem.folderId);
      setEditTags([...activeItem.tags]);
      setIsEditing(false);
    }
  }, [activeItem]);

  // If the initialItem prop changes from outside, reset history stack
  useEffect(() => {
    setHistoryStack([initialItem]);
  }, [initialItem]);

  if (!activeItem) return null;

  const handlePushItem = (newItem: SavedItem) => {
    setHistoryStack((prev) => [...prev, newItem]);
  };

  const handleCopyMarkdown = async () => {
    const markdown = itemToObsidianMarkdown(activeItem, folders);
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    } catch {
      handleDownloadMarkdown();
    }
  };

  const handleDownloadMarkdown = () => {
    const markdown = itemToObsidianMarkdown(activeItem, folders);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, getItemMarkdownFilename(activeItem));
    onMarkExportedToGoko?.([activeItem.id]);
  };

  const handlePopItem = () => {
    if (historyStack.length > 1) {
      setHistoryStack((prev) => prev.slice(0, -1));
    }
  };

  const getRecommendations = (): SavedItem[] => {
    const pool = allItems.filter((i) => i.id !== activeItem.id && i.deletedAt === null);

    return pool
      .map((other) => {
        let score = 0;
        const sharedTags = other.tags.filter((t) => activeItem.tags.includes(t));
        score += sharedTags.length * 10;

        if (other.platform === activeItem.platform) {
          score += 3;
        }

        const otherWords = (other.header + ' ' + other.note).toLowerCase().split(/\s+/);
        const activeWords = (activeItem.header + ' ' + activeItem.note).toLowerCase().split(/\s+/);
        const overlap = otherWords.filter((w) => w.length > 3 && activeWords.includes(w));
        score += overlap.length * 2;

        return { item: other, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item)
      .slice(0, 4); // Limit to top 4 recommendations for compact side-column fit
  };

  const handleSaveEdits = () => {
    const updated: SavedItem = {
      ...activeItem,
      header: editHeader.trim(),
      note: editNote.trim(),
      folderId: editFolderId,
      tags: editTags,
    };
    onUpdateItem(updated);

    // Sync state
    setHistoryStack((prev) =>
      prev.map((i) => (i.id === activeItem.id ? updated : i)),
    );
    setIsEditing(false);
  };

  const handleAddTag = (tagName: string) => {
    const cleanTag = tagName.trim();
    if (cleanTag && !editTags.includes(cleanTag)) {
      setEditTags((prev) => [...prev, cleanTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagName: string) => {
    setEditTags((prev) => prev.filter((t) => t !== tagName));
  };

  const ytVideoId = showYouTubeViewer ? getYouTubeVideoId(activeItem.url) : null;
  const hasCustomVideo = Boolean(activeItem.customPreviewUrl && activeItem.customPreviewType === 'video');
  const recommendations = getRecommendations();

  return (
    <div className="w-[380px] lg:w-[420px] shrink-0 border-l border-theme-border bg-theme-sidebar flex flex-col h-full overflow-hidden shadow-xl animate-slide-in font-sans">
      {/* Dynamic Header */}
      <div className="px-5 py-4 border-b border-theme-border flex items-center justify-between bg-theme-sidebar/95 shrink-0">
        <div className="flex items-center space-x-2 overflow-hidden">
          {historyStack.length > 1 && (
            <button
              onClick={handlePopItem}
              className="p-1 rounded-xl bg-theme-card border border-theme-border hover:bg-theme-sidebar text-theme-text transition shrink-0"
              title="Go Back"
            >
              <ArrowLeft size={13} />
            </button>
          )}
          <span className="text-xs font-bold text-theme-muted uppercase tracking-wider truncate">
            {isEditing ? 'Editing Details' : `${activeItem.platform} Save`}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={() => {
              if (isEditing) {
                handleSaveEdits();
              } else {
                setIsEditing(true);
              }
            }}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
              isEditing
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-theme-card border border-theme-border text-theme-text hover:bg-theme-hover'
            }`}
          >
            {isEditing ? (
              <>
                <Save size={12} />
                <span>Save</span>
              </>
            ) : (
              <>
                <Edit2 size={12} />
                <span>Edit</span>
              </>
            )}
          </button>
          {onMaximize && (
            <button
              onClick={onMaximize}
              className="p-1.5 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-card transition shrink-0"
              title="Open Immersive Player Room"
            >
              <Maximize2 size={15} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-card transition shrink-0"
            title="Collapse Panel"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Inspector Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
        {/* Media Player (YouTube or custom uploaded video) */}
        {(hasCustomVideo || ytVideoId) && (
          <div className="shrink-0">
            <div className="relative rounded-xl overflow-hidden bg-theme-card/30 border border-theme-border aspect-video flex items-center justify-center shrink-0">
              {hasCustomVideo ? (
                <video
                  src={activeItem.customPreviewUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              ) : (
                <iframe
                  src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=0&mute=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full absolute inset-0"
                />
              )}
            </div>
          </div>
        )}

        {/* Action button link */}
        <div className="space-y-2 p-2.5 bg-theme-card/35 rounded-xl border border-theme-border shrink-0">
          {isExternalHttpUrl(activeItem.url) && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-theme-muted truncate min-w-0 flex-1">
                {activeItem.url}
              </span>
              <a
                href={activeItem.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-theme-card border border-theme-border hover:bg-theme-hover text-theme-text transition shrink-0"
              >
                <span>Open Original Link</span>
                <ExternalLink size={10} />
              </a>
            </div>
          )}
          <div className={`grid grid-cols-2 gap-2 ${isExternalHttpUrl(activeItem.url) ? 'pt-1.5 border-t border-theme-border/60' : ''}`}>
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-theme-card border border-theme-border hover:bg-theme-hover text-theme-text transition cursor-pointer"
              title="Copy Goko/Obsidian Markdown"
            >
              {copiedMarkdown ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} className="text-theme-accent" />}
              <span>{copiedMarkdown ? 'Copied .md' : 'Copy Goko .md'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-theme-card border border-theme-border hover:bg-theme-hover text-theme-text transition cursor-pointer"
              title="Download Goko/Obsidian Markdown file"
            >
              <Download size={10} className="text-theme-accent" />
              <span>Save .md Note</span>
            </button>
            {isExternalHttpUrl(activeItem.url) && (
              <a
                href={getGokoClipUri(activeItem.url)}
                onClick={() => onMarkExportedToGoko?.([activeItem.id])}
                className="col-span-2 flex items-center justify-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-theme-accent/15 border border-theme-accent/40 hover:bg-theme-accent/25 text-theme-accent transition"
                title="Open in Obsidian Goko to clip & archive permanently"
              >
                <Send size={10} />
                <span>Send to Goko (Obsidian)</span>
              </a>
            )}
          </div>
        </div>

        {isEditing ? (
          /* ================== EDIT FORM ================== */
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-theme-muted mb-1">
                Title / Header
              </label>
              <input
                type="text"
                value={editHeader}
                onChange={(e) => setEditHeader(e.target.value)}
                className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs text-theme-text focus:outline-none focus:border-theme-accent"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-theme-muted mb-1">
                Personal Summary Note
              </label>
              <textarea
                rows={3}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs text-theme-text focus:outline-none focus:border-theme-accent resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-theme-muted mb-1">
                Folder Location
              </label>
              <select
                value={editFolderId || ''}
                onChange={(e) => setEditFolderId(e.target.value || null)}
                className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-xs text-theme-text focus:outline-none focus:border-theme-accent"
              >
                <option value="">The Inbox (Root)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Editing Tags */}
            <div className="space-y-2.5">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-theme-muted">
                Assigned Tags ({editTags.length})
              </label>
              <div className="flex flex-wrap gap-1">
                {editTags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded-xl bg-theme-card border border-theme-border text-[10px] text-theme-text font-medium"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-red-500 cursor-pointer"
                    >
                      <X size={8} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex space-x-1.5">
                <input
                  type="text"
                  placeholder="Add tag name..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  className="flex-1 bg-theme-card border border-theme-border rounded-xl px-2.5 py-1.5 text-[11px] text-theme-text focus:outline-none focus:border-theme-accent"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="bg-theme-card border border-theme-border hover:bg-theme-hover text-theme-text px-2.5 rounded-xl text-xs flex items-center justify-center cursor-pointer transition"
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ================== DETAIL VIEW ================== */
          <div className="space-y-4">
            {/* Title Block */}
            <div className="space-y-1.5">
              <div className="flex items-center space-x-1.5">
                {!(activeItem.format === 'Note' && activeItem.platform === 'Other') && (
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-xl ${getPlatformBadgeColor(activeItem.platform)}`}>
                    {activeItem.platform}
                  </span>
                )}
                <span className="text-[9px] font-bold text-theme-muted uppercase tracking-wider bg-theme-card px-1.5 py-0.5 rounded-xl border border-theme-border">
                  {activeItem.format}
                </span>
                {activeItem.exportedToGokoAt && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    Goko ✓
                  </span>
                )}
              </div>
              <h2 className="text-base font-semibold text-theme-text tracking-wide leading-snug">
                {activeItem.header}
              </h2>
              <ChapterProgressStepper
                compact
                title={activeItem.header}
                onChangeTitle={(nextHeader) => {
                  const updated = { ...activeItem, header: nextHeader };
                  onUpdateItem(updated);
                  setHistoryStack((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
                }}
              />
            </div>

            {/* Note block */}
            {activeItem.note && (
              <div className="p-3 bg-theme-card/50 border border-theme-border rounded-xl space-y-1">
                <span className="text-[9px] font-extrabold text-theme-muted uppercase tracking-wider">
                  Personal Summary Note
                </span>
                <p className="text-xs text-theme-text leading-relaxed whitespace-pre-wrap">
                  {activeItem.note}
                </p>
              </div>
            )}

            {/* Meta tags Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-theme-card/40 border border-theme-border">
                <FolderOpen className="text-theme-muted" size={14} />
                <div className="min-w-0">
                  <div className="text-[9px] font-bold text-theme-muted uppercase">Folder</div>
                  <div className="text-[11px] text-theme-text font-semibold truncate">
                    {folders.find((f) => f.id === activeItem.folderId)?.name || 'Inbox Root'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-theme-card/40 border border-theme-border">
                <Calendar className="text-theme-muted" size={14} />
                <div className="min-w-0">
                  <div className="text-[9px] font-bold text-theme-muted uppercase">Saved On</div>
                  <div className="text-[11px] text-theme-text font-semibold truncate">
                    {new Date(activeItem.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Tags Pills list */}
            {activeItem.tags.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[9px] font-extrabold text-theme-muted uppercase tracking-wider block">
                  Assigned Tags
                </span>
                <div className="flex flex-wrap gap-1">
                  {activeItem.tags.map((t) => {
                    const dbTag = tags.find((dt) => dt.name.toLowerCase() === t.toLowerCase() || dt.id === t);
                    const color = dbTag?.color || '#3b82f6';
                    return (
                      <span
                        key={t}
                        style={{
                          borderColor: `${color}30`,
                          backgroundColor: `${color}05`,
                          color: color,
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-xl border shrink-0"
                      >
                        {dbTag?.name || t}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inline recommendations block (Bento style) */}
        <div className="pt-4 border-t border-theme-border space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-theme-muted uppercase tracking-widest flex items-center space-x-1">
              <Globe size={11} />
              <span>Related Saves</span>
            </span>
          </div>

          {recommendations.length === 0 ? (
            <div className="text-center py-4 text-[10px] text-theme-muted italic">
              No matching saves found yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {recommendations.map((rec) => {
                const showRecThumb = showYouTubeViewer && Boolean(getYouTubeVideoId(rec.url));
                return (
                  <div
                    key={rec.id}
                    onClick={() => handlePushItem(rec)}
                    className="group rounded-xl overflow-hidden border border-theme-border bg-theme-card/30 p-2 cursor-pointer hover:border-theme-accent transition-all duration-200"
                  >
                    {showRecThumb ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black mb-1.5">
                        <img
                          src={rec.customPreviewUrl || rec.previewUrl}
                          alt={rec.header}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5 mb-1">
                        <PlatformIcon platform={rec.platform} size={11} />
                        <span className="text-[9px] font-bold text-theme-muted uppercase tracking-wider truncate">
                          {rec.platform}
                        </span>
                      </div>
                    )}
                    <div className="text-[10px] font-bold text-theme-text group-hover:text-theme-accent truncate">
                      {rec.header}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
