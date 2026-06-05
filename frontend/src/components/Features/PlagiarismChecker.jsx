import React, { useState } from 'react';
import { MagnifyingGlassIcon, DocumentIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { apiService, getErrorMessage } from '../../services/api';
import toast from '../../services/toast';

const PlagiarismChecker = () => {
  const [content, setContent] = useState('');
  const [selectedSources, setSelectedSources] = useState({
    Devpost: true,
    GitHub: true,
    arXiv: true,
    'Semantic Scholar': true
  });
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState(null);

  const sources = ['Devpost', 'GitHub', 'arXiv', 'Semantic Scholar'];

  const handleCheck = async () => {
    if (!content.trim()) {
      toast.error('Please enter text or code to check for plagiarism');
      return;
    }

    setIsChecking(true);
    
    try {
      const selectedSourcesList = Object.keys(selectedSources).filter(source => selectedSources[source]);
      
      const response = await apiService.plagiarismChecker.checkPlagiarism({
        text: content,
        sources: selectedSourcesList.map(source => source.toLowerCase().replace(' ', ''))
      });
      
      setResults({
        overallScore: response.data.plagiarism_percentage,
        totalMatches: response.data.matched_sources.length,
        sources: response.data.matched_sources.map(source => ({
          name: source.title,
          url: source.url,
          similarity: source.similarity,
          matchedText: source.matched_text
        })),
        highlightedText: response.data.highlighted_text
      });
    } catch (error) {
      console.error('Error checking plagiarism:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsChecking(false);
    }
  };

  const toggleSource = (source) => {
    setSelectedSources(prev => ({
      ...prev,
      [source]: !prev[source]
    }));
  };

  const getScoreColor = (score) => {
    if (score < 10) return 'text-green-600 bg-green-50';
    if (score < 25) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreIcon = (score) => {
    if (score < 10) return CheckCircleIcon;
    return ExclamationTriangleIcon;
  };

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="text-sm text-gray-500">
          <span>Home</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Plagiarism Checker</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Plagiarism Checker</h1>
        <p className="text-gray-600">
          Check text and code against 400M+ academic papers and hackathon projects
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Input */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Content to Check
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your text or code to check for plagiarism..."
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none font-mono text-sm"
            />
          </div>

          {/* Sources Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Sources
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {sources.map((source) => (
                <button
                  key={source}
                  onClick={() => toggleSource(source)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedSources[source]
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          {/* Check Button */}
          <button
            onClick={handleCheck}
            disabled={isChecking}
            className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-600 disabled:bg-orange-300 transition-colors flex items-center justify-center space-x-2"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            <span>{isChecking ? 'Checking...' : 'Check Plagiarism'}</span>
          </button>

          {/* Results */}
          {results && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Results</h3>
              
              {/* Overall Score */}
              <div className={`p-4 rounded-lg mb-6 ${getScoreColor(results.overallScore)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {React.createElement(getScoreIcon(results.overallScore), { className: "w-6 h-6" })}
                    <div>
                      <div className="text-2xl font-bold">{results.overallScore}%</div>
                      <div className="text-sm">Similarity Score</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{results.totalMatches}</div>
                    <div className="text-sm">Matches Found</div>
                  </div>
                </div>
              </div>

              {/* Matched Sources */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Matched Sources</h4>
                {results.sources.map((source, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 mb-1">{source.name}</h5>
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {source.url}
                        </a>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        source.similarity > 15 ? 'bg-red-100 text-red-800' :
                        source.similarity > 8 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {source.similarity}% match
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-sm font-mono text-gray-700">
                      {source.matchedText}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
            {results ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Words Checked</span>
                  <span className="font-medium">{content.split(' ').filter(w => w).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sources Searched</span>
                  <span className="font-medium">
                    {Object.values(selectedSources).filter(Boolean).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Originality</span>
                  <span className={`font-medium ${getScoreColor(results.overallScore).split(' ')[0]}`}>
                    {100 - results.overallScore}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-medium ${getScoreColor(results.overallScore).split(' ')[0]}`}>
                    {results.overallScore < 10 ? 'Original' : 'Needs Review'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <DocumentIcon className="w-12 h-12 mx-auto mb-3" />
                <p className="text-sm">Enter content to see statistics</p>
              </div>
            )}
          </div>

          {/* Tips Card */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
            <h3 className="text-lg font-semibold text-orange-900 mb-3">💡 Tips</h3>
            <ul className="space-y-2 text-orange-800 text-sm">
              <li className="flex items-start">
                <span className="text-orange-600 mr-2">•</span>
                Check both code and documentation
              </li>
              <li className="flex items-start">
                <span className="text-orange-600 mr-2">•</span>
                Review matches above 10% similarity
              </li>
              <li className="flex items-start">
                <span className="text-orange-600 mr-2">•</span>
                Always cite your sources properly
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlagiarismChecker;
