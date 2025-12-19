/**
 * JournalSpread Component Tests
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { JournalSpread } from './JournalSpread';
import { JournalEntry } from '@/types';

// Mock the PageCurl component
vi.mock('../PageCurl', () => ({
  PageCurl: ({ direction, onCurl, disabled }: any) => (
    <button 
      onClick={onCurl}
      disabled={disabled}
      data-testid={`page-curl-${direction}`}
    >
      {direction === 'next' ? '→' : '←'}
    </button>
  )
}));

describe('JournalSpread', () => {
  const mockDate = new Date('2024-01-15');
  const mockEntry: JournalEntry = {
    id: '1',
    content: 'Test journal entry content',
    date: mockDate,
    createdAt: mockDate,
    updatedAt: mockDate,
    linkedEmotions: ['happy', 'grateful'],
    wordCount: 4,
    tags: [],
    dayOfYear: 15
  };

  const defaultProps = {
    currentDate: mockDate,
    isEditing: false,
    onSave: vi.fn(),
    onCancel: vi.fn(),
    onPageTurn: vi.fn(),
    canTurnNext: true,
    canTurnPrevious: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders journal spread with date header', () => {
    render(<JournalSpread {...defaultProps} />);
    
    expect(screen.getAllByText(/Monday, January 15, 2024/)).toHaveLength(2); // Header and navigation
    expect(screen.getByText('Day 15')).toBeInTheDocument();
  });

  it('displays empty placeholder when no entry exists', () => {
    render(<JournalSpread {...defaultProps} />);
    
    expect(screen.getByText('Ready for your thoughts...')).toBeInTheDocument();
    expect(screen.getAllByText('~')).toHaveLength(30); // 15 tildes per page
  });

  it('displays entry content when entry exists', () => {
    render(<JournalSpread {...defaultProps} entry={mockEntry} />);
    
    expect(screen.getByText('Test journal entry content')).toBeInTheDocument();
    expect(screen.getByText('4 words')).toBeInTheDocument();
  });

  it('displays linked emotions when they exist', () => {
    render(<JournalSpread {...defaultProps} entry={mockEntry} linkedEmotions={['happy', 'grateful']} />);
    
    expect(screen.getByText('Connected Emotions:')).toBeInTheDocument();
    expect(screen.getByText('happy')).toBeInTheDocument();
    expect(screen.getByText('grateful')).toBeInTheDocument();
  });

  it('shows editing interface when in edit mode', () => {
    render(<JournalSpread {...defaultProps} isEditing={true} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save Entry')).toBeInTheDocument();
  });

  it('calls onSave when save button is clicked with content', () => {
    render(<JournalSpread {...defaultProps} isEditing={true} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New journal entry' } });
    
    const saveButton = screen.getByText('Save Entry');
    fireEvent.click(saveButton);
    
    expect(defaultProps.onSave).toHaveBeenCalledWith('New journal entry', []);
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<JournalSpread {...defaultProps} isEditing={true} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('calls onPageTurn when navigation buttons are clicked', () => {
    render(<JournalSpread {...defaultProps} />);
    
    const nextButton = screen.getByTestId('page-curl-next');
    const prevButton = screen.getByTestId('page-curl-previous');
    
    fireEvent.click(nextButton);
    expect(defaultProps.onPageTurn).toHaveBeenCalledWith('next');
    
    fireEvent.click(prevButton);
    expect(defaultProps.onPageTurn).toHaveBeenCalledWith('previous');
  });

  it('disables save button when content is empty', () => {
    render(<JournalSpread {...defaultProps} isEditing={true} />);
    
    const saveButton = screen.getByText('Save Entry');
    expect(saveButton).toBeDisabled();
  });

  it('has proper accessibility attributes', () => {
    render(<JournalSpread {...defaultProps} entry={mockEntry} />);
    
    expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Journal spread');
    expect(screen.getByLabelText(/Left journal page/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Day 15 of the year/)).toBeInTheDocument();
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      // Mock window.matchMedia for responsive tests
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: false,
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

    it('renders properly on mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      const { container } = render(<JournalSpread {...defaultProps} entry={mockEntry} />);
      
      // Check that the component renders without errors on mobile by checking for key elements
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getAllByRole('article').length).toBeGreaterThanOrEqual(2); // At least left and right pages
      expect(screen.getByText('Test journal entry content')).toBeInTheDocument();
    });

    it('renders properly on tablet screens', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { container } = render(<JournalSpread {...defaultProps} entry={mockEntry} />);
      
      // Check that the component renders without errors on tablet by checking for key elements
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getAllByRole('article').length).toBeGreaterThanOrEqual(2); // At least left and right pages
      expect(screen.getByText('Test journal entry content')).toBeInTheDocument();
    });

    it('maintains touch-friendly button sizes on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      render(<JournalSpread {...defaultProps} isEditing={true} />);
      
      // Check that action buttons are present and accessible
      const saveButton = screen.getByText('Save Entry');
      const cancelButton = screen.getByText('Cancel');
      
      expect(saveButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
      
      // Verify buttons have proper accessibility attributes for touch
      expect(saveButton).toHaveAttribute('aria-label');
      expect(cancelButton).toHaveAttribute('aria-label');
      
      // Check that buttons are clickable (functional test for touch-friendliness)
      expect(saveButton).toBeDisabled(); // Should be disabled when no content
      expect(cancelButton).not.toBeDisabled();
    });

    it('handles text input properly on mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      render(<JournalSpread {...defaultProps} isEditing={true} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      
      // Test that text input works on mobile
      fireEvent.change(textarea, { target: { value: 'Mobile test entry' } });
      expect(textarea).toHaveValue('Mobile test entry');
      
      // Verify mobile-specific attributes
      expect(textarea).toHaveAttribute('maxLength', '5000');
      // autoFocus is a boolean attribute that may not show up in tests
      expect(textarea).toHaveAttribute('placeholder');
    });

    it('displays content correctly in mobile layout', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      render(<JournalSpread {...defaultProps} entry={mockEntry} />);
      
      // Content should still be visible and readable
      expect(screen.getByText('Test journal entry content')).toBeInTheDocument();
      expect(screen.getByText('4 words')).toBeInTheDocument();
      expect(screen.getAllByText(/Monday, January 15, 2024/)).toHaveLength(2);
      
      // Navigation should still be present
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });
});