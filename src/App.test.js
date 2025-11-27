import { render, screen } from '@testing-library/react';
import App from './App';

test('renders TodoApp header', () => {
  render(<App />);
  const header = screen.getByText('業務用Todo管理');
  expect(header).toBeInTheDocument();
});
