const $=s=>document.querySelector(s);const state={user:null,projects:[],project:null,session:null,run:null,targets:[],providers:[]};
async function api(path,options={}){const r=await fetch(path,{headers:{'content-type':'application/json',...(options.headers||{})},...options});const j=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(j.error||'HTTP '+r.status);e.status=r.status;throw e;}return j}
function feed(text,kind=''){const e=document.createElement('div');e.className='cv-event '+kind;e.textContent=text;$('#feed').prepend(e);return e}
function status(text,kind='idle'){$('#runStatus').textContent=text;$('#runStatus').className='status '+kind}
function showTab(tab){document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));['build','content','design','app','publish'].forEach(x=>$('#tab-'+x).classList.toggle('hidden',x!==tab));if(state.project&&tab==='content'){loadWorkspaceSuite();loadContentRevisions();}if(state.project&&tab==='design')loadDesignMode();if(tab==='publish'){loadProviders();loadResearch();loadLaunchStatus();loadCloudServices();loadDomains();}}
async function loadCapabilities(){const j=await api('/api/builder/capabilities');const el=$('#capabilities');el.replaceChildren();for(const c of j.capabilities){const d=document.createElement('div');d.className='cv-cap';d.innerHTML='<strong></strong><span></span>';d.firstChild.textContent=c.label;d.lastChild.textContent=c.supports.slice(0,3).join(' · ');el.append(d)}}
async function loadTargets(){const j=await api('/api/targets');state.targets=j.targets||[];const s=$('#targetSelect');for(const t of state.targets){const o=document.createElement('option');o.value=t.id;o.textContent=t.label;s.append(o)}$('#targets').replaceChildren(...state.targets.map(t=>{const d=document.createElement('div');d.className='cv-event';d.textContent=t.label+' · '+t.artifactTypes.join(', ');return d}))}
async function loadProjects(){const j=await api('/api/projects');state.projects=j.projects||[];const el=$('#projects');el.replaceChildren();for(const p of state.projects){const b=document.createElement('button');b.className='cv-project'+(state.project?.id===p.id?' active':'');b.textContent=p.name;b.onclick=()=>selectProject(p);el.append(b)}if(!state.project&&state.projects[0])await selectProject(state.projects[0])}
async function selectProject(p){state.project=p;window.cvProjectId=p.id;$('#projectTitle').textContent=p.name;$('#projectMeta').textContent='Ready to build and publish';const zip=$('#zipLink');if(zip){zip.removeAttribute('href');zip.textContent='Download ZIP';}document.querySelectorAll('.cv-project').forEach(b=>b.classList.toggle('active',b.textContent===p.name));const j=await api('/api/projects/'+encodeURIComponent(p.id)+'/sessions');state.session=j.sessions[0]||null;state.run=null;$('#previewFrame').removeAttribute('src');if(state.session){const r=await api('/api/sessions/'+state.session.id+'/runs');const latest=r.runs?.[0];if(latest)await loadRun(latest.id)}await loadFeatureSuite()}
async function ensureProject(){if(state.project)return true;const name=prompt('Product name','My new product');if(!name)return false;const j=await api('/api/projects',{method:'POST',body:JSON.stringify({name})});state.project=j.project;await loadProjects();return true}
function renderBlueprint(b){const el=$('#blueprint');el.innerHTML='<h3>Product plan</h3>';for(const [k,v] of [['Type',b.productKinds.join(' · ')],['Target',b.target.label],['Capabilities',b.capabilities.join(' · ')],['Backend',b.architecture.backend],['Auth',b.architecture.authentication],['Payments',b.architecture.payments?'enabled':'not requested']]){const d=document.createElement('div');d.className='cv-blueprint-row';d.innerHTML='<span></span><strong></strong>';d.firstChild.textContent=k;d.lastChild.textContent=v;el.append(d)}}
async function previewBlueprint(){const request=$('#request').value.trim();if(!request)return;try{const j=await api('/api/builder/blueprint',{method:'POST',body:JSON.stringify({request,target:$('#targetSelect').value})});renderBlueprint(j.blueprint);$('#blueprintHint').textContent='Plan ready — generation will follow.';return j.blueprint}catch(e){feed('Planning failed: '+e.message,'err')}}
async function startBuild(){const request=$('#request').value.trim();if(!request)return;if(!await ensureProject())return;await previewBlueprint();$('#buildBtn').disabled=true;status('building');$('#progress').textContent='Planning → generating → verifying → repairing';feed('You: '+request);const r=await fetch('/api/agent/stream',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({projectId:state.project.id,sessionId:state.session?.id,request,target:$('#targetSelect').value})});if(!r.ok){feed('Build request failed','err');$('#buildBtn').disabled=false;status('error','err');return}const reader=r.body.getReader(),decoder=new TextDecoder();let buf='';while(true){const {done,value}=await reader.read();if(done)break;buf+=decoder.decode(value,{stream:true});const chunks=buf.split('\n\n');buf=chunks.pop()||'';for(const chunk of chunks){const line=chunk.split('\n').find(x=>x.startsWith('data:'));if(!line)continue;try{handle(JSON.parse(line.slice(6)))}catch{}}}$('#buildBtn').disabled=false}
function handle(e){if(e.type==='run_created'){state.run={id:e.runId};status('building');feed('Build started.')}if(e.type==='parallel_agents_completed')feed('Parallel agents: research + design + architecture + QA aligned.','ok');if(e.type==='research_completed')feed('Research lane completed.','ok');if(e.type==='design_completed')feed('Design system lane completed.','ok');if(e.type==='planned'){renderBlueprint(e.spec?{productKinds:[e.spec.siteKind||'product'],target:{label:e.targetSummary||e.target},capabilities:[],architecture:{backend:'auto',authentication:'owner-admin',payments:Boolean(e.spec.behavior?.payments)}}:{});feed('AI converted your request into a product contract.')}if(e.type==='changes_applied')feed('Application generated. Verification starting…');if(e.type==='preview_started'){$('#previewFrame').src=e.url;$('#previewLink').href=e.url;feed('Live preview ready.','ok');status('preview','ok')}if(e.type==='verification'||e.type==='target_verification'){feed('Verification attempt '+((e.attempt??0)+1)+': '+(e.passed?'passed':'repairing'),e.passed?'ok':'');status(e.passed?'verified':'repairing',e.passed?'ok':'')}if(e.type==='repair_requested')feed('AI repair cycle '+((e.attempt??0)+1)+' is fixing verified failures…');if(e.type==='review_completed')feed(e.passed?'Quality review passed.':'Quality review found blocking issues.',e.passed?'ok':'err');if(e.type==='reflection_completed')feed('Self-test reflection: '+e.score+'% · '+e.status,e.status==='ready'?'ok':'');if(e.type==='completed'){state.run={id:e.result.runId};status(e.result.status,e.result.status==='verified'?'ok':'err');$('#progress').textContent=e.result.status==='verified'?'Ready to publish.':'Needs attention.';loadRun(e.result.runId)}if(e.type==='error'){feed('Agent error: '+e.error,'err');status('error','err')}}
async function loadRun(id){try{const j=await api('/api/runs/'+id);state.run={id,status:j.run?.status};const p=j.run?.preview_url;if(p){$('#previewFrame').src=p;$('#previewLink').href=p}status(j.run?.status||'ready',j.run?.status==='verified'?'ok':'');const zip=$('#zipLink');if(zip&&j.run?.status==='verified'&&state.project){zip.href='/api/projects/'+encodeURIComponent(state.project.id)+'/export';zip.download='';}}catch{}}
async function loadLaunchStatus(){try{const j=await api('/api/launch/status'),r=j.ready,s=$('#launchSummary'),b=$('#billingSummary'),t=$('#launchTargets');if(s){s.textContent=r.ready?'Production contract: READY':'Production contract: '+r.blockers.length+' blocker(s)';s.className=r.ready?'status ok':'status err'}if(b&&j.billing)b.textContent='Plan: '+j.billing.plan+' · '+(j.billing.usage?.runs||0)+' builds · '+(j.billing.usage?.tokens||0)+' tokens';if(t)t.replaceChildren(...(j.targets||[]).map(x=>{const d=document.createElement('div');d.className='cv-event';const e=x.execution,mode=e?.host?.available?'local toolchain':e?.remote?.linux?'remote Linux':e?.remote?.macos?'remote macOS':e?.canBuild?'web runtime':'runner required';d.textContent=x.label+' · '+mode;return d}));if(!r.ready&&r.blockers?.length)feed('Launch blockers: '+r.blockers.join(', '),'err')}catch(e){feed('Launch status: '+e.message,'err')}}
async function loadBilling(){try{const j=await api('/api/billing'),b=j.billing||{},plans=j.plans||[],el=$('#billingPlans');if(!el)return;const current=b.plan||'free';const provider=j.billingProvider||'stripe';const rows=plans.filter(p=>p.id!=='free').map(p=>{const d=document.createElement('div');d.className='cv-list-row';const left=document.createElement('span');left.textContent=p.label+' · $'+Number(p.priceUsd||0)+'/month';const right=document.createElement('strong');right.textContent=p.id===current?'Current':'Available';d.append(left,right);return d});el.replaceChildren(...rows);const pro=$('#upgradePro'),team=$('#upgradeTeam'),manage=$('#manageBilling');if(pro)pro.classList.toggle('hidden',current==='pro'||current==='team');if(team)team.classList.toggle('hidden',current==='team');if(manage)manage.classList.toggle('hidden',!b.customerConfigured);if($('#billingSummary'))$('#billingSummary').textContent='Plan: '+current+' · '+(b.usage?.runs||0)+' builds · '+(b.usage?.tokens||0)+' tokens · '+provider;}catch(e){feed('Billing: '+e.message,'err')}}
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
async function runDiscoverability(){if(!state.project)return;try{const j=await api('/api/projects/'+state.project.id+'/discoverability/audit',{method:'POST',body:'{}'});const el=$('#discoverabilitySummary');const a=j.audit||{},rows=[['Score',String(a.score||0)+'/100'],['Pages',String((a.pages||[]).length)],['Issues',String((a.issues||[]).length)],['Warnings',String((a.warnings||[]).length)],['AEO',j.aeo?.answerEngineReady?'ready':'needs work']];if(el)el.replaceChildren(...rows.map(([k,v])=>{const d=document.createElement('div');d.className='cv-list-row';const x=document.createElement('span');x.textContent=k;const y=document.createElement('strong');y.textContent=v;d.append(x,y);return d;}));feed(j.aeo?.answerEngineReady?'SEO/AEO audit passed.':'SEO/AEO audit found improvements.','ok');}catch(e){feed('SEO/AEO: '+e.message,'err')}}
async function loadFeatureSuite(){if(!state.project)return;await Promise.all([loadWorkspaceSuite(),loadDesignMode(),loadCloudServices(),loadDomains(),loadContentRevisions()]);}

$('#launchCheck')?.addEventListener('click',loadLaunchStatus);$('#upgradePro')?.addEventListener('click',()=>startCheckout('pro'));$('#upgradeTeam')?.addEventListener('click',()=>startCheckout('team'));$('#manageBilling')?.addEventListener('click',manageBilling);$('#inviteMember')?.addEventListener('click',async()=>{try{const j=await api('/api/workspaces/'+state.project.workspace_id+'/invites',{method:'POST',body:JSON.stringify({email:$('#inviteEmail').value,role:$('#inviteRole').value})});feed('Invite created. Share token securely: '+j.token,'ok');await loadWorkspaceSuite();}catch(e){feed('Invite: '+e.message,'err')}});$('#saveDesign')?.addEventListener('click',saveDesignMode);$('#resetDesign')?.addEventListener('click',resetDesignMode);$('#provisionCloud')?.addEventListener('click',provisionCloud);$('#addDomain')?.addEventListener('click',addDomain);$('#newContentRevision')?.addEventListener('click',newContentRevision);$('#runResearch')?.addEventListener('click',runProjectResearch);$('#runDiscoverability')?.addEventListener('click',runDiscoverability);$('#buildBtn').onclick=startBuild;document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>{$('#request').value=b.dataset.prompt;$('#request').focus();previewBlueprint()});$('#request').addEventListener('input',()=>{clearTimeout(window.cvPlanTimer);window.cvPlanTimer=setTimeout(previewBlueprint,500)});$('#newProject').onclick=async()=>{state.project=null;state.session=null;$('#projectTitle').textContent='New product';$('#request').value='';await ensureProject();};$('#logout').onclick=async()=>{await api('/api/auth/logout',{method:'POST'});location.reload()};
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
async function auth(){
  const j=await api('/api/auth/me');
  if(j.user){state.user=j.user;$('#appView').classList.remove('hidden');await Promise.all([loadCapabilities(),loadTargets(),loadProjects()]);}
  else{$('#authView').classList.remove('hidden');showAuthError();await initGoogleAuth();}
}
$('#loginBtn').onclick=async()=>{try{await api('/api/auth/login',{method:'POST',body:JSON.stringify({email:$('#email').value,password:$('#password').value})});location.reload()}catch(e){$('#authError').textContent=e.message}};
$('#signupBtn').onclick=async()=>{try{await api('/api/auth/signup',{method:'POST',body:JSON.stringify({email:$('#email').value,password:$('#password').value})});location.reload()}catch(e){$('#authError').textContent=e.message}};
$('#googleBtn')?.addEventListener('click',()=>{location.href='/api/auth/google?redirect=%2Fapp';});
auth();

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
async function runDiscoverability(){if(!state.project)return;try{const j=await api('/api/projects/'+state.project.id+'/discoverability/audit',{method:'POST',body:'{}'});const el=$('#discoverabilitySummary');const a=j.audit||{},rows=[['Score',String(a.score||0)+'/100'],['Pages',String((a.pages||[]).length)],['Issues',String((a.issues||[]).length)],['Warnings',String((a.warnings||[]).length)],['AEO',j.aeo?.answerEngineReady?'ready':'needs work']];if(el)el.replaceChildren(...rows.map(([k,v])=>{const d=document.createElement('div');d.className='cv-list-row';const x=document.createElement('span');x.textContent=k;const y=document.createElement('strong');y.textContent=v;d.append(x,y);return d;}));feed(j.aeo?.answerEngineReady?'SEO/AEO audit passed.':'SEO/AEO audit found improvements.','ok');}catch(e){feed('SEO/AEO: '+e.message,'err')}}
async function loadFeatureSuite(){if(!state.project)return;await Promise.all([loadWorkspaceSuite(),loadDesignMode(),loadCloudServices(),loadDomains(),loadContentRevisions()]);}

$('#launchCheck')?.addEventListener('click',loadLaunchStatus);$('#inviteMember')?.addEventListener('click',async()=>{try{const j=await api('/api/workspaces/'+state.project.workspace_id+'/invites',{method:'POST',body:JSON.stringify({email:$('#inviteEmail').value,role:$('#inviteRole').value})});feed('Invite created. Share token securely: '+j.token,'ok');await loadWorkspaceSuite();}catch(e){feed('Invite: '+e.message,'err')}});$('#saveDesign')?.addEventListener('click',saveDesignMode);$('#resetDesign')?.addEventListener('click',resetDesignMode);$('#provisionCloud')?.addEventListener('click',provisionCloud);$('#addDomain')?.addEventListener('click',addDomain);$('#newContentRevision')?.addEventListener('click',newContentRevision);$('#runResearch')?.addEventListener('click',runProjectResearch);$('#runDiscoverability')?.addEventListener('click',runDiscoverability);$('#buildBtn').onclick=startBuild;document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>{$('#request').value=b.dataset.prompt;$('#request').focus();previewBlueprint()});$('#request').addEventListener('input',()=>{clearTimeout(window.cvPlanTimer);window.cvPlanTimer=setTimeout(previewBlueprint,500)});$('#newProject').onclick=async()=>{state.project=null;state.session=null;$('#projectTitle').textContent='New product';$('#request').value='';await ensureProject();};$('#logout').onclick=async()=>{await api('/api/auth/logout',{method:'POST'});location.reload()};
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
async function auth(){
  const j=await api('/api/auth/me');
  if(j.user){state.user=j.user;$('#appView').classList.remove('hidden');await Promise.all([loadCapabilities(),loadTargets(),loadProjects()]);}
  else{$('#authView').classList.remove('hidden');showAuthError();await initGoogleAuth();}
}
$('#loginBtn').onclick=async()=>{try{await api('/api/auth/login',{method:'POST',body:JSON.stringify({email:$('#email').value,password:$('#password').value})});location.reload()}catch(e){$('#authError').textContent=e.message}};
$('#signupBtn').onclick=async()=>{try{await api('/api/auth/signup',{method:'POST',body:JSON.stringify({email:$('#email').value,password:$('#password').value})});location.reload()}catch(e){$('#authError').textContent=e.message}};
$('#googleBtn')?.addEventListener('click',()=>{location.href='/api/auth/google?redirect=%2Fapp';});
auth();
