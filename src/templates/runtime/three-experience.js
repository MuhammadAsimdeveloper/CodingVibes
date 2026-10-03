const THREE_URL='https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js';
const CTRL_URL='https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/controls/OrbitControls.js';
const GLTF_URL='https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/loaders/GLTFLoader.js';

const canvas=document.querySelector('#experience3d');
const stage=document.querySelector('.experience-stage');
const fallback=document.querySelector('#experienceFallback');

async function start(){
  if(!canvas)return;
  try{
    const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let siteContent=null;try{const response=await fetch('/content/site.json',{cache:'no-store'});if(response.ok)siteContent=await response.json()}catch{}
    const featuredProduct=siteContent?.products?.find(p=>p.status!=='draft'&&p.featured)||siteContent?.products?.find(p=>p.status!=='draft')||null;
    const featuredProperty=siteContent?.properties?.find(p=>p.status!=='draft'&&p.featured)||siteContent?.properties?.find(p=>p.status!=='draft')||null;
    const featuredScene=siteContent?.scenes?.find(p=>p.status!=='draft'&&p.featured)||siteContent?.scenes?.find(p=>p.status!=='draft')||null;
    const contentModel=featuredProduct?.model?.url||featuredProperty?.model?.url||featuredScene?.model?.url||'';
    const contentVideo=featuredProduct?.video?.url||featuredProperty?.video?.url||featuredScene?.video?.url||'';
    const [{Scene,PerspectiveCamera,WebGLRenderer,Color,HemisphereLight,DirectionalLight,PlaneGeometry,MeshStandardMaterial,Mesh,BoxGeometry,ConeGeometry,SphereGeometry,Group,Vector3,Box3}, {OrbitControls}, {GLTFLoader}] = await Promise.all([
      import(THREE_URL), import(CTRL_URL), import(GLTF_URL)
    ]);
    const scene=new Scene();
    scene.background=new Color('#08111c');
    const camera=new PerspectiveCamera(45,1,0.1,500);
    camera.position.set(12,7,14);
    const renderer=new WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
    const resize=()=>{
      const r=canvas.getBoundingClientRect();
      const w=Math.max(1,r.width),h=Math.max(1,r.height);
      renderer.setSize(w,h,false);
      camera.aspect=w/h;
      camera.updateProjectionMatrix();
    };
    addEventListener('resize',resize);
    resize();

    const controls=new OrbitControls(camera,canvas);
    controls.enableDamping=true;
    controls.target.set(0,1,0);
    controls.maxDistance=40;
    controls.minDistance=3;

    scene.add(new HemisphereLight(0xe3efff,0x1d3428,2.4));
    const sun=new DirectionalLight(0xffefcf,3.1);sun.position.set(12,18,10);scene.add(sun);

    const ground=new Mesh(new PlaneGeometry(50,50),new MeshStandardMaterial({color:0x1e382b,roughness:1}));
    ground.rotation.x=-Math.PI/2;
    scene.add(ground);

    const group=new Group();
    scene.add(group);
    const makeMat=(color,roughness=.72)=>new MeshStandardMaterial({color,roughness});
    const wall=makeMat(0xe8dfd0), roof=makeMat(0x4a392e), wood=makeMat(0x62432c), glass=makeMat(0x78afbf,.25);
    const box=(w,h,d,mat,x=0,y=h/2,z=0)=>{
      const mesh=new Mesh(new BoxGeometry(w,h,d),mat);
      mesh.position.set(x,y,z);group.add(mesh);return mesh;
    };
    if(stage?.dataset.propertyTour!=='false'){
      box(8,3.1,6,wall);
      box(3.0,2.3,.25,glass,0,2.0,3.03);
      box(1.15,2.0,.32,wood,2.3,1.0,3.05);
      const roofMesh=new Mesh(new ConeGeometry(5.6,2.8,4),roof);
      roofMesh.rotation.y=Math.PI/4;roofMesh.position.y=4.55;group.add(roofMesh);
      for(let i=0;i<7;i++){
        const trunk=new Mesh(new BoxGeometry(.35,2.1,.35),wood);
        trunk.position.set(-12+i*4,1.05,-7-Math.sin(i)*2);scene.add(trunk);
        const crown=new Mesh(new SphereGeometry(1.35,16,12),makeMat(0x315f3c));
        crown.position.set(trunk.position.x,3.1,trunk.position.z);scene.add(crown);
      }
    } else {
      const hero=new Mesh(new BoxGeometry(4,4,4),makeMat(0x6a7dff,.38));hero.position.y=2;group.add(hero);
    }

    let loadedModel=null;
    async function loadModel(source,label='model'){
      try{
        const url=typeof source==='string'?source:URL.createObjectURL(source);const object=await new GLTFLoader().loadAsync(url);if(typeof source!=='string')setTimeout(()=>URL.revokeObjectURL(url),0);
        if(loadedModel)scene.remove(loadedModel);loadedModel=object.scene;loadedModel.position.y=0;
        const box3=new Box3().setFromObject(loadedModel);const size=box3.getSize(new Vector3()),maxSide=Math.max(size.x,size.y,size.z)||1;loadedModel.scale.setScalar(6/maxSide);loadedModel.position.y=Math.max(0,-box3.min.y*loadedModel.scale.y);scene.add(loadedModel);
        if(fallback)fallback.textContent='Loaded '+label;
      }catch(e){if(fallback)fallback.textContent='Model load failed; showing procedural fallback.';console.error(e)}
    }

    let tourTimer=null;
    function moveCamera(position,target=new Vector3(0,1,0),seconds=2){
      const start=camera.position.clone(),startTarget=controls.target.clone(),t0=performance.now();
      const tick=now=>{
        const p=Math.min(1,(now-t0)/(seconds*1000));
        const eased=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
        camera.position.lerpVectors(start,position,eased);
        controls.target.lerpVectors(startTarget,target,eased);
        if(p<1)requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    function playTour(){
      const shots=[new Vector3(12,6,14),new Vector3(-12,5,10),new Vector3(-10,4,-10),new Vector3(10,5,-12),new Vector3(7,3,8)];
      clearInterval(tourTimer);
      let i=0;
      moveCamera(shots[0]);
      tourTimer=setInterval(()=>{i=(i+1)%shots.length;moveCamera(shots[i],new Vector3(0,1.4,0),2.4)},2600);
    }

    function recordTour(){
      if(!canvas.captureStream||!window.MediaRecorder){if(fallback)fallback.textContent='Tour recording is not supported in this browser.';return}
      const stream=canvas.captureStream(30),chunks=[];
      let options={mimeType:'video/webm'};
      try{const candidates=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];for(const t of candidates)if(MediaRecorder.isTypeSupported(t)){options={mimeType:t};break}}catch{}
      const recorder=new MediaRecorder(stream,options);
      recorder.ondataavailable=e=>e.data.size&&chunks.push(e.data);
      recorder.onstop=()=>{
        const blob=new Blob(chunks,{type:'video/webm'});
        const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='codingvibes-3d-tour.webm';a.textContent='Download recorded tour';a.className='download-link';
        stage?.append(a);
      };
      recorder.start();
      playTour();
      setTimeout(()=>recorder.stop(),9000);
    }

    document.querySelector('#tourPlay')?.addEventListener('click',playTour);
    document.querySelector('#tourRecord')?.addEventListener('click',recordTour);
    if(contentModel)loadModel(contentModel,featuredProduct?.title||featuredProperty?.title||featuredScene?.title||'site model');
    document.querySelector('#modelInput')?.addEventListener('change',e=>e.target.files[0]&&loadModel(e.target.files[0],e.target.files[0].name));
    document.querySelector('#videoInput')?.addEventListener('change',e=>{
      const file=e.target.files[0];if(!file)return;
      const video=document.querySelector('#tourVideo');if(video){video.src=URL.createObjectURL(file);video.load()}
    });
    document.querySelectorAll('[data-room]').forEach(button=>button.addEventListener('click',()=>{
      const presets={Living:new Vector3(7,3,8),Kitchen:new Vector3(-7,3,5),Bedroom:new Vector3(-6,3,-6)};
      const key=button.dataset.room;
      moveCamera(presets[key]||new Vector3(8,4,10),new Vector3(0,1.2,0),1.4);
      if(fallback)fallback.textContent='Viewing '+key;
    }));

    const render=()=>{controls.update();renderer.render(scene,camera);requestAnimationFrame(render)};
    render();
    if(contentVideo){const video=document.querySelector('#tourVideo');if(video){video.src=contentVideo;video.load();}}
    if(fallback)fallback.textContent=reducedMotion?'Interactive 3D ready · motion reduced':'Interactive 3D ready';
  }catch(e){
    if(fallback)fallback.textContent='3D unavailable. Responsive content remains usable.';
    console.error(e);
  }
}
start();
