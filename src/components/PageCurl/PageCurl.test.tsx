/**
 * PageCurl Component Tests
 * Requirements: 1.1, 1.2, 1.4
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { PageCurl } from './PageCurl';

describe('PageCurl', () => {

  const defaultProps = {
    direction: 'next' as const,
    onCurl: vi.fn(),
    disabled: false,
    animationDuration: 500,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct direction arrow', () => {
    render(<PageCurl {...defaultProps} />);
    expect(screen.getByText('→')).toBeInTheDocument();
  });

  it('renders previous direction arrow', () => {
    render(<PageCurl {...defaultProps} direction="previous" />);
    expect(screen.getByText('←')).toBeInTheDocument();
  });

  it('calls onCurl when clicked', () => {
    render(<PageCurl {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // onCurl should be called after a delay
    setTimeout(() => {
      expect(defaultProps.onCurl).toHaveBeenCalled();
    }, 200);
  });

  it('does not call onCurl when disabled', () => {
    render(<PageCurl {...defaultProps} disabled={true} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(defaultProps.onCurl).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<PageCurl {...defaultProps} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Turn to next journal page');
    expect(button).toHaveAttribute('title', 'Turn to next journal page');
  });

  it('has proper accessibility attributes for previous direction', () => {
    render(<PageCurl {...defaultProps} direction="previous" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Turn to previous journal page');
    expect(button).toHaveAttribute('title', 'Turn to previous journal page');
  });

  it('handles keyboard navigation', () => {
    render(<PageCurl {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    
    // onCurl should be called after a delay
    setTimeout(() => {
      expect(defaultProps.onCurl).toHaveBeenCalled();
    }, 200);
  });

  it('handles space key navigation', () => {
    render(<PageCurl {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: ' ' });
    
    // onCurl should be called after a delay
    setTimeout(() => {
      expect(defaultProps.onCurl).toHaveBeenCalled();
    }, 200);
  });

  it('is disabled when disabled prop is true', () => {
    render(<PageCurl {...defaultProps} disabled={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('tabIndex', '-1');
  });

  it('applies correct CSS classes', () => {
    const { container } = render(<PageCurl {...defaultProps} />);
    
    const button = container.querySelector('button');
    expect(button?.className).toContain('pageCurlButton');
    expect(button?.className).toContain('next');
  });

  it('applies previous direction class', () => {
    const { container } = render(<PageCurl {...defaultProps} direction="previous" />);
    
    const button = container.querySelector('button');
    expect(button?.className).toContain('pageCurlButton');
    expect(button?.className).toContain('previous');
  });
});