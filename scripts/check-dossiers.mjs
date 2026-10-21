import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const paths=['osf.html','sa_journalists.html','africacheck.html','ifcn.html','sixstage.html','metasuppression.html','iol.html','usaid.html','usaidtonewsroom.html'];
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
  if(file==='iol.html')assert(html.includes('id="ownership"')&&html.includes('id="evidence"'),'IOL interactives missing');
  if(file==='usaid.html')assert(html.includes('id="network3d"')&&html.includes('id="sources"'),'USAID interactive network/sources missing');
  if(file==='usaidtonewsroom.html')assert(html.includes('class="tracks"')&&html.includes('class="convergence"'),'Two-track infographic missing');
  if(file==='ifcn.html')assert(html.includes('id="particles"'),'IFCN visualisation removed');
  if(file==='sixstage.html')assert((html.match(/class="stage"/g)||[]).length===6,'Six stages must remain');
  if(file==='metasuppression.html')assert((html.match(/class="stage stage-/g)||[]).length===6,'Six stages must remain');
}

import {execFileSync} from 'node:child_process';
// On pull requests, the baseline is the checked-out main tree. Assert original
// data-bearing JS/SVG/images are unchanged in the newly upgraded files.
for(const file of ['iol.html','usaid.html','usaidtonewsroom.html']){
  let baseline;
  try {baseline=execFileSync('git',['show','origin/main:'+file],{encoding:'utf8',maxBuffer:12*1024*1024});}
  catch {continue;} // manual runs without origin/main still use static structural checks
  const latest=readFileSync(file,'utf8');
  const blocks=html=>[...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map(m=>m[0]);
  assert.deepEqual(blocks(latest),blocks(baseline),'Original script changed in '+file);
  const ids=html=>[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
  assert.deepEqual(ids(latest),ids(baseline),'Original IDs changed in '+file);
  for(const sig of ['<svg','<canvas','data:image','class="track','class="node','class="tl-ev','class="tab'])
    assert.equal(latest.split(sig).length,baseline.split(sig).length,'Visual/data component changed: '+file+' '+sig);
}

console.log('Dossier checks passed: editorial links and research visualisation anchors intact.');
