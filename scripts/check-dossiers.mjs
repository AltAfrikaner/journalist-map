import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const paths=['osf.html','sa_journalists.html','africacheck.html','ifcn.html','sixstage.html','metasuppression.html','iol.html','usaid.html','usaidtonewsroom.html','mtn.html','prototypenation.html','motsepe.html','communists.html','ancliberation.html','wef.html','un.html','mbalula.html','MTNrooivalkIRAN.html'];
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


const newPages=['mtn.html','prototypenation.html','motsepe.html'];
const newTheme=readFileSync('assets/dossier-batch-10-12.css','utf8');
for(const page of newPages){
  assert(newTheme.includes('.aa-premium--'+(page==='prototypenation.html'?'prototype':page.slice(0,-5))), 'Missing page-specific design: '+page);
  const html=readFileSync(page,'utf8');
  assert(html.includes('href="assets/dossier-batch-10-12.css"'), 'Missing scoped styling '+page);
  assert(html.includes('class="aa-story-kicker'), 'Missing story identity '+page);
  assert(html.includes('class="aa-page-links"'), 'Missing series navigation '+page);
  assert(html.includes('href="index.html#investigations"'), 'Missing archive link '+page);
}
assert(newTheme.includes('prefers-reduced-motion'), 'Motion preferences missing in new design');
// Fetch the complete base branch during CI, then verify that original articles,
// source/data references and all interactive code survive the cosmetic upgrade.
const readOriginal=path=>execFileSync('git',['show','origin/main:'+path],{encoding:'utf8',maxBuffer:16*1024*1024});
for(const file of newPages){
  const base=readOriginal(file);
  const now=readFileSync(file,'utf8');
  const extract=(html,regex)=>[...html.matchAll(regex)].map(m=>m[0]);
  const scripts=html=>extract(html,/<script\b[^>]*>[\s\S]*?<\/script>/gi);
  const svg=html=>extract(html,/<svg\b[^>]*>[\s\S]*?<\/svg>/gi);
  const images=html=>extract(html,/<img\b[^>]*>/gi);
  const paragraphs=html=>extract(html,/<p\b[^>]*>[\s\S]*?<\/p>/gi);
  const ids=html=>[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
  assert.deepEqual(scripts(now),scripts(base),'Changed JavaScript: '+file);
  assert.deepEqual(svg(now),svg(base),'Changed SVG research graphic: '+file);
  assert.deepEqual(images(now),images(base),'Changed editorial images: '+file);
  assert.deepEqual(paragraphs(now),paragraphs(base),'Changed original paragraphs: '+file);
  assert.deepEqual(ids(now),ids(base),'Changed JS section hooks: '+file);
  for(const s of ['data:image','<canvas','<iframe','<source'])
    assert.equal(now.split(s).length,base.split(s).length,'Changed interactive asset count: '+file+' '+s);
}


/* Batch 13–15: verify untouched original articles and interactive data. */
const nextBatch=['communists.html','ancliberation.html','wef.html'];
const batchTheme=readFileSync('assets/dossier-batch-13-15.css','utf8');
assert(batchTheme.includes('prefers-reduced-motion'),'Batch 13–15 missing motion fallback');
for(const f of nextBatch){
 const now=readFileSync(f,'utf8');
 const cls=f==='ancliberation.html'?'liberation':f.slice(0,-5);
 assert(now.includes('aa-premium--'+cls),'Missing premium class: '+f);
 assert(now.includes('assets/dossier-batch-13-15.css'),'Missing theme: '+f);
 assert(now.includes('href="index.html#investigations"'),'Missing archive link: '+f);
 assert(batchTheme.includes('.aa-premium--'+cls),'Missing page-specific styles: '+f);
 const base=execFileSync('git',['show','origin/main:'+f],{encoding:'utf8',maxBuffer:16*1024*1024});
 const extract=(s,re)=>[...s.matchAll(re)].map(x=>x[0]);
 for(const [label,re] of [
   ['scripts',/<script\b[^>]*>[\s\S]*?<\/script>/gi],
   ['paragraphs',/<p\b[^>]*>[\s\S]*?<\/p>/gi],
   ['SVG',/<svg\b[^>]*>[\s\S]*?<\/svg>/gi],
   ['images',/<img\b[^>]*>/gi],
   ['element IDs',/\bid=['"][^'"]+['"]/g]
 ])assert.deepEqual(extract(now,re),extract(base,re),'Changed original '+label+' in '+f);
 for(const sign of ['<canvas','data:image','<iframe'])assert.equal(now.split(sign).length,base.split(sign).length,'Changed embedded asset in '+f);
}


/* Investigation 16–18 preservation checks.
 * All investigation wording, source references, imagery and visualisation
 * code should remain byte-identical to the last main baseline.
 */
const batch16=['un.html','mbalula.html','MTNrooivalkIRAN.html'];
const css16=readFileSync('assets/dossier-batch-16-18.css','utf8');
assert(css16.includes('prefers-reduced-motion'),'Batch 16–18 missing reduced motion fallback');
for(const f of batch16){
 const now=readFileSync(f,'utf8');
 const name=f==='MTNrooivalkIRAN.html'?'rooivalk':f.replace('.html','');
 assert(now.includes('aa-premium--'+name),'Missing class '+f);
 assert(now.includes('assets/dossier-batch-16-18.css'),'Missing new stylesheet '+f);
 assert(now.includes('class="aa-page-links"'),'Missing next/prev navigation '+f);
 assert(now.includes('href="index.html#investigations"'),'Missing archive link '+f);
 assert(css16.includes('.aa-premium--'+name),'Missing CSS for '+f);
 const base=execFileSync('git',['show','origin/main:'+f],{encoding:'utf8',maxBuffer:16*1024*1024});
 const extract=(s,re)=>[...s.matchAll(re)].map(x=>x[0]);
 for(const [category,re] of [
  ['paragraphs',/<p\b[^>]*>[\s\S]*?<\/p>/gi],
  ['script blocks',/<script\b[^>]*>[\s\S]*?<\/script>/gi],
  ['SVG diagrams',/<svg\b[^>]*>[\s\S]*?<\/svg>/gi],
  ['image tags',/<img\b[^>]*>/gi],
  ['section IDs',/\bid=["'][^"']+["']/g]
 ])assert.deepEqual(extract(now,re),extract(base,re),'Original '+category+' changed in '+f);
 for(const sig of ['data:image','<canvas','<iframe'])
  assert.equal(now.split(sig).length,base.split(sig).length,'Original embedded visual changed in '+f);
}

console.log('Dossier checks passed: editorial links and research visualisation anchors intact.');
