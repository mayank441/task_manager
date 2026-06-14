export default function FilterBar({ filter, setFilter, counts, density, setDensity }) {
  const filters = [
    { label: 'All', count: counts.active + counts.completed },
    { label: 'Active', count: counts.active },
    { label: 'Completed', count: counts.completed },
  ];

  const densityOptions = [
    { value: 'comfortable', label: 'Comfort' },
    { value: 'slim', label: 'Slim' },
  ];

  const buttonStyle = (isActive) => ({
    padding: '9px 18px',
    borderRadius: '10px',
    fontSize: '18px',
    fontWeight: isActive ? 700 : 500,
    fontFamily: "'Brush Script MT', 'Segoe Print', cursive",
    border: isActive
      ? '1.5px solid rgba(139,92,246,0.9)'
      : '1.5px solid rgba(255,255,255,0.1)',
    background: isActive
      ? 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(168,85,247,0.5))'
      : 'rgba(255,255,255,0.04)',
    color: isActive ? '#ffffff' : '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: isActive ? '0 0 16px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
    whiteSpace: 'nowrap',
  });

  return (
    <div className="glass-rgb px-5 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-3">
        {filters.map(({ label, count }) => {
          const isActive = filter === label;
          return (
            <button
              key={label}
              onClick={() => setFilter(label)}
              style={buttonStyle(isActive)}
            >
              {label}
              <span style={{
                marginLeft: '8px',
                padding: '2px 9px',
                borderRadius: '999px',
                fontSize: '15px',
                fontWeight: 700,
                background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                color: isActive ? '#ffffff' : '#475569',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-1.5">
          {densityOptions.map(({ value, label }) => {
            const isActive = density === value;
            return (
              <button
                key={value}
                onClick={() => setDensity(value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'rgba(139,92,246,0.32)' : 'transparent',
                  color: isActive ? '#f8fafc' : '#64748b',
                  fontSize: '17px',
                  fontWeight: isActive ? 700 : 500,
                  fontFamily: "'Brush Script MT', 'Segoe Print', cursive",
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <span style={{ fontSize: '17px', color: '#94a3b8', fontFamily: "'Brush Script MT', 'Segoe Print', cursive" }}>
          {counts.active} active / {counts.completed} done
        </span>
      </div>
    </div>
  );
}
