import React from 'react';

const TemplateGallery = ({ templates = [], selectedTemplate, onSelect }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-white">📚 Template Library</p>
        <p className="text-xs text-gray-400">Browse student-ready templates for instant generation.</p>
      </div>
      <div className="space-y-4">
        {templates.map((category) => (
          <div key={category.category} className="space-y-3">
            <div className="text-xs uppercase tracking-[0.2em] text-gray-500">{category.category}</div>
            <div className="grid gap-3">
              {category.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`w-full text-left rounded-2xl border px-4 py-3 transition ${
                    selectedTemplate === item.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-800 bg-gray-950 hover:border-gray-600'
                  }`}
                  onClick={() => onSelect(item.id)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                    </div>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-gray-300">{item.tags.join(', ')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateGallery;
