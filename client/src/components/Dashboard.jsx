import { useMemo } from 'react';

const isOverdue = (task) => {
  if (!task.dueDate || task.completed) return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
};

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', dot: '#9ca3af', pulse: false },
  in_progress: { label: 'In Progress', dot: '#60a5fa', pulse: true  },
  done:        { label: 'Done',        dot: '#4ade80', pulse: false },
};

export default function Dashboard({ tasks }) {
  const stats = useMemo(() => {
    const total     = tasks.length;
    const completed = tasks.filter((t) =>  t.completed).length;
    const overdue   = tasks.filter((t) => isOverdue(t)).length;
    const active    = tasks.filter((t) => !t.completed && !isOverdue(t)).length;
    const percent   = total === 0 ? 0 : Math.round((completed / total) * 100);
    const recent    = [...tasks]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);
    return { total, completed, active, overdue, percent, recent };
  }, [tasks]);

  return (
    <div className="flex flex-col gap-5">

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total"   value={stats.total}     icon="T" from="#3b82f6" to="#06b6d4" />
        <StatCard label="Active"  value={stats.active}    icon="A" from="#f59e0b" to="#f97316" />
        <StatCard label="Done"    value={stats.completed} icon="D" from="#22c55e" to="#10b981" />
        <StatCard label="Overdue" value={stats.overdue}   icon="!" from="#ef4444" to="#ec4899" />
      </div>

      {/* ── Overall Progress ── */}
      <div className="glass p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-slate-300 text-sm font-medium tracking-wide uppercase">Overall Progress</span>
          <span className="text-white text-sm font-bold" style={{
            background: 'linear-gradient(90deg, #6366f1, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {stats.percent}%
          </span>
        </div>
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width:      `${stats.percent}%`,
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)',
              boxShadow:  stats.percent > 0 ? '0 0 10px rgba(139,92,246,0.5)' : 'none',
            }}
          />
        </div>
        <p className="text-slate-500 text-xs mt-2">
          {stats.completed} of {stats.total} tasks completed
        </p>
      </div>

      {/* ── Status Panel ── */}
      <div className="glass p-5">
        <h3 className="text-slate-300 text-sm font-semibold tracking-wide uppercase mb-3">Status</h3>
        <div className="flex flex-col gap-2">
          {tasks.length === 0 ? (
            <p className="text-slate-500 text-xs italic">No tasks yet</p>
          ) : (
            tasks.slice(0, 6).map((task) => {
              const s = STATUS_CONFIG[task.status || 'not_started'] || STATUS_CONFIG.not_started;
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition-all duration-200"
                >
                  <span style={{
                    width:        '9px',
                    height:       '9px',
                    borderRadius: '50%',
                    flexShrink:   0,
                    background:   s.dot,
                    boxShadow:    s.pulse ? `0 0 6px ${s.dot}` : 'none',
                    animation:    s.pulse ? 'pulse 2s infinite' : 'none',
                  }} />
                  <span className="text-slate-200 text-sm truncate flex-1">{task.title}</span>
                  <span style={{ fontSize: '11px', color: s.dot, fontWeight: 600, flexShrink: 0 }}>
                    {s.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Recent Tasks ── */}
      <div className="glass p-5">
        <h3 className="text-slate-300 text-sm font-semibold tracking-wide uppercase mb-3">Recent Tasks</h3>
        {stats.recent.length === 0 ? (
          <p className="text-slate-500 text-xs italic">No tasks yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {stats.recent.map((task) => {
              const s = STATUS_CONFIG[task.status || 'not_started'] || STATUS_CONFIG.not_started;
              return (
                <div key={task.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition-all duration-200">
                  {/* Status dot */}
                  <span style={{
                    width:        '8px',
                    height:       '8px',
                    borderRadius: '50%',
                    flexShrink:   0,
                    background:   s.dot,
                    boxShadow:    `0 0 5px ${s.dot}`,
                    animation:    s.pulse ? 'pulse 2s infinite' : 'none',
                  }} />

                  {/* Title */}
                  <p className={`text-sm flex-1 truncate ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {task.title}
                  </p>

                  {/* Status label */}
                  <span style={{
                    fontSize:      '10px',
                    color:         s.dot,
                    fontWeight:    600,
                    letterSpacing: '0.04em',
                    flexShrink:    0,
                  }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

function StatCard({ label, value, icon, from, to }) {
  return (
    <div
      className="glass p-4 flex flex-col gap-1"
      style={{ background: `linear-gradient(135deg, ${from}22, ${to}11)` }}
    >
      <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </span>
      <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
        {value}
      </span>
    </div>
  );
}