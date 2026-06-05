import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  LightBulbIcon,
  CodeBracketIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  RocketLaunchIcon,
  ClockIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProjects, setShowProjects] = useState(true);

  const menuItems = [
    { name: 'Dashboard', icon: HomeIcon, path: '/dashboard' },
    { name: 'Idea Validator', icon: LightBulbIcon, path: '/idea-validator' },
    { name: 'Code Generator', icon: CodeBracketIcon, path: '/code-generator' },
    { name: 'Plagiarism Checker', icon: MagnifyingGlassIcon, path: '/plagiarism-checker' },
    { name: 'Literature Review', icon: BookOpenIcon, path: '/literature-review' },
    { name: 'Prototype Builder', icon: RocketLaunchIcon, path: '/prototype-builder' },
  ];

  const recentProjects = [
    { name: 'Crop Disease Detection App', time: '2 hours ago' },
    { name: 'Smart Parking System', time: '5 hours ago' },
    { name: 'Mental Health Chatbot', time: '1 day ago' },
    { name: 'Blockchain Voting System', time: '2 days ago' },
    { name: 'Waste Management App', time: '3 days ago' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-purple-900 text-white h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-purple-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">I</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">InnoCheck</h1>
            <p className="text-xs text-purple-300">Innovation Suite</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-purple-700 text-white shadow-lg'
                    : 'text-purple-200 hover:bg-purple-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </div>

        {/* Recent Projects */}
        <div className="mt-8">
          <button
            onClick={() => setShowProjects(!showProjects)}
            className="w-full flex items-center justify-between px-4 py-2 text-purple-300 hover:text-white transition-colors"
          >
            <span className="text-xs font-semibold uppercase tracking-wider">Recent Projects</span>
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showProjects ? 'rotate-180' : ''}`} />
          </button>
          
          {showProjects && (
            <div className="mt-2 space-y-1">
              {recentProjects.map((project, index) => (
                <button
                  key={index}
                  className="w-full text-left px-4 py-2 text-sm text-purple-200 hover:bg-purple-800 hover:text-white rounded transition-all duration-200"
                >
                  <div className="font-medium">{project.name}</div>
                  <div className="text-xs text-purple-400 flex items-center mt-1">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    {project.time}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-purple-800 space-y-2">
        <button className="w-full flex items-center space-x-3 px-4 py-3 text-purple-200 hover:bg-purple-800 hover:text-white rounded-lg transition-all duration-200">
          <CogIcon className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
        <button className="w-full flex items-center space-x-3 px-4 py-3 text-purple-200 hover:bg-purple-800 hover:text-white rounded-lg transition-all duration-200">
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
