import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const journalist=readFileSync('sa_journalists.html','utf8');
const roster=readFileSync('44afrikaners.html','utf8');
const graph=readFileSync('assets/journalists-network.mjs','utf8');
const css=readFileSync('assets/investigation-premium.css','utf8');
for(const [path,html] of [['sa_journalists.html',journalist],['44afrikaners.html',roster]]){
 assert(html.includes('href="assets/investigation-premium.css"'),path+' premium stylesheet missing');
 assert(!html.includes('three.js/r128/three.min.js'),path+' legacy Three.js source remains');
 assert(html.includes('id="cv"')||html.includes('id="threeCv"'),path+' original graph canvas must remain');
 assert(/<title>[^<]+<\/title>/.test(html),path+' editorial title missing');
}
assert(journalist.includes('src="assets/journalists-network.mjs"'),'Journalist ES module not referenced');
assert(journalist.includes('id="journalist-entity-search"'),'Journalist accessible search missing');
assert(journalist.includes('id="journalist-entity-list"'),'Journalist accessible list missing');
assert(roster.includes('id="graph-access-status"'),'3D fallback status missing');
assert(graph.includes("three@0.186.0/build/three.module.js"),'Pinned modern three.js required');
assert(roster.includes("three@0.186.0/build/three.module.js"),'Roster must import modern Three.js');
assert(graph.includes('prefers-reduced-motion')&&roster.includes('prefers-reduced-motion'),'Reduced motion missing');
assert(graph.includes('document.hidden')&&roster.includes('document.hidden'),'Visibility-aware performance missing');
assert(graph.includes('textContent=n.n'),'Directory must escape display names through DOM');
assert(css.includes('@media(max-width:620px)'),'Mobile styles missing');
console.log('Journalist premium 3D structural checks passed');
