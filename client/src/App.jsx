import { useState, useEffect, useCallback } from 'react';
import { getTasks } from './api';
import TaskForm from './components/TaskForm';
import TaskItem from './components/TaskItem';
import FilterBar from './components/FilterBar';
import Dashboard from './components/Dashboard';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const TAGLINES = [
  'Stay organized, stay productive',
  'One task at a time',
  'Make today count',
  'Focus. Execute. Repeat',
  'Small steps, big results',
  'Your goals, your pace',
  'Dream it. Plan it. Do it',
];

export default function App() {
  const [tasks,          setTasks]          = useState([]);
  const [filter,         setFilter]         = useState('All');
  const [search,         setSearch]         = useState('');
  const [loading,        setLoading]        = useState(true);
  const [taglineIndex,   setTaglineIndex]   = useState(0);
  const [taglineFade,    setTaglineFade]    = useState(true);
  const [showDashboard,  setShowDashboard]  = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await getTasks();
        if (isMounted) setTasks(res.data);
      } catch (err) {
        console.error('Failed to fetch tasks', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await getTasks();
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineFade(false);
      setTimeout(() => {
        setTaglineIndex((i) => (i + 1) % TAGLINES.length);
        setTaglineFade(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setTasks((items) => {
      const oldIndex = items.findIndex((t) => t.id === active.id);
      const newIndex = items.findIndex((t) => t.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesFilter =
      filter === 'Active'    ? !t.completed :
      filter === 'Completed' ?  t.completed : true;
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    active:    tasks.filter((t) => !t.completed).length,
    completed: tasks.filter((t) =>  t.completed).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950 py-6 px-3 sm:py-10 sm:px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8 sm:mb-14">
          <h1 style={{
            fontFamily:    "'Space Grotesk', sans-serif",
            fontSize:      'clamp(1.6rem, 6vw, 3rem)',
            fontWeight:    800,
            fontStyle:     'italic',
            letterSpacing: '0.04em',
            color:         '#f1f5f9',
            lineHeight:    1.4,
            paddingBottom: '4px',
            margin:        0,
            textShadow:    '0 2px 20px rgba(139,92,246,0.3)',
            transform:     'skewX(-10deg)',
            display:       'inline-block',
          }}>
            Task Manager
          </h1>

          <div style={{
            height:       '3px',
            width:        'min(360px, 72vw)',
            margin:       '10px auto 0',
            background:   'linear-gradient(90deg, transparent, #f0abfc, #60a5fa, transparent)',
            borderRadius: '999px',
            boxShadow:    '0 0 22px rgba(147,197,253,0.48)',
          }} />

          <p style={{
            marginTop:  '12px',
            fontSize:   'clamp(0.9rem, 3vw, 1.2rem)',
            color:      'rgba(203,213,225,0.9)',
            opacity:    taglineFade ? 1 : 0,
            transition: 'opacity 0.4s ease',
            fontFamily: "'Brush Script MT', 'Segoe Print', cursive",
          }}>
            {TAGLINES[taglineIndex]}
          </p>
        </div>

        {/* Mobile Dashboard Toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowDashboard(!showDashboard)}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '12px',
              background: showDashboard ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#e2e8f0',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>📊 Dashboard</span>
            <span style={{ opacity: 0.6 }}>{showDashboard ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showDashboard && (
            <div className="mt-3">
              <Dashboard tasks={tasks} />
            </div>
          )}
        </div>

        {/* Layout */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left: Dashboard — desktop only */}
          <div className="hidden lg:block lg:w-72 shrink-0">
            <Dashboard tasks={tasks} />
          </div>

          {/* Right: Tasks */}
          <div className="flex-1 flex flex-col gap-4">
            <TaskForm onTaskCreated={fetchTasks} />

            {/* Search */}
            <div className="glass-rgb px-4 py-3 shadow-lg">
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none"
                style={{ fontSize: 'clamp(14px, 4vw, 20px)' }}
              />
            </div>

            <FilterBar filter={filter} setFilter={setFilter} counts={counts} />

            {loading ? (
              <p className="text-center text-slate-400 mt-8 animate-pulse" style={{ fontSize: 'clamp(14px, 4vw, 20px)' }}>
                Loading...
              </p>
            ) : filteredTasks.length === 0 ? (
              <div className="glass text-center py-12 shadow-lg animate-fade-slide">
                <p className="text-4xl mb-3">{tasks.length === 0 ? '📋' : '🔍'}</p>
                <p className="text-white font-medium" style={{ fontSize: 'clamp(14px, 4vw, 18px)' }}>
                  {tasks.length === 0 ? 'No tasks yet' : 'No tasks match'}
                </p>
                <p className="text-slate-400 mt-2" style={{ fontSize: 'clamp(13px, 3.5vw, 16px)' }}>
                  {tasks.length === 0 ? 'Add your first task above.' : 'Try a different search or filter.'}
                </p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filteredTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-3">
                    {filteredTasks.map((task) => (
                      <TaskItem key={task.id} task={task} onUpdate={fetchTasks} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}