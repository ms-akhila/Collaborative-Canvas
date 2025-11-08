// client/canvas.js
export function initCanvas(canvasEl) {
  const ctx = canvasEl.getContext('2d');
  function resize() {
    const toolbarH = document.getElementById('toolbar')?.offsetHeight || 48;
    const w = window.innerWidth;
    const h = window.innerHeight - toolbarH;
    const dpr = window.devicePixelRatio || 1;
    canvasEl.width = Math.floor(w * dpr);
    canvasEl.height = Math.floor(h * dpr);
    canvasEl.style.width = `${w}px`;
    canvasEl.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function drawStroke(stroke) {
    if (!stroke || !stroke.points || stroke.points.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = stroke.composite || 'source-over';
    ctx.strokeStyle = stroke.color || '#000';
    ctx.lineWidth = stroke.size || 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    ctx.stroke();
    ctx.restore();
  }

  function drawSegment(seg) {
    if (!seg || !seg.points || seg.points.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = seg.composite || 'source-over';
    ctx.strokeStyle = seg.color || '#000';
    ctx.lineWidth = seg.size || 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(seg.points[0].x, seg.points[0].y);
    ctx.lineTo(seg.points[1].x, seg.points[1].y);
    ctx.stroke();
    ctx.restore();
  }

  function clearAll() { ctx.clearRect(0, 0, canvasEl.width, canvasEl.height); }

  // cursor DOM:
  // in client/canvas.js — inside initCanvas(...) replace previous cursorMap code with:

const cursorMap = new Map(); // socketId -> { el, hideTimer }

/**
 * shortId: string to display (3 chars) - if not provided, will derive from socketId
 * color: swatch color for the dot
 */
function updateCursor(id, pos, color, shortId = null) {
  let record = cursorMap.get(id);
  if (!record) {
    const el = document.createElement('div');
    el.className = 'remote-cursor';
    el.innerHTML = `
      <div class="dot"></div>
      <div class="label"></div>
    `;
    document.body.appendChild(el);
    record = { el, hideTimer: null };
    cursorMap.set(id, record);
  }
  const { el, hideTimer } = record;
  // set swatch color and initials
  const dot = el.querySelector('.dot');
  const label = el.querySelector('.label');
  if (dot) dot.style.background = color || '#000';
  const idLabel = shortId || (id ? id.slice(0,4) : '');
  if (label) label.textContent = idLabel;

  // Position the cursor element (place slightly above pointer)
  el.style.left = (pos.x) + 'px';
  el.style.top = (pos.y - 12) + 'px'; // a small upward offset so it doesn't sit under pointer

  // make it visible (remove hidden class)
  el.classList.remove('hidden');

  // reset hide timer: hide after 1400ms of inactivity
  if (record.hideTimer) clearTimeout(record.hideTimer);
  record.hideTimer = setTimeout(() => {
    el.classList.add('hidden');
  }, 1400);
}

function removeCursor(id) {
  const rec = cursorMap.get(id);
  if (!rec) return;
  if (rec.hideTimer) clearTimeout(rec.hideTimer);
  rec.el.remove();
  cursorMap.delete(id);
}


  return { drawStroke, drawSegment, clearAll, updateCursor, removeCursor, resize };
}
