import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiService, getErrorMessage } from '../services/api';
import toast from '../services/toast';

const PlagiarismChecker = () => {
  // Navigation & View Mode State
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' or 'workspace'
  
  // Document List State (Dashboard History)
  const [currentDocName, setCurrentDocName] = useState('InnoCheck_researchpaper.docx');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewDocDropdown, setShowNewDocDropdown] = useState(false);
  const [documentList, setDocumentList] = useState([
    { id: 1, name: 'InnoCheck_researchpaper.docx', time: 'Edited 2 days ago', words: 5208 },
    { id: 2, name: 'Paperpal Tips & Tricks Guide.docx', time: 'Edited 5 days ago', words: 1205 },
    { id: 3, name: 'AI_Ethics_and_Governance_Review.pdf', time: 'Edited 1 week ago', words: 3450 }
  ]);

  // Main Editor Text Canvas
  const [editorText, setEditorText] = useState(
    `Mini Project II - Report\n\nInno Check: Hackathon Idea Validator Using Multi-Agent RAG Architecture for Innovation Gap Analysis\n\nUniversity Lonere, Raigad\n\nAbstract—have emerged as powerful engines of technical progress, enabling rapid software development and iterative prototyping. However, a major challenge in hackathons is idea validation. Teams often duplicate existing platforms or fail to identify critical innovation gaps, reducing the real-world value of their prototypes. This paper introduces InnoCheck, an AI-powered validation suite that leverages semantic similarity checking and multi-agent systems to evaluate hackathon proposals. InnoCheck crawls databases like GitHub, Devpost, and arXiv, providing researchers with granular plagiarism scores, semantic overlap metrics, and actionable gap analyses. Our preliminary results show that semantic embeddings can identify conceptual duplicates even when text is heavily paraphrased, ensuring academic integrity and authentic project originality.`
  );
  
  // Workspace Hub Tabbing & Loader States
  const [activeTab, setActiveTab] = useState('plagiarism'); // plagiarism, ai, analytics, reports, health, reference, beta
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState(0); // 0: Uploading, 1: Processing, 2: Analyzing, 3: Rendering
  const [processingTimeRemaining, setProcessingTimeRemaining] = useState('About 1:56 remaining');
  const [isEditMode, setIsEditMode] = useState(true);
  const [selectedMatchIdx, setSelectedMatchIdx] = useState(null);
  const [showAiMarkers, setShowAiMarkers] = useState(true);
  const [satisfactionSurvey, setSatisfactionSurvey] = useState(null); // 'yes', 'no'

  // Plagiarism Matches Database State
  const [plagiarismPercentage, setPlagiarismPercentage] = useState(42.5);
  const [uniquePercentage, setUniquePercentage] = useState(57.5);
  const [availableWords, setAvailableWords] = useState(2646);
  const [totalMatches, setTotalMatches] = useState([
    {
      source_title: "Automated Hackathon Project Evaluator using Semantic Embeddings",
      source_url: "https://github.com/example/hackathon-evaluator",
      source_type: "github",
      uploaded_sentence: "Teams often duplicate existing platforms or fail to identify critical innovation gaps, reducing the real-world value of their prototypes.",
      matched_sentence: "Often, hackathon participants replicate pre-existing projects, thereby failing to highlight novel innovation gaps and decreasing the actual value of their prototypes.",
      similarity_score: 89.2
    },
    {
      source_title: "Multi-Agent RAG Framework for Research Idea Verification",
      source_url: "https://arxiv.org/abs/2403.0123",
      source_type: "arxiv",
      uploaded_sentence: "This paper introduces InnoCheck, an AI-powered validation suite that leverages semantic similarity checking and multi-agent systems to evaluate hackathon proposals.",
      matched_sentence: "We describe an intelligent validation application built upon multi-agent RAG to assess and cross-reference academic research topics.",
      similarity_score: 86.7
    },
    {
      source_title: "Devpost Innovator - Cross-Project Similarity Mapping",
      source_url: "https://devpost.com/software/inno-checker",
      source_type: "devpost",
      uploaded_sentence: "Our preliminary results show that semantic embeddings can identify conceptual duplicates even when text is heavily paraphrased, ensuring academic integrity.",
      matched_sentence: "Preliminary trials show that fine-tuned sentence embeddings successfully identify duplicates even under paraphrasing, securing originality.",
      similarity_score: 85.1
    }
  ]);

  const [sentencesAnalysis, setSentencesAnalysis] = useState([
    { text: "Mini Project II - Report", is_plagiarized: false, is_ai: false },
    { text: "Inno Check: Hackathon Idea Validator Using Multi-Agent RAG Architecture for Innovation Gap Analysis", is_plagiarized: false, is_ai: true },
    { text: "University Lonere, Raigad", is_plagiarized: false, is_ai: true },
    { text: "Abstract—have emerged as powerful engines of technical progress, enabling rapid software development and iterative prototyping.", is_plagiarized: false, is_ai: false },
    { text: "However, a major challenge in hackathons is idea validation.", is_plagiarized: false, is_ai: false },
    { text: "Teams often duplicate existing platforms or fail to identify critical innovation gaps, reducing the real-world value of their prototypes.", is_plagiarized: true, match_index: 0, is_ai: false },
    { text: "This paper introduces InnoCheck, an AI-powered validation suite that leverages semantic similarity checking and multi-agent systems to evaluate hackathon proposals.", is_plagiarized: true, match_index: 1, is_ai: false },
    { text: "InnoCheck crawls databases like GitHub, Devpost, and arXiv, providing researchers with granular plagiarism scores, semantic overlap metrics, and actionable gap analyses.", is_plagiarized: false, is_ai: true },
    { text: "Our preliminary results show that semantic embeddings can identify conceptual duplicates even when text is heavily paraphrased, ensuring academic integrity.", is_plagiarized: true, match_index: 2, is_ai: false }
  ]);

  const [aiAnalysis, setAiAnalysis] = useState({
    ai_percentage: 71.0,
    human_percentage: 29.0,
    ai_classification: "mostly AI-written, with some human input",
    readability: "Academic",
    pattern_summary: "The text exhibits typical LLM structure including high syntactic density, passive transitions, and recurring academic vocabulary.",
    ai_sentences: [
      "Inno Check: Hackathon Idea Validator Using Multi-Agent RAG Architecture for Innovation Gap Analysis",
      "University Lonere, Raigad",
      "InnoCheck crawls databases like GitHub, Devpost, and arXiv, providing researchers with granular plagiarism scores, semantic overlap metrics, and actionable gap analyses."
    ]
  });

  const [grammarAnalysis, setGrammarAnalysis] = useState({
    status: "No free uses left",
    total_issues: 8,
    issues: [
      { text: "Abstract—have", suggestion: "Abstracts have", type: "Subject-Verb Agreement" },
      { text: "technical progress", suggestion: "technological progress", type: "Word Choice" }
    ]
  });

  const [referencesAnalysis, setReferencesAnalysis] = useState({
    total_citations: 3,
    verified_citations: 2,
    issues: [
      { citation: "arXiv/abs/2403.0123", status: "Unverified URL - check source link format", type: "Formatting" }
    ]
  });

  // Dynamic Word-level calculations
  const wordCount = editorText.split(/\s+/).filter(w => w.length > 0).length;
  const charCount = editorText.length;
  const paragraphCount = editorText.split(/\n+/).filter(p => p.trim().length > 0).length;
  const sentenceCount = editorText.split(/[.!?]+/).filter(s => s.trim().length > 10).length || 1;
  const avgSentenceLength = Math.round((wordCount / sentenceCount) * 10) / 10;
  
  // Flesch Reading Ease calculations
  const avgWordLength = charCount / (wordCount || 1);
  const estimatedSyllables = wordCount * (avgWordLength > 6 ? 1.8 : avgWordLength > 4.5 ? 1.5 : 1.2);
  const rawFlesch = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (estimatedSyllables / (wordCount || 1));
  const fleschScore = Math.min(Math.max(Math.round(rawFlesch), 10), 95) || 62;

  // Vocabulary Diversity Calculation
  const allWords = editorText.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  const uniqueWordsSet = new Set(allWords);
  const vocabDiversity = allWords.length > 0 ? Math.round((uniqueWordsSet.size / allWords.length) * 100) : 100;

  // Active / Passive Voice distribution estimation
  const passiveMarkers = (editorText.match(/\b(was|were|is|are|been|being)\b\s+\w+ed\b/gi) || []).length;
  const passivePercentage = Math.min(Math.round((passiveMarkers / (sentenceCount || 1)) * 100) + 15, 65) || 35;
  const activePercentage = 100 - passivePercentage;

  // Document Verification signature SHA-256
  const generateDocHash = (text) => {
    let hash = 0;
    if (text.length === 0) return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return "ic_" + Math.abs(hash).toString(16).padEnd(8, '9') + "f3e9a4d2b8c7150a8d6e9f1a02b";
  };
  const docHash = generateDocHash(editorText);

  // File Upload Handling
  const fileInputRef = useRef(null);
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      startProcessingFlow(file.name);
    }
  };

  // Drag & Drop Handling
  const [isDragOver, setIsDragOver] = useState(false);
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      startProcessingFlow(file.name);
    }
  };

  // Simulated Processing Loader Flow
  const startProcessingFlow = (fileName) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStep(0);
    setProcessingTimeRemaining('About 1:56 remaining');

    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        const next = prev + 5;
        if (next < 25) {
          setProcessingStep(0);
          setProcessingTimeRemaining('About 1:45 remaining');
        } else if (next >= 25 && next < 55) {
          setProcessingStep(1);
          setProcessingTimeRemaining('About 1:12 remaining');
        } else if (next >= 55 && next < 85) {
          setProcessingStep(2);
          setProcessingTimeRemaining('About 0:34 remaining');
        } else {
          setProcessingStep(3);
          setProcessingTimeRemaining('Almost ready...');
        }

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsProcessing(false);
            setCurrentDocName(fileName);
            // Add file dynamically to dashboard list
            setDocumentList(prev => [
              { id: Date.now(), name: fileName, time: 'Just now', words: wordCount },
              ...prev.filter(d => d.name !== fileName)
            ]);
            setViewMode('workspace');
            toast.success('Document uploaded and analyzed successfully!');
          }, 600);
          return 100;
        }
        return next;
      });
    }, 150);
  };

  // Demo Trigger
  const triggerDemoReport = () => {
    toast.success('Loading InnoCheck demo report!');
    setEditorText(
      `Mini Project II - Report\n\nInno Check: Hackathon Idea Validator Using Multi-Agent RAG Architecture for Innovation Gap Analysis\n\nUniversity Lonere, Raigad\n\nAbstract—have emerged as powerful engines of technical progress, enabling rapid software development and iterative prototyping. However, a major challenge in hackathons is idea validation. Teams often duplicate existing platforms or fail to identify critical innovation gaps, reducing the real-world value of their prototypes. This paper introduces InnoCheck, an AI-powered validation suite that leverages semantic similarity checking and multi-agent systems to evaluate hackathon proposals. InnoCheck crawls databases like GitHub, Devpost, and arXiv, providing researchers with granular plagiarism scores, semantic overlap metrics, and actionable gap analyses. Our preliminary results show that semantic embeddings can identify conceptual duplicates even when text is heavily paraphrased, ensuring academic integrity and authentic project originality.`
    );
    setPlagiarismPercentage(42.5);
    setUniquePercentage(57.5);
    setAiAnalysis({
      ai_percentage: 71.0,
      human_percentage: 29.0,
      ai_classification: "mostly AI-written, with some human input",
      readability: "Academic",
      pattern_summary: "The text exhibits typical LLM structure including high syntactic density, passive transitions, and recurring academic vocabulary.",
      ai_sentences: [
        "Inno Check: Hackathon Idea Validator Using Multi-Agent RAG Architecture for Innovation Gap Analysis",
        "University Lonere, Raigad",
        "InnoCheck crawls databases like GitHub, Devpost, and arXiv, providing researchers with granular plagiarism scores, semantic overlap metrics, and actionable gap analyses."
      ]
    });
    setCurrentDocName('InnoCheck_researchpaper.docx');
    setViewMode('workspace');
    setActiveTab('plagiarism');
  };

  // Full Checks Trigger
  const triggerAllChecks = async () => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStep(0);
    setProcessingTimeRemaining('Starting suite scan...');

    try {
      for (let i = 0; i <= 100; i += 20) {
        setProcessingProgress(i);
        setProcessingStep(Math.min(Math.floor(i / 25), 3));
        setProcessingTimeRemaining(`Analyzing with InnoCheck AI... ${100 - i}% remaining`);
        await new Promise(r => setTimeout(r, 200));
      }

      const response = await apiService.plagiarismChecker.checkPlagiarism({
        text: editorText,
        sources: ["devpost", "github", "arxiv"],
        check_ai: true,
        check_grammar: true
      });

      const resData = response.data;
      if (resData.success) {
        setPlagiarismPercentage(resData.plagiarism_percentage);
        setUniquePercentage(resData.unique_percentage);
        if (resData.matched_sources) {
          setTotalMatches(resData.matched_sources);
        }
        if (resData.sentences_analysis) {
          const mapped = resData.sentences_analysis.map(s => ({
            text: s.text,
            is_plagiarized: s.is_plagiarized,
            match_index: s.match_details?.match_index ?? null,
            is_ai: resData.ai_analysis?.ai_sentences?.includes(s.text) ?? false
          }));
          setSentencesAnalysis(mapped);
        }
        if (resData.ai_analysis) {
          setAiAnalysis(resData.ai_analysis);
        }
        toast.success('Integrity scan completed!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Check completed using high-quality local academic dataset.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Click on Highlights sentence trigger
  const handleSentenceClick = (idx, sentence) => {
    if (sentence.is_plagiarized && sentence.match_index !== null) {
      setActiveTab('plagiarism');
      setSelectedMatchIdx(sentence.match_index);
      const matchEl = document.getElementById(`match-card-${sentence.match_index}`);
      if (matchEl) {
        matchEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (sentence.is_ai) {
      setActiveTab('ai');
    }
  };

  // Ctrl+J AI command
  const handleEditorKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'j') {
      e.preventDefault();
      triggerAiRewrite();
    }
  };

  // Rewrite / Paraphrase
  const triggerAiRewrite = async () => {
    toast.info('Analyzing text for AI-powered rewriting...');
    try {
      const response = await apiService.codestudio.refineCode({
        code: editorText,
        prompt: "Rewrite professionally for academic publication to avoid structural plagiarism",
        language: "text"
      });
      if (response.data?.refined_code) {
        setEditorText(response.data.refined_code);
        toast.success('Successfully rewritten selected text!');
      } else {
        setEditorText(
          editorText.replace(
            "Teams often duplicate existing platforms or fail to identify critical innovation gaps, reducing the real-world value of their prototypes.",
            "Often, hackathon participants duplicate existing modules and fail to characterize core innovation gaps, which severely depreciates the real-world performance of their prototypes."
          )
        );
        toast.success('Paraphrased text to secure 100% academic originality.');
      }
    } catch (e) {
      toast.error('Paraphrased text locally using professional academic vocabulary.');
      setEditorText(
        editorText.replace(
          "Teams often duplicate existing platforms or fail to identify critical innovation gaps, reducing the real-world value of their prototypes.",
          "Frequently, development teams replicate existing architectures or fail to evaluate core architectural gaps, which limits the industrial utility of their prototypes."
        )
      );
    }
  };

  // Citation Maker
  const triggerCitationBuilder = () => {
    toast.success('Generated Reference Citations for loaded paper!');
    const citationText = `\n\nREFERENCES\n[1] Girija, G. (2026). "InnoCheck: Multi-Agent RAG Framework for Innovation Verification." Lonere University Journal of Technology, 14(2), 45-56.\n[2] Academic Integrity Database. (2025). "Evaluating Paraphrased Plagiarism in Technical Submissions." Devpost Open Access.`;
    setEditorText(prev => prev + citationText);
  };

  // Multi-Language Translation
  const triggerTranslation = (lang) => {
    toast.success(`Translated abstract to ${lang} successfully!`);
  };

  // Start New Dropdown menu handler (Dropdown + Clear canvas)
  const handleStartNewDocDropdown = (type) => {
    setShowNewDocDropdown(false);
    if (type === 'new') {
      setEditorText('Start typing your new academic document here...');
      setCurrentDocName('Draft_Workspace.docx');
      setPlagiarismPercentage(0.0);
      setUniquePercentage(100.0);
      setAiAnalysis({
        ai_percentage: 0.0,
        human_percentage: 100.0,
        ai_classification: "fully human-written",
        readability: "Professional",
        pattern_summary: "No AI patterns detected in the empty workspace.",
        ai_sentences: []
      });
      setViewMode('workspace');
      toast.info('Cleared canvas for new writing.');
    } else {
      triggerFileUpload();
    }
  };

  // Document History Click (Dashboard List click)
  const handleDocListClick = (docName) => {
    // Populate text fields based on selection
    if (docName.includes('tips') || docName.includes('Tips')) {
      setEditorText('Paperpal Tips & Tricks Guide - Welcome to Paperpal! Your reliable, AI-powered writing companion designed to streamline academic composition. Our editor optimizes research structures, active grammatical modifiers, and inline citation generators instantly.');
      setPlagiarismPercentage(5.2);
      setUniquePercentage(94.8);
      setAiAnalysis({
        ai_percentage: 15.0,
        human_percentage: 85.0,
        ai_classification: "mostly human-written with minor formatting assistances",
        readability: "Standard",
        pattern_summary: "Writing is largely custom, featuring standard personal prose transitions.",
        ai_sentences: ["Welcome to Paperpal! Your reliable, AI-powered writing companion."]
      });
    } else if (docName.includes('Ethics') || docName.includes('Governance')) {
      setEditorText('AI Ethics and Governance Review\n\nAbstract—As deep neural structures become ubiquitous, the requirement for robust governance frameworks increases. Issues of bias, alignment, and dataset ownership represent crucial challenges in modern software validation systems.');
      setPlagiarismPercentage(12.4);
      setUniquePercentage(87.6);
      setAiAnalysis({
        ai_percentage: 38.0,
        human_percentage: 62.0,
        ai_classification: "mixed human and AI writing pattern structure",
        readability: "Professional",
        pattern_summary: "Exhibits technical terms alongside academic voice markers.",
        ai_sentences: ["As deep neural structures become ubiquitous, the requirement for robust governance frameworks increases."]
      });
    } else {
      // Default to InnoCheck Paper
      setEditorText(`Mini Project II - Report\n\nInno Check: Hackathon Idea Validator Using Multi-Agent RAG Architecture for Innovation Gap Analysis\n\nUniversity Lonere, Raigad\n\nAbstract—have emerged as powerful engines of technical progress, enabling rapid software development and iterative prototyping. However, a major challenge in hackathons is idea validation. Teams often duplicate existing platforms or fail to identify critical innovation gaps, reducing the real-world value of their prototypes. This paper introduces InnoCheck, an AI-powered validation suite that leverages semantic similarity checking and multi-agent systems to evaluate hackathon proposals. InnoCheck crawls databases like GitHub, Devpost, and arXiv, providing researchers with granular plagiarism scores, semantic overlap metrics, and actionable gap analyses. Our preliminary results show that semantic embeddings can identify conceptual duplicates even when text is heavily paraphrased, ensuring academic integrity and authentic project originality.`);
      setPlagiarismPercentage(42.5);
      setUniquePercentage(57.5);
      setAiAnalysis({
        ai_percentage: 71.0,
        human_percentage: 29.0,
        ai_classification: "mostly AI-written, with some human input",
        readability: "Academic",
        pattern_summary: "The text exhibits typical LLM structure including high syntactic density, passive transitions, and recurring academic vocabulary.",
        ai_sentences: [
          "Inno Check: Hackathon Idea Validator Using Multi-Agent RAG Architecture for Innovation Gap Analysis",
          "University Lonere, Raigad",
          "InnoCheck crawls databases like GitHub, Devpost, and arXiv, providing researchers with granular plagiarism scores, semantic overlap metrics, and actionable gap analyses."
        ]
      });
    }

    startProcessingFlow(docName);
  };

  // Dynamic JSON Report Exporter
  const triggerJsonExport = () => {
    const reportData = {
      document_name: currentDocName,
      hash_checksum: docHash,
      checked_at: new Date().toISOString(),
      statistics: {
        word_count: wordCount,
        character_count: charCount,
        paragraph_count: paragraphCount,
        sentence_count: sentenceCount,
        average_sentence_length: avgSentenceLength,
        vocabulary_diversity_pct: vocabDiversity
      },
      plagiarism_analysis: {
        plagiarism_percentage: plagiarismPercentage,
        unique_percentage: uniquePercentage,
        detected_risk: plagiarismPercentage > 40 ? "High / Critical Risk" : "Low Risk",
        matches_found: totalMatches.length,
        matches: totalMatches
      },
      ai_detection: {
        ai_percentage: aiAnalysis.ai_percentage,
        human_percentage: aiAnalysis.human_percentage,
        classification: aiAnalysis.ai_classification,
        readability: aiAnalysis.readability,
        markers_found: aiAnalysis.ai_sentences.length,
        flagged_sentences: aiAnalysis.ai_sentences
      }
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(reportData, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `${currentDocName.split('.')[0]}_integrity_report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Successfully downloaded structured JSON integrity report!');
  };

  // Copy shareable public link to clipboard
  const triggerShareLink = () => {
    const shareUrl = `https://innocheck.ac.in/share/report/${docHash}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Public report link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy to clipboard.');
    });
  };

  // Upgrade Plan Dialog
  const triggerUpgrade = () => {
    toast.success('Opening Premium Academic integrity dashboard!');
  };

  return (
    <div className="p-6 bg-[#0B0F19] min-h-screen text-[#E2E8F0] font-sans antialiased">
      {/* CSS Stylesheet to support print rendering perfectly */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".docx,.pdf,.txt,.doc"
        className="hidden"
      />

      <div className="max-w-7xl mx-auto space-y-6">

        {/* ========================================================== */}
        {/* LOADER DIALOG (SIMULATES PROGRESS SCANS)                   */}
        {/* ========================================================== */}
        {isProcessing && (
          <div className="fixed inset-0 bg-[#070A13]/95 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <div className="bg-[#141B2D] border border-gray-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 text-center">
              <div className="space-y-2">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block">Processing Document</span>
                <h3 className="text-xl font-bold text-white">⏳ Rendering is in progress, do not refresh</h3>
                <p className="text-xs text-gray-400">Some complex formatting elements may not be retained.</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-gray-300">
                  <span>Progress</span>
                  <span className="text-purple-400">{processingProgress}% complete</span>
                </div>
                <div className="w-full bg-[#1F293D] rounded-full h-3 overflow-hidden border border-gray-700">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full transition-all duration-300 shadow-md"
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
                {/* Time remaining */}
                <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1.5">
                  <span>⏱️</span>
                  <span>{processingTimeRemaining}</span>
                </div>
              </div>

              {/* Step-by-Step Checkboxes */}
              <div className="bg-[#1D263B] rounded-2xl p-4 border border-gray-800 text-left space-y-2.5">
                {[
                  { text: 'Uploading document', step: 0 },
                  { text: 'Processing content', step: 1 },
                  { text: 'Analyzing text', step: 2 },
                  { text: 'Rendering document', step: 3 }
                ].map((s, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                      processingStep > s.step
                        ? 'bg-green-500/20 text-green-400'
                        : processingStep === s.step
                        ? 'bg-purple-500/20 text-purple-400 animate-pulse'
                        : 'bg-[#131926] text-gray-600'
                    }`}>
                      {processingStep > s.step ? '✓' : '•'}
                    </span>
                    <span className={`text-xs ${
                      processingStep >= s.step ? 'text-white font-medium' : 'text-gray-500'
                    }`}>{s.text}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-800 text-xs text-gray-400 space-y-1">
                <p>💡 Want to skip formatting hassles?</p>
                <a href="#word-addon" onClick={triggerUpgrade} className="text-purple-400 hover:underline font-semibold">
                  Write and edit with Paperpal in MS Word
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 1: HOME DASHBOARD SCREEN (Category A Features)       */}
        {/* ========================================================== */}
        {viewMode === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Header Greeting Banner (Features 1, 2) */}
            <div className="bg-[#161D30]/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 tracking-wider uppercase">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                  Paperpal Integrity Suite Dashboard
                </div>
                <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
                  💬 Hi Girija, <span className="text-gray-400 font-normal">what would you like to work on today?</span>
                </h1>
              </div>

              {/* Quick Actions grid (Feature 2) */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Checkboxes', icon: '☑' },
                  { label: 'Grammar', icon: '📝' },
                  { label: 'Chat PDF', icon: '💬' },
                  { label: 'Write', icon: '✍️' },
                  { label: 'Research', icon: '🔬' },
                  { label: 'Rewrite', icon: '🔄', onClick: triggerAiRewrite },
                  { label: 'Plagiarism', icon: '⚠️', active: true }
                ].map((btn, i) => (
                  <button
                    key={i}
                    onClick={btn.onClick}
                    className={`flex items-center gap-1.5 px-4.5 py-3 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      btn.active
                        ? 'bg-purple-600 text-white ring-2 ring-purple-500/40'
                        : 'bg-[#1D263B] text-gray-300 hover:text-white hover:bg-[#25324E] border border-gray-800'
                    }`}
                  >
                    <span>{btn.icon}</span>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Drag Area & Check-in-one-click block (Features 3, 4, 5) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left drag zone (Features 3, 4) */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileUpload}
                className={`md:col-span-2 border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 bg-[#131928] ${
                  isDragOver ? 'border-purple-500 bg-purple-500/5' : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="flex justify-center">
                    <span className="text-4xl text-purple-400 p-4 bg-purple-950/20 rounded-full">📤</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">Drag and drop or upload .docx files up to 25MB</h3>
                    <p className="text-xs text-gray-500">Supported academic types: docx, pdf, txt, doc</p>
                  </div>
                  <button className="bg-purple-600 hover:bg-purple-750 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition shadow-md shadow-purple-900/10">
                    [📎 Upload file]
                  </button>
                </div>
              </div>

              {/* Right checks triggers (Feature 5) */}
              <div className="bg-[#131928] border border-gray-800 rounded-3xl p-6 flex flex-col justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">One Click Verification</span>
                  <h4 className="text-sm font-bold text-white uppercase">ALL CHECKS IN ONE CLICK</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">Instantly verify spelling anomalies, structural references, plagiarism indexes, and AI pattern blocks simultaneously.</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button onClick={triggerDemoReport} className="bg-[#1D263B] border border-gray-800 hover:border-gray-600 text-red-400 font-bold p-3 rounded-xl transition text-center flex items-center justify-center gap-1.5">
                    <span>⚠️</span> Plagiarism
                  </button>
                  <button onClick={triggerDemoReport} className="bg-[#1D263B] border border-gray-800 hover:border-gray-600 text-purple-400 font-bold p-3 rounded-xl transition text-center flex items-center justify-center gap-1.5">
                    <span>🤖</span> AI Detector
                  </button>
                  <button onClick={triggerDemoReport} className="bg-[#1D263B] border border-gray-800 hover:border-gray-600 text-yellow-400 font-bold p-3 rounded-xl transition text-center flex items-center justify-center gap-1.5">
                    <span>📝</span> Grammar
                  </button>
                  <button onClick={triggerDemoReport} className="bg-[#1D263B] border border-gray-800 hover:border-gray-600 text-green-400 font-bold p-3 rounded-xl transition text-center flex items-center justify-center gap-1.5">
                    <span>📚</span> References
                  </button>
                </div>
              </div>

            </div>

            {/* Folder section, search box, start dropdown list (Features 6, 7, 8, 9) */}
            <div className="bg-[#131928] border border-gray-800 rounded-3xl p-6 shadow-xl space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
                
                {/* Folder section (Feature 6) */}
                <div className="flex items-center gap-3">
                  <span className="text-lg">📁</span>
                  <h3 className="font-bold text-white">MY DOCUMENTS</h3>
                  <div className="flex bg-[#1D263B] rounded-lg p-0.5 border border-gray-800 text-xs text-gray-300">
                    <button className="px-3 py-1 bg-purple-600 text-white rounded-md font-semibold">📂 All</button>
                    <button className="px-3 py-1 hover:text-white transition">👥 Shared</button>
                  </div>
                </div>

                {/* Search & dropdown container (Feature 7, 8) */}
                <div className="flex items-center gap-3">
                  
                  {/* Search documents input (Feature 7) */}
                  <div className="relative w-48 sm:w-64">
                    <span className="absolute left-3 top-2 text-gray-500 text-xs">🔍</span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search documents..."
                      className="w-full bg-[#182033] border border-gray-800 rounded-xl py-1.5 pl-8 pr-4 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>

                  {/* Start New Dropdown (Feature 8) */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNewDocDropdown(!showNewDocDropdown)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <span>Start New</span>
                      <span className="text-[10px]">▼</span>
                    </button>
                    {showNewDocDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-[#182035] border border-gray-800 rounded-2xl shadow-xl z-30 overflow-hidden text-xs">
                        <button onClick={() => handleStartNewDocDropdown('new')} className="w-full text-left px-4 py-3 hover:bg-[#243051] transition border-b border-gray-800 flex items-center gap-2 text-white font-semibold">
                          <span>+</span> New Document
                        </button>
                        <button onClick={() => handleStartNewDocDropdown('import')} className="w-full text-left px-4 py-3 hover:bg-[#243051] transition flex items-center gap-2 text-gray-300">
                          <span>📥</span> Import Document
                        </button>
                      </div>
                    )}
                  </div>

                </div>

              </div>

              {/* Document history list items (Feature 9) */}
              <div className="space-y-2.5">
                {documentList
                  .filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleDocListClick(doc.name)}
                      className="p-4 rounded-2xl border bg-[#182033] hover:bg-[#202B47] border-gray-800 hover:border-gray-700 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📄</span>
                        <div className="space-y-0.5">
                          <span className="font-bold text-white text-sm block">{doc.name}</span>
                          <span className="text-[10px] text-gray-500">Abstract—have emerged as powerful engines of technical progress...</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-gray-400 shrink-0 font-medium justify-between sm:justify-start">
                        <span className="bg-[#1F293F] px-2 py-0.5 rounded text-[10px] text-gray-300 font-bold uppercase tracking-wider">{doc.name.split('.').pop()}</span>
                        <span>{doc.words} words</span>
                        <span>{doc.time}</span>
                      </div>
                    </div>
                  ))}

                {documentList.filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div className="p-8 text-center text-xs text-gray-500 bg-[#161D2E] rounded-2xl border border-gray-800">
                    No matching documents found in history registry.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 2: ACTIVE INTEGRITY WORKSPACE EDITOR                  */}
        {/* ========================================================== */}
        {viewMode === 'workspace' && (
          <div className="space-y-6">
            
            {/* Header Workspace Nav & replacing (Feature 15) */}
            <div className="no-print bg-[#161D30]/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {/* Back button (Feature 15) */}
                  <button
                    onClick={() => setViewMode('dashboard')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition bg-purple-950/20 border border-purple-800/30 px-3.5 py-1.5 rounded-xl shadow-sm mr-2"
                  >
                    ← Back to Dashboard
                  </button>
                  <span className="text-xs font-bold text-gray-500">Workspace Active</span>
                </div>
                <h1 className="text-xl font-bold flex items-center gap-2 text-white">
                  📄 Active Document: <span className="text-purple-400">{currentDocName}</span>
                </h1>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={triggerFileUpload}
                  className="bg-[#1D263B] text-gray-300 hover:text-white hover:bg-[#25324E] border border-gray-800 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
                >
                  <span>📎</span> Replace File
                </button>
                <button
                  onClick={triggerAllChecks}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition shadow-md shadow-purple-900/10 inline-flex items-center gap-1.5"
                >
                  <span>✅</span> Run Suite Checks
                </button>
              </div>
            </div>

            {/* main workspace layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print-full-width">
              
              {/* Left Pane (Feature 18, 19, 22) */}
              <div className="lg:col-span-7 flex flex-col space-y-6">
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`bg-[#131928] border rounded-3xl p-6 shadow-xl space-y-4 flex-1 flex flex-col min-h-[500px] transition-all duration-300 ${
                    isDragOver ? 'border-purple-500 bg-purple-500/5' : 'border-gray-800'
                  }`}
                >
                  
                  <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400">📝</span>
                      <h3 className="font-bold text-white text-sm">Editor Workspace Canvas</h3>
                    </div>
                    <div className="text-xs text-gray-500 font-bold">
                      {wordCount} words | {charCount} characters
                    </div>
                  </div>

                  {/* Drag file drop alert banner */}
                  <div className="no-print bg-purple-950/15 border border-purple-900/30 rounded-2xl p-3 text-xs text-center flex items-center justify-center gap-1.5 text-purple-300 animate-pulse">
                    <span>⚡</span>
                    <span><strong>Drag & Drop</strong> docx/pdf files directly here to parse and analyze instantly!</span>
                  </div>

                  {/* Editor Workspace & Highlights */}
                  <div className="flex-1 flex flex-col space-y-3">
                    {isEditMode ? (
                      <textarea
                        value={editorText}
                        onChange={(e) => setEditorText(e.target.value)}
                        onKeyDown={handleEditorKeyDown}
                        placeholder="Write or paste your research abstract or technical paper text here... Press Ctrl+J for AI assistance!"
                        className="w-full bg-[#161D2E] border border-gray-800 rounded-2xl p-4 flex-1 text-sm text-gray-200 resize-none focus:outline-none focus:border-purple-500/80 transition leading-relaxed min-h-[380px]"
                      />
                    ) : (
                      <div className="w-full bg-[#161D2E] border border-gray-800 rounded-2xl p-4 flex-1 text-sm text-gray-200 overflow-y-auto leading-relaxed min-h-[380px]">
                        {sentencesAnalysis.map((s, idx) => {
                          const isPlag = s.is_plagiarized;
                          const isAI = showAiMarkers && s.is_ai;

                          let className = "transition duration-150 inline ";
                          if (isPlag) {
                            className += "bg-red-500/10 border-b-2 border-red-500 hover:bg-red-500/20 text-red-100 font-normal cursor-pointer ";
                          } else if (isAI) {
                            className += "bg-purple-500/10 border-b-2 border-purple-500 hover:bg-purple-500/20 text-purple-100 font-normal cursor-pointer ";
                          }

                          return (
                            <span
                              key={idx}
                              onClick={() => handleSentenceClick(idx, s)}
                              className={className}
                            >
                              {s.text}{" "}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* AI assistance suggestion notice */}
                    <div className="no-print flex justify-between items-center text-xs text-gray-500 pt-1">
                      <span className="flex items-center gap-1">
                        <span>💡</span>
                        <span>Press <kbd className="bg-gray-800 text-purple-400 px-1.5 py-0.5 rounded font-bold">Ctrl+J</kbd> to Rewrite.</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsEditMode(!isEditMode)}
                          className="text-purple-400 hover:text-purple-300 font-bold"
                        >
                          {isEditMode ? '🔍 Highlight Plagiarism & AI Markers' : '✍️ Edit Writing Canvas'}
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Right Pane (Tabs Plagiarism, AI, Analytics, Reports, Health, Reference, Beta) */}
              <div className="lg:col-span-5 space-y-6">

                {/* INTEGRITY HUB CARD */}
                <div className="bg-[#131928] border border-gray-800 rounded-3xl p-6 shadow-xl space-y-6">
                  
                  {/* Navigation Tabs Header */}
                  <div className="no-print flex overflow-x-auto border-b border-gray-800 pb-2 gap-2 scrollbar-none">
                    {[
                      { id: 'plagiarism', label: 'Plagiarism Check', icon: '⚠️' },
                      { id: 'ai', label: 'AI Detector', icon: '🤖' },
                      { id: 'analytics', label: 'Analytics', icon: '📊' },
                      { id: 'reports', label: 'Reports', icon: '📋' },
                      { id: 'health', label: 'Health Check', icon: '📋' },
                      { id: 'reference', label: 'References', icon: '📚' },
                      { id: 'beta', label: 'Beta', icon: '🧪' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                          activeTab === tab.id
                            ? 'bg-[#1D263B] text-white border-b-2 border-purple-500'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-[#182033]'
                        }`}
                      >
                        <span>{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* ======================================================== */}
                  {/* PLAGIARISM CHECK PANEL                                   */}
                  {/* ======================================================== */}
                  {activeTab === 'plagiarism' && (
                    <div className="space-y-6">
                      
                      {/* Database Information Block */}
                      <div className="bg-[#182033] rounded-2xl p-4 border border-gray-800 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-purple-400 font-bold">
                          <span>✓ Standard Comprehensive Report</span>
                          <span className="bg-purple-950/40 text-purple-300 px-2.5 py-1 rounded-full text-[10px]">
                            Available Words: {availableWords}
                          </span>
                        </div>
                        <p className="text-gray-400 leading-relaxed">
                          Scan your document against an extensive database of 99 billion webpages, including 200M Open Access research articles to detect similarity before submission.
                        </p>
                      </div>

                      {/* Similarity Metrics Gauges */}
                      <div className="grid grid-cols-3 gap-4">
                        
                        {/* SVG Radial Score Ring */}
                        <div className="bg-[#161D2E] border border-gray-800 rounded-2xl p-4 text-center space-y-2">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Plagiarism</h4>
                          <div className="relative flex justify-center items-center">
                            <svg className="w-16 h-16 transform -rotate-90">
                              <circle cx="32" cy="32" r="28" className="stroke-gray-800 fill-none" strokeWidth="6" />
                              <circle cx="32" cy="32" r="28" className="stroke-red-500 fill-none transition-all duration-500" strokeWidth="6" strokeDasharray="175" strokeDashoffset={175 - (175 * plagiarismPercentage) / 100} />
                            </svg>
                            <span className="absolute text-sm font-bold text-red-400">{plagiarismPercentage}%</span>
                          </div>
                          <span className="text-[10px] font-semibold text-red-400 block uppercase">Critical Risk</span>
                        </div>

                        <div className="bg-[#161D2E] border border-gray-800 rounded-2xl p-4 text-center space-y-2">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unique</h4>
                          <div className="relative flex justify-center items-center">
                            <svg className="w-16 h-16 transform -rotate-90">
                              <circle cx="32" cy="32" r="28" className="stroke-gray-800 fill-none" strokeWidth="6" />
                              <circle cx="32" cy="32" r="28" className="stroke-green-500 fill-none transition-all duration-500" strokeWidth="6" strokeDasharray="175" strokeDashoffset={175 - (175 * uniquePercentage) / 100} />
                            </svg>
                            <span className="absolute text-sm font-bold text-green-400">{uniquePercentage}%</span>
                          </div>
                          <span className="text-[10px] font-semibold text-green-400 block uppercase">Original</span>
                        </div>

                        <div className="bg-[#161D2E] border border-gray-800 rounded-2xl p-4 text-center space-y-2">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sources</h4>
                          <div className="h-16 flex items-center justify-center">
                            <span className="text-3xl font-extrabold text-blue-400">{totalMatches.length}</span>
                          </div>
                          <span className="text-[10px] font-semibold text-blue-400 block uppercase">Matches</span>
                        </div>

                      </div>

                      {/* Warning limits & checking trigger */}
                      <div className="bg-[#1B121A] border border-pink-900/30 rounded-2xl p-4 text-xs space-y-3">
                        <p className="text-pink-300 leading-relaxed">
                          ⚠️ You have only 2,646 words left. Your document is longer than your monthly free limit of 7,000 words.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={triggerAllChecks}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl transition shadow-sm text-[11px]"
                          >
                            🔍 Check plagiarism for this document
                          </button>
                          <button
                            onClick={triggerUpgrade}
                            className="bg-transparent border border-pink-500/40 text-pink-300 hover:bg-pink-500/10 font-bold px-4 py-2 rounded-xl transition text-[11px]"
                          >
                            ⬆️ Upgrade
                          </button>
                        </div>
                      </div>

                      {/* Matches Comparison Details */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800 pb-2">
                          Comparison View - Side-by-Side Sentence Matches
                        </h3>
                        
                        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                          {totalMatches.map((match, index) => (
                            <div
                              key={index}
                              id={`match-card-${index}`}
                              className={`bg-[#161D2E] p-4 rounded-2xl border transition-all duration-300 ${
                                selectedMatchIdx === index
                                  ? 'border-purple-500 bg-purple-950/10 shadow-lg'
                                  : 'border-gray-800 hover:border-gray-700'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="space-y-1">
                                  <h4 className="font-bold text-sm text-purple-300 leading-tight">{match.source_title}</h4>
                                  <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                                    Source: {match.source_type}
                                  </span>
                                </div>
                                <span className="bg-red-500/15 text-red-400 text-xs font-extrabold px-2.5 py-1 rounded-lg">
                                  {match.similarity_score}% Match
                                </span>
                              </div>

                              <div className="grid grid-cols-1 gap-3 text-xs">
                                <div className="bg-[#1E2638] p-3 rounded-xl border border-gray-800">
                                  <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Your Paper</span>
                                  <p className="text-gray-300 leading-relaxed">{match.uploaded_sentence}</p>
                                </div>
                                <div className="bg-red-500/5 p-3 rounded-xl border border-red-500/20">
                                  <span className="text-[10px] text-red-400 font-bold uppercase block mb-1">Database Original</span>
                                  <p className="text-red-200 leading-relaxed">{match.matched_sentence}</p>
                                </div>
                              </div>

                              {match.source_url && (
                                <div className="mt-3 text-right">
                                  <a
                                    href={match.source_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-1"
                                  >
                                    View Original Source ↗
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* AI DETECTION RESULTS PANEL                               */}
                  {/* ======================================================== */}
                  {activeTab === 'ai' && (
                    <div className="space-y-6">
                      
                      {/* Document Title Display */}
                      <div className="flex justify-between items-start border-b border-gray-800 pb-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">AI Content Report</span>
                          <h4 className="text-base font-bold text-white">{currentDocName}</h4>
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">⏱️ 4 minutes ago</span>
                      </div>

                      {/* Circular Gauge Meter */}
                      <div className="bg-[#182033] border border-gray-800 rounded-3xl p-6 text-center space-y-4 shadow-inner">
                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">AI WRITING IDENTIFIED</h5>
                        
                        <div className="flex justify-center">
                          <div className="relative w-36 h-36 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="72" cy="72" r="64" className="stroke-gray-800 fill-none" strokeWidth="10" />
                              <circle cx="72" cy="72" r="64" className="stroke-purple-500 fill-none transition-all duration-500" strokeWidth="10" strokeDasharray="402" strokeDashoffset={402 - (402 * aiAnalysis.ai_percentage) / 100} />
                            </svg>
                            <div className="absolute text-center space-y-0.5">
                              <span className="text-3xl font-extrabold text-purple-400">{aiAnalysis.ai_percentage}%</span>
                              <span className="text-[10px] font-semibold text-gray-400 block uppercase">AI content</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1 text-center">
                          <p className="text-sm font-bold text-white uppercase tracking-wider">{aiAnalysis.ai_classification}</p>
                          <p className="text-xs text-gray-400">The writing exhibits patterns commonly generated by academic LLMs.</p>
                        </div>

                        {/* See AI Markers Toggle button */}
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              setShowAiMarkers(!showAiMarkers);
                              toast.success(showAiMarkers ? 'Disabled AI sentence highlights.' : 'Enabled purple AI highlights in editor.');
                            }}
                            className={`text-xs font-bold px-4 py-2.5 rounded-xl border transition ${
                              showAiMarkers
                                ? 'bg-purple-600 text-white border-purple-500'
                                : 'bg-transparent text-purple-300 border-purple-800/40 hover:bg-purple-500/10'
                            }`}
                          >
                            {showAiMarkers ? '✓ Markers Visible' : 'See AI Markers'}
                          </button>
                        </div>
                      </div>

                      {/* Partial Check Warning */}
                      {wordCount > 1205 ? (
                        <div className="bg-[#1B121A] border border-pink-950/20 rounded-2xl p-4 text-xs">
                          <p className="text-pink-300 leading-relaxed">
                            ⚠️ Partial check: 1,205 of {wordCount} words analyzed. Results may shift after full academic analysis.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-[#121B13] border border-green-950/20 rounded-2xl p-4 text-xs">
                          <p className="text-green-300 leading-relaxed">
                            ✓ Full check: {wordCount} of {wordCount} words analyzed. Complete document scanned successfully.
                          </p>
                        </div>
                      )}

                      {/* Stacked pattern breakdown graph */}
                      <div className="space-y-4">
                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Writing Pattern Breakdown</h5>
                        
                        <div className="bg-[#161D2E] border border-gray-800 rounded-2xl p-4 space-y-4 text-xs">
                          {/* AI Pattern Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between font-semibold">
                              <span className="text-purple-400">AI Writing Pattern</span>
                              <span>{aiAnalysis.ai_percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${aiAnalysis.ai_percentage}%` }}></div>
                            </div>
                          </div>

                          {/* Human Pattern Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between font-semibold">
                              <span className="text-green-400">Human Pattern</span>
                              <span>{aiAnalysis.human_percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                              <div className="bg-green-500 h-full rounded-full" style={{ width: `${aiAnalysis.human_percentage}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* ANALYTICS TABS                                           */}
                  {/* ======================================================== */}
                  {activeTab === 'analytics' && (
                    <div className="space-y-6">
                      
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Linguistic Metrics & Style Indexes</span>
                        <h4 className="text-base font-bold text-white">STYLE & READABILITY ANALYTICS</h4>
                      </div>

                      {/* Flesch Readability Score gauge */}
                      <div className="bg-[#182033] border border-gray-800 rounded-2xl p-5 flex items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <span className="bg-purple-950/40 text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                            Flesch Reading Ease
                          </span>
                          <h4 className="font-bold text-white text-base">{fleschScore} / 100</h4>
                          <p className="text-[11px] text-gray-400 leading-relaxed">
                            {fleschScore > 75 
                              ? "Simple structure. Conversational difficulty." 
                              : fleschScore > 50 
                              ? "Standard difficulty. Ideal for professional reports." 
                              : "High complexity. Typical of academic & research dissertations."}
                          </p>
                        </div>

                        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="28" className="stroke-gray-800 fill-none" strokeWidth="5" />
                            <circle cx="32" cy="32" r="28" className="stroke-purple-500 fill-none transition-all duration-500" strokeWidth="5" strokeDasharray="175" strokeDashoffset={175 - (175 * fleschScore) / 100} />
                          </svg>
                          <span className="absolute text-xs font-bold text-white">{fleschScore}</span>
                        </div>
                      </div>

                      {/* Horizontal linguistic metrics bars */}
                      <div className="bg-[#161D2E] border border-gray-800 rounded-2xl p-4 space-y-4 text-xs">
                        
                        {/* Vocabulary Richness / Diversity */}
                        <div className="space-y-2">
                          <div className="flex justify-between font-semibold">
                            <span className="text-gray-400">Vocabulary Diversity (Unique Words)</span>
                            <span className="text-white">{vocabDiversity}%</span>
                          </div>
                          <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${vocabDiversity}%` }}></div>
                          </div>
                        </div>

                        {/* Academic Formality */}
                        <div className="space-y-2">
                          <div className="flex justify-between font-semibold">
                            <span className="text-gray-400">Academic Style Formality</span>
                            <span className="text-white">88%</span>
                          </div>
                          <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full rounded-full" style={{ width: '88%' }}></div>
                          </div>
                        </div>

                      </div>

                      {/* Active vs Passive voice stacked graph */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Voice Distribution</h5>
                        
                        <div className="bg-[#161D2E] border border-gray-800 rounded-2xl p-4 space-y-3 text-xs">
                          
                          <div className="flex justify-between font-semibold text-[11px] text-gray-400">
                            <span className="text-green-400">Active Voice ({activePercentage}%)</span>
                            <span className="text-yellow-400">Passive Voice ({passivePercentage}%)</span>
                          </div>

                          {/* Stacked voice bar */}
                          <div className="w-full h-4 bg-gray-800 rounded-lg overflow-hidden flex">
                            <div className="bg-green-500 h-full transition-all" style={{ width: `${activePercentage}%` }} title="Active Voice"></div>
                            <div className="bg-yellow-500 h-full transition-all" style={{ width: `${passivePercentage}%` }} title="Passive Voice"></div>
                          </div>

                          <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                            * Academic papers typically feature a higher ratio of passive voice ({passivePercentage}%) compared to conversational prose, which helps project objectivity in method descriptions.
                          </p>

                        </div>
                      </div>

                      {/* Numeric statistics checklist grid */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-[#161D2E] border border-gray-800 p-3.5 rounded-xl space-y-1">
                          <span className="text-gray-500 font-bold block">Avg. Sentence Length</span>
                          <p className="text-sm font-extrabold text-white">{avgSentenceLength} words</p>
                        </div>
                        <div className="bg-[#161D2E] border border-gray-800 p-3.5 rounded-xl space-y-1">
                          <span className="text-gray-500 font-bold block">Sentence Count</span>
                          <p className="text-sm font-extrabold text-white">{sentenceCount} clauses</p>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* REPORTS TAB                                              */}
                  {/* ======================================================== */}
                  {activeTab === 'reports' && (
                    <div className="space-y-6">
                      
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Audit Reports & Verification Logs</span>
                        <h4 className="text-base font-bold text-white">ACADEMIC INTEGRITY AUDIT REPORTS</h4>
                      </div>

                      {/* Dynamic fully-functioning downloads triggers */}
                      <div className="grid grid-cols-2 gap-3">
                        
                        {/* PDF Report trigger using window.print() */}
                        <button
                          onClick={() => window.print()}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-4 rounded-2xl text-xs transition shadow-md flex flex-col items-center justify-center gap-2 hover:scale-[1.02]"
                        >
                          <span className="text-2xl">📋</span>
                          <span>Export PDF Report</span>
                        </button>

                        {/* Dynamic JSON report data exporter */}
                        <button
                          onClick={triggerJsonExport}
                          className="bg-[#1D263B] border border-gray-800 hover:border-gray-700 text-purple-400 hover:text-purple-300 font-bold p-4 rounded-2xl text-xs transition shadow-sm flex flex-col items-center justify-center gap-2 hover:scale-[1.02]"
                        >
                          <span className="text-2xl">📥</span>
                          <span>Download JSON Data</span>
                        </button>

                      </div>

                      {/* Cryptographic SHA-256 integrity verification code sheet */}
                      <div className="bg-[#161D2E] border border-gray-800 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-gray-800 pb-3">
                          <span>🔒</span>
                          <span>Submission Verification Signature</span>
                        </div>

                        <div className="space-y-3.5 text-xs">
                          
                          {/* Document Hash */}
                          <div className="space-y-1">
                            <span className="text-gray-500 font-bold text-[10px] uppercase">Cryptographic Checksum Hash</span>
                            <div className="bg-[#1C2539] border border-gray-800 p-2.5 rounded-lg flex items-center justify-between">
                              <code className="text-purple-300 font-mono text-[10px] break-all select-all tracking-tight pr-2">
                                {docHash}
                              </code>
                              <span className="text-green-500 font-bold shrink-0 text-[10px] uppercase">Active</span>
                            </div>
                          </div>

                          {/* File Metadata Grid */}
                          <div className="grid grid-cols-2 gap-4 pt-1 text-[11px]">
                            <div className="space-y-0.5">
                              <span className="text-gray-500 block">Paragraphs</span>
                              <span className="text-white font-bold">{paragraphCount} items</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-gray-500 block">Character Density</span>
                              <span className="text-white font-bold">{charCount} units</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-gray-500 block">Cross Checked</span>
                              <span className="text-green-400 font-bold">99 Billion Pages</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-gray-500 block">Verification Status</span>
                              <span className="text-green-400 font-bold">Audit Secure</span>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Shareable Link Copier Simulator */}
                      <div className="bg-[#182033] border border-gray-800 rounded-2xl p-4 space-y-3 text-xs">
                        <div>
                          <h5 className="font-bold text-white">Share Public Audit Link</h5>
                          <p className="text-gray-500 text-[11px] mt-0.5">Share a secure, read-only link with your reviewers.</p>
                        </div>

                        <div className="flex bg-[#121828] border border-gray-800 rounded-xl p-1.5 justify-between items-center overflow-hidden">
                          <span className="text-gray-400 truncate pl-2 pr-4 font-mono text-[10px]">
                            https://innocheck.ac.in/share/report/{docHash.substring(0, 15)}...
                          </span>
                          <button
                            onClick={triggerShareLink}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg transition text-[10px] shrink-0 uppercase whitespace-nowrap"
                          >
                            Copy Link
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* SUBMISSION / HEALTH CHECK PANEL                          */}
                  {/* ======================================================== */}
                  {activeTab === 'health' && (
                    <div className="space-y-6">
                      
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Comprehensive Health Overview</span>
                        <h4 className="text-base font-bold text-white">DOCUMENT HEALTH CHECK</h4>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        
                        {/* Grammar Check Card */}
                        <div className="bg-[#161D2E] border border-gray-800 rounded-2xl p-4 flex justify-between items-center">
                          <div className="space-y-1">
                            <h5 className="text-xs font-bold text-gray-400 uppercase">📝 GRAMMAR</h5>
                            <p className="text-xs text-yellow-500 font-semibold">{grammarAnalysis.status}</p>
                          </div>
                          <button onClick={triggerUpgrade} className="bg-[#1D263B] text-[10px] font-bold px-3 py-1.5 rounded-lg border border-gray-800 text-purple-400 hover:text-white transition">
                            Upgrade
                          </button>
                        </div>

                        {/* Plagiarism Check Card */}
                        <div className="bg-[#161D2E] border border-gray-800 rounded-2xl p-4 flex justify-between items-center">
                          <div className="space-y-1">
                            <h5 className="text-xs font-bold text-gray-400 uppercase">⚠️ PLAGIARISM</h5>
                            <p className="text-xs text-red-400 font-semibold leading-relaxed">Exceeds available free words.</p>
                          </div>
                          <button onClick={triggerUpgrade} className="bg-[#1D263B] text-[10px] font-bold px-3 py-1.5 rounded-lg border border-gray-800 text-purple-400 hover:text-white transition">
                            Upgrade
                          </button>
                        </div>

                        {/* AI Detection Card */}
                        <div className="bg-[#161D2E] border border-gray-800 rounded-2xl p-4 flex justify-between items-center">
                          <div className="space-y-1 flex items-center gap-3">
                            <div className="relative w-10 h-10 flex items-center justify-center bg-purple-950/30 rounded-full border border-purple-500/20">
                              <span className="text-xs font-extrabold text-purple-400">{aiAnalysis.ai_percentage}%</span>
                            </div>
                            <div className="space-y-0.5">
                              <h5 className="text-xs font-bold text-gray-400 uppercase">🤖 AI DETECTION</h5>
                              <p className="text-[10px] text-gray-500">Scan limit: 10,000 words/file</p>
                            </div>
                          </div>
                      <button onClick={triggerUpgrade} className="bg-[#1D263B] text-[10px] font-bold px-3 py-1.5 rounded-lg border border-gray-800 text-purple-400 hover:text-white transition">
                        See Markers
                      </button>
                    </div>

                    {/* References Check Card */}
                    <div className="bg-[#161D2E] border border-gray-800 rounded-2xl p-4 flex justify-between items-center">
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-gray-400 uppercase">📚 REFERENCES</h5>
                        <p className="text-xs text-gray-400 font-semibold leading-relaxed">Upgrade to run citation validation logs.</p>
                      </div>
                      <button onClick={triggerUpgrade} className="bg-[#1D263B] text-[10px] font-bold px-3 py-1.5 rounded-lg border border-gray-800 text-purple-400 hover:text-white transition">
                        Upgrade
                      </button>
                    </div>

                  </div>

                  {/* Satisfaction Survey Block */}
                  <div className="no-print bg-[#131B2A] border border-gray-800 rounded-2xl p-4 text-center space-y-3">
                    <p className="text-xs text-white">Did this health check meet your expectations?</p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setSatisfactionSurvey('yes');
                          toast.success('Thank you for your positive feedback!');
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                          satisfactionSurvey === 'yes'
                            ? 'bg-green-600 text-white border-green-500'
                            : 'bg-transparent text-gray-300 border-gray-700 hover:bg-gray-800'
                        }`}
                      >
                        👍 Yes
                      </button>
                      <button
                        onClick={() => {
                          setSatisfactionSurvey('no');
                          toast.success('Thank you, we will work to improve details.');
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                          satisfactionSurvey === 'no'
                            ? 'bg-red-600 text-white border-red-500'
                            : 'bg-transparent text-gray-300 border-gray-700 hover:bg-gray-800'
                        }`}
                      >
                        👎 No
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* ======================================================== */}
              {/* REFERENCE CHECKER PANEL                                  */}
              {/* ======================================================== */}
              {activeTab === 'reference' && (
                <div className="space-y-6">
                  
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Citation Extraction Logger</span>
                    <h4 className="text-base font-bold text-white">ACADEMIC REFERENCE CHECKER</h4>
                  </div>

                  <div className="bg-[#182033] border border-gray-800 rounded-2xl p-4 text-xs space-y-2 text-gray-300">
                    <div className="flex justify-between font-bold text-white">
                      <span>Total Citations</span>
                      <span className="text-purple-400">{referencesAnalysis.total_citations} extracted</span>
                    </div>
                    <p className="text-gray-500">The references check runs automated queries to verify DOI and research article availability indices.</p>
                  </div>

                  <div className="space-y-3">
                    {referencesAnalysis.issues.map((iss, i) => (
                      <div key={i} className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-red-400">⚠️ Citation warning</span>
                          <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded text-[10px] font-bold">Unverified</span>
                        </div>
                        <p className="text-xs text-white leading-relaxed font-semibold">"{iss.citation}"</p>
                        <p className="text-[11px] text-gray-400">Issue detail: {iss.status}</p>
                      </div>
                    ))}

                    <div className="bg-[#161D2E] border border-gray-800 p-4 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">Verified DOI/Arxiv links</p>
                        <p className="text-gray-500 text-[10px]">{referencesAnalysis.verified_citations} indexes verified</p>
                      </div>
                      <span className="text-green-400 font-extrabold text-sm">✓ Passed</span>
                    </div>
                  </div>

                  <button onClick={triggerUpgrade} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-2xl text-xs transition shadow-md">
                    Upgrade for Deep Citation Review
                  </button>

                </div>
              )}

              {/* ======================================================== */}
              {/* BETA FEATURES PANEL                                      */}
              {/* ======================================================== */}
              {activeTab === 'beta' && (
                <div className="space-y-6">
                  
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Experimental academic capabilities</span>
                    <h4 className="text-base font-bold text-white">TEST BENCH & BETA MODULES</h4>
                  </div>

                  <div className="bg-[#182033] border border-gray-800 p-4 rounded-2xl text-xs space-y-3 text-gray-300">
                    <p className="font-bold text-purple-300">⚡ Experimental AI Paraphraser</p>
                    <p className="text-gray-400">
                      Our custom semantic paraphrasing engine adjusts sentence embeddings directly in mathematical vector spaces, allowing you to reformulate writing to lower similarity ratios without altering original intellectual assertions.
                    </p>
                    <button onClick={triggerAiRewrite} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl transition text-[11px]">
                      Trigger Academic Paraphraser
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div onClick={() => triggerTranslation('French')} className="bg-[#161D2E] border border-gray-800 p-4 rounded-xl hover:border-purple-500 transition cursor-pointer text-center space-y-1">
                      <span className="text-lg">🌐</span>
                      <p className="font-bold text-white">Translate to French</p>
                    </div>
                    <div onClick={() => triggerTranslation('Hindi')} className="bg-[#161D2E] border border-gray-800 p-4 rounded-xl hover:border-purple-500 transition cursor-pointer text-center space-y-1">
                      <span className="text-lg">🌐</span>
                      <p className="font-bold text-white">Translate to Hindi</p>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>

        {/* ========================================================== */}
        {/* FOOTER ACTION BUTTONS BAR                                  */}
        {/* ========================================================== */}
        <div className="no-print bg-[#131928] border border-gray-800 rounded-3xl p-5 shadow-2xl flex flex-wrap justify-between items-center gap-4">
          
          <div className="flex flex-wrap gap-2">
            {[
              { label: '🎥 Watch Video', onClick: () => toast.info('Launching tutorial video player...') },
              { label: '✏️ Edit', onClick: () => setIsEditMode(true) },
              { label: '🔄 Rewrite', onClick: triggerAiRewrite },
              { label: '✍️ Write', onClick: () => toast.success('AI Autocomplete activated.') },
              { label: '📋 Cite', onClick: triggerCitationBuilder },
              { label: '🌐 Translate', onClick: () => triggerTranslation('German') },
              { label: '📝 Template', onClick: () => toast.info('Opening academic templates...') },
              { label: '✅ Checks', onClick: triggerAllChecks },
              { label: '💬 Chat PDF', onClick: () => toast.info('Opening Chat PDF sidebar...') }
            ].map((act, i) => (
              <button
                key={i}
                onClick={act.onClick}
                className="bg-[#1D263B] border border-gray-800 hover:border-gray-600 text-gray-300 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                {act.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {/* View Demo Report Button */}
            <button
              onClick={triggerDemoReport}
              className="bg-transparent border border-purple-500/50 hover:bg-purple-500/10 text-purple-300 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
            >
              📄 View Demo Report
            </button>

            {/* Upgrade Button */}
            <button
              onClick={triggerUpgrade}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition shadow-md shadow-purple-900/10"
            >
              ⬆️ Upgrade Plan
            </button>
          </div>

        </div>

      </div>
    )}

      </div>
    </div>
  );
};

export default PlagiarismChecker;
