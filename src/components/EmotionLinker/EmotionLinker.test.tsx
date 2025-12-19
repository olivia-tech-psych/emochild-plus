/**
 * EmotionLinker Component Tests
 * Tests emotion linking functionality for journal entries
 * Requirements: 1.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { EmotionLinker } from './EmotionLinker';
import { EmotionLog } from '@/types';

// Mock emotions for testing
const mockEmotions: EmotionLog[] = [
  {
    id: 'emotion-1',
    text: 'Feeling anxious about work',
    action: 'expressed',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    textColor: 'white',
    quickEmotion: 'anxious'
  },
  {
    id: 'emotion-2',
    text: 'Happy about the weekend',
    action: 'expressed',
    timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
    textColor: 'blue'
  },
  {
    id: 'emotion-3',
    text: 'Frustrated with traffic',
    action: 'suppressed',
    timestamp: Date.now() - 1000 * 60 * 15, // 15 minutes ago
    textColor: 'red',
    quickEmotion: 'angry'
  }
];

describe('EmotionLinker', () => {
  const mockOnToggleEmotion = vi.fn();
  const testDate = new Date();

  beforeEach(() => {
    mockOnToggleEmotion.mockClear();
  });

  it('renders with available emotions', () => {
    render(
      <EmotionLinker
        availableEmotions={mockEmotions}
        linkedEmotions={[]}
        onToggleEmotion={mockOnToggleEmotion}
        date={testDate}
      />
    );

    expect(screen.getByText('Connect Emotions')).toBeInTheDocument();
    expect(screen.getByText('Feeling anxious about work')).toBeInTheDocument();
    expect(screen.getByText('Happy about the weekend')).toBeInTheDocument();
    expect(screen.getByText('Frustrated with traffic')).toBeInTheDocument();
  });

  it('shows no emotions message when no emotions available', () => {
    render(
      <EmotionLinker
        availableEmotions={[]}
        linkedEmotions={[]}
        onToggleEmotion={mockOnToggleEmotion}
        date={testDate}
      />
    );

    expect(screen.getByText(/No emotions logged for this day yet/)).toBeInTheDocument();
  });

  it('displays emotion metadata correctly', () => {
    render(
      <EmotionLinker
        availableEmotions={mockEmotions}
        linkedEmotions={[]}
        onToggleEmotion={mockOnToggleEmotion}
        date={testDate}
      />
    );

    // Check action types
    expect(screen.getAllByText('expressed')).toHaveLength(2);
    expect(screen.getByText('suppressed')).toBeInTheDocument();

    // Check quick emotions
    expect(screen.getByText('anxious')).toBeInTheDocument();
    expect(screen.getByText('angry')).toBeInTheDocument();
  });

  it('handles emotion linking and unlinking', async () => {
    render(
      <EmotionLinker
        availableEmotions={mockEmotions}
        linkedEmotions={['emotion-1']}
        onToggleEmotion={mockOnToggleEmotion}
        date={testDate}
      />
    );

    // Check that emotion-1 is linked (checkbox should be checked)
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();

    // Click to unlink emotion-1
    fireEvent.click(checkboxes[0]);
    expect(mockOnToggleEmotion).toHaveBeenCalledWith('emotion-1');

    // Click to link emotion-2
    fireEvent.click(checkboxes[1]);
    expect(mockOnToggleEmotion).toHaveBeenCalledWith('emotion-2');
  });

  it('displays linked emotions in the summary section', () => {
    render(
      <EmotionLinker
        availableEmotions={mockEmotions}
        linkedEmotions={['emotion-1', 'emotion-2']}
        onToggleEmotion={mockOnToggleEmotion}
        date={testDate}
      />
    );

    expect(screen.getByText('Linked Emotions (2)')).toBeInTheDocument();
    
    // Check that linked emotions are displayed as tags
    const linkedTags = screen.getAllByRole('listitem');
    expect(linkedTags.some(tag => tag.textContent?.includes('Feeling anxious about work'))).toBe(true);
    expect(linkedTags.some(tag => tag.textContent?.includes('Happy about the weekend'))).toBe(true);
  });

  it('handles keyboard navigation', async () => {
    render(
      <EmotionLinker
        availableEmotions={mockEmotions}
        linkedEmotions={[]}
        onToggleEmotion={mockOnToggleEmotion}
        date={testDate}
      />
    );

    const emotionItems = screen.getAllByRole('listitem');
    const firstEmotionItem = emotionItems[0];

    // Test Enter key
    fireEvent.keyDown(firstEmotionItem, { key: 'Enter' });
    expect(mockOnToggleEmotion).toHaveBeenCalledWith('emotion-1');

    // Test Space key
    fireEvent.keyDown(firstEmotionItem, { key: ' ' });
    expect(mockOnToggleEmotion).toHaveBeenCalledWith('emotion-1');
  });

  it('can be collapsed and expanded', async () => {
    render(
      <EmotionLinker
        availableEmotions={mockEmotions}
        linkedEmotions={[]}
        onToggleEmotion={mockOnToggleEmotion}
        initiallyCollapsed={true}
        date={testDate}
      />
    );

    // Should be collapsed initially
    const content = screen.getByRole('region', { name: /emotion linking/i });
    expect(content.querySelector('[aria-hidden="true"]')).toBeInTheDocument();

    // Click show button
    const toggleButton = screen.getByText('Show');
    fireEvent.click(toggleButton);

    // Should be expanded now
    await waitFor(() => {
      expect(screen.getByText('Hide')).toBeInTheDocument();
    });
  });

  it('removes linked emotions via remove button', () => {
    render(
      <EmotionLinker
        availableEmotions={mockEmotions}
        linkedEmotions={['emotion-1']}
        onToggleEmotion={mockOnToggleEmotion}
        date={testDate}
      />
    );

    // Find and click the remove button
    const removeButton = screen.getByRole('button', { name: /Remove link to emotion: Feeling anxious about work/i });
    fireEvent.click(removeButton);

    expect(mockOnToggleEmotion).toHaveBeenCalledWith('emotion-1');
  });

  it('displays date information when provided', () => {
    const testDate = new Date('2024-01-15');
    render(
      <EmotionLinker
        availableEmotions={mockEmotions}
        linkedEmotions={[]}
        onToggleEmotion={mockOnToggleEmotion}
        date={testDate}
      />
    );

    expect(screen.getByText(/from Monday, January 15/)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <EmotionLinker
        availableEmotions={mockEmotions}
        linkedEmotions={['emotion-1']}
        onToggleEmotion={mockOnToggleEmotion}
        date={testDate}
      />
    );

    // Check ARIA labels and roles
    expect(screen.getByRole('region', { name: /emotion linking/i })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /available emotions to link/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /currently linked emotions/i })).toBeInTheDocument();

    // Check button accessibility
    const toggleButton = screen.getByRole('button', { name: 'Hide' });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(toggleButton).toHaveAttribute('aria-controls', 'emotion-linker-content');
  });

  it('handles empty linked emotions gracefully', () => {
    render(
      <EmotionLinker
        availableEmotions={mockEmotions}
        linkedEmotions={[]}
        onToggleEmotion={mockOnToggleEmotion}
        date={testDate}
      />
    );

    // Should not show linked emotions section when none are linked
    expect(screen.queryByText('Linked Emotions')).not.toBeInTheDocument();
  });

  it('formats time correctly', () => {
    const mockEmotionWithSpecificTime: EmotionLog = {
      id: 'emotion-time-test',
      text: 'Test emotion',
      action: 'expressed',
      timestamp: new Date('2024-01-15T14:30:00').getTime(),
      textColor: 'white'
    };

    render(
      <EmotionLinker
        availableEmotions={[mockEmotionWithSpecificTime]}
        linkedEmotions={[]}
        onToggleEmotion={mockOnToggleEmotion}
        date={testDate}
      />
    );

    // Should display formatted time (format may vary by locale)
    expect(screen.getByText(/2:30/)).toBeInTheDocument();
  });
});