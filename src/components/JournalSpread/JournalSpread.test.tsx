/**
 * JournalSpread Component Tests
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { JournalSpread } from './JournalSpread';
import { JournalEntry } from '@/types';

import { vi } from 'vitest';

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
});