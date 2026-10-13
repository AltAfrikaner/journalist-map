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
console.log('Hub smoke checks passed: 31 routes preserved, safe discovery hooks, reduced motion.');
