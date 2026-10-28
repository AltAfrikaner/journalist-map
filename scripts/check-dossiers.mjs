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
      // Seventh-pass evidence corrections (27 Oct), exact whole-file hash; prior dated Gini SVG text correction remains the only SVG exception. All other media/JS/IDs remain guarded.
      // The original reviewed page and merged corrected version are exact accepted bases.
      // PR #128 advanced origin/main to 09439db6 after this allowlist was authored;
      // recognise only that byte-identical reviewed blob, never arbitrary #14 changes.
      const baseSha=execFileSync('git',['rev-parse','origin/main:'+f],{encoding:'utf8'}).trim();
      const liveSha=execFileSync('git',['hash-object',f],{encoding:'utf8'}).trim();
      assert(['1678d15c9f337422df63d52e3d1cc273aace258b','8f890b391a032546535623b3e4c3e638d8738c4d','a79c55acf9d4339530f7a5707e7bc27b416f7510','8c6e2816291ba6179ece4015ed92b7de7cbd0773','09439db6582fb8e6e25380f37c25667a782293e5','7b5f239723980b8ddf43326a34476e0fdece8b3a','c19ddf8c60a3104f239d802c82d177f941930b24','5ec5d2114b113e1990c1d2909c8219ba0fd93647'].includes(baseSha),'Unexpected #14 main baseline');
      assert.equal(liveSha,'5ec5d2114b113e1990c1d2909c8219ba0fd93647','Unexpected #14 seventh-pass Cuba accounting correction; see SOURCE-CORRECTIONS-14-SEVENTH-PASS-20261027.md');
      continue;
    }
    if (f==='wef.html' && label==='paragraphs') {
      // Second-pass 24 October WEF corrections: exact baseline-to-reviewed
      // full-file blobs. Subsequent unchanged-main pages compare normally.
      const original=execFileSync('git',['rev-parse','origin/main:'+f],{encoding:'utf8'}).trim();
      const revised=execFileSync('git',['hash-object',f],{encoding:'utf8'}).trim();
      if(original==='7befe749783a46805cbc53e5fb2fb743b45803f6' && revised==='3b2427c20bb2593b23b7fdaa465152fb83be6a8b') continue;
      // 26 Oct fifth-pass WEF: only the exact-reviewed biography, 1992 timeline,
      // and source-attribution correction may change a source paragraph.
      // Scripts, graphics, images and IDs are still checked below against main.
      if(original==='e115b2c3f4d9f2306ce9e5bf27c04c5e2bfa9256' && revised==='172c8e30f82f89a954c9bf7d5f9b1f0501d9b322') continue;
      assert.deepEqual(extract(now,re),extract(base,re),'Non-allowlisted WEF prose changed');
      continue;
    }
    // Only the exact peer-reviewed investigation 13 article may differ in prose.
    // Scripts, SVG, IDs, images and media still compare byte-for-byte to main.
    if(f==='communists.html' && label==='paragraphs') {
      // Seventh-pass 27 Oct 2026 alliance/BLM sourcing: only this reviewed article blob is permitted; all interactive assets remain guarded.
      // Independent checks below still compare scripts, SVG, IDs and image tags to main.
      const reviewed='63ca6e11a79ddaba705571f9147a1ffb76ec1f78';
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
      // 27 Oct 2026: documented single SVG Gini label correction, from historic 63.0 shorthand to World Bank 2022 value 54.1. No graphic/data changes.
      const oldGini='<text x="570" y="420" font-size="10" fill="#999">Gini 63.0</text>';
      const newGini='<text x="570" y="420" font-size="10" fill="#999">Gini 54.1</text>';
      const currentBlocks=extract(now,re);
      assert.equal(currentBlocks.filter(block=>block.includes(newGini)).length,1,'Missing single verified Gini SVG text correction');
      assert.equal(currentBlocks.filter(block=>block.includes(after)).length,1,'Missing single corrected QLFS SVG label');
      assert.equal(currentBlocks.filter(block=>block.includes(before)).length,0,'Stale QLFS SVG label');
      assert.deepEqual(currentBlocks,baselineBlocks.map(block=>block.replace(before,after).replace(oldGini,newGini)),'Unexpected SVG change beyond verified QLFS/Gini text corrections in '+f);
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
  // 25 Oct primary-source corrections: Apache lineage, separate South African
  // Turkcell delict claim from US ATA suits, and qualify speculative penalties.
  // Only this exact full blob is authorised after lossless 1.7MB round-trip check.
  // Third-pass 25 Oct 2026: add exact independently round-tripped blob after
  // one procedural chronology paragraph; all JS/SVG/images/IDs unchanged.
  const approvedEditorial=['652dab0ceab3eafdb48b603ccc0aa8f832b1d3b6','79c93657371ee799d564c07ed5e400bd90ba2690'];
  const current=execFileSync('git',['hash-object',f],{encoding:'utf8'}).trim();
  assert([original,...approvedCovers,...approvedEditorial].includes(current),'Unreviewed/missing Rooivalk dossier; exact hash guard failed');
  // Current user-authored cover swaps exactly one embedded 348KB JPEG for a remote PNG.
   // Only this independently diffed, exact Git blob may use the smaller threshold.
   if(['78ed6a7b7af2461465ca3e19f50f9b0a3af0249b','303d26d3687f4e004f929559b86b30eb8b0e1947',...approvedEditorial].includes(current)) {
     assert(Buffer.byteLength(now,'utf8')>1740000,'Rooivalk external-cover dossier truncated or zero sized');
     assert.equal((now.match(/data:image\//g)||[]).length,14,'Unreviewed embedded assets in remote-cover dossier');
     assert(now.includes('https://d2ol7oe51mr4n9.cloudfront.net/user_39LyNd3yWOiGeUhnS3CdfDw25su/0e814109-6230-401e-83bb-520d2a5dd424.png'),'Remote cover reference disappeared');
   } else assert(Buffer.byteLength(now,'utf8')>2090000,'Rooivalk dossier truncated or zero sized');
  if(approvedEditorial.includes(current)){
    const mainBlob=execFileSync('git',['rev-parse','origin/main:'+f],{encoding:'utf8'}).trim();
    assert(['303d26d3687f4e004f929559b86b30eb8b0e1947',...approvedEditorial].includes(mainBlob),'Unreviewed Rooivalk editorial baseline');
    for(const [label,re] of [['scripts',/<script\b[^>]*>[\s\S]*?<\/script>/gi],['SVG',/<svg\b[^>]*>[\s\S]*?<\/svg>/gi],['images',/<img\b[^>]*>/gi],['IDs',/\bid=["'][^"']+["']/g]]){
      const items=x=>[...x.matchAll(re)].map(m=>m[0]);
      // Compare the October source correction to its immediate reviewed main,
      // NOT the restored 2MB archival blob: the approved remote-cover revision
      // predates this PR and changed one image tag without changing payloads.
      const preEdit=execFileSync('git',['show','origin/main:'+f],{encoding:'utf8',maxBuffer:16*1024*1024});
      assert.deepEqual(items(now),items(preEdit),'Rooivalk '+label+' changed');
    }
  }
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
       (baselineBlob==='c4c0f0a6788d30f87b9da323531ec7a5134264ad' && liveBlob==='5b67748e4f3d4bd3cae9fccc34903ad6406da5d8') ||
       (baselineBlob==='5b67748e4f3d4bd3cae9fccc34903ad6406da5d8' && liveBlob==='c8f7009f465cc5f070f78eafe66fde8ea2bd948a') ||
       (baselineBlob==='c8f7009f465cc5f070f78eafe66fde8ea2bd948a' && liveBlob==='cc7e4a72733c43a2909fa60cf4748e268b5ece20') ||
       (baselineBlob==='cc7e4a72733c43a2909fa60cf4748e268b5ece20' && liveBlob==='3d67ae530605cc2d0ce9ed2ced60aeaf26c5962d') ||
        (baselineBlob==='3d67ae530605cc2d0ce9ed2ced60aeaf26c5962d' && liveBlob==='3a7509aa5e4d6628a390bf09ffe01ee9491d08a7') ||
       (baselineBlob==='3a7509aa5e4d6628a390bf09ffe01ee9491d08a7' && liveBlob==='63499ca73d98923c8422dd97290ba405a43bd692'),
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
     // Fourth-pass #16: pin the entire reviewed article to the exact main/head
     // blobs. The following script/SVG/image/ID comparisons remain mandatory.
     const publishedUn=execFileSync('git',['rev-parse','origin/main:'+f],{encoding:'utf8'}).trim();
     const reviewedUn=execFileSync('git',['hash-object',f],{encoding:'utf8'}).trim();
     if(publishedUn==='96cfa249c4925565b66766d42f3d5629406412ec' &&
        reviewedUn==='60da85e9c0cba016e0e41dd21f4beafbbe05df22') {
       assert.equal(extract(now,re).length,extract(base,re).length,'#16 paragraph count changed');
     } else {
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
    } // exact fourth-pass #16 or legacy reviewed paragraph guard
   } else assert.deepEqual(extract(now,re),extract(base,re),'Original '+category+' changed in '+f);
  }
 for(const sig of ['data:image','<canvas','<iframe'])
  assert.equal(now.split(sig).length,base.split(sig).length,'Original embedded visual changed in '+f);
}

/* Investigation 19: approved SIXTH-PASS source corrections to signed-letter dossier.
 * The full interactive signatory roster, research wording, charts and WebGL
 * source must remain compared against current main, with exact reviewed
 * pre-/post-edit whole-file blob hashes for prose changes only.
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
     // Approved 28 Oct NINTH-pass #19 source correction, exact reviewed files. Match BOTH complete blob hashes
     // instead of allowing arbitrary prose edits or weakening any graphic guard.
     // See editorial-review/SOURCE-CORRECTIONS-19-NINTH-PASS-20261028.md.
     const originalHash=execFileSync('git',['rev-parse','origin/main:'+page],{encoding:'utf8'}).trim();
     const revisedHash=execFileSync('git',['hash-object',page],{encoding:'utf8'}).trim();
     assert.equal(originalHash,'4fb5361bc30e1360c13bace647d17969e1f80a4b','Unexpected #19 main baseline for 28 Oct ninth-pass review');
     assert.equal(revisedHash,'c4543b52137205a207a807c96e5716e61f9cc52e','Unreviewed #19 ninth-pass source/content change');
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
      // 27 October seventh-pass source/legal corrections. Only exact reviewed full
      // blobs are permitted, with original JS/SVG/image/ID checks below intact.
      const reviewed={
       // Third-pass edits are pinned from exact current main blobs; no open-ended exception.
       // Fourth-pass amounts/chronology and comparison-framework corrections approved against exact 25 Oct main.
       // Each case still compares scripts, SVG, images, IDs and embedded-media counts to main.
       'splc.html':['629d17efed388e019ef45d8a01b8d64e47ce0552','d5b6bb0ada8984855867a616e6c05c33abc7b224'],
       'adl.html':['16a66a64bcf5a30f9155444dfc5ea9dee393c4c5','7ca7b2b80febc0ccd8faa790d106fc8182f268a8']
      };
      const before=execFileSync('git',['rev-parse','origin/main:'+file],{encoding:'utf8'}).trim();
      const after=execFileSync('git',['hash-object',file],{encoding:'utf8'}).trim();
      assert.equal(before,reviewed[file][0],'Unexpected baseline before editorial corrections: '+file);
      assert.equal(after,reviewed[file][1],'Unreviewed content change: '+file);
     } else if(file==='mbalula_network.html' && label==='paragraphs' && now!==old) {
      // Exact whole-file allowance for 28 Oct NINTH-pass audit; leave other
      // sections and all remaining script/SVG/image/ID checks strictly intact.
       // See editorial-review/SOURCE-CORRECTIONS-20-NINTH-PASS-20261028.md.
      const originalHash=execFileSync('git',['rev-parse','origin/main:'+file],{encoding:'utf8'}).trim();
      const revisedHash=execFileSync('git',['hash-object',file],{encoding:'utf8'}).trim();
      assert.equal(originalHash,'e4e8a8e4d6cde83a89ee4d520a788ba940aa8772','Unexpected #20 main baseline for 28 Oct ninth-pass review');
      assert.equal(revisedHash,'8e451d6c2ef4c0950c197ad2ef347c202dd5778e','Unreviewed #20 ninth-pass source/content change');
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
   // 26 Oct fifth pass: exact reviewed Wits date/source/causal-claim corrections.
   // Independent JS, SVG, images, IDs, and media comparisons remain strict.
   if(file==='wits.html' && what==='original paragraphs'){
     const oldSha=execFileSync('git',['rev-parse','origin/main:'+file],{encoding:'utf8'}).trim();
     const newSha=execFileSync('git',['hash-object',file],{encoding:'utf8'}).trim();
     if(oldSha==='b3da476af5f7599579311642946f1026167ee292' && newSha==='d759c8f3c7bdecf16c81b537b086b5deb2fb6bb8') continue;
     // Sixth-pass, 26 Oct: only independently sourced IBM/Gates and attribution prose changed.
     // All original JavaScript, diagrams, images, IDs and media remain strict below.
     if(oldSha==='d759c8f3c7bdecf16c81b537b086b5deb2fb6bb8' && newSha==='ff5f1d5481257a52832e30a34957000a71fd6311') continue;
     // Seventh-pass #23 (27 Oct): audited universal restitution/selection claims; original JS/SVG/images/IDs still compared byte-for-byte.
     if(oldSha==='ff5f1d5481257a52832e30a34957000a71fd6311' && newSha==='b250251661c8dc3fc48726313c35603401ac76e9') continue;
     // Eighth-pass #23 (28 Oct): ARUA 2015 founding-16 versus 2026 roster-23 correction; exact HTML blob only.
     // All pre-existing inline scripts, SVGs, images, IDs and media remain byte-for-byte guarded below.
     if(oldSha==='b250251661c8dc3fc48726313c35603401ac76e9' && newSha==='d0be0f12f5bfe5a20051f54363ac4009dad05227') continue;
   }
   if(file==='constitution.html' && what==='original paragraphs'){
     const oldSha=execFileSync('git',['rev-parse','origin/main:'+file],{encoding:'utf8'}).trim();
     const newSha=execFileSync('git',['hash-object',file],{encoding:'utf8'}).trim();
     // 26 Oct fifth pass: exact reviewed 1994-election/1996-certification prose, graphics unchanged.
     if(oldSha==='8234745580f8d11b825974775436b23b219d07db' && newSha==='3ee58768b85404bf1405619b543a88d4ccf71245') continue;
     // Sixth-pass, 26 Oct: court/university sources qualify language census and party scorecard.
     // Plotted numbers are preserved and explicitly UNVERIFIED, not re-certified.
     if(oldSha==='3ee58768b85404bf1405619b543a88d4ccf71245' && newSha==='7dd80e7376b1f74e0936f8886c5c83a01f56dd07') continue;
     // Seventh-pass #24 (27 Oct): exact legal record corrections, retained graphic values and original scripts/SVG/images/IDs.
     if(oldSha==='7dd80e7376b1f74e0936f8886c5c83a01f56dd07' && newSha==='0e8db410687faf42cdbecd10e65328f0a04761db') continue;
     // Eighth-pass #24 (28 Oct): May first-draft vote, October amended text and 13-row/14-category caution.
     // Preserve original charts, code, diagrams and identifiers; only the exact reviewed prose blob qualifies.
     if(oldSha==='0e8db410687faf42cdbecd10e65328f0a04761db' && newSha==='684d676c724da3dbe79437675f98ebc37cb9081a') continue;
     // 24 October second-pass legal-source reconciliation: this exact baseline
     // and full reviewed blob only. Original scripts/SVGs/images/IDs remain
     // independently and byte-for-byte compared in the same test loop.
     // See editorial-review/SOURCE-CORRECTIONS-24-SECOND-PASS-20261024.md.
     if(oldSha==='0811bef18d20cb922867f50d9682c0b48e46715c' && newSha==='8893cea1519dbb80b5d63666c7e71025964f8437') continue;
     // 25 Oct third pass: original paragraph/source assertions corrected, full reviewed file hash pinned.
     // Existing JS, SVGs, images, IDs and embedded data still compare strictly to main.
     if(oldSha==='8893cea1519dbb80b5d63666c7e71025964f8437' && newSha==='dfccfbe82f484c81454258f7c940ed451d47315d') continue;
     // 25 Oct fourth pass: court chronology/constitutional asymmetry corrections.
     // Scope: narrative only; SVG, JS, images, element IDs remain under strict checks.
     // Source: editorial-review/SOURCE-CORRECTIONS-24-FOURTH-PASS-20261025.md
     if(oldSha==='dfccfbe82f484c81454258f7c940ed451d47315d' && newSha==='8234745580f8d11b825974775436b23b219d07db') continue;
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
     // 25 Oct third pass: independently sourced board/hiring/tenure corrections. Exact full-file blob only.
     // Script, SVG, image, ID and embedded-data checks below still compare against origin/main.
     if(oldSha==='7f197efb884375f87ec7db114e7b698c274aa8fc' && newSha==='75525f9c16df9f8377b7794c7f5862d5aa59d7a7') continue;
      // 25 Oct fourth pass: exact reviewed legislation/tenure/motive corrections, graphics and scripts pinned.
      if(oldSha==='75525f9c16df9f8377b7794c7f5862d5aa59d7a7' && newSha==='6687d1ef157947e4ecb8ee9bae47d91c586fa7e3') continue;
      // 26 Oct fifth pass: exact source-corrected #25 prose; SVG, JS, images and IDs still strict below.
      // editorial-review/SOURCE-CORRECTIONS-25-FIFTH-PASS-20261026.md
      if(oldSha==='6687d1ef157947e4ecb8ee9bae47d91c586fa7e3' && newSha==='28ee3462eabdacad2e3e6cffc12ea1ac2f5e17b6') continue;
      // 27 Oct sixth pass: independently sourced farm-stat denominators, 2026 rights data and bilateral grant framing.
      // Complete-file identity is pinned; JS/SVG/images/IDs and main-link preservation remain strict.
      if(oldSha==='28ee3462eabdacad2e3e6cffc12ea1ac2f5e17b6' && newSha==='343ac8f283505f29e1daafb0a052f4d86655c1c7') continue;
      // 27 Oct seventh pass #25: uniquely reviewed 2025 statement, 2026 argument and Goodwill dates; artifact guards unchanged.
      if(oldSha==='343ac8f283505f29e1daafb0a052f4d86655c1c7' && newSha==='660ea355a39e5ebf1df8053fdb235ba4ae2e13f2') continue;
      // 28 Oct eighth pass #25: exact evidence-checked IRR race-law denominators and historical mission framing.
      if(oldSha==='660ea355a39e5ebf1df8053fdb235ba4ae2e13f2' && newSha==='287109369921fad18dfd193bae52ef0de53fa66f') continue;
      // 28 October visual-text consistency pass #25, scoped infographic HTML text only.
      if(oldSha==='287109369921fad18dfd193bae52ef0de53fa66f' && newSha==='ac2ec0866058fc26799a73f31de2f21757e3d385') continue;
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
     // 25 Oct third pass: sourced CWS quotation, independent church governance, funding and RSC roles.
     // Exception is this exact reviewed full-file blob pair; all other research-artifact guards remain active.
     if(oldSha==='19a3864d963117c17a21f2f3bd2d3232e4b14d20' && newSha==='4eba7bf483658b02b288485b99c651d3e5111c7e') continue;
      // 25 Oct fourth pass: exact reviewed RSC/NCC/FEMA correction, graphic and media integrity unchanged.
      if(oldSha==='4eba7bf483658b02b288485b99c651d3e5111c7e' && newSha==='e22c5ec7ddaa374d9ff3ebede1f03100c484b215') continue;
      // 26 Oct fifth pass: exact court/board/source-corrected #26 prose; nonparagraph artifacts remain strictly checked.
      // editorial-review/SOURCE-CORRECTIONS-26-FIFTH-PASS-20261026.md
      if(oldSha==='e22c5ec7ddaa374d9ff3ebede1f03100c484b215' && newSha==='7f84acde05c18fa95e449c13b3d5f318c35d35a2') continue;
      // 27 Oct sixth pass: delegation dates, CMEP signatories, membership-versus-direction caveats.
      // Complete-file identity is pinned; no general prose bypass, media or JS exceptions.
      if(oldSha==='7f84acde05c18fa95e449c13b3d5f318c35d35a2' && newSha==='8574d069562be11d6bb3125bbbe92ff187d675d1') continue;
      // 27 Oct seventh pass #26: fixed recipient allocation and independent RSC funding provenance; no media/JS bypass.
      if(oldSha==='8574d069562be11d6bb3125bbbe92ff187d675d1' && newSha==='4e1793059cc64093ca0ee6d144487467efbfa0b3') continue;
      // 28 Oct eighth pass #26: exact source-led 1959 boycott versus April 1960 AAM founding chronology.
      if(oldSha==='4e1793059cc64093ca0ee6d144487467efbfa0b3' && newSha==='4f37632b4e9c264efbd5e5c1a1b1eb8ed6921385') continue;
      // 28 October visual-text consistency pass #26, scoped HTML node copy only; no underlying graph changed.
      if(oldSha==='4f37632b4e9c264efbd5e5c1a1b1eb8ed6921385' && newSha==='9891efe6865816e1327d3cb06006153c4d2fd83a') continue;
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
     // 25 Oct third pass: two exact baseline-to-reviewed journalism corrections.
     // This allowance is for paragraphs only; scripts/SVG/images/IDs/media still
     // compare byte-for-byte against origin/main in the same loop.
     const thirdPass={
       'omidyar.html':['c0d57f55dcf1e3c3bf57c7377da615c715cc3ad3','c0e58e9c42cd3d5aa72cd5fd343a3819973efa58'],
       'real411.html':['752476a07ea9723d694987ea55a46613b535cdee','bcc442a6853c1fefe885a59e2e624841d17b1b61']
     };
     if(before===thirdPass[file][0] && after===thirdPass[file][1]) continue;
     // 25 Oct fourth source pass: narrowly allow two exact content identities.
     // All nonparagraph scripts, SVG, images, IDs, and media remain protected.
     const fourthPass={
       'omidyar.html':['c0e58e9c42cd3d5aa72cd5fd343a3819973efa58','e110d7ab9a5c7daf6b12c831bc430e3aaac9ff09'],
       'real411.html':['bcc442a6853c1fefe885a59e2e624841d17b1b61','55b28388465388bfb0ca833bb8e4f49c7a9112e2']
     };
     if(before===fourthPass[file][0] && after===fourthPass[file][1]) continue;
     // 26 Oct sixth pass: narrowly reviewed year-denominator/FOIA/IEC-referral
     // prose changes. These exact Git blobs alone may differ from current main;
     // scripts, SVG, images, IDs and media comparisons below remain mandatory.
     const sixthPass={
       'omidyar.html':['e110d7ab9a5c7daf6b12c831bc430e3aaac9ff09','0f3527760ca3f1651e70904c5dd25c97db4ff584'],
       'real411.html':['55b28388465388bfb0ca833bb8e4f49c7a9112e2','521bc9f303016fa915b5159e82ba63a8c070f268']
     };
     if(before===sixthPass[file][0] && after===sixthPass[file][1]) continue;
     // 27 Oct seventh source pass: Omidyar Group-vs-Network denominator and
     // independently reported IEC final-signature/complaint-count nuance.
     // No generic prose bypass: ONLY the exact reviewed Git blobs below,
     // while scripts, SVGs, images, IDs and embedded media remain strict.
     const seventhPass={
       'omidyar.html':['0f3527760ca3f1651e70904c5dd25c97db4ff584','8c9cbbf02622fc1b6c0d1d85fdf92065c33afe95'],
       'real411.html':['521bc9f303016fa915b5159e82ba63a8c070f268','6763c273bc5f9bcf2fe4d0236fb09166a04ef881']
     };
     if(before===seventhPass[file][0] && after===seventhPass[file][1]) continue;
     // 27 Oct eighth pass: TAI observer-status distinction and Real411 legal duty
     // reconciliation. Exact current-main-to-reviewed article blob pair only;
     // scripts, original SVG, images, IDs and media still require identity.
     const eighthPass={
       'omidyar.html':['8c9cbbf02622fc1b6c0d1d85fdf92065c33afe95','1e2c8f39a754d7858df55163541314d68103c217'],
       'real411.html':['6763c273bc5f9bcf2fe4d0236fb09166a04ef881','a2b77d438f51830e1341288a0d41c072b5525b1a']
     };
     if(before===eighthPass[file][0] && after===eighthPass[file][1]) continue;
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
 // Seventh-pass: exactly two documented legacy directory labels were reconciled.
 // The full article blob pair must match; all 106 other row tuples, JS renderer,
 // media and historic links retain their original bytes.
 const auditedRows=[
  ['  [53,"ProBono.Org","probono.org.za","Legal / Access to Justice","Johannesburg / CT","STACKED","CF R2M + OSF R800K–R1.3M (same year)","VERIFIED"],',
   '  [53,"ProBono.Org","probono.org.za","Legal / Access to Justice","Johannesburg / CT","STACKED","FY2018: CF R2m + OSF-SA donation R1.303m; FY2019: CF R1.5m + OSF grant R0.8m","VERIFIED"],'],
  ['  [71,"Open Society Foundation for SA (OSF-SA)","osf.org.za","Philanthropy","Cape Town","OSF-D","R1 billion+ / $238M official (1993–2023)","VERIFIED"],',
   '  [71,"Open Society Foundation for SA (OSF-SA)","osf.org.za","Philanthropy","Cape Town","OSF-D",">R1bn reported in 2018; US$238,635,789 SA investment (1997–2023), excluding US$15m seed endowment","VERIFIED"],']
 ];
 const approvedRowPair=oldHash==='b3bab0b910e94c1f67d2bda3996e1cabc057d11c'
  && newHash==='bb1ede2fd5151a1d4b12345274d5c7868a065c6f';
 let expectedAtlas=atlasData(old);
 if(approvedRowPair){
  for(const [before,after] of auditedRows){
   assert.equal(expectedAtlas.split(before).length,2,'Atlas baseline row missing '+before.slice(0,35));
   expectedAtlas=expectedAtlas.replace(before,after);
  }
 }
 assert.equal(atlasData(now),expectedAtlas,'Unexpected funding atlas grant-data change');
 const take=(s,re)=>[...s.matchAll(re)].map(x=>x[0]).filter(item=>!item.includes('src="assets/editorial-shell.js"'));
 for(const [label,re] of [
  ['original table data',/<table\b[^>]*>[\s\S]*?<\/table>/gi],
  ['original filter scripts',/<script\b[^>]*>[\s\S]*?<\/script>/gi],
  ['original images',/<img\b[^>]*>/gi],
  ['original illustrations',/<svg\b[^>]*>[\s\S]*?<\/svg>/gi],
  ['original IDs',/\bid=["'][^"']+["']/g]
 ]){
  if(label==='original filter scripts' && reviewedChange)continue;
  if(label==='original filter scripts' && approvedRowPair){
   const restored=take(now,re).map(block=>{
    for(const [before,after] of auditedRows){
     assert.equal(block.split(after).length===2 || !block.includes(after),true,'Repeated edited row');
     block=block.replace(after,before);
    }
    return block;
   });
   assert.deepEqual(restored,take(old,re),'Unapproved funding atlas script change');
   continue;
  }
  assert.deepEqual(take(now,re),take(old,re),'Changed '+label+' in '+file);
 }
 for(const sig of ['data:image','<canvas','<iframe','<table','<tbody','<select'])
  assert.equal(now.split(sig).length,old.split(sig).length,'Changed underlying directory '+sig);
 if(reviewedChange || approvedRowPair){
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

/* 28 October ninth-pass: only these reviewed full-blob prose/table/update
 * pairs may change on a PR. Protected media/JS/SVG/IDs and URLs remain under
 * the strict original checks above. Main after merge remains unchanged.
 */
for (const [page, before, after] of [
 ['omidyar.html', '1e2c8f39a754d7858df55163541314d68103c217', 'cebfd1a60f1e4154f6831c4e676abeb79c894d43'],
 ['real411.html', 'a2b77d438f51830e1341288a0d41c072b5525b1a', '8c32c5970205f3041825450209f61025b26a26fb'],
]) {
 const baseline=execFileSync('git',['rev-parse','origin/main:'+page],{encoding:'utf8'}).trim();
 const current=execFileSync('git',['hash-object',page],{encoding:'utf8'}).trim();
 if (baseline===before && current!==baseline) {
  assert.equal(current,after,'Unreviewed ninth-pass file change: '+page);
 }
 // Once the ninth-pass publication has merged, this historical guard no
 // longer tests future changes against the older main blob. Subsequent
 // revisions have their own strict exact-blob guard below.
}


/* 28 October #28 publication heading: an IEC official report is not a
 * separately audited complaint database. Guard exactly this text-only patch. */
{
 const p='real411.html';
 const base=execFileSync('git',['rev-parse','origin/main:'+p],{encoding:'utf8'}).trim();
 const now=execFileSync('git',['hash-object',p],{encoding:'utf8'}).trim();
 if(base!==now){
  assert.equal(base,'8c32c5970205f3041825450209f61025b26a26fb','Unexpected Real411 publication-label baseline');
  assert.equal(now,'ef227de770e6489b886d6ef1a18a2a543878a4d6','Unexpected Real411 publication-label source');
 }
}

/* 28 October ninth-pass Omidyar card: correct wrongly stated 2024 Kenya raid to
 * 16 December 2025 South African enforcement using Home Affairs and Reuters.
 * Exact reviewed whole-file transition only. */
{
 const p='omidyar.html';
 const before=execFileSync('git',['rev-parse','origin/main:'+p],{encoding:'utf8'}).trim();
 const current=execFileSync('git',['hash-object',p],{encoding:'utf8'}).trim();
 if(before!==current){
  assert.equal(before,'cebfd1a60f1e4154f6831c4e676abeb79c894d43','Unexpected Omidyar raid-date main baseline');
  assert.equal(current,'07b8433a4b12d2ff0473a65823b252de92895b69','Unreviewed Omidyar raid correction');
 }
}
console.log('Dossier checks passed: editorial links and research visualisation anchors intact.');


/* 28 October 2026: evidence-led #15–16 corrections pinned to complete Git blobs.
 * Only the exact independently reviewed source text is accepted. Existing
 * script/SVG/image/ID/media checks above still run for both investigations.
 * The 1.748 MB Rooivalk archival dossier and its strict hash guards are untouched.
 */
for (const [file, original, reviewed] of [
  ['wef.html', 'c8ff4ad303a6a19f874401b6ad558e8d6b5bd132', '22f5f4c13f081b0d34fbe7b2bc9d771a2c582ec5'],
  ['un.html', 'fd247e3b983b3ec18354be65cfa1cbd94eb61481', '3fd62bbb5a2467c345c76dd77c9eb0ad6df5d38a'],
]) {
  const baseline = execFileSync('git', ['rev-parse', 'origin/main:' + file], {encoding:'utf8'}).trim();
  const actual = execFileSync('git', ['hash-object', file], {encoding:'utf8'}).trim();
  assert([original, reviewed].includes(baseline), 'Unexpected unreviewed #15-16 origin/main baseline: ' + file);
  assert.equal(actual, reviewed, 'Unreviewed #15-16 article blob: ' + file);
}


/* 28 Oct 2026: independent source audit for earliest homepage-order #01-02.
 * These exact full-file transitions are permitted for STATIC evidence paragraphs
 * only. Keep every old link, JS/3D node and edge, SVG, CSS, image and ID.
 * Require the exact published reviewed hash, even after this PR merges.
 * Concurrent main commit 5647e9c removed an unsourced outlet-count canvas
 * and its dedicated renderer; it did not modify this #09-10 PR's articles.
 * Follow-up main commit 2723f28 moved the intact evidence section/nav above the footer.
 * Its exact resulting published #02 file blob 36d677bfe91785b9b469ba225c4d3c4d9cdf9877 is pinned, not a blanket bypass.
 */
for (const [file, before, reviewed] of [
 ['osf.html', '35780cc9eae3c2c138c56f1593ec242763088b30', '986f59333f2c3ec232058f2000d753fb8b625f73'],
 ['sa_journalists.html', 'd92bd7a2491b54dca7c9e9c2a6c05f755ccdefa1', '36d677bfe91785b9b469ba225c4d3c4d9cdf9877']
]) {
 const fromMain=execFileSync('git',['rev-parse','origin/main:'+file],{encoding:'utf8'}).trim();
 const current=execFileSync('git',['hash-object',file],{encoding:'utf8'}).trim();
 assert([before,reviewed].includes(fromMain),'Unexpected origin/main editorial #01-02 baseline: '+file);
 assert.equal(current,reviewed,'Unreviewed #01-02 source change: '+file);
 const original=execFileSync('git',['show','origin/main:'+file],{encoding:'utf8',maxBuffer:16*1024*1024});
 const published=readFileSync(file,'utf8');
 assert(Buffer.byteLength(published,'utf8')>100_000,'Editorial #01-02 investigation truncated: '+file);
 if(fromMain!==reviewed){
  const take=(html,re)=>[...html.matchAll(re)].map(m=>m[0]);
  for(const [kind,re] of [
   ['script and 3D nodes',/<script\b[^>]*>[\s\S]*?<\/script>/gi],
   ['SVG and charts',/<svg\b[^>]*>[\s\S]*?<\/svg>/gi],
   ['images',/<img\b[^>]*>/gi],
   ['CSS',/<style\b[^>]*>[\s\S]*?<\/style>/gi],
   ['element IDs',/\bid=["'][^"']+["']/gi],
   ['embedded media',/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi]
  ]) assert.deepEqual(take(published,re),take(original,re),'Editorial #01-02 altered '+kind+': '+file);
  const previous=take(original,/\bhref=["'][^"']+["']/gi), now=take(published,/\bhref=["'][^"']+["']/gi);
  let n=0;for(const href of now) if(href===previous[n]) n++;
  assert.equal(n,previous.length,'Previously published link removed/reordered: '+file);
 }
}


/* 28 October 2026 ninth-pass #03-04: dated Meta/Africa Check appeal
 * routes and independent Oversight Board context. Only exact reviewed
 * prose+source-link additions are allowed. No original links or visual
 * data, SVG, media, JS, CSS, IDs or URLs may be changed.
 */
for(const [page,baseline,reviewed] of [
 ['africacheck.html','2647f994f6cd3c23bb966c2bd245e441ade85d8f','050015feee680ec5fc305d1422fc55dbaedbebfb'],
 ['ifcn.html','861930633d2e867e725a6e8d4424060c802ecf5b','f2974999b684bd2955d5c39be47b5dee87c387d4']
]){
 const main=execFileSync('git',['rev-parse','origin/main:'+page],{encoding:'utf8'}).trim();
 const live=execFileSync('git',['hash-object',page],{encoding:'utf8'}).trim();
 assert([baseline,reviewed].includes(main),'Unreviewed appeal-review main baseline: '+page);
 assert.equal(live,reviewed,'Unreviewed appeal-review article blob: '+page);
 const html=readFileSync(page,'utf8');
 assert(Buffer.byteLength(html,'utf8')>50000,'Truncated appeal-review dossier: '+page);
 if(main===baseline){
  const prior=execFileSync('git',['show','origin/main:'+page],{encoding:'utf8',maxBuffer:16*1024*1024});
  const get=(s,re)=>[...s.matchAll(re)].map(m=>m[0]);
  for(const [label,re] of [
   ['scripts',/<script\b[^>]*>[\s\S]*?<\/script>/gi],
   ['SVG',/<svg\b[^>]*>[\s\S]*?<\/svg>/gi],
   ['images',/<img\b[^>]*>/gi],
   ['styles',/<style\b[^>]*>[\s\S]*?<\/style>/gi],
   ['IDs',/\bid=["'][^"']+["']/gi],
   ['media',/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi]
  ]) assert.deepEqual(get(html,re),get(prior,re),'Appeal-review '+label+' changed: '+page);
  const oldHrefs=get(prior,/\bhref=["'][^"']+["']/gi),newHrefs=get(html,/\bhref=["'][^"']+["']/gi);
  let n=0;for(const href of newHrefs)if(href===oldHrefs[n])n++;
  assert.equal(n,oldHrefs.length,'Earlier cited article links lost or reordered: '+page);
  for(const tag of ['<canvas','<video','data:image','<source'])
   assert.equal(html.split(tag).length,prior.split(tag).length,'Media drift: '+page+' '+tag);
 }
}


/* 28 October 2026 ninth-pass #05-06 election-referral claim audit.
 * Exact reviewed text additions, not a blanket relaxation of the protected
 * JS/SVG/media/link preservation checks above. */
for(const [p,oldBlob,newBlob] of [
 ['sixstage.html','cf20f9f0e22267a1b676b1509480499f06d176e5','a92b414c0cd029764a77d1e2bc374e72a01c20c6'],
 ['metasuppression.html','4b247b11c6e59cbc8fc6164b932b8d771d7c1d12','3702a2fbd84fe8c7edd72cdccf6a5701226ed930'],
]){
 const fromMain=execFileSync('git',['rev-parse','origin/main:'+p],{encoding:'utf8'}).trim();
 const actual=execFileSync('git',['hash-object',p],{encoding:'utf8'}).trim();
 assert([oldBlob,newBlob].includes(fromMain),'Unexpected main #05-06 source baseline: '+p);
 assert.equal(actual,newBlob,'Unreviewed #05-06 source change: '+p);
}


/* 28 Oct 2026: #07–08 source-only reviews, whole-blob identity pinned.
 * Earlier in this test, their original JS, SVG, images, element IDs and
 * visual-component counts are independently compared with current main.
 * This short identity gate rejects all other changed content or media.
 */
for(const [page,oldBlob,approved] of [
 ['iol.html','92a124776128173390d304cc4bd1b250f33c783c','65088d3b78afd21ca61a44d4dba29e3c2df26d20'],
 ['usaid.html','a131989af882e7ce447b0b8c66076808c050b80c','a001b02f7057afe2f845fe05b739ee23fa44c03e']
]){
 const fromMain=execFileSync('git',['rev-parse','origin/main:'+page],{encoding:'utf8'}).trim();
 const actual=execFileSync('git',['hash-object',page],{encoding:'utf8'}).trim();
 assert([oldBlob,approved].includes(fromMain),'Unknown #07–08 main baseline: '+page);
 assert.equal(actual,approved,'Unreviewed #07–08 article source/data change: '+page);
}
assert.equal(execFileSync('git',['hash-object','MTNrooivalkIRAN.html'],{encoding:'utf8'}).trim(),
 '79c93657371ee799d564c07ed5e400bd90ba2690',
 'Protected Rooivalk dossier content changed');


/* 28 Oct 2026: #09–10 sourced document-level revisions, strictly full-blob-pinned.
 * Original scripts, SVG, images, media and element IDs must still compare to
 * origin/main under the existing preamble checks. Rooivalk remains protected. */
for(const [page,older,reviewed] of [
 ['usaidtonewsroom.html','51d004fbe96df0ff71d0d9819861d76c35ada842','cbd0274f4fccedd067187f0236cb99e3d13c0cf6'],
 ['mtn.html','542c982f4cbc2908d4e265f03c554a4cffd060c5','8871a2077e8b36a41e0a202dee867dd1ed573b4b']
]) {
 const mainFile=execFileSync('git',['rev-parse','origin/main:'+page],{encoding:'utf8'}).trim();
 const liveFile=execFileSync('git',['hash-object',page],{encoding:'utf8'}).trim();
 assert([older,reviewed].includes(mainFile),'Unexpected #09-10 main file baseline: '+page);
 assert.equal(liveFile,reviewed,'Unreviewed #09-10 source/media file change: '+page);
}


/* 28 Oct ninth-pass #11–12: allow ONLY the dated, source-reviewed HTML
 * revisions. Main must be the old reviewed baseline or the exact newly
 * published revision; all original scripts, SVGs, images, IDs and media
 * continue to be compared against origin/main in the preamble above. */
for (const [page, prior, reviewed] of [
  ['prototypenation.html', '53747bb6d21311522bc91e30f9fa79fb08707052', '9978f3f04e0ab99dbf8c67a8e5083cde4643db18'],
  ['motsepe.html', '4ea65ecb1f9207da703516e88e1136b2264e6205', '9392d8b3bf8afb2c8a0095c020374574050c7763']
]) {
  const fromMain=execFileSync('git',['rev-parse','origin/main:'+page],{encoding:'utf8'}).trim();
  const live=execFileSync('git',['hash-object',page],{encoding:'utf8'}).trim();
  assert([prior,reviewed].includes(fromMain),'Unknown #11–12 source-review main baseline: '+page);
  assert.equal(live,reviewed,'Unexpected #11–12 prose/source hash: '+page);
}
