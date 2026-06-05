import React, { useState } from 'react';
import { Download, FileText, Printer, CheckCircle, Clock, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const mockReports = [
    {
      id: 1,
      title: 'SafeTrek Guardian IoT',
      problemStatement: 'Low-cost wearable panic switches communicating over mesh protocol (LoRaWAN) for tourist locations with zero cell network.',
      score: 78,
      status: 'Ready',
      created: 'Jun 02, 2026',
      marketSize: '$12.4 Billion',
      feasibility: 'High (Mesh LoRa P2P)',
      weakness: 'Device batteries and rugged housing constraints.',
      complexity: 'Medium'
    },
    {
      id: 2,
      title: 'AI Smart Agriculture',
      problemStatement: 'Automated soil nutrient detector and crop health forecasting AI dashboard using satellite imaging.',
      score: 84,
      status: 'Ready',
      created: 'May 28, 2026',
      marketSize: '$8.2 Billion',
      feasibility: 'Medium (API usage, satellite costs)',
      weakness: 'Dependence on high resolution cloudless imagery.',
      complexity: 'High'
    },
    {
      id: 3,
      title: 'EduQuest Gamified Learning',
      problemStatement: 'VR based interactive historical exploration game built with React VR and WebGL for school students.',
      score: 91,
      status: 'Processing',
      created: 'May 30, 2026',
      marketSize: '$22.0 Billion',
      feasibility: 'High (Web browser based)',
      weakness: 'High initial 3D design rendering time.',
      complexity: 'Advanced'
    }
  ];

  const filteredReports = mockReports.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.problemStatement.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = (format, title) => {
    toast.success(`Downloading ${title} report as ${format.toUpperCase()}...`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn text-gray-800 relative">
      <div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Innovation Reports Hub
        </h1>
        <p className="text-xs text-gray-500 mt-1">Compile comprehensive feasibility, originality, and architecture reports of your projects.</p>
      </div>

      {/* Search and filter */}
      <div className="flex bg-white border border-gray-200 rounded-2xl p-3 shadow-sm items-center gap-3">
        <Search size={18} className="text-gray-400" />
        <input
          type="text"
          placeholder="Filter compiled reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-xs"
        />
      </div>

      {/* Reports Table Grid */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Generated Reports ({filteredReports.length})</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredReports.map((report) => (
            <div key={report.id} className="p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-gray-50/55 transition-colors">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-gray-900">{report.title}</h4>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                    report.status === 'Ready' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {report.status}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{report.problemStatement}</p>
                <div className="flex gap-4 text-[10px] text-gray-400 pt-1 font-medium">
                  <span>📅 Compiled: {report.created}</span>
                  <span>📊 Score: {report.score}/100</span>
                  <span>⚙️ Complexity: {report.complexity}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedReport(report)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  View Report
                </button>
                <button
                  onClick={() => handleDownload('pdf', report.title)}
                  className="p-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-500 transition-colors"
                  title="Download PDF"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}

          {filteredReports.length === 0 && (
            <div className="p-10 text-center text-xs text-gray-400">
              No compiled reports matching search.
            </div>
          )}
        </div>
      </div>

      {/* Modal View for Detailed Report */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scaleIn">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2 text-indigo-600">
                <FileText size={20} />
                <h3 className="font-bold text-sm text-gray-900">Innovation Analysis Report</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="p-2 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors"
                  title="Print Report"
                >
                  <Printer size={16} />
                </button>
                <button
                  onClick={() => handleDownload('pdf', selectedReport.title)}
                  className="p-2 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors"
                  title="Download PDF"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Printable Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-xs text-gray-700 leading-relaxed font-mono">
              <div className="border-b border-gray-200 pb-4 text-center">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">{selectedReport.title}</h2>
                <p className="text-[10px] text-gray-400 mt-1">COMPREHENSIVE INNOVATION REPORT & SCHOLASTIC AUDIT</p>
                <div className="flex justify-center gap-6 mt-4 text-[10px] font-bold text-gray-500 uppercase">
                  <span>Score: {selectedReport.score}/100</span>
                  <span>Date: {selectedReport.created}</span>
                  <span>Status: Verified</span>
                </div>
              </div>

              <div>
                <h4 className="font-black text-gray-900 uppercase border-l-2 border-indigo-600 pl-2 mb-2">1. Executive Summary</h4>
                <p className="text-gray-600">{selectedReport.problemStatement}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <h4 className="font-black text-gray-900 uppercase mb-2">Market Size & Potential</h4>
                  <p className="text-lg font-black text-indigo-600">{selectedReport.marketSize}</p>
                  <p className="text-[9px] text-gray-400 mt-1">Addressable global market for technology solutions.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <h4 className="font-black text-gray-900 uppercase mb-2">Technical Feasibility</h4>
                  <p className="text-[11px] font-bold text-emerald-600">{selectedReport.feasibility}</p>
                  <p className="text-[9px] text-gray-400 mt-2">Architecture structure complexity rating: {selectedReport.complexity}.</p>
                </div>
              </div>

              <div>
                <h4 className="font-black text-gray-900 uppercase border-l-2 border-indigo-600 pl-2 mb-2">2. Critical Implementation Challenges</h4>
                <p className="text-gray-600">{selectedReport.weakness}</p>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4">
                <h4 className="font-black text-gray-900 uppercase border-l-2 border-indigo-600 pl-2 mb-2">3. Recommended Technology Stack</h4>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-center pt-2">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2.5">
                    <span className="font-bold text-indigo-700 block">Frontend</span>
                    <span className="text-gray-500 font-medium">React, TailwindCSS</span>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-2.5">
                    <span className="font-bold text-purple-700 block">Backend</span>
                    <span className="text-gray-500 font-medium">FastAPI, Python</span>
                  </div>
                  <div className="bg-pink-50 border border-pink-100 rounded-xl p-2.5">
                    <span className="font-bold text-pink-700 block">Database</span>
                    <span className="text-gray-500 font-medium">PostgreSQL, Redis</span>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-600/5 text-indigo-700 p-4 rounded-2xl border border-indigo-100 text-[10px] text-center font-bold">
                ✓ Originality and Anti-Plagiarism Audit Passed with index rating 94.6%
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-600 transition-colors"
              >
                Close View
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Printer size={14} /> Print Document
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
