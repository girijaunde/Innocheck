import React from 'react';

const SmartSuggestions = ({ suggestions = [] }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-white">💡 AI Suggestions</p>
          <p className="text-xs text-gray-400">Student-friendly guidance you can apply next.</p>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className="rounded-xl bg-gray-950 p-4 text-sm text-gray-400">No suggestions yet. Generate a project or ask for help.</div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((item, index) => (
            <div key={index} className="rounded-2xl bg-gray-950 p-3 border border-gray-800">
              <p className="text-sm text-gray-200">{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartSuggestions;
