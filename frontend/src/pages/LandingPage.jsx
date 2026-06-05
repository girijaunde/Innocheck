import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <a className="nav-logo flex items-center gap-2 text-2xl font-extrabold" href="#">
            <div style={{ background: '#000', borderRadius: '8px', padding: '3px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/assets/logo.png" alt="InnoCheck logo" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
            </div>
            <span className="nav-logo-text bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">InnoCheck</span>
          </a>
          <div className="flex gap-3">
            <Link 
              to="/login" 
              className="px-6 py-2.5 text-[15px] font-semibold text-indigo-600 border-[1.5px] border-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition-all duration-300 hover:scale-105"
            >
              Log in
            </Link>
            <Link 
              to="/signup" 
              className="px-6 py-2.5 text-[15px] font-semibold bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-none rounded-full shadow-[0_2px_8px_rgba(79,70,229,0.3)] hover:scale-105 hover:shadow-[0_4px_12px_rgba(79,70,229,0.4)] transition-all duration-300"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* HERO SECTION */}
        <section className="text-center pt-20 pb-16 px-8 max-w-7xl mx-auto">
          <span className="inline-block bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            AI-Powered · Multi-Agent · Free Forever
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 bg-gradient-to-br from-gray-900 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Validate ideas.<br />Find the gap.<br />Build what's missing.
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
            InnoCheck uses a 5-agent AI pipeline to tell you not just what already exists — 
            but exactly what's missing from your hackathon idea.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <Link to="/signup" className="px-8 py-3.5 text-base font-semibold bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)] transition-all duration-300">
              🚀 Start Validating for Free
            </Link>
            <button className="px-8 py-3.5 text-base font-semibold bg-transparent text-indigo-600 border-2 border-gray-200 rounded-full hover:border-indigo-600 hover:bg-gray-50 transition-all duration-300">
              📖 Watch Demo
            </button>
          </div>
        </section>

        {/* STATS BANNER */}
        <div className="flex justify-center flex-wrap gap-12 py-8 border-y border-gray-200 bg-gray-50 mb-20 px-8">
          <div className="text-center">
            <div className="text-4xl font-extrabold text-indigo-600">89%</div>
            <div className="text-sm text-gray-500 mt-1">Validation Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-indigo-600">4.2s</div>
            <div className="text-sm text-gray-500 mt-1">Mean Response</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-indigo-600">3</div>
            <div className="text-sm text-gray-500 mt-1">Languages</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-indigo-600">4.5/5</div>
            <div className="text-sm text-gray-500 mt-1">User Rating</div>
          </div>
        </div>

        {/* EVERYTHING YOU NEED SECTION */}
        <section className="py-20 border-b border-gray-100 max-w-7xl mx-auto px-8">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">Everything you need to validate & build</h2>
          <p className="text-center text-gray-500 text-lg max-w-2xl mx-auto mb-12">
            Six integrated tools — from idea validation to code generation — built for engineering students and hackathon participants.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7 hover:-translate-y-1 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-indigo-100 transition-colors">
                <span className="text-2xl text-indigo-600">🧠</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Idea Validator</h3>
              <p className="text-gray-500 leading-relaxed mb-4">5-agent LangGraph pipeline searches GitHub, ArXiv & Semantic Scholar. Returns uniqueness score, innovation gaps, and a week-by-week roadmap.</p>
              <span className="inline-block bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium">✅ Working</span>
            </div>
            {/* Feature 2 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7 hover:-translate-y-1 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-indigo-100 transition-colors">
                <span className="text-2xl text-indigo-600">💻</span>
              </div>
              <h3 className="text-xl font-bold mb-3">CodeStudio</h3>
              <p className="text-gray-500 leading-relaxed mb-4">Generate React, Vue, Flask, FastAPI components or complete interactive prototypes. Live preview across device sizes with natural-language refinement.</p>
              <span className="inline-block bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium">✅ Working</span>
            </div>
            {/* Feature 3 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7 hover:-translate-y-1 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-indigo-100 transition-colors">
                <span className="text-2xl text-indigo-600">📖</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Literature Review</h3>
              <p className="text-gray-500 leading-relaxed mb-4">Semantic search across 590M+ papers via Semantic Scholar. RAG pipeline scores relevance to your idea and generates research gap reports instantly.</p>
              <span className="inline-block bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium">✅ Working</span>
            </div>
            {/* Feature 4 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7 hover:-translate-y-1 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-indigo-100 transition-colors">
                <span className="text-2xl text-indigo-600">📄</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Plagiarism Checker</h3>
              <p className="text-gray-500 leading-relaxed mb-4">Sentence-level semantic detection with Sentence-BERT. Catches paraphrasing at 85% threshold — far beyond keyword matching.</p>
              <span className="inline-block bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium">✅ Working</span>
            </div>
            {/* Feature 5 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7 hover:-translate-y-1 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-indigo-100 transition-colors">
                <span className="text-2xl text-indigo-600">📈</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Analytics Dashboard</h3>
              <p className="text-gray-500 leading-relaxed mb-4">Track all your validated ideas, uniqueness scores, prototypes built, and papers saved. Trending hackathon topics updated in real time.</p>
            </div>
            {/* Feature 6 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7 hover:-translate-y-1 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-indigo-100 transition-colors">
                <span className="text-2xl text-indigo-600">📥</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Report Export</h3>
              <p className="text-gray-500 leading-relaxed mb-4">Bundle your full analysis — validation, plagiarism, literature review & bibliography — into a professional PDF or Markdown file in one click.</p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="bg-gray-50 rounded-[40px] py-16 px-8 max-w-7xl mx-auto my-10">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">From problem statement to innovation report</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-5 shadow-lg">1</div>
              <h4 className="text-lg font-semibold mb-3">Describe your idea</h4>
              <p className="text-gray-500 text-sm">Enter your problem statement and what you think makes it unique.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-5 shadow-lg">2</div>
              <h4 className="text-lg font-semibold mb-3">Agents search the web</h4>
              <p className="text-gray-500 text-sm">Five AI agents query GitHub, ArXiv, and Semantic Scholar simultaneously.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-5 shadow-lg">3</div>
              <h4 className="text-lg font-semibold mb-3">Gap analysis computed</h4>
              <p className="text-gray-500 text-sm">Cosine similarity + LLM reasoning identifies exactly what's still missing.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-5 shadow-lg">4</div>
              <h4 className="text-lg font-semibold mb-3">Get your roadmap</h4>
              <p className="text-gray-500 text-sm">Receive a uniqueness score, novel directions, and a week-by-week build plan.</p>
            </div>
          </div>
        </section>

        {/* PERFORMANCE SECTION */}
        <section className="py-20 max-w-7xl mx-auto px-8 border-b border-gray-100">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Numbers that speak</h2>
          <p className="text-center text-gray-500 text-lg mb-12">Evaluated across 35 users and 4 technical domains with rigorous benchmarking.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-3xl p-8">
              <div className="text-5xl font-extrabold text-indigo-600 mb-2">89%</div>
              <div className="text-sm text-gray-500">Validation accuracy</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-3xl p-8">
              <div className="text-5xl font-extrabold text-indigo-600 mb-2">0.89</div>
              <div className="text-sm text-gray-500">AUROC score</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-3xl p-8">
              <div className="text-5xl font-extrabold text-indigo-600 mb-2">0.85</div>
              <div className="text-sm text-gray-500">F1 score</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-3xl p-8">
              <div className="text-5xl font-extrabold text-indigo-600 mb-2">+15.2%</div>
              <div className="text-sm text-gray-500">Over baseline (p&lt;0.001)</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-3xl p-8">
              <div className="text-5xl font-extrabold text-indigo-600 mb-2">4.2s</div>
              <div className="text-sm text-gray-500">Mean response time</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-3xl p-8">
              <div className="text-5xl font-extrabold text-indigo-600 mb-2">4.5/5</div>
              <div className="text-sm text-gray-500">User satisfaction</div>
            </div>
          </div>
        </section>

        {/* COMPARISON SECTION */}
        <section className="py-20 max-w-7xl mx-auto px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Why InnoCheck?</h2>
          <p className="text-center text-gray-500 text-lg mb-12">The only free, all-in-one platform built specifically for hackathon participants.</p>
          
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-center bg-white border-collapse">
              <thead>
                <tr className="bg-gray-50 text-sm font-bold text-gray-900">
                  <th className="p-4 text-left border-b border-gray-200">FEATURE</th>
                  <th className="p-4 border-b border-gray-200">ValidatorAI</th>
                  <th className="p-4 border-b border-gray-200">Elicit</th>
                  <th className="p-4 border-b border-gray-200">Turnitin</th>
                  <th className="p-4 border-b border-gray-200">GitHub Copilot</th>
                  <th className="p-4 border-b border-gray-200">InnoCheck</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b border-gray-100">
                  <td className="p-4 text-left font-semibold text-gray-900">Price</td>
                  <td className="p-4">$49/mo</td><td className="p-4">$12/mo</td><td className="p-4">$3-5/page</td><td className="p-4">$10/mo</td>
                  <td className="p-4 text-emerald-500 font-bold">FREE</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-4 text-left font-semibold text-gray-900">Idea validation</td>
                  <td className="p-4">Business only</td><td className="p-4">—</td><td className="p-4">—</td><td className="p-4">—</td>
                  <td className="p-4 text-emerald-500 font-bold">✓ Technical gaps</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-4 text-left font-semibold text-gray-900">Literature review</td>
                  <td className="p-4">—</td><td className="p-4">✓</td><td className="p-4">—</td><td className="p-4">—</td>
                  <td className="p-4 text-emerald-500 font-bold">✓ + Relevance %</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-4 text-left font-semibold text-gray-900">Plagiarism check</td>
                  <td className="p-4">—</td><td className="p-4">—</td><td className="p-4">✓</td><td className="p-4">—</td>
                  <td className="p-4 text-emerald-500 font-bold">✓ Semantic</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-4 text-left font-semibold text-gray-900">Code generation</td>
                  <td className="p-4">—</td><td className="p-4">—</td><td className="p-4">—</td><td className="p-4">✓</td>
                  <td className="p-4 text-emerald-500 font-bold">✓ + Prototype</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-4 text-left font-semibold text-gray-900">Multilingual</td>
                  <td className="p-4">—</td><td className="p-4">—</td><td className="p-4">—</td><td className="p-4">—</td>
                  <td className="p-4 text-emerald-500 font-bold">✓ EN / हिंदी / मराठी</td>
                </tr>
                <tr>
                  <td className="p-4 text-left font-semibold text-gray-900">Innovation gap analysis</td>
                  <td className="p-4">—</td><td className="p-4">—</td><td className="p-4">—</td><td className="p-4">—</td>
                  <td className="p-4 text-emerald-500 font-bold">✓ Unique to InnoCheck</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* TECH STACK SECTION */}
        <section className="bg-gray-50 rounded-[40px] py-12 px-8 max-w-7xl mx-auto my-10 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Built on serious infrastructure</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['LangGraph', 'Sentence-BERT', 'FAISS', 'FastAPI', 'React 18', 'PostgreSQL + pgvector', 'Google Gemini', 'Groq (Llama 3)', 'GitHub API', 'ArXiv API', 'Semantic Scholar', 'Redis', 'Tailwind CSS', 'Framer Motion', 'ReportLab'].map((tech) => (
              <span key={tech} className="bg-white border border-gray-200 px-5 py-2 rounded-full text-sm font-medium text-gray-800 shadow-sm">
                {tech}
              </span>
            ))}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-gray-50 py-12 border-t border-gray-200 text-center mt-20">
        <div className="flex justify-center gap-8 mb-6 flex-wrap">
          <a href="#" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Terms</a>
          <a href="#" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Privacy</a>
          <a href="#" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Contact</a>
          <a href="#" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">GitHub</a>
          <a href="#" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Docs</a>
        </div>
        <div className="text-xs text-gray-400">
          InnoCheck © 2024 — From Idea to Innovation Gap Analysis in Seconds
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
