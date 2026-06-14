 
# Task Manager

A full-stack Personal Task Manager built with React + Node.js/Express. Users can create, view, update, delete, and filter tasks — with subtasks, priority tags, status tracking, drag-and-drop reordering, and a live dashboard.

---

## Live Demo

| Layer    | URL |
|----------|-----|
| Frontend | https://task-manager-zeta-coral.vercel.app |
| Backend  | https://task-manager-api-vdem.onrender.com |

> **Note:** The backend is hosted on Render's free tier and may take 30–60 seconds to wake up on first request.

---

## Tech Stack

| Layer       | Technology                        | Why                                               |
|-------------|-----------------------------------|---------------------------------------------------|
| Frontend    | React + Vite                      | Fast dev server, functional components with hooks |
| Styling     | Tailwind CSS                      | Utility-first, easy responsive design             |
| Drag & Drop | @dnd-kit                          | Lightweight, accessible drag-and-drop             |
| Backend     | Node.js + Express                 | Minimal, easy to structure REST routes            |
| Storage     | JSON file (`server/data/tasks.json`) | Simple persistence without a database setup    |
| Testing     | Jest + Supertest                  | Meaningful API route tests                        |
| Deployment  | Vercel (frontend) + Render (backend) | Both have free tiers and easy CI from GitHub  |

---

## How to Run Locally

> Assumes only Node.js is installed. Clone the repo first:

```bash
git clone https://github.com/mayank441/task_manager.git
cd task_manager
```

### Start the backend

```bash
cd server
npm install
npm start
```

Server runs on **http://localhost:3000**

### Start the frontend (new terminal)

```bash
cd client
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

> Make sure `client/src/api.js` points to `http://localhost:3000` for local development.

---

## API Documentation

Base URL (production): `https://task-manager-api-vdem.onrender.com`

### `GET /api/tasks`
Returns all tasks sorted by creation date (newest first).

**Response**
```json
[
  {
    "id": "1718300000000",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "dueDate": "2026-06-15",
    "dueTime": "10:00",
    "completed": false,
    "status": "in_progress",
    "priority": "medium",
    "subtasks": [],
    "createdAt": "2026-06-13T10:00:00.000Z",
    "completedAt": null
  }
]
```

---

### `POST /api/tasks`
Create a new task.

**Request body**
```json
{
  "title": "Buy groceries",
  "description": "optional",
  "dueDate": "2026-06-15",
  "dueTime": "10:00",
  "priority": "medium"
}
```

**Response** — `201 Created` with the created task object.

---

### `PUT /api/tasks/:id`
Update an existing task (any fields).

**Request body** — any subset of task fields:
```json
{
  "completed": true,
  "status": "done",
  "completedAt": "2026-06-14T18:00:00.000Z"
}
```

**Response** — updated task object.

---

### `DELETE /api/tasks/:id`
Delete a task by ID.

**Response** — `200 OK`
```json
{ "message": "Task deleted" }
```

---

## Project Structure

```
task_manager/
├── client/                      # React + Vite frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── App.jsx          # Root component, state, DnD context
│       │   ├── TaskForm.jsx     # Add new task form
│       │   ├── TaskItem.jsx     # Individual task card with subtasks
│       │   ├── FilterBar.jsx    # All / Active / Completed filter
│       │   └── Dashboard.jsx    # Stats, progress bar, recent tasks
│       ├── api.js               # Axios calls to backend
│       └── index.css            # Tailwind + custom glassmorphism styles
│
├── server/                      # Node.js + Express backend
│   ├── data/
│   │   └── tasks.json           # JSON file storage
│   ├── routes/
│   │   └── tasks.js             # CRUD route handlers
│   ├── __tests__/
│   │   └── tasks.test.js        # Jest + Supertest API tests
│   └── index.js                 # Express app entry point
│
└── README.md
```

---

## What Works

- Full CRUD — create, read, update, delete tasks
- Filter by All / Active / Completed
- Search tasks by title
- Mark complete / incomplete (toggle)
- Overdue detection and visual badge
- Status tracking — Not Started / In Progress / Done
- Priority tags — High / Medium / Low
- Subtasks with individual time setting and completion tracking
- Drag-and-drop reordering
- Progress bar per task and overall dashboard progress
- Task duration tracking (time from creation to completion)
- Due date + time with clock picker
- Dashboard with stat cards, status panel, recent tasks
- Persistent storage via JSON file on the server
- Jest tests for POST and DELETE routes
- Deployed and accessible live

---

## Next Steps

- **Authentication** — right now it assumes one user; adding JWT-based auth would make it multi-user
- **Database** — swap the JSON file for SQLite or PostgreSQL for concurrent writes and better querying
- **Optimistic UI updates** — currently waits for API response before re-rendering; optimistic updates would feel snappier
- **More tests** — only POST and DELETE are tested; GET and PUT routes and frontend components deserve coverage
- **Notifications / reminders** — alert users when a task is due soon
- **Dark/light mode toggle** — UI is dark-only currently

---

## Notes

- AI tools were used during development for UI component iteration and bug fixing. Every line of code has been reviewed and understood.
- The backend wakes from sleep on Render's free tier — first load may be slow.