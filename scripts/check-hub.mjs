import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync('index.html','utf8');
const css=readFileSync('assets/hub-premium.css','utf8');
const js=readFileSync('assets/hub-discovery.js','utf8');
const originalLinks=[...html.matchAll(/<a class="card" href="([^"]+)"/g)].map(m=>m[1]);
assert.equal(originalLinks.length,31,'All 31 investigations must remain discoverable');
assert.equal(new Set(originalLinks).size,31,'Duplicate investigation links');
for(const href of originalLinks){
  assert(!/^(javascript:|data:)/i.test(href),'Unsafe link: '+href);
  if(href.startsWith('http')){assert(href.startsWith('https://'),'HTTPS required: '+href);continue;}
  assert(/^[-\w.]+\.html$/.test(href),'Unexpected investigation route: '+href);
}
for(const required of ['id="investigations"','id="investigation-grid"','id="hub-search"','id="hub-filters"','id="hub-result-count"','id="hub-no-results"','id="site-information"']){
 assert(html.includes(required),'Missing accessible navigation hook '+required);
}
assert(html.includes('href="assets/hub-premium.css"'));
assert(html.includes('src="assets/hub-discovery.js"'));
assert(css.includes('prefers-reduced-motion'),'Missing reduced-motion fallback');
assert(js.includes('card.hidden=!matched'),'Missing progressive filtering');
assert(js.includes("textContent=cat"),'Filter labels must be text-only');

const editorial=readFileSync('assets/hub-editorial.css','utf8');
for(const section of ['class="site-header"','id="featured"','class="spotlight-lead"','class="archive-heading"','id="editorial-standards"']){
  assert(html.includes(section),'Missing editorial homepage element: '+section);
}
const featured=[...html.matchAll(/class="(?:spotlight-lead|spotlight-side-story|rail-story)" href="([^"]+)"/g)].map(m=>m[1]);
assert(featured.length>=4,'Expected feature links');
for(const href of featured){assert(originalLinks.includes(href),'Featured link must be an existing archive route: '+href);}
for(const href of ['mbalula_network.html','https://citizenintel.github.io/AAIT/'])assert(html.includes('href="'+href+'"'));
assert(editorial.includes('color-scheme: light'),'Light editorial palette must be present');
assert(editorial.includes('prefers-reduced-motion'),'Editorial layout must respect reduced motion');
assert(html.includes('href="assets/hub-editorial.css"'),'Missing editorial stylesheet');
assert(html.includes('https://altafrikaner.com/'),'Canonical custom domain missing');
assert.equal((html.match(/<details\b/g)||[]).length,(html.match(/<\/details>/g)||[]).length,'Disclosure element must close');
console.log('Hub smoke checks passed: 31 routes preserved, editorial links, discovery, accessibility.');
