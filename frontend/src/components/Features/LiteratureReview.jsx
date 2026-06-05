import React, { useState } from 'react';
import { BookOpenIcon, MagnifyingGlassIcon, XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { apiService, getErrorMessage } from '../../services/api';
import toast from '../../services/toast';

const LiteratureReview = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedSource, setSelectedSource] = useState('All Sources');
  const [isSearching, setIsSearching] = useState(false);
  const [papers, setPapers] = useState([]);

  const years = ['2020', '2021', '2022', '2023', '2024', '2025', '2026'];
  const sortOptions = ['Relevance', 'Date', 'Citations'];
  const sources = ['arXiv', 'Semantic Scholar', 'OpenAlex', 'Crossref'];

  // Mock saved papers data
  const [savedPapers, setSavedPapers] = useState([
    {
      id: 1,
      title: 'Hack-Agents: Multi-Agent System for Innovation',
      savedDate: 'Apr 15, 2025'
    },
    {
      id: 2,
      title: 'RAGentA: Multi-Agent Retrieval-Augmented Generation',
      savedDate: 'Apr 14, 2025'
    },
    {
      id: 3,
      title: 'ChatDev: Communicative Agents',
      savedDate: 'Apr 12, 2025'
    },
    {
      id: 4,
      title: 'AutoGPT: Autonomous GPT-4 Agent',
      savedDate: 'Apr 10, 2025'
    }
  ]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter search keywords');
      return;
    }

    setIsSearching(true);
    
    try {
      const yearFrom = selectedYear === 'All' ? 2020 : parseInt(selectedYear);
      const yearTo = selectedYear === 'All' ? 2026 : parseInt(selectedYear);
      
      const response = await apiService.literatureReview.searchPapers({
        query: searchQuery,
        year_from: yearFrom,
        year_to: yearTo,
        source: selectedSource.toLowerCase().replace(' ', '')
      });
      
      setPapers(response.data.papers);
    } catch (error) {
      console.error('Error searching papers:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setPapers([]);
  };

  const handleExport = () => {
    // Export functionality
    toast.info('Exporting results...');
  };

  const removeSavedPaper = (paperId) => {
    setSavedPapers(prev => prev.filter(p => p.id !== paperId));
  };

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="text-sm text-gray-500">
          <span>Home</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Literature Review</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <BookOpenIcon className="w-8 h-8 text-teal-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Literature Review</h1>
        </div>
        <p className="text-gray-600 ml-11">
          Search across 590M+ academic papers from 4 databases
        </p>
      </div>

      {/* Search Research Papers Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Research Papers</h2>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keyword, topic, or author..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        {/* Source Filters */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Source Filters</h3>
          <div className="flex flex-wrap gap-2">
            {[...sources, 'All Sources'].map(source => (
              <button
                key={source}
                onClick={() => setSelectedSource(source)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedSource === source
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {source}
              </button>
            ))}
          </div>
        </div>

        {/* Filter by Year */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by Year</h3>
          <div className="flex flex-wrap gap-2">
            {years.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedYear === year
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Sort by */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Sort by</h3>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map(option => (
              <button
                key={option}
                onClick={() => setSortBy(option.toLowerCase())}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  sortBy === option.toLowerCase()
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:bg-green-300 transition-colors"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            <span>{isSearching ? 'Searching...' : 'Search Papers'}</span>
          </button>
          <button
            onClick={handleClear}
            className="flex items-center space-x-2 px-6 py-3 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 border border-gray-300 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
            <span>Clear</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-6 py-3 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 border border-gray-300 transition-colors"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span>Export Results</span>
          </button>
        </div>
      </div>

      {/* My Saved Library Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            My Saved Library ({savedPapers.length} papers)
          </h2>
        </div>
        
        <div className="space-y-3">
          {savedPapers.map(paper => (
            <div key={paper.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{paper.title}</h3>
                <p className="text-sm text-gray-500">Saved: {paper.savedDate}</p>
              </div>
              <button
                onClick={() => removeSavedPaper(paper.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove from library"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-purple-500 text-white rounded-full shadow-lg hover:bg-purple-600 transition-colors flex items-center justify-center">
        <span className="text-xl font-bold">+</span>
      </button>
    </div>
  );
};

export default LiteratureReview;
