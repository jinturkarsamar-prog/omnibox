import React, { useState } from 'react';
import {
  Layers,
  Inbox,
  Plus,
  FolderOpen,
  MoreHorizontal,
  Trash2,
  Settings,
  X,
  Edit2,
  Check,
  Tag as TagIcon,
} from 'lucide-react';
import { Folder as FolderType, Tag } from '../types';
import { BottomSheet } from './BottomSheet';

const FOLDER_COLORS = [
  '#ec4899',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#14b8a6',
  '#6366f1',
];

interface BottomNavigationProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onAddClick: () => void;
  folders: FolderType[];
  tags: Tag[];
  itemsCount: {
    all: number;
    inbox: number;
    trash: number;
  };
  getFolderItemsCount: (folderId: string) => number;
  onAddFolder: (name: string, parentId: string | null, color: string, coverUrl: string | null) => void;
  onEditFolder: (folder: FolderType) => void;
  onDeleteFolder: (id: string) => void;
  onAddTag: (name: string, color: string) => void;
  onDeleteTag: (id: string) => void;
  onTagClick?: (tagName: string, type: 'user') => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeSection,
  onNavigate,
  onAddClick,
  folders,
  tags,
  itemsCount,
  getFolderItemsCount,
  onAddFolder,
  onEditFolder,
  onDeleteFolder,
  onAddTag,
  onDeleteTag,
  onTagClick,
}) => {
  const [isFoldersOpen, setIsFoldersOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Mobile folder creation / edit inside BottomSheet
  const [showNewFolderForm, setShowNewFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[1]);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderColor, setEditFolderColor] = useState(FOLDER_COLORS[1]);

  // Mobile tag creation inside More BottomSheet
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(FOLDER_COLORS[0]);

  const handleFolderSelect = (folderId: string | null) => {
    if (folderId) {
      onNavigate(`folder-${folderId}`);
    } else {
      onNavigate('all');
    }
    setIsFoldersOpen(false);
  };

  const handleMoreSelect = (section: string) => {
    onNavigate(section);
    setIsMoreOpen(false);
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    onAddFolder(trimmed, null, newFolderColor, null);
    setNewFolderName('');
    setShowNewFolderForm(false);
  };

  const handleSaveEditFolder = (folder: FolderType) => {
    const trimmed = editFolderName.trim();
    if (!trimmed) return;
    onEditFolder({ ...folder, name: trimmed, color: editFolderColor });
    setEditingFolderId(null);
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    onAddTag(trimmed, newTagColor);
    setNewTagName('');
  };

  return (
    <>
      {/* Sticky Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-theme-sidebar/95 backdrop-blur-md border-t border-theme-border min-h-[60px] pb-safe px-2 flex items-center justify-around lg:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.06)] transition-colors duration-200">
        {/* Tab 1: Library (All) */}
        <button
          onClick={() => onNavigate('all')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1.5 transition cursor-pointer active:scale-95 ${
            activeSection === 'all' || activeSection.startsWith('folder-')
              ? 'text-theme-accent'
              : 'text-theme-muted hover:text-theme-text'
          }`}
        >
          <Layers size={20} className={activeSection === 'all' ? 'stroke-[2.5px]' : 'stroke-2'} />
          <span className="text-[10px] font-bold mt-1 tracking-wide">Library</span>
        </button>

        {/* Tab 2: Inbox */}
        <button
          onClick={() => onNavigate('inbox')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1.5 transition cursor-pointer active:scale-95 ${
            activeSection === 'inbox'
              ? 'text-theme-accent'
              : 'text-theme-muted hover:text-theme-text'
          }`}
        >
          <div className="relative">
            <Inbox size={20} className={activeSection === 'inbox' ? 'stroke-[2.5px]' : 'stroke-2'} />
            {itemsCount.inbox > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-theme-accent text-white font-bold text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-sm">
                {itemsCount.inbox > 99 ? '99+' : itemsCount.inbox}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-1 tracking-wide">Inbox</span>
        </button>

        {/* Tab 3: Centered floating "Quick Add" button */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            onClick={onAddClick}
            className="w-12 h-12 rounded-2xl bg-theme-accent text-white hover:opacity-90 shadow-xl border border-theme-accent/50 flex items-center justify-center active:scale-95 transition-all cursor-pointer ring-4 ring-theme-app"
            title="Quick Add Item"
          >
            <Plus size={24} className="stroke-[3px]" />
          </button>
        </div>

        {/* Tab 4: Folders Sheet Trigger */}
        <button
          onClick={() => setIsFoldersOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1.5 transition cursor-pointer active:scale-95 ${
            isFoldersOpen || activeSection.startsWith('folder-')
              ? 'text-theme-accent'
              : 'text-theme-muted hover:text-theme-text'
          }`}
        >
          <FolderOpen size={20} className={isFoldersOpen ? 'stroke-[2.5px]' : 'stroke-2'} />
          <span className="text-[10px] font-bold mt-1 tracking-wide">Folders</span>
        </button>

        {/* Tab 5: More Actions Trigger */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1.5 transition cursor-pointer active:scale-95 ${
            isMoreOpen || activeSection === 'settings' || activeSection === 'trash'
              ? 'text-theme-accent'
              : 'text-theme-muted hover:text-theme-text'
          }`}
        >
          <MoreHorizontal size={20} className="stroke-2" />
          <span className="text-[10px] font-bold mt-1 tracking-wide">More</span>
        </button>
      </div>

      {/* Folders Bottom Sheet Selector & Manager */}
      <BottomSheet
        isOpen={isFoldersOpen}
        onClose={() => {
          setIsFoldersOpen(false);
          setEditingFolderId(null);
          setShowNewFolderForm(false);
        }}
        title="Folders"
      >
        <div className="space-y-3">
          {/* General Pool */}
          <button
            onClick={() => handleFolderSelect(null)}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition cursor-pointer ${
              activeSection === 'all'
                ? 'bg-theme-accent/10 border-theme-accent/40 text-theme-accent'
                : 'bg-theme-card border-theme-border text-theme-text hover:bg-theme-hover'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Layers size={16} />
              <span>All Media Library</span>
            </div>
            <span className="text-xs bg-theme-sidebar px-2 py-0.5 rounded-xl border border-theme-border text-theme-muted">
              {itemsCount.all}
            </span>
          </button>

          {/* Folder Listings + Inline Create */}
          <div className="border-t border-theme-border/60 pt-3 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                My Collections
              </span>
              <button
                type="button"
                onClick={() => setShowNewFolderForm((prev) => !prev)}
                className="flex items-center space-x-1 text-xs font-semibold text-theme-accent px-2.5 py-1 rounded-xl bg-theme-accent/10 border border-theme-accent/30 cursor-pointer"
              >
                {showNewFolderForm ? <X size={13} /> : <Plus size={13} />}
                <span>{showNewFolderForm ? 'Cancel' : 'New Folder'}</span>
              </button>
            </div>

            {showNewFolderForm && (
              <form
                onSubmit={handleCreateFolder}
                className="p-3 bg-theme-card border border-theme-border rounded-xl space-y-2.5"
              >
                <input
                  type="text"
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-base sm:text-sm text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-theme-accent"
                  autoFocus
                  required
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {FOLDER_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewFolderColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full transition ${
                          newFolderColor === c ? 'ring-2 ring-offset-2 ring-theme-accent scale-110' : 'opacity-80'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-theme-accent text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            {folders.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-theme-muted">No folders created yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {folders.map((folder) => {
                  const isSelected = activeSection === `folder-${folder.id}`;
                  const isEditingThis = editingFolderId === folder.id;

                  if (isEditingThis) {
                    return (
                      <div
                        key={folder.id}
                        className="p-3 bg-theme-card border border-theme-accent/40 rounded-xl space-y-2.5"
                      >
                        <input
                          type="text"
                          value={editFolderName}
                          onChange={(e) => setEditFolderName(e.target.value)}
                          className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-base sm:text-sm text-theme-text focus:outline-none focus:border-theme-accent"
                          autoFocus
                        />
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {FOLDER_COLORS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setEditFolderColor(c)}
                                style={{ backgroundColor: c }}
                                className={`w-5 h-5 rounded-full transition ${
                                  editFolderColor === c ? 'ring-2 ring-offset-2 ring-theme-accent scale-110' : 'opacity-80'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSaveEditFolder(folder)}
                              className="p-2 rounded-xl bg-emerald-500 text-white cursor-pointer"
                              aria-label="Save folder"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingFolderId(null)}
                              className="p-2 rounded-xl bg-theme-sidebar border border-theme-border text-theme-muted cursor-pointer"
                              aria-label="Cancel folder edit"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={folder.id}
                      className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition ${
                        isSelected
                          ? 'bg-theme-accent/10 border-theme-accent/40 text-theme-accent'
                          : 'bg-theme-card border-theme-border text-theme-text'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleFolderSelect(folder.id)}
                        className="flex items-center space-x-3 min-w-0 flex-1 text-left py-1 pl-1 cursor-pointer"
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: folder.color }}
                        />
                        <span className="truncate text-sm font-semibold flex-1">{folder.name}</span>
                        <span className="text-xs text-theme-muted bg-theme-sidebar px-2 py-0.5 rounded-xl border border-theme-border shrink-0">
                          {getFolderItemsCount(folder.id)}
                        </span>
                      </button>
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFolderId(folder.id);
                            setEditFolderName(folder.name);
                            setEditFolderColor(folder.color);
                          }}
                          className="p-2 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-sidebar cursor-pointer"
                          aria-label={`Edit ${folder.name}`}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete folder "${folder.name}"? Items inside will stay in your Library Inbox.`)) {
                              onDeleteFolder(folder.id);
                            }
                          }}
                          className="p-2 rounded-xl text-theme-muted hover:text-rose-400 hover:bg-theme-sidebar cursor-pointer"
                          aria-label={`Delete ${folder.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* "More" Bottom Sheet Options Panel (Settings, Trash, Tags) */}
      <BottomSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        title="More Workspace Actions"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            {/* Option: Settings */}
            <button
              onClick={() => handleMoreSelect('settings')}
              className={`flex flex-col items-center justify-center p-5 rounded-xl border text-center transition cursor-pointer ${
                activeSection === 'settings'
                  ? 'bg-theme-accent/15 border-theme-accent/40 text-theme-accent'
                  : 'bg-theme-card border-theme-border text-theme-text hover:bg-theme-hover'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-theme-sidebar flex items-center justify-center border border-theme-border text-theme-text mb-2.5 shadow-sm">
                <Settings size={20} />
              </div>
              <span className="text-xs font-bold">Preferences</span>
              <span className="text-[10px] text-theme-muted mt-0.5">Themes &amp; Export</span>
            </button>

            {/* Option: Trash Recovery */}
            <button
              onClick={() => handleMoreSelect('trash')}
              className={`flex flex-col items-center justify-center p-5 rounded-xl border text-center transition cursor-pointer relative ${
                activeSection === 'trash'
                  ? 'bg-theme-accent/15 border-theme-accent/40 text-theme-accent'
                  : 'bg-theme-card border-theme-border text-theme-text hover:bg-theme-hover'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-theme-sidebar flex items-center justify-center border border-theme-border text-theme-text mb-2.5 shadow-sm">
                <Trash2 size={20} />
              </div>
              <span className="text-xs font-bold">Trash Vault</span>
              <span className="text-[10px] text-theme-muted mt-0.5">Recovery archive</span>

              {itemsCount.trash > 0 && (
                <span className="absolute top-3 right-3 bg-rose-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-xl">
                  {itemsCount.trash}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Tags Filter & Manager */}
          <div className="border-t border-theme-border/60 pt-3.5 space-y-2.5">
            <div className="flex items-center space-x-1.5 px-1">
              <TagIcon size={12} className="text-theme-muted" />
              <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                Tags
              </span>
            </div>

            <form onSubmit={handleCreateTag} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="New tag..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="flex-1 min-w-0 bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-base sm:text-xs text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-theme-accent"
                required
              />
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-9 h-9 bg-transparent border border-theme-border rounded-xl cursor-pointer p-0.5 shrink-0"
                aria-label="Tag color"
              />
              <button
                type="submit"
                className="p-2.5 bg-theme-accent text-white rounded-xl font-bold shrink-0 cursor-pointer"
                aria-label="Add tag"
              >
                <Plus size={16} />
              </button>
            </form>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    style={{
                      backgroundColor: `${tag.color}15`,
                      borderColor: `${tag.color}40`,
                    }}
                    className="flex items-center space-x-1.5 pl-2.5 pr-1.5 py-1 rounded-xl border text-xs text-theme-text"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onTagClick?.(tag.name, 'user');
                        setIsMoreOpen(false);
                      }}
                      className="flex items-center space-x-1.5 font-medium cursor-pointer"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>#{tag.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete tag "${tag.name}"?`)) {
                          onDeleteTag(tag.id);
                        }
                      }}
                      className="p-1 text-theme-muted hover:text-rose-400 cursor-pointer"
                      aria-label={`Delete tag ${tag.name}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </BottomSheet>
    </>
  );
};
