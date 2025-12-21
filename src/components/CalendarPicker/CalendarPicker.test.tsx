/**
 * CalendarPicker Component Tests
 * Tests for the mobile-first calendar date picker
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CalendarPicker } from './CalendarPicker';
import { JournalEntry } from '@/types';

// Mock journal entries for testing
const mockJournalEntries: JournalEntry[] = [
  {
    id: '1',
    content: 'Test entry 1',
    date: new Date(2024, 0, 15), // January 15, 2024
    createdAt: new Date(),
    updatedAt: new Date(),
    linkedEmotions: [],
    wordCount: 3,
    tags: [],
    dayOfYear: 15
  },
  {
    id: '2',
    content: 'Test entry 2',
    date: new Date(2024, 0, 20), // January 20, 2024
    createdAt: new Date(),
    updatedAt: new Date(),
    linkedEmotions: [],
    wordCount: 3,
    tags: [],
    dayOfYear: 20
  }
];

const defaultProps = {
  selectedDate: new Date(2024, 0, 15), // January 15, 2024
  onDateSelect: vi.fn(),
  isOpen: true,
  onClose: vi.fn(),
  journalEntries: mockJournalEntries
};

describe('CalendarPicker', () => {
  it('renders calendar when open', () => {
    render(<CalendarPicker {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('January 2024')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<CalendarPicker {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays current month and year', () => {
    render(<CalendarPicker {...defaultProps} />);
    
    expect(screen.getByText('January 2024')).toBeInTheDocument();
  });

  it('shows navigation buttons', () => {
    render(<CalendarPicker {...defaultProps} />);
    
    expect(screen.getByLabelText('Previous month')).toBeInTheDocument();
    expect(screen.getByLabelText('Next month')).toBeInTheDocument();
  });

  it('displays day labels', () => {
    render(<CalendarPicker {...defaultProps} />);
    
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  it('calls onDateSelect when a date is clicked', () => {
    const onDateSelect = vi.fn();
    render(<CalendarPicker {...defaultProps} onDateSelect={onDateSelect} />);
    
    // Click on January 15th (should be available)
    const dateButton = screen.getByRole('button', { name: /January 15/ });
    fireEvent.click(dateButton);
    
    expect(onDateSelect).toHaveBeenCalledWith(expect.any(Date));
  });

  it('calls onClose when close button is clicked on mobile', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    const onClose = vi.fn();
    render(<CalendarPicker {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('navigates to previous month', () => {
    render(<CalendarPicker {...defaultProps} />);
    
    const prevButton = screen.getByLabelText('Previous month');
    fireEvent.click(prevButton);
    
    expect(screen.getByText('December 2023')).toBeInTheDocument();
  });

  it('navigates to next month', () => {
    render(<CalendarPicker {...defaultProps} />);
    
    const nextButton = screen.getByLabelText('Next month');
    fireEvent.click(nextButton);
    
    expect(screen.getByText('February 2024')).toBeInTheDocument();
  });

  it('shows entry dots for dates with journal entries', () => {
    render(<CalendarPicker {...defaultProps} />);
    
    // Check that dates with entries have the entry dot element
    const jan15Button = screen.getByRole('button', { name: /January 15/ });
    const jan20Button = screen.getByRole('button', { name: /January 20/ });
    
    // Check that the buttons contain the entry dot span
    expect(jan15Button.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(jan20Button.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('marks selected date correctly', () => {
    render(<CalendarPicker {...defaultProps} />);
    
    const selectedButton = screen.getByRole('button', { name: /January 15/ });
    // Check that the button has a class containing 'selected'
    expect(selectedButton.className).toContain('selected');
  });

  it('disables future dates', () => {
    // Mock the current date to be in the past relative to our test data
    const mockCurrentDate = new Date(2024, 0, 10); // January 10, 2024
    vi.setSystemTime(mockCurrentDate);
    
    render(<CalendarPicker {...defaultProps} />);
    
    // Look for dates that should be in the future (after January 10, 2024)
    // and check if they have the disabled attribute or future class
    const allButtons = screen.getAllByRole('button');
    const dateButtons = allButtons.filter(button => 
      /^\d+$/.test(button.textContent || '') // Only date number buttons
    );
    
    // At least some dates should be disabled or marked as future
    const disabledOrFutureDates = dateButtons.filter(button => 
      button.hasAttribute('disabled') || button.className.includes('future')
    );
    
    expect(disabledOrFutureDates.length).toBeGreaterThan(0);
    
    // Restore real time
    vi.useRealTimers();
  });

  it('has proper accessibility attributes', () => {
    render(<CalendarPicker {...defaultProps} />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'Calendar date picker');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('closes on escape key', () => {
    const onClose = vi.fn();
    render(<CalendarPicker {...defaultProps} onClose={onClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onClose).toHaveBeenCalled();
  });
});