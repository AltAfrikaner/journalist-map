import {readFileSync,existsSync,statSync} from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const pages=[
 ['osf.html','#board'],
 ['sa_journalists.html','#patterns'],
 ['africacheck.html','#funding'],
 ['ifcn.html','#guild'],
 ['sixstage.html','.pipeline']
];
const brand=readFileSync('assets/site-branding.js','utf8');
const css=readFileSync('assets/story-pairs.css','utf8');
assert(brand.includes('function placeStoryDetailArt'),'Missing in-article image injector');
assert(brand.includes("document.createElement('figure')"),'Images must be actual figures, not CSS-only decorations');
assert(brand.includes('not documentary evidence'),'Illustration caption / fact boundary missing');
assert(css.includes('aspect-ratio:16 / 9'),'16:9 interior-image ratio missing');
assert(css.includes('prefers-reduced-motion'),'No reduced motion support');
for(const [page,anchor] of pages){
 const slug=page.slice(0,-5);
 const html=readFileSync(page,'utf8');
 const cover='assets/story-art/'+slug+'.svg';
 // #02's published inside illustration is a reviewed premium JPEG, not the older unused SVG.
 const inside=page==='sa_journalists.html'?'assets/articles/sa-journalists-network-premium.jpg':'assets/story-art/'+slug+'-inside.svg';
 assert(html.includes('href="'+cover+'"'),'Cover preload absent: '+page);
 assert(html.includes('site-branding.js'),'Shared renderer missing: '+page);
 assert(brand.includes("'"+page+"':{after:'"+anchor+"'"),'Incorrect inside placement: '+page);
 assert(brand.includes("asset:'"+inside+"'"),'Inside asset unmapped: '+page);
 if(anchor.startsWith('#'))assert(html.includes('id="'+anchor.slice(1)+'"'),'Article anchor absent '+page);
 else assert(html.includes('class="pipeline"'),'Pipeline anchor absent '+page);
 for(const [type,p,ratio] of [['cover',cover,'viewBox="0 0 1600 640"'],['inside',inside,'viewBox="0 0 1600 900"']]){
  assert(existsSync(p),type+' image missing '+page);
  assert(statSync(p).size>3800,'Insufficient detail in '+p);
  if(type==='inside' && page==='sa_journalists.html'){
   assert.equal(statSync(p).size,414557,'Journalist premium inside artwork changed size');
   assert.equal(execFileSync('git',['hash-object',p],{encoding:'utf8'}).trim(),'fd12ecdaeb619a0b9242fe0de9f989f000f53484','Journalist premium inside artwork changed hash');
   continue;
  }
  const s=readFileSync(p,'utf8');
  assert(s.startsWith('<svg ') && s.trimEnd().endsWith('</svg>'),'Malformed SVG '+p);
  assert(s.includes(ratio),'Wrong SVG size '+p);
  assert(!/<script|<foreignObject|javascript:|onload=|<image\b/i.test(s),'Unsafe external or executable image '+p);
 }
}
const links=[...readFileSync('index.html','utf8').matchAll(/<a class="card" href="([^"]+)"/g)].map(x=>x[1]);
assert.equal(links.length,31,'Original archive entries changed');
// The Rooivalk dossier has several independently reviewed, exact-byte cover variants.
// Two approved versions substitute a remote cover image, reducing HTML bytes but not
// dossier text/graph integrity. Match the editorial check's exact-hash guard instead
// of accepting arbitrary small or zero-byte pages.
const rooivalkPath='MTNrooivalkIRAN.html';
const rooivalkText=readFileSync(rooivalkPath,'utf8');
const rooivalkBytes=Buffer.byteLength(rooivalkText,'utf8');
const rooivalkHash=execFileSync('git',['hash-object',rooivalkPath],{encoding:'utf8'}).trim();
const rooivalkFull=new Set([
 'cf9a1477877ecd556eec468be5372e8aeea63e3c',
 'e4bfee4b5829065e74c443e89559d29af7af1ad9',
 '36f032ff4f0028743f3747c548acf5f9e4418e10',
 '4fd4f4dad223e8977f704be50bd3ed48399793aa',
 '12a93cb7b98c8318ae530c93bb8b3d76bb740f29'
]);
const rooivalkRemote=new Set([
 '78ed6a7b7af2461465ca3e19f50f9b0a3af0249b',
 '303d26d3687f4e004f929559b86b30eb8b0e1947',
 '652dab0ceab3eafdb48b603ccc0aa8f832b1d3b6',
 '79c93657371ee799d564c07ed5e400bd90ba2690' // Reviewed 25 Oct legal-chronology dossier; the same exact blob is pinned in check-dossiers.mjs.
]);
assert(rooivalkFull.has(rooivalkHash)||rooivalkRemote.has(rooivalkHash),
 'Unknown, zero-sized or truncated Rooivalk dossier: exact reviewed Git identity required');
if(rooivalkRemote.has(rooivalkHash)){
 assert(rooivalkBytes>1_740_000,'Approved remote-cover Rooivalk dossier unexpectedly truncated');
 assert.equal((rooivalkText.match(/data:image\//g)||[]).length,14,'Rooivalk inline evidence images changed');
 assert(rooivalkText.includes('https://d2ol7oe51mr4n9.cloudfront.net/user_39LyNd3yWOiGeUhnS3CdfDw25su/0e814109-6230-401e-83bb-520d2a5dd424.png'),
  'Reviewed Rooivalk cover URL missing');
}else{
 assert(rooivalkBytes>2_090_000,'Approved full-size Rooivalk dossier unexpectedly truncated');
}
console.log('Five article covers and five in-article illustrations verified with source anchors and 31 archive routes.');
