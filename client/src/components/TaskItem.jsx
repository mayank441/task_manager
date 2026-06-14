import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { updateTask, deleteTask } from '../api';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const isOverdue = (task) => {
  if (!task.dueDate || task.completed) return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
};

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', dot: 'bg-gray-400', text: 'text-gray-300', ring: 'border-gray-500/50 bg-gray-500/10', pulse: false },
  in_progress: { label: 'In Progress', dot: 'bg-blue-400', text: 'text-blue-300', ring: 'border-blue-400/50 bg-blue-400/10', pulse: true },
  done: { label: 'Done', dot: 'bg-green-400', text: 'text-green-300', ring: 'border-green-400/50 bg-green-400/10', pulse: false },
};

const PRIORITY_CONFIG = {
  high: { label: 'High', ring: 'border-red-400/50 bg-red-500/15 text-red-200' },
  medium: { label: 'Medium', ring: 'border-amber-300/50 bg-amber-400/15 text-amber-100' },
  low: { label: 'Low', ring: 'border-emerald-300/50 bg-emerald-400/15 text-emerald-100' },
};

const getPriority = (priority) => {
  const key = String(priority || 'medium').toLowerCase();
  return PRIORITY_CONFIG[key] ? key : 'medium';
};

const getProgressPercent = ({ completed, status }, subtasks) => {
  if (completed || status === 'done') return 100;
  if (subtasks.length > 0) {
    const completedCount = subtasks.filter((subtask) => subtask.done).length;
    return Math.round((completedCount / subtasks.length) * 100);
  }
  if (status === 'in_progress') return 50;
  return 0;
};

const formatDuration = (start, end) => {
  if (!start || !end) return null;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) return null;

  const totalMinutes = Math.max(1, Math.round((endTime - startTime) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

function StatusDropdown({ anchorRef, open, status, onSelect, onClose }) {
  const [pos, setPos] = useState({ top: 0, left: 0, bottom: 'auto' });
  const menuRef = useRef(null);

  useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 170) {
        setPos({ top: 'auto', bottom: window.innerHeight - rect.top + 6, left: rect.left });
      } else {
        setPos({ top: rect.bottom + 6, bottom: 'auto', left: rect.left });
      }
    }
  }, [open, anchorRef]);

  useEffect(() => {
    const handleClick = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        anchorRef.current && !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: pos.top !== 'auto' ? pos.top : 'auto',
        bottom: pos.bottom !== 'auto' ? pos.bottom : 'auto',
        left: pos.left,
        zIndex: 9999,
        minWidth: '165px',
        background: 'rgba(15, 8, 40, 0.98)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
      }}
    >
      <p style={{
        color: 'rgba(168,85,247,0.75)',
        fontSize: '15px',
        letterSpacing: 0,
        textTransform: 'uppercase',
        padding: '10px 14px 4px',
        fontFamily: "'Brush Script MT', 'Segoe Print', cursive",
      }}>
        Set Status
      </p>

      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
        const dotColor = key === 'not_started' ? '#9ca3af' : key === 'in_progress' ? '#60a5fa' : '#4ade80';
        const txtColor = key === 'not_started' ? '#d1d5db' : key === 'in_progress' ? '#93c5fd' : '#86efac';
        const isActive = key === status;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              fontSize: '17px',
              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Brush Script MT', 'Segoe Print', cursive",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.1)' : 'transparent'; }}
          >
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              flexShrink: 0,
              background: dotColor,
              boxShadow: key === 'in_progress' ? `0 0 6px ${dotColor}` : 'none',
              animation: key === 'in_progress' ? 'pulse 2s infinite' : 'none',
            }} />
            <span style={{ color: txtColor, flex: 1, textAlign: 'left' }}>{cfg.label}</span>
            {isActive && <span style={{ color: '#a855f7', fontSize: '14px' }}>✓</span>}
          </button>
        );
      })}
    </div>,
    document.body
  );
}

export default function TaskItem({ task, onUpdate, density = 'comfortable' }) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.split('T')[0] : '');
  const [priority, setPriority] = useState(getPriority(task.priority));
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [showSubtasks, setShowSubtasks] = useState(false);

  const statusBtnRef = useRef(null);

  const overdue = isOverdue(task);
  const completedSubs = subtasks.filter((s) => s.done).length;
  const status = task.status || 'not_started';
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  const priorityKey = getPriority(task.priority);
  const priorityCfg = PRIORITY_CONFIG[priorityKey];
  const progressPercent = getProgressPercent({ completed: task.completed, status }, subtasks);
  const completionDuration = task.completed ? formatDuration(task.createdAt, task.completedAt) : null;
  const durationLabel = task.completed ? (completionDuration || 'not tracked') : null;
  const isSlim = density === 'slim';

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const handleToggle = async () => {
    const nextCompleted = !task.completed;
    await updateTask(task.id, {
      ...task,
      completed: nextCompleted,
      completedAt: nextCompleted ? (task.completedAt || new Date().toISOString()) : null,
      status: nextCompleted ? 'done' : 'in_progress',
    });
    onUpdate();
  };

  const handleDelete = async () => {
    await deleteTask(task.id);
    onUpdate();
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    await updateTask(task.id, { ...task, title, description, dueDate, priority, subtasks });
    setIsEditing(false);
    onUpdate();
  };

  const handleStatusChange = async (newStatus) => {
    setShowStatusMenu(false);
    const nextCompleted = newStatus === 'done';
    await updateTask(task.id, {
      ...task,
      status: newStatus,
      completed: nextCompleted,
      completedAt: nextCompleted ? (task.completedAt || new Date().toISOString()) : null,
    });
    onUpdate();
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    const updated = [...subtasks, { id: Date.now().toString(), text: newSubtask.trim(), done: false }];
    setSubtasks(updated);
    setNewSubtask('');
    await updateTask(task.id, { ...task, subtasks: updated });
    onUpdate();
  };

  const toggleSubtask = async (id) => {
    const updated = subtasks.map((s) => s.id === id ? { ...s, done: !s.done } : s);
    setSubtasks(updated);
    await updateTask(task.id, { ...task, subtasks: updated });
    onUpdate();
  };

  const deleteSubtask = async (id) => {
    const updated = subtasks.filter((s) => s.id !== id);
    setSubtasks(updated);
    await updateTask(task.id, { ...task, subtasks: updated });
    onUpdate();
  };

  const fieldClass = 'w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass-rgb shadow-lg transition-all duration-300 animate-fade-slide
        ${isSlim ? 'p-3.5' : 'p-5'}
        ${task.completed ? 'opacity-50' : ''}
        ${isDragging ? 'scale-105 shadow-2xl' : 'hover:scale-[1.005]'}
      `}
    >
      {overdue && !isSlim && (
        <span className="inline-block mb-3 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-base font-medium">
          Overdue
        </span>
      )}

      {confirmDelete && (
        <div className="mb-3 p-3 rounded-xl bg-red-500/20 border border-red-400/40 animate-fade-slide">
          <p className="text-red-200 text-lg mb-3">Delete this task?</p>
          <div className="flex gap-3">
            <button onClick={handleDelete}
              className="px-4 py-2 rounded-lg bg-red-500 text-white text-base hover:bg-red-600 transition-all">
              Yes, delete
            </button>
            <button onClick={() => setConfirmDelete(false)}
              className="px-4 py-2 rounded-lg bg-white/10 text-purple-200 text-base hover:bg-white/20 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isEditing ? (
        <div className="flex flex-col gap-2 animate-fade-slide">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className={`${fieldClass} placeholder-purple-300`}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={fieldClass} />
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={fieldClass}>
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label} priority</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-1">
            <button onClick={handleSave}
              className="px-5 py-2 rounded-lg rgb-bg text-white text-lg font-medium hover:scale-105 transition-all duration-200">
              Save
            </button>
            <button onClick={() => setIsEditing(false)}
              className="px-5 py-2 rounded-lg bg-white/10 text-purple-200 text-lg hover:bg-white/20 transition-all duration-200">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={`flex flex-col ${isSlim ? 'gap-2.5' : 'gap-4'}`}>
          <div className={`flex gap-3.5 ${isSlim ? 'items-center' : 'items-start'}`}>
            <div {...attributes} {...listeners}
              className="mt-1 cursor-grab active:cursor-grabbing text-purple-400 hover:text-white transition-colors select-none text-xl leading-none">
              ::
            </div>

            <input
              type="checkbox"
              checked={task.completed}
              onChange={handleToggle}
              className="mt-1 w-5 h-5 accent-purple-500 cursor-pointer shrink-0"
            />

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className={`font-medium truncate ${isSlim ? 'text-lg' : 'text-2xl'} ${task.completed ? 'line-through text-purple-400' : 'text-white'}`}>
                  {task.title}
                </p>
                <span className={`px-3 py-1 rounded-full text-base font-semibold border ${priorityCfg.ring}`}>
                  {priorityCfg.label}
                </span>
                {overdue && isSlim && (
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-base font-semibold">
                    Overdue
                  </span>
                )}
              </div>

              {task.description && !isSlim && (
                <p className="text-purple-300 text-lg mt-2 line-clamp-2">{task.description}</p>
              )}

              <div className={`flex flex-wrap items-center gap-3 text-base ${isSlim ? 'mt-1' : 'mt-3'}`}>
                <button
                  ref={statusBtnRef}
                  onClick={(e) => { e.stopPropagation(); setShowStatusMenu(!showStatusMenu); }}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full font-medium border transition-all duration-200 hover:scale-105 ${statusCfg.ring} ${statusCfg.text}`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${statusCfg.dot} ${statusCfg.pulse ? 'animate-pulse' : ''}`} />
                  {statusCfg.label}
                  <span className="opacity-60 text-sm">v</span>
                </button>

                {task.dueDate && (
                  <span className={`${overdue ? 'text-red-300' : 'text-purple-400'}`}>
                    Due {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}

                {subtasks.length > 0 && (
                  <span className="text-purple-400">{completedSubs}/{subtasks.length} sub</span>
                )}

                <span className="text-cyan-200">{progressPercent}% progress</span>

                {durationLabel && (
                  <span className="text-emerald-200">Duration {durationLabel}</span>
                )}
              </div>

              <StatusDropdown
                anchorRef={statusBtnRef}
                open={showStatusMenu}
                status={status}
                onSelect={handleStatusChange}
                onClose={() => setShowStatusMenu(false)}
              />
            </div>

            <div className="flex gap-3 shrink-0 items-center">
              <button
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="text-purple-400 text-base hover:text-white transition-colors"
              >
                {subtasks.length > 0 ? 'Subtasks' : '+ Sub'}
              </button>
              <button onClick={() => setIsEditing(true)}
                className="text-purple-300 text-base hover:text-white transition-colors duration-200">
                Edit
              </button>
              <button onClick={() => setConfirmDelete(true)}
                className="text-pink-400 text-base hover:text-pink-200 transition-colors duration-200">
                Delete
              </button>
            </div>
          </div>

          {!isSlim && (
            <div className="ml-12 h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  background: progressPercent === 100
                    ? 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)'
                    : 'linear-gradient(90deg, #06b6d4, #6366f1)',
                }}
              />
            </div>
          )}

          {showSubtasks && (
            <div className="ml-12 flex flex-col gap-2.5 animate-fade-slide">
              {subtasks.length === 0 && (
                <p className="text-purple-400 text-base italic">No subtasks yet</p>
              )}
              {subtasks.map((s) => (
                <div key={s.id} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={s.done}
                    onChange={() => toggleSubtask(s.id)}
                    className="w-3.5 h-3.5 accent-purple-500 cursor-pointer"
                  />
                  <span className={`text-lg flex-1 ${s.done ? 'line-through text-purple-400' : 'text-purple-200'}`}>
                    {s.text}
                  </span>
                  <button onClick={() => deleteSubtask(s.id)}
                    className="text-pink-400 text-base hover:text-pink-200 opacity-0 group-hover:opacity-100 transition-opacity">
                    x
                  </button>
                </div>
              ))}

              <div className="flex gap-2 mt-1">
                <input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                  placeholder="Add subtask... (press Enter)"
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-400 text-base focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
                <button onClick={addSubtask}
                  className="px-4 py-2 rounded-lg rgb-bg text-white text-base font-medium hover:scale-105 transition-all">
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
