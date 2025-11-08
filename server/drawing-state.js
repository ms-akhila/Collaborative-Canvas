// server/drawing-state.js
// Simple op-log with tombstones and undo/redo stacks per room.
// Student-level: in-memory only.

const rooms = new Map(); // roomId -> { ops: [], nextSeq: 1, redoStack: [] }

function ensure(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { ops: [], nextSeq: 1, redoStack: [] });
  }
  return rooms.get(roomId);
}

// Append a stroke op and return the op object
function appendStroke(roomId, stroke) {
  const r = ensure(roomId);
  const op = {
    opId: `op${r.nextSeq++}`,
    type: 'stroke',
    stroke,     // stroke: { strokeId, userId, points, color, size, composite }
    tombstone: false,
    ts: Date.now()
  };
  r.ops.push(op);
  // clear redo stack on new op
  r.redoStack.length = 0;
  return op;
}

// Get all ops (including tombstoned) - useful for debugging
function getAllOps(roomId) {
  const r = ensure(roomId);
  return r.ops.slice();
}

// Get active strokes (not tombstoned)
function getActiveStrokes(roomId) {
  const r = ensure(roomId);
  return r.ops.filter(o => o.type === 'stroke' && !o.tombstone).map(o => o.stroke);
}

function clearRoom(roomId) {
  const r = ensure(roomId);
  r.ops = [];
  r.nextSeq = 1;
  r.redoStack = [];
}

// Undo options:
// - type: 'user' => undo last stroke by requesting socket.userId
// - type: 'global' => undo last stroke overall
function undo(roomId, { type = 'user', bySocket = null } = {}) {
  const r = ensure(roomId);
  if (type === 'user' && bySocket) {
    for (let i = r.ops.length - 1; i >= 0; i--) {
      const op = r.ops[i];
      if (op.type === 'stroke' && !op.tombstone && op.stroke.userId === bySocket) {
        op.tombstone = true;
        r.redoStack.push(op.opId);
        return { opId: op.opId, target: op.stroke, by: bySocket };
      }
    }
    return null;
  } else {
    // global last stroke
    for (let i = r.ops.length - 1; i >= 0; i--) {
      const op = r.ops[i];
      if (op.type === 'stroke' && !op.tombstone) {
        op.tombstone = true;
        r.redoStack.push(op.opId);
        return { opId: op.opId, target: op.stroke, by: bySocket };
      }
    }
    return null;
  }
}

function redo(roomId, { bySocket = null } = {}) {
  const r = ensure(roomId);
  if (!r.redoStack || r.redoStack.length === 0) return null;
  const opId = r.redoStack.pop();
  const op = r.ops.find(o => o.opId === opId);
  if (!op) return null;
  op.tombstone = false;
  return { opId: 'redo-' + opId, target: op.stroke, by: bySocket };
}

module.exports = { appendStroke, getAllOps, getActiveStrokes, clearRoom, undo, redo };
