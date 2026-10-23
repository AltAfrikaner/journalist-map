import {readFileSync,existsSync,statSync} from 'node:fs';
import assert from 'node:assert/strict';
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
 const inside='assets/story-art/'+slug+'-inside.svg';
 assert(html.includes('href="'+cover+'"'),'Cover preload absent: '+page);
 assert(html.includes('site-branding.js'),'Shared renderer missing: '+page);
 assert(brand.includes("'"+page+"':{after:'"+anchor+"'"),'Incorrect inside placement: '+page);
 assert(brand.includes("asset:'"+inside+"'"),'Inside asset unmapped: '+page);
 if(anchor.startsWith('#'))assert(html.includes('id="'+anchor.slice(1)+'"'),'Article anchor absent '+page);
 else assert(html.includes('class="pipeline"'),'Pipeline anchor absent '+page);
 for(const [type,p,ratio] of [['cover',cover,'viewBox="0 0 1600 640"'],['inside',inside,'viewBox="0 0 1600 900"']]){
  assert(existsSync(p),type+' image missing '+page);
  assert(statSync(p).size>3800,'Insufficient detail in '+p);
  const s=readFileSync(p,'utf8');
  assert(s.startsWith('<svg ') && s.trimEnd().endsWith('</svg>'),'Malformed SVG '+p);
  assert(s.includes(ratio),'Wrong SVG size '+p);
  assert(!/<script|<foreignObject|javascript:|onload=|<image\b/i.test(s),'Unsafe external or executable image '+p);
 }
}
const links=[...readFileSync('index.html','utf8').matchAll(/<a class="card" href="([^"]+)"/g)].map(x=>x[1]);
assert.equal(links.length,31,'Original archive entries changed');
assert(readFileSync('MTNrooivalkIRAN.html','utf8').length>2_000_000,'Large Rooivalk file must remain restored');
console.log('Five article covers and five in-article illustrations verified with source anchors and 31 archive routes.');
