import re

# Update SettingsSection
with open('src/components/SettingsSection.tsx', 'r') as f:
    text = f.read()

settings_props = """interface SettingsSectionProps {
  layout: 'gallery' | 'list';
  setLayout: (l: 'gallery' | 'list') => void;
  gallerySize: 'comfortable' | 'standard' | 'compact';
  setGallerySize: (s: 'comfortable' | 'standard' | 'compact') => void;
  listDensity: 'comfortable' | 'compact';
  setListDensity: (s: 'comfortable' | 'compact') => void;
  showNotesInFeed: boolean;
  setShowNotesInFeed: (s: boolean) => void;"""

text = re.sub(r"interface SettingsSectionProps \{[\s\S]*?setLayout: \(l: 'gallery' \| 'list'\) => void;", settings_props, text)

destructuring = """export const SettingsSection: React.FC<SettingsSectionProps> = ({
  layout,
  setLayout,
  gallerySize,
  setGallerySize,
  listDensity,
  setListDensity,
  showNotesInFeed,
  setShowNotesInFeed,"""

text = re.sub(r"export const SettingsSection: React\.FC<SettingsSectionProps> = \(\{\s*layout,\s*setLayout,", destructuring, text)

with open('src/components/SettingsSection.tsx', 'w') as f:
    f.write(text)

# Update Feed
with open('src/components/Feed.tsx', 'r') as f:
    text = f.read()

feed_props = """  layout: 'gallery' | 'list';
  gallerySize?: 'comfortable' | 'standard' | 'compact';
  listDensity?: 'comfortable' | 'compact';
  showNotesInFeed?: boolean;"""

text = re.sub(r"\s*layout: 'gallery' \| 'list';", feed_props, text)

feed_destruct = """  layout,
  gallerySize = 'standard',
  listDensity = 'comfortable',
  showNotesInFeed = true,"""

text = re.sub(r"\s*layout,", feed_destruct, text)

with open('src/components/Feed.tsx', 'w') as f:
    f.write(text)


# Update InboxSection
with open('src/components/InboxSection.tsx', 'r') as f:
    text = f.read()

inbox_props = """  layout: "gallery" | "list";
  setLayout: (l: "gallery" | "list") => void;
  gallerySize?: 'comfortable' | 'standard' | 'compact';
  listDensity?: 'comfortable' | 'compact';
  showNotesInFeed?: boolean;"""

text = re.sub(r"\s*layout: \"gallery\" \| \"list\";\n\s*setLayout: \(l: \"gallery\" \| \"list\"\) => void;", inbox_props, text)

inbox_destruct = """  layout,
  setLayout,
  gallerySize = 'standard',
  listDensity = 'comfortable',
  showNotesInFeed = true,"""

text = re.sub(r"\s*layout,\n\s*setLayout,", inbox_destruct, text)

text = text.replace("<Feed\n            items={inboxItems}", "<Feed\n            items={inboxItems}\n            gallerySize={gallerySize}\n            listDensity={listDensity}\n            showNotesInFeed={showNotesInFeed}")

with open('src/components/InboxSection.tsx', 'w') as f:
    f.write(text)


# Update TrashSection
with open('src/components/TrashSection.tsx', 'r') as f:
    text = f.read()

trash_props = """  layout: "gallery" | "list";
  setLayout: (l: "gallery" | "list") => void;
  gallerySize?: 'comfortable' | 'standard' | 'compact';
  listDensity?: 'comfortable' | 'compact';
  showNotesInFeed?: boolean;"""

text = re.sub(r"\s*layout: \"gallery\" \| \"list\";\n\s*setLayout: \(l: \"gallery\" \| \"list\"\) => void;", trash_props, text)

trash_destruct = """  layout,
  setLayout,
  gallerySize = 'standard',
  listDensity = 'comfortable',
  showNotesInFeed = true,"""

text = re.sub(r"\s*layout,\n\s*setLayout,", trash_destruct, text)

text = text.replace("<Feed\n             items={trashItems}", "<Feed\n             items={trashItems}\n             gallerySize={gallerySize}\n             listDensity={listDensity}\n             showNotesInFeed={showNotesInFeed}")

with open('src/components/TrashSection.tsx', 'w') as f:
    f.write(text)

