// client/main.js
import { createSocket } from './websocket.js';
import { initCanvas } from './canvas.js';

const canvas = document.getElementById('canvas');
const canvasAPI = initCanvas(canvas);

const colorPicker = document.getElementById('colorPicker');
const sizePicker = document.getElementById('sizePicker');
const drawBtn = document.getElementById('drawBtn');
const eraserBtn = document.getElementById('eraserBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const clearBtn = document.getElementById('clearBtn');
const usersBox = document.getElementById('usersBox');
const statusSpan = document.getElementById('status');

let localColor = colorPicker?.value || '#000';
let localSize = parseInt(sizePicker?.value || 4, 10);
let isErasing = false;

let canonicalStrokes = [];
let drawing = false;
let current = null;

const socketWrapper = createSocket();
const socket = socketWrapper ? socketWrapper.raw : null;

// helper: render all canonical
function renderAll() {
  canvasAPI.clearAll();
  for (const s of canonicalStrokes) canvasAPI.drawStroke(s);
}

function renderUserList(users) {
  if (!usersBox) return;
  usersBox.innerHTML = '';
  users.forEach(u => {
    // u = { socketId, color, name? }
    const name = u.name || (u.socketId ? u.socketId.slice(0,5) : 'usr');
    const span = document.createElement('span');
    span.className = 'user-badge';
    span.innerHTML = `<span class="user-swatch" style="background:${u.color}"></span><span>${name}</span>`;
    usersBox.appendChild(span);
  });
}


// safe emit
function emitSafe(ev, payload) { if (socketWrapper) socketWrapper.emit(ev, payload); }

// socket handlers if socket exists
if (socketWrapper) {
  socketWrapper.on('state', ({ strokes, users }) => {
    canonicalStrokes = Array.isArray(strokes) ? strokes.slice() : [];
    renderAll();
    // show users
    if (users) renderUserList(users);
    usersBox.innerHTML = (users || []).map(u => `<span style="margin-right:8px"><span style="display:inline-block;width:12px;height:12px;background:${u.color};border-radius:50%;margin-right:6px"></span>${u.socketId.slice(0,5)}</span>`).join('');
  });

  socketWrapper.on('draw:delta', ({ socketId, delta }) => {
    canvasAPI.drawSegment(delta);
    setTimeout(() => renderAll(), 120);
  });

  socketWrapper.on('draw:commit', (op) => {
    if (op && op.stroke) { canonicalStrokes.push(op.stroke); canvasAPI.drawStroke(op.stroke); }
  });

  socketWrapper.on('users', (users) => {
    usersBox.innerHTML = (users || []).map(u => `<span style="margin-right:8px"><span style="display:inline-block;width:12px;height:12px;background:${u.color};border-radius:50%;margin-right:6px"></span>${u.socketId.slice(0,5)}</span>`).join('');
  });

  socketWrapper.on('cursor', ({ socketId, pos, color }) => {
    canvasAPI.updateCursor(socketId, pos, color);
  });

  socketWrapper.on('state', ({ strokes }) => {
    canonicalStrokes = strokes || [];
    renderAll();
  });
}

// pointer handling
canvas.addEventListener('pointerdown', (e) => {
  drawing = true;
  const rect = canvas.getBoundingClientRect();
  const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  current = { points: [pos], color: isErasing ? '#fff' : localColor, size: localSize, composite: isErasing ? 'destination-out' : 'source-over', strokeId: 's_' + Date.now().toString(36) };
});

canvas.addEventListener('pointermove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  // broadcast cursor
  emitSafe('cursor', pos);
  if (!drawing || !current) return;
  current.points.push(pos);
  // draw last segment preview
  const seg = { points: [current.points[current.points.length-2], current.points[current.points.length-1]], color: current.color, size: current.size, composite: current.composite };
  canvasAPI.drawSegment(seg);
  emitSafe('draw:delta', seg);
});

canvas.addEventListener('pointerup', () => {
  if (!drawing || !current) return;
  drawing = false;
  if (current.points.length >= 2) {
    emitSafe('draw:end', current);
    // optimistic local commit
    canonicalStrokes.push(current);
    canvasAPI.drawStroke(current);
  }
  current = null;
});

// toolbar wiring (safe checks)
colorPicker?.addEventListener('input', (e) => { localColor = e.target.value; if (isErasing) { isErasing = false; eraserBtn?.classList.remove('active'); } });
sizePicker?.addEventListener('input', (e) => localSize = parseInt(e.target.value, 10) || localSize);
drawBtn?.addEventListener('click', () => { isErasing = false; eraserBtn?.classList.remove('active'); drawBtn?.classList.add('active'); statusSpan.textContent = 'Draw'; });
eraserBtn?.addEventListener('click', () => { isErasing = !isErasing; eraserBtn.classList.toggle('active', isErasing); statusSpan.textContent = isErasing ? 'Eraser' : 'Draw'; });
undoBtn?.addEventListener('click', () => emitSafe('undo', { type: 'user' }));
redoBtn?.addEventListener('click', () => emitSafe('redo'));
clearBtn?.addEventListener('click', () => emitSafe('clear'));
