// client/websocket.js
export function createSocket() {
  if (typeof io === 'undefined') {
    console.warn('socket.io client not found; running local-only mode');
    return null;
  }
  const sock = io();
  return {
    on: (e, cb) => sock.on(e, cb),
    emit: (e, d) => sock.emit(e, d),
    raw: sock
  };
}
