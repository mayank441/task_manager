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

const formatDuration = (start, end) => {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!isFinite(ms) || ms < 0) return null;
  const totalMinutes = Math.max(1, Math.round(ms / 60000));
  const days    = Math.floor(totalMinutes / 1440);
  const hours   = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0)  return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
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

    // Total duration across all completed tasks that have both createdAt and completedAt
    const completedTasks = tasks.filter((t) => t.completed && t.createdAt && t.completedAt);
    const totalMs = completedTasks.reduce((sum, t) => {
      const ms = new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime();
      return sum + (isFinite(ms) && ms > 0 ? ms : 0);
    }, 0);
    const totalMinutes = Math.round(totalMs / 60000);
    const days    = Math.floor(totalMinutes / 1440);
    const hours   = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    let totalDurationLabel = null;
    if (totalMinutes > 0) {
      if (days > 0)       totalDurationLabel = `${days}d ${hours}h total`;
      else if (hours > 0) totalDurationLabel = `${hours}h ${minutes}m total`;
      else                totalDurationLabel = `${minutes}m total`;
    }

    // Avg duration per completed task
    let avgDurationLabel = null;
    if (completedTasks.length > 0 && totalMinutes > 0) {
      const avgMin = Math.round(totalMinutes / completedTasks.length);
      const ad = Math.floor(avgMin / 1440);
      const ah = Math.floor((avgMin % 1440) / 60);
      const am = avgMin % 60;
      if (ad > 0)       avgDurationLabel = `${ad}d ${ah}h avg`;
      else if (ah > 0)  avgDurationLabel = `${ah}h ${am}m avg`;
      else              avgDurationLabel = `${am}m avg`;
    }

    return { total, completed, active, overdue, percent, recent, totalDurationLabel, avgDurationLabel, trackedCount: completedTasks.length };
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

        <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
          <p className="text-slate-500 text-xs">
            {stats.completed} of {stats.total} tasks completed
          </p>
          {stats.totalDurationLabel && (
            <span className="text-emerald-400 text-xs font-medium">
              ⏱ {stats.totalDurationLabel}
            </span>
          )}
        </div>
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
                    width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0,
                    background: s.dot,
                    boxShadow: s.pulse ? `0 0 6px ${s.dot}` : 'none',
                    animation: s.pulse ? 'pulse 2s infinite' : 'none',
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
              const dur = task.completed ? formatDuration(task.createdAt, task.completedAt) : null;
              return (
                <div key={task.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition-all duration-200">
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                    background: s.dot,
                    boxShadow: `0 0 5px ${s.dot}`,
                    animation: s.pulse ? 'pulse 2s infinite' : 'none',
                  }} />
                  <p className={`text-sm flex-1 truncate ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {task.title}
                  </p>
                  {dur && (
                    <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 600, flexShrink: 0 }}>
                      ⏱ {dur}
                    </span>
                  )}
                  <span style={{ fontSize: '10px', color: s.dot, fontWeight: 600, letterSpacing: '0.04em', flexShrink: 0 }}>
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