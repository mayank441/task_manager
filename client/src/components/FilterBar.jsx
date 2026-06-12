export default function FilterBar({ filter, setFilter, counts }) {
  const filters = ['All', 'Active', 'Completed'];

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        {counts.active} active · {counts.completed} completed
      </p>
    </div>
  );
}