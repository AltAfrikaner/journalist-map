import {CAT,NODES,EDGES} from './osf-graph-data.mjs';
(async function(){
  let THREE;
  try{
    THREE=await import('https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js');
  }catch(error){
    const el=document.getElementById('osf-graph-status');
    if(el)el.textContent='3D module could not load. Use the searchable entity list and investigation text below.';
    console.error('Three.js module load failed',error);
    return;
  }
/* ═══════════════════════════════════════
   BUILD SCENE
   ═══════════════════════════════════════ */
const container=document.getElementById('map3d');
let cw=container.clientWidth,ch=container.clientHeight;
let ren;
try{ren=new THREE.WebGLRenderer({canvas:document.getElementById('threeCv'),antialias:true,alpha:false});}
catch(error){document.getElementById('osf-graph-status').textContent='Interactive 3D is unavailable on this device. Use the accessible entity list below.';console.error('WebGL initialization failed',error);return;}
ren.setSize(Math.max(cw,1),Math.max(ch,1),false);ren.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
ren.setClearColor(0xf0ece3);

const scene=new THREE.Scene();
scene.fog=new THREE.Fog(0xf0ece3,110,260);
const cam=new THREE.PerspectiveCamera(38,cw/ch,0.5,400);
cam.position.set(0,30,88);cam.lookAt(0,0,0);

// Better lighting
scene.add(new THREE.AmbientLight(0xffffff,.6));
const dl=new THREE.DirectionalLight(0xfff8e8,.6);dl.position.set(12,20,8);scene.add(dl);
const dl2=new THREE.DirectionalLight(0xd0e0f0,.25);dl2.position.set(-10,10,-5);scene.add(dl2);

const meshes={};
NODES.forEach(n=>{
  const c=CAT[n.cat]?.col||0x888888;
  const geo=new THREE.SphereGeometry((n.r||1)*0.7,24,18);
  const mat=new THREE.MeshStandardMaterial({color:c,roughness:.32,metalness:.12,transparent:true,opacity:0.8});
  const m=new THREE.Mesh(geo,mat);
  m.position.set(n.x*1.3,n.y*1.3,n.z*1.3);m.userData=n;
  scene.add(m);meshes[n.id]=m;
});

/* ── Lines: THICKER, DARKER ── */
const lines=[];
EDGES.forEach(([a,b,type])=>{
  const ma=meshes[a],mb=meshes[b];if(!ma||!mb)return;
  const pts=[ma.position.clone(),mb.position.clone()];
  const geo=new THREE.BufferGeometry().setFromPoints(pts);
  let col,opacity,width;
  switch(type){
    case'owns':col=0xc5a258;opacity=.65;break;
    case'grants':col=0x8B0000;opacity=.4;break;
    case'funds':case'cofunds':col=0x1a6a3a;opacity=.35;break;
    case'staff':case'chair':case'president':case'director':case'board':col=0xd08030;opacity=.5;break;
    case'certified':case'authorises':case'partner':col=0x444444;opacity=.55;break;
    case'cited':case'echo':col=0x3a5a80;opacity=.3;break;
    default:col=0x666666;opacity=.2;
  }
  const mat=new THREE.LineBasicMaterial({color:col,transparent:true,opacity:opacity,linewidth:1});
  const ln=new THREE.Line(geo,mat);ln.userData={from:a,to:b,type};
  scene.add(ln);lines.push(ln);
});

/* ── Panel logic ── */
let hoveredNode=null;
const tt=document.getElementById('tooltip');
const ttLabel=tt.querySelector('.tt-label');
const ttCat=tt.querySelector('.tt-cat');
const ttDesc=tt.querySelector('.tt-desc');
const ttDetail=tt.querySelector('.tt-detail');

function openPanel(n){
  const pb=document.getElementById('panelBody');
  const ci=CAT[n.cat]||{label:'Unknown',col:0x888888};
  const hx='#'+ci.col.toString(16).padStart(6,'0');
  let conns=[];
  EDGES.forEach(([a,b,t])=>{
    if(a===n.id){const tn=NODES.find(x=>x.id===b);if(tn)conns.push(tn.label+' ('+t+')');}
    if(b===n.id){const tn=NODES.find(x=>x.id===a);if(tn)conns.push(tn.label+' ('+t+')');}
  });
  pb.replaceChildren();
  function addText(cls,value){
    const element=document.createElement('div');element.className=cls;element.textContent=String(value??'');pb.appendChild(element);return element;
  }
  const badge=addText('panel-badge',ci.label);
  badge.style.background=hx+'22';badge.style.color=hx;badge.style.border='1px solid '+hx+'44';
  addText('panel-name',n.label);addText('panel-cat',ci.label);
  addText('panel-desc',n.desc||'');
  if(n.detail)addText('panel-detail',n.detail);
  addText('panel-connections-h','Connections ('+conns.length+')');
  for(const relation of conns)addText('panel-conn',relation);
  const source=document.createElement('a');source.href='#provenance';
  source.className='osf-evidence-link';source.textContent='Review source methodology and provenance ↓';
  pb.appendChild(source);
  const note=addText('panel-detail','Network lines represent recorded relationships in this investigation; a visual link alone does not establish causation or wrongdoing.');
  note.classList.add('osf-evidence-note');
  document.getElementById('node-panel').classList.add('open');
  document.getElementById('panel-backdrop').classList.add('open');
  document.getElementById('panel-backdrop').style.display='block';
  tt.classList.remove('show');
}
window.closePanel=function(){
  document.getElementById('node-panel').classList.remove('open');
  document.getElementById('panel-backdrop').classList.remove('open');
  document.getElementById('panel-backdrop').style.display='none';
};
document.getElementById('panel-backdrop').onclick=window.closePanel;

/* ── Raycaster ── */
const ray=new THREE.Raycaster();const mv=new THREE.Vector2();
let isDragging=false,dragMoved=false;
container.addEventListener('pointerdown',()=>{isDragging=true;dragMoved=false;});
window.addEventListener('pointermove',e=>{
  if(isDragging){dragMoved=true;return;}
  const rect=container.getBoundingClientRect();
  mv.x=((e.clientX-rect.left)/rect.width)*2-1;
  mv.y=-((e.clientY-rect.top)/rect.height)*2+1;
  ray.setFromCamera(mv,cam);
  const hits=ray.intersectObjects(Object.values(meshes));
  if(hits.length){
    const n=hits[0].object.userData;hoveredNode=n;container.style.cursor='pointer';
    ttLabel.textContent=n.label;ttCat.textContent=CAT[n.cat]?.label||n.cat;
    ttDesc.textContent=(n.desc||'').slice(0,200)+(n.desc?.length>200?'...':'');
    ttDetail.textContent=n.detail||'';
    tt.style.left=(e.clientX+18)+'px';tt.style.top=(e.clientY-22)+'px';
    tt.classList.add('show');
  } else {hoveredNode=null;container.style.cursor='grab';tt.classList.remove('show');}
});
window.addEventListener('pointerup',()=>{isDragging=false;tt.classList.remove('show');});
container.addEventListener('click',e=>{
  if(dragMoved)return;
  const rect=container.getBoundingClientRect();
  mv.x=((e.clientX-rect.left)/rect.width)*2-1;
  mv.y=-((e.clientY-rect.top)/rect.height)*2+1;
  ray.setFromCamera(mv,cam);
  const hits=ray.intersectObjects(Object.values(meshes));
  if(hits.length)openPanel(hits[0].object.userData);
});

/* ── Orbit ── */
let rotX=0.18,rotY=0,tRotX=0.18,tRotY=0,camDist=88;
let pX=0,pY=0,dragging3d=false;
container.addEventListener('pointerdown',e=>{dragging3d=true;pX=e.clientX;pY=e.clientY;});
window.addEventListener('pointermove',e=>{
  if(!dragging3d)return;
  tRotY+=(e.clientX-pX)*0.005;tRotX+=(e.clientY-pY)*0.003;
  tRotX=Math.max(-1.1,Math.min(1.1,tRotX));pX=e.clientX;pY=e.clientY;
});
window.addEventListener('pointerup',()=>{dragging3d=false;});
container.addEventListener('wheel',e=>{
  e.preventDefault();camDist+=e.deltaY*.04;
  camDist=Math.max(35,Math.min(200,camDist));
},{passive:false});
const resizeGraph=()=>{cw=Math.max(container.clientWidth,1);ch=Math.max(container.clientHeight,1);cam.aspect=cw/ch;cam.updateProjectionMatrix();ren.setSize(cw,ch,false);};
const graphResize=new ResizeObserver(resizeGraph);graphResize.observe(container);

/* ── Filters ── */
window._catFilter='all';window._searchFilter='';
const lblContainer=document.getElementById('nodeLabels');
const labelEls={};
NODES.forEach(n=>{
  const el=document.createElement('div');el.className='nlbl';
  el.textContent=n.label;el.title=n.label;
  lblContainer.appendChild(el);labelEls[n.id]=el;
});

function applyVisibility(){
  Object.values(meshes).forEach(m=>{
    const n=m.userData;
    const catOk=window._catFilter==='all'||n.cat===window._catFilter;
    const srch=window._searchFilter.toLowerCase();
    const searchOk=!srch||n.label.toLowerCase().includes(srch)||n.cat.toLowerCase().includes(srch);
    const show=catOk&&searchOk;
    m.material.opacity=show?0.8:0.05;m.visible=true;
    if(labelEls[n.id])labelEls[n.id].dataset.hidden=show?'':'1';
  });
  lines.forEach(ln=>{
    const av=meshes[ln.userData.from]?.material.opacity>0.4;
    const bv=meshes[ln.userData.to]?.material.opacity>0.4;
    const baseOp=ln.userData.type==='owns'?.65:ln.userData.type==='grants'?.4:.25;
    ln.material.opacity=(av&&bv)?baseOp:0.03;
  });
}
window.filterByCat=function(cat){
  window._catFilter=cat;applyVisibility();
  document.querySelectorAll('.cat-chip').forEach(c=>c.classList.toggle('active',c.dataset.cat===cat));
  document.querySelectorAll('.map-legend-item').forEach(c=>c.classList.toggle('active',c.dataset.cat===cat));
};
window.searchNodes=function(q){window._searchFilter=q;applyVisibility();};

/* ── Render loop ── */
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let running=true;const visibilityObserver=new IntersectionObserver(entries=>{running=entries[0].isIntersecting&&!document.hidden;},{threshold:0});
visibilityObserver.observe(container);
document.addEventListener('visibilitychange',()=>{running=!document.hidden&&container.getBoundingClientRect().bottom>0&&container.getBoundingClientRect().top<innerHeight});
let tick=0;const V=new THREE.Vector3();
function loop(){
  requestAnimationFrame(loop);if(!running)return;tick++;
  rotX+=(tRotX-rotX)*.07;rotY+=(tRotY-rotY)*.07;
  if(!dragging3d&&!reducedMotion.matches)tRotY+=.0007;
  cam.position.x=Math.sin(rotY)*Math.cos(rotX)*camDist;
  cam.position.y=Math.sin(rotX)*camDist*.45+5;
  cam.position.z=Math.cos(rotY)*Math.cos(rotX)*camDist;
  cam.lookAt(0,0,0);

  // Pulse OSF core
  if(meshes['osf']){const p=1+Math.sin(tick*.035)*.1;meshes['osf'].scale.set(p,p,p);}
  // Pulse Africa Check
  if(meshes['ac']){const p=1+Math.sin(tick*.04+1)*.08;meshes['ac'].scale.set(p,p,p);}

  // Project labels
  NODES.forEach(n=>{
    const el=labelEls[n.id];const mesh=meshes[n.id];
    if(!el||!mesh)return;
    if(el.dataset.hidden==='1'){el.style.display='none';return;}
    V.copy(mesh.position).project(cam);
    if(V.z>1){el.style.display='none';return;}
    el.style.display='';
    const sx=(V.x*0.5+0.5)*cw;
    const sy=(-V.y*0.5+0.5)*ch+(n.r||1)*3.5+6;
    el.style.left=sx+'px';el.style.top=sy+'px';
    const fade=Math.max(0.55,1-((V.z+1)*0.4));
    const vis=mesh.material.opacity>0.4?1:0;
    el.style.opacity=(fade*vis).toFixed(2);
  });

  ren.render(scene,cam);
}
loop();

/* ── Build legend ── */
const legWrap=document.getElementById('mapLegend');
const catChipWrap=document.getElementById('catLegend');
const allChip=document.createElement('button');
allChip.className='cat-chip active';allChip.type='button';allChip.dataset.cat='all';
allChip.innerHTML='<span class="dot" style="background:var(--gold)"></span>All';
allChip.onclick=()=>window.filterByCat('all');
catChipWrap.appendChild(allChip);
Object.entries(CAT).forEach(([k,v])=>{
  const hexCol='#'+v.col.toString(16).padStart(6,'0');
  const chip=document.createElement('button');chip.type='button';
  chip.className='cat-chip';chip.dataset.cat=k;
  chip.innerHTML=`<span class="dot" style="background:${hexCol}"></span>${v.label}`;
  chip.onclick=()=>window.filterByCat(k);
  catChipWrap.appendChild(chip);
  const li=document.createElement('button');li.type='button';
  li.className='map-legend-item';li.dataset.cat=k;
  li.innerHTML=`<span class="dot" style="background:${hexCol}"></span>${v.label}`;
  li.onclick=()=>window.filterByCat(k);
  legWrap.appendChild(li);
});

})();
