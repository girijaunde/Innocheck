import React, { useState } from 'react';
import { 
  RocketLaunchIcon, 
  ComputerDesktopIcon, 
  DeviceTabletIcon, 
  DevicePhoneMobileIcon,
  CodeBracketIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { apiService, getErrorMessage } from '../../services/api';
import toast from '../../services/toast';

const PrototypeBuilder = () => {
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('Landing Page');
  const [selectedColorScheme, setSelectedColorScheme] = useState('Light');
  const [isBuilding, setIsBuilding] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [prototypeCode, setPrototypeCode] = useState('');
  const [showCode, setShowCode] = useState(false);

  const templates = ['Blank', 'Landing Page', 'Dashboard', 'Form', 'E-commerce'];
  const colorSchemes = ['Light', 'Dark', 'Brand'];

  const handleBuild = async () => {
    if (!description.trim()) {
      toast.error('Please describe your prototype');
      return;
    }

    setIsBuilding(true);
    
    try {
      const response = await apiService.prototypeBuilder.buildPrototype({
        description: description,
        template: selectedTemplate.toLowerCase().replace(' ', '_'),
        color_scheme: selectedColorScheme.toLowerCase()
      });
      
      setPrototypeCode(response.data.html_code);
    } catch (error) {
      console.error('Error building prototype:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsBuilding(false);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/prototype/${Date.now()}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Prototype link copied to clipboard!');
  };

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile': return 'w-full max-w-sm';
      case 'tablet': return 'w-full max-w-2xl';
      default: return 'w-full';
    }
  };

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="text-sm text-gray-500">
          <span>Home</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Prototype Builder</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Prototype Builder</h1>
        <p className="text-gray-600">
          Generate rapid prototypes with live preview
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Configuration */}
        <div className="lg:col-span-1 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Prototype Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your prototype..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Template Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Template
            </label>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template}
                  onClick={() => setSelectedTemplate(template)}
                  className={`w-full px-4 py-2 rounded-lg font-medium text-left transition-all ${
                    selectedTemplate === template
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {template}
                </button>
              ))}
            </div>
          </div>

          {/* Color Scheme */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Color Scheme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {colorSchemes.map((scheme) => (
                <button
                  key={scheme}
                  onClick={() => setSelectedColorScheme(scheme)}
                  className={`px-3 py-2 rounded-lg font-medium transition-all ${
                    selectedColorScheme === scheme
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {scheme}
                </button>
              ))}
            </div>
          </div>

          {/* Build Button */}
          <button
            onClick={handleBuild}
            disabled={isBuilding}
            className="w-full bg-purple-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-600 disabled:bg-purple-300 transition-colors flex items-center justify-center space-x-2"
          >
            <RocketLaunchIcon className="w-5 h-5" />
            <span>{isBuilding ? 'Building...' : 'Build Prototype'}</span>
          </button>
        </div>

        {/* Right Panel - Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Preview Header */}
            <div className="border-b border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                {/* Device Toggle */}
                <div className="flex items-center space-x-2 bg-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`p-2 rounded transition-colors ${
                      previewMode === 'desktop' ? 'bg-white shadow-sm' : 'hover:bg-gray-300'
                    }`}
                    title="Desktop view"
                  >
                    <ComputerDesktopIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewMode('tablet')}
                    className={`p-2 rounded transition-colors ${
                      previewMode === 'tablet' ? 'bg-white shadow-sm' : 'hover:bg-gray-300'
                    }`}
                    title="Tablet view"
                  >
                    <DeviceTabletIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`p-2 rounded transition-colors ${
                      previewMode === 'mobile' ? 'bg-white shadow-sm' : 'hover:bg-gray-300'
                    }`}
                    title="Mobile view"
                  >
                    <DevicePhoneMobileIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowCode(!showCode)}
                    className={`p-2 rounded transition-colors ${
                      showCode ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-200'
                    }`}
                    title="View HTML code"
                  >
                    <CodeBracketIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={!prototypeCode}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Share prototype"
                  >
                    <ShareIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Area */}
            <div className="p-6">
              {prototypeCode ? (
                showCode ? (
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300 font-mono">
                      <code>{prototypeCode}</code>
                    </pre>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <div className={getPreviewWidth()}>
                      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-lg">
                        <iframe
                          srcDoc={prototypeCode}
                          className="w-full"
                          style={{ 
                            height: previewMode === 'mobile' ? '600px' : 
                                   previewMode === 'tablet' ? '500px' : '600px' 
                          }}
                          title="Prototype Preview"
                        />
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <RocketLaunchIcon className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg">Your prototype preview will appear here</p>
                  <p className="text-sm mt-2">Describe your prototype and click "Build Prototype" to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <h3 className="text-lg font-semibold text-purple-900 mb-3">🚀 Prototype Tips</h3>
        <ul className="space-y-2 text-purple-800">
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">•</span>
            Be specific about layout, components, and functionality
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">•</span>
            Choose templates that match your project type
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">•</span>
            Test your prototype on different devices using the device toggle
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PrototypeBuilder;
