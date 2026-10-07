function has(source,patterns){const s=String(source||'').toLowerCase();return patterns.some(x=>s.includes(String(x).toLowerCase()));}
export function auditImmersiveSource(source,spec={}){
  if(!spec.threeD)return {enabled:false,releaseReady:true,score:100,checks:[],missing:[],warnings:[]};
  const checks=[],add=(id,label,ok,critical=true)=>checks.push({id,label,passed:Boolean(ok),critical});
  add('model_loader','3D model loader',has(source,['gltfloader','gltf','glb','three.js','model-loader']),true);
  add('orbit_controls','360/orbit controls',has(source,['orbitcontrols','orbit controls','orbit','rotate','turntable','360']),true);
  add('render_surface','WebGL render surface',has(source,['webglrenderer','renderer','canvas','webgl']),true);
  add('fallback','3D fallback',has(source,['fallback','no 3d','static image','static-image']),true);
  add('loading_error','loading and error state',has(source,['loading','error','onerror','error-state']),true);
  add('reduced_motion','reduced-motion support',has(source,['prefers-reduced-motion','reducedmotion','reduced motion']),true);
  if(spec.immersiveMedia) add('media','video/image media integration',has(source,['<video','video','gallery','poster']),true);
  if(spec.hotspots) add('hotspots','interactive hotspots',has(source,['hotspot','hotspots']),true);
  if(spec.cameraPath) add('camera_path','camera path / walkthrough',has(source,['camerapath','camera path','tour','walkthrough']),true);
  add('touch_keyboard','touch or keyboard-safe interaction',has(source,['pointer','touch','keydown','keyboard']),false);
  const missing=checks.filter(x=>!x.passed).map(x=>x.label),critical=checks.filter(x=>x.critical),score=Math.round(critical.filter(x=>x.passed).length/Math.max(1,critical.length)*100);
  return {enabled:true,releaseReady:missing.length===0,score,checks,missing,warnings:checks.filter(x=>!x.passed&&!x.critical).map(x=>x.label)};
}