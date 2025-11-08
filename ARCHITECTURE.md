# ARCHITECTURE — Collaborative Canvas

This document explains the architecture of the Collaborative Canvas project including how data flows, WebSocket message structure, undo/redo strategy, performance choices, and conflict handling.

---

## Data Flow Diagram

The steps below show how drawing events move between users, the server, and all connected clients.

```
User A (Browser)
  ↓ Draws on canvas
  → Sends stroke data to server (draw:delta / draw:end)
  → Sends cursor position to server (cursor)

Server (Node.js + Socket.io)
  ↓ Receives drawing and cursor data
  → Broadcasts to all connected users

User B, User C (Browsers)
  ↓ Receive data from server
  → Render strokes and cursors on their own canvas
```

**Explanation:**
- Each user's action (draw, erase, undo, redo) is sent to the server.
- The server updates the global state and sends the updated data to all users.
- This ensures every connected user sees the same shared canvas.

---

## WebSocket Protocol

### Client → Server Messages

| Event Name | Description |
|-------------|--------------|
| `draw:delta` | Sends small live drawing segments (for real-time preview). |
| `draw:end` | Sends the completed stroke once the user releases the mouse or finger. |
| `cursor` | Sends the user’s cursor position so others can see it live. |
| `undo` | Requests to remove the last stroke. |
| `redo` | Requests to restore the last undone stroke. |
| `clear` | Requests to clear the canvas for all users. |

### Server → Client Messages

| Event Name | Description |
|-------------|--------------|
| `draw:delta` | Broadcasts live drawing segments from other users. |
| `draw:commit` | Sends a confirmed stroke after it’s added to the shared canvas. |
| `cursor` | Updates other users’ cursor positions on screen. |
| `state` | Sends the complete current canvas state (all strokes and users). |
| `users` | Updates the list of connected users and their colors. |

All messages are JSON objects for simplicity.

---

## Undo / Redo Strategy

- The server maintains a list of all strokes drawn by all users.
- Each stroke is stored with information such as stroke ID, color, size, and user ID.
- When a user performs **Undo**, the most recent active stroke made by that user is marked as “removed” (tombstoned) but not deleted.
- When **Redo** is used, the last removed stroke is restored (made active again).
- After every Undo or Redo, the server broadcasts the updated list of active strokes to all users, keeping everyone’s canvas in sync.

This simple method ensures all users always share the same global state.

---

## Performance Decisions

1. **Real-time Delta Updates:** Instead of sending the full drawing each time, only small line segments (`draw:delta`) are sent for smooth performance.  
2. **Server Authoritative State:** The server stores the main version of the canvas, preventing conflicts or desync between users.  
3. **Optimized Canvas Rendering:** The canvas is only fully redrawn when a major change occurs (Undo, Redo, or Clear).  
4. **Device Pixel Ratio Scaling:** The canvas automatically adjusts to the user’s screen resolution for clear visuals.  
5. **Lightweight Communication:** The messages are small and sent only when necessary, reducing lag on slower networks.

These optimizations make the app fast and smooth even when several users draw at once.

---

## Conflict Resolution

- **Simultaneous Drawing:** If multiple users draw at the same time, all strokes are recorded in the order they are received by the server. The later stroke appears on top.  
- **Global Clear:** The clear button removes all drawings for everyone and resets the shared state.  
- **Consistent View:** Each client always follows the server’s version of the canvas, so conflicts are automatically resolved by the latest server update.

---

## Summary

The Collaborative Canvas uses a simple server-authoritative model with WebSockets to synchronize drawing events between multiple users in real time. The approach balances simplicity, speed, and consistency, making it ideal for a student project demonstrating real-time collaboration.

