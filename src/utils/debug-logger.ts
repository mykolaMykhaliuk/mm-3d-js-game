/**
 * Debug logger that outputs to both console and an on-screen overlay.
 * The overlay is essential for debugging on mobile where DevTools aren't available.
 * Enable by adding ?debug=true to the URL, or it auto-enables when errors occur.
 */

const MAX_OVERLAY_LINES = 50;

let overlayEl: HTMLDivElement | null = null;
let logLines: string[] = [];
let overlayVisible = false;

function getTimestamp(): string {
  const now = new Date();
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  return `${h}:${m}:${s}.${ms}`;
}

function ensureOverlay(): HTMLDivElement {
  if (overlayEl) return overlayEl;

  overlayEl = document.createElement('div');
  overlayEl.id = 'debug-overlay';
  overlayEl.style.cssText = [
    'position: fixed',
    'top: 0',
    'left: 0',
    'width: 100%',
    'height: 40%',
    'background: rgba(0, 0, 0, 0.85)',
    'color: #0f0',
    'font-family: monospace',
    'font-size: 11px',
    'line-height: 1.3',
    'padding: 8px',
    'overflow-y: auto',
    'z-index: 99999',
    'pointer-events: auto',
    'white-space: pre-wrap',
    'word-wrap: break-word',
    'box-sizing: border-box',
    'display: none',
  ].join(';');

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'X';
  closeBtn.style.cssText = [
    'position: absolute',
    'top: 4px',
    'right: 8px',
    'background: #333',
    'color: white',
    'border: 1px solid #666',
    'padding: 2px 8px',
    'font-size: 14px',
    'cursor: pointer',
    'z-index: 100000',
  ].join(';');
  closeBtn.addEventListener('click', () => {
    if (overlayEl) overlayEl.style.display = 'none';
    overlayVisible = false;
  });

  overlayEl.appendChild(closeBtn);
  document.body.appendChild(overlayEl);
  return overlayEl;
}

function showOverlay(): void {
  const el = ensureOverlay();
  el.style.display = 'block';
  overlayVisible = true;
}

function appendToOverlay(text: string): void {
  logLines.push(text);
  if (logLines.length > MAX_OVERLAY_LINES) {
    logLines = logLines.slice(-MAX_OVERLAY_LINES);
  }

  if (overlayVisible) {
    const el = ensureOverlay();
    // Re-render all lines (keep close button as first child)
    while (el.childNodes.length > 1) {
      el.removeChild(el.lastChild!);
    }
    const content = document.createElement('div');
    content.style.marginTop = '24px';
    content.textContent = logLines.join('\n');
    el.appendChild(content);
    el.scrollTop = el.scrollHeight;
  }
}

/**
 * Check if debug mode is enabled via URL param ?debug=true
 */
export function isDebugEnabled(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === 'true';
  } catch {
    return false;
  }
}

/**
 * Initialize the debug overlay. Call early in startup.
 * Auto-shows if ?debug=true is in the URL.
 */
export function initDebugOverlay(): void {
  if (isDebugEnabled()) {
    showOverlay();
  }
}

/**
 * Force-show the overlay (e.g. when an error is caught)
 */
export function forceShowOverlay(): void {
  showOverlay();
}

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

function formatMessage(level: LogLevel, tag: string, message: string): string {
  return `[${getTimestamp()}] [${level}] [${tag}] ${message}`;
}

export const debugLog = {
  info(tag: string, message: string): void {
    const formatted = formatMessage('INFO', tag, message);
    console.log(formatted);
    appendToOverlay(formatted);
  },

  warn(tag: string, message: string): void {
    const formatted = formatMessage('WARN', tag, message);
    console.warn(formatted);
    appendToOverlay(formatted);
  },

  error(tag: string, message: string, err?: unknown): void {
    let formatted = formatMessage('ERROR', tag, message);
    if (err instanceof Error) {
      formatted += `\n  ${err.message}\n  ${err.stack ?? ''}`;
    } else if (err !== undefined) {
      formatted += `\n  ${String(err)}`;
    }
    console.error(formatted);
    appendToOverlay(formatted);
    // Auto-show overlay on error so mobile users can see what went wrong
    forceShowOverlay();
  },
};
