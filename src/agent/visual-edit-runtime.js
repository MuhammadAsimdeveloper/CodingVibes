/**
 * Creates the optional, dependency-free element selector bundled into
 * generated projects. It stays inert until explicitly enabled by the host.
 */
export function visualEditRuntime() {
  return String.raw`/* buildvibe:visual-select v1 */
(function () {
  'use strict';
  if (window.__buildVibeVisualSelectInstalled) return;
  window.__buildVibeVisualSelectInstalled = true;

  var EVENT_NAME = 'buildvibe:visual-select';
  var TOGGLE_NAME = 'buildvibe:visual-edit-toggle';
  var enabled = false;
  var selected = null;
  var lastPayload = null;
  var parentOrigin = null;
  var outline = null;
  var label = null;
  var status = null;

  function addStyle() {
    if (document.getElementById('buildvibe-visual-select-style')) return;
    var style = document.createElement('style');
    style.id = 'buildvibe-visual-select-style';
    style.textContent = '.buildvibe-select-outline{position:fixed;z-index:2147483646;pointer-events:none;box-sizing:border-box;border:2px solid #7c9cff;border-radius:4px;background:rgba(124,156,255,.08);box-shadow:0 0 0 9999px rgba(6,12,28,.08);display:none}.buildvibe-select-label{position:absolute;left:-2px;top:-25px;max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:3px 7px;border-radius:4px 4px 0 0;background:#7c9cff;color:#08111f;font:600 11px/1.4 ui-monospace,monospace}.buildvibe-select-status{position:fixed!important;left:-10000px!important;top:auto!important;width:1px!important;height:1px!important;overflow:hidden!important}body[data-buildvibe-select-enabled=true] *{cursor:crosshair!important}';
    (document.head || document.documentElement).appendChild(style);
  }
  function addOverlay() {
    if (outline) return;
    addStyle();
    outline = document.createElement('div');
    outline.className = 'buildvibe-select-outline';
    outline.setAttribute('aria-hidden', 'true');
    label = document.createElement('span');
    label.className = 'buildvibe-select-label';
    outline.appendChild(label);
    status = document.createElement('div');
    status.className = 'buildvibe-select-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    (document.body || document.documentElement).appendChild(outline);
    (document.body || document.documentElement).appendChild(status);
  }
  function safeClassName(value) {
    return String(value || '').split(/\s+/).filter(function (part) {
      return /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(part);
    }).slice(0, 4);
  }
  function unique(selector) {
    try { return document.querySelectorAll(selector).length === 1; }
    catch (_) { return false; }
  }
  function selectorFor(element) {
    if (!(element instanceof Element)) return '';
    if (element.id && /^[a-zA-Z][a-zA-Z0-9_:-]{0,127}$/.test(element.id)) {
      var idSelector = '#' + (window.CSS && CSS.escape ? CSS.escape(element.id) : element.id);
      if (unique(idSelector)) return idSelector;
    }
    var parts = [];
    var node = element;
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      var part = node.localName;
      if (!part || !/^[a-z][a-z0-9-]*$/i.test(part)) break;
      var classes = safeClassName(node.getAttribute('class'));
      if (classes.length) {
        var classPart = part + '.' + classes.join('.');
        parts.unshift(classPart);
        if (unique(parts.join(' > '))) return parts.join(' > ');
        parts.shift();
      }
      var parent = node.parentElement;
      if (parent) {
        var sameTag = Array.prototype.filter.call(parent.children, function (child) {
          return child.localName === node.localName;
        });
        if (sameTag.length > 1) part += ':nth-of-type(' + (sameTag.indexOf(node) + 1) + ')';
      }
      parts.unshift(part);
      var current = parts.join(' > ');
      if (unique(current)) return current;
      node = parent;
    }
    return parts.join(' > ');
  }
  function showSelection(element) {
    addOverlay();
    selected = element;
    var rect = element.getBoundingClientRect();
    outline.style.display = 'block';
    outline.style.left = Math.max(0, rect.left) + 'px';
    outline.style.top = Math.max(0, rect.top) + 'px';
    outline.style.width = Math.max(0, rect.width) + 'px';
    outline.style.height = Math.max(0, rect.height) + 'px';
    var displayName = element.localName || 'element';
    if (element.id) displayName += '#' + element.id;
    else {
      var classes = safeClassName(element.getAttribute('class'));
      if (classes.length) displayName += '.' + classes.join('.');
    }
    label.textContent = displayName.slice(0, 140);
    status.textContent = 'Selected ' + displayName;
    var box = {
      x: Math.round(rect.x * 100) / 100,
      y: Math.round(rect.y * 100) / 100,
      width: Math.round(rect.width * 100) / 100,
      height: Math.round(rect.height * 100) / 100
    };
    var payload = {
      type: EVENT_NAME,
      selector: selectorFor(element),
      tagName: String(element.localName || '').toLowerCase(),
      text: String(element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 240),
      attributes: {
        id: String(element.id || '').slice(0, 128),
        class: String(element.getAttribute('class') || '').slice(0, 240),
        role: String(element.getAttribute('role') || '').slice(0, 64),
        ariaLabel: String(element.getAttribute('aria-label') || '').slice(0, 160)
      },
      boundingBox: box
    };
    lastPayload = payload;
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
    if (window.parent && window.parent !== window && parentOrigin) window.parent.postMessage(payload, parentOrigin);
  }
  function clearSelection() {
    selected = null;
    lastPayload = null;
    if (outline) outline.style.display = 'none';
    if (status) status.textContent = 'Selection cleared';
  }
  function setEnabled(value, origin) {
    enabled = Boolean(value);
    if (origin && origin !== 'null') parentOrigin = origin;
    if (document.body) document.body.setAttribute('data-buildvibe-select-enabled', String(enabled));
    addOverlay();
    if (!enabled) clearSelection();
    else if (status) status.textContent = 'Visual selection enabled. Choose an element.';
    window.dispatchEvent(new CustomEvent('buildvibe:visual-edit-state', { detail: { enabled: enabled } }));
    return enabled;
  }
  function ignored(element) {
    return !element || element === outline || (outline && outline.contains(element)) ||
      ['html', 'head', 'body', 'script', 'style', 'meta', 'link', 'title'].indexOf(String(element.localName || '').toLowerCase()) !== -1 ||
      Boolean(element.closest && element.closest('[data-buildvibe-visual-select-ignore]'));
  }
  function onClick(event) {
    if (!enabled || !(event.target instanceof Element) || ignored(event.target)) return;
    var target = event.target.closest('a,button,input,select,textarea,label,[role="button"],[role="link"],[data-visual-selectable]') || event.target;
    if (ignored(target)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    showSelection(target);
  }
  window.addEventListener('click', onClick, true);
  window.addEventListener('message', function (event) {
    if (event.source !== window.parent || !event.data || event.data.type !== TOGGLE_NAME) return;
    if (event.origin === 'null') return;
    setEnabled(event.data.enabled === true, event.origin);
  });
  window.addEventListener('keydown', function (event) {
    if (enabled && event.key === 'Escape') clearSelection();
  });
  window.addEventListener('resize', function () {
    if (enabled && selected) showSelection(selected);
  });
  window.addEventListener('scroll', function () {
    if (enabled && selected && outline) {
      var rect = selected.getBoundingClientRect();
      outline.style.left = Math.max(0, rect.left) + 'px';
      outline.style.top = Math.max(0, rect.top) + 'px';
    }
  }, true);
  window.BuildVibeVisualEdit = Object.freeze({
    enable: function () { return setEnabled(true, window === window.parent ? window.location.origin : null); },
    disable: function () { return setEnabled(false); },
    isEnabled: function () { return enabled; },
    getSelected: function () { return lastPayload; },
    eventName: EVENT_NAME
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addOverlay, { once: true });
  else addOverlay();
})();`;
}
