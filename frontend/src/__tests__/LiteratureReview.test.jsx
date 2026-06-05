// frontend/src/__tests__/LiteratureReview.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import LiteratureReview from '../components/LiteratureReview';

// Mock API service using inline definitions for cross-runner compatibility
vi.mock('../services/api', () => ({
  __esModule: true,
  apiService: {
    literatureReview: {
      searchPapers: () => Promise.resolve({
        data: {
          papers: [
            { id: 1, title: "Deep Learning in Healthcare", authors: "Smith et al.", year: 2023, relevance_score: 85, source: "Nature", citations: 150, abstract: "N/A" },
            { id: 2, title: "AI for Disease Detection", authors: "Johnson et al.", year: 2024, relevance_score: 72, source: "Science", citations: 89, abstract: "N/A" }
          ],
          total_results: 2
        }
      }),
      savePaper: () => Promise.resolve({ data: { success: true } }),
      getBibliography: () => Promise.resolve({ data: { bibliography: "[1] Smith, J. et al. (2023)..." } }),
      getSavedPapers: () => Promise.resolve({ data: { papers: [] } }),
      generateSurvey: () => Promise.resolve({ data: { survey: { title: "RAG Review Map", overview: "Test", tree_nodes: {}, insights: "Insights detailed" } } }),
      summarize: () => Promise.resolve({ data: { summary: { Problem: "Test", Method: "Test", Dataset: "Test", "Key Result": "Test", Limitation: "Test" } } })
    }
  },
  getErrorMessage: (err) => err.message || 'Error'
}));

jest.mock('../services/api', () => ({
  __esModule: true,
  apiService: {
    literatureReview: {
      searchPapers: () => Promise.resolve({
        data: {
          papers: [
            { id: 1, title: "Deep Learning in Healthcare", authors: "Smith et al.", year: 2023, relevance_score: 85, source: "Nature", citations: 150, abstract: "N/A" },
            { id: 2, title: "AI for Disease Detection", authors: "Johnson et al.", year: 2024, relevance_score: 72, source: "Science", citations: 89, abstract: "N/A" }
          ],
          total_results: 2
        }
      }),
      savePaper: () => Promise.resolve({ data: { success: true } }),
      getBibliography: () => Promise.resolve({ data: { bibliography: "[1] Smith, J. et al. (2023)..." } }),
      getSavedPapers: () => Promise.resolve({ data: { papers: [] } }),
      generateSurvey: () => Promise.resolve({ data: { survey: { title: "RAG Review Map", overview: "Test", tree_nodes: {}, insights: "Insights detailed" } } }),
      summarize: () => Promise.resolve({ data: { summary: { Problem: "Test", Method: "Test", Dataset: "Test", "Key Result": "Test", Limitation: "Test" } } })
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

describe('LiteratureReview Component Tests', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders literature review interface correctly', () => {
    renderWithRouter(<LiteratureReview />);
    
    expect(screen.getByText(/WisPaper/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Find me papers that study/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Search Papers/i)).toBeInTheDocument();
  });

  test('displays search results after searching', async () => {
    renderWithRouter(<LiteratureReview />);
    
    const searchInput = screen.getByPlaceholderText(/Find me papers that study/i);
    await userEvent.type(searchInput, 'machine learning in healthcare');
    
    const searchButton = screen.getByTitle(/Search Papers/i);
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Deep Learning in Healthcare/i)).toBeInTheDocument();
    });
  });

  test('displays relevance badges with correct matches for high relevance', async () => {
    renderWithRouter(<LiteratureReview />);
    
    const searchInput = screen.getByPlaceholderText(/Find me papers that study/i);
    await userEvent.type(searchInput, 'healthcare AI');
    
    const searchButton = screen.getByTitle(/Search Papers/i);
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText(/85% Match/i)).toBeInTheDocument();
    });
  });

  test('has save button for each paper', async () => {
    renderWithRouter(<LiteratureReview />);
    
    const searchInput = screen.getByPlaceholderText(/Find me papers that study/i);
    await userEvent.type(searchInput, 'test query');
    
    const searchButton = screen.getByTitle(/Search Papers/i);
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      const saveButtons = screen.getAllByText(/Add to Library/i);
      expect(saveButtons.length).toBeGreaterThan(0);
    });
  });

  test('shows "My Library" section', () => {
    renderWithRouter(<LiteratureReview />);
    
    expect(screen.getByText(/My Library/i)).toBeInTheDocument();
  });

  test('displays RAG survey section', () => {
    renderWithRouter(<LiteratureReview />);
    
    expect(screen.getByText(/AI Literature Survey/i)).toBeInTheDocument();
  });

  test('shows bibliography compile button', () => {
    renderWithRouter(<LiteratureReview />);
    
    expect(screen.getByText(/Academic Bibliography/i)).toBeInTheDocument();
  });
});
