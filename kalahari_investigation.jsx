import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════
// DATA — ALL FINDINGS FROM 11 VOLUMES
// ═══════════════════════════════════════════
const TIMELINE = [
  { year: "1975", title: "ISSA Agreement Signed", desc: "Israel-South Africa secret defence pact. Nuclear warhead discussions ('Chalet' in three sizes), tritium-for-uranium swaps. Overberg facility designed to mirror Israel's Palmachim.", tier: 1, cat: "nuclear" },
  { year: "1976", title: "Vastrap Shafts Drilled", desc: "Two underground nuclear test shafts drilled in the Kalahari Desert — 385m and 216m deep. Detected by Soviet satellites. USSR alerts US. Tests halted under international pressure.", tier: 1, cat: "nuclear" },
  { year: "1979", title: "Vela Incident", desc: "US satellite detects nuclear double-flash near Prince Edward Islands. CIA: 90%+ probability nuclear. Operation Phoenix — now widely confirmed as SA-Israeli joint test.", tier: 1, cat: "nuclear" },
  { year: "1981", title: "Kentron Circle Commissioned", desc: "Armscor begins production of deliverable nuclear devices at the Kentron Circle / Advena facility.", tier: 1, cat: "nuclear" },
  { year: "1984", title: "ISC Pipeline Begins", desc: "James Guerin (ISC) begins working as CIA consultant. Near-weekly classified technology shipments to Armscor. Inman, Haig connections established.", tier: 1, cat: "intel" },
  { year: "Aug 1987", title: "Vastrap Reactivated", desc: "Armscor assesses Vastrap test shafts, erects 100m concealment hangar. US and USSR satellites detect construction. Vastrap re-enters classified operational consideration.", tier: 1, cat: "nuclear" },
  { year: "Nov 1987", title: "Helderberg Disaster", desc: "SAA Flight 295 crashes — Armscor confirmed shipping rocket fuel chemicals on commercial aircraft. TRC evidence proves covert logistics pattern. SAS Tafelberg assists in debris recovery.", tier: 1, cat: "intel" },
  { year: "Apr 1989", title: "Border War Ends", desc: "Mass SADF demobilisation begins. Nuclear programme dismantlement ordered. Institutional collapse creates conditions for classified information leaks through informal channels.", tier: 1, cat: "context" },
  { year: "7 May 1989", title: "THE KALAHARI INCIDENT", desc: "SAS Tafelberg radar detection 13:45. Mirage scramble from Valhalla AFB. Thor-2 MASER engagement. Object crashes 80km north of SA/Botswana border at 25° angle. Sand vitrified. Socorro-matching hull symbol.", tier: 3, cat: "crash", highlight: true },
  { year: "May 1989", title: "Concurrent ICBM Launches", desc: "Two classified ICBM launches from Cape Vidal and Southern Cape ranges. Missiles reportedly 'overshot' northern Cape test area near Lohatla. Still classified TOP SECRET per SADF insider (2018).", tier: 3, cat: "crash" },
  { year: "7-8 May 1989", title: "Recovery Operation", desc: "First helicopter crashes at 500ft due to EM field — 5 crew killed. Paint compound neutralises field. Craft taken to Valhalla/Swartkops AFB, 6th level underground. Two entities recovered, one attacks doctor.", tier: 3, cat: "crash" },
  { year: "1 Jun 1989", title: "RSA-1 Launch", desc: "South Africa's first indigenous satellite launch vehicle test from Overberg. Reaches 100km altitude. Confirmed by multiple sources.", tier: 1, cat: "weapons" },
  { year: "23 Jun 1989", title: "Alleged Transfer to US", desc: "Craft and two entities flown to Wright-Patterson AFB via two USAF Galaxy C-2 aircraft. Third entity allegedly withheld by SA — taken to Camp 13 and/or 1 Military Hospital.", tier: 3, cat: "crash" },
  { year: "5 Jul 1989", title: "RSA-3 / Jericho-II Test", desc: "Joint SA-Israeli ballistic missile test from Overberg. Flies 900 miles over Indian Ocean. Confirmed by NBC and US officials. Israeli Jericho-II technology.", tier: 1, cat: "weapons" },
  { year: "Jul 1989", title: "US BEAR Experiment", desc: "USA launches Neutral Particle Beam Accelerator from White Sands to 200km altitude — beam weapon test in space. Parallel directed-energy testing window.", tier: 1, cat: "weapons" },
  { year: "Jul 1989", title: "Documents Reach UK", desc: "Tony Dodd receives envelope with South African postmark containing first crash documents. Azadehdel simultaneously introduces Kalahari story to UK UFO network.", tier: 2, cat: "intel" },
  { year: "28 Jul 1991", title: "BLUE FIRE Memorandum", desc: "NRO/CSS memo distributed to 20+ classified recipients including Groom Lake MOC, Dreamland MOC, Sea Spray SOG. Architecture matches 2024 Immaculate Constellation USAP.", tier: 3, cat: "docs" },
  { year: "1993", title: "Quest Special Edition", desc: "Quest International publishes full Kalahari dossier. Botswana Environment Minister Dithoko Seiso confirms 'an incident' to Cape Town Argus. Argus file subsequently 'borrowed' — goes missing.", tier: 2, cat: "docs" },
  { year: "1993", title: "Hind's 'Anatomy of a Hoax'", desc: "Cynthia Hind exposes Van Greunen as document originator. 14 spelling errors identified. Van Greunen admits fabricating some details but insists core story is true — told by SAAF pilot Hendrik Greef.", tier: 2, cat: "docs" },
  { year: "1993", title: "SAS Tafelberg Scrapped", desc: "The ship that allegedly first detected the object is sold for scrap. All shipboard records, radar logs, and communications transcripts from May 1989 likely destroyed.", tier: 1, cat: "context" },
  { year: "Sep 1994", title: "Ariel School Encounter", desc: "62 children in Ruwa, Zimbabwe describe small beings with huge dark eyes and tight black suits. Entity descriptions match Kalahari dossier. Investigated by Cynthia Hind and Dr. John Mack.", tier: 2, cat: "uap" },
  { year: "Sep 1995", title: "Van Greunen's Second Hoax", desc: "Stages second SA UFO crash hoax in Lesotho. Assessed as hoax by Hind, Friedman, Hesemann, Powell. Same operational pattern as 1989. Hesemann debunking allegedly attributed to German intelligence.", tier: 2, cat: "intel" },
  { year: "May 2010", title: "Fältskog Identity Emerges", desc: "Van Greunen operating as 'Dr. Judy Fältskog' with fake NASA/SETI signal claim. Tags YouTube video with 'South Africa' and 'Kalahari Desert' metadata — operational reuse 21 years later.", tier: 2, cat: "intel" },
  { year: "Nov 2024", title: "Immaculate Constellation", desc: "Rep. Nancy Mace enters Immaculate Constellation report into US Congressional Record. Describes centralised UAP USAP with above-Congressional compartmentalisation — structurally identical to BLUE FIRE.", tier: 1, cat: "uap" },
  { year: "Apr 2025", title: "Brown Confirms Report", desc: "Matthew Brown publicly confirms he authored Immaculate Constellation report. Confirms F-22 'boxed in by 3-6 UAPs' and satellite imagery of football-field-sized craft.", tier: 1, cat: "uap" },
];

const CONFIDENCE = [
  { claim: "Something anomalous occurred on/around 7 May 1989", pct: 85, color: "#3ddc84" },
  { claim: "Multi-layer event: real event + disinformation overlay", pct: 78, color: "#4a90d9" },
  { claim: "Dithoko Seiso confirmed 'an incident'", pct: 75, color: "#4a90d9" },
  { claim: "Recovery helicopter crash (5 crew killed)", pct: 66, color: "#d4a843" },
  { claim: "BLUE FIRE contains authentic programme names", pct: 65, color: "#d4a843" },
  { claim: "Van Greunen was managed intelligence asset", pct: 55, color: "#d4a843" },
  { claim: "ICBM test overshoot as partial/full explanation", pct: 48, color: "#d4a843" },
  { claim: "Nuclear devices exchanged for craft/beings", pct: 44, color: "#c0392b" },
  { claim: "Third entity withheld by SA government", pct: 40, color: "#c0392b" },
  { claim: "Craft/occupants were extraterrestrial", pct: 22, color: "#c0392b" },
];

const DISCOVERIES = [
  { vol: "VII", title: "60-Day Weapons Corridor", desc: "The crash date sits between RSA-1 (June 1) and RSA-3/Jericho-II (July 5-6) — the most intense weapons testing period in SA history. The US BEAR particle beam test happened the same month.", icon: "⚡" },
  { vol: "VII", title: "Overberg–Palmachim Mirror", desc: "The Overberg Test Range was designed to mirror Israel's Palmachim facility — confirming Israeli technical personnel embedded in SA weapons infrastructure during 1989.", icon: "🔗" },
  { vol: "VII", title: "SAS Tafelberg Plausibility", desc: "Though wrongly called a 'frigate,' SAS Tafelberg had just completed Exercise Magersfontein (1988), had radar capability, and was conducting patrols in May 1989. Scrapped 1993 — records lost.", icon: "🚢" },
  { vol: "VII", title: "Helderberg Connection", desc: "SAA Flight 295 (1987) proves Armscor shipped rocket fuel on commercial aircraft. The same institution ran Vastrap, Overberg, and the RSA missile programme — all active May-July 1989.", icon: "✈️" },
  { vol: "VII", title: "'Valhalla' Insider Indicator", desc: "The document's use of 'Valhalla AFB' — dismissed as error — is actually the colloquial name for Swartkops AFB's suburb. Only a Pretoria-based insider would use this name.", icon: "📍" },
  { vol: "VII", title: "Border War Leak Trigger", desc: "The Border War ended April 1989, weeks before the incident. Mass demobilisation + nuclear dismantlement created exact conditions for classified leaks through officers' mess conversations.", icon: "🔓" },
  { vol: "IX", title: "Azadehdel is Aviary-Adjacent", desc: "CIA's 'cannot confirm or deny' response is tradecraft — not a non-answer. Combined with his role selling SAAF documents alongside Aviary-adjacent tapes through Quest International.", icon: "🕵️" },
  { vol: "IX", title: "Van Greunen Identity Chain Complete", desc: "James Van Greunen → Judith Helena van Greunen → Dr. Judy Fältskog (2010). The 2010 hoax reused 'South Africa' and 'Kalahari Desert' as YouTube metadata — operational pattern, not mere fraud.", icon: "🎭" },
  { vol: "IX", title: "Sea Spray = Real Programme", desc: "Sea Spray SOG in the BLUE FIRE memo references Operation Sea Spray — a real classified 1950 US Navy bioweapon test. A naive forger in 1991 would not know this name. The document is more sophisticated than a simple fake.", icon: "🔐" },
  { vol: "IX", title: "MASER Weapons Sold to SA", desc: "Independent source: 'maser weapons systems were known to have been sold to South Africa and France.' Aligns with the Armscor pipeline and France's Mirage relationship. Thor-2 may be a real designation.", icon: "📡" },
  { vol: "XI", title: "BLUE FIRE ↔ Immaculate Constellation", desc: "The 1991 BLUE FIRE memo's distribution architecture is structurally identical to the 2024 Immaculate Constellation USAP — both centralised UAP programmes with above-Congressional compartmentalisation.", icon: "📋" },
  { vol: "XI", title: "Socorro Hull Symbol Match", desc: "The insignia on the Kalahari craft matches the symbol recorded in the 1964 Socorro/Lonnie Zamora incident — cross-corpus entity analysis spanning 25 years and two continents.", icon: "⭕" },
];

const ACTORS = [
  { name: "James Van Greunen", role: "Document Originator / Possible Managed Asset", detail: "Created 1989 Kalahari docs, 1995 Lesotho hoax, 2010 Fältskog persona. Triple-pattern suggests operational reuse, not mere serial fabrication." },
  { name: "Henry Azadehdel", role: "Aviary Network / CIA-Adjacent", detail: "Also known as Armen Victorian. CIA CNCD response. Introduced Kalahari story to UK UFO network. Simultaneously at Old Bailey for orchid smuggling." },
  { name: "Tony Dodd (1935–2009)", role: "UK UFO Investigator", detail: "Received original documents July 1989. SA Embassy threats by telephone. Intelligence contacts independently confirmed event. Author: Alien Investigator (2000)." },
  { name: "Cynthia Hind (1925–2000)", role: "Africa's Foremost UFO Researcher", detail: "Published 'Anatomy of a Hoax.' Also validated Ariel School (1994). Entity descriptions from both cases match. Publisher of UFO Afrinews." },
  { name: "Dithoko Seiso", role: "Botswana Environment Minister", detail: "Confirmed 'an incident' to Cape Town Argus in 1993. The Argus file was subsequently 'borrowed' and is now 'missing' from the newspaper's archive." },
  { name: "Hendrik Greef", role: "Alleged SAAF Pilot Source", detail: "Van Greunen's claimed source — an SAAF pilot who overheard the story in an officers' mess. Existence unverified. SANDF PAIA request pending." },
  { name: "James Guerin / ISC", role: "CIA Consultant / Arms Pipeline", detail: "International Signal & Control. Near-weekly classified shipments to Armscor. Court-confirmed US→Israel→SA technology pipeline. CIA consulting from 1984." },
  { name: "Armscor", role: "Central Node — All Connections", detail: "Simultaneously operated Vastrap nuclear site, Overberg missile range, nuclear weapons programme, Atlas Cheetah upgrade, and covert logistics via SAA. Restructured to Denel 1992 — records destroyed." },
];

const FAQS = [
  { q: "Was the Kalahari UFO crash real?", a: "The investigation cannot definitively answer this. The leaked documents contain fabricated elements (14 spelling errors, Van Greunen's partial confession), but they also contain details that show insider knowledge — the 'Valhalla' designation, MASER terminology consistent with Cold War EW parlance, and Sea Spray SOG referencing a real classified programme. The most probable explanation (78% confidence) is a multi-layer event: something real happened, overlaid with disinformation." },
  { q: "What was Thor-2?", a: "The leaked document describes it as a 'Top Secret experimental beam weapon' — specifically a MASER (Microwave Amplification by Stimulated Emission of Radiation). In 1989, this sounded like science fiction. In 2026, High-Power Microwave weapons are deployed on active battlefields. Independent sources state maser weapons were sold to South Africa and France. Thor-2 may be a real programme designation." },
  { q: "Who was Van Greunen?", a: "James Van Greunen is the identified originator of the leaked documents. His identity chain spans decades: Van Greunen → Judith Helena van Greunen → Dr. Judy Fältskog (2010 NASA hoax). He admitted fabricating some details but insisted the core story was true. The triple-hoax pattern and operational reuse of Kalahari metadata suggests he may have been a managed intelligence asset rather than a simple fantasist." },
  { q: "What is the BLUE FIRE memo?", a: "A three-page security advisory dated 28 July 1991, purportedly from NRO/Central Security Service. It orders a base shutdown at Area 51-associated installations and contains distribution lists referencing real classified programmes (Sea Spray, Pahute Mesa, Groom Lake). Its document architecture is structurally identical to the 2024 Immaculate Constellation USAP revealed by whistleblower Matthew Brown." },
  { q: "What does the nuclear connection prove?", a: "It proves the Kalahari region was the centre of South Africa's most classified military activity in 1989. Vastrap nuclear shafts, Overberg missile tests, the ISC/Armscor pipeline, and Israel's embedded technical presence all converge on the same geographic and temporal window. Any anomalous event in this theatre would enter the most secure classification environment on the African continent." },
  { q: "Why does this matter in 2026?", a: "The 2024-2025 US Congressional UAP hearings have confirmed that Pentagon disinformation programmes used UFO narratives to obscure classified R&D. The Kalahari case may be the most documented example of this technique — a possible disinformation operation now visible because the programmes it was designed to protect have themselves been partially declassified." },
];

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════
function useInView(ref, threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

function FadeIn({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const visible = useInView(ref);
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)",
      transition: `all 0.7s ease ${delay}s`
    }}>{children}</div>
  );
}

function TierBadge({ tier }) {
  const colors = { 1: ["#3ddc84", "rgba(61,220,132,0.12)"], 2: ["#4a90d9", "rgba(74,144,217,0.12)"], 3: ["#d4a843", "rgba(212,168,67,0.12)"] };
  const labels = { 1: "TIER 1 — DECLASSIFIED", 2: "TIER 2 — CORROBORATED", 3: "TIER 3 — UNVERIFIED" };
  const [c, bg] = colors[tier] || colors[3];
  return <span style={{ fontSize: "0.6rem", letterSpacing: "1.5px", padding: "3px 8px", border: `1px solid ${c}`, color: c, background: bg, fontFamily: "'JetBrains Mono', monospace" }}>{labels[tier]}</span>;
}

function CatTag({ cat }) {
  const map = { nuclear: "☢️ NUCLEAR", weapons: "🚀 WEAPONS", crash: "💥 INCIDENT", intel: "🕵️ INTELLIGENCE", docs: "📄 DOCUMENTS", context: "📌 CONTEXT", uap: "👁️ UAP" };
  return <span style={{ fontSize: "0.6rem", letterSpacing: "1px", padding: "2px 6px", border: "1px solid #333", color: "#777", fontFamily: "'JetBrains Mono', monospace", marginLeft: "6px" }}>{map[cat] || cat}</span>;
}

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function KalahariInvestigation() {
  const [activeSection, setActiveSection] = useState("hero");
  const [timelineFilter, setTimelineFilter] = useState("all");
  const [openFaq, setOpenFaq] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const NAV = [
    { id: "hero", label: "Home" }, { id: "story", label: "The Story" }, { id: "timeline", label: "Timeline" },
    { id: "discoveries", label: "Discoveries" }, { id: "evidence", label: "Evidence" },
    { id: "actors", label: "Actors" }, { id: "faq", label: "FAQ" }
  ];

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setActiveSection(id);
  };

  const filteredTimeline = timelineFilter === "all" ? TIMELINE : TIMELINE.filter(t => t.cat === timelineFilter);

  return (
    <div style={{ background: "#0a0a0c", color: "#e8e4dc", fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif", lineHeight: 1.7, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Source+Sans+3:wght@300;400;600;700&family=JetBrains+Mono:wght@400;700&family=Special+Elite&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(212,168,67,0.3); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0c; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(192,57,43,0.4)} 50%{box-shadow:0 0 0 8px rgba(192,57,43,0)} }
        @keyframes scanline { 0%{top:-100%} 100%{top:100%} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes typewriter { from{width:0} to{width:100%} }
        .nav-link { color: #9a968e; text-decoration: none; font-size: 0.72rem; letter-spacing: 1.5px; text-transform: uppercase; padding: 20px 12px; transition: color 0.3s; font-weight: 600; cursor: pointer; border: none; background: none; }
        .nav-link:hover, .nav-link.active { color: #d4a843; }
        .card-hover { transition: all 0.4s ease; border: 1px solid #2a2a30; }
        .card-hover:hover { border-color: rgba(212,168,67,0.4); transform: translateY(-3px); background: #222228 !important; }
        .faq-btn { width: 100%; text-align: left; background: #1a1a1f; border: 1px solid #2a2a30; color: #e8e4dc; padding: 1.25rem 1.5rem; cursor: pointer; font-size: 1rem; font-family: inherit; transition: all 0.3s; display: flex; justify-content: space-between; align-items: center; }
        .faq-btn:hover { background: #222228; border-color: rgba(212,168,67,0.3); }
        .conf-bar { height: 6px; border-radius: 3px; transition: width 1.5s ease; }
        .redacted { background: #e8e4dc; color: #e8e4dc; padding: 0 4px; cursor: pointer; transition: all 0.3s; user-select: none; }
        .redacted:hover { background: transparent; color: #c0392b; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); }
        @media (max-width: 768px) {
          .nav-links-row { display: none !important; }
          .hero-title { font-size: 2.5rem !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .grid-3 { grid-template-columns: 1fr !important; }
          .content-max { padding: 0 1.25rem !important; }
        }
      `}</style>

      {/* ═══ NAVIGATION ═══ */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, background: "rgba(10,10,12,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid #2a2a30", padding: "0 1.5rem" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div onClick={() => scrollTo("hero")} style={{ cursor: "pointer", fontFamily: "'Special Elite', monospace", fontSize: "0.8rem", letterSpacing: 3, color: "#d4a843", display: "flex", alignItems: "center", gap: 10 }}>
            KALAHARI <span style={{ fontSize: "0.55rem", color: "#c0392b", border: "1px solid #c0392b", padding: "2px 6px", letterSpacing: 2 }}>CLASSIFIED</span>
          </div>
          <div className="nav-links-row" style={{ display: "flex", gap: 0 }}>
            {NAV.map(n => (
              <button key={n.id} className={`nav-link ${activeSection === n.id ? "active" : ""}`} onClick={() => scrollTo(n.id)}>{n.label}</button>
            ))}
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section id="hero" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", paddingTop: 60 }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 35%, #1a1510 0%, #0a0a0c 70%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,10,12,0.4) 0%, rgba(10,10,12,0.2) 40%, rgba(10,10,12,0.7) 80%, rgba(10,10,12,1) 100%)" }} />
        {/* Scanlines */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: 0, right: 0, height: "200%", background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px)", animation: "scanline 8s linear infinite" }} />
        </div>
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 900, padding: "2rem" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", letterSpacing: 6, color: "#d4a843", marginBottom: "2rem", opacity: 0, animation: "fadeUp 1s ease 0.3s forwards" }}>
            7 MAY 1989 &nbsp;·&nbsp; KALAHARI DESERT &nbsp;·&nbsp; SOUTHERN AFRICA
          </div>
          <h1 className="hero-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.5rem, 6.5vw, 5rem)", fontWeight: 900, lineHeight: 1.05, marginBottom: "1.5rem", opacity: 0, animation: "fadeUp 1s ease 0.6s forwards" }}>
            Something Fell<br />from the <span style={{ color: "#d4a843", fontStyle: "italic" }}>Sky</span>
          </h1>
          <p style={{ fontSize: "1.1rem", color: "#9a968e", maxWidth: 600, margin: "0 auto 2rem", fontWeight: 300, opacity: 0, animation: "fadeUp 1s ease 0.9s forwards" }}>
            Nuclear test shafts sealed in the sand. Two Mirage jets scrambled at dusk. A secret pact with Israel. And a story the world was never meant to hear. This is every finding from an 11-volume OSINT investigation.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", opacity: 0, animation: "fadeUp 1s ease 1.2s forwards" }}>
            <button onClick={() => scrollTo("story")} style={{ padding: "14px 32px", border: "1px solid #d4a843", color: "#d4a843", background: "none", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", letterSpacing: 2, cursor: "pointer", transition: "all 0.3s" }}
              onMouseEnter={e => { e.target.style.background = "#d4a843"; e.target.style.color = "#0a0a0c"; }}
              onMouseLeave={e => { e.target.style.background = "none"; e.target.style.color = "#d4a843"; }}>
              BEGIN INVESTIGATION →
            </button>
            <button onClick={() => scrollTo("evidence")} style={{ padding: "14px 32px", border: "1px solid #2a2a30", color: "#9a968e", background: "none", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", letterSpacing: 2, cursor: "pointer" }}>
              EVIDENCE MATRIX
            </button>
          </div>
        </div>
      </section>

      {/* ═══ THE STORY ═══ */}
      <section id="story" className="content-max" style={{ maxWidth: 800, margin: "0 auto", padding: "5rem 2rem" }}>
        <FadeIn>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: 5, color: "#8b7030", marginBottom: "1.5rem" }}>THE INVESTIGATION</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.2rem", fontWeight: 700, marginBottom: "1.5rem" }}>Eleven Volumes. One Question.</h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p style={{ fontSize: "1.15rem", color: "#e8e4dc", fontWeight: 300, lineHeight: 1.8, marginBottom: "1.5rem" }}>
            On a clear autumn afternoon in 1989, South African naval radar detected an object entering the continent's airspace at 5,746 knots. Two Mirage fighters were scrambled. An experimental weapon — designated Thor-2 — was reportedly fired. Something crashed into the Kalahari Desert at a 25-degree angle, leaving a crater of fused sand.
          </p>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p style={{ color: "#9a968e", marginBottom: "1.5rem" }}>
            That's the story the leaked documents tell. But the real investigation goes far deeper — into South Africa's nuclear weapons programme, the secret Israel-South Africa defence pact, a CIA-sanctioned arms pipeline handling tens of millions in classified US military equipment, and a 60-day weapons testing corridor that makes the alleged crash date one of the most significant in Cold War southern African history.
          </p>
        </FadeIn>
        <FadeIn delay={0.3}>
          <p style={{ color: "#9a968e", marginBottom: "1.5rem" }}>
            Over eleven volumes and thousands of pages of OSINT research, this investigation has traced every name, organisation, weapon system, and location mentioned in the original leaked dossier — expanding outward using a spiderweb methodology across declassified archives, diplomatic cables, defence procurement records, and intelligence disclosures in ten languages.
          </p>
        </FadeIn>
        <FadeIn delay={0.4}>
          <div style={{ borderLeft: "3px solid #d4a843", padding: "1.25rem 1.5rem", background: "rgba(212,168,67,0.04)", margin: "2rem 0" }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontStyle: "italic", color: "#e8e4dc", marginBottom: "0.5rem" }}>
              "The real story isn't about aliens — it's about the final desperate months of South Africa's nuclear weapons programme being monitored by both superpowers during one of history's most sensitive political transitions."
            </p>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "#5c5a55", letterSpacing: 2 }}>INVESTIGATION ASSESSMENT — VOLUME XI</span>
          </div>
        </FadeIn>

        {/* Classified doc block */}
        <FadeIn delay={0.5}>
          <div style={{ background: "#1a1a1f", border: "1px solid #2a2a30", borderLeft: "3px solid #c0392b", padding: "1.5rem 2rem", margin: "2rem 0", position: "relative", fontFamily: "'Special Elite', monospace", fontSize: "0.9rem", lineHeight: 1.8, color: "#9a968e" }}>
            <div style={{ position: "absolute", top: -12, left: 20, background: "#c0392b", color: "white", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.55rem", letterSpacing: 3, padding: "3px 10px" }}>CLASSIFIED — TOP SECRET</div>
            <div style={{ position: "absolute", top: 12, right: 16, color: "#c0392b", fontSize: "1.2rem", transform: "rotate(-12deg)", opacity: 0.35, fontWeight: 700, letterSpacing: 3, border: "2px solid #c0392b", padding: "3px 10px" }}>REDACTED</div>
            <p style={{ marginTop: "0.5rem" }}>"The true meaning of the designation is a MASER weapon... a high-energy beam of microwave activity directed at the object."</p>
            <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#5c5a55" }}>— Attributed to leaked SAAF document, circa 1989</p>
          </div>
        </FadeIn>
      </section>

      <div style={{ width: 60, height: 1, background: "#8b7030", margin: "0 auto" }} />

      {/* ═══ TIMELINE ═══ */}
      <section id="timeline" className="content-max" style={{ maxWidth: 900, margin: "0 auto", padding: "5rem 2rem" }}>
        <FadeIn>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: 5, color: "#8b7030", marginBottom: "1.5rem" }}>RECONSTRUCTED TIMELINE · 1975–2025</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", marginBottom: "1rem" }}>The Chronology</h2>
          <p style={{ color: "#9a968e", marginBottom: "2rem" }}>Every verified and alleged event, tiered by evidence quality. Filter by category.</p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "2rem" }}>
            {["all", "nuclear", "weapons", "crash", "intel", "docs", "context", "uap"].map(f => (
              <button key={f} onClick={() => setTimelineFilter(f)} style={{
                padding: "6px 14px", border: `1px solid ${timelineFilter === f ? "#d4a843" : "#2a2a30"}`,
                background: timelineFilter === f ? "rgba(212,168,67,0.1)" : "transparent",
                color: timelineFilter === f ? "#d4a843" : "#5c5a55", fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.6rem", letterSpacing: 1.5, cursor: "pointer", textTransform: "uppercase"
              }}>{f}</button>
            ))}
          </div>
        </FadeIn>
        <div style={{ position: "relative", paddingLeft: 40 }}>
          <div style={{ position: "absolute", left: 14, top: 0, bottom: 0, width: 1, background: "linear-gradient(180deg, transparent, #8b7030, #8b7030, transparent)" }} />
          {filteredTimeline.map((t, i) => (
            <FadeIn key={i} delay={Math.min(i * 0.05, 0.5)}>
              <div style={{ marginBottom: "2rem", position: "relative" }}>
                <div style={{ position: "absolute", left: -33, top: 5, width: 11, height: 11, borderRadius: "50%", border: `2px solid ${t.highlight ? "#c0392b" : "#d4a843"}`, background: t.highlight ? "#c0392b" : "#0a0a0c", zIndex: 2, animation: t.highlight ? "pulse 2s infinite" : "none" }} />
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: t.highlight ? "#c0392b" : "#d4a843", letterSpacing: 2, marginBottom: 4 }}>{t.year}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", marginBottom: 4, color: t.highlight ? "#e8e4dc" : "#e8e4dc", fontWeight: t.highlight ? 700 : 400 }}>{t.title}</div>
                <div style={{ color: "#9a968e", fontSize: "0.88rem", marginBottom: 6 }}>{t.desc}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <TierBadge tier={t.tier} /> <CatTag cat={t.cat} />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <div style={{ width: 60, height: 1, background: "#8b7030", margin: "0 auto" }} />

      {/* ═══ KEY DISCOVERIES ═══ */}
      <section id="discoveries" className="content-max" style={{ maxWidth: 1100, margin: "0 auto", padding: "5rem 2rem" }}>
        <FadeIn>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: 5, color: "#8b7030", marginBottom: "1.5rem" }}>12 KEY DISCOVERIES</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", marginBottom: "0.75rem" }}>What the Investigation Uncovered</h2>
          <p style={{ color: "#9a968e", marginBottom: "2.5rem" }}>New connections and findings not previously linked to the Kalahari narrative in any published analysis.</p>
        </FadeIn>
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
          {DISCOVERIES.map((d, i) => (
            <FadeIn key={i} delay={Math.min(i * 0.08, 0.6)}>
              <div className="card-hover" style={{ background: "#1a1a1f", padding: "1.5rem", minHeight: 200 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "1.8rem" }}>{d.icon}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.55rem", color: "#5c5a55", letterSpacing: 1 }}>VOL {d.vol}</span>
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", marginBottom: "0.5rem" }}>{d.title}</h3>
                <p style={{ color: "#9a968e", fontSize: "0.85rem", lineHeight: 1.6 }}>{d.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <div style={{ width: 60, height: 1, background: "#8b7030", margin: "0 auto" }} />

      {/* ═══ EVIDENCE MATRIX ═══ */}
      <section id="evidence" className="content-max" style={{ maxWidth: 800, margin: "0 auto", padding: "5rem 2rem" }}>
        <FadeIn>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: 5, color: "#8b7030", marginBottom: "1.5rem" }}>CONFIDENCE MATRIX — VOLUME XI</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", marginBottom: "0.75rem" }}>What We Believe — And How Much</h2>
          <p style={{ color: "#9a968e", marginBottom: "2.5rem" }}>Each proposition scored by evidence weight across all 11 volumes. Updated with every new finding.</p>
        </FadeIn>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {CONFIDENCE.map((c, i) => (
            <FadeIn key={i} delay={Math.min(i * 0.08, 0.5)}>
              <div style={{ background: "#1a1a1f", border: "1px solid #2a2a30", padding: "1.25rem 1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.9rem" }}>{c.claim}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", fontWeight: 700, color: c.color }}>{c.pct}%</span>
                </div>
                <div style={{ background: "#111114", borderRadius: 3, overflow: "hidden" }}>
                  <div className="conf-bar" style={{ width: `${c.pct}%`, background: `linear-gradient(90deg, ${c.color}88, ${c.color})` }} />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <div style={{ width: 60, height: 1, background: "#8b7030", margin: "0 auto" }} />

      {/* ═══ KEY ACTORS ═══ */}
      <section id="actors" className="content-max" style={{ maxWidth: 1000, margin: "0 auto", padding: "5rem 2rem" }}>
        <FadeIn>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: 5, color: "#8b7030", marginBottom: "1.5rem" }}>ACTOR NETWORK</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", marginBottom: "0.75rem" }}>The Key Players</h2>
          <p style={{ color: "#9a968e", marginBottom: "2.5rem" }}>Individuals and organisations connected to the investigation, traced through independent source networks.</p>
        </FadeIn>
        <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.25rem" }}>
          {ACTORS.map((a, i) => (
            <FadeIn key={i} delay={Math.min(i * 0.1, 0.5)}>
              <div className="card-hover" style={{ background: "#1a1a1f", padding: "1.5rem" }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", marginBottom: "0.25rem" }}>{a.name}</h3>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: 1.5, color: "#d4a843", marginBottom: "0.75rem" }}>{a.role}</div>
                <p style={{ color: "#9a968e", fontSize: "0.85rem", lineHeight: 1.6 }}>{a.detail}</p>
              </div>
            </FadeIn>
          ))}
        </div>
        {/* Connection Map Summary */}
        <FadeIn delay={0.3}>
          <div style={{ marginTop: "2.5rem", background: "#1a1a1f", border: "1px solid #2a2a30", borderLeft: "3px solid #d4a843", padding: "1.5rem 2rem" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", marginBottom: "0.75rem" }}>Central Node: Armscor</h3>
            <p style={{ color: "#9a968e", fontSize: "0.88rem", lineHeight: 1.7 }}>
              Armscor is the single entity connecting every verified element: Vastrap nuclear site ↔ Overberg missile range ↔ Nuclear weapons programme ↔ Atlas Cheetah (Israeli tech) ↔ SAA covert logistics (Helderberg) ↔ ISC/CIA pipeline (US→Israel→SA) ↔ Denel restructure 1992 (records destroyed).
            </p>
            <p style={{ color: "#9a968e", fontSize: "0.88rem", lineHeight: 1.7, marginTop: "0.5rem" }}>
              <strong style={{ color: "#e8e4dc" }}>Secondary chains:</strong> Israel (IAI/Palmachim) → Overberg → RSA-3 (July 1989) | Los Alamos (BEAR) → DEW → Col. John B. Alexander → Azadehdel | SAS Tafelberg → Exercise Magersfontein → Scrapped 1993 | Hind → Debunked Kalahari → Validated Ariel School → Entity descriptions match.
            </p>
          </div>
        </FadeIn>
      </section>

      <div style={{ width: 60, height: 1, background: "#8b7030", margin: "0 auto" }} />

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="content-max" style={{ maxWidth: 800, margin: "0 auto", padding: "5rem 2rem" }}>
        <FadeIn>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: 5, color: "#8b7030", marginBottom: "1.5rem" }}>FREQUENTLY ASKED</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", marginBottom: "2rem" }}>Questions & Answers</h2>
        </FadeIn>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {FAQS.map((f, i) => (
            <FadeIn key={i} delay={Math.min(i * 0.08, 0.4)}>
              <div>
                <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span style={{ fontFamily: "'Playfair Display', serif" }}>{f.q}</span>
                  <span style={{ color: "#d4a843", fontSize: "1.2rem", transition: "transform 0.3s", transform: openFaq === i ? "rotate(45deg)" : "rotate(0)" }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ background: "#111114", border: "1px solid #2a2a30", borderTop: "none", padding: "1.25rem 1.5rem", color: "#9a968e", fontSize: "0.92rem", lineHeight: 1.7 }}>
                    {f.a}
                  </div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <div style={{ width: 60, height: 1, background: "#8b7030", margin: "0 auto" }} />

      {/* ═══ FINAL CTA ═══ */}
      <section style={{ padding: "5rem 2rem", textAlign: "center" }}>
        <FadeIn>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", letterSpacing: 5, color: "#c0392b", marginBottom: "1.5rem" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#c0392b", animation: "pulse 2s infinite", marginRight: 8, verticalAlign: "middle" }} />
            FILE STATUS: OPEN
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 900, maxWidth: 600, margin: "0 auto 1rem" }}>
            The File Remains <span style={{ color: "#d4a843", fontStyle: "italic" }}>Open</span>
          </h2>
          <p style={{ color: "#9a968e", maxWidth: 550, margin: "0 auto 2rem", fontSize: "1rem" }}>
            Whether what fell from the sky was a spacecraft, a missile, or a well-crafted story — the world it fell into was genuinely strange enough to make any of those possibilities real.
          </p>
          <button onClick={() => setShowModal(true)} style={{ padding: "14px 36px", border: "1px solid #d4a843", color: "#d4a843", background: "none", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", letterSpacing: 2, cursor: "pointer", transition: "all 0.3s" }}
            onMouseEnter={e => { e.target.style.background = "#d4a843"; e.target.style.color = "#0a0a0c"; }}
            onMouseLeave={e => { e.target.style.background = "none"; e.target.style.color = "#d4a843"; }}>
            VIEW METHODOLOGY
          </button>
        </FadeIn>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ background: "#111114", borderTop: "1px solid #2a2a30", padding: "3rem 2rem", textAlign: "center" }}>
        <div style={{ fontFamily: "'Special Elite', monospace", fontSize: "0.75rem", letterSpacing: 4, color: "#8b7030", marginBottom: "1rem" }}>KALAHARI — THE UNTOLD FILE</div>
        <p style={{ color: "#5c5a55", fontSize: "0.8rem", maxWidth: 550, margin: "0 auto" }}>
          An investigative multimedia project. All verified claims sourced from declassified archives, published investigations, and open-source intelligence across 11 volumes.
        </p>
        <p style={{ marginTop: "1rem", fontSize: "0.65rem", color: "#3a3a3e" }}>© 2026. For research and documentary purposes. Tiered evidence system applied throughout.</p>
      </footer>

      {/* ═══ METHODOLOGY MODAL ═══ */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#1a1a1f", border: "1px solid #2a2a30", maxWidth: 600, width: "90%", maxHeight: "80vh", overflow: "auto", padding: "2.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem" }}>Investigation Methodology</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#9a968e", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
            </div>
            <div style={{ color: "#9a968e", fontSize: "0.9rem", lineHeight: 1.8 }}>
              <p><strong style={{ color: "#d4a843" }}>Spiderweb Methodology:</strong> Entity extraction from core incident, then systematic expansion across names, organisations, weapon systems, locations, and documents through independent source networks.</p>
              <p style={{ marginTop: "1rem" }}><strong style={{ color: "#d4a843" }}>Multi-Vector Search:</strong> Simultaneous sweeps across military history, naval records, weapons testing archives, intelligence disclosures, and UFO research archives in 10 languages (English, French, Russian, Hebrew, Portuguese, Spanish, German, Dutch, Afrikaans, Chinese).</p>
              <p style={{ marginTop: "1rem" }}><strong style={{ color: "#d4a843" }}>Tiered Evidence:</strong> All findings annotated with credibility tier and confidence percentage, updated each volume. Tier 1 = Primary/Documentary. Tier 2 = Corroborated. Tier 3 = Testimony/Unverified.</p>
              <p style={{ marginTop: "1rem" }}><strong style={{ color: "#d4a843" }}>Deliberate Ambiguity:</strong> Verified Cold War history presented alongside unresolved anomalous claims. The investigation does not resolve — it maps the evidence landscape and lets the reader decide.</p>
              <p style={{ marginTop: "1rem" }}><strong style={{ color: "#d4a843" }}>Sources:</strong> CIA FOIA, NSA archives, UK National Archives, SANDF records, Wilson Center Digital Archive, National Security Archive (GWU), diplomatic cables, defence procurement records, academic research, UFO Afrinews, Quest International archives, and open-source intelligence collections.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
