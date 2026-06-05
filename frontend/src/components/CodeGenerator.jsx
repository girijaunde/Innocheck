import React, { useState } from 'react';
import { apiService, getErrorMessage } from '../services/api';
import toast from '../services/toast';

const CodeGenerator = () => {
  const [description, setDescription] = useState('');
  const [framework, setFramework] = useState('react');
  const [includeComments, setIncludeComments] = useState(false);
  const [typescript, setTypescript] = useState(false);
  const [responsive, setResponsive] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState(null);

  const frameworks = [
    { value: 'react', label: 'React', icon: 'â' },
    { value: 'vue', label: 'Vue', icon: 'ð' },
    { value: 'flask', label: 'Flask', icon: 'ð' },
    { value: 'fastapi', label: 'FastAPI', icon: 'â¡' },
    { value: 'html', label: 'HTML/CSS', icon: 'ð' }
  ];

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Please describe what you want to build');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiService.codeGenerator.generateCode({
        description: description,
        framework: framework,
        include_comments: includeComments,
        typescript: typescript,
        responsive: responsive
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error generating code:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Code copied to clipboard!');
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <span className="text-2xl mr-3">ð</span> Code Generator
        </h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Describe Your Project</label>
            <textarea
              className="w-full bg-gray-700 text-white rounded-lg p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Describe what you want to build (e.g., 'Create a todo app with add, edit, delete functionality')"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Framework</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {frameworks.map((fw) => (
                <button
                  key={fw.value}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    framework === fw.value
                      ? 'border-green-500 bg-green-500 bg-opacity-20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => setFramework(fw.value)}
                >
                  <div className="text-2xl mb-1">{fw.icon}</div>
                  <div className="text-sm font-medium">{fw.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="bg-gray-700"
                checked={includeComments}
                onChange={(e) => setIncludeComments(e.target.checked)}
              />
              <span className="text-sm">Include Comments</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="bg-gray-700"
                checked={typescript}
                onChange={(e) => setTypescript(e.target.checked)}
              />
              <span className="text-sm">TypeScript</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="bg-gray-700"
                checked={responsive}
                onChange={(e) => setResponsive(e.target.checked)}
              />
              <span className="text-sm">Responsive Design</span>
            </label>
          </div>

          <button
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Code'}
          </button>
        </div>

        {results && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Generated Code</h2>
              <div className="flex space-x-2">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                  onClick={() => copyToClipboard(results.code)}
                >
                  Copy Code
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="bg-gray-700 p-3 rounded-lg">
                <div className="text-sm text-gray-400 mb-2">
                  Framework: <span className="text-green-400 font-medium">{results.framework}</span>
                </div>
                <div className="text-sm text-gray-400">
                  {results.explanation}
                </div>
              </div>
            </div>

            <div className="relative">
              <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{results.code}</code>
              </pre>
            </div>

            {results.preview_html && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Preview</h3>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <iframe
                    srcDoc={results.preview_html}
                    className="w-full h-64 bg-white rounded"
                    title="Code Preview"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeGenerator;
