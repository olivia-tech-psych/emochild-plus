/**
 * InsightDashboard Component Tests
 * Requirements: 4.1, 4.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { InsightDashboard } from './InsightDashboard';

// Mock the useAnalytics hook
const mockUseAnalytics = vi.fn();
vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => mockUseAnalytics()
}));

// Mock the child components
vi.mock('@/components/EmotionChart', () => ({
  EmotionChart: ({ title, accessibleDescription }: any) => (
    <div data-testid="emotion-chart">
      <div>{title}</div>
      <div>{accessibleDescription}</div>
    </div>
  )
}));

vi.mock('@/components/PatternVisualization', () => ({
  PatternVisualization: ({ title, visualType }: any) => (
    <div data-testid="pattern-visualization">
      <div>{title}</div>
      <div>{visualType}</div>
    </div>
  )
}));

describe('InsightDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('No Data State', () => {
    beforeEach(() => {
      mockUseAnalytics.mockReturnValue({
        analytics: null,
        isLoading: false,
        error: null,
        generatePresetAnalytics: vi.fn(),
        getAnalyticsSummary: () => ({
          totalEmotions: 0,
          expressedEmotions: 0,
          expressionRatio: 0,
          currentStreak: 0,
          mostCommonEmotion: null,
          activeDays: 0
        }),
        hasData: false,
        dataFreshness: {
          lastEmotionLog: null,
          lastJournalEntry: null,
          lastAnalyticsView: null
        }
      });
    });

    it('renders encouraging message when no data available', () => {
      render(<InsightDashboard />);
      
      expect(screen.getByText('Your Journey Begins Here')).toBeInTheDocument();
      expect(screen.getByText(/Start logging your emotions to discover meaningful patterns/)).toBeInTheDocument();
    });

    it('shows placeholder visualizations for insufficient data', () => {
      render(<InsightDashboard />);
      
      expect(screen.getByText('Expression Balance')).toBeInTheDocument();
      expect(screen.getByText('Common Emotions')).toBeInTheDocument();
      expect(screen.getByText('Expression Streaks')).toBeInTheDocument();
      expect(screen.getByText('Your expression balance will appear here')).toBeInTheDocument();
    });

    it('displays encouraging messages about building awareness', () => {
      render(<InsightDashboard />);
      
      expect(screen.getByText(/Every feeling you acknowledge is a step toward greater self-understanding/)).toBeInTheDocument();
      expect(screen.getByText(/Your insights will appear here as you continue your emotional journey/)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      mockUseAnalytics.mockReturnValue({
        analytics: null,
        isLoading: true,
        error: null,
        generatePresetAnalytics: vi.fn(),
        getAnalyticsSummary: () => ({
          totalEmotions: 0,
          expressedEmotions: 0,
          expressionRatio: 0,
          currentStreak: 0,
          mostCommonEmotion: null,
          activeDays: 0
        }),
        hasData: true,
        dataFreshness: {
          lastEmotionLog: null,
          lastJournalEntry: null,
          lastAnalyticsView: null
        }
      });
    });

    it('shows loading state with encouraging message', () => {
      render(<InsightDashboard />);
      
      expect(screen.getByText('Discovering your emotional patterns...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    const mockGeneratePresetAnalytics = vi.fn();

    beforeEach(() => {
      mockUseAnalytics.mockReturnValue({
        analytics: null,
        isLoading: false,
        error: 'Failed to generate analytics',
        generatePresetAnalytics: mockGeneratePresetAnalytics,
        getAnalyticsSummary: () => ({
          totalEmotions: 0,
          expressedEmotions: 0,
          expressionRatio: 0,
          currentStreak: 0,
          mostCommonEmotion: null,
          activeDays: 0
        }),
        hasData: true,
        dataFreshness: {
          lastEmotionLog: null,
          lastJournalEntry: null,
          lastAnalyticsView: null
        }
      });
    });

    it('shows error state with gentle messaging', () => {
      render(<InsightDashboard />);
      
      expect(screen.getByText('Unable to Generate Insights')).toBeInTheDocument();
      expect(screen.getByText(/We're having trouble analyzing your emotional patterns/)).toBeInTheDocument();
    });

    it('provides retry functionality', () => {
      render(<InsightDashboard />);
      
      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);
      
      expect(mockGeneratePresetAnalytics).toHaveBeenCalledWith('month');
    });
  });

  describe('Data Available State', () => {
    const mockGeneratePresetAnalytics = vi.fn();
    const mockAnalytics = {
      patterns: [
        {
          type: 'expression-ratio' as const,
          timeRange: { start: new Date(), end: new Date() },
          data: { expressed: 8, suppressed: 2, total: 10, percentage: 80 },
          insight: 'You express emotions well',
          encouragement: 'Great emotional awareness!'
        }
      ],
      chartData: {
        'expression-ratio': {
          labels: ['Expressed', 'Suppressed'],
          datasets: [{
            label: 'Expression Ratio',
            data: [8, 2],
            backgroundColor: ['#C9E4DE', '#fcded3'],
            borderColor: ['#C9E4DE', '#fcded3']
          }]
        }
      },
      hasSufficientData: true,
      timeRange: { start: new Date(), end: new Date() },
      dataCount: {
        emotionLogs: 10,
        journalEntries: 5,
        totalDays: 7
      }
    };

    beforeEach(() => {
      mockUseAnalytics.mockReturnValue({
        analytics: mockAnalytics,
        isLoading: false,
        error: null,
        generatePresetAnalytics: mockGeneratePresetAnalytics,
        getAnalyticsSummary: () => ({
          totalEmotions: 10,
          expressedEmotions: 8,
          expressionRatio: 0.8,
          currentStreak: 3,
          mostCommonEmotion: 'happy',
          activeDays: 7
        }),
        hasData: true,
        dataFreshness: {
          lastEmotionLog: new Date(),
          lastJournalEntry: new Date(),
          lastAnalyticsView: new Date()
        }
      });
    });

    it('renders dashboard layout with time range selection', () => {
      render(<InsightDashboard />);
      
      expect(screen.getByText('Your Emotional Insights')).toBeInTheDocument();
      expect(screen.getByText('View insights for:')).toBeInTheDocument();
      expect(screen.getByText('Past Week')).toBeInTheDocument();
      expect(screen.getByText('Past Month')).toBeInTheDocument();
      expect(screen.getByText('Past 3 Months')).toBeInTheDocument();
      expect(screen.getByText('Past Year')).toBeInTheDocument();
    });

    it('shows overview statistics', () => {
      render(<InsightDashboard />);
      
      expect(screen.getByText('10')).toBeInTheDocument(); // Total emotions
      expect(screen.getByText('80%')).toBeInTheDocument(); // Expression rate
      expect(screen.getByText('3')).toBeInTheDocument(); // Current streak
      expect(screen.getByText('7')).toBeInTheDocument(); // Active days
    });

    it('handles time range selection', async () => {
      render(<InsightDashboard />);
      
      const weekButton = screen.getByText('Past Week');
      fireEvent.click(weekButton);
      
      await waitFor(() => {
        expect(mockGeneratePresetAnalytics).toHaveBeenCalledWith('week');
      });
    });

    it('displays pattern insights with encouragement', () => {
      render(<InsightDashboard />);
      
      expect(screen.getByText('You express emotions well')).toBeInTheDocument();
      expect(screen.getByText('Great emotional awareness!')).toBeInTheDocument();
    });

    it('shows data visualizations', () => {
      render(<InsightDashboard />);
      
      expect(screen.getByTestId('emotion-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pattern-visualization')).toBeInTheDocument();
    });

    it('includes encouraging footer message', () => {
      render(<InsightDashboard />);
      
      expect(screen.getByText(/Remember: Every emotion is valid/)).toBeInTheDocument();
    });
  });

  describe('Insufficient Data State', () => {
    beforeEach(() => {
      mockUseAnalytics.mockReturnValue({
        analytics: {
          patterns: [],
          chartData: {},
          hasSufficientData: false,
          insufficientDataMessage: 'Keep logging emotions to see more detailed patterns',
          timeRange: { start: new Date(), end: new Date() },
          dataCount: {
            emotionLogs: 3,
            journalEntries: 1,
            totalDays: 2
          }
        },
        isLoading: false,
        error: null,
        generatePresetAnalytics: vi.fn(),
        getAnalyticsSummary: () => ({
          totalEmotions: 3,
          expressedEmotions: 2,
          expressionRatio: 0.67,
          currentStreak: 1,
          mostCommonEmotion: 'happy',
          activeDays: 2
        }),
        hasData: true,
        dataFreshness: {
          lastEmotionLog: new Date(),
          lastJournalEntry: null,
          lastAnalyticsView: null
        }
      });
    });

    it('shows encouraging message for insufficient data', () => {
      render(<InsightDashboard />);
      
      expect(screen.getByText('Building Your Emotional Awareness')).toBeInTheDocument();
      expect(screen.getByText('Keep logging emotions to see more detailed patterns')).toBeInTheDocument();
      expect(screen.getByText(/Every emotion you log contributes to a deeper understanding/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for time range selection when data is available', () => {
      mockUseAnalytics.mockReturnValue({
        analytics: {
          patterns: [],
          chartData: {},
          hasSufficientData: true,
          timeRange: { start: new Date(), end: new Date() },
          dataCount: {
            emotionLogs: 10,
            journalEntries: 5,
            totalDays: 7
          }
        },
        isLoading: false,
        error: null,
        generatePresetAnalytics: vi.fn(),
        getAnalyticsSummary: () => ({
          totalEmotions: 10,
          expressedEmotions: 8,
          expressionRatio: 0.8,
          currentStreak: 3,
          mostCommonEmotion: 'happy',
          activeDays: 7
        }),
        hasData: true,
        dataFreshness: {
          lastEmotionLog: new Date(),
          lastJournalEntry: null,
          lastAnalyticsView: null
        }
      });

      render(<InsightDashboard />);
      
      const timeRangeGroup = screen.getByRole('group', { name: /Select time period for insights/ });
      expect(timeRangeGroup).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      mockUseAnalytics.mockReturnValue({
        analytics: null,
        isLoading: false,
        error: null,
        generatePresetAnalytics: vi.fn(),
        getAnalyticsSummary: () => ({
          totalEmotions: 0,
          expressedEmotions: 0,
          expressionRatio: 0,
          currentStreak: 0,
          mostCommonEmotion: null,
          activeDays: 0
        }),
        hasData: false,
        dataFreshness: {
          lastEmotionLog: null,
          lastJournalEntry: null,
          lastAnalyticsView: null
        }
      });

      render(<InsightDashboard />);
      
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('Your Emotional Insights');
    });
  });

  describe('Custom Props', () => {
    beforeEach(() => {
      mockUseAnalytics.mockReturnValue({
        analytics: null,
        isLoading: false,
        error: null,
        generatePresetAnalytics: vi.fn(),
        getAnalyticsSummary: () => ({
          totalEmotions: 0,
          expressedEmotions: 0,
          expressionRatio: 0,
          currentStreak: 0,
          mostCommonEmotion: null,
          activeDays: 0
        }),
        hasData: false,
        dataFreshness: {
          lastEmotionLog: null,
          lastJournalEntry: null,
          lastAnalyticsView: null
        }
      });
    });

    it('applies custom className', () => {
      const { container } = render(<InsightDashboard className="custom-class" />);
      
      const dashboard = container.firstChild as HTMLElement;
      expect(dashboard).toHaveClass('custom-class');
    });
  });
});