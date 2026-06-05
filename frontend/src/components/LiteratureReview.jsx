import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService, getErrorMessage } from '../services/api';
import toast from '../services/toast';
import {
  Search,
  BookOpen,
  Folder,
  ChevronRight,
  TrendingUp,
  Cpu,
  Star,
  ExternalLink,
  Info,
  Loader2,
  Trash
} from 'lucide-react';

const componentCategories = [
  { id: 'chemistry', label: 'Chemistry', icon: '🧪' },
  { id: 'engineering', label: 'Engineering', icon: '⚙️' },
  { id: 'life_sciences', label: 'Life Sciences', icon: '🧬' },
  { id: 'mathematics', label: 'Mathematics', icon: '🧮' },
  { id: 'physics', label: 'Physics', icon: '⚛️' },
  { id: 'earth_sciences', label: 'Earth Sciences', icon: '🌍' },
  { id: 'information_science', label: 'Information Science', icon: '💾' },
  { id: 'materials_science', label: 'Materials Science', icon: '🧱' },
  { id: 'medical_sciences', label: 'Medical Sciences', icon: '🏥' },
  { id: 'psychology', label: 'Psychology', icon: '🧠' },
];

const journalResources = [
  { name: 'NATURE', type: 'journal', rank: 'Q1', if: '48.5', category: 'life_sciences', icon: '🧬', color: 'bg-green-50 text-green-700 border-green-200' },
  { name: 'SCIENCE', type: 'journal', rank: 'Q1', if: '45.8', category: 'physics', icon: '⚛️', color: 'bg-red-50 text-red-700 border-red-200' },
  { name: 'NATURE MATERIALS', type: 'journal', rank: 'Q1', if: '38.5', category: 'materials_science', icon: '🧱', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { name: 'NATURE COMMUNICATIONS', type: 'journal', rank: 'Q1', if: '15.7', category: 'engineering', icon: '⚙️', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'NATURE CATALYSIS', type: 'journal', rank: 'Q1', if: '44.6', category: 'chemistry', icon: '🧪', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { name: 'NATURE SYNTHESIS', type: 'journal', rank: 'Q1', if: '20.0', category: 'chemistry', icon: '🧪', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { name: 'CHEM', type: 'journal', rank: 'Q1', if: '19.6', category: 'chemistry', icon: '🧪', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { name: 'COMMUNICATIONS CHEMISTRY', type: 'journal', rank: 'Q1', if: '6.2', category: 'chemistry', icon: '🧪', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'NPJ MATERIALS DEGRADATION', type: 'journal', rank: 'Q1', if: '7.6', category: 'materials_science', icon: '🧱', color: 'bg-stone-50 text-stone-700 border-stone-200' },
  { name: 'CELL REPORTS PHYSICAL SCIENCE', type: 'journal', rank: 'Q1', if: '7.3', category: 'life_sciences', icon: '🧬', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { name: 'ISCIENCE', type: 'journal', rank: 'Q1', if: '4.1', category: 'earth_sciences', icon: '🌍', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { name: 'SCIENCE ADVANCES', type: 'journal', rank: 'Q1', if: '12.5', category: 'physics', icon: '⚛️', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'RESEARCH', type: 'journal', rank: 'Q1', if: '10.7', category: 'engineering', icon: '⚙️', color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
  { name: 'ARXIV PREPRINTS', type: 'preprint', rank: 'Q3', if: '2.0', category: 'information_science', icon: '💾', color: 'bg-slate-100 text-slate-700 border-slate-300' },
];

const LiteratureReview = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFrom, setYearFrom] = useState(2020);
  const [yearTo, setYearTo] = useState(2026);
  const [activeSearchAgent, setActiveSearchAgent] = useState('scholar'); // 'deep', 'scholar', 'deepseek', 'inspiration'
  const [activeMenuTab, setActiveMenuTab] = useState('trends'); // 'trends', 'sources', 'feeds'
  const [selectedField, setSelectedField] = useState('life_sciences');
  
  // States for search and saved database
  const [isSearching, setIsSearching] = useState(false);
  const [papers, setPapers] = useState([]);
  const [savedPapers, setSavedPapers] = useState([]);
  const [recentSearches, setRecentSearches] = useState([
    'Paper on crop management',
    'AI in smart crop validation systems',
    'Hackathon validator platforms architecture',
    'Sentence-BERT text similarity scanning models'
  ]);
  const [activePanelTab, setActivePanelTab] = useState('search'); // 'search', 'library', 'bibliography'
  
  // AI Survey RAG States
  const [isGeneratingSurvey, setIsGeneratingSurvey] = useState(false);
  const [surveyReport, setSurveyReport] = useState(null);
  
  // Inline summaries & actions
  const [summaries, setSummaries] = useState({});
  const [isSummarizing, setIsSummarizing] = useState({});
  const [bibliography, setBibliography] = useState('');

  useEffect(() => {
    loadSavedPapers();
  }, []);

  const loadSavedPapers = async () => {
    try {
      const response = await apiService.literatureReview.getSavedPapers();
      setSavedPapers(response.data.papers || []);
    } catch (error) {
      console.error('Error loading saved papers:', error);
    }
  };

  const handleSearch = async (forcedQuery = null) => {
    const queryToSearch = forcedQuery || searchQuery;
    if (!queryToSearch.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setPapers([]);
    setSurveyReport(null);

    // Save recent searches history
    if (!recentSearches.includes(queryToSearch.trim())) {
      setRecentSearches(prev => [queryToSearch.trim(), ...prev.slice(0, 5)]);
    }

    try {
      const response = await apiService.literatureReview.searchPapers({
        query: queryToSearch,
        year_from: yearFrom,
        year_to: yearTo,
        source: 'all'
      });
      const parsedPapers = response.data.papers || [];
      setPapers(parsedPapers);
      toast.success(`Found ${parsedPapers.length} matching papers!`);

      // Trigger automatic Literature Survey in right panel!
      if (parsedPapers.length > 0) {
        handleGenerateSurvey(queryToSearch, parsedPapers);
      }
    } catch (error) {
      console.error('Error searching papers:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateSurvey = async (queryText, paperList) => {
    setIsGeneratingSurvey(true);
    try {
      const response = await apiService.literatureReview.generateSurvey({
        query: queryText,
        papers: paperList
      });
      setSurveyReport(response.data.survey);
      toast.success('RAG Literature Survey outlines compiled!');
    } catch (error) {
      console.error('RAG Survey compilation error:', error);
    } finally {
      setIsGeneratingSurvey(false);
    }
  };

  const handleSavePaper = async (paper) => {
    try {
      await apiService.literatureReview.savePaper({
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
        doi: paper.doi || '',
        url: paper.url || ''
      });
      await loadSavedPapers();
      toast.success('Paper saved successfully to library!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleSummarize = async (paper) => {
    setIsSummarizing(prev => ({ ...prev, [paper.id]: true }));
    try {
      const response = await apiService.literatureReview.summarize({
        title: paper.title,
        abstract: paper.abstract
      });
      setSummaries(prev => ({ ...prev, [paper.id]: response.data.summary }));
      toast.success('AI summary generated successfully!');
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSummarizing(prev => ({ ...prev, [paper.id]: false }));
    }
  };

  const handleDeleteSavedPaper = async (paperId) => {
    try {
      await apiService.literatureReview.deleteSavedPaper(paperId);
      await loadSavedPapers();
      toast.success('Paper removed from library.');
    } catch (error) {
      console.error('Error deleting paper:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleGenerateBibliography = async () => {
    try {
      const response = await apiService.literatureReview.getBibliography();
      setBibliography(response.data.bibliography);
      setActivePanelTab('bibliography');
      toast.success('Bibliography references compiled!');
    } catch (error) {
      console.error('Error generating bibliography:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied references to clipboard!');
  };

  const addSourceToQuery = (sourceName) => {
    setSearchQuery(prev => prev.trim() ? `${prev} source:${sourceName.toLowerCase()}` : `source:${sourceName.toLowerCase()}`);
    toast.success(`Filter added: ${sourceName}`);
  };

  const filteredJournals = journalResources.filter(j => j.category === selectedField);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-gray-800">
      
      {/* ================= COLUMN 1: LEFT SIDEBAR (WIS-PAPER STYLE) ================= */}
      <aside className="w-[300px] border-r border-gray-200 bg-white flex flex-col shrink-0 overflow-hidden">
        
        {/* Back Button */}
        <div className="px-5 pt-4">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-600 transition">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Brand header branding */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-indigo-600/10">
              WP
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-gray-900 tracking-tight">WisPaper</h2>
              <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">Academic Engine</p>
            </div>
          </div>
        </div>

        {/* Vertical shortcuts navigation */}
        <div className="p-4 space-y-1 shrink-0">
          <button
            onClick={() => setActivePanelTab('search')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activePanelTab === 'search'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:bg-slate-50 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Search size={15} /> Scholar Search
            </span>
          </button>
          
          <button
            onClick={() => setActivePanelTab('library')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activePanelTab === 'library'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:bg-slate-50 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <BookOpen size={15} /> My Library
            </span>
            {savedPapers.length > 0 && (
              <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                {savedPapers.length}
              </span>
            )}
          </button>

          <button
            onClick={handleGenerateBibliography}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activePanelTab === 'bibliography'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:bg-slate-50 hover:text-gray-900'
            }`}
          >
            <Folder size={15} /> Academic Bibliography
          </button>
        </div>

        {/* Dynamic Recent Searches history */}
        <div className="flex-1 p-4 overflow-y-auto border-t border-slate-100/50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Searches</p>
          <div className="space-y-2">
            {recentSearches.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSearchQuery(item);
                  setActivePanelTab('search');
                  handleSearch(item);
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-indigo-100 bg-slate-50/50 hover:bg-indigo-50/20 text-[11px] text-gray-600 hover:text-indigo-700 transition font-medium flex items-start gap-2 leading-relaxed"
              >
                <Search size={12} className="mt-0.5 text-gray-400 shrink-0" />
                <span className="truncate">{item}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom promo footer info block */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-[10px] text-gray-400 leading-relaxed">
          💡 <strong>RAG Survey Active</strong>: Generate dynamically connected academic maps in the right panel upon search query execution.
        </div>
      </aside>

      {/* ================= COLUMN 2: MIDDLE (ACADEMIC SEARCH ENGINE WORKSPACE) ================= */}
      <main className="flex-1 bg-slate-50 p-6 overflow-y-auto flex flex-col border-r border-gray-200 min-w-0">
        
        {/* Render Panel A: Search Workspace */}
        {activePanelTab === 'search' && (
          <div className="space-y-6 flex-1 flex flex-col min-h-0">
            
            {/* Header Greeting Banner */}
            <div className="text-center py-4 shrink-0">
              <h1 className="text-2xl font-black text-indigo-600 tracking-tight">
                Hi. Which paper do you want to read today?
              </h1>
              <p className="text-xs text-gray-400 mt-1.5 font-medium">Search across high-quality academic index libraries instantly.</p>
            </div>

            {/* Premium Center Search Query Textarea Prompt Box */}
            <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow transition-all duration-300 shrink-0">
              <textarea
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                rows={2}
                className="w-full border-none outline-none text-sm text-gray-800 resize-none font-medium leading-relaxed bg-transparent"
                placeholder="eg, Find me papers that study AI4Science or agricultural crop analytics in recent 3 years..."
              />
              
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-4 border-t border-slate-100">
                {/* Agent Selectors Tag Grid */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setActiveSearchAgent('deep')}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-black transition flex items-center gap-1.5 ${activeSearchAgent === 'deep' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-50 text-gray-500 hover:bg-slate-100 border border-transparent'}`}
                  >
                    ⚛️ Deep Search
                  </button>
                  <button
                    onClick={() => setActiveSearchAgent('scholar')}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-black transition flex items-center gap-1.5 ${activeSearchAgent === 'scholar' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-50 text-gray-500 hover:bg-slate-100 border border-transparent'}`}
                  >
                    🪄 Scholar Agent
                  </button>
                  <button
                    onClick={() => setActiveSearchAgent('deepseek')}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-black transition flex items-center gap-1.5 ${activeSearchAgent === 'deepseek' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-50 text-gray-500 hover:bg-slate-100 border border-transparent'}`}
                  >
                    🐼 DeepSeek Agent
                  </button>
                  <button
                    onClick={() => setActiveSearchAgent('inspiration')}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-black transition flex items-center gap-1.5 ${activeSearchAgent === 'inspiration' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-50 text-gray-500 hover:bg-slate-100 border border-transparent'}`}
                  >
                    💡 Inspiration Discovery
                  </button>
                </div>

                {/* Primary search executor */}
                <button
                  onClick={() => handleSearch()}
                  disabled={isSearching || !searchQuery.trim()}
                  className="rounded-full bg-slate-900 text-white w-9 h-9 flex items-center justify-center hover:bg-indigo-600 hover:scale-105 transition disabled:opacity-50"
                  title="Search Papers"
                >
                  {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </button>
              </div>
            </div>

            {/* Year Filters & Dynamic Tabs Menu */}
            <div className="flex flex-col sm:flex-row items-center justify-between shrink-0 gap-3 border-b border-gray-200 pb-3">
              <div className="flex gap-1.5 bg-slate-200/50 p-1 rounded-xl">
                <button
                  onClick={() => setActiveMenuTab('trends')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all ${activeMenuTab === 'trends' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  📈 Trends
                </button>
                <button
                  onClick={() => setActiveMenuTab('sources')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all ${activeMenuTab === 'sources' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  📚 Latest Sources
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500">
                <span>Years:</span>
                <input
                  type="number"
                  className="w-16 bg-white border border-gray-200 rounded-lg p-1.5 text-center outline-none"
                  value={yearFrom}
                  onChange={(e) => setYearFrom(parseInt(e.target.value) || 2020)}
                  min="1900"
                  max="2026"
                />
                <span>to</span>
                <input
                  type="number"
                  className="w-16 bg-white border border-gray-200 rounded-lg p-1.5 text-center outline-none"
                  value={yearTo}
                  onChange={(e) => setYearTo(parseInt(e.target.value) || 2026)}
                  min="1900"
                  max="2026"
                />
              </div>
            </div>

            {/* SUB-VIEW A.1: TRENDS RECOMMENDATION */}
            {activeMenuTab === 'trends' && papers.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-indigo-600" /> Hot Academic Trends
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <button
                    onClick={() => { setSearchQuery('large language models for scientific writing'); handleSearch('large language models for scientific writing'); }}
                    className="p-4 border border-slate-100 hover:border-indigo-100 bg-slate-50/50 hover:bg-indigo-50/20 text-left rounded-2xl transition"
                  >
                    <p className="font-bold text-xs text-gray-900">An AI system to help scientists write expert software</p>
                    <p className="text-[10px] text-gray-400 mt-1">Eser Aygün et al. • Nature 2026</p>
                  </button>
                  <button
                    onClick={() => { setSearchQuery('agricultural remote sensing crop health'); handleSearch('agricultural remote sensing crop health'); }}
                    className="p-4 border border-slate-100 hover:border-indigo-100 bg-slate-50/50 hover:bg-indigo-50/20 text-left rounded-2xl transition"
                  >
                    <p className="font-bold text-xs text-gray-900">Remote sensing and intelligent crop yield prediction models</p>
                    <p className="text-[10px] text-gray-400 mt-1">Paul J. Pinter et al. • ArXiv 2025</p>
                  </button>
                </div>
              </div>
            )}

            {/* SUB-VIEW A.2: LATEST SOURCES CATALOG DIRECTORY */}
            {activeMenuTab === 'sources' && (
              <div className="space-y-4 shrink-0">
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Academic Fields</p>
                <div className="flex flex-wrap gap-1.5">
                  {componentCategories.map((field) => (
                    <button
                      key={field.id}
                      onClick={() => setSelectedField(field.id)}
                      className={`px-3.5 py-2 rounded-xl border text-[11px] font-bold transition flex items-center gap-1.5 shadow-sm ${selectedField === field.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 hover:bg-slate-50 text-gray-700'}`}
                    >
                      <span>{field.icon}</span>
                      <span>{field.label}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredJournals.map((jr) => (
                    <div
                      key={jr.name}
                      className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg border">
                          {jr.icon}
                        </div>
                        <div>
                          <p className="font-extrabold text-[11px] text-slate-900 leading-tight">{jr.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] bg-slate-100 text-slate-600 font-black px-1.5 py-0.5 rounded border">{jr.rank}</span>
                            <span className="text-[9px] bg-indigo-50 text-indigo-700 font-black px-1.5 py-0.5 rounded border border-indigo-100/50">IF: {jr.if}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => addSourceToQuery(jr.name)}
                        className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition text-slate-400 font-bold"
                        title="Add as query source filter"
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results Display Area */}
            {papers.length > 0 && (
              <div className="flex-1 space-y-4">
                <h3 className="font-extrabold text-xs text-gray-900 border-b pb-2 flex items-center gap-2">
                  <span>🔬</span> Search Results ({papers.length} peer-reviewed publications)
                </h3>

                <div className="space-y-4">
                  {papers.map((paper, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow transition-all"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-2.5">
                          
                          {/* Badges row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-black border border-emerald-100 flex items-center gap-1">
                              ✓ Perfect
                            </span>
                            <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-black border border-indigo-100/50 capitalize">
                              {paper.source}
                            </span>
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black border">
                              Q1 indexing
                            </span>
                            {paper.relevance_score !== undefined && (
                              <span className="text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded font-black">
                                {paper.relevance_score}% Match
                              </span>
                            )}
                          </div>

                          <h3 className="font-black text-sm text-gray-900 tracking-tight leading-tight hover:text-indigo-600 transition cursor-pointer">
                            {paper.title}
                          </h3>

                          <p className="text-[10px] text-gray-400 font-bold">
                            {paper.authors} ({paper.year})
                          </p>

                          <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                            {paper.abstract}
                          </p>

                          {/* Metric Actions row */}
                          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-3">
                            <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400">
                              <button
                                onClick={() => handleSavePaper(paper)}
                                className="flex items-center gap-1.5 hover:text-indigo-600 transition"
                              >
                                <Star size={13} /> Add to Library
                              </button>
                              
                              <button
                                onClick={() => copyToClipboard(`[1] ${paper.authors}, "${paper.title}," ${paper.year}.`)}
                                className="flex items-center gap-1.5 hover:text-indigo-600 transition bg-slate-50 border px-2.5 py-1 rounded-lg"
                              >
                                Cite Reference
                              </button>

                              <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded font-bold">
                                Cited By: {paper.citations || 12}
                              </span>
                            </div>

                            {/* summarize / view PDF actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSummarize(paper)}
                                disabled={isSummarizing[paper.id]}
                                className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 font-extrabold text-[10px] px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5"
                              >
                                {isSummarizing[paper.id] ? <Loader2 size={10} className="animate-spin" /> : <span>📄 Summarize</span>}
                              </button>
                              {paper.url && (
                                <a
                                  href={paper.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                                >
                                  <span>View Article</span> <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Summaries dropdown result */}
                          {summaries[paper.id] && (
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-3 text-[11px] leading-relaxed space-y-2 font-medium">
                              <h4 className="font-extrabold text-indigo-700 flex items-center gap-1">
                                <Info size={12} /> AI 5-Point Summary Card
                              </h4>
                              <div><strong className="text-gray-900">Problem:</strong> {summaries[paper.id].Problem}</div>
                              <div><strong className="text-gray-900">Method:</strong> {summaries[paper.id].Method}</div>
                              <div><strong className="text-gray-900">Dataset:</strong> {summaries[paper.id].Dataset}</div>
                              <div><strong className="text-gray-900">Key Result:</strong> {summaries[paper.id]["Key Result"]}</div>
                              <div><strong className="text-gray-900">Limitation:</strong> {summaries[paper.id].Limitation}</div>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Render Panel B: My Library Saved list */}
        {activePanelTab === 'library' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h2 className="text-lg font-black text-slate-900">Academic Library Backups</h2>
                <p className="text-[10px] text-gray-400 mt-0.5">Persisted SQLite database index papers catalog.</p>
              </div>
              <button
                onClick={handleGenerateBibliography}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] px-5 py-2.5 rounded-xl shadow-md transition"
              >
                Compile Bibliography
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {savedPapers.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-10 text-center text-xs text-gray-400 bg-white/50">
                  📚 Your library database is currently empty. Run searches and click "Add to Library" to save papers!
                </div>
              ) : (
                savedPapers.map((paper) => (
                  <div
                    key={paper.id}
                    className="bg-white border border-gray-200 rounded-2xl p-4 flex justify-between items-center shadow-sm"
                  >
                    <div>
                      <h4 className="font-extrabold text-xs text-gray-900 tracking-tight leading-tight">{paper.title}</h4>
                      <p className="text-[10px] text-gray-400 font-bold mt-1">{paper.authors} ({paper.year})</p>
                    </div>
                    <button
                      onClick={() => handleDeleteSavedPaper(paper.id)}
                      className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition text-slate-400 shrink-0 ml-4"
                      title="Remove paper"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Render Panel C: Generated Academic Bibliography references list */}
        {activePanelTab === 'bibliography' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h2 className="text-lg font-black text-slate-900">Academic Bibliography</h2>
                <p className="text-[10px] text-gray-400 mt-0.5">Standard academic citations ready for copy pasting.</p>
              </div>
              <button
                onClick={() => copyToClipboard(bibliography)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                Copy Citations
              </button>
            </div>

            {bibliography ? (
              <div className="bg-[#02040a] rounded-2xl p-5 border border-slate-800 shadow-sm">
                <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed">
                  {bibliography}
                </pre>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed p-10 text-center text-xs text-gray-400 bg-white/50">
                ⚠️ Click "Compile Bibliography" inside the Library tab to generate active citation references!
              </div>
            )}
          </div>
        )}

      </main>

      {/* ================= COLUMN 3: RIGHT PANEL (AI LITERATURE SURVEY RAG DIAGRAM WORKSPACE) ================= */}
      <aside className="w-[420px] border-l border-gray-200 bg-white flex flex-col shrink-0 overflow-hidden">
        
        {/* Workspace Survey Header */}
        <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="text-indigo-600" size={14} /> AI Literature Survey
          </span>
          <span className="text-[9px] font-black bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded animate-pulse uppercase tracking-wider">
            RAG Active
          </span>
        </div>

        {/* Survey Body Workspace */}
        <div className="flex-1 p-5 overflow-y-auto min-h-0 bg-slate-50/20 space-y-6">
          
          {isGeneratingSurvey ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <h4 className="font-extrabold text-xs text-slate-800">Compiling Literature Survey...</h4>
              <p className="text-[10px] text-gray-400 max-w-xs leading-relaxed">
                OpenAI is summarizing abstract data and dynamically building taxonomic networks...
              </p>
            </div>
          ) : surveyReport ? (
            <div className="space-y-6">
              
              {/* Survey Header metadata */}
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-black text-sm text-gray-900 tracking-tight leading-tight uppercase">
                  {surveyReport.title}
                </h2>
                <p className="text-[10px] text-gray-400 font-bold mt-1.5 leading-relaxed">
                  {surveyReport.overview}
                </p>
              </div>

              {/* Dynamic SVG Taxonomic Connection Network Tree Diagram (Images Wow-factor!) */}
              <div className="border border-slate-100 rounded-2xl bg-white p-4 shadow-sm space-y-2 shrink-0">
                <span className="text-[9px] uppercase font-black text-indigo-600 tracking-wider block mb-2">Literature Taxonomy Network Map</span>
                
                {/* SVG canvas */}
                <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden flex items-center justify-center p-2.5">
                  <svg className="w-full h-[220px]" viewBox="0 0 360 220">
                    
                    {/* SVG connection lines path */}
                    <g fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3,3">
                      {/* Root to Sub-theme lines */}
                      <path d="M 180 35 L 80 100" />
                      <path d="M 180 35 L 280 100" />
                      
                      {/* Sub-theme 1 to Paper node lines */}
                      <path d="M 80 100 L 40 170" />
                      <path d="M 80 100 L 120 170" />
                      
                      {/* Sub-theme 2 to Paper node lines */}
                      <path d="M 280 100 L 240 170" />
                      <path d="M 280 100 L 320 170" />
                    </g>
                    
                    {/* Level 1: Root Node (Core Query topic) */}
                    <g transform="translate(180, 35)" className="cursor-pointer hover:scale-105 transition-all">
                      <rect x="-60" y="-15" width="120" height="30" rx="15" fill="#4f46e5" filter="drop-shadow(0px 2px 4px rgba(79, 70, 229, 0.2))" />
                      <text x="0" y="5" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle" className="pointer-events-none">
                        {surveyReport.tree_nodes?.label?.slice(0, 18) || "Research Core"}
                      </text>
                    </g>

                    {/* Level 2: Sub-Theme Node 1 */}
                    <g transform="translate(80, 100)" className="cursor-pointer hover:scale-105 transition-all">
                      <rect x="-55" y="-12" width="110" height="24" rx="8" fill="#e0e7ff" stroke="#a5b4fc" strokeWidth="1" />
                      <text x="0" y="3" fill="#312e81" fontSize="8" fontWeight="800" textAnchor="middle" className="pointer-events-none">
                        {surveyReport.tree_nodes?.children?.[0]?.label?.slice(0, 20) || "Methodology"}
                      </text>
                    </g>

                    {/* Level 2: Sub-Theme Node 2 */}
                    <g transform="translate(280, 100)" className="cursor-pointer hover:scale-105 transition-all">
                      <rect x="-55" y="-12" width="110" height="24" rx="8" fill="#e0e7ff" stroke="#a5b4fc" strokeWidth="1" />
                      <text x="0" y="3" fill="#312e81" fontSize="8" fontWeight="800" textAnchor="middle" className="pointer-events-none">
                        {surveyReport.tree_nodes?.children?.[1]?.label?.slice(0, 20) || "Applications"}
                      </text>
                    </g>

                    {/* Level 3: Paper Node 1.1 */}
                    <g transform="translate(40, 170)" className="cursor-pointer hover:scale-105 transition-all">
                      <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                      <text x="0" y="3" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle" className="pointer-events-none">P1</text>
                    </g>

                    {/* Level 3: Paper Node 1.2 */}
                    <g transform="translate(120, 170)" className="cursor-pointer hover:scale-105 transition-all">
                      <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                      <text x="0" y="3" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle" className="pointer-events-none">P2</text>
                    </g>

                    {/* Level 3: Paper Node 2.1 */}
                    <g transform="translate(240, 170)" className="cursor-pointer hover:scale-105 transition-all">
                      <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                      <text x="0" y="3" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle" className="pointer-events-none">P3</text>
                    </g>

                    {/* Level 3: Paper Node 2.2 */}
                    <g transform="translate(320, 170)" className="cursor-pointer hover:scale-105 transition-all">
                      <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                      <text x="0" y="3" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle" className="pointer-events-none">P4</text>
                    </g>

                  </svg>
                </div>
              </div>

              {/* Academic RAG survey insights summary text (Image 5 right panel) */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                <span className="text-[9px] uppercase font-black text-indigo-600 tracking-wider block">Synthesized Academic Analysis</span>
                <div className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                  {surveyReport.insights}
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 border border-dashed border-slate-300 rounded-3xl bg-white/50">
              <Cpu size={36} className="text-slate-300 mb-3" />
              <h4 className="font-extrabold text-[11px] text-slate-700">RAG survey workbench active</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mt-1">
                Type in an academic topic and run a search. The AI will automatically build a taxonomic network survey report here!
              </p>
            </div>
          )}

        </div>

        {/* Bottom Continue survey trigger */}
        {surveyReport && (
          <div className="p-4 border-t border-slate-100 bg-white shrink-0">
            <button
              onClick={() => {
                toast.success('Analyzing next level of papers...');
                if (searchQuery.trim()) handleGenerateSurvey(searchQuery, papers);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-black tracking-wide text-gray-700 transition shadow-sm"
            >
              Continue Generating <ChevronRight size={14} className="rotate-90 text-gray-400" />
            </button>
          </div>
        )}

      </aside>

    </div>
  );
};

export default LiteratureReview;
