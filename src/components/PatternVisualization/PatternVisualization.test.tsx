/**
 * PatternVisualization Component Tests
 * Tests for emotional pattern displays with encouraging design
 * Requirements: 4.1, 4.3, 4.5
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PatternVisualization } from './PatternVisualization';
import { EmotionalPattern, TimeRange } from '@/types';

describe('PatternVisualization', () => {
  const mockTimeRange: TimeRange = {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31'),
    preset: 'month'
  };

  const mockStreakPattern: EmotionalPattern = {
    type: 'streak',
    timeRange: mockTimeRange,
    data: {
      currentStreak: 5,
      longestStreak: 10,
      daysWithExpressed: 15,
      totalDays: 20
    },
    insight: 'You have a 5-day streak of emotional expression!',
    encouragement: 'Keep up the great work with consistent emotional awareness.'
  };

  const mockFrequencyPattern: EmotionalPattern = {
    type: 'common-emotions',
    timeRange: mockTimeRange,
    data: {
      emotions: [
        { emotion: 'happy', count: 10 },
        { emotion: 'anxious', count: 8 },
        { emotion: 'calm', count: 5 }
      ],
      totalLogs: 23,
      uniqueEmotions: 3
    },
    insight: 'Your most frequent emotion was "happy" (10 times).',
    encouragement: 'Notice the variety in your emotional experience.'
  };

  const mockRatioPattern: EmotionalPattern = {
    type: 'expression-ratio',
    timeRange: mockTimeRange,
    data: {
      expressed: 15,
      suppressed: 8,
      total: 23,
      ratio: 0.65,
      percentage: 65
    },
    insight: 'You expressed 65% of your emotions - great emotional awareness!',
    encouragement: 'Keep up this healthy pattern of emotional expression.'
  };

  const defaultProps = {
    patterns: [mockStreakPattern],
    visualType: 'streak' as const,
    showEncouragement: true
  };

  describe('Rendering', () => {
    it('renders pattern visualization with data', () => {
      render(<PatternVisualization {...defaultProps} />);
      
      expect(screen.getByText('You have a 5-day streak of emotional expression!')).toBeInTheDocument();
      expect(screen.getByText('Keep up the great work with consistent emotional awareness.')).toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(<PatternVisualization {...defaultProps} title="My Patterns" />);
      
      expect(screen.getByText('My Patterns')).toBeInTheDocument();
    });

    it('renders empty state when no relevant patterns', () => {
      render(
        <PatternVisualization 
          patterns={[]} 
          visualType="streak" 
          showEncouragement={true} 
        />
      );
      
      expect(screen.getByText('Building Your Pattern')).toBeInTheDocument();
      expect(screen.getByText(/your emotional expression streaks will appear here/i)).toBeInTheDocument();
    });
  });

  describe('Visual Types', () => {
    it('renders streak visualization correctly', () => {
      render(<PatternVisualization {...defaultProps} visualType="streak" />);
      
      expect(screen.getByText('Current Streak')).toBeInTheDocument();
      expect(screen.getByText('5 days')).toBeInTheDocument();
      expect(screen.getByText('Longest Streak:')).toBeInTheDocument();
      expect(screen.getByText('10 days')).toBeInTheDocument();
      expect(screen.getByText('Total Active Days:')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('renders frequency visualization correctly', () => {
      render(
        <PatternVisualization 
          patterns={[mockFrequencyPattern]} 
          visualType="frequency" 
          showEncouragement={true} 
        />
      );
      
      expect(screen.getByText('happy')).toBeInTheDocument();
      expect(screen.getByText('10 times')).toBeInTheDocument();
      expect(screen.getByText('anxious')).toBeInTheDocument();
      expect(screen.getByText('8 times')).toBeInTheDocument();
      expect(screen.getByText('calm')).toBeInTheDocument();
      expect(screen.getByText('5 times')).toBeInTheDocument();
    });

    it('renders ratio visualization correctly', () => {
      render(
        <PatternVisualization 
          patterns={[mockRatioPattern]} 
          visualType="ratio" 
          showEncouragement={true} 
        />
      );
      
      expect(screen.getByText('Expressed: 15')).toBeInTheDocument();
      expect(screen.getByText('Suppressed: 8')).toBeInTheDocument();
      expect(screen.getByText('Total emotions logged: 23')).toBeInTheDocument();
    });
  });

  describe('Streak Visualization Features', () => {
    it('shows celebration for good streaks', () => {
      const goodStreakPattern = {
        ...mockStreakPattern,
        data: { ...mockStreakPattern.data, currentStreak: 7 }
      };
      
      render(
        <PatternVisualization 
          patterns={[goodStreakPattern]} 
          visualType="streak" 
          showEncouragement={true} 
        />
      );
      
      expect(screen.getByText('Great consistency!')).toBeInTheDocument();
    });

    it('does not show celebration for short streaks', () => {
      const shortStreakPattern = {
        ...mockStreakPattern,
        data: { ...mockStreakPattern.data, currentStreak: 1 }
      };
      
      render(
        <PatternVisualization 
          patterns={[shortStreakPattern]} 
          visualType="streak" 
          showEncouragement={true} 
        />
      );
      
      expect(screen.queryByText('Great consistency!')).not.toBeInTheDocument();
    });

    it('displays streak days visually', () => {
      render(<PatternVisualization {...defaultProps} visualType="streak" />);
      
      // Should render streak day elements (fire emojis for active days)
      const streakEmojis = screen.getAllByText('🔥');
      expect(streakEmojis).toHaveLength(5); // Current streak of 5 days
    });
  });

  describe('Frequency Visualization Features', () => {
    it('shows percentages for emotions', () => {
      render(
        <PatternVisualization 
          patterns={[mockFrequencyPattern]} 
          visualType="frequency" 
          showEncouragement={true} 
        />
      );
      
      // happy: 10/23 = 43%
      expect(screen.getByText('43%')).toBeInTheDocument();
      // anxious: 8/23 = 35%
      expect(screen.getByText('35%')).toBeInTheDocument();
      // calm: 5/23 = 22%
      expect(screen.getByText('22%')).toBeInTheDocument();
    });

    it('limits display to top 5 emotions', () => {
      const manyEmotionsPattern = {
        ...mockFrequencyPattern,
        data: {
          ...mockFrequencyPattern.data,
          emotions: [
            { emotion: 'happy', count: 10 },
            { emotion: 'anxious', count: 8 },
            { emotion: 'calm', count: 5 },
            { emotion: 'excited', count: 4 },
            { emotion: 'sad', count: 3 },
            { emotion: 'angry', count: 2 },
            { emotion: 'confused', count: 1 }
          ]
        }
      };
      
      render(
        <PatternVisualization 
          patterns={[manyEmotionsPattern]} 
          visualType="frequency" 
          showEncouragement={true} 
        />
      );
      
      // Should show first 5 emotions
      expect(screen.getByText('happy')).toBeInTheDocument();
      expect(screen.getByText('sad')).toBeInTheDocument();
      
      // Should not show 6th and 7th emotions
      expect(screen.queryByText('angry')).not.toBeInTheDocument();
      expect(screen.queryByText('confused')).not.toBeInTheDocument();
      
      // Should show "more emotions" message
      expect(screen.getByText('+ 2 more emotions explored')).toBeInTheDocument();
    });
  });

  describe('Ratio Visualization Features', () => {
    it('shows positive interpretation for high expression ratio', () => {
      const highRatioPattern = {
        ...mockRatioPattern,
        data: { ...mockRatioPattern.data, percentage: 75 }
      };
      
      render(
        <PatternVisualization 
          patterns={[highRatioPattern]} 
          visualType="ratio" 
          showEncouragement={true} 
        />
      );
      
      expect(screen.getByText('🌟 Wonderful emotional awareness')).toBeInTheDocument();
    });

    it('shows neutral interpretation for medium expression ratio', () => {
      const mediumRatioPattern = {
        ...mockRatioPattern,
        data: { ...mockRatioPattern.data, percentage: 60 }
      };
      
      render(
        <PatternVisualization 
          patterns={[mediumRatioPattern]} 
          visualType="ratio" 
          showEncouragement={true} 
        />
      );
      
      expect(screen.getByText('🌱 Growing emotional expression')).toBeInTheDocument();
    });

    it('shows gentle interpretation for low expression ratio', () => {
      const lowRatioPattern = {
        ...mockRatioPattern,
        data: { ...mockRatioPattern.data, percentage: 30 }
      };
      
      render(
        <PatternVisualization 
          patterns={[lowRatioPattern]} 
          visualType="ratio" 
          showEncouragement={true} 
        />
      );
      
      expect(screen.getByText('🤗 Every step toward expression matters')).toBeInTheDocument();
    });
  });

  describe('Encouragement Features', () => {
    it('shows encouragement when enabled', () => {
      render(<PatternVisualization {...defaultProps} showEncouragement={true} />);
      
      expect(screen.getByText('Keep up the great work with consistent emotional awareness.')).toBeInTheDocument();
    });

    it('hides encouragement when disabled', () => {
      render(<PatternVisualization {...defaultProps} showEncouragement={false} />);
      
      expect(screen.queryByText('Keep up the great work with consistent emotional awareness.')).not.toBeInTheDocument();
    });

    it('shows encouraging empty state messages', () => {
      render(
        <PatternVisualization 
          patterns={[]} 
          visualType="frequency" 
          showEncouragement={true} 
        />
      );
      
      expect(screen.getByText(/every emotion you log contributes to understanding/i)).toBeInTheDocument();
    });
  });

  describe('Pattern Filtering', () => {
    it('filters patterns by visual type', () => {
      const mixedPatterns = [mockStreakPattern, mockFrequencyPattern, mockRatioPattern];
      
      render(
        <PatternVisualization 
          patterns={mixedPatterns} 
          visualType="frequency" 
          showEncouragement={true} 
        />
      );
      
      // Should only show frequency pattern
      expect(screen.getByText('happy')).toBeInTheDocument();
      expect(screen.queryByText('Current Streak')).not.toBeInTheDocument();
      expect(screen.queryByText('Expressed: 15')).not.toBeInTheDocument();
    });

    it('handles multiple patterns of same type', () => {
      const duplicatePatterns = [mockStreakPattern, mockStreakPattern];
      
      render(
        <PatternVisualization 
          patterns={duplicatePatterns} 
          visualType="streak" 
          showEncouragement={true} 
        />
      );
      
      // Should render both patterns
      const streakTexts = screen.getAllByText('Current Streak');
      expect(streakTexts).toHaveLength(2);
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for streak days', () => {
      render(<PatternVisualization {...defaultProps} visualType="streak" />);
      
      // Should have ARIA labels for streak day elements
      expect(screen.getByLabelText('Day 1 active')).toBeInTheDocument();
      expect(screen.getByLabelText('Day 5 active')).toBeInTheDocument();
      expect(screen.getByLabelText('Day 6 inactive')).toBeInTheDocument();
    });

    it('provides ARIA labels for ratio bars', () => {
      render(
        <PatternVisualization 
          patterns={[mockRatioPattern]} 
          visualType="ratio" 
          showEncouragement={true} 
        />
      );
      
      expect(screen.getByLabelText('65% expressed emotions')).toBeInTheDocument();
      expect(screen.getByLabelText('35% suppressed emotions')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <PatternVisualization {...defaultProps} className="custom-pattern" />
      );
      
      expect(container.firstChild).toHaveClass('custom-pattern');
    });
  });
});