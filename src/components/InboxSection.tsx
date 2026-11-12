import React, { useState } from 'react';
import {
  Grid,
  List,
  Inbox,
  Link,
  Plus,
  Sparkles,
  ArrowRight,
  FolderOpen,
  Tag as TagIcon,
  Trash2,
  CheckSquare,
  Square,
  AlertCircle,
  Download,
  Check,
  X,
} from 'lucide-react';
import { SavedItem, Folder, Tag } from '../types';
import { Feed } from './Feed';
import { PlatformIcon, getPlatformBadgeColor } from './PlatformIcon';
import { buildObsidianVaultZip, downloadBlob } from '../utils/obsidianExport';

interface InboxSectionProps {
  inboxItems: SavedItem[];
  folders: Folder[];
  tags: Tag[];
  onSelectItem: (item: SavedItem) => void;
  onMoveItemsToFolder: (ids: string[], folderId: string | null) => void;
  onAssignTagsToItems: (ids: string[], tagNames: string[]) => void;
  onDeleteItems: (ids: string[]) => void;
  onMarkExportedToGoko?: (ids: string[]) => void;
  onContextMenu?: (e: React.MouseEvent, item: SavedItem) => void;
  onTagClick?: (tagName: string, type: 'user' | 'platform' | 'format') => void;
  onSwipeRightItem?: (item: SavedItem) => void;
  layout: "gallery" | "list";
  setLayout: (l: "gallery" | "list") => void;
  gallerySize?: 'comfortable' | 'standard' | 'compact';
  listDensity?: 'comfortable' | 'compact';
  showNotesInFeed?: boolean;
  showYouTubeViewer?: boolean;
}

export const InboxSection: React.FC<InboxSectionProps> = ({
  inboxItems,
  folders,
  tags,
  onSelectItem,
  onMoveItemsToFolder,
  onAssignTagsToItems,
  onDeleteItems,
  onMarkExportedToGoko,
  onContextMenu,
  onTagClick,
  onSwipeRightItem,
  layout,
  setLayout,
  gallerySize = 'standard',
  listDensity = 'comfortable',
  showNotesInFeed = true,
  showYouTubeViewer = true,
}) => {
  // Selected items for mass actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openMenu, setOpenMenu] = useState<'move' | 'tag' | null>(null);
  const [lastExportedIds, setLastExportedIds] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedIds.length === inboxItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(inboxItems.map((item) => item.id));
    }
  };

  const toggleSelectItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleMassMove = (folderId: string | null) => {
    if (selectedIds.length === 0) return;
    onMoveItemsToFolder(selectedIds, folderId);
    setSelectedIds([]);
  };

  const handleMassTag = (tagName: string) => {
    if (selectedIds.length === 0) return;
    onAssignTagsToItems(selectedIds, [tagName]);
    setSelectedIds([]);
  };

  const handleMassDelete = () => {
    if (selectedIds.length === 0) return;
    onDeleteItems(selectedIds);
    setSelectedIds([]);
  };

  const unsentInboxItems = inboxItems.filter((item) => !item.exportedToGokoAt);

  const handleExportToGoko = () => {
    const targets =
      selectedIds.length > 0
        ? inboxItems.filter((item) => selectedIds.includes(item.id))
        : unsentInboxItems.length > 0
          ? unsentInboxItems
          : inboxItems;
    if (targets.length === 0) return;
    const targetIds = targets.map((item) => item.id);
    const zipBlob = buildObsidianVaultZip(targets, folders);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadBlob(zipBlob, `omnibox-goko-inbox-${dateStr}.zip`);
    onMarkExportedToGoko?.(targetIds);
    setLastExportedIds(targetIds);
  };

  const handleTrashExported = () => {
    const liveIds = lastExportedIds.filter((id) => inboxItems.some((item) => item.id === id));
    if (liveIds.length > 0) {
      onDeleteItems(liveIds);
    }
    setLastExportedIds([]);
    setSelectedIds([]);
  };

  const pendingExportCleanupCount = lastExportedIds.filter((id) =>
    inboxItems.some((item) => item.id === id)
  ).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Inbox Items Queue & Mass Actions */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-theme-text flex items-center space-x-2">
              <Inbox className="text-theme-muted" size={18} />
              <span>Inbox Processing Queue ({inboxItems.length} items)</span>
            </h2>
            <p className="text-xs text-theme-muted mt-0.5">
              Items landing here must be categorized into folders or tagged before leaving.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-theme-card border border-theme-border rounded-xl p-0.5 text-theme-muted">
              <button
                onClick={() => setLayout('gallery')}
                title="Gallery View"
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  layout === 'gallery' ? 'bg-theme-sidebar text-theme-text' : 'hover:text-theme-text'
                }`}
              >
                <Grid size={15} />
              </button>
              <button
                onClick={() => setLayout('list')}
                title="List View"
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  layout === 'list' ? 'bg-theme-sidebar text-theme-text' : 'hover:text-theme-text'
                }`}
              >
                <List size={15} />
              </button>
            </div>
          </div>


          {inboxItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-theme-border bg-theme-sidebar text-xs text-theme-text hover:bg-theme-card transition shadow-sm"
              >
                {selectedIds.length === inboxItems.length ? <CheckSquare size={14} className="text-theme-accent" /> : <Square size={14} />}
                <span>
                  {selectedIds.length === inboxItems.length ? 'Deselect All' : 'Select All'}
                </span>
              </button>

              {/* Mass Action Button: Move */}
              <div className="relative">
                <button
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={() => setOpenMenu((prev) => (prev === 'move' ? null : 'move'))}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-theme-border bg-theme-sidebar text-xs text-theme-text hover:bg-theme-card transition shadow-sm disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <FolderOpen size={14} />
                  <span>Move to ({selectedIds.length})</span>
                </button>
                {openMenu === 'move' && selectedIds.length > 0 && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setOpenMenu(null)}
                    />
                    <div className="absolute top-full left-0 mt-1.5 w-52 rounded-xl bg-theme-sidebar border border-theme-border shadow-xl overflow-hidden py-1 z-20 max-h-60 overflow-y-auto">
                      {folders.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            handleMassMove(f.id);
                            setOpenMenu(null);
                          }}
                          className="w-full text-left px-3 py-2.5 text-xs hover:bg-theme-card text-theme-text flex items-center space-x-2 transition-colors cursor-pointer"
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                          <span className="truncate">{f.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Mass Action Button: Tag */}
              <div className="relative">
                <button
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={() => setOpenMenu((prev) => (prev === 'tag' ? null : 'tag'))}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-theme-border bg-theme-sidebar text-xs text-theme-text hover:bg-theme-card transition shadow-sm disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <TagIcon size={14} />
                  <span>Assign Tag</span>
                </button>
                {openMenu === 'tag' && selectedIds.length > 0 && tags.length > 0 && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setOpenMenu(null)}
                    />
                    <div className="absolute top-full left-0 mt-1.5 w-52 rounded-xl bg-theme-sidebar border border-theme-border shadow-xl overflow-hidden py-1 z-20 max-h-60 overflow-y-auto">
                      {tags.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            handleMassTag(t.name);
                            setOpenMenu(null);
                          }}
                          className="w-full text-left px-3 py-2.5 text-xs hover:bg-theme-card text-theme-text flex items-center space-x-2 transition-colors cursor-pointer"
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                          <span className="truncate">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Export New / Selected or Re-export Queue to Goko (.zip) */}
              <button
                type="button"
                onClick={() => {
                  setOpenMenu(null);
                  handleExportToGoko();
                }}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition shadow-sm cursor-pointer ${
                  selectedIds.length > 0 || unsentInboxItems.length > 0
                    ? 'border-theme-accent/40 bg-theme-accent/15 text-theme-accent hover:bg-theme-accent/25'
                    : 'border-theme-border bg-theme-sidebar text-theme-muted hover:text-theme-text hover:bg-theme-card'
                }`}
                title="Download Goko-ready Markdown notes inside Clippings/ (.zip)"
              >
                <Download size={14} />
                <span>
                  {selectedIds.length > 0
                    ? `To Goko (${selectedIds.length})`
                    : unsentInboxItems.length > 0
                      ? `Export New (${unsentInboxItems.length})`
                      : `Re-export All (${inboxItems.length})`}
                </span>
              </button>

              {/* Mass Action: Delete */}
              <button
                type="button"
                onClick={() => {
                  setOpenMenu(null);
                  handleMassDelete();
                }}
                disabled={selectedIds.length === 0}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/40 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 text-xs transition shadow-sm disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Trash ({selectedIds.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* Post-export handoff helper banner */}
        {pendingExportCleanupCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs">
            <div className="flex items-center space-x-2 text-emerald-300 min-w-0">
              <Check size={15} className="shrink-0" />
              <span>
                Exported {pendingExportCleanupCount} Goko clipping{pendingExportCleanupCount === 1 ? '' : 's'} into <code className="font-mono text-emerald-200">Clippings/</code>. Unzip into your vault root on Mac.
              </span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handleTrashExported}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/30 font-semibold transition cursor-pointer"
              >
                Clear Exported ({pendingExportCleanupCount})
              </button>
              <button
                type="button"
                onClick={() => setLastExportedIds([])}
                aria-label="Dismiss export notice"
                className="p-1.5 rounded-lg text-emerald-300/70 hover:text-emerald-200 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Inbox items list */}
        
        {inboxItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-theme-border bg-theme-card/30">
            <Inbox className="text-theme-muted mb-3" size={32} />
            <span className="text-sm text-theme-text font-medium">All clear! The Inbox is clean.</span>
            <p className="text-xs text-theme-muted mt-1">
              Any links shared with OmniBox land here for organization.
            </p>
          </div>
        ) : (
          <Feed
            onTagClick={onTagClick}
            showYouTubeViewer={showYouTubeViewer}
            items={inboxItems}
            folders={folders}
            tags={tags}
            layout={layout}
            selectedItemIds={selectedIds}
            onSelectItem={onSelectItem}
            onToggleSelectItem={(id, isMeta) => toggleSelectItem(id, null as any)}
            onDeleteItem={(id) => onDeleteItems([id])}
            onContextMenu={onContextMenu || (() => {})}
            onSwipeRightItem={onSwipeRightItem}
          />
        )}
      </div>
    </div>
  );
};
