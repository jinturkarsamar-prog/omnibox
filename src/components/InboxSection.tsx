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
} from 'lucide-react';
import { SavedItem, Folder, Tag } from '../types';
import { Feed } from './Feed';
import { PlatformIcon, getPlatformBadgeColor } from './PlatformIcon';

interface InboxSectionProps {
  inboxItems: SavedItem[];
  folders: Folder[];
  tags: Tag[];
  onSelectItem: (item: SavedItem) => void;
  onMoveItemsToFolder: (ids: string[], folderId: string | null) => void;
  onAssignTagsToItems: (ids: string[], tagNames: string[]) => void;
  onDeleteItems: (ids: string[]) => void;
  onContextMenu?: (e: React.MouseEvent, item: SavedItem) => void;  layout: "gallery" | "list";
  setLayout: (l: "gallery" | "list") => void;
  gallerySize?: 'comfortable' | 'standard' | 'compact';
  listDensity?: 'comfortable' | 'compact';
  showNotesInFeed?: boolean;
  
}

export const InboxSection: React.FC<InboxSectionProps> = ({
  inboxItems,
  folders,
  tags,
  onSelectItem,
  onMoveItemsToFolder,
  onAssignTagsToItems,
  onDeleteItems,
  onContextMenu,
  onTagClick,  layout,
  setLayout,
  gallerySize = 'standard',
  listDensity = 'comfortable',
  showNotesInFeed = true,
}) => {
  // Selected items for mass actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
              <div className="relative group/mass-move">
                <button
                  disabled={selectedIds.length === 0}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-theme-border bg-theme-sidebar text-xs text-theme-text hover:bg-theme-card transition shadow-sm disabled:opacity-40 disabled:pointer-events-none"
                >
                  <FolderOpen size={14} />
                  <span>Move to ({selectedIds.length})</span>
                </button>
                {selectedIds.length > 0 && (
                  <div className="absolute bottom-full right-0 mb-1 hidden group-hover/mass-move:block w-48 rounded-xl bg-theme-sidebar border border-theme-border shadow-xl overflow-hidden py-1 z-20">
                    {folders.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleMassMove(f.id)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-theme-card text-theme-text flex items-center space-x-1.5 transition-colors"
                      >
                        <span className="w-2 h-2 rounded-xl" style={{ backgroundColor: f.color }} />
                        <span>{f.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mass Action Button: Tag */}
              <div className="relative group/mass-tag">
                <button
                  disabled={selectedIds.length === 0}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-theme-border bg-theme-sidebar text-xs text-theme-text hover:bg-theme-card transition shadow-sm disabled:opacity-40 disabled:pointer-events-none"
                >
                  <TagIcon size={14} />
                  <span>Assign Tag</span>
                </button>
                {selectedIds.length > 0 && tags.length > 0 && (
                  <div className="absolute bottom-full right-0 mb-1 hidden group-hover/mass-tag:block w-48 rounded-xl bg-theme-sidebar border border-theme-border shadow-xl overflow-hidden py-1 z-20 max-h-48 overflow-y-auto">
                    {tags.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleMassTag(t.name)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-theme-card text-theme-text flex items-center space-x-1.5 transition-colors"
                      >
                        <span className="w-2 h-2 rounded-xl" style={{ backgroundColor: t.color }} />
                        <span>{t.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mass Action: Delete */}
              <button
                onClick={handleMassDelete}
                disabled={selectedIds.length === 0}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/40 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 text-xs transition shadow-sm disabled:opacity-40 disabled:pointer-events-none"
              >
                <Trash2 size={14} />
                <span>Move to Trash ({selectedIds.length})</span>
              </button>
            </div>
          )}
        </div>

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
            items={inboxItems}
            folders={folders}
            tags={tags}
            layout={layout}
            selectedItemIds={selectedIds}
            onSelectItem={onSelectItem}
            onToggleSelectItem={(id, isMeta) => toggleSelectItem(id, null as any)}
            onDeleteItem={(id) => onDeleteItems([id])}
            onContextMenu={onContextMenu || (() => {})}
          />
        )}
      </div>
    </div>
  );
};
