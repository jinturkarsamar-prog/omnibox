import re

with open('src/App.tsx', 'r') as f:
    text = f.read()

state_add = """  const [showTagsInFeed, setShowTagsInFeed] = useState<boolean>(() => {
    return localStorage.getItem('omnibox_show_tags') !== 'false';
  });
  const [showPlatformBadges, setShowPlatformBadges] = useState<boolean>(() => {
    return localStorage.getItem('omnibox_show_badges') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('omnibox_show_tags', String(showTagsInFeed));
  }, [showTagsInFeed]);
  useEffect(() => {
    localStorage.setItem('omnibox_show_badges', String(showPlatformBadges));
  }, [showPlatformBadges]);"""

# Add state below showNotesInFeed
text = text.replace("  useEffect(() => {\n    localStorage.setItem('omnibox_show_notes', String(showNotesInFeed));\n  }, [showNotesInFeed]);", "  useEffect(() => {\n    localStorage.setItem('omnibox_show_notes', String(showNotesInFeed));\n  }, [showNotesInFeed]);\n" + state_add)

# Replace SettingsSection
text = text.replace("              showNotesInFeed={showNotesInFeed}\n              setShowNotesInFeed={setShowNotesInFeed}", "              showNotesInFeed={showNotesInFeed}\n              setShowNotesInFeed={setShowNotesInFeed}\n              showTagsInFeed={showTagsInFeed}\n              setShowTagsInFeed={setShowTagsInFeed}\n              showPlatformBadges={showPlatformBadges}\n              setShowPlatformBadges={setShowPlatformBadges}")

# Replace Feed props
feed_replace = "                  showNotesInFeed={showNotesInFeed}\n                  showTagsInFeed={showTagsInFeed}\n                  showPlatformBadges={showPlatformBadges}"
text = text.replace("                  showNotesInFeed={showNotesInFeed}\n                  selectedItemIds={selectedItemIds}", feed_replace + "\n                  selectedItemIds={selectedItemIds}")

# Replace Inbox props
text = text.replace("              showNotesInFeed={showNotesInFeed}", feed_replace)

# Replace Trash props
# We already matched showNotesInFeed above so it should cover Inbox and Trash as well since they use exactly `showNotesInFeed={showNotesInFeed}`
with open('src/App.tsx', 'w') as f:
    f.write(text)

