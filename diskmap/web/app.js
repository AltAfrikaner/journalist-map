"use strict";

// ---- helpers ---------------------------------------------------------------
const $ = (s) => document.querySelector(s);
function human(b){
  if(b < 1024) return b + " B";
  const u = "KMGTPE"; let i = -1; let n = b;
  do { n /= 1024; i++; } while(n >= 1024 && i < u.length-1);
  return n.toFixed(2) + " " + u[i] + "B";
}
function commas(n){ return n.toLocaleString(); }
function esc(s){ return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// ---- state -----------------------------------------------------------------
let DATA = null;       // full scan result
let stack = [];        // breadcrumb stack of nodes for treemap drill-down

// ---- roots / path picker ---------------------------------------------------
fetch("/api/roots").then(r=>r.json()).then(roots=>{
  const dl = $("#roots");
  (roots||[]).forEach(r => { const o=document.createElement("option"); o.value=r; dl.appendChild(o); });
  if(roots && roots.length && !$("#path").value) $("#path").value = roots[0];
});

// ---- tabs ------------------------------------------------------------------
document.querySelectorAll(".tabs button").forEach(b=>{
  b.onclick = () => {
    document.querySelectorAll(".tabs button").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    $("#view-"+b.dataset.tab).classList.add("active");
    if(b.dataset.tab === "map") drawTreemap();
  };
});

// ---- scan ------------------------------------------------------------------
$("#scan").onclick = runScan;
$("#path").addEventListener("keydown", e => { if(e.key === "Enter") runScan(); });

async function runScan(){
  const path = $("#path").value.trim();
  if(!path) return;
  const dedup = $("#dedup").checked ? "1" : "0";
  $("#scan").disabled = true;
  $("#status").textContent = "scanning… (large drives may take a moment)";
  try{
    const r = await fetch("/api/scan?path=" + encodeURIComponent(path) + "&dedup=" + dedup);
    if(!r.ok){ throw new Error(await r.text()); }
    DATA = await r.json();
    stack = [DATA.root];
    renderStats();
    drawTreemap();
    renderLargest();
    renderTypes();
    renderDups();
    $("#status").textContent = "done · local only";
  }catch(err){
    $("#status").textContent = "error";
    alert("Scan failed:\n" + err.message);
  }finally{
    $("#scan").disabled = false;
  }
}

function renderStats(){
  $("#stats").hidden = false;
  $("#s-total").textContent = human(DATA.totalSize);
  $("#s-files").textContent = commas(DATA.totalFiles);
  $("#s-dirs").textContent  = commas(DATA.totalDirs);
  $("#s-skip").textContent  = commas(DATA.skipped);
  $("#s-time").textContent  = DATA.elapsedSeconds.toFixed(2) + "s";
}

// ---- treemap (squarified) --------------------------------------------------
const canvas = $("#treemap");
const ctx = canvas.getContext("2d");
let rects = []; // hit-test rectangles for current frame

function fitCanvas(){
  const ratio = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * ratio; canvas.height = h * ratio;
  ctx.setTransform(ratio,0,0,ratio,0,0);
  return {w, h};
}
window.addEventListener("resize", () => { if(DATA) drawTreemap(); });

function colorFor(name, depth){
  let hash = 0; for(const c of name) hash = (hash*31 + c.charCodeAt(0)) & 0xffff;
  const hue = hash % 360;
  return `hsl(${hue} 45% ${28 - depth*3}%)`;
}

function drawTreemap(){
  if(!DATA) return;
  const node = stack[stack.length-1];
  renderCrumb();
  const {w,h} = fitCanvas();
  ctx.clearRect(0,0,w,h);
  rects = [];
  const kids = (node.children||[]).filter(c=>c.size>0);
  if(!kids.length){ ctx.fillStyle="#8b949e"; ctx.fillText("(no sub-items above threshold)", 16, 28); return; }
  squarify(kids, {x:2,y:2,w:w-4,h:h-4}, 0);
}

// squarified treemap layout
function squarify(items, rect, depth){
  const total = items.reduce((a,b)=>a+b.size,0);
  if(total<=0) return;
  let area = rect.w*rect.h;
  let scale = area/total;
  let x=rect.x, y=rect.y, w=rect.w, h=rect.h;
  let i=0;
  while(i<items.length){
    let row=[]; let rowSum=0;
    const vertical = w < h; // fill along the shorter side
    const side = vertical ? w : h;
    let best = Infinity;
    let j=i;
    while(j<items.length){
      const next = rowSum + items[j].size*scale;
      const ratio = worstRatio(row.concat(items[j]).map(it=>it.size*scale), side, next);
      if(ratio>best && row.length){ break; }
      best = ratio; rowSum = next; row.push(items[j]); j++;
    }
    // lay out the row
    const rowArea = row.reduce((a,b)=>a+b.size*scale,0);
    const thick = rowArea / side;
    let off = vertical ? x : y;
    for(const it of row){
      const len = (it.size*scale)/thick;
      const r = vertical
        ? {x:off, y:y, w:thick, h:len}
        : {x:x, y:off, w:len, h:thick};
      paintCell(it, r, depth);
      off += len;
    }
    if(vertical){ x += thick; w -= thick; } else { y += thick; h -= thick; }
    i = j;
    area = w*h; if(area<=0) break;
  }
}
function worstRatio(areas, side, sum){
  let max=-Infinity, min=Infinity;
  for(const a of areas){ if(a>max)max=a; if(a<min)min=a; }
  const s2 = sum*sum, side2 = side*side;
  return Math.max((side2*max)/s2, s2/(side2*min));
}

function paintCell(node, r, depth){
  if(r.w<=0||r.h<=0) return;
  ctx.fillStyle = colorFor(node.name, depth);
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = "rgba(0,0,0,.45)";
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x+.5, r.y+.5, r.w-1, r.h-1);
  rects.push({r, node});
  if(r.w>60 && r.h>22){
    ctx.fillStyle = "rgba(255,255,255,.92)";
    ctx.font = "12px system-ui";
    const label = node.name;
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x+4,r.y+3,r.w-8,r.h-6); ctx.clip();
    ctx.fillText(label, r.x+6, r.y+16);
    if(r.h>38){ ctx.fillStyle="rgba(255,255,255,.6)"; ctx.fillText(human(node.size), r.x+6, r.y+32); }
    ctx.restore();
  }
}

canvas.addEventListener("mousemove", e=>{
  const hit = hitTest(e);
  canvas.style.cursor = (hit && hit.node.dir) ? "pointer" : "default";
  canvas.title = hit ? `${hit.node.path}\n${human(hit.node.size)} · ${commas(hit.node.files)} files` : "";
});
canvas.addEventListener("click", e=>{
  const hit = hitTest(e);
  if(hit && hit.node.dir && (hit.node.children||[]).length){
    stack.push(hit.node); drawTreemap();
  }
});
function hitTest(e){
  const b = canvas.getBoundingClientRect();
  const x = e.clientX-b.left, y = e.clientY-b.top;
  for(const it of rects){ const r=it.r; if(x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h) return it; }
  return null;
}
function renderCrumb(){
  const c = $("#crumb");
  c.innerHTML = stack.map((n,i)=>
    `<a data-i="${i}">${esc(i===0 ? n.path : n.name)}</a>`
  ).join(" <span>›</span> ");
  c.querySelectorAll("a").forEach(a=>a.onclick=()=>{ stack=stack.slice(0,+a.dataset.i+1); drawTreemap(); });
}

// ---- largest files ---------------------------------------------------------
function renderLargest(){
  const max = DATA.largest.length ? DATA.largest[0].size : 1;
  const rows = DATA.largest.map(f=>`
    <tr>
      <td class="size">${human(f.size)}</td>
      <td style="width:120px"><div class="bar" style="width:${Math.max(3,100*f.size/max)}%"></div></td>
      <td class="path tip" onclick="reveal('${esc(f.path).replace(/'/g,"\\'")}')">${esc(f.path)}</td>
    </tr>`).join("");
  $("#largest").innerHTML = rows
    ? `<table><thead><tr><th>Size</th><th></th><th>Path (click to reveal)</th></tr></thead><tbody>${rows}</tbody></table>`
    : `<div class="empty">No files.</div>`;
}

// ---- file types ------------------------------------------------------------
function renderTypes(){
  const ex = DATA.extensions||[];
  const max = ex.length ? ex[0].size : 1;
  const rows = ex.slice(0,40).map(e=>`
    <tr>
      <td>${esc(e.ext)}</td>
      <td class="size">${human(e.size)}</td>
      <td style="width:200px"><div class="bar" style="width:${Math.max(3,100*e.size/max)}%"></div></td>
      <td class="path">${commas(e.count)} files</td>
    </tr>`).join("");
  $("#types").innerHTML = rows
    ? `<table><thead><tr><th>Extension</th><th>Size</th><th></th><th>Count</th></tr></thead><tbody>${rows}</tbody></table>`
    : `<div class="empty">No data.</div>`;
}

// ---- duplicates ------------------------------------------------------------
function renderDups(){
  const d = DATA.duplicates;
  if(!d){ $("#dups").innerHTML = `<div class="empty">Re-scan with “find duplicates” enabled.</div>`; return; }
  if(!d.length){ $("#dups").innerHTML = `<div class="empty">No duplicate files found. 🎉</div>`; return; }
  let wasted = d.reduce((a,g)=>a+g.wasted,0);
  const groups = d.map(g=>`
    <div class="dupgroup">
      <div class="head">${human(g.wasted)} reclaimable — ${g.files.length} copies of ${human(g.size)}</div>
      ${g.files.map(f=>`<div class="path tip" onclick="reveal('${esc(f.path).replace(/'/g,"\\'")}')">${esc(f.path)}</div>`).join("")}
    </div>`).join("");
  $("#dups").innerHTML = `<p style="color:var(--warn)"><b>${human(wasted)}</b> reclaimable across ${d.length} duplicate groups.</p>${groups}`;
}

function reveal(path){ fetch("/api/open?path=" + encodeURIComponent(path)); }
window.reveal = reveal;
