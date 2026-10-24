/**
 * Publication structural smoke test: the homepage and every local story route.
 * Read-only, dependency-free. A source/file check is not a rendered-browser test.
 * External CitizenIntel destinations are not writable from this repository.
 */
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {dirname,join,normalize} from 'node:path';

const read = file => readFileSync(file,'utf8');
const home = read('index.html');
const coverCSS = read('assets/hub-departments.css');
const featureJS = read('assets/site-branding.js');
const routes = [...home.matchAll(/<a class="card" href="([^"]+)"/g)].map(m=>m[1]);
const local = routes.filter(x=>!x.startsWith('https://'));
assert.equal(routes.length,31,'Archive must retain 31 investigations');
assert.equal(local.length,29,'Archive must retain 29 local investigations');
assert.equal(routes.length,new Set(routes).size,'Archive routes must be unique');
const order = ['<section class="hero"','id="articles"','id="featured"','id="investigations"','<footer id="site-information">'].map(x=>home.indexOf(x));
assert(order.every(x=>x>=0)&&order.every((x,i)=>!i||x>order[i-1]),
 'Homepage content order must be hero, top article feature, featured investigations, archive, footer');
assert(/<footer id="site-information">\s*<div class="footer-topline">/.test(home),
 'Malformed footer HTML breaks the publication layout');
assert(home.includes('id="aa-articles-title"'),'Missing editorial department heading');
assert(coverCSS.includes('object-fit:contain'),'Article feature image must not be cropped');
assert(featureJS.includes("anchor.insertAdjacentElement('afterend', fig)"),
 'Artwork must sit after complete hero/header rather than directly inside a headline');

function localFileRef(page, href) {
  if (!href || /^(?:#|https?:|\/\/|mailto:|tel:|data:|javascript:)/i.test(href)) return null;
  const plain = href.split(/[?#]/,1)[0];
  if (!plain) return null;
  const name = plain.startsWith('/')?plain.slice(1):join(dirname(page),plain);
  const rel = normalize(name);
  return !rel || rel==='.' ? 'index.html' : rel;
}

const pagePaths = ['index.html','articles/index.html',
 'articles/tom-eaton-trojan-horse.html',
 'articles/jimmy-smith-paul-kruger-artillery-shrapnel.html'];
for (const route of local) {
  assert(existsSync(route),'Broken investigation link: '+route);
  const art='assets/story-art/'+route.replace(/\.html$/,'')+'.svg';
  assert(existsSync(art),'Missing illustration '+art);
  assert(coverCSS.includes('href="'+route+'"]::before'),
    'No homepage cover rule for '+route);
  if(route!=='MTNrooivalkIRAN.html')pagePaths.push(route);
}

let linksChecked=0,imagesChecked=0;
for (const file of pagePaths) {
  const html=read(file);
  assert(/<h1\b/i.test(html),'No primary heading: '+file);
  assert(/<\/body>/i.test(html),'Missing closing body: '+file);
  assert(/<\/html>\s*$/i.test(html),'Missing closing html: '+file);
  // Ignore script/style strings that contain HTML-like example snippets.
  const visible=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'')
    .replace(/<!--[\s\S]*?-->/g,'');
  const images=[...visible.matchAll(/<img\b[^>]*>/gi)].map(m=>m[0]);
  for(const tag of images){
    assert(/\balt\s*=/.test(tag),'Unlabelled static image in '+file);
    imagesChecked++;
  }
  const refs=[...visible.matchAll(/<(?:a|img|link|iframe)\b[^>]*?\b(?:href|src)="([^"]+)"/gi)].map(m=>m[1]);
  refs.push(...[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/gi)].map(m=>m[1]));
  for(const url of refs){
    const dest=localFileRef(file,url);
    if(!dest)continue;
    assert(!dest.startsWith('..'),'Local link escapes repository: '+file+' -> '+url);
    assert(existsSync(dest)||existsSync(join(dest,'index.html')),
      'Missing local asset/link: '+file+' -> '+url+' ('+dest+')');
    linksChecked++;
  }
}
console.log('Publication structural checks passed: '+pagePaths.length+
 ' locally editable pages + preserved oversized Rooivalk archive; '+
 linksChecked+' local references and '+imagesChecked+' image alt attributes checked.');
