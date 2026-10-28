import { readdirSync, readFileSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';
import { join } from 'node:path';
const root=process.cwd();
const crawl=(dir)=>readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()? (['.git','node_modules'].includes(x.name)?[]:crawl(join(dir,x.name))):x.name.endsWith('.html')?[join(dir,x.name)]:[]);
const paths=crawl(root);
const report=[];
for(const path of paths){
 const s=readFileSync(path,'utf8');
 const rel=path.slice(root.length+1);
 const lightText=(s.match(/color\s*:\s*(?:rgba\(244,\s*240,\s*232\s*,\s*0\.[0-9]+\)|#(?:fff(?:fff)?|f[0-9a-f]{5}))/gi)||[]).length;
 const lightBackdrop=(s.match(/background(?:-color)?\s*:\s*(?:#(?:fff(?:fff)?|f[0-9a-f]{5}|eee[0-9a-f]{3})|var\(--paper\))/gi)||[]).length;
 const explicitContrast=s.includes('investigation-contrast.css');
 report.push({path:rel,bytes:statSync(path).size,potential_light_text_rules:lightText,potential_light_backdrops:lightBackdrop,has_contrast_layer:explicitContrast});
}
assert(paths.length>=40,'Unexpectedly small HTML inventory; check the repo checkout');
const omidyar=readFileSync(join(root,'omidyar.html'),'utf8');
const contrastCSS=readFileSync(join(root,'assets/investigation-contrast.css'),'utf8');
assert(omidyar.includes('id="primer"'),'Omidyar primer missing');
assert(contrastCSS.includes('body.aa-premium--omidyar main #primer'),'Omidyar contrast regression: primer not explicitly scoped');
assert(contrastCSS.includes('color:#263749!important'),'Omidyar primer text not secured against pale inline text');
assert(contrastCSS.includes('body.aa-premium--omidyar main #primer a'),'Omidyar primer links need an explicit high contrast colour');

const target=readFileSync(join(root,'assets/investigation-contrast.css'),'utf8');
for(const token of ['body.aa-premium--funding-atlas .usaid-note','body.aa-premium--funding-atlas .cf-box','body.aa-premium--funding-atlas .stacked-box','body.aa-premium--funding-atlas section:not(.hero) > .section-inner > p[style*="color:rgba(244,240,232"]']){
 assert(target.includes(token),'Missing audited contrast override: '+token);
}
const missing=report.filter(x=>x.bytes===0);
console.log('Scanned '+report.length+' HTML pages; '+report.filter(x=>x.has_contrast_layer).length+' use the shared contrast layer.');
if(missing.length)console.log('Existing empty HTML files (not silently certified): '+missing.map(x=>x.path).join(', '));
const flagged=report.filter(x=>x.potential_light_text_rules>0&&x.potential_light_backdrops>0);
console.log('Pages with both pale text and light backgrounds requiring rendered inspection: '+flagged.length);
console.log(JSON.stringify({generated:'static-rule-inventory',pages:report},null,2));
console.log('NOTE: Static CSS token co-occurrence is not proof of a contrast failure or accessibility conformance. Rendered desktop/mobile pixel and computed-style testing remains necessary.');
