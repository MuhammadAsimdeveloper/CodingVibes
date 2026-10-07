const $=s=>document.querySelector(s);
const prefersReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const menuToggle=$('#menuToggle'),nav=$('#mainNav');
menuToggle?.addEventListener('click',()=>{
  const open=nav?.classList.toggle('open');
  menuToggle?.setAttribute('aria-expanded',String(Boolean(open)));
});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menuToggle?.setAttribute('aria-expanded','false')}));

const heroComposer=$('#heroComposer'),heroPrompt=$('#heroPrompt');
let selectedMode='website';
document.querySelectorAll('.mode-pill').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.mode-pill').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
    selectedMode=btn.dataset.mode||'website';
    const examples={
      website:'Build a premium business website with a clear hero, services, case studies, contact form and SEO-ready public pages.',
      'web-app':'Build a SaaS dashboard with authentication, teams, subscriptions, billing, analytics and an owner admin portal.',
      mobile:'Build an Android and iOS appointment app with authentication, profiles, booking, notifications and a clean mobile-first interface.'
    };
    if(heroPrompt&&!heroPrompt.value.trim())heroPrompt.placeholder=examples[selectedMode]||examples.website;
  });
});
heroComposer?.addEventListener('submit',e=>{
  e.preventDefault();
  const request=heroPrompt?.value.trim()||'Build a polished responsive website with a modern visual identity, clear navigation, SEO metadata and an owner admin portal.';
  const params=new URLSearchParams({prompt:request,target:selectedMode});
  window.location.href='/app?'+params.toString();
});

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
    ['AI is planning your product…','Turning the request into pages, data and acceptance criteria'],
    ['Designing your experience…','Applying responsive UI, tokens and interaction patterns'],
    ['Building the product…','Generating source, content, workflows and platform structure'],
    ['Verifying the result…','Running source, browser, visual and quality checks'],
    ['Ready to ship…','Inspect, refine, export or publish the verified result']
  ];
  const title=stage.querySelector('[data-demo-title]'),copy=stage.querySelector('[data-demo-copy]');
  const tick=()=>{
    const item=items[i%items.length];
    if(title)title.textContent=item[0];
    if(copy)copy.textContent=item[1];
    i++;
  };
  tick();
  if(!prefersReduced)setInterval(tick,2600);
});

const grid=$('#featuredGrid');
document.querySelectorAll('[data-scroll]').forEach(btn=>btn.addEventListener('click',()=>{
  if(!grid)return;
  const amount=Math.max(280,grid.clientWidth*.42);
  grid.scrollBy({left:btn.dataset.scroll==='next'?amount:-amount,behavior:prefersReduced?'auto':'smooth'});
}));

if(!prefersReduced){
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('is-visible');
      observer.unobserve(e.target);
    }
  }),{threshold:.10});
  document.querySelectorAll('[data-reveal]').forEach((el,i)=>{
    el.style.setProperty('--reveal-delay',String(Math.min(i,8)*70)+'ms');
    observer.observe(el);
  });
}else{
  document.querySelectorAll('[data-reveal]').forEach(el=>el.classList.add('is-visible'));
}

document.querySelectorAll('.category-card,.feature-card,.support-grid article,.capability-grid article,.resource-card,.pricing-grid article,.faq-list details,.final-cta').forEach(el=>{
  if(!prefersReduced)el.addEventListener('pointerenter',()=>el.style.transform='translateY(-3px)');
  if(!prefersReduced)el.addEventListener('pointerleave',()=>el.style.transform='');
});

// Keep a prompt shared from the landing page when the user comes back from a failed/unfinished attempt.
const savedPrompt=sessionStorage.getItem('buildVibeLandingPrompt');
if(savedPrompt&&heroPrompt&&!heroPrompt.value){heroPrompt.value=savedPrompt;sessionStorage.removeItem('buildVibeLandingPrompt');}
