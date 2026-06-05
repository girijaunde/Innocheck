import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, User, ShieldAlert, Eye, EyeOff, Save, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [showOpenai, setShowOpenai] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // User Profile States
  const [profileName, setProfileName] = useState('Student Developer');
  const [profileEmail, setProfileEmail] = useState('student@hackathon.org');

  // Preferences
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [defaultFramework, setDefaultFramework] = useState('react');

  // Load existing keys from backend on mount
  useEffect(() => {
    const fetchKeys = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.settings.getKeys();
        if (response.data.success) {
          setOpenaiKey(response.data.openai_key || '');
          setGeminiKey(response.data.gemini_key || '');
        }
      } catch (err) {
        console.error('Error fetching API keys:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchKeys();
  }, []);

  const handleSaveKeys = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await apiService.settings.saveKeys({
        openai_key: openaiKey,
        gemini_key: geminiKey
      });
      if (response.data.success) {
        toast.success('API keys updated and reloaded on backend server successfully!');
      } else {
        toast.error('Failed to update API keys.');
      }
    } catch (err) {
      toast.error('Error connecting to backend: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    toast.success('Developer profile saved successfully!');
  };

  return (
    <div className="space-y-6 animate-fadeIn text-gray-800">
      <div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          System & Developer Settings
        </h1>
        <p className="text-xs text-gray-500 mt-1">Configure your LLM model APIs, user profile identity details, and export templates.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-200 rounded-3xl h-64 text-xs text-gray-400">
          <RefreshCw className="animate-spin text-indigo-600 mb-3" size={24} />
          Loading active settings from server...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1 & 2: API & Profile Configs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* API Config Panel */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 space-y-5">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-150 pb-3">
                <Key size={16} className="text-indigo-600" /> LLM Model API Keys
              </h3>
              
              <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
                <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[10px] leading-relaxed text-amber-800 font-medium">
                  <span className="font-bold">Important Quota Warning:</span> The current backend server runs locally. If your API calls fail, make sure to enter a valid, funded OpenAI or Gemini key. Free Gemini keys are available via Google AI Studio.
                </div>
              </div>

              <form onSubmit={handleSaveKeys} className="space-y-4 text-xs font-bold text-gray-700">
                {/* OpenAI Input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider">OpenAI API Key</label>
                  <div className="relative">
                    <input
                      type={showOpenai ? 'text' : 'password'}
                      placeholder="sk-proj-..."
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pr-10 outline-none focus:border-indigo-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenai(!showOpenai)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showOpenai ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Gemini Input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider">Gemini API Key</label>
                  <div className="relative">
                    <input
                      type={showGemini ? 'text' : 'password'}
                      placeholder="AIzaSy..."
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pr-10 outline-none focus:border-indigo-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGemini(!showGemini)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showGemini ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-indigo-100"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> SAVING KEYS...
                    </>
                  ) : (
                    <>
                      <Save size={14} /> SAVE & RELOAD KEYS
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Profile Config Panel */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 space-y-5">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-150 pb-3">
                <User size={16} className="text-indigo-600" /> Developer Profile Details
              </h3>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-bold text-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-gray-400 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-gray-400 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-3 border border-gray-200 hover:bg-gray-55 text-gray-700 rounded-xl font-bold transition-all shadow-sm"
                >
                  SAVE PROFILE
                </button>
              </form>
            </div>

          </div>

          {/* Column 3: Platform Preferences */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 flex flex-col justify-between h-fit space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-150 pb-3 mb-5">
                Preferences
              </h3>

              <div className="space-y-5 text-xs text-gray-700">
                {/* Dark Mode Preference */}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold block">Developer Theme</span>
                    <span className="text-[10px] text-gray-400">Toggle dark-mode preview workspace styling.</span>
                  </div>
                  <button
                    onClick={() => {
                      setDarkMode(!darkMode);
                      toast.success(darkMode ? 'Light Theme activated.' : 'Dark Theme simulation activated.');
                    }}
                    className={`w-11 h-6 rounded-full transition-all relative ${
                      darkMode ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                        darkMode ? 'left-6' : 'left-1'
                      }`}
                    ></div>
                  </button>
                </div>

                {/* Notifications Preference */}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold block">Action Notifications</span>
                    <span className="text-[10px] text-gray-400">Receive success sounds and popups on compilation.</span>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`w-11 h-6 rounded-full transition-all relative ${
                      notifications ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                        notifications ? 'left-6' : 'left-1'
                      }`}
                    ></div>
                  </button>
                </div>

                {/* Default Framework Preference */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Default CodeStudio Export</label>
                  <select
                    value={defaultFramework}
                    onChange={(e) => {
                      setDefaultFramework(e.target.value);
                      toast.success(`Default export set to ${e.target.value.toUpperCase()}`);
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none text-xs text-gray-700 font-bold"
                  >
                    <option value="react">React (JavaScript)</option>
                    <option value="react-ts">React (TypeScript)</option>
                    <option value="vue">Vue (JavaScript)</option>
                    <option value="html">Vanilla HTML/JS</option>
                  </select>
                </div>

              </div>
            </div>

            <div className="bg-indigo-600/5 text-indigo-700 p-4 rounded-2xl border border-indigo-100 text-[10px] text-center font-bold">
              InnoCheck Academic Build v1.4
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
