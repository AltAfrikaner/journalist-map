import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js';
// Existing journalist investigations and node dataset are preserved below.


// === ZERO EXTERNAL IMAGES - Emoji flags + CSS letter badges ===
const EF={za:"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMCAyMCI+PHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMDAyMzk1Ii8+PHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjREUzODMxIi8+PHBhdGggZD0iTTAsMCBMMTAsMTAgTDAsMjBaIiBmaWxsPSIjMDA3QTREIi8+PHBhdGggZD0iTTAsMS4yIEw4LjgsMTAgTDAsMTguOFoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMCwyLjggTDcuMiwxMCBMMCwxNy4yWiIgZmlsbD0iIzAwMCIvPjxyZWN0IHg9IjgiIHk9IjguNSIgd2lkdGg9IjIyIiBoZWlnaHQ9IjMiIGZpbGw9IiMwMDdBNEQiLz48cmVjdCB4PSI4IiB5PSI3LjgiIHdpZHRoPSIyMiIgaGVpZ2h0PSIxLjIiIGZpbGw9IiNmZmYiLz48cmVjdCB4PSI4IiB5PSIxMSIgd2lkdGg9IjIyIiBoZWlnaHQ9IjEuMiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0wLC41IEwxMCwxMCBMMCwxOS41IiBmaWxsPSJub25lIiBzdHJva2U9IiNGRkI2MTIiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==",us:"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMCAyMCI+PHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZmZmIi8+PGcgZmlsbD0iI0IyMjIzNCI+PHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjEuNTQiLz48cmVjdCB5PSIzLjA4IiB3aWR0aD0iMzAiIGhlaWdodD0iMS41NCIvPjxyZWN0IHk9IjYuMTUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIxLjU0Ii8+PHJlY3QgeT0iOS4yMyIgd2lkdGg9IjMwIiBoZWlnaHQ9IjEuNTQiLz48cmVjdCB5PSIxMi4zMSIgd2lkdGg9IjMwIiBoZWlnaHQ9IjEuNTQiLz48cmVjdCB5PSIxNS4zOCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjEuNTQiLz48cmVjdCB5PSIxOC40NiIgd2lkdGg9IjMwIiBoZWlnaHQ9IjEuNTQiLz48L2c+PHJlY3Qgd2lkdGg9IjEyIiBoZWlnaHQ9IjEwLjc3IiBmaWxsPSIjM0MzQjZFIi8+PGcgZmlsbD0iI2ZmZiI+PGNpcmNsZSBjeD0iMS4yIiBjeT0iMS4xIiByPSIuNDUiLz48Y2lyY2xlIGN4PSIzLjIiIGN5PSIxLjEiIHI9Ii40NSIvPjxjaXJjbGUgY3g9IjUuMiIgY3k9IjEuMSIgcj0iLjQ1Ii8+PGNpcmNsZSBjeD0iNy4yIiBjeT0iMS4xIiByPSIuNDUiLz48Y2lyY2xlIGN4PSI5LjIiIGN5PSIxLjEiIHI9Ii40NSIvPjxjaXJjbGUgY3g9IjExIiBjeT0iMS4xIiByPSIuNDUiLz48Y2lyY2xlIGN4PSIyLjIiIGN5PSIyLjIiIHI9Ii40NSIvPjxjaXJjbGUgY3g9IjQuMiIgY3k9IjIuMiIgcj0iLjQ1Ii8+PGNpcmNsZSBjeD0iNi4yIiBjeT0iMi4yIiByPSIuNDUiLz48Y2lyY2xlIGN4PSI4LjIiIGN5PSIyLjIiIHI9Ii40NSIvPjxjaXJjbGUgY3g9IjEwLjIiIGN5PSIyLjIiIHI9Ii40NSIvPjxjaXJjbGUgY3g9IjEuMiIgY3k9IjMuMyIgcj0iLjQ1Ii8+PGNpcmNsZSBjeD0iMy4yIiBjeT0iMy4zIiByPSIuNDUiLz48Y2lyY2xlIGN4PSI1LjIiIGN5PSIzLjMiIHI9Ii40NSIvPjxjaXJjbGUgY3g9IjcuMiIgY3k9IjMuMyIgcj0iLjQ1Ii8+PGNpcmNsZSBjeD0iOS4yIiBjeT0iMy4zIiByPSIuNDUiLz48Y2lyY2xlIGN4PSIxMSIgY3k9IjMuMyIgcj0iLjQ1Ii8+PGNpcmNsZSBjeD0iMi4yIiBjeT0iNC40IiByPSIuNDUiLz48Y2lyY2xlIGN4PSI0LjIiIGN5PSI0LjQiIHI9Ii40NSIvPjxjaXJjbGUgY3g9IjYuMiIgY3k9IjQuNCIgcj0iLjQ1Ii8+PGNpcmNsZSBjeD0iOC4yIiBjeT0iNC40IiByPSIuNDUiLz48Y2lyY2xlIGN4PSIxMC4yIiBjeT0iNC40IiByPSIuNDUiLz48Y2lyY2xlIGN4PSIxLjIiIGN5PSI1LjUiIHI9Ii40NSIvPjxjaXJjbGUgY3g9IjMuMiIgY3k9IjUuNSIgcj0iLjQ1Ii8+PGNpcmNsZSBjeD0iNS4yIiBjeT0iNS41IiByPSIuNDUiLz48Y2lyY2xlIGN4PSI3LjIiIGN5PSI1LjUiIHI9Ii40NSIvPjxjaXJjbGUgY3g9IjkuMiIgY3k9IjUuNSIgcj0iLjQ1Ii8+PGNpcmNsZSBjeD0iMTEiIGN5PSI1LjUiIHI9Ii40NSIvPjxjaXJjbGUgY3g9IjIuMiIgY3k9IjYuNiIgcj0iLjQ1Ii8+PGNpcmNsZSBjeD0iNC4yIiBjeT0iNi42IiByPSIuNDUiLz48Y2lyY2xlIGN4PSI2LjIiIGN5PSI2LjYiIHI9Ii40NSIvPjxjaXJjbGUgY3g9IjguMiIgY3k9IjYuNiIgcj0iLjQ1Ii8+PGNpcmNsZSBjeD0iMTAuMiIgY3k9IjYuNiIgcj0iLjQ1Ii8+PGNpcmNsZSBjeD0iMS4yIiBjeT0iNy43IiByPSIuNDUiLz48Y2lyY2xlIGN4PSIzLjIiIGN5PSI3LjciIHI9Ii40NSIvPjxjaXJjbGUgY3g9IjUuMiIgY3k9IjcuNyIgcj0iLjQ1Ii8+PGNpcmNsZSBjeD0iNy4yIiBjeT0iNy43IiByPSIuNDUiLz48Y2lyY2xlIGN4PSI5LjIiIGN5PSI3LjciIHI9Ii40NSIvPjxjaXJjbGUgY3g9IjExIiBjeT0iNy43IiByPSIuNDUiLz48Y2lyY2xlIGN4PSIyLjIiIGN5PSI4LjgiIHI9Ii40NSIvPjxjaXJjbGUgY3g9IjQuMiIgY3k9IjguOCIgcj0iLjQ1Ii8+PGNpcmNsZSBjeD0iNi4yIiBjeT0iOC44IiByPSIuNDUiLz48Y2lyY2xlIGN4PSI4LjIiIGN5PSI4LjgiIHI9Ii40NSIvPjxjaXJjbGUgY3g9IjEwLjIiIGN5PSI4LjgiIHI9Ii40NSIvPjxjaXJjbGUgY3g9IjEuMiIgY3k9IjkuOSIgcj0iLjQ1Ii8+PGNpcmNsZSBjeD0iMy4yIiBjeT0iOS45IiByPSIuNDUiLz48Y2lyY2xlIGN4PSI1LjIiIGN5PSI5LjkiIHI9Ii40NSIvPjxjaXJjbGUgY3g9IjcuMiIgY3k9IjkuOSIgcj0iLjQ1Ii8+PGNpcmNsZSBjeD0iOS4yIiBjeT0iOS45IiByPSIuNDUiLz48Y2lyY2xlIGN4PSIxMSIgY3k9IjkuOSIgcj0iLjQ1Ii8+PC9nPjwvc3ZnPg==",gb:"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMCAyMCI+PHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMDEyMTY5Ii8+PHBhdGggZD0iTTAsMCBMMzAsMjAgTTMwLDAgTDAsMjAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIzIi8+PHBhdGggZD0iTTAsMCBMMzAsMjAgTTMwLDAgTDAsMjAiIHN0cm9rZT0iI0M4MTAyRSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48cGF0aCBkPSJNMTUsMFYyME0wLDEwSDMwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iNSIvPjxwYXRoIGQ9Ik0xNSwwVjIwTTAsMTBIMzAiIHN0cm9rZT0iI0M4MTAyRSIgc3Ryb2tlLXdpZHRoPSIzIi8+PC9zdmc+",qa:"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMCAyMCI+PHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjOEExNTM4Ii8+PHBhdGggZD0iTTAsMCBMMTEsMCBMOCwxLjQzIEwxMSwyLjg2IEw4LDQuMjkgTDExLDUuNzEgTDgsNy4xNCBMMTEsOC41NyBMOCwxMCBMMTEsMTEuNDMgTDgsMTIuODYgTDExLDE0LjI5IEw4LDE1LjcxIEwxMSwxNy4xNCBMOCwxOC41NyBMMTEsMjAgTDAsMjBaIiBmaWxsPSIjZmZmIi8+PC9zdmc+",fr:"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMCAyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMDAyMzk1Ii8+PHJlY3QgeD0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjIwIiB3aWR0aD0iMTAiIGhlaWdodD0iMjAiIGZpbGw9IiNFRDI5MzkiLz48L3N2Zz4=",cn:"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMCAyMCI+PHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjREUyOTEwIi8+PHRleHQgeD0iNSIgeT0iOCIgZmlsbD0iI0ZGREUwMCIgZm9udC1zaXplPSI3Ij7imIU8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjQuNSIgZmlsbD0iI0ZGREUwMCIgZm9udC1zaXplPSIyLjUiPuKYhTwvdGV4dD48dGV4dCB4PSIxMiIgeT0iNyIgZmlsbD0iI0ZGREUwMCIgZm9udC1zaXplPSIyLjUiPuKYhTwvdGV4dD48dGV4dCB4PSIxMiIgeT0iMTAiIGZpbGw9IiNGRkRFMDAiIGZvbnQtc2l6ZT0iMi41Ij7imIU8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjEyLjUiIGZpbGw9IiNGRkRFMDAiIGZvbnQtc2l6ZT0iMi41Ij7imIU8L3RleHQ+PC9zdmc+",ca:"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMCAyMCI+PHJlY3Qgd2lkdGg9IjcuNSIgaGVpZ2h0PSIyMCIgZmlsbD0iI0ZGMDAwMCIvPjxyZWN0IHg9IjcuNSIgd2lkdGg9IjE1IiBoZWlnaHQ9IjIwIiBmaWxsPSIjZmZmIi8+PHJlY3QgeD0iMjIuNSIgd2lkdGg9IjcuNSIgaGVpZ2h0PSIyMCIgZmlsbD0iI0ZGMDAwMCIvPjx0ZXh0IHg9IjE1IiB5PSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI0ZGMDAwMCIgZm9udC1zaXplPSIxMCI+8J+NgTwvdGV4dD48L3N2Zz4=",zw:"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMCAyMCI+PHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMDA2NDAwIi8+PHJlY3QgeT0iMi44NiIgd2lkdGg9IjMwIiBoZWlnaHQ9IjIuODYiIGZpbGw9IiNGRkQyMDAiLz48cmVjdCB5PSI1LjcxIiB3aWR0aD0iMzAiIGhlaWdodD0iMi44NiIgZmlsbD0iI0Q0MDAwMCIvPjxyZWN0IHk9IjguNTciIHdpZHRoPSIzMCIgaGVpZ2h0PSIyLjg2IiBmaWxsPSIjMDAwIi8+PHJlY3QgeT0iMTEuNDMiIHdpZHRoPSIzMCIgaGVpZ2h0PSIyLjg2IiBmaWxsPSIjRDQwMDAwIi8+PHJlY3QgeT0iMTQuMjkiIHdpZHRoPSIzMCIgaGVpZ2h0PSIyLjg2IiBmaWxsPSIjRkZEMjAwIi8+PHBhdGggZD0iTTAsMCBMOCwxMCBMMCwyMFoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMCwxIEw3LDEwIEwwLDE5WiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9Ii4zIi8+PC9zdmc+",ke:"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMCAyMCI+PHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMDA2NjAwIi8+PHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjYiIGZpbGw9IiMwMDAiLz48cmVjdCB5PSI2IiB3aWR0aD0iMzAiIGhlaWdodD0iMSIgZmlsbD0iI2ZmZiIvPjxyZWN0IHk9IjciIHdpZHRoPSIzMCIgaGVpZ2h0PSI2IiBmaWxsPSIjQkIwMDAwIi8+PHJlY3QgeT0iMTMiIHdpZHRoPSIzMCIgaGVpZ2h0PSIxIiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iMTUiIGN5PSIxMCIgcj0iMy41IiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iMTUiIGN5PSIxMCIgcj0iMi41IiBmaWxsPSIjMDAwIi8+PHJlY3QgeD0iMTQuNSIgeT0iNSIgd2lkdGg9IjEiIGhlaWdodD0iMTAiIGZpbGw9IiMwMDAiLz48L3N2Zz4=",ae:"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMCAyMCI+PHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjYuNjciIGZpbGw9IiMwMDczMkYiLz48cmVjdCB5PSI2LjY3IiB3aWR0aD0iMzAiIGhlaWdodD0iNi42NyIgZmlsbD0iI2ZmZiIvPjxyZWN0IHk9IjEzLjMzIiB3aWR0aD0iMzAiIGhlaWdodD0iNi42NyIgZmlsbD0iIzAwMCIvPjxyZWN0IHdpZHRoPSI3LjUiIGhlaWdodD0iMjAiIGZpbGw9IiNGRjAwMDAiLz48L3N2Zz4="};

// Media house badge: [abbreviation, brand hex colour]
const MB={
  dm:["DM","#1a1a2e"],ac:["AC","#1f7a45"],iss:["ISS","#555"],ama:["aB","#444"],mg:["M&G","#333"],
  n24:["N24","#e87722"],sabc:["SABC","#006633"],enca:["eNCA","#0066cc"],conv:["TC","#d4380d"],
  nw24:["NW","#cc6600"],iol:["IOL","#1a1a2e"],
  ifcn:["IFCN","#1f7a45"],cnn_h:["CNN","#cc0000"],bbc_h:["BBC","#b31919"],aje_h:["AJ","#c89010"],
  afp_h:["AFP","#0055a4"],reuters_h:["R","#ff8c00"],ap_h:["AP","#cc0000"],nyt_h:["NYT","#1a1a2e"],
  guardian_h:["TG","#005689"],cgtn_h:["CGTN","#c41e3a"],itv_h:["ITV","#003366"],wapo_h:["WP","#231f20"]
};

const ND=[
  // INSIDE SA MEDIA
  {id:"dm",t:"m",n:"Daily Maverick",cc:"za",col:0x1a1a2e,w:7,desc:"Hosts amaBhungane. Open Society Foundation (OSF) grantee. Institute for Security Studies (ISS) republication partner.",topics:["investigative","politics"]},
  {id:"ac",t:"m",n:"Africa Check",cc:"za",col:0x1f7a45,w:7,desc:"International Fact-Checking Network (IFCN) certified. Housed at the University of the Witwatersrand (Wits). Funded by OSF (12%), Luminate (8%), Gates Foundation (13%).",topics:["fact-checking"]},
  {id:"iss",t:"m",n:"ISS Africa",cc:"za",col:0x555555,w:5,desc:"Institute for Security Studies. $5.1M OSF funding.",topics:["security"]},
  {id:"ama",t:"m",n:"amaBhungane",cc:"za",col:0x444444,w:5,desc:"Investigative journalism centre. OSF and National Endowment for Democracy (NED) grantee.",topics:["investigative"]},
  {id:"mg",t:"m",n:"Mail & Guardian",cc:"za",col:0x333333,w:5,desc:"Media Development Investment Fund (MDIF) owned 2017-2024. NED $355,200 via Adamela Trust.",topics:["politics"]},
  {id:"n24",t:"m",n:"News24",cc:"za",col:0xe87722,w:6,desc:"Naspers/Media24. Largest English-language news site.",topics:["news"]},
  {id:"sabc",t:"m",n:"SABC",cc:"za",col:0x006633,w:6,desc:"State broadcaster. Pipeline to international careers.",topics:["state media"]},
  {id:"enca",t:"m",n:"eNCA",cc:"za",col:0x0066cc,w:5,desc:"eMedia 24hr news channel.",topics:["news"]},
  {id:"conv",t:"m",n:"The Conversation",cc:"za",col:0xd4380d,w:5,desc:"Academic journalism. Republished by Guardian, TimesLIVE.",topics:["academic"]},
  {id:"nw24",t:"m",n:"Netwerk24",cc:"za",col:0xcc6600,w:4,desc:"Naspers Afrikaans digital. Language silo.",topics:["Afrikaans"]},

  {id:"iol",t:"m",n:"IOL / Independent Media",cc:"za",col:0x1a1a2e,w:5,desc:"Sekunjalo 55%, PIC 25%, CCTV subsidiary 20%.",topics:["ANC-aligned"]},
  // INSIDE SA JOURNALISTS
  {id:"allison",t:"j",n:"Simon Allison",cc:"za",col:0x1a1a2e,w:5,desc:"Revolving door: Daily Maverick, Mail & Guardian, ISS, The Continent.",topics:["politics"],cn:["dm","mg","iss","guardian_h"]},
  {id:"cunliffe",t:"j",n:"Peter Cunliffe-Jones",cc:"gb",col:0x1f7a45,w:6,desc:"Founded Africa Check 2012. Now IFCN Senior Adviser at Poynter.",topics:["fact-checking"],cn:["ac","ifcn"]},
  {id:"timse",t:"j",n:"Tabelo Timse",cc:"za",col:0x0055a4,w:4,desc:"Former AFP SADC correspondent. amaBhungane.",topics:["investigative"],cn:["afp_h","ama"]},
  {id:"wasserman",t:"j",n:"Herman Wasserman",cc:"za",col:0x555555,w:6,desc:"Prof. Stellenbosch/UCT. Defines disinformation for Africa. IDRC R4.5M.",topics:["disinformation"],cn:["ac","ifcn"]},
  {id:"fmiller",t:"j",n:"Fahmida Miller",cc:"za",col:0xc89010,w:4,desc:"Al Jazeera Correspondent, Johannesburg.",topics:["SA politics"],cn:["aje_h"]},
  // OUTSIDE SA MEDIA
  {id:"ifcn",t:"m",n:"Poynter / IFCN",cc:"us",col:0x1f7a45,w:6,desc:"International Fact-Checking Network.",topics:["certification"]},
  {id:"cnn_h",t:"m",n:"CNN",cc:"us",col:0xcc0000,w:8,desc:"Largest global TV news network. JHB bureau.",topics:["global news"]},
  {id:"bbc_h",t:"m",n:"BBC",cc:"gb",col:0xb31919,w:8,desc:"British state broadcaster.",topics:["global news"]},
  {id:"aje_h",t:"m",n:"Al Jazeera",cc:"qa",col:0xc89010,w:7,desc:"Doha HQ. 300M+ reach.",topics:["global news"]},
  {id:"afp_h",t:"m",n:"AFP",cc:"fr",col:0x0055a4,w:7,desc:"French wire service.",topics:["wire service"]},
  {id:"reuters_h",t:"m",n:"Reuters",cc:"gb",col:0xff8c00,w:7,desc:"Global wire service.",topics:["wire service"]},
  {id:"ap_h",t:"m",n:"AP",cc:"us",col:0xcc0000,w:6,desc:"Oldest wire service.",topics:["wire service"]},
  {id:"nyt_h",t:"m",n:"New York Times",cc:"us",col:0x1a1a2e,w:7,desc:"Maintained JHB bureau.",topics:["newspaper"]},
  {id:"guardian_h",t:"m",n:"The Guardian",cc:"gb",col:0x005689,w:6,desc:"Former Africa corr JHB.",topics:["newspaper"]},
  {id:"cgtn_h",t:"m",n:"CGTN",cc:"cn",col:0xc41e3a,w:5,desc:"Chinese state media. Parent co-owns IOL.",topics:["state media"]},
  {id:"itv_h",t:"m",n:"ITV News",cc:"gb",col:0x003366,w:4,desc:"UK commercial broadcaster.",topics:["UK news"]},
  {id:"wapo_h",t:"m",n:"Washington Post",cc:"us",col:0x231f20,w:6,desc:"US newspaper of record. Africa bureau covers SA. No permanent JHB correspondent.",topics:["newspaper"]},
  // OUTSIDE SA JOURNALISTS
  {id:"mckenzie",t:"j",n:"David McKenzie",cc:"za",col:0xcc0000,w:6,desc:"CNN Senior International Correspondent, JHB.",topics:["Africa"],cn:["cnn_h"]},
  {id:"curnow",t:"j",n:"Robyn Curnow",cc:"za",col:0xcc0000,w:5,desc:"Former CNN anchor. SA-born. SABC pipeline.",topics:["Africa"],cn:["cnn_h","sabc"]},
  {id:"giokos",t:"j",n:"Eleni Giokos",cc:"za",col:0xcc0000,w:5,desc:"CNN Correspondent, Abu Dhabi. Raised SA.",topics:["business"],cn:["cnn_h","enca"]},
  {id:"mbele",t:"j",n:"Lerato Mbele",cc:"za",col:0xb31919,w:5,desc:"BBC Africa Business Report. SABC pipeline.",topics:["business"],cn:["bbc_h","sabc"]},
  {id:"tlhabi",t:"j",n:"Redi Tlhabi",cc:"za",col:0xb31919,w:5,desc:"Former BBC Newsday. SABC/eNCA pipeline.",topics:["current affairs"],cn:["bbc_h","sabc","enca"]},
  {id:"mutasa",t:"j",n:"Haru Mutasa",cc:"zw",col:0xc89010,w:5,desc:"Al Jazeera Africa Correspondent, JHB.",topics:["Southern Africa"],cn:["aje_h","sabc"]},
  {id:"dutton",t:"j",n:"Jane Dutton",cc:"za",col:0xc89010,w:5,desc:"Al Jazeera Inside Story host.",topics:["geopolitics"],cn:["aje_h","sabc","cnn_h"]},
  {id:"a_naidoo",t:"j",n:"Anand Naidoo",cc:"za",col:0xc41e3a,w:5,desc:"SABC, CNN, Al Jazeera, now CGTN Atlanta.",topics:["global affairs"],cn:["cgtn_h","sabc","cnn_h","aje_h"]},
  {id:"muirhead",t:"j",n:"Nic Muirhead",cc:"za",col:0xc89010,w:4,desc:"Al Jazeera Listening Post producer.",topics:["media"],cn:["aje_h"]},
  {id:"harrisberg",t:"j",n:"Kim Harrisberg",cc:"za",col:0xff8c00,w:4,desc:"Thomson Reuters Foundation.",topics:["inequality"],cn:["reuters_h"]},
  {id:"onishi",t:"j",n:"Norimitsu Onishi",cc:"ca",col:0x1a1a2e,w:5,desc:"FORMER NYT JHB Bureau Chief (before Eligon). Japanese-Canadian. Princeton. Covered SA politics and race.",topics:["SA politics","race"],cn:["nyt_h"]},
  {id:"d_smith",t:"j",n:"David Smith",cc:"gb",col:0x005689,w:5,desc:"Guardian former Africa corr. Now Washington.",topics:["SA politics"],cn:["guardian_h"]},
  {id:"chinono",t:"j",n:"Hopewell Chin\u2019ono",cc:"zw",col:0x1a1a2e,w:5,desc:"NYT Zimbabwe correspondent. Harvard Nieman.",topics:["Zimbabwe"],cn:["nyt_h","enca","itv_h"]},
  {id:"madowo",t:"j",n:"Larry Madowo",cc:"ke",col:0xcc0000,w:5,desc:"CNN Correspondent, Kenya. WEF Young Global Leader.",topics:["Africa"],cn:["cnn_h","bbc_h"]},
  // === NEW NODES: Connect Team Deep Dive ===
  {id:"eligon",t:"j",n:"John Eligon",cc:"us",col:0x1a1a2e,w:7,desc:"CURRENT NYT JHB Bureau Chief. Trinidadian-American. Northwestern Univ. Writes the key SA framing stories for US elite audiences. Quoted Max du Preez. Covered G20, Trump-SA crisis, Musk/BEE.",topics:["SA politics","race","Trump-SA"],cn:["nyt_h"]},
  {id:"chutel",t:"j",n:"Lynsey Chutel",cc:"za",col:0x1a1a2e,w:6,desc:"NYT reporter, now London. SA-born. eNCA, AP, Quartz, News24 Africa desk, then NYT. Columbia Journalism MA, Wits IR MA. Co-authored 'Coloured: How Classification Became Culture.' Revolving door.",topics:["SA politics","fact-checking"],cn:["nyt_h","enca","ap_h","n24"]},
  {id:"brycepease",t:"j",n:"Sherwin Bryce-Pease",cc:"za",col:0x006633,w:6,desc:"SABC UN Bureau Chief, New York since 2008. First African president of United Nations Correspondents Association (UNCA, 2017-2018). Ricardo Ortega Memorial Prize 2025. Rhodes Univ. Gatekeeper for SA foreign policy framing.",topics:["UN","foreign policy"],cn:["sabc"]},
  {id:"l_naidoo",t:"j",n:"Latashia Naidoo",cc:"za",col:0xb31919,w:5,desc:"eNCA, TRT World, BBC Africa, CNN, Business Insider US, now Carte Blanche. 2020 Wits/OSF Investigative Journalism Fellow. Thomson Reuters Changemaker 2021. BBC Komla Dumor finalist 2022.",topics:["investigative","crime"],cn:["enca","bbc_h","cnn_h"]},

  {id:"norgaard",t:"j",n:"Kim Norgaard",cc:"za",col:0xcc0000,w:4,desc:"CNN Former Africa Bureau Chief, JHB. Managed editorial direction for all CNN Africa coverage. Married to Robyn Curnow.",topics:["bureau management"],cn:["cnn_h"]},
  {id:"j_silva",t:"j",n:"Joao Silva",cc:"za",col:0x1a1a2e,w:4,desc:"NYT staff photographer, JHB. Portuguese-born, raised SA. Shoots visual framing for Eligon's SA stories. Bang-Bang Club veteran. His images define the visual narrative.",topics:["photography","visual framing"],cn:["nyt_h"]},
  {id:"bearak",t:"j",n:"Max Bearak",cc:"us",col:0x231f20,w:6,desc:"Washington Post Africa Bureau Chief. Previously NYT stringer. Reported from Afghanistan, Bangladesh, India, Somalia. Covers SA from the continent.",topics:["Africa","foreign policy"],cn:["wapo_h","nyt_h"]},
  {id:"peyton",t:"j",n:"Nellie Peyton",cc:"us",col:0xff8c00,w:5,desc:"Reuters Breaking News Correspondent, Johannesburg. Covers Southern Africa. Wrote the key wire story on US processing 4,500 white SA refugee applications per month. Award-winning.",topics:["breaking news","Southern Africa"],cn:["reuters_h"]},
  {id:"bartlett",t:"j",n:"Kate Bartlett",cc:"zw",col:0x0055a4,w:4,desc:"Deutsche Presse-Agentur (dpa) Southern/East Africa correspondent, JHB. Zimbabwean. Previously AFP editor at Asia HQ Hong Kong. Reuters Institute fellow. Oversees 20 regional stringers.",topics:["wire service","Southern Africa"],cn:["afp_h"]},
];

// Build edges
const ED=[];
ND.forEach(n=>{if(n.cn)n.cn.forEach(c=>ED.push([n.id,c]))});
[["ac","cnn_h"],["ac","bbc_h"],["ac","n24"],["ac","dm"],["dm","iss"],["dm","ama"],["conv","guardian_h"],["iol","cgtn_h"],["ac","ifcn"]].forEach(e=>ED.push(e));

// Categorise nodes for layout
const insM=ND.filter(n=>n.t==="m"&&!["ifcn","cnn_h","bbc_h","aje_h","afp_h","reuters_h","ap_h","nyt_h","guardian_h","cgtn_h","itv_h"].includes(n.id));
const insJ=ND.filter(n=>n.t==="j"&&n.cn&&n.cn.some(c=>insM.find(m=>m.id===c)));
const outM=ND.filter(n=>n.t==="m"&&!insM.includes(n));
const outJ=ND.filter(n=>n.t==="j"&&!insJ.includes(n));

// WIDER ring layout with more Y variation for depth
function ring(a,r,y,ySpread){a.forEach((n,i)=>{
  const ang=(i/a.length)*Math.PI*2+0.3;
  n._x=Math.cos(ang)*r;
  n._y=y+(Math.random()-0.5)*ySpread;
  n._z=Math.sin(ang)*r;
})}
ring(insM,12,0,3);
ring(insJ,24,2,4);
ring(outM,38,-1,5);
ring(outJ,52,1,6);

// THREE.JS
const cv=document.getElementById("cv"),ll=document.getElementById("ll");
const sc=new THREE.Scene();
sc.background=new THREE.Color(0x1B2A4A);
sc.fog=new THREE.FogExp2(0x0f1a30,0.003);

const cam=new THREE.PerspectiveCamera(50,cv.clientWidth/cv.clientHeight,0.1,800);
cam.position.set(0,32,68);

const ren=new THREE.WebGLRenderer({canvas:cv,antialias:true});
ren.setSize(cv.clientWidth,cv.clientHeight);
ren.setPixelRatio(Math.min(devicePixelRatio||1,1.5));

// Soft lighting
sc.add(new THREE.AmbientLight(0xffffff,1.0));
const d1=new THREE.DirectionalLight(0xfff8ee,0.6);d1.position.set(20,30,25);sc.add(d1);
const d2=new THREE.DirectionalLight(0xeef0ff,0.35);d2.position.set(-15,10,-10);sc.add(d2);
const d3=new THREE.PointLight(0xC5A258,0.3,100);d3.position.set(0,20,0);sc.add(d3);

// Very subtle ground grid
const gr=new THREE.GridHelper(140,35,0x1e3050,0x1a2a45);
gr.position.y=-7;gr.material.opacity=0.3;gr.material.transparent=true;sc.add(gr);
const ggeo=new THREE.PlaneGeometry(120,120);
const gmat=new THREE.MeshBasicMaterial({color:0x0f1a30,transparent:true,opacity:0.4});
const gplane=new THREE.Mesh(ggeo,gmat);gplane.rotation.x=-Math.PI/2;gplane.position.y=-7.1;sc.add(gplane);

// Ambient floating particles
const pGeo=new THREE.BufferGeometry();
const pCount=200;
const pPos=new Float32Array(pCount*3);
for(let i=0;i<pCount*3;i++)pPos[i]=(Math.random()-0.5)*120;
pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
const pMat=new THREE.PointsMaterial({color:0xC5A258,size:0.15,transparent:true,opacity:0.3,sizeAttenuation:true});
const particles=new THREE.Points(pGeo,pMat);
sc.add(particles);

// Create node meshes
const mM=new Map(),nM=new Map();
ND.forEach(nd=>{
  nM.set(nd.id,nd);
  if(nd._x===undefined)return;
  const r=nd.t==="m"?1.0+nd.w*0.18:0.55+nd.w*0.12;
  const c=new THREE.Color(nd.col);
  const mt=new THREE.MeshStandardMaterial({color:c,roughness:0.15,metalness:0.3,emissive:c,emissiveIntensity:0.35});
  const ms=new THREE.Mesh(new THREE.SphereGeometry(r,32,32),mt);
  ms.position.set(nd._x,nd._y,nd._z);
  ms.userData=nd;
  sc.add(ms);
  mM.set(nd.id,ms);
});

// Colour-coded edges
const eL=[];
const outsideMediaIDs=["ifcn","cnn_h","bbc_h","aje_h","afp_h","reuters_h","ap_h","nyt_h","guardian_h","cgtn_h","itv_h","wapo_h"];
const insideMediaIDs=["dm","ac","iss","ama","mg","n24","sabc","enca","conv","nw24","iol"];

ED.forEach(([f,t])=>{
  const fm=mM.get(f),tm=mM.get(t);
  if(!fm||!tm)return;
  const g=new THREE.BufferGeometry().setFromPoints([fm.position.clone(),tm.position.clone()]);
  // Colour-code: green for fact-check pipeline, red for intl reach, gold for journalist-outlet
  const fnd=nM.get(f),tnd=nM.get(t);
  let ec;
  const factIDs=["ac","ifcn","cunliffe","wasserman"];
  if(factIDs.includes(f)||factIDs.includes(t)){ec=new THREE.Color(0x1f7a45);}
  else if(outsideMediaIDs.includes(f)||outsideMediaIDs.includes(t)){ec=new THREE.Color(0xC5A258);}
  else{ec=new THREE.Color(fm.userData.col);}
  const ln=new THREE.Line(g,new THREE.LineBasicMaterial({color:ec,transparent:true,opacity:0.4}));
  sc.add(ln);
  eL.push({line:ln,from:f,to:t});
});

// Build HTML labels with emoji flags + letter badges (ZERO external images)
const lbs=new Map();
ND.forEach(nd=>{
  if(nd._x===undefined)return;
  const d=document.createElement("div");
  d.className="nl"+(nd.t==="m"?" med":"");
  const flag=EF[nd.cc]||"";
  if(nd.t==="m"&&MB[nd.id]){
    const [code,bg]=MB[nd.id];
    d.innerHTML='<span class="bg" style="background:'+bg+'">'+code+'</span><img class="fi" src="'+flag+'"><span class="nm">'+nd.n+'</span>';
  }else{
    d.innerHTML='<img class="fi" src="'+flag+'"><span class="nm">'+nd.n+'</span>';
  }
  d.style.pointerEvents="auto";
  d.addEventListener("click",()=>openPanel(nd));
  ll.appendChild(d);
  lbs.set(nd.id,d);
});

// Camera orbit controls
let dr=false,pX=0,pY=0,rX=0,rY=0,tX=0,tY=0,zm=72;
cv.addEventListener("mousedown",e=>{dr=true;pX=e.clientX;pY=e.clientY});
cv.addEventListener("mousemove",e=>{if(!dr)return;tY+=(e.clientX-pX)*.004;tX+=(e.clientY-pY)*.004;tX=Math.max(-1.2,Math.min(1.2,tX));pX=e.clientX;pY=e.clientY});
cv.addEventListener("mouseup",()=>dr=false);
cv.addEventListener("mouseleave",()=>dr=false);
cv.addEventListener("wheel",e=>{e.preventDefault();zm=Math.max(30,Math.min(130,zm+e.deltaY*.06))},{passive:false});
cv.addEventListener("touchstart",e=>{if(e.touches.length===1){dr=true;pX=e.touches[0].clientX;pY=e.touches[0].clientY}});
cv.addEventListener("touchmove",e=>{if(!dr||e.touches.length!==1)return;tY+=(e.touches[0].clientX-pX)*.004;tX+=(e.touches[0].clientY-pY)*.004;tX=Math.max(-1.2,Math.min(1.2,tX));pX=e.touches[0].clientX;pY=e.touches[0].clientY});
cv.addEventListener("touchend",()=>dr=false);

// Click to select node
const ray=new THREE.Raycaster(),mo=new THREE.Vector2();
cv.addEventListener("click",e=>{
  const r=cv.getBoundingClientRect();
  mo.x=((e.clientX-r.left)/r.width)*2-1;
  mo.y=-((e.clientY-r.top)/r.height)*2+1;
  ray.setFromCamera(mo,cam);
  const h=ray.intersectObjects([...mM.values()]);
  if(h.length>0)openPanel(h[0].object.userData);
});

function openPanel(nd){
  const flag=EF[nd.cc]||"";
  const pB=document.getElementById("pB");
  if(nd.t==="m"&&MB[nd.id]){
    const [code,bg]=MB[nd.id];
    pB.style.background=bg;pB.textContent=code;pB.style.fontSize="11px";
  }else{
    pB.style.background="#444";pB.innerHTML='<img src="'+flag+'" style="height:24px;border-radius:2px">';pB.style.fontSize="11px";
  }
  
  document.getElementById("pN").textContent=nd.n;
  document.getElementById("pR").textContent=(nd.t==="m"?"Media House":"Journalist")+" | "+nd.cc.toUpperCase();
  document.getElementById("pD").textContent=nd.desc||"";
  const tg=document.getElementById("pT");tg.innerHTML="";
  (nd.topics||[]).forEach(t=>{const s=document.createElement("span");s.className="ptg";s.textContent=t;tg.appendChild(s)});
  const cn=document.getElementById("pC");cn.innerHTML="";
  ED.filter(([f,t])=>f===nd.id||t===nd.id).forEach(([f,t])=>{
    const oid=f===nd.id?t:f;const o=nM.get(oid);if(!o)return;
    const d=document.createElement("div");d.className="pci";
    d.innerHTML='<img src="'+((EF[o.cc])||"")+'" style="height:11px;border-radius:1px;vertical-align:middle;margin-right:4px">'+o.n;
    d.onclick=()=>openPanel(o);cn.appendChild(d);
  });
  document.getElementById("pn").classList.add("open");
  // Highlight connected
  mM.forEach((m,id)=>{
    const c=ED.some(([f,t])=>(f===nd.id&&t===id)||(t===nd.id&&f===id))||id===nd.id;
    m.material.opacity=c?1:0.12;m.material.emissiveIntensity=c?0.4:0.08;m.material.transparent=!c;
  });
  eL.forEach(e=>{e.line.material.opacity=(e.from===nd.id||e.to===nd.id)?0.85:0.06});
}
function closePanel(){
  document.getElementById("pn").classList.remove("open");
  mM.forEach(m=>{m.material.opacity=1;m.material.transparent=false;m.material.emissiveIntensity=0.35;});
  eL.forEach(e=>{e.line.material.opacity=0.4});
}

// Legend
const le=document.getElementById("lg");
function aL(ti,ar){
  const h=document.createElement("h3");h.textContent=ti;le.appendChild(h);
  ar.forEach(nd=>{
    const d=document.createElement("div");d.className="li";
    const ch="#"+nd.col.toString(16).padStart(6,"0");
    const fl=EF[nd.cc]||"";
    d.innerHTML='<div class="ld" style="background:'+ch+'"></div><img src="'+fl+'" style="height:11px;border-radius:1px"><span>'+nd.n+'</span>';
    d.onclick=()=>openPanel(nd);
    le.appendChild(d);
  });
}
aL("Inside South Africa",[...insM,...insJ]);
aL("Outside South Africa",[...outM,...outJ]);

// Stats
document.getElementById("sJ").textContent=ND.filter(n=>n.t==="j").length;
document.getElementById("sM").textContent=ND.filter(n=>n.t==="m").length;
document.getElementById("sC").textContent=ED.length;
document.getElementById("sA").textContent="0";

// Animation loop
// === FILTER SYSTEM ===
function isOutside(nd){
  if(nd.t==="m") return outsideMediaIDs.includes(nd.id);
  // journalist is outside if their connections are all to outside media
  if(nd.cn) return nd.cn.some(c=>outsideMediaIDs.includes(c));
  return false;
}
let currentFilter="all";
function filterMap(filter,btn){
  currentFilter=filter;
  document.querySelectorAll('.fbtn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  mM.forEach((mesh,id)=>{
    const nd=mesh.userData;
    let show=true;
    if(filter==="media") show=nd.t==="m";
    else if(filter==="journalist") show=nd.t==="j";
    else if(filter==="inside") show=!isOutside(nd);
    else if(filter==="outside") show=isOutside(nd);
    else if(filter==="wire"){
      const wireIDs=["afp_h","reuters_h","ap_h","ifcn","timse","harrisberg","peyton","bartlett"];
      show=wireIDs.includes(nd.id);
    }
    mesh.visible=show;
    const label=lbs.get(id);
    if(label)label.style.display=show?"flex":"none";
  });
  eL.forEach(e=>{
    const fm=mM.get(e.from),tm=mM.get(e.to);
    e.line.visible=fm&&tm&&fm.visible&&tm.visible;
  });
}

const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
let graphVisible=true;
const visibilityObserver=new IntersectionObserver(entries=>{graphVisible=entries[0].isIntersecting;},{threshold:0});
visibilityObserver.observe(cv);
let ti=0;const v3=new THREE.Vector3();
function anim(){
  requestAnimationFrame(anim);
  if(document.hidden||!graphVisible)return;
  if(!motionPreference.matches)ti+=0.004;
  rX+=(tX-rX)*0.04;rY+=(tY-rY)*0.04;
  cam.position.x=Math.sin(rY)*Math.cos(rX)*zm;
  cam.position.y=Math.sin(rX)*zm*0.4+20;
  cam.position.z=Math.cos(rY)*Math.cos(rX)*zm;
  cam.lookAt(0,0,0);
  // Gentle float
  // Animate particles
  if(particles){const pp=particles.geometry.attributes.position.array;
    for(let i=0;i<pp.length;i+=3){pp[i+1]+=0.005;if(pp[i+1]>30)pp[i+1]=-30;}
    particles.geometry.attributes.position.needsUpdate=true;
    particles.rotation.y=ti*0.05;}
  mM.forEach(m=>{const n=m.userData;if(n._y!==undefined)m.position.y=n._y+Math.sin(ti+n._x*0.2)*0.25});
  // Update edge positions
  eL.forEach(e=>{const f=mM.get(e.from),t=mM.get(e.to);if(f&&t){
    const p=e.line.geometry.attributes.position.array;
    p[0]=f.position.x;p[1]=f.position.y;p[2]=f.position.z;
    p[3]=t.position.x;p[4]=t.position.y;p[5]=t.position.z;
    e.line.geometry.attributes.position.needsUpdate=true;
  }});
  // Project labels to screen
  const cw=cv.clientWidth,ch=cv.clientHeight;
  lbs.forEach((d,id)=>{
    const m=mM.get(id);if(!m)return;
    v3.copy(m.position).project(cam);
    if(v3.z>1){d.style.display="none";return}
    d.style.display="flex";
    d.style.left=((v3.x*0.5+0.5)*cw)+"px";
    d.style.top=((-v3.y*0.5+0.5)*ch)+"px";
  });
  ren.render(sc,cam);
}
anim();

window.addEventListener("resize",()=>{
  cam.aspect=cv.clientWidth/cv.clientHeight;
  cam.updateProjectionMatrix();
  ren.setSize(Math.max(cv.clientWidth,1),Math.max(cv.clientHeight,1));
});



// Expose only controls used by existing inline HTML handlers.
Object.assign(window,{filterMap,closePanel,openPanel});

/* Progressive keyboard-accessible directory; values are text, not HTML. */
(function createDirectory(){
  const list=document.getElementById('journalist-entity-list');
  const search=document.getElementById('journalist-entity-search');
  if(!list||!search)return;
  function refresh(){
    const term=search.value.trim().toLocaleLowerCase();
    const visible=ND.filter(n=>(n.n+' '+(n.desc||'')+' '+(n.topics||[]).join(' ')).toLocaleLowerCase().includes(term));
    const frag=document.createDocumentFragment();
    for(const n of visible){
      const entry=document.createElement('article');entry.className='investigation-entity';
      const heading=document.createElement('strong');heading.textContent=n.n;entry.appendChild(heading);
      const type=document.createElement('small');type.textContent=n.t==='m'?'Organisation':'Journalist';entry.appendChild(type);
      const desc=document.createElement('p');desc.textContent=n.desc||'';entry.appendChild(desc);
      const button=document.createElement('button');button.type='button';button.className='entity-open';button.textContent='Open existing profile';button.addEventListener('click',()=>openPanel(n));entry.appendChild(button);
      frag.appendChild(entry);
    }
    list.replaceChildren(frag);
    list.setAttribute('aria-label',visible.length+' matching entries');
  }
  search.addEventListener('input',refresh);
  refresh();
})();
