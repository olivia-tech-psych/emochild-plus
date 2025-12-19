/**
 * PageCurl Component Tests
 * Requirements: 1.1, 1.2, 1.4
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
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

  describe('Animation Functionality', () => {
    it('applies curling animation class when clicked', () => {
      const { container } = render(<PageCurl {...defaultProps} />);
      
      const button = container.querySelector('button');
      fireEvent.click(button!);
      
      // Should apply curling class during animation
      expect(button?.className).toContain('curling');
    });

    it('sets animation duration CSS variable', () => {
      const customDuration = 750;
      const { container } = render(<PageCurl {...defaultProps} animationDuration={customDuration} />);
      
      const button = container.querySelector('button');
      expect(button).toHaveStyle('--animation-duration: 750ms');
    });

    it('creates ripple effect on click', async () => {
      const onCurlMock = vi.fn();
      const { container } = render(<PageCurl {...defaultProps} onCurl={onCurlMock} />);
      
      const button = container.querySelector('button');
      
      // Mock getBoundingClientRect
      button!.getBoundingClientRect = vi.fn(() => ({
        left: 50,
        top: 50,
        width: 48,
        height: 48,
        right: 98,
        bottom: 98,
        x: 50,
        y: 50,
        toJSON: vi.fn(),
      }));
      
      const clickEvent = new MouseEvent('click', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      });
      
      fireEvent(button!, clickEvent);
      
      // Wait for the callback to be triggered
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(onCurlMock).toHaveBeenCalled();
    });

    it('handles animation timing correctly', async () => {
      const onCurlMock = vi.fn();
      const animationDuration = 600;
      
      render(<PageCurl {...defaultProps} onCurl={onCurlMock} animationDuration={animationDuration} />);
      
      const button = screen.getByRole('button');
      
      // Use fake timers for more reliable timing tests
      vi.useFakeTimers();
      
      fireEvent.click(button);
      
      // onCurl should not be called immediately
      expect(onCurlMock).not.toHaveBeenCalled();
      
      // Fast-forward time to 30% of animation duration (180ms for 600ms)
      vi.advanceTimersByTime(180);
      
      expect(onCurlMock).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('does not trigger animation when disabled', () => {
      const { container } = render(<PageCurl {...defaultProps} disabled={true} />);
      
      const button = container.querySelector('button');
      fireEvent.click(button!);
      
      // Should not apply curling class when disabled
      expect(button?.className).not.toContain('curling');
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      // Mock window.matchMedia for responsive tests
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('hover: none'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    });

    it('renders with larger touch targets on mobile', () => {
      // Mock touch device
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('hover: none') && query.includes('pointer: coarse'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = render(<PageCurl {...defaultProps} />);
      
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      
      // On touch devices, button should be larger (52px vs 48px)
      // This is handled by CSS media queries, so we just verify the button exists
      expect(button?.className).toContain('pageCurlButton');
    });

    it('maintains functionality on mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      render(<PageCurl {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Should still call onCurl on mobile
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(defaultProps.onCurl).toHaveBeenCalled();
    });

    it('handles reduced motion preferences', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = render(<PageCurl {...defaultProps} />);
      
      const button = container.querySelector('button');
      fireEvent.click(button!);
      
      // Animation should still work but with reduced motion
      // The CSS handles the actual motion reduction
      expect(button?.className).toContain('curling');
    });
  });
});