// server/rooms.js
// Simple in-memory room registry: track users, their info (color, name, etc.)

const rooms = new Map(); // roomId -> Map(socketId -> userInfo)

function ensure(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Map());
  return rooms.get(roomId);
}

function addUser(roomId, socketId, info = {}) {
  const room = ensure(roomId);
  room.set(socketId, Object.assign({ socketId }, info));
}

function removeUser(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.delete(socketId);
  if (room.size === 0) rooms.delete(roomId);
}

function getUsers(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.values());
}

function getUser(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  return room.get(socketId) || null;
}

function getUserCount(roomId) {
  const room = rooms.get(roomId);
  return room ? room.size : 0;
}

module.exports = {
  addUser,
  removeUser,
  getUsers,
  getUser,
  getUserCount
};
