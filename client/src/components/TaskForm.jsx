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
    fontFamily:   "'Space Grotesk', sans-serif",
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
        color:         'rgba(226, 232, 240, 0.75)',
        fontSize:      '18px',
        fontWeight:    700,
        fontStyle:     'italic',
        transform:     'skewX(-8deg)',
        display:       'inline-block',
        marginBottom:  '18px',
        marginTop:     0,
        fontFamily:    "'Space Grotesk', sans-serif",
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

        {/* Date + Time side by side with clock label */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            {/* Clock icon overlaid on left */}
            <span style={{
              position:   'absolute',
              left:       '14px',
              top:        '50%',
              transform:  'translateY(-50%)',
              color:      dueTime ? '#c4b5fd' : '#64748b',
              pointerEvents: 'none',
              lineHeight: 1,
              zIndex: 1,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </span>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
              style={{ ...inputStyle, width: '100%', paddingLeft: '36px' }}
            />
          </div>
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
            fontFamily:    "'Space Grotesk', sans-serif",
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