const C=document.getElementById('c'),X=C.getContext('2d');
const T=40,W=16,H=12,MAXW=20,WAIT=20;
let MI=0,WP,ROUTES,path;
function setMap(i){
  MI=i;
  const m=MAPS[i];
  ROUTES=(m.routes||[m.wp]).map(w=>{
    const pts=w.map(p=>[p[0]*T+T/2,p[1]*T+T/2]),sg=[];let total=0;
    for(let j=1;j<pts.length;j++){const l=Math.hypot(pts[j][0]-pts[j-1][0],pts[j][1]-pts[j-1][1]);sg.push(l);total+=l}
    return{pts,sg,total};
  });
  WP=ROUTES[0].pts;
  path=new Set();
  for(const R of ROUTES)for(let j=1;j<R.pts.length;j++){
    const a=R.pts[j-1],b=R.pts[j],n=Math.round(R.sg[j-1]/T);
    for(let k=0;k<=n;k++)path.add(Math.floor((a[0]+(b[0]-a[0])*k/n)/T)+','+Math.floor((a[1]+(b[1]-a[1])*k/n)/T));
  }
}
let unlocked=1;
try{unlocked=Math.min(MAPS.length,Math.max(1,+localStorage.getItem('td_unlocked')||1))}catch(e){}
function unlock(n){
  n=Math.min(MAPS.length,n);
  if(n>unlocked){unlocked=n;try{localStorage.setItem('td_unlocked',n)}catch(e){}}
}
setMap(unlocked-1);
function pos(d,rt){
  const R=ROUTES[rt||0],w=R.pts;
  for(let i=0;i<R.sg.length;i++){
    if(d<=R.sg[i]){const t=d/R.sg[i];return[w[i][0]+(w[i+1][0]-w[i][0])*t,w[i][1]+(w[i+1][1]-w[i][1])*t]}
    d-=R.sg[i];
  }
  return w[w.length-1];
}
const pg=e=>e.d/ROUTES[e.rt||0].total;
const TYPES={
  arrow:{name:'Flecha',cost:50,range:120,rate:.5,dmg:12,col:'#e0b84f'},
  cannon:{name:'Cañón',cost:100,range:100,rate:1.3,dmg:30,splash:45,col:'#d9674f'},
  frost:{name:'Hielo',cost:75,range:100,rate:.9,dmg:4,slow:1,col:'#7cc4e0'},
  fire:{name:'Fuego',cost:120,range:85,rate:.12,dmg:3,burn:1,col:'#ff8a2b'},
  bolt:{name:'Rayo',cost:150,range:110,rate:1.1,dmg:14,chain:3,col:'#b48cf0',lvl:2},
  poison:{name:'Veneno',cost:110,range:100,rate:.8,dmg:5,poison:1,col:'#8bd45a',lvl:3},
  mortar:{name:'Mortero',cost:180,range:190,rate:2.6,dmg:55,splash:55,sp:200,col:'#9aa3b5',lvl:4}
};
const KINDS={normal:{sp:50,hp:1,col:'#cfd8c8',r:9},fast:{sp:90,hp:.6,col:'#e8e07a',r:7},tank:{sp:32,hp:3.5,col:'#a07cc4',r:12},
  boss:{sp:30,hp:10,col:'#888',r:16},
  healer:{sp:45,hp:1.6,col:'#7ad48a',r:9,lbl:'curanderos (curan a los demás)'},
  yeti:{sp:38,hp:2.6,col:'#e8f1f7',r:11,noSlow:1,lbl:'yetis (inmunes al hielo)'},
  scorpion:{sp:68,hp:1.4,col:'#c4713a',r:9,noBurn:1,lbl:'escorpiones (inmunes al fuego)'},
  magma:{sp:36,hp:2.2,col:'#e8532a',r:11,lbl:'magma (se divide al morir)'},
  cieno:{sp:42,hp:2,col:'#7fa05a',r:10,noPoison:1,lbl:'cienos (inmunes al veneno)'},
  ember:{sp:75,hp:.35,col:'#ffb347',r:6}
};
let S;
function reset(){
  S={fx:[],pt:[],cd:WAIT,gold:MAPS[MI].gold,lives:20,wave:0,towers:[],enemies:[],shots:[],queue:[],spawnT:0,active:false,over:null,speed:1,bt:9,hurt:0,arcs:[],born:[],rings:[],paused:false,rr:0,pick:'arrow',sel:null,mx:-1,my:-1};
  $('speed').textContent='Velocidad x1';if($('pause'))$('pause').textContent='Pausa';$('mapbtn').textContent='Nivel '+(MI+1)+': '+MAPS[MI].name;
  ui();
}
const $=id=>document.getElementById(id);
function ui(){
  $('gold').textContent=S.gold;$('lives').textContent=S.lives;$('wave').textContent=S.wave;
  $('start').disabled=S.active||!!S.over;
  $('mapbtn').textContent=S.over==='win'&&MI+1<MAPS.length?'Siguiente nivel →':'Nivel '+(MI+1)+': '+MAPS[MI].name;
  document.querySelectorAll('#shop button').forEach(b=>{
    const d=TYPES[b.dataset.k],lock=(d.lvl||1)>MI+1;
    b.classList.toggle('sel',b.dataset.k===S.pick);b.classList.toggle('poor',S.gold<d.cost);
    b.hidden=lock;b.textContent=(Object.keys(TYPES).indexOf(b.dataset.k)+1)+'. '+d.name+' ('+d.cost+')';
  });
  const t=S.sel;$('sel').hidden=!t;
  if(t){
    const maxed=t.lv>=3;
    $('up').textContent=maxed?'Nivel máximo':'Mejorar ('+upCost(t)+')';
    $('up').disabled=maxed||S.gold<upCost(t);
    $('sell').textContent='Vender (+'+Math.floor(t.spent*.7)+')';
  }
}
const upCost=t=>Math.round(TYPES[t.k].cost*.8*t.lv);
const shop=$('shop');
for(const k in TYPES){
  const b=document.createElement('button');b.dataset.k=k;b.style.setProperty('--c',TYPES[k].col);b.textContent=TYPES[k].name+' ('+TYPES[k].cost+')';
  b.onclick=()=>{S.pick=k;S.sel=null;ui()};shop.appendChild(b);
}
function startWave(){
  if(S.active||S.over)return;
  S.wave++;S.active=true;S.bt=0;
  const n=6+S.wave*2;
  for(let i=0;i<n;i++){
    let k='normal';
    if(S.wave%5===0&&i%4===3)k='tank';else if(S.wave%3===0&&i%2===1)k='fast';else if(S.wave>=3&&i%5===2&&MAPS[MI].foe)k=MAPS[MI].foe;
    S.queue.push(k);
  }
  if(S.wave===MAXW)S.queue.push('boss');
  S.spawnT=0;ui();
}
$('start').onclick=startWave;
$('mapbtn').onclick=()=>{
  const n=S.over==='win'&&MI+1<MAPS.length?MI+1:(MI+1)%unlocked;
  setMap(n);drawMap();reset();
  const nt=Object.values(TYPES).find(d=>d.lvl===MI+1);
  $('info').textContent='Nivel '+(MI+1)+': '+MAPS[MI].name+'.'+(nt?' Torre nueva: '+nt.name+'.':'')+(ROUTES.length>1?' Los enemigos llegan por dos caminos.':'');
};
$('speed').onclick=()=>{S.speed=S.speed%3+1;$('speed').textContent='Velocidad x'+S.speed};
$('restart').onclick=()=>{reset();$('info').textContent='Partida nueva.'};
$('up').onclick=()=>{
  const t=S.sel;if(!t||t.lv>=3||S.gold<upCost(t))return;
  S.gold-=upCost(t);t.spent+=upCost(t);t.lv++;t.dmg*=1.5;t.range+=10;ui();
};
$('sell').onclick=()=>{
  const t=S.sel;if(!t)return;
  S.gold+=Math.floor(t.spent*.7);S.towers.splice(S.towers.indexOf(t),1);S.sel=null;ui();
};
function cell(e){
  const r=C.getBoundingClientRect(),s=C.width/r.width;
  return[(e.clientX-r.left)*s,(e.clientY-r.top)*s];
}
C.addEventListener('mousemove',e=>{[S.mx,S.my]=cell(e)});
C.addEventListener('mouseleave',()=>{S.mx=S.my=-1});
C.addEventListener('click',e=>{
  if(S.over)return;
  const[px,py]=cell(e),cx=Math.floor(px/T),cy=Math.floor(py/T);
  const ex=S.towers.find(t=>t.cx===cx&&t.cy===cy);
  if(ex){S.sel=ex;ui();return}
  S.sel=null;
  if(path.has(cx+','+cy)){$('info').textContent='No se puede construir sobre el camino.';ui();return}
  const d=TYPES[S.pick];
  if(S.gold<d.cost){$('info').textContent='Oro insuficiente.';ui();return}
  S.gold-=d.cost;
  S.towers.push({k:S.pick,cx,cy,x:cx*T+T/2,y:cy*T+T/2,range:d.range,dmg:d.dmg,cd:0,lv:1,spent:d.cost,born:performance.now()/1000});
  $('info').textContent='';ui();
});
function hit(e,dmg,slow,burn,poison){
  if(e.dead)return;
  e.hp-=dmg;if(slow&&!KINDS[e.kind].noSlow&&!e.noSlow)e.slow=1.5;
  if(burn&&!KINDS[e.kind].noBurn&&!e.noBurn){e.burn=2;e.bd=Math.max(e.bd||0,dmg*1.5)}
  if(poison&&!KINDS[e.kind].noPoison&&!e.noPoison){e.psn=4;e.pst=Math.min((e.pst||0)+poison,poison*6)}
  if(e.hp<=0){
    e.dead=true;S.gold+=e.rw;const q=pos(e.d,e.rt);
    if(e.kind==='magma'||e.ab==='rage')for(let i=0,n=e.kind==='boss'?4:2;i<n;i++){const k=KINDS.ember,hp=Math.min(e.max*.25,300);S.born.push({kind:'ember',rt:e.rt,d:e.d+i*8,hp,max:hp,sp:k.sp*(1+S.wave*.01),col:k.col,r:k.r,slow:0,rw:2})}
    S.fx.push({x:q[0],y:q[1]-12,t:0,txt:'+'+e.rw});
    for(let i=0;i<7;i++){const a=Math.random()*6.28;S.pt.push({x:q[0],y:q[1],vx:Math.cos(a)*55,vy:Math.sin(a)*55,t:0,c:e.col})}
    ui();
  }
}
function chain(t,first){
  const d=TYPES[t.k],pts=[[t.x,t.y]],done=new Set(),n=d.chain+t.lv-1;
  let cur=first,dmg=t.dmg;
  for(let i=0;i<n&&cur;i++){
    const p=pos(cur.d,cur.rt);done.add(cur);pts.push(p);hit(cur,dmg);dmg*=.75;
    let nxt=null,nd=75;
    for(const e of S.enemies){
      if(e.dead||done.has(e))continue;
      const q=pos(e.d,e.rt),dd=Math.hypot(q[0]-p[0],q[1]-p[1]);
      if(dd<nd){nd=dd;nxt=e}
    }
    cur=nxt;
  }
  S.arcs.push({pts,t:0,j:pts.map(()=>(Math.random()-.5)*14)});
}
function mk(kn,d,rt){
  const k=KINDS[kn],hp=20*Math.pow(1.19,S.wave)*k.hp*MAPS[MI].hpm;
  return{kind:kn,d,rt:rt||0,hp,max:hp,sp:k.sp*(1+S.wave*.01),col:k.col,r:k.r,slow:0,rw:Math.floor(6+S.wave/2)};
}
function update(dt){
  for(const f of S.fx){f.t+=dt;f.y-=24*dt}
  for(const q of S.pt){q.t+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt}
  S.fx=S.fx.filter(f=>f.t<.9);S.pt=S.pt.filter(q=>q.t<.4);
  S.rings.forEach(r=>r.t+=dt);S.rings=S.rings.filter(r=>r.t<.25);
  S.arcs.forEach(a=>a.t+=dt);S.arcs=S.arcs.filter(a=>a.t<.18);
  S.bt+=dt;S.hurt=Math.max(0,S.hurt-dt);
  if(S.over)return;
  if(!S.active){S.cd-=dt;if(S.cd<=0)startWave()}
  if(S.queue.length){
    S.spawnT-=dt;
    if(S.spawnT<=0){
      const kn=S.queue.shift(),en=mk(kn,0,S.rr++%ROUTES.length);
      if(kn==='boss'){const B=MAPS[MI].boss;Object.assign(en,{ab:B.ab,col:B.col,name:B.name,noSlow:B.noSlow,noBurn:B.noBurn,noPoison:B.noPoison,t:0,rw:150})}
      S.enemies.push(en);
      S.spawnT=.8;
    }
  }
  for(const e of S.enemies){
    if(e.kind==='healer')for(const o of S.enemies)if(o!==e&&!o.dead&&Math.abs(o.d-e.d)<60)o.hp=Math.min(o.max,o.hp+o.max*.05*dt);
    e.slow=Math.max(0,e.slow-dt);
    if(e.psn>0){e.psn-=dt;hit(e,e.pst*dt);if(e.psn<=0)e.pst=0}
    if(e.burn>0){e.burn-=dt;hit(e,e.bd*dt)}
    if(e.kind==='boss'){
      e.t+=dt;
      if(e.ab==='summon'&&e.t>=5){e.t=0;for(let i=0;i<2;i++)S.born.push(mk('normal',Math.max(0,e.d-14*(i+1)),e.rt))}
      if(e.ab==='freeze'&&e.t>=6){e.t=0;const p=pos(e.d,e.rt);for(const t of S.towers)if(Math.hypot(t.x-p[0],t.y-p[1])<130){t.cd=Math.max(t.cd,2);t.fz=2}}
      if(e.ab==='dash'){e.dash=(e.dash||0)-dt;if(e.t>=5){e.t=0;e.dash=1.2}}
      if(e.ab==='rage'&&e.hp<e.max*.5)e.rage=1;
      if(e.ab==='regen')e.hp=Math.min(e.max,e.hp+e.max*.012*dt);
    }
    e.d+=e.sp*(e.slow>0?.5:1)*(e.dash>0?2.5:1)*(e.rage?1.6:1)*dt;
    if(e.d>=ROUTES[e.rt||0].total&&!e.dead){e.dead=true;S.lives-=e.kind==='boss'?5:1;S.hurt=.35;ui();if(S.lives<=0){S.over='lose'}}
  }
  for(const t of S.towers){
    t.cd-=dt;if(t.fz>0)t.fz-=dt;if(t.cd>0)continue;
    let best=null;
    for(const e of S.enemies){
      if(e.dead)continue;
      const p=pos(e.d,e.rt);
      if(Math.hypot(p[0]-t.x,p[1]-t.y)<=t.range&&(!best||pg(e)>pg(best)))best=e;
    }
    if(best){const q=pos(best.d,best.rt);t.ang=Math.atan2(q[1]-t.y,q[0]-t.x);t.cd=TYPES[t.k].rate;if(TYPES[t.k].chain)chain(t,best);else S.shots.push({x:t.x,y:t.y,tg:best,t,a:t.ang});}
  }
  for(const s of S.shots){
    if(s.tg.dead){s.gone=true;continue}
    const p=pos(s.tg.d,s.tg.rt),dx=p[0]-s.x,dy=p[1]-s.y,dist=Math.hypot(dx,dy),step=(TYPES[s.t.k].sp||320)*dt;
    if(dist<=step){
      const d=TYPES[s.t.k];
      if(d.splash){S.rings.push({x:p[0],y:p[1],r:d.splash,t:0});for(const e of S.enemies){const q=pos(e.d,e.rt);if(Math.hypot(q[0]-p[0],q[1]-p[1])<=d.splash)hit(e,s.t.dmg)}}
      else hit(s.tg,s.t.dmg,d.slow,d.burn,d.poison?s.t.dmg*.7:0);
      s.gone=true;
    }else{s.a=Math.atan2(dy,dx);s.x+=dx/dist*step;s.y+=dy/dist*step}
  }
  S.shots=S.shots.filter(s=>!s.gone);
  S.enemies=S.enemies.filter(e=>!e.dead);
  if(S.born.length){S.enemies.push(...S.born);S.born=[]}
  if(S.active&&!S.queue.length&&!S.enemies.length){
    S.active=false;S.cd=WAIT;S.gold+=15+S.wave*2;
    if(S.wave>=MAXW){S.over='win';unlock(MI+2)}
    ui();
  }
}
/* Mapa (se dibuja una sola vez)  */
const MAP=document.createElement('canvas');MAP.width=W*T;MAP.height=H*T;
drawMap();

/* Torres */
function diamond(r){X.beginPath();X.moveTo(0,-r);X.lineTo(r*.7,0);X.lineTo(0,r);X.lineTo(-r*.7,0);X.closePath()}
const OUT='#1c211d';
function drawTower(t,t0){
  const x=t.x,y=t.y,k=t.born?Math.min(1,(t0-t.born)*6):1,c=TYPES[t.k].col,rec=Math.max(0,Math.min(1,t.cd/TYPES[t.k].rate));
  const rect=(a,b,w,h,f)=>{X.fillStyle=f;X.fillRect(a,b,w,h);X.strokeRect(a,b,w,h)};
  X.save();X.translate(x,y);X.scale(.6+.4*k,.6+.4*k);
  X.lineJoin='round';X.strokeStyle=OUT;X.lineWidth=2;
  rect(-16,-16,32,32,['#8d9096','#9fb3c8','#d4b25c'][t.lv-1]);
  X.fillStyle='rgba(255,255,255,.18)';X.fillRect(-12,-12,24,24);
  X.fillStyle=OUT;for(const[a,b]of[[-14,-14],[11,-14],[-14,11],[11,11]])X.fillRect(a,b,3,3);
  X.save();X.rotate(t.ang||0);X.lineWidth=1.5;
  if(t.k==='arrow'){
    const px=9.5-(1-rec)*6;
    rect(-6,-2.5,20,5,c);rect(8,-9,3,18,'#7a5a30');
    X.lineWidth=1;X.beginPath();X.moveTo(9.5,-9);X.lineTo(px,0);X.lineTo(9.5,9);X.stroke();
    if(rec<.5){X.lineWidth=1.5;rect(px,-1,15,2,'#e8e2cf');X.fillStyle='#cfd5da';X.beginPath();X.moveTo(px+15,-3);X.lineTo(px+21,0);X.lineTo(px+15,3);X.closePath();X.fill();X.stroke()}
  }else if(t.k==='cannon'){
    rect(-7,-11,9,4,'#4a4f58');rect(-7,7,9,4,'#4a4f58');
    X.translate(-rec*3,0);
    rect(-5,-6,20,12,c);rect(13,-8,5,16,'#4a4f58');X.fillStyle=OUT;X.fillRect(17,-3,1.5,6);
  }else if(t.k==='fire'){
    const fl=4+rec*5+Math.sin(t0*20)*1.2;
    rect(2,-3.5,13,7,'#5a3523');rect(13,-5,4,10,'#3a2a22');
    X.fillStyle='#b5432a';X.beginPath();X.arc(-4,0,7,0,7);X.fill();X.stroke();rect(-6,-2,4,4,'#c9a24a');
    X.fillStyle=c;X.beginPath();X.moveTo(17,-4);X.lineTo(17+fl*2.2,0);X.lineTo(17,4);X.closePath();X.fill();X.stroke();
    X.fillStyle='#ffd24a';X.beginPath();X.moveTo(17,-2);X.lineTo(17+fl*1.2,0);X.lineTo(17,2);X.closePath();X.fill();
  }else if(t.k==='mortar'){
    X.translate(-rec*4,0);
    rect(-8,-9,18,18,'#4a4f58');rect(-4,-6,13,12,c);rect(9,-10,5,20,'#33373f');
    X.fillStyle=OUT;X.fillRect(13,-5,1.8,10);
  }
  X.restore();
  if(t.k==='frost'){
    X.save();X.rotate(t0*.5);X.lineWidth=1.5;
    rect(-9,-9,18,18,c);rect(-5,-5,10,10,'#e6f8ff');
    for(const[a,b]of[[11,-2],[-15,-2],[-2,11],[-2,-15]])rect(a,b,4,4,c);
    X.restore();
  }
  if(t.k==='bolt'){
    X.save();X.rotate(t0*.8);X.lineWidth=1.5;
    for(const[a,b]of[[9,-2],[-13,-2],[-2,9],[-2,-13]])rect(a,b,4,4,'#6a5a8a');
    X.restore();
    X.fillStyle=c;X.beginPath();X.arc(0,0,9,0,7);X.fill();X.stroke();
    X.fillStyle='#7a5fb0';X.beginPath();X.arc(0,0,5.5,0,7);X.fill();X.stroke();
    X.fillStyle=rec>.6?'#ffffff':'#e9dcff';X.beginPath();X.arc(0,0,2.8,0,7);X.fill();
  }
  if(t.k==='poison'){
    X.fillStyle='#3d3a33';X.beginPath();X.arc(0,0,11,0,7);X.fill();X.stroke();
    X.fillStyle=c;X.beginPath();X.arc(0,0,8,0,7);X.fill();X.stroke();
    X.fillStyle='#d8f5b0';
    for(let i=0;i<3;i++){const a=t0*1.3+i*2.1,rr=3+Math.sin(t0*3+i)*2;X.beginPath();X.arc(Math.cos(a)*rr,Math.sin(a)*rr,1.8+(i+1)%2,0,7);X.fill()}
  }
  if(t.fz>0){X.fillStyle='rgba(124,196,224,.6)';X.fillRect(-16,-16,32,32)}
  X.lineWidth=1;
  for(let i=0;i<t.lv;i++)rect(-10+i*7,10,5,4,'#f4efe0');
  X.restore();
}

/*Enemigos*/
function drawEnemy(e,t0){
  const p=pos(e.d,e.rt),q=pos(e.d+2,e.rt),r=e.r,x=p[0],y=p[1],sw=Math.sin(t0*8+e.d*.05),k=e.kind;
  const body=e.slow>0?'#7cc4e0':e.burn>0?'#ff9a4a':e.psn>0?'#8bd45a':e.col,STEEL='#dfe4e6',WOOD='#8a5a2b';
  const rect=(a,b,w,h,c)=>{X.fillStyle=c;X.fillRect(a,b,w,h);X.strokeRect(a,b,w,h)};
  const disc=()=>{X.lineWidth=2;X.fillStyle=body;X.beginPath();X.arc(0,0,r,0,7);X.fill();X.stroke();X.lineWidth=1.5};
  X.save();X.translate(x,y);X.rotate(Math.atan2(q[1]-p[1],q[0]-p[0]));
  X.lineJoin='round';X.strokeStyle=OUT;X.lineWidth=1.5;
  if(k==='fast'){
    for(const s of[-1,1]){X.save();X.translate(r*.2,s*r*.9);X.rotate(sw*.4*s);rect(0,-1.5,5,3,WOOD);rect(5,-1.5,9,3,STEEL);X.restore()}
    X.lineWidth=2;X.fillStyle=body;X.beginPath();X.moveTo(r+2,0);X.lineTo(-r,-r);X.lineTo(-r,r);X.closePath();X.fill();X.stroke();
  }else if(k==='tank'){
    X.save();X.translate(0,r+1);X.rotate(sw*.3);rect(0,-1.5,r+4,3,WOOD);rect(r+3,-4,6,8,'#7b7f88');X.restore();
    X.lineWidth=2;X.fillStyle=body;X.fillRect(-r,-r,r*2,r*2);X.strokeRect(-r,-r,r*2,r*2);
    X.lineWidth=1.5;rect(r-1,-r*.85,5,r*1.7,'#9aa0aa');rect(r+1,-2,3,4,'#d9674f');
  }else if(k==='healer'){
    X.save();X.translate(r*.3,r*.95);X.rotate(sw*.25);rect(0,-1.5,r+6,3,WOOD);rect(r+3,-4,5,8,'#e8f5ea');X.restore();
    disc();X.fillStyle='#fff';X.fillRect(-2,-r*.55,4,r*1.1);X.fillRect(-r*.55,-2,r*1.1,4);
  }else if(k==='yeti'){
    X.save();X.translate(r*.3,r*.95);X.rotate(sw*.3-.1);rect(0,-2,r+6,4,WOOD);rect(r+4,-5,8,10,'#9fd0e6');X.restore();
    for(const s of[-1,0,1]){X.fillStyle='#9fd0e6';X.beginPath();X.moveTo(-r+1,s*r*.5-3);X.lineTo(-r-6,s*r*.5);X.lineTo(-r+1,s*r*.5+3);X.closePath();X.fill();X.stroke()}
    disc();
  }else if(k==='scorpion'){
    X.beginPath();X.moveTo(-r,0);X.quadraticCurveTo(-r-12,-12,-r-4,-15);
    X.strokeStyle=OUT;X.lineWidth=5;X.stroke();X.strokeStyle=body;X.lineWidth=2.5;X.stroke();X.strokeStyle=OUT;X.lineWidth=1.5;
    X.fillStyle='#e0b84f';X.beginPath();X.moveTo(-r-4,-15);X.lineTo(-r+2,-20);X.lineTo(-r+1,-12);X.closePath();X.fill();X.stroke();
    for(const s of[-1,1]){
      rect(r-3,s*(r-1)-1.5,8,3,body);
      X.fillStyle=STEEL;X.beginPath();X.moveTo(r+5,s*(r-1)-3);X.lineTo(r+11,s*(r-1));X.lineTo(r+5,s*(r-1)+3);X.closePath();X.fill();X.stroke();
    }
    X.lineWidth=2;X.fillStyle=body;X.beginPath();X.ellipse(0,0,r+1,r-2,0,0,7);X.fill();X.stroke();
  }else if(k==='magma'){
    X.save();X.translate(r*.2,r+2);X.rotate(sw*.25);rect(0,-2,r+4,4,WOOD);rect(r+3,-6,9,12,'#4a3a38');X.restore();
    disc();
    X.strokeStyle='#ffd24a';X.lineWidth=1.5;X.beginPath();X.moveTo(-r*.6,-r*.3);X.lineTo(0,r*.1);X.lineTo(r*.4,-r*.5);X.moveTo(0,r*.1);X.lineTo(-r*.2,r*.7);X.stroke();
  }else if(k==='boss'){
    X.save();X.translate(r*.2,r+3);X.rotate(sw*.25);rect(0,-2.5,r+8,5,WOOD);rect(r+6,-8,10,16,'#7b7f88');X.restore();
    disc();
    X.fillStyle='#e0b84f';
    for(const s of[-1,0,1]){X.beginPath();X.moveTo(r*.2,s*r*.5-4);X.lineTo(r*.2+7,s*r*.5);X.lineTo(r*.2,s*r*.5+4);X.closePath();X.fill();X.stroke()}
  }else if(k==='cieno'){
    X.save();X.translate(r*.3,r*.9);X.rotate(sw*.3-.1);rect(0,-1.5,r+8,3,WOOD);
    X.fillStyle=STEEL;X.beginPath();X.moveTo(r+8,-4);X.lineTo(r+15,0);X.lineTo(r+8,4);X.closePath();X.fill();X.stroke();X.restore();
    disc();X.fillStyle='#5f7d3f';
    for(const s of[-1,0,1]){X.beginPath();X.arc(-r*.4,s*r*.5,2.2,0,7);X.fill()}
  }else if(k==='ember'){
    X.fillStyle='#ffd24a';X.beginPath();X.moveTo(-r,0);X.lineTo(-r-6,-3);X.lineTo(-r-6,3);X.closePath();X.fill();X.stroke();
    disc();
  }else{
    X.save();X.translate(r*.4,r*.9);X.rotate(sw*.35-.2);rect(-2,-1.5,5,3,WOOD);rect(3,-4,2.5,8,'#c9a96b');rect(5.5,-1.5,r+6,3,STEEL);X.restore();
    disc();
  }
  X.restore();
  if(e.hp<e.max){
    X.fillStyle=OUT;X.fillRect(x-13,y-r-10,26,5);
    X.fillStyle=e.hp/e.max>.4?'#6fcf7a':'#e0b84f';X.fillRect(x-12,y-r-9,24*Math.max(0,e.hp/e.max),3);
  }
}

/* Dibujo */
function draw(){
  X.drawImage(MAP,0,0);
  const t0=performance.now()/1000;
  const hx=Math.floor(S.mx/T),hy=Math.floor(S.my/T);
  if(S.mx>=0&&!S.over){
    const d=TYPES[S.pick],onP=path.has(hx+','+hy),bad=onP||S.gold<d.cost||S.towers.some(t=>t.cx===hx&&t.cy===hy);
    X.fillStyle=bad?'rgba(217,103,79,.3)':'rgba(255,255,255,.2)';X.fillRect(hx*T,hy*T,T,T);
    if(!onP){X.fillStyle='rgba(255,255,255,.06)';X.strokeStyle=bad?'rgba(217,103,79,.6)':'rgba(255,255,255,.5)';X.lineWidth=1.5;X.beginPath();X.arc(hx*T+T/2,hy*T+T/2,d.range,0,7);X.fill();X.stroke()}
  }
  for(const t of S.towers){
    if(t===S.sel){X.fillStyle='rgba(255,255,255,.08)';X.strokeStyle='#fff';X.lineWidth=1.5;X.beginPath();X.arc(t.x,t.y,t.range,0,7);X.fill();X.stroke()}
    drawTower(t,t0);
  }
  for(const e of S.enemies)drawEnemy(e,t0);
  const bs=S.enemies.find(e=>e.kind==='boss');
  if(bs){
    const bx=C.width/2-150;
    X.fillStyle=OUT;X.fillRect(bx-2,10,304,20);X.fillStyle='#d9674f';X.fillRect(bx,12,300*Math.max(0,bs.hp/bs.max),16);
    X.fillStyle='#fff';X.font='bold 12px sans-serif';X.textAlign='center';X.fillText(bs.name,C.width/2,24);
  }
  for(const s of S.shots){
    X.fillStyle=TYPES[s.t.k].col;X.strokeStyle=OUT;X.lineWidth=1.5;
    const z=s.t.k==='mortar'?5:3;X.fillRect(s.x-z,s.y-z,z*2,z*2);X.strokeRect(s.x-z,s.y-z,z*2,z*2);
  }
  for(const r of S.rings){
    X.strokeStyle='rgba(255,255,255,'+(1-r.t/.25)*.8+')';X.lineWidth=3;
    X.beginPath();X.arc(r.x,r.y,r.r*(.4+r.t/.25*.6),0,7);X.stroke();
  }
  for(const a of S.arcs){
    for(const w of[[OUT,5],['#e9dcff',2.5]]){
      X.strokeStyle=w[0];X.lineWidth=w[1];X.lineJoin='round';X.beginPath();
      a.pts.forEach((p,i)=>{
        if(!i){X.moveTo(p[0],p[1]);return}
        const o=a.pts[i-1],j=a.j[i];
        X.lineTo((o[0]+p[0])/2+j,(o[1]+p[1])/2-j);X.lineTo(p[0],p[1]);
      });
      X.stroke();
    }
  }
  for(const q of S.pt){X.globalAlpha=1-q.t/.4;X.fillStyle=q.c;X.beginPath();X.arc(q.x,q.y,3,0,7);X.fill()}
  X.font='bold 14px sans-serif';X.textAlign='center';X.lineWidth=3;X.strokeStyle='#10191a';
  for(const f of S.fx){X.globalAlpha=1-f.t/.9;X.strokeText(f.txt,f.x,f.y);X.fillStyle='#ffd24a';X.fillText(f.txt,f.x,f.y)}
  X.globalAlpha=1;
  if(S.hurt>0){X.fillStyle='rgba(217,103,79,'+S.hurt*.7+')';X.fillRect(0,0,C.width,C.height)}
  if(S.bt<1.8){
    const a=Math.min(1,S.bt/.3,(1.8-S.bt)/.5),sub=S.wave===MAXW?'¡Jefe: '+MAPS[MI].boss.name+'!':S.wave%5===0?'¡Llegan los acorazados!':S.wave%3===0?'¡Enemigos veloces!':S.wave>=3&&MAPS[MI].foe?'Refuerzo: '+KINDS[MAPS[MI].foe].lbl:'';
    X.globalAlpha=a;X.textAlign='center';X.lineJoin='round';X.lineWidth=5;X.strokeStyle='#10191a';
    X.font='bold 38px sans-serif';X.strokeText('Oleada '+S.wave,C.width/2,56);X.fillStyle='#e0b84f';X.fillText('Oleada '+S.wave,C.width/2,56);
    if(sub){X.font='italic 17px sans-serif';X.lineWidth=4;X.strokeText(sub,C.width/2,82);X.fillStyle='#e8e2cf';X.fillText(sub,C.width/2,82)}
    X.globalAlpha=1;
  }
  if(S.paused&&!S.over){
    X.fillStyle='rgba(16,25,26,.6)';X.fillRect(0,0,C.width,C.height);
    X.fillStyle='#e8e2cf';X.font='bold 36px sans-serif';X.textAlign='center';X.fillText('Pausa',C.width/2,C.height/2);
    X.font='16px sans-serif';X.fillText('Pulsa P para continuar',C.width/2,C.height/2+30);
  }
  if(S.over){
    X.fillStyle='rgba(16,25,26,.8)';X.fillRect(0,0,C.width,C.height);
    X.fillStyle=S.over==='win'?'#e0b84f':'#d9674f';X.font='bold 36px sans-serif';X.textAlign='center';
    X.fillText(S.over==='win'?'¡Nivel superado!':'Derrota',C.width/2,C.height/2);
    X.fillStyle='#e8e2cf';X.font='16px sans-serif';X.fillText(S.over==='win'?(MI+1<MAPS.length?'Pulsa "Siguiente nivel" para continuar':'¡Completaste todos los niveles!'):'Pulsa Reiniciar para reintentar',C.width/2,C.height/2+30);
  }
}
let last=performance.now();
function loop(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(!S.paused)for(let i=0;i<S.speed;i++)update(dt);
  draw();
  const lbl=S.over||S.active?(S.active?'Oleada en curso':'Iniciar oleada'):'Iniciar oleada ('+Math.ceil(S.cd)+'s)';
  if($('start').textContent!==lbl)$('start').textContent=lbl;
  requestAnimationFrame(loop);
}
function togglePause(){
  if(S.over)return;
  S.paused=!S.paused;
  if($('pause'))$('pause').textContent=S.paused?'Reanudar':'Pausa';
}
if($('pause'))$('pause').onclick=togglePause;
document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const k=e.key.toLowerCase();
  if(k===' '){
    e.preventDefault();
    if(document.activeElement)document.activeElement.blur();
    if(!S.paused)startWave();
    return;
  }
  if(k==='p'){togglePause();return}
  const key=Object.keys(TYPES)[+k-1];
  if(key&&+k>=1&&(TYPES[key].lvl||1)<=MI+1){S.pick=key;S.sel=null;ui()}
});
reset();requestAnimationFrame(loop);