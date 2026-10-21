/**
 * Alt Afrikaner archival editorial inventory.
 * Zero external dependencies; the script is intentionally read-only.
 * Usage: node scripts/audit-investigations.mjs [--json] [--enforce-contrast]
 *
 * Word counts are APPROXIMATE, not a source-validation verdict. Excludes
 * tags for styles/scripts, SVG, navigation, tables, code and footer; visual
 * infographics may communicate evidence outside the counted narrative.
 */
import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync('index.html','utf8');
const hrefs=[...html.matchAll(/<a\s+class="card"\s+href="([^"]+)"/g)].map(m=>m[1]);
const remote=hrefs.filter(h=>/^https?:\/\//.test(h));
const local=hrefs.filter(h=>!/^https?:\/\//.test(h));
assert.equal(new Set(hrefs).size,hrefs.length,'Repeated archive card links');
const wordCount=s=>(s.match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu)||[]).length;
const visible=s=>s
 .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
 .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
 .replace(/<!--[\s\S]*?-->/g,' ')
 .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi,' ')
 .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi,' ')
 .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi,' ')
 .replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi,' ')
 .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,' ')
 .replace(/<[^>]+>/g,' ')
 .replace(/&(?:#\d+|#x[0-9a-f]+|[a-z]+);/gi,' ')
 .replace(/\s+/g,' ');
const reports=local.map((file,i)=>{
 assert(existsSync(file),'Archive links to a missing file: '+file);
 const page=readFileSync(file,'utf8');
 const start=page.search(/<body\b[^>]*>/i);
 const end=page.lastIndexOf('</body>');
 const body=start>=0?page.slice(start,end>start?end:undefined):page;
 const bodyText=visible(body);
 const paragraphs=[...body.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)].map(m=>visible(m[0]));
 const visibleWords=wordCount(bodyText);
 const proseWords=wordCount(paragraphs.join(' '));
 const isGiant=file==='MTNrooivalkIRAN.html';
 const hasContrast=page.includes('assets/investigation-contrast.css');
 const sourcesSignal=/(?:id=['"]sources['"]|class=['"][^'"]*\bsources\b|<h[2-4][^>]*>[^<]*(?:source|reference|provenance))/i.test(page);
 return {index:i+1,file,narrativeWordsApprox:visibleWords,paragraphWordsApprox:proseWords,
  below1500:visibleWords<1500,nearThreshold:visibleWords>=1500&&visibleWords<1550,
  hasContrast,isGiant,sourcesSignal,sectionCount:(page.match(/<section\b/gi)||[]).length};
});
/* Editorial addendum integrity: require cited, substantive context, not padding. */
if(process.argv.includes('--enforce-evidence-notes')){
 for(const file of ['sixstage.html','metasuppression.html','usaidtonewsroom.html','sa_journalists.html']){
  const html=readFileSync(file,'utf8');
  const report=reports.find(r=>r.file===file);
  assert(html.includes('class="aa-evidence-context"'),'Missing source-linked evidence note: '+file);
  assert(html.includes('UNVERIFIED'),'Missing evidence-status qualification: '+file);
  assert(report&&report.narrativeWordsApprox>=1500,'Insufficient substantive narrative in '+file+': '+report?.narrativeWordsApprox);
 }
 const roster=readFileSync('44afrikaners.html','utf8');
 assert(roster.includes('Tied to One of 5 Universities'),'University roster/count contradiction remains');
 assert(roster.includes('UNVERIFIED SECTOR BREAKDOWN'),'Missing chart arithmetic audit notice');
}
/* Keep dated case updates conspicuous and evidence-linked. */
if(process.argv.includes('--enforce-evidence-notes')){
 const real=readFileSync('real411.html','utf8');
 const splc=readFileSync('splc.html','utf8');
 for(const [file,html] of [['real411.html',real],['splc.html',splc]]){
  assert(html.includes('class="aa-factual-update"'),'Missing dated factual update in '+file);
  assert(html.includes('UNVERIFIED'),'Missing factual uncertainty notice in '+file);
 }
 assert(real.includes('20 October 2026')&&real.includes('www.sanews.gov.za/south-africa/iec-enters-partnership-counter-disinformation'),'Missing new IEC partnership reference');
 assert(splc.includes('second superseding indictment')&&splc.includes('www.justice.gov/usao-mdal/pr/second-superseding-indictment-adds-defendant-and-charges-southern-poverty-law-center'),'Missing updated indictment record');
}
const contrastSheet=readFileSync('assets/investigation-contrast.css','utf8');
if(process.argv.includes('--enforce-contrast')){
 assert(contrastSheet.includes('aa-premium--real411 #whorunsit .data-table td'),'Real411 contrast contract missing');
 for(const r of reports)if(!r.isGiant)assert(r.hasContrast,'Missing common contrast stylesheet: '+r.file);
 const rooivalk=readFileSync('assets/dossier-batch-16-18.css','utf8');
 assert(rooivalk.includes('Contrast override for the 2 MB archival Rooivalk'),'Rooivalk text contrast missing');
 const rgb=hex=>hex.match(/[a-f0-9]{2}/gi).map(c=>parseInt(c,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
 const lum=h=>{const v=rgb(h.replace('#',''));return v[0]*.2126+v[1]*.7152+v[2]*.0722};
 const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
 for(const [fg,bg] of [['#23344a','#fffdfa'],['#23344a','#f0ece4'],['#253548','#fffdfa'],['#fff2dc','#1b2a4a']])
  assert(ratio(fg,bg)>=4.5,'Text contrast under WCAG AA for '+fg+' / '+bg);
}
const output={archiveCards:hrefs.length,localFiles:local.length,remoteFiles:remote.length,remote,
 below1500:reports.filter(r=>r.below1500).length,between1500and1549:reports.filter(r=>r.nearThreshold).length,
 criteria:'Approximate readable narrative words (excluding navigation, scripts, diagrams and data tables). Not factual verification.',reports};
if(process.argv.includes('--json'))console.log(JSON.stringify(output,null,2));
else{
 console.log('Archive: '+output.archiveCards+' cards, '+output.localFiles+' local investigations, '+output.remoteFiles+' external investigations.');
 console.log('Approximate narrative below 1500: '+output.below1500+'; 1500–1549: '+output.between1500and1549+'.');
 for(const r of reports)console.log(String(r.index).padStart(2,'0')+' '+r.file.padEnd(42,' ')+' '+String(r.narrativeWordsApprox).padStart(6,' ')+' words / '+(r.below1500?'SHORT':r.nearThreshold?'BORDERLINE':'REVIEW'));
 console.log('External pages require their own repositories: '+remote.join(', '));
}
