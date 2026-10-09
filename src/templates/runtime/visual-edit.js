(() => {
  const eventName = 'buildvibe:visual-select';
  let enabled = false;
  let selected = null;
  let toolbar = null;

  const style = document.createElement('style');
  style.textContent = [
    'html[data-build-vibe-selecting="true"] *{cursor:crosshair!important}',
    '.build-vibe-visual-hover{outline:2px dashed #60a5fa!important;outline-offset:2px!important}',
    '.build-vibe-visual-selected{outline:3px solid #60a5fa!important;outline-offset:3px!important}',
    '#build-vibe-visual-toolbar{position:fixed;z-index:2147483000;right:14px;bottom:14px;display:flex;gap:12px;align-items:center;max-width:calc(100vw - 28px);padding:12px;border:1px solid #60a5fa;border-radius:12px;background:#0b1220;color:#fff;font:13px/1.4 system-ui,sans-serif}',
    '#build-vibe-visual-toolbar button{padding:7px 10px;border:1px solid #93c5fd;border-radius:8px;background:#1d4ed8;color:#fff;font:inherit}',
    '@media(prefers-reduced-motion:reduce){.build-vibe-visual-hover,.build-vibe-visual-selected{animation:none!important;transition:none!important}}'
  ].join('');
  style.dataset.buildVibeVisualEdit = 'true';

  function makeToolbar() {
    if (toolbar || !document.body) return;
    toolbar = document.createElement('div');
    toolbar.id = 'build-vibe-visual-toolbar';
    toolbar.setAttribute('role', 'status');
    toolbar.setAttribute('aria-live', 'polite');
    const label = document.createElement('span');
    label.textContent = 'Visual selection active · click an element · Esc to exit';
    const done = document.createElement('button');
    done.type = 'button';
    done.textContent = 'Done';
    done.addEventListener('click', () => setEnabled(false));
    toolbar.append(label, done);
    document.body.append(toolbar);
  }

  function selectorFor(element) {
    const parts = [];
    let current = element;
    while (current && current.nodeType === 1 && current !== document.documentElement) {
      let part = current.tagName.toLowerCase();
      if (current.id) {
        part += '#' + current.id.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
        parts.unshift(part);
        break;
      }
      const parent = current.parentElement;
      if (parent) {
        const same = [...parent.children].filter(child => child.tagName === current.tagName);
        if (same.length > 1) part += ':nth-of-type(' + (same.indexOf(current) + 1) + ')';
      }
      parts.unshift(part);
      current = parent;
      if (parts.length >= 8) break;
    }
    return parts.join(' > ');
  }

  function detailFor(element) {
    const css = getComputedStyle(element);
    return {
      selector: selectorFor(element),
      tagName: element.tagName.toLowerCase(),
      text: element.matches('input,textarea,select,[contenteditable="true"]') ? '' : String(element.innerText || '').trim().slice(0, 240),
      css: {
        color: css.color, backgroundColor: css.backgroundColor, fontSize: css.fontSize,
        fontWeight: css.fontWeight, textAlign: css.textAlign, borderRadius: css.borderRadius,
        padding: css.padding, margin: css.margin, gap: css.gap
      }
    };
  }

  function clearSelection() {
    if (selected) selected.classList.remove('build-vibe-visual-selected');
    selected = null;
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    document.documentElement.dataset.buildVibeSelecting = String(enabled);
    if (enabled) {
      if (!document.querySelector('style[data-build-vibe-visual-edit]')) (document.head || document.documentElement).append(style);
      makeToolbar();
    } else {
      clearSelection();
      document.querySelectorAll('.build-vibe-visual-hover').forEach(el => el.classList.remove('build-vibe-visual-hover'));
      toolbar?.remove();
      toolbar = null;
    }
    return enabled;
  }

  document.addEventListener('pointerover', event => {
    if (!enabled || !(event.target instanceof Element) || event.target.closest('#build-vibe-visual-toolbar')) return;
    document.querySelectorAll('.build-vibe-visual-hover').forEach(el => el.classList.remove('build-vibe-visual-hover'));
    event.target.classList.add('build-vibe-visual-hover');
  }, true);
  document.addEventListener('pointerout', event => {
    if (event.target instanceof Element) event.target.classList.remove('build-vibe-visual-hover');
  }, true);
  document.addEventListener('click', event => {
    if (!enabled || !(event.target instanceof Element) || event.target.closest('#build-vibe-visual-toolbar')) return;
    if (['HTML', 'BODY', 'SCRIPT', 'STYLE', 'HEAD'].includes(event.target.tagName)) return;
    event.preventDefault();
    event.stopPropagation();
    clearSelection();
    selected = event.target;
    selected.classList.add('build-vibe-visual-selected');
    const detail = detailFor(selected);
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
    document.dispatchEvent(new CustomEvent(eventName, { detail }));
  }, true);
  document.addEventListener('keydown', event => {
    if (event.altKey && event.shiftKey && event.key.toLowerCase() === 'e') {
      event.preventDefault();
      setEnabled(!enabled);
    } else if (event.key === 'Escape' && enabled) {
      event.preventDefault();
      setEnabled(false);
    }
  }, true);

  window.BuildVibeVisualEdit = Object.freeze({
    setEnabled,
    toggle: () => setEnabled(!enabled),
    isEnabled: () => enabled,
    selected: () => selected ? detailFor(selected) : null
  });

  const query = new URLSearchParams(window.location.search);
  if (query.get('visualEdit') === '1' || document.documentElement.dataset.visualEdit === 'true') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setEnabled(true), { once: true });
    else setEnabled(true);
  }
})();
