"""
ArchiMate HLD – CDP Medallion Architecture (Synapse Replacement)
Covers: Ingestion & Orchestration · Databricks Medallion · Environments ·
        Serving & Consumption · Governance · Security & Standards
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Polygon, Wedge, Circle, Ellipse, FancyArrowPatch
import numpy as np

# ── Canvas ──────────────────────────────────────────────────────────────
W, H = 1620, 1020
fig  = plt.figure(figsize=(W/100, H/100), dpi=130)
ax   = fig.add_axes([0, 0, 1, 1])
ax.set_xlim(0, W); ax.set_ylim(H, 0)
ax.axis('off')
fig.patch.set_facecolor('white'); ax.set_facecolor('white')

# ── Colour palette ─────────────────────────────────────────────────────
BIZ   = dict(f='#FFFACC', e='#B8860B', t='#5a3200')  # Business  – yellow
APP   = dict(f='#CCE0FF', e='#336699', t='#0e2860')  # Application – blue
TECH  = dict(f='#CCFFCC', e='#228B22', t='#0a3a0a')  # Technology – green
GOV   = dict(f='#F0E6FF', e='#7B2D8B', t='#4a1a60')  # Governance – purple
BRONZ = dict(f='#F5CBA7', e='#A04000', t='#6E2C00')  # Bronze data layer
SILV  = dict(f='#D5D8DC', e='#566573', t='#2C3E50')  # Silver data layer
GOLD_ = dict(f='#FAD7A0', e='#B7950B', t='#7D6608')  # Gold  data layer

def _col(tp):
    m = {'biz-svc':BIZ,'app-comp':APP,'app-svc':APP,'app-func':APP,
         'tech-node':TECH,'tech-art':TECH,'tech-ss':TECH,
         'comm-net':TECH,'comm-path':TECH,'gov-comp':GOV}
    return m.get(tp, APP)

# ── Primitives ─────────────────────────────────────────────────────────
def rect(x,y,w,h, fc,ec, lw=1.5, ls='-', z=3, alpha=1.0):
    ax.add_patch(Rectangle((x,y),w,h, linewidth=lw, edgecolor=ec,
                 facecolor=fc, linestyle=ls, zorder=z, alpha=alpha))

def t(s,x,y, ha='center',va='center', fs=9, fw='normal',
      col='#222', it=False, z=12):
    ax.text(x,y,s, ha=ha, va=va, fontsize=fs, fontweight=fw,
            color=col, style='italic' if it else 'normal', zorder=z)

def pal(lbl, cx, cy):
    t(lbl, cx, cy, fs=7, col='#cc0000', it=True, z=13)

# ── Zone / subnet ──────────────────────────────────────────────────────
def zone(x,y,w,h, label, sub, ec, fc, lw=2.2):
    rect(x,y,w,h, fc,ec, lw=lw, ls=(0,(8,3)), z=1)
    tc = ({'#B8860B':'#7a5010','#7B2D8B':'#4a1a60','#228B22':'#1a5a1a'}
          .get(ec,'#1a3a6a'))
    t(label, x+w/2, y+17, fs=11, fw='bold', col=tc, z=14)
    t(sub,   x+w/2, y+30, fs=7.5, col='#cc0000', it=True, z=14)

def subnet(x,y,w,h, label, sub='', ec='#336699', ls=(0,(5,2.5))):
    rect(x,y,w,h,'#00000000',ec, lw=1.4, ls=ls, z=2)
    t(label, x+w/2, y+12, fs=8.5, fw='bold', col='#1a3a6a', z=14)
    if sub: t(sub, x+w/2, y+23, fs=7.5, col='#cc0000', it=True, z=14)

# ── Badge icons (22×22 area at bx,by) ─────────────────────────────────
def badge_svc(bx,by,c):
    rect(bx,by+2,13,16,c['f'],c['e'], lw=1.2, z=8)
    ax.add_patch(Wedge((bx+17,by+10),5,-90,90,fc=c['e'],lw=0,zorder=8))

def badge_comp(bx,by,c):
    rect(bx,by+3,12,15,'white',c['e'], lw=1.2, z=8)
    rect(bx+9,by+4,11,5,'white',c['e'], lw=1.2, z=8)
    rect(bx+9,by+12,11,5,'white',c['e'], lw=1.2, z=8)

def badge_func(bx,by,c):
    rect(bx,by,20,20,'white',c['e'], lw=1.2, z=8)
    t('f()',bx+10,by+11, fs=11, fw='bold', col=c['e'], it=True, z=9)

def badge_ss(bx,by,c):
    ax.add_patch(Ellipse((bx+10,by+4),18,7,fc=c['f'],ec=c['e'],lw=1.2,zorder=8))
    rect(bx+1,by+4,18,14,c['f'],'none', lw=0, z=7)
    for xi in [bx+1,bx+19]:
        ax.plot([xi,xi],[by+4,by+18],color=c['e'],lw=1.2,zorder=8)
    ax.add_patch(Ellipse((bx+10,by+18),18,7,fc='#e8ffe8',ec=c['e'],lw=1.2,zorder=9))

def badge_art(bx,by,c):          # folded page
    ax.add_patch(Polygon([[bx,by],[bx+14,by],[bx+20,by+6],[bx+20,by+20],[bx,by+20]],
                 closed=True,fc=c['f'],ec=c['e'],lw=1.2,zorder=8))
    ax.plot([bx+14,bx+14,bx+20],[by,by+6,by+6],color=c['e'],lw=1.2,zorder=9)

def badge_cpath(bx,by,c):
    ax.add_patch(Circle((bx+4,by+10),4,fc='none',ec=c['e'],lw=1.4,zorder=8))
    ax.add_patch(Circle((bx+18,by+10),4,fc='none',ec=c['e'],lw=1.4,zorder=8))
    ax.plot([bx+8,bx+14],[by+10,by+10],color=c['e'],lw=1.4,zorder=8)

def draw_badge(bx,by,tp,c):
    if   tp in('biz-svc','app-svc','gov-comp'): badge_svc(bx,by,c)
    elif tp=='app-comp':  badge_comp(bx,by,c)
    elif tp=='app-func':  badge_func(bx,by,c)
    elif tp=='tech-ss':   badge_ss(bx,by,c)
    elif tp=='tech-art':  badge_art(bx,by,c)
    elif tp=='comm-path': badge_cpath(bx,by,c)

# ── Element body ────────────────────────────────────────────────────────
def _txt(name,palette, cx,cy, maxw, tc):
    lines=name.split('\n')
    fs=7.5 if len(lines)>2 else 9
    lh=fs+4
    oy=-(len(lines)-1)*lh/2
    for i,ln in enumerate(lines):
        t(ln,cx,cy+oy+i*lh, fs=fs, fw='bold' if i==0 else 'normal', col=tc, z=6)
    pal(palette, cx, cy+abs(oy)+len(lines)*lh*.45)

def el(x,y,w,h, tp, name, palette, custom_col=None):
    c = custom_col if custom_col else _col(tp)
    if   tp=='tech-node': _node3d(x,y,w,h,name,palette,c)
    elif tp=='tech-art':  _artifact(x,y,w,h,name,palette,c)
    else:
        rect(x,y,w,h,c['f'],c['e'], lw=1.5, z=3)
        draw_badge(x+w-25,y+2, tp, c)
        _txt(name,palette, x+w/2, y+h/2-7, w-32, c['t'])

def _node3d(x,y,w,h,name,palette,c=None, D=10):
    if c is None: c=TECH
    fw,fh=w-D,h-D
    ax.add_patch(Polygon([[x+fw,y+D],[x+w,y],[x+w,y+fh],[x+fw,y+D+fh]],
                 closed=True,fc='#aaddaa',ec=c['e'],lw=1.5,zorder=3))
    ax.add_patch(Polygon([[x,y+D],[x+D,y],[x+D+fw,y],[x+fw,y+D]],
                 closed=True,fc='#eeffee',ec=c['e'],lw=1.5,zorder=3))
    rect(x,y+D,fw,fh,c['f'],c['e'], lw=1.5, z=4)
    _txt(name,palette, x+fw/2, y+D+fh/2-7, fw-10, c['t'])

def _artifact(x,y,w,h,name,palette,c=None, fold=12):
    if c is None: c=TECH
    ax.add_patch(Polygon([[x,y],[x+w-fold,y],[x+w,y+fold],[x+w,y+h],[x,y+h]],
                 closed=True,fc=c['f'],ec=c['e'],lw=1.5,zorder=3))
    ax.plot([x+w-fold,x+w-fold,x+w],[y,y+fold,y+fold],
            color=c['e'],lw=1.5,zorder=4)
    _txt(name,palette, x+(w-fold*.5)/2, y+h/2-7, w-fold, c['t'])

# ── Relationships ──────────────────────────────────────────────────────
_RS = {
    'flow':        ('#cc0000',(0,(6,3)), True),
    'serving':     ('#336699','-',      True),
    'triggering':  ('#336699',(0,(4,2)),True),
    'realisation': ('#666',  (0,(4,2)), False),
    'access':      ('#888',  (0,(4,2)), False),
    'assoc':       ('#888',  (0,(3,2)), False),
    'xserve':      ('#228B22',(0,(5,2.5)),True),
    'compose':     ('#444',  '-',       True),
    'gov':         ('#7B2D8B',(0,(4,2)),False),
}
def rel(pts, style='flow', label=None):
    col,ls,solid = _RS.get(style,_RS['flow'])
    xs,ys = zip(*pts)
    ax.plot(xs,ys,color=col,lw=1.4,linestyle=ls,zorder=7,
            solid_capstyle='round',solid_joinstyle='round')
    dx=pts[-1][0]-pts[-2][0]; dy=pts[-1][1]-pts[-2][1]
    n=np.hypot(dx,dy)
    if n>0: dx,dy=dx/n,dy/n
    px,py=-dy,dx; tip=pts[-1]; sz=7
    ax.add_patch(Polygon([tip,
        (tip[0]-dx*sz+px*sz*.5,tip[1]-dy*sz+py*sz*.5),
        (tip[0]-dx*sz-px*sz*.5,tip[1]-dy*sz-py*sz*.5)],
        closed=True,fc=col if solid else 'white',ec=col,lw=1,zorder=9))
    if style=='compose':
        p0=pts[0];p1=pts[1]
        ddx=p1[0]-p0[0];ddy=p1[1]-p0[1];dn=np.hypot(ddx,ddy)
        if dn>0: ddx,ddy=ddx/dn,ddy/dn
        ppx,ppy=-ddy,ddx
        ax.add_patch(Polygon([p0,
            (p0[0]+ppx*5+ddx*8,p0[1]+ppy*5+ddy*8),
            (p0[0]+ddx*16,p0[1]+ddy*16),
            (p0[0]-ppx*5+ddx*8,p0[1]-ppy*5+ddy*8)],
            closed=True,fc='#444',ec='#444',zorder=10))
    if label:
        mi=max(1,len(pts)//2)
        t(label,(pts[mi-1][0]+pts[mi][0])/2,(pts[mi-1][1]+pts[mi][1])/2-3,
          fs=7.5,col=col,it=True,z=9)

# ══════════════════════════════════════════════════════════════════════
#  DIAGRAM
# ══════════════════════════════════════════════════════════════════════

# Title
t('ArchiMate – CDP Medallion Architecture (Synapse Replacement)',
  W/2,30, fs=13,fw='bold',col='#1a1a2e',z=20)
t('Data Ingestion & Orchestration · Medallion Layers · Environments · '
  'Serving & Consumption · Governance · Security',
  W/2,46, fs=8.5,col='#cc0000',it=True,z=20)

# Layer tints
ax.add_patch(Rectangle((0,55),W,105,fc='#fffacc',alpha=.13,ec='none',zorder=0))
ax.add_patch(Rectangle((0,160),W,500,fc='#cce0ff',alpha=.10,ec='none',zorder=0))
ax.add_patch(Rectangle((0,660),W,310,fc='#ccffcc',alpha=.10,ec='none',zorder=0))

# ── Outer CDP platform zone ────────────────────────────────────────────
zone(185,60,1235,900,
     'CDP Platform  (Common Data Platform)',
     '«Grouping»  –  Technology: Communication Network',
     '#336699','#e8f0ff28')

# ── GOVERNANCE (cross-cutting, top strip, purple) ──────────────────────
subnet(195,72,900,105,
       'Governance, Monitoring & Operations  (cross-cutting)',
       '«Grouping»  –  Motivation / Cross-cutting Concern',
       ec='#7B2D8B', ls=(0,(4,2)))

el(205, 83,162,72, 'gov-comp',
   'Microsoft\nPurview',
   'Application Component\n(Data Governance)', GOV)

el(380, 83,162,72, 'gov-comp',
   'Azure Monitor',
   'Application Component\n(Monitoring)', GOV)

el(555, 83,162,72, 'gov-comp',
   'Log Analytics\nWorkspace',
   'Application Component\n(Logging)', GOV)

# ── SOURCE (external) ─────────────────────────────────────────────────
rect(10,55,165,900,'#fff8ee','#B8860B', lw=2, ls=(0,(8,3)), z=1)
t('External\nSources', 92,73, fs=10,fw='bold',col='#7a5010',z=14)
t('«Grouping»',92,86, fs=7.5,col='#cc0000',it=True,z=14)

el(15,480,150,80, 'biz-svc',
   'Source\nSystems\n(SharePoint / API)',
   'Business Service')

# ── ORCHESTRATION ──────────────────────────────────────────────────────
el(200,210,170,172,'app-func',
   'Orchestrator\n(Event-Driven)\n\n  Scheduled +\n  Event-based',
   'Application Function')

# ── DATABRICKS ENGINEERING container ───────────────────────────────────
subnet(385,190,615,490,
       'Databricks Engineering Layer',
       'Technology: System Software  (Medallion Architecture – Bronze / Silver / Gold)',
       ec='#228B22', ls=(0,(5,2.5)))

# API / Databricks SQL serving layer (top of engineering zone)
el(395,205,595,68,'app-svc',
   'Databricks SQL  /  API Layer  (HTTPS · RBAC-governed)',
   'Application Service  –  replaces Synapse SQL On-Demand')

# MEDALLION DATA LAYERS
_artifact(395,290,176,88,
          'BRONZE\nRaw Data',
          'Technology: Artifact\n(Raw / Ingest)',
          BRONZ)

_artifact(582,290,176,88,
          'SILVER\nCleaned Data',
          'Technology: Artifact\n(Validated / Cleansed)',
          SILV)

_artifact(769,290,176,88,
          'GOLD\nCurated Data',
          'Technology: Artifact\n(Aggregated / Governed)',
          GOLD_)

# ENVIRONMENT ROWS (Prod → Dev)
_ENV = [
    (395,398,595,36,'Prod',        '#d5f5e3','#1e8449'),
    (395,438,595,36,'Pre-Prod',    '#fef9e7','#b7950b'),
    (395,478,595,36,'Test',        '#fde8e8','#cb4335'),
    (395,518,595,36,'Dev',         '#eaf4fb','#2e86c1'),
]
for ex,ey,ew,eh,elbl,efc,eec in _ENV:
    rect(ex,ey,ew,eh, efc,eec, lw=1.3, z=4)
    t(elbl, ex+40, ey+eh/2, ha='center', fs=8.5, fw='bold', col=eec, z=6)
    t('Technology: Deployment Node', ex+ew/2+30, ey+eh/2,
      ha='center', fs=7, col='#cc0000', it=True, z=6)

# ENVIRONMENT annotation – left bracket line
ax.plot([396,396],[396,558], color='#888', lw=1.2, linestyle='-', zorder=5)
ax.plot([396,406],[396,396], color='#888', lw=1.2, zorder=5)
ax.plot([396,406],[558,558], color='#888', lw=1.2, zorder=5)
t('Same medallion\nstack deployed\nin each env',
  388, 478, ha='right', fs=7, col='#555', z=8)

# ── SECURITY & STANDARDS (bottom strip) ───────────────────────────────
subnet(195,788,1215,90,
       'Security & Standards',
       'Technology: System Software + Communication Path',
       ec='#228B22', ls=(0,(4,2)))

el(205,800,215,68,'tech-ss',
   'Azure AD / RBAC\n(Access Control)',
   'Technology: System Software')

el(435,800,215,68,'comm-path',
   'HTTPS / TLS\n(API Standards)',
   'Technology: Communication Path')

el(665,800,240,68,'tech-ss',
   'Ofgem Cloud-First\nSecurity Principles',
   'Technology: System Software')

el(920,800,215,68,'gov-comp',
   'Data Governance\n& Lineage',
   'Application Component\n(Purview Policy)', GOV)

# ── REPORTING TOOLS (external right) ──────────────────────────────────
rect(1425,55,185,900,'#f0fff0','#228B22', lw=2, ls=(0,(8,3)), z=1)
t('Reporting /\nConsumption', 1517,73, fs=10,fw='bold',col='#1a5a1a',z=14)
t('«Grouping»',1517,86, fs=7.5,col='#cc0000',it=True,z=14)

el(1433,340,168,72,'app-comp',
   'Power BI\nReports',
   'Application Component')

el(1433,430,168,72,'app-comp',
   'Excel / CSV\nExports',
   'Application Component')

el(1433,520,168,72,'app-svc',
   'Databricks SQL\nExternal Access',
   'Application Service')

# ══════════════════════════════════════════════════════════════════════
#  RELATIONSHIPS
# ══════════════════════════════════════════════════════════════════════

# 1  Source → Orchestrator  [Flow – data ingestion triggered]
rel([[165,520],[198,295]], 'flow','Data Flow')

# 2  Orchestrator → Databricks Engineering API  [Triggering – event driven]
rel([[370,295],[393,239]], 'triggering','Triggers\n(event-driven)')

# 3  API → BRONZE  [Flow – raw ingest]
rel([[590,273],[483,290]], 'flow')

# 4  BRONZE → SILVER  [Flow – transformation]
rel([[571,334],[582,334]], 'flow','Transform')

# 5  SILVER → GOLD  [Flow – curation]
rel([[758,334],[769,334]], 'flow','Curate')

# 6  GOLD → API (Databricks SQL serving upward)  [Serving]
rel([[857,290],[857,273]], 'serving','Serving')

# 7  API → Power BI  [Serving cross-zone]
rel([[990,239],[1423,376]], 'xserve','Serving (HTTPS)')

# 8  API → Excel/CSV  [Serving]
rel([[990,239],[1423,466]], 'xserve')

# 9  API → Databricks SQL external  [Serving]
rel([[990,239],[1423,556]], 'xserve')

# 10 Governance → API  [Association – monitoring]
rel([[620,155],[620,203]], 'gov','Monitors')

# 11 Azure Monitor → API  [Association]
rel([[461,155],[510,203]], 'gov')

# 12 Log Analytics → API  [Association]
rel([[636,155],[636,203]], 'gov')

# 13 Security ← API  [Realisation – standards applied]
rel([[693,800],[590,273]], 'realisation','RBAC / HTTPS')

# 14 RBAC → Orchestrator  [Association – governs access]
rel([[312,800],[285,382]], 'assoc')

# 15 Data Governance ← Gold  [Association – lineage]
rel([[945,800],[857,378]], 'gov','Lineage')

# ══════════════════════════════════════════════════════════════════════
#  LEGEND
# ══════════════════════════════════════════════════════════════════════
lx,ly=185,878
rect(lx,ly,1235,88,'#fffff8','#ccc', lw=1, z=16)
t('RELATIONSHIP KEY:', lx+8,ly+12, ha='left',fs=9,fw='bold',col='#222',z=18)

def rleg(x,y,col,ls,solid,lbl):
    ax.plot([x,x+34],[y,y],color=col,lw=1.4,linestyle=ls,zorder=18)
    fc=col if solid else 'white'
    ax.add_patch(Polygon([(x+34,y),(x+27,y-3.5),(x+27,y+3.5)],
                 closed=True,fc=fc,ec=col,lw=1,zorder=19))
    t(lbl,x+40,y, ha='left',fs=8,col=col,z=19)

rleg(lx+120,ly+13,'#cc0000',(0,(5,3)),True,'Flow')
rleg(lx+195,ly+13,'#336699','-',True,'Serving')
rleg(lx+275,ly+13,'#336699',(0,(4,2)),True,'Triggering')
rleg(lx+375,ly+13,'#228B22',(0,(5,2.5)),True,'Cross-zone Serving')
rleg(lx+530,ly+13,'#888',(0,(4,2)),False,'Access / Realisation')
rleg(lx+675,ly+13,'#7B2D8B',(0,(4,2)),False,'Governance / Association')

# Colour chips
def chip(x,y,f,e,lbl):
    rect(x,y,14,12,f,e, lw=1, z=18)
    t(lbl,x+18,y+6, ha='left',fs=8,col='#333',z=19)

chip(lx+8,  ly+35,'#FFFACC','#B8860B','Business Layer')
chip(lx+125,ly+35,'#CCE0FF','#336699','Application Layer')
chip(lx+255,ly+35,'#CCFFCC','#228B22','Technology Layer')
chip(lx+385,ly+35,'#F0E6FF','#7B2D8B','Governance (cross-cutting)')
chip(lx+565,ly+35,'#F5CBA7','#A04000','Bronze Data Layer')
chip(lx+685,ly+35,'#D5D8DC','#566573','Silver Data Layer')
chip(lx+805,ly+35,'#FAD7A0','#B7950B','Gold Data Layer')

# Badge key
t('BADGES:', lx+8,ly+58, ha='left',fs=8,fw='bold',col='#222',z=18)
for bkx,fn,c,lbl in [
    (lx+80, badge_svc,  BIZ,  'Biz Service'),
    (lx+158,badge_comp, APP,  'App Component'),
    (lx+236,badge_svc,  APP,  'App Service'),
    (lx+314,badge_func, APP,  'App Function'),
    (lx+392,badge_ss,   TECH, 'Sys Software'),
    (lx+470,badge_art,  TECH, 'Tech Artifact'),
    (lx+548,badge_cpath,TECH, 'Comm Path'),
    (lx+626,badge_svc,  GOV,  'Gov Component'),
]:
    fn(bkx,ly+50,c)
    t(lbl,bkx+11,ly+74, fs=7,col='#555',z=19)

# 3D node mini
_node3d(lx+704,ly+50,22,22,'','')
t('Tech Node',lx+709,ly+76, fs=7,col='#555',z=19)

t('Red italic = ArchiMate 3 palette item  |  '
  'Architecture principles: Ingestion & Orchestration · Medallion (Bronze/Silver/Gold) · '
  'Environments · Serving · Governance · Security',
  lx+8,ly+83, ha='left',fs=8,col='#cc0000',it=True,z=19)

# Export
out='/home/user/journalist-map/archimate_hld2.png'
plt.savefig(out, dpi=130, bbox_inches='tight',
            facecolor='white', pad_inches=0.05)
print(f'Saved → {out}')
