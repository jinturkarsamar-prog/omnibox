import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Tag as TagIcon,
  Play,
  Maximize2,
  Trash2,
  Undo2,
  FileText,
  User,
  Heart,
  MessageSquare,
  Share2,
  GripVertical,
} from 'lucide-react';
import { SavedItem, Tag, Folder } from '../types';
import { PlatformIcon, FormatIcon, getPlatformBadgeColor } from './PlatformIcon';
import { SwipeableItem } from './SwipeableItem';

interface FeedProps {
  items: SavedItem[];
  folders: Folder[];
  tags: Tag[];
  layout: 'gallery' | 'list';
  gallerySize?: 'comfortable' | 'standard' | 'compact';
  listDensity?: 'comfortable' | 'compact';
  showNotesInFeed?: boolean;
  showTagsInFeed?: boolean;
  showPlatformBadges?: boolean;
  selectedItemIds: string[];
  onSelectItem: (item: SavedItem) => void;
  onDeleteItem: (id: string) => void;
  onToggleSelectItem: (id: string, isMeta: boolean) => void;
  onContextMenu: (e: React.MouseEvent, item: SavedItem) => void;
  onRestoreItem?: (id: string) => void;
  onPermanentDeleteItem?: (id: string) => void;
  onTagClick?: (tagName: string, type: 'user' | 'platform' | 'format') => void;
  isTrashView?: boolean;
  onReorderItems?: (draggedId: string, targetId: string, position: 'before' | 'after') => void;
  onSwipeRightItem?: (item: SavedItem) => void;
}

const getGalleryThumbnailClass = (item: SavedItem) => {
  const p = (item.platform || '').toLowerCase();
  const f = (item.format || '').toLowerCase();
  const u = (item.url || '').toLowerCase();

  let aspectRatio = 'aspect-video';

  if (p === 'instagram') {
    if (f === 'video' || f === 'reel' || f === 'story') aspectRatio = 'aspect-[9/16]';
    else aspectRatio = 'aspect-square';
  } else if (p === 'youtube') {
    if (u.includes('/shorts/')) aspectRatio = 'aspect-[9/16]';
    else aspectRatio = 'aspect-video';
  } else if (p === 'tiktok') {
    aspectRatio = 'aspect-[9/16]';
  } else if (p === 'pinterest') {
    aspectRatio = 'aspect-[2/3]';
  } else if (p === 'threads' || p === 'twitter' || p === 'x') {
    aspectRatio = 'aspect-square';
  } else if (f === 'profile' || f === 'song' || f === 'playlist') {
    aspectRatio = 'aspect-square';
  } else if (f === 'image') {
    aspectRatio = 'aspect-[4/5]';
  }

  return `relative ${aspectRatio} w-full overflow-hidden bg-theme-card/40 flex-shrink-0`;
};

const getListThumbnailClass = (item: SavedItem) => {
  const p = (item.platform || '').toLowerCase();
  const f = (item.format || '').toLowerCase();
  const u = (item.url || '').toLowerCase();

  let aspectRatio = 'aspect-video';

  if (p === 'instagram') {
    if (f === 'video' || f === 'reel' || f === 'story') aspectRatio = 'aspect-[9/16]';
    else aspectRatio = 'aspect-square';
  } else if (p === 'youtube') {
    if (u.includes('/shorts/')) aspectRatio = 'aspect-[9/16]';
    else aspectRatio = 'aspect-video';
  } else if (p === 'tiktok') {
    aspectRatio = 'aspect-[9/16]';
  } else if (p === 'pinterest') {
    aspectRatio = 'aspect-[2/3]';
  } else if (p === 'threads' || p === 'twitter' || p === 'x') {
    aspectRatio = 'aspect-square';
  } else if (f === 'profile' || f === 'song' || f === 'playlist' || f === 'image') {
    aspectRatio = 'aspect-square';
  }

  return `relative h-16 ${aspectRatio} rounded-xl overflow-hidden bg-theme-card/30 flex-shrink-0`;
};

export const Feed: React.FC<FeedProps> = ({
  items,
  folders,
  tags,
  layout,
  gallerySize = 'standard',
  listDensity = 'comfortable',
  showNotesInFeed = true,
  showTagsInFeed = true,
  showPlatformBadges = true,
  selectedItemIds,
  onSelectItem,
  onDeleteItem,
  onToggleSelectItem,
  onContextMenu,
  onRestoreItem,
  onPermanentDeleteItem,
  onTagClick,
  isTrashView = false,
  onReorderItems,
  onSwipeRightItem,
}) => {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);

  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getColumnsCount = () => {
    const w = windowWidth;
    if (gallerySize === 'compact') {
      if (w < 640) return 2;
      if (w < 768) return 3;
      if (w < 1024) return 4;
      if (w < 1280) return 5;
      return 6;
    } else if (gallerySize === 'comfortable') {
      if (w < 640) return 1;
      if (w < 1024) return 2;
      return 3;
    } else {
      // Normal/default (standard)
      if (w < 640) return 1;
      if (w < 768) return 2;
      if (w < 1024) return 3;
      if (w < 1280) return 4;
      return 5;
    }
  };

  const columnsCount = getColumnsCount();

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItemId(itemId);
    e.dataTransfer.effectAllowed = 'move';
    const isSelected = selectedItemIds.includes(itemId);
    const dragIds = isSelected ? selectedItemIds : [itemId];
    e.dataTransfer.setData('application/json', JSON.stringify(dragIds));
    e.dataTransfer.setData('text/plain', itemId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    if (draggedItemId === targetId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isAfter = x > rect.width / 2;

    setDragOverItemId(targetId);
    setDragOverPosition(isAfter ? 'after' : 'before');
  };

  const handleDragLeave = () => {
    setDragOverItemId(null);
    setDragOverPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverItemId(null);
    setDragOverPosition(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetId) return;

    if (onReorderItems) {
      onReorderItems(draggedItemId, targetId, dragOverPosition || 'before');
    }
    handleDragEnd();
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-xl bg-theme-card flex items-center justify-center border border-theme-border text-theme-muted">
          {isTrashView ? <Trash2 size={24} /> : <Play size={24} />}
        </div>
        <div>
          <h3 className="text-base font-semibold text-theme-text">
            {isTrashView ? 'Trash Bin is Empty' : 'Your Feed is Empty'}
          </h3>
          <p className="text-sm text-theme-muted max-w-sm mt-1">
            {isTrashView
              ? 'Deleted content will appear here before being permanently removed.'
              : 'Paste links in the Inbox or add items manually to populate your collection.'}
          </p>
        </div>
      </div>
    );
  }

  // Render Feed layout
  if (layout === 'list') {
    return (
      <div className="space-y-4 max-w-4xl mx-auto w-full">
        {items.map((item) => {
          const itemTags = tags.filter((t) => item.tags.includes(t.name) || item.tags.includes(t.id));
          const itemFolder = folders.find((f) => f.id === item.folderId);
          const isListSelected = selectedItemIds.includes(item.id);

          // Card Wrapper Click/Multi-Select Handler
          const handleCardClick = (e: React.MouseEvent) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey) {
              e.stopPropagation();
              e.preventDefault();
              onToggleSelectItem(item.id, true);
            } else {
              onSelectItem(item);
            }
          };

          const handleContextMenu = (e: React.MouseEvent) => {
            e.preventDefault();
            onContextMenu(e, item);
          };

          return (
            <SwipeableItem
              key={item.id}
              id={item.id}
              disabled={isTrashView}
              onSwipeLeft={() => onDeleteItem(item.id)}
              onSwipeRight={() => onSwipeRightItem && onSwipeRightItem(item)}
            >
              <div
                onClick={handleCardClick}
                onContextMenu={handleContextMenu}
                className={`break-inside-avoid group relative flex items-center overflow-hidden rounded-xl border transition-all duration-300 p-3.5 cursor-pointer space-x-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.08)] w-full ${
                  isListSelected
                    ? 'border-theme-accent bg-theme-accent/5 ring-2 ring-theme-accent/10 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.12)]'
                    : 'border-theme-border bg-theme-card hover:bg-theme-card/90 border-theme-border/80'
                }`}
              >
                {/* List Row Multi-Select Checkbox */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelectItem(item.id, false);
                  }}
                  className={`w-5 h-5 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    isListSelected
                      ? 'bg-theme-accent border-theme-accent text-white scale-110 shadow-sm'
                      : 'bg-transparent border-theme-border text-transparent opacity-0 group-hover:opacity-100'
                  } ${selectedItemIds.length > 0 ? 'opacity-100' : ''}`}
                  style={{
                    backgroundColor: isListSelected ? 'var(--color-theme-accent)' : undefined,
                    borderColor: isListSelected ? 'var(--color-theme-accent)' : undefined,
                  }}
                  title="Select item"
                >
                  <div className="w-1.5 h-1.5 rounded-xl bg-current" />
                </div>

                {/* Visual Thumbnail */}
                <div className={getListThumbnailClass(item)}>
                  <img
                    src={item.customPreviewUrl || item.previewUrl}
                    alt={item.header}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                    referrerPolicy="no-referrer"
                  />
                  {showPlatformBadges && (
                    <div className="absolute top-1 left-1 z-10" onClick={(e) => { e.stopPropagation(); onTagClick?.(item.platform, 'platform'); }}>
                      <PlatformIcon platform={item.platform} size={11} className="bg-black/60 rounded-xl p-0.5 cursor-pointer hover:scale-110 transition-transform" />
                    </div>
                  )}
                </div>

                {/* List Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-theme-text tracking-wide truncate group-hover:text-theme-accent transition font-sans">
                      {item.header}
                    </h3>
                    <span className="text-[10px] font-semibold bg-theme-card text-theme-muted px-1.5 py-0.5 rounded-xl border border-theme-border uppercase">
                      {item.format}
                    </span>
                  </div>
                  {showNotesInFeed && item.note && listDensity !== 'compact' && (<p className="text-xs text-theme-muted truncate mt-0.5 max-w-2xl">{item.note}</p>)}

                  {/* Sub Tags / Info row */}
                  <div className="flex items-center space-x-3 mt-1.5">
                    {itemFolder && (
                      <span className="text-[10px] font-semibold text-theme-muted flex items-center space-x-1 font-sans">
                        <span className="w-1.5 h-1.5 rounded-xl" style={{ backgroundColor: itemFolder.color }} />
                        <span>{itemFolder.name}</span>
                      </span>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {itemTags.map((tag) => (
                        <span
                          key={tag.id}
                          style={{ color: tag.color }}
                          onClick={(e) => { e.stopPropagation(); onTagClick?.(tag.name, 'user'); }}
                          className="cursor-pointer hover:opacity-80 text-[10px] font-semibold font-sans"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* List Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  {isTrashView ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestoreItem && onRestoreItem(item.id);
                        }}
                        title="Restore"
                        className="p-2 rounded-xl bg-theme-card text-emerald-500 hover:text-emerald-400 hover:bg-theme-hover transition"
                      >
                        <Undo2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPermanentDeleteItem && onPermanentDeleteItem(item.id);
                        }}
                        title="Delete permanently"
                        className="p-2 rounded-xl bg-theme-card text-rose-500 hover:text-rose-400 hover:bg-theme-hover transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(item.id);
                      }}
                      title="Move to Trash"
                      className="p-2 rounded-xl text-theme-muted hover:text-rose-500 hover:bg-black/5 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-xl text-theme-muted hover:text-theme-text hover:bg-black/5 transition"
                  >
                    <ExternalLink size={15} />
                  </a>
                </div>
              </div>
            </SwipeableItem>
          );
        })}
      </div>
    );
  }

  const columns = Array.from({ length: columnsCount }, () => [] as SavedItem[]);
  items.forEach((item, index) => {
    columns[index % columnsCount].push(item);
  });

  const gapClass = gallerySize === 'compact' ? 'gap-3' : gallerySize === 'comfortable' ? 'gap-6' : 'gap-4';

  return (
    <div 
      className={`grid ${gapClass} items-start w-full`}
      style={{
        gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))`
      }}
    >
      {columns.map((col, colIdx) => (
        <div key={colIdx} className={`flex flex-col ${gapClass}`}>
          {col.map((item) => {
            const itemTags = tags.filter((t) => item.tags.includes(t.name) || item.tags.includes(t.id));
            const itemFolder = folders.find((f) => f.id === item.folderId);
            const isDragging = draggedItemId === item.id;
            const isSelected = selectedItemIds.includes(item.id);

            const handleCardClick = (e: React.MouseEvent) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey) {
                e.stopPropagation();
                e.preventDefault();
                onToggleSelectItem(item.id, true);
              } else {
                onSelectItem(item);
              }
            };

            const handleContextMenu = (e: React.MouseEvent) => {
              e.preventDefault();
              onContextMenu(e, item);
            };

            return (
              <SwipeableItem
                key={item.id}
                id={item.id}
                disabled={isTrashView}
                onSwipeLeft={() => onDeleteItem(item.id)}
                onSwipeRight={() => onSwipeRightItem && onSwipeRightItem(item)}
              >
                <div
                  onClick={handleCardClick}
                  onContextMenu={handleContextMenu}
                  draggable={!isTrashView && !!onReorderItems}
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDragLeave={handleDragLeave}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, item.id)}
                  className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer w-full ${
                    isSelected
                      ? 'border-theme-accent ring-2 ring-theme-accent/20 bg-theme-accent/5 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.12)]'
                      : isDragging
                        ? 'opacity-40 scale-95 border-dashed border-theme-border ring-2 ring-theme-accent/25'
                        : 'border-theme-border bg-theme-card shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.08)] hover:border-theme-border/80'
                  }`}
                >
                  {/* Drag insertion highlight indicator */}
                  {dragOverItemId === item.id && (
                    <div
                      className={`absolute top-0 bottom-0 w-1.5 bg-theme-accent z-30 pointer-events-none transition-all duration-150 ${
                        dragOverPosition === 'after' ? 'right-0' : 'left-0'
                      }`}
                    />
                  )}

                  {/* Multi-Select Checkbox Indicator */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelectItem(item.id, false);
                    }}
                    className={`absolute top-3 left-3 w-5 h-5 rounded-xl border flex items-center justify-center transition-all z-20 cursor-pointer ${
                      isSelected
                        ? 'bg-theme-accent border-theme-accent text-white scale-110 shadow-md'
                        : 'bg-black/40 border-white/60 text-transparent opacity-0 group-hover:opacity-100'
                    } ${selectedItemIds.length > 0 ? 'opacity-100' : ''}`}
                    style={{
                      backgroundColor: isSelected ? 'var(--color-theme-accent)' : undefined,
                      borderColor: isSelected ? 'var(--color-theme-accent)' : undefined,
                    }}
                    title="Select item"
                  >
                    <div className="w-1.5 h-1.5 rounded-xl bg-current" />
                  </div>

                  {/* Drag Handle Indicator */}
                  {!isTrashView && !!onReorderItems && (
                    <div
                      onDragStart={(e) => e.stopPropagation()}
                      draggable={false}
                      className="absolute top-3 right-3 p-1.5 rounded-xl bg-theme-card/95 backdrop-blur-md text-theme-muted hover:text-theme-text border border-theme-border opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-20"
                      title="Drag to reorder"
                    >
                      <GripVertical size={12} />
                    </div>
                  )}

                  {/* Format Indicator Badge */}
                  <div className="absolute top-3 right-3 z-20 pointer-events-none group-hover:opacity-0 transition-opacity duration-200">
                    <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-xl bg-black/60 backdrop-blur-xs text-white border border-white/10">
                      {item.format}
                    </span>
                  </div>

                  {/* Visual Content Section */}
                  <div className={getGalleryThumbnailClass(item)}>
                    <img
                      src={item.customPreviewUrl || item.previewUrl}
                      alt={item.header}
                      className="w-full h-full object-cover transition duration-500 ease-out group-hover:scale-[1.025]"
                      referrerPolicy="no-referrer"
                    />

                    {/* Platform Brand Badge Pill Overlay */}
                    {showPlatformBadges && item.platform && (
                      <div 
                        onClick={(e) => { e.stopPropagation(); onTagClick?.(item.platform, 'platform'); }}
                        className={`absolute bottom-3 left-3 flex items-center space-x-1.5 px-2 py-1 rounded-xl text-[10px] font-bold text-white shadow-md z-20 cursor-pointer backdrop-blur-xs hover:scale-105 transition ${getPlatformBadgeColor(item.platform)}`}
                      >
                        <PlatformIcon platform={item.platform} size={10} />
                        <span>{item.platform}</span>
                      </div>
                    )}

                    {/* Interactive External Link Button Overlay */}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 backdrop-blur-xs text-white/95 hover:text-white hover:bg-black/85 transition-all shadow-md z-20 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 duration-300 border border-white/5 cursor-pointer flex items-center justify-center"
                      title={`Open original URL on ${item.platform}`}
                    >
                      <ExternalLink size={12} className="stroke-[2.5px]" />
                    </a>
                  </div>

                  {/* Card Meta Content */}
                  <div className="flex flex-col flex-1 p-4.5 space-y-2">
                    <h3 className="text-sm font-semibold text-theme-text tracking-wide line-clamp-1 leading-snug group-hover:text-theme-accent transition-colors font-sans">
                      {item.header}
                    </h3>
                    {showNotesInFeed && item.note && (
                      <p className="text-xs text-theme-muted line-clamp-2 leading-relaxed">
                        {item.note}
                      </p>
                    )}

                    {/* Tag pills */}
                    {showTagsInFeed && itemTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {itemTags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            style={{
                              borderColor: `${tag.color}30`,
                              backgroundColor: `${tag.color}08`,
                              color: tag.color,
                            }}
                            onClick={(e) => { e.stopPropagation(); onTagClick?.(tag.name, 'user'); }}
                            className="cursor-pointer hover:scale-105 transition-transform text-[10px] font-semibold px-2 py-0.5 rounded-xl border shrink-0 font-sans"
                          >
                            {tag.name}
                          </span>
                        ))}
                        {itemTags.length > 3 && (
                          <span className="text-[10px] font-bold text-slate-500 px-1.5 py-0.5 font-sans">
                            +{itemTags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </SwipeableItem>
            );
          })}
        </div>
      ))}
    </div>
  );
};
