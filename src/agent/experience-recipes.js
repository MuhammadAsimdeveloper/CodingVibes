const BASE_MOTION={
 scroll:'story',
 reveal:'clip-and-fade',
 hover:'magnetic',
 transition:'shared-layout',
 typography:'staggered',
 timing:{base:'420ms',scene:'1200ms',stagger:'70ms'},
 accessibility:{preferReducedMotion:true}
};

const RECIPES={
 'motion-first':{
  type:'motion-first-site',
  motion:{...BASE_MOTION},
  performance:{lazyLoad:true,preferReducedMotion:true,webglFallback:true,devicePixelRatioCap:1.75}
 },
 'property-tour':{
  type:'interactive-3d-property-tour',
  renderer:'three.js@0.186.1',
  modelInputs:['GLB','GLTF'],
  fallback:'procedural-low-poly-house',
  controls:['orbit','zoom','pan','room-hotspots','floor-plan','camera-tour'],
  media:['MP4','WebM'],
  recording:{browser:'MediaRecorder',format:'webm',maxSeconds:30},
  motion:{...BASE_MOTION,scroll:'camera-story',hover:'hotspot-focus',transition:'camera-dolly'},
  performance:{lazyLoad:true,preferReducedMotion:true,webglFallback:true,devicePixelRatioCap:1.75},
 },
 'interactive-3d':{
  type:'interactive-3d-experience',
  renderer:'three.js@0.186.1',
  modelInputs:['GLB','GLTF'],
  controls:['orbit','zoom','camera-path'],
  recording:{browser:'MediaRecorder',format:'webm',maxSeconds:30},
  motion:{...BASE_MOTION,scroll:'camera-story',hover:'depth-shift',transition:'camera-dolly'},
  performance:{lazyLoad:true,preferReducedMotion:true,webglFallback:true,devicePixelRatioCap:1.75},
 }
};
export function recipeForExperience(experience={}){if(experience.type==='property-tour')return RECIPES['property-tour'];if(experience.threeD)return RECIPES['interactive-3d'];if(experience.animation||experience.motion)return RECIPES['motion-first'];return null;}
export function listExperienceRecipes(){return Object.values(RECIPES);}
