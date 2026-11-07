/* ArchiBarthes — Module « Le monde des noms » — V4.12 : étiquettes adaptatives et exploration au survol.
   Module expérimental chargé par atlas/main-test.js.
   Lecture seule : Fiche 102 / Personnes 10 / pointeur 16 / catégorie 263 / description 3 / date 9.
*/
(function(){
'use strict';
const ROOT='#archibarthes-atlas', API='/heurist/hserv/controller/record_search.php';
// Toutes les étiquettes sont candidates ; seules les collisions sont masquées.
 const COLORS={amis:'#648ba7',etudiants:'#789c91',famille:'#a56c6b',autres:'#97aebc'};
const CATEGORY={amis:['6967'],etudiants:['7237'],famille:['6966']};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=(r,id)=>{let x=r.d?.[id];return Array.isArray(x)?x:x==null?[]:[x];};
function parseYear(values){
 if(values.length!==1)return null;
 const s=String(values[0]||'').trim(), simple=s.match(/^(\d{4})(?:-\d{2}(?:-\d{2})?)?$/);
 if(simple)return +simple[1];
 if(!s.startsWith('|VER='))return null;
 const f=n=>{let m=s.match(new RegExp('(?:^|\\|)'+n+'=(\\d{4})(?:-|\\||$)'));return m?+m[1]:null;};
 const a=f('TPQ'),b=f('TAQ');
 if(a!=null&&b!=null)return a===b?a:null;
 return f('DAT');
}
async function fetchType(type,fields){
 const p=new URLSearchParams({q:'t:'+type,w:'a',limit:'100000',detail:'rec_ID,rec_Title,'+fields.join(','),db:'GrandFichier_RB'});
 const res=await fetch(API,{method:'POST',body:p,credentials:'same-origin'});
 if(!res.ok)throw Error('HTTP '+res.status);
 const data=await res.json();
 if(data.status!=='ok'||!data.data?.records)throw Error(data.message||'Réponse API inattendue');
 return Object.values(data.data.records);
}
// HTML éditorial Heurist : seules les balises de mise en forme autorisées sont conservées.
function safeBiography(raw){
 const doc=new DOMParser().parseFromString('<div>'+String(raw||'')+'</div>','text/html');
 const allowed=new Set(['P','BR','EM','I','STRONG','B','U','UL','OL','LI','A','BLOCKQUOTE','SPAN','SUP','SUB']);
 function clean(node){
  if(node.nodeType===Node.TEXT_NODE)return document.createTextNode(node.textContent);
  if(node.nodeType!==Node.ELEMENT_NODE)return document.createDocumentFragment();
  const fragment=document.createDocumentFragment();
  if(!allowed.has(node.tagName)){
   // Aucun contenu actif (scripts, styles, formulaires, SVG, etc.) ne doit passer.
   if(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','FORM','TEMPLATE'].includes(node.tagName))return fragment;
   [...node.childNodes].forEach(child=>fragment.appendChild(clean(child)));
   return fragment;
  }
  const el=document.createElement(node.tagName.toLowerCase());
  if(node.tagName==='A'){
   const href=node.getAttribute('href')||'';
   try{const url=new URL(href,location.href);if(['https:','http:','mailto:'].includes(url.protocol)){
    el.setAttribute('href',url.href);el.setAttribute('target','_blank');el.setAttribute('rel','noopener noreferrer');
   }}catch(_){}
  }
  [...node.childNodes].forEach(child=>el.appendChild(clean(child)));
  return el;
 }
 const out=document.createElement('div');
 [...doc.body.firstElementChild.childNodes].forEach(child=>out.appendChild(clean(child)));
 return out.innerHTML;
}
function init(){
 const root=document.querySelector(ROOT),section=root?.querySelector('#relations');
 // Ancienne démonstration thématique « Constellations » (section #themes).
 // Retrait limité au module expérimental : aucun changement dans core.js.
 const oldConstellation=root?.querySelector('#themes');
 if(oldConstellation){oldConstellation.hidden=true;oldConstellation.style.setProperty('display','none','important');}
 root?.querySelectorAll('a[href="#themes"]').forEach(a=>a.hidden=true);
 if(!section||root.dataset.namesV47)return;
 root.dataset.namesV47='1';
 // Un seul module remplace l'ancien espace de démonstration « Réseau relationnel ».
 const style=document.createElement('style');style.id='ab-names-style';style.textContent=`
 #archibarthes-atlas #relations .abn-toolbar{display:flex;flex-wrap:wrap;gap:9px;justify-content:flex-end;align-items:center}
 #archibarthes-atlas #relations .abn-tabs{display:flex;flex-wrap:wrap;gap:7px}
 #archibarthes-atlas #relations .abn-btn{background:#fff;border:1px solid #b8cad4;color:#214a63;padding:9px 13px;border-radius:3px;font:600 12px Arial,sans-serif;cursor:pointer;transition:background .2s,color .2s,border-color .2s}
 #archibarthes-atlas #relations .abn-btn:hover{border-color:#397b9f;background:#edf5f8}
 #archibarthes-atlas #relations .abn-btn[aria-pressed="true"]{background:#234f6b;color:#fff;border-color:#234f6b}
 #archibarthes-atlas #relations .abn-panel{border:1px solid #dce7ec;background:#fff;padding:15px;position:relative;border-radius:3px}
 #archibarthes-atlas #relations .abn-graph{position:relative;min-height:360px;background:radial-gradient(ellipse at center,#f9fbfc 0%,#f0f5f7 100%);overflow:hidden}
 #archibarthes-atlas #relations .abn-graph svg{display:block;width:100%;height:auto;touch-action:none}
 #archibarthes-atlas #relations .abn-foot{display:flex;gap:13px;flex-wrap:wrap;align-items:center;justify-content:space-between;color:#557287;font:12px Arial,sans-serif;margin-top:12px}
 #archibarthes-atlas #relations .abn-filters{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:12px 0}
 #archibarthes-atlas #relations .abn-filters label{font:12px Arial,sans-serif;color:#45667b}
 #archibarthes-atlas #relations .abn-filters select,#archibarthes-atlas #relations .abn-filters input{border:1px solid #cbd9e1;background:white;padding:7px 9px;color:#234b65;font:13px Arial,sans-serif;min-width:95px}
 #archibarthes-atlas #relations .abn-filters input{flex:1;max-width:190px;min-width:115px}
 #archibarthes-atlas #relations .abn-kpis{display:flex;flex-wrap:wrap;gap:20px;margin:10px 0 15px;color:#547185;font:12px Arial,sans-serif}
 #archibarthes-atlas #relations .abn-kpis strong{display:block;color:#183e55;font:27px Georgia,serif;margin-bottom:5px}
 #archibarthes-atlas #relations .abn-detail{position:absolute;right:0;top:0;bottom:0;width:min(36%,410px);box-sizing:border-box;z-index:8;background:#fff;box-shadow:-8px 0 26px #173d5526;border-left:1px solid #dce7ec;padding:24px;overflow-y:auto;transform:translateX(105%);visibility:hidden;transition:transform .25s ease,visibility .25s;font:13px/1.6 Arial,sans-serif;color:#516f82}
 #archibarthes-atlas #relations .abn-detail.is-open{transform:translateX(0);visibility:visible}
 #archibarthes-atlas #relations .abn-detail-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:22px}
 #archibarthes-atlas #relations .abn-detail-kicker{font:600 11px Arial,sans-serif;letter-spacing:.13em;text-transform:uppercase;color:#65849a}
 #archibarthes-atlas #relations .abn-close{border:1px solid #dce7ec;background:#fff;color:#234f6b;font:22px Arial,sans-serif;cursor:pointer;width:32px;height:32px}
 #archibarthes-atlas #relations .abn-detail .abn-name{display:block;color:#1f4a64;font:24px Georgia,serif}
 #archibarthes-atlas #relations .abn-detail .abn-description{margin:18px 0;white-space:normal;color:#304f62;font:14px/1.65 Arial,sans-serif;overflow-wrap:anywhere}
 #archibarthes-atlas #relations .abn-description p{margin:0 0 12px}
 #archibarthes-atlas #relations .abn-detail .abn-count{border-top:1px solid #e3ebef;padding-top:12px;font:12px/1.6 Arial,sans-serif;color:#627d8d}
 @media(max-width:760px){#archibarthes-atlas #relations .abn-detail{width:min(90%,380px);padding:17px}}
 #archibarthes-atlas #relations .abn-tip{display:none;position:fixed;z-index:2147483000;pointer-events:none;background:#173d54;color:white;padding:9px 12px;border-radius:3px;box-shadow:0 3px 14px #092a3833;font:12px/1.5 Arial,sans-serif;max-width:290px}
 #archibarthes-atlas #relations .abn-msg{color:#58768a;font:14px/1.6 Arial,sans-serif;padding:25px}
 #archibarthes-atlas #relations .abn-label{font:11.5px Georgia,serif;fill:#23455c;paint-order:stroke;stroke:#f7fafb;stroke-width:3px;stroke-linejoin:round;pointer-events:none}
  #archibarthes-atlas #relations .abn-leader{stroke:#7393a7;stroke-width:.8;opacity:.55;pointer-events:none}
 #archibarthes-atlas #relations .abn-node{cursor:grab;outline:none}
 #archibarthes-atlas #relations .abn-node:focus circle{stroke:#a85651;stroke-width:4}
 @media(max-width:760px){#archibarthes-atlas #relations .abn-toolbar{justify-content:flex-start}#archibarthes-atlas #relations .abn-panel{padding:9px}#archibarthes-atlas #relations .abn-graph{min-height:220px}}
 @media(prefers-reduced-motion:reduce){#archibarthes-atlas #relations .abn-btn{transition:none}}
 `;document.head.appendChild(style);
 section.innerHTML=`<div class="wrap"><div class="section-head"><div><div class="eyebrow">06 / Personnes et présences</div><h2>Le monde des noms</h2></div><div class="abn-toolbar"><div class="abn-tabs" role="group" aria-label="Constellations de personnes"><button class="abn-btn" data-abn-tab="amis" aria-pressed="true">Ami.e.s</button><button class="abn-btn" data-abn-tab="etudiants">Étudiant.e.s</button><button class="abn-btn" data-abn-tab="famille">Famille</button><button class="abn-btn" data-abn-tab="tous">Toutes les présences</button></div></div></div><p class="intro">Autour de Roland Barthes, un monde de présences : ami.e.s, étudiant.e.s et membres de sa famille. Chaque cercle représente une personne mentionnée dans le Grand Fichier ; sa <strong>surface</strong> traduit le nombre de fiches distinctes où elle apparaît. Les traits indiquent uniquement cette présence documentaire.</p><div class="abn-panel"><div class="abn-filters"><label for="abnYear">Période</label><select id="abnYear"><option value="all">1968–1980</option></select><label for="abnSearch">Rechercher</label><input id="abnSearch" type="search" placeholder="Nom de personne" autocomplete="off"></div><div id="abnKpis" class="abn-kpis" aria-live="polite"></div><div id="abnGraph" class="abn-graph"><div class="abn-msg">Chargement des notices et des fiches Heurist…</div></div><div class="abn-foot"><span>Déplacer les cercles à la souris · Survoler ou sélectionner un nom</span><span id="abnFoot">Données Heurist</span></div></div><p class="note">Les catégories de personnes peuvent se recouper. La vue « Toutes les présences » réunit uniquement ami.e.s, étudiant.e.s et famille, sans inclure les auteurs simplement cités. Une même personne n'est comptée qu'une fois par fiche. Les liens indiquent une présence documentaire, non une proximité affective. Les fiches sans date annuelle univoque sont comprises dans le total général, mais pas dans les vues annuelles.</p></div>`;
 const graph=section.querySelector('#abnGraph'), kpis=section.querySelector('#abnKpis'),yearInput=section.querySelector('#abnYear'),searchInput=section.querySelector('#abnSearch');
 const detail=document.createElement('aside');detail.id='abnDetail';detail.className='abn-detail';detail.setAttribute('aria-hidden','true');graph.appendChild(detail);
 const tip=document.createElement('div');tip.className='abn-tip';section.appendChild(tip);
 let state={tab:'amis',year:'all',search:''},people=new Map(),indexed=[],categoryMap=new Map(),rendered=[],nodes=[],raf=0,stage=null,selected=null,drag=null,alpha=0;
 const W=1120,H=720,CX=W/2,CY=H/2;
 function descendants(){
  const tree=window.$Db?.trm_TreeData?.('5432','tree');
  if(!Array.isArray(tree)||!tree.length)throw Error('Vocabulaire « Person type » indisponible (5432).');
  function visit(node,anc){const id=String(node.key),set=new Set([...anc,id]);categoryMap.set(id,set);for(const c of node.children||[])visit(c,set);}
  tree.forEach(n=>visit(n,[]));
 }
 function belongs(person,group){if(group==='tous')return ['amis','etudiants','famille'].some(g=>belongs(person,g));return person.cats.some(id=>[...categoryMap.get(id)||[id]].some(t=>CATEGORY[group].includes(t)));}
 function labelGroup(p){return ['amis','etudiants','famille'].find(group=>belongs(p,group))||'autres';}
 function countFor(p,year){return year==='all'?p.all.size:(p.years.get(Number(year))?.size||0);}
 function categoryNames(p){return p.cats.map(id=>window.$Db?.getTermValue?.(id)||id).join(' · ')||'Sans catégorie';}
 function nodeRadius(count,max){return 3.8+Math.sqrt(count/Math.max(max,1))*26;}
 function tooltip(ev,n){tip.innerHTML='<strong>'+esc(n.name)+'</strong><br>'+n.count+' fiche'+(n.count>1?'s':'')+' · '+(state.year==='all'?'Toutes dates':state.year);tip.style.display='block';moveTip(ev);}
 function moveTip(ev){tip.style.left=Math.max(6,Math.min(ev.clientX+16,innerWidth-tip.offsetWidth-12))+'px';tip.style.top=Math.max(6,ev.clientY-tip.offsetHeight-12)+'px';}
 function hideTip(){tip.style.display='none';}
 function showDetail(n){
  selected=n?.id||null;
  if(n){
   const description=n.person.description.trim();
   const count=n.count.toLocaleString('fr-FR');
   const period=state.year==='all'?'toutes dates':'en '+state.year;
   detail.innerHTML='<div class="abn-detail-head"><span class="abn-detail-kicker">Notice biographique</span><button type="button" class="abn-close" aria-label="Fermer la notice">×</button></div>'+ 
    '<strong class="abn-name">'+esc(n.name)+'</strong>'+
    (description?'<div class="abn-description">'+safeBiography(description)+'</div>':'<p class="abn-description">Aucune description renseignée.</p>')+
    '<p class="abn-count">'+count+' fiche'+(n.count>1?'s':'')+' associée'+(n.count>1?'s':'')+' · '+period+'</p>';
   detail.classList.add('is-open');detail.setAttribute('aria-hidden','false');detail.scrollTop=0;
  }else{
   detail.classList.remove('is-open');detail.setAttribute('aria-hidden','true');
   detail.innerHTML='';
  }
  graph.querySelectorAll('.abn-node').forEach(el=>{const hit=el.getAttribute('data-id')===selected;el.querySelector('circle')?.setAttribute('stroke',hit?'#a85651':'#fff');el.querySelector('circle')?.setAttribute('stroke-width',hit?'4':'2');});
 }
 detail.addEventListener('click',ev=>{if(ev.target.closest('.abn-close'))showDetail(null);});
 section.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&selected)showDetail(null);});

 function build(){
  cancelAnimationFrame(raf);hideTip();
  let list=[...people.values()].filter(p=>belongs(p,state.tab)).map(p=>({id:p.id,name:p.name,person:p,count:countFor(p,state.year)})).filter(p=>p.count>0).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'fr'));
  const total=list.length, match=state.search.trim().toLocaleLowerCase('fr');
  if(match)list=list.filter(p=>p.name.toLocaleLowerCase('fr').includes(match));
  // Toutes les personnes correspondant à la sélection sont affichées, même avec une seule fiche.
  const largest=Math.max(1,...list.map(p=>p.count));
  rendered=list;
  kpis.innerHTML='<div><strong>'+total.toLocaleString('fr-FR')+'</strong>personnes indexées</div><div><strong>'+list.length.toLocaleString('fr-FR')+'</strong>cercles affichés</div><div><strong>'+list.reduce((s,p)=>s+p.count,0).toLocaleString('fr-FR')+'</strong>associations fiche–personne affichées</div>';
  section.querySelector('#abnFoot').textContent=state.year==='all'?'Toutes dates · ensemble des présences':'Année '+state.year+' · ensemble des présences';
  if(!list.length){graph.replaceChildren();graph.innerHTML='<div class="abn-msg">Aucune personne indexée pour cette sélection.</div>';graph.appendChild(detail);showDetail(null);return;}
  // Positions initiales déterministes, légèrement décalées : aucune relation entre périphériques.
  nodes=list.map((p,i)=>{const t=i*2.399963229728653,dist=135+Math.sqrt((i+.5)/list.length)*205;
   return {...p,r:nodeRadius(p.count,largest),x:CX+Math.cos(t)*dist,y:CY+Math.sin(t)*dist,vx:0,vy:0,color:COLORS[labelGroup(p.person)]};});
  const lines=nodes.map(n=>'<line data-edge="'+esc(n.id)+'" x1="'+CX+'" y1="'+CY+'" x2="'+n.x+'" y2="'+n.y+'" stroke="#a8becb" stroke-width="1.2" opacity=".48"/>').join('');
  const circles=nodes.map(n=>'<g class="abn-node" tabindex="0" role="button" aria-label="'+esc(n.name)+', '+n.count+' fiches" data-id="'+esc(n.id)+'" transform="translate('+n.x+' '+n.y+')"><circle r="'+n.r.toFixed(2)+'" fill="'+n.color+'" stroke="#fff" stroke-width="2"/><title>'+esc(n.name)+' · '+n.count+' fiches</title></g>').join('');
  const labelled=nodes;
   const labels=labelled.map(n=>'<text class="abn-label" data-label="'+esc(n.id)+'" aria-hidden="true">'+esc(n.name)+'</text>').join('');
   graph.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Constellation des personnes mentionnées dans le fichier, Roland Barthes au centre"><g class="abn-edges">'+lines+'</g><g class="abn-nodes">'+circles+'</g><g class="abn-leaders" pointer-events="none"></g><g class="abn-labels" pointer-events="none">'+labels+'</g><g pointer-events="none"><circle cx="'+CX+'" cy="'+CY+'" r="49" fill="#173d55" stroke="white" stroke-width="4"/><text x="'+CX+'" y="'+(CY-5)+'" fill="white" font-family="Georgia,serif" font-size="21" text-anchor="middle">Roland</text><text x="'+CX+'" y="'+(CY+18)+'" fill="white" font-family="Georgia,serif" font-size="21" text-anchor="middle">Barthes</text></g></svg>';
  graph.appendChild(detail);
  stage=graph.querySelector('svg');
  const els=new Map([...graph.querySelectorAll('.abn-node')].map(el=>[el.dataset.id,el]));
  const edges=new Map([...graph.querySelectorAll('[data-edge]')].map(el=>[el.dataset.edge,el]));
   const labelEls=new Map([...graph.querySelectorAll('[data-label]')].map(el=>[el.dataset.label,el]));
   // Priorité aux noms les plus présents ; éviter les collisions avec cercles et étiquettes.
   // Les étiquettes suivent les nœuds au cours de la simulation et du déplacement manuel.
   const leaderLayer=stage.querySelector('.abn-leaders');
   let labelsDirty=true,paintFrame=0,hovered=null;
   const labelPositions=new Map();
   // Placement déterministe : proximité prioritaire, puis décalages progressifs.
   // Tous les noms sont candidats, sans plafond numérique.
   function paintLabels(){
    const occupied=[];labelPositions.clear();
    const leaders=[];
    for(const n of labelled){
     const el=labelEls.get(n.id);if(!el)continue;
     el.style.display='';
     const width=Math.min(W-20,Math.ceil(el.getComputedTextLength())+3);
     const height=16,preferred=n.x>=CX?1:-1;
     let chosen=null;
     for(const offset of [0,-19,19,-38,38,-57,57,-76,76,-95,95,-114,114]){
      for(const side of [preferred,-preferred]){
       const x=side>0?n.x+n.r+8:n.x-n.r-8-width;
       const y=n.y+offset-height/2;
       const rect={x,y,w:width,h:height};
       if(x<7||x+width>W-7||y<7||y+height>H-7)continue;
       if(occupied.some(b=>x<b.x+b.w+5&&x+width+5>b.x&&y<b.y+b.h+4&&y+height+4>b.y))continue;
       if(nodes.some(other=>{
        const nx=Math.max(x,Math.min(other.x,x+width)),ny=Math.max(y,Math.min(other.y,y+height));
        return Math.hypot(other.x-nx,other.y-ny)<other.r+3;
       }))continue;
       const nx=Math.max(x,Math.min(CX,x+width)),ny=Math.max(y,Math.min(CY,y+height));
       if(Math.hypot(CX-nx,CY-ny)<58)continue;
       chosen={...rect,side,offset};break;
      }
      if(chosen)break;
     }
     if(chosen){
      el.setAttribute('x',chosen.x);el.setAttribute('y',chosen.y+12);
      el.style.display='';occupied.push(chosen);labelPositions.set(n.id,chosen);
      if(Math.abs(chosen.offset)>12){
       const endX=chosen.side>0?chosen.x-3:chosen.x+chosen.w+3;
       const endY=chosen.y+chosen.h/2;
       leaders.push('<line class="abn-leader" x1="'+(n.x+(chosen.side*n.r)).toFixed(1)+'" y1="'+n.y.toFixed(1)+'" x2="'+endX.toFixed(1)+'" y2="'+endY.toFixed(1)+'"/>');
      }
     }else el.style.display='none';
    }
    leaderLayer.innerHTML=leaders.join('');
    labelsDirty=false;
   }
   function highlight(n){
    if(hovered===n?.id)return;
    hovered=n?.id||null;
    for(const item of nodes){
     const active=!n||item.id===n.id;
     els.get(item.id)?.setAttribute('opacity',active?'1':'.23');
     edges.get(item.id)?.setAttribute('opacity',active?(n?'.95':'.48'):'.09');
     const label=labelEls.get(item.id);
     if(label){label.setAttribute('opacity',active?'1':'.22');}
    }
    if(n){
     const el=labelEls.get(n.id);
     if(el){el.style.display='';el.setAttribute('x',Math.min(W-12,n.x+n.r+9));el.setAttribute('y',Math.max(16,n.y-9));el.setAttribute('opacity','1');}
    }else labelsDirty=true;
   }

   function paint(){for(const n of nodes){els.get(n.id)?.setAttribute('transform','translate('+n.x.toFixed(2)+' '+n.y.toFixed(2)+')');const edge=edges.get(n.id);if(edge){edge.setAttribute('x2',n.x.toFixed(2));edge.setAttribute('y2',n.y.toFixed(2));}}if(++paintFrame%12===0||labelsDirty)paintLabels();}
  function tick(){
   const stop=alpha<.012&&!drag;
   if(stop){labelsDirty=true;paint();return;}
   for(const n of nodes){if(drag===n.id)continue;
    const dx=n.x-CX,dy=n.y-CY,d=Math.max(1,Math.hypot(dx,dy)),target=103+(n.r*1.5)+Math.sqrt(nodes.length)*8;
    n.vx+=(dx/d)*(target-d)*.0025*alpha;n.vy+=(dy/d)*(target-d)*.0025*alpha;
    // La gravité reste douce, les collisions empêchent les chevauchements.
    const centerOverlap=65+n.r-d;if(centerOverlap>0){n.vx+=dx/d*centerOverlap*.07;n.vy+=dy/d*centerOverlap*.07;}
    n.vx+=(CX-n.x)*.00015*alpha;n.vy+=(CY-n.y)*.00015*alpha;
   }
   for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
    const a=nodes[i],b=nodes[j];let dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy)||.01;
    const want=a.r+b.r+3,near=Math.max(want,35),force=d<want?(want-d)*.066:d<near?(near-d)*.002:0;
    if(force){const fx=dx/d*force,fy=dy/d*force;if(drag!==a.id){a.vx+=fx;a.vy+=fy;}if(drag!==b.id){b.vx-=fx;b.vy-=fy;}}
   }
   for(const n of nodes){if(drag===n.id)continue;n.vx*=.83;n.vy*=.83;n.x=Math.max(n.r+4,Math.min(W-n.r-4,n.x+n.vx));n.y=Math.max(n.r+4,Math.min(H-n.r-4,n.y+n.vy));}
   paint();alpha*=.982;raf=requestAnimationFrame(tick);
  }
  alpha=1;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced){for(let j=0;j<170;j++){alpha=Math.max(.03,1-j/170); // Mise en place sans animation affichée
    for(const n of nodes){n.x=Math.max(n.r+4,Math.min(W-n.r-4,n.x));n.y=Math.max(n.r+4,Math.min(H-n.r-4,n.y));}}
   paint();alpha=0;
  }else raf=requestAnimationFrame(tick);
  function nodeAt(t){const el=t.closest?.('.abn-node');return el?nodes.find(n=>n.id===el.dataset.id):null;}
  stage.addEventListener('pointermove',ev=>{if(drag){const r=stage.getBoundingClientRect(),n=nodes.find(n=>n.id===drag);if(!n)return;n.x=Math.max(n.r,Math.min(W-n.r,(ev.clientX-r.left)*W/r.width));n.y=Math.max(n.r,Math.min(H-n.r,(ev.clientY-r.top)*H/r.height));n.vx=n.vy=0;alpha=Math.max(alpha,.15);labelsDirty=true;paint();hideTip();return;}const n=nodeAt(ev.target);if(n){tooltip(ev,n);highlight(n);}else{hideTip();highlight(null);}});
  stage.addEventListener('pointerleave',()=>{hideTip();highlight(null);});
  stage.addEventListener('pointerdown',ev=>{const n=nodeAt(ev.target);if(!n)return;drag=n.id;try{ev.target.closest('.abn-node').setPointerCapture(ev.pointerId);}catch(_){}hideTip();});
  function endDrag(ev){if(!drag)return;const n=nodes.find(n=>n.id===drag);drag=null;if(n){labelsDirty=true;alpha=.28;cancelAnimationFrame(raf);if(!reduced)raf=requestAnimationFrame(tick);showDetail(n);}}
  stage.addEventListener('pointerup',endDrag);stage.addEventListener('pointercancel',endDrag);
  stage.addEventListener('click',ev=>{const n=nodeAt(ev.target);if(n)showDetail(n);});
  stage.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){const n=nodeAt(ev.target);if(n){ev.preventDefault();showDetail(n);}}});
  showDetail(null);
 }
 section.addEventListener('click',e=>{const button=e.target.closest('[data-abn-tab]');if(!button)return;state.tab=button.dataset.abnTab;section.querySelectorAll('[data-abn-tab]').forEach(x=>x.setAttribute('aria-pressed',String(x===button)));build();});
 yearInput.addEventListener('change',()=>{state.year=yearInput.value;build();});

 searchInput.addEventListener('input',()=>{state.search=searchInput.value;build();});
 window.addEventListener('scroll',hideTip,{passive:true});
 async function load(){try{
  descendants();
  const [pr,fr]=await Promise.all([fetchType(10,['263','3']),fetchType(102,['9','16'])]);
  people=new Map(pr.map(r=>{const id=String(r['1']),name=String(r['2']||'Personne '+id),cats=[...new Set(get(r,'263').map(String))];return[id,{id,name,cats,description:get(r,'3').map(String).filter(Boolean).join('\n'),all:new Set(),years:new Map()}];}));
  let unlinked=0,linked=0;
  for(const f of fr){const fiche=String(f['1']),year=parseYear(get(f,'9'));
   for(const id of new Set(get(f,'16').map(String))){const p=people.get(id);if(!p){unlinked++;continue;}linked++;p.all.add(fiche);if(year!=null&&year>=1968&&year<=1980){if(!p.years.has(year))p.years.set(year,new Set());p.years.get(year).add(fiche);}}
  }
  for(let y=1968;y<=1980;y++)yearInput.insertAdjacentHTML('beforeend','<option value="'+y+'">'+y+'</option>');
  section.querySelector('#abnFoot').textContent=fr.length+' fiches · '+people.size+' notices personnes';
  console.info('ArchiBarthes : constellation V4.10 chargée',{fiches:fr.length,personnes:people.size,associations:linked,pointeursSansNotice:unlinked});
  build();
 }catch(err){graph.innerHTML='<div class="abn-msg">Constellation indisponible : '+esc(err.message)+'</div>';console.error('ArchiBarthes constellation',err);}}
 load();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
