# Collaborative Canvas

This project is a simple real-time collaborative drawing web application developed using HTML5 Canvas, JavaScript, and Node.js with Socket.io.  
It allows multiple users to draw on the same canvas at the same time, with changes visible instantly to all connected users.

---

# Setup Instructions

1. Open the project folder in Visual Studio Code or any code editor.  
2. Open the terminal inside the project folder and run the following commands:

   npm install  
   npm start  

3. After the server starts, open a browser and go to:  
   http://localhost:3000

4. Open this link in two or more browser tabs to test the multi-user drawing feature.

---

# How to Test with Multiple Users

1. Open http://localhost:3000 in two or more browsers or tabs.  
2. Start drawing in one window. The same drawing will appear live in the others.  
3. Each user is automatically assigned a unique color and user number.  
4. The toolbar includes the following options:  
   - Color and size selection  
   - Eraser tool  
   - Undo and Redo buttons  
   - Clear button (removes all drawings for all users)

---

# Known Limitations / Bugs

- The drawings are not saved permanently. If the server restarts, all drawings are cleared.  
- Undo and Redo are global operations and may not always be in perfect sync if many users use them simultaneously.  
- There is no user login or authentication feature.  
- Designed mainly for local use and demonstration.  
- Touch support for mobile devices is limited.

---

# Time Spent on the Project

**Total Time:** Around 15 hours  

| Task | Time Spent |
|------|-------------|
| Project setup and environment configuration | 3 hours |
| Canvas and drawing logic implementation | 2 hours |
| Real-time synchronization with Socket.io | 6 hours |
| Undo/Redo and cursor management | 2 hours |
| Testing, debugging, and documentation | 2 hours |

---

**Developed by:** M S Akhila 
**Project Title:** Real-Time Collaborative Canvas


