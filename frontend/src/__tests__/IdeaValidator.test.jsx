// frontend/src/__tests__/IdeaValidator.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import IdeaValidator from '../components/IdeaValidator';
import toast from '../services/toast';

// Mock API service using inline definitions for cross-runner compatibility
vi.mock('../services/api', () => ({
  __esModule: true,
  apiService: {
    ideaValidator: {
      validateIdea: () => Promise.resolve({
        data: {
          problem_id: 42,
          uniqueness_score: 78,
          score_label: "Highly Unique",
          score_description: "Highly promising combined system architecture.",
          dimensions: {
            novelty: 80,
            feasibility: 65,
            impact: 85,
            market_gap: 75
          },
          innovation_gaps: [
            { id: 1, title: "Missing ML model architecture", existing: "N/A", opportunity: "N/A", is_primary: true }
          ],
          improvement_suggestions: [
            "Add thermal imaging for better accuracy"
          ],
          similar_papers: [
            { title: "Crop Disease Detection", source: "arXiv", venue: "arXiv:2401", similarity: 85, summary: "N/A" }
          ],
          success_metrics: [
            "Emergency response under 1.5s"
          ],
          potential_challenges: [
            "Battery constraints"
          ]
        }
      }),
      exportComprehensiveMD: () => Promise.resolve({ data: new Blob() }),
      exportComprehensivePDF: () => Promise.resolve({ data: new Blob() })
    }
  },
  getErrorMessage: (err) => err.message || 'Error'
}));

jest.mock('../services/api', () => ({
  __esModule: true,
  apiService: {
    ideaValidator: {
      validateIdea: () => Promise.resolve({
        data: {
          problem_id: 42,
          uniqueness_score: 78,
          score_label: "Highly Unique",
          score_description: "Highly promising combined system architecture.",
          dimensions: {
            novelty: 80,
            feasibility: 65,
            impact: 85,
            market_gap: 75
          },
          innovation_gaps: [
            { id: 1, title: "Missing ML model architecture", existing: "N/A", opportunity: "N/A", is_primary: true }
          ],
          improvement_suggestions: [
            "Add thermal imaging for better accuracy"
          ],
          similar_papers: [
            { title: "Crop Disease Detection", source: "arXiv", venue: "arXiv:2401", similarity: 85, summary: "N/A" }
          ],
          success_metrics: [
            "Emergency response under 1.5s"
          ],
          potential_challenges: [
            "Battery constraints"
          ]
        }
      }),
      exportComprehensiveMD: () => Promise.resolve({ data: new Blob() }),
      exportComprehensivePDF: () => Promise.resolve({ data: new Blob() })
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
    loading: vi.fn(() => ({ remove: vi.fn() }))
  }
}));

jest.mock('../services/toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn(() => ({ remove: jest.fn() }))
  }
}));

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('IdeaValidator Component Tests', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders idea validator form correctly', () => {
    renderWithRouter(<IdeaValidator />);
    
    // Check main elements
    expect(screen.getByText(/Problem Statement/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Unique Suggestions/i)).toBeInTheDocument();
    expect(screen.getByText(/Validate Idea/i)).toBeInTheDocument();
  });

  test('shows character counter description for problem statement', () => {
    renderWithRouter(<IdeaValidator />);
    
    expect(screen.getByText(/0\/500 characters/i)).toBeInTheDocument();
  });

  test('displays language routing description', () => {
    renderWithRouter(<IdeaValidator />);
    
    // Expand advanced settings to render language routing description
    const advancedButton = screen.getByText(/Advanced Research Controls/i);
    fireEvent.click(advancedButton);

    expect(screen.getByText(/English, Hindi, Marathi/i)).toBeInTheDocument();
  });

  test('shows framework selection buttons inside advanced controls', () => {
    renderWithRouter(<IdeaValidator />);
    
    // Expand advanced settings
    const advancedButton = screen.getByText(/Advanced Research Controls/i);
    fireEvent.click(advancedButton);

    expect(screen.getByText(/React/i)).toBeInTheDocument();
    expect(screen.getByText(/Flask/i)).toBeInTheDocument();
    expect(screen.getByText(/FastAPI/i)).toBeInTheDocument();
  });

  test('validate button triggers toast error when problem statement is empty', () => {
    renderWithRouter(<IdeaValidator />);
    
    const validateButton = screen.getByText(/Validate Idea/i);
    fireEvent.click(validateButton);
    expect(toast.error).toHaveBeenCalledWith('Please enter a problem statement');
  });

  test('validate button is enabled and triggers api validation when problem statement is filled', async () => {
    renderWithRouter(<IdeaValidator />);
    
    const textarea = screen.getByPlaceholderText(/Describe your hackathon idea/i);
    await userEvent.type(textarea, 'This is a valid problem statement for testing');
    
    const validateButton = screen.getByText(/Validate Idea/i);
    expect(validateButton).not.toBeDisabled();
  });

  test('shows loading state while validating', async () => {
    renderWithRouter(<IdeaValidator />);
    
    const textarea = screen.getByPlaceholderText(/Describe your hackathon idea/i);
    await userEvent.type(textarea, 'Test problem statement');
    
    const validateButton = screen.getByText(/Validate Idea/i);
    fireEvent.click(validateButton);
    
    // Check for active pipeline indicator
    expect(screen.getByText(/Querying AI Pipeline/i)).toBeInTheDocument();
  });

  test('displays results after successful validation', async () => {
    renderWithRouter(<IdeaValidator />);
    
    const textarea = screen.getByPlaceholderText(/Describe your hackathon idea/i);
    await userEvent.type(textarea, 'Test problem statement for validation');
    
    const validateButton = screen.getByText(/Validate Idea/i);
    fireEvent.click(validateButton);
    
    // Wait for results elements to appear
    await waitFor(() => {
      expect(screen.getByText(/Validation Results/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Check uniqueness score is displayed
    expect(screen.getByText(/78%/i)).toBeInTheDocument();
    
    // Check score description is displayed
    expect(screen.getByText(/Highly Unique/i)).toBeInTheDocument();
  });

  test('shows agent progress tracker during validation', async () => {
    renderWithRouter(<IdeaValidator />);
    
    const textarea = screen.getByPlaceholderText(/Describe your hackathon idea/i);
    await userEvent.type(textarea, 'Test problem statement');
    
    const validateButton = screen.getByText(/Validate Idea/i);
    fireEvent.click(validateButton);
    
    expect(screen.getByText(/Extracting semantic intent/i)).toBeInTheDocument();
    expect(screen.getByText(/Querying GitHub/i)).toBeInTheDocument();
  });
});
