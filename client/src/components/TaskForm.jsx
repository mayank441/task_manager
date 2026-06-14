import { useState } from 'react';
import { createTask } from '../api';

export default function TaskForm({ onTaskCreated }) {
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [dueDate,     setDueDate]     = useState('');
  const [dueTime,     setDueTime]     = useState('');
  const [priority,    setPriority]    = useState('medium');
  const [loading,     setLoading]     = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await createTask({ title, description, dueDate, dueTime, priority });
      setTitle('');
      setDescription('');
      setDueDate('');
      setDueTime('');
      setPriority('medium');
      onTaskCreated();
    } catch (err) {
      console.error('Failed to create task', err);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width:        '100%',
    padding:      '13px 16px',
    borderRadius: '10px',
    background:   'rgba(255,255,255,0.07)',
    border:       '1.5px solid rgba(255,255,255,0.18)',
    color:        '#f1f5f9',
    fontSize:     '15px',
    fontFamily:   "'Inter', 'Space Grotesk', sans-serif",
    outline:      'none',
    transition:   'border 0.2s, background 0.2s',
    colorScheme:  'dark',
    boxSizing:    'border-box',
  };

  const focusStyle = (e) => {
    e.target.style.border     = '1.5px solid rgba(139,92,246,0.9)';
    e.target.style.background = 'rgba(255,255,255,0.1)';
  };
  const blurStyle = (e) => {
    e.target.style.border     = '1.5px solid rgba(255,255,255,0.18)';
    e.target.style.background = 'rgba(255,255,255,0.07)';
  };

  return (
    <div className="glass shadow-lg" style={{ padding: '24px' }}>

      <h2 style={{
        color:         '#e2e8f0',
        fontSize:      '18px',
        fontWeight:    700,
        marginBottom:  '18px',
        marginTop:     0,
        fontFamily:    "'Inter', sans-serif",
        letterSpacing: '0.02em',
      }}>
        ✦ Add New Task
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Title */}
        <input
          type="text"
          placeholder="Task title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          onFocus={focusStyle}
          onBlur={blurStyle}
          style={inputStyle}
        />

        {/* Description */}
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onFocus={focusStyle}
          onBlur={blurStyle}
          style={inputStyle}
        />

        {/* Date + Time — single datetime-local works on all mobile browsers */}
        <div style={{ position: 'relative' }}>
          <input
            type="datetime-local"
            value={dueDate && dueTime ? `${dueDate}T${dueTime}` : dueDate ? `${dueDate}T00:00` : ''}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                setDueDate(val.split('T')[0]);
                setDueTime(val.split('T')[1] || '');
              } else {
                setDueDate('');
                setDueTime('');
              }
            }}
            onFocus={focusStyle}
            onBlur={blurStyle}
            style={{
              ...inputStyle,
              width: '100%',
              colorScheme: 'dark',
              color: (dueDate || dueTime) ? '#f1f5f9' : '#64748b',
            }}
          />
        </div>

        {/* Priority */}
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          onFocus={focusStyle}
          onBlur={blurStyle}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="high"   style={{ background: '#1e1b4b', color: '#f1f5f9' }}>High priority</option>
          <option value="medium" style={{ background: '#1e1b4b', color: '#f1f5f9' }}>Medium priority</option>
          <option value="low"    style={{ background: '#1e1b4b', color: '#f1f5f9' }}>Low priority</option>
        </select>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !title.trim()}
          style={{
            width:         '100%',
            padding:       '14px',
            borderRadius:  '10px',
            border:        'none',
            background:    loading || !title.trim() ? 'rgba(255,255,255,0.07)' : '#7c3aed',
            color:         loading || !title.trim() ? '#475569' : '#ffffff',
            fontSize:      '15px',
            fontWeight:    700,
            fontFamily:    "'Inter', sans-serif",
            letterSpacing: '0.03em',
            cursor:        loading || !title.trim() ? 'not-allowed' : 'pointer',
            transition:    'all 0.2s ease',
            boxShadow:     loading || !title.trim() ? 'none' : '0 4px 24px rgba(124,58,237,0.4)',
            boxSizing:     'border-box',
          }}
          onMouseEnter={(e) => {
            if (!loading && title.trim()) {
              e.currentTarget.style.background = '#6d28d9';
              e.currentTarget.style.transform  = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && title.trim()) {
              e.currentTarget.style.background = '#7c3aed';
              e.currentTarget.style.transform  = 'translateY(0)';
            }
          }}
        >
          {loading ? 'Adding...' : '+ Add Task'}
        </button>
      </div>
    </div>
  );
}