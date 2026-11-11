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
  ZoomIn,
  Globe,
  Edit2,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { SavedItem, Folder, Tag } from '../types';
import { PlatformIcon, FormatIcon, getPlatformBadgeColor } from './PlatformIcon';
import { AudioDeckPlayer } from './AudioDeckPlayer';
import { MoodboardStudio } from './MoodboardStudio';
import { ImmersiveReader } from './ImmersiveReader';
import { SocialSimulator } from './SocialSimulator';

interface InspectorPanelProps {
  item: SavedItem;
  allItems: SavedItem[];
  folders: Folder[];
  tags: Tag[];
  onClose: () => void;
  onUpdateItem: (updated: SavedItem) => void;
  onTagClick?: (tagName: string) => void;
  onDeleteItem: (id: string) => void;
  onMaximize?: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  item: initialItem,
  allItems,
  folders,
  tags,
  onClose,
  onUpdateItem,
  onTagClick,
  onDeleteItem,
  onMaximize,
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

  // Zoom Image Overlay Modal
  const [showZoomModal, setShowZoomModal] = useState(false);

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

  const handlePopItem = () => {
    if (historyStack.length > 1) {
      setHistoryStack((prev) => prev.slice(0, -1));
    }
  };

  const getEmbedYtId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
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

  const ytVideoId = getEmbedYtId(activeItem.url);
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
        {/* Dynamic Aspect Ratio Immersive Previews & Players */}
        <div className="shrink-0">
          {activeItem.customPreviewUrl && activeItem.customPreviewType === 'video' ? (
            /* Custom video loops overrides */
            <div className="relative rounded-xl overflow-hidden bg-theme-card/30 border border-theme-border aspect-video flex items-center justify-center shrink-0">
              <video
                src={activeItem.customPreviewUrl}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain"
              />
            </div>
          ) : activeItem.platform === 'Music' || activeItem.format === 'Song' || activeItem.format === 'Playlist' ? (
            /* Holographic Audio CD & Lyrics Player Room */
            <div className="h-[340px] w-full">
              <AudioDeckPlayer item={activeItem} ytVideoId={ytVideoId} />
            </div>
          ) : activeItem.format === 'Image' || activeItem.platform === 'Pinterest' ? (
            /* Moodboard tuning, adjustments & Color Extraction Palette */
            <div className="h-[340px] w-full">
              <MoodboardStudio item={activeItem} />
            </div>
          ) : activeItem.format === 'Article' || activeItem.format === 'Book' || activeItem.platform === 'Google' ? (
            /* Distraction-free typography reader Mode */
            <div className="h-[340px] w-full">
              <ImmersiveReader item={activeItem} />
            </div>
          ) : activeItem.platform === 'Instagram' || activeItem.platform === 'Threads' || activeItem.format === 'Post' || activeItem.format === 'Comment' ? (
            /* High-fidelity social feed mockup & reply stream simulator */
            <div className="h-[340px] w-full">
              <SocialSimulator item={activeItem} />
            </div>
          ) : (
            /* Default Fallback / YouTube Embed frame */
            <div className="relative rounded-xl overflow-hidden bg-theme-card/30 border border-theme-border aspect-video flex items-center justify-center shrink-0">
              {ytVideoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=0&mute=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full absolute inset-0"
                />
              ) : activeItem.format === 'Comment' || activeItem.format === 'Thread' ? (
                /* Stylized large quote rendering */
                <div
                  className="w-full h-full flex flex-col justify-center p-5 text-center bg-theme-card/40 relative overflow-hidden"
                  style={{ borderTop: `3px solid ${activeItem.brandColor || 'var(--color-theme-accent)'}` }}
                >
                  <div className="text-xl text-theme-muted font-display absolute top-2 left-4 opacity-20 select-none">“</div>
                  <div className="text-xs text-theme-text font-medium italic relative z-10 leading-relaxed px-2">
                    {activeItem.quoteText || activeItem.note}
                  </div>
                  <div className="text-xl text-theme-muted font-display absolute bottom-1 right-4 opacity-20 select-none">”</div>
                </div>
              ) : (
                /* Standard Image zoom triggers */
                <div className="relative w-full h-full group">
                  <img
                    src={activeItem.customPreviewUrl || activeItem.previewUrl}
                    alt={activeItem.header}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setShowZoomModal(true)}
                    referrerPolicy="no-referrer"
                  />
                  <button
                    onClick={() => setShowZoomModal(true)}
                    className="absolute bottom-2 right-2 bg-theme-card/90 backdrop-blur-md hover:bg-theme-sidebar p-1.5 border border-theme-border rounded-xl text-theme-text text-[10px] font-semibold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <ZoomIn size={11} />
                    <span>Zoom</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action button link */}
        <div className="flex items-center justify-between p-2.5 bg-theme-card/35 rounded-xl border border-theme-border shrink-0">
          <span className="text-[10px] font-mono text-theme-muted truncate max-w-[160px]">
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
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5">
                <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-xl ${getPlatformBadgeColor(activeItem.platform)}`}>
                  {activeItem.platform}
                </span>
                <span className="text-[9px] font-bold text-theme-muted uppercase tracking-wider bg-theme-card px-1.5 py-0.5 rounded-xl border border-theme-border">
                  {activeItem.format}
                </span>
              </div>
              <h2 className="text-base font-semibold text-theme-text tracking-wide leading-snug">
                {activeItem.header}
              </h2>
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
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => handlePushItem(rec)}
                  className="group rounded-xl overflow-hidden border border-theme-border bg-theme-card/30 p-2 cursor-pointer hover:border-theme-accent transition-all duration-200"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black mb-1.5">
                    
                      { (rec.customPreviewUrl || rec.previewUrl) ? (
                        <img
                          src={rec.customPreviewUrl || rec.previewUrl}
                          alt={rec.header}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-2" style={{ backgroundColor: rec.brandColor ? `${rec.brandColor}22` : 'rgba(0,0,0,0.05)' }}>
                           <span className="text-[10px] text-theme-text opacity-70">{rec.platform}</span>
                        </div>
                      )}
    
                  </div>
                  <div className="text-[10px] font-bold text-theme-text group-hover:text-theme-accent truncate">
                    {rec.header}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FULLSIZE ZOOM IMAGE MODAL */}
      {showZoomModal && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md cursor-zoom-out"
          onClick={() => setShowZoomModal(false)}
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-xl">
            <img
              src={activeItem.customPreviewUrl || activeItem.previewUrl}
              alt={activeItem.header}
              className="w-full h-auto max-h-[80vh] object-contain select-none"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setShowZoomModal(false)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/95 p-1.5 rounded-xl text-white border border-theme-border cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
