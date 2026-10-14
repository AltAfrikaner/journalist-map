import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CAT,NODES,EDGES} from '../assets/osf-graph-data.mjs';
const html=readFileSync('osf.html','utf8');
const renderer=readFileSync('assets/osf-network.mjs','utf8');
const accessible=readFileSync('assets/osf-entity-list.mjs','utf8');
assert.equal(NODES.length,67,'OSF original graph must retain 67 nodes');
assert.equal(Object.keys(CAT).length,14,'Preserve original 14-category taxonomy');
assert(NODES.every(n=>n.id&&n.label),'All nodes need IDs and labels');
const byId=new Set(NODES.map(n=>n.id));
assert.equal(byId.size,NODES.length,'Node IDs must be unique');
assert(EDGES.every(e=>e.length>=3&&byId.has(e[0])&&byId.has(e[1])&&e[2]),'Every relationship must reference existing nodes with a type');
for(const token of ['id="map3d"','id="threeCv"','id="node-panel"','id="provenance"','id="osf-entity-search"','id="osf-entity-results"','src="assets/osf-network.mjs"','src="assets/osf-entity-list.mjs"']){
 assert(html.includes(token),'Missing preserved or new HTML hook: '+token);
}
assert(!html.includes('three.js/r128/three.min.js'),'Legacy Three.js loader should be removed');
assert(renderer.includes('three@0.186.0/build/three.module.js'),'Pinned module version required');
assert(!renderer.includes('pb.innerHTML'),'Node detail must not interpolate HTML');
assert(renderer.includes('prefers-reduced-motion'),'Reduced motion support required');
assert(renderer.includes('ResizeObserver'),'Resize observer required');
assert(renderer.includes('document.hidden'),'Background performance control required');
assert(accessible.includes('textContent'),'Accessible text must not be rendered as HTML');
console.log('OSF source-contract checks passed:',NODES.length,'nodes,',EDGES.length,'edges,',Object.keys(CAT).length,'categories');
