window.Toolnest = window.Toolnest || {};
window.Toolnest.ui = window.Toolnest.ui || {};
window.Toolnest.ui.scrollToSection = function (id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
};
window.scrollToSection = window.Toolnest.ui.scrollToSection;

window.Toolnest.ui.toggleNav = function () { document.querySelector('nav').classList.toggle('open'); };
window.toggleNav = window.Toolnest.ui.toggleNav;
const THEME_KEY = 'tn-theme';

function applyTheme(theme) {
  if (!theme) {
    // look for preference
    const pref = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    theme = localStorage.getItem(THEME_KEY) || pref;
  }
  theme = theme || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  updateUi(theme);
}

const THEMES = ['light', 'dark', 'unnatureall'];
function toggleTheme() {
  const curr = localStorage.getItem(THEME_KEY) || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const idx = THEMES.indexOf(curr);
  const next = THEMES[(idx + 1) % THEMES.length];
  applyTheme(next);
}

function updateUi(theme) {
  const btns = document.querySelectorAll('.theme-toggle');
  btns.forEach(b => {
    const emoji = theme === 'dark' ? '☀️' : theme === 'unnatureall' ? '🌀' : '🌙';
    b.textContent = emoji;
    b.setAttribute('aria-pressed', theme !== 'light' ? 'true' : 'false');
    b.setAttribute('data-theme', theme);
    const label = theme === 'unnatureall' ? 'Unnatural' : theme.charAt(0).toUpperCase() + theme.slice(1);
    b.title = `Theme: ${label}`;
  });
}

// attach to body for other modules to call
window.Toolnest = window.Toolnest || {};
window.Toolnest.theme = { applyTheme, toggleTheme };

// wire UI
if (document.readyState === 'interactive' || document.readyState === 'complete') init();
else document.addEventListener('DOMContentLoaded', init);

function init() {
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => toggleTheme());
  });
  applyTheme();
}

export { applyTheme, toggleTheme };
const processingOverlay = (() => {
  let node = null;
  let counter = 0; // nested operations
  function createNode() {
    const overlay = document.createElement('div');
    overlay.id = 'tn-processing';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('role', 'status');
    overlay.className = 'tn-processing-overlay';
    overlay.innerHTML = `
      <div class="tn-progress-inner" aria-live="polite">Processing…</div>
    `;
    document.body.appendChild(overlay);
    node = overlay;
  }
  return {
    start(msg = 'Processing…') {
      if (!node) createNode();
      counter++;
      node.setAttribute('aria-hidden', 'false');
      node.querySelector('.tn-progress-inner').textContent = msg;
      document.body.classList.add('tn-processing-active');
      // trap focus
      node.tabIndex = -1;
      node.focus();
    },
    update(msg) {
      if (!node) return;
      node.querySelector('.tn-progress-inner').textContent = msg;
    },
    stop() {
      if (!node) return;
      counter = Math.max(0, counter - 1);
      if (counter === 0) {
        node.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('tn-processing-active');
      }
    }
  };
})();

export default processingOverlay;
// ============ Navigation helpers ============
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function goToTool(page) {
  window.location.href = `tools/${page}`;
}

// ============ Text Cleaner ============
function cleanText(input) {
  let text = input;
  text = text.replace(/<[^>]+>/g, ' ');
  const htmlEntities = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
    '&nbsp;': ' ', '&copy;': '©', '&reg;': '®', '&deg;': '°'
  };
  Object.entries(htmlEntities).forEach(([ent, char]) => {
    text = text.replace(new RegExp(ent, 'g'), char);
  });
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function runTextCleaner() {
  const inputEl = document.getElementById('inputText');
  const outputEl = document.getElementById('outputText');
  if (!inputEl || !outputEl) { alert('Elements not found'); return; }
  try {
    const input = inputEl.value.trim();
    if (!input) { alert('Please enter text'); return; }
    const output = cleanText(input);
    outputEl.value = output;
    showNotification('✓ Text cleaned successfully!', 'success');
  } catch (e) {
    showNotification('✗ Error cleaning text', 'error');
  }
}


// ============ Image Resizer / Converter ============
function resizeImage(file, width, height) {
  if (!file) { showNotification('✗ Select an image first', 'error'); return; }
  if (!width || !height) { showNotification('✗ Enter width and height', 'error'); return; }
  if (width <= 0 || height <= 0) { showNotification('✗ Dimensions must be > 0', 'error'); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        downloadBlob(blob, `resized_${width}x${height}.${file.type.split('/')[1]}`);
        showNotification('✓ Image resized!', 'success');
      }, file.type);
    };
    img.onerror = () => showNotification('✗ Invalid image', 'error');
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function convertImage(file, format) {
  if (!file) { showNotification('✗ Select an image first', 'error'); return; }
  if (!format) { showNotification('✗ Select a format', 'error'); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        downloadBlob(blob, `converted.${format}`);
        showNotification(`✓ Image converted to ${format.toUpperCase()}!`, 'success');
      }, `image/${format}`);
    };
    img.onerror = () => showNotification('✗ Invalid image', 'error');
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ============ QR Code Generator ============
function generateQRCode(text) {
  const target = document.getElementById('qrTarget');
  if (!target) { showNotification('✗ Target element not found', 'error'); return; }
  if (!text || !text.trim()) { showNotification('✗ Enter text or URL', 'error'); return; }

  try {
    target.innerHTML = '';
    new QRCode(target, { text: text.trim(), width: 200, height: 200 });
    showNotification('✓ QR code generated!', 'success');
  } catch (e) {
    showNotification('✗ Failed to generate QR code', 'error');
  }
}

// ============ Base64 Encoder / Decoder ============
function base64Encode() {
  const inputEl = document.getElementById('base64Input');
  const outputEl = document.getElementById('base64Output');
  if (!inputEl || !outputEl) { showNotification('✗ Elements not found', 'error'); return; }

  try {
    const input = inputEl.value.trim();
    if (!input) { showNotification('✗ Enter text to encode', 'error'); return; }
    const encoded = btoa(unescape(encodeURIComponent(input)));
    outputEl.value = encoded;
    showNotification('✓ Base64 encoded!', 'success');
  } catch (e) {
    showNotification('✗ Encoding failed', 'error');
  }
}

function base64Decode() {
  const inputEl = document.getElementById('base64Input');
  const outputEl = document.getElementById('base64Output');
  if (!inputEl || !outputEl) { showNotification('✗ Elements not found', 'error'); return; }

  try {
    const input = inputEl.value.trim();
    if (!input) { showNotification('✗ Enter Base64 to decode', 'error'); return; }
    const decoded = decodeURIComponent(escape(atob(input)));
    outputEl.value = decoded;
    showNotification('✓ Base64 decoded!', 'success');
  } catch (e) {
    showNotification('✗ Invalid Base64 string', 'error');
  }
}

// ============ Utility Functions ============
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
		position: fixed;
		top: 20px;
		right: 20px;
		padding: 12px 16px;
		border-radius: 8px;
		font-weight: 600;
		z-index: 9999;
		animation: slideIn 300ms ease;
		${type === 'success' ? 'background: #10b981; color: white;' : ''}
		${type === 'error' ? 'background: #ef4444; color: white;' : ''}
		${type === 'info' ? 'background: #3b82f6; color: white;' : ''}
	`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// ============ Service Worker Registration ============
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('../sw.js')
      .then(() => console.log('✓ Service Worker registered'))
      .catch(err => console.warn('✗ SW registration failed:', err));
  });
}
// ============ Navigation helpers ============
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function goToTool(page) {
  window.location.href = `tools/${page}`;
}

// ============ Text Cleaner ============
function cleanText(input) {
  let text = input;
  text = text.replace(/<[^>]+>/g, ' ');
  const htmlEntities = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
    '&nbsp;': ' ', '&copy;': '©', '&reg;': '®', '&deg;': '°'
  };
  Object.entries(htmlEntities).forEach(([ent, char]) => {
    text = text.replace(new RegExp(ent, 'g'), char);
  });
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function runTextCleaner() {
  const inputEl = document.getElementById('inputText');
  const outputEl = document.getElementById('outputText');
  if (!inputEl || !outputEl) { alert('Elements not found'); return; }
  try {
    const input = inputEl.value.trim();
    if (!input) { alert('Please enter text'); return; }
    const output = cleanText(input);
    outputEl.value = output;
    showNotification('✓ Text cleaned successfully!', 'success');
  } catch (e) {
    showNotification('✗ Error cleaning text', 'error');
  }
}

// ============ Image Resizer / Converter ============
function resizeImage(file, width, height) {
  if (!file) { showNotification('✗ Select an image first', 'error'); return; }
  if (!width || !height) { showNotification('✗ Enter width and height', 'error'); return; }
  if (width <= 0 || height <= 0) { showNotification('✗ Dimensions must be > 0', 'error'); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        downloadBlob(blob, `resized_${width}x${height}.${file.type.split('/')[1]}`);
        showNotification('✓ Image resized!', 'success');
      }, file.type);
    };
    img.onerror = () => showNotification('✗ Invalid image', 'error');
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function convertImage(file, format) {
  if (!file) { showNotification('✗ Select an image first', 'error'); return; }
  if (!format) { showNotification('✗ Select a format', 'error'); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        downloadBlob(blob, `converted.${format}`);
        showNotification(`✓ Image converted to ${format.toUpperCase()}!`, 'success');
      }, `image/${format}`);
    };
    img.onerror = () => showNotification('✗ Invalid image', 'error');
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ============ Base64 Encoder / Decoder ============
function base64Encode() {
  const inputEl = document.getElementById('base64Input');
  const outputEl = document.getElementById('base64Output');
  if (!inputEl || !outputEl) { showNotification('✗ Elements not found', 'error'); return; }

  try {
    const input = inputEl.value.trim();
    if (!input) { showNotification('✗ Enter text to encode', 'error'); return; }
    const encoded = btoa(unescape(encodeURIComponent(input)));
    outputEl.value = encoded;
    showNotification('✓ Base64 encoded!', 'success');
  } catch (e) {
    showNotification('✗ Encoding failed', 'error');
  }
}

function base64Decode() {
  const inputEl = document.getElementById('base64Input');
  const outputEl = document.getElementById('base64Output');
  if (!inputEl || !outputEl) { showNotification('✗ Elements not found', 'error'); return; }

  try {
    const input = inputEl.value.trim();
    if (!input) { showNotification('✗ Enter Base64 to decode', 'error'); return; }
    const decoded = decodeURIComponent(escape(atob(input)));
    outputEl.value = decoded;
    showNotification('✓ Base64 decoded!', 'success');
  } catch (e) {
    showNotification('✗ Invalid Base64 string', 'error');
  }
}

// ============ Utility Functions ============
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
		position: fixed;
		top: 20px;
		right: 20px;
		padding: 12px 16px;
		border-radius: 8px;
		font-weight: 600;
		z-index: 9999;
		animation: slideIn 300ms ease;
		${type === 'success' ? 'background: #10b981; color: white;' : ''}
		${type === 'error' ? 'background: #ef4444; color: white;' : ''}
		${type === 'info' ? 'background: #3b82f6; color: white;' : ''}
	`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function toggleNav() {
  const nav = document.querySelector('nav');
  if (nav) nav.classList.toggle('open');
}

// ============ Nav initialization ============
function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('header nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('open');
  });

  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }));

  const links = Array.from(nav.querySelectorAll('a')).filter(l => l.hash || l.getAttribute('href').startsWith('#'));
  const sections = links.map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean);
  window.addEventListener('scroll', () => {
    let activeIndex = -1;
    sections.forEach((s, idx) => {
      const rect = s.getBoundingClientRect();
      if (rect.top <= 96) activeIndex = idx;
    });
    links.forEach((link, idx) => link.classList.toggle('active', idx === activeIndex));
  });
}

document.addEventListener('DOMContentLoaded', initNav);

// ============ Service Worker Registration ============
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('../sw.js')
      .then(() => console.log('✓ Service Worker registered'))
      .catch(err => console.warn('✗ SW registration failed:', err));
  });
}// Small lazy-loader for per-tool modules.
// Each toolPage should set <body data-module="../js/tools/text-cleaner.js">

let _loaded = false;
export async function preloadModule() {
  if (_loaded) return;
  const modulePath = document.body.dataset.module;
  if (!modulePath) return;
  _loaded = true;
  try {
    await import(modulePath);
  } catch (e) {
    console.error('Failed to load module', modulePath, e);
  }
}

// Load on first interaction for lazy-loading
function bind() {
  const onFirst = (e) => {
    preloadModule();
    window.removeEventListener('pointerdown', onFirst);
    window.removeEventListener('keydown', onFirst);
  };
  window.addEventListener('pointerdown', onFirst, { once: true });
  window.addEventListener('keydown', onFirst, { once: true });
}

if (document.readyState === 'complete' || document.readyState === 'interactive') bind();
else document.addEventListener('DOMContentLoaded', bind);
import processing from './processing.js';

window.Toolnest = window.Toolnest || {};
window.Toolnest.processing = processing;

export async function copyText(text) {
  // Modern async clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback below
    }
  }

  // Fallback for older browsers (including Safari <= 13)
  // This fallback uses a hidden textarea and document.execCommand('copy')
  // Note: execCommand is deprecated but still required for older UAs.
  try {
    const ta = document.createElement('textarea');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '0';
    ta.value = text;
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(ta);
    return successful;
  } catch (err) {
    return false;
  }
}

