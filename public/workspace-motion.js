const cvMotion=(()=>{
  const root=document.querySelector('#appView');
  if(!root)return null;
  root.dataset.workspaceShell='true';
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const reveal=()=>{
    const nodes=[...root.querySelectorAll('[data-reveal]')];
    if(reduced.matches){nodes.forEach(n=>n.classList.add('is-visible'));return}
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{threshold:.08});
    nodes.forEach((n,i)=>{n.style.transitionDelay=Math.min(i*55,330)+'ms';io.observe(n)});
  };
  const toast=(message)=>{
    document.querySelector('.cv-toast')?.remove();
    const el=document.createElement('div');el.className='cv-toast';el.textContent=message;
    document.body.append(el);setTimeout(()=>el.remove(),2200);
  };
  const commands=[
    ['Build product','Focus the builder and start a new build','build'],
    ['Content & data','Open structured content tools','content'],
    ['Design system','Open visual design controls','design'],
    ['Web & mobile','Review platform targets','app'],
    ['Publish','Open deployment and research','publish']
  ];
  const openCommand=()=>{
    let overlay=document.querySelector('.cv-command');
    if(!overlay){
      overlay=document.createElement('div');overlay.className='cv-command';overlay.innerHTML='<div class="cv-command-panel" role="dialog" aria-modal="true" aria-label="Command menu"><div class="cv-command-head"><input aria-label="Search commands" placeholder="Jump to a workspace…" autocomplete="off"><kbd>ESC</kbd></div><div class="cv-command-items"></div></div>';
      document.body.append(overlay);
      const input=overlay.querySelector('input'),items=overlay.querySelector('.cv-command-items');
      const render=(q='')=>{
        items.replaceChildren(...commands.filter(c=>c[0].toLowerCase().includes(q.toLowerCase())).map(c=>{
          const b=document.createElement('button');b.className='cv-command-item';b.dataset.command=c[2];b.innerHTML='<span>'+c[0]+'</span><small>'+c[1]+'</small>';
          b.onclick=()=>{activate(c[2]);closeCommand()};return b;
        }));
      };
      input.addEventListener('input',()=>render(input.value));
      overlay.addEventListener('click',e=>{if(e.target===overlay)closeCommand()});
      render();
    }
    overlay.classList.add('open');overlay.querySelector('input').value='';overlay.querySelector('input').focus();
  };
  const closeCommand=()=>document.querySelector('.cv-command')?.classList.remove('open');
  const activate=(tab)=>{
    const btn=root.querySelector('[data-tab="'+tab+'"]');
    if(btn){btn.click();btn.scrollIntoView({block:'nearest'});}
    const panel=root.querySelector('#tab-'+tab);
    if(panel){panel.animate?.([{opacity:.35,transform:'translate3d(0,8px,0)'},{opacity:1,transform:'none'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'});}
    toast(tab==='build'?'Builder ready':tab[0].toUpperCase()+tab.slice(1)+' workspace');
  };
  const decorateNav=()=>{
    root.querySelectorAll('.cv-nav button').forEach(btn=>{
      btn.dataset.workspaceNav=btn.dataset.tab||'build';
      if(!btn.querySelector('.cv-nav-pulse')){const p=document.createElement('i');p.className='cv-nav-pulse';btn.append(p)}
    });
    const bar=document.createElement('nav');bar.className='cv-mobile-bar';bar.setAttribute('aria-label','Workspace navigation');
    ['build','content','design','app','publish'].forEach((tab,i)=>{
      const b=document.createElement('button');b.dataset.workspaceNav=tab;b.textContent=['Build','Data','Design','Targets','Publish'][i];if(i===0)b.classList.add('mobile-build');
      b.onclick=()=>activate(tab);bar.append(b);
    });
    document.body.append(bar);
  };
  const decorateHero=()=>{
    ['.cv-hero','.cv-composer','#blueprint','#feed','.cv-canvas'].forEach(sel=>root.querySelector(sel)?.setAttribute('data-reveal',''));
  };
  const previewPulse=()=>{
    const frame=root.querySelector('#previewFrame');if(!frame)return;
    const observer=new MutationObserver(()=>{root.querySelector('.cv-canvas')?.classList.add('is-refreshing');setTimeout(()=>root.querySelector('.cv-canvas')?.classList.remove('is-refreshing'),520)});
    observer.observe(frame,{attributes:true,attributeFilter:['src','srcdoc']});
  };
  const keyboard=()=>{
    window.addEventListener('keydown',e=>{
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommand()}
      if(e.key==='Escape')closeCommand();
      if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){const b=root.querySelector('#buildBtn');if(b&&!b.disabled){e.preventDefault();b.click();}}
    });
  };
  decorateNav();decorateHero();previewPulse();keyboard();reveal();
  window.addEventListener('load',reveal,{once:true});
  return {openCommand,closeCommand,activate,reveal,reducedMotion:reduced};
})();
