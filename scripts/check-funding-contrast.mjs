import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const css=readFileSync('assets/investigation-contrast.css','utf8');
const html=readFileSync('osf-funded-orgs.html','utf8');
for(const selector of ['.cf-box','.stacked-box','.cf-chain','.stacked-example'])assert(html.includes(selector.slice(1)),'Missing funding panel: '+selector);
for(const fragment of ['body.aa-premium--funding-atlas .cf-box','body.aa-premium--funding-atlas .stacked-box','background:#fffdfa!important','color:#253548!important','background:#edf4ef!important','color:#123f2a!important','background:#f1eaf7!important','color:#3f256a!important'])assert(css.includes(fragment),'Missing colour-pair override: '+fragment);
function rgb(hex){const h=hex.replace('#','');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255)}
function luminance(hex){return rgb(hex).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0)}
function contrast(a,b){const [l,h]=[luminance(a),luminance(b)].sort((x,y)=>x-y);return (h+.05)/(l+.05)}
for(const [fg,bg] of [['#253548','#fffdfa'],['#175334','#fffdfa'],['#58308b','#fffdfa'],['#123f2a','#edf4ef'],['#3f256a','#f1eaf7']])assert(contrast(fg,bg)>=4.5,'Insufficient funding panel contrast: '+fg+' on '+bg);
console.log('Funding panel colour pairs meet WCAG AA regular-text contrast.');
