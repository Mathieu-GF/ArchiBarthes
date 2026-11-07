/* ArchiBarthes — Géographie du fichier V2 — édition infographique.
 * Module test, lecture seule. Dans main-test.js :
 * await load('atlas/lieux-test.js?v=' + Date.now());
 * Heurist GrandFichier_RB : Lieux 12 (133 catégorie, 1072 ville, 231 pays), Fiches 102 (238 lieux).
 * Une fiche est comptée une seule fois par ville, pays ou lieu.
 * Sources géographiques : champs explicites Ville/Pays, sans inventer une ville depuis une coordonnée.
 */
(function(){
'use strict';
const ROOT='#archibarthes-atlas',API='/heurist/hserv/controller/record_search.php';
const TRANSPORT=new Set(['7234','7230','7233']);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const vals=(r,id)=>{const v=r.d?.[id];return Array.isArray(v)?v:v==null?[]:[v];};
const format=n=>Number(n).toLocaleString('fr-FR');
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
function transport(r){return vals(r,'133').map(String).some(x=>TRANSPORT.has(x))||/^(train|avion|bus|autocar)(?=$|[\s(,;:–—-])/i.test(String(r['2']||'').trim());}
function countryFrance(s){return ['france','fr','francia','french republic','republique francaise'].includes(norm(s));}
function canonical(s){return String(s||'').replace(/^[\s'"“”]+|[\s'"“”]+$/g,'').replace(/\s+/g,' ').trim();}
async function fetchType(t,fields){const p=new URLSearchParams({q:'t:'+t,w:'a',limit:'100000',detail:'rec_ID,rec_Title,'+fields.join(','),db:'GrandFichier_RB'});const r=await fetch(API,{method:'POST',body:p,credentials:'same-origin'});if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();if(j.status!=='ok'||!j.data?.records)throw Error(j.message||'Réponse Heurist invalide');return Object.values(j.data.records);}
function addTo(map,name,ids,placeId){const label=canonical(name);if(!label)return;const k=norm(label);if(!k)return;let row=map.get(k);if(!row){row={name:label,key:k,ids:new Set(),places:new Set()};map.set(k,row);}ids.forEach(id=>row.ids.add(id));row.places.add(placeId);}
function svgBubble(rows){
 const W=680,H=440, cx=340,cy=226;
 if(!rows.length)return '<p class="abg-empty">Aucune ville française renseignée dans les fiches liées.</p>';
 const top=rows.slice(0,20),extra=rows.slice(20);
 if(extra.length){const ids=new Set(),places=new Set();extra.forEach(r=>{r.ids.forEach(id=>ids.add(id));r.places.forEach(id=>places.add(id));});top.push({key:'__other',name:'Autres villes',ids,places,count:ids.size,aggregate:true});}
 const max=top[0].count, ns=top.map((r,i)=>({...r,r:Math.max(13,Math.sqrt(r.count/max)*91),x:cx+Math.cos(i*2.3999632)*(48+Math.sqrt(i)*35),y:cy+Math.sin(i*2.3999632)*(42+Math.sqrt(i)*27)}));
 // Déplacement déterministe de cercles, sans chevauchements.
 for(let t=0;t<350;t++){
  for(let i=0;i<ns.length;i++)for(let j=i+1;j<ns.length;j++){
   const a=ns[i],b=ns[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.01,want=a.r+b.r+5;
   if(d<want){const f=(want-d)/2,ux=dx/d,uy=dy/d;a.x-=ux*f;a.y-=uy*f;b.x+=ux*f;b.y+=uy*f;}
  }
  for(const n of ns){n.x+=(cx-n.x)*.007;n.y+=(cy-n.y)*.007;n.x=Math.max(n.r+7,Math.min(W-n.r-7,n.x));n.y=Math.max(n.r+8,Math.min(H-n.r-8,n.y));}
 }
 return '<svg viewBox="0 0 '+W+' '+H+'" role="group" aria-label="Villes françaises, cercles proportionnels au nombre de fiches distinctes">'+ns.map((n,i)=>{
  const text=esc(n.name),font=n.r>=48?Math.min(24,11+n.r*.13):n.r>=29?13:10;
  const lines=n.name.length>14&&n.r>48?n.name.split(/\s+/).reduce((a,w)=>{if(!a.length||a[a.length-1].length+w.length>12)a.push(w);else a[a.length-1]+=' '+w;return a;},[]):[n.name];
  const show=n.r>=27,inside=n.r>=48;
  const names=show?lines.slice(0,2).map((txt,j)=>`<text x="${n.x.toFixed(1)}" y="${(n.y+(j-(Math.min(lines.length,2)-1)/2)*font*1.15+(inside?-3:4)).toFixed(1)}" text-anchor="middle" font-family="Georgia,serif" font-size="${font}" fill="${inside?'#fff':'#163b54'}" pointer-events="none">${esc(txt)}</text>`).join(''):'';
  const number=inside?`<text x="${n.x.toFixed(1)}" y="${(n.y+font*1.5).toFixed(1)}" text-anchor="middle" font-family="Georgia,serif" font-size="${Math.max(12,font*.93)}" fill="#fff" pointer-events="none">${format(n.count)}</text>`:'';
  return `<g class="abg-bubble" data-geo-kind="city" data-geo-key="${esc(n.key)}" tabindex="0" role="button" aria-label="${text}, ${format(n.count)} fiches"><circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${n.r.toFixed(1)}" fill="${i===0?'#214d69':i<4?'#5f91af':'#bad3e0'}" stroke="white" stroke-width="2"/><title>${text} · ${format(n.count)} fiches</title>${names}${number}</g>`;
 }).join('')+'</svg>';
}
function arc(cx,cy,r0,r1,a0,a1){const p=(r,a)=>[cx+r*Math.cos(a),cy-r*Math.sin(a)];const a=p(r1,a0),b=p(r1,a1),c=p(r0,a1),d=p(r0,a0);return `M${a[0].toFixed(2)},${a[1].toFixed(2)} A${r1},${r1} 0 ${a0-a1>Math.PI?1:0} 0 ${b[0].toFixed(2)},${b[1].toFixed(2)} L${c[0].toFixed(2)},${c[1].toFixed(2)} A${r0},${r0} 0 ${a0-a1>Math.PI?1:0} 1 ${d[0].toFixed(2)},${d[1].toFixed(2)} Z`;}
function svgCountries(rows){
 if(!rows.length)return '<p class="abg-empty">Aucun pays étranger renseigné dans les notices liées.</p>';
 const W=680,H=440,cx=340,cy=365,outer=265,inner=139,top=rows.slice(0,6),other=rows.slice(6);
 if(other.length){const ids=new Set(),places=new Set();other.forEach(r=>{r.ids.forEach(x=>ids.add(x));r.places.forEach(x=>places.add(x));});top.push({name:'Autres pays',key:'__other',ids,places,count:ids.size,aggregate:true});}
 // Les catégories pays peuvent partager des fiches ; la demi-couronne visualise la somme des fréquences par pays.
 const total=top.reduce((n,r)=>n+r.count,0),colors=['#275a79','#5f93b1','#93b8cc','#bed4df','#d5e3e9','#e7edf0','#eef1f2'];let a=Math.PI;
 const parts=top.map((r,i)=>{const start=a,end=a-Math.PI*r.count/total;a=end;const mid=(start+end)/2,at=202,px=cx+at*Math.cos(mid),py=cy-at*Math.sin(mid);const pct=100*r.count/total;const label=pct>=9?`<text x="${px.toFixed(1)}" y="${(py-4).toFixed(1)}" text-anchor="middle" fill="${i<2?'white':'#173d55'}" font-family="Georgia,serif" font-size="${pct>20?19:14}" pointer-events="none">${esc(r.name.length>18?r.name.slice(0,17)+'…':r.name)}</text><text x="${px.toFixed(1)}" y="${(py+18).toFixed(1)}" text-anchor="middle" fill="${i<2?'white':'#173d55'}" font-family="Georgia,serif" font-size="14" pointer-events="none">${format(r.count)} fiches</text>`:'';return `<g class="abg-segment" tabindex="0" role="button" data-geo-kind="country" data-geo-key="${esc(r.key)}" aria-label="${esc(r.name)}, ${format(r.count)} fiches"><path d="${arc(cx,cy,inner,outer,start,end)}" fill="${colors[i%colors.length]}" stroke="#fff" stroke-width="2.5"/><title>${esc(r.name)} · ${format(r.count)} fiches</title>${label}</g>`;}).join('');
 return `<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Pays étrangers mentionnés, demi-couronne des fréquences documentaires">${parts}<text x="${cx}" y="${cy-66}" text-anchor="middle" font-family="Georgia,serif" font-size="24" fill="#173d55">Pays étrangers</text><text x="${cx}" y="${cy-34}" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" fill="#56758a">${format(rows.length)} pays renseignés</text><text x="${cx}" y="${cy-12}" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#647e8d">surface = mentions par pays</text></svg>`;
}
function init(){
 const root=document.querySelector(ROOT),section=root?.querySelector('#lieux');if(!section||section.dataset.geoV2)return;section.dataset.geoV2='1';
 const css=document.createElement('style');css.id='ab-geo-v2-style';css.textContent=`
 #archibarthes-atlas #lieux .abg2-intro{max-width:1000px}
 #archibarthes-atlas #lieux .abg2-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:26px}
 #archibarthes-atlas #lieux .abg2-card{min-width:0;padding:22px 22px 10px;background:#f2f7f9;border-radius:7px}
 #archibarthes-atlas #lieux .abg2-card h3{font:30px Georgia,serif;color:#173d55;margin:0 0 7px}
 #archibarthes-atlas #lieux .abg2-sub{font:13px/1.65 Arial,sans-serif;color:#547388;margin:0}
 #archibarthes-atlas #lieux .abg2-art{margin-top:8px;min-height:300px}
 #archibarthes-atlas #lieux .abg2-art svg{display:block;width:100%;height:auto;max-height:480px}
 #archibarthes-atlas #lieux .abg-bubble,#archibarthes-atlas #lieux .abg-segment{cursor:pointer;transition:opacity .15s}
 #archibarthes-atlas #lieux .abg-bubble:focus-visible,#archibarthes-atlas #lieux .abg-segment:focus-visible{outline:none}
 #archibarthes-atlas #lieux [data-geo-key].is-active>circle,#archibarthes-atlas #lieux [data-geo-key].is-active>path{stroke:#ae5956;stroke-width:4}
 #archibarthes-atlas #lieux .abg2-legend{display:flex;flex-wrap:wrap;gap:7px 14px;margin:4px 0 12px;font:12px Arial,sans-serif;color:#536e82}
 #archibarthes-atlas #lieux .abg2-legend span{white-space:nowrap}
 #archibarthes-atlas #lieux .abg2-legend button{border:0;background:none;color:inherit;cursor:pointer;padding:0;text-decoration:underline;text-decoration-color:#b8c9d3}
 #archibarthes-atlas #lieux .abg2-rank{margin-top:17px;background:#fff;padding:21px 24px;border:1px solid #e0e9ee;border-radius:5px}
 #archibarthes-atlas #lieux .abg2-rank h3{font:26px Georgia,serif;color:#173d55;margin:0 0 12px}
 #archibarthes-atlas #lieux .abg2-item{display:grid;grid-template-columns:minmax(120px,2fr) minmax(80px,4fr) 38px;align-items:center;gap:12px;margin:8px 0;color:#294d63;font:13px Arial,sans-serif;cursor:pointer}
 #archibarthes-atlas #lieux .abg2-track{background:#e8eef1;height:9px;overflow:hidden}
 #archibarthes-atlas #lieux .abg2-fill{display:block;height:100%;background:#719bb4}
 #archibarthes-atlas #lieux .abg2-item:first-child .abg2-fill{background:#a9625d}
 #archibarthes-atlas #lieux .abg2-item:focus-visible{outline:2px solid #3978a8}
 #archibarthes-atlas #lieux .abg2-detail{border-left:3px solid #7b9eb3;padding:10px 13px;margin-top:13px;background:#eef5f7;font:13px/1.6 Arial,sans-serif;color:#294b61}
 #archibarthes-atlas #lieux .abg2-foot{padding:14px 4px 0;font:12px/1.7 Arial,sans-serif;color:#597488}
 #archibarthes-atlas #lieux .abg-empty{padding:70px 12px;color:#678397;font:14px Arial,sans-serif}
 @media(max-width:800px){#archibarthes-atlas #lieux .abg2-grid{grid-template-columns:1fr}#archibarthes-atlas #lieux .abg2-card{padding:14px}#archibarthes-atlas #lieux .abg2-card h3{font-size:25px}}
 @media(max-width:500px){#archibarthes-atlas #lieux .abg2-rank{padding:13px}#archibarthes-atlas #lieux .abg2-item{grid-template-columns:minmax(100px,2fr) 2fr 24px;gap:6px;font-size:11px}}
 `;document.head.appendChild(css);
 section.innerHTML=`<div class="wrap"><div class="section-head"><div><div class="eyebrow">07 / Géographie des mentions</div><h2>Une géographie du fichier</h2></div></div><p class="intro abg2-intro">Le Grand Fichier dessine un paysage de villes récurrentes et de pays étrangers, plutôt qu'une carte des déplacements attestés de Roland Barthes.</p><div class="abg2-grid"><div class="abg2-card"><h3>Villes françaises</h3><p class="abg2-sub">Nombre de fiches distinctes par ville · champs géographiques renseignés</p><div class="abg2-art" id="abg2Cities">Lecture des données Heurist…</div><p class="abg2-sub" id="abg2CityNote"></p></div><div class="abg2-card"><h3>Pays étrangers</h3><p class="abg2-sub">Poids des mentions par pays (hors France)</p><div class="abg2-art" id="abg2Countries">Lecture des données Heurist…</div><div class="abg2-legend" id="abg2Legend"></div></div></div><div class="abg2-rank"><h3>Les lieux qui reviennent</h3><div id="abg2Rank"></div><div class="abg2-detail" id="abg2Detail" aria-live="polite">Survolez un nom ou un cercle pour connaître sa présence documentaire.</div></div><p class="abg2-foot" id="abg2Foot">Source : GrandFichier_RB (Heurist). Une fiche n'est comptée qu'une fois par lieu, par ville et par pays. Trains, bus et avions exclus (catégorie ou titre). Les villes et pays sont issus des champs renseignés : pas de géolocalisation déduite des coordonnées.</p></div>`;
 const citiesEl=section.querySelector('#abg2Cities'),countriesEl=section.querySelector('#abg2Countries'),legend=section.querySelector('#abg2Legend'),rank=section.querySelector('#abg2Rank'),detail=section.querySelector('#abg2Detail'),foot=section.querySelector('#abg2Foot');
 let cities=[],countries=[],places=[];
 function show(kind,key){const m=kind==='city'?cities:kind==='country'?countries:places;const p=m.find(r=>r.key===key);if(!p)return;detail.textContent=`${p.name} — ${format(p.count)} fiche${p.count>1?'s':''} distincte${p.count>1?'s':''}${kind==='city'?' (ville française)':kind==='country'?' (pays étranger)':' (lieu)'}.`;section.querySelectorAll('[data-geo-kind]').forEach(el=>{el.classList.toggle('is-active',el.dataset.geoKind===kind&&el.dataset.geoKey===key);});}
 function interact(e){const hit=e.target.closest('[data-geo-kind]');if(hit&&section.contains(hit))show(hit.dataset.geoKind,hit.dataset.geoKey);}
 section.addEventListener('pointerover',interact);section.addEventListener('click',interact);section.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const hit=e.target.closest('[data-geo-kind]');if(hit){e.preventDefault();interact(e);}}});
 (async()=>{try{
  const [locs,fiches]=await Promise.all([fetchType(12,['133','1072','231']),fetchType(102,['238'])]);
  const valid=locs.filter(l=>!transport(l)),byId=new Map(valid.map(r=>[String(r['1']),r]));
  const associations=new Map();for(const f of fiches){const id=String(f['1']);for(const ptr of new Set(vals(f,'238').map(String))){if(!byId.has(ptr))continue;if(!associations.has(ptr))associations.set(ptr,new Set());associations.get(ptr).add(id);}}
  const cityMap=new Map(),countryMap=new Map();
  places=valid.map(r=>({key:String(r['1']),name:canonical(r['2']),ids:associations.get(String(r['1']))||new Set()})).filter(p=>p.ids.size).map(p=>({...p,count:p.ids.size}));
  let noCity=0,noCountry=0;for(const r of valid){const ids=associations.get(String(r['1']));if(!ids?.size)continue;
   const countries=Array.from(new Set(vals(r,'231').map(canonical).filter(Boolean))),cFrance=countries.some(countryFrance);
   const cs=Array.from(new Set(vals(r,'1072').map(canonical).filter(Boolean)));
   if(cFrance){if(!cs.length)noCity+=ids.size;for(const c of cs)addTo(cityMap,c,ids,String(r['1']));}
   if(!countries.length)noCountry+=ids.size;
   for(const c of countries){if(!countryFrance(c))addTo(countryMap,c,ids,String(r['1']));}
  }
  const rows=m=>[...m.values()].map(r=>({...r,count:r.ids.size})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'fr'));
  cities=rows(cityMap);countries=rows(countryMap);
  citiesEl.innerHTML=svgBubble(cities);countriesEl.innerHTML=svgCountries(countries);
  section.querySelector('#abg2CityNote').textContent=cities.length?`${format(cities.length)} villes françaises identifiées · 20 premières représentées individuellement`:'';
  legend.innerHTML=countries.map(r=>`<span><button type="button" data-geo-kind="country" data-geo-key="${esc(r.key)}">${esc(r.name)} · ${format(r.count)}</button></span>`).join('');
  const top=[...places].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'fr')).slice(0,8),max=top[0]?.count||1;
  rank.innerHTML=top.map(p=>`<div class="abg2-item" tabindex="0" role="button" data-geo-kind="place" data-geo-key="${esc(p.key)}"><span>${esc(p.name)}</span><span class="abg2-track"><span class="abg2-fill" style="width:${(p.count/max*100).toFixed(2)}%"></span></span><strong>${format(p.count)}</strong></div>`).join('');
  foot.textContent=`Source : GrandFichier_RB · ${format(places.length)} lieux référencés hors transports. Une fiche est comptée une seule fois par ville, pays ou lieu. ${format(noCity)} associations sans ville française explicite et ${format(noCountry)} sans pays renseigné (ces valeurs ne permettent pas une déduction géographique). Les moyens de transport sont exclus. Les pays à plusieurs mentions peuvent partager des fiches.`;
  console.info('ArchiBarthes Géographie V2',{lieux:locs.length,exclus:locs.length-valid.length,lieuxRetenus:places.length,villesFrancaises:cities.length,paysEtrangers:countries.length,sansPays:noCountry});
 }catch(e){citiesEl.textContent='Données indisponibles : '+e.message;countriesEl.textContent='Données indisponibles.';console.error('ArchiBarthes Géographie V2',e);}})();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
