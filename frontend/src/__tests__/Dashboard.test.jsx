// frontend/src/__tests__/Dashboard.test.jsx
import React from 'react';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Dashboard from '../pages/Dashboard';

// Mock apiService to prevent actual network calls during tests
jest.mock('../services/api', () => ({
  apiService: {
    auth: {
      me: () => Promise.resolve({
        data: { name: 'Innovator admin@innocheck.com' }
      })
    },
    dashboard: {
      getOverview: () => Promise.resolve({
        data: {
          stats: {
            total_analyses: 15,
            average_uniqueness_score: 82,
            saved_prototypes: 3
          },
          recent_analyses: [
            { text: "AI Tourist Safety System", uniqueness_score: 85, score_label: "Highly Unique", submitted_at: "2026-06-02T12:00:00Z" }
          ]
        }
      })
    }
  }
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  
  test('renders dashboard without crashing', async () => {
    renderWithRouter(<Dashboard />);
    await waitForElementToBeRemoved(() => screen.queryByText(/Loading/i));
    expect(screen.getByText(/Recent activity/i)).toBeInTheDocument();
  });

  test('displays welcome message', async () => {
    renderWithRouter(<Dashboard />);
    await waitForElementToBeRemoved(() => screen.queryByText(/Loading/i));
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });

  test('shows stats cards', async () => {
    renderWithRouter(<Dashboard />);
    await waitForElementToBeRemoved(() => screen.queryByText(/Loading/i));
    expect(screen.getByText(/Total validations/i)).toBeInTheDocument();
  });
});
