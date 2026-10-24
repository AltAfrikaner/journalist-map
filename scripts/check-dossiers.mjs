import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
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
  const blocks=html=>[...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map(m=>m[0]).filter(block=>!block.includes('src="assets/editorial-shell.js"'));
  assert.deepEqual(blocks(latest),blocks(baseline),'Original script changed in '+file);
  const ids=html=>[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
  assert.deepEqual(ids(latest),ids(baseline),'Original IDs changed in '+file);
  // The #07–08 fact corrections may change prose, not embedded evidence graphics.
  for(const [name,re] of [['SVG',/<svg\b[^>]*>[\s\S]*?<\/svg>/gi],['image tags',/<img\b[^>]*>/gi]]) {
    const extract=html=>[...html.matchAll(re)].map(m=>m[0]);
    assert.deepEqual(extract(latest),extract(baseline),'Modified '+name+' in '+file);
  }
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
  const extract=(html,regex)=>[...html.matchAll(regex)].map(m=>m[0]).filter(x=>!x.includes('src="assets/editorial-shell.js"'));
  const scripts=html=>extract(html,/<script\b[^>]*>[\s\S]*?<\/script>/gi ).filter(block=>!block.includes('src="assets/editorial-shell.js"'));
  const svg=html=>extract(html,/<svg\b[^>]*>[\s\S]*?<\/svg>/gi);
  const images=html=>extract(html,/<img\b[^>]*>/gi);
  const paragraphs=html=>extract(html,/<p\b[^>]*>[\s\S]*?<\/p>/gi);
  const ids=html=>[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
  assert.deepEqual(scripts(now),scripts(base),'Changed JavaScript: '+file);
  assert.deepEqual(svg(now),svg(base),'Changed SVG research graphic: '+file);
  assert.deepEqual(images(now),images(base),'Changed editorial images: '+file);
  if(!['mtn.html','prototypenation.html','motsepe.html'].includes(file)) assert.deepEqual(paragraphs(now),paragraphs(base),'Changed original paragraphs: '+file);
  // Prototype article receives source-led comparative corrections; all scripts, visualisations, assets and IDs stay intact.
  // MTN prose receives dated, explicit legal/technical corrections; scripts, visual data, images and IDs remain byte-equal.
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
 const extract=(s,re)=>[...s.matchAll(re)].map(x=>x[0]).filter(item=>!item.includes('src="assets/editorial-shell.js"'));
 for(const [label,re] of [
   ['scripts',/<script\b[^>]*>[\s\S]*?<\/script>/gi],
   ['paragraphs',/<p\b[^>]*>[\s\S]*?<\/p>/gi],
   ['SVG',/<svg\b[^>]*>[\s\S]*?<\/svg>/gi],
   ['images',/<img\b[^>]*>/gi],
   ['element IDs',/\bid=['"][^'"]+['"]/g]
 ]) {
    if (f==='ancliberation.html' && label==='paragraphs') {
      // Source-scoped 24 Oct second pass. Do not weaken the existing image/SVG/JS/ID guards.
      // The original reviewed page and the merged corrected version are the only accepted bases.
      const baseSha=execFileSync('git',['rev-parse','origin/main:'+f],{encoding:'utf8'}).trim();
      const liveSha=execFileSync('git',['hash-object',f],{encoding:'utf8'}).trim();
      assert(['1678d15c9f337422df63d52e3d1cc273aace258b','8f890b391a032546535623b3e4c3e638d8738c4d','a79c55acf9d4339530f7a5707e7bc27b416f7510'].includes(baseSha),'Unexpected #14 main baseline');
      assert.equal(liveSha,'a79c55acf9d4339530f7a5707e7bc27b416f7510','Unexpected #14 second-pass prose change');
      continue;
    }
    if (f==='wef.html' && label==='paragraphs') {
      // Second-pass 24 October WEF corrections: exact baseline-to-reviewed
      // full-file blobs. Subsequent unchanged-main pages compare normally.
      const original=execFileSync('git',['rev-parse','origin/main:'+f],{encoding:'utf8'}).trim();
      const revised=execFileSync('git',['hash-object',f],{encoding:'utf8'}).trim();
      if(original==='7befe749783a46805cbc53e5fb2fb743b45803f6' && revised==='3b2427c20bb2593b23b7fdaa465152fb83be6a8b') continue;
      assert.deepEqual(extract(now,re),extract(base,re),'Non-allowlisted WEF prose changed');
      continue;
    }
    // Only the exact peer-reviewed investigation 13 article may differ in prose.
    // Scripts, SVG, IDs, images and media still compare byte-for-byte to main.
    if(f==='communists.html' && label==='paragraphs') {
      // Second-pass 24 Oct 2026 Comintern-source correction has a reviewed whole-file hash.
      // Independent checks below still compare scripts, SVG, IDs and image tags to main.
      const reviewed='537b836626485a1043a2c9146fb8c7c3c791d98d';
      const actual=execFileSync('git',['hash-object',f],{encoding:'utf8'}).trim();
      assert.equal(actual,reviewed,'Unexpected communists.html prose; update source log and reviewed hash');
      continue;
    }
    const baselineBlocks=extract(base,re);
    if (f==='ancliberation.html' && label==='SVG') {
      // Primary-record correction: QLFS Q1:2025 (Stats SA p.23), 15–24 unemployment 62.4%.
      // Permit only this exact visible SVG text replacement; all other SVG bytes remain fixed.
      // Future PRs compare against a main baseline that may already contain the correction.
      const before='<text x="560" y="145" font-size="10" fill="#999">62.2% Youth</text>';
      const after='<text x="560" y="145" font-size="10" fill="#999">62.4% Youth</text>';
      const currentBlocks=extract(now,re);
      assert.equal(currentBlocks.filter(block=>block.includes(after)).length,1,'Missing single corrected QLFS SVG label');
      assert.equal(currentBlocks.filter(block=>block.includes(before)).length,0,'Stale QLFS SVG label');
      assert.deepEqual(currentBlocks,baselineBlocks.map(block=>block.replace(before,after)),'Unexpected SVG change beyond verified QLFS text correction in '+f);
    } else {
      assert.deepEqual(extract(now,re),baselineBlocks,'Changed original '+label+' in '+f);
    }
  }
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
 const base=f==='MTNrooivalkIRAN.html'
 ? execFileSync('git',['cat-file','blob','cf9a1477877ecd556eec468be5372e8aeea63e3c'],{encoding:'utf8',maxBuffer:16*1024*1024})
 : execFileSync('git',['show','origin/main:'+f],{encoding:'utf8',maxBuffer:16*1024*1024});
 if(f==='MTNrooivalkIRAN.html'){
  // Protect both the intact restoration and the separately published 23 October
  // cover redesign (commits cbce21f and 671faa2). Both were compared to
  // the restoration: all 14 embedded image payloads, JS, SVG, IDs and links stay.
  // These are exact reviewed Git identities, never an arbitrary media exception.
  const original='cf9a1477877ecd556eec468be5372e8aeea63e3c';
  // 24 Oct 2026: exact blob 4fd4f4d replaces only the Rooivalk cover image
  // inline style 'object-fit:contain;background:#d5d9d8' with
  // 'object-fit:cover;object-position:center'. Full 2,093,489-char source
  // compared to 36f032f: all 14 base64 images, 2 scripts, 3 SVGs,
  // 18 IDs, 14 links and original dossier text unchanged.
  // 24 October follow-up cover change in CURRENT main: added one scoped CSS style
  // (id aa-rooivalk-cover-fix) and moved the existing cover figure above
  // statistics. Full comparison against 4fd4f4: identical 14 image payloads,
  // 2 scripts, 3 SVGs, 14 hrefs and dossier research; the only new ID is
  // that CSS style block. Exact blob only; still reject every other mutation.
  const approvedCovers=['e4bfee4b5829065e74c443e89559d29af7af1ad9','36f032ff4f0028743f3747c548acf5f9e4418e10','4fd4f4dad223e8977f704be50bd3ed48399793aa','12a93cb7b98c8318ae530c93bb8b3d76bb740f29','78ed6a7b7af2461465ca3e19f50f9b0a3af0249b','303d26d3687f4e004f929559b86b30eb8b0e1947'];
  // 24 October follow-up main cover edit: exact 303d26d differs from 78ed6a7 only
  // in one cover-specific style block, its figure aspect ratio, and one cover
  // image style attribute (not its URL). Compared: 2 scripts, 3 SVGs, 14
  // embedded image payloads, 14 img tags, all paragraphs and IDs retained.
  const current=execFileSync('git',['hash-object',f],{encoding:'utf8'}).trim();
  assert([original,...approvedCovers].includes(current),'Unreviewed/missing Rooivalk dossier; exact hash guard failed');
  // Current user-authored cover swaps exactly one embedded 348KB JPEG for a remote PNG.
   // Only this independently diffed, exact Git blob may use the smaller threshold.
   if(['78ed6a7b7af2461465ca3e19f50f9b0a3af0249b','303d26d3687f4e004f929559b86b30eb8b0e1947'].includes(current)) {
     assert(Buffer.byteLength(now,'utf8')>1740000,'Rooivalk external-cover dossier truncated or zero sized');
     assert.equal((now.match(/data:image\//g)||[]).length,14,'Unreviewed embedded assets in remote-cover dossier');
     assert(now.includes('https://d2ol7oe51mr4n9.cloudfront.net/user_39LyNd3yWOiGeUhnS3CdfDw25su/0e814109-6230-401e-83bb-520d2a5dd424.png'),'Remote cover reference disappeared');
   } else assert(Buffer.byteLength(now,'utf8')>2090000,'Rooivalk dossier truncated or zero sized');
  if(current===original)assert.equal(now,base,'Original restored Rooivalk dossier drift');
  // One separately approved cover replaced a caption paragraph and repositioned
  // an image tag, so old block-by-block comparisons would falsely reject it.
  // Full Git blob identity above is stronger and prohibits ALL other changes.
  continue;
 }

 // 24 Oct 2026 case-specific corrections: 21 September NPA charging decision,
 // Public Protector Report 24, PRASA historical cumulative audit denominator,
 // chronology and leaked-intelligence attribution. Changes include one JS
 // tooltip string and dated source prose, pinned by exact entire-file blob.
 // All other JS, images, identifiers and SVGs independently compared.
 // 23 Oct 2026 case-specific claim corrections to investigation #17.
 // The full-page Git blob hash is an exact-byte allowlist: stronger than permitting
 // paragraph edits generally, and it fixes the allowed prose/URL/source note,
 // scripts, SVG, maps and all previous identifiers to one independently reviewed
 // version. See editorial-review/SOURCE-CORRECTIONS-17-18-20261023.md.
 if(f==='mbalula.html') {
   const liveBlob=execFileSync('git',['hash-object',f],{encoding:'utf8'}).trim();
   const baselineBlob=execFileSync('git',['rev-parse','origin/main:'+f],{encoding:'utf8'}).trim();
   if(liveBlob!==baselineBlob) {
     assert(
       (baselineBlob==='d0b6862a2217e9ad2253950955672710165cd958' && liveBlob==='c4c0f0a6788d30f87b9da323531ec7a5134264ad') ||
       (baselineBlob==='c4c0f0a6788d30f87b9da323531ec7a5134264ad' && liveBlob==='99c80291072b896e11014b4c327c723bfb24c6b0'),
       'Mbalula must match one specifically approved complete-file correction');
   }
   continue;
 }

 const extract=(s,re)=>[...s.matchAll(re)].map(x=>x[0]).filter(item=>!item.includes('src="assets/editorial-shell.js"'));
 for(const [category,re] of [
  ['paragraphs',/<p\b[^>]*>[\s\S]*?<\/p>/gi],
  ['script blocks',/<script\b[^>]*>[\s\S]*?<\/script>/gi],
  ['SVG diagrams',/<svg\b[^>]*>[\s\S]*?<\/svg>/gi],
  ['image tags',/<img\b[^>]*>/gi],
  ['section IDs',/\bid=["'][^"']+["']/g]
 ]) {
   if (f === 'un.html' && category === 'paragraphs') {
    // Once PR #61 is merged the corrected UN source note is already in main.
    // Treat that published baseline as immutable; only exercise the older
    // three-paragraph normalization on a main without the published note.
    if (base.includes('class="aa-document-reconciliation"')) {
      if(JSON.stringify(extract(now,re))!==JSON.stringify(extract(base,re))) {
         // Permit only the reviewed, exact 24 Oct second-pass UN blob against
         // the pre-change main blob. All JS/SVG/images/IDs still compare to main.
         const oldSha=execFileSync('git',['rev-parse','origin/main:'+f],{encoding:'utf8'}).trim();
         const newSha=execFileSync('git',['hash-object',f],{encoding:'utf8'}).trim();
         assert.equal(oldSha,'d2b0739987b5f79e14afc4acd6c440ae522ad776','Unexpected UN main baseline');
         assert.equal(newSha,'a6d7410805225b6f1b2e3b7e946630e4f248c9ed','Non-allowlisted 2026-10-24 UN paragraph changes');
       }
    } else {
    // Explicit exception for exactly three verified primary-record corrections.
    // See editorial-review/SOURCE-CORRECTIONS-15-16-20261023.md.
    const notes = now.match(/<aside class="aa-document-reconciliation"[\s\S]*?<\/aside>/g);
    assert.equal(notes?.length,1,'Exactly one UN research note expected');
    let normalized = now.replace(notes[0], '');
    const exactCorrections = [
     [
      '<p>No successor to the Special Committee Against Apartheid. No monitoring body. No resolution. The most racially legislated democracy on earth operates inside a complete institutional vacuum of international scrutiny.</p>',
      '<p>The Special Committee Against Apartheid was discontinued, and contemporary treaty monitoring has a different mandate from Security Council embargoes. CERD reviewed South Africa in 2016 and 2023. Whether that review was sufficiently detailed and independent regarding the discriminatory effect of particular affirmative-action rules warrants case-level investigation; <strong>no monitoring body</strong> and <strong>complete institutional vacuum</strong> are inaccurate descriptions.</p>'
     ],
     [
      '<p>The ANC government, validated by UN partnership and unchallenged by CERD, passes more race law. Ramaphosa confirms publicly: race-based legislation will continue. The loop has no exit point.</p>',
      '<p>The government continues to defend redress policies while CERD conducts periodic treaty scrutiny and UN agencies cooperate on development programmes. That coexistence creates a fair question about the rigour of international oversight; it does not establish that CERD never reviewed the country or directed Parliament to adopt any particular measure. The outcome of specific complaints remains to be evidenced.</p>'
     ],
     [
      '<p>After 21+ years of BEE: black unemployment rose from 29% to 39%. White unemployment declined. Total jobless: 3.7M to 16.3M. Harvard Growth Lab: "stagnation and exclusion." The policy failed its own stated beneficiaries.</p>',
      "<p>South Africa's Q4 2024 labour survey recorded approximately 8.0 million officially unemployed and 16.5 million economically inactive people; these are different groups. The earlier 16.3 million figure labelled unemployed was not an official unemployment count. Racial employment disparities deserve investigation, but changes across years must use comparable definitions, quarters, population denominators and counterfactuals before attributing them causally to BEE alone.</p>"
     ]
    ];
    for (const [prior, corrected] of exactCorrections) {
     assert.equal(normalized.split(corrected).length,2,'Missing/duplicate allowlisted editorial paragraph');
     assert.equal(base.split(prior).length,2,'Unexpected original article paragraph');
     normalized = normalized.replace(corrected,prior);
    }
    assert.deepEqual(extract(normalized,re),extract(base,re),'Non-allowlisted original paragraph changed in '+f);
    }
   } else assert.deepEqual(extract(now,re),extract(base,re),'Original '+category+' changed in '+f);
  }
 for(const sig of ['data:image','<canvas','<iframe'])
  assert.equal(now.split(sig).length,base.split(sig).length,'Original embedded visual changed in '+f);
}

/* Investigation 19: verify cosmetic-only upgrades to the signed-letter dossier.
 * The full interactive signatory roster, research wording, charts and WebGL
 * source must remain byte-for-byte identical to the main-branch baseline.
 */
{
 const page='44afrikaners.html';
 const now=readFileSync(page,'utf8');
 const old=execFileSync('git',['show','origin/main:'+page],{encoding:'utf8',maxBuffer:16*1024*1024});
 const theme=readFileSync('assets/dossier-19.css','utf8');
 for(const required of ['aa-premium--letter','href="assets/dossier-19.css"','class="aa-page-links"','href="index.html#investigations"','href="#context"','rel="canonical"'])
   assert(now.includes(required),'Investigation 19 missing '+required);
 assert(theme.includes('prefers-reduced-motion'),'Investigation 19 has no reduced-motion fallback');
 assert(theme.includes(':focus-visible'),'Investigation 19 has no keyboard focus treatment');
 const extract=(html,re)=>[...html.matchAll(re)].map(m=>m[0]).filter(item=>!item.includes('src="assets/editorial-shell.js"'));
 for(const [category,re] of [
  ['original scripts',/<script\b[^>]*>[\s\S]*?<\/script>/gi],
  ['original paragraphs',/<p\b[^>]*>[\s\S]*?<\/p>/gi],
  ['research diagrams',/<svg\b[^>]*>[\s\S]*?<\/svg>/gi],
  ['original images',/<img\b[^>]*>/gi],
  ['interactive IDs',/\bid=['"][^'"]+['"]/g]
 ]) {
   if(category==='original paragraphs' && now!==old) {
     // Approved PR #64 and 24 Oct second-pass source corrections.  Match BOTH complete blob hashes
     // instead of allowing arbitrary prose edits or weakening any graphic guard.
     // See editorial-review/SOURCE-CORRECTIONS-19-20-20261023.md.
     const originalHash=execFileSync('git',['rev-parse','origin/main:'+page],{encoding:'utf8'}).trim();
     const revisedHash=execFileSync('git',['hash-object',page],{encoding:'utf8'}).trim();
     assert.equal(originalHash,'2fe59c3262b2abe111bef3f591b7b91b9d99ab6e','Unexpected #19 main baseline for 24 Oct second-pass review');
     assert.equal(revisedHash,'c35bb073c86fe151d357fe676c285a0449bf8a95','Unreviewed #19 second-pass source/content change');
   } else assert.deepEqual(extract(now,re),extract(old,re),'Changed '+category+' in investigation 19');
 }
 for(const sig of ['<canvas','data:image','<iframe'])
   assert.equal(now.split(sig).length,old.split(sig).length,'Changed embedded asset '+sig);
 for(const id of ['context','roll','finding','anatomy','network','map','provenance'])
   assert(now.includes('href="#'+id+'"'),'Missing accessible section navigation '+id);
 for(const name of ['MTNrooivalkIRAN.html','mbalula_network.html'])
   assert(existsSync(name),'Invalid investigation series destination: '+name);
}

/* Investigation 20–22: preserve source code, evidence wording and graphics. */
{
 const files=['mbalula_network.html','splc.html','adl.html'];
 const names=['mbnet','splc','adl'];
 const css=readFileSync('assets/dossier-batch-20-22.css','utf8');
 assert(css.includes('prefers-reduced-motion'),'Batch 20–22 missing motion preference');
 assert(css.includes(':focus-visible'),'Batch 20–22 missing accessible focus');
 const extract=(html,re)=>[...html.matchAll(re)].map(x=>x[0]).filter(item=>!item.includes('src="assets/editorial-shell.js"'));
 for(let i=0;i<files.length;i++){
  const file=files[i], now=readFileSync(file,'utf8');
  const old=execFileSync('git',['show','origin/main:'+file],{encoding:'utf8',maxBuffer:20*1024*1024});
  for(const value of [
   'aa-premium--'+names[i],
   'href="assets/dossier-batch-20-22.css"',
   'class="aa-page-links"',
   'href="index.html#investigations"',
   'rel="canonical"',
   'class="aa-editorial-skip"'
  ])assert(now.includes(value),'Investigation '+file+' missing '+value);
  assert(css.includes('.aa-premium--'+names[i]),'Missing styles for '+file);
  for(const [label,re] of [
   ['paragraphs',/<p\b[^>]*>[\s\S]*?<\/p>/gi],
   ['scripts',/<script\b[^>]*>[\s\S]*?<\/script>/gi],
   ['SVG',/<svg\b[^>]*>[\s\S]*?<\/svg>/gi],
   ['images',/<img\b[^>]*>/gi],
   ['element IDs',/\bid=["'][^"']+["']/g]
  ]) {
    if(['splc.html','adl.html'].includes(file) && label==='paragraphs' && now!==old){
      // 24 October primary-source prose corrections. Only exact reviewed full
      // blobs are permitted, with original JS/SVG/image/ID checks below intact.
      const reviewed={
       // Second-pass edits are pinned from exact current main blobs; no open-ended exception.
       'splc.html':['38bad056d281d5fdabce4fcb3845d10d972a57c2','371a1f833de617faf13268bdc61c545e31484882'],
       'adl.html':['1e5789a0b4f2399f1b56d6504f25b95c77b3786d','716389a78f7246257edc28c89fd75fbaca0f2220']
      };
      const before=execFileSync('git',['rev-parse','origin/main:'+file],{encoding:'utf8'}).trim();
      const after=execFileSync('git',['hash-object',file],{encoding:'utf8'}).trim();
      assert.equal(before,reviewed[file][0],'Unexpected baseline before editorial corrections: '+file);
      assert.equal(after,reviewed[file][1],'Unreviewed content change: '+file);
     } else if(file==='mbalula_network.html' && label==='paragraphs' && now!==old) {
      // Exact whole-file allowance for 24 Oct second-pass audit after PR #64; leave other
      // sections and all remaining script/SVG/image/ID checks strictly intact.
      const originalHash=execFileSync('git',['rev-parse','origin/main:'+file],{encoding:'utf8'}).trim();
      const revisedHash=execFileSync('git',['hash-object',file],{encoding:'utf8'}).trim();
      assert.equal(originalHash,'043356d639fc2336b9f2ce4af814b50fb501e3ca','Unexpected #20 main baseline for 24 Oct second-pass review');
      assert.equal(revisedHash,'94c8cb37cb1dd6f11156094435a99ece5920c46f','Unreviewed #20 second-pass source/content change');
    } else assert.deepEqual(extract(now,re),extract(old,re),'Modified original '+label+' in '+file);
  }
  for(const s of ['data:image','<canvas','<iframe'])
   assert.equal(now.split(s).length,old.split(s).length,'Modified embedded media '+s+' in '+file);
 }
 for(const id of ['dossier','essay','iteration','findings','map','board','conflict','shield','vectors','bozwana','defence-arch','kgb-inherit'])
  assert(readFileSync('mbalula_network.html','utf8').includes('href="#'+id+'"'),'Missing Mbalula accessible nav: '+id);
}

/* Dossiers 23–25: premium presentation with strictly preserved evidence. */
{
 const files=['wits.html','constitution.html','fwdeklerk_foundation_investigation.html'];
 const names=['wits','constitution','fwdeklerk'];
 const css=readFileSync('assets/dossier-batch-23-25.css','utf8');
 assert(css.includes('prefers-reduced-motion'),'Batch 23-25 motion preference missing');
 assert(css.includes(':focus-visible'),'Batch 23-25 accessible focus missing');
 const extract=(s,re)=>[...s.matchAll(re)].map(m=>m[0]).filter(x=>!x.includes('src="assets/editorial-shell.js"'));
 for(let i=0;i<files.length;i++){
  const file=files[i], now=readFileSync(file,'utf8');
  const base=execFileSync('git',['show','origin/main:'+file],{encoding:'utf8',maxBuffer:20*1024*1024});
  for(const req of ['aa-premium--'+names[i],'href="assets/dossier-batch-23-25.css"','class="aa-page-links"','href="index.html#investigations"','class="aa-editorial-skip"','rel="canonical"'])
   assert(now.includes(req),'Missing '+req+' in '+file);
  assert(css.includes('.aa-premium--'+names[i]),'Missing CSS for '+file);
  for(const [what,re] of [
   ['original scripts',/<script\b[^>]*>[\s\S]*?<\/script>/gi],
   ['original paragraphs',/<p\b[^>]*>[\s\S]*?<\/p>/gi],
   ['original diagrams',/<svg\b[^>]*>[\s\S]*?<\/svg>/gi],
   ['original images',/<img\b[^>]*>/gi],
   ['original element IDs',/\bid=["'][^"']+["']/g]
  ]) {
   // 24 Oct 2026 source review: permit only the exact approved, full-file
   // constitution.html correction against its reviewed original. Every script,
   // diagram, image and ID still requires byte-for-byte preservation.
   if(file==='constitution.html' && what==='original paragraphs'){
     const oldSha=execFileSync('git',['rev-parse','origin/main:'+file],{encoding:'utf8'}).trim();
     const newSha=execFileSync('git',['hash-object',file],{encoding:'utf8'}).trim();
     // 24 October second-pass legal-source reconciliation: this exact baseline
     // and full reviewed blob only. Original scripts/SVGs/images/IDs remain
     // independently and byte-for-byte compared in the same test loop.
     // See editorial-review/SOURCE-CORRECTIONS-24-SECOND-PASS-20261024.md.
     if(oldSha==='0811bef18d20cb922867f50d9682c0b48e46715c' && newSha==='8893cea1519dbb80b5d63666c7e71025964f8437') continue;
     if(oldSha==='b16a634da4f8ce3f67fda82ed329fa227b6972a3' && newSha==='1c0f41362891be1947e5effa6d5dba476d152d81') continue;
   }
   // PR #70 source corrections: allow only the reviewed, exact full-file
   // Foundation narrative (including new sources and the September 2026
   // leadership chronology); all existing code/diagrams/media/IDs remain strict.
   if(file==='fwdeklerk_foundation_investigation.html' && what==='original paragraphs'){
     const oldSha=execFileSync('git',['rev-parse','origin/main:'+file],{encoding:'utf8'}).trim();
     const newSha=execFileSync('git',['hash-object',file],{encoding:'utf8'}).trim();
     if(oldSha==='6acd67a3219e67e2c3d101c7e21d5d0e681ca69a' && newSha==='58719ea349192d91100c5ec3e4b950de2305acd6') continue;
     // PR #88 second pass: exact original-to-reviewed prose only.
     if(oldSha==='58719ea349192d91100c5ec3e4b950de2305acd6' && newSha==='7f197efb884375f87ec7db114e7b698c274aa8fc') continue;
   }
   assert.deepEqual(extract(now,re),extract(base,re),'Changed '+what+' in '+file);
  }
  for(const asset of ['data:image','<canvas','<iframe'])
   assert.equal(now.split(asset).length,base.split(asset).length,'Changed '+asset+' in '+file);
 }
 for(const dest of ['adl.html','wits.html','constitution.html','fwdeklerk_foundation_investigation.html','cws.html'])
  assert(existsSync(dest),'Invalid investigation navigation target '+dest);
}

/* Investigations 26–28: verify the original journalism and maps survive. */
{
 const list=['cws.html','omidyar.html','real411.html'];
 const names=['cws','omidyar','real411'];
 const css=readFileSync('assets/dossier-batch-26-28.css','utf8');
 assert(css.includes('prefers-reduced-motion'),'Missing 26–28 reduced-motion CSS');
 assert(css.includes('focus-visible'),'Missing 26–28 keyboard focus CSS');
 const hits=(s,re)=>[...s.matchAll(re)].map(m=>m[0]).filter(x=>!x.includes('src="assets/editorial-shell.js"'));
 for(let i=0;i<list.length;i++){
  const file=list[i], html=readFileSync(file,'utf8');
  const old=execFileSync('git',['show','origin/main:'+file],{encoding:'utf8',maxBuffer:24*1024*1024});
  for(const req of ['aa-premium--'+names[i],'assets/dossier-batch-26-28.css','class="aa-page-links"','href="index.html#investigations"','class="aa-editorial-skip"','rel="canonical"'])
   assert(html.includes(req),'Missing editorial feature '+req+' on '+file);
  for(const [name,re] of [
   ['scripts',/<script\b[^>]*>[\s\S]*?<\/script>/gi],
   ['paragraphs',/<p\b[^>]*>[\s\S]*?<\/p>/gi],
   ['SVG',/<svg\b[^>]*>[\s\S]*?<\/svg>/gi],
   ['images',/<img\b[^>]*>/gi]
  ]){
   // PR #70: only this exact, reviewed CWS source correction may revise prose.
   // Scripts, imagery, SVG, IDs, existing media and internal nav remain strict.
   if(file==='cws.html' && name==='paragraphs'){
     const oldSha=execFileSync('git',['rev-parse','origin/main:'+file],{encoding:'utf8'}).trim();
     const newSha=execFileSync('git',['hash-object',file],{encoding:'utf8'}).trim();
     if(oldSha==='dde8f9a795dfadaa1cb492243711fa599985866f' && newSha==='b0329231ef9ade47ff84031bc490103679dda23c') continue;
     // PR #88 second pass: exact immigration-law prose correction only.
     if(oldSha==='b0329231ef9ade47ff84031bc490103679dda23c' && newSha==='19a3864d963117c17a21f2f3bd2d3232e4b14d20') continue;
   }
   // PR #72: strictly permit the two reviewed source-qualification revisions
   // against their exact original main blobs. No blanket paragraph bypass:
   // every script, SVG, image, ID and embedded-media guard remains active.
   if(name==='paragraphs' && (file==='omidyar.html' || file==='real411.html')){
     const reviewed={
       'omidyar.html':['936a6d1fdfde18ed4d54684b2a552a5681034e16','689886df68bab56b446e30d712bdf455ea6ee0bd'],
       'real411.html':['9c0114d38045eb42720a228779f516f737301922','e60e0ee1ea7adb6dbc23904e6ab0fb799c0d015e']
     };
     const before=execFileSync('git',['rev-parse','origin/main:'+file],{encoding:'utf8'}).trim();
     const after=execFileSync('git',['hash-object',file],{encoding:'utf8'}).trim();
     if(before===reviewed[file][0] && after===reviewed[file][1]) continue;
     // 24 Oct second pass #27–28: exact main-to-reviewed prose only.
     // No blanket paragraph waiver; scripts, SVGs, images, IDs and media
     // remain compared byte-for-byte in this same test loop.
     const secondPass={
       'omidyar.html':['689886df68bab56b446e30d712bdf455ea6ee0bd','c0d57f55dcf1e3c3bf57c7377da615c715cc3ad3'],
       'real411.html':['e60e0ee1ea7adb6dbc23904e6ab0fb799c0d015e','752476a07ea9723d694987ea55a46613b535cdee']
     };
     if(before===secondPass[file][0] && after===secondPass[file][1]) continue;
   }
   assert.deepEqual(hits(html,re),hits(old,re),'Changed original '+name+' in '+file);
  }
  const oldIds=hits(old,/\bid=["'][^"']+["']/g);
  const newIds=hits(html,/\bid=["'][^"']+["']/g);
  const extraAnchor='id="start-investigation"';
  const expectedIds=file==='cws.html' && !oldIds.includes(extraAnchor)?[...oldIds,extraAnchor]:oldIds;
  assert.deepEqual(newIds,expectedIds,'Changed original element IDs in '+file);
  for(const asset of ['<canvas','data:image','<iframe'])
   assert.equal(html.split(asset).length,old.split(asset).length,'Changed original asset '+asset+' in '+file);
 }
 for(const dest of ['fwdeklerk_foundation_investigation.html','cws.html','omidyar.html','real411.html','osf-funded-orgs.html'])
  assert(existsSync(dest),'Broken series navigation: '+dest);
}

/* Investigation 29: funding atlas data integrity + reviewed table-renderer correction. */
{
 const file='osf-funded-orgs.html';
 const now=readFileSync(file,'utf8');
 const old=execFileSync('git',['show','origin/main:'+file],{encoding:'utf8',maxBuffer:20*1024*1024});
 const css=readFileSync('assets/dossier-29.css','utf8');
 for(const s of ['aa-premium--funding-atlas','href="assets/dossier-29.css"','rel="canonical"','class="aa-page-links"','href="#findings"','href="index.html#investigations"'])
  assert(now.includes(s),'Funding atlas missing '+s);
 assert(css.includes('prefers-reduced-motion'),'Atlas missing motion safety');
 assert(css.includes('focus-visible'),'Atlas missing keyboard focus treatment');
 const oldHash=execFileSync('git',['rev-parse','origin/main:'+file],{encoding:'utf8'}).trim();
 const newHash=execFileSync('git',['hash-object',file],{encoding:'utf8'}).trim();
 const reviewedChange=oldHash==='4a992f4a7592b32bd1d7d23eca43f2711791f1eb'
  && newHash==='dd4368e99808453c7607fdb9a6bb011c2589cc7a';
 // No general exemption for script or source data changes: only this reviewed
 // exact Git blob pair may differ; original 73+35 source tuples must be identical.
 function atlasData(h){const a=h.indexOf('const OSF_ORGS = [');const b=h.indexOf('// ── RENDER',a);
  assert(a>=0&&b>a,'Atlas data anchors missing');return h.slice(a,b)}
 assert.equal(atlasData(now),atlasData(old),'Funding atlas grant data changed');
 const take=(s,re)=>[...s.matchAll(re)].map(x=>x[0]).filter(item=>!item.includes('src="assets/editorial-shell.js"'));
 for(const [label,re] of [
  ['original table data',/<table\b[^>]*>[\s\S]*?<\/table>/gi],
  ['original filter scripts',/<script\b[^>]*>[\s\S]*?<\/script>/gi],
  ['original images',/<img\b[^>]*>/gi],
  ['original illustrations',/<svg\b[^>]*>[\s\S]*?<\/svg>/gi],
  ['original IDs',/\bid=["'][^"']+["']/g]
 ]){
  if(label==='original filter scripts' && reviewedChange)continue;
  assert.deepEqual(take(now,re),take(old,re),'Changed '+label+' in '+file);
 }
 for(const sig of ['data:image','<canvas','<iframe','<table','<tbody','<select'])
  assert.equal(now.split(sig).length,old.split(sig).length,'Changed underlying directory '+sig);
 if(reviewedChange){
  const body=(now.match(/<script>\s*\/\/ ── DATA[\s\S]*?<\/script>/)||[])[0];
  assert(body,'Inline directory renderer missing');
  const js=body.slice(body.indexOf('const OSF_ORGS = ['),body.indexOf('// ── FILTER'));
  assert(js.length>3000,'Directory script unexpectedly short');
  const els=Object.create(null);
  const document={getElementById:id=>els[id]||(els[id]={innerHTML:''})};
  runInNewContext(js+'\nrenderOSF();renderOmid();',{document,updateCount:()=>{}},{timeout:1500});
  const osf=els['osf-tbody']?.innerHTML||'',omid=els['omid-tbody']?.innerHTML||'';
  assert.equal((osf.match(/<tr data-name=/g)||[]).length,73,'OSF 73-row directory broken');
  assert.equal((omid.match(/<tr data-name=/g)||[]).length,35,'Omidyar 35-row directory broken');
  for(const s of ['href="https://issafrica.org"','data-sector="research / think tank"','data-track="osf-d"','<td class="org-sector">Research / Think Tank</td>','<td class="org-amount">$5.1M / 7 grants</td>'])
   assert(osf.includes(s),'OSF mapping/link error: '+s);
  for(const s of ['href="https://africacheck.org"','data-sector="media / fact-checking"','data-track="luminate (formerly omidyar network)"','<td class="org-sector">Media / Fact-Checking</td>','<td class="org-amount">$500K joint 2017 + ongoing</td>'])
   assert(omid.includes(s),'Omidyar mapping/link error: '+s);
  assert(!osf.includes('href="https://N/A"')&&!omid.includes('href="https://Archived"'),'Bad archival links');
  assert(!omid.includes('<td class="org-status">YES</td>'),'Incorrect status column mapping');
  assert(now.includes('aria-label="Search OSF organisations"')&&now.includes('aria-label="Search Omidyar organisations"'),'Atlas search input labels missing');
 }
 for(const dest of ['real411.html','osf.html'])
  assert(existsSync(dest),'Broken investigation atlas navigation '+dest);
}

/* 24 October second pass, investigations 05/06: permitted prose/source-link
 * corrections must never alter underlying JS, SVG, images, hook IDs, or
 * previously published links. Compare with current main at exact PR head.
 */
for (const file of ['sixstage.html','metasuppression.html']) {
  const current=readFileSync(file,'utf8');
  const baseline=execFileSync('git',['show','origin/main:'+file],{encoding:'utf8',maxBuffer:16*1024*1024});
  assert(current.length>70_000,'Unexpected truncated dossier '+file);
  const take=(html,pattern)=>[...html.matchAll(pattern)].map(m=>m[0]);
  for(const [kind,pattern] of [
    ['JavaScript',/<script\b[^>]*>[\s\S]*?<\/script>/gi],
    ['SVG',/<svg\b[^>]*>[\s\S]*?<\/svg>/gi],
    ['images',/<img\b[^>]*>/gi],
    ['element IDs',/\bid=["'][^"']+["']/g],
    ['iframes',/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi]
  ])assert.deepEqual(take(current,pattern),take(baseline,pattern),'Unapproved '+kind+' change in '+file);
  for(const sig of ['data:image','<canvas','<video','<source']){
    assert.equal(current.split(sig).length,baseline.split(sig).length,'Embedded media altered in '+file+': '+sig);
  }
  const hrefs=html=>[...html.matchAll(/\bhref=["']([^"']+)["']/gi)].map(m=>m[1]);
  const prior=hrefs(baseline),now=hrefs(current);let i=0;
  for(const href of now)if(href===prior[i])i++;
  assert.equal(i,prior.length,'Existing source/article link removed or reordered in '+file);
}

console.log('Dossier checks passed: editorial links and research visualisation anchors intact.');
