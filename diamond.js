(() => {
  'use strict';
  const stage = document.getElementById('diamond-stage');
  const canvas = document.getElementById('diamond-canvas');
  const context = canvas.getContext('2d');
  if (!context || !stage) return;
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const logo = '<svg viewBox="0 0 200 180" aria-hidden="true"><path d="M44 8H156L196 78 100 176 4 78Z" fill="#b5d0ff"/><path d="M4 78H196M63 12 28 78M52 15H79M87 14 63 78 100 118 135 78 109 14ZM118 14H149L174 78 145 78 117 153M118 14 145 78" fill="none" stroke="#09285a" stroke-width="4"/></svg>';
  document.querySelectorAll('.brand').forEach(brand => { brand.innerHTML = logo + '<span style="color:inherit;font-size:inherit;margin:0;font-weight:900">TOPZONE</span>'; });

  // A bevelled 3D mesh: navy front facets, a polished rim and an extruded back.
  const outline = [[-.6,.76],[.6,.76],[1,0],[0,-1],[-1,0]];
  const vertices = [];
  outline.forEach(([x,y]) => vertices.push([x,y,0]));
  outline.forEach(([x,y]) => vertices.push([x*.91,y*.91,.23]));
  outline.forEach(([x,y]) => vertices.push([x*.87,y*.87,-.32]));
  vertices.push([0,0,.23]);
  const faces = [];
  for (let i=0;i<5;i++) {
    const next=(i+1)%5;
    faces.push({indices:[i,next,next+5,i+5],type:'rim',shade:i});
    faces.push({indices:[i,i+10,next+10,next],type:'side',shade:i});
    faces.push({indices:[i+5,next+5,15],type:'front',shade:i});
  }
  faces.push({indices:[14,13,12,11,10],type:'back',shade:0});
  // White strokes preserve the visual structure of the supplied TOPZONE logo.
  const logoPaths = [
    [[-.91,0],[.91,0]],
    [[-.52,.63],[-.16,.63]],
    [[-.35,.63],[-.70,0]],
    [[-.13,.63],[.13,.63],[.32,0],[0,-.38],[-.33,0],[-.13,.63]],
    [[.24,.63],[.50,.63],[.82,0],[.53,0],[.17,-.73]],
    [[.24,.63],[.53,0]]
  ];
  const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
  const normalize=v=>{const d=Math.hypot(...v)||1;return v.map(n=>n/d);};
  const light=normalize([-.5,.8,1.4]);
  let width=0,height=0,dpr=1,frameId=0,lastTime=0,visible=false,started=false;
  let drop=0,velocity=0,bounces=0,landed=false,impact=0,elapsed=0;
  let pointerX=0,pointerY=0,smoothX=0,smoothY=0;
  const resize=()=>{width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';};
  const begin=()=>{drop=-Math.max(height,650);velocity=0;bounces=0;landed=motionPreference.matches;impact=0;elapsed=0;started=true;if(landed)drop=0;lastTime=0;startLoop();};
  const rotate=(point,yaw,pitch,roll)=>{
    let [x,y,z]=point;
    [x,z]=[x*Math.cos(yaw)+z*Math.sin(yaw),-x*Math.sin(yaw)+z*Math.cos(yaw)];
    [y,z]=[y*Math.cos(pitch)-z*Math.sin(pitch),y*Math.sin(pitch)+z*Math.cos(pitch)];
    return [x*Math.cos(roll)-y*Math.sin(roll),x*Math.sin(roll)+y*Math.cos(roll),z];
  };
  function draw(time) {
    frameId=0;
    if(!visible||document.hidden){context.clearRect(0,0,canvas.width,canvas.height);return;}
    const dt=Math.min(lastTime?(time-lastTime)/1000:1/60,.035);lastTime=time;
    const reduced=motionPreference.matches;
    elapsed+=dt;
    const bounds=stage.getBoundingClientRect();
    const size=Math.min(bounds.width*.34,bounds.height*.39,100);
    const centerX=bounds.left+bounds.width/2;
    const restingY=bounds.top+bounds.height*.45;
    if(!landed&&!reduced){
      velocity+=2250*dt;drop+=velocity*dt;
      if(drop>=0){drop=0;impact=1;bounces++;velocity=-velocity*.43;if(bounces>=4||Math.abs(velocity)<90){landed=true;velocity=0;}}
    }
    impact=Math.max(0,impact-dt*7);
    smoothX+=(pointerX-smoothX)*Math.min(1,dt*5);smoothY+=(pointerY-smoothY)*Math.min(1,dt*5);
    const idle=landed&&!reduced;
    const yaw=reduced?.20:.23+Math.sin(elapsed*1.05)*.15+smoothX*.22;
    const pitch=reduced?-.10:-.12+Math.sin(elapsed*.75)*.045+smoothY*.13;
    const roll=reduced?-.055:(!landed?Math.sin(elapsed*5)*.12:Math.sin(elapsed*.9)*.035);
    const centerY=restingY+drop+(idle?Math.sin(elapsed*1.7)*3:0);
    const project=(point)=>{const p=rotate(point,yaw,pitch,roll);const perspective=4.8/(4.8-p[2]);return {x:centerX+p[0]*size*perspective*(1+impact*.06),y:centerY-p[1]*size*perspective*(1-impact*.09),z:p[2],v:p};};
    const projected=vertices.map(project);
    context.setTransform(dpr,0,0,dpr,0,0);context.clearRect(0,0,width,height);
    context.save();
    if(landed){const headerBottom=document.querySelector('.header').getBoundingClientRect().bottom;context.beginPath();context.rect(0,headerBottom,width,height-headerBottom);context.clip();}
    // The contact shadow expands and darkens as the diamond approaches its landing.
    const proximity=clamp(1+drop/500,0,1);
    context.save();context.translate(centerX,restingY+size*1.03);context.scale(size*.85*(.55+proximity*.45),size*.14);
    const shadow=context.createRadialGradient(0,0,0,0,0,1);shadow.addColorStop(0,`rgba(0,12,52,${.34*proximity})`);shadow.addColorStop(1,'rgba(0,12,52,0)');context.fillStyle=shadow;context.beginPath();context.arc(0,0,1,0,Math.PI*2);context.fill();context.restore();
    const ordered=faces.map(face=>({...face,depth:face.indices.reduce((sum,i)=>sum+projected[i].z,0)/face.indices.length})).sort((a,b)=>a.depth-b.depth);
    for(const face of ordered){
      const pts=face.indices.map(i=>projected[i]);
      const a=pts[0].v,b=pts[1].v,c=pts[2].v;
      const ab=b.map((n,i)=>n-a[i]),ac=c.map((n,i)=>n-a[i]);
      const normal=normalize([ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]]);
      const diffuse=Math.abs(normal.reduce((sum,n,i)=>sum+n*light[i],0));
      let base=face.type==='front'?[12,42,101]:face.type==='rim'?[95,158,247]:[9,31,78];
      const factor=.55+diffuse*.6+(face.type==='front'?face.shade*.035:0);
      const color=base.map(n=>Math.min(255,Math.round(n*factor)));
      context.beginPath();pts.forEach((p,i)=>i?context.lineTo(p.x,p.y):context.moveTo(p.x,p.y));context.closePath();
      const fill=context.createLinearGradient(pts[0].x,pts[0].y,pts[2].x+1,pts[2].y+1);
      fill.addColorStop(0,`rgb(${color.map(n=>Math.min(255,n+13)).join(',')})`);fill.addColorStop(1,`rgb(${color.join(',')})`);
      context.fillStyle=fill;context.fill();context.strokeStyle=face.type==='rim'?'rgba(196,223,255,.7)':'rgba(103,158,244,.25)';context.lineWidth=.7;context.stroke();
    }
    context.lineJoin='miter';context.lineCap='square';context.strokeStyle='#f1f7ff';context.lineWidth=Math.max(1.5,size*.025);
    for(const path of logoPaths){context.beginPath();path.map(([x,y])=>project([x,y,.242])).forEach((p,i)=>i?context.lineTo(p.x,p.y):context.moveTo(p.x,p.y));context.stroke();}
    // Short specular glints are attached to the moving bevel, not the screen.
    if(!reduced&&elapsed>.8){
      for(let i=0;i<4;i++){
        const phase=(elapsed+i*1.31)%4.7;
        if(phase>.65)continue;
        const strength=Math.sin(phase/.65*Math.PI);
        const p=projected[[1,4,7,5][i]];const radius=(9+i%2*4)*strength;
        context.save();context.translate(p.x,p.y);context.rotate(Math.PI*.12);context.globalAlpha=strength;
        context.shadowColor='#dcefff';context.shadowBlur=16;context.fillStyle='#fff';context.beginPath();
        context.moveTo(0,-radius);context.quadraticCurveTo(radius*.12,-radius*.12,radius,0);context.quadraticCurveTo(radius*.12,radius*.12,0,radius);context.quadraticCurveTo(-radius*.12,radius*.12,-radius,0);context.quadraticCurveTo(-radius*.12,-radius*.12,0,-radius);context.fill();context.restore();
      }
    }
    context.restore();
    document.body.classList.add('diamond-ready');
    if(!reduced)startLoop();
  }
  function startLoop(){if(!frameId&&visible&&!document.hidden)frameId=requestAnimationFrame(draw);}
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){if(!started)begin();else {lastTime=0;startLoop();}}else{context.clearRect(0,0,canvas.width,canvas.height);}}, {threshold:0});
  stage.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse')return;const r=stage.getBoundingClientRect();pointerX=clamp((event.clientX-r.left)/r.width*2-1,-1,1);pointerY=clamp((event.clientY-r.top)/r.height*2-1,-1,1);});
  stage.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;});
  document.getElementById('diamond-replay').addEventListener('click',begin);
  addEventListener('resize',()=>{resize();startLoop();});
  addEventListener('scroll',()=>{if(motionPreference.matches)startLoop();},{passive:true});
  document.addEventListener('visibilitychange',()=>{lastTime=0;startLoop();});
  motionPreference.addEventListener('change',()=>{landed=true;drop=0;lastTime=0;startLoop();});
  resize();observer.observe(stage);
})();
