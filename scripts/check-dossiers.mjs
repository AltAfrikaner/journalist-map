import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const paths=['osf.html','sa_journalists.html','africacheck.html','ifcn.html','sixstage.html','metasuppression.html'];
const css=readFileSync('assets/dossier-editorial.css','utf8');
assert(css.includes('prefers-reduced-motion'),'Missing motion safety');
assert(css.includes('.aa-page-links'),'Missing page navigation styles');
const seen=new Set();
for(const file of paths){
  assert(existsSync(file),'Missing investigation: '+file);
  const html=readFileSync(file,'utf8');
  assert(html.includes('class="aa-premium'),'Missing premium class '+file);
  assert(html.includes('href="assets/dossier-editorial.css"'),'Missing CSS include '+file);
  assert(html.includes('class="aa-page-links"'),'Missing chapter links '+file);
  assert(html.includes('https://altafrikaner.com/'+file),'Missing canonical '+file);
  assert(html.match(/<h1\b/),'Missing title: '+file);
  const fileLinks=[...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(x=>x[1]);
  for(const href of fileLinks.filter(x=>/^[^#?:/]+\.html(?:#.*)?$/.test(x))){
    const path=href.split('#')[0];
    assert(existsSync(path),'Broken internal HTML link: '+file+' -> '+path);
  }
  assert(!seen.has(file),'Duplicate file');
  seen.add(file);
  if(file==='osf.html'||file==='sa_journalists.html'){
    assert(html.includes('new THREE'),'3D graph source removed: '+file);
  }
  if(file==='africacheck.html')assert(html.includes('id="sources"'),'Sources removed');
  if(file==='ifcn.html')assert(html.includes('id="particles"'),'IFCN visualisation removed');
  if(file==='sixstage.html')assert((html.match(/class="stage"/g)||[]).length===6,'Six stages must remain');
  if(file==='metasuppression.html')assert((html.match(/class="stage stage-/g)||[]).length===6,'Six stages must remain');
}
console.log('Dossier checks passed: editorial links and research visualisation anchors intact.');
