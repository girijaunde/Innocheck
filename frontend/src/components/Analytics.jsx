import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, CheckCircle, RefreshCcw, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('week');
  const [hoveredBar, setHoveredBar] = useState(null);

  // Dynamic statistics based on selected timeRange
  const data = {
    today: {
      validated: 12,
      originality: '94.2%',
      prototypes: 4,
      avgScore: 82,
      chartData: [
        { label: '9 AM', value: 2 },
        { label: '12 PM', value: 5 },
        { label: '3 PM', value: 8 },
        { label: '6 PM', value: 12 },
        { label: '9 PM', value: 9 },
      ]
    },
    week: {
      validated: 87,
      originality: '91.8%',
      prototypes: 24,
      avgScore: 78,
      chartData: [
        { label: 'Mon', value: 12 },
        { label: 'Tue', value: 18 },
        { label: 'Wed', value: 15 },
        { label: 'Thu', value: 22 },
        { label: 'Fri', value: 29 },
        { label: 'Sat', value: 14 },
        { label: 'Sun', value: 11 },
      ]
    },
    month: {
      validated: 342,
      originality: '89.5%',
      prototypes: 94,
      avgScore: 75,
      chartData: [
        { label: 'Week 1', value: 65 },
        { label: 'Week 2', value: 88 },
        { label: 'Week 3', value: 112 },
        { label: 'Week 4', value: 77 },
      ]
    }
  };

  const current = data[timeRange];
  const maxVal = Math.max(...current.chartData.map(d => d.value));

  const handleExport = () => {
    toast.success('Telemetry data exported successfully as CSV!');
  };

  return (
    <div className="space-y-6 animate-fadeIn text-gray-800">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Platform Analytics & Telemetry
          </h1>
          <p className="text-xs text-gray-500 mt-1">Real-time statistics for code compilation, plagiarism check, and validation telemetry.</p>
        </div>
        <div className="flex gap-2">
          {['today', 'week', 'month'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                timeRange === range
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <CheckCircle size={20} />
            </div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Ideas Validated</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{current.validated}</div>
          <p className="text-[10px] text-emerald-500 font-bold mt-1">▲ +14% vs last period</p>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Avg Uniqueness</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{current.originality}</div>
          <p className="text-[10px] text-emerald-500 font-bold mt-1">▲ High Originality Index</p>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl">
              <BarChart3 size={20} />
            </div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Prototypes Built</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{current.prototypes}</div>
          <p className="text-[10px] text-gray-400 font-bold mt-1">● Direct Code Sandbox compile</p>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <RefreshCcw size={20} />
            </div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">AI Success Rate</span>
          </div>
          <div className="text-2xl font-black text-gray-900">99.4%</div>
          <p className="text-[10px] text-emerald-500 font-bold mt-1">✓ No DLL runtime block</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Card */}
        <div className="lg:col-span-2 bg-white border border-gray-200 shadow-sm rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span> Activity Telemetry
            </h3>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-100 rounded-xl font-medium transition-colors"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          {/* Interactive Chart Container */}
          <div className="h-64 flex items-end gap-4 px-2 pb-2 pt-6 relative border-b border-gray-100">
            {current.chartData.map((d, index) => {
              const heightPercent = (d.value / maxVal) * 90;
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative"
                  onMouseEnter={() => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip on hover */}
                  <div
                    className={`absolute -top-4 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded-md font-bold transition-all pointer-events-none ${
                      hoveredBar === index ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                    }`}
                  >
                    {d.value} runs
                  </div>

                  {/* Colored bar with transition */}
                  <div
                    style={{ height: `${heightPercent || 5}%` }}
                    className={`w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-indigo-500 to-purple-500 group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-500 shadow-sm shadow-indigo-200`}
                  />
                  <span className="text-[10px] font-medium text-gray-400 mt-2 truncate w-full text-center">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Breakdown Ring */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4">Feature Allocation</h3>
            <p className="text-[11px] text-gray-400 mb-6">Percentage of usage across core modules of the InnoCheck system.</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[11px] font-bold text-gray-700 mb-1">
                <span>Idea Validator</span>
                <span>45%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-bold text-gray-700 mb-1">
                <span>CodeStudio (Sandbox)</span>
                <span>30%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-bold text-gray-700 mb-1">
                <span>Literature Review</span>
                <span>15%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-pink-600 h-full rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-bold text-gray-700 mb-1">
                <span>Plagiarism Checker</span>
                <span>10%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
