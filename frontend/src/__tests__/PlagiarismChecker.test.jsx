// frontend/src/__tests__/PlagiarismChecker.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import PlagiarismChecker from '../components/PlagiarismChecker';

// Mock API service using inline definitions for cross-runner compatibility
vi.mock('../services/api', () => ({
  __esModule: true,
  apiService: {
    plagiarismChecker: {
      checkPlagiarism: () => Promise.resolve({
        data: {
          success: true,
          plagiarism_percentage: 64.0,
          unique_percentage: 36.0,
          detected_risk: "High / Critical Risk",
          matched_sources: [],
          sentences_analysis: [],
          ai_analysis: {
            ai_percentage: 71.0,
            human_percentage: 29.0,
            ai_sentences: []
          }
        }
      })
    },
    codestudio: {
      refineCode: () => Promise.resolve({
        data: {
          refined_code: "Refined professional text sample."
        }
      })
    }
  },
  getErrorMessage: (err) => err.message || 'Error'
}));

jest.mock('../services/api', () => ({
  __esModule: true,
  apiService: {
    plagiarismChecker: {
      checkPlagiarism: () => Promise.resolve({
        data: {
          success: true,
          plagiarism_percentage: 64.0,
          unique_percentage: 36.0,
          detected_risk: "High / Critical Risk",
          matched_sources: [],
          sentences_analysis: [],
          ai_analysis: {
            ai_percentage: 71.0,
            human_percentage: 29.0,
            ai_sentences: []
          }
        }
      })
    },
    codestudio: {
      refineCode: () => Promise.resolve({
        data: {
          refined_code: "Refined professional text sample."
        }
      })
    }
  },
  getErrorMessage: (err) => err.message || 'Error'
}));

// Mock toast with proper default export
vi.mock('../services/toast', () => ({
  __esModule: true,
  default: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn()
  }
}));

jest.mock('../services/toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn()
  }
}));

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('PlagiarismChecker Component Tests', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders plagiarism checker interface correctly in dashboard mode', () => {
    renderWithRouter(<PlagiarismChecker />);
    
    expect(screen.getByText(/Integrity Suite Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Detector/i)).toBeInTheDocument();
  });

  test('shows file upload option drag drop zone', () => {
    renderWithRouter(<PlagiarismChecker />);
    
    expect(screen.getByText(/Drag and drop or upload .docx files/i)).toBeInTheDocument();
  });

  test('editor workspace renders correctly when demo is loaded', () => {
    renderWithRouter(<PlagiarismChecker />);
    
    // Switch to workspace by clicking AI Detector button in dashboard mode which triggers demo report
    const demoButton = screen.getByText(/AI Detector/i);
    fireEvent.click(demoButton);

    expect(screen.getByPlaceholderText(/Write or paste your research/i)).toBeInTheDocument();
    expect(screen.getByText(/Run Suite Checks/i)).toBeInTheDocument();
  });

  test('run suite button is enabled when text is provided in workspace editor', async () => {
    renderWithRouter(<PlagiarismChecker />);
    
    const demoButton = screen.getByText(/AI Detector/i);
    fireEvent.click(demoButton);

    const textarea = screen.getByPlaceholderText(/Write or paste your research/i);
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'This is a sample text for plagiarism check');
    
    const checkButton = screen.getByText(/Run Suite Checks/i);
    expect(checkButton).not.toBeDisabled();
  });

  test('shows loading progress overlay state while checking', async () => {
    renderWithRouter(<PlagiarismChecker />);
    
    const demoButton = screen.getByText(/AI Detector/i);
    fireEvent.click(demoButton);

    const checkButton = screen.getByText(/Run Suite Checks/i);
    fireEvent.click(checkButton);
    
    expect(screen.getByText(/Uploading document/i)).toBeInTheDocument();
  });

  test('displays plagiarism percentage card after check completion', async () => {
    renderWithRouter(<PlagiarismChecker />);
    
    const demoButton = screen.getByText(/AI Detector/i);
    fireEvent.click(demoButton);

    const checkButton = screen.getByText(/Run Suite Checks/i);
    fireEvent.click(checkButton);
    
    // Wait for simulated progress interval to finish and api mock to resolve
    await waitFor(() => {
      expect(screen.getByText(/64%/i)).toBeInTheDocument();
    }, { timeout: 6000 });
  });
});
