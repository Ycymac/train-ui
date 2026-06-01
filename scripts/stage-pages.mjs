import { copyFileSync, cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const pagesDir = resolve(rootDir, 'pages-dist');

rmSync(pagesDir, { recursive: true, force: true });
mkdirSync(pagesDir, { recursive: true });

cpSync(resolve(rootDir, 'web', 'dist'), pagesDir, { recursive: true });
cpSync(resolve(rootDir, 'admin', 'dist'), resolve(pagesDir, 'admin'), { recursive: true });
copyFileSync(resolve(pagesDir, 'index.html'), resolve(pagesDir, '404.html'));
writeFileSync(resolve(pagesDir, '.nojekyll'), '');

console.log(`GitHub Pages artifact staged at ${pagesDir}`);
