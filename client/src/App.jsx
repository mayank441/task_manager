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
  const [tasks, setTasks]               = useState([]);
  const [filter, setFilter]             = useState('All');
  const [search, setSearch]             = useState('');
  const [density, setDensity]           = useState('comfortable');
  const [loading, setLoading]           = useState(true);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [taglineFade, setTaglineFade]   = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchTasks = useCallback(async () => {
    try {
      const res = await getTasks();
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialTasks = async () => {
      try {
        const res = await getTasks();
        if (isMounted) setTasks(res.data);
      } catch (err) {
        console.error('Failed to fetch tasks', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialTasks();

    return () => {
      isMounted = false;
    };
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950 py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-14">

          {/* Title */}
         <h1
  style={{
    fontFamily:           "'Inter', sans-serif",
    fontSize:             'clamp(2rem, 4vw, 3rem)',
    fontWeight:           800,
    letterSpacing:        '0.04em',
    color:                '#f1f5f9',
    lineHeight:           1.4,
    paddingBottom:        '4px',
    margin:               0,
  }}
>
  Task Manager
</h1>

          {/* Underline accent */}
          <div style={{
            height:     '3px',
            width:      'min(360px, 72vw)',
            margin:     '14px auto 0',
            background: 'linear-gradient(90deg, transparent, #f0abfc, #60a5fa, transparent)',
            borderRadius: '999px',
            boxShadow: '0 0 22px rgba(147,197,253,0.48)',
          }} />

          {/* Rotating tagline */}
          <p
            style={{
              marginTop:   '16px',
              fontSize:    '1.2rem',
              letterSpacing: 0,
              color:       'rgba(203, 213, 225, 0.9)',
              opacity:     taglineFade ? 1 : 0,
              transition:  'opacity 0.4s ease',
              fontFamily:  "'Brush Script MT', 'Segoe Print', cursive",
              textTransform: 'none',
            }}
          >
            {TAGLINES[taglineIndex]}
          </p>
        </div>

        {/* ── Main Layout ── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left: Dashboard */}
          <div className="lg:w-72 shrink-0">
            <Dashboard tasks={tasks} />
          </div>

          {/* Right: Tasks */}
          <div className="flex-1 flex flex-col gap-5">
            <TaskForm onTaskCreated={fetchTasks} />

            {/* Search */}
            <div className="glass-rgb px-5 py-4 shadow-lg">
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none text-xl"
                style={{ letterSpacing: 0 }}
              />
            </div>

            <FilterBar
              filter={filter}
              setFilter={setFilter}
              counts={counts}
              density={density}
              setDensity={setDensity}
            />

            {loading ? (
              <p className="text-center text-slate-400 text-xl mt-8 animate-pulse">
                Loading...
              </p>
            ) : filteredTasks.length === 0 ? (
              <div className="glass text-center py-16 shadow-lg animate-fade-slide">
                <p className="text-5xl mb-4">{tasks.length === 0 ? '📋' : '🔍'}</p>
                <p className="text-white font-medium text-lg">
                  {tasks.length === 0 ? 'No tasks yet' : 'No tasks match'}
                </p>
                <p className="text-slate-400 text-lg mt-2">
                  {tasks.length === 0 ? 'Add your first task above.' : 'Try a different search or filter.'}
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className={`flex flex-col ${density === 'slim' ? 'gap-2' : 'gap-3'}`}>
                    {filteredTasks.map((task) => (
                      <TaskItem key={task.id} task={task} onUpdate={fetchTasks} density={density} />
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
