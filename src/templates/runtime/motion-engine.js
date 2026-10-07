const root=document.documentElement;
const body=document.body;
const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const preset=body?.dataset.motion||'smooth';
const kind=body?.dataset.kind||'business';

const presets={
  smooth:{distance:'24px',duration:650,ease:'cubic-bezier(.16,1,.3,1)',stagger:55},
  cinematic:{distance:'42px',duration:900,ease:'cubic-bezier(.22,1,.36,1)',stagger:90},
  snappy:{distance:'16px',duration:420,ease:'cubic-bezier(.2,.8,.2,1)',stagger:35},
  luxury:{distance:'28px',duration:1100,ease:'cubic-bezier(.22,1,.36,1)',stagger:120},
  editorial:{distance:'32px',duration:820,ease:'cubic-bezier(.16,1,.3,1)',stagger:75},
  playful:{distance:'20px',duration:560,ease:'cubic-bezier(.34,1.56,.64,1)',stagger:50}
};
const p=presets[preset]||presets.smooth;

function setup(){
  if(!body)return;
  body.dataset.motionReady='true';
  const candidates=[...document.querySelectorAll('main > section, main > .hero-grid, main > .card, main > .store-hero, main > .content-section')];
  const unique=[...new Set(candidates)];
  unique.forEach((el,i)=>{
    el.classList.add('motion-item');
    el.style.setProperty('--motion-index',String(Math.min(i,10)));
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

  const interactive=[...document.querySelectorAll('button,.primary-link,.nav-link,.file-button')];
  if(matchMedia?.('(pointer:fine)').matches){
    interactive.forEach(el=>{
      el.addEventListener('pointermove',event=>{
        if(reduced)return;
        const r=el.getBoundingClientRect();
        const x=(event.clientX-r.left)/Math.max(1,r.width)-.5;
        const y=(event.clientY-r.top)/Math.max(1,r.height)-.5;
        el.style.setProperty('--mx',(x*5).toFixed(2)+'px');
        el.style.setProperty('--my',(y*4).toFixed(2)+'px');
      });
      el.addEventListener('pointerleave',()=>{el.style.removeProperty('--mx');el.style.removeProperty('--my')});
    });
  }

  if(kind==='realEstate'||kind==='immersive'){
    document.querySelectorAll('.experience-stage,.forest-scene').forEach(el=>el.classList.add('motion-scene'));
  }
  if(kind==='ecommerce'||kind==='marketplace'){
    document.querySelectorAll('.product-card,.content-grid > *').forEach(el=>el.classList.add('motion-product'));
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
