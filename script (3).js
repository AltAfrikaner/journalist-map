// ═══════════════════════════════════════════════════════════
// THE SPIDERWEB v5 — CSS2DRenderer Label Architecture
//
// LABEL APPROACH:
//   CSS2DRenderer + CSS2DObject for all labels.
//   Labels are pure HTML <div> elements, positioned by CSS2DRenderer.
//   They NEVER go through the WebGL pipeline, so bloom cannot
//   affect them. No sprites, no CanvasTexture, no PlaneGeometry.
//
// BLOOM ISOLATION:
//   UnrealBloomPass with threshold=0.4 so only bright emissive
//   spheres bloom. Edges (white, low opacity) stay below threshold.
//   CSS2D labels are DOM elements — completely outside WebGL.
//
// NODE SIZE:
//   radius = SZ_BASE + SZ_K * log10(fa+1) + 0.15 * cw
//
// EDGE OPACITY:
//   opacity = clamp(0.03 + 0.012 * avgWeight, 0.03, 0.18)
//   Colour: white (#FFFFFF)
//
// ERROR PROOFING:
//   safeStr(v) and safeNum(v,def) guard every property access.
//   28+ safeStr guards, 14+ safeNum guards.
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// ─── SAFE HELPERS ───
function safeStr(v) { return String(v == null ? '' : v); }
function safeNum(v, d) { const n = Number(v); return isFinite(n) ? n : (d || 0); }

// ─── SIZING ───
const SZ_BASE = 2.0, SZ_K = 0.58;
const RING_R = [0, 65, 140, 215, 295, 380, 465, 555];
function nRad(fa, cw) {
  const base = (!fa || fa <= 0) ? SZ_BASE : SZ_BASE + SZ_K * Math.log10(fa + 1);
  return base + 0.15 * safeNum(cw, 0);
}
function fmtM(v) {
  if (!v || v <= 0) return null;
  return v >= 1e9 ? '$' + (v / 1e9).toFixed(1) + 'B' : v >= 1e6 ? '$' + (v / 1e6).toFixed(0) + 'M' : '$' + (v / 1e3).toFixed(0) + 'K';
}

// ─── COLOURS ───
const CH = {
  usgov: 0x4488FF, funder: 0x00CCCC, thinktank: 0x33BB55, democracy: 0xDDCC33,
  media: 0xEE4444, health: 0xCC44CC, university: 0xEE8833, person: 0xEE6699, intel: 0xAA7744
};
// CSS colour strings for labels
const CC = {
  usgov: '#4488FF', funder: '#00CCCC', thinktank: '#33BB55', democracy: '#DDCC33',
  media: '#EE4444', health: '#CC44CC', university: '#EE8833', person: '#EE6699', intel: '#AA7744'
};
const CN = {
  usgov: 'US Government', funder: 'International Funder', thinktank: 'Think Tank',
  democracy: 'Democracy / Governance', media: 'Media', health: 'Health NGO',
  university: 'University', person: 'Key Personnel', intel: 'Intel Archive'
};

const catVisible = {};
Object.keys(CH).forEach(k => { catVisible[k] = true; });

// ═══════════════════════════════════════════════════════════
// GRAPH DATA — 82 nodes, 167 edges
// ═══════════════════════════════════════════════════════════
const G = { nodes: [
{id:"usaid",label:"USAID",cat:"usgov",ring:0,fa:8e9,sd:"1961",ed:"2025",desc:"US Agency for International Development. $8B cumulative to SA via PEPFAR. $581M FY2024. 44 health projects. Dismantled Feb 2025."},
{id:"cia",label:"CIA",cat:"usgov",ring:1,fa:null,sd:"1947",desc:"Declassified docs name NED as SA public diplomacy tool. ALA 83-10191X coordinated with Directorate of Operations."},
{id:"ned",label:"NED",cat:"usgov",ring:1,fa:362e6,sd:"1983",desc:"National Endowment for Democracy. Founded by CIA Dir Casey. $362M annual. $6M+ to SA. Weinstein: 'What we do was done covertly by the CIA.'"},
{id:"state_dept",label:"State Dept",cat:"usgov",ring:1,fa:null,desc:"Manages NED appropriation. Alleged direct DM funding via Cape Town consulate. GEC reviewed USAID Disinfo Primer."},
{id:"pepfar",label:"PEPFAR",cat:"usgov",ring:1,fa:453e6,sd:"2003",ed:"2025",desc:"$453M to SA FY2024. 17% of SA HIV budget. 75%+ awards terminated Feb 2025."},
{id:"cdc_us",label:"CDC",cat:"usgov",ring:1,fa:null,desc:"Centers for Disease Control. Parallel PEPFAR channel. Court ordered funding restored."},
{id:"usia",label:"USIA",cat:"usgov",ring:1,fa:null,sd:"1953",ed:"1999",desc:"US Information Agency. CIA doc: targeted black journalists, entrepreneurs, trade unionists in SA."},
{id:"osf",label:"Open Society Foundations",cat:"funder",ring:2,fa:5e8,sd:"1993",desc:"Largest private media funder globally. NED CIMA partner. Majority M&G stake via MDIF. R1.7M to amaBhungane."},
{id:"luminate",label:"Luminate",cat:"funder",ring:2,fa:5e7,desc:"Funds amaBhungane USD375K+, Viewfinder. Donor to Global Disinformation Index. Omidyar network."},
{id:"oppenheimer",label:"Oppenheimers / Brenthurst",cat:"funder",ring:2,fa:1e8,desc:"Anglo American/De Beers. Fund amaBhungane, IRR, SAIIA, ISS. Gdansk 2023."},
{id:"ford",label:"Ford Foundation",cat:"funder",ring:2,fa:5e7,desc:"$1.165M to IDASA (1996). Funded SANGOCO. GPSA coordination with OSF."},
{id:"internews",label:"Internews",cat:"funder",ring:2,fa:472.6e6,sd:"1982",desc:"$472.6M from USAID lifetime. CEO Bourgault: ex-US Embassy Moscow, ex-USAID."},
{id:"gfmd",label:"GFMD",cat:"funder",ring:2,fa:null,desc:"Global Forum for Media Development. NED+OSF jointly established. 100+ media orgs."},
{id:"ifpim",label:"IFPIM",cat:"funder",ring:2,fa:null,desc:"Int'l Fund for Public Interest Media. Khadija Patel head of programmes."},
{id:"millennium",label:"Millennium Trust",cat:"funder",ring:2,fa:7.5e6,desc:"R7.5M to amaBhungane. Funds Viewfinder, ISS. Own funding sources undisclosed."},
{id:"elma",label:"ELMA Foundation",cat:"funder",ring:2,fa:5e6,desc:"R1.5M to amaBhungane. Funds Inkululeko SA Media (DM holding company)."},
{id:"global_fund",label:"Global Fund",cat:"funder",ring:2,fa:2e8,desc:"10% of SA ARV funding. $1.43B trimmed 2023-25. SA cut 16%."},
{id:"iss",label:"ISS Africa",cat:"thinktank",ring:3,fa:1e7,sd:"1991",desc:"USAID+OSF funded. Exclusive DM republication rights. Seven-way convergence node."},
{id:"saiia",label:"SAIIA",cat:"thinktank",ring:3,fa:5e6,sd:"1934",desc:"Confirmed USAID-funded. Chair: Moeletsi Mbeki. Greg Mills dir 1996-2005."},
{id:"idasa",label:"IDASA",cat:"democracy",ring:3,fa:4437000,sd:"1986",ed:"2013",desc:"NED $1.272M. USAID $1M. Ford $1.165M. Chairman = DG President's Office."},
{id:"irr",label:"IRR",cat:"thinktank",ring:3,fa:2e6,desc:"NED-funded. Chester Crocker: honorary life member. Publishes Daily Friend."},
{id:"accord",label:"ACCORD",cat:"democracy",ring:3,fa:2e5,desc:"NED $200K. Trained SA diplomatic corps."},
{id:"iaj",label:"Inst. Adv. Journalism",cat:"democracy",ring:3,fa:136000,sd:"1986",desc:"NED $136K. 'SA's oldest media training org.'"},
{id:"ndi",label:"NDI",cat:"democracy",ring:3,fa:null,desc:"National Democratic Institute. USAID-funded CEPPS."},
{id:"iri",label:"IRI",cat:"democracy",ring:3,fa:null,desc:"Int'l Republican Institute. USAID/NED-funded."},
{id:"africa_check",label:"Africa Check",cat:"thinktank",ring:3,fa:3e6,sd:"2012",desc:"THE chokepoint. Wits-housed. OSF 12%, Luminate 8%, Gates 13%. Defines 'disinformation' for Africa."},
{id:"misa",label:"MISA",cat:"democracy",ring:3,fa:null,sd:"1992",desc:"Media Inst of Southern Africa. NED-funded. Co-created IJ Hub."},
{id:"gdi",label:"Global Disinfo Index",cat:"thinktank",ring:3,fa:null,desc:"Funded by Luminate. Rates sites, pressures advertisers."},
{id:"dm",label:"Daily Maverick",cat:"media",ring:4,fa:5e6,sd:"2009",desc:"OSF >R150k. Alleged State Dept. ISS exclusive republication. Brkic at Gdansk."},
{id:"mg",label:"M&G / Continent",cat:"media",ring:4,fa:3552000,desc:"NED $355,200 via Adamela Trust. OSF majority via MDIF. NED specified editorial."},
{id:"amabhungane",label:"amaBhungane",cat:"media",ring:4,fa:3e6,sd:"2010",desc:"OSF R1.7M. Luminate USD375K+. Millennium R7.5M. Sam Sole = ICIJ member."},
{id:"bhekisisa",label:"Bhekisisa",cat:"media",ring:4,fa:1e6,desc:"Health journalism. Mia Malan editor. Broke USAID termination story."},
{id:"groundup",label:"GroundUp",cat:"media",ring:4,fa:null,desc:"Community investigative. DM content partner."},
{id:"viewfinder",label:"Viewfinder",cat:"media",ring:4,fa:120000,desc:"Luminate + Millennium Trust. Knoetze: US State Dept Humphrey fellow."},
{id:"code4africa",label:"Code For Africa",cat:"media",ring:4,fa:null,desc:"NED principally funded. Chris Roper deputy CEO."},
{id:"spotlight",label:"Spotlight NSP",cat:"media",ring:4,fa:null,desc:"HIV/TB/STI reporting. Tracks PEPFAR/CDC flows."},
{id:"city_press",label:"City Press (1986)",cat:"media",ring:4,fa:5e5,sd:"1986",ed:"1990",desc:"NED-funded 'How Democracy Works'. 'Counter strong Marxist campaigns.'"},
{id:"icij",label:"ICIJ",cat:"media",ring:4,fa:null,desc:"NED-funded. Sam Sole is member. West Africa Leaks + OSF/OSIWA."},
{id:"daily_friend",label:"Daily Friend",cat:"media",ring:4,fa:null,desc:"Published by NED-funded IRR."},
{id:"hnf",label:"Henry Nxumalo Foundation",cat:"media",ring:4,fa:5e5,desc:"Harber founder. US govt-funded Botswana project."},
{id:"aip",label:"Assoc. Indep. Publishers",cat:"democracy",ring:4,fa:null,desc:"Impacted by USAID Media Viability Accelerator closure."},
{id:"anova",label:"Anova Health",cat:"health",ring:5,fa:198.6e6,ed:"2025",desc:"Largest PEPFAR recipient. $198.6M terminated. 2,800+ fired."},
{id:"wits_rhi",label:"Wits RHI",cat:"health",ring:5,fa:150e6,ed:"2025",desc:"Biggest PEPFAR grant. Stop-work Jan 28, 2025."},
{id:"rtc",label:"Right to Care",cat:"health",ring:5,fa:5e7,desc:"Prime partner EQUIP consortium."},
{id:"broadreach",label:"BroadReach",cat:"health",ring:5,fa:3e7,desc:"APACE consortium. HIV testing."},
{id:"nacosa",label:"NACOSA",cat:"health",ring:5,fa:1e7,desc:"Orphaned children. Revised waiver budget submitted."},
{id:"engage",label:"Engage Men's Health",cat:"health",ring:5,fa:2e6,ed:"2025",desc:"MSM sexual health. Suspended. DEI exclusion."},
{id:"samrc",label:"SAMRC",cat:"health",ring:5,fa:2e7,desc:"SA Medical Research Council. NIH-affected."},
{id:"wits",label:"Wits University",cat:"university",ring:5,fa:null,desc:"Houses Wits RHI, Africa Check. Dean: Shabir Madhi."},
{id:"uct",label:"UCT",cat:"university",ring:5,fa:null,desc:"Desmond Tutu HIV Centre. Soros 1979 scholarships."},
{id:"stellenbosch",label:"Stellenbosch",cat:"university",ring:5,fa:null,desc:"Wasserman defines 'disinformation' for Africa."},
{id:"ukzn",label:"UKZN / CAPRISA",cat:"university",ring:5,fa:null,desc:"Abdool Karim. NIH-funded, terminated March 2025."},
{id:"steenhuisen",label:"Steenhuisen",cat:"democracy",ring:5,fa:null,desc:"DA leader. Gdansk Declaration (2023)."},
{id:"roelf_meyer",label:"Roelf Meyer",cat:"democracy",ring:5,fa:null,desc:"Former NP/ANC negotiator. Gdansk Declaration."},
{id:"dave_peterson",label:"Dave Peterson",cat:"person",ring:6,fa:null,desc:"NED Senior Dir Africa since 1988. 37 years."},
{id:"allen_weinstein",label:"Allen Weinstein",cat:"person",ring:6,fa:null,desc:"NED co-founder. 'Done covertly by the CIA.'"},
{id:"william_casey",label:"William Casey",cat:"person",ring:6,fa:null,desc:"CIA Director who conceived NED (1983)."},
{id:"branko_brkic",label:"Branko Brkic",cat:"person",ring:6,fa:null,desc:"DM co-founder. Gdansk with Steenhuisen."},
{id:"sam_sole",label:"Sam Sole",cat:"person",ring:6,fa:null,desc:"amaBhungane co-founder. ICIJ member. GuptaLeaks."},
{id:"simon_allison",label:"Simon Allison",cat:"person",ring:6,fa:null,desc:"Continent editor (NED). Ex-DM. Ex-OSF/ISS."},
{id:"chris_roper",label:"Chris Roper",cat:"person",ring:6,fa:null,desc:"M&G editor 2009-15. NED Code For Africa."},
{id:"khadija_patel",label:"Khadija Patel",cat:"person",ring:6,fa:null,desc:"M&G editor 2016-20. NED IPI → IFPIM."},
{id:"brooks_spector",label:"Brooks Spector",cat:"person",ring:6,fa:null,desc:"Former US diplomat. DM columnist."},
{id:"greg_mills",label:"Greg Mills",cat:"person",ring:6,fa:null,desc:"Brenthurst dir. SAIIA. NATO advisor. DM."},
{id:"chester_crocker",label:"Chester Crocker",cat:"person",ring:6,fa:null,desc:"Reagan's SA envoy. IRR life member."},
{id:"beauregard_tromp",label:"Beauregard Tromp",cat:"person",ring:6,fa:null,desc:"AIJC. Ex-OCCRP Africa. $28M frozen."},
{id:"anton_harber",label:"Anton Harber",cat:"person",ring:6,fa:null,desc:"GIJN board. Wits. HNF founder."},
{id:"daneel_knoetze",label:"Daneel Knoetze",cat:"person",ring:6,fa:null,desc:"Viewfinder founder. Humphrey fellow."},
{id:"george_soros",label:"George Soros",cat:"person",ring:6,fa:null,desc:"OSF founder. 1979 UCT. 1987 Dakar."},
{id:"mo_shaik",label:"Mo Shaik",cat:"person",ring:6,fa:null,desc:"Former SASS head. WikiLeaks: US informant."},
{id:"sydney_masamvu",label:"Sydney Masamvu",cat:"person",ring:6,fa:null,desc:"USAID payroll at IDASA. 39 cables."},
{id:"wasserman",label:"Prof Wasserman",cat:"person",ring:6,fa:null,desc:"Stellenbosch. 'Disinformation' definer."},
{id:"jeanne_bourgault",label:"Jeanne Bourgault",cat:"person",ring:6,fa:null,desc:"Internews CEO. Ex-Embassy Moscow."},
{id:"john_richardson",label:"John Richardson",cat:"person",ring:6,fa:null,desc:"NED chair 1984-88. CIA Radio Free Europe."},
{id:"cia_foia",label:"CIA FOIA",cat:"intel",ring:7,fa:null,desc:"5 SA docs. 2 classified naming NED."},
{id:"nsa_gwu",label:"Nat'l Security Archive",cat:"intel",ring:7,fa:null,desc:"GWU. 2,000+ SA docs, 30,000+ pages."},
{id:"wikileaks",label:"WikiLeaks",cat:"intel",ring:7,fa:null,desc:"Shaik as US source. Masamvu on payroll. 28 entities."},
{id:"spy_cables",label:"Al Jazeera Spy Cables",cat:"intel",ring:7,fa:null,desc:"140+ foreign spies in SA. 78 named."},
{id:"stasi",label:"Stasi Records",cat:"intel",ring:7,fa:null,desc:"100 ANC trainees. 1,400 missiles."},
{id:"brit_ird",label:"British IRD",cat:"intel",ring:7,fa:null,desc:"100+ journalists. Forged docs. CIA from 1948."},
{id:"usaid_primer",label:"USAID Disinfo Primer",cat:"intel",ring:7,fa:null,desc:"97pp FOIA. Advertiser pressure. Thanks NED."},
{id:"declassified_uk",label:"Declassified UK",cat:"intel",ring:7,fa:null,desc:"NED £2.6M to British media."},
],
edges:[
["cia","ned"],["cia","usia"],["cia","usaid"],["cia","cia_foia"],
["ned","usaid"],["ned","state_dept"],["ned","usia"],
["ned","idasa"],["ned","iaj"],["ned","accord"],["ned","mg"],["ned","misa"],["ned","irr"],
["ned","ndi"],["ned","iri"],["ned","code4africa"],["ned","icij"],["ned","gfmd"],
["ned","city_press"],["ned","gdi"],["ned","daily_friend"],
["ned","dave_peterson"],["ned","allen_weinstein"],["ned","william_casey"],["ned","john_richardson"],
["usaid","pepfar"],["usaid","cdc_us"],
["pepfar","anova"],["pepfar","wits_rhi"],["pepfar","rtc"],["pepfar","broadreach"],
["pepfar","nacosa"],["pepfar","engage"],["pepfar","samrc"],
["usaid","idasa"],["usaid","ndi"],["usaid","iri"],["usaid","saiia"],["usaid","iss"],
["usaid","internews"],["usaid","hnf"],["usaid","aip"],
["state_dept","dm"],["state_dept","ned"],
["osf","dm"],["osf","amabhungane"],["osf","mg"],["osf","iss"],["osf","idasa"],
["osf","gfmd"],["osf","uct"],["osf","stellenbosch"],["osf","africa_check"],
["osf","george_soros"],["osf","luminate"],
["luminate","amabhungane"],["luminate","viewfinder"],["luminate","gdi"],["luminate","gfmd"],["luminate","africa_check"],
["oppenheimer","amabhungane"],["oppenheimer","irr"],["oppenheimer","saiia"],["oppenheimer","iss"],
["oppenheimer","dm"],["oppenheimer","steenhuisen"],["oppenheimer","roelf_meyer"],["oppenheimer","greg_mills"],
["ford","idasa"],["ford","osf"],
["internews","jeanne_bourgault"],["internews","misa"],
["iss","dm"],["iss","osf"],["iss","simon_allison"],["iss","usaid"],
["saiia","brooks_spector"],["saiia","greg_mills"],["saiia","dm"],["saiia","usaid"],
["idasa","sydney_masamvu"],["idasa","george_soros"],["idasa","ford"],
["dm","branko_brkic"],["dm","brooks_spector"],["dm","greg_mills"],["dm","iss"],
["dm","groundup"],["dm","amabhungane"],
["mg","simon_allison"],["mg","chris_roper"],["mg","khadija_patel"],["mg","osf"],
["amabhungane","sam_sole"],["amabhungane","misa"],["amabhungane","icij"],
["amabhungane","osf"],["amabhungane","luminate"],["amabhungane","millennium"],["amabhungane","elma"],
["viewfinder","daneel_knoetze"],["viewfinder","hnf"],["viewfinder","luminate"],["viewfinder","millennium"],
["code4africa","chris_roper"],["code4africa","ned"],
["bhekisisa","wits"],["bhekisisa","pepfar"],["spotlight","pepfar"],
["hnf","anton_harber"],["hnf","viewfinder"],["hnf","usaid"],
["daily_friend","irr"],
["wits","wits_rhi"],["wits","anova"],["wits","africa_check"],["wits","saiia"],
["uct","osf"],["uct","pepfar"],["stellenbosch","wasserman"],["stellenbosch","osf"],["ukzn","pepfar"],
["rtc","anova"],["rtc","broadreach"],["rtc","nacosa"],
["greg_mills","oppenheimer"],["greg_mills","saiia"],["greg_mills","dm"],
["chester_crocker","irr"],["chester_crocker","state_dept"],
["beauregard_tromp","usaid"],["beauregard_tromp","icij"],
["khadija_patel","mg"],["khadija_patel","ifpim"],["khadija_patel","ned"],
["simon_allison","mg"],["simon_allison","dm"],["simon_allison","iss"],
["mo_shaik","wikileaks"],["sydney_masamvu","wikileaks"],["sydney_masamvu","usaid"],
["wasserman","africa_check"],["wasserman","stellenbosch"],
["africa_check","gdi"],["africa_check","osf"],["africa_check","luminate"],["africa_check","wits"],
["usaid_primer","ned"],["usaid_primer","gdi"],["usaid_primer","africa_check"],
["cia_foia","cia"],["nsa_gwu","cia"],["wikileaks","usaid"],["spy_cables","mo_shaik"],
["stasi","cia"],["brit_ird","cia"],["brit_ird","usia"],["declassified_uk","ned"],
["branko_brkic","steenhuisen"],["branko_brkic","roelf_meyer"],["branko_brkic","oppenheimer"],
["elma","dm"],["elma","amabhungane"],
["millennium","amabhungane"],["millennium","viewfinder"],["millennium","iss"],
["ifpim","khadija_patel"],["ifpim","luminate"],["ifpim","ned"],
["global_fund","pepfar"],
]};

// ─── Compute connection_weight ───
function computeWeights() {
  const wt = {};
  G.nodes.forEach(n => { wt[safeStr(n.id)] = 0; });
  G.edges.forEach(([a, b]) => { wt[safeStr(a)] = (wt[safeStr(a)] || 0) + 1; wt[safeStr(b)] = (wt[safeStr(b)] || 0) + 1; });
  G.nodes.forEach(n => { n.cw = wt[safeStr(n.id)] || 0; });
}
computeWeights();

// ═══════════════════════════════════════════════════════════
// SCENE SETUP
// ═══════════════════════════════════════════════════════════
const container = document.getElementById('scene-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);
scene.fog = new THREE.FogExp2(0x0a0a0a, 0.00088);

const cam = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 1, 6000);
cam.position.set(0, 300, 640);

// ─── WebGL Renderer ───
const ren = new THREE.WebGLRenderer({ antialias: true });
ren.setSize(innerWidth, innerHeight);
ren.setPixelRatio(Math.min(devicePixelRatio, 2));
ren.toneMapping = THREE.ACESFilmicToneMapping;
ren.toneMappingExposure = 1.15;
container.appendChild(ren.domElement);

// ─── CSS2DRenderer (for labels — separate DOM layer, never bloomed) ───
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
container.appendChild(labelRenderer.domElement);

// ─── OrbitControls ───
const oc = new OrbitControls(cam, ren.domElement);
oc.enableDamping = true; oc.dampingFactor = 0.06;
oc.autoRotate = true; oc.autoRotateSpeed = 0.2;
oc.minDistance = 80; oc.maxDistance = 1500; oc.maxPolarAngle = Math.PI * 0.85;

// ─── Bloom (threshold=0.4 → only bright emissive objects bloom) ───
const comp = new EffectComposer(ren);
comp.addPass(new RenderPass(scene, cam));
comp.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.55, 0.4));

// ─── Lights ───
scene.add(new THREE.AmbientLight(0x223344, 0.5));
const kl = new THREE.PointLight(0xC49A2A, 1.3, 1400); kl.position.set(200, 400, 300); scene.add(kl);
const fl = new THREE.PointLight(0x4488CC, 0.6, 900); fl.position.set(-250, -100, -200); scene.add(fl);

// ─── Ground grid ───
const gr = new THREE.GridHelper(1000, 60, 0x111118, 0x0c0c12); gr.position.y = -115; scene.add(gr);
RING_R.forEach(r => {
  if (!r) return;
  const pts = [];
  for (let a = 0; a <= Math.PI * 2 + .06; a += .04) pts.push(new THREE.Vector3(r * Math.cos(a), -110, r * Math.sin(a)));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.025 })));
});

// ═══════════════════════════════════════════════════════════
// BUILD GRAPH
// ═══════════════════════════════════════════════════════════
const MM = {}; // id → sphere mesh
const DM = {}; // id → node data
const LL = []; // edge lines
const LBL = []; // {obj: CSS2DObject, div: HTMLElement, nodeId: string}
let sel = null, zoomTgt = null;

function build(data) {
  // Clear everything
  Object.values(MM).forEach(m => scene.remove(m));
  LL.forEach(l => scene.remove(l)); LL.length = 0;
  LBL.forEach(lb => scene.remove(lb.obj)); LBL.length = 0;
  for (const k in MM) delete MM[k];
  for (const k in DM) delete DM[k];

  computeWeights();
  const rc = {}, ri = {};
  data.nodes.forEach(n => { rc[safeNum(n.ring, 5)] = (rc[safeNum(n.ring, 5)] || 0) + 1; });

  data.nodes.forEach(n => {
    const id = safeStr(n.id);
    const label = safeStr(n.label);
    const cat = safeStr(n.cat || 'person');
    const ring = safeNum(n.ring, 5);
    const fa = safeNum(n.fa, 0);
    const cw = safeNum(n.cw, 0);
    const desc = safeStr(n.desc);

    if (!(ring in ri)) ri[ring] = 0;
    const idx = ri[ring]++;
    const cnt = rc[ring] || 1;
    const r = RING_R[ring] ?? 555;
    const ang = (idx / cnt) * Math.PI * 2 + ring * 0.4;
    const jr = (Math.random() - .5) * 24;
    const jy = (Math.random() - .5) * 40;
    const x = (r + jr) * Math.cos(ang);
    const z = (r + jr) * Math.sin(ang);
    const y = jy + (ring === 0 ? 40 : 0);
    const rad = nRad(fa, cw);
    const col = CH[cat] || 0xCCCCCC;
    const ei = Math.min(0.25 + 0.04 * cw, 0.9);

    // ─── SPHERE (only spheres, no helpers needed) ───
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(rad, 28, 28),
      new THREE.MeshStandardMaterial({
        color: col, emissive: col, emissiveIntensity: ei,
        metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.95
      })
    );
    mesh.position.set(x, y, z);
    mesh.userData = { id, label, cat, ring, fa, cw, desc, sd: safeStr(n.sd), ed: safeStr(n.ed), baseY: y, radius: rad, baseEI: ei };
    scene.add(mesh);
    MM[id] = mesh;
    DM[id] = n;

    // ─── CSS2D LABEL (pure HTML div, no texture, no sprite) ───
    const div = document.createElement('div');
    div.className = 'node-label';
    div.textContent = label.replace(/\n/g, ' ');
    div.style.color = CC[cat] || '#CCCCCC';
    const labelObj = new CSS2DObject(div);
    labelObj.position.set(0, rad + 4, 0); // offset above sphere center
    mesh.add(labelObj); // attach to mesh so it moves with it
    LBL.push({ obj: labelObj, div, nodeId: id });
  });

  // ─── EDGES: white, opacity scales with weight ───
  data.edges.forEach(([a, b]) => {
    const ma = MM[safeStr(a)], mb = MM[safeStr(b)];
    if (!ma || !mb) return;
    const cwA = safeNum(ma.userData.cw, 1);
    const cwB = safeNum(mb.userData.cw, 1);
    const avgW = (cwA + cwB) / 2;
    const op = Math.min(Math.max(0.03 + avgW * 0.012, 0.03), 0.18);
    const geo = new THREE.BufferGeometry().setFromPoints([ma.position.clone(), mb.position.clone()]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: op }));
    line.userData = { from: safeStr(a), to: safeStr(b), baseOp: op };
    scene.add(line);
    LL.push(line);
  });

  applyFilter();
  updateStats();
}

function updateStats() {
  const vis = Object.values(MM).filter(m => m.visible).length;
  const el = document.getElementById('stats');
  if (el) el.textContent = `${vis} / ${G.nodes.length} NODES · ${G.edges.length} EDGES`;
}

// ═══════════════════════════════════════════════════════════
// CATEGORY FILTERING
// ═══════════════════════════════════════════════════════════
function applyFilter() {
  Object.entries(MM).forEach(([id, m]) => {
    const vis = catVisible[safeStr(m.userData.cat)] !== false;
    m.visible = vis;
    // Labels are children of mesh, so they hide/show automatically
  });
  LL.forEach(l => {
    const ma = MM[safeStr(l.userData.from)];
    const mb = MM[safeStr(l.userData.to)];
    l.visible = !!(ma && ma.visible && mb && mb.visible);
  });
  updateStats();
}

document.querySelectorAll('#legend input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', () => {
    const cat = cb.getAttribute('data-cat');
    if (cat) catVisible[cat] = cb.checked;
    applyFilter();
  });
});

build(G);

// ═══════════════════════════════════════════════════════════
// ZOOM-TO-NODE
// ═══════════════════════════════════════════════════════════
function zoomTo(id) {
  const m = MM[safeStr(id)];
  if (!m) return;
  const np = m.position.clone();
  const dir = np.clone().normalize();
  if (dir.length() < 0.01) dir.set(0, 0, -1); // fallback for center node
  const offset = dir.multiplyScalar(-85).add(new THREE.Vector3(0, 55, 0));
  zoomTgt = { camPos: np.clone().add(offset), lookAt: np.clone(), t: 0 };
  oc.autoRotate = false;
}

// ═══════════════════════════════════════════════════════════
// TOOLTIP + CLICK
// ═══════════════════════════════════════════════════════════
const tip = document.getElementById('tip');
const tipH = tip ? tip.querySelector('.tip-h') : null;
const tipS = tip ? tip.querySelector('.tip-s') : null;
const mv = new THREE.Vector2(-9, -9);
const ray = new THREE.Raycaster();
let hov = null;

function tipCtx(d) {
  const money = fmtM(d.fa);
  const conns = G.edges.filter(([a, b]) => a === d.id || b === d.id).length;
  let s = CN[safeStr(d.cat)] || safeStr(d.cat);
  if (money) s += ' · Funding: ' + money;
  if (d.sd) s += ' · ' + safeStr(d.sd) + (d.ed ? '–' + safeStr(d.ed) : '–present');
  s += '. ' + conns + ' connection' + (conns !== 1 ? 's' : '') + '.';
  return s;
}

addEventListener('pointermove', e => {
  mv.x = (e.clientX / innerWidth) * 2 - 1;
  mv.y = -(e.clientY / innerHeight) * 2 + 1;
});

ren.domElement.addEventListener('click', () => {
  ray.setFromCamera(mv, cam);
  const visM = Object.values(MM).filter(m => m.visible);
  const hits = ray.intersectObjects(visM);
  if (hits.length > 0) selectNode(safeStr(hits[0].object.userData.id));
  else deselect();
});

function selectNode(id) {
  sel = id;
  const d = MM[id] ? MM[id].userData : {};
  if (!d.id) return;

  zoomTo(id);

  // Highlight chain
  Object.entries(MM).forEach(([nid, m]) => {
    if (!m.visible) return;
    const conn = G.edges.some(([a, b]) => (a === id && b === nid) || (b === id && a === nid));
    if (nid === id) { m.material.emissiveIntensity = 1.1; m.material.opacity = 1; }
    else if (conn) { m.material.emissiveIntensity = safeNum(m.userData.baseEI, 0.3) + 0.2; m.material.opacity = 0.85; }
    else { m.material.emissiveIntensity = 0.03; m.material.opacity = 0.08; }
  });
  LL.forEach(l => {
    if (!l.visible) return;
    const { from, to } = l.userData;
    if (from === id || to === id) {
      l.material.opacity = 0.45;
      l.material.color.setHex(CH[safeStr(d.cat)] || 0xFFFFFF);
    } else {
      l.material.opacity = 0.006;
      l.material.color.setHex(0xFFFFFF);
    }
  });
  // Dim non-connected labels
  LBL.forEach(lb => {
    const nid = safeStr(lb.nodeId);
    const conn = G.edges.some(([a, b]) => (a === id && b === nid) || (b === id && a === nid));
    lb.div.style.opacity = (nid === id || conn) ? '1' : '0.06';
  });

  // Detail panel
  const pl = document.getElementById('pl');
  if (pl) pl.textContent = safeStr(d.label).replace(/\n/g, ' ');
  const pc = document.getElementById('pc');
  if (pc) pc.textContent = CN[safeStr(d.cat)] || safeStr(d.cat);
  const money = fmtM(d.fa);
  const fw = document.getElementById('pfw');
  if (fw) fw.style.display = money ? 'flex' : 'none';
  const pfv = document.getElementById('pfv');
  if (pfv && money) pfv.textContent = money;
  const dw = document.getElementById('pdw');
  if (dw) dw.style.display = (d.sd || d.ed) ? 'flex' : 'none';
  const pdv = document.getElementById('pdv');
  if (pdv) pdv.textContent = (safeStr(d.sd) || '?') + ' → ' + (safeStr(d.ed) || 'present');
  const ww = document.getElementById('pww');
  if (ww) { ww.style.display = 'flex'; const pwv = document.getElementById('pwv'); if (pwv) pwv.textContent = safeNum(d.cw, 0) + ' connections'; }
  const pde = document.getElementById('pde');
  if (pde) pde.textContent = safeStr(d.desc);
  const cl = document.getElementById('pcl');
  if (cl) {
    cl.innerHTML = '';
    G.edges.filter(([a, b]) => a === id || b === id).forEach(([a, b]) => {
      const oid = a === id ? b : a;
      const o = DM[oid];
      if (!o) return;
      const c = document.createElement('span'); c.className = 'cc';
      c.textContent = safeStr(o.label).replace(/\n/g, ' ');
      c.onclick = () => selectNode(oid);
      cl.appendChild(c);
    });
  }
  const panel = document.getElementById('panel');
  if (panel) panel.classList.remove('shut');
  const ctrls = document.getElementById('ctrls');
  if (ctrls) ctrls.style.display = 'none';
  console.log('Selected:', d);
}

function deselect() {
  sel = null;
  oc.autoRotate = true;
  zoomTgt = null;
  Object.values(MM).forEach(m => {
    if (!m.visible) return;
    m.material.emissiveIntensity = safeNum(m.userData.baseEI, 0.3);
    m.material.opacity = 0.95;
  });
  LL.forEach(l => {
    if (!l.visible) return;
    l.material.opacity = safeNum(l.userData.baseOp, 0.06);
    l.material.color.setHex(0xFFFFFF);
  });
  LBL.forEach(lb => { lb.div.style.opacity = '1'; });
  const panel = document.getElementById('panel');
  if (panel) panel.classList.add('shut');
  const ctrls = document.getElementById('ctrls');
  if (ctrls) ctrls.style.display = '';
}

// ═══════════════════════════════════════════════════════════
// ANIMATION LOOP
// ═══════════════════════════════════════════════════════════
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Smooth zoom
  if (zoomTgt) {
    zoomTgt.t = Math.min(1, zoomTgt.t + 0.035);
    const ease = 1 - Math.pow(1 - zoomTgt.t, 3);
    cam.position.lerp(zoomTgt.camPos, ease * 0.08);
    oc.target.lerp(zoomTgt.lookAt, ease * 0.08);
    if (zoomTgt.t >= 1) zoomTgt = null;
  }

  oc.update();

  // Gentle float
  Object.values(MM).forEach(m => {
    if (!m.visible) return;
    m.position.y = safeNum(m.userData.baseY, 0) + Math.sin(t * .3 + safeNum(m.userData.ring, 0) * .9) * 3;
  });

  // Distance-based label sizing (only when not selecting)
  if (!sel) {
    LBL.forEach(lb => {
      const m = MM[safeStr(lb.nodeId)];
      if (!m || !m.visible) return;
      const d = cam.position.distanceTo(m.position);
      // Scale font size: 10px at d=150, down to 5px at d=800
      const fs = THREE.MathUtils.clamp(10 - (d - 150) / 130, 4, 12);
      const op = THREE.MathUtils.clamp(1.0 - (d - 200) / 600, 0.08, 1.0);
      lb.div.style.fontSize = fs + 'px';
      lb.div.style.opacity = String(op);
    });
  }

  // Hub pulse
  if (MM.usaid && MM.usaid.visible && !sel) {
    MM.usaid.material.emissiveIntensity = safeNum(MM.usaid.userData.baseEI, 0.4) + Math.sin(t * 1.6) * 0.12;
  }

  // Hover tooltip
  ray.setFromCamera(mv, cam);
  const visM = Object.values(MM).filter(m => m.visible);
  const hits = ray.intersectObjects(visM);
  if (hits.length > 0 && tip) {
    const d = hits[0].object.userData;
    if (hov !== safeStr(d.id)) { hov = safeStr(d.id); ren.domElement.style.cursor = 'pointer'; }
    const sx = (mv.x * .5 + .5) * innerWidth;
    const sy = (-mv.y * .5 + .5) * innerHeight;
    tip.style.display = 'block';
    tip.style.left = Math.min(sx + 18, innerWidth - 340) + 'px';
    tip.style.top = Math.max(sy - 14, 8) + 'px';
    if (tipH) tipH.textContent = safeStr(d.label).replace(/\n/g, ' ');
    if (tipS) tipS.textContent = tipCtx(d);
  } else {
    if (hov) { hov = null; ren.domElement.style.cursor = 'default'; }
    if (tip) tip.style.display = 'none';
  }

  // Render: bloom pass (WebGL), then CSS2D overlay
  comp.render();
  labelRenderer.render(scene, cam);
}
animate();

// ═══════════════════════════════════════════════════════════
// UI FUNCTIONS
// ═══════════════════════════════════════════════════════════
window.W = {
  addNode() {
    const label = prompt('Node label:'); if (!label) return;
    const cat = prompt('Category:', 'person') || 'person';
    const ring = parseInt(prompt('Ring (0-7):', '5')) || 5;
    const fa = parseFloat(prompt('Funding USD (0 if none):', '0')) || null;
    const desc = prompt('Description:', '') || '';
    G.nodes.push({ id: label.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now(), label, cat, ring, fa, desc });
    build(G);
  },
  removeNode() {
    if (!sel) { alert('Click a node first.'); return; }
    G.nodes = G.nodes.filter(n => safeStr(n.id) !== sel);
    G.edges = G.edges.filter(([a, b]) => safeStr(a) !== sel && safeStr(b) !== sel);
    deselect(); build(G);
  },
  exportJSON() {
    const blob = new Blob([JSON.stringify(G, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'spiderweb.json'; a.click();
  },
  importJSON(e) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => { try { const d = JSON.parse(ev.target.result); if (d.nodes && d.edges) { G.nodes = d.nodes; G.edges = d.edges; deselect(); build(G); } } catch { alert('Invalid JSON.'); } };
    r.readAsText(f);
  },
  resetView() { deselect(); cam.position.set(0, 300, 640); oc.target.set(0, 0, 0); },
  closePanel() { deselect(); }
};

addEventListener('resize', () => {
  cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
  ren.setSize(innerWidth, innerHeight); comp.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
});
