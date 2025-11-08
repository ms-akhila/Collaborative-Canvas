// server/server.js
// Express + Socket.io server with global undo/redo and user list (uses rooms.js).

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const drawingState = require('./drawing-state');
const rooms = require('./rooms'); // <- import the rooms helper

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '..', 'client')));

// color pool to assign per user
const colorPool = ['#1abc9c','#2ecc71','#3498db','#9b59b6','#f39c12','#e67e22','#e74c3c','#34495e'];
function pickColor() {
  return colorPool[Math.floor(Math.random() * colorPool.length)];
}

io.on('connection', (socket) => {
  const roomId = 'main';
  socket.join(roomId);

  // assign a color and register user in rooms registry
  const color = pickColor();
  rooms.addUser(roomId, socket.id, { color });               // <- register
  // send initial canonical state and user list to new client
  socket.emit('state', { strokes: drawingState.getActiveStrokes(roomId), users: rooms.getUsers(roomId) }); // <- send state to new socket
  // broadcast updated user list to everyone in the room
  io.to(roomId).emit('users', rooms.getUsers(roomId));       // <- broadcast users

  // handle live deltas (small segments) - forwarded to others for preview
  socket.on('draw:delta', (payload) => {
    socket.to(roomId).emit('draw:delta', { socketId: socket.id, delta: payload });
  });

  // handle final stroke commit
  socket.on('draw:end', (payload) => {
    const stroke = Object.assign({}, payload, { userId: socket.id });
    const op = drawingState.appendStroke(roomId, stroke);
    io.to(roomId).emit('draw:commit', op);
    io.to(roomId).emit('state', { strokes: drawingState.getActiveStrokes(roomId), users: rooms.getUsers(roomId) });
  });

  // handle undo (per-user by default)
  socket.on('undo', (opts = { type: 'user' }) => {
    const result = drawingState.undo(roomId, { type: opts.type, bySocket: socket.id });
    if (result) {
      io.to(roomId).emit('state', { strokes: drawingState.getActiveStrokes(roomId), users: rooms.getUsers(roomId) });
    }
  });

  // handle redo
  socket.on('redo', () => {
    const result = drawingState.redo(roomId, { bySocket: socket.id });
    if (result) {
      io.to(roomId).emit('state', { strokes: drawingState.getActiveStrokes(roomId), users: rooms.getUsers(roomId) });
    }
  });

  // clear canvas
  socket.on('clear', () => {
    drawingState.clearRoom(roomId);
    io.to(roomId).emit('state', { strokes: [], users: rooms.getUsers(roomId) });
  });

  // cursor updates (for live cursor positions)
  socket.on('cursor', (pos) => {
    const user = rooms.getUser(roomId, socket.id) || {};
    socket.to(roomId).emit('cursor', { socketId: socket.id, pos, color: user.color });
  });

  socket.on('disconnect', () => {
    rooms.removeUser(roomId, socket.id);
    io.to(roomId).emit('users', rooms.getUsers(roomId));
    io.to(roomId).emit('state', { strokes: drawingState.getActiveStrokes(roomId), users: rooms.getUsers(roomId) });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
