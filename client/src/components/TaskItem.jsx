import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { updateTask, deleteTask } from '../api';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const isOverdue = (task) => {
  if (!task.dueDate || task.completed) return false;
  const due = task.dueTime
    ? new Date(`${task.dueDate}T${task.dueTime}`)
    : new Date(task.dueDate);
  return due < new Date();
};

const getDuration = (task) => {
  if (!task.completed || !task.createdAt) return null;
  const created   = new Date(task.createdAt);
  const completed = task.completedAt ? new Date(task.completedAt) : new Date();
  const diffMs    = completed - created;
  const diffMins  = Math.floor(diffMs / 60000);
  const hours     = Math.floor(diffMins / 60);
  const mins      = diffMins % 60;
  if (hours === 0) return `${mins}m`;
  if (mins  === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', dot: 'bg-gray-400',  text: 'text-gray-300',  ring: 'border-gray-500/50 bg-gray-500/10',  pulse: false },
  in_progress: { label: 'In Progress', dot: 'bg-blue-400',  text: 'text-blue-300',  ring: 'border-blue-400/50 bg-blue-400/10',  pulse: true  },
  done:        { label: 'Done',        dot: 'bg-green-400', text: 'text-green-300', ring: 'border-green-400/50 bg-green-400/10', pulse: false },
};

const PRIORITY_CONFIG = {
  high:   { label: 'High',   color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)'  },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)' },
  low:    { label: 'Low',    color: '#22c55e', bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)'  },
};

// ── Portal Status Dropdown ───────────────────────────────────────────────────
function StatusDropdown({ anchorRef, open, status, onSelect, onClose }) {
  const [pos, setPos] = useState({ top: 0, left: 0, bottom: 'auto' });
  const menuRef = useRef(null);

  useEffect(() => {
    if (open && anchorRef.current) {
      const rect       = anchorRef.current.getBoundingClientRect();
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
        menuRef.current   && !menuRef.current.contains(e.target) &&
        anchorRef.current && !anchorRef.current.contains(e.target)
      ) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position:       'fixed',
        top:            pos.top    !== 'auto' ? pos.top    : 'auto',
        bottom:         pos.bottom !== 'auto' ? pos.bottom : 'auto',
        left:           pos.left,
        zIndex:         9999,
        minWidth:       '165px',
        background:     'rgba(15, 8, 40, 0.98)',
        backdropFilter: 'blur(24px)',
        border:         '1px solid rgba(255,255,255,0.18)',
        borderRadius:   '14px',
        overflow:       'hidden',
        boxShadow:      '0 25px 60px rgba(0,0,0,0.7)',
        fontFamily:     "'Space Grotesk', sans-serif",
      }}
    >
      <p style={{
        color: 'rgba(168,85,247,0.75)', fontSize: '10px',
        letterSpacing: '0.12em', textTransform: 'uppercase',
        padding: '10px 14px 4px',
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
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', fontSize: '12px',
              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.1)' : 'transparent'; }}
          >
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, background: dotColor }} />
            <span style={{ color: txtColor, flex: 1, textAlign: 'left' }}>{cfg.label}</span>
            {isActive && <span style={{ color: '#a855f7' }}>✓</span>}
          </button>
        );
      })}
    </div>,
    document.body
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function TaskItem({ task, onUpdate }) {
  const [isEditing,      setIsEditing]      = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [title,          setTitle]          = useState(task.title);
  const [description,    setDescription]    = useState(task.description || '');
  const [dueDate,        setDueDate]        = useState(task.dueDate ? task.dueDate.split('T')[0] : '');
  const [dueTime,        setDueTime]        = useState(task.dueTime || '');
  const [subtasks,       setSubtasks]       = useState(task.subtasks || []);
  const [newSubtask,     setNewSubtask]     = useState('');
  const [newSubtaskTime, setNewSubtaskTime] = useState('');
  const [showSubtasks,   setShowSubtasks]   = useState(false);

  const statusBtnRef  = useRef(null);
  const overdue       = isOverdue(task);
  const duration      = getDuration(task);
  const completedSubs = subtasks.filter((s) => s.done).length;
  const subPercent    = subtasks.length === 0 ? 0 : Math.round((completedSubs / subtasks.length) * 100);
  const status        = task.status   || 'not_started';
  const priority      = task.priority || 'medium';
  const statusCfg     = STATUS_CONFIG[status];
  const priorityCfg   = PRIORITY_CONFIG[priority];

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex:  isDragging ? 50 : 'auto',
  };

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
    color: '#f1f5f9', fontSize: '14px', fontFamily: "'Space Grotesk', sans-serif",
    outline: 'none', colorScheme: 'dark', boxSizing: 'border-box',
  };

  // ── Auto status on checkbox toggle ──
  const handleToggle = async () => {
    const nowCompleted = !task.completed;
    const updatedTask  = {
      ...task,
      completed:   nowCompleted,
      completedAt: nowCompleted ? new Date().toISOString() : null,
      // auto set status
      status: nowCompleted ? 'done' : (
        subtasks.length > 0 && subtasks.some((s) => s.done)
          ? 'in_progress'
          : 'not_started'
      ),
    };
    await updateTask(task.id, updatedTask);
    onUpdate();
  };

  const handleDelete = async () => {
    await deleteTask(task.id);
    onUpdate();
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    await updateTask(task.id, { ...task, title, description, dueDate, dueTime, subtasks });
    setIsEditing(false);
    onUpdate();
  };

  const handleStatusChange = async (newStatus) => {
    setShowStatusMenu(false);
    await updateTask(task.id, { ...task, status: newStatus });
    onUpdate();
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    const updated    = [...subtasks, { id: Date.now().toString(), text: newSubtask.trim(), done: false, dueTime: newSubtaskTime || null }];
    const newStatus  = task.completed ? 'done' : 'in_progress';
    setSubtasks(updated);
    setNewSubtask('');
    setNewSubtaskTime('');
    await updateTask(task.id, { ...task, subtasks: updated, status: newStatus });
    onUpdate();
  };

  // ── Auto status on subtask toggle ──
  const toggleSubtask = async (id) => {
    const updated        = subtasks.map((s) => s.id === id ? { ...s, done: !s.done } : s);
    const allDone        = updated.every((s) => s.done);
    const anyDone        = updated.some((s) => s.done);
    const autoStatus     =
      task.completed      ? 'done'         :
      allDone && anyDone  ? 'in_progress'  :
      anyDone             ? 'in_progress'  : 'not_started';

    setSubtasks(updated);
    await updateTask(task.id, { ...task, subtasks: updated, status: autoStatus });
    onUpdate();
  };

  const deleteSubtask = async (id) => {
    const updated   = subtasks.filter((s) => s.id !== id);
    const anyDone   = updated.some((s) => s.done);
    const autoStatus =
      task.completed ? 'done'        :
      anyDone        ? 'in_progress' : 'not_started';

    setSubtasks(updated);
    await updateTask(task.id, { ...task, subtasks: updated, status: autoStatus });
    onUpdate();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass p-4 shadow-lg transition-all duration-300 animate-fade-slide
        ${task.completed ? 'opacity-60' : ''}
        ${isDragging ? 'scale-105 shadow-2xl' : 'hover:scale-[1.01]'}
      `}
    >
      {/* Overdue badge */}
      {overdue && (
        <span className="inline-block mb-2 px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs font-medium">
          ⚠️ Overdue
        </span>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="mb-3 p-3 rounded-xl bg-red-500/20 border border-red-400/40">
          <p className="text-red-200 text-sm mb-2">Delete this task?</p>
          <div className="flex gap-2">
            <button onClick={handleDelete}
              className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-all">
              Yes, delete
            </button>
            <button onClick={() => setConfirmDelete(false)}
              className="px-3 py-1 rounded-lg bg-white/10 text-slate-300 text-sm hover:bg-white/20 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Edit mode ── */}
      {isEditing ? (
        <div className="flex flex-col gap-2 animate-fade-slide">
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title" style={inputStyle} />
          <input value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Description" style={inputStyle} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              style={{ ...inputStyle, flex: 1 }} />
            <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)}
              style={{ ...inputStyle, flex: 1 }} />
          </div>
          <div className="flex gap-2 mt-1">
            <button onClick={handleSave}
              className="px-4 py-1.5 rounded-lg text-white text-sm font-medium transition-all"
              style={{ background: '#7c3aed', fontFamily: "'Space Grotesk', sans-serif" }}>
              Save
            </button>
            <button onClick={() => setIsEditing(false)}
              className="px-4 py-1.5 rounded-lg bg-white/10 text-slate-300 text-sm hover:bg-white/20 transition-all">
              Cancel
            </button>
          </div>
        </div>

      ) : (
        <div className="flex flex-col gap-3">

          {/* ── Main row ── */}
          <div className="flex items-start gap-3">

            {/* Drag handle */}
            <div {...attributes} {...listeners}
              className="mt-1 cursor-grab active:cursor-grabbing text-slate-500 hover:text-white transition-colors select-none text-lg leading-none">
              ⠿
            </div>

            {/* Checkbox */}
            <div
              onClick={handleToggle}
              style={{
                marginTop: '2px',
                width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                border: task.completed ? '2px solid #a855f7' : '2px solid rgba(255,255,255,0.3)',
                background: task.completed ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease',
                boxShadow: task.completed ? '0 0 10px rgba(168,85,247,0.5)' : 'none',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              {task.completed && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">

              {/* Title + Priority badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`font-medium ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {task.title}
                </p>
                <span style={{
                  fontSize: '10px', fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif",
                  padding: '2px 8px', borderRadius: '999px',
                  color:         priorityCfg.color,
                  background:    priorityCfg.bg,
                  border:        `1px solid ${priorityCfg.border}`,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  flexShrink:    0,
                }}>
                  {priorityCfg.label}
                </span>
              </div>

              {/* Description */}
              {task.description && (
                <p className="text-slate-400 text-sm mt-0.5"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {task.description}
                </p>
              )}

              {/* Due date + time */}
              {task.dueDate && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${overdue ? 'text-red-300' : 'text-slate-500'}`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  📅 {new Date(task.dueDate).toLocaleDateString()}
                  {task.dueTime && (
                    <span className="flex items-center gap-1 ml-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {task.dueTime}
                    </span>
                  )}
                </p>
              )}

              {/* Duration — only on completed tasks */}
              {task.completed && duration && (
                <p className="text-xs mt-1 text-slate-500 flex items-center gap-1"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  ⏱️ Duration: {duration}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 shrink-0 items-center">
              <button onClick={() => setShowSubtasks(!showSubtasks)}
                className="text-slate-400 text-xs hover:text-white transition-colors"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {subtasks.length > 0 ? `${completedSubs}/${subtasks.length} sub` : '+ sub'}
              </button>
              <button onClick={() => setIsEditing(true)}
                className="text-slate-400 text-sm hover:text-white transition-colors"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Edit
              </button>
              <button onClick={() => setConfirmDelete(true)}
                className="text-red-400 text-sm hover:text-red-300 transition-colors"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Delete
              </button>
            </div>
          </div>

          {/* ── Status badge ── */}
          <div className="ml-10">
            <button
              ref={statusBtnRef}
              onClick={(e) => { e.stopPropagation(); setShowStatusMenu(!showStatusMenu); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105 ${statusCfg.ring} ${statusCfg.text}`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${statusCfg.dot} ${statusCfg.pulse ? 'animate-pulse' : ''}`} />
              {statusCfg.label}
              <span className="opacity-40 text-[10px]">▾</span>
            </button>

            <StatusDropdown
              anchorRef={statusBtnRef}
              open={showStatusMenu}
              status={status}
              onSelect={handleStatusChange}
              onClose={() => setShowStatusMenu(false)}
            />
          </div>

          {/* ── Subtask progress bar ── */}
          {subtasks.length > 0 && (
            <div className="ml-10">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-500 text-xs" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Subtasks
                </span>
                <span className="text-xs font-bold" style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  color: subPercent === 100 ? '#4ade80' : subPercent > 0 ? '#60a5fa' : '#6b7280',
                }}>
                  {completedSubs}/{subtasks.length} — {subPercent}%
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width:      `${subPercent}%`,
                    background: subPercent === 100 ? '#4ade80' : subPercent > 0 ? '#60a5fa' : '#374151',
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Subtasks list ── */}
          {showSubtasks && (
            <div className="ml-10 flex flex-col gap-1.5 animate-fade-slide">
              {subtasks.length === 0 && (
                <p className="text-slate-500 text-xs italic" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  No subtasks yet
                </p>
              )}
              {subtasks.map((s) => {
                const isDone = s.done === true;
                return (
                <div key={s.id} className="flex items-center gap-2 group">
                  <div
                    onClick={() => toggleSubtask(s.id)}
                    style={{
                      width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                      border: isDone ? '2px solid #a855f7' : '2px solid rgba(255,255,255,0.3)',
                      background: isDone ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s ease',
                      boxShadow: isDone ? '0 0 8px rgba(168,85,247,0.5)' : 'none',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    {isDone && (
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm flex-1 ${s.done ? 'line-through text-slate-500' : 'text-slate-300'}`}
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {s.text}
                  </span>
                  {s.dueTime && (
                    <span style={{
                      fontSize: '10px', color: '#a78bfa', fontFamily: "'Space Grotesk', sans-serif",
                      display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0,
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {s.dueTime}
                    </span>
                  )}
                  <button onClick={() => deleteSubtask(s.id)}
                    className="text-red-400 text-xs hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    ✕
                  </button>
                </div>
                );
              })}
              <div className="flex gap-2 mt-1">
                <input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                  placeholder="Add subtask... (Enter)"
                  style={{ ...inputStyle, flex: 1, fontSize: '12px' }}
                />
                <input
                  type="time"
                  value={newSubtaskTime}
                  onChange={(e) => setNewSubtaskTime(e.target.value)}
                  style={{
                    ...inputStyle, width: '110px', fontSize: '12px',
                    paddingLeft: '10px', flexShrink: 0,
                  }}
                />
                <button onClick={addSubtask}
                  className="px-3 py-1 rounded-lg text-white text-xs font-medium hover:scale-105 transition-all"
                  style={{ background: '#7c3aed', fontFamily: "'Space Grotesk', sans-serif" }}>
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