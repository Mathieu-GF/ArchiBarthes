/* ArchiBarthes — Une géographie du fichier — prototype V1
   Lecture seule Heurist, à charger APRÈS core.js dans main-test.js.
   Base GrandFichier_RB : Lieux t:12 (28 géométrie, 133 catégorie, 1072 ville, 231 pays),
   Fiches t:102 (238 pointeur Lieux). Exclusions transports : 7234,7230,7233 + titres.
   Module de TEST ; ne touche pas au site de production.
*/
(function(){
'use strict';
const ROOT='#archibarthes-atlas', API='/heurist/hserv/controller/record_search.php';
const EXCLUDE=new Set(['7234','7230','7233']);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const values=(r,id)=>{const x=r.d?.[id];return Array.isArray(x)?x:x==null?[]:[x];};
const fmt=n=>n.toLocaleString('fr-FR');
function isTransport(r){
 const cats=values(r,'133').map(String);
 // Une catégorie de transport OU un titre commençant par le nom d'un transport.
 return cats.some(c=>EXCLUDE.has(c)) || /^(?:train|avion|bus|autocar)(?=$|[\s(,;:–—-])/i.test(String(r['2']||'').trim());
}
function point(r){
 const g=values(r,'28').find(v=>/\bPOINT\s*\(/i.test(String(v)) && !/\bMULTIPOINT\b/i.test(String(v)));
 if(!g)return null;
 const m=String(g).match(/(?:^|\s)POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/i);
 if(!m)return null;
 const lon=Number(m[1]),lat=Number(m[2]);
 return Number.isFinite(lon)&&Number.isFinite(lat)&&Math.abs(lon)<=180&&Math.abs(lat)<=90?{lon,lat}:null;
}
function init(){
 const root=document.querySelector(ROOT), section=root?.querySelector('#lieux');
 if(!section||section.dataset.geoPrototype==='1')return;
 section.dataset.geoPrototype='1';
 const css=document.createElement('style');css.id='ab-geo-prototype-style';css.textContent=`
 #archibarthes-atlas #lieux .abg-intro{max-width:830px}
 #archibarthes-atlas #lieux .abg-summary{display:flex;gap:24px;flex-wrap:wrap;margin:24px 0;color:#536f82;font:13px Arial,sans-serif}
 #archibarthes-atlas #lieux .abg-summary strong{display:block;color:#1a4058;font:30px Georgia,serif;margin-bottom:4px}
 #archibarthes-atlas #lieux .abg-grid{display:grid;grid-template-columns:1fr 1fr;gap:17px}
 #archibarthes-atlas #lieux .abg-card{min-width:0;border:1px solid #dce7ec;background:#f5f9fa;padding:19px}
 #archibarthes-atlas #lieux .abg-card h3{font:21px Georgia,serif;color:#193c53;margin:0 0 5px}
 #archibarthes-atlas #lieux .abg-sub{font:12px/1.6 Arial,sans-serif;color:#647f8e;margin:0 0 13px}
 #archibarthes-atlas #lieux .abg-viz{position:relative;min-height:260px}
 #archibarthes-atlas #lieux .abg-viz svg{display:block;width:100%;height:auto}
 #archibarthes-atlas #lieux .abg-dot{cursor:pointer;outline:none;transition:opacity .15s}
 #archibarthes-atlas #lieux .abg-dot:hover circle,#archibarthes-atlas #lieux .abg-dot:focus circle{stroke:#a85651;stroke-width:3.5}
 #archibarthes-atlas #lieux .abg-rank{margin-top:20px;padding:18px 20px;border:1px solid #dce7ec;background:#fff}
 #archibarthes-atlas #lieux .abg-rank h3{font:21px Georgia,serif;color:#193c53;margin:0 0 13px}
 #archibarthes-atlas #lieux .abg-item{display:grid;grid-template-columns:minmax(125px,2fr) minmax(70px,3fr) 50px;align-items:center;gap:10px;margin:9px 0;font:13px Arial,sans-serif;color:#294b61;cursor:pointer}
 #archibarthes-atlas #lieux .abg-track{height:9px;background:#e9f0f3}
 #archibarthes-atlas #lieux .abg-fill{height:100%;background:#7198b1}
 #archibarthes-atlas #lieux .abg-item[data-active="true"] .abg-fill{background:#a85651}
 #archibarthes-atlas #lieux .abg-item:focus-visible{outline:2px solid #3978a8}
 #archibarthes-atlas #lieux .abg-detail{margin-top:15px;padding:14px 16px;border-left:3px solid #7198b1;background:#edf4f7;min-height:24px;color:#2b5067;font:13px/1.6 Arial,sans-serif}
 #archibarthes-atlas #lieux .abg-foot{font:12px/1.6 Arial,sans-serif;color:#677f8f;margin-top:17px}
 @media(max-width:760px){#archibarthes-atlas #lieux .abg-grid{grid-template-columns:1fr}#archibarthes-atlas #lieux .abg-card{padding:12px}}
 `;document.head.appendChild(css);
 section.innerHTML=`<div class="wrap"><div class="section-head"><div><div class="eyebrow">07 / Géographie des mentions</div><h2>Une géographie du fichier</h2></div></div><p class="intro abg-intro">Des cafés parisiens aux lieux de séjour, la géographie du Grand Fichier se dessine par la récurrence des mentions. Il ne s'agit pas d'une carte des déplacements attestés de Roland Barthes.</p><div class="abg-summary" id="abgSummary"><span>Lecture des données Heurist…</span></div><div class="abg-grid"><div class="abg-card"><h3>Paris, en détail</h3><p class="abg-sub">Les lieux géolocalisés de Paris et de sa proche périphérie</p><div class="abg-viz" id="abgParis">Chargement…</div></div><div class="abg-card"><h3>Ailleurs</h3><p class="abg-sub">Les autres lieux géolocalisés · une vue des positions, sans fond cartographique</p><div class="abg-viz" id="abgElsewhere">Chargement…</div></div></div><div class="abg-rank"><h3>Les lieux qui reviennent</h3><div id="abgRank"></div><div class="abg-detail" id="abgDetail" aria-live="polite">Survolez ou sélectionnez un lieu pour lire sa fréquence.</div></div><p class="abg-foot" id="abgFoot">Source : Grand Fichier, base Heurist. Chaque fiche est comptée une seule fois par lieu. Trains, bus et avions exclus des calculs. Les lieux sans coordonnées figurent dans les statistiques, mais pas sur les vues géographiques.</p></div>`;
 const summary=section.querySelector('#abgSummary'), par=section.querySelector('#abgParis'),other=section.querySelector('#abgElsewhere'),rank=section.querySelector('#abgRank'),detail=section.querySelector('#abgDetail');
 let places=[],active=null;
 async function fetchType(type,fields){const p=new URLSearchParams({q:'t:'+type,w:'a',limit:'100000',detail:'rec_ID,rec_Title,'+fields.join(','),db:'GrandFichier_RB'});const res=await fetch(API,{method:'POST',body:p,credentials:'same-origin'});if(!res.ok)throw Error('HTTP '+res.status);const data=await res.json();if(data.status!=='ok'||!data.data?.records)throw Error(data.message||'Réponse Heurist inattendue');return Object.values(data.data.records);}
 const isParis=p=>p.point && p.point.lon>=2.17&&p.point.lon<=2.47&&p.point.lat>=48.78&&p.point.lat<=48.94;
 function chart(target,list,paris){
  if(!list.length){target.textContent='Aucune position géographique pour cette sélection.';return;}
  const W=520,H=340,L=33,R=24,T=25,B=31;
  let bounds=paris?{minX:2.17,maxX:2.47,minY:48.78,maxY:48.94}:{minX:Math.min(...list.map(x=>x.point.lon)),maxX:Math.max(...list.map(x=>x.point.lon)),minY:Math.min(...list.map(x=>x.point.lat)),maxY:Math.max(...list.map(x=>x.point.lat))};
  if(!paris){const dx=Math.max(.1,bounds.maxX-bounds.minX),dy=Math.max(.1,bounds.maxY-bounds.minY);bounds={minX:bounds.minX-dx*.08,maxX:bounds.maxX+dx*.08,minY:bounds.minY-dy*.08,maxY:bounds.maxY+dy*.08};}
  const x=v=>L+(v-bounds.minX)/Math.max(.0001,bounds.maxX-bounds.minX)*(W-L-R);
  const y=v=>H-B-(v-bounds.minY)/Math.max(.0001,bounds.maxY-bounds.minY)*(H-T-B);
  const max=Math.max(1,...list.map(p=>p.count));
  const grid=Array.from({length:5},(_,i)=>{const xx=L+(W-L-R)*i/4,yy=T+(H-T-B)*i/4;return`<line x1="${xx}" x2="${xx}" y1="${T}" y2="${H-B}" stroke="#dfe9ee"/><line x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}" stroke="#dfe9ee"/>`;}).join('');
  const dots=[...list].sort((a,b)=>a.count-b.count).map(p=>{const r=3.5+Math.sqrt(p.count/max)*13;return`<g class="abg-dot" tabindex="0" role="button" data-abg-id="${escapeHTML(p.id)}" aria-label="${escapeHTML(p.name)} : ${p.count} fiches"><circle cx="${x(p.point.lon).toFixed(2)}" cy="${y(p.point.lat).toFixed(2)}" r="${r.toFixed(2)}" fill="#5985a1" fill-opacity=".73" stroke="#fff" stroke-width="1.7"><title>${escapeHTML(p.name)} · ${p.count} fiche(s)</title></circle></g>`;}).join('');
  target.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Répartition des lieux selon leur longitude et leur latitude"><rect x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}" fill="#f8fbfc"/>${grid}${dots}<text x="${L}" y="${H-7}" font-size="11" fill="#617b8d">Longitude →</text><text x="${W-R}" y="${H-7}" text-anchor="end" font-size="11" fill="#617b8d">${list.length} lieux</text><text x="${L+6}" y="${T+14}" font-size="11" fill="#607c8b">↑ Latitude</text></svg>`;
 }
 function select(id){active=id;const p=places.find(v=>v.id===id);if(!p)return;const locality=[...new Set([...p.city,...p.country])].filter(Boolean).join(' · ');detail.innerHTML=`<strong>${escapeHTML(p.name)}</strong> — ${fmt(p.count)} fiche${p.count>1?'s':''}${locality?' · '+escapeHTML(locality):''}${!p.point?' · Sans coordonnées ponctuelles':''}`;section.querySelectorAll('[data-abg-id]').forEach(el=>{const hit=el.dataset.abgId===id;if(el.classList.contains('abg-item'))el.dataset.active=String(hit);else{const circle=el.querySelector('circle');if(circle){circle.setAttribute('stroke',hit?'#a85651':'#fff');circle.setAttribute('stroke-width',hit?'3.5':'1.7');}}});}
 section.addEventListener('click',e=>{const hit=e.target.closest('[data-abg-id]');if(hit&&section.contains(hit))select(hit.dataset.abgId);});
 section.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('[data-abg-id]')){e.preventDefault();select(e.target.closest('[data-abg-id]').dataset.abgId);}});
 section.addEventListener('pointerover',e=>{const hit=e.target.closest('[data-abg-id]');if(hit&&section.contains(hit))select(hit.dataset.abgId);});
 (async()=>{try{
  const [locs,fiches]=await Promise.all([fetchType(12,['28','133','1072','231']),fetchType(102,['238'])]);
  const good=locs.filter(r=>!isTransport(r)),byId=new Map(good.map(r=>[String(r['1']),r]));
  const counts=new Map();for(const f of fiches){for(const id of new Set(values(f,'238').map(String))){if(byId.has(id))counts.set(id,(counts.get(id)||0)+1);}}
  places=good.map(r=>({id:String(r['1']),name:String(r['2']||'Lieu sans nom'),count:counts.get(String(r['1']))||0,point:point(r),city:values(r,'1072').map(String),country:values(r,'231').map(String)})).filter(p=>p.count>0);
  const located=places.filter(p=>p.point),paris=located.filter(isParis),elsewhere=located.filter(p=>!isParis(p));
  const associations=places.reduce((s,p)=>s+p.count,0);
  summary.innerHTML=`<div><strong>${fmt(places.length)}</strong>Lieux distincts référencés</div><div><strong>${fmt(associations)}</strong>Associations fiche–lieu</div><div><strong>${fmt(located.length)}</strong>Lieux positionnés</div>`;
  chart(par,paris,true);chart(other,elsewhere,false);
  const top=[...places].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'fr')).slice(0,12),max=top[0]?.count||1;
  rank.innerHTML=top.map(p=>`<div class="abg-item" tabindex="0" role="button" data-abg-id="${escapeHTML(p.id)}"><span>${escapeHTML(p.name)}</span><span class="abg-track"><span class="abg-fill" style="display:block;width:${(100*p.count/max).toFixed(1)}%"></span></span><strong>${fmt(p.count)}</strong></div>`).join('');
  detail.textContent='Survolez ou sélectionnez un point ou un nom pour lire sa fréquence.';
  console.info('ArchiBarthes Géographie V1',{notices:locs.length,transportsExclus:locs.length-good.length,lieuxReferences:places.length,associations,lieuxPositionnes:located.length,paris:paris.length,ailleurs:elsewhere.length});
 }catch(e){summary.textContent='Impossible de charger les lieux depuis Heurist : '+e.message;par.textContent='Données indisponibles.';other.textContent='Données indisponibles.';console.error('ArchiBarthes Géographie',e);}})();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
