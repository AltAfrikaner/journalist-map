import { readFileSync, existsSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const pages = readdirSync('articles').filter(x => x.endsWith('.html') && x !== 'index.html');
for (const filename of pages) {
 const html = readFileSync('articles/'+filename,'utf8');
 const cover = html.match(/<img[^>]*src="(\.\.\/assets\/articles\/[^"]+)"[^>]*>/i);
 assert(cover, filename+': published article requires an original cover image');
 const relativePath = cover[1].split(/[?#]/,1)[0].replace(/^\.\.\//,'');
 assert(existsSync(relativePath),filename+': missing image asset '+relativePath);\n assert(!/\\s/.test(relativePath),filename+': invalid image path');
 assert(/property="og:image"/.test(html),filename+': missing social image metadata');
}
console.log('Verified cover image assets and social metadata for '+pages.length+' article(s).');
