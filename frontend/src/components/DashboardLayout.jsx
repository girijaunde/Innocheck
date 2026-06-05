import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { 
  Search, Plus, LayoutDashboard, Brain, Code, BookOpen, 
  FileSearch, BarChart2, Download, Trophy, Wallet, CheckSquare, 
  Settings, Clock, Bell, ChevronDown, LogOut 
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active, badge, badgeColor }) => (
  <Link
    to={path}
    className={`flex items-center gap-3 px-4 py-2.5 mx-3 mb-1 rounded-xl transition-all ${
      active 
        ? "bg-indigo-50 text-indigo-700 font-semibold" 
        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"
    }`}
  >
    <Icon size={20} className={active ? "text-indigo-600" : ""} />
    <span className="flex-1 text-[13px]">{label}</span>
    {badge && (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
        badgeColor === 'red' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-700'
      }`}>
        {badge}
      </span>
    )}
  </Link>
);

const DashboardLayout = () => {
  const { pathname } = useLocation();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiService.auth.me();
        setUser(response.data);
      } catch (err) {}
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    apiService.auth.clearToken();
    window.location.href = '/login';
  };

  const isFullScreenPage = ['/codestudio', '/literature-review', '/idea-validator', '/plagiarism-checker'].includes(pathname);

  if (isFullScreenPage) {
    return (
      <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar */}
      <aside className="w-[280px] bg-white border-r border-gray-200 flex flex-col fixed h-screen overflow-y-auto z-50">
        <div className="p-5 border-b border-gray-200">
          <div className="sb-logo flex items-center gap-2.5">
            <div style={{ background: '#000', borderRadius: '8px', padding: '3px', width: '34px', height: '34px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/assets/logo.png" alt="InnoCheck" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            </div>
            <span className="sb-brand text-[18px] font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              InnoCheck
            </span>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="px-4 pt-4 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">My stuff</div>
        <button className="mx-4 mb-3 px-3 py-2.5 border border-dashed border-gray-300 rounded-xl flex items-center gap-2 text-gray-500 text-[13px] hover:bg-gray-50 hover:border-indigo-500 hover:text-indigo-600 transition-all">
          <Plus size={16} />
          <span className="font-medium">New notebook</span>
        </button>

        <div className="px-4 pt-2 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Features</div>
        <nav className="flex-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/dashboard" active={pathname === "/dashboard" || pathname === "/"} />
          <SidebarItem icon={Brain} label="Idea Validator" path="/idea-validator" active={pathname === "/idea-validator"} />
          <SidebarItem icon={Code} label="CodeStudio" path="/codestudio" active={pathname === "/codestudio"} />
          <SidebarItem icon={BookOpen} label="Literature Review" path="/literature-review" active={pathname === "/literature-review"} />
          <SidebarItem icon={FileSearch} label="Plagiarism Checker" path="/plagiarism-checker" active={pathname === "/plagiarism-checker"} />
          <SidebarItem icon={BarChart2} label="Analytics" path="/analytics" active={pathname === "/analytics"} />
          <SidebarItem icon={Download} label="Reports" path="/reports" active={pathname === "/reports"} />
          
          <div className="h-px bg-gray-200 mx-4 my-3"></div>
          
          <SidebarItem icon={Trophy} label="Rewards" path="/rewards" badge="3 new" active={pathname === "/rewards"} />
          <SidebarItem icon={Wallet} label="Wallet" path="/wallet" active={pathname === "/wallet"} />
          <SidebarItem icon={CheckSquare} label="Tasks" path="/tasks" badge="4" badgeColor="red" active={pathname === "/tasks"} />
          <SidebarItem icon={Settings} label="Settings" path="/settings" active={pathname === "/settings"} />
        </nav>

        <div className="h-px bg-gray-200 mx-4 mt-2 mb-3"></div>
        <div className="px-4 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Recents</div>
        <div className="px-4 pb-4 space-y-1">
          <div className="flex items-center gap-2 py-1.5 text-[12px] text-gray-500 hover:text-gray-700 cursor-pointer">
            <Clock size={14} /> <span className="truncate">InnoCheck Dashboard Blueprint</span>
          </div>
          <div className="flex items-center gap-2 py-1.5 text-[12px] text-gray-500 hover:text-gray-700 cursor-pointer">
            <Clock size={14} /> <span className="truncate">AI Healthcare Validation</span>
          </div>
          <div className="flex items-center gap-2 py-1.5 text-[12px] text-gray-500 hover:text-gray-700 cursor-pointer">
            <Clock size={14} /> <span className="truncate">CodeStudio Integration</span>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm">
            {user?.name ? user.name.substring(0,2).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-semibold text-gray-900 truncate">{user?.name || 'User'}</h4>
            <p className="text-[11px] text-gray-500">Pro member</p>
          </div>
          <LogOut size={16} className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors" onClick={handleLogout} />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-[280px] flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3 text-gray-600">
            <LayoutDashboard size={20} />
            <span className="text-base font-medium capitalize">
              {pathname === '/' ? 'Dashboard' : pathname.split('/')[1].replace('-', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center cursor-pointer relative hover:bg-gray-100 transition-colors">
              <Bell size={18} className="text-gray-600" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="w-7 h-7 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center font-bold text-[11px]">
                {user?.name ? user.name.substring(0,2).toUpperCase() : 'U'}
              </div>
              <span className="text-[13px] font-medium text-gray-700">{user?.name || 'User'}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
