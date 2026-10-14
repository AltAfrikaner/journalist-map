import {CAT,NODES,EDGES} from './osf-graph-data.mjs';
const input=document.getElementById('osf-entity-search');
const output=document.getElementById('osf-entity-results');
const status=document.getElementById('osf-graph-status');
if(input&&output){
  const byId=new Map(NODES.map(n=>[n.id,n]));
  const relations=new Map(NODES.map(n=>[n.id,[]]));
  for(const [a,b,type] of EDGES){
    if(relations.has(a)&&byId.has(b))relations.get(a).push({node:byId.get(b),type});
    if(relations.has(b)&&byId.has(a))relations.get(b).push({node:byId.get(a),type});
  }
  function render(){
    const term=input.value.trim().toLocaleLowerCase();
    const filtered=NODES.filter(n=>(n.label+' '+(CAT[n.cat]?.label||'')+' '+(n.desc||'')).toLocaleLowerCase().includes(term));
    output.replaceChildren();
    const frag=document.createDocumentFragment();
    for(const n of filtered){
      const item=document.createElement('article');item.className='osf-entity';
      const heading=document.createElement('strong');heading.textContent=n.label;item.appendChild(heading);
      const category=document.createElement('small');category.textContent=CAT[n.cat]?.label||n.cat;item.appendChild(category);
      const desc=document.createElement('p');desc.textContent=n.desc||'';item.appendChild(desc);
      if(n.detail){const detail=document.createElement('p');detail.textContent=n.detail;item.appendChild(detail);}
      const related=document.createElement('small');
      related.textContent='Recorded graph relationships: '+(relations.get(n.id)||[]).map(r=>r.node.label+' ('+r.type+')').join('; ');
      item.appendChild(related);
      frag.appendChild(item);
    }
    output.appendChild(frag);
    output.setAttribute('aria-label',filtered.length+' matching entities');
  }
  input.addEventListener('input',render);
  render();
  if(status)status.textContent='Explore the 3D graph or use the searchable entity directory below.';
}
