const $=s=>document.querySelector(s);
const prefersReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('[data-reveal]').forEach(el=>el.classList.add('reveal'));
if(!prefersReduced&&'IntersectionObserver'in window){
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -40px'});
  document.querySelectorAll('.reveal').forEach((el,i)=>{el.style.transitionDelay=Math.min(i%6*55,260)+'ms';io.observe(el)});
}else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));

const menu=$('#menuBtn'),links=$('#navLinks');
menu?.addEventListener('click',()=>{const open=links?.classList.toggle('open');menu.setAttribute('aria-expanded',String(Boolean(open)))});
links?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>links.classList.remove('open')));

document.querySelectorAll('[data-demo-stage]').forEach(stage=>{
  let i=0;
  const items=[
    ['Understanding requirements','Mapping pages, data and behavior'],
    ['Building the product','Generating UI, APIs and admin'],
    ['Verifying the result','Running tests and browser checks'],
    ['Ready to ship','Prepared for review and deployment']
  ];
  const title=stage.querySelector('[data-demo-title]'),copy=stage.querySelector('[data-demo-copy]'),bar=stage.querySelector('[data-demo-progress]');
  const tick=()=>{const x=items[i%items.length];if(title)title.textContent=x[0];if(copy)copy.textContent=x[1];if(bar)bar.style.width=(28+(i%items.length)*22)+'%';i++;};
  tick();if(!prefersReduced)setInterval(tick,2400);
});

const glow=document.createElement('div');glow.className='cursor-glow';document.body.appendChild(glow);
window.addEventListener('pointermove',e=>{if(prefersReduced)return;glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px'},{passive:true});

const cards=document.querySelectorAll('.cap,.price,.step');
cards.forEach(card=>card.addEventListener('pointermove',e=>{
  if(prefersReduced||window.innerWidth<900)return;
  const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
  card.style.transform='perspective(700px) rotateX('+(-y*4)+'deg) rotateY('+(x*5)+'deg) translateY(-4px)';
}));
cards.forEach(card=>card.addEventListener('pointerleave',()=>{card.style.transform=''}));
if(!prefersReduced)document.querySelectorAll('[data-counter]').forEach(el=>{
  const end=Number(el.dataset.counter)||0;let started=false;
  const obs=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)&&!started){started=true;const t0=performance.now();const run=t=>{const p=Math.min(1,(t-t0)/900);el.textContent=Math.floor((1-Math.pow(1-p,3))*end).toLocaleString();if(p<1)requestAnimationFrame(run)};requestAnimationFrame(run);obs.disconnect()}});obs.observe(el);
});
