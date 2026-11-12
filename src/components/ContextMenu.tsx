import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Copy, FolderOpen, Tag, Trash2, RotateCcw, XCircle, ArrowRight, Send } from 'lucide-react';
import { SavedItem, Folder, Tag as TagType } from '../types';
import { getGokoClipUri } from '../utils/obsidianExport';
import { isExternalHttpUrl } from '../utils/quickParse';

interface ContextMenuProps {
  x: number;
  y: number;
  item: SavedItem;
  folders: Folder[];
  tags: TagType[];
  selectedItemIds: string[];
  isTrashView?: boolean;
  onClose: () => void;
  onMoveItemsToFolder: (ids: string[], folderId: string | null) => void;
  onAssignTagsToItems: (ids: string[], tagNames: string[]) => void;
  onDeleteItems: (ids: string[]) => void;
  onRestoreItems?: (ids: string[]) => void;
  onPermanentDelete?: (ids: string[]) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  item,
  folders,
  tags,
  selectedItemIds,
  isTrashView = false,
  onClose,
  onMoveItemsToFolder,
  onAssignTagsToItems,
  onDeleteItems,
  onRestoreItems,
  onPermanentDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<'folder' | 'tag' | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // If the right-clicked item is part of the current selection, we operate on ALL selected items.
  // Otherwise, we operate ONLY on this single right-clicked item.
  const isItemInSelection = selectedItemIds.includes(item.id);
  const targetIds = isItemInSelection ? selectedItemIds : [item.id];
  const itemsCount = targetIds.length;

  useEffect(() => {
    // Keep menu inside viewport boundaries
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let finalX = x;
      let finalY = y;

      // Adjust X position if spilling over right side
      if (x + rect.width > viewportWidth) {
        finalX = viewportWidth - rect.width - 10;
      }
      // Adjust Y position if spilling over bottom side
      if (y + rect.height > viewportHeight) {
        finalY = viewportHeight - rect.height - 10;
      }

      menu.style.left = `${finalX}px`;
      menu.style.top = `${finalY}px`;
    }

    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('click', handleOutsideClick, true);
    window.addEventListener('contextmenu', handleOutsideClick, true);
    window.addEventListener('scroll', onClose, true);

    return () => {
      window.removeEventListener('click', handleOutsideClick, true);
      window.removeEventListener('contextmenu', handleOutsideClick, true);
      window.removeEventListener('scroll', onClose, true);
    };
  }, [x, y, onClose]);

  const handleOpenOriginal = () => {
    window.open(item.url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(item.url);
    setCopiedNotification(true);
    setTimeout(() => {
      setCopiedNotification(false);
      onClose();
    }, 1000);
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-55 w-56 bg-theme-sidebar border border-theme-border rounded-xl shadow-xl py-1 text-xs text-theme-text transition-all duration-150 animate-fade-in divide-y divide-theme-border/40 font-sans"
      style={{ left: x, top: y }}
    >
      {/* Target Item Stats */}
      <div className="px-3 py-2 text-[10px] uppercase font-bold text-theme-muted tracking-wider">
        {itemsCount > 1 ? `Batch Actions (${itemsCount} Items)` : 'Desktop Item Options'}
      </div>

      {/* Primary Actions */}
      {isExternalHttpUrl(item.url) && (
        <div className="py-1">
          <button
            onClick={handleOpenOriginal}
            className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-theme-card hover:text-theme-accent transition-colors"
          >
            <ExternalLink size={13} className="text-theme-muted" />
            <span>Open original link</span>
          </button>

          {!isTrashView && itemsCount === 1 && (
            <a
              href={getGokoClipUri(item.url)}
              onClick={onClose}
              className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-theme-card text-theme-accent transition-colors"
            >
              <Send size={13} />
              <span>Send to Goko (Obsidian)</span>
            </a>
          )}

          <button
            onClick={handleCopyLink}
            className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-theme-card hover:text-theme-accent transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Copy size={13} className="text-theme-muted" />
              <span>{copiedNotification ? 'Link Copied!' : 'Copy source URL'}</span>
            </div>
            {copiedNotification && (
              <span className="text-[9px] font-bold text-emerald-500 uppercase">Copied!</span>
            )}
          </button>
        </div>
      )}

      {/* Flyouts: folders & tags */}
      {!isTrashView && (
        <div className="py-1">
          {/* Folders flyout trigger */}
          <div
            onMouseEnter={() => setActiveSubmenu('folder')}
            onMouseLeave={() => setActiveSubmenu(null)}
            className="relative"
          >
            <div className="flex items-center justify-between w-full px-3 py-2 cursor-pointer hover:bg-theme-card hover:text-theme-accent transition-colors">
              <div className="flex items-center space-x-2">
                <FolderOpen size={13} className="text-theme-muted" />
                <span>Move to folder...</span>
              </div>
              <ArrowRight size={10} className="text-theme-muted" />
            </div>

            {activeSubmenu === 'folder' && (
              <div className="absolute left-full top-0 ml-0.5 w-48 bg-theme-sidebar border border-theme-border rounded-xl shadow-xl py-1 z-60 animate-fade-in max-h-56 overflow-y-auto">
                <button
                  onClick={() => {
                    onMoveItemsToFolder(targetIds, null);
                    onClose();
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-1.5 text-left hover:bg-theme-card hover:text-theme-accent text-[11px]"
                >
                  <div className="w-2 h-2 rounded-xl bg-theme-muted" />
                  <span className="font-semibold">The Inbox (Root)</span>
                </button>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onMoveItemsToFolder(targetIds, f.id);
                      onClose();
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-1.5 text-left hover:bg-theme-card hover:text-theme-accent text-[11px]"
                  >
                    <div className="w-2 h-2 rounded-xl" style={{ backgroundColor: f.color }} />
                    <span className="truncate">{f.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tags flyout trigger */}
          <div
            onMouseEnter={() => setActiveSubmenu('tag')}
            onMouseLeave={() => setActiveSubmenu(null)}
            className="relative"
          >
            <div className="flex items-center justify-between w-full px-3 py-2 cursor-pointer hover:bg-theme-card hover:text-theme-accent transition-colors">
              <div className="flex items-center space-x-2">
                <Tag size={13} className="text-theme-muted" />
                <span>Assign Tag...</span>
              </div>
              <ArrowRight size={10} className="text-theme-muted" />
            </div>

            {activeSubmenu === 'tag' && (
              <div className="absolute left-full top-0 ml-0.5 w-48 bg-theme-sidebar border border-theme-border rounded-xl shadow-xl py-1 z-60 animate-fade-in max-h-56 overflow-y-auto">
                {tags.length === 0 ? (
                  <div className="px-3 py-2 text-[10px] text-theme-muted italic">No tags created yet</div>
                ) : (
                  tags.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onAssignTagsToItems(targetIds, [t.name]);
                        onClose();
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-1.5 text-left hover:bg-theme-card hover:text-theme-accent text-[11px]"
                    >
                      <div className="w-2 h-2 rounded-xl" style={{ backgroundColor: t.color }} />
                      <span className="truncate">{t.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Destruction Actions */}
      <div className="py-1">
        {isTrashView ? (
          <>
            <button
              onClick={() => {
                if (onRestoreItems) onRestoreItems(targetIds);
                onClose();
              }}
              className="flex items-center space-x-2 w-full px-3 py-2 text-left text-emerald-500 hover:bg-theme-card hover:text-emerald-400 transition-colors"
            >
              <RotateCcw size={13} />
              <span>Restore item{itemsCount > 1 ? 's' : ''}</span>
            </button>
            <button
              onClick={() => {
                if (confirm(`Permanently delete ${itemsCount} items? This action cannot be reversed.`)) {
                  if (onPermanentDelete) onPermanentDelete(targetIds);
                }
                onClose();
              }}
              className="flex items-center space-x-2 w-full px-3 py-2 text-left text-rose-500 hover:bg-theme-card hover:text-rose-400 transition-colors"
            >
              <XCircle size={13} />
              <span>Delete permanently</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              onDeleteItems(targetIds);
              onClose();
            }}
            className="flex items-center space-x-2 w-full px-3 py-2 text-left text-red-500 hover:bg-theme-card hover:text-red-400 transition-colors"
          >
            <Trash2 size={13} />
            <span>Move {itemsCount > 1 ? `${itemsCount} items ` : ''}to Trash</span>
          </button>
        )}
      </div>
    </div>
  );
};
