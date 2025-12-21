/**
 * DailyPrompt Component Tests
 * Requirements: 3.1, 3.4, 3.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DailyPrompt } from './DailyPrompt';
import { Prompt } from '@/types';

const mockPrompt: Prompt = {
  id: 'prompt-1',
  trackId: 'inner-child',
  dayNumber: 15,
  content: 'What made you feel safe and happy as a child?',
  category: 'safety',
  isCompleted: false
};

const mockCompletedPrompt: Prompt = {
  id: 'prompt-2',
  trackId: 'inner-teenager',
  dayNumber: 8,
  content: 'What values are most important to you right now?',
  category: 'identity',
  isCompleted: true,
  response: 'Honesty and creativity are really important to me.',
  completedAt: new Date('2024-01-15')
};

describe('DailyPrompt', () => {
  it('renders prompt with basic information', () => {
    const mockOnSkip = vi.fn();
    
    render(
      <DailyPrompt
        prompt={mockPrompt}
        onSkip={mockOnSkip}
      />
    );
    
    expect(screen.getByText('Day 15')).toBeInTheDocument();
    expect(screen.getByText('Safety')).toBeInTheDocument();
    expect(screen.getByText('Optional')).toBeInTheDocument();
    expect(screen.getByText('What made you feel safe and happy as a child?')).toBeInTheDocument();
  });

  it('shows reflect and skip buttons for uncompleted prompts', () => {
    const mockOnSkip = vi.fn();
    
    render(
      <DailyPrompt
        prompt={mockPrompt}
        onSkip={mockOnSkip}
      />
    );
    
    expect(screen.getByText('Reflect on this')).toBeInTheDocument();
    expect(screen.getByText('Skip for now')).toBeInTheDocument();
  });

  it('expands to show textarea when reflect button is clicked', async () => {
    const mockOnSkip = vi.fn();
    
    render(
      <DailyPrompt
        prompt={mockPrompt}
        onSkip={mockOnSkip}
      />
    );
    
    const reflectButton = screen.getByText('Reflect on this');
    fireEvent.click(reflectButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Your reflection:')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Take your time... there\'s no right or wrong answer.')).toBeInTheDocument();
    });
  });

  it('calls onSkip when skip button is clicked', () => {
    const mockOnSkip = vi.fn();
    
    render(
      <DailyPrompt
        prompt={mockPrompt}
        onSkip={mockOnSkip}
      />
    );
    
    const skipButton = screen.getByText('Skip for now');
    fireEvent.click(skipButton);
    
    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  it('updates word count as user types', async () => {
    const user = userEvent.setup();
    const mockOnSkip = vi.fn();
    
    render(
      <DailyPrompt
        prompt={mockPrompt}
        onSkip={mockOnSkip}
      />
    );
    
    // Expand the prompt
    const reflectButton = screen.getByText('Reflect on this');
    fireEvent.click(reflectButton);
    
    await waitFor(() => {
      expect(screen.getByText('0 words')).toBeInTheDocument();
    });
    
    const textarea = screen.getByLabelText('Your reflection:');
    await user.type(textarea, 'This is a test response');
    
    await waitFor(() => {
      expect(screen.getByText('5 words')).toBeInTheDocument();
    });
  });

  it('calls onComplete when save button is clicked with valid response', async () => {
    const user = userEvent.setup();
    const mockOnComplete = vi.fn();
    const mockOnSkip = vi.fn();
    
    render(
      <DailyPrompt
        prompt={mockPrompt}
        onComplete={mockOnComplete}
        onSkip={mockOnSkip}
      />
    );
    
    // Expand the prompt
    const reflectButton = screen.getByText('Reflect on this');
    fireEvent.click(reflectButton);
    
    // Type a response
    const textarea = await screen.findByLabelText('Your reflection:');
    await user.type(textarea, 'My childhood home made me feel safe.');
    
    // Save the response
    const saveButton = screen.getByText('Save reflection');
    fireEvent.click(saveButton);
    
    expect(mockOnComplete).toHaveBeenCalledWith('My childhood home made me feel safe.');
  });

  it('supports Ctrl+Enter keyboard shortcut to save', async () => {
    const user = userEvent.setup();
    const mockOnComplete = vi.fn();
    const mockOnSkip = vi.fn();
    
    render(
      <DailyPrompt
        prompt={mockPrompt}
        onComplete={mockOnComplete}
        onSkip={mockOnSkip}
      />
    );
    
    // Expand the prompt
    const reflectButton = screen.getByText('Reflect on this');
    fireEvent.click(reflectButton);
    
    // Type a response and use keyboard shortcut
    const textarea = await screen.findByLabelText('Your reflection:');
    await user.type(textarea, 'Playing in the garden made me happy.');
    
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    
    expect(mockOnComplete).toHaveBeenCalledWith('Playing in the garden made me happy.');
  });

  it('disables save button when response is empty', async () => {
    const mockOnSkip = vi.fn();
    
    render(
      <DailyPrompt
        prompt={mockPrompt}
        onSkip={mockOnSkip}
      />
    );
    
    // Expand the prompt
    const reflectButton = screen.getByText('Reflect on this');
    fireEvent.click(reflectButton);
    
    await waitFor(() => {
      const saveButton = screen.getByText('Save reflection');
      expect(saveButton).toBeDisabled();
    });
  });

  it('displays completed state for completed prompts', () => {
    const mockOnSkip = vi.fn();
    
    render(
      <DailyPrompt
        prompt={mockCompletedPrompt}
        onSkip={mockOnSkip}
      />
    );
    
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('Reflected')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Honesty and creativity are really important to me.')).toBeInTheDocument();
    expect(screen.getByText('Completed on 15/1/2024')).toBeInTheDocument();
  });

  it('does not show action buttons for completed prompts', () => {
    const mockOnSkip = vi.fn();
    
    render(
      <DailyPrompt
        prompt={mockCompletedPrompt}
        onSkip={mockOnSkip}
      />
    );
    
    expect(screen.queryByText('Reflect on this')).not.toBeInTheDocument();
    expect(screen.queryByText('Save reflection')).not.toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    const mockOnSkip = vi.fn();
    
    render(
      <DailyPrompt
        prompt={mockPrompt}
        onSkip={mockOnSkip}
        disabled={true}
      />
    );
    
    const reflectButton = screen.getByText('Reflect on this');
    const skipButton = screen.getByText('Skip for now');
    
    expect(reflectButton).toBeDisabled();
    expect(skipButton).toBeDisabled();
  });

  it('handles loading state correctly', () => {
    const mockOnSkip = vi.fn();
    
    render(
      <DailyPrompt
        prompt={mockPrompt}
        onSkip={mockOnSkip}
        isLoading={true}
      />
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    const reflectButton = screen.getByText('Loading...');
    const skipButton = screen.getByText('Skip for now');
    
    expect(reflectButton).toBeDisabled();
    expect(skipButton).toBeDisabled();
  });

  it('formats category names correctly', () => {
    const promptWithLowercaseCategory: Prompt = {
      ...mockPrompt,
      category: 'boundaries'
    };
    
    const mockOnSkip = vi.fn();
    
    render(
      <DailyPrompt
        prompt={promptWithLowercaseCategory}
        onSkip={mockOnSkip}
      />
    );
    
    expect(screen.getByText('Boundaries')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', async () => {
    const mockOnSkip = vi.fn();
    
    render(
      <DailyPrompt
        prompt={mockPrompt}
        onSkip={mockOnSkip}
      />
    );
    
    // Check button descriptions
    const reflectButton = screen.getByText('Reflect on this');
    expect(reflectButton).toHaveAttribute('aria-describedby', 'reflect-description');
    
    const skipButton = screen.getByText('Skip for now');
    expect(skipButton).toHaveAttribute('aria-describedby', 'skip-description');
    
    // Expand to check textarea accessibility
    fireEvent.click(reflectButton);
    
    await waitFor(() => {
      const textarea = screen.getByLabelText('Your reflection:');
      expect(textarea).toHaveAttribute('aria-describedby');
    });
  });

  it('preserves existing response when prompt has one', () => {
    const promptWithResponse: Prompt = {
      ...mockPrompt,
      response: 'Existing response text'
    };
    
    const mockOnSkip = vi.fn();
    
    render(
      <DailyPrompt
        prompt={promptWithResponse}
        onSkip={mockOnSkip}
      />
    );
    
    // Expand the prompt
    const reflectButton = screen.getByText('Reflect on this');
    fireEvent.click(reflectButton);
    
    expect(screen.getByDisplayValue('Existing response text')).toBeInTheDocument();
  });
});