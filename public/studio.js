import {createStudioState,registerProjectWindow,beginProjectBuild,routeBuildEvent,finishProjectBuild,isProjectBuilding,visibleProjectWindows} from './studio-runtime.js';
const $=s=>document.querySelector(s);const studio=createStudioState();const state={user:null,projects:[],project:null,session:null,run:null,targets:[],providers:[],windows:studio.windows,builds:studio.builds,drafts:new Map(),targetsByProject:new Map(),poll:null};
async function api(path,options={}){const r=await fetch(path,{headers:{'content-type':'application/json',...(options.headers||{})},...options});const j=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(j.error||'HTTP '+r.status);e.status=r.status;throw e;}return j}
function feed(text,kind=''){const e=document.createElement('div');e.className='cv-event '+kind;e.textContent=text;$('#feed').prepend(e);return e}
function status(text,kind='idle'){$('#runStatus').textContent=text;$('#runStatus').className='status '+kind}
function showTab(tab){document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));['build','content','templates','design','app','publish'].forEach(x=>$('#tab-'+x)?.classList.toggle('hidden',x!==tab));if(tab==='templates')loadTemplateCatalog();if(state.project&&tab==='content'){loadWorkspaceSuite();loadContentRevisions();load3DJobs();}if(state.project&&tab==='design')loadDesignMode();if(tab==='publish'){loadProviders();loadResearch();loadLaunchStatus();loadCloudServices();loadDomains();}}

async function loadTemplateCatalog(){
  const query=encodeURIComponent($('#templateSearch')?.value.trim()||'');
  const genre=state.templateGenre||'';
  const [genres,items]=await Promise.all([
    api('/api/templates/genres'),
    api('/api/templates?q='+query+(genre?'&genre='+encodeURIComponent(genre):''))
  ]);
  const ge=$('#templateGenres');if(ge){
    ge.replaceChildren();
    const all=document.createElement('button');all.className='cv-chip'+(!genre?' active':'');all.textContent='All';all.onclick=()=>{state.templateGenre='';loadTemplateCatalog()};ge.append(all);
    for(const g of genres.genres||[]){const b=document.createElement('button');b.className='cv-chip'+(state.templateGenre===g.id?' active':'');b.textContent=g.label+' · '+g.count;b.onclick=()=>{state.templateGenre=g.id;loadTemplateCatalog()};ge.append(b);}
  }
  const grid=$('#templateGrid');if(!grid)return;grid.replaceChildren();
  for(const t of items.templates||[]){
    const card=document.createElement('div');card.className='cv-template-card';
    const h=document.createElement('div');h.className='cv-template-head';const title=document.createElement('strong');title.textContent=t.label;h.append(title);
    const p=document.createElement('p');p.className='cv-muted';p.textContent=(t.description||t.style||'Production-ready template blueprint.').slice(0,240);
    const tags=document.createElement('div');tags.className='cv-chips';for(const g of (t.genres||[]).slice(0,6)){const s=document.createElement('span');s.className='cv-chip';s.textContent=g;tags.append(s)}
    const meta=document.createElement('div');meta.className='cv-muted';meta.textContent=(t.experience||'standard')+' · '+(t.kind||'business')+' · '+(t.capabilities||[]).slice(0,4).join(' · ');
    const b=document.createElement('button');b.className='cv-primary';b.textContent='Use in Studio';b.onclick=()=>startTemplate(t.id);
    card.append(h,p,tags,meta,b);grid.append(card);
  }
}
async function startTemplate(id){
  try{
    const j=await api('/api/templates/'+encodeURIComponent(id)+'/start',{method:'POST',body:JSON.stringify({name:$('#templateSearch')?.value.trim()?$('#templateSearch').value.trim()+' · '+(id||'Template'):undefined})});
    await loadProjects();await selectProject(j.project);
    const starter='Build the selected template as-is. Keep the template contract, then I will customize colors, content, products, pages, animations, 3D media and functionality by text.';
    $('#request').value=starter;state.drafts.set(j.project.id,starter);showTab('build');feed('Template loaded into Studio: '+j.template.label,'ok');await previewBlueprint();
  }catch(e){feed('Template: '+e.message,'err')}
}

async function loadCapabilities(){const j=await api('/api/builder/capabilities');const el=$('#capabilities');el.replaceChildren();for(const c of j.capabilities){const d=document.createElement('div');d.className='cv-cap';d.innerHTML='<strong></strong><span></span>';d.firstChild.textContent=c.label;d.lastChild.textContent=c.supports.slice(0,3).join(' · ');el.append(d)}}
async function loadTargets(){const j=await api('/api/targets');state.targets=j.targets||[];const s=$('#targetSelect');for(const t of state.targets){const o=document.createElement('option');o.value=t.id;o.textContent=t.label;s.append(o)}$('#targets').replaceChildren(...state.targets.map(t=>{const d=document.createElement('div');d.className='cv-event';d.textContent=t.label+' · '+t.artifactTypes.join(', ');return d}))}
async function loadProjects(){const j=await api('/api/projects');state.projects=j.projects||[];const el=$('#projects');el.replaceChildren();for(const p of state.projects){const b=document.createElement('button');b.className='cv-project'+(state.project?.id===p.id?' active':'');b.textContent=p.name;b.onclick=()=>selectProject(p);el.append(b);registerProjectWindow(state,{id:p.id,name:p.name,status:state.windows.get(p.id)?.status||'ready',runId:state.windows.get(p.id)?.runId||null});}renderWindows();if(!state.project){const preferred=localStorage.getItem('buildVibe.activeProjectId');const target=state.projects.find(p=>p.id===preferred)||state.projects[0];if(target)await selectProject(target)}}
function renderWindows(){const el=$('#workspaceWindows');if(!el)return;el.replaceChildren();for(const w of visibleProjectWindows(state,8)){const d=document.createElement('button');d.type='button';d.className='cv-window'+(state.project?.id===w.id?' active':'');d.title='Open '+w.name;const dot=document.createElement('span');dot.className='cv-window-dot '+(w.status==='verified'?'ok':w.status==='error'?'err':w.status==='building'||w.status==='repairing'||w.status==='preview'?'busy':'');const main=document.createElement('span');main.className='cv-window-main';const name=document.createElement('span');name.className='cv-window-name';name.textContent=w.name;const st=document.createElement('span');st.className='cv-window-status';st.textContent=w.status||'ready';main.append(name,st);d.append(dot,main);d.onclick=()=>selectProject(state.projects.find(p=>p.id===w.id)||{id:w.id,name:w.name});el.append(d)}}
async function pollWindows(){const rows=[...state.windows.values()];await Promise.allSettled(rows.map(async w=>{try{const s=await api('/api/projects/'+encodeURIComponent(w.id)+'/sessions');const session=s.sessions?.[0];if(!session)return;const r=await api('/api/sessions/'+session.id+'/runs');const run=r.runs?.[0];if(run){w.runId=run.id;w.status=run.status||w.status||'ready';const busy=['building','dependency_install','verifying','repairing','preview'].includes(w.status);if(busy&&!state.builds.has(w.id))state.builds.set(w.id,{projectId:w.id,runId:run.id});if(!busy)state.builds.delete(w.id);}}catch{}}));renderWindows();refreshBuildButton()}
function startWindowPolling(){if(state.poll)return;state.poll=setInterval(pollWindows,3500);pollWindows()}

async function selectProject(p){if(!p)return;if(state.project?.id&&$('#request'))state.drafts.set(state.project.id,$('#request').value);state.project=p;try{localStorage.setItem('buildVibe.activeProjectId',p.id)}catch{};registerProjectWindow(state,{id:p.id,name:p.name,status:state.windows.get(p.id)?.status||'ready',runId:state.windows.get(p.id)?.runId||null});const rememberedTarget=state.targetsByProject.get(p.id);if(rememberedTarget&&$('#targetSelect'))$('#targetSelect').value=rememberedTarget;const draft=state.drafts.get(p.id);if($('#request'))$('#request').value=draft||'';renderWindows();window.cvProjectId=p.id;$('#projectTitle').textContent=p.name;$('#projectMeta').textContent=isProjectBuilding(state,p.id)?'Build running in background':'Ready to build and publish';const zip=$('#zipLink');if(zip){zip.removeAttribute('href');zip.textContent='Download ZIP';}document.querySelectorAll('.cv-project').forEach(b=>b.classList.toggle('active',b.textContent===p.name));const j=await api('/api/projects/'+encodeURIComponent(p.id)+'/sessions');state.session=j.sessions[0]||null;state.run=null;$('#previewFrame').removeAttribute('src');if(state.session){const r=await api('/api/sessions/'+state.session.id+'/runs');const latest=r.runs?.[0];if(latest){state.run={id:latest.id,status:latest.status};const busy=['building','dependency_install','verifying','repairing','preview'].includes(latest.status);if(busy)beginProjectBuild(state,p.id,latest.id);else{state.builds.delete(p.id);routeBuildEvent(state,p.id,{type:'completed',runId:latest.id,result:{runId:latest.id,status:latest.status}});}await loadRun(latest.id);}}await loadFeatureSuite();refreshBuildButton()}
function refreshBuildButton(){const button=$('#buildBtn');if(button)button.disabled=Boolean(state.project&&isProjectBuilding(state,state.project.id));if(state.project){const w=state.windows.get(state.project.id);if(w)$('#projectMeta').textContent=isProjectBuilding(state,state.project.id)?'Build running in background':'Ready to build and publish'}}
async function createProjectWindow(){const name=prompt('New product window','My new product');if(!name)return false;const j=await api('/api/projects',{method:'POST',body:JSON.stringify({name})});await loadProjects();await selectProject(j.project);return true}
async function ensureProject(){if(state.project)return true;return createProjectWindow()}
function renderBlueprint(b){const el=$('#blueprint');if(!el)return;el.innerHTML='<h3>Product plan</h3>';const rows=[['Type',(b.productKinds||[]).join(' · ')],['Target',b.target?.label||b.target?.id||'Automatic'],['Capabilities',(b.capabilities||[]).join(' · ')||'Website + app foundation'],['Backend',b.architecture?.backend||'optional'],['Auth',b.architecture?.authentication||'local owner/admin'],['Payments',b.architecture?.payments?'enabled · provider optional':'local-ready · not required']];if(b.setup){rows.push(['Mode',b.setup.coreMode==='local-first'?'Local-first · no provider required':'Provider-assisted'],['Setup',(b.setup.steps||[]).slice(0,3).join(' → ')]);}for(const [k,v] of rows){const d=document.createElement('div');d.className='cv-blueprint-row';d.innerHTML='<span></span><strong></strong>';d.firstChild.textContent=k;d.lastChild.textContent=v;el.append(d)}}
async function previewBlueprint(){const request=$('#request').value.trim();if(!request)return;try{const j=await api('/api/builder/blueprint',{method:'POST',body:JSON.stringify({request,target:$('#targetSelect').value})});renderBlueprint(j.blueprint);$('#blueprintHint').textContent='Plan ready — generation will follow.';return j.blueprint}catch(e){feed('Planning failed: '+e.message,'err')}}
async function startBuild(){
  const request=$('#request').value.trim();
  if(!request)return;
  if(!await ensureProject())return;
  const projectId=state.project.id;
  const sessionId=state.session?.id;
  const target=$('#targetSelect').value;
  if(isProjectBuilding(state,projectId)){feed('This project is already building. You can switch windows and build another project.','err');return;}
  await previewBlueprint();
  beginProjectBuild(state,projectId,null);
  renderWindows();refreshBuildButton();
  status('building');$('#progress').textContent='Planning → generating → verifying → repairing';
  feed('['+(state.project?.name||projectId)+'] You: '+request);
  try{
    const r=await fetch('/api/agent/stream',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({projectId,sessionId,request,target})});
    if(!r.ok){const body=await r.text().catch(()=> '');throw new Error(body||'Build request failed');}
    const reader=r.body?.getReader();
    if(!reader)throw new Error('Build stream unavailable');
    const decoder=new TextDecoder();let buf='';
    while(true){
      const {done,value}=await reader.read();if(done)break;
      buf+=decoder.decode(value,{stream:true});
      const chunks=buf.split('\n\n');buf=chunks.pop()||'';
      for(const chunk of chunks){const line=chunk.split('\n').find(x=>x.startsWith('data:'));if(!line)continue;try{handle(JSON.parse(line.slice(6)),projectId)}catch{}}
    }
    const w=state.windows.get(projectId);finishProjectBuild(state,projectId,w?.status||'ready');
    if(state.project?.id===projectId)await refreshProjectAfterBuild(projectId);
  }catch(e){
    finishProjectBuild(state,projectId,'error');
    feed('['+(state.projects.find(x=>x.id===projectId)?.name||projectId)+'] '+e.message,'err');
    if(state.project?.id===projectId){status('error','err');$('#progress').textContent='Build failed — review the event log and retry.';}
  }finally{renderWindows();refreshBuildButton();}
}
async function refreshProjectAfterBuild(projectId){
  if(state.project?.id!==projectId)return;
  const j=await api('/api/projects/'+encodeURIComponent(projectId)+'/sessions').catch(()=>null);
  if(j?.sessions?.[0])state.session=j.sessions[0];
  if(state.session){const r=await api('/api/sessions/'+state.session.id+'/runs').catch(()=>null);const latest=r?.runs?.[0];if(latest){state.run={id:latest.id,status:latest.status};await loadRun(latest.id);}}
}

function renderBuildClarification(e,projectId){
  const card=document.createElement('div');card.className='cv-event ok';const h=document.createElement('strong');h.textContent=e.title||'A few details are needed';card.append(h);
  const selected={};for(const q of e.questions||[]){const wrap=document.createElement('div');wrap.className='cv-choice-group';const label=document.createElement('div');label.textContent=q.label;wrap.append(label);for(const option of q.options||[]){const b=document.createElement('button');b.className='cv-chip';b.textContent=option;b.onclick=()=>{selected[q.id]=option;wrap.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active')};wrap.append(b)}card.append(wrap)}
  const go=document.createElement('button');go.className='cv-primary';go.textContent='Continue';go.onclick=()=>{const parts=Object.entries(selected).map(([k,v])=>k+': '+v);if(!parts.length)return;$('#request').value=$('#request').value+'\n\nSelected options:\n'+parts.join('\n');card.remove();$('#buildBtn').focus();};card.append(go);$('#feed').prepend(card);
}

function handle(e,projectId){
  const projectName=state.projects.find(x=>x.id===projectId)?.name||projectId;
  const active=state.project?.id===projectId;
  const routed=routeBuildEvent(state,projectId,e);
  if(e.type==='clarification_required'){
    finishProjectBuild(state,projectId,'ready');
    if(active){status('ready','');$('#progress').textContent='A few choices are needed before generation.';renderBuildClarification(e,projectId);}
    feed('Build Vibe needs a few choices before building.','ok');
  }
  if(e.type==='run_created')feed('['+projectName+'] Build started.');
  if(e.type==='parallel_agents_completed')feed((active?'':'['+projectName+'] ')+'Parallel agents: research + design + architecture + QA aligned.','ok');
  if(e.type==='research_completed')feed((active?'':'['+projectName+'] ')+'Research lane completed.','ok');
  if(e.type==='design_completed')feed((active?'':'['+projectName+'] ')+'Design system lane completed.','ok');
  if(e.type==='experience_quality_completed')feed((active?'':'['+projectName+'] ')+'Experience quality pass: '+(e.enhancements||[]).join(' · '),'ok');
  if(e.type==='product_quality_completed')feed((active?'':'['+projectName+'] ')+'Product quality score: '+e.score+'% · '+(e.missing?.length||0)+' improvement item(s)',e.blockingFindings?.length?'err':'ok');
  if(e.type==='planned'){if(active)renderBlueprint(e.spec?{productKinds:[e.spec.siteKind||'product'],target:e.targetSummary||e.target,capabilities:[],architecture:{backend:'auto',authentication:'owner-admin',payments:Boolean(e.spec.behavior?.payments)}}:{});feed((active?'':'['+projectName+'] ')+'AI converted your request into a product contract.');}
  if(e.type==='changes_applied')feed((active?'':'['+projectName+'] ')+'Application generated. Verification starting…');
  if(e.type==='preview_started'){if(active){$('#previewFrame').src=e.url;$('#previewLink').href=e.url;status('preview','ok');}feed((active?'':'['+projectName+'] ')+'Live preview ready.','ok');}
  if(e.type==='verification'||e.type==='target_verification'){if(active){feed('Verification attempt '+((e.attempt??0)+1)+': '+(e.passed?'passed':'repairing'),e.passed?'ok':'');status(e.passed?'verified':'repairing',e.passed?'ok':'');}else feed('['+projectName+'] Verification '+(e.passed?'passed':'needs repair'),e.passed?'ok':'');}
  if(e.type==='repair_requested')feed('['+projectName+'] AI repair cycle '+((e.attempt??0)+1)+' is fixing verified failures…');
  if(e.type==='review_completed')feed('['+projectName+'] '+(e.passed?'Quality review passed.':'Quality review found blocking issues.'),e.passed?'ok':'err');
  if(e.type==='reflection_completed')feed('['+projectName+'] Self-test reflection: '+e.score+'% · '+e.status,e.status==='ready'?'ok':'');
  if(e.type==='completed'){
    finishProjectBuild(state,projectId,e.result.status);
    if(active){state.run={id:e.result.runId,status:e.result.status};status(e.result.status,e.result.status==='verified'?'ok':'err');$('#progress').textContent=e.result.status==='verified'?'Ready to publish.':'Needs attention.';loadRun(e.result.runId);}
    feed('['+projectName+'] Build '+e.result.status+'.',e.result.status==='verified'?'ok':'err');
  }
  if(e.type==='error'){finishProjectBuild(state,projectId,'error');feed('['+projectName+'] Agent error: '+e.error,'err');if(active)status('error','err');}
  renderWindows();if(active)refreshBuildButton();
  return routed;
}

async function loadRun(id){try{const j=await api('/api/runs/'+id);state.run={id,status:j.run?.status};const p=j.run?.preview_url;if(p){$('#previewFrame').src=p;$('#previewLink').href=p}status(j.run?.status||'ready',j.run?.status==='verified'?'ok':'');const zip=$('#zipLink');if(zip&&j.run?.status==='verified'&&state.project){zip.href='/api/projects/'+encodeURIComponent(state.project.id)+'/export';zip.download='';}}catch{}}
async function loadLaunchStatus(){loadDatabaseStatus();try{const j=await api('/api/launch/status'),r=j.ready,s=$('#launchSummary'),b=$('#billingSummary'),t=$('#launchTargets');if(s){s.textContent=r.ready?'Production contract: READY':'Production contract: '+r.blockers.length+' blocker(s)';s.className=r.ready?'status ok':'status err'}if(b&&j.billing)b.textContent='Plan: '+j.billing.plan+' · '+(j.billing.usage?.runs||0)+' builds · '+(j.billing.usage?.tokens||0)+' tokens';if(t)t.replaceChildren(...(j.targets||[]).map(x=>{const d=document.createElement('div');d.className='cv-event';const e=x.execution,mode=e?.host?.available?'local toolchain':e?.remote?.linux?'remote Linux':e?.remote?.macos?'remote macOS':e?.canBuild?'web runtime':'runner required';d.textContent=x.label+' · '+mode;return d}));if(!r.ready&&r.blockers?.length)feed('Launch blockers: '+r.blockers.join(', '),'err')}catch(e){feed('Launch status: '+e.message,'err')}}
  await loadBilling();
async function loadBilling(){try{const j=await api('/api/billing'),b=j.billing||{},plans=j.plans||[],el=$('#billingPlans');if(!el)return;const current=b.plan||'free',creation=j.creationUsage||{basic:0,'3d':0,animated:0,apk:0};const provider=j.billingProvider||'stripe';const rows=plans.filter(p=>p.id!=='free').map(p=>{const d=document.createElement('div');d.className='cv-list-row';const left=document.createElement('span');left.textContent=p.label+' · 
async function startCheckout(plan){try{const j=await api('/api/billing/checkout',{method:'POST',body:JSON.stringify({plan})});if(j.checkout?.url)location.href=j.checkout.url;else feed('Checkout created but no payment URL was returned.','err');}catch(e){feed('Checkout: '+e.message,'err')}}
async function manageBilling(){try{const j=await api('/api/billing/portal',{method:'POST',body:'{}'});const url=j.portal?.url||j.portal?.subscriptionUrl;if(url)window.location.href=url;else feed('Billing portal did not return a URL.','err');}catch(e){feed('Billing portal: '+e.message,'err')}}
async function loadDatabaseStatus(){
  try{
    const j=await api('/api/database/status'),el=$('#databaseStatus');if(!el)return;el.replaceChildren();
    const c=j.current||{},current=document.createElement('div');current.className='cv-event';current.textContent='Current backend: '+c.backend+' · '+(c.configured?'configured':'not configured');el.append(current);
    for(const option of j.options||[]){const row=document.createElement('div');row.className='cv-list-row';const left=document.createElement('span');left.textContent=option.label+' · '+option.role;const right=document.createElement('small');right.className='cv-muted';right.textContent=option.recommended;row.append(left,right);el.append(row);}
    const setup=document.createElement('div');setup.className='cv-event';setup.textContent=j.setup?.localCommand+' → '+j.setup?.migrateCommand+' → '+j.setup?.doctorCommand+' · Adminer '+j.setup?.adminer;el.append(setup);
  }catch(e){feed('Database status: '+e.message,'err')}
}

async function loadProviders(){
  try{
    const j=await api('/api/deployment/providers');
    state.providers=j.providers||[];
    const el=$('#providers');el.replaceChildren();
    const connections=new Map((j.connected||[]).map(x=>[x.provider,x]));
    for(const p of state.providers){
      const connected=p.connected||connections.has(p.id);
      const d=document.createElement('div');d.className='cv-provider';
      const name=document.createElement('strong');name.textContent=p.label||p.id;
      const b=document.createElement('button');b.className='cv-secondary';
      if(p.id==='manual'){b.textContent='Download ZIP';b.onclick=exportProject;}
      else if(p.id==='hostinger'){b.textContent=connected?'Prepare for Hostinger':'Connect GitHub';b.title='Publishes the verified project to GitHub, then use Hostinger Node.js Web App → Import Git Repository.';b.onclick=async()=>{if(!connected){window.location.href='/api/deployment/providers/github/oauth';return;}await deployProvider(p.id)};}
      else {b.textContent=connected?'Deploy':'Connect';b.onclick=async()=>{if(connected)await deployProvider(p.id);else window.location.href='/api/deployment/providers/'+encodeURIComponent(p.id)+'/oauth';}}
      d.append(name,b);el.append(d);
    }
  }catch(e){feed('Provider catalog unavailable: '+e.message,'err')}
}
async function deployProvider(provider){
  if(!state.project||!state.run)return feed('Build and verify a product first.','err');
  try{
    const r=await api('/api/projects/'+state.project.id+'/deploy',{method:'POST',body:JSON.stringify({provider})});
    const d=r.deployment||r.result||{};
    feed(provider==='hostinger'?(d.metadata?.nextStep||'Published to GitHub. Open Hostinger and import the repository.'):'Deployment: '+(d.status||'submitted'),'ok');
  }catch(e){feed('Deployment: '+e.message,'err')}
}
async function exportProject(){
  if(!state.project||!state.run)return feed('Build and verify a product first.','err');
  try{
    const r=await api('/api/projects/'+state.project.id+'/export');
    const link=$('#zipLink');if(link){link.href=r.downloadUrl;link.download='';link.textContent='Download ZIP';}
    feed('ZIP export is ready.','ok');
    if(link)link.click();
  }catch(e){feed('Export: '+e.message,'err')}
}

async function loadResearch(){try{const j=await api('/api/builder/research');const r=j.research;$('#research').innerHTML='<p>'+r.methodology+'</p>'+r.sources.map(s=>'<div style="margin:8px 0"><strong>'+s.name+'</strong><br><a href="'+s.url+'" target="_blank" rel="noreferrer">'+s.patterns.join(' · ')+'</a></div>').join('')}catch{}}


const assistantState={conversationId:null,messages:[],tokenNode:null};
function assistantOpen(){const d=$('#assistantDialog');if(!d)return;d.showModal();loadAssistantConversations();if(state.project)$('#assistantModeHint').textContent='Working with '+state.project.name+' · project-aware context';$('#assistantInput').focus();}
function assistantClose(){const d=$('#assistantDialog');if(d?.open)d.close();}
function renderAssistantMessages(){
  const el=$('#assistantMessages');if(!el)return;el.replaceChildren();
  for(const m of assistantState.messages){
    const d=document.createElement('div');d.className='cv-assistant-msg '+(m.role==='user'?'user':'assistant');
    const label=document.createElement('span');label.className='cv-assistant-role';label.textContent=m.role==='user'?'You':'Assistant';
    const body=document.createElement('div');body.textContent=m.content||'';d.append(label,body);el.append(d);
  }
  el.scrollTop=el.scrollHeight;
}
async function saveAssistantInstructions(){
  if(!state.project)return feed('Select a project before saving assistant instructions.','err');
  try{const memory=(await api('/api/projects/'+encodeURIComponent(state.project.id)+'/memory')).memory||{};memory.assistantInstructions=$('#assistantInstructions')?.value.trim().slice(0,4000)||'';await api('/api/projects/'+encodeURIComponent(state.project.id)+'/memory',{method:'PUT',body:JSON.stringify({memory})});feed('Project assistant instructions saved.','ok');}catch(e){feed('Assistant instructions: '+e.message,'err')}
}

async function loadAssistantConversations(){
  try{
    const q=state.project?'?projectId='+encodeURIComponent(state.project.id):'';
    if(state.project){try{const memory=(await api('/api/projects/'+encodeURIComponent(state.project.id)+'/memory')).memory||{};if($('#assistantInstructions'))$('#assistantInstructions').value=memory.assistantInstructions||'';}catch{}}
    const j=await api('/api/assistant/conversations'+q),el=$('#assistantConversations');if(!el)return;el.replaceChildren();
    for(const x of j.conversations||[]){
      const b=document.createElement('button');b.className='cv-event'+(assistantState.conversationId===x.id?' ok':'');b.textContent=x.name||'Assistant chat';b.onclick=()=>loadAssistantConversation(x.id);el.append(b);
    }
    if(!assistantState.conversationId&&(j.conversations||[])[0])await loadAssistantConversation(j.conversations[0].id);
  }catch(e){feed('Assistant history: '+e.message,'err')}
}
async function loadAssistantConversation(id){
  try{const j=await api('/api/assistant/conversations/'+encodeURIComponent(id)+'/messages');assistantState.conversationId=id;assistantState.messages=(j.messages||[]).map(x=>({role:x.role==='user'?'user':'assistant',content:x.content}));renderAssistantMessages();loadAssistantConversations();}catch(e){feed('Assistant chat: '+e.message,'err')}
}
async function newAssistantConversation(){
  try{
    const j=await api('/api/assistant/conversations',{method:'POST',body:JSON.stringify({projectId:state.project?.id||null,mode:$('#assistantMode')?.value||'chat',name:'New Build Vibe chat'})});
    assistantState.conversationId=j.conversation.id;assistantState.messages=[];renderAssistantMessages();loadAssistantConversations();$('#assistantInput').focus();
  }catch(e){feed('New chat: '+e.message,'err')}
}
async function sendAssistantMessage(){
  const input=$('#assistantInput'),message=input.value.trim();if(!message)return;
  const mode=$('#assistantMode').value;input.value='';assistantState.messages.push({role:'user',content:message},{role:'assistant',content:''});renderAssistantMessages();
  const nodes=$('#assistantMessages')?.querySelectorAll('.cv-assistant-msg');assistantState.tokenNode=nodes?.[nodes.length-1]?.querySelector('div:last-child')||null;
  try{
    const response=await fetch('/api/assistant/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message,conversationId:assistantState.conversationId||undefined,projectId:state.project?.id||undefined,mode,stream:true,target:$('#targetSelect')?.value||'auto'})});
    if(!response.ok)throw new Error((await response.text())||'assistant_request_failed');
    const reader=response.body?.getReader();if(!reader)throw new Error('assistant_stream_unavailable');
    const decoder=new TextDecoder();let buf='';
    while(true){
      const {done,value}=await reader.read();if(done)break;buf+=decoder.decode(value,{stream:true});const chunks=buf.split('\n\n');buf=chunks.pop()||'';
      for(const chunk of chunks){const line=chunk.split('\n').find(x=>x.startsWith('data:'));if(!line)continue;try{
        const e=JSON.parse(line.slice(5));
        if(e.type==='assistant_started')assistantState.conversationId=e.conversationId;
        if(e.type==='assistant_token'){if(assistantState.tokenNode){assistantState.tokenNode.textContent+=(e.token||'');}else{assistantState.messages.at(-1).content+=(e.token||'');renderAssistantMessages();}}
        if(e.type==='assistant_completed'){
          const result=e.result||{};if(result.kind==='clarification')renderAssistantChoices(result);
          if(result.kind==='message')renderAssistantActions(result,message);
          if(result.text&&!assistantState.messages.at(-1).content)assistantState.messages.at(-1).content=result.text;else if(result.text&&assistantState.messages.at(-1).content!==result.text)assistantState.messages.at(-1).content=result.text;
          renderAssistantMessages();
        }
      }catch{}}
    }
    await loadAssistantConversations();
  }catch(e){assistantState.messages.at(-1).content='Assistant error: '+e.message;renderAssistantMessages();}
}
function renderAssistantActions(result,sourceMessage){
  const actionable=['design_edit','product_3d_edit','catalog_edit','experience_3d_edit','qa_fix'].includes(result?.intent);
  if(!actionable)return;
  const wrap=$('#assistantChoices');if(!wrap)return;
  const card=document.createElement('div');card.className='cv-choice-group';
  const label=document.createElement('strong');label.textContent='Apply this to the current project';card.append(label);
  const b=document.createElement('button');b.className='cv-primary';b.textContent='Apply in Studio';b.onclick=async()=>{wrap.classList.add('hidden');assistantClose();$('#request').value=sourceMessage;state.drafts.set(state.project?.id||'',sourceMessage);showTab('build');if(state.project)await startBuild();};card.append(b);wrap.prepend(card);wrap.classList.remove('hidden');
}

function renderAssistantChoices(result){
  const wrap=$('#assistantChoices');if(!wrap)return;wrap.classList.remove('hidden');wrap.replaceChildren();
  const selected={};
  for(const q of result.questions||[]){const card=document.createElement('div');card.className='cv-choice-group';const h=document.createElement('strong');h.textContent=q.label;card.append(h);
    for(const option of q.options||[]){const b=document.createElement('button');b.className='cv-chip';b.textContent=option;b.onclick=()=>{selected[q.id]=option;card.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active')};card.append(b);}wrap.append(card);
  }
  const go=document.createElement('button');go.className='cv-primary';go.textContent='Continue with selections';go.onclick=()=>{const lines=Object.entries(selected).map(([k,v])=>k+': '+v);if(!lines.length)return;$('#assistantInput').value=lines.join('\n');wrap.classList.add('hidden');sendAssistantMessage()};wrap.append(go);
}
function openAssistantWithPrompt(prompt,mode='chat'){assistantOpen();if(prompt){$('#assistantMode').value=mode;$('#assistantInput').value=prompt;$('#assistantInput').focus();}}

async function loadWorkspaceSuite(){
  if(!state.project?.workspace_id)return;
  try{
    const wid=state.project.workspace_id,ws=(await api('/api/workspaces')).workspaces.find(x=>x.id===wid);
    $('#workspaceMeta').textContent=ws?ws.name+' · '+ws.role:'Workspace';
    const [members,approvals]=await Promise.all([api('/api/workspaces/'+wid+'/members'),api('/api/workspaces/'+wid+'/approvals')]);
    const me=$('#workspaceMembers');if(me)me.replaceChildren(...(members.members||[]).map(x=>{const d=document.createElement('div');d.className='cv-list-row';const label=document.createElement('span');label.textContent=x.email+' · '+x.role;d.append(label);if(ws&&['owner','admin'].includes(ws.role)&&x.role!=='owner'){const select=document.createElement('select');['admin','editor','reviewer','viewer'].forEach(role=>{const o=document.createElement('option');o.value=role;o.textContent=role;o.selected=role===x.role;select.append(o)});select.onchange=async()=>{try{await api('/api/workspaces/'+wid+'/members/'+x.user_id,{method:'PATCH',body:JSON.stringify({role:select.value})});feed('Role updated.','ok');}catch(e){feed('Role update: '+e.message,'err')}};const rm=document.createElement('button');rm.className='cv-secondary';rm.textContent='Remove';rm.onclick=async()=>{if(!confirm('Remove '+x.email+' from this workspace?'))return;try{await api('/api/workspaces/'+wid+'/members/'+x.user_id,{method:'DELETE'});feed('Member removed.','ok');await loadWorkspaceSuite();}catch(e){feed('Remove member: '+e.message,'err')}};d.append(select,rm);}return d;}));
    const ae=$('#workspaceApprovals');if(ae)ae.replaceChildren(...(approvals.approvals||[]).slice(0,8).map(a=>{const d=document.createElement('div');d.className='cv-list-row';const label=document.createElement('span');label.textContent=a.kind+' · '+a.status;d.append(label);if(a.status==='pending'&&['owner','admin','reviewer'].includes(ws?.role)){const b=document.createElement('button');b.className='cv-secondary';b.textContent='Approve';b.onclick=async()=>{try{await api('/api/approvals/'+a.id+'/decision',{method:'POST',body:JSON.stringify({status:'approved'})});feed('Approval granted.','ok');await loadWorkspaceSuite();}catch(e){feed('Approval: '+e.message,'err')}};d.append(b);}return d;}));
  }catch(e){const el=$('#workspaceMeta');if(el)el.textContent='Workspace unavailable: '+e.message;}
}
async function loadDesignMode(){
  if(!state.project)return;
  try{
    const j=await api('/api/projects/'+state.project.id+'/design'),s=j.designSystem?.system||{};
    const map={designPrimary:s.colors?.primary,designAccent:s.colors?.accent,designBackground:s.colors?.background,designSurface:s.colors?.surface,designHeading:s.typography?.heading,designBody:s.typography?.body,designRadius:s.radius?.md,designMotion:s.motion?.durationMs};
    for(const [id,value] of Object.entries(map)){const el=$('#'+id);if(el&&value!=null)el.value=value;}
    $('#designStatus').textContent='Version '+(j.designSystem?.version||1)+' · '+(j.designSystem?.name||'Design System');
  }catch(e){$('#designStatus').textContent='Design mode unavailable: '+e.message;}
}
async function saveDesignMode(){
  if(!state.project)return;
  const base=await api('/api/projects/'+state.project.id+'/design');
  const system=JSON.parse(JSON.stringify(base.designSystem?.system||{}));
  system.colors={...(system.colors||{}),primary:$('#designPrimary').value,accent:$('#designAccent').value,background:$('#designBackground').value,surface:$('#designSurface').value};
  system.typography={...(system.typography||{}),heading:$('#designHeading').value,body:$('#designBody').value};
  system.radius={...(system.radius||{}),md:Number($('#designRadius').value||12)};
  system.motion={...(system.motion||{}),durationMs:Number($('#designMotion').value||220),reducedMotion:true};
  try{const j=await api('/api/projects/'+state.project.id+'/design',{method:'PUT',body:JSON.stringify({name:'Build Vibe Design System',system})});$('#designStatus').textContent='Saved version '+j.designSystem.version;feed('Design system saved.','ok');}catch(e){feed('Design save: '+e.message,'err');}
}
async function resetDesignMode(){try{const j=await api('/api/projects/'+state.project.id+'/design',{method:'PUT',body:JSON.stringify({name:'Build Vibe Design System',system:{},request:''})});await loadDesignMode();$('#designStatus').textContent='Reset to defaults · version '+j.designSystem.version;}catch(e){feed('Design reset: '+e.message,'err');}}
async function loadCloudServices(){
  if(!state.project)return;
  try{
    const j=await api('/api/projects/'+state.project.id+'/cloud-services'),list=$('#cloudServices'),select=$('#cloudServiceType');
    if(select&&!select.dataset.ready){select.dataset.ready='1';for(const c of j.catalog||[]){const o=document.createElement('option');o.value=c.id;o.textContent=c.label;select.append(o);}}
    if(list)list.replaceChildren(...(j.services||[]).map(x=>{const d=document.createElement('div');d.className='cv-list-row';d.textContent=x.type+' · '+x.status+' · '+(x.provider||'unconfigured');return d;}));
  }catch(e){feed('Cloud services: '+e.message,'err')}
}
async function provisionCloud(){if(!state.project)return;try{const j=await api('/api/projects/'+state.project.id+'/cloud-services',{method:'POST',body:JSON.stringify({type:$('#cloudServiceType').value})});feed('Cloud service '+j.service.type+': '+j.service.status,'ok');await loadCloudServices();}catch(e){feed('Cloud service: '+e.message,'err')}}
async function loadDomains(){if(!state.project)return;try{const j=await api('/api/projects/'+state.project.id+'/domains'),list=$('#domains');if(list)list.replaceChildren(...(j.domains||[]).map(x=>{const d=document.createElement('div');d.className='cv-list-row';d.textContent=x.domain+' · '+x.status+' · '+x.provider;return d;}));}catch(e){feed('Domains: '+e.message,'err')}}
async function addDomain(){if(!state.project)return;try{const j=await api('/api/projects/'+state.project.id+'/domains',{method:'POST',body:JSON.stringify({domain:$('#domainInput').value,provider:$('#domainProvider').value})});feed('Domain '+j.domain.domain+' added · '+j.domain.status,'ok');await loadDomains();}catch(e){feed('Domain: '+e.message,'err')}}
async function loadContentRevisions(){if(!state.project)return;try{const j=await api('/api/projects/'+state.project.id+'/content/revisions'),el=$('#contentRevisions');if(el)el.replaceChildren(...(j.revisions||[]).slice(0,8).map(r=>{const d=document.createElement('div');d.className='cv-list-row';d.textContent='v'+r.version+' · '+r.status+(r.published_at?' · published':'');if(r.status!=='published'){const b=document.createElement('button');b.className='cv-secondary';b.textContent='Publish';b.onclick=async()=>{try{await api('/api/content-revisions/'+r.id+'/publish',{method:'POST',body:'{}'});feed('Content revision v'+r.version+' published.','ok');await loadContentRevisions();}catch(e){feed('Publish revision: '+e.message,'err')}};d.append(b);}return d;}));}catch(e){feed('Content revisions: '+e.message,'err')}}
async function newContentRevision(){try{const j=await api('/api/projects/'+state.project.id+'/content/revisions',{method:'POST',body:JSON.stringify({status:'draft'})});feed('Content draft revision v'+j.revision.version+' saved.','ok');await loadContentRevisions();}catch(e){feed('Content revision: '+e.message,'err')}}
async function runProjectResearch(){if(!state.project)return;const query=$('#researchQuery').value.trim();if(!query)return;try{const j=await api('/api/projects/'+state.project.id+'/research',{method:'POST',body:JSON.stringify({query})});const out=$('#research');out.replaceChildren(...(j.research.results||[]).map(r=>{const d=document.createElement('div');d.className='cv-research-item';const a=document.createElement('a');a.href=r.url||'#';a.target='_blank';a.rel='noreferrer';a.textContent=r.title||r.url||'Source';const p=document.createElement('p');p.textContent=r.text||'';d.append(a,p);return d;}));feed(j.research.configured?'Research completed.':'Research provider not configured; no live web results.','ok');}catch(e){feed('Research: '+e.message,'err')}}

async function upload3DReference(file,role='product-image'){
  if(!state.project)throw new Error('project_required');
  const r=await fetch('/api/projects/'+encodeURIComponent(state.project.id)+'/assets',{method:'POST',headers:{'Content-Type':file.type||'application/octet-stream','X-Asset-Name':file.name,'X-Asset-Role':role,'X-Asset-Meta':JSON.stringify({source:'3d-model-lab'})},body:file});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'asset_upload_failed');return j.asset;
}
async function generate3DModel(){
  if(!state.project)return feed('Select a project first.','err');
  const files=[...($('#threeAssets')?.files||[])];if(!files.length)return feed('Choose 1–4 reference images first.','err');if(files.length>4)return feed('3D generation accepts up to four reference images.','err');
  try{
    const role=$('#threeAttachmentCollection').value==='properties'?'property-image':$('#threeAttachmentCollection').value==='scenes'?'site-image':'product-image';
    const assets=[];for(const file of files)assets.push(await upload3DReference(file,role));
    const attachmentId=$('#threeAttachmentId').value.trim(),collection=$('#threeAttachmentCollection').value;
    const j=await api('/api/projects/'+encodeURIComponent(state.project.id)+'/3d/generate',{method:'POST',body:JSON.stringify({provider:$('#threeProvider').value,assetIds:assets.map(x=>x.id),name:$('#threeModelName').value.trim()||files[0].name,targetFormats:['glb'],attachment:attachmentId?{collection,recordId:attachmentId}:null})});
    $('#threeJobStatus').textContent='3D task queued · '+j.job.id;await poll3DJob(j.job.id);
  }catch(e){$('#threeJobStatus').textContent='3D error: '+e.message;feed('3D model generation: '+e.message,'err')}
}
async function poll3DJob(id){
  for(let i=0;i<60;i++){
    const j=await api('/api/3d/jobs/'+encodeURIComponent(id));const job=j.job||{};$('#threeJobStatus').textContent='3D '+job.status+' · '+Number(job.result?.progress||0)+'%';
    if(job.status==='succeeded'){feed('3D model generated and stored as a local GLB asset.','ok');await load3DJobs();return}
    if(job.status==='failed'){feed('3D model failed: '+(job.error||'provider error'),'err');await load3DJobs();return}
    await new Promise(r=>setTimeout(r,4000));
  }
  feed('3D task is still running; reopen Content & data to check status.','ok');
}
async function load3DJobs(){
  if(!state.project)return;
  try{const j=await api('/api/projects/'+encodeURIComponent(state.project.id)+'/3d/jobs'),el=$('#threeJobs');if(!el)return;el.replaceChildren(...(j.jobs||[]).map(job=>{const d=document.createElement('div');d.className='cv-event';d.textContent=(job.input?.name||job.id)+' · '+job.status+(job.error?' · '+job.error:'');return d;}));}catch{}
}

async function runDiscoverability(){if(!state.project)return;try{const j=await api('/api/projects/'+state.project.id+'/discoverability/audit',{method:'POST',body:'{}'});const el=$('#discoverabilitySummary');const a=j.audit||{},rows=[['Score',String(a.score||0)+'/100'],['Pages',String((a.pages||[]).length)],['Issues',String((a.issues||[]).length)],['Warnings',String((a.warnings||[]).length)],['AEO',j.aeo?.answerEngineReady?'ready':'needs work']];if(el)el.replaceChildren(...rows.map(([k,v])=>{const d=document.createElement('div');d.className='cv-list-row';const x=document.createElement('span');x.textContent=k;const y=document.createElement('strong');y.textContent=v;d.append(x,y);return d;}));feed(j.aeo?.answerEngineReady?'SEO/AEO audit passed.':'SEO/AEO audit found improvements.','ok');}catch(e){feed('SEO/AEO: '+e.message,'err')}}
async function loadFeatureSuite(){if(!state.project)return;await Promise.all([loadWorkspaceSuite(),loadDesignMode(),loadCloudServices(),loadDomains(),loadContentRevisions()]);}

$('#launchCheck')?.addEventListener('click',loadLaunchStatus);
$('#assistantOpen')?.addEventListener('click',assistantOpen);$('#assistantInstructionsSave')?.addEventListener('click',saveAssistantInstructions);$('#assistantClose')?.addEventListener('click',assistantClose);$('#assistantNew')?.addEventListener('click',newAssistantConversation);$('#assistantSend')?.addEventListener('click',sendAssistantMessage);$('#assistantInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAssistantMessage();}});
$('#templateSearchBtn')?.addEventListener('click',loadTemplateCatalog);$('#databaseRefresh')?.addEventListener('click',loadDatabaseStatus);$('#postgresCopy')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText('npm run db:postgres:up\nnpm run db:postgres:setup\nnpm run db:postgres:doctor\n\nAdminer: http://127.0.0.1:8080\nDATABASE_URL=postgresql://buildvibe:buildvibe_dev_password@127.0.0.1:5432/buildvibe\nCODINGVIBES_DB_BACKEND=postgres');feed('Local PostgreSQL setup copied.','ok');}catch{feed('Clipboard permission denied. Use the commands shown in Database status.','err')}});$('#templateSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();loadTemplateCatalog();}});
$('#generate3d')?.addEventListener('click',generate3DModel);$('#upgradeBusiness')?.addEventListener('click',()=>startCheckout('business'));$('#openAssistant3d')?.addEventListener('click',()=>openAssistantWithPrompt('Help me design the 3D model experience for this product: include 360/orbit, media, hotspots, materials/colors and performance-safe fallbacks.','chat'));$('#upgradePro')?.addEventListener('click',()=>startCheckout('pro'));$('#upgradeTeam')?.addEventListener('click',()=>startCheckout('team'));$('#manageBilling')?.addEventListener('click',manageBilling);$('#inviteMember')?.addEventListener('click',async()=>{try{const j=await api('/api/workspaces/'+state.project.workspace_id+'/invites',{method:'POST',body:JSON.stringify({email:$('#inviteEmail').value,role:$('#inviteRole').value})});feed('Invite created. Share token securely: '+j.token,'ok');await loadWorkspaceSuite();}catch(e){feed('Invite: '+e.message,'err')}});$('#saveDesign')?.addEventListener('click',saveDesignMode);$('#resetDesign')?.addEventListener('click',resetDesignMode);$('#provisionCloud')?.addEventListener('click',provisionCloud);$('#addDomain')?.addEventListener('click',addDomain);$('#newContentRevision')?.addEventListener('click',newContentRevision);$('#runResearch')?.addEventListener('click',runProjectResearch);$('#runDiscoverability')?.addEventListener('click',runDiscoverability);$('#buildBtn').onclick=startBuild;document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
$('#newWindow')?.addEventListener('click',createProjectWindow);
startWindowPolling();document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>{$('#request').value=b.dataset.prompt;$('#request').focus();previewBlueprint()});$('#request').addEventListener('input',()=>{if(state.project)state.drafts.set(state.project.id,$('#request').value);clearTimeout(window.cvPlanTimer);window.cvPlanTimer=setTimeout(previewBlueprint,500)});$('#targetSelect').addEventListener('change',()=>{if(state.project)state.targetsByProject.set(state.project.id,$('#targetSelect').value);});$('#newProject').onclick=createProjectWindow;$('#logout').onclick=async()=>{await api('/api/auth/logout',{method:'POST'});location.reload()};
async function initGoogleAuth(){
  const button=$('#googleBtn');if(!button)return;
  try{
    const j=await api('/api/auth/google/config');
    button.classList.toggle('hidden',!j.configured);
    const hint=$('#authProviderHint');
    if(hint)hint.textContent=j.configured?'Sign in or create your Build Vibe account with Google.':'Google sign-in is not configured yet; email sign-in is available.';
  }catch{button.classList.add('hidden');}
}
function showAuthError(){
  const code=new URLSearchParams(location.search).get('auth_error');if(!code)return;
  const messages={google_email_not_verified:'Your Google account email must be verified before you can continue.',oauth_state_invalid:'Google sign-in expired or was interrupted. Please try again.',google_auth_failed:'Google sign-in could not be completed. Please try again.'};
  const el=$('#authError');if(el)el.textContent=messages[code]||'Google sign-in could not be completed. Please try again.';
  history.replaceState(null,'',location.pathname+location.hash);
}
async function applyLandingPrompt(){
  const params=new URLSearchParams(location.search);
  const request=params.get('prompt');
  const mode=params.get('target');
  if(request){
    const field=$('#request');
    if(field){field.value=request;field.dispatchEvent(new Event('input',{bubbles:true}));}
    sessionStorage.removeItem('buildVibeLandingPrompt');
  }
  if(mode){
    const select=$('#targetSelect');
    if(select){
      const preferred=mode==='mobile'
        ? [...select.options].find(o=>/expo|react|mobile/i.test(o.value+' '+o.textContent))
        : mode==='web-app'
        ? [...select.options].find(o=>/web[-_ ]?app|saas/i.test(o.value+' '+o.textContent))
        : null;
      if(preferred)select.value=preferred.value;
    }
  }
  if(request && location.search){
    history.replaceState(null,'',location.pathname);
    try{await previewBlueprint();}catch{}
  }
}

async function auth(){
  const j=await api('/api/auth/me');
  if(j.user){state.user=j.user;$('#appView').classList.remove('hidden');await Promise.all([loadCapabilities(),loadTargets(),loadProjects()]);await applyLandingPrompt();}
  else{$('#authView').classList.remove('hidden');showAuthError();await initGoogleAuth();}
}
$('#loginBtn').onclick=async()=>{try{await api('/api/auth/login',{method:'POST',body:JSON.stringify({email:$('#email').value,password:$('#password').value})});location.reload()}catch(e){$('#authError').textContent=e.message}};
$('#signupBtn').onclick=async()=>{try{await api('/api/auth/signup',{method:'POST',body:JSON.stringify({email:$('#email').value,password:$('#password').value})});location.reload()}catch(e){$('#authError').textContent=e.message}};
$('#googleBtn')?.addEventListener('click',()=>{location.href='/api/auth/google?redirect=%2Fapp';});
auth();
+Number(p.priceUsd||0)+'/month';const right=document.createElement('strong');right.textContent=p.id===current?'Current':'Available';d.append(left,right);const limits=p.creationLimits||{};const meta=document.createElement('small');meta.className='cv-muted';meta.textContent='Sites: '+['basic','animated','3d','apk'].map(k=>k+': '+Number(creation[k]||0)+'/'+(limits[k]??'∞')).join(' · ');d.append(meta);return d});el.replaceChildren(...rows);const free=document.createElement('div');free.className='cv-event';free.textContent='Your usage: '+creation.basic+'/3 basic · '+creation.animated+'/1 animated · '+creation['3d']+'/1 3D · '+creation.apk+'/0 APK on Free policy';el.prepend(free);const pro=$('#upgradePro'),team=$('#upgradeTeam'),business=$('#upgradeBusiness'),manage=$('#manageBilling');if(pro)pro.classList.toggle('hidden',current!=='free');if(team)team.classList.toggle('hidden',current==='team'||current==='business');if(business)business.classList.toggle('hidden',current==='business');if(manage)manage.classList.toggle('hidden',!b.customerConfigured);if($('#billingSummary'))$('#billingSummary').textContent='Plan: '+current+' · '+(b.usage?.runs||0)+' builds · '+(b.usage?.tokens||0)+' tokens · '+provider;}catch(e){feed('Billing: '+e.message,'err')}}
async function startCheckout(plan){try{const j=await api('/api/billing/checkout',{method:'POST',body:JSON.stringify({plan})});if(j.checkout?.url)location.href=j.checkout.url;else feed('Checkout created but no payment URL was returned.','err');}catch(e){feed('Checkout: '+e.message,'err')}}
async function manageBilling(){try{const j=await api('/api/billing/portal',{method:'POST',body:'{}'});const url=j.portal?.url||j.portal?.subscriptionUrl;if(url)window.location.href=url;else feed('Billing portal did not return a URL.','err');}catch(e){feed('Billing portal: '+e.message,'err')}}
async function loadProviders(){
  try{
    const j=await api('/api/deployment/providers');
    state.providers=j.providers||[];
    const el=$('#providers');el.replaceChildren();
    const connections=new Map((j.connected||[]).map(x=>[x.provider,x]));
    for(const p of state.providers){
      const connected=p.connected||connections.has(p.id);
      const d=document.createElement('div');d.className='cv-provider';
      const name=document.createElement('strong');name.textContent=p.label||p.id;
      const b=document.createElement('button');b.className='cv-secondary';
      if(p.id==='manual'){b.textContent='Download ZIP';b.onclick=exportProject;}
      else if(p.id==='hostinger'){b.textContent=connected?'Prepare for Hostinger':'Connect GitHub';b.title='Publishes the verified project to GitHub, then use Hostinger Node.js Web App → Import Git Repository.';b.onclick=async()=>{if(!connected){window.location.href='/api/deployment/providers/github/oauth';return;}await deployProvider(p.id)};}
      else {b.textContent=connected?'Deploy':'Connect';b.onclick=async()=>{if(connected)await deployProvider(p.id);else window.location.href='/api/deployment/providers/'+encodeURIComponent(p.id)+'/oauth';}}
      d.append(name,b);el.append(d);
    }
  }catch(e){feed('Provider catalog unavailable: '+e.message,'err')}
}
async function deployProvider(provider){
  if(!state.project||!state.run)return feed('Build and verify a product first.','err');
  try{
    const r=await api('/api/projects/'+state.project.id+'/deploy',{method:'POST',body:JSON.stringify({provider})});
    const d=r.deployment||r.result||{};
    feed(provider==='hostinger'?(d.metadata?.nextStep||'Published to GitHub. Open Hostinger and import the repository.'):'Deployment: '+(d.status||'submitted'),'ok');
  }catch(e){feed('Deployment: '+e.message,'err')}
}
async function exportProject(){
  if(!state.project||!state.run)return feed('Build and verify a product first.','err');
  try{
    const r=await api('/api/projects/'+state.project.id+'/export');
    const link=$('#zipLink');if(link){link.href=r.downloadUrl;link.download='';link.textContent='Download ZIP';}
    feed('ZIP export is ready.','ok');
    if(link)link.click();
  }catch(e){feed('Export: '+e.message,'err')}
}

async function loadResearch(){try{const j=await api('/api/builder/research');const r=j.research;$('#research').innerHTML='<p>'+r.methodology+'</p>'+r.sources.map(s=>'<div style="margin:8px 0"><strong>'+s.name+'</strong><br><a href="'+s.url+'" target="_blank" rel="noreferrer">'+s.patterns.join(' · ')+'</a></div>').join('')}catch{}}


const assistantState={conversationId:null,messages:[],tokenNode:null};
function assistantOpen(){const d=$('#assistantDialog');if(!d)return;d.showModal();loadAssistantConversations();if(state.project)$('#assistantModeHint').textContent='Working with '+state.project.name+' · project-aware context';$('#assistantInput').focus();}
function assistantClose(){const d=$('#assistantDialog');if(d?.open)d.close();}
function renderAssistantMessages(){
  const el=$('#assistantMessages');if(!el)return;el.replaceChildren();
  for(const m of assistantState.messages){
    const d=document.createElement('div');d.className='cv-assistant-msg '+(m.role==='user'?'user':'assistant');
    const label=document.createElement('span');label.className='cv-assistant-role';label.textContent=m.role==='user'?'You':'Assistant';
    const body=document.createElement('div');body.textContent=m.content||'';d.append(label,body);el.append(d);
  }
  el.scrollTop=el.scrollHeight;
}
async function loadAssistantConversations(){
  try{
    const q=state.project?'?projectId='+encodeURIComponent(state.project.id):'';
    const j=await api('/api/assistant/conversations'+q),el=$('#assistantConversations');if(!el)return;el.replaceChildren();
    for(const x of j.conversations||[]){
      const b=document.createElement('button');b.className='cv-event'+(assistantState.conversationId===x.id?' ok':'');b.textContent=x.name||'Assistant chat';b.onclick=()=>loadAssistantConversation(x.id);el.append(b);
    }
    if(!assistantState.conversationId&&(j.conversations||[])[0])await loadAssistantConversation(j.conversations[0].id);
  }catch(e){feed('Assistant history: '+e.message,'err')}
}
async function loadAssistantConversation(id){
  try{const j=await api('/api/assistant/conversations/'+encodeURIComponent(id)+'/messages');assistantState.conversationId=id;assistantState.messages=(j.messages||[]).map(x=>({role:x.role==='user'?'user':'assistant',content:x.content}));renderAssistantMessages();loadAssistantConversations();}catch(e){feed('Assistant chat: '+e.message,'err')}
}
async function newAssistantConversation(){
  try{
    const j=await api('/api/assistant/conversations',{method:'POST',body:JSON.stringify({projectId:state.project?.id||null,mode:$('#assistantMode')?.value||'chat',name:'New Build Vibe chat'})});
    assistantState.conversationId=j.conversation.id;assistantState.messages=[];renderAssistantMessages();loadAssistantConversations();$('#assistantInput').focus();
  }catch(e){feed('New chat: '+e.message,'err')}
}
async function sendAssistantMessage(){
  const input=$('#assistantInput'),message=input.value.trim();if(!message)return;
  const mode=$('#assistantMode').value;input.value='';assistantState.messages.push({role:'user',content:message},{role:'assistant',content:''});renderAssistantMessages();
  const nodes=$('#assistantMessages')?.querySelectorAll('.cv-assistant-msg');assistantState.tokenNode=nodes?.[nodes.length-1]?.querySelector('div:last-child')||null;
  try{
    const response=await fetch('/api/assistant/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message,conversationId:assistantState.conversationId||undefined,projectId:state.project?.id||undefined,mode,stream:true,target:$('#targetSelect')?.value||'auto'})});
    if(!response.ok)throw new Error((await response.text())||'assistant_request_failed');
    const reader=response.body?.getReader();if(!reader)throw new Error('assistant_stream_unavailable');
    const decoder=new TextDecoder();let buf='';
    while(true){
      const {done,value}=await reader.read();if(done)break;buf+=decoder.decode(value,{stream:true});const chunks=buf.split('\n\n');buf=chunks.pop()||'';
      for(const chunk of chunks){const line=chunk.split('\n').find(x=>x.startsWith('data:'));if(!line)continue;try{
        const e=JSON.parse(line.slice(5));
        if(e.type==='assistant_started')assistantState.conversationId=e.conversationId;
        if(e.type==='assistant_token'){if(assistantState.tokenNode){assistantState.tokenNode.textContent+=(e.token||'');}else{assistantState.messages.at(-1).content+=(e.token||'');renderAssistantMessages();}}
        if(e.type==='assistant_completed'){
          const result=e.result||{};if(result.kind==='clarification')renderAssistantChoices(result);
          if(result.kind==='message')renderAssistantActions(result,message);
          if(result.text&&!assistantState.messages.at(-1).content)assistantState.messages.at(-1).content=result.text;else if(result.text&&assistantState.messages.at(-1).content!==result.text)assistantState.messages.at(-1).content=result.text;
          renderAssistantMessages();
        }
      }catch{}}
    }
    await loadAssistantConversations();
  }catch(e){assistantState.messages.at(-1).content='Assistant error: '+e.message;renderAssistantMessages();}
}
function renderAssistantActions(result,sourceMessage){
  const actionable=['design_edit','product_3d_edit','catalog_edit','experience_3d_edit','qa_fix'].includes(result?.intent);
  if(!actionable)return;
  const wrap=$('#assistantChoices');if(!wrap)return;
  const card=document.createElement('div');card.className='cv-choice-group';
  const label=document.createElement('strong');label.textContent='Apply this to the current project';card.append(label);
  const b=document.createElement('button');b.className='cv-primary';b.textContent='Apply in Studio';b.onclick=async()=>{wrap.classList.add('hidden');assistantClose();$('#request').value=sourceMessage;state.drafts.set(state.project?.id||'',sourceMessage);showTab('build');if(state.project)await startBuild();};card.append(b);wrap.prepend(card);wrap.classList.remove('hidden');
}

function renderAssistantChoices(result){
  const wrap=$('#assistantChoices');if(!wrap)return;wrap.classList.remove('hidden');wrap.replaceChildren();
  const selected={};
  for(const q of result.questions||[]){const card=document.createElement('div');card.className='cv-choice-group';const h=document.createElement('strong');h.textContent=q.label;card.append(h);
    for(const option of q.options||[]){const b=document.createElement('button');b.className='cv-chip';b.textContent=option;b.onclick=()=>{selected[q.id]=option;card.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active')};card.append(b);}wrap.append(card);
  }
  const go=document.createElement('button');go.className='cv-primary';go.textContent='Continue with selections';go.onclick=()=>{const lines=Object.entries(selected).map(([k,v])=>k+': '+v);if(!lines.length)return;$('#assistantInput').value=lines.join('\n');wrap.classList.add('hidden');sendAssistantMessage()};wrap.append(go);
}
function openAssistantWithPrompt(prompt,mode='chat'){assistantOpen();if(prompt){$('#assistantMode').value=mode;$('#assistantInput').value=prompt;$('#assistantInput').focus();}}

async function loadWorkspaceSuite(){
  if(!state.project?.workspace_id)return;
  try{
    const wid=state.project.workspace_id,ws=(await api('/api/workspaces')).workspaces.find(x=>x.id===wid);
    $('#workspaceMeta').textContent=ws?ws.name+' · '+ws.role:'Workspace';
    const [members,approvals]=await Promise.all([api('/api/workspaces/'+wid+'/members'),api('/api/workspaces/'+wid+'/approvals')]);
    const me=$('#workspaceMembers');if(me)me.replaceChildren(...(members.members||[]).map(x=>{const d=document.createElement('div');d.className='cv-list-row';const label=document.createElement('span');label.textContent=x.email+' · '+x.role;d.append(label);if(ws&&['owner','admin'].includes(ws.role)&&x.role!=='owner'){const select=document.createElement('select');['admin','editor','reviewer','viewer'].forEach(role=>{const o=document.createElement('option');o.value=role;o.textContent=role;o.selected=role===x.role;select.append(o)});select.onchange=async()=>{try{await api('/api/workspaces/'+wid+'/members/'+x.user_id,{method:'PATCH',body:JSON.stringify({role:select.value})});feed('Role updated.','ok');}catch(e){feed('Role update: '+e.message,'err')}};const rm=document.createElement('button');rm.className='cv-secondary';rm.textContent='Remove';rm.onclick=async()=>{if(!confirm('Remove '+x.email+' from this workspace?'))return;try{await api('/api/workspaces/'+wid+'/members/'+x.user_id,{method:'DELETE'});feed('Member removed.','ok');await loadWorkspaceSuite();}catch(e){feed('Remove member: '+e.message,'err')}};d.append(select,rm);}return d;}));
    const ae=$('#workspaceApprovals');if(ae)ae.replaceChildren(...(approvals.approvals||[]).slice(0,8).map(a=>{const d=document.createElement('div');d.className='cv-list-row';const label=document.createElement('span');label.textContent=a.kind+' · '+a.status;d.append(label);if(a.status==='pending'&&['owner','admin','reviewer'].includes(ws?.role)){const b=document.createElement('button');b.className='cv-secondary';b.textContent='Approve';b.onclick=async()=>{try{await api('/api/approvals/'+a.id+'/decision',{method:'POST',body:JSON.stringify({status:'approved'})});feed('Approval granted.','ok');await loadWorkspaceSuite();}catch(e){feed('Approval: '+e.message,'err')}};d.append(b);}return d;}));
  }catch(e){const el=$('#workspaceMeta');if(el)el.textContent='Workspace unavailable: '+e.message;}
}
async function loadDesignMode(){
  if(!state.project)return;
  try{
    const j=await api('/api/projects/'+state.project.id+'/design'),s=j.designSystem?.system||{};
    const map={designPrimary:s.colors?.primary,designAccent:s.colors?.accent,designBackground:s.colors?.background,designSurface:s.colors?.surface,designHeading:s.typography?.heading,designBody:s.typography?.body,designRadius:s.radius?.md,designMotion:s.motion?.durationMs};
    for(const [id,value] of Object.entries(map)){const el=$('#'+id);if(el&&value!=null)el.value=value;}
    $('#designStatus').textContent='Version '+(j.designSystem?.version||1)+' · '+(j.designSystem?.name||'Design System');
  }catch(e){$('#designStatus').textContent='Design mode unavailable: '+e.message;}
}
async function saveDesignMode(){
  if(!state.project)return;
  const base=await api('/api/projects/'+state.project.id+'/design');
  const system=JSON.parse(JSON.stringify(base.designSystem?.system||{}));
  system.colors={...(system.colors||{}),primary:$('#designPrimary').value,accent:$('#designAccent').value,background:$('#designBackground').value,surface:$('#designSurface').value};
  system.typography={...(system.typography||{}),heading:$('#designHeading').value,body:$('#designBody').value};
  system.radius={...(system.radius||{}),md:Number($('#designRadius').value||12)};
  system.motion={...(system.motion||{}),durationMs:Number($('#designMotion').value||220),reducedMotion:true};
  try{const j=await api('/api/projects/'+state.project.id+'/design',{method:'PUT',body:JSON.stringify({name:'Build Vibe Design System',system})});$('#designStatus').textContent='Saved version '+j.designSystem.version;feed('Design system saved.','ok');}catch(e){feed('Design save: '+e.message,'err');}
}
async function resetDesignMode(){try{const j=await api('/api/projects/'+state.project.id+'/design',{method:'PUT',body:JSON.stringify({name:'Build Vibe Design System',system:{},request:''})});await loadDesignMode();$('#designStatus').textContent='Reset to defaults · version '+j.designSystem.version;}catch(e){feed('Design reset: '+e.message,'err');}}
async function loadCloudServices(){
  if(!state.project)return;
  try{
    const j=await api('/api/projects/'+state.project.id+'/cloud-services'),list=$('#cloudServices'),select=$('#cloudServiceType');
    if(select&&!select.dataset.ready){select.dataset.ready='1';for(const c of j.catalog||[]){const o=document.createElement('option');o.value=c.id;o.textContent=c.label;select.append(o);}}
    if(list)list.replaceChildren(...(j.services||[]).map(x=>{const d=document.createElement('div');d.className='cv-list-row';d.textContent=x.type+' · '+x.status+' · '+(x.provider||'unconfigured');return d;}));
  }catch(e){feed('Cloud services: '+e.message,'err')}
}
async function provisionCloud(){if(!state.project)return;try{const j=await api('/api/projects/'+state.project.id+'/cloud-services',{method:'POST',body:JSON.stringify({type:$('#cloudServiceType').value})});feed('Cloud service '+j.service.type+': '+j.service.status,'ok');await loadCloudServices();}catch(e){feed('Cloud service: '+e.message,'err')}}
async function loadDomains(){if(!state.project)return;try{const j=await api('/api/projects/'+state.project.id+'/domains'),list=$('#domains');if(list)list.replaceChildren(...(j.domains||[]).map(x=>{const d=document.createElement('div');d.className='cv-list-row';d.textContent=x.domain+' · '+x.status+' · '+x.provider;return d;}));}catch(e){feed('Domains: '+e.message,'err')}}
async function addDomain(){if(!state.project)return;try{const j=await api('/api/projects/'+state.project.id+'/domains',{method:'POST',body:JSON.stringify({domain:$('#domainInput').value,provider:$('#domainProvider').value})});feed('Domain '+j.domain.domain+' added · '+j.domain.status,'ok');await loadDomains();}catch(e){feed('Domain: '+e.message,'err')}}
async function loadContentRevisions(){if(!state.project)return;try{const j=await api('/api/projects/'+state.project.id+'/content/revisions'),el=$('#contentRevisions');if(el)el.replaceChildren(...(j.revisions||[]).slice(0,8).map(r=>{const d=document.createElement('div');d.className='cv-list-row';d.textContent='v'+r.version+' · '+r.status+(r.published_at?' · published':'');if(r.status!=='published'){const b=document.createElement('button');b.className='cv-secondary';b.textContent='Publish';b.onclick=async()=>{try{await api('/api/content-revisions/'+r.id+'/publish',{method:'POST',body:'{}'});feed('Content revision v'+r.version+' published.','ok');await loadContentRevisions();}catch(e){feed('Publish revision: '+e.message,'err')}};d.append(b);}return d;}));}catch(e){feed('Content revisions: '+e.message,'err')}}
async function newContentRevision(){try{const j=await api('/api/projects/'+state.project.id+'/content/revisions',{method:'POST',body:JSON.stringify({status:'draft'})});feed('Content draft revision v'+j.revision.version+' saved.','ok');await loadContentRevisions();}catch(e){feed('Content revision: '+e.message,'err')}}
async function runProjectResearch(){if(!state.project)return;const query=$('#researchQuery').value.trim();if(!query)return;try{const j=await api('/api/projects/'+state.project.id+'/research',{method:'POST',body:JSON.stringify({query})});const out=$('#research');out.replaceChildren(...(j.research.results||[]).map(r=>{const d=document.createElement('div');d.className='cv-research-item';const a=document.createElement('a');a.href=r.url||'#';a.target='_blank';a.rel='noreferrer';a.textContent=r.title||r.url||'Source';const p=document.createElement('p');p.textContent=r.text||'';d.append(a,p);return d;}));feed(j.research.configured?'Research completed.':'Research provider not configured; no live web results.','ok');}catch(e){feed('Research: '+e.message,'err')}}

async function upload3DReference(file,role='product-image'){
  if(!state.project)throw new Error('project_required');
  const r=await fetch('/api/projects/'+encodeURIComponent(state.project.id)+'/assets',{method:'POST',headers:{'Content-Type':file.type||'application/octet-stream','X-Asset-Name':file.name,'X-Asset-Role':role,'X-Asset-Meta':JSON.stringify({source:'3d-model-lab'})},body:file});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'asset_upload_failed');return j.asset;
}
async function generate3DModel(){
  if(!state.project)return feed('Select a project first.','err');
  const files=[...($('#threeAssets')?.files||[])];if(!files.length)return feed('Choose 1–4 reference images first.','err');if(files.length>4)return feed('3D generation accepts up to four reference images.','err');
  try{
    const role=$('#threeAttachmentCollection').value==='properties'?'property-image':$('#threeAttachmentCollection').value==='scenes'?'site-image':'product-image';
    const assets=[];for(const file of files)assets.push(await upload3DReference(file,role));
    const attachmentId=$('#threeAttachmentId').value.trim(),collection=$('#threeAttachmentCollection').value;
    const j=await api('/api/projects/'+encodeURIComponent(state.project.id)+'/3d/generate',{method:'POST',body:JSON.stringify({provider:$('#threeProvider').value,assetIds:assets.map(x=>x.id),name:$('#threeModelName').value.trim()||files[0].name,targetFormats:['glb'],attachment:attachmentId?{collection,recordId:attachmentId}:null})});
    $('#threeJobStatus').textContent='3D task queued · '+j.job.id;await poll3DJob(j.job.id);
  }catch(e){$('#threeJobStatus').textContent='3D error: '+e.message;feed('3D model generation: '+e.message,'err')}
}
async function poll3DJob(id){
  for(let i=0;i<60;i++){
    const j=await api('/api/3d/jobs/'+encodeURIComponent(id));const job=j.job||{};$('#threeJobStatus').textContent='3D '+job.status+' · '+Number(job.result?.progress||0)+'%';
    if(job.status==='succeeded'){feed('3D model generated and stored as a local GLB asset.','ok');await load3DJobs();return}
    if(job.status==='failed'){feed('3D model failed: '+(job.error||'provider error'),'err');await load3DJobs();return}
    await new Promise(r=>setTimeout(r,4000));
  }
  feed('3D task is still running; reopen Content & data to check status.','ok');
}
async function load3DJobs(){
  if(!state.project)return;
  try{const j=await api('/api/projects/'+encodeURIComponent(state.project.id)+'/3d/jobs'),el=$('#threeJobs');if(!el)return;el.replaceChildren(...(j.jobs||[]).map(job=>{const d=document.createElement('div');d.className='cv-event';d.textContent=(job.input?.name||job.id)+' · '+job.status+(job.error?' · '+job.error:'');return d;}));}catch{}
}

async function runDiscoverability(){if(!state.project)return;try{const j=await api('/api/projects/'+state.project.id+'/discoverability/audit',{method:'POST',body:'{}'});const el=$('#discoverabilitySummary');const a=j.audit||{},rows=[['Score',String(a.score||0)+'/100'],['Pages',String((a.pages||[]).length)],['Issues',String((a.issues||[]).length)],['Warnings',String((a.warnings||[]).length)],['AEO',j.aeo?.answerEngineReady?'ready':'needs work']];if(el)el.replaceChildren(...rows.map(([k,v])=>{const d=document.createElement('div');d.className='cv-list-row';const x=document.createElement('span');x.textContent=k;const y=document.createElement('strong');y.textContent=v;d.append(x,y);return d;}));feed(j.aeo?.answerEngineReady?'SEO/AEO audit passed.':'SEO/AEO audit found improvements.','ok');}catch(e){feed('SEO/AEO: '+e.message,'err')}}
async function loadFeatureSuite(){if(!state.project)return;await Promise.all([loadWorkspaceSuite(),loadDesignMode(),loadCloudServices(),loadDomains(),loadContentRevisions()]);}

$('#launchCheck')?.addEventListener('click',loadLaunchStatus);
$('#assistantOpen')?.addEventListener('click',assistantOpen);$('#assistantClose')?.addEventListener('click',assistantClose);$('#assistantNew')?.addEventListener('click',newAssistantConversation);$('#assistantSend')?.addEventListener('click',sendAssistantMessage);$('#assistantInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAssistantMessage();}});
$('#templateSearchBtn')?.addEventListener('click',loadTemplateCatalog);$('#templateSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();loadTemplateCatalog();}});
$('#generate3d')?.addEventListener('click',generate3DModel);$('#upgradeBusiness')?.addEventListener('click',()=>startCheckout('business'));$('#openAssistant3d')?.addEventListener('click',()=>openAssistantWithPrompt('Help me design the 3D model experience for this product: include 360/orbit, media, hotspots, materials/colors and performance-safe fallbacks.','chat'));$('#upgradePro')?.addEventListener('click',()=>startCheckout('pro'));$('#upgradeTeam')?.addEventListener('click',()=>startCheckout('team'));$('#manageBilling')?.addEventListener('click',manageBilling);$('#inviteMember')?.addEventListener('click',async()=>{try{const j=await api('/api/workspaces/'+state.project.workspace_id+'/invites',{method:'POST',body:JSON.stringify({email:$('#inviteEmail').value,role:$('#inviteRole').value})});feed('Invite created. Share token securely: '+j.token,'ok');await loadWorkspaceSuite();}catch(e){feed('Invite: '+e.message,'err')}});$('#saveDesign')?.addEventListener('click',saveDesignMode);$('#resetDesign')?.addEventListener('click',resetDesignMode);$('#provisionCloud')?.addEventListener('click',provisionCloud);$('#addDomain')?.addEventListener('click',addDomain);$('#newContentRevision')?.addEventListener('click',newContentRevision);$('#runResearch')?.addEventListener('click',runProjectResearch);$('#runDiscoverability')?.addEventListener('click',runDiscoverability);$('#buildBtn').onclick=startBuild;document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
$('#newWindow')?.addEventListener('click',createProjectWindow);
startWindowPolling();document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>{$('#request').value=b.dataset.prompt;$('#request').focus();previewBlueprint()});$('#request').addEventListener('input',()=>{if(state.project)state.drafts.set(state.project.id,$('#request').value);clearTimeout(window.cvPlanTimer);window.cvPlanTimer=setTimeout(previewBlueprint,500)});$('#targetSelect').addEventListener('change',()=>{if(state.project)state.targetsByProject.set(state.project.id,$('#targetSelect').value);});$('#newProject').onclick=createProjectWindow;$('#logout').onclick=async()=>{await api('/api/auth/logout',{method:'POST'});location.reload()};
async function initGoogleAuth(){
  const button=$('#googleBtn');if(!button)return;
  try{
    const j=await api('/api/auth/google/config');
    button.classList.toggle('hidden',!j.configured);
    const hint=$('#authProviderHint');
    if(hint)hint.textContent=j.configured?'Sign in or create your Build Vibe account with Google.':'Google sign-in is not configured yet; email sign-in is available.';
  }catch{button.classList.add('hidden');}
}
function showAuthError(){
  const code=new URLSearchParams(location.search).get('auth_error');if(!code)return;
  const messages={google_email_not_verified:'Your Google account email must be verified before you can continue.',oauth_state_invalid:'Google sign-in expired or was interrupted. Please try again.',google_auth_failed:'Google sign-in could not be completed. Please try again.'};
  const el=$('#authError');if(el)el.textContent=messages[code]||'Google sign-in could not be completed. Please try again.';
  history.replaceState(null,'',location.pathname+location.hash);
}
async function applyLandingPrompt(){
  const params=new URLSearchParams(location.search);
  const request=params.get('prompt');
  const mode=params.get('target');
  if(request){
    const field=$('#request');
    if(field){field.value=request;field.dispatchEvent(new Event('input',{bubbles:true}));}
    sessionStorage.removeItem('buildVibeLandingPrompt');
  }
  if(mode){
    const select=$('#targetSelect');
    if(select){
      const preferred=mode==='mobile'
        ? [...select.options].find(o=>/expo|react|mobile/i.test(o.value+' '+o.textContent))
        : mode==='web-app'
        ? [...select.options].find(o=>/web[-_ ]?app|saas/i.test(o.value+' '+o.textContent))
        : null;
      if(preferred)select.value=preferred.value;
    }
  }
  if(request && location.search){
    history.replaceState(null,'',location.pathname);
    try{await previewBlueprint();}catch{}
  }
}

async function auth(){
  const j=await api('/api/auth/me');
  if(j.user){state.user=j.user;$('#appView').classList.remove('hidden');await Promise.all([loadCapabilities(),loadTargets(),loadProjects()]);await applyLandingPrompt();}
  else{$('#authView').classList.remove('hidden');showAuthError();await initGoogleAuth();}
}
$('#loginBtn').onclick=async()=>{try{await api('/api/auth/login',{method:'POST',body:JSON.stringify({email:$('#email').value,password:$('#password').value})});location.reload()}catch(e){$('#authError').textContent=e.message}};
$('#signupBtn').onclick=async()=>{try{await api('/api/auth/signup',{method:'POST',body:JSON.stringify({email:$('#email').value,password:$('#password').value})});location.reload()}catch(e){$('#authError').textContent=e.message}};
$('#googleBtn')?.addEventListener('click',()=>{location.href='/api/auth/google?redirect=%2Fapp';});
auth();
