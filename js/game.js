const C=document.getElementById('c'),X=C.getContext('2d');
const T=40,W=16,H=12,MAXW=20,WAIT=20;
let MI=0,WP,seg,total,path;
function setMap(i){
  MI=i;WP=MAPS[i].wp.map(p=>[p[0]*T+T/2,p[1]*T+T/2]);
  seg=[];total=0;
  for(let i=1;i<WP.length;i++){const l=Math.hypot(WP[i][0]-WP[i-1][0],WP[i][1]-WP[i-1][1]);seg.push(l);total+=l}
  path=new Set();
  for(let i=1;i<WP.length;i++){
    const a=WP[i-1],b=WP[i],n=Math.round(seg[i-1]/T);
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
function pos(d){
  for(let i=0;i<seg.length;i++){
    if(d<=seg[i]){const t=d/seg[i];return[WP[i][0]+(WP[i+1][0]-WP[i][0])*t,WP[i][1]+(WP[i+1][1]-WP[i][1])*t]}
    d-=seg[i];
  }
  return WP[WP.length-1];
}
const TYPES={
  arrow:{name:'Flecha',cost:50,range:120,rate:.5,dmg:12,col:'#e0b84f'},
  cannon:{name:'Cañón',cost:100,range:100,rate:1.3,dmg:30,splash:45,col:'#d9674f'},
  frost:{name:'Hielo',cost:75,range:100,rate:.9,dmg:4,slow:1,col:'#7cc4e0'},
  fire:{name:'Fuego',cost:120,range:85,rate:.12,dmg:3,burn:1,col:'#ff8a2b'}
};
const KINDS={normal:{sp:50,hp:1,col:'#cfd8c8',r:9},fast:{sp:90,hp:.6,col:'#e8e07a',r:7},tank:{sp:32,hp:3.5,col:'#a07cc4',r:12}};
let S;
function reset(){
  S={fx:[],pt:[],cd:WAIT,gold:MAPS[MI].gold,lives:20,wave:0,towers:[],enemies:[],shots:[],queue:[],spawnT:0,active:false,over:null,speed:1,bt:9,hurt:0,pick:'arrow',sel:null,mx:-1,my:-1};
  $('speed').textContent='Velocidad x1';$('mapbtn').textContent='Nivel '+(MI+1)+': '+MAPS[MI].name;
  ui();
}
const $=id=>document.getElementById(id);
function ui(){
  $('gold').textContent=S.gold;$('lives').textContent=S.lives;$('wave').textContent=S.wave;
  $('start').disabled=S.active||!!S.over;
  $('mapbtn').textContent=S.over==='win'&&MI+1<MAPS.length?'Siguiente nivel →':'Nivel '+(MI+1)+': '+MAPS[MI].name;
  document.querySelectorAll('#shop button').forEach(b=>{b.classList.toggle('sel',b.dataset.k===S.pick);b.classList.toggle('poor',S.gold<TYPES[b.dataset.k].cost)});
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
    if(S.wave%5===0&&i%4===3)k='tank';else if(S.wave%3===0&&i%2===1)k='fast';
    S.queue.push(k);
  }
  S.spawnT=0;ui();
}
$('start').onclick=startWave;
$('mapbtn').onclick=()=>{
  const n=S.over==='win'&&MI+1<MAPS.length?MI+1:(MI+1)%unlocked;
  setMap(n);drawMap();reset();
  $('info').textContent='Nivel '+(MI+1)+': '+MAPS[MI].name+(unlocked<MAPS.length?'. Supera este nivel para desbloquear el siguiente.':'.');
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
function hit(e,dmg,slow,burn){
  if(e.dead)return;
  e.hp-=dmg;if(slow)e.slow=1.5;
  if(burn){e.burn=2;e.bd=Math.max(e.bd||0,dmg*1.5)}
  if(e.hp<=0){
    e.dead=true;S.gold+=e.rw;const q=pos(e.d);
    S.fx.push({x:q[0],y:q[1]-12,t:0,txt:'+'+e.rw});
    for(let i=0;i<7;i++){const a=Math.random()*6.28;S.pt.push({x:q[0],y:q[1],vx:Math.cos(a)*55,vy:Math.sin(a)*55,t:0,c:e.col})}
    ui();
  }
}
function update(dt){
  for(const f of S.fx){f.t+=dt;f.y-=24*dt}
  for(const q of S.pt){q.t+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt}
  S.fx=S.fx.filter(f=>f.t<.9);S.pt=S.pt.filter(q=>q.t<.4);
  S.bt+=dt;S.hurt=Math.max(0,S.hurt-dt);
  if(S.over)return;
  if(!S.active){S.cd-=dt;if(S.cd<=0)startWave()}
  if(S.queue.length){
    S.spawnT-=dt;
    if(S.spawnT<=0){
      const kn=S.queue.shift(),k=KINDS[kn],hp=20*Math.pow(1.19,S.wave)*k.hp*MAPS[MI].hpm;
      S.enemies.push({kind:kn,d:0,hp,max:hp,sp:k.sp*(1+S.wave*.01),col:k.col,r:k.r,slow:0,rw:Math.floor(6+S.wave/2)});
      S.spawnT=.8;
    }
  }
  for(const e of S.enemies){
    e.slow=Math.max(0,e.slow-dt);
    if(e.burn>0){e.burn-=dt;hit(e,e.bd*dt)}
    e.d+=e.sp*(e.slow>0?.5:1)*dt;
    if(e.d>=total&&!e.dead){e.dead=true;S.lives--;S.hurt=.35;ui();if(S.lives<=0){S.over='lose'}}
  }
  for(const t of S.towers){
    t.cd-=dt;if(t.cd>0)continue;
    let best=null;
    for(const e of S.enemies){
      if(e.dead)continue;
      const p=pos(e.d);
      if(Math.hypot(p[0]-t.x,p[1]-t.y)<=t.range&&(!best||e.d>best.d))best=e;
    }
    if(best){const q=pos(best.d);t.ang=Math.atan2(q[1]-t.y,q[0]-t.x);t.cd=TYPES[t.k].rate;S.shots.push({x:t.x,y:t.y,tg:best,t,a:t.ang});}
  }
  for(const s of S.shots){
    if(s.tg.dead){s.gone=true;continue}
    const p=pos(s.tg.d),dx=p[0]-s.x,dy=p[1]-s.y,dist=Math.hypot(dx,dy),step=320*dt;
    if(dist<=step){
      const d=TYPES[s.t.k];
      if(d.splash){for(const e of S.enemies){const q=pos(e.d);if(Math.hypot(q[0]-p[0],q[1]-p[1])<=d.splash)hit(e,s.t.dmg)}}
      else hit(s.tg,s.t.dmg,d.slow,d.burn);
      s.gone=true;
    }else{s.a=Math.atan2(dy,dx);s.x+=dx/dist*step;s.y+=dy/dist*step}
  }
  S.shots=S.shots.filter(s=>!s.gone);
  S.enemies=S.enemies.filter(e=>!e.dead);
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
  }
  X.restore();
  if(t.k==='frost'){
    X.save();X.rotate(t0*.5);X.lineWidth=1.5;
    rect(-9,-9,18,18,c);rect(-5,-5,10,10,'#e6f8ff');
    for(const[a,b]of[[11,-2],[-15,-2],[-2,11],[-2,-15]])rect(a,b,4,4,c);
    X.restore();
  }
  X.lineWidth=1;
  for(let i=0;i<t.lv;i++)rect(-10+i*7,10,5,4,'#f4efe0');
  X.restore();
}

/*Enemigos*/
function drawEnemy(e,t0){
  const p=pos(e.d),q=pos(e.d+2),r=e.r,x=p[0],y=p[1],sw=Math.sin(t0*8+e.d*.05);
  const body=e.slow>0?'#7cc4e0':e.burn>0?'#ff9a4a':e.col,STEEL='#dfe4e6',WOOD='#8a5a2b';
  const rect=(a,b,w,h,c)=>{X.fillStyle=c;X.fillRect(a,b,w,h);X.strokeRect(a,b,w,h)};
  X.save();X.translate(x,y);X.rotate(Math.atan2(q[1]-p[1],q[0]-p[0]));
  X.lineJoin='round';X.strokeStyle=OUT;X.lineWidth=1.5;
  if(e.kind==='fast'){
    for(const s of[-1,1]){X.save();X.translate(r*.2,s*r*.9);X.rotate(sw*.4*s);rect(0,-1.5,5,3,WOOD);rect(5,-1.5,9,3,STEEL);X.restore()}
    X.lineWidth=2;X.fillStyle=body;X.beginPath();X.moveTo(r+2,0);X.lineTo(-r,-r);X.lineTo(-r,r);X.closePath();X.fill();X.stroke();
  }else if(e.kind==='tank'){
    X.save();X.translate(0,r+1);X.rotate(sw*.3);rect(0,-1.5,r+4,3,WOOD);rect(r+3,-4,6,8,'#7b7f88');X.restore();
    X.lineWidth=2;X.fillStyle=body;X.fillRect(-r,-r,r*2,r*2);X.strokeRect(-r,-r,r*2,r*2);
    X.lineWidth=1.5;rect(r-1,-r*.85,5,r*1.7,'#9aa0aa');rect(r+1,-2,3,4,'#d9674f');
  }else{
    X.save();X.translate(r*.4,r*.9);X.rotate(sw*.35-.2);rect(-2,-1.5,5,3,WOOD);rect(3,-4,2.5,8,'#c9a96b');rect(5.5,-1.5,r+6,3,STEEL);X.restore();
    X.lineWidth=2;X.fillStyle=body;X.beginPath();X.arc(0,0,r,0,7);X.fill();X.stroke();
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
  for(const s of S.shots){
    X.fillStyle=TYPES[s.t.k].col;X.strokeStyle=OUT;X.lineWidth=1.5;
    X.fillRect(s.x-3,s.y-3,6,6);X.strokeRect(s.x-3,s.y-3,6,6);
  }
  for(const q of S.pt){X.globalAlpha=1-q.t/.4;X.fillStyle=q.c;X.beginPath();X.arc(q.x,q.y,3,0,7);X.fill()}
  X.font='bold 14px sans-serif';X.textAlign='center';X.lineWidth=3;X.strokeStyle='#10191a';
  for(const f of S.fx){X.globalAlpha=1-f.t/.9;X.strokeText(f.txt,f.x,f.y);X.fillStyle='#ffd24a';X.fillText(f.txt,f.x,f.y)}
  X.globalAlpha=1;
  if(S.hurt>0){X.fillStyle='rgba(217,103,79,'+S.hurt*.7+')';X.fillRect(0,0,C.width,C.height)}
  if(S.bt<1.8){
    const a=Math.min(1,S.bt/.3,(1.8-S.bt)/.5),sub=S.wave%5===0?'¡Llegan los acorazados!':S.wave%3===0?'¡Enemigos veloces!':'';
    X.globalAlpha=a;X.textAlign='center';X.lineJoin='round';X.lineWidth=5;X.strokeStyle='#10191a';
    X.font='bold 38px sans-serif';X.strokeText('Oleada '+S.wave,C.width/2,56);X.fillStyle='#e0b84f';X.fillText('Oleada '+S.wave,C.width/2,56);
    if(sub){X.font='italic 17px sans-serif';X.lineWidth=4;X.strokeText(sub,C.width/2,82);X.fillStyle='#e8e2cf';X.fillText(sub,C.width/2,82)}
    X.globalAlpha=1;
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
  for(let i=0;i<S.speed;i++)update(dt);
  draw();
  const lbl=S.over||S.active?(S.active?'Oleada en curso':'Iniciar oleada'):'Iniciar oleada ('+Math.ceil(S.cd)+'s)';
  if($('start').textContent!==lbl)$('start').textContent=lbl;
  requestAnimationFrame(loop);
}
reset();requestAnimationFrame(loop);