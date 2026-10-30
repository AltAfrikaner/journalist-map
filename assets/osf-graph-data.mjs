// Extracted verbatim from osf.html; editorial graph data and relationship labels preserved.
export const CAT = {
  core:      {col:0xc5a258, label:"OSF Core"},
  regional:  {col:0x2a8050, label:"Regional Foundations"},
  usgov:     {col:0x4a60c0, label:"US Gov Parallel"},
  media:     {col:0xb81c2c, label:"SA Media Recipients"},
  academia:  {col:0x1a3888, label:"SA Academia"},
  civil:     {col:0x1a6868, label:"Civil Society"},
  legal:     {col:0x7a3898, label:"Legal / Constitutional"},
  personnel: {col:0xd08030, label:"Personnel Bridges"},
  funding:   {col:0x1a6a3a, label:"Co-Funders"},
  intl:      {col:0x3a5a80, label:"International Amplifiers"},
  health:    {col:0xa82858, label:"Health / Social"},
  govt:      {col:0x6a7828, label:"Govt Adjacent"},
  political: {col:0x9a5a2a, label:"Political Connections"},
  platform:  {col:0x444444, label:"Platform / Enforcement"}
};

export const NODES = [
  // ── OSF CORE ──
  {id:"osf",label:"OSF (Global)",cat:"core",r:2.6,x:0,y:0,z:0,
   desc:"Open Society Foundations. Founded 1979 (first act: UCT bursaries). $25B+ total global spend. South Africa was the founding country of Soros philanthropy. Bifurcated structure: US 501(c)(3) + Swiss Zug entity.",
   detail:"$25B+ globally · SA = origin of Soros philanthropy · Swiss bifurcation"},
  {id:"osf_sa",label:"OSF-SA",cat:"core",r:2.0,x:6,y:2,z:2,
   desc:"Open Society Foundation for South Africa. Cape Town, April 1993. First chair: Van Zyl Slabbert. Board included Helen Zille, Alex Boraine, Fikile Bam. $230M+ invested. 750+ grantees.",
   detail:"$230M+ · 750+ grantees · Zille on board · Slabbert chair"},
  {id:"osisa",label:"OSISA",cat:"regional",r:1.5,x:-5,y:3,z:1,
   desc:"Open Society Initiative for Southern Africa. 11 countries. $5M/year. Founded 1997, Slabbert first chair. Merged into global OSF Africa 2022.",
   detail:"11 countries · $5M/year · Slabbert founding chair"},
  {id:"osiea",label:"OSIEA",cat:"regional",r:1.3,x:-4,y:-3,z:3,
   desc:"Open Society Initiative for Eastern Africa. Nairobi. Kenya, Uganda, Tanzania, Rwanda, Ethiopia.",
   detail:"East Africa operations · Nairobi HQ"},

  // ── US GOVERNMENT ──
  {id:"usaid",label:"USAID SA",cat:"usgov",r:1.5,x:9,y:4,z:-2,
   desc:"USAID South Africa. $38M/year pre-2025. Democracy, governance, media grants to amaBhungane, Daily Maverick.",
   detail:"$38M/year · Journalism grants"},
  {id:"ned",label:"NED",cat:"usgov",r:1.3,x:8,y:6,z:1,
   desc:"National Endowment for Democracy. Funds The Continent via Adamela Trust. Simon Allison connection.",
   detail:"Funds The Continent · $2M+ SA"},
  {id:"pepfar",label:"PEPFAR",cat:"usgov",r:1.1,x:10,y:2,z:-4,
   desc:"PEPFAR. HIV/AIDS programme. TAC overlap documented.",
   detail:"TAC overlap documented"},
  {id:"prm",label:"US State Dept PRM",cat:"usgov",r:1.0,x:11,y:0,z:2,
   desc:"Bureau of Population, Refugees and Migration. Confirmed funder of LHR.",
   detail:"LHR funder · 2025 letter overlap"},

  // ── SA MEDIA RECIPIENTS ──
  {id:"dm",label:"Daily Maverick",cat:"media",r:1.5,x:-8,y:2,z:-3,
   desc:"SA's most-read online investigative platform. OSF grantee. USAID grant. Pierre de Vos regular contributor. Launched Factcheck Hub in partnership with Africa Check.",
   detail:"OSF grantee · USAID · AC Factcheck Hub partner"},
  {id:"ama",label:"amaBhungane",cat:"media",r:1.4,x:-9,y:4,z:1,
   desc:"Investigative unit. OSF grantee. USAID Open Tender. Ford Foundation.",
   detail:"OSF · USAID · Ford Foundation"},
  {id:"ac",label:"Africa Check",cat:"media",r:1.8,x:-7,y:5,z:3,
   desc:"The chokepoint. Wits-housed. OSF 12%. Gates 13%. Luminate 8%. Co-founded by Peter Cunliffe-Jones (now on IFCN board). Partners News24 and Daily Maverick. Feeds Meta content moderation via IFCN certification.",
   detail:"OSF 12% · Gates 13% · IFCN · Meta pipeline · Partners News24"},
  {id:"iss",label:"ISS Africa",cat:"media",r:1.4,x:-6,y:3,z:-5,
   desc:"Institute for Security Studies. OSF-funded ($5.1M, largest Africa recipient). Born from 1990 Lusaka meeting. Allison connection. Farm attack data sourcing.",
   detail:"$5.1M OSF · Simon Allison · Farm attack brief"},
  {id:"continent",label:"The Continent",cat:"media",r:1.2,x:-5,y:7,z:2,
   desc:"Pan-African newspaper. NED-funded via Adamela Trust. Editor: Simon Allison. WhatsApp distribution to 160 countries.",
   detail:"NED-funded · Allison · 160 countries"},
  {id:"groundup",label:"GroundUp",cat:"media",r:1.0,x:-9,y:-1,z:3,
   desc:"Community media. OSF grantee. SECTION 27 partner.",
   detail:"OSF grantee · Housing rights"},
  {id:"mg",label:"Mail & Guardian",cat:"media",r:1.3,x:-10,y:1,z:-2,
   desc:"SA liberal weekly. OSF grantee. Allison was Africa editor.",
   detail:"OSF grantee · Allison revolving door"},
  {id:"vrye",label:"Vrye Weekblad",cat:"media",r:1.0,x:-7,y:-3,z:-6,
   desc:"First anti-apartheid Afrikaans newspaper. Founded 1988 by du Preez after Dakar. Rescued 2022 by Pienaar (51%). Closed March 2025.",
   detail:"Dakar origin · Pienaar 51% · Closed 2025"},
  {id:"news24",label:"News24",cat:"media",r:1.3,x:-11,y:3,z:-1,
   desc:"SA's largest digital news platform. Naspers/Media24 owned. Editor: Adriaan Basson (one of six white progressives). Africa Check partner. Launched full-time Disinformation Desk February 2025. SA's most trusted news brand (Reuters Institute).",
   detail:"Naspers · Basson editor · AC partner · Disinfo Desk 2025"},
  {id:"aiac",label:"Africa Is a Country",cat:"media",r:0.9,x:-12,y:0,z:0,
   desc:"OSF-funded publication. Described as a 'propaganda tool against Afrikaner culture' in Alt Afrikaner analysis. OSF Q&A: 'How One Publication Is Reframing Narratives on Africa.'",
   detail:"OSF-funded · Anti-Afrikaner narrative framing"},

  // ── PLATFORM / ENFORCEMENT ──
  {id:"ifcn",label:"IFCN (Poynter)",cat:"platform",r:1.3,x:-4,y:8,z:5,
   desc:"International Fact-Checking Network. Housed at Poynter Institute. Certifies Africa Check. Cunliffe-Jones (Africa Check co-founder) sits on IFCN board. Certification determines which organisations can flag content for Meta removal.",
   detail:"Certifies Africa Check · Cunliffe-Jones on board · Meta gateway"},
  {id:"meta",label:"Meta / Facebook",cat:"platform",r:1.4,x:-3,y:9,z:4,
   desc:"Meta Platforms. Uses IFCN-certified fact-checkers (including Africa Check) to flag and suppress content. Farm attack posts documented as removed. Facebook partnership with Africa Check since 2019 for African languages.",
   detail:"AC fact-check partner · Farm posts removed · IFCN enforcement"},

  // ── SA ACADEMIA ──
  {id:"wits",label:"Wits University",cat:"academia",r:1.5,x:2,y:6,z:-5,
   desc:"OSF direct grants $4.83M+. Africa Check housed here. CALS receives OSF grants.",
   detail:"$4.83M+ · Africa Check housed · CALS"},
  {id:"uct",label:"UCT",cat:"academia",r:1.4,x:3,y:5,z:5,
   desc:"$2.6M+ OSF grants. Karl Popper Bursary Fund 1979 (founding act of OSF). Pierre de Vos Claude Leon Chair.",
   detail:"$2.6M+ · 1979 founding act · de Vos Chair"},
  {id:"su",label:"Stellenbosch Univ.",cat:"academia",r:1.4,x:1,y:7,z:-3,
   desc:"$1.032M OSF ACCAI grant. Wasserman Chair. IDRC R20M CINIA 2026.",
   detail:"$1.032M+ · Wasserman Chair · R20M IDRC"},
  {id:"up",label:"Univ. of Pretoria",cat:"academia",r:1.0,x:4,y:4,z:-6,
   desc:"Faculty of Humanities OSF engagement.",detail:"OSF Humanities"},
  {id:"ukzn",label:"UKZN",cat:"academia",r:0.9,x:5,y:3,z:-7,
   desc:"OSF civil society research.",detail:"OSF research"},

  // ── CIVIL SOCIETY ──
  {id:"casac",label:"CASAC",cat:"civil",r:1.2,x:2,y:-5,z:2,desc:"Council for Advancement of SA Constitution. OSF-funded. de Vos advisory.",detail:"OSF-funded · de Vos"},
  {id:"cw",label:"Corruption Watch",cat:"civil",r:1.1,x:3,y:-6,z:4,desc:"OSF-funded. amaBhungane partner.",detail:"OSF-funded"},
  {id:"csvr",label:"CSVR",cat:"civil",r:1.0,x:4,y:-4,z:6,desc:"Centre for Study of Violence & Reconciliation. OSF/OSISA grantee.",detail:"OSF/OSISA grantee"},
  {id:"sjc",label:"Social Justice Coalition",cat:"civil",r:0.9,x:1,y:-7,z:3,desc:"Cape Town community organising. OSF grantee.",detail:"OSF grantee"},

  // ── LEGAL / CONSTITUTIONAL ──
  {id:"s27",label:"SECTION 27",cat:"legal",r:1.2,x:5,y:-5,z:-2,desc:"Health rights litigation. OSF grantee.",detail:"OSF grantee"},
  {id:"tac",label:"TAC",cat:"health",r:1.1,x:7,y:-3,z:-4,desc:"Treatment Action Campaign. OSF grantee. PEPFAR co-funding.",detail:"OSF grantee · PEPFAR overlap"},
  {id:"ee",label:"Equal Education",cat:"civil",r:0.9,x:6,y:-6,z:-3,desc:"Education rights. OSF grantee.",detail:"OSF grantee"},
  {id:"lhr",label:"Lawyers for Human Rights",cat:"legal",r:1.3,x:6,y:-4,z:2,desc:"Three-generation institutional spine. OSF + Ford + PRM + Constitutionalism Fund. 2025 letter signatories.",detail:"OSF + Ford + PRM + CF · 2025 letter"},
  {id:"nu",label:"Ndifuna Ukwazi",cat:"civil",r:0.8,x:2,y:-8,z:-1,desc:"Housing rights. OSF grantee.",detail:"OSF grantee"},
  {id:"seri",label:"SERI",cat:"legal",r:0.9,x:7,y:-2,z:4,desc:"Socio-Economic Rights Institute. OSF-funded.",detail:"OSF-funded"},
  {id:"cfund",label:"Constitutionalism Fund",cat:"legal",r:1.5,x:5,y:0,z:5,desc:"$29M. OSF + Ford + Atlantic. Selection panel: Justice Mokgoro. 60+ grantees. LHR primary.",detail:"$29M · Mokgoro panel · LHR primary"},
  {id:"cals",label:"CALS (Wits)",cat:"legal",r:0.9,x:4,y:1,z:6,desc:"Centre for Applied Legal Studies. Wits. OSF grants.",detail:"OSF-funded"},
  {id:"judges",label:"Judges Matter",cat:"legal",r:0.8,x:6,y:1,z:-5,desc:"Judicial transparency advocacy. OSF programme.",detail:"OSF programme"},
  {id:"lrc",label:"Legal Resources Centre",cat:"legal",r:1.2,x:8,y:1,z:6,desc:"Founded 1979 by Chaskalson (later first ConCourt President). Ford + Carnegie + RBF funded. Fikile Bam was LRC PE director.",detail:"Chaskalson · Ford + Carnegie · Bam bridge"},

  // ── PERSONNEL BRIDGES ──
  {id:"nowrojee",label:"Binaifer Nowrojee",cat:"personnel",r:1.2,x:-1,y:4,z:6,desc:"OSF Global VP Programmes. HRW Africa to OSF. Controls all global disbursements.",detail:"HRW to OSF · Global VP"},
  {id:"gaspard",label:"Patrick Gaspard",cat:"personnel",r:1.2,x:-2,y:3,z:7,desc:"OSF President 2019-2023. Obama WH political director. US Ambassador to SA 2013-2016.",detail:"Obama WH to SA Ambassador to OSF President"},
  {id:"slabbert",label:"Van Zyl Slabbert",cat:"personnel",r:1.3,x:-3,y:2,z:8,desc:"PFP leader. IDASA co-founder. Dakar 1987. OSF-SA + OSISA founding chair. ISS origin via Lusaka. The origin node. Died 2010.",detail:"OSF-SA + OSISA chair · Dakar · ISS origin"},
  {id:"hassan",label:"Fatima Hassan",cat:"personnel",r:1.1,x:-4,y:1,z:5,desc:"OSF-SA ED 2013-2019.",detail:"OSF-SA ED"},
  {id:"wasserman",label:"Prof Wasserman",cat:"personnel",r:1.3,x:-5,y:5,z:4,desc:"Stellenbosch Chair. Edits AJS + Annals ICA. Commissioned by Africa Check. IDRC R4.5M. Called Afrikaner refugees 'fake/props'.",detail:"SU Chair · AJS + Annals · Africa Check · R4.5M IDRC"},
  {id:"devos",label:"Pierre de Vos",cat:"personnel",r:1.1,x:-2,y:6,z:-4,desc:"UCT Claude Leon Chair. CASAC advisory. DM contributor. 2025 letter.",detail:"UCT Chair · CASAC · DM · 2025 letter"},
  {id:"allison",label:"Simon Allison",cat:"personnel",r:1.0,x:-6,y:-1,z:6,desc:"DM to M&G to ISS (OSF) to The Continent (NED). One person, four institutions.",detail:"DM to M&G to ISS to Continent"},
  {id:"dupreez",label:"Max du Preez",cat:"personnel",r:1.0,x:-8,y:-2,z:-5,desc:"Vrye Weekblad founder. Attended Dakar 1987. Pienaar rescued 2022 (49% stake).",detail:"Dakar · VW founder · Pienaar 49%"},

  // ── POLITICAL CONNECTIONS ──
  {id:"zille",label:"Helen Zille",cat:"political",r:1.3,x:8,y:5,z:5,desc:"OSF-SA Board Trustee. DA leader. Cape Town Mayor. WC Premier. Confirmed by gov.za, Britannica, SA History Online. Spoke of 'Popperian philosophy'.",detail:"OSF-SA Board · DA · Premier"},
  {id:"boraine",label:"Alex Boraine",cat:"political",r:1.0,x:7,y:6,z:3,desc:"IDASA co-founder. OSF-SA board. Later TRC Deputy Chairman.",detail:"IDASA · OSF-SA · TRC"},
  {id:"bam",label:"Fikile Bam",cat:"political",r:0.9,x:9,y:3,z:4,desc:"OSF-SA board. Former Robben Island prisoner. LRC PE director. Land Claims Court President.",detail:"OSF-SA board · LRC · Land Claims Court"},
  {id:"mokgoro",label:"Justice Mokgoro",cat:"political",r:1.2,x:7,y:2,z:7,desc:"ConCourt Justice 1994-2009. First black woman on bench. Chaired $29M Constitutionalism Fund selection panel.",detail:"ConCourt · CF panel chair"},
  {id:"pienaar",label:"Andre Pienaar",cat:"personnel",r:0.9,x:-9,y:-3,z:-7,desc:"C5 Capital CEO. Rescued VW 2022 (51%). C5 partners: former CIA European chief, GCHQ director, US Joint Chiefs chairman.",detail:"C5 · VW 51% · Intelligence partners"},
  {id:"idasa",label:"IDASA",cat:"civil",r:1.1,x:-1,y:0,z:9,desc:"Institute for Democracy in Africa. Co-founded 1986 by Slabbert and Boraine. Organised Dakar 1987 and Lusaka 1990.",detail:"Slabbert + Boraine · Dakar · ISS origin"},
  {id:"dirco",label:"DIRCO",cat:"govt",r:1.1,x:0,y:-8,z:-5,desc:"Department of International Relations and Cooperation. ISS findings adopted as official talking points. DIRCO farm crime statement echoes ISS language within weeks.",detail:"ISS echo · Farm crime talking points"},

  // ── CO-FUNDERS ──
  {id:"ford",label:"Ford Foundation",cat:"funding",r:1.3,x:8,y:-5,z:3,desc:"$3M+ to LHR. $29M CF co-funder. 60+ years in SA. LRC founding funder.",detail:"$3M+ LHR · $29M CF · LRC founding"},
  {id:"atlantic",label:"Atlantic Philanthropies",cat:"funding",r:1.2,x:9,y:-3,z:5,desc:"$355M+ total SA investment. Closed 2016. $29M CF as exit mechanism.",detail:"$355M+ SA · CF exit mechanism"},
  {id:"gates",label:"Gates Foundation",cat:"funding",r:1.2,x:7,y:-7,z:2,desc:"Africa Check 13%. Health programme overlap.",detail:"Africa Check 13%"},
  {id:"luminate",label:"Luminate (Omidyar)",cat:"funding",r:1.0,x:6,y:-8,z:-1,desc:"Africa Check 8%. Omidyar Network spinoff.",detail:"Africa Check 8%"},
  {id:"idrc",label:"IDRC (Canada)",cat:"funding",r:1.1,x:5,y:8,z:-2,desc:"R4.5M to Wasserman. R20M CINIA 2026 to Stellenbosch.",detail:"R4.5M Wasserman · R20M CINIA"},
  {id:"hewlett",label:"Hewlett Foundation",cat:"funding",r:0.8,x:10,y:-1,z:-5,desc:"Governance and accountability grants in SA.",detail:"Governance SA"},

  // ── INTERNATIONAL AMPLIFIERS ──
  {id:"bbc",label:"BBC Africa",cat:"intl",r:1.1,x:-10,y:-3,z:-3,desc:"Cites Africa Check. Amplifies ISS. No disclosure of grantee status.",detail:"AC cites · ISS amplifies"},
  {id:"guardian",label:"The Guardian",cat:"intl",r:1.1,x:-11,y:-1,z:2,desc:"Africa Check citations. M&G historical co-investment.",detail:"AC · M&G co-investment"},
  {id:"hrw",label:"Human Rights Watch",cat:"intl",r:1.0,x:-9,y:-5,z:-1,desc:"Nowrojee career origin. Farm attack framing consistent with OSF grantees.",detail:"Nowrojee origin"},
  {id:"amnesty",label:"Amnesty Intl",cat:"intl",r:0.9,x:-11,y:-4,z:-4,desc:"Kemp apartheid-genocide lecture. Stellenbosch to ICJ pipeline.",detail:"Kemp lecture · ICJ pipeline"},
  {id:"aj",label:"Al Jazeera",cat:"intl",r:0.9,x:-10,y:-6,z:1,desc:"ISS and Africa Check citations. SA government narrative amplification.",detail:"ISS + AC cites"},

  // ── GOVT ADJACENT ──
  {id:"npc",label:"NPC",cat:"govt",r:1.0,x:0,y:-6,z:-6,desc:"National Planning Commission. Landman sat on NPC + signed 2025 letter.",detail:"Landman NPC + 2025 letter"},
  {id:"siu",label:"SIU adjacent",cat:"govt",r:0.8,x:-1,y:-7,z:-4,desc:"Special Investigating Unit. Corruption Watch referral pipeline.",detail:"CW referrals"}
];

export const EDGES = [
  // OSF core
  ["osf","osf_sa","owns"],["osf","osisa","owns"],["osf","osiea","owns"],
  // OSF-SA grants to media
  ["osf_sa","dm","grants"],["osf_sa","ama","grants"],["osf_sa","ac","grants"],
  ["osf_sa","iss","grants"],["osf_sa","groundup","grants"],["osf_sa","mg","grants"],
  ["osf_sa","aiac","grants"],
  // OSF-SA grants to academia
  ["osf_sa","wits","grants"],["osf_sa","uct","grants"],["osf_sa","su","grants"],
  ["osf_sa","up","grants"],["osf_sa","ukzn","grants"],
  // OSF-SA grants to civil society
  ["osf_sa","casac","grants"],["osf_sa","cw","grants"],["osf_sa","s27","grants"],
  ["osf_sa","ee","grants"],["osf_sa","lhr","grants"],["osf_sa","nu","grants"],
  ["osisa","csvr","grants"],["osisa","sjc","grants"],["osisa","seri","grants"],
  // OSF to legal
  ["osf","cfund","cofunds"],["osf_sa","cals","grants"],["osf_sa","judges","grants"],
  // OSF to health
  ["osf_sa","tac","grants"],
  // US Gov
  ["usaid","dm","grants"],["usaid","ama","grants"],["usaid","ac","grants"],
  ["ned","continent","funds"],["pepfar","tac","funds"],["prm","lhr","funds"],
  // Co-funders
  ["ford","cfund","cofunds"],["ford","lhr","grants"],["ford","lrc","grants"],
  ["atlantic","cfund","cofunds"],
  ["gates","ac","funds"],["luminate","ac","funds"],
  ["idrc","wasserman","funds"],["idrc","su","grants"],
  ["hewlett","osf_sa","cofunds"],
  // CF grantees
  ["cfund","lhr","grants"],["cfund","casac","grants"],["cfund","s27","grants"],
  // Content suppression pipeline
  ["ac","ifcn","certified"],["ifcn","meta","authorises"],["meta","ac","partner"],
  ["ac","news24","partner"],["ac","dm","partner"],
  // Personnel
  ["nowrojee","osf","staff"],["gaspard","osf","president"],
  ["gaspard","osf_sa","bridge"],["slabbert","osf_sa","chair"],
  ["slabbert","osisa","chair"],["slabbert","idasa","cofounded"],
  ["hassan","osf_sa","director"],
  ["wasserman","ac","commissioned"],["wasserman","su","chair"],
  ["devos","uct","chair"],["devos","casac","advisory"],["devos","dm","contributor"],
  ["allison","dm","staff"],["allison","mg","editor"],
  ["allison","iss","consultant"],["allison","continent","editor"],
  ["dupreez","vrye","founded"],["dupreez","dm","contributor"],
  // Political
  ["zille","osf_sa","board"],["boraine","osf_sa","board"],["bam","osf_sa","board"],
  ["boraine","idasa","cofounded"],["bam","lrc","director"],
  ["mokgoro","cfund","panel_chair"],
  ["pienaar","vrye","investor"],
  // Media amplification
  ["ac","bbc","cited"],["ac","guardian","cited"],["ac","hrw","network"],
  ["iss","bbc","cited"],["iss","aj","cited"],["iss","dirco","echo"],
  ["dm","guardian","partner"],["dm","bbc","cited"],
  ["continent","aj","cited"],
  ["ama","dm","partner"],["cw","ama","partner"],
  // Legal
  ["lhr","cfund","grantee"],["cals","wits","housed"],["lrc","cfund","network"],
  ["judges","casac","network"],["seri","s27","network"],
  // Govt
  ["devos","npc","adjacent"],["cw","siu","referrals"],["dirco","iss","echo"],
  // Origin chain
  ["idasa","slabbert","origin"],["vrye","dupreez","origin"],
];


