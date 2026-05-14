"""
Render ArchiMate Synapse-Replacement HLD as a PNG image.
Uses matplotlib for all drawing; no browser required.
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Polygon, Wedge, Circle, Ellipse
import numpy as np

# ── Canvas ─────────────────────────────────────────────────────────────
W, H = 1680, 1040
fig  = plt.figure(figsize=(W/100, H/100), dpi=130)
ax   = fig.add_axes([0, 0, 1, 1])
ax.set_xlim(0, W)
ax.set_ylim(H, 0)      # y increases downward
ax.axis('off')
fig.patch.set_facecolor('white')
ax.set_facecolor('white')

# ── Layer colour palette ───────────────────────────────────────────────
BIZ  = dict(f='#FFFACC', e='#B8860B', t='#5a3200')
APP  = dict(f='#CCE0FF', e='#336699', t='#0e2860')
TECH = dict(f='#CCFFCC', e='#228B22', t='#0a3a0a')

def _col(tp):
    if tp.startswith('biz'):                   return BIZ
    if tp in ('app-comp','app-svc','app-func'):return APP
    return TECH

# ── Primitive helpers ──────────────────────────────────────────────────
def rect(x,y,w,h, fc, ec, lw=1.5, ls='-', z=3):
    ax.add_patch(Rectangle((x,y),w,h,
                 linewidth=lw, edgecolor=ec, facecolor=fc,
                 linestyle=ls, zorder=z))

def t(s, x, y, ha='center', va='center',
      fs=9, fw='normal', col='#222', it=False, z=10):
    ax.text(x, y, s, ha=ha, va=va, fontsize=fs, fontweight=fw,
            color=col, style='italic' if it else 'normal', zorder=z)

def pal(label, cx, cy):
    t(label, cx, cy, fs=7.5, col='#cc0000', it=True, z=11)

# ── Zone / subnet outlines ─────────────────────────────────────────────
def zone(x,y,w,h, label, sub, ec, fc, lw=2.2):
    rect(x,y,w,h, fc, ec, lw=lw, ls=(0,(8,3)), z=1)
    tc = '#7a5010' if ec=='#B8860B' else ('#1a5a1a' if ec=='#228B22' else '#1a3a6a')
    t(label, x+w/2, y+17, fs=11, fw='bold', col=tc, z=12)
    t(sub,   x+w/2, y+29, fs=7.5, col='#cc0000', it=True, z=12)

def subnet(x,y,w,h, label, sub, ec='#336699'):
    rect(x,y,w,h, '#d0e0f010', ec, lw=1.4, ls=(0,(5,2.5)), z=2)
    t(label, x+w/2, y+13, fs=9, fw='bold', col='#1a3a6a', z=12)
    t(sub,   x+w/2, y+24, fs=7.5, col='#cc0000', it=True, z=12)

# ═══════════════════════════════════════════════════════════════════════
#  BADGE ICONS  (drawn in a ~22×22 area at bx,by)
# ═══════════════════════════════════════════════════════════════════════

def badge_svc(bx,by, c):          # Business / App Service: box + lollipop
    rect(bx,by+2,13,16, c['f'],c['e'], lw=1.2, z=8)
    ax.add_patch(Wedge((bx+17,by+10), 5, -90, 90,
                       facecolor=c['e'], lw=0, zorder=8))

def badge_comp(bx,by, c):         # Application Component: body + two tabs
    rect(bx,   by+3,12,15, 'white', c['e'], lw=1.2, z=8)
    rect(bx+9, by+4,11, 5, 'white', c['e'], lw=1.2, z=8)
    rect(bx+9, by+12,11,5, 'white', c['e'], lw=1.2, z=8)

def badge_func(bx,by, c):         # Application Function: f() box
    rect(bx,by,20,20, 'white',c['e'], lw=1.2, z=8)
    t('f()', bx+10, by+11, fs=11, fw='bold', col=c['e'], it=True, z=9)

def badge_ss(bx,by, c):           # System Software: cylinder
    ax.add_patch(Ellipse((bx+10,by+4), 18,7,
                         facecolor=c['f'], edgecolor=c['e'], lw=1.2, zorder=8))
    rect(bx+1,by+4,18,14, c['f'],'none', lw=0, z=7)
    ax.plot([bx+1,bx+1,  bx+19],[by+4,by+18,by+18],color=c['e'],lw=1.2,zorder=8)
    ax.plot([bx+19,bx+19],[by+4,by+18], color=c['e'],lw=1.2,zorder=8)
    ax.add_patch(Ellipse((bx+10,by+18),18,7,
                         facecolor='#e8ffe8', edgecolor=c['e'], lw=1.2, zorder=9))

def badge_cnet(bx,by, c):         # Communication Network: hub & spoke
    ax.add_patch(Circle((bx+10,by+10),3.5, facecolor=c['e'], zorder=8))
    for deg in [45,135,225,315]:
        a = np.radians(deg)
        nx,ny = bx+10+np.cos(a)*8, by+10+np.sin(a)*8
        ax.add_patch(Circle((nx,ny),2.5, facecolor='white',
                             edgecolor=c['e'], lw=1.1, zorder=8))
        ax.plot([bx+10+np.cos(a)*3.5, nx-np.cos(a)*2.5],
                [by+10+np.sin(a)*3.5, ny-np.sin(a)*2.5],
                color=c['e'], lw=1.1, zorder=7)

def badge_cpath(bx,by, c):        # Communication Path: ○──○
    ax.add_patch(Circle((bx+4, by+10),4, fc='none', ec=c['e'], lw=1.4, zorder=8))
    ax.add_patch(Circle((bx+18,by+10),4, fc='none', ec=c['e'], lw=1.4, zorder=8))
    ax.plot([bx+8,bx+14],[by+10,by+10], color=c['e'], lw=1.4, zorder=8)

def draw_badge(bx,by, tp, c):
    if   tp in ('biz-svc','app-svc'): badge_svc(bx,by,c)
    elif tp == 'app-comp':  badge_comp(bx,by,c)
    elif tp == 'app-func':  badge_func(bx,by,c)
    elif tp == 'tech-ss':   badge_ss(bx,by,c)
    elif tp == 'comm-net':  badge_cnet(bx,by,c)
    elif tp == 'comm-path': badge_cpath(bx,by,c)

# ═══════════════════════════════════════════════════════════════════════
#  ELEMENT SHAPES
# ═══════════════════════════════════════════════════════════════════════

def _text_block(name, palette, cx, cy, maxw, col):
    """Center multi-line name + palette label."""
    lines = name.split('\n')
    fs  = 7.5 if len(lines) > 2 else 9
    lh  = fs + 4
    oy  = -(len(lines)-1) * lh / 2
    for i, ln in enumerate(lines):
        t(ln, cx, cy+oy+i*lh, fs=fs, fw='bold' if i==0 else 'normal', col=col, z=6)
    pal(palette, cx, cy + abs(oy) + len(lines)*lh*0.4)

def el(x,y,w,h, tp, name, palette):
    c = _col(tp)
    if   tp == 'tech-node': _node3d(x,y,w,h,name,palette)
    elif tp == 'tech-art':  _artifact(x,y,w,h,name,palette)
    else:
        rect(x,y,w,h, c['f'],c['e'], lw=1.5, z=3)
        draw_badge(x+w-25, y+2, tp, c)
        _text_block(name, palette, x+w/2, y+h/2-7, w-32, c['t'])

def _node3d(x,y,w,h, name, palette, D=10):
    fw, fh = w-D, h-D
    ax.add_patch(Polygon(
        [[x+fw,y+D],[x+w,y],[x+w,y+fh],[x+fw,y+D+fh]],
        closed=True, fc='#aaddaa', ec=TECH['e'], lw=1.5, zorder=3))
    ax.add_patch(Polygon(
        [[x,y+D],[x+D,y],[x+D+fw,y],[x+fw,y+D]],
        closed=True, fc='#eeffee', ec=TECH['e'], lw=1.5, zorder=3))
    rect(x, y+D, fw, fh, TECH['f'], TECH['e'], lw=1.5, z=4)
    _text_block(name, palette, x+fw/2, y+D+fh/2-7, fw-10, TECH['t'])

def _artifact(x,y,w,h, name, palette, fold=12):
    ax.add_patch(Polygon(
        [[x,y],[x+w-fold,y],[x+w,y+fold],[x+w,y+h],[x,y+h]],
        closed=True, fc=TECH['f'], ec=TECH['e'], lw=1.5, zorder=3))
    ax.plot([x+w-fold,x+w-fold,x+w],[y,y+fold,y+fold],
            color=TECH['e'], lw=1.5, zorder=4)
    _text_block(name, palette, x+(w-fold*.6)/2, y+h/2-7, w-fold-4, TECH['t'])

# ═══════════════════════════════════════════════════════════════════════
#  RELATIONSHIPS
# ═══════════════════════════════════════════════════════════════════════

_RSTYLES = {
    'flow':       ('#cc0000', (0,(6,3)),  True),
    'serving':    ('#336699', '-',        True),
    'triggering': ('#336699', (0,(4,2)),  True),
    'realisation':('#666',    (0,(4,2)),  False),
    'access':     ('#888',    (0,(4,2)),  False),
    'assoc':      ('#888',    (0,(3,2)),  False),
    'xserve':     ('#228B22', (0,(5,2.5)),True),
    'compose':    ('#444',    '-',        True),
}

def rel(pts, style='flow', label=None):
    col, ls, solid = _RSTYLES.get(style, _RSTYLES['flow'])
    xs, ys = zip(*pts)
    ax.plot(xs, ys, color=col, lw=1.4, linestyle=ls, zorder=7,
            solid_capstyle='round', solid_joinstyle='round')

    # Arrow tip at destination
    dx = pts[-1][0]-pts[-2][0];  dy = pts[-1][1]-pts[-2][1]
    n  = np.hypot(dx,dy)
    if n > 0: dx,dy = dx/n, dy/n
    px,py = -dy, dx
    tip   = pts[-1]; sz = 7
    fc    = col if solid else 'white'
    ax.add_patch(Polygon(
        [tip,
         (tip[0]-dx*sz+px*sz*.5, tip[1]-dy*sz+py*sz*.5),
         (tip[0]-dx*sz-px*sz*.5, tip[1]-dy*sz-py*sz*.5)],
        closed=True, fc=fc, ec=col, lw=1, zorder=9))

    # Filled diamond at origin for composition
    if style == 'compose':
        p0=pts[0]; p1=pts[1]
        ddx=p1[0]-p0[0]; ddy=p1[1]-p0[1]; dn=np.hypot(ddx,ddy)
        if dn>0: ddx,ddy=ddx/dn,ddy/dn
        ppx,ppy=-ddy,ddx
        ax.add_patch(Polygon(
            [p0,
             (p0[0]+ppx*5+ddx*8,  p0[1]+ppy*5+ddy*8),
             (p0[0]+ddx*16,       p0[1]+ddy*16),
             (p0[0]-ppx*5+ddx*8,  p0[1]-ppy*5+ddy*8)],
            closed=True, fc='#444', ec='#444', zorder=10))

    if label:
        mi  = max(1, len(pts)//2)
        lx  = (pts[mi-1][0]+pts[mi][0])/2
        ly  = (pts[mi-1][1]+pts[mi][1])/2
        t(label, lx, ly-3, fs=7.5, col=col, it=True, z=9)

# ═══════════════════════════════════════════════════════════════════════
#  DRAW DIAGRAM
# ═══════════════════════════════════════════════════════════════════════

# Layer tints
ax.add_patch(Rectangle((0,55),  W,105, fc='#fffacc',alpha=.14,ec='none',zorder=0))
ax.add_patch(Rectangle((0,160), W,465, fc='#cce0ff',alpha=.11,ec='none',zorder=0))
ax.add_patch(Rectangle((0,625), W,385, fc='#ccffcc',alpha=.11,ec='none',zorder=0))

# ── Outer zones ───────────────────────────────────────────────────────
zone( 5,  55,170,950,'Data Sources',         '«Grouping»','#B8860B','#fffdf020')
zone(183,  55,912,950,'Processing and Orchestration','«Grouping»','#336699','#e6f0ff28')
zone(1103, 55,572,950,'Presentation / Consumption\n/ Downstream','«Grouping»','#228B22','#d5ffd528')

# ── Sub-zone subnets ──────────────────────────────────────────────────
subnet(193, 94,390,316,'Ofgem Delegated Subnet (ingestion)',
       'Technology: Communication Network')
badge_cnet(562,94,TECH)

subnet(193,424,504,444,'CDP Subnet','Technology: Network','#228B22')
badge_cnet(675,424,TECH)

subnet(1113, 94,554,318,'Ofgem Delegated Subnet (presentation)',
       'Technology: Communication Network')
badge_cnet(1645,94,TECH)

# ── Data Sources ──────────────────────────────────────────────────────
el(15,340,152,82,  'biz-svc',
   'Sharepoint /\nAPI etc',
   'Business Service')

# ── Ingestion subnet ──────────────────────────────────────────────────
el(205,130,176,72, 'app-comp',
   'Power Platform\nInjected Container',
   'Application Component')

el(392,130,187,72, 'app-svc',
   'Blob Storage Connector\n(WRITE)',
   'Application Service')

# ── CDP Subnet ────────────────────────────────────────────────────────
el(205,458,228,88, 'tech-art',
   'CDP Blob Storage\nLanding Zone\nuksdevfdevcdpsa',
   'Technology: Artifact')

el(205,560,228,80, 'tech-ss',
   'Azure Defender\nMalware scanning',
   'Technology: System Software')

el(448,458,240,122,'app-func',
   'Orchestration Layer\n· Workflow orchestration\n· Validate schema / Metadata\n· Reliable streaming\n· Run-not capability',
   'Application Function')

el(448,712,240,80, 'tech-ss',
   'Data Lake Ignite /\nAzure Databricks',
   'Technology: System Software')

# ── Data Lake area ────────────────────────────────────────────────────
el(720,424,192,82, 'tech-node',
   'Data Lake\nStorage Account',
   'Technology: Node')

el(720,519,192,80, 'tech-art',
   'Data Lake Gen2',
   'Technology: Artifact')

el(720,612,234,84, 'tech-node',
   'CDP Databricks\nPrivate Endpoint\n(Processing)',
   'Technology: Node')

el(720,710,234,86, 'app-svc',
   'Structured Data\nAvailable for Access\nuksdevfdevcdpdatadlsa',
   'Application Service')

el(968,612,122,84, 'app-comp',
   'Azure Monitor\nDashboard',
   'Application Component')

el(968,710,122,86, 'app-comp',
   'Log Analytics\nWorkspace',
   'Application Component')

# ── Presentation zone ─────────────────────────────────────────────────
el(1123,130,178,72,'app-comp',
   'Power Platform\nInjected Container',
   'Application Component')

el(1123,218,535,84,'app-svc',
   'Data Lake Gen2 Connector\n(READ ONLY – scoped by RBAC)',
   'Application Service')

el(1113,430,558,80,'app-func',
   'BPI Refresh\nthrough Logic App',
   'Application Function')

el(1113,524,558,80,'comm-path',
   'TLS Encrypted (HTTPS 443)\nPrivate Endpoints only',
   'Technology: Communication Path')

el(1113,618,558,82,'app-comp',
   'Power BI\nReports / Dashboards',
   'Application Component')

# ═══════════════════════════════════════════════════════════════════════
#  RELATIONSHIPS
# ═══════════════════════════════════════════════════════════════════════

# 1  Sharepoint → Blob Storage WRITE  [Flow]
rel([[167,381],[295,240],[390,166]], 'flow','Flow')

# 2  Power Platform In → Blob Storage [Serving]
rel([[381,166],[390,166]], 'serving')

# 3  Blob Storage → CDP Landing Zone  [Flow + label]
rel([[485,202],[485,318],[355,390],[319,456]], 'flow','Data enters ↓')

# 4  CDP LZ → Azure Defender          [Association]
rel([[319,546],[319,558]], 'assoc')

# 5  Azure Defender → Orchestration   [Triggering]
rel([[433,598],[448,532]], 'triggering','Triggering')

# 6  Orchestration → Data Lake Gen2   [Flow]
rel([[688,520],[718,549]], 'flow','Flow')

# 7  DL Storage Account ◆→ DL Gen2   [Composition]
rel([[816,506],[816,519]], 'compose')

# 8  DL Gen2 → CDP Databricks         [Serving]
rel([[816,599],[816,612]], 'serving','Serving')

# 9  CDP Databricks → Structured Data [Flow]
rel([[837,696],[837,710]], 'flow')

# 10 Azure Databricks → CDP Databricks [Realisation]
rel([[568,712],[720,652]], 'realisation','Realisation')

# 11 Azure Databricks → Azure Monitor  [Association]
rel([[688,752],[966,650]], 'assoc','Association')

# 12 Azure Monitor ◆→ Log Analytics   [Composition]
rel([[1029,696],[1029,710]], 'compose')

# 13 Structured Data → Power BI        [Cross-zone Serving]
rel([[954,753],[1060,753],[1105,659]], 'xserve','Serving')

# 14 DL Gen2 Connector → Structured Data  [Access]
rel([[1121,260],[1085,405],[1065,565],[1065,730],[954,753]],
    'access','Access (READ)')

# 15 BPI Refresh → DL Gen2 Connector   [Triggers refresh]
rel([[1392,430],[1392,304]], 'triggering','Triggers Refresh')

# 16 Write-logs annotation
rel([[954,753],[960,800]], 'assoc')
t('Write logs – Diagnostics Enabled',
  966,804, ha='left', fs=7.5, col='#666', it=True, z=9)

# ═══════════════════════════════════════════════════════════════════════
#  LEGEND
# ═══════════════════════════════════════════════════════════════════════
lx, ly = 183, 878

rect(lx,ly,1010,90,'#fffff8','#ccc', lw=1, z=12)
t('RELATIONSHIP KEY:', lx+8,ly+12, ha='left', fs=9, fw='bold', col='#222', z=14)

def rleg(x,y, col, ls, solid, lbl):
    ax.plot([x,x+34],[y,y], color=col, lw=1.4, linestyle=ls, zorder=14)
    fc = col if solid else 'white'
    ax.add_patch(Polygon(
        [(x+34,y),(x+27,y-3.5),(x+27,y+3.5)],
        closed=True, fc=fc, ec=col, lw=1, zorder=15))
    t(lbl, x+40,y, ha='left', fs=8, col=col, z=15)

rleg(lx+130,ly+13,'#cc0000',(0,(5,3)),True,'Flow')
rleg(lx+210,ly+13,'#336699','-',       True,'Serving')
rleg(lx+290,ly+13,'#336699',(0,(4,2)), True,'Triggering')
rleg(lx+395,ly+13,'#228B22',(0,(5,2.5)),True,'Cross-zone Serving')
rleg(lx+555,ly+13,'#888',   (0,(4,2)), False,'Access / Realisation')
rleg(lx+700,ly+13,'#888',   (0,(3,2)), False,'Association')

# Composition diamond
ax.add_patch(Polygon(
    [(lx+820,ly+13),(lx+828,ly+9),(lx+836,ly+13),(lx+828,ly+17)],
    closed=True, fc='#444', ec='#444', zorder=14))
ax.plot([lx+836,lx+850],[ly+13,ly+13],color='#444',lw=1.4,zorder=14)
t('Composition', lx+855,ly+13, ha='left', fs=8, col='#444', z=15)

# Colour chips
def chip(x,y, f,e, lbl):
    rect(x,y,14,12, f,e, lw=1, z=13)
    t(lbl, x+18,y+6, ha='left', fs=8, col='#333', z=15)

chip(lx+8,  ly+34,'#FFFACC','#B8860B','Business Layer')
chip(lx+125,ly+34,'#CCE0FF','#336699','Application Layer')
chip(lx+255,ly+34,'#CCFFCC','#228B22','Technology Layer')
chip(lx+385,ly+34,'#d8e8ff11','#336699','Grouping / Subnet (dashed)')

# Badge key strip
t('BADGE KEY:', lx+8,ly+58, ha='left', fs=8, fw='bold', col='#222', z=14)

bky = ly+50
bkx = lx+95
for fn, col, lbl in [
    (badge_svc,  BIZ,  'Biz\nService'),
    (badge_comp, APP,  'App\nComponent'),
    (badge_svc,  APP,  'App\nService'),
    (badge_func, APP,  'App\nFunction'),
    (badge_ss,   TECH, 'Tech\nSys Soft'),
    (badge_cnet, TECH, 'Comm\nNetwork'),
    (badge_cpath,TECH, 'Comm\nPath'),
]:
    fn(bkx, bky, col)
    for i, l in enumerate(lbl.split('\n')):
        t(l, bkx+11, bky+24+i*9, fs=7, col='#555', z=15)
    bkx += 68

# Mini 3D-node in badge key
_node3d(bkx, bky, 22, 22, '', '')
t('Tech', bkx+5, bky+25, fs=7, col='#555', z=15)
t('Node', bkx+5, bky+33, fs=7, col='#555', z=15)
bkx += 68

# Mini Artifact in badge key
_artifact(bkx, bky, 18, 22, '', '')
t('Tech',   bkx+5, bky+25, fs=7, col='#555', z=15)
t('Artifact',bkx+5,bky+33, fs=7, col='#555', z=15)

t('Red italic text on every element = ArchiMate 3 palette item chosen to guide you',
  lx+8, ly+83, ha='left', fs=8, col='#cc0000', it=True, z=15)

# Title
t('ArchiMate Diagram – Synapse Replacement HLD',
  W/2, 32, fs=14, fw='bold', col='#1a1a2e', z=20)
t('Business  ·  Application  ·  Technology layers   |   Red italic = palette item',
  W/2, 48, fs=9, col='#cc0000', it=True, z=20)

# ─── Export ────────────────────────────────────────────────────────────
out = '/home/user/journalist-map/archimate_synapse.png'
plt.savefig(out, dpi=130, bbox_inches='tight',
            facecolor='white', pad_inches=0.05)
print(f'Saved → {out}')
