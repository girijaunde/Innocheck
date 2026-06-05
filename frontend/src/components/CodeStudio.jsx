import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService, getErrorMessage } from '../services/api';
import toast from '../services/toast';
import {
  Download,
  Zap,
  Layers,
  FileText,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Folder,
  Cpu,
  Monitor,
  Tablet,
  Smartphone,
  CheckCircle,
  Code,
  Loader2,
  Check
} from 'lucide-react';
import SmartSuggestions from './SmartSuggestions';
import RefinementChat from './RefinementChat';
import TemplateGallery from './TemplateGallery';
import ProjectCard from './ProjectCard';
import CodeTester from './CodeTester';

const previewDevices = [
  { value: 'mobile', label: Smartphone, width: '375px' },
  { value: 'tablet', label: Tablet, width: '768px' },
  { value: 'laptop', label: Monitor, width: '1024px' },
];

const componentFrameworks = [
  { value: 'react', label: 'React', icon: '⚛️' },
  { value: 'vue', label: 'Vue', icon: '💚' },
  { value: 'flask', label: 'Flask', icon: '🐍' },
  { value: 'fastapi', label: 'FastAPI', icon: '⚡' },
  { value: 'html', label: 'HTML', icon: '📄' },
];

const templates = [
  { value: 'blank', label: 'Blank', icon: '📋' },
  { value: 'landing_page', label: 'Landing Page', icon: '🌐' },
  { value: 'dashboard', label: 'Dashboard', icon: '📊' },
  { value: 'form', label: 'Form', icon: '📝' },
  { value: 'ecommerce', label: 'E-commerce', icon: '🛒' },
];

const colorSchemes = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'brand', label: 'Brand', icon: '🎨' },
];

const exportOptions = [
  {
    name: 'Standard ZIP Package',
    icon: '📦',
    description: 'Export full React project scaffolding bundled with FastAPI backend API routers and SQLAlchemy database models.',
    actionKey: 'zip'
  },
  {
    name: 'GitHub Gist',
    icon: '🐙',
    description: 'Publish your component code directly as a public or private GitHub Gist to share with team members.',
    actionKey: 'gist'
  }
];

const CodeStudio = () => {
  // Navigation & Tabs
  const [activeOutputTab, setActiveOutputTab] = useState('console'); // 'console', 'seeds', 'originality', 'stack', 'test', 'export', 'templates', 'projects'
  
  // Custom Section Expanders
  const [expandSettings, setExpandSettings] = useState(true);
  const [expandFeatures, setExpandFeatures] = useState(true);
  
  // Scaffolding configuration states
  const [mode, setMode] = useState('component');
  const [description, setDescription] = useState('');
  const [framework, setFramework] = useState('react');
  const [typescript, setTypescript] = useState(false);
  const [templateType, setTemplateType] = useState('blank');
  const [colorScheme, setColorScheme] = useState('light');
  const [learningMode, setLearningMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('laptop');
  const [previewTab, setPreviewTab] = useState('sandbox'); // 'sandbox', 'code', 'pitch'
  
  // States for generated contents
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState(null);
  const [codeExplanation, setCodeExplanation] = useState('');
  const [smartStack, setSmartStack] = useState(null);
  
  // Custom tool states
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInstruction, setChatInstruction] = useState('');
  const [chatSessionId, setChatSessionId] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [exportResult, setExportResult] = useState(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectTags, setProjectTags] = useState('');
  const [projects, setProjects] = useState([]);
  const [templatesLibrary, setTemplatesLibrary] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('blank');

  // New Custom States
  const [mockDataResults, setMockDataResults] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [pitchDeckMarkdown, setPitchDeckMarkdown] = useState('');
  const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
  const [originalityResults, setOriginalityResults] = useState(null);
  const [isScanningOriginality, setIsScanningOriginality] = useState(false);

  // Agentic progress steps
  const [generationStep, setGenerationStep] = useState(0); // 0 = idle, 1 = analyzing, 2 = stack, 3 = code, 4 = plagiarism, 5 = done

  const currentCode = mode === 'component' ? results?.code : results?.html;
  const currentFile = mode === 'component'
    ? framework === 'react' ? `Component.${typescript ? 'tsx' : 'jsx'}`
      : framework === 'vue' ? 'Component.vue'
      : framework === 'flask' || framework === 'fastapi' ? 'app.py'
      : 'index.html'
    : 'index.html';

  const smartSuggestions = useMemo(() => {
    const suggestions = [];
    if (smartStack?.reason) suggestions.push(smartStack.reason);
    if (results?.explanation) suggestions.push('Use the explanation panel to understand code structure.');
    return suggestions;
  }, [smartStack, results]);

  useEffect(() => {
    loadTemplates();
    loadMyProjects();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await apiService.codestudio.getTemplates();
      setTemplatesLibrary(response.data.templates || []);
    } catch (err) {
      console.warn('Unable to load templates', err);
    }
  };

  const loadMyProjects = async () => {
    if (!apiService.auth?.isAuthenticated?.()) return;
    try {
      const response = await apiService.codestudio.getMyProjects();
      setProjects(response.data.projects || []);
    } catch (err) {
      console.warn('Unable to load projects', err);
    }
  };

  const getLineHint = (line) => {
    if (!learningMode || !line.trim()) return '';
    if (/import|from\s+['"]/.test(line)) return 'Imports modules and helpers used later in the file.';
    if (/useState|set[A-Z]/.test(line)) return 'Manages local component state for dynamic UI updates.';
    if (/return\s*\(/.test(line)) return 'Defines the rendered UI that the browser displays.';
    if (/className=/.test(line)) return 'Applies styling classes to control layout and appearance.';
    if (/const\s+.*=\s*\(/.test(line)) return 'Declares a constant variable used in this component.';
    if (/async\s+function|await\s+/.test(line)) return 'Handles asynchronous actions, such as API calls or delays.';
    if (/fetch\(/.test(line)) return 'Calls a remote API and waits for the returned data.';
    if (/useEffect\(/.test(line)) return 'Runs code when the component mounts or specific values change.';
    if (/router|Route|Link/.test(line)) return 'Sets up navigation paths between app screens.';
    return line.length > 60 ? 'Generated logic or layout definition.' : 'Code details.';
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Describe your idea to generate code.');
      return;
    }
    setIsGenerating(true);
    setResults(null);
    setTestResults(null);
    setExportResult(null);
    setMockDataResults(null);
    setPitchDeckMarkdown('');
    setOriginalityResults(null);
    setActiveOutputTab('console');
    
    // Animate progress logs
    setGenerationStep(1);
    
    try {
      let response;
      if (mode === 'component') {
        setTimeout(() => setGenerationStep(2), 1200);
        setTimeout(() => setGenerationStep(3), 2800);
        response = await apiService.codestudio.generateComponent({
          description,
          framework,
          typescript,
        });
      } else {
        setTimeout(() => setGenerationStep(2), 1500);
        setTimeout(() => setGenerationStep(3), 3200);
        response = await apiService.codestudio.generatePrototype({
          description,
          template_type: templateType,
          color_scheme: colorScheme,
        });
      }
      
      setTimeout(() => setGenerationStep(4), 4500);
      setResults(response.data);
      setCodeExplanation('');
      
      setTimeout(() => {
        setGenerationStep(5);
        toast.success('Project generated successfully!');
      }, 5500);

    } catch (error) {
      console.error('Generation error:', error);
      toast.error(getErrorMessage(error));
      setGenerationStep(0);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePredictStack = async () => {
    if (!description.trim()) {
      toast.error('Add a description before predicting the stack.');
      return;
    }
    try {
      const response = await apiService.codestudio.suggestStack({ description });
      setSmartStack(response.data);
      setActiveOutputTab('stack');
      toast.success('Smart stack prediction ready.');
    } catch (error) {
      console.error('Stack suggestion error:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleExplain = async () => {
    const code = currentCode;
    if (!code) {
      toast.error('Generate code first.');
      return;
    }
    try {
      const response = await apiService.codestudio.explainCode({ code, framework });
      setCodeExplanation(response.data.explanation);
      setPreviewTab('code');
      toast.success('Explanation loaded in side editor.');
    } catch (error) {
      console.error('Explanation error:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleChatRefine = async () => {
    if (!chatInstruction.trim()) {
      toast.error('Enter a refinement instruction.');
      return;
    }
    if (!currentCode) {
      toast.error('Generate code before refining it.');
      return;
    }
    setIsChatting(true);
    try {
      const response = await apiService.codestudio.chatRefine({
        instruction: chatInstruction,
        code: currentCode,
        framework,
        code_type: mode,
        session_id: chatSessionId,
      });
      setChatSessionId(response.data.session_id);
      setChatHistory(response.data.messages || []);
      setResults((prev) => ({
        ...prev,
        ...(mode === 'component' ? { code: response.data.code } : { html: response.data.code }),
      }));
      setChatInstruction('');
      toast.success('Code refined through chat.');
    } catch (error) {
      console.error('Chat refine error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsChatting(false);
    }
  };

  const handleTestCode = async () => {
    const code = currentCode;
    if (!code) {
      toast.error('Generate code first.');
      return;
    }
    try {
      const response = await apiService.codestudio.testCode({ code, framework });
      setTestResults(response.data);
      setActiveOutputTab('test');
      toast.success('Code testing complete.');
    } catch (error) {
      console.error('Test code error:', error);
      toast.error(getErrorMessage(error));
    }
  };

  // Custom Feature: Mock Database Seeder
  const handleGenerateMockData = async () => {
    if (!description.trim()) {
      toast.error('Add a description to seed custom database data.');
      return;
    }
    setIsSeeding(true);
    setMockDataResults(null);
    try {
      const response = await apiService.codestudio.generateMockData({ description });
      setMockDataResults(response.data.data);
      setActiveOutputTab('seeds');
      toast.success('Mock database data seeded successfully!');
    } catch (error) {
      console.error('Mock seeding error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSeeding(false);
    }
  };

  // Custom Feature: Pitch Deck Generator
  const handleGeneratePitchDeck = async () => {
    if (!description.trim() || !currentCode) {
      toast.error('Generate project code first before creating a pitch deck.');
      return;
    }
    setIsGeneratingDeck(true);
    setPitchDeckMarkdown('');
    try {
      const response = await apiService.codestudio.generatePitchDeck({
        description,
        code: currentCode
      });
      setPitchDeckMarkdown(response.data.markdown);
      setPreviewTab('pitch');
      toast.success('AI Pitch Deck Outline created successfully!');
    } catch (error) {
      console.error('Pitch deck error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsGeneratingDeck(false);
    }
  };

  // Custom Feature: Originality/Plagiarism checker
  const handleOriginalityCheck = async () => {
    const code = currentCode;
    if (!code) {
      toast.error('Generate project code first before scanning.');
      return;
    }
    setIsScanningOriginality(true);
    setOriginalityResults(null);
    try {
      const response = await apiService.codestudio.checkOriginality({ code });
      setOriginalityResults(response.data);
      setActiveOutputTab('originality');
      toast.success('Code originality scan completed!');
    } catch (error) {
      console.error('Originality scan error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsScanningOriginality(false);
    }
  };

  const handleExport = async (type) => {
    if (!currentCode) {
      toast.error('Generate code first.');
      return;
    }
    if (type === 'gist') {
      const gistText = encodeURIComponent(currentCode);
      const url = `https://gist.github.com/?file=${currentFile}&content=${gistText}`;
      window.open(url, '_blank');
      return;
    }
    
    try {
      const response = await apiService.codestudio.exportPlatform({
        platform: type === 'zip' ? 'Standard Website' : type,
        description,
        code: currentCode,
        framework,
        code_type: mode,
      });
      setExportResult(response.data);
      setActiveOutputTab('export');
      toast.success(`${type.toUpperCase()} package generated successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const downloadZip = () => {
    if (!exportResult?.zip_base64) {
      toast.error('Generate a export ZIP package first.');
      return;
    }
    try {
      const bytes = Uint8Array.from(atob(exportResult.zip_base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${description.slice(0, 20).replace(/\W+/g, '_') || 'codestudio'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Download started.');
    } catch (error) {
      console.error('ZIP download error', error);
      toast.error('Failed to download ZIP.');
    }
  };

  const handleSaveProject = async () => {
    if (!projectTitle.trim()) {
      toast.error('Add a title for your project.');
      return;
    }
    if (!currentCode) {
      toast.error('Generate code before saving.');
      return;
    }
    setIsSaving(true);
    try {
      const tags = projectTags.split(',').map((tag) => tag.trim()).filter(Boolean);
      await apiService.codestudio.saveProject({
        title: projectTitle,
        description: description || 'Saved from CodeStudio',
        framework,
        code: currentCode,
        files: { [currentFile]: currentCode },
        tags,
        is_public: false,
      });
      toast.success('Project saved.');
      setProjectTitle('');
      setProjectTags('');
      loadMyProjects();
      setActiveOutputTab('projects');
    } catch (error) {
      console.error('Save project error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleForkProject = async (projectId) => {
    try {
      await apiService.codestudio.forkProject(projectId);
      toast.success('Project forked.');
      loadMyProjects();
      setActiveOutputTab('projects');
    } catch (error) {
      console.error('Fork project error:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const applyTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    setTemplateType(templateId);
    const selection = templatesLibrary
      .flatMap((category) => category.items || [category])
      .find((item) => item.id === templateId || item.value === templateId);
    if (selection) {
      setDescription(selection.description || selection.label || description);
      toast.success(`Template ${selection.name || selection.label} selected.`);
      setActiveOutputTab('console');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-gray-800">
      
      {/* ================= COLUMN 1: LEFT CONFIGURATION & FEATURES SIDEBAR ================= */}
      <aside className="w-[360px] border-r border-gray-200 bg-white flex flex-col shrink-0 overflow-y-auto">
        
        {/* Back Button */}
        <div className="px-5 pt-4">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-600 transition">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Workspace Brand Header */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-2 bg-gradient-to-r from-slate-50 to-white">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-md shadow-indigo-600/10">
            CS
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-gray-900 tracking-tight">CodeStudio Workspace</h2>
            <p className="text-[10px] text-gray-400 font-medium">Unified AI Prototyper</p>
          </div>
        </div>

        {/* Unified Options Panels */}
        <div className="p-4 space-y-4">
          
          {/* Group A: Target Scaffolding Options */}
          <div className="border border-slate-100 rounded-2xl bg-slate-50/50 overflow-hidden transition-all">
            <button
              onClick={() => setExpandSettings(!expandSettings)}
              className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-gray-700 hover:bg-slate-100/50 transition"
            >
              <span className="flex items-center gap-2">
                <Layers size={14} className="text-indigo-600" /> Scaffolding Configuration
              </span>
              {expandSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {expandSettings && (
              <div className="p-3.5 border-t border-slate-100 bg-white space-y-4 text-xs">
                
                {/* Mode Selector */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Build Target</label>
                  <div className="flex gap-2">
                    <button
                      className={`flex-1 rounded-lg py-1.5 text-center font-bold border transition ${mode === 'component' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-gray-600 border-gray-200 hover:bg-slate-100'}`}
                      onClick={() => setMode('component')}
                    >
                      Single Component
                    </button>
                    <button
                      className={`flex-1 rounded-lg py-1.5 text-center font-bold border transition ${mode === 'prototype' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-gray-600 border-gray-200 hover:bg-slate-100'}`}
                      onClick={() => setMode('prototype')}
                    >
                      Full Prototype
                    </button>
                  </div>
                </div>

                {/* Framework Selector */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Framework</label>
                  <select
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 p-2.5 outline-none font-bold text-gray-700 focus:border-indigo-500 transition"
                  >
                    {componentFrameworks.map((fw) => (
                      <option key={fw.value} value={fw.value}>
                        {fw.icon} {fw.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub Options depending on mode */}
                {mode === 'component' ? (
                  <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-slate-50 px-3 py-3 cursor-pointer hover:bg-slate-100 transition">
                    <input 
                      type="checkbox" 
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      checked={typescript} 
                      onChange={(e) => setTypescript(e.target.checked)} 
                    />
                    <span className="font-bold text-gray-700">Use TypeScript (.tsx)</span>
                  </label>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">Template Layout</label>
                      <select
                        value={templateType}
                        onChange={(e) => setTemplateType(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-slate-50 p-2 outline-none font-bold text-gray-700 focus:border-indigo-500 transition"
                      >
                        {templates.map((tpl) => (
                          <option key={tpl.value} value={tpl.value}>
                            {tpl.icon} {tpl.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">Color Theme</label>
                      <div className="flex gap-2">
                        {colorSchemes.map((scheme) => (
                          <button
                            key={scheme.value}
                            type="button"
                            className={`flex-1 rounded-lg py-1 text-center font-bold transition flex items-center justify-center gap-1 border ${
                              colorScheme === scheme.value 
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm' 
                                : 'bg-slate-50 border-gray-200 text-gray-600 hover:bg-slate-100'
                            }`}
                            onClick={() => setColorScheme(scheme.value)}
                          >
                            <span>{scheme.icon}</span>
                            <span>{scheme.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Group B: AI Smart Feature Workbench */}
          <div className="border border-slate-100 rounded-2xl bg-slate-50/50 overflow-hidden transition-all">
            <button
              onClick={() => setExpandFeatures(!expandFeatures)}
              className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-gray-700 hover:bg-slate-100/50 transition"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-600" /> AI Feature Actions
              </span>
              {expandFeatures ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {expandFeatures && (
              <div className="p-3.5 border-t border-slate-100 bg-white grid grid-cols-1 gap-2.5 text-xs">
                
                <button
                  onClick={handleGenerateMockData}
                  disabled={isSeeding || !description.trim()}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/30 text-left font-bold text-gray-800 transition disabled:opacity-50 shadow-sm"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-lg">📦</span>
                    <div>
                      <p className="text-[11px] font-black text-gray-900">AI Database Seeds</p>
                      <p className="text-[9px] text-gray-400 font-medium">Seed customized tables (JSON)</p>
                    </div>
                  </span>
                  {isSeeding ? <Loader2 size={14} className="animate-spin text-emerald-600" /> : <ChevronDown size={14} className="text-gray-400" />}
                </button>

                <button
                  onClick={handleOriginalityCheck}
                  disabled={isScanningOriginality || !currentCode}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl border border-violet-100 hover:border-violet-300 hover:bg-violet-50/30 text-left font-bold text-gray-800 transition disabled:opacity-50 shadow-sm"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-lg">🛡️</span>
                    <div>
                      <p className="text-[11px] font-black text-gray-900">Sentence-BERT Uniqueness</p>
                      <p className="text-[9px] text-gray-400 font-medium">Verify code similarity scan</p>
                    </div>
                  </span>
                  {isScanningOriginality ? <Loader2 size={14} className="animate-spin text-violet-600" /> : <ChevronDown size={14} className="text-gray-400" />}
                </button>

                <button
                  onClick={handleGeneratePitchDeck}
                  disabled={isGeneratingDeck || !currentCode}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50/30 text-left font-bold text-gray-800 transition disabled:opacity-50 shadow-sm"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-lg">📊</span>
                    <div>
                      <p className="text-[11px] font-black text-gray-900">Pitch Slide deck outline</p>
                      <p className="text-[9px] text-gray-400 font-medium">Generates custom pitch slides</p>
                    </div>
                  </span>
                  {isGeneratingDeck ? <Loader2 size={14} className="animate-spin text-indigo-600" /> : <ChevronDown size={14} className="text-gray-400" />}
                </button>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={handleExplain}
                    disabled={!currentCode}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition text-[9px] font-bold text-gray-600 disabled:opacity-40"
                    title="Explain code structure"
                  >
                    <FileText size={16} className="text-indigo-600 mb-1" />
                    <span>Explain</span>
                  </button>

                  <button
                    onClick={handleTestCode}
                    disabled={!currentCode}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition text-[9px] font-bold text-gray-600 disabled:opacity-40"
                    title="Run code QA testing logs"
                  >
                    <Zap size={16} className="text-indigo-600 mb-1" />
                    <span>Test QA</span>
                  </button>

                  <button
                    onClick={handlePredictStack}
                    disabled={!description.trim()}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition text-[9px] font-bold text-gray-600 disabled:opacity-40"
                    title="Suggest optimal stack details"
                  >
                    <Layers size={16} className="text-indigo-600 mb-1" />
                    <span>Stack</span>
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Group C: Utility Collections */}
          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-700">
            <button
              onClick={() => setActiveOutputTab('templates')}
              className={`flex items-center justify-center gap-1.5 py-3 rounded-xl border transition shadow-sm ${activeOutputTab === 'templates' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
            >
              <BookOpen size={14} /> Templates
            </button>

            <button
              onClick={() => setActiveOutputTab('projects')}
              className={`flex items-center justify-center gap-1.5 py-3 rounded-xl border transition shadow-sm ${activeOutputTab === 'projects' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
            >
              <Folder size={14} /> Saved Backups
            </button>

            <button
              onClick={() => setActiveOutputTab('export')}
              className={`col-span-2 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-indigo-600 hover:to-indigo-500 shadow-md transition`}
            >
              <Download size={14} /> Export full package ZIP
            </button>
          </div>

        </div>

        {/* Sidebar Footer - Enable Learning mode */}
        <div className="mt-auto p-4 border-t border-gray-100 bg-slate-50/50">
          <button
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
              learningMode 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setLearningMode((prev) => !prev)}
          >
            <BookOpen size={14} />
            {learningMode ? 'Learning Mode: ON' : 'Enable Learning Mode'}
          </button>
        </div>
      </aside>

      {/* ================= COLUMN 2: MIDDLE PROMPT WORKSPACE & TERMINAL ================= */}
      <main className="flex-1 bg-slate-50 p-6 overflow-y-auto flex flex-col border-r border-gray-200 min-w-0">
        
        {/* Main Header title */}
        <div className="mb-5 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Sparkles size={20} className="text-indigo-600" />
              CodeStudio Studio
            </h1>
            <p className="text-[11px] text-gray-400 mt-0.5">Prompt, build sandbox packages, and seed database mocks.</p>
          </div>
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider bg-slate-200/50 border px-3 py-1 rounded-full">
            💡 {framework} scaffolding
          </span>
        </div>

        <div className="flex-1 flex flex-col gap-6 min-h-0">
          
          {/* Main prompt input box card (Centered and Premium!) */}
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 shrink-0">
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                <span>💡</span> Enter Your Project Prompt Idea
              </label>
              <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5">
                <span>⚡</span> Auto-language generation active
              </div>
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-gray-200 bg-slate-50/50 p-4 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none font-medium leading-relaxed"
              placeholder="Describe your project, layout features, UI design preferences, or workflows in plain English, Hindi, or Marathi..."
            />

            {/* Glowing Action Button */}
            <div className="flex justify-end mt-4">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !description.trim()}
                className={`py-3.5 px-8 rounded-full font-extrabold text-[12px] tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg ${
                  isGenerating || !description.trim()
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white hover:scale-[1.03] hover:shadow-indigo-600/20'
                }`}
              >
                <Sparkles size={14} />
                {isGenerating ? 'Synthesizing layout...' : '⚡ Generate Project Code'}
              </button>
            </div>
          </div>

          {/* Agentic Progress Tracker */}
          {generationStep > 0 && generationStep < 5 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Cpu className="animate-spin text-indigo-600" size={16} /> Agentic Scaffolder Status
                </span>
                <span className="text-[10px] font-bold text-indigo-600 animate-pulse bg-indigo-50 px-2 py-0.5 rounded">
                  In Progress...
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[10px] font-bold">
                <div className={`p-2 border rounded-xl flex items-center gap-2 transition ${generationStep >= 1 ? 'border-indigo-200 bg-indigo-50/50 text-indigo-700' : 'border-slate-100 text-slate-400'}`}>
                  {generationStep > 1 ? <Check size={12} /> : <Loader2 size={12} className="animate-spin" />}
                  <span>Analyzing Idea</span>
                </div>
                <div className={`p-2 border rounded-xl flex items-center gap-2 transition ${generationStep >= 2 ? 'border-indigo-200 bg-indigo-50/50 text-indigo-700' : 'border-slate-100 text-slate-400'}`}>
                  {generationStep > 2 ? <Check size={12} /> : generationStep === 2 ? <Loader2 size={12} className="animate-spin" /> : <Code size={12} />}
                  <span>Predicting Tech</span>
                </div>
                <div className={`p-2 border rounded-xl flex items-center gap-2 transition ${generationStep >= 3 ? 'border-indigo-200 bg-indigo-50/50 text-indigo-700' : 'border-slate-100 text-slate-400'}`}>
                  {generationStep > 3 ? <Check size={12} /> : generationStep === 3 ? <Loader2 size={12} className="animate-spin" /> : <Code size={12} />}
                  <span>Writing Code</span>
                </div>
                <div className={`p-2 border rounded-xl flex items-center gap-2 transition ${generationStep >= 4 ? 'border-indigo-200 bg-indigo-50/50 text-indigo-700' : 'border-slate-100 text-slate-400'}`}>
                  {generationStep === 4 ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  <span>S-BERT Scans</span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Console Outputs Terminal Dashboard */}
          <div className="flex-1 bg-white border border-gray-200 rounded-3xl p-5 shadow-sm overflow-hidden flex flex-col min-h-0">
            
            {/* Terminal Console Nav Tabs */}
            <div className="flex items-center gap-1 border-b border-gray-100 pb-3 mb-4 overflow-x-auto shrink-0 scrollbar-none">
              <button
                onClick={() => setActiveOutputTab('console')}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition shrink-0 ${activeOutputTab === 'console' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-400 hover:bg-slate-50'}`}
              >
                📝 Main Console
              </button>
              
              <button
                onClick={() => setActiveOutputTab('seeds')}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition shrink-0 ${activeOutputTab === 'seeds' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-400 hover:bg-slate-50'}`}
              >
                📦 Database Seeds
              </button>

              <button
                onClick={() => setActiveOutputTab('originality')}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition shrink-0 ${activeOutputTab === 'originality' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-400 hover:bg-slate-50'}`}
              >
                🛡️ Similarity Scan
              </button>

              <button
                onClick={() => setActiveOutputTab('stack')}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition shrink-0 ${activeOutputTab === 'stack' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-400 hover:bg-slate-50'}`}
              >
                🛠️ Stack Suggest
              </button>

              <button
                onClick={() => setActiveOutputTab('test')}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition shrink-0 ${activeOutputTab === 'test' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-400 hover:bg-slate-50'}`}
              >
                ⚡ QA Test Logs
              </button>

              <button
                onClick={() => setActiveOutputTab('templates')}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition shrink-0 ${activeOutputTab === 'templates' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-400 hover:bg-slate-50'}`}
              >
                📋 Templates Gallery
              </button>

              <button
                onClick={() => setActiveOutputTab('projects')}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition shrink-0 ${activeOutputTab === 'projects' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-400 hover:bg-slate-50'}`}
              >
                📁 SQLite Cache
              </button>

              <button
                onClick={() => setActiveOutputTab('export')}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition shrink-0 ${activeOutputTab === 'export' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-400 hover:bg-slate-50'}`}
              >
                🌐 Export Package
              </button>
            </div>

            {/* Dynamic Tab Contents Panel */}
            <div className="flex-1 overflow-y-auto min-h-0 text-xs">
              
              {/* TAB 1: Console / Suggestions */}
              {activeOutputTab === 'console' && (
                <div className="space-y-4">
                  {results ? (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 space-y-3">
                      <h4 className="font-extrabold text-sm text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle size={16} /> Scaffolding Workspace Ready
                      </h4>
                      <p className="text-gray-600 leading-relaxed text-[11px]">
                        The React components and FastAPI servers have been successfully compiled in the workspace backend cache. 
                        Use the <strong>AI Feature Actions</strong> on the left panel to run diagnostics, seed sample databases, or analyze uniqueness scores.
                      </p>
                      {smartSuggestions.length > 0 && (
                        <div className="mt-3 bg-white border border-emerald-100 rounded-xl p-3.5">
                          <span className="font-bold text-[10px] text-emerald-700 uppercase tracking-wider block mb-1.5">Smart Recommendations:</span>
                          <SmartSuggestions suggestions={smartSuggestions} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-200 bg-slate-50/30 rounded-2xl">
                      <Cpu size={36} className="text-gray-300 mb-3" />
                      <h4 className="font-bold text-gray-700 text-xs">CodeStudio Workspace Active</h4>
                      <p className="text-gray-400 max-w-sm mt-1 leading-relaxed text-[10px]">
                        Describe your app idea in the Prompt box above, or select a template to scaffold your project stack instantly.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Seeds database */}
              {activeOutputTab === 'seeds' && (
                <div className="space-y-3">
                  {mockDataResults ? (
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Seeded JSON Mock Objects</p>
                      <div className="bg-[#02040a] rounded-2xl p-4 overflow-x-auto max-h-[300px] border border-slate-800">
                        <code className="text-[11px] text-emerald-400 whitespace-pre font-mono">
                          {JSON.stringify(mockDataResults, null, 2)}
                        </code>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8 text-gray-400 border border-dashed rounded-xl bg-slate-50/50">
                      📦 Click **AI Database Seeds** in the sidebar features to generate high-fidelity sample tables custom-fit to your project description.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Originality scan */}
              {activeOutputTab === 'originality' && (
                <div className="space-y-4">
                  {originalityResults ? (
                    <div className="space-y-3 border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                          <span className="block text-[9px] uppercase font-bold text-emerald-800 tracking-wider">S-BERT Uniqueness</span>
                          <span className="text-2xl font-black text-emerald-600 mt-1 block">{originalityResults.unique_percentage}%</span>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-3.5 flex flex-col justify-center">
                          <span className="text-xs font-bold text-gray-900">{originalityResults.status_text}</span>
                          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{originalityResults.summary}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8 text-gray-400 border border-dashed rounded-xl bg-slate-50/50">
                      🛡️ Click **Sentence-BERT Uniqueness** in the sidebar features to scan your compiled prototype against local plagiarism registries.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Tech Stack Suggestions */}
              {activeOutputTab === 'stack' && (
                <div className="space-y-3">
                  {smartStack ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                      <h4 className="font-bold text-xs text-gray-900 border-b border-slate-100 pb-2">🛠️ Predicted Hackathon Tech Stack</h4>
                      <div className="space-y-2 text-[11px] leading-relaxed">
                        <p><strong>Primary Stack:</strong> <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">{smartStack.primary_stack}</span></p>
                        <p className="text-gray-600"><strong>AI Rationale:</strong> {smartStack.reason}</p>
                        <p><strong>Estimated Build Time:</strong> <span className="text-emerald-600 font-bold">{smartStack.estimated_time || '4-6 hours'}</span></p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8 text-gray-400 border border-dashed rounded-xl bg-slate-50/50">
                      🛠️ Click **Suggest Stack** (Stack) in the sidebar tools to predict databases, dependencies, and estimated developer hours for your app.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: QA Testing logs */}
              {activeOutputTab === 'test' && (
                <div className="space-y-3">
                  {testResults ? (
                    <div className="border border-slate-100 bg-white rounded-2xl p-4 shadow-sm">
                      <CodeTester results={testResults} />
                    </div>
                  ) : (
                    <div className="text-center p-8 text-gray-400 border border-dashed rounded-xl bg-slate-50/50">
                      ⚡ Click **Test QA** in the sidebar tools to simulate headless responsive layouts, compliance, and DOM rendering logs.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: Templates Gallery */}
              {activeOutputTab === 'templates' && (
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                  <TemplateGallery
                    templates={templatesLibrary}
                    selectedTemplate={selectedTemplate}
                    onSelect={applyTemplate}
                  />
                </div>
              )}

              {/* TAB 7: My SQLite Backups */}
              {activeOutputTab === 'projects' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h3 className="font-extrabold text-xs text-gray-900">Workspace Project Backups</h3>
                    <span className="text-[9px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded font-bold border">SQLite Cache</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 max-h-[220px] overflow-y-auto p-0.5">
                    {projects.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-slate-50 p-6 text-center text-[10px] text-gray-400">
                        No saved projects yet. Type in a prompt and generate one!
                      </div>
                    ) : (
                      projects.map((proj) => (
                        <ProjectCard key={proj.id} project={proj} onFork={handleForkProject} />
                      ))
                    )}
                  </div>

                  {/* Save Active Project panel */}
                  <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <h4 className="font-bold text-[11px] text-gray-800">Save Active Scaffolding</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-[10px] text-gray-800 outline-none focus:border-indigo-500 font-bold"
                        placeholder="Project title (e.g. My Saas)"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                      />
                      <input
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-[10px] text-gray-800 outline-none focus:border-indigo-500 font-bold"
                        placeholder="Tags (e.g. #medical, #react)"
                        value={projectTags}
                        onChange={(e) => setProjectTags(e.target.value)}
                      />
                    </div>
                    <button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] px-5 py-2.5 rounded-xl shadow-sm transition disabled:opacity-60"
                      onClick={handleSaveProject}
                      disabled={!projectTitle.trim() || !currentCode || isSaving}
                    >
                      {isSaving ? 'Saving Backups...' : '💾 Save Current Project'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 8: Export ZIP options */}
              {activeOutputTab === 'export' && (
                <div className="space-y-4">
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                    <h3 className="font-extrabold text-xs text-gray-900">One-Click Project Packaging</h3>
                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                      Export your compiled frontend scaffolding combined with uvicorn FastAPI server endpoints.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {exportOptions.map((opt) => (
                      <button
                        key={opt.name}
                        className="border border-gray-200 hover:border-indigo-400 hover:bg-slate-50/50 rounded-xl p-3.5 text-left transition flex items-start gap-2.5 shadow-sm"
                        onClick={() => handleExport(opt.actionKey)}
                      >
                        <span className="text-xl mt-0.5">{opt.icon}</span>
                        <div>
                          <h4 className="font-bold text-[10px] text-gray-900">{opt.name}</h4>
                          <p className="text-[9px] text-gray-400 mt-0.5 leading-relaxed font-medium">{opt.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center">
                    <button
                      onClick={downloadZip}
                      disabled={!exportResult?.zip_base64}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] px-5 py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-60"
                    >
                      <Download size={12} /> Download ZIP Package
                    </button>
                    <div className="text-[9px] text-gray-400 font-bold">
                      {exportResult?.zip_base64 ? '📦 Package ready to download!' : '⚠️ Trigger export ZIP in sidebar first.'}
                    </div>
                  </div>

                  {exportResult?.instructions && (
                    <div className="bg-slate-50 border border-gray-200 rounded-xl p-3.5 text-[10px] text-gray-600 leading-relaxed font-mono whitespace-pre-wrap">
                      <strong className="text-gray-900 block mb-1">Deployment Instructions:</strong>
                      {exportResult.instructions}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </main>

      {/* ================= COLUMN 3: RIGHT PANEL (LIVE PREVIEW & SIMULATOR) ================= */}
      <aside className="w-[500px] border-l border-gray-200 bg-white flex flex-col shrink-0 overflow-hidden">
        
        {/* Toggle tabs for Sandbox View */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex gap-1">
            <button
              onClick={() => setPreviewTab('sandbox')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                previewTab === 'sandbox' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-white hover:text-gray-900'
              }`}
            >
              👁️ Preview Sandbox
            </button>
            <button
              onClick={() => setPreviewTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                previewTab === 'code' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-white hover:text-gray-900'
              }`}
            >
              💻 Code Editor
            </button>
            <button
              onClick={() => setPreviewTab('pitch')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                previewTab === 'pitch' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-white hover:text-gray-900'
              }`}
            >
              📄 AI Pitch Deck
            </button>
          </div>

          {/* Device simulator toggle switches (Sandbox only) */}
          {previewTab === 'sandbox' && (
            <div className="flex gap-1 bg-slate-200/50 p-0.5 rounded-lg">
              {previewDevices.map((dev) => {
                const Icon = dev.label;
                return (
                  <button
                    key={dev.value}
                    onClick={() => setPreviewDevice(dev.value)}
                    className={`p-1.5 rounded-md transition ${previewDevice === dev.value ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}
                    title={dev.value}
                  >
                    <Icon size={13} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Panel Workspace */}
        <div className="flex-1 p-5 overflow-y-auto min-h-0 bg-slate-50/20">
          
          {/* View 1: Sandbox Preview Device IFrame */}
          {previewTab === 'sandbox' && (
            <div className="h-full flex items-center justify-center">
              {mode === 'prototype' && results?.html ? (
                <div 
                  className="overflow-hidden rounded-3xl bg-white shadow-xl border-8 border-slate-700 flex flex-col transition-all duration-300" 
                  style={{ 
                    width: previewDevices.find((item) => item.value === previewDevice)?.width || '100%',
                    height: '520px'
                  }}
                >
                  {/* Mock mobile top notch */}
                  {previewDevice === 'mobile' && (
                    <div className="bg-slate-700 h-6 flex items-center justify-center shrink-0">
                      <div className="w-16 h-3 bg-black rounded-full"></div>
                    </div>
                  )}
                  <iframe
                    key={results?.html ? results.html.length + '-' + results.html.slice(-20) : 'empty'}
                    title="Prototype Preview"
                    srcDoc={results.html}
                    className="flex-1 w-full border-none"
                  />
                </div>
              ) : currentCode ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm w-full max-w-sm">
                  <Code size={32} className="mx-auto text-indigo-600 mb-3" />
                  <h4 className="font-bold text-xs text-gray-900">Component generated successfully</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                    Components do not contain custom index.html framing. Click **Code Editor** tab at the top to inspect and refine component code!
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-xs text-gray-400 max-w-xs bg-white/50">
                  Generate a prototype to preview it inside the Device Simulator frame.
                </div>
              )}
            </div>
          )}

          {/* View 2: Code Editor (Line-by-line hovers!) */}
          {previewTab === 'code' && (
            <div className="space-y-4">
              {currentCode ? (
                <div className="rounded-2xl border border-gray-200 bg-[#02040a] p-4 text-[11px] leading-5 text-slate-100 font-mono shadow-sm overflow-x-auto max-h-[440px]">
                  {currentCode.split('\n').map((line, index) => (
                    <div key={index} className="group flex gap-3 relative py-0.5">
                      <span className="select-none w-6 text-right text-slate-600 font-bold shrink-0">{index + 1}</span>
                      <code className="whitespace-pre break-all">{line || ' '}</code>
                      {learningMode && (
                        <span className="absolute right-0 top-0.5 hidden rounded-lg bg-indigo-600 text-white font-sans px-2.5 py-1 text-[10px] font-bold shadow group-hover:block z-10">
                          {getLineHint(line)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-xs text-gray-400 bg-white/50">
                  Generate code to view source code script.
                </div>
              )}

              {/* AI Code Explanation Panel */}
              {codeExplanation && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-2">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-600 block">AI Code Explanation</span>
                  <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap">{codeExplanation}</p>
                </div>
              )}
            </div>
          )}

          {/* View 3: Pitch Deck slide viewer */}
          {previewTab === 'pitch' && (
            <div className="space-y-4">
              {pitchDeckMarkdown ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 leading-relaxed text-xs">
                  <div className="flex items-center gap-1 border-b border-gray-100 pb-2.5 text-gray-900 font-bold">
                    <span className="text-lg">📊</span>
                    <span>Generated Hackathon Pitch Deck</span>
                  </div>
                  <div className="whitespace-pre-wrap font-sans text-gray-600 space-y-4">
                    {pitchDeckMarkdown.split('---').map((slide, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 border border-gray-100 rounded-xl relative shadow-sm">
                        <span className="absolute top-3 right-3 text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">
                          Slide {idx + 1}
                        </span>
                        <div className="prose prose-sm prose-indigo">
                          {slide.trim().split('\n').map((line, lIdx) => {
                            if (line.startsWith('#')) {
                              return <h4 key={lIdx} className="font-bold text-gray-900 text-sm mb-2">{line.replace(/#/g, '').trim()}</h4>;
                            }
                            return <p key={lIdx} className="mb-1 text-[11px]">{line}</p>;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-xs text-gray-400 bg-white/50">
                  Select "Create Presentation Pitch Deck" in the AI Feature Actions to generate Markdown slides.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Pinned bottom AI Refinement Chat panel */}
        <div className="p-4 border-t border-gray-100 bg-white flex flex-col shrink-0">
          <RefinementChat
            history={chatHistory}
            instruction={chatInstruction}
            setInstruction={setChatInstruction}
            onSend={handleChatRefine}
            isSending={isChatting}
          />
        </div>
      </aside>

    </div>
  );
};

export default CodeStudio;
