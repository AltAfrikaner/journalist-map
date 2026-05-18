#!/usr/bin/env python3
"""CDP Medallion Architecture — ArchiMate 3 HLD using correct palette icons."""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Polygon, Circle, Ellipse
import numpy as np

W, H = 2700, 1850
fig, ax = plt.subplots(figsize=(W/100, H/100), dpi=100)
ax.set_xlim(0, W); ax.set_ylim(H, 0); ax.axis('off')
fig.patch.set_facecolor('white')

APP   = dict(f='#DCE9FF', e='#2255AA', t='#1a3a80')
TECH  = dict(f='#D4EDDA', e='#196F3D', t='#145a32')
GOV   = dict(f='#EDE7F6', e='#6A1B9A', t='#4a1272')
BRONZ = dict(f='#FDEBD0', e='#9C640C', t='#6e4409')
SILV  = dict(f='#EAECEE', e='#5D6D7E', t='#2c3e50')
GOLD_ = dict(f='#FEF9C3', e='#B7950B', t='#7d6608')

def bx(x,y,w,h,fc,ec,lw=1.5,z=2,alpha=1.0,ls='-'):
    ax.add_patch(FancyBboxPatch((x,y),w,h,boxstyle='square,pad=0',
                 fc=fc,ec=ec,lw=lw,zorder=z,alpha=alpha,ls=ls))

def tx(s,x,y,fs=10,fw='normal',col='#111',z=6,ha='center',va='center'):
    ax.text(x,y,s,fontsize=fs,fontweight=fw,color=col,zorder=z,ha=ha,va=va)

def arr(x1,y1,x2,y2,col='#444',lw=1.5,ls='solid',rad=0.0,lbl=''):
    ax.annotate('',xy=(x2,y2),xytext=(x1,y1),zorder=8,
        arrowprops=dict(arrowstyle='->',color=col,lw=lw,linestyle=ls,
                        connectionstyle=f'arc3,rad={rad}'))
    if lbl:
        tx(lbl,(x1+x2)/2,(y1+y2)/2-12,fs=7.5,col=col,z=9)

# ── Badges ───────────────────────────────────────────────────────────
def badge_comp(bx_,by_,c):
    bx(bx_,by_,22,22,'white',c['e'],lw=1.2,z=9)
    bx(bx_-5,by_+3,9,6,c['f'],c['e'],lw=1,z=10)
    bx(bx_-5,by_+12,9,6,c['f'],c['e'],lw=1,z=10)

def badge_event(bx_,by_,c):
    bx(bx_,by_,22,22,'white',c['e'],lw=1.2,z=9)
    pts=np.array([[bx_+15,by_+2],[bx_+8,by_+12],[bx_+13,by_+12],
                  [bx_+8,by_+20],[bx_+18,by_+10],[bx_+13,by_+10]])
    ax.add_patch(Polygon(pts,closed=True,fc=c['e'],ec='none',zorder=10))

def badge_dataobj(bx_,by_,c):
    bx(bx_,by_,22,18,'white',c['e'],lw=1.2,z=9)
    for yi in [by_+5,by_+10,by_+15]:
        ax.plot([bx_+2,bx_+20],[yi,yi],color=c['e'],lw=0.9,zorder=10)

def badge_iface(bx_,by_,c):
    bx(bx_,by_+4,13,14,'white',c['e'],lw=1.2,z=9)
    ax.plot([bx_+13,bx_+18],[by_+11,by_+11],color=c['e'],lw=1.3,zorder=10)
    ax.add_patch(Circle((bx_+23,by_+11),5,fc='none',ec=c['e'],lw=1.4,zorder=10))

def badge_node3d(bx_,by_,c):
    bx(bx_+5,by_+7,16,14,c['f'],c['e'],lw=1.2,z=9)
    top=np.array([[bx_+5,by_+7],[bx_+10,by_+2],[bx_+26,by_+2],[bx_+21,by_+7]])
    ax.add_patch(Polygon(top,closed=True,fc=c['f'],ec=c['e'],lw=1.2,zorder=9))
    right=np.array([[bx_+21,by_+7],[bx_+26,by_+2],[bx_+26,by_+16],[bx_+21,by_+21]])
    ax.add_patch(Polygon(right,closed=True,fc='#b8d4b8',ec=c['e'],lw=1.2,zorder=9))

def badge_syssw(bx_,by_,c):
    ax.add_patch(Ellipse((bx_+10,by_+5),20,8,fc=c['f'],ec=c['e'],lw=1.2,zorder=9))
    bx(bx_,by_+5,20,14,c['f'],'none',lw=0,z=8)
    ax.plot([bx_,bx_],[by_+5,by_+19],color=c['e'],lw=1.2,zorder=9)
    ax.plot([bx_+20,bx_+20],[by_+5,by_+19],color=c['e'],lw=1.2,zorder=9)
    ax.plot([bx_,bx_+20],[by_+19,by_+19],color=c['e'],lw=1.2,zorder=9)
    ax.add_patch(Ellipse((bx_+10,by_+19),20,8,fc=c['f'],ec=c['e'],lw=1.2,zorder=10))

def badge_artifact(bx_,by_,c):
    fold=8
    pts=np.array([[bx_,by_],[bx_+15,by_],[bx_+23,by_+fold],
                  [bx_+23,by_+26],[bx_,by_+26]])
    ax.add_patch(Polygon(pts,closed=True,fc=c['f'],ec=c['e'],lw=1.2,zorder=9))
    ax.add_patch(Polygon([[bx_+15,by_],[bx_+15,by_+fold],[bx_+23,by_+fold]],
                         closed=True,fc='white',ec=c['e'],lw=1.2,zorder=10))

def el(x,y,w,h,name,bfn,c,sub='',fs=10):
    bx(x,y,w,h,c['f'],c['e'],lw=1.8,z=3)
    bfn(x+w-30,y+5,c)
    cx=x+(w-28)/2
    cy=y+h/2
    tx(name,cx,cy-(9 if sub else 0),fs=fs,fw='bold',col=c['t'],z=6)
    if sub: tx(sub,cx,cy+10,fs=7.5,col=c['t'],z=6)

# ════════════════════════════════════════════════════════════════════
# CDP  (Technology: Node — outer boundary)
# ════════════════════════════════════════════════════════════════════
bx(100,60,2020,1720,TECH['f'],TECH['e'],lw=3,z=1,alpha=0.18)
bx(100,60,2020,1720,'none',TECH['e'],lw=3,z=2)
badge_node3d(104,64,TECH)
tx('CDP',1115,96,fs=15,fw='bold',col=TECH['t'],z=7)
tx('Technology: Node',1115,118,fs=8,col=TECH['t'],z=7)

# ════════════════════════════════════════════════════════════════════
# Governance band  (Grouping)
# ════════════════════════════════════════════════════════════════════
bx(110,145,2005,210,GOV['f'],GOV['e'],lw=1.5,z=2,alpha=0.55)
tx('Governance & Observability',1115,170,fs=12,fw='bold',col=GOV['t'],z=7)

el(260,188,295,145,'Purview',      badge_syssw,TECH,'Tech: System Software',fs=9)
el(620,188,315,145,'Azure Monitor',badge_syssw,TECH,'Tech: System Software',fs=9)
el(1000,188,315,145,'Log Analytics',badge_syssw,TECH,'Tech: System Software',fs=9)

# ════════════════════════════════════════════════════════════════════
# Orchestrator  (Application: Component)
# ════════════════════════════════════════════════════════════════════
bx(115,385,375,530,APP['f'],APP['e'],lw=2,z=2)
badge_comp(462,389,APP)
tx('Orchestrator',290,422,fs=12,fw='bold',col=APP['t'],z=6)
tx('Application: Component',290,443,fs=7.5,col=APP['t'],z=6)

# Ingestion Event (nested inside Orchestrator)
bx(132,490,340,125,'#c8dcff',APP['e'],lw=1.3,z=4)
badge_event(444,494,APP)
tx('Ingestion Event',285,540,fs=10,fw='bold',col=APP['t'],z=6)
tx('Application: Event',285,562,fs=7.5,col=APP['t'],z=6)

# ════════════════════════════════════════════════════════════════════
# Databricks Engineering  (Application: Component)
# ════════════════════════════════════════════════════════════════════
bx(515,385,1600,960,APP['f'],APP['e'],lw=2,z=2,alpha=0.35)
badge_comp(2087,389,APP)
tx('Databricks Engineering',1315,422,fs=12,fw='bold',col=APP['t'],z=6)
tx('Application: Component',1315,443,fs=7.5,col=APP['t'],z=6)

# ── BRONZE  ──────────────────────────────────────────────────────────
bx(533,465,415,215,BRONZ['f'],BRONZ['e'],lw=2,z=4)
badge_artifact(914,469,BRONZ)
tx('BRONZE',728,502,fs=13,fw='bold',col=BRONZ['t'],z=6)
tx('Technology: Artifact',728,523,fs=7.5,col=BRONZ['t'],z=6)
bx(547,542,387,120,'#fff5e8',BRONZ['e'],lw=1.2,z=5)
badge_dataobj(906,546,BRONZ)
tx('Raw Data',723,582,fs=9.5,fw='bold',col=BRONZ['t'],z=6)
tx('Application: Data Object',723,602,fs=7.5,col=BRONZ['t'],z=6)

# ── SILVER  ──────────────────────────────────────────────────────────
bx(968,465,415,215,SILV['f'],SILV['e'],lw=2,z=4)
badge_artifact(1349,469,SILV)
tx('SILVER',1163,502,fs=13,fw='bold',col=SILV['t'],z=6)
tx('Technology: Artifact',1163,523,fs=7.5,col=SILV['t'],z=6)
bx(982,542,387,120,'#f0f0f0',SILV['e'],lw=1.2,z=5)
badge_dataobj(1341,546,SILV)
tx('Cleaned Data',1158,582,fs=9.5,fw='bold',col=SILV['t'],z=6)
tx('Application: Data Object',1158,602,fs=7.5,col=SILV['t'],z=6)

# ── GOLD  ────────────────────────────────────────────────────────────
bx(1403,465,415,215,GOLD_['f'],GOLD_['e'],lw=2,z=4)
badge_artifact(1784,469,GOLD_)
tx('GOLD',1598,502,fs=13,fw='bold',col=GOLD_['t'],z=6)
tx('Technology: Artifact',1598,523,fs=7.5,col=GOLD_['t'],z=6)
bx(1417,542,387,120,'#fffce6',GOLD_['e'],lw=1.2,z=5)
badge_dataobj(1776,546,GOLD_)
tx('Curated Data',1593,582,fs=9.5,fw='bold',col=GOLD_['t'],z=6)
tx('Application: Data Object',1593,602,fs=7.5,col=GOLD_['t'],z=6)

# ── API  (Application: Interface, inside DB Eng) ─────────────────────
bx(1838,465,255,215,APP['f'],APP['e'],lw=2,z=4)
badge_iface(2065,469,APP)
tx('API',1945,545,fs=13,fw='bold',col=APP['t'],z=6)
tx('App: Interface',1945,567,fs=7.5,col=APP['t'],z=6)
tx('HTTPS / Standards',1945,587,fs=7.5,col=APP['t'],z=6)

# ── Environment Nodes (Technology: Node × 4) ─────────────────────────
env_cfg=[('Prod','#e8f5e9','#2e7d32'),('Pre-Prod','#e3f2fd','#1565c0'),
         ('Test','#fff3e0','#e65100'),('Dev','#fce4ec','#880e4f')]
for i,(name,fc,ec) in enumerate(env_cfg):
    ey=710+i*158
    bx(533,ey,1560,148,fc,ec,lw=1.5,z=3,alpha=0.62)
    badge_node3d(538,ey+6,dict(f=fc,e=ec,t=ec))
    tx(name,700,ey+52,fs=11,fw='bold',col=ec,z=6)
    tx('Technology: Node',700,ey+73,fs=7.5,col=ec,z=6)

# ════════════════════════════════════════════════════════════════════
# Source  (Technology: Node, OUTSIDE CDP)
# ════════════════════════════════════════════════════════════════════
el(15,890,235,145,'Source',badge_node3d,TECH,'Technology: Node',fs=10)

# ════════════════════════════════════════════════════════════════════
# Reporting Tools  (Application: Component, OUTSIDE CDP)
# ════════════════════════════════════════════════════════════════════
bx(2140,730,450,240,APP['f'],APP['e'],lw=2,z=3)
badge_comp(2562,734,APP)
tx('Reporting Tools',2348,778,fs=11,fw='bold',col=APP['t'],z=6)
tx('Application: Component',2348,800,fs=7.5,col=APP['t'],z=6)
bx(2155,830,420,118,'#d0e6ff',APP['e'],lw=1.2,z=5)
badge_dataobj(2547,834,APP)
tx('PowerBI / Excel / CSV',2345,872,fs=9.5,fw='bold',col=APP['t'],z=6)
tx('Application: Data Object',2345,893,fs=7.5,col=APP['t'],z=6)

# ════════════════════════════════════════════════════════════════════
# RELATIONSHIPS
# ════════════════════════════════════════════════════════════════════
# Source → Databricks Engineering  (Triggering)
arr(250,963,515,963,col='#444',lw=2.0,lbl='Triggering')

# Orchestrator → Databricks Engineering  (Triggering)
arr(490,640,515,640,col=APP['e'],lw=2.0,lbl='Triggering')

# BRONZE → SILVER  (Flow)
arr(948,520,968,520,col=BRONZ['e'],lw=2.2,lbl='Flow')

# SILVER → GOLD  (Flow)
arr(1383,520,1403,520,col=SILV['e'],lw=2.2,lbl='Flow')

# GOLD → API  (Serving, dashed)
arr(1818,560,1838,560,col=GOLD_['e'],lw=1.8,ls='dashed',lbl='Serving')

# API → Purview, Azure Monitor, Log Analytics  (Serving)
arr(1960,465,407,333,col=APP['e'],lw=1.5,ls='dashed',rad=-0.25,lbl='Serving')
arr(1960,465,777,333,col=APP['e'],lw=1.5,ls='dashed',rad=-0.12)
arr(1960,465,1157,333,col=APP['e'],lw=1.5,ls='dashed',rad=-0.04)

# GOLD → Reporting Tools  (Serving)
arr(1818,570,2140,810,col=GOLD_['e'],lw=1.8,ls='dashed',rad=0.18,lbl='Serving')

# Realisation indicators (small label on BRONZE/SILVER/GOLD Data Objects)
for xi,yi in [(547,542),(982,542),(1417,542)]:
    tx('◁╌ Realisation',xi+193,yi-10,fs=7,col='#888',z=8)

# ════════════════════════════════════════════════════════════════════
# LEGEND
# ════════════════════════════════════════════════════════════════════
ly=1570
bx(115,ly,1995,210,'white','#bbb',lw=1.2,z=2,alpha=0.93)
tx('LEGEND',1110,ly+28,fs=10,fw='bold',col='#333',z=7)

badges_legend=[
    ('App: Component', badge_comp,    APP,   120),
    ('App: Event',     badge_event,   APP,   355),
    ('App: Data Obj.', badge_dataobj, APP,   590),
    ('App: Interface', badge_iface,   APP,   825),
    ('Tech: Node',     badge_node3d,  TECH,  1060),
    ('Tech: Sys. Sw.', badge_syssw,   TECH,  1295),
    ('Tech: Artifact', badge_artifact,TECH,  1580),
]
for name,fn,c,lx in badges_legend:
    fn(lx+115,ly+50,c)
    tx(name,lx+155,ly+103,fs=7.5,col=c['t'],z=7)

rels_legend=[
    ('Triggering →','#444','-'),
    ('Flow →',BRONZ['e'],'-'),
    ('Serving - →',APP['e'],'--'),
    ('Realisation ◁╌','#888','--'),
]
for i,(name,col,ls) in enumerate(rels_legend):
    rx=140+i*490
    ax.plot([rx,rx+55],[ly+165,ly+165],color=col,lw=2,ls=ls,zorder=7)
    ax.annotate('',xy=(rx+55,ly+165),xytext=(rx+44,ly+165),
        arrowprops=dict(arrowstyle='->',color=col,lw=1.5),zorder=8)
    tx(name,rx+105,ly+165,fs=7.5,col=col,z=7,ha='left')

out='/home/user/journalist-map/archimate_hld_final.png'
plt.savefig(out,dpi=100,bbox_inches='tight',facecolor='white')
print('Saved →',out)
