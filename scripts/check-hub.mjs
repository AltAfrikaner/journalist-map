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

/* Publication departments must remain independent. */
const investigationPos=html.indexOf('id="investigations"');
const featuredPos=html.indexOf('id="featured"');
const articlesPos=html.indexOf('id="articles"');
const footerPos=html.indexOf('id="site-information"');
assert(featuredPos>0&&investigationPos>featuredPos&&articlesPos>investigationPos&&footerPos>articlesPos,
 'Investigations and articles must be separate, with research before the editorial department');
assert.equal((html.match(/id="articles"/g)||[]).length,1,'Single Articles & Opinion department');
assert(html.includes('href="articles/index.html"'),'Missing independent articles index');
assert(html.includes('class="aa-articles-department"'),'Missing editorial department visual container');
assert(html.includes('class="aa-article-feature"'),'Missing article feature');
assert(!html.slice(investigationPos,articlesPos).includes('tom-eaton-trojan-horse.html'),
 'Opinion article must not be mixed into investigation archive');
const rail=readFileSync('assets/hub-departments.css','utf8');
assert(rail.includes('.hero-rail .rail-story')&&rail.includes('text-decoration: none'),
 'Archive panel headline must use the house typography and avoid browser-default underline');
assert(rail.includes("'Playfair Display'"),'Missing editorial serif heading');
assert(rail.includes('align-self: start'),'Rail must not create tall unused space');
const shared=readFileSync('assets/editorial-shell.js','utf8');
const sharedCss=readFileSync('assets/editorial-shell.css','utf8');
const library=readFileSync('articles/index.html','utf8');
for(const dept of ['investigations','articles'])assert(shared.includes('data-aa-department="'+dept+'"'), 'Missing shared department link '+dept);
assert(shared.includes("currentDepartment.classList.add('is-active')"), 'Department switcher must identify active section');
assert(sharedCss.includes('.aa-editorial-actions a.is-active'), 'Missing active department styling');
assert(library.includes('<h1>Articles &amp; Opinion.</h1>')&&library.includes('href="../index.html#investigations"'),
 'The editorial library must link back to the investigation hub');
console.log('Sections verified: 31 investigations remain separate from the Articles & Opinion library.');

console.log('Hub smoke checks passed: 31 routes preserved, editorial links, discovery, accessibility.');
