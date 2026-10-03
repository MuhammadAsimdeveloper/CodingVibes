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
      '<div class="template-tools"><select id="templateSelect"><option value="">Start from scratch</option></select><input id="templateSearch" placeholder="Search templates…"><select id="templateCategory"><option value="">All categories</option></select><button type="button" id="templateClear" class="tool-button">Clear</button></div>'+
      '<div id="templateGrid" class="template-grid"></div><div id="templateHint" class="muted small">Choose a template to seed the agent. Your custom requirements always take priority.</div>';
    composer.insertBefore(box,composer.querySelector('.composer-row'));
    var search=q('#templateSearch',box),category=q('#templateCategory',box),grid=q('#templateGrid',box);
    var templates=[];
    function render(){
      var term=(search.value||'').toLowerCase(),cat=category.value;
      grid.replaceChildren();
      templates.filter(function(t){return (!cat||t.category===cat)&&(!term||[t.label,t.category].concat(t.tags||[]).join(' ').toLowerCase().includes(term));}).forEach(function(t){
        var b=document.createElement('button');b.type='button';b.className='template-card';b.dataset.templateId=t.id;
        var title=document.createElement('strong');title.textContent=t.label;
        var meta=document.createElement('span');meta.className='muted small';meta.textContent=t.category+' · '+(t.tier==='pro'?'PRO':'FREE');
        var tags=document.createElement('span');tags.className='template-tags muted small';tags.textContent=(t.tags||[]).slice(0,3).join(' · ');
        b.append(title,meta,tags);b.onclick=function(){var sel=q('#templateSelect');if(sel){sel.value=t.id;sel.dispatchEvent(new Event('change'));}q('#templateHint').textContent='Selected: '+t.label+(t.tier==='pro'?' · Pro feature may be required':'')};
        grid.appendChild(b);
      });
    }
    fetch('/api/templates').then(function(r){return r.json()}).then(function(j){templates=j.templates||[];var sel=q('#templateSelect',box);templates.forEach(function(t){var o=document.createElement('option');o.value=t.id;o.textContent=t.label+(t.tier==='pro'?' · PRO':' · FREE');sel.append(o)});var cats=[...new Set(templates.map(t=>t.category))].sort();cats.forEach(function(cat){var o=document.createElement('option');o.value=cat;o.textContent=cat;category.append(o)});render()}).catch(function(){});
    search.addEventListener('input',render);category.addEventListener('change',render);q('#templateClear',box).onclick=function(){var sel=q('#templateSelect');if(sel){sel.value='';sel.dispatchEvent(new Event('change'));}search.value='';category.value='';q('#templateHint').textContent='Choose a template to seed the agent.';render()};
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
      editor.replaceChildren();var item=items().find(function(x){return x.id===currentId})||null;var isProduct=currentCollection==='products';
      var head=document.createElement('div');head.className='content-editor-head';var h=document.createElement('strong');h.textContent=item?'Edit '+(item.title||item.name||'record'):'New '+currentCollection.replace(/([A-Z])/g,' $1');head.append(h);editor.append(head);
      editor.append(input('title','Title / name',item?.title||item?.name||''));
      editor.append(input('description','Description',item?.description||'','textarea'));
      editor.append(input('image','Primary image URL',item?.image||item?.images?.[0]||'','url'));
      if(isProduct){
        var grid=document.createElement('div');grid.className='content-field-grid';
        grid.append(input('price','Price',item?.price??0,'number'),input('compareAtPrice','Compare-at price',item?.compareAtPrice??'','number'),input('sku','SKU',item?.sku||''),input('inventory','Inventory',item?.inventory??0,'number'),input('currency','Currency',item?.currency||content?.settings?.currency||'USD'),input('category','Category',item?.category||''));
        editor.append(grid);editor.append(input('tags','Tags (comma separated)',(item?.tags||[]).join(', ')));editor.append(input('images','Image URLs (one per line)',(item?.images||[]).join('\n'),'textarea'));
        var v=document.createElement('label');v.className='content-field';v.innerHTML='<span class="muted small">Variants JSON</span><textarea name="variants" rows="6" placeholder="[{&quot;title&quot;:&quot;Small&quot;,&quot;sku&quot;:&quot;SKU-S&quot;,&quot;price&quot;:49,&quot;inventory&quot;:10}]">'+escJson(item?.variants||[])+'</textarea>';editor.append(v);
        var custom=document.createElement('label');custom.className='content-field';custom.innerHTML='<span class="muted small">Custom fields JSON</span><textarea name="customFields" rows="4">{}</textarea>';editor.append(custom);
      } else {
        var meta=document.createElement('label');meta.className='content-field';meta.innerHTML='<span class="muted small">Advanced fields JSON</span><textarea name="advanced" rows="8">'+escJson(item?item:{})+'</textarea>';editor.append(meta);
      }
      var status=input('status','Status',item?.status||'active');
      editor.append(status);
      var actions=document.createElement('div');actions.className='content-editor-actions';
      var save=document.createElement('button');save.type='submit';save.className='primary';save.textContent=item?'Save changes':'Add record';actions.append(save);
      if(item){var del=document.createElement('button');del.type='button';del.className='tool-button danger-button';del.textContent='Delete';del.onclick=async function(){if(!confirm('Delete this record?'))return;await op({type:'delete',collection:currentCollection,id:item.id});currentId=null;};actions.append(del);
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
    q('#contentImportFile',box).onchange=async function(e){var file=e.target.files?.[0];if(!file)return;try{var parsed=JSON.parse(await file.text());var projectId=window.cvProjectId;var r=await fetch('/api/projects/'+encodeURIComponent(projectId)+'/content',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({content:parsed,kind:parsed.kit||'business'})});var j=await r.json();if(!r.ok)throw new Error(j.error||'import_failed');content=j.content;currentCollection='products';currentId=null;fillCollections();renderRecords();renderEditor();hint.textContent='Imported content and synchronized the project.';}catch(err){hint.textContent=err.message}e.target.value=''};
    window.cvRefreshContentStudio=fetchContent;
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
  function boot(){createShell();createComposerTools();createTemplateStudio();createContentStudio();enhanceEditor();observeFiles();wireForm();setMode('build')}
  return {boot,setMode,openPalette};
})();
window.addEventListener('DOMContentLoaded',function(){cvWorkspace.boot()});
