const C=document.getElementById('c'),X=C.getContext('2d');
const T=40,W=16,H=12,MAXW=20,WAIT=30;
const WP=[[0,2],[11,2],[11,5],[3,5],[3,9],[15,9]].map(p=>[p[0]*T+T/2,p[1]*T+T/2]);
const seg=[];let total=0;
for(let i=1;i<WP.length;i++){const l=Math.hypot(WP[i][0]-WP[i-1][0],WP[i][1]-WP[i-1][1]);seg.push(l);total+=l}
const path=new Set();
for(let i=1;i<WP.length;i++){
  const a=WP[i-1],b=WP[i],n=Math.round(seg[i-1]/T);
  for(let k=0;k<=n;k++)path.add(Math.floor((a[0]+(b[0]-a[0])*k/n)/T)+','+Math.floor((a[1]+(b[1]-a[1])*k/n)/T));
}
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
  S={fx:[],pt:[],cd:WAIT,gold:150,lives:20,wave:0,towers:[],enemies:[],shots:[],queue:[],spawnT:0,active:false,over:null,speed:1,pick:'arrow',sel:null,mx:-1,my:-1};
  $('speed').textContent='Velocidad x1';
  ui();
}
const $=id=>document.getElementById(id);
function ui(){
  $('gold').textContent=S.gold;$('lives').textContent=S.lives;$('wave').textContent=S.wave;
  $('start').disabled=S.active||!!S.over;
  document.querySelectorAll('#shop button').forEach(b=>{b.classList.toggle('sel',b.dataset.k===S.pick);b.classList.toggle('poor',S.gold<TYPES[b.dataset.k].cost)});
  const t=S.sel;$('sel').hidden=!t;
  if(t){
    const maxed=t.lv>=3;
    $('up').textContent=maxed?'Nivel máximo':'Mejorar ('+upCost(t)+')';
    $('up').disabled=maxed||S.gold<upCost(t);
    $('sell').textContent='Vender (+'+Math.floor(t.spent*.7)+')';
  }
}
const upCost=t=>Math.round(TYPES[t.k].cost*.7*t.lv);
const shop=$('shop');
for(const k in TYPES){
  const b=document.createElement('button');b.dataset.k=k;b.style.setProperty('--c',TYPES[k].col);b.textContent=TYPES[k].name+' ('+TYPES[k].cost+')';
  b.onclick=()=>{S.pick=k;S.sel=null;ui()};shop.appendChild(b);
}
function startWave(){
  if(S.active||S.over)return;
  S.wave++;S.active=true;
  const n=6+S.wave*2;
  for(let i=0;i<n;i++){
    let k='normal';
    if(S.wave%5===0&&i%4===3)k='tank';else if(S.wave%3===0&&i%2===1)k='fast';
    S.queue.push(k);
  }
  S.spawnT=0;ui();
}
$('start').onclick=startWave;
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
  S.towers.push({k:S.pick,cx,cy,x:cx*T+T/2,y:cy*T+T/2,range:d.range,dmg:d.dmg,cd:0,lv:1,spent:d.cost});
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
  if(S.over)return;
  if(!S.active){S.cd-=dt;if(S.cd<=0)startWave()}
  if(S.queue.length){
    S.spawnT-=dt;
    if(S.spawnT<=0){
      const kn=S.queue.shift(),k=KINDS[kn],hp=20*Math.pow(1.18,S.wave)*k.hp;
      S.enemies.push({kind:kn,d:0,hp,max:hp,sp:k.sp,col:k.col,r:k.r,slow:0,rw:Math.floor(6+S.wave/2)});
      S.spawnT=.8;
    }
  }
  for(const e of S.enemies){
    e.slow=Math.max(0,e.slow-dt);
    if(e.burn>0){e.burn-=dt;hit(e,e.bd*dt)}
    e.d+=e.sp*(e.slow>0?.5:1)*dt;
    if(e.d>=total&&!e.dead){e.dead=true;S.lives--;ui();if(S.lives<=0){S.over='lose'}}
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
    S.active=false;S.cd=WAIT;S.gold+=20+S.wave*2;
    if(S.wave>=MAXW)S.over='win';
    ui();
  }
}
/* ---------- Mapa (se dibuja una sola vez) ---------- */
const MAP=document.createElement('canvas');MAP.width=W*T;MAP.height=H*T;
(function(){
  const g=MAP.getContext('2d');let s=7;
  const R=()=>(s=(s*16807)%2147483647)/2147483647;
  const greens=['#55843f','#4f7c3a','#5a8a43','#4b7536'];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){g.fillStyle=greens[Math.floor(R()*4)];g.fillRect(x*T,y*T,T,T)}
  g.lineWidth=1.5;
  for(let i=0;i<420;i++){
    const x=R()*MAP.width,y=R()*MAP.height;
    g.strokeStyle=R()<.5?'#3f6a2f':'#6a9b50';
    g.beginPath();g.moveTo(x,y);g.lineTo(x-2,y-5);g.moveTo(x,y);g.lineTo(x+2,y-5);g.stroke();
  }
  const fl=['#f2e6a0','#f4f4f0','#e89aa8'];
  for(let i=0;i<40;i++){g.fillStyle=fl[Math.floor(R()*3)];g.beginPath();g.arc(R()*MAP.width,R()*MAP.height,2,0,7);g.fill()}
  const pts=WP.map(p=>p.slice());pts[0][0]=-20;pts[pts.length-1][0]=W*T;
  g.lineJoin='round';g.lineCap='butt';
  for(const [w,c] of [[46,'#6b4c2e'],[38,'#c9a96b'],[24,'#d3b77c']]){
    g.lineWidth=w;g.strokeStyle=c;g.beginPath();
    pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();
  }
  for(let i=0;i<160;i++){
    const p=pos(R()*total);
    g.fillStyle=R()<.5?'#a98a52':'#e6d09a';
    g.beginPath();g.ellipse(p[0]+(R()-.5)*26,p[1]+(R()-.5)*26,2.5,1.6,0,0,7);g.fill();
  }
  const vg=g.createRadialGradient(MAP.width/2,MAP.height/2,180,MAP.width/2,MAP.height/2,430);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.32)');
  g.fillStyle=vg;g.fillRect(0,0,MAP.width,MAP.height);
  // fortaleza al final del camino
  const kx=(W-1)*T,ky=9*T;
  g.fillStyle='#8d8a82';g.fillRect(kx+3,ky+6,34,30);
  g.fillStyle='#6f6c66';
  for(let i=0;i<4;i++)g.fillRect(kx+3+i*9,ky+1,7,7);
  g.fillStyle='#2a2320';g.beginPath();g.moveTo(kx+13,ky+36);g.lineTo(kx+13,ky+22);g.arc(kx+20,ky+22,7,Math.PI,0);g.lineTo(kx+27,ky+36);g.fill();
  g.fillStyle='#d9674f';g.fillRect(kx+19,ky-10,10,6);g.fillStyle='#e8e2cf';g.fillRect(kx+18,ky-12,1.5,14);
})();

/* ---------- Torres ---------- */
function diamond(r){X.beginPath();X.moveTo(0,-r);X.lineTo(r*.7,0);X.lineTo(0,r);X.lineTo(-r*.7,0);X.closePath()}
function drawTower(t,t0){
  const x=t.x,y=t.y;
  X.fillStyle='rgba(0,0,0,.25)';X.beginPath();X.ellipse(x,y+13,15,6,0,0,7);X.fill();
  X.fillStyle='#7d7a73';X.beginPath();X.arc(x,y,16,0,7);X.fill();
  X.strokeStyle='#5d5b56';X.lineWidth=2;X.stroke();
  X.fillStyle='#97948c';X.beginPath();X.arc(x,y,12,0,7);X.fill();
  X.save();X.translate(x,y);
  if(t.k==='arrow'){
    X.rotate(t.ang||0);
    X.fillStyle='#8a5a2b';X.fillRect(-4,-2,18,4);
    X.strokeStyle='#e0b84f';X.lineWidth=3;X.beginPath();X.arc(8,0,9,-1.3,1.3);X.stroke();
    X.strokeStyle='#e8e2cf';X.lineWidth=1;X.beginPath();X.moveTo(8+9*Math.cos(1.3),-9*Math.sin(1.3));X.lineTo(8+9*Math.cos(1.3),9*Math.sin(1.3));X.stroke();
    X.fillStyle='#5c3b1c';X.beginPath();X.arc(0,0,5.5,0,7);X.fill();
  }else if(t.k==='cannon'){
    X.rotate(t.ang||0);
    X.fillStyle='#1f2024';X.fillRect(0,-5,19,10);
    X.fillStyle='#4a4b52';X.fillRect(16,-6.5,5,13);
    X.fillStyle='#34353b';X.beginPath();X.arc(0,0,9,0,7);X.fill();
    X.fillStyle='#d9674f';X.beginPath();X.arc(0,0,4,0,7);X.fill();
  }else if(t.k==='fire'){
    X.rotate(t.ang||0);
    X.fillStyle='#3a2a22';X.fillRect(0,-4,16,8);
    X.fillStyle='#7a3a1c';X.fillRect(14,-5.5,5,11);
    X.fillStyle='#b5432a';X.beginPath();X.arc(-4,0,8,0,7);X.fill();
    X.fillStyle='#d9674f';X.beginPath();X.arc(-6,-2,3,0,7);X.fill();
    X.fillStyle='#ffb347';X.beginPath();X.arc(21,0,2.5+Math.sin(t0*20)*.8,0,7);X.fill();
  }else{
    X.fillStyle='rgba(124,196,224,.25)';X.beginPath();X.arc(0,0,18,0,7);X.fill();
    X.rotate(t0*.8);
    X.fillStyle='#9fdcf0';diamond(13);X.fill();
    X.strokeStyle='#4f93b3';X.lineWidth=1.5;X.stroke();
    X.fillStyle='#e6f8ff';diamond(6);X.fill();
  }
  X.restore();
  for(let i=0;i<t.lv;i++){
    X.fillStyle='#e0b84f';X.strokeStyle='#3a3320';X.lineWidth=1;
    X.beginPath();X.arc(x-6+i*6,y+12,2.3,0,7);X.fill();X.stroke();
  }
}

/* ---------- Enemigos ---------- */
function drawEnemy(e,t0){
  const p=pos(e.d),q=pos(e.d+2),dx=q[0]-p[0],dy=q[1]-p[1],l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l;
  const x=p[0],y=p[1]+Math.sin(t0*12+e.d*.12)*1.5,r=e.r;
  X.fillStyle='rgba(0,0,0,.25)';X.beginPath();X.ellipse(p[0],p[1]+r*.8,r,r*.4,0,0,7);X.fill();
  if(e.kind==='fast'){
    X.strokeStyle='rgba(255,255,255,.5)';X.lineWidth=2;
    for(const o of[-3,3]){X.beginPath();X.moveTo(x-ux*r-uy*o,y-uy*r+ux*o);X.lineTo(x-ux*(r+9)-uy*o,y-uy*(r+9)+ux*o);X.stroke()}
  }
  X.fillStyle=e.slow>0?'#7cc4e0':e.burn>0?'#ff9a4a':e.col;
  X.strokeStyle=e.kind==='tank'?'#4a4d57':'#10191a';X.lineWidth=e.kind==='tank'?3.5:2;
  X.beginPath();X.arc(x,y,r,0,7);X.fill();X.stroke();
  X.fillStyle='rgba(255,255,255,.28)';X.beginPath();X.arc(x-r*.3,y-r*.35,r*.45,0,7);X.fill();
  const sw=Math.sin(t0*8+e.d*.05);
  X.save();X.translate(x,y);X.rotate(Math.atan2(uy,ux));
  if(e.kind==='fast'){
    for(const s of[-1,1]){
      const st=Math.sin(t0*14+s*2+e.d*.1)*2.5,wx=r*.4+st,wy=s*r*.95;
      X.fillStyle='#6b4c2e';X.fillRect(wx,wy-1,3,2);
      X.fillStyle='#f1f1f1';X.beginPath();X.moveTo(wx+3,wy-1.6);X.lineTo(wx+11,wy);X.lineTo(wx+3,wy+1.6);X.closePath();X.fill();
    }
  }else if(e.kind==='tank'){
    X.fillStyle='#8a8f99';X.strokeStyle='#3b3e46';X.lineWidth=1.5;
    X.beginPath();X.ellipse(r*.95,-r*.45,3.5,r*.8,0,0,7);X.fill();X.stroke();
    X.fillStyle='#d9674f';X.beginPath();X.ellipse(r*.95,-r*.45,1.5,r*.4,0,0,7);X.fill();
    X.translate(r*.2,r*.95);X.rotate(sw*.45);
    X.fillStyle='#6b4c2e';X.fillRect(0,-1.5,r+3,3);
    X.fillStyle='#4a4d57';X.beginPath();X.arc(r+7,0,4.5,0,7);X.fill();
    X.strokeStyle='#aab0bb';X.lineWidth=1.5;
    for(let k=0;k<4;k++){const a=k*Math.PI/2+.4;X.beginPath();X.moveTo(r+7+Math.cos(a)*4,Math.sin(a)*4);X.lineTo(r+7+Math.cos(a)*7,Math.sin(a)*7);X.stroke()}
  }else{
    X.translate(r*.3,r*.95);X.rotate(sw*.5-.3);
    X.fillStyle='#6b4c2e';X.fillRect(-2,-1.5,5,3);
    X.fillStyle='#c9a96b';X.fillRect(3,-4,2.5,8);
    X.fillStyle='#e6edf0';X.fillRect(5.5,-1.5,r+3,3);
    X.beginPath();X.moveTo(r+8.5,-1.5);X.lineTo(r+13.5,0);X.lineTo(r+8.5,1.5);X.closePath();X.fill();
  }
  X.restore();
  for(const s of[-1,1]){
    const ex=x+ux*r*.45-uy*r*.38*s,ey=y+uy*r*.45+ux*r*.38*s;
    X.fillStyle='#fff';X.beginPath();X.arc(ex,ey,r*.3,0,7);X.fill();
    X.fillStyle='#10191a';X.beginPath();X.arc(ex+ux*r*.1,ey+uy*r*.1,r*.15,0,7);X.fill();
  }
  if(e.hp<e.max){
    X.fillStyle='#10191a';X.fillRect(x-13,y-r-10,26,5);
    X.fillStyle=e.hp/e.max>.4?'#6fcf7a':'#e0b84f';X.fillRect(x-12,y-r-9,24*Math.max(0,e.hp/e.max),3);
  }
}

/* ---------- Dibujo ---------- */
function draw(){
  X.drawImage(MAP,0,0);
  const t0=performance.now()/1000;
  const hx=Math.floor(S.mx/T),hy=Math.floor(S.my/T);
  if(S.mx>=0&&!path.has(hx+','+hy)&&!S.over){
    const d=TYPES[S.pick];
    X.fillStyle='rgba(255,255,255,.18)';X.fillRect(hx*T,hy*T,T,T);
    X.strokeStyle='rgba(255,255,255,.5)';X.lineWidth=1.5;X.beginPath();X.arc(hx*T+T/2,hy*T+T/2,d.range,0,7);X.stroke();
  }
  for(const t of S.towers){
    if(t===S.sel){X.strokeStyle='#fff';X.lineWidth=1.5;X.beginPath();X.arc(t.x,t.y,t.range,0,7);X.stroke()}
    drawTower(t,t0);
  }
  for(const e of S.enemies)drawEnemy(e,t0);
  for(const s of S.shots){
    const k=s.t.k;
    if(k==='arrow'){
      X.strokeStyle='#f3e3a0';X.lineWidth=2;X.beginPath();
      X.moveTo(s.x,s.y);X.lineTo(s.x-Math.cos(s.a)*10,s.y-Math.sin(s.a)*10);X.stroke();
    }else if(k==='cannon'){
      X.fillStyle='#1f2024';X.beginPath();X.arc(s.x,s.y,4.5,0,7);X.fill();
      X.fillStyle='#6a6b73';X.beginPath();X.arc(s.x-1,s.y-1,1.5,0,7);X.fill();
    }else if(k==='fire'){
      X.fillStyle='rgba(255,110,30,.45)';X.beginPath();X.arc(s.x,s.y,7,0,7);X.fill();
      X.fillStyle='#ffd24a';X.beginPath();X.arc(s.x,s.y,3.5,0,7);X.fill();
    }else{
      X.fillStyle='rgba(124,196,224,.35)';X.beginPath();X.arc(s.x,s.y,7,0,7);X.fill();
      X.fillStyle='#d8f4ff';X.beginPath();X.arc(s.x,s.y,3.5,0,7);X.fill();
    }
  }
  for(const q of S.pt){X.globalAlpha=1-q.t/.4;X.fillStyle=q.c;X.beginPath();X.arc(q.x,q.y,3,0,7);X.fill()}
  X.font='bold 14px Georgia';X.textAlign='center';X.lineWidth=3;X.strokeStyle='#10191a';
  for(const f of S.fx){X.globalAlpha=1-f.t/.9;X.strokeText(f.txt,f.x,f.y);X.fillStyle='#ffd24a';X.fillText(f.txt,f.x,f.y)}
  X.globalAlpha=1;
  if(S.over){
    X.fillStyle='rgba(16,25,26,.8)';X.fillRect(0,0,C.width,C.height);
    X.fillStyle=S.over==='win'?'#e0b84f':'#d9674f';X.font='bold 36px Georgia';X.textAlign='center';
    X.fillText(S.over==='win'?'¡Victoria!':'Derrota',C.width/2,C.height/2);
    X.fillStyle='#e8e2cf';X.font='16px Georgia';X.fillText('Pulsa Reiniciar para jugar de nuevo',C.width/2,C.height/2+30);
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