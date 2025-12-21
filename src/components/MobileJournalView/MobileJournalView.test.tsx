/**
 * MobileJournalView Component Tests
 * Tests for the full-screen mobile journal writing experience
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MobileJournalView } from './MobileJournalView';
import { JournalEntry, EmotionLog } from '@/types';

// Mock journal entry for testing
const mockEntry: JournalEntry = {
  id: '1',
  content: 'Test journal entry content',
  date: new Date(2024, 0, 15), // January 15, 2024
  createdAt: new Date(),
  updatedAt: new Date(),
  linkedEmotions: ['emotion1'],
  wordCount: 4,
  tags: [],
  dayOfYear: 15
};

// Mock emotions for testing - same day as the test date
const mockEmotions: EmotionLog[] = [
  {
    id: 'emotion1',
    text: 'Happy',
    timestamp: new Date(2024, 0, 15), // Same day as test date
    color: '#FFD700'
  },
  {
    id: 'emotion2',
    text: 'Excited',
    timestamp: new Date(2024, 0, 15), // Same day as test date
    color: '#FF6B6B'
  }
];

const defaultProps = {
  currentDate: new Date(2024, 0, 15), // January 15, 2024
  isOpen: true,
  onSave: vi.fn(),
  onClose: vi.fn(),
  linkedEmotions: ['emotion1'],
  onToggleEmotion: vi.fn(),
  allEmotions: mockEmotions
};

describe('MobileJournalView', () => {
  it('renders when open', () => {
    render(<MobileJournalView {...defaultProps} />);
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Monday, January 15, 2024')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<MobileJournalView {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('displays current date correctly', () => {
    render(<MobileJournalView {...defaultProps} />);
    
    expect(screen.getByText('Monday, January 15, 2024')).toBeInTheDocument();
  });

  it('shows word count', () => {
    render(<MobileJournalView {...defaultProps} />);
    
    expect(screen.getByText('0 words')).toBeInTheDocument();
  });

  it('updates word count when typing', () => {
    render(<MobileJournalView {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Hello world test' } });
    
    expect(screen.getByText('3 words')).toBeInTheDocument();
  });

  it('displays existing entry content', () => {
    render(<MobileJournalView {...defaultProps} entry={mockEntry} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Test journal entry content');
  });

  it('calls onSave when save button is clicked', () => {
    const onSave = vi.fn();
    render(<MobileJournalView {...defaultProps} onSave={onSave} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New content' } });
    
    const saveButton = screen.getByText('Save Entry');
    fireEvent.click(saveButton);
    
    expect(onSave).toHaveBeenCalledWith('New content', ['emotion1']);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<MobileJournalView {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Close journal');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<MobileJournalView {...defaultProps} onClose={onClose} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('disables save button when content is empty', () => {
    render(<MobileJournalView {...defaultProps} />);
    
    const saveButton = screen.getByText('Save Entry');
    expect(saveButton).toBeDisabled();
  });

  it('enables save button when content is present', () => {
    render(<MobileJournalView {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Some content' } });
    
    const saveButton = screen.getByText('Save Entry');
    expect(saveButton).not.toBeDisabled();
  });

  it('shows character limit warning when approaching limit', () => {
    render(<MobileJournalView {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    const longContent = 'a'.repeat(4600); // Close to 5000 limit
    fireEvent.change(textarea, { target: { value: longContent } });
    
    expect(screen.getByText(/characters remaining/)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<MobileJournalView {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-label', 'Journal entry content');
    expect(textarea).toHaveAttribute('maxLength', '5000');
    
    const closeButton = screen.getByLabelText('Close journal');
    expect(closeButton).toBeInTheDocument();
  });

  it('shows emotion linking section when emotions are available', () => {
    render(<MobileJournalView {...defaultProps} />);
    
    // Should show emotion linker when emotions are available
    expect(screen.getByText('Connect Emotions')).toBeInTheDocument();
    expect(screen.getAllByText('Happy')).toHaveLength(2); // One in list, one in linked emotions
  });

  it('handles keyboard shortcuts', () => {
    const onClose = vi.fn();
    render(<MobileJournalView {...defaultProps} onClose={onClose} />);
    
    // Test Escape key
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('prevents body scroll when open', () => {
    render(<MobileJournalView {...defaultProps} />);
    
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', () => {
    const { rerender } = render(<MobileJournalView {...defaultProps} />);
    
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(<MobileJournalView {...defaultProps} isOpen={false} />);
    
    expect(document.body.style.overflow).toBe('');
  });
});