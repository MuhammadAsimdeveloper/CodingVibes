const $=s=>document.querySelector(s);
const prefersReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const menuToggle=$('#menuToggle'),nav=$('#mainNav');
menuToggle?.addEventListener('click',()=>{const open=nav?.classList.toggle('open');menuToggle?.setAttribute('aria-expanded',String(Boolean(open)));});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menuToggle?.setAttribute('aria-expanded','false')}));

document.querySelectorAll('[data-menu]').forEach(btn=>btn.addEventListener('click',()=>{
  const id=btn.dataset.menu==='templates'?'templatesMenu':'resourcesMenu';
  const el=document.getElementById(id);
  document.querySelectorAll('.nav-popover').forEach(x=>{if(x!==el)x.hidden=true});
  el.hidden=!el.hidden;
}));
document.addEventListener('click',e=>{if(!e.target.closest('.nav-popover')&&!e.target.closest('[data-menu]'))document.querySelectorAll('.nav-popover').forEach(x=>x.hidden=true)});

document.querySelectorAll('[data-demo-stage]').forEach(stage=>{
  let i=0;
  const items=[
    ['AI is building your website…','Creating pages & adding components'],
    ['Designing your experience…','Applying responsive UI & motion'],
    ['Verifying the result…','Running browser & visual checks'],
    ['Ready to ship…','Preview, refine or publish']
  ];
  const title=stage.querySelector('[data-demo-title]'),copy=stage.querySelector('[data-demo-copy]');
  const tick=()=>{const item=items[i%items.length];if(title)title.textContent=item[0];if(copy)copy.textContent=item[1];i++;};
  tick();
});

const grid=$('#featuredGrid');
document.querySelectorAll('[data-scroll]').forEach(btn=>btn.addEventListener('click',()=>{
  if(!grid)return;
  const amount=Math.max(260,grid.clientWidth*.42);
  grid.scrollBy({left:btn.dataset.scroll==='next'?amount:-amount,behavior:prefersReduced?'auto':'smooth'});
}));

if(!prefersReduced){
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.animate([{opacity:.25,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:600,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'});observer.unobserve(e.target)}}),{threshold:.12});
  document.querySelectorAll('.category-card,.feature-card,.support-grid article,.final-cta').forEach(el=>observer.observe(el));
}
