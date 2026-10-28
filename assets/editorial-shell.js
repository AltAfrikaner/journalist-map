/* Shared editorial navigation. Link tags are article categories, not unsupported claims. */
(()=>{'use strict';const current=document.body; if(!current)return;current.classList.add('aa-editorial-site');if(location.pathname.includes('/articles/')&&!location.pathname.endsWith('/articles/')&&!location.pathname.endsWith('/articles/index.html'))current.classList.add('aa-editorial-article');
const prefix=location.pathname.includes('/articles/')?'../':'';
const bar=document.createElement('div');bar.className='aa-editorial-bar';bar.innerHTML='<button type="button" class="aa-menu-toggle" aria-label="Open sections menu" aria-controls="aa-editorial-drawer" aria-expanded="false">☰</button><a class="aa-editorial-logo" href="'+prefix+'index.html" aria-label="Alt Afrikaner home"><img src="'+prefix+'assets/alt-afrikaner-logo.svg" alt="Alt Afrikaner"></a><span class="aa-editorial-tagline">Independent thought. Documented investigation.</span><nav class="aa-editorial-actions" aria-label="Content departments"><a data-aa-department="investigations" href="'+prefix+'index.html#investigations">Investigations</a><a data-aa-department="articles" href="'+prefix+'articles/index.html"><span class="aa-dept-full">Articles &amp; Opinion</span><span class="aa-dept-short">Articles</span></a></nav>';
const overlay=document.createElement('div');overlay.className='aa-drawer-backdrop';const drawer=document.createElement('aside');drawer.className='aa-editorial-drawer';drawer.id='aa-editorial-drawer';drawer.setAttribute('aria-label','Publication sections');drawer.setAttribute('aria-hidden','true');drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');drawer.inert=true;
drawer.innerHTML='<button type="button" class="aa-drawer-close" aria-label="Close sections menu">×</button><h2>Alt Afrikaner</h2><p class="aa-drawer-heading">Articles &amp; Opinion</p><nav><a href="'+prefix+'index.html">Home</a><a href="'+prefix+'articles/index.html">All articles</a><a href="'+prefix+'articles/index.html?category=opinion">Opinion &amp; Analysis</a><a href="'+prefix+'articles/index.html?category=politics">Politics &amp; Policy</a><a href="'+prefix+'articles/index.html?category=history">History &amp; Heritage</a><a href="'+prefix+'articles/index.html?category=international">International</a><a href="'+prefix+'articles/index.html?category=technology">Technology</a></nav><p class="aa-drawer-heading">Investigations</p><nav><a href="'+prefix+'index.html#investigations">Investigations</a><a href="'+prefix+'sa_journalists.html">3D Networks</a><a href="'+prefix+'osf.html">Funding Networks</a></nav><a class="aa-drawer-cta" href="mailto:AltAfrikaner@outlook.com?subject=Alt%20Afrikaner%20enquiry">Contact Alt Afrikaner</a>';
document.body.prepend(overlay,drawer,bar);
// Inline important declarations are deliberate: legacy investigations sometimes
// apply broad nav/a/h2 rules after the shared stylesheet, and cached CSS can linger.
const enforced=(el,props)=>{for(const [key,value] of Object.entries(props))el.style.setProperty(key,value,'important')};
enforced(drawer,{'position':'fixed','top':'0','bottom':'0','left':'0','height':'100dvh','width':'min(370px,88vw)','max-width':'88vw','padding':'28px 26px 40px','background':'#fbf8f3','color':'#172338','z-index':'2147483000','overflow-y':'auto','overflow-x':'hidden','font-family':'Source Sans 3,system-ui,sans-serif','box-sizing':'border-box'});
enforced(overlay,{'z-index':'2147482999'});
enforced(drawer.querySelector('h2'),{'display':'block','height':'auto','min-height':'0','padding':'0','margin':'7px 36px 24px 0','background':'transparent','color':'#172338','font':'700 26px/1.3 Playfair Display,Georgia,serif','position':'static'});
drawer.querySelectorAll('p.aa-drawer-heading').forEach(el=>enforced(el,{'display':'block','position':'static','margin':'25px 0 10px','padding':'0','background':'transparent','color':'#8b271b','font':'700 12px/1.5 Source Sans 3,system-ui,sans-serif'}));
drawer.querySelectorAll('nav').forEach(nav=>{enforced(nav,{'display':'block','position':'static','height':'auto','min-height':'0','max-height':'none','width':'100%','padding':'0','margin':'0','background':'transparent','border':'0','box-shadow':'none','transform':'none','overflow':'visible','backdrop-filter':'none'});nav.querySelectorAll('a').forEach(el=>enforced(el,{'display':'block','position':'static','height':'auto','min-height':'0','width':'100%','padding':'11px 0','margin':'0','background':'transparent','border':'0','border-bottom':'1px solid #e6ddd2','color':'#172338','opacity':'1','text-align':'left','text-decoration':'none','white-space':'normal','font':'600 17px/1.4 Source Sans 3,system-ui,sans-serif','letter-spacing':'normal','text-transform':'none'}))});
enforced(drawer.querySelector('.aa-drawer-cta'),{'display':'block','position':'static','height':'auto','width':'100%','margin':'23px 0 0','padding':'13px 14px','background':'#8b271b','color':'#ffffff','font':'700 14px/1.4 Source Sans 3,system-ui,sans-serif','text-align':'center'});
enforced(drawer.querySelector('.aa-drawer-close'),{'position':'absolute','top':'14px','right':'16px','height':'36px','width':'36px','background':'transparent','color':'#172338','border':'0','padding':'0','font':'400 30px/36px system-ui,sans-serif'});
const department=location.pathname.includes('/articles/')?'articles':'investigations';
const currentDepartment=bar.querySelector('[data-aa-department="'+department+'"]');
if(currentDepartment){
 currentDepartment.classList.add('is-active');
 if(location.pathname==='/'||location.pathname.endsWith('/index.html')||location.pathname.endsWith('/articles/'))currentDepartment.setAttribute('aria-current','page');
}
const toggle=bar.querySelector('.aa-menu-toggle'),close=drawer.querySelector('.aa-drawer-close');let prior=null;function setOpen(open){overlay.classList.toggle('open',open);drawer.classList.toggle('open',open);drawer.setAttribute('aria-hidden',String(!open));drawer.inert=!open;toggle.setAttribute('aria-expanded',String(open));document.body.style.overflow=open?'hidden':'';if(open){prior=document.activeElement;close.focus()}else if(prior&&typeof prior.focus==='function')prior.focus()}
toggle.addEventListener('click',()=>setOpen(true));close.addEventListener('click',()=>setOpen(false));overlay.addEventListener('click',()=>setOpen(false));document.addEventListener('keydown',e=>{
 if(!drawer.classList.contains('open'))return;
 if(e.key==='Escape'){setOpen(false);return}
 if(e.key!=='Tab')return;
 const focusable=[...drawer.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')];
 if(!focusable.length)return;
 const first=focusable[0],last=focusable[focusable.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
 else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
});
})();
