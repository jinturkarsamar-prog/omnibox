import re

with open('src/App.tsx', 'r') as f:
    text = f.read()

state_add = """  const [gallerySize, setGallerySize] = useState<'comfortable' | 'standard' | 'compact'>(() => {
    return (localStorage.getItem('omnibox_gallery_size') as any) || 'standard';
  });
  const [listDensity, setListDensity] = useState<'comfortable' | 'compact'>(() => {
    return (localStorage.getItem('omnibox_list_density') as any) || 'comfortable';
  });
  const [showNotesInFeed, setShowNotesInFeed] = useState<boolean>(() => {
    return localStorage.getItem('omnibox_show_notes') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('omnibox_gallery_size', gallerySize);
  }, [gallerySize]);
  useEffect(() => {
    localStorage.setItem('omnibox_list_density', listDensity);
  }, [listDensity]);
  useEffect(() => {
    localStorage.setItem('omnibox_show_notes', String(showNotesInFeed));
  }, [showNotesInFeed]);"""

text = text.replace("const [layout, setLayout] = useState<'gallery' | 'list'>(() => {\n    return (localStorage.getItem('omnibox_layout') as any) || 'gallery';\n  });", "const [layout, setLayout] = useState<'gallery' | 'list'>(() => {\n    return (localStorage.getItem('omnibox_layout') as any) || 'gallery';\n  });\n" + state_add)

# Pass settings to SettingsSection
text = text.replace("<SettingsSection\n              layout={layout}\n              setLayout={setLayout}", "<SettingsSection\n              layout={layout}\n              setLayout={setLayout}\n              gallerySize={gallerySize}\n              setGallerySize={setGallerySize}\n              listDensity={listDensity}\n              setListDensity={setListDensity}\n              showNotesInFeed={showNotesInFeed}\n              setShowNotesInFeed={setShowNotesInFeed}")

# Also pass to Feed
feed_replacements = ["<Feed\n                  items={filteredItems}\n                  folders={folders}\n                  tags={tags}\n                  layout={layout}", "<Feed\n                  items={filteredItems}\n                  folders={folders}\n                  tags={tags}\n                  layout={layout}\n                  gallerySize={gallerySize}\n                  listDensity={listDensity}\n                  showNotesInFeed={showNotesInFeed}"]
for rep in feed_replacements:
    text = text.replace("<Feed\n                  items={filteredItems}\n                  folders={folders}\n                  tags={tags}\n                  layout={layout}", rep)

# Pass to InboxSection
text = text.replace("<InboxSection\n              inboxItems={inboxItems}", "<InboxSection\n              inboxItems={inboxItems}\n              gallerySize={gallerySize}\n              listDensity={listDensity}\n              showNotesInFeed={showNotesInFeed}")

# Pass to TrashSection
text = text.replace("<TrashSection\n              trashItems={trashItems}", "<TrashSection\n              trashItems={trashItems}\n              gallerySize={gallerySize}\n              listDensity={listDensity}\n              showNotesInFeed={showNotesInFeed}")

with open('src/App.tsx', 'w') as f:
    f.write(text)

