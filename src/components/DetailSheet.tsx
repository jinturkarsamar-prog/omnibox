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
  ChevronRight,
  ZoomIn,
  MessageSquare,
  Globe,
  Trash,
} from 'lucide-react';
import { SavedItem, Folder, Tag } from '../types';
import { PlatformIcon, FormatIcon, getPlatformBadgeColor } from './PlatformIcon';
import { AudioDeckPlayer } from './AudioDeckPlayer';
import { MoodboardStudio } from './MoodboardStudio';
import { ImmersiveReader } from './ImmersiveReader';
import { SocialSimulator } from './SocialSimulator';

interface DetailSheetProps {
  item: SavedItem;
  allItems: SavedItem[];
  folders: Folder[];
  tags: Tag[];
  onClose: () => void;
  onUpdateItem: (updated: SavedItem) => void;
  onDeleteItem: (id: string) => void;
}

export const DetailSheet: React.FC<DetailSheetProps> = ({
  item: initialItem,
  allItems,
  folders,
  tags,
  onClose,
  onUpdateItem,
  onTagClick,
  onDeleteItem,
}) => {
  // Navigation stack for recommendations deep browsing
  const [historyStack, setHistoryStack] = useState<SavedItem[]>([initialItem]);
  const activeItem = historyStack[historyStack.length - 1];

  // Editable States
  const [isEditing, setIsEditing] = useState(false);
  const [editHeader, setEditHeader] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editFolderId, setEditFolderId] = useState<string | null>(null);
  const [editTags, setEditTags] = useState<string[]>([]);

  // Search/Adding Tag in edit state
  const [tagInput, setTagInput] = useState('');

  // Zoom Image Modal State
  const [showZoomModal, setShowZoomModal] = useState(false);

  // Sync state whenever active item in the stack changes
  useEffect(() => {
    if (activeItem) {
      setEditHeader(activeItem.header);
      setEditNote(activeItem.note);
      setEditFolderId(activeItem.folderId);
      setEditTags([...activeItem.tags]);
      setIsEditing(false);
    }
  }, [activeItem]);

  if (!activeItem) return null;

  // Push recommendation onto history stack
  const handlePushItem = (newItem: SavedItem) => {
    setHistoryStack((prev) => [...prev, newItem]);
  };

  // Pop from history stack
  const handlePopItem = () => {
    if (historyStack.length > 1) {
      setHistoryStack((prev) => prev.slice(0, -1));
    }
  };

  // YouTube ID extractor
  const getEmbedYtId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Infinite Discovery Recommendation Matcher
  const getRecommendations = (): SavedItem[] => {
    const pool = allItems.filter((i) => i.id !== activeItem.id && i.deletedAt === null);

    return pool
      .map((other) => {
        let score = 0;
        // 1. Shared tags match (highest weight)
        const sharedTags = other.tags.filter((t) => activeItem.tags.includes(t));
        score += sharedTags.length * 10;

        // 2. Platform match (moderate weight)
        if (other.platform === activeItem.platform) {
          score += 3;
        }

        // 3. Keyword matches in headers/notes
        const otherWords = (other.header + ' ' + other.note).toLowerCase().split(/\s+/);
        const activeWords = (activeItem.header + ' ' + activeItem.note).toLowerCase().split(/\s+/);
        const overlap = otherWords.filter((w) => w.length > 3 && activeWords.includes(w));
        score += overlap.length * 2;

        return { item: other, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item)
      .slice(0, 8); // top 8 related items
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

    // Sync in history stack
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md p-0 md:p-6 transition-all duration-300 animate-fade-in animate-duration-200">
      {/* Detail Container Card */}
      <div className="w-full max-w-5xl h-full md:h-[85vh] bg-theme-sidebar border-0 md:border border-theme-border rounded-xl-none md:rounded-xl flex flex-col overflow-hidden shadow-2xl relative">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-theme-border shrink-0 bg-theme-sidebar">
          <div className="flex items-center space-x-3">
            {historyStack.length > 1 && (
              <button
                onClick={handlePopItem}
                className="flex items-center space-x-1.5 text-xs font-semibold text-theme-text bg-theme-card border border-theme-border hover:bg-theme-sidebar px-2.5 py-1.5 rounded-xl transition cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            )}
            <div className="flex items-center space-x-2">
              <PlatformIcon platform={activeItem.platform} size={18} />
              <span className="text-xs font-semibold text-theme-muted uppercase tracking-widest">
                {activeItem.platform} Detail
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer ${
                isEditing
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-600'
                  : 'bg-theme-card border border-theme-border text-theme-text hover:bg-theme-sidebar'
              }`}
            >
              {isEditing ? 'Cancel Edit' : 'Edit Details'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-card transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable sheet body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: Media Preview Section */}
            <div className="lg:col-span-6 space-y-4">
              {activeItem.customPreviewUrl && activeItem.customPreviewType === 'video' ? (
                /* Custom video loops overrides */
                <div className="relative rounded-xl overflow-hidden bg-theme-card/30 border border-theme-border aspect-video flex items-center justify-center">
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
                <div className="min-h-[350px] lg:h-[480px]">
                  <AudioDeckPlayer item={activeItem} ytVideoId={ytVideoId} />
                </div>
              ) : activeItem.format === 'Image' || activeItem.platform === 'Pinterest' ? (
                /* Moodboard tuning, adjustments & Color Extraction Palette */
                <div className="min-h-[350px] lg:h-[480px]">
                  <MoodboardStudio item={activeItem} />
                </div>
              ) : activeItem.format === 'Article' || activeItem.format === 'Book' || activeItem.platform === 'Google' ? (
                /* Distraction-free typography reader Mode */
                <div className="h-[350px] lg:h-[480px]">
                  <ImmersiveReader item={activeItem} />
                </div>
              ) : activeItem.platform === 'Instagram' || activeItem.platform === 'Threads' || activeItem.format === 'Post' || activeItem.format === 'Comment' ? (
                /* High-fidelity social feed mockup & reply stream simulator */
                <div className="h-[350px] lg:h-[480px]">
                  <SocialSimulator item={activeItem} />
                </div>
              ) : (
                /* Default Fallback / YouTube Embed frame */
                <div className="relative rounded-xl overflow-hidden bg-theme-card/30 border border-theme-border aspect-video flex items-center justify-center">
                  {ytVideoId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=1&mute=1`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full absolute inset-0"
                    />
                  ) : activeItem.format === 'Comment' || activeItem.format === 'Thread' ? (
                    /* Stylized large quote rendering */
                    <div
                      className="w-full h-full flex flex-col justify-center p-8 text-center bg-theme-card/40 relative overflow-hidden"
                      style={{ borderTop: `3px solid ${activeItem.brandColor || 'var(--color-theme-accent)'}` }}
                    >
                      <div className="text-3xl text-theme-muted font-display absolute top-4 left-6 opacity-30 select-none">“</div>
                      <div className="text-lg text-theme-text font-medium italic relative z-10 leading-relaxed px-4">
                        {activeItem.quoteText || activeItem.note}
                      </div>
                      <div className="text-3xl text-theme-muted font-display absolute bottom-2 right-6 opacity-30 select-none">”</div>
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
                        className="absolute bottom-3 right-3 bg-theme-card/95 backdrop-blur-md hover:bg-theme-sidebar p-2 border border-theme-border rounded-xl text-theme-text transition flex items-center space-x-1 text-xs cursor-pointer"
                      >
                        <ZoomIn size={14} />
                        <span>Zoom View</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Source Quick Actions */}
              <div className="flex items-center justify-between p-3.5 bg-theme-card/50 rounded-xl border border-theme-border">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-theme-muted font-medium">Original URL:</span>
                  <span className="text-theme-muted font-mono truncate max-w-[150px] md:max-w-[260px]">
                    {activeItem.url}
                  </span>
                </div>
                <a
                  href={activeItem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-theme-card border border-theme-border hover:bg-theme-hover text-theme-text transition"
                >
                  <span>Open on {activeItem.platform}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* RIGHT COLUMN: Metadata details, folder routing, tag editors */}
            <div className="lg:col-span-6 space-y-6">
              {isEditing ? (
                // ------------------
                // EDITING STATE PANEL
                // ------------------
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                      Edit Content Mode
                    </span>
                    <button
                      onClick={handleSaveEdits}
                      className="flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-semibold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
                    >
                      <Save size={14} />
                      <span>Save Edits</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-theme-muted mb-1">
                      Header / Title
                    </label>
                    <input
                      type="text"
                      value={editHeader}
                      onChange={(e) => setEditHeader(e.target.value)}
                      className="w-full bg-theme-card border border-theme-border rounded-xl px-3.5 py-2.5 text-sm text-theme-text focus:outline-none focus:border-theme-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-theme-muted mb-1">
                      Personal Summary / Note
                    </label>
                    <textarea
                      rows={4}
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      className="w-full bg-theme-card border border-theme-border rounded-xl px-3.5 py-2.5 text-sm text-theme-text focus:outline-none focus:border-theme-accent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-theme-muted mb-1">
                      Assigned Folder
                    </label>
                    <select
                      value={editFolderId || ''}
                      onChange={(e) => setEditFolderId(e.target.value || null)}
                      className="w-full bg-theme-card border border-theme-border rounded-xl px-3.5 py-2.5 text-sm text-theme-text focus:outline-none focus:border-theme-accent"
                    >
                      <option value="">The Inbox (Uncategorized)</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Inline Tag Assignment */}
                  <div>
                    <label className="block text-xs font-semibold text-theme-muted mb-1">
                      Assigned Tags ({editTags.length})
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {editTags.map((t) => (
                        <span
                          key={t}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-theme-card border border-theme-border text-xs text-theme-text"
                        >
                          <span>{t}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="hover:text-theme-accent cursor-pointer"
                          >
                            <X size={10} />
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
                        className="flex-1 bg-theme-card border border-theme-border rounded-xl px-3 py-1.5 text-xs text-theme-text focus:outline-none focus:border-theme-accent"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTag(tagInput)}
                        className="bg-theme-card border border-theme-border hover:bg-theme-hover text-theme-text px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 cursor-pointer transition"
                      >
                        <Plus size={12} />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // ------------------
                // VIEW STATE PANEL
                // ------------------
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-xl ${getPlatformBadgeColor(
                          activeItem.platform,
                        )}`}
                      >
                        {activeItem.platform}
                      </span>
                      <span className="text-[10px] font-semibold text-theme-muted uppercase tracking-widest">
                        {activeItem.format}
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-semibold text-theme-text tracking-tight">
                      {activeItem.header}
                    </h2>
                  </div>

                  {activeItem.note && (
                    <div className="p-4 bg-theme-card/55 border border-theme-border rounded-xl space-y-1.5">
                      <span className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">
                        Personal Context Note
                      </span>
                      <p className="text-sm text-theme-text leading-relaxed whitespace-pre-wrap">
                        {activeItem.note}
                      </p>
                    </div>
                  )}

                  {/* Date & Folder metadata details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-theme-card/55 border border-theme-border text-xs">
                      <FolderOpen className="text-theme-muted" size={16} />
                      <div>
                        <div className="text-[10px] font-semibold text-theme-muted uppercase">Folder</div>
                        <div className="text-theme-text font-medium">
                          {folders.find((f) => f.id === activeItem.folderId)?.name || 'The Inbox'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-theme-card/55 border border-theme-border text-xs">
                      <Calendar className="text-theme-muted" size={16} />
                      <div>
                        <div className="text-[10px] font-semibold text-theme-muted uppercase">Saved On</div>
                        <div className="text-theme-text font-medium">
                          {new Date(activeItem.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags list */}
                  {activeItem.tags.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider block">
                        Assigned Tags
                      </span>
                      <div className="flex flex-wrap gap-1.5">
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
                              className="text-xs font-semibold px-3 py-1 rounded-xl border"
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
            </div>
          </div>

          {/* INFINITE DISCOVERY: Related saves recommendations section */}
          <div className="pt-8 border-t border-theme-border space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-theme-text tracking-wide flex items-center space-x-2">
                <Globe size={16} className="text-theme-muted" />
                <span>Infinite Discovery Related Saved Items</span>
              </h3>
              <p className="text-xs text-theme-muted mt-0.5">
                Matches established on shared tags, similar headers, and description keywords.
              </p>
            </div>

            {recommendations.length === 0 ? (
              <div className="text-center py-6 text-xs text-theme-muted italic">
                No related items found yet. Save more items with matching tags to build recommendation links!
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => handlePushItem(rec)}
                    className="group rounded-xl overflow-hidden border border-theme-border bg-theme-sidebar p-2.5 cursor-pointer hover:border-theme-accent transition-all duration-300"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black mb-2">
                      
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
    
                      <div className="absolute top-1.5 left-1.5">
                        <PlatformIcon platform={rec.platform} size={11} className="bg-black/60 rounded-xl p-0.5" />
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-theme-text group-hover:text-theme-accent truncate transition">
                      {rec.header}
                    </div>
                    <div className="text-[10px] text-theme-muted truncate mt-0.5">
                      {rec.platform} • {rec.format}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULLSIZE ZOOM IMAGE MODAL */}
      {showZoomModal && (
        <div
          className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md cursor-zoom-out"
          onClick={() => setShowZoomModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl">
            <img
              src={activeItem.customPreviewUrl || activeItem.previewUrl}
              alt={activeItem.header}
              className="w-full h-auto max-h-[85vh] object-contain select-none"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setShowZoomModal(false)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/95 p-2 rounded-xl text-white border border-theme-border cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="absolute bottom-4 inset-x-4 text-center bg-theme-card/90 backdrop-blur-md p-3.5 rounded-xl border border-theme-border max-w-lg mx-auto">
              <span className="text-sm font-semibold text-theme-text block truncate">{activeItem.header}</span>
              <span className="text-xs text-theme-muted block mt-0.5">{activeItem.url}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
