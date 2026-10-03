/* Coding Vibes v3.1 workspace UX: intent modes, command palette, editor tabs, and run navigation. */
const cvWorkspace=(function(){
  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return Array.from((r||document).querySelectorAll(s))}
  const modeMeta={
    build:{label:'Build',hint:'Describe the product from scratch.',prefix:''},
    modify:{label:'Modify',hint:'Change the existing project without losing working behavior.',prefix:'Modify the existing project: '},
    debug:{label:'Debug',hint:'Find the root cause, fix it, then verify the repair.',prefix:'Debug and fix the existing project: '},
    review:{label:'Review',hint:'Inspect quality, security, UX, and maintainability before changing anything.',prefix:'Review the existing project and improve only verified issues: '}
  };
  let mode='build',palette=null;
  function setMode(next){
    mode=modeMeta[next]?next:'build';
    qa('[data-intent]').forEach(function(x){x.classList.toggle('active',x.dataset.intent===mode)});
    var meta=modeMeta[mode],input=q('#request');
    if(input){input.placeholder=meta.hint;input.dataset.mode=mode}
    var badge=q('#intentBadge');if(badge)badge.textContent=meta.label;
    var hint=q('#intentHint');if(hint)hint.textContent=meta.hint;
  }
  function compose(raw){
    var text=String(raw||'').trim();if(!text)return '';
    return mode==='build'?text:modeMeta[mode].prefix+text;
  }
  function createShell(){
    var top=q('.topbar');if(!top||q('#workspaceToolbar'))return;
    var toolbar=document.createElement('div');toolbar.id='workspaceToolbar';toolbar.className='workspace-toolbar';
    toolbar.innerHTML='<div class="intent-switch" role="tablist" aria-label="AI intent">'+
      '<button type="button" class="intent active" data-intent="build">Build</button>'+
      '<button type="button" class="intent" data-intent="modify">Modify</button>'+
      '<button type="button" class="intent" data-intent="debug">Debug</button>'+
      '<button type="button" class="intent" data-intent="review">Review</button></div>'+
      '<button type="button" id="paletteButton" class="tool-button" title="Command palette (Ctrl/Cmd+K)">⌘K</button>';
    top.insertBefore(toolbar,top.querySelector('.top-actions'));
    qa('[data-intent]',toolbar).forEach(function(x){x.addEventListener('click',function(){setMode(x.dataset.intent)})});
    q('#paletteButton').onclick=openPalette;
  }
    function createTemplateStudio(){
    var composer=q('.composer');if(!composer||q('#templateStudio'))return;
    var box=document.createElement('details');box.id='templateStudio';box.className='template-studio';
    box.innerHTML='<summary>Templates <span class="muted small">basic + animated + 3D</span></summary>'+
      '<div class="template-tools"><select id="templateSelect"><option value="">Start from scratch</option></select><input id="templateSearch" placeholder="Search templates…"><select id="templateCategory"><option value="">All categories</option></select><select id="templateExperience"><option value="">All experiences</option></select><button type="button" id="templateClear" class="tool-button">Clear</button></div>'+
      '<div id="templateGrid" class="template-grid"></div><div id="templateHint" class="muted small">Choose a template to seed the agent. Your custom requirements always take priority.</div>';
    composer.insertBefore(box,composer.querySelector('.composer-row'));
    var search=q('#templateSearch',box),category=q('#templateCategory',box),experience=q('#templateExperience',box),grid=q('#templateGrid',box),sel=q('#templateSelect',box);
    var templates=[];
    function render(){
      var term=(search.value||'').toLowerCase(),cat=category.value,exp=experience.value;
      grid.replaceChildren();
      templates.filter(function(t){return (!cat||t.category===cat)&&(!exp||t.experience===exp)&&(!term||[t.label,t.category,t.experience,t.style].concat(t.tags||[]).join(' ').toLowerCase().includes(term));}).forEach(function(t){
        var b=document.createElement('button');b.type='button';b.className='template-card';b.dataset.templateId=t.id;
        var title=document.createElement('strong');title.textContent=t.label;
        var meta=document.createElement('span');meta.className='muted small';meta.textContent=t.category+' · '+(t.tier==='pro'?'PRO':'FREE');
        var tags=document.createElement('span');tags.className='template-tags muted small';tags.textContent=(t.tags||[]).slice(0,3).join(' · ');
        b.append(title,meta,tags);b.onclick=function(){var sel=q('#templateSelect');if(sel){sel.value=t.id;sel.dispatchEvent(new Event('change'));}q('#templateHint').textContent='Selected: '+t.label+(t.tier==='pro'?' · Pro feature may be required':'');window.cvRefreshContentStudio?.(window.cvProjectId,t.id)};
        grid.appendChild(b);
      });
    }
    fetch('/api/templates').then(function(r){return r.json()}).then(function(j){templates=j.templates||[];templates.forEach(function(t){var o=document.createElement('option');o.value=t.id;o.textContent=t.label+(t.tier==='pro'?' · PRO':' · FREE');sel.append(o)});var cats=[...new Set(templates.map(t=>t.category))].sort();cats.forEach(function(cat){var o=document.createElement('option');o.value=cat;o.textContent=cat;category.append(o)});var exps=[...new Set(templates.map(t=>t.experience).filter(Boolean))].sort();exps.forEach(function(exp){var o=document.createElement('option');o.value=exp;o.textContent=exp==='3d'?'3D / Immersive':exp==='motion'?'Motion / Animated':exp;experience.append(o)});render();window.cvRefreshContentStudio?.(window.cvProjectId)}).catch(function(){});
    search.addEventListener('input',render);category.addEventListener('change',render);experience.addEventListener('change',render);sel?.addEventListener('change',function(){window.cvRefreshContentStudio?.(window.cvProjectId);});q('#templateClear',box).onclick=function(){var sel=q('#templateSelect');if(sel){sel.value='';sel.dispatchEvent(new Event('change'));}search.value='';category.value='';experience.value='';q('#templateHint').textContent='Choose a template to seed the agent.';render()};
  }
  function createComposerTools(){
    var composer=q('.composer');if(!composer||q('#composerTools'))return;
    var row=document.createElement('div');row.id='composerTools';row.className='composer-tools';
    row.innerHTML='<div class="suggestions">'+
      '<button type="button" data-prompt="Add authentication with protected routes and a polished login flow">Auth</button>'+
      '<button type="button" data-prompt="Make the UI responsive and accessible on mobile and desktop">Responsive</button>'+
      '<button type="button" data-prompt="Find and fix the current failing verification issues">Fix verification</button>'+
      '<button type="button" data-prompt="Review the app for security and obvious UX problems">Review quality</button>'+
      '<button type="button" data-prompt="Transform the existing website into an immersive 3D experience with cinematic motion, responsive fallback and accessible controls">3D transform</button>'+
      '<button type="button" data-prompt="Transform the existing website into a polished animated experience with scroll storytelling, micro-interactions and reduced-motion support">Motion</button>'+
      '</div><span id="intentHint" class="muted small">Build mode creates a new application contract.</span>';
    composer.insertBefore(row,composer.querySelector('.composer-row'));
    qa('[data-prompt]',row).forEach(function(b){b.onclick=function(){
      var input=q('#request');input.value=b.dataset.prompt;input.focus();input.setSelectionRange(input.value.length,input.value.length);
      var text=b.dataset.prompt.toLowerCase(),inferred=text.indexOf('fix')>=0?'debug':text.indexOf('review')>=0?'review':'modify';setMode(inferred);
    }});
  }
  function createContentStudio(){
    var composer=q('.composer');if(!composer||q('#contentStudio'))return;
    var box=document.createElement('details');box.id='contentStudio';box.className='content-studio';
    box.innerHTML='<summary>Content Studio <span id="contentSummary" class="muted small">products, services, portfolio & more</span></summary>'+
      '<div class="content-toolbar"><select id="contentCollection" aria-label="Content collection"></select><input id="contentSearch" placeholder="Search records…"><button type="button" id="contentNew" class="tool-button">New</button><button type="button" id="contentExport" class="tool-button">Export</button><button type="button" id="contentImport" class="tool-button">Import JSON</button><input id="contentImportFile" type="file" accept="application/json" hidden></div>'+
      '<div class="content-layout"><div id="contentRecords" class="content-records"></div><form id="contentEditor" class="content-editor"></form></div>'+
      '<div id="contentHint" class="muted small">Edit structured content without rewriting the visual template.</div>';
    composer.insertBefore(box,composer.querySelector('.composer-row'));
    var collection=q('#contentCollection',box),search=q('#contentSearch',box),records=q('#contentRecords',box),editor=q('#contentEditor',box),hint=q('#contentHint',box);
    var content=null,schema=null,currentCollection='',currentId=null;
    function selectedTemplate(){return q('#templateSelect')?.value||''}
    async function fetchContent(){
      var projectId=window.cvProjectId;if(!projectId)return;
      var url='/api/projects/'+encodeURIComponent(projectId)+'/content?templateId='+encodeURIComponent(selectedTemplate());
      try{var j=await fetch(url).then(r=>{if(!r.ok)throw new Error('content_unavailable');return r.json()});content=j.content;schema=j.schema;fillCollections();renderRecords();renderEditor();var summary=q('#contentSummary',box);if(summary)summary.textContent=(content.brand?.name||'Site')+' · '+Object.entries(j.summary?.counts||{}).filter(function(x){return x[1]}).map(function(x){return x[0]+': '+x[1]}).slice(0,3).join(' · ');}catch(e){hint.textContent='Content Studio: '+e.message;}}
    function fillCollections(){
      var cols=(schema?.editableCollections||[]).filter(function(x){return Array.isArray(content?.[x.name])});
      collection.replaceChildren(...cols.map(function(c){var o=document.createElement('option');o.value=c.name;o.textContent=c.label+' ('+(content[c.name]?.length||0)+')';return o}));
      if(!currentCollection||!content?.[currentCollection])currentCollection=cols[0]?.name||'products';
      collection.value=currentCollection;
    }
    function items(){return Array.isArray(content?.[currentCollection])?content[currentCollection]:[]}
    function renderRecords(){
      var term=(search.value||'').toLowerCase().trim();records.replaceChildren();
      items().filter(function(x){return !term||JSON.stringify(x).toLowerCase().includes(term)}).forEach(function(item,i){
        var row=document.createElement('button');row.type='button';row.className='content-record'+(item.id===currentId?' active':'');
        var title=document.createElement('strong');title.textContent=item.title||item.name||item.handle||item.id;
        var meta=document.createElement('span');meta.className='muted small';meta.textContent=(item.category||item.status||'record')+(item.price!=null?' · '+item.currency+' '+item.price:'');
        row.append(title,meta);row.onclick=function(){currentId=item.id;renderRecords();renderEditor()};records.append(row);
      });
      if(!records.children.length){var empty=document.createElement('div');empty.className='muted small';empty.textContent='No records yet. Use New to add one.';records.append(empty);}
    }
    function input(name,label,value,type){
      var wrap=document.createElement('label');wrap.className='content-field';var l=document.createElement('span');l.className='muted small';l.textContent=label;var el=document.createElement(type==='textarea'?'textarea':'input');el.name=name;el.value=value==null?'':String(value);if(type==='number')el.type='number';else if(type!=='textarea')el.type=type==='url'?'url':'text';if(type==='textarea')el.rows=name==='description'?5:3;wrap.append(l,el);return wrap;
    }
    function renderEditor(){
      editor.replaceChildren();var item=items().find(function(x){return x.id===currentId})||null;var isProduct=currentCollection==='products';window.cvContentSelection=item?{collection:currentCollection,id:item.id}:null;
      var head=document.createElement('div');head.className='content-editor-head';var h=document.createElement('strong');h.textContent=item?'Edit '+(item.title||item.name||'record'):'New '+currentCollection.replace(/([A-Z])/g,' $1');head.append(h);editor.append(head);
      editor.append(input('title','Title / name',item?.title||item?.name||''));
      editor.append(input('description','Description',item?.description||'','textarea'));
      editor.append(input('image','Primary image URL',item?.image||item?.images?.[0]||'','url'));
      if(isProduct){
        var grid=document.createElement('div');grid.className='content-field-grid';
        grid.append(input('price','Price',item?.price??0,'number'),input('compareAtPrice','Compare-at price',item?.compareAtPrice??'','number'),input('sku','SKU',item?.sku||''),input('inventory','Inventory',item?.inventory??0,'number'),input('currency','Currency',item?.currency||content?.settings?.currency||'USD'),input('category','Category',item?.category||''));
        editor.append(grid);editor.append(input('tags','Tags (comma separated)',(item?.tags||[]).join(', ')));editor.append(input('images','Image URLs (one per line)',(item?.images||[]).join('\n'),'textarea'));
        var v=document.createElement('label');v.className='content-field';v.innerHTML='<span class="muted small">Variants JSON</span><textarea name="variants" rows="6" placeholder="[{&quot;title&quot;:&quot;Small&quot;,&quot;sku&quot;:&quot;SKU-S&quot;,&quot;price&quot;:49,&quot;inventory&quot;:10}]">'+escJson(item?.variants||[])+'</textarea>';editor.append(v);
        var custom=document.createElement('label');custom.className='content-field';custom.innerHTML='<span class="muted small">Custom fields JSON</span><textarea name="customFields" rows="4">'+escJson(item?.customFields||{})+'</textarea>';editor.append(custom);
      } else {
        var meta=document.createElement('label');meta.className='content-field';meta.innerHTML='<span class="muted small">Advanced fields JSON</span><textarea name="advanced" rows="8">'+escJson(item?item:{})+'</textarea>';editor.append(meta);
      }
      var status=input('status','Status',item?.status||'active');
      editor.append(status);
      var actions=document.createElement('div');actions.className='content-editor-actions';
      var save=document.createElement('button');save.type='submit';save.className='primary';save.textContent=item?'Save changes':'Add record';actions.append(save);
      if(item){var dup=document.createElement('button');dup.type='button';dup.className='tool-button';dup.textContent='Duplicate';dup.onclick=async function(){var copy={...item};delete copy.id;delete copy.handle;await op({type:'add',collection:currentCollection,record:copy})};actions.append(dup);
        var del=document.createElement('button');del.type='button';del.className='tool-button danger-button';del.textContent='Delete';del.onclick=async function(){if(!confirm('Delete this record?'))return;await op({type:'delete',collection:currentCollection,id:item.id});currentId=null;};actions.append(del);
        var up=document.createElement('button');up.type='button';up.className='tool-button';up.textContent='↑';up.title='Move up';up.onclick=function(){move(-1)};var down=document.createElement('button');down.type='button';down.className='tool-button';down.textContent='↓';down.title='Move down';down.onclick=function(){move(1)};actions.append(up,down);}
      editor.append(actions);
      editor.onsubmit=async function(e){e.preventDefault();var fd=new FormData(editor),record={};if(isProduct){
        record={title:fd.get('title'),description:fd.get('description'),images:String(fd.get('images')||'').split(/\r?\n/).map(function(x){return x.trim()}).filter(Boolean),price:Number(fd.get('price')||0),compareAtPrice:fd.get('compareAtPrice')===''?null:Number(fd.get('compareAtPrice')),sku:fd.get('sku'),inventory:Number(fd.get('inventory')||0),currency:fd.get('currency')||'USD',category:fd.get('category'),tags:String(fd.get('tags')||'').split(',').map(function(x){return x.trim()}).filter(Boolean),status:fd.get('status')||'active'};
        try{record.variants=JSON.parse(String(fd.get('variants')||'[]'));record.customFields=JSON.parse(String(fd.get('customFields')||'{}'));}catch{hint.textContent='Variants/custom fields must be valid JSON.';return;}
      } else {try{record=JSON.parse(String(fd.get('advanced')||'{}'));}catch{hint.textContent='Advanced fields must be valid JSON.';return;}record.title=fd.get('title')||record.title;record.description=fd.get('description')||record.description;record.image=fd.get('image')||record.image;record.status=fd.get('status')||record.status||'active';}
        await op(item?{type:'update',collection:currentCollection,id:item.id,patch:record}:{type:'add',collection:currentCollection,record});};
    }
    function escJson(x){return JSON.stringify(x,null,2).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}
    async function op(operation){
      var projectId=window.cvProjectId;if(!projectId)return;hint.textContent='Saving…';
      try{var r=await fetch('/api/projects/'+encodeURIComponent(projectId)+'/content/operations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({operation})});var j=await r.json();if(!r.ok)throw new Error(j.error||'save_failed');content=j.content;currentId=operation.type==='add'?(content[currentCollection]||[]).at(-1)?.id:(operation.id||currentId);fillCollections();renderRecords();renderEditor();hint.textContent='Saved. The content source of truth is updated.';}catch(e){hint.textContent=e.message;}}
    async function move(delta){var a=items(),i=a.findIndex(function(x){return x.id===currentId});if(i<0)return;var to=i+delta;if(to<0||to>=a.length)return;var ids=a.map(x=>x.id);ids.splice(i,1);ids.splice(to,0,currentId);await op({type:'reorder',collection:currentCollection,ids});}
    q('#contentNew',box).onclick=function(){currentId=null;renderRecords();renderEditor()};
    collection.onchange=function(){currentCollection=collection.value;currentId=null;renderRecords();renderEditor()};
    search.oninput=renderRecords;
    q('#contentExport',box).onclick=function(){if(!content)return;var blob=new Blob([JSON.stringify(content,null,2)+'\n'],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='codingvibes-content.json';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},500)};
    q('#contentImport',box).onclick=function(){q('#contentImportFile',box).click()};
    q('#contentImportFile',box).onchange=async function(e){var file=e.target.files?.[0];if(!file)return;try{var parsed=JSON.parse(await file.text());var projectId=window.cvProjectId;if(Array.isArray(parsed)){for(const record of parsed){var rr=await fetch('/api/projects/'+encodeURIComponent(projectId)+'/content/operations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({operation:{type:'add',collection:currentCollection||'products',record}})});var jj=await rr.json();if(!rr.ok)throw new Error(jj.error||'bulk_import_failed')}await fetchContent();hint.textContent='Imported '+parsed.length+' records into '+currentCollection+'.';}else{var r=await fetch('/api/projects/'+encodeURIComponent(projectId)+'/content',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({content:parsed,kind:parsed.kit||'business'})});var j=await r.json();if(!r.ok)throw new Error(j.error||'import_failed');content=j.content;currentCollection=Array.isArray(content.products)?'products':(schema?.editableCollections?.[0]?.name||'products');currentId=null;fillCollections();renderRecords();renderEditor();hint.textContent='Imported content and synchronized the project.';}}catch(err){hint.textContent=err.message}e.target.value=''};
    window.cvRefreshContentStudio=fetchContent;
  }
  function createExperienceStudio(){
    var composer=q('.composer');if(!composer||q('#experienceStudio'))return;
    var box=document.createElement('details');box.id='experienceStudio';box.className='experience-studio';
    box.innerHTML='<summary>Experience Studio <span class="muted small">camera paths, hotspots & 3D scene settings</span></summary>'+
      '<div class="experience-toolbar-ui"><select id="experienceCollection" aria-label="Experience collection"><option value="scenes">Scenes</option><option value="properties">Properties</option></select><select id="experienceRecord" aria-label="Experience record"></select></div>'+
      '<form id="experienceForm" class="experience-form"><label class="content-field"><span class="muted small">Camera path JSON</span><textarea id="experienceCameraPath" rows="7" placeholder="[{&quot;x&quot;:12,&quot;y&quot;:6,&quot;z&quot;:14,&quot;duration&quot;:2}]"></textarea></label><label class="content-field"><span class="muted small">Hotspots JSON</span><textarea id="experienceHotspots" rows="7" placeholder="[{&quot;label&quot;:&quot;Living room&quot;,&quot;room&quot;:&quot;Living&quot;,&quot;position&quot;:{&quot;x&quot;:1,&quot;y&quot;:1,&quot;z&quot;:1}}]"></textarea></label><label class="content-field"><span class="muted small">Environment JSON</span><textarea id="experienceEnvironment" rows="5" placeholder="{&quot;background&quot;:&quot;#08111c&quot;,&quot;fog&quot;:0.02}"></textarea></label><label class="content-field"><span class="muted small">Controls JSON</span><textarea id="experienceControls" rows="5" placeholder="{&quot;orbit&quot;:true,&quot;zoom&quot;:true,&quot;pan&quot;:true}"></textarea></label><div class="content-editor-actions"><button type="submit" class="primary">Save experience</button><button id="experienceCapture" type="button" class="tool-button">Copy current preview settings</button></div></form><div id="experienceHint" class="muted small">Choose a scene or property to edit its 3D behavior.</div>';
    composer.insertBefore(box,composer.querySelector('.composer-row'));
    var collection=q('#experienceCollection',box),record=q('#experienceRecord',box),form=q('#experienceForm',box),hint=q('#experienceHint',box);
    var content=null;
    function current(){return (content?.[collection.value]||[]).find(x=>x.id===record.value)||null}
    function fill(){record.replaceChildren(...(content?.[collection.value]||[]).map(function(x){var o=document.createElement('option');o.value=x.id;o.textContent=x.title||x.name||x.id;return o}));render()}
    function jsonText(v,empty){return JSON.stringify(v??empty,null,2)}
    function render(){var item=current();q('#experienceCameraPath',box).value=jsonText(item?.cameraPath||[],[]);q('#experienceHotspots',box).value=jsonText(item?.hotspots||[],[]);q('#experienceEnvironment',box).value=jsonText(item?.environment||{},{});q('#experienceControls',box).value=jsonText(item?.controls||{},{});}
    async function load(){var pid=window.cvProjectId;if(!pid)return;try{var j=await fetch('/api/projects/'+encodeURIComponent(pid)+'/content').then(function(r){if(!r.ok)throw new Error('content_unavailable');return r.json()});content=j.content;fill();}catch(e){hint.textContent=e.message}}
    collection.onchange=function(){fill()};record.onchange=render;
    form.onsubmit=async function(e){e.preventDefault();var item=current();if(!item)return;var parse=function(id){try{return JSON.parse(q(id,box).value||'{}')}catch{return null}};var camera=parse('#experienceCameraPath'),hotspots=parse('#experienceHotspots'),environment=parse('#experienceEnvironment'),controls=parse('#experienceControls');if(!Array.isArray(camera)||!Array.isArray(hotspots)||!environment||Array.isArray(environment)||!controls||Array.isArray(controls)){hint.textContent='Camera path and hotspots must be arrays; environment and controls must be JSON objects.';return}var op={type:'update',collection:collection.value,id:item.id,patch:{cameraPath:camera,hotspots,environment,controls}};try{var rr=await fetch('/api/projects/'+encodeURIComponent(window.cvProjectId)+'/content/operations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({operation:op})});var j=await rr.json();if(!rr.ok)throw new Error(j.error||'save_failed');content=j.content;hint.textContent='3D experience settings saved.';fill();record.value=item.id;render();window.cvRefreshContentStudio?.();}catch(err){hint.textContent=err.message}};
    q('#experienceCapture',box).onclick=function(){var text='Camera path:\\n'+q('#experienceCameraPath',box).value+'\\n\\nHotspots:\\n'+q('#experienceHotspots',box).value; navigator.clipboard?.writeText(text);hint.textContent='Copied current camera/hotspot settings.'};
    window.cvRefreshExperienceStudio=load;load();
  }
  function createDeploymentStudio(){
    var details=q('.detail-pane');if(!details||q('#deploymentStudio'))return;
    var box=document.createElement('section');box.id='deploymentStudio';box.className='panel deployment-panel';
    box.innerHTML='<div class="panel-head"><strong>Publish</strong><span id="deployState" class="muted small">Build + verify first</span></div><div id="deployArtifact" class="deploy-artifact"><span class="muted small">No verified artifact yet.</span></div><div id="deployProviders" class="deploy-providers"></div><div id="deployHistory" class="deploy-history"></div><div id="deployHint" class="muted small">Build once, export once, deploy anywhere.</div>';
    details.insertBefore(box,details.firstChild);
    var providers=q('#deployProviders',box),artifactEl=q('#deployArtifact',box),historyEl=q('#deployHistory',box),hint=q('#deployHint',box),stateEl=q('#deployState',box);
    var catalog=[],connected=[];
    function isConnected(id){return id==='manual'||connected.some(x=>x.provider===id)}
    async function load(){
      if(!window.cvProjectId)return;
      try{
        var p=await fetch('/api/deployment/providers').then(r=>r.json());catalog=p.providers||[];connected=p.connected||[];
        var a=await fetch('/api/projects/'+encodeURIComponent(window.cvProjectId)+'/artifact');var aj=await a.json();
        artifactEl.replaceChildren();if(!a.ok){artifactEl.textContent=aj.error||'Verified build required.';stateEl.textContent='Not publishable';stateEl.className='status err'}else{
          var art=aj.artifact;var text=document.createElement('span');text.className='small';text.textContent=art.framework+' · '+art.packageManager+' · '+(art.serverRequired?'server required':'static-compatible')+(art.buildCommand?' · build: '+art.buildCommand:'');artifactEl.append(text);stateEl.textContent='Ready';stateEl.className='status ok';
        }
        renderProviders(aj);await renderHistory();
      }catch(e){hint.textContent=e.message;stateEl.textContent='Unavailable';stateEl.className='status err'}
    }
    function renderProviders(artifactResponse){
      providers.replaceChildren();var art=artifactResponse?.artifact;
      catalog.forEach(function(p){
        var card=document.createElement('div');card.className='deploy-provider';
        var head=document.createElement('div');head.className='deploy-provider-head';var name=document.createElement('strong');name.textContent=p.label;var status=document.createElement('span');status.className='muted small';status.textContent=isConnected(p.id)?'Connected':p.id==='manual'?'Ready':'Not connected';head.append(name,status);
        var desc=document.createElement('p');desc.className='muted small';desc.textContent=p.description;
        var actions=document.createElement('div');actions.className='deploy-provider-actions';
        var button=document.createElement('button');button.type='button';button.className=p.id==='manual'?'primary':'ghost';button.textContent=p.id==='manual'?'Download ZIP':(isConnected(p.id)?'Publish':'Connect');
        button.disabled=Boolean(art&&art.serverRequired&&!p.supports.server&&!['manual'].includes(p.id));button.title=button.disabled?'This provider currently requires a static-compatible project; the mandatory admin portal needs a server runtime.':'';
        button.onclick=function(){openProvider(p,button.disabled)};actions.append(button);
        if(isConnected(p.id)&&p.id!=='manual'){var disc=document.createElement('button');disc.type='button';disc.className='tool-button';disc.textContent='Disconnect';disc.onclick=async function(){await fetch('/api/deployment/providers/'+encodeURIComponent(p.id),{method:'DELETE'});load()};actions.append(disc)}
        card.append(head,desc,actions);providers.append(card);
      });
    }
    function inputLine(label,id,type='text',value=''){var wrap=document.createElement('label');wrap.className='deploy-field';var l=document.createElement('span');l.className='muted small';l.textContent=label;var i=document.createElement('input');i.id=id;i.type=type;i.value=value;wrap.append(l,i);return wrap}
    function openProvider(p,disabled){
      if(disabled){hint.textContent='This project contains a server-backed admin portal. Export or use GitHub/Node/shared hosting until a serverless persistence adapter is configured.';return}
      var form=document.createElement('div');form.className='deploy-dialog';
      form.innerHTML='<div class="deploy-dialog-card"><div class="panel-head"><strong>'+p.label+'</strong><button type="button" class="tool-button" id="deployClose">Close</button></div><div id="deployFields"></div><div class="deploy-dialog-actions"><button type="button" class="ghost" id="deployCancel">Cancel</button><button type="button" class="primary" id="deployGo">'+(p.id==='manual'?'Create ZIP':(isConnected(p.id)?'Publish':'Connect & Publish'))+'</button></div><p id="deployDialogHint" class="muted small">Provider credentials are kept encrypted on the server and are never returned to the browser.</p></div>';
      document.body.append(form);var fields=q('#deployFields',form),go=q('#deployGo',form);
      if(!isConnected(p.id)&&p.id!=='manual'){fields.append(inputLine('Access token / OAuth token','providerSecret','password'));if(p.id==='cloudflare')fields.append(inputLine('Cloudflare account ID','providerAccount'));fields.append(inputLine('Project / site name (optional)','providerName'));}else if(p.id==='github'){fields.append(inputLine('Repository name','repoName'));fields.append(inputLine('Branch','repoBranch','text','main'));var priv=document.createElement('label');priv.className='deploy-check';priv.innerHTML='<input id="repoPrivate" type="checkbox" checked> Private repository';fields.append(priv);fields.append(inputLine('Commit message','commitMessage','text','Publish from Coding Vibes'));}else if(p.id==='vercel'){fields.append(inputLine('Vercel project name','providerName'));}else if(p.id==='netlify'){fields.append(inputLine('Netlify site name','providerName'));}else if(p.id==='cloudflare'){fields.append(inputLine('Cloudflare project name','providerName'));fields.append(inputLine('Cloudflare account ID','providerAccount'));}else if(p.id==='manual'){var note=document.createElement('p');note.className='muted small';note.textContent='The ZIP is built from the latest verified workspace with secrets and temporary build state excluded.';fields.append(note);}
      var close=function(){form.remove()};q('#deployClose',form).onclick=close;q('#deployCancel',form).onclick=close;
      go.onclick=async function(){go.disabled=true;var hintEl=q('#deployDialogHint',form);try{
        if(!isConnected(p.id)&&p.id!=='manual'){var cr=await fetch('/api/deployment/providers/'+encodeURIComponent(p.id)+'/connect',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({secret:q('#providerSecret',form).value,metadata:p.id==='cloudflare'?{accountId:q('#providerAccount',form)?.value||''}:{}})});var cj=await cr.json();if(!cr.ok)throw new Error(cj.error||'provider_connect_failed');connected.push({provider:p.id});}
        var options={};if(p.id==='github')options={repoName:q('#repoName',form)?.value||'',branch:q('#repoBranch',form)?.value||'main',private:q('#repoPrivate',form)?.checked!==false,commitMessage:q('#commitMessage',form)?.value||'Publish from Coding Vibes'};else if(p.id==='cloudflare')options={projectName:q('#providerName',form)?.value||'',accountId:q('#providerAccount',form)?.value||''};else options={projectName:q('#providerName',form)?.value||''};
        var dr=await fetch('/api/projects/'+encodeURIComponent(window.cvProjectId)+'/deploy',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({provider:p.id,options})});var dj=await dr.json();if(!dr.ok)throw new Error(dj.error||'deployment_failed');
        hintEl.textContent=dj.deployment?.url?'Published: '+dj.deployment.url:'Ready';if(p.id==='manual'&&dj.deployment?.id){window.open('/api/deployments/'+dj.deployment.id+'/file','_blank');}hint.textContent='Published successfully.';close();load();
      }catch(e){hintEl.textContent=e.message;go.disabled=false}}
    }
    async function renderHistory(){if(!window.cvProjectId)return;try{var j=await fetch('/api/projects/'+encodeURIComponent(window.cvProjectId)+'/deployments').then(r=>r.json());historyEl.replaceChildren();if(!j.deployments?.length){historyEl.textContent='No deployments yet.';historyEl.className='deploy-history muted small';return}historyEl.className='deploy-history';j.deployments.slice(0,8).forEach(function(d){var row=document.createElement('div');row.className='deploy-history-row';var name=document.createElement('strong');name.textContent=d.provider+' · '+d.status;var meta=document.createElement('span');meta.className='muted small';meta.textContent=new Date(d.created_at).toLocaleString();row.append(name,meta);if(d.url){var a=document.createElement('a');a.href=d.url;a.target='_blank';a.rel='noreferrer';a.textContent='Open';row.append(a)}if(d.provider==='manual'&&d.id){var a=document.createElement('a');a.href='/api/deployments/'+d.id+'/file';a.textContent='ZIP';row.append(a)}historyEl.append(row)})}catch{}}
    window.cvRefreshDeployments=load;load();
  }
  function createAssetStudio(){
    var composer=q('.composer');if(!composer||q('#assetStudio'))return;
    var box=document.createElement('details');box.id='assetStudio';box.className='asset-studio';
    box.innerHTML='<summary>Asset Library <span id="assetSummary" class="muted small">models, images, video & media</span></summary>'+
      '<div class="asset-toolbar"><select id="assetRole"><option value="site-image">Site image</option><option value="product-image">Product image</option><option value="product-model">Product 3D model</option><option value="product-video">Product video</option><option value="scene-model">Scene 3D model</option><option value="scene-poster">Scene poster</option><option value="scene-video">Scene video</option><option value="property-image">Property image</option><option value="property-model">Property 3D model</option><option value="property-video">Property video</option><option value="font">Font</option><option value="texture">Texture</option></select><input id="assetFile" type="file" multiple accept="image/*,video/mp4,video/webm,.glb,.gltf,audio/*,.woff,.woff2,.ttf,.otf"><button id="assetUpload" type="button" class="primary">Upload</button></div>'+
      '<div id="assetList" class="asset-list"></div><div id="assetHint" class="muted small">Upload assets once, then reuse them across your site.</div>';
    composer.insertBefore(box,composer.querySelector('.composer-row'));
    var fileInput=q('#assetFile',box),role=q('#assetRole',box),list=q('#assetList',box),hint=q('#assetHint',box);
    async function loadAssets(){
      var pid=window.cvProjectId;if(!pid)return;try{var j=await fetch('/api/projects/'+encodeURIComponent(pid)+'/assets').then(function(r){if(!r.ok)throw new Error('asset_library_unavailable');return r.json()});list.replaceChildren();(j.assets||[]).forEach(function(a){
        var row=document.createElement('div');row.className='asset-row';
        var info=document.createElement('div');info.className='asset-info';if(a.kind==='image'){var im=document.createElement('img');im.src=a.public_path;im.alt='';im.loading='lazy';info.append(im);}
        var text=document.createElement('div');text.className='asset-text';var name=document.createElement('strong');name.textContent=a.name;var meta=document.createElement('span');meta.className='muted small';meta.textContent=a.kind+' · '+Math.max(1,Math.round(a.size/1024))+' KB · '+a.role;text.append(name,meta);info.append(text);
        var actions=document.createElement('div');actions.className='asset-actions';var copy=document.createElement('button');copy.type='button';copy.className='tool-button';copy.textContent='Copy URL';copy.onclick=function(){navigator.clipboard?.writeText(a.public_path);hint.textContent='Copied '+a.public_path;};
        var attach=document.createElement('button');attach.type='button';attach.className='tool-button';attach.textContent='Attach';attach.onclick=function(){attachAsset(a)};
        var del=document.createElement('button');del.type='button';del.className='tool-button danger-button';del.textContent='Delete';del.onclick=async function(){if(!confirm('Delete this asset?'))return;var pid=window.cvProjectId;var rr=await fetch('/api/projects/'+encodeURIComponent(pid)+'/assets/'+encodeURIComponent(a.id),{method:'DELETE'});if(!rr.ok){hint.textContent='Asset delete failed';return}loadAssets();};
        actions.append(copy,attach,del);row.append(info,actions);list.append(row);
      });var summary=q('#assetSummary',box);if(summary)summary.textContent=(j.assets?.length||0)+' reusable assets';}catch(e){hint.textContent=e.message;}}
    async function attachAsset(a){
      var sel=window.cvContentSelection;if(!sel){hint.textContent='Select a product, property or scene in Content Studio first.';return;}
      var mode=a.kind==='model'?'model':a.kind==='video'?'video':a.kind==='image'?'image':a.kind;
      if(sel.collection==='scenes'&&a.kind==='image')mode='poster';
      try{var pid=window.cvProjectId;var rr=await fetch('/api/projects/'+encodeURIComponent(pid)+'/assets/'+encodeURIComponent(a.id)+'/attach',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({collection:sel.collection,recordId:sel.id,mode})});var j=await rr.json();if(!rr.ok)throw new Error(j.error||'attach_failed');hint.textContent='Attached '+a.name+' to '+sel.collection+'.';window.cvRefreshContentStudio?.();}catch(e){hint.textContent=e.message;}}
    q('#assetUpload',box).onclick=async function(){var pid=window.cvProjectId,files=[...(fileInput.files||[])];if(!pid||!files.length){hint.textContent='Choose one or more assets first.';return}this.disabled=true;for(const file of files){try{var rr=await fetch('/api/projects/'+encodeURIComponent(pid)+'/assets',{method:'POST',headers:{'content-type':file.type||'application/octet-stream','x-asset-name':file.name,'x-asset-role':role.value},body:file});var j=await rr.json();if(!rr.ok)throw new Error(j.error||'upload_failed');hint.textContent='Uploaded '+file.name;}catch(e){hint.textContent=file.name+': '+e.message}}this.disabled=false;fileInput.value='';loadAssets();};
    window.cvRefreshAssetStudio=loadAssets;loadAssets();
  }
  function enhanceEditor(){
    var file=q('#filePreview');if(!file||q('#editorToolbar'))return;
    var bar=document.createElement('div');bar.id='editorToolbar';bar.className='editor-toolbar';
    bar.innerHTML='<span id="editorFileName" class="editor-name">No file selected</span><span class="editor-actions"><button type="button" id="editorFind" class="tool-button">Find</button><button type="button" id="editorCommand" class="tool-button">⌘P</button><span class="muted small">Monaco</span></span>';
    file.parentNode.insertBefore(bar,file);
    var host=document.createElement('div');host.id='monacoEditor';host.className='monaco-editor-host';file.parentNode.insertBefore(host,file);file.classList.add('editor-fallback');
    var editor=null,currentPath='';
    function language(path){var x=String(path||'').split('.').pop().toLowerCase();return ({js:'javascript',jsx:'javascript',ts:'typescript',tsx:'typescript',json:'json',css:'css',scss:'scss',html:'html',md:'markdown',py:'python',go:'go',java:'java',kt:'kotlin',swift:'swift',rs:'rust',dart:'dart',yaml:'yaml',yml:'yaml'})[x]||'plaintext';}
    function sync(){if(editor)file.value=editor.getValue();}
    function setContent(value,path){currentPath=path||currentPath;file.value=String(value||'');var name=q('#editorFileName');if(name)name.textContent=currentPath||'No file selected';if(editor){editor.setValue(file.value);monaco.editor.setModelLanguage(editor.getModel(),language(currentPath));}}
    window.cvSetEditorContent=setContent;window.cvSyncEditor=sync;
    function bootMonaco(){
      if(!window.require)return;
      window.require.config({paths:{vs:'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'}});
      window.require(['vs/editor/editor.main'],function(){
        editor=monaco.editor.create(host,{value:file.value||'',language:language(currentPath),theme:'vs-dark',automaticLayout:true,minimap:{enabled:true},fontSize:13,wordWrap:'off',padding:{top:12,bottom:12},scrollBeyondLastLine:false,bracketPairColorization:{enabled:true}});
        editor.onDidChangeModelContent(sync);
        file.style.display='none';host.style.display='block';
      });
    }
    file.addEventListener('input',sync);
    var files=q('#files');if(files)new MutationObserver(function(){
      var selected=files.querySelector('.file[aria-current="true"]');if(selected){var n=q('#editorFileName');if(n)n.textContent=selected.textContent;}
    }).observe(files,{subtree:true,attributes:true,childList:true});
    q('#editorFind')?.addEventListener('click',function(){if(editor)editor.getAction('actions.find').run();});
    q('#editorCommand')?.addEventListener('click',function(){if(editor)editor.focus();});
    bootMonaco();
  }
  function openPalette(){
    closePalette();
    palette=document.createElement('div');palette.className='command-palette-backdrop';
    palette.innerHTML='<div class="command-palette" role="dialog" aria-label="Command palette">'+
      '<div class="palette-head"><input id="paletteInput" placeholder="Search actions…" autocomplete="off"><kbd>Esc</kbd></div><div id="paletteItems"></div></div>';
    document.body.appendChild(palette);
    var actions=[
      ['Build from prompt','build','Set Build intent'],['Modify existing project','modify','Set Modify intent'],
      ['Debug and repair','debug','Set Debug intent'],['Review quality','review','Set Review intent'],
      ['Re-verify current files','verify','Run verification'],['Save current file','save','Save editor changes'],
      ['Commit verified changes','commit','Commit the verified changeset']
    ];
    function render(filter){
      var box=q('#paletteItems',palette);box.replaceChildren();
      actions.filter(function(a){return (a[0]+' '+a[2]).toLowerCase().indexOf(filter.toLowerCase())>=0}).forEach(function(a){
        var b=document.createElement('button');b.className='palette-item';
        var left=document.createElement('span');left.textContent=a[0];var right=document.createElement('span');right.className='muted small';right.textContent=a[2];
        b.append(left,right);b.onclick=function(){
          if(['build','modify','debug','review'].indexOf(a[1])>=0)setMode(a[1]);else{var target=q('#'+a[1]);if(target)target.click()}
          closePalette();
        };box.appendChild(b);
      });
    }
    q('#paletteInput',palette).oninput=function(e){render(e.target.value)};
    palette.addEventListener('click',function(e){if(e.target===palette)closePalette()});
    q('#paletteInput',palette).focus();render('');
  }
  function closePalette(){if(palette){palette.remove();palette=null}}
  function wireForm(){
    var form=q('#buildForm'),input=q('#request');if(!form||!input)return;
    form.addEventListener('submit',function(e){
      var composed=compose(input.value);if(composed!==input.value){e.preventDefault();input.value=composed;setTimeout(function(){form.requestSubmit()},0)}
    },true);
    input.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();form.requestSubmit()}});
    document.addEventListener('keydown',function(e){
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette()}
      if(e.key==='Escape')closePalette();
    });
  }
  function observeFiles(){
    var files=q('#files');if(!files)return;
    new MutationObserver(function(){qa('.file',files).forEach(function(b){
      if(b.dataset.workspaceBound)return;b.dataset.workspaceBound='1';
      b.addEventListener('click',function(){qa('.file',files).forEach(function(x){x.setAttribute('aria-current',x===b?'true':'false')})});
    })}).observe(files,{childList:true,subtree:true});
  }
  function boot(){createShell();createComposerTools();createTemplateStudio();createContentStudio();createAssetStudio();createExperienceStudio();createDeploymentStudio();enhanceEditor();observeFiles();wireForm();setMode('build')}
  return {boot,setMode,openPalette};
})();
window.addEventListener('DOMContentLoaded',function(){cvWorkspace.boot()});
