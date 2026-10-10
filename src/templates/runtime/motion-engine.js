const root=document.documentElement;
const body=document.body;
const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const preset=body?.dataset.motion||'smooth';
const kind=body?.dataset.kind||'business';

const presets={
  smooth:{distance:'12px',duration:240,ease:'cubic-bezier(.2,.8,.2,1)',stagger:40},
  cinematic:{distance:'12px',duration:240,ease:'cubic-bezier(.2,.8,.2,1)',stagger:40},
  snappy:{distance:'8px',duration:180,ease:'cubic-bezier(.2,.8,.2,1)',stagger:20},
  luxury:{distance:'12px',duration:260,ease:'cubic-bezier(.2,.8,.2,1)',stagger:40},
  editorial:{distance:'10px',duration:240,ease:'cubic-bezier(.2,.8,.2,1)',stagger:35},
  playful:{distance:'8px',duration:200,ease:'cubic-bezier(.2,.8,.2,1)',stagger:30}
};
const p=presets[preset]||presets.smooth;

function setup(){
  if(!body)return;
  body.dataset.motionReady='true';
  const candidates=[...document.querySelectorAll('main > section, main > .hero-grid, main > .card, main > .store-hero, main > .content-section')];
  const unique=[...new Set(candidates)];
  unique.forEach((el,i)=>{
    el.classList.add('motion-item');
    el.style.setProperty('--motion-index',String(Math.min(i,3)));
    el.style.setProperty('--motion-duration',p.duration+'ms');
    el.style.setProperty('--motion-distance',p.distance);
    el.style.setProperty('--motion-ease',p.ease);
    el.style.setProperty('--motion-stagger',p.stagger+'ms');
  });

  document.querySelectorAll('img').forEach((img,i)=>{
    if(!img.closest('.hero-grid')&&!img.closest('.experience-stage'))img.classList.add(i%2?'motion-image-reveal':'motion-image-soft');
  });

  if(reduced){
    unique.forEach(el=>el.classList.add('motion-visible'));
    return;
  }

  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(!entry.isIntersecting)continue;
        entry.target.classList.add('motion-visible');
        io.unobserve(entry.target);
      }
    },{threshold:.08,rootMargin:'0px 0px -8%'});
    unique.forEach(el=>io.observe(el));
  }else unique.forEach(el=>el.classList.add('motion-visible'));

  if(kind==='realEstate'||kind==='immersive'){
    document.querySelectorAll('.experience-stage,.forest-scene').forEach(el=>el.classList.add('motion-scene'));
  }
  if(kind==='ecommerce'||kind==='marketplace'){
    document.querySelectorAll('.product-card,.content-grid > *').forEach(el=>el.classList.add('motion-product'));
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
