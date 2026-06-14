const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, '../data/tasks.json');
const VALID_PRIORITIES = new Set(['high', 'medium', 'low']);

const normalizePriority = (priority) => {
  const key = String(priority || 'medium').toLowerCase();
  return VALID_PRIORITIES.has(key) ? key : 'medium';
};

const readTasks = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const writeTasks = (tasks) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
};

// GET all tasks - sorted newest first
router.get('/', (req, res) => {
  const tasks = readTasks();
  const sorted = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(sorted);
});

// POST create task
router.post('/', (req, res) => {
  const { title, description, dueDate, priority } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const tasks = readTasks();
  const newTask = {
    id: uuidv4(),
    title: title.trim(),
    description: description || '',
    dueDate: dueDate || null,
    priority: normalizePriority(priority),
    status: 'not_started',
    completed: false,
    completedAt: null,
    createdAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  writeTasks(tasks);
  res.status(201).json(newTask);
});

// PUT update task
router.put('/:id', (req, res) => {
  const tasks = readTasks();
  const index = tasks.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Task not found' });
  const previousTask = tasks[index];
  const nextTask = { ...previousTask, ...req.body, id: previousTask.id, createdAt: previousTask.createdAt };

  if (req.body.priority) {
    nextTask.priority = normalizePriority(req.body.priority);
  }

  if (req.body.completed === true && !nextTask.completedAt) {
    nextTask.completedAt = new Date().toISOString();
    nextTask.status = 'done';
  }

  if (req.body.completed === false) {
    nextTask.completedAt = null;
    if (nextTask.status === 'done') nextTask.status = 'in_progress';
  }

  tasks[index] = nextTask;
  writeTasks(tasks);
  res.json(tasks[index]);
});

// DELETE task
router.delete('/:id', (req, res) => {
  const tasks = readTasks();
  const index = tasks.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Task not found' });
  tasks.splice(index, 1);
  writeTasks(tasks);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
