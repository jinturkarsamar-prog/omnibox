import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('dist/index.html', 'utf8');

// I can't easily parse react components to dom without rendering.
