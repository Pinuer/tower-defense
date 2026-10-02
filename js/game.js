const C=document.getElementById('c'),X=C.getContext('2d');
const T=40,W=16,H=12,MAXW=20;
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
  frost:{name:'Hielo',cost:75,range:100,rate:.9,dmg:4,slow:1,col:'#7cc4e0'}
};
const KINDS={normal:{sp:50,hp:1,col:'#cfd8c8',r:9},fast:{sp:90,hp:.6,col:'#e8e07a',r:7},tank:{sp:32,hp:3.5,col:'#a07cc4',r:12}};
let S;
function reset(){
  S={gold:150,lives:20,wave:0,towers:[],enemies:[],shots:[],queue:[],spawnT:0,active:false,over:null,speed:1,pick:'arrow',sel:null,mx:-1,my:-1};
  ui();
}
const $=id=>document.getElementById(id);
function ui(){
  $('gold').textContent=S.gold;$('lives').textContent=S.lives;$('wave').textContent=S.wave;
  $('start').disabled=S.active||!!S.over;
  document.querySelectorAll('#shop button').forEach(b=>{b.classList.toggle('sel',b.dataset.k===S.pick);b.disabled=S.gold<TYPES[b.dataset.k].cost&&b.dataset.k!==S.pick&&false});
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
  const b=document.createElement('button');b.dataset.k=k;b.textContent=TYPES[k].name+' ('+TYPES[k].cost+')';
  b.onclick=()=>{S.pick=k;S.sel=null;ui()};shop.appendChild(b);
}
$('start').onclick=()=>{
  if(S.active||S.over)return;
  S.wave++;S.active=true;
  const n=6+S.wave*2;
  for(let i=0;i<n;i++){
    let k='normal';
    if(S.wave%5===0&&i%4===3)k='tank';else if(S.wave%3===0&&i%2===1)k='fast';
    S.queue.push(k);
  }
  S.spawnT=0;ui();
};
$('speed').onclick=()=>{S.speed=S.speed===1?2:1;$('speed').textContent='Velocidad x'+S.speed};
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
function hit(e,dmg,slow){
  if(e.dead)return;
  e.hp-=dmg;if(slow)e.slow=1.5;
  if(e.hp<=0){e.dead=true;S.gold+=e.rw;ui()}
}
function update(dt){
  if(S.over)return;
  if(S.queue.length){
    S.spawnT-=dt;
    if(S.spawnT<=0){
      const k=KINDS[S.queue.shift()],hp=20*Math.pow(1.18,S.wave)*k.hp;
      S.enemies.push({d:0,hp,max:hp,sp:k.sp,col:k.col,r:k.r,slow:0,rw:Math.floor(6+S.wave/2)});
      S.spawnT=.8;
    }
  }
  for(const e of S.enemies){
    e.slow=Math.max(0,e.slow-dt);
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
    if(best){t.cd=TYPES[t.k].rate;S.shots.push({x:t.x,y:t.y,tg:best,t});}
  }
  for(const s of S.shots){
    if(s.tg.dead){s.gone=true;continue}
    const p=pos(s.tg.d),dx=p[0]-s.x,dy=p[1]-s.y,dist=Math.hypot(dx,dy),step=320*dt;
    if(dist<=step){
      const d=TYPES[s.t.k];
      if(d.splash){for(const e of S.enemies){const q=pos(e.d);if(Math.hypot(q[0]-p[0],q[1]-p[1])<=d.splash)hit(e,s.t.dmg)}}
      else hit(s.tg,s.t.dmg,d.slow);
      s.gone=true;
    }else{s.x+=dx/dist*step;s.y+=dy/dist*step}
  }
  S.shots=S.shots.filter(s=>!s.gone);
  S.enemies=S.enemies.filter(e=>!e.dead);
  if(S.active&&!S.queue.length&&!S.enemies.length){
    S.active=false;S.gold+=20+S.wave*2;
    if(S.wave>=MAXW)S.over='win';
    ui();
  }
}
function draw(){
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    X.fillStyle=path.has(x+','+y)?'#c9b88a':((x+y)%2?'#264236':'#2a4a3b');
    X.fillRect(x*T,y*T,T,T);
  }
  const hx=Math.floor(S.mx/T),hy=Math.floor(S.my/T);
  if(S.mx>=0&&!path.has(hx+','+hy)&&!S.over){
    const d=TYPES[S.pick];
    X.fillStyle='rgba(255,255,255,.12)';X.fillRect(hx*T,hy*T,T,T);
    X.strokeStyle='rgba(255,255,255,.35)';X.beginPath();X.arc(hx*T+T/2,hy*T+T/2,d.range,0,7);X.stroke();
  }
  for(const t of S.towers){
    if(t===S.sel){X.strokeStyle='#fff';X.beginPath();X.arc(t.x,t.y,t.range,0,7);X.stroke()}
    X.fillStyle='#10191a';X.fillRect(t.cx*T+4,t.cy*T+4,T-8,T-8);
    X.fillStyle=TYPES[t.k].col;X.beginPath();X.arc(t.x,t.y,10,0,7);X.fill();
    X.fillStyle='#10191a';X.font='bold 11px Georgia';X.textAlign='center';X.fillText(t.lv,t.x,t.y+4);
  }
  for(const e of S.enemies){
    const p=pos(e.d);
    X.fillStyle=e.slow>0?'#7cc4e0':e.col;X.beginPath();X.arc(p[0],p[1],e.r,0,7);X.fill();
    X.fillStyle='#000';X.fillRect(p[0]-12,p[1]-e.r-7,24,3);
    X.fillStyle='#6fcf7a';X.fillRect(p[0]-12,p[1]-e.r-7,24*Math.max(0,e.hp/e.max),3);
  }
  for(const s of S.shots){X.fillStyle=TYPES[s.t.k].col;X.beginPath();X.arc(s.x,s.y,3,0,7);X.fill()}
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
  draw();requestAnimationFrame(loop);
}
reset();requestAnimationFrame(loop);
