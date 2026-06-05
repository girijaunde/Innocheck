import React, { useState } from 'react';
import { apiService, getErrorMessage } from '../services/api';
import toast from '../services/toast';

const PrototypeBuilder = () => {
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('blank');
  const [colorScheme, setColorScheme] = useState('light');
  const [isBuilding, setIsBuilding] = useState(false);
  const [results, setResults] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [instruction, setInstruction] = useState('');

  const templates = [
    { value: 'blank', label: 'Blank', icon: 'ð' },
    { value: 'landing_page', label: 'Landing Page', icon: 'ð' },
    { value: 'dashboard', label: 'Dashboard', icon: 'ð' },
    { value: 'form', label: 'Form', icon: 'ð' },
    { value: 'ecommerce', label: 'E-commerce', icon: 'ð' }
  ];

  const colorSchemes = [
    { value: 'light', label: 'Light', icon: 'â' },
    { value: 'dark', label: 'Dark', icon: 'ð' },
    { value: 'brand', label: 'Brand', icon: 'ð' }
  ];

  const previewModes = [
    { value: 'desktop', label: 'Desktop', width: '100%' },
    { value: 'tablet', label: 'Tablet', width: '768px' },
    { value: 'mobile', label: 'Mobile', width: '375px' }
  ];

  const handleBuild = async () => {
    if (!description.trim()) {
      toast.error('Please describe your prototype');
      return;
    }

    setIsBuilding(true);
    try {
      const response = await apiService.prototypeBuilder.generatePrototype({
        description: description,
        framework: 'html',
        template_id: template,
        auto_template: true,
        extra_context: `color_scheme=${colorScheme}`
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error building prototype:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsBuilding(false);
    }
  };

  const handleRefine = async () => {
    const currentCode = results?.files?.[0]?.content;
    if (!currentCode || !instruction.trim()) return;
    setIsBuilding(true);
    try {
      const response = await apiService.prototypeBuilder.refinePrototype({
        framework: results.framework || 'html',
        code: currentCode,
        instruction,
      });
      setResults((prev) => ({ ...prev, ...response.data }));
      setInstruction('');
    } catch (error) {
      console.error('Error refining prototype:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsBuilding(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Code copied to clipboard!');
  };

  const downloadCode = (html, filename) => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const primaryCode = results?.files?.[0]?.content || '';

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <span className="text-2xl mr-3">ð</span> Prototype Builder
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Describe Your Prototype</label>
                <textarea
                  className="w-full bg-gray-700 text-white rounded-lg p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Describe the prototype you want to build (e.g., 'A landing page for a mobile app with hero section, features, and contact form')"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Template</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.value}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        template === tpl.value
                          ? 'border-pink-500 bg-pink-500 bg-opacity-20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => setTemplate(tpl.value)}
                    >
                      <div className="text-2xl mb-1">{tpl.icon}</div>
                      <div className="text-sm font-medium">{tpl.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Color Scheme</label>
                <div className="grid grid-cols-3 gap-3">
                  {colorSchemes.map((scheme) => (
                    <button
                      key={scheme.value}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        colorScheme === scheme.value
                          ? 'border-pink-500 bg-pink-500 bg-opacity-20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => setColorScheme(scheme.value)}
                    >
                      <div className="text-2xl mb-1">{scheme.icon}</div>
                      <div className="text-sm font-medium">{scheme.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="w-full bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors font-medium"
                onClick={handleBuild}
                disabled={isBuilding}
              >
                {isBuilding ? 'Building...' : 'Build Prototype'}
              </button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Live Preview</h2>
              {results && (
                <div className="flex space-x-2">
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    onClick={() => copyToClipboard(primaryCode)}
                  >
                    Copy HTML
                  </button>
                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    onClick={() => downloadCode(primaryCode, 'prototype.html')}
                  >
                    Download
                  </button>
                </div>
              )}
            </div>

            {results && (
              <div className="space-y-4">
                {/* Preview Mode Selector */}
                <div className="flex space-x-2">
                  {previewModes.map((mode) => (
                    <button
                      key={mode.value}
                      className={`px-3 py-1 rounded text-sm ${
                        previewMode === mode.value
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                      onClick={() => setPreviewMode(mode.value)}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {/* Preview Frame */}
                <div className="bg-white rounded-lg overflow-hidden" style={{ height: '500px' }}>
                  <iframe
                    srcDoc={primaryCode}
                    className="w-full h-full"
                    style={{ width: previewModes.find(m => m.value === previewMode)?.width }}
                    title="Prototype Preview"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium block">Refine this prototype</label>
                  <textarea
                    className="w-full bg-gray-700 text-white rounded-lg p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Example: Add a pricing section and sticky top navigation."
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                  />
                  <button
                    className="bg-pink-700 text-white px-4 py-2 rounded-lg hover:bg-pink-800 text-sm disabled:opacity-60"
                    onClick={handleRefine}
                    disabled={isBuilding || !instruction.trim()}
                  >
                    Refine Prototype
                  </button>
                </div>
              </div>
            )}

            {!results && (
              <div className="flex items-center justify-center h-96 bg-gray-700 rounded-lg">
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">ð</div>
                  <p>Build a prototype to see the live preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Code Display */}
        {results && (
          <div className="mt-6 bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Generated Code</h2>
              <div className="flex space-x-2">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                  onClick={() => copyToClipboard(primaryCode)}
                >
                  Copy HTML
                </button>
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                  onClick={() => downloadCode(primaryCode, 'prototype.html')}
                >
                  Download HTML
                </button>
              </div>
            </div>

            <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
                <code>{primaryCode}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrototypeBuilder;
