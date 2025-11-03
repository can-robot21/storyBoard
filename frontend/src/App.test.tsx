import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders StoryBoard AI title', () => {
  const { getByText } = render(<App />);
  const titleElement = getByText(/StoryBoard AI/i);
  expect(titleElement).toBeInTheDocument();
});
