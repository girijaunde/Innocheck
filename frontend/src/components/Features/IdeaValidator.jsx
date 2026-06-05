import React, { useState } from 'react';
import { LightBulbIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { apiService, getErrorMessage } from '../../services/api';
import toast from '../../services/toast';

const IdeaValidator = () => {
  const [problemStatement, setProblemStatement] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedSource, setSelectedSource] = useState('All');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const languages = ['English', 'मराठी', 'हिंदी'];
  const sources = ['arXiv', 'GitHub', 'Devpost', 'All'];

  const handleAnalyze = async () => {
    if (!problemStatement.trim()) {
      toast.error('Please enter a problem statement');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await apiService.ideaValidator.validateIdea({
        problem_statement: problemStatement,
        language: selectedLanguage.toLowerCase(),
        sources: selectedSource === 'All' ? ['arxiv', 'github', 'devpost'] : [selectedSource.toLowerCase()]
      });
      
      setResults(response.data);
    } catch (error) {
      console.error('Error validating idea:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Handle file upload logic here
      console.log('File uploaded:', file.name);
    }
  };

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="text-sm text-gray-500">
          <span>Home</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Idea Validator</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Idea Validator</h1>
        <p className="text-gray-600">
          Validate your hackathon idea novelty with AI-powered innovation gap analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Problem Statement */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Problem Statement
            </label>
            <textarea
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="Enter your hackathon problem statement..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Language Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Language
            </label>
            <div className="flex space-x-3">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedLanguage === lang
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Source Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Source
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {sources.map((source) => (
                <button
                  key={source}
                  onClick={() => setSelectedSource(source)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedSource === source
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 disabled:bg-blue-300 transition-colors flex items-center justify-center space-x-2"
            >
              <LightBulbIcon className="w-5 h-5" />
              <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Innovation Gap'}</span>
            </button>
            
            <label className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 cursor-pointer">
              <DocumentArrowUpIcon className="w-5 h-5" />
              <span>Upload PDF/DOCX</span>
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <div className="text-center py-8">
              {results ? (
                <div className="space-y-6">
                  {/* Innovation Score */}
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Innovation Score</div>
                    <div className="text-4xl font-bold text-blue-500 mb-2">
                      {results.innovationScore}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${results.innovationScore}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Gap Analysis */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Gap Analysis</h3>
                    <div className="space-y-2">
                      {Object.entries(results.gapAnalysis).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className={`font-medium ${
                            value === 'High' ? 'text-green-600' :
                            value === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                          }`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Similar Projects */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Similar Projects</h3>
                    <div className="space-y-2">
                      {results.similarProjects.map((project, index) => (
                        <div key={index} className="text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-700 truncate">{project.name}</span>
                            <span className="text-gray-500">{project.similarity}%</span>
                          </div>
                          <div className="text-xs text-gray-500">{project.source}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Recommendations</h3>
                    <ul className="space-y-1">
                      {results.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">
                  <LightBulbIcon className="w-16 h-16 mx-auto mb-4" />
                  <p>Enter your Idea and click analyze to see results</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdeaValidator;
