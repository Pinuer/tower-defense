/* Mapas: ruta (wp), oro inicial, vida de enemigos (hpm) y colores de cada nivel.
   Se carga antes que game.js. */
const MAPS=[
  {name:'Valle',gold:120,hpm:1,wp:[[0,2],[11,2],[11,5],[3,5],[3,9],[15,9]],
   gr:['#55843f','#4f7c3a','#5a8a43','#4b7536'],bl:['#3f6a2f','#6a9b50'],pl:'150,200,90',pd:'25,60,25',
   fl:['#f2e6a0','#f4f4f0','#e89aa8','#b9a5e8'],bu:['#3f6f33','#477a39','#5a9447'],rk:['#8a8d88','#b4b7b0'],
   tr:['#2f5f2b','#33672e','#3d7a35','#4f9142'],pc:['#6b4c2e','#b99560','#c9a96b','#d6bc82']},
  {name:'Nieve',gold:140,hpm:1.1,wp:[[0,1],[13,1],[13,4],[2,4],[2,7],[13,7],[13,10],[15,10]],
   gr:['#dfe9ee','#d5e2e9','#e9f1f5','#cddce5'],bl:['#9db4c2','#f4fafc'],pl:'255,255,255',pd:'90,120,150',
   fl:['#bfe3f5','#ffffff','#a9c8f0','#d8eefc'],bu:['#5f8a82','#6b9a90','#7fb0a4'],rk:['#7c8590','#aab3bd'],
   tr:['#27524a','#2d5f55','#36705f','#4a8a75'],pc:['#5d5147','#9a8a78','#b09f8b','#c4b4a0']},
  {name:'Desierto',gold:150,hpm:1.15,wp:[[0,5],[4,5],[4,1],[8,1],[8,9],[12,9],[12,3],[15,3]],
   gr:['#d9bf7e','#d2b672','#e0c78a','#cbae68'],bl:['#b3924d','#ecd79a'],pl:'255,230,150',pd:'120,80,30',
   fl:['#e8734a','#f2c14e','#d9674f','#f4e4b0'],bu:['#6b7a3a','#7a8a45','#8a9a52'],rk:['#a08060','#c4a47e'],
   tr:['#4f6b2f','#587a35','#668a3c','#789c48'],pc:['#6a4a2a','#a8794a','#b98a56','#c99a66']},
  {name:'Volcán',gold:160,hpm:1.2,wp:[[0,10],[5,10],[5,6],[10,6],[10,10],[12,10],[12,2],[15,2]],
   gr:['#3a3433','#342e2d','#403938','#2f2928'],bl:['#5a4a46','#8a5a3a'],pl:'255,110,40',pd:'10,5,5',
   fl:['#ff8a2b','#ffd24a','#e8532a','#ffb347'],bu:['#4a3a30','#5a4638','#6a5240'],rk:['#2c2a2e','#4a474d'],
   tr:['#2a2220','#33292a','#3d3030','#4a3a38'],pc:['#1d1412','#7a2a14','#c4501e','#ff8a2b']}
];

/* Dibuja el mapa actual en el canvas MAP (definido en game.js) */
function drawMap(){
  const m=MAPS[MI],g=MAP.getContext('2d');let s=7+MI*13;
  const R=()=>(s=(s*16807)%2147483647)/2147483647;
  const OUTL='#1c211d',end=WP[WP.length-1],endY=Math.round((end[1]-T/2)/T),has=(x,y)=>path.has(x+','+y);
  const box=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(a,b,w,h);g.strokeRect(a,b,w,h)};
  const near=(x,y)=>x>=W-2&&Math.abs(y-endY)<2;
  g.lineJoin='round';g.lineCap='square';g.strokeStyle=OUTL;g.lineWidth=2;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){g.fillStyle=m.gr[(x+y)%2];g.fillRect(x*T,y*T,T,T)}
  g.lineWidth=1.5;g.strokeStyle=m.bl[0];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    if(has(x,y))continue;
    const n=R()<.7?(R()<.4?2:1):0;
    for(let i=0;i<n;i++){const a=x*T+7+R()*26,b=y*T+10+R()*22;g.beginPath();g.moveTo(a-3,b-4);g.lineTo(a,b);g.lineTo(a+3,b-4);g.stroke()}
  }
  for(let i=0;i<14;i++){
    const x=Math.floor(R()*W),y=Math.floor(R()*H),a=x*T+8+R()*22,b=y*T+8+R()*22;
    if(has(x,y)||near(x,y))continue;
    g.fillStyle=m.fl[Math.floor(R()*4)];g.fillRect(a,b,4,4);g.fillStyle='#fff6c0';g.fillRect(a+1,b+1,2,2);
  }
  g.fillStyle=m.pc[2];
  path.forEach(k=>{const[x,y]=k.split(',').map(Number);g.fillRect(x*T,y*T,T,T)});
  path.forEach(k=>{
    const[x,y]=k.split(',').map(Number);
    for(let i=0;i<3;i++){g.fillStyle=R()<.5?m.pc[1]:m.pc[3];g.fillRect(x*T+5+R()*28,y*T+5+R()*28,4,3)}
  });
  g.fillStyle=m.pc[0];
  path.forEach(k=>{
    const[x,y]=k.split(',').map(Number);
    if(!has(x,y-1))g.fillRect(x*T,y*T,T,3);
    if(!has(x,y+1))g.fillRect(x*T,y*T+T-3,T,3);
    if(!has(x-1,y)&&x>0)g.fillRect(x*T,y*T,3,T);
    if(!has(x+1,y)&&x<W-1)g.fillRect(x*T+T-3,y*T,3,T);
  });
  const sy=WP[0][1];g.fillStyle=m.pc[0];
  for(const o of[0,10]){g.beginPath();g.moveTo(7+o,sy-9);g.lineTo(17+o,sy);g.lineTo(7+o,sy+9);g.lineTo(11+o,sy);g.closePath();g.fill()}
  g.lineWidth=2;g.strokeStyle=OUTL;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    if(has(x,y)||near(x,y))continue;
    const cx=x*T+T/2,cy=y*T+T/2,border=x===0||y===0||x===W-1||y===H-1,roll=R();
    if(border&&roll<.65){
      box(cx-3,cy+5,6,10,'#5b3d22');
      g.fillStyle=m.tr[1];g.beginPath();g.arc(cx,cy-1,13,0,7);g.fill();g.stroke();
      g.fillStyle=m.tr[3];g.beginPath();g.arc(cx-4,cy-5,5,0,7);g.fill();
    }else if(!border&&roll<.04){
      g.fillStyle=m.bu[1];g.beginPath();g.arc(cx,cy,9,0,7);g.fill();g.stroke();
      g.fillStyle=m.bu[2];g.beginPath();g.arc(cx-3,cy-3,3.5,0,7);g.fill();
    }else if(!border&&roll<.09){
      box(cx-8,cy-5,16,10,m.rk[0]);g.fillStyle=m.rk[1];g.fillRect(cx-6,cy-3,6,3);
    }
  }
  const kx=(W-1)*T,ky=endY*T;
  box(kx+8,ky+12,24,25,'#a6a39a');
  for(let i=0;i<3;i++)box(kx+8+i*9,ky+7,6,6,'#a6a39a');
  for(const tx of[kx+1,kx+29]){
    box(tx,ky+6,10,31,'#8c897f');box(tx-1,ky+2,12,5,'#7a776e');
    g.fillStyle=OUTL;g.fillRect(tx+4,ky+14,2,5);
  }
  g.fillStyle=OUTL;g.fillRect(kx+15,ky+25,10,12);g.beginPath();g.arc(kx+20,ky+25,5,Math.PI,0);g.fill();
  g.fillRect(kx+5,ky-12,2,14);
  g.fillStyle='#d9674f';g.beginPath();g.moveTo(kx+7,ky-12);g.lineTo(kx+17,ky-8);g.lineTo(kx+7,ky-4);g.closePath();g.fill();g.stroke();
}