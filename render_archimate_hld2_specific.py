"""
ArchiMate HLD2 – CDP Medallion Architecture (Synapse Replacement)
SPECIFIC element types per ArchiMate 3 spec:
  Application Event · Application Component · Application Function
  Technology Node → System Software → Application Function (assignment chain)
  Technology Artifact realizes Application Data Object
  Application Interface (HTTPS endpoint)
  Motivation: Principle (Ofgem Standards)
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Polygon, Wedge, Circle, Ellipse, Arc
import numpy as np

W, H = 1820, 1100
fig  = plt.figure(figsize=(W/100, H/100), dpi=130)
ax   = fig.add_axes([0,0,1,1])
ax.set_xlim(0,W); ax.set_ylim(H,0)
ax.axis('off')
fig.patch.set_facecolor('white'); ax.set_facecolor('white')

# ── Layer colours ──────────────────────────────────────────────────────
BIZ   = dict(f='#FFFACC', e='#B8860B', t='#5a3200')   # Business
APP   = dict(f='#CCE0FF', e='#336699', t='#0e2860')   # Application
TECH  = dict(f='#CCFFCC', e='#228B22', t='#0a3a0a')   # Technology
GOV   = dict(f='#F0E6FF', e='#7B2D8B', t='#4a1060')   # Governance (cross-cutting)
MOTIV = dict(f='#FEF9E7', e='#B7950B', t='#7D6608')   # Motivation (Principle)
BRONZ = dict(f='#F5CBA7', e='#A04000', t='#6E2C00')   # Bronze layer
SILV  = dict(f='#D5D8DC', e='#566573', t='#2C3E50')   # Silver layer
GOLD_ = dict(f='#FAD7A0', e='#B7950B', t='#7D6608')   # Gold  layer

def _col(tp):
    return {'biz-svc':BIZ,'app-comp':APP,'app-svc':APP,'app-func':APP,
            'app-event':APP,'app-dataobj':APP,'app-iface':APP,
            'tech-node':TECH,'tech-art':TECH,'tech-ss':TECH,'tech-path':TECH,
            'gov-comp':GOV,'principle':MOTIV}.get(tp, APP)

# ── Primitives ─────────────────────────────────────────────────────────
def rect(x,y,w,h, fc,ec, lw=1.5, ls='-', z=3):
    ax.add_patch(Rectangle((x,y),w,h, lw=lw, ec=ec, fc=fc, ls=ls, zorder=z))

def t(s,x,y, ha='center',va='center',fs=9,fw='normal',
      col='#222',it=False,z=12):
    ax.text(x,y,s,ha=ha,va=va,fontsize=fs,fontweight=fw,
            color=col,style='italic' if it else 'normal',zorder=z)

def pal(lbl,cx,cy, col='#cc0000'):
    t(lbl,cx,cy, fs=6.5,col=col,it=True,z=13)

def zone(x,y,w,h,label,sub,ec,fc,lw=2.2):
    rect(x,y,w,h,fc,ec,lw=lw,ls=(0,(8,3)),z=1)
    tc={'#B8860B':'#7a5010','#7B2D8B':'#4a1060','#228B22':'#1a5a1a'}.get(ec,'#1a3a6a')
    t(label,x+w/2,y+17,fs=10,fw='bold',col=tc,z=14)
    t(sub,x+w/2,y+29,fs=7,col='#cc0000',it=True,z=14)

def subnet(x,y,w,h,label,sub='',ec='#336699',ls=(0,(5,2.5))):
    rect(x,y,w,h,'#00000000',ec,lw=1.4,ls=ls,z=2)
    t(label,x+w/2,y+12,fs=8.5,fw='bold',col='#1a3a6a',z=14)
    if sub: t(sub,x+w/2,y+24,fs=7,col='#cc0000',it=True,z=14)

# ═══════════════════════════════════════════════════════════════════════
#  BADGES  (22×22 area at bx,by)
# ═══════════════════════════════════════════════════════════════════════

def badge_svc(bx,by,c):           # Business/App Service: box + lollipop
    rect(bx,by+2,13,16,c['f'],c['e'],lw=1.2,z=8)
    ax.add_patch(Wedge((bx+17,by+10),5,-90,90,fc=c['e'],lw=0,zorder=8))

def badge_comp(bx,by,c):          # Application Component: body + two tabs
    rect(bx,by+3,12,15,'white',c['e'],lw=1.2,z=8)
    rect(bx+9,by+4,11,5,'white',c['e'],lw=1.2,z=8)
    rect(bx+9,by+12,11,5,'white',c['e'],lw=1.2,z=8)

def badge_func(bx,by,c):          # Application Function: f() box
    rect(bx,by,20,20,'white',c['e'],lw=1.2,z=8)
    t('f()',bx+10,by+11,fs=11,fw='bold',col=c['e'],it=True,z=9)

def badge_event(bx,by,c):         # Application Event: ⚡ lightning bolt
    rect(bx,by,20,20,'white',c['e'],lw=1.2,z=8)
    ax.add_patch(Polygon(                         # lightning bolt shape
        [[bx+13,by+2],[bx+7,by+11],[bx+12,by+11],[bx+7,by+18],[bx+16,by+9],[bx+11,by+9]],
        closed=True,fc=c['e'],ec='none',zorder=9))

def badge_dataobj(bx,by,c):       # Application Data Object: flat drum
    ax.add_patch(Ellipse((bx+9,by+5), 18,7, fc=c['f'],ec=c['e'],lw=1.2,zorder=8))
    rect(bx,by+5,18,10,c['f'],'none',lw=0,z=7)
    ax.plot([bx,bx,bx+18,bx+18],[by+5,by+15,by+15,by+5],
            color=c['e'],lw=1.2,zorder=8)
    ax.add_patch(Ellipse((bx+9,by+15),18,7, fc='#e0f0ff',ec=c['e'],lw=1.2,zorder=9))

def badge_iface(bx,by,c):         # Application Interface: socket (□) + lollipop (○)
    rect(bx,by+4,11,12,'white',c['e'],lw=1.2,z=8)
    ax.plot([bx+11,bx+15],[by+10,by+10],color=c['e'],lw=1.2,zorder=9)
    ax.add_patch(Circle((bx+19,by+10),4,fc='none',ec=c['e'],lw=1.4,zorder=9))

def badge_ss(bx,by,c):            # Technology System Software: cylinder
    ax.add_patch(Ellipse((bx+9,by+4),18,7,fc=c['f'],ec=c['e'],lw=1.2,zorder=8))
    rect(bx,by+4,18,12,c['f'],'none',lw=0,z=7)
    ax.plot([bx,bx,bx+18,bx+18],[by+4,by+16,by+16,by+4],
            color=c['e'],lw=1.2,zorder=8)
    ax.add_patch(Ellipse((bx+9,by+16),18,7,fc='#e8ffe8',ec=c['e'],lw=1.2,zorder=9))

def badge_art(bx,by,c):           # Technology Artifact: folded-corner page
    ax.add_patch(Polygon([[bx,by],[bx+14,by],[bx+20,by+7],[bx+20,by+20],[bx,by+20]],
                 closed=True,fc=c['f'],ec=c['e'],lw=1.2,zorder=8))
    ax.plot([bx+14,bx+14,bx+20],[by,by+7,by+7],color=c['e'],lw=1.2,zorder=9)

def badge_path(bx,by,c):          # Technology Path: ○──○
    ax.add_patch(Circle((bx+4, by+10),4,fc='none',ec=c['e'],lw=1.4,zorder=8))
    ax.add_patch(Circle((bx+18,by+10),4,fc='none',ec=c['e'],lw=1.4,zorder=8))
    ax.plot([bx+8,bx+14],[by+10,by+10],color=c['e'],lw=1.4,zorder=8)

def badge_principle(bx,by,c):     # Motivation Principle: 'P' label box
    rect(bx,by,20,20,'white',c['e'],lw=1.2,z=8)
    t('P',bx+10,by+11,fs=13,fw='bold',col=c['e'],z=9)

def draw_badge(bx,by,tp,c):
    {'biz-svc':badge_svc,'app-comp':badge_comp,'app-svc':badge_svc,
     'app-func':badge_func,'app-event':badge_event,'app-dataobj':badge_dataobj,
     'app-iface':badge_iface,'tech-ss':badge_ss,'tech-art':badge_art,
     'tech-path':badge_path,'gov-comp':badge_comp,'principle':badge_principle
    }.get(tp, lambda *a: None)(bx,by,c)

# ── Element bodies ──────────────────────────────────────────────────────
def _txt(name, palette, cx, cy, maxw, tc, pal_col='#cc0000'):
    lines = name.split('\n')
    fs = 7 if len(lines) > 2 else (8.5 if len(lines) > 1 else 9)
    lh = fs + 3.5
    oy = -(len(lines)-1)*lh/2
    for i,ln in enumerate(lines):
        t(ln,cx,cy+oy+i*lh, fs=fs, fw='bold' if i==0 else 'normal', col=tc, z=6)
    if palette:
        pal(palette, cx, cy+abs(oy)+len(lines)*lh*.42, col=pal_col)

def el(x,y,w,h, tp, name, palette, custom_col=None):
    c = custom_col if custom_col else _col(tp)
    if   tp == 'tech-node': _node3d(x,y,w,h,name,palette,c)
    elif tp == 'tech-art':  _artifact(x,y,w,h,name,palette,c)
    else:
        rect(x,y,w,h,c['f'],c['e'],lw=1.5,z=3)
        draw_badge(x+w-25,y+2,tp,c)
        _txt(name,palette, x+w/2, y+h/2-6, w-32, c['t'])

def _node3d(x,y,w,h,name,palette,c=None,D=10):
    if c is None: c=TECH
    fw,fh=w-D,h-D
    ax.add_patch(Polygon([[x+fw,y+D],[x+w,y],[x+w,y+fh],[x+fw,y+D+fh]],
                 closed=True,fc='#aaddaa',ec=c['e'],lw=1.5,zorder=3))
    ax.add_patch(Polygon([[x,y+D],[x+D,y],[x+D+fw,y],[x+fw,y+D]],
                 closed=True,fc='#eeffee',ec=c['e'],lw=1.5,zorder=3))
    rect(x,y+D,fw,fh,c['f'],c['e'],lw=1.5,z=4)
    _txt(name,palette, x+fw/2, y+D+fh/2-6, fw-10, c['t'])

def _artifact(x,y,w,h,name,palette,c=None,fold=12):
    if c is None: c=TECH
    ax.add_patch(Polygon([[x,y],[x+w-fold,y],[x+w,y+fold],[x+w,y+h],[x,y+h]],
                 closed=True,fc=c['f'],ec=c['e'],lw=1.5,zorder=3))
    ax.plot([x+w-fold,x+w-fold,x+w],[y,y+fold,y+fold],
            color=c['e'],lw=1.5,zorder=4)
    _txt(name,palette, x+(w-fold*.5)/2, y+h/2-6, w-fold, c['t'])

# ── Relationships ───────────────────────────────────────────────────────
_RS = {
    'flow':         ('#cc0000',(0,(6,3)),  True),
    'serving':      ('#336699','-',        True),
    'triggering':   ('#336699',(0,(4,2)),  True),
    'realisation':  ('#444',  (0,(4,2)),   False),
    'access-w':     ('#cc0000',(0,(4,2)),  False),   # Access (write)
    'access-r':     ('#228B22',(0,(4,2)),  False),   # Access (read)
    'assoc':        ('#888',  (0,(3,2)),   False),
    'gov-assoc':    ('#7B2D8B',(0,(3,2)),  False),
    'xserve':       ('#228B22','-',        True),
    'assignment':   ('#444',  '-',         True),
    'influence':    ('#B7950B',(0,(5,2)),  False),
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
    # Filled diamond at origin for composition
    if style=='compose':
        p0,p1=pts[0],pts[1]
        ddx,ddy=p1[0]-p0[0],p1[1]-p0[1]; dn=np.hypot(ddx,ddy)
        if dn>0: ddx,ddy=ddx/dn,ddy/dn
        ppx,ppy=-ddy,ddx
        ax.add_patch(Polygon([p0,
            (p0[0]+ppx*5+ddx*8,p0[1]+ppy*5+ddy*8),
            (p0[0]+ddx*16,p0[1]+ddy*16),
            (p0[0]-ppx*5+ddx*8,p0[1]-ppy*5+ddy*8)],
            closed=True,fc='#444',ec='#444',zorder=10))
    # Assignment filled circle at origin
    if style=='assignment':
        ax.add_patch(Circle(pts[0],5,fc='#444',ec='#444',lw=0,zorder=10))
    if label:
        mi=max(1,len(pts)//2)
        t(label,(pts[mi-1][0]+pts[mi][0])/2,(pts[mi-1][1]+pts[mi][1])/2-3,
          fs=7,col=col,it=True,z=9)

# ══════════════════════════════════════════════════════════════════════
#  DIAGRAM
# ══════════════════════════════════════════════════════════════════════

# Title
t('ArchiMate – CDP Medallion Architecture (Synapse Replacement)',
  W/2,32, fs=14,fw='bold',col='#1a1a2e',z=20)
t('Specific ArchiMate 3 elements: App Event · App Function · App Data Object · '
  'App Interface · Tech Node→SysSoft→AppFunc chain · Motivation: Principle',
  W/2,48, fs=8,col='#cc0000',it=True,z=20)

# Layer tints
ax.add_patch(Rectangle((0,55),W,105,fc='#fffacc',alpha=.12,ec='none',zorder=0))
ax.add_patch(Rectangle((0,160),W,540,fc='#cce0ff',alpha=.09,ec='none',zorder=0))
ax.add_patch(Rectangle((0,700),W,295,fc='#ccffcc',alpha=.09,ec='none',zorder=0))

# ── OUTER ZONES ────────────────────────────────────────────────────────
rect(5,55,165,940,'#fff8ee','#B8860B',lw=2,ls=(0,(8,3)),z=1)
t('External\nSources',92,73, fs=9,fw='bold',col='#7a5010',z=14)
t('«Grouping»',92,86, fs=7,col='#cc0000',it=True,z=14)

zone(178,55,1458,940,
     'CDP  –  Common Data Platform',
     '«Grouping»  –  Technology: Communication Network  (Azure VNet / CDP Subnet)',
     '#336699','#e8f0ff20')

rect(1644,55,170,940,'#f0fff0','#228B22',lw=2,ls=(0,(8,3)),z=1)
t('Reporting /\nConsumption',1729,73, fs=9,fw='bold',col='#1a5a1a',z=14)
t('«Grouping»',1729,86, fs=7,col='#cc0000',it=True,z=14)

# ── GOVERNANCE CROSS-CUTTING (top strip) ───────────────────────────────
subnet(188,68,950,112,
       'Governance, Monitoring & Operations  (cross-cutting concern)',
       '«Grouping»  –  Motivation / Cross-Cutting',
       ec='#7B2D8B',ls=(0,(4,2)))

el(198, 80,165,78, 'gov-comp',
   'Microsoft\nPurview',
   'Application Component\n(Data Catalogue / Lineage)', GOV)

el(378, 80,165,78, 'gov-comp',
   'Azure\nMonitor',
   'Application Component\n(Platform Monitoring)', GOV)

el(558, 80,165,78, 'gov-comp',
   'Log Analytics\nWorkspace',
   'Application Component\n(Log Management)', GOV)

# ── EXTERNAL SOURCE ────────────────────────────────────────────────────
el(12,435,148,78, 'biz-svc',
   'Source Systems\n(SharePoint / API)',
   'Business Service\n(external capability)')

# ── APPLICATION EVENT (trigger) ────────────────────────────────────────
el(188,198,162,72, 'app-event',
   'Data Ingestion\nTrigger Event',
   'Application Event\n(scheduled / event-driven)')

# ── ORCHESTRATOR ───────────────────────────────────────────────────────
rect(188,285,162,208,'#CCE0FF','#336699',lw=1.5,z=3)  # App Component body
badge_comp(326,285,APP)
t('Orchestrator',269,303, fs=9,fw='bold',col=APP['t'],z=6)
t('Application Component',269,316, fs=6.5,col='#cc0000',it=True,z=6)

# Application Function nested inside Orchestrator
el(197,330,145,75, 'app-func',
   'Scheduling /\nDispatch Logic',
   'Application Function\n(internal behavior)')

el(197,418,145,65, 'app-event',
   'Pipeline\nTriggered',
   'Application Event\n(outbound)')

# ── DATABRICKS ENGINEERING CONTAINER ───────────────────────────────────
subnet(358,185,258,400,
       'Databricks Engineering',
       'Technology: System Software\n(Spark Medallion pipeline)',
       ec='#228B22',ls=(0,(5,2.5)))

# Technology: Node (cluster compute)
_node3d(368,200,238,72,
        'Databricks Cluster\n(Azure VM/Compute)',
        'Technology: Node\n(compute infrastructure)')

# Technology: System Software on the node
el(368,288,238,72, 'tech-ss',
   'Spark Runtime\n(Databricks Engine)',
   'Technology: System Software\n(assigned to Node)')

# Application Function on the System Software
el(368,376,238,72, 'app-func',
   'ETL / ELT\nProcessing Jobs',
   'Application Function\n(realized by Sys Software)')

# ── MEDALLION DATA LAYERS ──────────────────────────────────────────────
# Each layer: Technology:Artifact (physical storage) + App:Data Object (logical)

# BRONZE
_artifact(625,200,170,72,
          'BRONZE\nRaw Data Files\n(ADLS Gen2)',
          'Technology: Artifact\n(raw physical storage)',
          BRONZ)
el(625,288,170,72, 'app-dataobj',
   'Bronze\nData Objects\n(raw schema)',
   'Application: Data Object\n(realized by Artifact)', APP)

# SILVER
_artifact(810,200,170,72,
          'SILVER\nCleansed Data Files\n(ADLS Gen2)',
          'Technology: Artifact\n(validated physical storage)',
          SILV)
el(810,288,170,72, 'app-dataobj',
   'Silver\nData Objects\n(validated schema)',
   'Application: Data Object\n(realized by Artifact)', APP)

# GOLD
_artifact(995,200,170,72,
          'GOLD\nCurated Data Files\n(ADLS Gen2)',
          'Technology: Artifact\n(aggregated physical storage)',
          GOLD_)
el(995,288,170,72, 'app-dataobj',
   'Gold\nData Objects\n(aggregated schema)',
   'Application: Data Object\n(realized by Artifact)', APP)

# ── SERVING LAYER ──────────────────────────────────────────────────────
subnet(368,380,800,175,
       'Serving & Consumption',
       'Application Service + Application Interface (HTTPS / RBAC-governed)',
       ec='#336699',ls=(0,(5,2.5)))

el(378,398,780,68, 'app-svc',
   'Databricks SQL  (replaces Synapse SQL On-Demand)',
   'Application Service\n(externally-visible SQL query behaviour)')

el(378,480,780,68, 'app-iface',
   'HTTPS API Endpoint  (RBAC-governed access)',
   'Application Interface\n(access point through which Service is consumed)')

# ── ENVIRONMENT SEPARATION ─────────────────────────────────────────────
subnet(188,566,1250,142,
       'Environment Separation  –  Dev · Test · Pre-Prod · Prod',
       'Same medallion stack deployed as separate instances per environment',
       ec='#228B22',ls=(0,(5,2.5)))

# Four Technology: Nodes side by side
for i,(elbl,efc,eec) in enumerate([
    ('Prod\nEnvironment',    '#d5f5e3','#1e8449'),
    ('Pre-Prod\nEnvironment','#fef9e7','#b7950b'),
    ('Test\nEnvironment',    '#fde8e8','#cb4335'),
    ('Dev\nEnvironment',     '#eaf4fb','#2e86c1'),
]):
    ex = 198 + i*310
    _node3d(ex,578,295,115, elbl, 'Technology: Node\n(deployment target)', TECH)

# ── SECURITY & STANDARDS ───────────────────────────────────────────────
subnet(188,718,1250,105,
       'Security & Standards',
       'Technology: System Software · Technology: Path · Motivation: Principle',
       ec='#228B22',ls=(0,(4,2)))

el(198,730,230,78, 'tech-ss',
   'Azure AD / RBAC\n(Entra ID)',
   'Technology: System Software\n(identity & access management)')

el(443,730,230,78, 'tech-path',
   'TLS / HTTPS\nTransport',
   'Technology: Path\n(encrypted comms between Nodes)')

el(688,730,265,78, 'principle',
   'Ofgem Cloud-First\nSecurity Principles',
   'Motivation: Principle\n(governing architecture standard)', MOTIV)

el(968,730,230,78, 'gov-comp',
   'Data Governance\n& Lineage Policy',
   'Application Component\n(Purview governance function)', GOV)

# ── REPORTING / CONSUMPTION ────────────────────────────────────────────
el(1652,298,155,72, 'app-comp',
   'Power BI\nReports',
   'Application Component')

el(1652,388,155,72, 'app-comp',
   'Excel / CSV\nExports',
   'Application Component')

el(1652,478,155,72, 'app-iface',
   'External\nSQL Access',
   'Application Interface\n(outbound endpoint)')

# ══════════════════════════════════════════════════════════════════════
#  RELATIONSHIPS
# ══════════════════════════════════════════════════════════════════════

# 1  Source → Ingestion Trigger Event  [Triggering]
rel([[160,474],[186,234]], 'triggering','Triggering')

# 2  Ingestion Event → Orchestrator AppFunc  [Triggering]
rel([[269,270],[269,328]], 'triggering')

# 3  Orchestrator outbound event → ETL AppFunc  [Triggering]
rel([[269,418],[269,412],[340,412],[366,412]], 'triggering','Triggers ETL')

# 4  TechNode ─● TechSysSoft  [Assignment: node runs software]
rel([[487,272],[487,286]], 'assignment','Assignment ●')

# 5  TechSysSoft ─● AppFunc  [Assignment: software executes function]
rel([[487,360],[487,374]], 'assignment','Assignment ●')

# 6  ETL AppFunc → Bronze Artifact  [Access write]
rel([[606,412],[710,350],[710,272]], 'access-w','Access (write)')

# 7  Bronze Artifact realizes Bronze DataObj  [Realization]
rel([[710,272],[710,288]], 'realisation','Realizes')

# 8  Bronze DataObj → Silver Artifact  [Flow – transformation]
rel([[795,324],[808,324]], 'flow','Transform\n(Bronze→Silver)')

# 9  Silver Artifact realizes Silver DataObj  [Realization]
rel([[895,272],[895,288]], 'realisation','Realizes')

# 10 Silver DataObj → Gold Artifact  [Flow – curation]
rel([[980,324],[993,324]], 'flow','Curate\n(Silver→Gold)')

# 11 Gold Artifact realizes Gold DataObj  [Realization]
rel([[1080,272],[1080,288]], 'realisation','Realizes')

# 12 Gold DataObj → Databricks SQL Service  [Serving]
rel([[1080,360],[1080,432],[1160,432]], 'serving','Serving')

# 13 Databricks SQL Service → API Interface  [Realization]
rel([[758,466],[758,478]], 'realisation')

# 14 API Interface → Power BI  [Serving – cross zone]
rel([[1158,514],[1640,334]], 'xserve','Serving (HTTPS)')

# 15 API Interface → Excel  [Serving]
rel([[1158,514],[1640,424]], 'xserve')

# 16 API Interface → External SQL  [Serving]
rel([[1158,514],[1640,514]], 'xserve')

# 17 Purview → Bronze DataObj  [Governance Association]
rel([[363,158],[710,310]], 'gov-assoc','Governs\n(lineage)')

# 18 Azure Monitor → ETL AppFunc  [Association – monitors]
rel([[543,158],[487,376]], 'gov-assoc','Monitors')

# 19 Log Analytics → API Interface  [Association – logs]
rel([[718,158],[758,478]], 'gov-assoc','Logs')

# 20 RBAC → API Interface  [Association – governs access]
rel([[313,730],[550,548]], 'assoc','Governs access')

# 21 Ofgem Principle → CDP Platform  [Influence]
rel([[820,730],[820,600]], 'influence','Influences\n(standard)')

# 22 Data Governance → DataObjs  [Association]
rel([[968,730],[968,600]], 'gov-assoc')

# ══════════════════════════════════════════════════════════════════════
#  LEGEND
# ══════════════════════════════════════════════════════════════════════
lx,ly=178,862
rect(lx,ly,1450,115,'#fffff8','#ccc',lw=1,z=16)
t('RELATIONSHIP KEY:', lx+8,ly+11, ha='left',fs=9,fw='bold',col='#222',z=18)

def rleg(x,y,col,ls,solid,lbl):
    ax.plot([x,x+32],[y,y],color=col,lw=1.4,linestyle=ls,zorder=18)
    fc=col if solid else 'white'
    ax.add_patch(Polygon([(x+32,y),(x+25,y-3.5),(x+25,y+3.5)],
                 closed=True,fc=fc,ec=col,lw=1,zorder=19))
    t(lbl,x+38,y, ha='left',fs=7.5,col=col,z=19)

rleg(lx+130,ly+12,'#cc0000',(0,(5,3)),True,'Flow (data movement)')
rleg(lx+300,ly+12,'#336699','-',True,'Serving')
rleg(lx+390,ly+12,'#336699',(0,(4,2)),True,'Triggering')
rleg(lx+490,ly+12,'#228B22','-',True,'Cross-zone Serving')
rleg(lx+620,ly+12,'#444',(0,(4,2)),False,'Realisation')
rleg(lx+720,ly+12,'#888',(0,(3,2)),False,'Association')
rleg(lx+820,ly+12,'#7B2D8B',(0,(3,2)),False,'Governance Assoc.')
rleg(lx+950,ly+12,'#B7950B',(0,(5,2)),False,'Influence (Motivation)')
# Assignment circle
ax.add_patch(Circle((lx+1110,ly+12),5,fc='#444',ec='#444',lw=0,zorder=19))
ax.plot([lx+1115,lx+1140],[ly+12,ly+12],color='#444',lw=1.4,zorder=18)
ax.add_patch(Polygon([(lx+1140,ly+12),(lx+1133,ly-3.5),(lx+1133,ly+15.5)],
             closed=True,fc='#444',ec='#444',lw=1,zorder=19))
t('Assignment ●',lx+1146,ly+12, ha='left',fs=7.5,col='#444',z=19)
# Access arrows
ax.plot([lx+1280,lx+1312],[ly+12,ly+12],color='#cc0000',lw=1.4,linestyle=(0,(4,2)),zorder=18)
t('W',lx+1318,ly+12, ha='left',fs=7.5,col='#cc0000',z=19)
ax.plot([lx+1340,lx+1372],[ly+12,ly+12],color='#228B22',lw=1.4,linestyle=(0,(4,2)),zorder=18)
t('R = Access write/read',lx+1378,ly+12, ha='left',fs=7.5,col='#555',z=19)

# Colour chips
def chip(x,y,f,e,lbl):
    rect(x,y,13,11,f,e,lw=1,z=18)
    t(lbl,x+17,y+5.5, ha='left',fs=7.5,col='#333',z=19)

chip(lx+8,  ly+32,'#FFFACC','#B8860B','Business Layer')
chip(lx+118,ly+32,'#CCE0FF','#336699','Application Layer')
chip(lx+238,ly+32,'#CCFFCC','#228B22','Technology Layer')
chip(lx+358,ly+32,'#F0E6FF','#7B2D8B','Governance Layer')
chip(lx+478,ly+32,'#FEF9E7','#B7950B','Motivation Layer (Principle)')
chip(lx+638,ly+32,'#F5CBA7','#A04000','Bronze Artifact')
chip(lx+748,ly+32,'#D5D8DC','#566573','Silver Artifact')
chip(lx+858,ly+32,'#FAD7A0','#B7950B','Gold Artifact')

# Badge key row
t('BADGE KEY:', lx+8,ly+56, ha='left',fs=8,fw='bold',col='#222',z=18)
for i,(fn,c,lbl) in enumerate([
    (badge_svc,    BIZ,  'Biz\nService'),
    (badge_comp,   APP,  'App\nComponent'),
    (badge_svc,    APP,  'App\nService'),
    (badge_func,   APP,  'App\nFunction'),
    (badge_event,  APP,  'App\nEvent ⚡'),
    (badge_dataobj,APP,  'App Data\nObject 🥁'),
    (badge_iface,  APP,  'App\nInterface ○'),
    (badge_ss,     TECH, 'Tech Sys\nSoftware'),
    (badge_art,    TECH, 'Tech\nArtifact'),
    (badge_path,   TECH, 'Tech\nPath ○○'),
    (badge_principle,MOTIV,'Motivation\nPrinciple P'),
    (badge_comp,   GOV,  'Gov\nComponent'),
]):
    bkx = lx+88 + i*105
    fn(bkx, ly+52, c)
    for j,l in enumerate(lbl.split('\n')):
        t(l, bkx+11, ly+76+j*9, fs=6.5, col='#555', z=19)

# 3D node in legend
_node3d(lx+88+12*105, ly+52, 22, 22, '', '')
t('Tech\nNode 3D', lx+88+12*105+6, ly+76, fs=6.5, col='#555', z=19)
t('', lx+88+12*105+6, ly+84, fs=6.5, col='#555', z=19)

t('Red italic = exact ArchiMate 3 palette item  |  '
  '● = Assignment (Node hosts SysSoft)  |  '
  '◁╌╌ = Realisation (Artifact realizes DataObj)',
  lx+8,ly+106, ha='left',fs=7.5,col='#cc0000',it=True,z=19)

out='/home/user/journalist-map/archimate_hld2_specific.png'
plt.savefig(out, dpi=130, bbox_inches='tight',
            facecolor='white', pad_inches=0.05)
print(f'Saved → {out}')
