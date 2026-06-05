import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Check, Brain, Star, BookOpen, Code, ArrowUp, ArrowDown, Clock, FileSearch } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const userResponse = await apiService.auth.me();
        setUser(userResponse.data);

        const dashboardResponse = await apiService.dashboard.getOverview();
        setDashboardData(dashboardResponse.data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 animate-pulse">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto font-sans">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-600 border border-indigo-500 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 mb-6 shadow-md shadow-indigo-600/10 text-white">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Welcome back, {user?.name?.split(' ')[0] || 'Innovator'}! 👋</h2>
          <p className="text-[13px] text-indigo-100">You've validated {dashboardData?.stats?.total_analyses || 0} ideas so far. Keep going — you're doing great!</p>
        </div>
        <div className="flex gap-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{dashboardData?.stats?.total_analyses || 0}</div>
            <div className="text-[11px] text-indigo-200 font-medium">Ideas validated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{dashboardData?.stats?.average_uniqueness_score || 0}%</div>
            <div className="text-[11px] text-indigo-200 font-medium">Avg score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{dashboardData?.stats?.saved_prototypes || 0}</div>
            <div className="text-[11px] text-indigo-200 font-medium">Prototypes</div>
          </div>
        </div>
        <button 
          onClick={() => navigate('/idea-validator')}
          className="bg-white hover:bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-xl font-semibold text-[13px] transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
        >
          Validate new idea &rarr;
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-indigo-200 transition-all duration-300">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[12px] text-gray-500 font-medium">Total validations</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Brain size={18} /></div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{dashboardData?.stats?.total_analyses || 0}</div>
          <div className="text-[11px] font-medium flex items-center gap-1 text-emerald-600"><ArrowUp size={12}/> +8 this week</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-indigo-200 transition-all duration-300">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[12px] text-gray-500 font-medium">Avg uniqueness score</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Star size={18} /></div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{dashboardData?.stats?.average_uniqueness_score || 0}%</div>
          <div className="text-[11px] font-medium flex items-center gap-1 text-emerald-600"><ArrowUp size={12}/> +3.2% vs last month</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-indigo-200 transition-all duration-300">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[12px] text-gray-500 font-medium">Papers saved</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><BookOpen size={18} /></div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">128</div>
          <div className="text-[11px] font-medium flex items-center gap-1 text-emerald-600"><ArrowUp size={12}/> +12 this week</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-indigo-200 transition-all duration-300">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[12px] text-gray-500 font-medium">Prototypes built</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Code size={18} /></div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{dashboardData?.stats?.saved_prototypes || 0}</div>
          <div className="text-[11px] font-medium flex items-center gap-1 text-red-500"><ArrowDown size={12}/> -2 vs last week</div>
        </div>
      </div>

      {/* Activity + Progress Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200 transition-all duration-300">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[15px] font-bold text-gray-900">Recent activity</h3>
            <button className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700">View all</button>
          </div>
          
          <div className="space-y-5">
            {dashboardData?.recent_analyses?.slice(0, 4).map((analysis, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Brain size={18} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-gray-900 mb-0.5 line-clamp-1">
                    Validated "{analysis.text.substring(0, 30)}..."
                    <span className="ml-2 inline-block bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px]">{analysis.uniqueness_score}%</span>
                  </div>
                  <div className="text-[12px] text-gray-500 mb-1">{analysis.score_label}</div>
                  <div className="text-[11px] text-gray-400">{new Date(analysis.submitted_at).toLocaleString()}</div>
                </div>
              </div>
            )) || (
              <>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Brain size={18} /></div>
                  <div>
                    <div className="text-[13px] font-semibold text-gray-900 mb-0.5">Validated "AI Healthcare Monitoring" <span className="ml-2 inline-block bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px]">85%</span></div>
                    <div className="text-[12px] text-gray-500 mb-1">Gap found: Real-time alert system · 3 novel directions suggested</div>
                    <div className="text-[11px] text-gray-400">2 hours ago</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Code size={18} /></div>
                  <div>
                    <div className="text-[13px] font-semibold text-gray-900 mb-0.5">Generated React Dashboard component <span className="ml-2 inline-block bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px]">CodeStudio</span></div>
                    <div className="text-[12px] text-gray-500 mb-1">Framework: React + TypeScript · 142 lines</div>
                    <div className="text-[11px] text-gray-400">5 hours ago</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><FileSearch size={18} /></div>
                  <div>
                    <div className="text-[13px] font-semibold text-gray-900 mb-0.5">Exported comprehensive report</div>
                    <div className="text-[12px] text-gray-500 mb-1">PDF · 8 pages · Plagiarism + Validation + Literature</div>
                    <div className="text-[11px] text-gray-400">2 days ago</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200 transition-all duration-300">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[15px] font-bold text-gray-900">Your progress</h3>
            <span className="text-[12px] font-bold text-indigo-600">68%</span>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-[12px] mb-1.5 font-medium">
              <span className="flex items-center gap-1"><Check size={14} className="text-emerald-500"/> First validation</span>
              <span className="text-emerald-500">Done</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-full rounded-full"></div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-[12px] mb-1.5 font-medium">
              <span className="flex items-center gap-1"><Check size={14} className="text-emerald-500"/> First prototype</span>
              <span className="text-emerald-500">Done</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-full rounded-full"></div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-[12px] mb-1.5 font-medium">
              <span className="flex items-center gap-1"><Clock size={14} className="text-amber-500"/> Save 10 papers</span>
              <span className="text-gray-500">7/10</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-[70%] rounded-full"></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-[12px] mb-1.5 font-medium">
              <span className="flex items-center gap-1 text-gray-500"><div className="w-3.5 h-3.5 border-2 border-gray-300 rounded-full"></div> Share a report</span>
              <span className="text-gray-500">0/1</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 w-0 rounded-full"></div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
