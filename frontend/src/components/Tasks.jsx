import React, { useState } from 'react';
import { CheckSquare, ListTodo, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Tasks() {
  const [newTask, setNewTask] = useState('');
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Brainstorm and validate project proposal using Idea Validator', completed: true },
    { id: 2, text: 'Search and summarize 5 scholarly papers using Literature Review', completed: true },
    { id: 3, text: 'Build interactive React frontend components using CodeStudio', completed: false },
    { id: 4, text: 'Run plagiarism/originality checks on project document', completed: false },
    { id: 5, text: 'Configure API keys settings for presentation sandbox demo', completed: false }
  ]);

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100) || 0;

  const handleToggle = (id) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) {
      toast.error('Task description cannot be empty.');
      return;
    }
    setTasks(prev => [
      ...prev,
      { id: Date.now(), text: newTask.trim(), completed: false }
    ]);
    setNewTask('');
    toast.success('New milestone added successfully!');
  };

  const handleDeleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    toast.success('Milestone removed.');
  };

  return (
    <div className="space-y-6 animate-fadeIn text-gray-800">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Hackathon Milestones & Tasks
          </h1>
          <p className="text-xs text-gray-500 mt-1">Track and check off key milestones required for compiling your final project build.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Task List Workspace */}
        <div className="lg:col-span-2 bg-white border border-gray-200 shadow-sm rounded-3xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ListTodo size={16} className="text-indigo-600" /> Milestone Todo List
            </h3>
            <span className="text-[10px] text-gray-400 font-bold uppercase">
              {completedCount} OF {tasks.length} DONE
            </span>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3.5 transition-all ${
                  task.completed
                    ? 'bg-indigo-50/20 border-indigo-100 text-gray-400'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 cursor-pointer" onClick={() => handleToggle(task.id)}>
                  <div className="shrink-0 text-indigo-600">
                    {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-gray-300" />}
                  </div>
                  <span className={`text-[12px] font-medium leading-relaxed ${task.completed ? 'line-through' : ''}`}>
                    {task.text}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors shrink-0"
                  title="Delete Milestone"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Inline Add Task Form */}
          <form onSubmit={handleAddTask} className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Define a new hackathon milestone task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
            <button
              type="submit"
              className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <Plus size={16} /> <span className="text-xs hidden md:inline">Add Task</span>
            </button>
          </form>
        </div>

        {/* Progress Radar/Overview Panel */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Completion Metrics</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Once you complete all milestones, you will unlock the final compile packages to export your hackathon project.
            </p>
          </div>

          {/* Big Progress Circle Visual */}
          <div className="my-8 flex flex-col items-center justify-center relative">
            <div className="w-32 h-32 rounded-full border-8 border-gray-100 flex items-center justify-center relative">
              {/* Fake animated colored outer arc using CSS border tricks or just text */}
              <div className="text-center">
                <span className="text-3xl font-black text-indigo-600">{progressPercent}%</span>
                <span className="text-[8px] text-gray-400 block font-bold uppercase tracking-wider mt-0.5">COMPLETED</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-400 text-center font-bold uppercase">
              Milestone Checklist Velocity Index: Excellent
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
