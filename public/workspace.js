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
  function createComposerTools(){
    var composer=q('.composer');if(!composer||q('#composerTools'))return;
    var row=document.createElement('div');row.id='composerTools';row.className='composer-tools';
    row.innerHTML='<div class="suggestions">'+
      '<button type="button" data-prompt="Add authentication with protected routes and a polished login flow">Auth</button>'+
      '<button type="button" data-prompt="Make the UI responsive and accessible on mobile and desktop">Responsive</button>'+
      '<button type="button" data-prompt="Find and fix the current failing verification issues">Fix verification</button>'+
      '<button type="button" data-prompt="Review the app for security and obvious UX problems">Review quality</button>'+
      '</div><span id="intentHint" class="muted small">Build mode creates a new application contract.</span>';
    composer.insertBefore(row,composer.querySelector('.composer-row'));
    qa('[data-prompt]',row).forEach(function(b){b.onclick=function(){
      var input=q('#request');input.value=b.dataset.prompt;input.focus();input.setSelectionRange(input.value.length,input.value.length);
      var text=b.dataset.prompt.toLowerCase(),inferred=text.indexOf('fix')>=0?'debug':text.indexOf('review')>=0?'review':'modify';setMode(inferred);
    }});
  }
  function enhanceEditor(){
    var file=q('#filePreview');if(!file||q('#editorToolbar'))return;
    var bar=document.createElement('div');bar.id='editorToolbar';bar.className='editor-toolbar';
    bar.innerHTML='<span id="editorFileName" class="editor-name">No file selected</span><span class="editor-actions"><button type="button" id="formatHint" class="tool-button">Editor</button></span>';
    file.parentNode.insertBefore(bar,file);
    file.addEventListener('input',function(){var name=q('#editorFileName');if(name&&!name.textContent.endsWith(' •'))name.textContent+=' •'});
    var files=q('#files');if(files)new MutationObserver(function(){
      var selected=files.querySelector('.file[aria-current="true"]');
      if(selected){var n=q('#editorFileName');if(n)n.textContent=selected.textContent}
    }).observe(files,{subtree:true,attributes:true,childList:true});
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
  function boot(){createShell();createComposerTools();enhanceEditor();observeFiles();wireForm();setMode('build')}
  return {boot,setMode,openPalette};
})();
window.addEventListener('DOMContentLoaded',function(){cvWorkspace.boot()});
