(function(){'use strict';const logo='assets/alt-afrikaner-logo.svg';const paths={facebook:'<path d="M15 21v-8h3l.5-4H15V7c0-1.2.3-2 2-2h2V1.4A28 28 0 0 0 16 1c-3 0-5 1.8-5 5v3H8v4h3v8z"/>',substack:'<path d="M4 4h16M4 8h16M4 12h16M5 15v7l7-4 7 4v-7z"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>'};function icon(k){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+paths[k]+'</svg>'}function createLink(h,l,k){let a=document.createElement('a');a.href=h;a.innerHTML=icon(k)+'<span>'+l+'</span>';if(h.startsWith('https:')){a.target='_blank';a.rel='noopener noreferrer'}return a}function init(){if(!document.body)return;const badge=document.createElement('a');badge.className='aa-brand-badge';badge.href='index.html';badge.setAttribute('aria-label','Alt Afrikaner home');const img=document.createElement('img');img.src=logo;img.alt='Alt Afrikaner logo';img.width=338;img.height=240;badge.append(img);if(!document.querySelector('.aa-brand-badge'))document.body.prepend(badge);let existing=document.querySelector('footer .footer-social');if(existing){for(let a of existing.querySelectorAll('a')){let h=a.getAttribute('href')||'';let k=h.includes('facebook.com')?'facebook':h.includes('substack')?'substack':h.startsWith('mailto:')?'mail':null;if(k&&!a.querySelector('svg'))a.insertAdjacentHTML('afterbegin',icon(k));a.classList.add('aa-existing-social');if(a.target==='_blank')a.rel='noopener noreferrer'}return}if(document.querySelector('.aa-site-footer'))return;let foot=document.createElement('footer');foot.className='aa-site-footer';foot.setAttribute('aria-label','Alt Afrikaner social links');let mark=document.createElement('img');mark.src=logo;mark.width=338;mark.height=240;mark.loading='lazy';mark.alt='Alt Afrikaner';foot.append(mark);let title=document.createElement('div');title.className='aa-site-footer-title';title.textContent='Alt Afrikaner';foot.append(title);let social=document.createElement('nav');social.className='aa-footer-social';social.setAttribute('aria-label','Social and contact links');social.append(createLink('https://www.facebook.com/AltAfrikaner','Facebook','facebook'),createLink('https://substack.com/@altafrikaner','Substack','substack'),createLink('mailto:AltAfrikaner@outlook.com','Email','mail'));foot.append(social);let note=document.createElement('div');note.className='aa-site-footer-note';note.textContent='Independent investigations · Sources and corrections welcome';foot.append(note);document.body.append(foot)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()})();

/* Alt Afrikaner feature art, independent of footer/navigation logic. */
;(function () {
  'use strict';
  const art = {"osf.html":{"asset":"assets/story-art/osf.svg","caption":"Foundations and institutional relationships"},"sa_journalists.html":{"asset":"assets/story-art/sa_journalists.svg","caption":"Journalists, newsrooms and professional links"},"africacheck.html":{"asset":"assets/story-art/africacheck.svg","caption":"Fact-checking and the verification process"},"ifcn.html":{"asset":"assets/story-art/ifcn.svg","caption":"The international fact-checking certification framework"},"sixstage.html":{"asset":"assets/story-art/sixstage.svg","caption":"Six-stage content assessment and distribution"},"metasuppression.html":{"asset":"assets/story-art/metasuppression.svg","caption":"Content ratings, labels and platform distribution"},"iol.html":{"asset":"assets/story-art/iol.svg","caption":"Media ownership and investment structures"},"usaid.html":{"asset":"assets/story-art/usaid.svg","caption":"Development funding and public records"},"usaidtonewsroom.html":{"asset":"assets/story-art/usaidtonewsroom.svg","caption":"Government funding and newsroom pathways"},"mtn.html":{"asset":"assets/story-art/mtn.svg","caption":"Telecommunications infrastructure and security questions"},"prototypenation.html":{"asset":"assets/story-art/prototypenation.svg","caption":"Comparative policy ideas and chronology"},"motsepe.html":{"asset":"assets/story-art/motsepe.svg","caption":"Corporate ownership and institutional roles"},"communists.html":{"asset":"assets/story-art/communists.svg","caption":"Political movements and historical documents"},"ancliberation.html":{"asset":"assets/story-art/ancliberation.svg","caption":"Political promises and governance outcomes"},"wef.html":{"asset":"assets/story-art/wef.svg","caption":"International forums and domestic policy debates"},"un.html":{"asset":"assets/story-art/un.svg","caption":"International institutions and legal scrutiny"},"mbalula.html":{"asset":"assets/story-art/mbalula.svg","caption":"Public documents and a political chronology"},"MTNrooivalkIRAN.html":{"asset":"assets/story-art/MTNrooivalkIRAN.svg","caption":"Aerospace, telecoms and international contracts"},"44afrikaners.html":{"asset":"assets/story-art/44afrikaners.svg","caption":"An open letter and its signatories"},"mbalula_network.html":{"asset":"assets/story-art/mbalula_network.svg","caption":"A research board of connections and sources"},"splc.html":{"asset":"assets/story-art/splc.svg","caption":"Civil society classifications and court documents"},"adl.html":{"asset":"assets/story-art/adl.svg","caption":"Donors, classifications and evidence standards"},"wits.html":{"asset":"assets/story-art/wits.svg","caption":"University networks and research"},"constitution.html":{"asset":"assets/story-art/constitution.svg","caption":"Constitutional texts and institutional procedures"},"fwdeklerk_foundation_investigation.html":{"asset":"assets/story-art/fwdeklerk_foundation_investigation.svg","caption":"A foundation's statements and public record"},"cws.html":{"asset":"assets/story-art/cws.svg","caption":"Faith-based organisations and public institutions"},"omidyar.html":{"asset":"assets/story-art/omidyar.svg","caption":"Technology philanthropy, media and grant networks"},"real411.html":{"asset":"assets/story-art/real411.svg","caption":"Online reporting and platform moderation mechanisms"},"osf-funded-orgs.html":{"asset":"assets/story-art/osf-funded-orgs.svg","caption":"A searchable record of grants and organisations"}};
  function placeArticleArtwork() {
    const slug = decodeURIComponent((window.location.pathname.split('/').pop() || '').trim());
    const selected = art[slug];
    if (!selected || document.querySelector('.aa-feature-art')) return;
    const hero = document.querySelector('.hero');
    const stats = ['.stats-bar', '.ctx', '.stats']
      .map(selector => [...document.querySelectorAll(selector)].find(el => !el.closest('.hero')))
      .find(Boolean);
    const header = document.querySelector('.container > .header, main > .header, .container .header');
    let anchor = stats || hero || header;
    if (!anchor) return;
    if (anchor.closest('.hero')) anchor = hero;
    const fig = document.createElement('figure');
    fig.className = 'aa-feature-art';
    fig.setAttribute('aria-label', 'Illustrative editorial artwork');
    const img = document.createElement('img');
    img.src = selected.asset;
    img.alt = 'Editorial illustration representing ' + selected.caption.toLowerCase();
    img.width = 1600;
    img.height = 640;
    img.loading = 'lazy';
    img.decoding = 'async';
    const cap = document.createElement('figcaption');
    cap.textContent = 'Editorial illustration · ' + selected.caption + '. Illustration only; consult cited records for evidence.';
    fig.append(img, cap);
    const sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = 'assets/story-art.css';
    document.head.append(sheet);
    anchor.after(fig);
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', placeArticleArtwork, { once: true });
  else placeArticleArtwork();
})();
