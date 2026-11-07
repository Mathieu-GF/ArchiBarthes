/* ArchiBarthes — Géographie du fichier V3.1 — édition typographique et panneau latéral.
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
 const W=720,H=490,cx=W/2,cy=H/2;
 if(!rows.length)return '<p class="abg-empty">Aucune ville française renseignée.</p>';
 // Toutes les villes sont affichées : aucune limitation arbitraire.
 const ordered=rows.map((r,i)=>({...r,r:Math.max(28,Math.min(100,Math.sqrt(r.count/Math.max(rows[0].count,1))*95)),i}));
 // Distribution circulaire déterministe, puis séparation des disques pour éviter les recouvrements.
 const ns=ordered.map((n,i)=>{
  if(i===0)return {...n,x:cx,y:cy};
  const theta=i*2.399963229728653,dist=112+Math.sqrt(i/ordered.length)*135;
  return {...n,x:cx+Math.cos(theta)*dist,y:cy+Math.sin(theta)*dist};
 });
 for(let t=0;t<900;t++){
  for(let i=0;i<ns.length;i++)for(let j=i+1;j<ns.length;j++){
   const a=ns[i],b=ns[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.0001;
   const want=a.r+b.r+8;
   if(d<want){const shift=(want-d)*.52,ux=dx/d,uy=dy/d;
    const fa=i===0?.10:1,fb=j===0?.10:1,den=fa+fb;
    a.x-=ux*shift*fa/den;a.y-=uy*shift*fa/den;
    b.x+=ux*shift*fb/den;b.y+=uy*shift*fb/den;
   }
  }
  for(const n of ns){
   const pull=n.i===0?.018:.0014;
   n.x+=(cx-n.x)*pull;n.y+=(cy-n.y)*pull;
   n.x=Math.max(n.r+5,Math.min(W-n.r-5,n.x));
   n.y=Math.max(n.r+5,Math.min(H-n.r-5,n.y));
  }
 }
 // Découpe adaptée aux petits cercles : chaque ville conserve un nom lisible.
 function linesFor(text,r){
  const words=text.replace(/-/g,'- ').split(/\s+/).filter(Boolean),max=Math.max(7,Math.floor(r/3.5));
  const lines=[];
  for(const word of words){
   const last=lines.length-1;
   if(last>=0&&(lines[last]+' '+word).length<=max)lines[last]+=' '+word;
   else lines.push(word);
  }
  if(lines.length>3){return [text];}
  return lines;
 }
 return `<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Villes françaises, noms affichés dans les cercles">${ns.map((n,i)=>{
  const ls=linesFor(n.name,n.r),font=Math.max(9,Math.min(i===0?26:17,n.r*.43, n.r*1.72/Math.max(5,...ls.map(x=>x.length))));
  const totalHeight=(ls.length-1)*font*1.08,offset=n.r>42?-3:0;
  const names=ls.map((line,j)=>`<text x="${n.x.toFixed(1)}" y="${(n.y-totalHeight/2+j*font*1.08+font*.34+offset).toFixed(1)}" text-anchor="middle" font-family="Georgia,serif" font-size="${font.toFixed(1)}" fill="${i<3?'#fff':'#173d55'}" pointer-events="none">${esc(line)}</text>`).join('');
  const count=n.r>=43?`<text x="${n.x.toFixed(1)}" y="${(n.y+totalHeight/2+font*1.4).toFixed(1)}" text-anchor="middle" font-size="${Math.max(11,font*.85).toFixed(1)}" font-family="Georgia,serif" fill="${i<3?'#fff':'#173d55'}" pointer-events="none">${format(n.count)}</text>`:'';
  return `<g class="abg-bubble" tabindex="0" role="button" data-geo-kind="city" data-geo-key="${esc(n.key)}" aria-label="${esc(n.name)} : ${format(n.count)} fiches"><circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${n.r.toFixed(1)}" fill="${i===0?'#214d69':i<3?'#5f91af':i<7?'#91b8cc':'#c0d8e3'}" stroke="#fff" stroke-width="2"/><title>${esc(n.name)} · ${format(n.count)} fiches</title>${names}${count}</g>`;
 }).join('')}</svg>`;
}
function arc(cx,cy,r0,r1,a0,a1){
 // Angles décroissants de PI (gauche) vers 0 (droite) sur le demi-disque supérieur.
 // Le repère SVG a l'axe vertical inversé : arc extérieur sweep=1, intérieur sweep=0.
 const pt=(r,a)=>[cx+r*Math.cos(a),cy-r*Math.sin(a)];
 const [x1,y1]=pt(r1,a0),[x2,y2]=pt(r1,a1),[x3,y3]=pt(r0,a1),[x4,y4]=pt(r0,a0);
 const large=(a0-a1)>Math.PI?1:0;
 return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r1} ${r1} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} A ${r0} ${r0} 0 ${large} 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`;
}
function svgCountries(rows){
 if(!rows.length)return '<p class="abg-empty">Aucun pays étranger renseigné.</p>';
 const W=720,H=490,cx=360,cy=410,outer=284,inner=142;
 const total=rows.reduce((sum,r)=>sum+r.count,0);
 const colors=['#275a79','#5f93b1','#89afc5','#b6d0dc','#d1e1e9','#e7eef1','#eff4f6'];
 let a=Math.PI;
 const parts=rows.map((r,i)=>{
  const start=a,end=a-Math.PI*r.count/total;a=end;
  const mid=(start+end)/2,px=cx+214*Math.cos(mid),py=cy-214*Math.sin(mid);
  const part=r.count/total;
  // Dans les grandes portions, afficher le nom ; la légende donne toujours les six noms.
  const inside=part>=.17?`<text x="${px.toFixed(1)}" y="${(py-5).toFixed(1)}" text-anchor="middle" font-family="Georgia,serif" font-size="${part>.34?22:16}" fill="white" pointer-events="none">${esc(r.name)}</text><text x="${px.toFixed(1)}" y="${(py+19).toFixed(1)}" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="white" pointer-events="none">${format(r.count)} fiches</text>`:'';
  return `<g class="abg-segment" data-geo-kind="country" data-geo-key="${esc(r.key)}" tabindex="0" role="button" aria-label="${esc(r.name)} : ${format(r.count)} fiches"><path d="${arc(cx,cy,inner,outer,start,end)}" fill="${colors[i%colors.length]}" stroke="#fff" stroke-width="3"/><title>${esc(r.name)} · ${format(r.count)} fiches</title>${inside}</g>`;
 }).join('');
 return `<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Pays étrangers : demi-disque en secteurs proportionnels aux fiches">${parts}<text x="${cx}" y="${cy-46}" text-anchor="middle" font-family="Georgia,serif" font-size="25" fill="#173d55">Pays</text><text x="${cx}" y="${cy-16}" text-anchor="middle" font-family="Georgia,serif" font-size="25" fill="#173d55">étrangers</text></svg>`;
}
function init(){
 const root=document.querySelector(ROOT),section=root?.querySelector('#lieux');if(!section||section.dataset.geoV3)return;section.dataset.geoV3='1';
 const css=document.createElement('style');css.id='ab-geo-v3-style';css.textContent=`
 #archibarthes-atlas #lieux .abg2-intro{max-width:1000px}
 #archibarthes-atlas #lieux .abg2-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:24px}
 #archibarthes-atlas #lieux .abg2-card{min-width:0;padding:20px 20px 12px;background:#f2f7f9;border-radius:7px}
 #archibarthes-atlas #lieux .abg2-card h3{font:30px Georgia,serif;color:#173d55;margin:0 0 7px}
 #archibarthes-atlas #lieux .abg2-sub{font:13px/1.65 Arial,sans-serif;color:#547388;margin:0}
 #archibarthes-atlas #lieux .abg2-art{margin-top:8px;min-height:310px}
 #archibarthes-atlas #lieux .abg2-art svg{display:block;width:100%;height:auto;max-height:470px}
 #archibarthes-atlas #lieux .abg-bubble,#archibarthes-atlas #lieux .abg-segment{cursor:default;transition:opacity .15s}
 #archibarthes-atlas #lieux .abg-bubble:focus-visible,#archibarthes-atlas #lieux .abg-segment:focus-visible{outline:none}
 #archibarthes-atlas #lieux [data-geo-key].is-active>circle,#archibarthes-atlas #lieux [data-geo-key].is-active>path{stroke:#ae5956;stroke-width:4}
 #archibarthes-atlas #lieux .abg2-legend{display:flex;flex-wrap:wrap;gap:7px 14px;margin:4px 0 12px;font:12px Arial,sans-serif;color:#536e82}
 #archibarthes-atlas #lieux .abg2-legend span{white-space:nowrap}
 #archibarthes-atlas #lieux .abg2-legend span{border:0;background:none;color:inherit}
 #archibarthes-atlas #lieux .abg2-rank{margin-top:19px;background:#f6f9fa;padding:24px 28px 30px;border:1px solid #e1eaf0;border-radius:6px}
 #archibarthes-atlas #lieux .abg2-rank h3{font:30px Georgia,serif;color:#173d55;margin:0 0 7px}
 #archibarthes-atlas #lieux .abg2-rank-lead{font:13px/1.55 Arial,sans-serif;color:#607b8c;margin:0 0 22px}
 #archibarthes-atlas #lieux .abg2-index{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:17px;row-gap:18px;align-items:stretch}
 #archibarthes-atlas #lieux .abg2-item{position:relative;border:0;border-top:1px solid #adc6d5;background:transparent;cursor:default;text-align:left;min-width:0;padding:13px 7px 18px 0;color:#1b465e;display:flex;flex-direction:column;align-items:flex-start;gap:9px;transition:background .15s,color .15s,border-color .15s}
 #archibarthes-atlas #lieux .abg2-item.is-major{grid-column:span 6;min-height:142px;border-top:3px solid #517d9a;padding-top:16px}
 #archibarthes-atlas #lieux .abg2-item.is-minor{grid-column:span 3;min-height:102px}
 #archibarthes-atlas #lieux .abg2-item:first-child{border-color:#ad615c}
 #archibarthes-atlas #lieux .abg2-order{font:11px Arial,sans-serif;letter-spacing:.14em;color:#7897a9}
 #archibarthes-atlas #lieux .abg2-place-name{font:21px/1.15 Georgia,serif;overflow-wrap:anywhere}
 #archibarthes-atlas #lieux .is-major .abg2-place-name{font-size:clamp(25px,2.4vw,39px)}
 #archibarthes-atlas #lieux .abg2-place-count{font:13px Arial,sans-serif;color:#668497}
 #archibarthes-atlas #lieux .is-major .abg2-place-count{font-size:14px}
 #archibarthes-atlas #lieux .abg2-tip{display:none;position:fixed;z-index:2147483100;pointer-events:none;max-width:235px;background:#173d55;color:#fff;padding:10px 13px;border-radius:4px;font:12px/1.55 Arial,sans-serif;box-shadow:0 6px 20px #173d552e}
 #archibarthes-atlas #lieux .abg2-tip strong{font:17px Georgia,serif;display:block;margin-bottom:3px}
 #archibarthes-atlas #lieux .abg2-foot{padding:14px 4px 0;font:11px/1.6 Arial,sans-serif;color:#597488}
 #archibarthes-atlas #lieux .abg-empty{padding:70px 12px;color:#678397;font:14px Arial,sans-serif}
 @media(max-width:800px){#archibarthes-atlas #lieux .abg2-grid{grid-template-columns:1fr}#archibarthes-atlas #lieux .abg2-card{padding:14px}#archibarthes-atlas #lieux .abg2-card h3{font-size:25px}}
 @media(max-width:500px){#archibarthes-atlas #lieux .abg2-rank{padding:13px}#archibarthes-atlas #lieux .abg2-item.is-major{grid-column:span 12}#archibarthes-atlas #lieux .abg2-item.is-minor{grid-column:span 6}#archibarthes-atlas #lieux .abg2-index{column-gap:12px;row-gap:12px}#archibarthes-atlas #lieux .abg2-rank{padding:18px}}
 `;document.head.appendChild(css);
 section.innerHTML=`<div class="wrap"><div class="section-head"><div><div class="eyebrow">07 / Géographie des mentions</div><h2>Une géographie du fichier</h2></div></div><p class="intro abg2-intro">Le Grand Fichier dessine un paysage de villes récurrentes et de pays étrangers, plutôt qu'une carte des déplacements attestés de Roland Barthes.</p><div class="abg2-grid"><div class="abg2-card"><h3>Villes françaises</h3><p class="abg2-sub">Fiches distinctes par ville</p><div class="abg2-art" id="abg2Cities">Lecture des données Heurist…</div><p class="abg2-sub" id="abg2CityNote"></p></div><div class="abg2-card"><h3>Pays étrangers</h3><p class="abg2-sub">Répartition des fiches mentionnant un pays étranger</p><div class="abg2-art" id="abg2Countries">Lecture des données Heurist…</div><div class="abg2-legend" id="abg2Legend"></div></div></div><div class="abg2-rank"><h3>Les lieux qui reviennent</h3><p class="abg2-rank-lead">Quelques noms propres, selon leur récurrence dans les fiches.</p><div id="abg2Rank" class="abg2-index"></div></div><p class="abg2-foot" id="abg2Foot">Source : GrandFichier_RB (Heurist). Une fiche n'est comptée qu'une fois par lieu, par ville et par pays. Trains, bus et avions exclus (catégorie ou titre). Les villes et pays sont issus des champs renseignés : pas de géolocalisation déduite des coordonnées.</p></div>`;
 const citiesEl=section.querySelector('#abg2Cities'),countriesEl=section.querySelector('#abg2Countries'),legend=section.querySelector('#abg2Legend'),rank=section.querySelector('#abg2Rank'),foot=section.querySelector('#abg2Foot');
 let cities=[],countries=[],places=[];
 const tip=document.createElement('div');tip.className='abg2-tip';section.appendChild(tip);
 function lookup(kind,key){const m=kind==='city'?cities:countries;return m.find(r=>r.key===key);}
 function highlight(kind,key){section.querySelectorAll('.abg-bubble,.abg-segment').forEach(el=>{el.classList.toggle('is-active',el.dataset.geoKind===kind&&el.dataset.geoKey===key);});}
 function hideTip(){tip.style.display='none';highlight(null,null);}
 function positionTip(e){const b=section.getBoundingClientRect();let x=e.clientX+13,y=e.clientY-48;tip.style.left=Math.max(8,Math.min(x,window.innerWidth-tip.offsetWidth-12))+'px';tip.style.top=Math.max(8,Math.min(y,window.innerHeight-tip.offsetHeight-8))+'px';}
 // Les grands secteurs / cercles sont deja lisibles : pas de repetition.
 // Infobulle uniquement pour les elements dont le texte ne tient pas dans la forme.
 function wantsTip(el){if(el.dataset.geoKind==='country')return !el.querySelector('text');const c=el.querySelector('circle');return c&&Number(c.getAttribute('r'))<39;}
 function hover(e){const hit=e.target.closest?.('.abg-bubble,.abg-segment');if(!hit||!section.contains(hit)){hideTip();return;}
  const kind=hit.dataset.geoKind,key=hit.dataset.geoKey,p=lookup(kind,key);if(!p){hideTip();return;}
  highlight(kind,key);if(!wantsTip(hit)){tip.style.display='none';return;}
  tip.innerHTML='<strong>'+esc(p.name)+'</strong>'+format(p.count)+' fiche'+(p.count>1?'s':'');tip.style.display='block';positionTip(e);
 }
 section.addEventListener('pointerover',hover);
 section.addEventListener('pointermove',e=>{if(tip.style.display==='block')positionTip(e);});
 section.addEventListener('pointerout',e=>{if(!e.relatedTarget||!section.contains(e.relatedTarget)){hideTip();return;}const next=e.relatedTarget.closest?.('.abg-bubble,.abg-segment');if(!next)hideTip();});
 section.addEventListener('focusin',e=>{const el=e.target.closest?.('.abg-bubble,.abg-segment');if(el)highlight(el.dataset.geoKind,el.dataset.geoKey);});
 section.addEventListener('focusout',()=>hideTip());
 window.addEventListener('scroll',()=>{tip.style.display='none';},{passive:true});
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
  section.querySelector('#abg2CityNote').textContent=cities.length?`${format(cities.length)} villes françaises identifiées · toutes représentées`:'';
  legend.innerHTML=countries.map(r=>`<span>${esc(r.name)} · ${format(r.count)}</span>`).join('');
  const top=[...places].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'fr')).slice(0,6);
  rank.innerHTML=top.map((p,i)=>`<div class="abg2-item ${i<2?'is-major':'is-minor'}"><span class="abg2-order">${String(i+1).padStart(2,'0')} / LIEU</span><span class="abg2-place-name">${esc(p.name)}</span><span class="abg2-place-count">${format(p.count)} fiche${p.count>1?'s':''}</span></div>`).join('');
  foot.textContent='Source : GrandFichier_RB · Fiches distinctes comptées une fois par ville, pays ou lieu · Moyens de transport exclus. Une même fiche peut mentionner plusieurs pays.';
  console.info('ArchiBarthes Géographie V3.2',{lieux:locs.length,exclus:locs.length-valid.length,lieuxRetenus:places.length,villesFrancaises:cities.length,paysEtrangers:countries.length,sansPays:noCountry});
 }catch(e){citiesEl.textContent='Données indisponibles : '+e.message;countriesEl.textContent='Données indisponibles.';console.error('ArchiBarthes Géographie V3.2',e);}})();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
