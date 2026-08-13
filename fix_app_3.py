import re

with open('src/App.tsx', 'r') as f:
    text = f.read()

pattern = r"""                  showNotesInFeed=\{showNotesInFeed\}
                  showTagsInFeed=\{showTagsInFeed\}
                  showPlatformBadges=\{showPlatformBadges\}
              setShowNotesInFeed=\{setShowNotesInFeed\}
              showTagsInFeed=\{showTagsInFeed\}
              setShowTagsInFeed=\{setShowTagsInFeed\}
              showPlatformBadges=\{showPlatformBadges\}
              setShowPlatformBadges=\{setShowPlatformBadges\}"""

good = """              showNotesInFeed={showNotesInFeed}
              setShowNotesInFeed={setShowNotesInFeed}
              showTagsInFeed={showTagsInFeed}
              setShowTagsInFeed={setShowTagsInFeed}
              showPlatformBadges={showPlatformBadges}
              setShowPlatformBadges={setShowPlatformBadges}"""

text = text.replace(pattern, good)

with open('src/App.tsx', 'w') as f:
    f.write(text)

