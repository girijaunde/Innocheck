import React from 'react';

const CodeTester = ({ results }) => {
  if (!results) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4 text-sm text-gray-400">
        Run a test to see automated validation, accessibility, and performance warnings.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">🧪 Code Testing</p>
          <p className="text-xs text-gray-400">Validation results based on code analysis.</p>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] uppercase text-gray-300">
          Score {results.complexity_score ?? 0}/100
        </span>
      </div>

      <div className="grid gap-3 text-sm text-gray-300">
        <div className="rounded-2xl bg-gray-950 p-3 border border-gray-800">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Checks</p>
          <p className="mt-2 text-sm">{results.passed_checks} / {results.total_checks}</p>
        </div>
        {results.errors?.length > 0 && (
          <div className="rounded-2xl bg-rose-950 p-3 border border-rose-800">
            <p className="text-xs uppercase tracking-[0.2em] text-rose-400">Errors</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-200">
              {results.errors.map((item, index) => (<li key={index}>• {item}</li>))}
            </ul>
          </div>
        )}
        {results.warnings?.length > 0 && (
          <div className="rounded-2xl bg-orange-950 p-3 border border-orange-800">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-300">Warnings</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-200">
              {results.warnings.map((item, index) => (<li key={index}>• {item}</li>))}
            </ul>
          </div>
        )}
        {results.ai_notes && (
          <div className="rounded-2xl bg-gray-950 p-3 border border-gray-800 text-sm text-gray-300">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">AI Notes</p>
            <p className="mt-2">{results.ai_notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeTester;
