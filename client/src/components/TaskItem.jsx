import { useState } from 'react';
import { toggleTask, deleteTask, updateTask } from '../api';

export default function TaskItem({ task, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [dueDate, setDueDate] = useState(task.dueDate || '');

  const isOverdue = task.dueDate && !task.completed &&
    new Date(task.dueDate) < new Date();

  const handleToggle = async () => {
    await toggleTask(task.id);
    onUpdate();
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id);
      onUpdate();
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    await updateTask(task.id, { title, description, dueDate });
    setEditing(false);
    onUpdate();
  };

  if (editing) {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded p-2 mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded p-2 mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full border rounded p-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex gap-2">
          <button onClick={handleEdit} className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">Save</button>
          <button onClick={() => setEditing(false)} className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-4 rounded-lg shadow mb-3 border-l-4 ${isOverdue ? 'border-red-500' : task.completed ? 'border-green-500' : 'border-blue-400'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleToggle}
            className="mt-1 w-4 h-4 cursor-pointer"
          />
          <div>
            <p className={`font-medium text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {task.title}
            </p>
            {task.description && <p className="text-xs text-gray-500 mt-1">{task.description}</p>}
            {task.dueDate && (
              <p className={`text-xs mt-1 ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                Due: {new Date(task.dueDate).toLocaleDateString()}
                {isOverdue && ' — Overdue!'}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 ml-2">
          <button onClick={() => setEditing(true)} className="text-xs text-blue-500 hover:text-blue-700">Edit</button>
          <button onClick={handleDelete} className="text-xs text-red-500 hover:text-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
}