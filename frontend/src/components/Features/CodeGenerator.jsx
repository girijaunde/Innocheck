import React, { useState } from 'react';
import { CodeBracketIcon, DocumentDuplicateIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { apiService, getErrorMessage } from '../../services/api';
import toast from '../../services/toast';

const CodeGenerator = () => {
  const [description, setDescription] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('React.js');
  const [options, setOptions] = useState({
    includeComments: true,
    typescript: true,
    responsiveDesign: true
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  const frameworks = ['React.js', 'Vue.js', 'Flask', 'FastAPI', 'HTML/CSS'];

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Please describe the app/component you want to build');
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await apiService.codeGenerator.generateCode({
        description: description,
        framework: selectedFramework.replace('.js', ''),
        include_comments: options.includeComments,
        typescript: options.typescript,
        responsive: options.responsiveDesign
      });
      
      setGeneratedCode(response.data.code);
    } catch (error) {
      console.error('Error generating code:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success('Code copied to clipboard!');
  };

  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-code.${selectedFramework.toLowerCase().replace('.', '')}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleOption = (option) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="text-sm text-gray-500">
          <span>Home</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Code Generator</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Code Generator</h1>
        <p className="text-gray-600">
          Convert natural language to functional code in multiple frameworks
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Input */}
        <div className="space-y-6">
          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the app/component you want to build..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Framework Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Framework
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {frameworks.map((framework) => (
                <button
                  key={framework}
                  onClick={() => setSelectedFramework(framework)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedFramework === framework
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {framework}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Options
            </label>
            <div className="space-y-3">
              {Object.entries({
                includeComments: 'Include comments',
                typescript: 'TypeScript',
                responsiveDesign: 'Responsive design'
              }).map(([key, label]) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options[key]}
                    onChange={() => toggleOption(key)}
                    className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-green-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-600 disabled:bg-green-300 transition-colors flex items-center justify-center space-x-2"
          >
            <CodeBracketIcon className="w-5 h-5" />
            <span>{isGenerating ? 'Generating...' : 'Generate Code'}</span>
          </button>
        </div>

        {/* Right Panel - Output */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Output Header */}
          <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-gray-50">
            <h3 className="font-medium text-gray-900">
              {selectedFramework} Output
            </h3>
            {generatedCode && (
              <div className="flex space-x-2">
                <button
                  onClick={handleCopy}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                  title="Copy code"
                >
                  <DocumentDuplicateIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                  title="Download as ZIP"
                >
                  <ArchiveBoxIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Code Output Area */}
          <div className="p-6">
            {generatedCode ? (
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300 font-mono">
                  <code>{generatedCode}</code>
                </pre>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <CodeBracketIcon className="w-16 h-16 mx-auto mb-4" />
                <p>Generated code will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-3">💡 Pro Tips</h3>
        <ul className="space-y-2 text-green-800">
          <li className="flex items-start">
            <span className="text-green-600 mr-2">•</span>
            Be specific about functionality and features you want
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">•</span>
            Mention specific libraries or components you prefer
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">•</span>
            Include styling preferences (CSS framework, design system, etc.)
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CodeGenerator;
