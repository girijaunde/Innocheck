// frontend/src/__tests__/CodeStudio.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import CodeStudio from '../components/CodeStudio';

// Mock API service using inline definitions for cross-runner compatibility
// Mock API service using inline definitions for cross-runner compatibility
vi.mock('../services/api', () => ({
  __esModule: true,
  apiService: {
    codestudio: {
      generateComponent: () => Promise.resolve({
        data: {
          code: 'import React from "react";\nfunction App() { return <div>Hello World Component</div>; }',
          framework: 'react',
          explanation: 'This is a simple React component'
        }
      }),
      generatePrototype: () => Promise.resolve({
        data: {
          code: '<html><body><h1>Hello World Prototype</h1></body></html>',
          html: '<html><body><h1>Hello World Prototype</h1></body></html>',
          framework: 'html',
          explanation: 'This is a simple HTML prototype'
        }
      }),
      refineCode: () => Promise.resolve({
        data: {
          code: 'import React from "react";\nfunction App() { return <div>Updated Component</div>; }'
        }
      }),
      chatRefine: () => Promise.resolve({
        data: {
          code: 'import React from "react";\nfunction App() { return <div>Updated Component</div>; }'
        }
      }),
      suggestStack: () => Promise.resolve({
        data: {
          success: true,
          primary_stack: "React + Tailwind",
          reason: "Modern setup",
          estimated_time: "4-5 hours"
        }
      }),
      explainCode: () => Promise.resolve({
        data: {
          success: true,
          explanation: "Component breakdown notes."
        }
      }),
      testCode: () => Promise.resolve({
        data: {
          success: true,
          complexity_score: 90,
          warnings: ["Warning 1"]
        }
      }),
      exportPlatform: () => Promise.resolve({
        data: {
          success: true,
          zip_base64: "dGVzdF96aXBfY29udGVudHM="
        }
      }),
      getTemplates: () => Promise.resolve({
        data: {
          templates: []
        }
      }),
      saveProject: () => Promise.resolve({
        data: {
          success: true,
          project: { id: 2, title: "Test Save" }
        }
      }),
      getMyProjects: () => Promise.resolve({
        data: {
          projects: []
        }
      }),
      forkProject: () => Promise.resolve({
        data: {
          success: true
        }
      })
    }
  },
  getErrorMessage: (err) => err.message || 'Error'
}));

jest.mock('../services/api', () => ({
  __esModule: true,
  apiService: {
    codestudio: {
      generateComponent: () => Promise.resolve({
        data: {
          code: 'import React from "react";\nfunction App() { return <div>Hello World Component</div>; }',
          framework: 'react',
          explanation: 'This is a simple React component'
        }
      }),
      generatePrototype: () => Promise.resolve({
        data: {
          code: '<html><body><h1>Hello World Prototype</h1></body></html>',
          html: '<html><body><h1>Hello World Prototype</h1></body></html>',
          framework: 'html',
          explanation: 'This is a simple HTML prototype'
        }
      }),
      refineCode: () => Promise.resolve({
        data: {
          code: 'import React from "react";\nfunction App() { return <div>Updated Component</div>; }'
        }
      }),
      chatRefine: () => Promise.resolve({
        data: {
          code: 'import React from "react";\nfunction App() { return <div>Updated Component</div>; }'
        }
      }),
      suggestStack: () => Promise.resolve({
        data: {
          success: true,
          primary_stack: "React + Tailwind",
          reason: "Modern setup",
          estimated_time: "4-5 hours"
        }
      }),
      explainCode: () => Promise.resolve({
        data: {
          success: true,
          explanation: "Component breakdown notes."
        }
      }),
      testCode: () => Promise.resolve({
        data: {
          success: true,
          complexity_score: 90,
          warnings: ["Warning 1"]
        }
      }),
      exportPlatform: () => Promise.resolve({
        data: {
          success: true,
          zip_base64: "dGVzdF96aXBfY29udGVudHM="
        }
      }),
      getTemplates: () => Promise.resolve({
        data: {
          templates: []
        }
      }),
      saveProject: () => Promise.resolve({
        data: {
          success: true,
          project: { id: 2, title: "Test Save" }
        }
      }),
      getMyProjects: () => Promise.resolve({
        data: {
          projects: []
        }
      }),
      forkProject: () => Promise.resolve({
        data: {
          success: true
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

describe('CodeStudio Component Tests', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders code studio interface correctly', () => {
    renderWithRouter(<CodeStudio />);
    
    expect(screen.getByText(/CodeStudio Studio/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe your project/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate Project Code/i)).toBeInTheDocument();
  });

  test('shows mode selector options', () => {
    renderWithRouter(<CodeStudio />);
    
    expect(screen.getByText(/Single Component/i)).toBeInTheDocument();
    expect(screen.getByText(/Full Prototype/i)).toBeInTheDocument();
  });

  test('shows framework selection option in select list', () => {
    renderWithRouter(<CodeStudio />);
    
    expect(screen.getAllByText(/React/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Vue/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Flask/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/FastAPI/i).length).toBeGreaterThan(0);
  });

  test('shows device preview buttons', () => {
    renderWithRouter(<CodeStudio />);
    
    expect(screen.getByTitle(/laptop/i)).toBeInTheDocument();
    expect(screen.getByTitle(/mobile/i)).toBeInTheDocument();
    expect(screen.getByTitle(/tablet/i)).toBeInTheDocument();
  });

  test('enables generate button when description is provided', async () => {
    renderWithRouter(<CodeStudio />);
    
    const textarea = screen.getByPlaceholderText(/Describe your project/i);
    await userEvent.type(textarea, 'Create a saas landing page');
    
    const generateButton = screen.getByText(/Generate Project Code/i);
    expect(generateButton).not.toBeDisabled();
  });

  test('shows loading state while generating', async () => {
    renderWithRouter(<CodeStudio />);
    
    const textarea = screen.getByPlaceholderText(/Describe your project/i);
    await userEvent.type(textarea, 'Create a landing page');
    
    const generateButton = screen.getByText(/Generate Project Code/i);
    fireEvent.click(generateButton);
    
    expect(screen.getByText(/Synthesizing/i)).toBeInTheDocument();
  });

  test('displays generated code and live preview iframe after generation', async () => {
    renderWithRouter(<CodeStudio />);
    
    const textarea = screen.getByPlaceholderText(/Describe your project/i);
    await userEvent.type(textarea, 'Create a dashboard layout');
    
    const prototypeModeButton = screen.getByRole('button', { name: /Full Prototype/i });
    fireEvent.click(prototypeModeButton);

    const generateButton = screen.getByText(/Generate Project Code/i);
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      // Switches workspace preview tabs and renders preview
      expect(screen.getByTitle(/Prototype Preview/i)).toBeInTheDocument();
    }, { timeout: 6000 });
  });

  test('shows learning mode button in sidebar', () => {
    renderWithRouter(<CodeStudio />);
    
    expect(screen.getByText(/Enable Learning Mode/i)).toBeInTheDocument();
  });

  test('shows export ZIP button', () => {
    renderWithRouter(<CodeStudio />);
    
    expect(screen.getByText(/Export full package ZIP/i)).toBeInTheDocument();
  });
});
