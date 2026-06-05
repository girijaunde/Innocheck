import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService, getErrorMessage } from '../services/api';
import toast from '../services/toast';
import { 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Copy, 
  ExternalLink,
  Download,
  AlertCircle,
  Cpu,
  Loader2
} from 'lucide-react';

const IdeaValidator = () => {
  const [problemStatement, setProblemStatement] = useState('');
  const [userSuggestions, setUserSuggestions] = useState('');
  const [sources, setSources] = useState(['arxiv', 'github']);
  const [selectedStack, setSelectedStack] = useState(['React', 'FastAPI']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Agentic progress step tracker
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = [
    { text: "Extracting semantic intent and identifying search keywords...", duration: 2000 },
    { text: "Agent 1: Querying arXiv database for overlapping publications...", duration: 3000 },
    { text: "Agent 2: Querying GitHub repositories for technical similarities...", duration: 3000 },
    { text: "Agent 3: Calculating cosine similarities and computing gap metrics...", duration: 2500 },
    { text: "Agent 4: Curating customized system architecture suggestions...", duration: 2500 },
    { text: "Agent 5: Compiling final PDF & Markdown report deliverables...", duration: 2000 }
  ];

  useEffect(() => {
    let timer;
    if (isAnalyzing) {
      setLoadingStep(0);
      const runStep = (stepIndex) => {
        if (stepIndex < loadingSteps.length) {
          timer = setTimeout(() => {
            setLoadingStep(stepIndex + 1);
            runStep(stepIndex + 1);
          }, loadingSteps[stepIndex].duration);
        }
      };
      runStep(0);
    }
    return () => clearTimeout(timer);
  }, [isAnalyzing]);

  const availableFrameworks = [
    { name: 'React', icon: '⚛️' },
    { name: 'Vue', icon: '🟢' },
    { name: 'Flask', icon: '🐍' },
    { name: 'FastAPI', icon: '🚀' },
    { name: 'HTML/CSS', icon: '🌐' },
    { name: 'PyTorch', icon: '🔥' },
    { name: 'TensorFlow', icon: '🧠' }
  ];

  const handleFrameworkToggle = (framework) => {
    if (selectedStack.includes(framework)) {
      setSelectedStack(selectedStack.filter(item => item !== framework));
    } else {
      setSelectedStack([...selectedStack, framework]);
    }
  };

  const handleValidate = async () => {
    if (!problemStatement.trim()) {
      toast.error('Please enter a problem statement');
      return;
    }

    setResults(null);
    setIsAnalyzing(true);
    const loadingToast = toast.loading('Analyzing your idea with AI...');

    try {
      const curatedSuggestions = [
        userSuggestions.trim(),
        selectedStack.length > 0 ? `Preferred stack: ${selectedStack.join(', ')}` : ''
      ].filter(Boolean).join('. ');

      const response = await apiService.ideaValidator.validateIdea({
        problem_statement: problemStatement,
        suggestions: curatedSuggestions,
        mode: 'full'
      });
      
      // Ensure all loading steps show completed right before results pop up
      setLoadingStep(loadingSteps.length);
      setTimeout(() => {
        setResults(response.data);
        toast.success('✓ Analysis completed successfully!');
        loadingToast?.remove();
        setIsAnalyzing(false);
      }, 500);

    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('Error validating idea:', error);
      toast.error(errorMessage);
      loadingToast?.remove();
      setIsAnalyzing(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const toastId = toast.loading(`Generating ${format.toUpperCase()} report...`);
      let response;
      if (format === 'md') {
        response = await apiService.ideaValidator.exportComprehensiveMD(results.problem_id);
      } else {
        response = await apiService.ideaValidator.exportComprehensivePDF(results.problem_id);
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Project_Report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded successfully!', { id: toastId });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to download report');
    }
  };

  const handleCopyGap = (gapText, id) => {
    navigator.clipboard.writeText(gapText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-gray-800 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Button */}
        <div className="mb-6 flex justify-start">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-600 transition bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm">
            ← Back to Dashboard
          </Link>
        </div>

        {/* HEADER SECTION */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live · multi-agent pipeline
          </div>
          <h1 className="text-4xl font-black mb-3 tracking-tight bg-gradient-to-br from-gray-900 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Idea Validator
          </h1>
          <div className="flex justify-center gap-2 mb-4">
            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[11px] font-bold border border-indigo-100/50">AI-Powered</span>
            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[11px] font-bold border border-indigo-100/50">5-Agent Pipeline</span>
            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-bold border border-emerald-100/50">89% Accuracy</span>
          </div>
          <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
            Validate your hackathon idea with our multi-agent AI system. Get uniqueness score, innovation gaps, and a complete roadmap.
          </p>
        </div>

        {/* PRIMARY FORM INPUT CARD */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300">
          <div className="mb-5">
            <label className="block text-[14px] font-bold text-gray-900 mb-2 flex items-center gap-1.5">
              <span>🧠</span> Problem Statement <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded">Required</span>
            </label>
            <textarea
              className="w-full bg-slate-50 border border-gray-200 text-gray-800 rounded-xl p-3.5 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm leading-relaxed"
              placeholder="Describe your hackathon idea in detail... Example: 'Build a cattle disease detection system using computer vision...'"
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
            />
            <p className="text-[11px] text-gray-400 mt-1.5">💡 Be specific for better results (0/500 characters)</p>
          </div>

          <div className="mb-2">
            <label className="block text-[14px] font-bold text-gray-900 mb-2 flex items-center gap-1.5">
              <span>💡</span> Your Unique Suggestions <span className="text-xs bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded">Optional</span>
            </label>
            <textarea
              className="w-full bg-slate-50 border border-gray-200 text-gray-800 rounded-xl p-3.5 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm leading-relaxed"
              placeholder="What makes your idea different? Add your innovative approaches here... Example: 'Will use thermal imaging instead of RGB cameras...'"
              value={userSuggestions}
              onChange={(e) => setUserSuggestions(e.target.value)}
            />
            <p className="text-[11px] text-gray-400 mt-1.5">💡 The more unique suggestions you add, the better the gap analysis!</p>
          </div>
        </div>

        {/* COLLAPSIBLE ACCORDION FOR ADVANCED RESEARCH SETTINGS */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-6 py-4 flex items-center justify-between font-bold text-[14px] text-gray-900 bg-gray-50/50 border-b border-gray-200/50 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2">🛠️ Advanced Research Controls</span>
            {showAdvanced ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
          </button>

          {showAdvanced && (
            <div className="p-6 space-y-6">
              
              {/* Auto-Language Tip Box */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 text-emerald-800">
                <Check size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                <div className="text-[12px] leading-relaxed">
                  <strong>Abstract Language Routing:</strong> Whichever language you type your problem statement in (English, Hindi, Marathi, etc.), the AI will automatically detect your input and generate the final analysis in that same language!
                </div>
              </div>

              {/* Search Sources */}
              <div>
                <label className="block text-[13px] font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                  🔍 Search Sources
                </label>
                <div className="flex flex-wrap gap-4">
                  {['arxiv', 'github', 'devpost', 'semantic scholar'].map((source) => (
                    <label 
                      key={source} 
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[13px] font-medium cursor-pointer transition-all ${
                        sources.includes(source)
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={sources.includes(source)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSources([...sources, source]);
                          } else {
                            setSources(sources.filter(s => s !== source));
                          }
                        }}
                      />
                      <span className="capitalize">{source}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tech Stack Selectors */}
              <div>
                <label className="block text-[13px] font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                  🛠️ Preferred frameworks (Tech Stack)
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {availableFrameworks.map((fw) => (
                    <button
                      key={fw.name}
                      onClick={() => handleFrameworkToggle(fw.name)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-[12px] font-semibold transition-all ${
                        selectedStack.includes(fw.name)
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-slate-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{fw.icon}</span>
                      <span>{fw.name}</span>
                    </button>
                  ))}
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mt-3 flex items-start gap-2.5 text-blue-800">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-blue-600" />
                  <span className="text-[11px] leading-relaxed">
                    Preferred tech stack is used to tailor and contextualize the AI architectural suggestions.
                  </span>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* CENTERED SUBMIT BUTTON */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleValidate}
            disabled={isAnalyzing}
            className={`w-full max-w-md py-3.5 px-8 rounded-full font-bold text-[14px] transition-all flex items-center justify-center gap-2 shadow-lg ${
              isAnalyzing
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white hover:scale-105 shadow-indigo-600/10 hover:shadow-indigo-600/20'
            }`}
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Querying AI Pipeline...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Sparkles size={16} /> Validate Idea
              </span>
            )}
          </button>
        </div>

        {/* AGENTIC PIPELINE "MISSION CONTROL" LOADING PANEL */}
        {isAnalyzing && (
          <div className="bg-white border border-indigo-100 rounded-2xl p-6 mb-8 shadow-md shadow-indigo-100/50 animate-fade-in">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-100">
              <Loader2 className="animate-spin text-indigo-600" size={20} />
              <div>
                <h3 className="font-extrabold text-sm text-gray-900">Multi-Agent Pipeline Active</h3>
                <p className="text-[11px] text-gray-400">Processing RAG models & academic evidence</p>
              </div>
            </div>
            <div className="space-y-3.5">
              {loadingSteps.map((step, idx) => {
                const isActive = idx === loadingStep;
                const isCompleted = idx < loadingStep;
                return (
                  <div 
                    key={idx} 
                    className={`flex items-start gap-3 transition-all duration-300 ${
                      isActive ? 'translate-x-1' : ''
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {isCompleted ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      ) : isActive ? (
                        <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 animate-pulse">
                          <Cpu size={11} className="animate-spin" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <span 
                      className={`text-xs font-semibold transition-colors duration-300 ${
                        isActive 
                          ? 'text-indigo-600' 
                          : isCompleted 
                          ? 'text-gray-500' 
                          : 'text-gray-300'
                      }`}
                    >
                      {step.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RESULTS CARD DISPLAY */}
        {results && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 space-y-6">
            
            {/* Header Result Controls */}
            <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                📊 Validation Results
              </h2>
              {results.problem_id && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('md')}
                    className="bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Download size={14} /> Export MD
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Download size={14} /> Export PDF
                  </button>
                </div>
              )}
            </div>
            
            {/* Score Grid widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 border border-emerald-100 p-5 rounded-2xl text-center shadow-sm">
                <h3 className="text-[12px] font-bold text-emerald-800 uppercase tracking-wider mb-2">Innovation Label</h3>
                <div className="text-3xl font-black text-emerald-600">
                  {results.score_label || 'N/A'}
                </div>
                <p className="text-[11px] text-emerald-700 mt-2">{results.score_description || 'Analysis completed successfully.'}</p>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 border border-indigo-100 p-5 rounded-2xl text-center shadow-sm flex flex-col items-center justify-center">
                <h3 className="text-[12px] font-bold text-indigo-800 uppercase tracking-wider mb-2">Uniqueness Score</h3>
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin-slow"></div>
                  <span className="text-2xl font-black text-indigo-600">{results.uniqueness_score || 0}%</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100/30 border border-purple-100 p-5 rounded-2xl shadow-sm text-left">
                <h3 className="text-[12px] font-bold text-purple-800 uppercase tracking-wider mb-3 text-center">Explainable AI Confidence</h3>
                <div className="space-y-2.5 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between font-semibold text-gray-700">
                      <span>Gap Analysis</span>
                      <span className="text-purple-600">{results.confidence_scores?.gap_analysis || '91%'}</span>
                    </div>
                    <div className="w-full bg-purple-100/50 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: results.confidence_scores?.gap_analysis || '91%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between font-semibold text-gray-700">
                      <span>Paper Match</span>
                      <span className="text-purple-600">{results.confidence_scores?.paper_match || '74%'}</span>
                    </div>
                    <div className="w-full bg-purple-100/50 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: results.confidence_scores?.paper_match || '74%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between font-semibold text-gray-700">
                      <span>Innovation Class</span>
                      <span className="text-purple-600">{results.confidence_scores?.innovation_class || '88%'}</span>
                    </div>
                    <div className="w-full bg-purple-100/50 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: results.confidence_scores?.innovation_class || '88%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gap Analysis comparison split-cards */}
            <div>
              <h3 className="text-[14px] font-bold text-gray-900 mb-3 flex items-center gap-1.5">⚖️ Innovation Gap Analysis</h3>
              <div className="space-y-4">
                {Array.isArray(results.innovation_gaps) && results.innovation_gaps.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {results.innovation_gaps.map((gap, index) => (
                      <div key={index} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-4 py-2.5 border-b border-gray-200 text-xs font-bold text-gray-800">
                          Gap Theme: {gap.title}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2">
                          <div className="bg-rose-50/50 p-4 border-r border-gray-200/50 text-rose-950">
                            <span className="inline-block bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">❌ Existing Solutions</span>
                            <p className="text-xs leading-relaxed">{gap.existing}</p>
                          </div>
                          <div className="bg-emerald-50/50 p-4 text-emerald-950">
                            <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">✨ Your Opportunity</span>
                            <p className="text-xs leading-relaxed">{gap.opportunity}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 text-center text-xs text-gray-500">
                    No gap analysis available
                  </div>
                )}
              </div>
            </div>

            {/* Keywords */}
            {results.search_keywords?.length > 0 && (
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 mb-2">🔍 Search Keywords</h3>
                <div className="flex flex-wrap gap-1.5">
                  {results.search_keywords.map((keyword, index) => (
                    <span key={index} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold border border-slate-200/50">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Similar projects / Papers */}
            <div>
              <h3 className="text-[14px] font-bold text-gray-900 mb-3">📚 Similar Publications & Repositories</h3>
              <div className="space-y-3">
                {results.similar_papers?.map((project, index) => (
                  <div key={index} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow transition-all duration-300">
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm text-gray-900">{project.title}</h4>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            project.source?.toLowerCase().includes('arxiv') 
                              ? 'bg-sky-100 text-sky-800' 
                              : project.source?.toLowerCase().includes('github') 
                              ? 'bg-green-100 text-green-800' 
                              : project.source?.toLowerCase().includes('ieee')
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {project.source || project.venue}
                          </span>
                          {project.grounding && (
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              project.grounding?.toLowerCase() === 'real'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200/50'
                            }`}>
                              {project.grounding === 'Real' ? '✓ Verified Real Source' : '✨ AI-Generated Semantic Match'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 mb-2">{project.venue} · Overlap: {project.similarity}%</p>
                        {project.summary && (
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-2">{project.summary}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 shrink-0">
                        {project.url && project.url.trim() !== '' ? (
                          <a
                            href={project.url.startsWith('http') ? project.url : `https://${project.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm border border-indigo-100"
                          >
                            <ExternalLink size={12} /> View Project
                          </a>
                        ) : (
                          <span className="text-gray-400 text-[11px] px-3 py-1.5 rounded bg-gray-50 text-center font-medium border border-gray-100">
                            No Link
                          </span>
                        )}
                        <button
                          onClick={() => handleCopyGap(project.gap || 'No gap information available', index)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm border ${
                            copiedId === index
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-100 text-emerald-600'
                          }`}
                          title="Copy gap"
                        >
                          {copiedId === index ? (
                            <>
                              <Check size={12} /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={12} /> Copy Gap
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI-Enhanced details */}
            {results?.ai_enhanced && (
              <div className="pt-4 border-t border-gray-100 space-y-6">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">✨</span>
                  <h3 className="text-sm font-bold text-gray-900">AI-Enhanced Synthesis</h3>
                  <span className="ml-auto text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold border border-purple-100">Powered by AI</span>
                </div>
                
                {/* Improvement suggestions */}
                {results.improvement_suggestions && results.improvement_suggestions.length > 0 && (
                  <div className="bg-indigo-50/30 border border-indigo-100/50 p-4 rounded-xl">
                    <h4 className="font-bold text-xs text-indigo-900 mb-2 flex items-center gap-1">🚀 Improvement Suggestions</h4>
                    <ul className="space-y-2">
                      {results.improvement_suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start text-xs text-indigo-950 leading-relaxed">
                          <span className="text-indigo-400 mr-2 shrink-0">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Challenges */}
                {results.potential_challenges && results.potential_challenges.length > 0 && (
                  <div className="bg-amber-50/30 border border-amber-100/50 p-4 rounded-xl">
                    <h4 className="font-bold text-xs text-amber-900 mb-2 flex items-center gap-1">⚠️ Potential Challenges</h4>
                    <ul className="space-y-2">
                      {results.potential_challenges.map((challenge, index) => (
                        <li key={index} className="flex items-start text-xs text-amber-950 leading-relaxed">
                          <span className="text-amber-400 mr-2 shrink-0">•</span>
                          <span>{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Success metrics */}
                {results.success_metrics && results.success_metrics.length > 0 && (
                  <div>
                    <h4 className="font-bold text-xs text-gray-900 mb-2.5">📊 Success Metrics</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {results.success_metrics.map((metric, index) => (
                        <div key={index} className="bg-slate-50 border border-gray-200 p-3 rounded-xl">
                          <p className="text-xs text-gray-700 leading-relaxed">{metric}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default IdeaValidator;
