/**
 * Integration tests for JournalSpread component
 * Testing journal entry creation and editing functionality
 * Requirements: 1.2, 1.3
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, beforeEach } from 'vitest';
import { JournalSpread } from './JournalSpread';
import { JournalEntry } from '@/types';

// Mock PageCurl component
vi.mock('../PageCurl', () => ({
  PageCurl: ({ direction, onCurl, disabled }: any) => (
    <button 
      onClick={onCurl} 
      disabled={disabled}
      data-testid={`page-curl-${direction}`}
    >
      {direction}
    </button>
  )
}));

describe('JournalSpread - Entry Creation and Editing', () => {
  const mockDate = new Date('2024-01-15');
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnPageTurn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Entry Creation', () => {
    it('should allow creating a new journal entry', async () => {
      const user = userEvent.setup();
      
      render(
        <JournalSpread
          currentDate={mockDate}
          isEditing={true}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onPageTurn={mockOnPageTurn}
          canTurnNext={true}
          canTurnPrevious={true}
        />
      );

      // Find the textarea
      const textarea = screen.getByLabelText(/journal entry content/i);
      expect(textarea).toBeInTheDocument();

      // Type content
      const testContent = 'Today I felt grateful for the sunshine and the opportunity to reflect on my emotions.';
      await user.type(textarea, testContent);

      // Check word count is displayed (the actual count is 15 words)
      expect(screen.getByText(/15 words/)).toBeInTheDocument();

      // Save the entry
      const saveButton = screen.getByRole('button', { name: /save journal entry/i });
      expect(saveButton).not.toBeDisabled();
      
      await user.click(saveButton);

      // Verify onSave was called with correct content
      expect(mockOnSave).toHaveBeenCalledWith(testContent, []);
    });

    it('should show word count updates in real-time', async () => {
      const user = userEvent.setup();
      
      render(
        <JournalSpread
          currentDate={mockDate}
          isEditing={true}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onPageTurn={mockOnPageTurn}
          canTurnNext={true}
          canTurnPrevious={true}
        />
      );

      const textarea = screen.getByLabelText(/journal entry content/i);

      // Initially should show 0 words
      expect(screen.getByText(/0 words/)).toBeInTheDocument();
      expect(screen.getByText(/start writing to save/i)).toBeInTheDocument();

      // Type a few words
      await user.type(textarea, 'Hello world test');
      
      // Should update to 3 words
      expect(screen.getByText(/3 words/)).toBeInTheDocument();
      expect(screen.queryByText(/start writing to save/i)).not.toBeInTheDocument();
    });

    it('should prevent saving empty entries', async () => {
      const user = userEvent.setup();
      
      render(
        <JournalSpread
          currentDate={mockDate}
          isEditing={true}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onPageTurn={mockOnPageTurn}
          canTurnNext={true}
          canTurnPrevious={true}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save journal entry/i });
      
      // Save button should be disabled when no content
      expect(saveButton).toBeDisabled();

      // Type only whitespace
      const textarea = screen.getByLabelText(/journal entry content/i);
      await user.type(textarea, '   \n\t  ');

      // Should still be disabled
      expect(saveButton).toBeDisabled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Entry Editing', () => {
    const existingEntry: JournalEntry = {
      id: '1',
      content: 'Original content for editing test',
      date: mockDate,
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T10:00:00Z'),
      linkedEmotions: ['grateful', 'calm'],
      wordCount: 5,
      dayOfYear: 15
    };

    it('should load existing entry content for editing', () => {
      // Mock emotions that match the linked emotion IDs and are from the same day
      const mockEmotions = [
        { id: 'grateful', text: 'grateful', action: 'expressed', timestamp: mockDate.getTime() },
        { id: 'calm', text: 'calm', action: 'expressed', timestamp: mockDate.getTime() }
      ];

      render(
        <JournalSpread
          currentDate={mockDate}
          entry={existingEntry}
          isEditing={true}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onPageTurn={mockOnPageTurn}
          canTurnNext={true}
          canTurnPrevious={true}
          linkedEmotions={existingEntry.linkedEmotions}
          allEmotions={mockEmotions}
          onToggleEmotion={vi.fn()}
        />
      );

      const textarea = screen.getByLabelText(/journal entry content/i);
      expect(textarea).toHaveValue(existingEntry.content);
      
      // Should show linked emotions in the emotion linker
      expect(screen.getAllByText('grateful')).toHaveLength(2); // Once in list, once in linked emotions
      expect(screen.getAllByText('calm')).toHaveLength(2); // Once in list, once in linked emotions
    });

    it('should allow editing existing entry content', async () => {
      const user = userEvent.setup();
      
      // Mock emotions that match the linked emotion IDs and are from the same day
      const mockEmotions = [
        { id: 'grateful', text: 'grateful', action: 'expressed', timestamp: mockDate.getTime() },
        { id: 'calm', text: 'calm', action: 'expressed', timestamp: mockDate.getTime() }
      ];
      
      render(
        <JournalSpread
          currentDate={mockDate}
          entry={existingEntry}
          isEditing={true}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onPageTurn={mockOnPageTurn}
          canTurnNext={true}
          canTurnPrevious={true}
          linkedEmotions={existingEntry.linkedEmotions}
          allEmotions={mockEmotions}
          onToggleEmotion={vi.fn()}
        />
      );

      const textarea = screen.getByLabelText(/journal entry content/i);
      
      // Clear and type new content
      await user.clear(textarea);
      const newContent = 'Updated content with more reflective thoughts about my day';
      await user.type(textarea, newContent);

      // Check updated word count (the actual count is 9 words)
      expect(screen.getByText(/9 words/)).toBeInTheDocument();

      // Save the changes
      const saveButton = screen.getByRole('button', { name: /save journal entry/i });
      await user.click(saveButton);

      // Verify onSave was called with updated content and linked emotions
      expect(mockOnSave).toHaveBeenCalledWith(newContent, existingEntry.linkedEmotions);
    });

    it('should show confirmation when canceling with unsaved changes', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      render(
        <JournalSpread
          currentDate={mockDate}
          entry={existingEntry}
          isEditing={true}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onPageTurn={mockOnPageTurn}
          canTurnNext={true}
          canTurnPrevious={true}
        />
      );

      const textarea = screen.getByLabelText(/journal entry content/i);
      
      // Make changes
      await user.type(textarea, ' with additional content');

      // Try to cancel
      const cancelButton = screen.getByRole('button', { name: /cancel editing/i });
      await user.click(cancelButton);

      // Should show confirmation dialog
      expect(mockConfirm).toHaveBeenCalledWith(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      expect(mockOnCancel).toHaveBeenCalled();

      mockConfirm.mockRestore();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should save entry with Ctrl+S', async () => {
      const user = userEvent.setup();
      
      render(
        <JournalSpread
          currentDate={mockDate}
          isEditing={true}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onPageTurn={mockOnPageTurn}
          canTurnNext={true}
          canTurnPrevious={true}
        />
      );

      const textarea = screen.getByLabelText(/journal entry content/i);
      await user.type(textarea, 'Test content for keyboard shortcut');

      // Press Ctrl+S
      await user.keyboard('{Control>}s{/Control}');

      expect(mockOnSave).toHaveBeenCalledWith('Test content for keyboard shortcut', []);
    });

    it('should cancel editing with Escape key', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm to return false (don't cancel)
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      render(
        <JournalSpread
          currentDate={mockDate}
          isEditing={true}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onPageTurn={mockOnPageTurn}
          canTurnNext={true}
          canTurnPrevious={true}
        />
      );

      const textarea = screen.getByLabelText(/journal entry content/i);
      await user.type(textarea, 'Some content');

      // Press Escape
      await user.keyboard('{Escape}');

      // Should show confirmation but not cancel since we returned false
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockOnCancel).not.toHaveBeenCalled();

      mockConfirm.mockRestore();
    });
  });

  describe('Character Limit', () => {
    it('should show character count warning near limit', async () => {
      render(
        <JournalSpread
          currentDate={mockDate}
          isEditing={true}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onPageTurn={mockOnPageTurn}
          canTurnNext={true}
          canTurnPrevious={true}
        />
      );

      const textarea = screen.getByLabelText(/journal entry content/i) as HTMLTextAreaElement;
      
      // Directly set value to simulate typing near the limit
      const longContent = 'a'.repeat(4600);
      fireEvent.change(textarea, { target: { value: longContent } });

      // Should show character remaining warning
      await waitFor(() => {
        expect(screen.getByText(/400 characters remaining/)).toBeInTheDocument();
      });
    });
  });
});