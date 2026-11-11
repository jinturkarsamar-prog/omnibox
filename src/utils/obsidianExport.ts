import { Folder, SavedItem } from '../types';

const INVALID_PATH_CHARS = /[\\/:*?"<>|#^[\]\x00-\x1f]/g;

/**
 * Sanitizes a single path segment (file or folder name) for cross-platform Obsidian vaults.
 */
export function sanitizeObsidianName(name: string, fallback = 'Untitled'): string {
  const cleaned = name
    .replace(INVALID_PATH_CHARS, '-')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .slice(0, 90)
    .trim();
  return cleaned || fallback;
}

/**
 * Normalizes a tag string into an Obsidian-compatible tag slug (no leading #, no whitespace).
 */
function toObsidianTag(tag: string): string {
  return tag
    .trim()
    .replace(/^#+/, '')
    .replace(/[^\p{L}\p{N}_/-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Resolves the sanitized folder hierarchy path segments for a given folderId.
 */
export function resolveFolderSegments(folderId: string | null, folders: Folder[]): string[] {
  if (!folderId) return ['Inbox'];

  const folderMap = new Map(folders.map((folder) => [folder.id, folder]));
  const segments: string[] = [];
  const visited = new Set<string>();

  let currentId: string | null = folderId;
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const folder = folderMap.get(currentId);
    if (!folder) break;
    segments.unshift(sanitizeObsidianName(folder.name, 'Folder'));
    currentId = folder.parentId;
  }

  return segments.length > 0 ? segments : ['Inbox'];
}

/**
 * Formats an item as a standalone Obsidian-compatible Markdown note with YAML frontmatter.
 */
export function itemToObsidianMarkdown(item: SavedItem, folders: Folder[]): string {
  const folderPath = resolveFolderSegments(item.folderId, folders).join('/');
  const createdDate = item.createdAt ? item.createdAt.split('T')[0] : '';
  const uniqueTags = Array.from(
    new Set(
      [...item.tags, item.platform.toLowerCase(), item.format.toLowerCase()]
        .map(toObsidianTag)
        .filter(Boolean)
    )
  );

  const frontmatterLines = [
    '---',
    `title: ${JSON.stringify(item.header || 'Untitled')}`,
    `url: ${JSON.stringify(item.url || '')}`,
    `platform: ${JSON.stringify(item.platform)}`,
    `format: ${JSON.stringify(item.format)}`,
    `folder: ${JSON.stringify(folderPath)}`,
    `created: ${JSON.stringify(createdDate)}`,
    'source: "OmniBox"',
  ];

  if (uniqueTags.length > 0) {
    frontmatterLines.push('tags:');
    for (const tag of uniqueTags) {
      frontmatterLines.push(`  - ${JSON.stringify(tag)}`);
    }
  } else {
    frontmatterLines.push('tags: []');
  }
  frontmatterLines.push('---');

  const bodyLines: string[] = [
    '',
    `# ${item.header || 'Untitled'}`,
    '',
    `**Source:** [Open on ${item.platform}](${item.url}) · **Format:** ${item.format} · **Folder:** [[${folderPath}]]`,
  ];

  const previewUrl = item.customPreviewUrl || item.previewUrl;
  if (previewUrl) {
    if (previewUrl.startsWith('data:')) {
      bodyLines.push('', '_Custom local media preview attached in OmniBox._');
    } else if (item.customPreviewType === 'video') {
      bodyLines.push('', `[Preview Media](${previewUrl})`);
    } else {
      bodyLines.push('', `![${sanitizeObsidianName(item.header, 'Preview')}](${previewUrl})`);
    }
  }

  if (item.quoteText && item.quoteText.trim()) {
    const quoted = item.quoteText
      .trim()
      .split(/\r?\n/)
      .map((line) => `> ${line}`)
      .join('\n');
    bodyLines.push('', '> [!quote]', quoted);
  }

  if (item.note && item.note.trim()) {
    bodyLines.push('', '## Notes', '', item.note.trim());
  }

  return `${frontmatterLines.join('\n')}\n${bodyLines.join('\n').trim()}\n`;
}

/**
 * Combines all non-deleted library items into a single Obsidian Markdown document grouped by folder.
 */
export function libraryToSingleObsidianMarkdown(items: SavedItem[], folders: Folder[]): string {
  const activeItems = items.filter((item) => !item.deletedAt);
  const exportDate = new Date().toISOString().split('T')[0];

  const grouped = new Map<string, SavedItem[]>();
  for (const item of activeItems) {
    const folderPath = resolveFolderSegments(item.folderId, folders).join('/');
    const list = grouped.get(folderPath) ?? [];
    list.push(item);
    grouped.set(folderPath, list);
  }

  const lines: string[] = [
    '---',
    `title: "OmniBox Library Export (${exportDate})"`,
    `exported: ${JSON.stringify(new Date().toISOString())}`,
    `total_items: ${activeItems.length}`,
    'source: "OmniBox"',
    '---',
    '',
    `# OmniBox Library Export (${exportDate})`,
    '',
    `Exported ${activeItems.length} saved item${activeItems.length === 1 ? '' : 's'} across ${grouped.size} folder${grouped.size === 1 ? '' : 's'}.`,
  ];

  const sortedFolders = Array.from(grouped.keys()).sort((a, b) => {
    if (a === 'Inbox') return -1;
    if (b === 'Inbox') return 1;
    return a.localeCompare(b);
  });

  for (const folderPath of sortedFolders) {
    lines.push('', `## ${folderPath}`);
    const folderItems = grouped.get(folderPath) ?? [];

    for (const item of folderItems) {
      const hashtags = item.tags
        .map(toObsidianTag)
        .filter(Boolean)
        .map((t) => `#${t}`)
        .join(' ');
      const createdDate = item.createdAt ? item.createdAt.split('T')[0] : '';

      lines.push('', `### [${item.header || 'Untitled'}](${item.url})`);
      lines.push(
        `- **Platform:** ${item.platform} · **Format:** ${item.format}${createdDate ? ` · **Saved:** ${createdDate}` : ''}${hashtags ? ` · ${hashtags}` : ''}`
      );

      if (item.quoteText && item.quoteText.trim()) {
        const quoted = item.quoteText
          .trim()
          .split(/\r?\n/)
          .map((line) => `> ${line}`)
          .join('\n');
        lines.push('', '> [!quote]', quoted);
      }

      if (item.note && item.note.trim()) {
        lines.push('', item.note.trim());
      }
    }
  }

  return `${lines.join('\n')}\n`;
}

/**
 * Generates a safe `.md` filename for a single SavedItem.
 */
export function getItemMarkdownFilename(item: SavedItem): string {
  return `${sanitizeObsidianName(item.header, `omnibox-${item.id}`)}.md`;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date): { dosTime: number; dosDate: number } {
  const year = Math.max(1980, date.getFullYear());
  const dosTime =
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((date.getSeconds() >> 1) & 0x1f);
  const dosDate =
    (((year - 1980) & 0x7f) << 9) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (date.getDate() & 0x1f);
  return { dosTime, dosDate };
}

/**
 * Creates a UTF-8 Store-method (uncompressed) ZIP Blob without external dependencies.
 */
export function createZipBlob(files: Array<{ path: string; content: string }>): Blob {
  const encoder = new TextEncoder();
  const { dosTime, dosDate } = dosDateTime(new Date());
  const UTF8_FLAG = 0x0800;

  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.path);
    const dataBytes = encoder.encode(file.content);
    const checksum = crc32(dataBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true); // Version needed
    lv.setUint16(6, UTF8_FLAG, true); // UTF-8 filename flag
    lv.setUint16(8, 0, true); // Compression method: 0 (store)
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, checksum, true);
    lv.setUint32(18, dataBytes.length, true);
    lv.setUint32(22, dataBytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // Central directory signature
    cv.setUint16(4, 20, true); // Version made by
    cv.setUint16(6, 20, true); // Version needed
    cv.setUint16(8, UTF8_FLAG, true);
    cv.setUint16(10, 0, true); // Store
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, checksum, true);
    cv.setUint32(20, dataBytes.length, true);
    cv.setUint32(24, dataBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    localParts.push(localHeader, dataBytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const blobParts: BlobPart[] = [
    ...localParts.map((part) => new Uint8Array(part)),
    ...centralParts.map((part) => new Uint8Array(part)),
    new Uint8Array(eocd),
  ];

  return new Blob(blobParts, { type: 'application/zip' });
}

/**
 * Packages active library items into an Obsidian vault `.zip` organized by folder hierarchy.
 */
export function buildObsidianVaultZip(items: SavedItem[], folders: Folder[]): Blob {
  const activeItems = items.filter((item) => !item.deletedAt);
  const usedPaths = new Set<string>();
  const files: Array<{ path: string; content: string }> = [];

  for (const item of activeItems) {
    const folderDir = resolveFolderSegments(item.folderId, folders).join('/');
    const baseName = sanitizeObsidianName(item.header, `omnibox-${item.id}`);

    let candidatePath = `${folderDir}/${baseName}.md`;
    let suffix = 2;
    while (usedPaths.has(candidatePath.toLowerCase())) {
      candidatePath = `${folderDir}/${baseName} (${suffix}).md`;
      suffix += 1;
    }
    usedPaths.add(candidatePath.toLowerCase());

    files.push({
      path: candidatePath,
      content: itemToObsidianMarkdown(item, folders),
    });
  }

  return createZipBlob(files);
}

/**
 * Triggers a browser download for a Blob using an ephemeral object URL.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
