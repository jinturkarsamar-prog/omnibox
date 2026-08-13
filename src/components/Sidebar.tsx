import React, { useState } from 'react';
import {
  Folder as FolderIcon,
  FolderPlus,
  Plus,
  Tag as TagIcon,
  Trash2,
  Inbox,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash,
  Settings,
  Layers,
  Check,
  X,
  Palette,
  Eye,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import { Folder, Tag, AutoRule } from '../types';
import { Logo } from './Logo';

interface SidebarProps {
  folders: Folder[];
  tags: Tag[];
  rules: AutoRule[];
  activeSection: string; // 'all' | 'inbox' | 'trash' | 'rules' | 'folder-[id]'
  activeFolderId: string | null;
  itemsCount: {
    all: number;
    inbox: number;
    trash: number;
  };
  getFolderItemsCount: (folderId: string) => number;
  onNavigate: (section: string) => void;
  onAddFolder: (name: string, parentId: string | null, color: string, coverUrl: string | null) => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (id: string) => void;
  onAddTag: (name: string, color: string) => void;
  onEditTag: (id: string, name: string, color: string) => void;
  onDeleteTag: (id: string) => void;
  onAddRule: (rule: Omit<AutoRule, 'id'>) => void;
  onDeleteRule: (id: string) => void;
  onTagClick?: (tagName: string, type: 'user') => void;
  isOpen?: boolean;
  onClose?: () => void;
  onMoveItemsToFolder?: (ids: string[], folderId: string | null) => void;
  onMoveItemsToTrash?: (ids: string[]) => void;
}

const PRESET_COLORS = [
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f43f5e', // Rose
  '#94a3b8', // Slate
];

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  tags,
  rules,
  activeSection,
  activeFolderId,
  itemsCount,
  getFolderItemsCount,
  onNavigate,
  onAddFolder,
  onEditFolder,
  onDeleteFolder,
  onAddTag,
  onEditTag,
  onDeleteTag,
  onAddRule,
  onDeleteRule,
  onTagClick,
  isOpen = true,
  onClose,
  onMoveItemsToFolder,
  onMoveItemsToTrash,
}) => {
  // Folder Creation States
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(PRESET_COLORS[0]);
  const [newFolderCover, setNewFolderCover] = useState<string | null>(null);
  const [newFolderParent, setNewFolderParent] = useState<string | null>(null);

  // Folder Edit States
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderColor, setEditFolderColor] = useState('');
  const [editFolderCover, setEditFolderCover] = useState<string | null>(null);

  // Expanded Folders Tracker
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isFoldersCollapsed, setIsFoldersCollapsed] = useState(false);
  const [isTagsCollapsed, setIsTagsCollapsed] = useState(false);

  // Tag Management States
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[1]);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [editingTagColor, setEditingTagColor] = useState('');



  // Drag-and-drop state & handlers
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverTarget(targetId);
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDropToFolder = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDragOverTarget(null);
    try {
      const raw = e.dataTransfer.getData('application/json');
      const singleId = e.dataTransfer.getData('text/plain');
      let ids: string[] = [];
      if (raw) {
        ids = JSON.parse(raw);
      } else if (singleId) {
        ids = [singleId];
      }
      if (ids.length > 0 && onMoveItemsToFolder) {
        onMoveItemsToFolder(ids, folderId);
      }
    } catch (err) {
      console.error('Error handling dropped items on folder', err);
    }
  };

  const handleDropToTrash = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTarget(null);
    try {
      const raw = e.dataTransfer.getData('application/json');
      const singleId = e.dataTransfer.getData('text/plain');
      let ids: string[] = [];
      if (raw) {
        ids = JSON.parse(raw);
      } else if (singleId) {
        ids = [singleId];
      }
      if (ids.length > 0 && onMoveItemsToTrash) {
        onMoveItemsToTrash(ids);
      }
    } catch (err) {
      console.error('Error handling dropped items on trash', err);
    }
  };

  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onAddFolder(newFolderName.trim(), newFolderParent, newFolderColor, newFolderCover);
    setNewFolderName('');
    setNewFolderCover(null);
    setShowAddFolderModal(false);
  };

  const handleEditFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFolder || !editFolderName.trim()) return;
    onEditFolder({
      ...editingFolder,
      name: editFolderName.trim(),
      color: editFolderColor,
      coverUrl: editFolderCover,
    });
    setEditingFolder(null);
  };

  const handleCreateTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    onAddTag(newTagName.trim(), newTagColor);
    setNewTagName('');
  };

  const handleEditTagSubmit = (tagId: string) => {
    if (!editingTagName.trim()) return;
    onEditTag(tagId, editingTagName.trim(), editingTagColor);
    setEditingTagId(null);
  };



  // Recursive rendering of folders for infinite nesting
  const renderFolderTree = (parentId: string | null, depth: number): React.ReactNode => {
    const levelFolders = folders.filter((f) => f.parentId === parentId);
    if (levelFolders.length === 0) return null;

    return (
      <ul className={`space-y-1 ${depth > 0 ? 'mt-1' : ''}`}>
        {levelFolders.map((folder) => {
          const hasChildren = folders.some((f) => f.parentId === folder.id);
          const isExpanded = expandedFolders[folder.id];
          const isActive = activeSection === `folder-${folder.id}`;
          const childCount = getFolderItemsCount(folder.id);

          const isDragOverThis = dragOverTarget === `folder-${folder.id}`;
          return (
            <li key={folder.id} className="relative group/folder">
              <div
                onClick={() => onNavigate(`folder-${folder.id}`)}
                onDragOver={(e) => handleDragOver(e, `folder-${folder.id}`)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDropToFolder(e, folder.id)}
                style={{ paddingLeft: `${depth * 12 + 12}px` }}
                className={`flex items-center justify-between py-2 pr-3 rounded-xl cursor-pointer transition-all duration-150 ${
                  isDragOverThis
                    ? 'bg-theme-accent/20 text-theme-text font-bold border border-theme-accent scale-102 shadow-md'
                    : isActive
                      ? 'bg-theme-card text-theme-text font-semibold shadow-sm border border-theme-border/50'
                      : 'text-theme-muted hover:bg-theme-card/50 hover:text-theme-text'
                }`}
              >
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <div className="flex items-center justify-center w-5 h-5">
                    {hasChildren ? (
                      <button
                        onClick={(e) => toggleFolderExpand(folder.id, e)}
                        className="p-0.5 rounded-xl hover:bg-theme-card/80 text-theme-muted hover:text-theme-text transition"
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-xl" style={{ backgroundColor: folder.color }} />
                    )}
                  </div>
                  <FolderIcon size={16} style={{ color: folder.color }} className="shrink-0" />
                  <span className="text-sm font-medium truncate">{folder.name}</span>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-xl bg-theme-card text-theme-muted border border-theme-border/40 group-hover/folder:bg-theme-card group-hover/folder:text-theme-text">
                    {childCount}
                  </span>
                  <div className="hidden group-hover/folder:flex items-center space-x-1 ml-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewFolderParent(folder.id);
                        setShowAddFolderModal(true);
                      }}
                      title="Add nested subfolder"
                      className="p-1 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-card/80 transition"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFolder(folder);
                        setEditFolderName(folder.name);
                        setEditFolderColor(folder.color);
                        setEditFolderCover(folder.coverUrl);
                      }}
                      title="Edit folder"
                      className="p-1 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-card/80 transition"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete folder "${folder.name}"? This will move all items and nested subfolders to the Trash Bin (Cascade Deletion).`)) {
                          onDeleteFolder(folder.id);
                        }
                      }}
                      title="Delete folder"
                      className="p-1 rounded-xl text-theme-muted hover:text-rose-500 hover:bg-rose-500/10 transition"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {hasChildren && isExpanded && (
                <div className="relative border-l border-theme-border ml-4">
                  {renderFolderTree(folder.id, depth + 1)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col bg-theme-sidebar transition-all duration-300 lg:static lg:h-screen ${
          isOpen
            ? 'lg:w-64 lg:opacity-100 border-r border-theme-border'
            : 'lg:w-0 lg:opacity-0 lg:overflow-hidden lg:border-r-0'
        }`}
      >
      {/* Sidebar Header (Serif Display Header matching design spec) */}
      <div className="p-6 pb-4 border-b border-theme-border flex items-center justify-between shrink-0 bg-theme-sidebar transition-all duration-200">
        <div className="flex items-center space-x-3">
          <Logo size={42} />
          <div>
            <h1 className="text-2xl font-display italic text-theme-text tracking-tight leading-none">OmniBox</h1>
            <p className="text-[10px] uppercase tracking-widest text-theme-muted mt-1 font-sans">Your Personal Library</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-card lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Sections */}
      <div className="p-4 space-y-1 shrink-0">
        <button
          onClick={() => onNavigate('inbox')}
          onDragOver={(e) => handleDragOver(e, 'inbox')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDropToFolder(e, null)}
          className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
            dragOverTarget === 'inbox'
              ? 'bg-theme-accent/20 text-theme-accent border-2 border-dashed border-theme-accent scale-102 shadow-md font-semibold'
              : activeSection === 'inbox'
                ? 'bg-theme-card text-theme-text font-semibold shadow-sm border border-theme-border/50'
                : 'text-theme-muted hover:bg-theme-card hover:text-theme-text'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Inbox size={16} className="text-theme-text" />
            <span>Inbox</span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-xl bg-theme-card text-theme-text border border-theme-border">
            {itemsCount.inbox}
          </span>
        </button>

        <button
          onClick={() => onNavigate('all')}
          className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
            activeSection === 'all'
              ? 'bg-theme-card text-theme-text font-semibold shadow-sm border border-theme-border/50'
              : 'text-theme-muted hover:bg-theme-card hover:text-theme-text'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Layers size={16} className="text-theme-text" />
            <span>All Saved Items</span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-xl bg-theme-card text-theme-text border border-theme-border">
            {itemsCount.all}
          </span>
        </button>

        <button
          onClick={() => onNavigate('trash')}
          onDragOver={(e) => handleDragOver(e, 'trash')}
          onDragLeave={handleDragLeave}
          onDrop={handleDropToTrash}
          className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
            dragOverTarget === 'trash'
              ? 'bg-rose-500/20 text-rose-500 border-2 border-dashed border-rose-500 scale-102 shadow-md font-semibold'
              : activeSection === 'trash'
                ? 'bg-theme-card text-theme-text font-semibold shadow-sm border border-theme-border/50'
                : 'text-theme-muted hover:bg-theme-card hover:text-theme-text'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Trash2 size={16} className="text-theme-text" />
            <span>Trash Bin</span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-xl bg-theme-card text-theme-text border border-theme-border">
            {itemsCount.trash}
          </span>
        </button>


      </div>

      {/* Folders & Nested structures */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">


        {/* Folders List Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between group cursor-pointer" onClick={() => setIsFoldersCollapsed(!isFoldersCollapsed)}>
            <span className="text-xs font-bold text-theme-muted group-hover:text-theme-text uppercase tracking-wider flex items-center space-x-1.5 transition-colors">
              {isFoldersCollapsed ? <ChevronRight size={14} className="opacity-70" /> : <ChevronDown size={14} className="opacity-70" />}
              <FolderIcon size={12} />
              <span>My Folders</span>
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNewFolderParent(null);
                setShowAddFolderModal(true);
              }}
              className="p-1.5 text-theme-muted hover:text-theme-text hover:bg-theme-card/80 rounded-xl transition"
              title="Create new root folder"
            >
              <FolderPlus size={15} />
            </button>
          </div>

          {/* Root Folders Tree */}
          {!isFoldersCollapsed && (
            <div className="space-y-1">
              {folders.filter((f) => f.parentId === null).length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500 italic">
                  No folders created yet. Create one!
                </div>
              ) : (
                renderFolderTree(null, 0)
              )}
            </div>
          )}
        </div>

        {/* Tags list */}
        <div className="space-y-3 pt-2 border-t border-theme-border/50">
          <span className="text-xs font-bold text-theme-muted group-hover:text-theme-text uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer group transition-colors" onClick={() => setIsTagsCollapsed(!isTagsCollapsed)}>
            {isTagsCollapsed ? <ChevronRight size={14} className="opacity-70" /> : <ChevronDown size={14} className="opacity-70" />}
            <TagIcon size={12} />
            <span>Tags</span>
          </span>

          {!isTagsCollapsed && (
            <>
              {/* Create tag */}
              <form onSubmit={handleCreateTagSubmit} className="flex space-x-1.5">
                <input
                  type="text"
                  placeholder="New tag..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="flex-1 bg-theme-card border border-theme-border rounded-xl px-2.5 py-1.5 text-xs text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-theme-accent"
                  required
                />
                <div className="relative">
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-7 h-7 bg-transparent border-0 rounded-xl cursor-pointer p-0 overflow-hidden"
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center bg-theme-accent hover:bg-theme-hover px-2 rounded-xl text-white font-bold transition shadow"
                >
                  <Plus size={14} />
                </button>
              </form>

              {/* Tags list */}
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
            {tags.map((tag) => {
              const isEditing = editingTagId === tag.id;

              return (
                <div
                  key={tag.id}
                  style={{
                    backgroundColor: `${tag.color}15`,
                    borderColor: `${tag.color}40`,
                  }}
                  className="flex items-center space-x-1.5 pl-2.5 pr-1 py-1 rounded-xl border text-xs text-theme-text/90 group/tag transition-all duration-200 hover:bg-theme-card/80 cursor-pointer"
                  onClick={() => onTagClick?.(tag.name, 'user')}
                >
                  {isEditing ? (
                    <div className="flex items-center space-x-1">
                      <input
                        onClick={(e) => e.stopPropagation()}
                        type="text"
                        value={editingTagName}
                        onChange={(e) => setEditingTagName(e.target.value)}
                        className="bg-theme-sidebar text-theme-text rounded-xl px-1.5 py-0.5 text-[11px] w-20 border border-theme-border focus:outline-none"
                        autoFocus
                      />
                      <input
                        onClick={(e) => e.stopPropagation()}
                        type="color"
                        value={editingTagColor}
                        onChange={(e) => setEditingTagColor(e.target.value)}
                        className="w-5 h-5 bg-transparent p-0 border-0 cursor-pointer"
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditTagSubmit(tag.id); }}
                        className="text-emerald-500 hover:text-emerald-400"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingTagId(null); }}
                        className="text-theme-muted hover:text-theme-text"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span
                        className="w-1.5 h-1.5 rounded-xl"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-medium">{tag.name}</span>
                      <div className="hidden group-hover/tag:flex items-center space-x-0.5 ml-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); 
                            setEditingTagId(tag.id);
                            setEditingTagName(tag.name);
                            setEditingTagColor(tag.color);
                          }}
                          className="p-0.5 rounded-xl text-theme-muted hover:text-theme-text"
                          title="Edit Tag"
                        >
                          <Edit2 size={10} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); 
                            if (confirm(`Delete tag "${tag.name}"? It will be removed from all items.`)) {
                              onDeleteTag(tag.id);
                            }
                          }}
                          className="p-0.5 rounded-xl text-theme-muted hover:text-red-400"
                          title="Delete Tag"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
            </>
          )}
        </div>
      </div>

      {/* Add Folder Modal */}
      {showAddFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-theme-sidebar border border-theme-border rounded-xl p-6 space-y-4 shadow-xl text-theme-text">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center space-x-2">
                <FolderPlus size={16} className="text-theme-accent" />
                <span>Create {newFolderParent ? 'Subfolder' : 'Folder'}</span>
              </h3>
              <button
                onClick={() => setShowAddFolderModal(false)}
                className="text-theme-muted hover:text-theme-text"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-theme-muted mb-1">Folder Name</label>
                <input
                  type="text"
                  placeholder="e.g., Inspiration, UI Design"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-sm text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-theme-accent"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-theme-muted mb-1.5">Accent Color</label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewFolderColor(c)}
                      style={{ backgroundColor: c }}
                      className={`h-7 rounded-xl relative flex items-center justify-center transition-all duration-150 ${
                        newFolderColor === c ? 'scale-110 ring-2 ring-offset-2 ring-theme-accent' : 'hover:opacity-85'
                      }`}
                    >
                      {newFolderColor === c && <Check size={14} className="text-slate-950" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-theme-muted mb-1">Cover Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. https://images.unsplash.com/..."
                  value={newFolderCover || ''}
                  onChange={(e) => setNewFolderCover(e.target.value || null)}
                  className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-sm text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-theme-accent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-theme-accent hover:bg-theme-hover text-white font-bold rounded-xl transition shadow-lg text-sm"
              >
                Create Folder
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Folder Modal */}
      {editingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-theme-sidebar border border-theme-border rounded-xl p-6 space-y-4 shadow-xl text-theme-text">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center space-x-2">
                <Edit2 size={16} className="text-theme-accent" />
                <span>Edit Folder</span>
              </h3>
              <button
                onClick={() => setEditingFolder(null)}
                className="text-theme-muted hover:text-theme-text"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditFolderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-theme-muted mb-1">Folder Name</label>
                <input
                  type="text"
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                  className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-sm text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-theme-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-theme-muted mb-1.5">Accent Color</label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditFolderColor(c)}
                      style={{ backgroundColor: c }}
                      className={`h-7 rounded-xl relative flex items-center justify-center transition-all duration-150 ${
                        editFolderColor === c ? 'scale-110 ring-2 ring-offset-2 ring-theme-accent' : 'hover:opacity-85'
                      }`}
                    >
                      {editFolderColor === c && <Check size={14} className="text-slate-950" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-theme-muted mb-1">Cover Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. https://images.unsplash.com/..."
                  value={editFolderCover || ''}
                  onChange={(e) => setEditFolderCover(e.target.value || null)}
                  className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-2 text-sm text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-theme-accent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-theme-accent hover:bg-theme-hover text-white font-bold rounded-xl transition text-sm shadow-lg"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Settings Tab (Replacing Local Storage Indicator) */}
      <div className="p-4 border-t border-theme-border mt-auto shrink-0 bg-theme-sidebar transition-all duration-200">
        <button
          onClick={() => onNavigate('settings')}
          className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
            activeSection === 'settings'
              ? 'bg-theme-card text-theme-text font-bold shadow-sm'
              : 'text-theme-muted hover:bg-theme-card hover:text-theme-text'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Settings size={16} className="text-theme-muted" />
            <span>Settings</span>
          </div>
        </button>
      </div>
    </aside>
  </>
);
};
