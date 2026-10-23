import {readFileSync,existsSync,statSync} from 'node:fs';
import assert from 'node:assert/strict';
const hub=readFileSync('index.html','utf8');
const local=[...hub.matchAll(/<a class="card" href="([^"]+)"/g)].map(m=>m[1]).filter(s=>!s.startsWith('https://'));
assert.equal(local.length,29,'Expected 29 local articles');
const js=readFileSync('assets/site-branding.js','utf8');
const css=readFileSync('assets/story-art.css','utf8');
assert(js.includes('placeArticleArtwork'),'Feature injector missing');
assert(css.includes('aspect-ratio: 5 / 2'),'Editorial 5:2 ratio missing');
assert(css.includes('prefers-reduced-motion'),'Reduced motion support missing');
for(const p of local){
 const path='assets/story-art/'+p.replace(/\.html$/,'')+'.svg';
 assert(existsSync(path),'Missing feature illustration '+p);
 assert(statSync(path).size>4000,'Artwork incomplete '+p);
 const x=readFileSync(path,'utf8');
 assert(x.includes('viewBox="0 0 1600 640"'), 'Wrong ratio '+p);
 assert(x.startsWith('<svg')&&x.endsWith('</svg>'), 'Malformed SVG boundary '+p);
 assert(!/<script|<foreignObject|javascript:|onload=/i.test(x),'Unsafe SVG '+p);
 assert(js.includes('"'+p+'":{"asset":"'+path+'"'),'Missing topic mapping '+p);
 const html=readFileSync(p,'utf8');
 if(p!=='MTNrooivalkIRAN.html'){
   assert(html.includes('site-branding.js'),'Missing shared image hook '+p);
 }
}
assert(readFileSync('MTNrooivalkIRAN.html','utf8').length>1000000,'Giant preserved investigation must not be emptied');
const giantCSS=readFileSync('assets/dossier-batch-16-18.css','utf8');
assert(giantCSS.includes('story-art/MTNrooivalkIRAN.svg'),'Giant page illustration placement missing');
assert(giantCSS.includes('.aa-premium--rooivalk .stat-row::after'),'Rooivalk placement selector missing');
console.log('29 original editorial illustrations verified; 28 injected + large archive CSS artwork.');
