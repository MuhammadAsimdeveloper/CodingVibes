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
    let siteContent=null,siteScene=null;try{const response=await fetch('/content/site.json',{cache:'no-store'});if(response.ok)siteContent=await response.json()}catch{}try{const response=await fetch('/content/scene.json',{cache:'no-store'});if(response.ok){const candidate=await response.json();if(candidate?.schemaVersion===1&&Array.isArray(candidate.nodes)&&candidate.nodes.length<=250)siteScene=candidate}}catch{}
    const featuredProduct=siteContent?.products?.find(p=>p.status!=='draft'&&p.featured)||siteContent?.products?.find(p=>p.status!=='draft')||null;
    const featuredProperty=siteContent?.properties?.find(p=>p.status!=='draft'&&p.featured)||siteContent?.properties?.find(p=>p.status!=='draft')||null;
    const featuredScene=siteContent?.scenes?.find(p=>p.status!=='draft'&&p.featured)||siteContent?.scenes?.find(p=>p.status!=='draft')||null;
    const experienceRecord=featuredScene||featuredProperty||featuredProduct||null;
    const contentCameraPath=Array.isArray(experienceRecord?.cameraPath)&&experienceRecord.cameraPath.length?experienceRecord.cameraPath:null;
    const contentHotspots=Array.isArray(experienceRecord?.hotspots)?experienceRecord.hotspots:[];
    const contentModel=featuredProduct?.model?.url||featuredProperty?.model?.url||featuredScene?.model?.url||'';
    const contentVideo=featuredProduct?.video?.url||featuredProperty?.video?.url||featuredScene?.video?.url||'';
    const [{Scene,PerspectiveCamera,WebGLRenderer,Color,HemisphereLight,DirectionalLight,PlaneGeometry,MeshStandardMaterial,Mesh,BoxGeometry,ConeGeometry,SphereGeometry,Group,Vector3,Box3,TextureLoader,PointLight,CanvasTexture,VideoTexture,SRGBColorSpace}, {OrbitControls}, {GLTFLoader}] = await Promise.all([
      import(THREE_URL), import(CTRL_URL), import(GLTF_URL)
    ]);
    const scene=new Scene();
    scene.background=new Color('#08111c');
    const camera=new PerspectiveCamera(45,1,0.1,500);
    camera.position.set(12,7,14);
    const renderer=new WebGLRenderer({canvas,antialias:true});
    let animationFrame=0,sceneVisible=true,disposed=false,sceneObserver=null,localVideoUrl=null,localImageUrl=null,recordingUrl=null;
    let scheduleRender=()=>{};
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
    controls.enableDamping=!reducedMotion;
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
    const sceneObjects=new Map(),savedSceneTextures=new Set(),savedSceneVideos=new Set();
    function validAssetUrl(value){try{const u=new URL(value,location.href);return u.protocol==='https:'&&!u.username&&!u.password}catch{return false}}
    function buildSavedScene(documentData){
      if(!documentData||!Array.isArray(documentData.nodes)||documentData.nodes.length>250)return false;
      const roots=new Group();roots.name='build-vibe-saved-scene';scene.add(roots);
      const pending=documentData.nodes.filter(n=>n&&typeof n.id==='string'&&typeof n.type==='string');
      for(const node of pending){
        let object;
        if(node.type==='group')object=new Group();
        else if(node.type==='box')object=new Mesh(new BoxGeometry(1,1,1),makeMat(node.color||'#a7b5ff'));
        else if(node.type==='sphere')object=new Mesh(new SphereGeometry(.5,24,16),makeMat(node.color||'#a7b5ff'));
        else if(node.type==='plane')object=new Mesh(new PlaneGeometry(1,1),makeMat(node.color||'#a7b5ff'));
        else if(node.type==='text'){
          const canvasText=document.createElement('canvas');canvasText.width=1024;canvasText.height=256;
          const ctx=canvasText.getContext('2d');if(ctx){ctx.clearRect(0,0,1024,256);ctx.fillStyle=node.color||'#ffffff';ctx.font='bold 88px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(node.text||node.name||'Text').slice(0,120),512,128,960);}
          const texture=new CanvasTexture(canvasText);savedSceneTextures.add(texture);object=new Mesh(new PlaneGeometry(3,0.75),new MeshStandardMaterial({map:texture,transparent:true,side:2}));
        }
        else if(node.type==='light')object=new PointLight(new Color(node.color||'#ffffff'),1.5,0,2);
        else if(node.type==='image'||node.type==='video'){
          object=new Mesh(new PlaneGeometry(1,1),new MeshStandardMaterial({color:node.color||'#ffffff',side:2}));
          if(node.assetUrl&&validAssetUrl(node.assetUrl)){
            if(node.type==='video'){
              const video=document.createElement('video');video.crossOrigin='anonymous';video.muted=true;video.loop=true;video.playsInline=true;video.preload='metadata';video.src=node.assetUrl;savedSceneVideos.add(video);
              const texture=new VideoTexture(video);texture.colorSpace=SRGBColorSpace;savedSceneTextures.add(texture);object.material.map=texture;object.material.needsUpdate=true;video.play().catch(()=>{});
            }else new TextureLoader().load(node.assetUrl,texture=>{if(disposed){texture.dispose();return}texture.colorSpace=SRGBColorSpace;savedSceneTextures.add(texture);object.material.map=texture;object.material.needsUpdate=true;scheduleRender()},undefined,()=>{if(fallback)fallback.textContent='A saved scene media asset could not be loaded.'});
          }
        }
        else if(node.type==='model'){object=new Group();if(node.assetUrl&&validAssetUrl(node.assetUrl)){new GLTFLoader().load(node.assetUrl,gltf=>{if(disposed){disposeModelResources(gltf.scene);return}object.add(gltf.scene);scheduleRender()},undefined,()=>{if(fallback)fallback.textContent='A saved scene model could not be loaded.'})}}
        else continue;
        object.name=node.id;object.visible=node.visible!==false;
        const vector=(value,defaults)=>Array.isArray(value)&&value.length===3&&value.every(Number.isFinite)?value:defaults;
        const position=vector(node.position,[0,0,0]),rotation=vector(node.rotation,[0,0,0]),scale=vector(node.scale,[1,1,1]);
        object.position.set(...position);object.rotation.set(...rotation);object.scale.set(...scale);
        sceneObjects.set(node.id,object);
      }
      for(const node of pending){const object=sceneObjects.get(node.id);if(!object)continue;const parent=sceneObjects.get(node.parentId)||roots;parent.add(object);}
      return pending.some(node=>sceneObjects.has(node.id));
    }
    if(siteScene&&buildSavedScene(siteScene)){group.visible=false;ground.visible=false;if(fallback)fallback.textContent='Loaded saved project 3D scene.'}
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

    let loadedModel=null,attachedTexture=null,modelLoadGeneration=0;
    const originalMaterials=new WeakMap(),appliedMaterials=new WeakMap();
    function disposeModelResources(root){
      if(!root)return;
      const geometries=new Set(),materials=new Set(),textures=new Set();
      root.traverse(node=>{
        if(node.geometry)geometries.add(node.geometry);
        const list=Array.isArray(node.material)?node.material:(node.material?[node.material]:[]);
        for(const material of list){
          if(!material||materials.has(material))continue;
          materials.add(material);
          for(const value of Object.values(material)){
            if(value?.isTexture&&value!==attachedTexture)textures.add(value);
          }
        }
      });
      for(const texture of textures)texture.dispose?.();
      for(const material of materials)material.dispose?.();
      for(const geometry of geometries)geometry.dispose?.();
    }
    function restoreAppliedMaterials(root){
      root?.traverse(node=>{
        if(!node.isMesh||!appliedMaterials.has(node))return;
        const replacement=appliedMaterials.get(node),materials=Array.isArray(replacement)?replacement:[replacement];
        materials.forEach(material=>material?.dispose?.());
        node.material=originalMaterials.get(node);
        appliedMaterials.delete(node);
      });
    }
    function applyTextureToObject(root,texture){
      if(!root)return 0;
      let count=0;
      root.traverse(node=>{
        if(!node.isMesh)return;
        if(!originalMaterials.has(node))originalMaterials.set(node,node.material);
        const original=originalMaterials.get(node),materials=Array.isArray(original)?original:[original];
        const replacements=materials.map(material=>{
          const clone=material.clone();clone.map=texture;if(clone.color?.set)clone.color.set(0xffffff);clone.needsUpdate=true;return clone;
        });
        appliedMaterials.set(node,Array.isArray(original)?replacements:replacements[0]);
        node.material=Array.isArray(original)?replacements:replacements[0];
        count++;
      });
      return count;
    }
    function applyImageTexture(){
      if(!localImageUrl){if(fallback)fallback.textContent='Load an image first, then apply it as a 3D texture.';return;}
      const imageUrl=localImageUrl;
      if(fallback)fallback.textContent='Applying image texture to the 3D scene…';
      new TextureLoader().load(imageUrl,texture=>{
        if(disposed||imageUrl!==localImageUrl){texture.dispose();return;}
        const root=loadedModel||group;
        restoreAppliedMaterials(root);
        if(attachedTexture)attachedTexture.dispose();
        texture.colorSpace=SRGBColorSpace;
        texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
        attachedTexture=texture;
        const count=applyTextureToObject(root,texture);
        if(fallback)fallback.textContent=count?'Applied the image texture to '+count+' 3D mesh(es).':'This 3D scene has no compatible mesh to texture.';
        scheduleRender();
      },undefined,()=>{if(fallback)fallback.textContent='Image texture could not be loaded. Try a PNG, JPEG or WebP image.';});
    }
    async function loadModel(source,label='model'){
      const loadGeneration=++modelLoadGeneration;
      const ownedUrl=typeof source==='string'?'':URL.createObjectURL(source);
      const url=ownedUrl||source;
      try{
        const object=await new GLTFLoader().loadAsync(url);
        if(disposed||loadGeneration!==modelLoadGeneration){disposeModelResources(object.scene);return;}
        if(loadedModel){
          restoreAppliedMaterials(loadedModel);
          scene.remove(loadedModel);
          disposeModelResources(loadedModel);
        }
        loadedModel=object.scene;loadedModel.position.y=0;
        const box3=new Box3().setFromObject(loadedModel);const size=box3.getSize(new Vector3()),maxSide=Math.max(size.x,size.y,size.z)||1;loadedModel.scale.setScalar(6/maxSide);loadedModel.position.y=Math.max(0,-box3.min.y*loadedModel.scale.y);scene.add(loadedModel);
        if(attachedTexture)applyTextureToObject(loadedModel,attachedTexture);
        if(fallback)fallback.textContent='Loaded '+label;
        scheduleRender();
      }catch(e){
        if(!disposed&&loadGeneration===modelLoadGeneration&&fallback)fallback.textContent='Model load failed; showing procedural fallback.';
        if(!disposed&&loadGeneration===modelLoadGeneration)console.error(e);
      }finally{
        if(ownedUrl)URL.revokeObjectURL(ownedUrl);
      }
    }

    let tourTimer=null,cameraMotionFrame=0;
    let activeRecorder=null,recordingTimer=null,recordingStream=null;
    function stopCameraMotion(){
      if(cameraMotionFrame){cancelAnimationFrame(cameraMotionFrame);cameraMotionFrame=0;}
    }
    function stopRecording(){
      if(recordingTimer){clearTimeout(recordingTimer);recordingTimer=null;}
      if(activeRecorder&&activeRecorder.state!=='inactive'){try{activeRecorder.stop()}catch{}}
      recordingStream?.getTracks().forEach(track=>track.stop());
      recordingStream=null;
    }
    function moveCamera(position,target=new Vector3(0,1,0),seconds=2){
      stopCameraMotion();
      if(reducedMotion){camera.position.copy(position);controls.target.copy(target);controls.update();scheduleRender();return;}
      const start=camera.position.clone(),startTarget=controls.target.clone(),t0=performance.now();
      const tick=now=>{
        cameraMotionFrame=0;
        if(disposed||document.hidden||!sceneVisible)return;
        const p=Math.min(1,(now-t0)/(seconds*1000));
        const eased=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
        camera.position.lerpVectors(start,position,eased);
        controls.target.lerpVectors(startTarget,target,eased);
        scheduleRender();
        if(p<1)cameraMotionFrame=requestAnimationFrame(tick);
      };
      cameraMotionFrame=requestAnimationFrame(tick);
    }

    function playTour(){
      const fallbackShots=[new Vector3(12,6,14),new Vector3(-12,5,10),new Vector3(-10,4,-10),new Vector3(10,5,-12),new Vector3(7,3,8)];
      const shots=contentCameraPath?.map(p=>new Vector3(Number(p.x)||0,Number(p.y)||0,Number(p.z)||0)).filter(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z))||fallbackShots;
      const durations=contentCameraPath?.map(p=>Math.max(.5,Number(p.duration)||2.2))||[];
      clearInterval(tourTimer);
      let i=0;
      if(reducedMotion){moveCamera(shots[0],new Vector3(0,1.4,0),0);if(fallback)fallback.textContent='Motion is reduced. Camera tour moved to its first view.';return;}
      moveCamera(shots[0],new Vector3(0,1.4,0),durations[0]||2.2);
      tourTimer=setInterval(()=>{i=(i+1)%shots.length;moveCamera(shots[i],new Vector3(0,1.4,0),durations[i]||2.4)},Math.max(1400,(durations[0]||2.2)*1000+200));
    }

    function recordTour(){
      if(!canvas.captureStream||!window.MediaRecorder){if(fallback)fallback.textContent='Tour recording is not supported in this browser.';return}
      if(activeRecorder&&activeRecorder.state!=='inactive'){if(fallback)fallback.textContent='A tour recording is already in progress.';return}
      const stream=canvas.captureStream(30),chunks=[];
      const candidates=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
      let mimeType='';
      try{mimeType=candidates.find(type=>MediaRecorder.isTypeSupported(type))||''}catch{}
      let recorder;
      try{recorder=new MediaRecorder(stream,mimeType?{mimeType}:{})}catch{
        stream.getTracks().forEach(track=>track.stop());
        if(fallback)fallback.textContent='Tour recording could not start in this browser.';
        return;
      }
      activeRecorder=recorder;recordingStream=stream;
      recorder.ondataavailable=e=>e.data.size&&chunks.push(e.data);
      recorder.onerror=()=>{
        if(recordingTimer){clearTimeout(recordingTimer);recordingTimer=null;}
        stream.getTracks().forEach(track=>track.stop());
        if(recordingStream===stream)recordingStream=null;
        if(activeRecorder===recorder)activeRecorder=null;
        if(fallback)fallback.textContent='Tour recording stopped because the browser reported an error.';
      };
      recorder.onstop=()=>{
        if(recordingTimer){clearTimeout(recordingTimer);recordingTimer=null;}
        stream.getTracks().forEach(track=>track.stop());
        if(recordingStream===stream)recordingStream=null;
        if(activeRecorder===recorder)activeRecorder=null;
        if(!chunks.length)return;
        const blob=new Blob(chunks,{type:recorder.mimeType||'video/webm'});
        if(recordingUrl)URL.revokeObjectURL(recordingUrl);recordingUrl=URL.createObjectURL(blob);
        const a=document.createElement('a');a.href=recordingUrl;a.download='build-vibe-3d-tour.webm';a.textContent='Download recorded tour';a.className='download-link';
        stage?.append(a);
        if(fallback)fallback.textContent='Tour recording ready to download.';
      };
      try{recorder.start();playTour();recordingTimer=setTimeout(()=>{if(recorder.state!=='inactive')recorder.stop()},9000)}
      catch{
        if(recordingTimer){clearTimeout(recordingTimer);recordingTimer=null;}
        stream.getTracks().forEach(track=>track.stop());
        if(recordingStream===stream)recordingStream=null;
        if(activeRecorder===recorder)activeRecorder=null;
        if(fallback)fallback.textContent='Tour recording could not start in this browser.';
      }
    }

    document.querySelector('#tourPlay')?.addEventListener('click',playTour);
    document.querySelector('#tourRecord')?.addEventListener('click',recordTour);
    document.querySelector('#applyExperienceTexture')?.addEventListener('click',applyImageTexture);
    const rotateView=angle=>{controls.rotateLeft(angle);controls.update();scheduleRender();};
    document.querySelector('#viewLeft')?.addEventListener('click',()=>rotateView(Math.PI/12));
    document.querySelector('#viewRight')?.addEventListener('click',()=>rotateView(-Math.PI/12));
    const zoomView=factor=>{const offset=camera.position.clone().sub(controls.target).multiplyScalar(factor);offset.clampLength(controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(offset);controls.update();scheduleRender();};
    document.querySelector('#viewZoomOut')?.addEventListener('click',()=>zoomView(1.15));
    document.querySelector('#viewZoomIn')?.addEventListener('click',()=>zoomView(.87));
    if(contentModel)loadModel(contentModel,featuredProduct?.title||featuredProperty?.title||featuredScene?.title||'site model');
    document.querySelector('#modelInput')?.addEventListener('change',e=>{
      const file=e.target.files?.[0];if(!file)return;
      if(!/\.(glb|gltf)$/i.test(file.name)||file.size>150*1024*1024){if(fallback)fallback.textContent='Choose a GLB/GLTF model smaller than 150 MB.';e.target.value='';return;}
      if(/\.gltf$/i.test(file.name)&&fallback)fallback.textContent='Loading GLTF. For models with companion textures, use a self-contained GLB file.';
      loadModel(file,file.name);
    });
    document.querySelector('#experienceImageInput')?.addEventListener('change',e=>{
      const file=e.target.files?.[0];if(!file)return;
      const allowed=['image/png','image/jpeg','image/webp','image/avif','image/gif'];
      if(!allowed.includes(file.type)||file.size>20*1024*1024){if(fallback)fallback.textContent='Choose a PNG, JPEG, WebP, AVIF or GIF image smaller than 20 MB.';e.target.value='';return;}
      restoreAppliedMaterials(loadedModel||group);
      if(attachedTexture){attachedTexture.dispose();attachedTexture=null;}
      if(localImageUrl)URL.revokeObjectURL(localImageUrl);localImageUrl=URL.createObjectURL(file);
      const img=document.querySelector('#experienceImage');if(img){img.src=localImageUrl;img.alt='Preview image: '+file.name;img.hidden=false;}
      const applyButton=document.querySelector('#applyExperienceTexture');if(applyButton)applyButton.disabled=false;
      if(fallback)fallback.textContent='Image attached. Apply image texture to update the 3D scene.';
    });
    document.querySelector('#videoInput')?.addEventListener('change',e=>{
      const file=e.target.files?.[0];if(!file)return;
      const validMime=['video/mp4','video/webm'].includes(file.type),validExt=/\.(mp4|webm)$/i.test(file.name);
      if((!validMime&&!validExt)||file.size>100*1024*1024){if(fallback)fallback.textContent='Choose an MP4/WebM video smaller than 100 MB.';e.target.value='';return;}
      const video=document.querySelector('#tourVideo');if(video){if(localVideoUrl)URL.revokeObjectURL(localVideoUrl);localVideoUrl=URL.createObjectURL(file);video.src=localVideoUrl;video.hidden=false;video.load();}
      if(fallback)fallback.textContent='Video attached to the 3D experience: '+file.name;
    });
    const hotspotHost=document.querySelector('[data-experience-hotspots]');if(hotspotHost&&contentHotspots.length){hotspotHost.replaceChildren(...contentHotspots.slice(0,24).map(h=>{const b=document.createElement('button');b.type='button';b.dataset.room=h.room||h.label||'View';b.dataset.x=String(h.position?.x??0);b.dataset.y=String(h.position?.y??1.2);b.dataset.z=String(h.position?.z??0);b.textContent=h.label||h.room||'View';return b}));}
    const hotspotButtons=hotspotHost?hotspotHost.querySelectorAll('button[data-room]'):document.querySelectorAll('[data-room]');
    hotspotButtons.forEach(button=>button.addEventListener('click',()=>{
      const presets={Living:new Vector3(7,3,8),Kitchen:new Vector3(-7,3,5),Bedroom:new Vector3(-6,3,-6)};
      const key=button.dataset.room;
      const custom=button.dataset.x!==undefined?new Vector3(Number(button.dataset.x)||0,Number(button.dataset.y)||1.2,Number(button.dataset.z)||0):null;
      moveCamera(custom||presets[key]||new Vector3(8,4,10),new Vector3(0,1.2,0),1.4);
      if(fallback)fallback.textContent='Viewing '+key;
    }));

    const render=()=>{
      animationFrame=0;
      if(disposed||document.hidden||!sceneVisible)return;
      controls.update();renderer.render(scene,camera);
      if(!reducedMotion)scheduleRender();
    };
    scheduleRender=()=>{
      if(animationFrame||disposed||document.hidden||!sceneVisible)return;
      animationFrame=requestAnimationFrame(render);
    };
    const stopRender=()=>{if(animationFrame){cancelAnimationFrame(animationFrame);animationFrame=0;}};
    const handleVisibility=()=>{if(document.hidden){clearInterval(tourTimer);stopCameraMotion();stopRecording();stopRender();}else scheduleRender();};
    document.addEventListener('visibilitychange',handleVisibility);
    if('IntersectionObserver' in window){
      sceneObserver=new IntersectionObserver(entries=>{
        sceneVisible=entries.some(entry=>entry.isIntersecting);
        if(sceneVisible)scheduleRender();else{clearInterval(tourTimer);stopCameraMotion();stopRecording();stopRender();}
      },{threshold:0.01});
      sceneObserver.observe(stage||canvas);
    }
    controls.addEventListener('change',scheduleRender);
    addEventListener('beforeunload',()=>{
      disposed=true;stopRecording();stopCameraMotion();stopRender();clearInterval(tourTimer);sceneObserver?.disconnect();
      controls.removeEventListener('change',scheduleRender);document.removeEventListener('visibilitychange',handleVisibility);
      removeEventListener('resize',resize);if(localVideoUrl)URL.revokeObjectURL(localVideoUrl);if(localImageUrl)URL.revokeObjectURL(localImageUrl);if(recordingUrl)URL.revokeObjectURL(recordingUrl);
      restoreAppliedMaterials(loadedModel||group);if(loadedModel){scene.remove(loadedModel);disposeModelResources(loadedModel);loadedModel=null;}for(const texture of savedSceneTextures)texture.dispose?.();for(const video of savedSceneVideos){video.pause();video.removeAttribute('src');video.load();}savedSceneTextures.clear();savedSceneVideos.clear();if(attachedTexture)attachedTexture.dispose();
      renderer.dispose();controls.dispose?.();
    },{once:true});
    scheduleRender();
    if(contentVideo){const video=document.querySelector('#tourVideo');if(video){video.src=contentVideo;video.hidden=false;video.load();}}
    if(fallback)fallback.textContent=reducedMotion?'Interactive 3D ready · motion reduced':'Interactive 3D ready';
  }catch(e){
    if(fallback)fallback.textContent='3D unavailable. Responsive content remains usable.';
    console.error(e);
  }
}
start();
