#!/usr/bin/env python3
"""CDP Medallion Architecture — connected & arranged, matching Archi visual style."""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Polygon, Circle, Ellipse
import numpy as np

W, H = 3050, 1980
fig, ax = plt.subplots(figsize=(W/100, H/100), dpi=100)
ax.set_xlim(0, W); ax.set_ylim(H, 0); ax.axis('off')
fig.patch.set_facecolor('#F2F2F2')

# ── Colour palettes (Archi visual style) ─────────────────────────────
A  = dict(f='#BDD7EE', e='#1565C0', t='#0D3B7A')   # Application (blue)
T  = dict(f='#B8DDB8', e='#2E7D32', t='#1A4D1F')   # Technology  (green)
B  = dict(f='#FFFF99', e='#9A7D0A', t='#5A4500')   # Business    (yellow)
G  = dict(f='#D9C2F0', e='#6A1B9A', t='#3A0D5E')   # Governance  (purple)
BR = dict(f='#F8D9A8', e='#8B4513', t='#5A2D0C')   # Bronze
SI = dict(f='#D8D8D8', e='#546E7A', t='#263238')   # Silver
GO = dict(f='#F5EBA0', e='#B8860B', t='#7A5800')   # Gold

# ── Drawing helpers ───────────────────────────────────────────────────
def box(x,y,w,h,fc,ec,lw=1.6,z=2,alpha=1.0,ls='-'):
    ax.add_patch(FancyBboxPatch((x,y),w,h,boxstyle='square,pad=0',
                 fc=fc,ec=ec,lw=lw,zorder=z,alpha=alpha,ls=ls))

def tx(s,x,y,fs=10,fw='normal',col='#111',z=6,ha='center',va='center',style='normal'):
    ax.text(x,y,s,fontsize=fs,fontweight=fw,color=col,
            zorder=z,ha=ha,va=va,fontstyle=style)

def arr(x1,y1,x2,y2,col='#333',lw=1.6,ls='solid',rad=0.0,lbl=''):
    ax.annotate('',xy=(x2,y2),xytext=(x1,y1),zorder=10,
        arrowprops=dict(arrowstyle='->',color=col,lw=lw,
                        linestyle=ls,connectionstyle=f'arc3,rad={rad}'))
    if lbl:
        mx,my=(x1+x2)/2,(y1+y2)/2
        tx(lbl,mx,my-11,fs=7.5,col=col,z=11)

# ── ArchiMate badges (top-right corner) ──────────────────────────────
def b_comp(bx,by,c):
    box(bx,by,14,12,c['f'],c['e'],lw=1,z=12)
    box(bx-5,by+4,14,12,c['f'],c['e'],lw=1,z=11)

def b_event(bx,by,c):
    pts=np.array([[bx,by],[bx+12,by],[bx+18,by+9],[bx+12,by+18],[bx,by+18]])
    ax.add_patch(Polygon(pts,closed=True,fc=c['f'],ec=c['e'],lw=1.2,zorder=12))

def b_dataobj(bx,by,c):
    box(bx,by,16,14,c['f'],c['e'],lw=1,z=12)
    for yi in [by+4,by+8,by+12]: ax.plot([bx+2,bx+14],[yi,yi],color=c['e'],lw=0.7,zorder=13)

def b_iface(bx,by,c):
    box(bx,by+3,11,12,c['f'],c['e'],lw=1,z=12)
    ax.plot([bx+11,bx+16],[by+9,by+9],color=c['e'],lw=1.1,zorder=13)
    ax.add_patch(Circle((bx+21,by+9),5,fc='none',ec=c['e'],lw=1.3,zorder=13))

def b_node(bx,by,c):
    box(bx+4,by+6,14,11,c['f'],c['e'],lw=1,z=12)
    top=np.array([[bx+4,by+6],[bx+8,by+2],[bx+22,by+2],[bx+18,by+6]])
    ax.add_patch(Polygon(top,closed=True,fc=c['f'],ec=c['e'],lw=1,zorder=12))
    rt =np.array([[bx+18,by+6],[bx+22,by+2],[bx+22,by+13],[bx+18,by+17]])
    ax.add_patch(Polygon(rt,closed=True,fc='#8AC88A',ec=c['e'],lw=1,zorder=12))

def b_syssw(bx,by,c):
    ax.add_patch(Circle((bx+9,by+9),9,fc='none',ec=c['e'],lw=1.4,zorder=12))
    ax.add_patch(Circle((bx+9,by+9),3,fc=c['e'],ec='none',zorder=13))

def b_artifact(bx,by,c):
    fold=5
    pts=np.array([[bx,by],[bx+11,by],[bx+16,by+fold],[bx+16,by+18],[bx,by+18]])
    ax.add_patch(Polygon(pts,closed=True,fc=c['f'],ec=c['e'],lw=1,zorder=12))
    ax.add_patch(Polygon([[bx+11,by],[bx+11,by+fold],[bx+16,by+fold]],
                         closed=True,fc='white',ec=c['e'],lw=1,zorder=13))

def el(x,y,w,h,name,bfn,c,sub='',fs=10):
    box(x,y,w,h,c['f'],c['e'],lw=1.8,z=4)
    bfn(x+w-26,y+5,c)
    cx=x+(w-20)/2
    cy=y+h/2
    tx(name,cx,cy-(8 if sub else 0),fs=fs,fw='bold',col=c['t'],z=7)
    if sub: tx(sub,cx,cy+10,fs=8,col=c['t'],z=7)

# ════════════════════════════════════════════════════════════════════
# CDP  (Technology: Node — outer container, green)
# ════════════════════════════════════════════════════════════════════
CX,CY,CW,CH = 490,60,2190,1870
box(CX,CY,CW,CH,'#7DC87D','#1B5E20',lw=3,z=1,alpha=0.5)
box(CX,CY,CW,CH,'none','#1B5E20',lw=3,z=3)
b_node(CX+4,CY+4,T)
tx('CDP',CX+CW/2,CY+32,fs=16,fw='bold',col='#0A3A1A',z=5)
tx('Technology: Node',CX+CW/2,CY+53,fs=9,col='#0A3A1A',z=5)

# ════════════════════════════════════════════════════════════════════
# Governance band  (inside CDP, top)
# ════════════════════════════════════════════════════════════════════
box(CX+10,CY+75,CW-20,210,G['f'],G['e'],lw=1.5,z=3,alpha=0.6)
tx('Governance & Observability',CX+CW/2,CY+100,fs=11,fw='bold',col=G['t'],z=6)

el(CX+50,CY+115,285,150,'Purview',b_syssw,T,'Tech: System Software',fs=9)
el(CX+385,CY+115,310,150,'Azure Monitor',b_syssw,T,'Tech: System Software',fs=9)
el(CX+745,CY+115,310,150,'Log Analytics',b_syssw,T,'Tech: System Software',fs=9)

# ════════════════════════════════════════════════════════════════════
# Orchestrator  (Application: Component, inside CDP left)
# ════════════════════════════════════════════════════════════════════
OX,OY,OW,OH = CX+20,CY+315,380,510
box(OX,OY,OW,OH,A['f'],A['e'],lw=2,z=4)
b_comp(OX+OW-26,OY+5,A)
tx('Orchestrator',OX+OW/2-10,OY+38,fs=11,fw='bold',col=A['t'],z=7)
tx('Event Driven',OX+OW/2-10,OY+58,fs=9,col=A['t'],z=7,style='italic')
tx('Application: Component',OX+OW/2-10,OY+78,fs=8,col=A['t'],z=7)

# Ingestion Event inside Orchestrator
box(OX+12,OY+105,354,130,'#C0DAEA',A['e'],lw=1.3,z=5)
b_event(OX+12+354-26,OY+105+5,A)
tx('Data Ingestion Event',OX+12+160,OY+105+52,fs=9.5,fw='bold',col=A['t'],z=8)
tx('Application: Event',OX+12+160,OY+105+72,fs=8,col=A['t'],z=8)

# Scheduling function inside Orchestrator
box(OX+12,OY+255,354,120,'#D0E8F5',A['e'],lw=1.3,z=5)
b_comp(OX+12+354-26,OY+255+5,A)
tx('Scheduling / Dispatch',OX+12+160,OY+255+48,fs=9,fw='bold',col=A['t'],z=8)
tx('Application: Function',OX+12+160,OY+255+68,fs=8,col=A['t'],z=8)

# ════════════════════════════════════════════════════════════════════
# Databricks Engineering  (Application: Component, inside CDP center)
# ════════════════════════════════════════════════════════════════════
DX,DY,DW,DH = CX+420,CY+315,1740,1510
box(DX,DY,DW,DH,A['f'],A['e'],lw=2,z=3,alpha=0.35)
b_comp(DX+DW-26,DY+5,A)
tx('Databricks Engineering',DX+DW/2-12,DY+38,fs=12,fw='bold',col=A['t'],z=6)
tx('Application: Component',DX+DW/2-12,DY+58,fs=8,col=A['t'],z=6)

# BRONZE Artifact
BRX,BRY,BRW,BRH = DX+18,DY+85,370,220
box(BRX,BRY,BRW,BRH,BR['f'],BR['e'],lw=2,z=5)
b_artifact(BRX+BRW-26,BRY+5,BR)
tx('BRONZE',BRX+BRW/2-10,BRY+50,fs=12,fw='bold',col=BR['t'],z=7)
tx('Technology: Artifact',BRX+BRW/2-10,BRY+70,fs=8,col=BR['t'],z=7)
box(BRX+10,BRY+92,346,108,'#FFF2DC',BR['e'],lw=1.2,z=6)
b_dataobj(BRX+10+346-26,BRY+92+5,BR)
tx('Raw Data',BRX+10+158,BRY+92+42,fs=9.5,fw='bold',col=BR['t'],z=8)
tx('Application: Data Object',BRX+10+158,BRY+92+62,fs=8,col=BR['t'],z=8)

# SILVER Artifact
SIX,SIY,SIW,SIH = DX+408,DY+85,370,220
box(SIX,SIY,SIW,SIH,SI['f'],SI['e'],lw=2,z=5)
b_artifact(SIX+SIW-26,SIY+5,SI)
tx('SILVER',SIX+SIW/2-10,SIY+50,fs=12,fw='bold',col=SI['t'],z=7)
tx('Technology: Artifact',SIX+SIW/2-10,SIY+70,fs=8,col=SI['t'],z=7)
box(SIX+10,SIY+92,346,108,'#EBEBEB',SI['e'],lw=1.2,z=6)
b_dataobj(SIX+10+346-26,SIY+92+5,SI)
tx('Cleaned Data',SIX+10+158,SIY+92+42,fs=9.5,fw='bold',col=SI['t'],z=8)
tx('Application: Data Object',SIX+10+158,SIY+92+62,fs=8,col=SI['t'],z=8)

# GOLD Artifact
GOX,GOY,GOW,GOH = DX+798,DY+85,370,220
box(GOX,GOY,GOW,GOH,GO['f'],GO['e'],lw=2,z=5)
b_artifact(GOX+GOW-26,GOY+5,GO)
tx('GOLD',GOX+GOW/2-10,GOY+50,fs=12,fw='bold',col=GO['t'],z=7)
tx('Technology: Artifact',GOX+GOW/2-10,GOY+70,fs=8,col=GO['t'],z=7)
box(GOX+10,GOY+92,346,108,'#FFFBE6',GO['e'],lw=1.2,z=6)
b_dataobj(GOX+10+346-26,GOY+92+5,GO)
tx('Curated Data',GOX+10+158,GOY+92+42,fs=9.5,fw='bold',col=GO['t'],z=8)
tx('Application: Data Object',GOX+10+158,GOY+92+62,fs=8,col=GO['t'],z=8)

# API (Application: Interface, inside DB Eng)
AIX,AIY,AIW,AIH = DX+1188,DY+85,530,220
box(AIX,AIY,AIW,AIH,A['f'],A['e'],lw=2,z=5)
b_iface(AIX+AIW-26,AIY+5,A)
tx('API',AIX+AIW/2-12,AIY+68,fs=14,fw='bold',col=A['t'],z=7)
tx('Application: Interface',AIX+AIW/2-12,AIY+90,fs=8,col=A['t'],z=7)
tx('HTTPS / Standards',AIX+AIW/2-12,AIY+110,fs=8,col=A['t'],z=7)

# Environment Nodes (Prod / Pre-Prod / Test / Dev)
env_cfg=[('Prod','#C8E6C9','#2E7D32'),('Pre-Prod','#BBDEFB','#1565C0'),
         ('Test','#FFE0B2','#E65100'),('Dev','#F8BBD9','#880E4F')]
for i,(name,fc,ec) in enumerate(env_cfg):
    ey=DY+330+i*283
    box(DX+18,ey,DW-36,263,fc,ec,lw=1.5,z=4,alpha=0.65)
    b_node(DX+24,ey+6,dict(f=fc,e=ec,t=ec))
    tx(name,DX+120,ey+108,fs=12,fw='bold',col=ec,z=6)
    tx('Technology: Node',DX+120,ey+130,fs=8.5,col=ec,z=6)

# ════════════════════════════════════════════════════════════════════
# Outside CDP — LEFT: Source System/SharePoint, Source
# ════════════════════════════════════════════════════════════════════
# Source System / SharePoint  (Business: Actor)
box(30,390,270,150,B['f'],B['e'],lw=2,z=4)
b_comp(274,395,B)
tx('Source System',152,445,fs=10,fw='bold',col=B['t'],z=7)
tx('/ SharePoint',152,465,fs=10,fw='bold',col=B['t'],z=7)
tx('Business: Actor',152,487,fs=8,col=B['t'],z=7)

# Source  (Technology: Node)
el(30,720,270,145,'Source',b_node,T,'Technology: Node',fs=11)

# ════════════════════════════════════════════════════════════════════
# Outside CDP — RIGHT: Reporting Tools, PowerBI/Excel/CSV
# ════════════════════════════════════════════════════════════════════
el(2710,730,310,145,'Reporting\nTools',b_comp,A,'Application: Component',fs=10)
box(2710,900,310,140,A['f'],A['e'],lw=1.8,z=4)
b_dataobj(2994,905,A)
tx('PowerBI / Excel',2848,945,fs=9.5,fw='bold',col=A['t'],z=7)
tx('/ CSV',2848,963,fs=9.5,fw='bold',col=A['t'],z=7)
tx('Application: Data Object',2848,984,fs=8,col=A['t'],z=7)

# ════════════════════════════════════════════════════════════════════
# CONNECTIONS
# ════════════════════════════════════════════════════════════════════

# 1. Source System/SharePoint → Source  (Association)
arr(165,540,165,720,col=B['e'],lw=1.5,ls='dashed',lbl='Association')

# 2. Source → Orchestrator  (Triggering)
arr(300,792,OX,OY+OH/2,col=T['e'],lw=2.0,lbl='Triggering')

# 3. Source → Databricks Engineering  (Triggering, data arrives)
arr(300,792,DX,DY+DH//2,col=T['e'],lw=1.6,rad=0.12,ls='dashed',lbl='Flow')

# 4. Orchestrator → Databricks Engineering  (Triggering)
arr(OX+OW,OY+OH//2,DX,OY+OH//2,col=A['e'],lw=2.0,lbl='Triggering')

# 5. BRONZE → SILVER  (Flow)
arr(BRX+BRW,BRY+BRH/2,SIX,SIY+SIH/2,col=BR['e'],lw=2.0,lbl='Flow')

# 6. SILVER → GOLD  (Flow)
arr(SIX+SIW,SIY+SIH/2,GOX,GOY+GOH/2,col=SI['e'],lw=2.0,lbl='Flow')

# 7. GOLD → API  (Serving)
arr(GOX+GOW,GOY+GOH/2,AIX,AIY+AIH/2,col=GO['e'],lw=1.8,ls='dashed',lbl='Serving')

# 8. API → Purview  (Serving, upward)
purv_cx = CX+50+142
arr(AIX+AIW/2-12,AIY,purv_cx,CY+115+150,col=A['e'],lw=1.5,ls='dashed',rad=-0.3,lbl='Serving')

# 9. API → Azure Monitor  (Serving)
azm_cx = CX+385+155
arr(AIX+AIW/2-12,AIY,azm_cx,CY+115+150,col=A['e'],lw=1.5,ls='dashed',rad=-0.12)

# 10. API → Log Analytics  (Serving)
log_cx = CX+745+155
arr(AIX+AIW/2-12,AIY,log_cx,CY+115+150,col=A['e'],lw=1.5,ls='dashed',rad=-0.04)

# 11. GOLD → Reporting Tools  (Serving)
arr(GOX+GOW/2,GOY+GOH,2865,730,col=GO['e'],lw=2.0,ls='dashed',rad=0.2,lbl='Serving')

# 12. Reporting Tools → PowerBI/Excel/CSV  (Access: Read)
arr(2865,875,2865,900,col=A['e'],lw=1.5,lbl='Access (R)')

# ── Realisation labels on Data Objects ───────────────────────────────
for xi,yi,lbl_txt in [
    (BRX+10,BRY+90,'◁╌ Realisation'),
    (SIX+10,SIY+90,'◁╌ Realisation'),
    (GOX+10,GOY+90,'◁╌ Realisation')]:
    tx(lbl_txt,xi+160,yi-9,fs=7.5,col='#666',z=9)

# ════════════════════════════════════════════════════════════════════
# LEGEND
# ════════════════════════════════════════════════════════════════════
LY = 1890
box(30,LY,2980,75,'white','#aaa',lw=1,z=2,alpha=0.93)

badges_lbl=[
    ('App: Component',b_comp,A,85),('App: Event',b_event,A,330),
    ('App: Data Object',b_dataobj,A,575),('App: Interface',b_iface,A,820),
    ('Tech: Node',b_node,T,1065),('Tech: Sys. Software',b_syssw,T,1310),
    ('Tech: Artifact',b_artifact,T,1600),('Business: Actor',b_comp,B,1845),
]
for name,fn,c,lx in badges_lbl:
    fn(lx+30,LY+20,c)
    tx(name,lx+77,LY+38,fs=8,col=c['t'],z=7,ha='left')

rels_lbl=[
    ('→ Triggering','#333','-',2105),
    ('→ Flow',BR['e'],'-',2310),
    ('- → Serving',A['e'],'dashed',2515),
    ('◁╌ Realisation','#777','dashed',2720),
]
for name,col,ls,lx in rels_lbl:
    ax.plot([lx+30,lx+75],[LY+38,LY+38],color=col,lw=1.8,ls=ls,zorder=7)
    ax.annotate('',xy=(lx+75,LY+38),xytext=(lx+65,LY+38),
        arrowprops=dict(arrowstyle='->',color=col,lw=1.5),zorder=8)
    tx(name,lx+115,LY+38,fs=8,col=col,z=7,ha='left')

out='/home/user/journalist-map/archimate_hld_connected.png'
plt.savefig(out,dpi=100,bbox_inches='tight',facecolor='#F2F2F2')
print('Saved →',out)
