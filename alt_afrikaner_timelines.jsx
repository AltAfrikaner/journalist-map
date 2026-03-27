import { useState, useRef, useEffect } from "react";

const NAVY = "#0a1628";
const DARK = "#0d1b2a";
const CARD_BG = "#132238";
const GOLD = "#d4a843";
const RED = "#c0392b";
const BLUE = "#2980b9";
const PURPLE = "#8e44ad";
const GREEN = "#27ae60";
const TEAL = "#1abc9c";
const ORANGE = "#e67e22";
const TEXT = "#e8e8e8";
const MUTED = "#8899aa";
const WHITE = "#ffffff";

// ===== TIMELINE A: OSF-SOUTH AFRICA =====
const osfData = {
  title: "The Architecture of Influence",
  subtitle: "Open Society Foundations in South Africa: 1979 to 2026",
  branches: {
    personnel: { color: PURPLE, label: "Personnel Pipeline" },
    funding: { color: GOLD, label: "Funding Pipeline" },
    media: { color: BLUE, label: "Media Pipeline" },
    legal: { color: RED, label: "Legal / Advocacy Pipeline" },
  },
  events: [
    { year: 1979, branch: "funding", title: "First Dollar", desc: "George Soros funds anti-apartheid scholarships at the University of Cape Town. His first philanthropic investment anywhere in the world. The same university would later house Herman Wasserman's Centre for Film and Media Studies." },
    { year: 1984, branch: "legal", title: "NED Created", desc: "National Endowment for Democracy founded. Would eventually fund The Continent via M&G's Adamela Trust, specifying editorial content. CIA documents later name NED as a South African public diplomacy tool." },
    { year: 1993, branch: "funding", title: "OSF-SA Opens", desc: "Open Society Foundation for South Africa established. Aryeh Neier, co-founder of Human Rights Watch, serves as OSF President. Over the next 25 years, OSF-SA invests over R1 billion across 750+ grantees." },
    { year: 1997, branch: "funding", title: "OSISA Established", desc: "Open Society Initiative for Southern Africa launched. Covers 11 countries: Angola, Botswana, DRC, Lesotho, Madagascar, Malawi, Mozambique, Namibia, Swaziland, Zambia, Zimbabwe. Distributes $5 million annually from Braamfontein, Johannesburg." },
    { year: 2001, branch: "legal", title: "Durban Conference", desc: "World Conference Against Racism. OSF-funded organisations participate in building the anti-apartheid-to-BDS pipeline. ARO Palestine documents show OSF funding Palestinian rights advocacy, challenging Israel as a 'Jewish nation state.'" },
    { year: 2004, branch: "personnel", title: "Nowrojee Founds OSIEA", desc: "Binaifer Nowrojee establishes the Open Society Initiative for Eastern Africa. Budget: $12.9 million annually. The operational files from her tenure document the exact machinery now running the global OSF operation." },
    { year: 2004, branch: "personnel", title: "Gaspard at SEIU/WFP", desc: "Patrick Gaspard serves as political director of SEIU and executive director of the Working Families Party. Building the political network he would later carry into the ambassadorship and OSF presidency." },
    { year: 2008, branch: "funding", title: "FPOS Created / $150M Shift", desc: "Foundation to Promote Open Society established. Internal documents reveal a $150 million budget bifurcation between New York and Zug, Switzerland, structured for lobbying compliance. The financial architecture that enables global operations." },
    { year: 2009, branch: "media", title: "Journalism Convening", desc: "OSF's 'Response to Crisis in Journalism' strategy. Internal documents state OSF should 'support tools and methods to monitor bias, factual inaccuracies, or cultural misrepresentation in international reporting.' ProPublica, NPR, and Frontline attend. Africa Check, founded three years later, is the operational implementation." },
    { year: 2009, branch: "funding", title: "Seize the Day Fund", desc: "$18 million emergency fund deployed in the Obama transition window. Documents describe exploiting a 'transformative moment' for policy influence across multiple continents simultaneously." },
    { year: 2012, branch: "media", title: "Africa Check Founded", desc: "Peter Cunliffe-Jones establishes Africa Check at Wits University. Funded: OSF 12%, Luminate/Omidyar 8%, Gates 13%, Google, Meta. Housed at the same institution receiving OSF grants. Partners News24 and Daily Maverick. Cited by CNN, PBS, Snopes, BBC, Al Jazeera, Wikipedia. The chokepoint." },
    { year: 2012, branch: "funding", title: "OSF-World Bank Partnership", desc: "Chris Stone meets Jim Kim. OSF secures observer status at World Bank's Global Partnership for Social Accountability. $3 million committed in parallel funding. Internal documents discuss 'land grabs' and 'land tenure' as collaboration areas." },
    { year: 2013, branch: "personnel", title: "Gaspard to Pretoria", desc: "Patrick Gaspard appointed US Ambassador to South Africa by Obama. The same embassy that administers $25-50 million in annual USAID funding and hosts 28 entities with 318 US positions. He carries the entire Washington network into the diplomatic posting." },
    { year: 2013, branch: "legal", title: "Elections Strategy", desc: "OSF's 'Overview of Open Society Engagement on Elections' document. Details operations across Africa: voter registration campaigns, EU coordination, Election Observation Missions, advocacy targeting US State Department. The documented playbook for democratic influence." },
    { year: 2013, branch: "personnel", title: "Fatima Hassan at OSF-SA", desc: "Hassan becomes OSF-SA Executive Director (2013-2019). Bridge from AIDS Law Project and Treatment Action Campaign into OSF. Later founds Health Justice Initiative. The personnel pipeline from health activism to foundation leadership to post-OSF advocacy." },
    { year: 2014, branch: "funding", title: "Stellenbosch Grant Confirmed", desc: "DCLeaks documents confirm $1 million OSF grant to Stellenbosch University. The leaked document trail that confirms what public records could not." },
    { year: 2014, branch: "legal", title: "OSIFE Elections Operation", desc: "$6.16 million, 90 grantees deployed across European elections to 'mitigate populist surge.' The documented methodology for countering populist-national movements. Documented in leaked internal strategy papers." },
    { year: 2016, branch: "media", title: "DCLeaks Dump", desc: "2,576 internal OSF documents (2008-2016) published. Africa folder contains operational budgets, grant dockets, board minutes, personnel files, elections strategy, and the $150 million funding shift documentation. The raw institutional architecture, in their own words." },
    { year: 2017, branch: "media", title: "M&G Acquired via MDIF", desc: "Media Development Investment Fund acquires majority stake in Mail & Guardian. MDIF: New York-based. NED funds The Continent through M&G's Adamela Trust. $355,200 grant specifying editorial content. Simon Allison revolving door: DM to M&G to ISS to The Continent." },
    { year: 2017, branch: "media", title: "Daily Maverick Architecture", desc: "Daily Maverick hosts amaBhungane (OSF grantee), publishes ISS Africa content (exclusive SA republication rights, $5.1M OSF), launches Declassified UK as sub-site. Andrew Feinstein (OSF fellowship) on Declassified UK board. The convergence hub where all funded streams meet." },
    { year: 2018, branch: "personnel", title: "Gaspard Becomes OSF President", desc: "Direct transfer: US Ambassador to South Africa to President of $25 billion foundation. Carries diplomatic knowledge, intelligence relationships, and the entire South African network into the world's largest private funder of civil society." },
    { year: 2019, branch: "media", title: "Cunliffe-Jones to IFCN/Poynter", desc: "Africa Check founder leaves for IFCN Senior Adviser at Poynter Institute, then TikTok Trust & Safety Council. Carries the methodology from a Wits-housed, OSF-funded fact-checker to the global standard-setting body for content moderation." },
    { year: 2020, branch: "media", title: "Meta Fact-Checking Expansion", desc: "Africa Check becomes Meta's primary third-party fact-checker for Southern Africa. The six-stage suppression mechanism activates: Africa Check rating triggers algorithmic suppression, warning labels, account throttling, AI-automated extension to similar posts. OSF's 2009 strategy document, implemented at continental scale." },
    { year: 2021, branch: "funding", title: "OSF Restructuring", desc: "40% staff cut. Regional foundations (OSISA, OSIWA, OSIEA) merged into single global structure. Nowrojee drives the restructuring as VP for Organizational Transformation. The Eastern Africa playbook becomes the centralised global template." },
    { year: 2023, branch: "personnel", title: "Nowrojee Becomes OSF President", desc: "The woman who built the Eastern Africa machinery now runs the entire $25+ billion operation. HRW to OSIEA founder to Asia Pacific director to VP Transformation to President. Every OSF president since Neier came through either Human Rights Watch or government service." },
    { year: 2025, branch: "media", title: "$8M USAID Cooperative Scrubbed", desc: "$8 million USAID South African investigative journalism cooperative. Recipient information scrubbed from public records in February 2025. The grant existed. The recipients are now invisible." },
    { year: 2025, branch: "funding", title: "IDRC R20M to Wasserman", desc: "Canadian government research arm grants R20 million to Herman Wasserman for 'disinformation' scoping study, following R4.5 million in 2021. The academic who defines 'disinformation' for the continent, funded by the network whose definitions he operationalises." },
    { year: 2026, branch: "legal", title: "Kagoro Expelled from Kenya", desc: "OSF-linked civil society figure expelled. The operational footprint documented in the OSIEA files, built by Nowrojee two decades earlier, now generating blowback in the same region." },
    { year: 2026, branch: "funding", title: "$340-350M Africa Programme", desc: "OSF's consolidated Africa programme under Nowrojee's presidency. Three decades of institutional construction, from UCT scholarships to a $350 million continental operation. From one university to the entire continent." },
  ],
};

// ===== TIMELINE B: CUBA-SA MONEY TRAIL =====
const cubaData = {
  title: "The Arithmetic of Solidarity",
  subtitle: "What South Africa Borrowed and What Cuba Received: 2012 to 2025",
  tracks: {
    borrowing: { color: RED, label: "International Borrowing (Money In)" },
    cuba: { color: GOLD, label: "Cuba Transfers (Money Out)" },
  },
  events: [
    { year: "2012", track: "cuba", title: "R350M EAP Signed", amount: "R350M", desc: "Economic Assistance Package signed with Cuba. Grants, solidarity payments, and credit facilities. IDC manages Cuba's SA goods procurement. Full scale revealed only through court proceedings years later." },
    { year: "2015", track: "cuba", title: "Operation Thusano Begins", amount: "R252M/yr", desc: "767 Cuban military mechanics deployed to SANDF. No procurement procedures followed. Cost: 2.8x local alternatives. Every rand declared irregular by the Auditor-General. Cumulative: R1.7 billion." },
    { year: "2018", track: "cuba", title: "First Cuba Loan Tranche", amount: "R63M", desc: "First tranche of direct sovereign lending to Cuba. R147 million total across subsequent tranches. No plans to write off." },
    { year: "Apr 2020", track: "cuba", title: "Cuban COVID Brigade Arrives", amount: "R440M", desc: "Cuban medical brigade deployed three months before IMF disbursement. R239 million in salaries. Each Cuban doctor earns R858,000-R1.58M while ~700 SA medical graduates cannot find placement." },
    { year: "Jul 2020", track: "borrowing", title: "IMF Emergency Loan", amount: "$4.3B", desc: "Largest single COVID disbursement to any country. Enters National Revenue Fund. Not ring-fenced. Finance Minister Mboweni confirms fungibility. IMF requires transparent reporting and fiscal consolidation." },
    { year: "Jul 2020", track: "borrowing", title: "NDB + AfDB Loans", amount: "$1.29B", desc: "New Development Bank: $1 billion. African Development Bank: $288 million. Total July 2020 emergency borrowing: $5.6 billion in a single month." },
    { year: "2020", track: "cuba", title: "Heberon Scandal", amount: "R229M", desc: "SANDF imports 970,695 vials of unregistered Cuban interferon. Never cleared by SAHPRA. Military Health Service chief wrote memo stating they did not want it. Only 15 of 970,685 vials used. $2M paid, not refunded. Remainder returned to Cuba." },
    { year: "May 2021", track: "cuba", title: "Second Medical Contingent", amount: "R83M/yr", desc: "Renewed Cuban medical deployment at R83 million per year. Running concurrently with R65 million water engineering deployment. Solidarity submits list of 120 unemployed qualified SA engineers." },
    { year: "2021", track: "cuba", title: "Direct Loan to Cuba", amount: "R84.6M", desc: "Government confirms R84.6 million loan to Cuba. No plans to write off. Parliament informed. SA debt-to-GDP passing 80%." },
    { year: "Jan 2022", track: "borrowing", title: "World Bank Loan I", amount: "$750M", desc: "World Bank approves $750 million. For pandemic recovery and fiscal consolidation." },
    { year: "Feb 2022", track: "cuba", title: "Food Donation Announced", amount: "R50M*", desc: "Deputy Minister Botes announces R50 million humanitarian aid to Cuba. Court proceedings reveal it is the first tranche of R350 million. Seven times the stated amount. Minister Pandor expresses 'puzzlement' at 'anti-Cuban sentiment.'" },
    { year: "May 2022", track: "cuba", title: "AG Declares All Irregular", amount: "R1.7B+", desc: "Auditor-General declares every cent of Operation Thusano spending irregular. DA reveals R1.4 billion total. No procurement procedures. No deviations obtained. Constitution violated." },
    { year: "Jun 2022", track: "borrowing", title: "World Bank Loan II", amount: "$480M", desc: "World Bank approves additional $480 million for vaccines. Total documented international borrowing in the COVID window: $6.3 billion." },
    { year: "2025", track: "cuba", title: "Project Kgala Continues", amount: "Ongoing", desc: "Operation Thusano rebranded as Project Kgala after scrutiny. Parliamentary committee calls for termination. 28% vocational pass rate at 136% higher cost than local alternatives. TIA-BioCubaFarma Framework Agreement connects Pelindaba to Cuban pharma network." },
  ],
  totals: {
    borrowed: "$6.3 billion",
    transferred: "R3.5-4 billion (~$200-250M)",
    debtGDP: "80%+",
    unemployment: "32.5%",
    belowPoverty: "30.4 million South Africans",
  },
};

// ===== TIMELINE C: DEFENCE TECHNOLOGY =====
const defenceData = {
  title: "From Centurion to Kyiv",
  subtitle: "Four Decades of South African Technology Extraction: 1984 to 2026",
  branches: {
    israel: { color: BLUE, label: "Israel Extraction" },
    china: { color: RED, label: "China Extraction" },
    iran: { color: ORANGE, label: "Iran Pipeline" },
    commercial: { color: GREEN, label: "Commercial Succession" },
    mtn: { color: PURPLE, label: "MTN / Project Snooker" },
  },
  events: [
    { year: "1984-89", branch: "israel", title: "ARD-10 Developed", desc: "Kentron (now Denel Dynamics) develops ARD-10 loitering attack drone for SADF under international sanctions. Border Wars end. Never enters SA service. Designs sold to Israel Aerospace Industries. IAI develops IAI Harpy (first tested 1989)." },
    { year: "1993", branch: "commercial", title: "Rooivalk First Flight", desc: "South Africa's indigenous attack helicopter achieves operational status. Mokopa missile system developed for air-launch from Rooivalk. Designed entirely by Afrikaner engineers under sanctions." },
    { year: "1998", branch: "commercial", title: "PBMR Programme Launches", desc: "Pebble Bed Modular Reactor programme begins. Generates 100+ patents. Employs 1,300+ personnel. R9.244 billion invested. The most advanced small modular nuclear reactor programme in the world at the time." },
    { year: "1999", branch: "israel", title: "Arms Deal Penetration", desc: "R70 billion+ Strategic Defence Procurement Package. SSA later confirms foreign intelligence played 'active role' in influencing the outcome. BAE Systems pays GBP 115 million in covert commissions through agent networks. Only 2 convictions in 25 years." },
    { year: "Apr 2002", branch: "israel", title: "Rooivalk Blueprints Stolen", desc: "Intruders breach Denel facility at Kempton Park. Rooivalk helicopter blueprints stolen. Department head Johan Holdt confirms intruders had inside knowledge. Resigns within weeks. The theft that started the cascade." },
    { year: "2003-04", branch: "mtn", title: "MTN Eyes Iran", desc: "Iran advertises mobile licence. Turkcell wins tender (February 2004). MTN CEO Nhleko and Defence Minister Lekota visit Iran (August 2004). 'The Fish' MOU signed: MTN promises Rooivalk helicopters, G5 howitzers, frequency-hopping radios, sniper rifles, armoured vehicles, radar, and pilot heads-up display technology to Iran's Ministry of Defence." },
    { year: "2004-05", branch: "iran", title: "ARD-10 Reaches Iran", desc: "Designs sold to Iran Aviation Industries Organization (IAIO). Denel Seeker designs also transferred. The South African drone architecture, built by Afrikaner engineers under sanctions, enters the Iranian military-industrial complex." },
    { year: "Sep 2005", branch: "mtn", title: "Project Snooker Memo", desc: "MTN CEO Nhleko delivers confidential memo. 'Project Snooker' sets ground rules for delivering defence and nuclear support promises. MTN executive Irene Charnley faxes Denel CEO to facilitate IHSRC meeting. MTN prevails upon SA to abstain from three IAEA votes on Iran's nuclear programme." },
    { year: "Nov 2005", branch: "mtn", title: "MTN Wins Iran Licence", desc: "MTN awarded Iran licence, displacing Turkcell. 49% stake in MTN Irancell. Iranian 51% held by IEDC/Sairan (Ministry of Defence subsidiary) and Bonyad Mostazafan (Supreme Leader's holding company, 350+ subsidiaries). Codename bribes: 'Long John' $400K, 'Short John' $200K." },
    { year: "Mar 2007", branch: "mtn", title: "Iranian Demands Escalate", desc: "Chris Kilowan memo: Iran's Supreme Leader dispatches Ali Larijani to remind Mbeki of 'defence-related promises.' Foreign Minister Mottaki sent by Ahmadinejad for 'direct answer' on arms promises." },
    { year: "Nov 2007", branch: "china", title: "Pelindaba Breach", desc: "Two armed teams breach South Africa's nuclear research facility. Employee shot. Nothing officially declared stolen. SSA later attributes to Chinese intelligence (Chinergy connection). Abdul Minty dismisses it as 'burglary attempt.' Within years, China begins constructing an identical reactor." },
    { year: "2008", branch: "iran", title: "Ababil-3 Enters Service", desc: "Iranian Ababil-3 drone enters service. Atlantic Council and iNEWS describe design as similar to Denel Seeker UAV. The South African drone lineage, now in Iranian military service." },
    { year: "2008-09", branch: "israel", title: "Mokopa Plans to Israel", desc: "Denel technician Danie Steenkamp steals Mokopa missile plans. Flies to Israel with businessman Anthony Viljoen. Third conspirator Johan Grundling later shoots himself during SARS raid (March 2010). Mossad cable (August 2010) confirms possession, offers conditional return." },
    { year: "2010", branch: "commercial", title: "PBMR Defunded", desc: "South Africa defunds the PBMR programme. 75% of staff dismissed. R9.244 billion spent. The intellectual property and the engineers scatter to foreign programmes. The most consequential brain drain in South African scientific history." },
    { year: "Dec 2012", branch: "china", title: "China Begins HTR-PM", desc: "China begins construction of HTR-PM at Shidao Bay, Shandong. Design based on the same pebble bed technology developed at Pelindaba. Tsinghua University's INET programme, seeded with knowledge from the South African programme." },
    { year: "2012", branch: "israel", title: "Mokopa Trial / Cover-Up", desc: "Steenkamp sentenced to 5 years. Viljoen: state witness, suspended sentence. No Israeli involvement mentioned at trial. The intelligence dimension sealed. Mossad's role, confirmed in the Spy Cables, never enters the courtroom." },
    { year: "Feb 2015", branch: "israel", title: "Spy Cables Published", desc: "Al Jazeera and The Guardian publish the Spy Cables. The entire pattern of Israeli intelligence extraction from South African defence programmes documented in official correspondence. The Mokopa affair, Mossad operations, and the arms deal intelligence penetration exposed." },
    { year: "2015", branch: "iran", title: "Denel Seeker II in Yemen", desc: "UAE-operated Denel Seeker II shot down in Yemen by Iranian-backed Houthis. South African drone technology, sold to UAE, shot down by forces armed by Iran with technology also derived from South African designs. Full circle." },
    { year: "2016-21", branch: "commercial", title: "Denel State Capture", desc: "Gupta-linked VR Laser deal. R3 billion in lost revenue. Staff unpaid for months. The company that built the Rooivalk, the Mokopa, and the Seeker hollowed out by corruption. By 2026, Denel nearly misses salary payments." },
    { year: "Sep 2019", branch: "iran", title: "Saudi Aramco Attacks", desc: "Shahed drones used in devastating Saudi Aramco attacks. The drone lineage: South African ARD-10 to Israeli IAI Harpy to Iranian IAIO to Shahed Aviation Industries. Afrikaner engineering, repackaged through three countries, strikes the world's largest oil facility." },
    { year: "Sep 2021", branch: "china", title: "HTR-PM First Criticality", desc: "Chinese pebble bed reactor achieves first criticality. The technology developed at Pelindaba, lost in the 2007 breach, now operational in Shandong Province." },
    { year: "2021", branch: "israel", title: "ALTI Acquired by Israel", desc: "Israeli Avnon Group's iSTAR acquires ALTI (Knysna, South Africa) for $7.75 million. 1,000+ drones shipped to 13 countries. CEO announces production moving to co-production centre in Israel. Happening in parallel with SA's ICJ case against Israel." },
    { year: "Oct 2022", branch: "iran", title: "Russia Deploys Shahed", desc: "Russia begins mass deployment of Shahed/Geran drones against Ukraine. 6,000-unit annual production at Alabuga Special Economic Zone. The full chain: Afrikaner engineers build ARD-10 under sanctions. Israel buys designs. Iran receives them. Shahed Aviation mass-produces. Russia rebrands as Geran-2. Ukrainian civilians die." },
    { year: "Dec 2023", branch: "china", title: "HTR-PM Commercial", desc: "China's pebble bed reactor enters commercial operation. March 2024: heating grid connected, 1,850 Chinese households heated by technology developed at Pelindaba by South African nuclear scientists." },
    { year: "Apr 2025", branch: "mtn", title: "Turkcell Case Greenlit", desc: "SA Supreme Court of Appeal greenlights Turkcell's $4.2 billion bribery case against MTN. If heard on merits: potentially the most explosive corporate trial in South African history. MTN appeals to Constitutional Court." },
    { year: "Aug 2025", branch: "mtn", title: "US DOJ Grand Jury", desc: "US Department of Justice grand jury investigation into MTN disclosed. Zobay v MTN: families of 500+ American soldiers allege MTN funnelled billions to IRGC through Irancell." },
    { year: "Jan 2026", branch: "iran", title: "IRGC Runs Irancell", desc: "IRGC commander Mohammed Hossein Soleimaniyan installed as MTN Irancell CEO after previous CEO dismissed. Arya Hamrah shell company ensures regime backdoor to all subscriber data. MTN's 49%-owned subsidiary now run by the Revolutionary Guard." },
    { year: "Mar 2026", branch: "commercial", title: "X-energy IPO Filed", desc: "X-energy files for $300 million IPO on Nasdaq (19 March 2026). Chief Scientist: Dr Eben Mulder, former PBMR. VP Reactor Development: Dr Martin van Staden, former PBMR. South African taxpayers spent R9.2 billion. American investors will profit. The engineers who built it at Pelindaba now commercialise it in the United States." },
  ],
};

// ===== COMPONENTS =====

function BranchLegend({ branches }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "28px", padding: "16px 20px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
      {Object.entries(branches).map(([key, { color, label }]) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}55` }} />
          <span style={{ fontSize: "12px", color: MUTED, fontFamily: "'Georgia', serif", letterSpacing: "0.5px" }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function TimelineEvent({ event, branches, index, isStacked }) {
  const [expanded, setExpanded] = useState(false);
  const branchInfo = branches[event.branch || event.track];
  const color = branchInfo?.color || GOLD;

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        position: "relative",
        paddingLeft: isStacked ? "0" : "44px",
        marginBottom: "4px",
        cursor: "pointer",
        transition: "all 0.3s ease",
      }}
    >
      {!isStacked && (
        <div style={{
          position: "absolute", left: "14px", top: "0", bottom: "-4px",
          width: "2px", background: `linear-gradient(180deg, ${color}44, ${color}11)`,
        }} />
      )}
      {!isStacked && (
        <div style={{
          position: "absolute", left: "8px", top: "18px",
          width: "14px", height: "14px", borderRadius: "50%",
          background: expanded ? color : DARK,
          border: `2px solid ${color}`,
          boxShadow: expanded ? `0 0 12px ${color}66` : "none",
          transition: "all 0.3s ease", zIndex: 2,
        }} />
      )}
      <div style={{
        background: expanded ? `${color}11` : "rgba(255,255,255,0.02)",
        border: `1px solid ${expanded ? color + "44" : "rgba(255,255,255,0.05)"}`,
        borderRadius: "8px", padding: "16px 20px",
        transition: "all 0.3s ease",
        borderLeft: isStacked ? `3px solid ${color}` : undefined,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{
            fontSize: "11px", fontWeight: 700, color: color,
            background: `${color}18`, padding: "2px 10px", borderRadius: "4px",
            fontFamily: "'Arial', sans-serif", letterSpacing: "1px",
          }}>
            {event.year}
          </span>
          {event.amount && (
            <span style={{
              fontSize: "13px", fontWeight: 700, color: WHITE,
              fontFamily: "'Georgia', serif",
            }}>
              {event.amount}
            </span>
          )}
          <span style={{
            fontSize: "14px", fontWeight: 600, color: WHITE,
            fontFamily: "'Georgia', serif",
          }}>
            {event.title}
          </span>
          <span style={{ marginLeft: "auto", fontSize: "10px", color: MUTED }}>{expanded ? "▲" : "▼"}</span>
        </div>
        {expanded && (
          <p style={{
            marginTop: "12px", fontSize: "13px", lineHeight: "1.75",
            color: TEXT, fontFamily: "'Georgia', serif",
            borderTop: `1px solid ${color}22`, paddingTop: "12px",
          }}>
            {event.desc}
          </p>
        )}
      </div>
    </div>
  );
}

function StackedTimeline({ data }) {
  const borrowingEvents = data.events.filter(e => e.track === "borrowing");
  const cubaEvents = data.events.filter(e => e.track === "cuba");

  return (
    <div>
      <BranchLegend branches={data.tracks} />

      {/* Totals Bar */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "12px", marginBottom: "28px", padding: "20px",
        background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.2)",
        borderRadius: "8px",
      }}>
        {Object.entries(data.totals).map(([key, val]) => (
          <div key={key} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: 700, color: key === "borrowed" ? RED : GOLD, fontFamily: "'Georgia', serif" }}>{val}</div>
            <div style={{ fontSize: "10px", color: MUTED, marginTop: "4px", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'Arial', sans-serif" }}>
              {key === "borrowed" ? "Total Borrowed" : key === "transferred" ? "To Cuba" : key === "debtGDP" ? "Debt-to-GDP" : key === "unemployment" ? "Unemployment" : "Below Poverty"}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "16px", fontFamily: "'Arial', sans-serif" }}>
            Money In: International Borrowing
          </div>
          {borrowingEvents.map((e, i) => (
            <TimelineEvent key={i} event={e} branches={data.tracks} index={i} isStacked />
          ))}
        </div>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "16px", fontFamily: "'Arial', sans-serif" }}>
            Money Out: Cuba Transfers
          </div>
          {cubaEvents.map((e, i) => (
            <TimelineEvent key={i} event={e} branches={data.tracks} index={i} isStacked />
          ))}
        </div>
      </div>

      <div style={{
        marginTop: "28px", padding: "20px",
        background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.15)",
        borderRadius: "8px", fontFamily: "'Georgia', serif",
        fontSize: "13px", lineHeight: "1.8", color: TEXT, fontStyle: "italic",
      }}>
        Thomas Sowell observed that it is hard to imagine a more stupid or more dangerous way of making decisions than by putting those decisions in the hands of people who pay no price for being wrong. The decision-makers who approved concurrent international borrowing and Cuba transfers will not personally service the debt.
      </div>
    </div>
  );
}

function BranchingTimeline({ data }) {
  const [filterBranch, setFilterBranch] = useState("all");
  const events = filterBranch === "all" ? data.events : data.events.filter(e => e.branch === filterBranch);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
        <button
          onClick={() => setFilterBranch("all")}
          style={{
            padding: "6px 16px", borderRadius: "4px", border: "1px solid",
            borderColor: filterBranch === "all" ? GOLD : "rgba(255,255,255,0.1)",
            background: filterBranch === "all" ? `${GOLD}22` : "transparent",
            color: filterBranch === "all" ? GOLD : MUTED,
            cursor: "pointer", fontSize: "11px", fontWeight: 600,
            fontFamily: "'Arial', sans-serif", letterSpacing: "1px", textTransform: "uppercase",
          }}
        >
          All Pipelines
        </button>
        {Object.entries(data.branches).map(([key, { color, label }]) => (
          <button
            key={key}
            onClick={() => setFilterBranch(key)}
            style={{
              padding: "6px 16px", borderRadius: "4px", border: "1px solid",
              borderColor: filterBranch === key ? color : "rgba(255,255,255,0.1)",
              background: filterBranch === key ? `${color}22` : "transparent",
              color: filterBranch === key ? color : MUTED,
              cursor: "pointer", fontSize: "11px", fontWeight: 600,
              fontFamily: "'Arial', sans-serif", letterSpacing: "1px",
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <BranchLegend branches={data.branches} />
      <div>
        {events.map((e, i) => (
          <TimelineEvent key={`${e.year}-${e.title}`} event={e} branches={data.branches} index={i} />
        ))}
      </div>
    </div>
  );
}

// ===== MAIN APP =====
export default function App() {
  const [activeTab, setActiveTab] = useState("osf");

  const tabs = [
    { id: "osf", label: "OSF-South Africa", subtitle: "1979 - 2026", color: GOLD },
    { id: "cuba", label: "Cuba Money Trail", subtitle: "2012 - 2025", color: RED },
    { id: "defence", label: "Technology Theft", subtitle: "1984 - 2026", color: BLUE },
  ];

  const activeData = activeTab === "osf" ? osfData : activeTab === "cuba" ? cubaData : defenceData;

  return (
    <div style={{
      minHeight: "100vh", background: NAVY, color: TEXT,
      fontFamily: "'Georgia', serif",
    }}>
      {/* Header */}
      <div style={{
        padding: "32px 24px 20px",
        background: `linear-gradient(180deg, ${DARK} 0%, ${NAVY} 100%)`,
        borderBottom: `1px solid ${GOLD}33`,
      }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "8px" }}>
            <span style={{
              fontSize: "10px", fontWeight: 700, color: GOLD, letterSpacing: "3px",
              textTransform: "uppercase", fontFamily: "'Arial', sans-serif",
            }}>
              Alt Afrikaner
            </span>
            <span style={{ fontSize: "10px", color: MUTED, fontFamily: "'Arial', sans-serif" }}>
              INVESTIGATIVE TIMELINES
            </span>
          </div>
          <h1 style={{
            fontSize: "28px", fontWeight: 400, color: WHITE,
            margin: "0 0 4px", lineHeight: 1.2,
            fontFamily: "'Georgia', serif",
          }}>
            {activeData.title}
          </h1>
          <p style={{
            fontSize: "14px", color: MUTED, margin: 0,
            fontFamily: "'Georgia', serif", fontStyle: "italic",
          }}>
            {activeData.subtitle}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: DARK, borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "flex", gap: "0" }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: "14px 16px", border: "none",
                borderBottom: `2px solid ${activeTab === tab.id ? tab.color : "transparent"}`,
                background: activeTab === tab.id ? `${tab.color}0a` : "transparent",
                cursor: "pointer", transition: "all 0.3s ease",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
              }}
            >
              <span style={{
                fontSize: "12px", fontWeight: 700, letterSpacing: "0.5px",
                color: activeTab === tab.id ? tab.color : MUTED,
                fontFamily: "'Arial', sans-serif",
              }}>
                {tab.label}
              </span>
              <span style={{
                fontSize: "10px", color: activeTab === tab.id ? `${tab.color}aa` : `${MUTED}66`,
                fontFamily: "'Georgia', serif",
              }}>
                {tab.subtitle}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "28px 24px 60px" }}>
        {activeTab === "osf" && (
          <>
            <div style={{
              marginBottom: "28px", padding: "20px",
              background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.15)",
              borderRadius: "8px",
            }}>
              <p style={{ fontSize: "13px", lineHeight: "1.8", color: TEXT, margin: 0, fontFamily: "'Georgia', serif" }}>
                No single article captures the cumulative arc. From one scholarship at UCT in 1979 to a $350 million continental programme in 2026, separate institutional threads converge and diverge across three decades: personnel cycling between Human Rights Watch, US government, and the foundation presidency; funding flowing through bifurcated legal structures in New York and Zug; media outlets acquired, certified, and networked into a single ecosystem; and advocacy pipelines carrying the anti-apartheid framework into new causes. Click any node to expand.
              </p>
            </div>
            <BranchingTimeline data={osfData} />
            <div style={{
              marginTop: "28px", padding: "20px",
              background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.15)",
              borderRadius: "8px", fontFamily: "'Georgia', serif",
              fontSize: "13px", lineHeight: "1.8", color: TEXT, fontStyle: "italic",
            }}>
              Jacques Ellul warned that the most powerful propaganda is the kind that does not appear to be propaganda at all, but simply the way things are.
            </div>
          </>
        )}

        {activeTab === "cuba" && <StackedTimeline data={cubaData} />}

        {activeTab === "defence" && (
          <>
            <div style={{
              marginBottom: "28px", padding: "20px",
              background: "rgba(41,128,185,0.06)", border: "1px solid rgba(41,128,185,0.15)",
              borderRadius: "8px",
            }}>
              <p style={{ fontSize: "13px", lineHeight: "1.8", color: TEXT, margin: 0, fontFamily: "'Georgia', serif" }}>
                Afrikaner engineers built the Rooivalk, the Mokopa, the Seeker, the ARD-10, and the Pebble Bed Modular Reactor under the most comprehensive sanctions regime in modern history. Four decades later, the blueprints sit in Tel Aviv, the drone designs fly over Kyiv, the nuclear technology heats Chinese homes, and an American company files for a $300 million IPO on the work those engineers did at Pelindaba. South Africa kept the debt and the empty buildings. Filter by extraction pipeline to trace each thread.
              </p>
            </div>
            <BranchingTimeline data={defenceData} />
            <div style={{
              marginTop: "28px", padding: "20px",
              background: "rgba(41,128,185,0.06)", border: "1px solid rgba(41,128,185,0.15)",
              borderRadius: "8px", fontFamily: "'Georgia', serif",
              fontSize: "13px", lineHeight: "1.8", color: TEXT, fontStyle: "italic",
            }}>
              Hannah Arendt observed that the moment we no longer have a free press, anything can happen. What cannot be reported cannot be known. The technology theft documented here was not classified. It was simply never assembled into a single narrative.
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "20px 24px", borderTop: `1px solid ${GOLD}22`,
        background: DARK, textAlign: "center",
      }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <p style={{
            fontSize: "10px", color: MUTED, margin: "0 0 8px",
            fontFamily: "'Arial', sans-serif", letterSpacing: "2px", textTransform: "uppercase",
          }}>
            Sources: DCLeaks OSF Internal Documents (2008-2016) · Al Jazeera/Guardian Spy Cables (2015) · US District Court Filings · SA Auditor-General Reports · SA Parliamentary Records · WikiLeaks Cablegate · DefenceWeb · OSF Published Financials
          </p>
          <p style={{
            fontSize: "11px", color: GOLD, margin: 0,
            fontFamily: "'Georgia', serif", fontStyle: "italic",
          }}>
            Alt Afrikaner · Precision over volume. Dignity holds ground.
          </p>
        </div>
      </div>
    </div>
  );
}
