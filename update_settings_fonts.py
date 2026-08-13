import re

with open('src/components/SettingsSection.tsx', 'r') as f:
    text = f.read()

# Update Sans fonts
sans_pattern = r"(<option value='\"Montserrat\", sans-serif'>Montserrat \(Modern\)<\/option>)"
new_sans = r"""\1
                    <option value='"Nunito", sans-serif'>Nunito (Rounded)</option>
                    <option value='"Open Sans", sans-serif'>Open Sans (Classic)</option>
                    <option value='"Oswald", sans-serif'>Oswald (Condensed)</option>
                    <option value='"Raleway", sans-serif'>Raleway (Elegant)</option>
                    <option value='"Ubuntu", sans-serif'>Ubuntu (Friendly)</option>"""

text = re.sub(sans_pattern, new_sans, text)

# Update Display fonts
display_pattern = r"(<option value='\"Baloo 2\", cursive'>Baloo 2 \(Bubbly\)<\/option>)"
new_display = r"""\1
                    <option value='"Lobster", cursive'>Lobster (Script)</option>
                    <option value='"Anton", sans-serif'>Anton (Bold Display)</option>
                    <option value='"Cormorant Garamond", serif'>Cormorant (Refined)</option>
                    <option value='"Alfa Slab One", cursive'>Alfa Slab One (Heavy)</option>"""

text = re.sub(display_pattern, new_display, text)

# Update Mono fonts
mono_pattern = r"(<option value='\"IBM Plex Mono\", monospace'>IBM Plex Mono<\/option>)"
new_mono = r"""\1
                    <option value='"Space Mono", monospace'>Space Mono</option>
                    <option value='"Inconsolata", monospace'>Inconsolata</option>
                    <option value='"Anonymous Pro", monospace'>Anonymous Pro</option>
                    <option value='"Ubuntu Mono", monospace'>Ubuntu Mono</option>"""

text = re.sub(mono_pattern, new_mono, text)

with open('src/components/SettingsSection.tsx', 'w') as f:
    f.write(text)

