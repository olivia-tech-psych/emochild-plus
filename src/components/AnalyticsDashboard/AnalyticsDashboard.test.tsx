/**
 * Tests for Analytics Dashboard Component
 * Requirements: 4.1, 4.3, 4.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import * as useAnalyticsHook from '@/hooks/useAnalytics';

// Mock the useAnalytics hook
const mockUseAnalytics = vi.fn();
vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => mockUseAnalytics()
}));

describe('AnalyticsDashboard', () => {
  const mockAnalyticsData = {
    patterns: [
      {
        type: 'expression-ratio',
        insight: 'You expressed 80% of your emotions - great emotional awareness!',
        encouragement: 'Keep up this healthy pattern of emotional expression.',
        data: {
          expressed: 8,
          suppressed: 2,
          total: 10,
          percentage: 80
        },
        timeRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(),
          preset: 'month'
        }
      },
      {
        type: 'common-emotions',
        insight: 'Your most frequent emotion was "happy" (3 times). You logged 4 different emotions.',
        encouragement: 'Notice the variety in your emotional experience - each feeling has value.',
        data: {
          emotions: [
            { emotion: 'happy', count: 3 },
            { emotion: 'calm', count: 2 },
            { emotion: 'excited', count: 1 }
          ],
          totalLogs: 6,
          uniqueEmotions: 4
        },
        timeRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(),
          preset: 'month'
        }
      }
    ],
    chartData: {},
    hasSufficientData: true,
    timeRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
      preset: 'month'
    },
    dataCount: {
      emotionLogs: 10,
      journalEntries: 3,
      totalDays: 7
    }
  };

  const mockSummary = {
    totalEmotions: 10,
    expressedEmotions: 8,
    expressionRatio: 0.8,
    currentStreak: 3,
    mostCommonEmotion: 'happy',
    activeDays: 5
  };

  const mockDataFreshness = {
    lastEmotionLog: new Date(),
    lastJournalEntry: new Date(),
    lastAnalyticsView: new Date()
  };

  beforeEach(() => {
    // Reset mock
    mockUseAnalytics.mockReturnValue({
      analytics: mockAnalyticsData,
      isLoading: false,
      error: null,
      generatePresetAnalytics: vi.fn(),
      getAnalyticsSummary: vi.fn().mockReturnValue(mockSummary),
      hasData: true,
      dataFreshness: mockDataFreshness
    });
  });

  describe('Rendering', () => {
    it('should render dashboard header', () => {
      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('Your Emotional Journey')).toBeInTheDocument();
      expect(screen.getByText('Insights into your emotional patterns')).toBeInTheDocument();
    });

    it('should render time range selector', () => {
      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('Time Period:')).toBeInTheDocument();
      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('Month')).toBeInTheDocument();
      expect(screen.getByText('Quarter')).toBeInTheDocument();
      expect(screen.getByText('Year')).toBeInTheDocument();
    });

    it('should render quick stats', () => {
      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('10')).toBeInTheDocument(); // Total emotions
      expect(screen.getByText('80%')).toBeInTheDocument(); // Expression rate
      expect(screen.getByText('3')).toBeInTheDocument(); // Current streak
      expect(screen.getByText('5')).toBeInTheDocument(); // Active days
      
      expect(screen.getByText('Emotions Logged')).toBeInTheDocument();
      expect(screen.getByText('Expression Rate')).toBeInTheDocument();
      expect(screen.getByText('Current Streak')).toBeInTheDocument();
      expect(screen.getByText('Active Days')).toBeInTheDocument();
    });

    it('should render patterns when data is sufficient', () => {
      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('Your Emotional Patterns')).toBeInTheDocument();
      expect(screen.getByText('Expression Balance')).toBeInTheDocument();
      expect(screen.getByText('Most Common Emotions')).toBeInTheDocument();
      
      // Check insights
      expect(screen.getByText('You expressed 80% of your emotions - great emotional awareness!')).toBeInTheDocument();
      expect(screen.getByText('Your most frequent emotion was "happy" (3 times). You logged 4 different emotions.')).toBeInTheDocument();
      
      // Check encouragement
      expect(screen.getByText('💙 Keep up this healthy pattern of emotional expression.')).toBeInTheDocument();
      expect(screen.getByText('💙 Notice the variety in your emotional experience - each feeling has value.')).toBeInTheDocument();
    });
  });

  describe('No Data State', () => {
    it('should show encouraging message when no data is available', () => {
      mockUseAnalytics.mockReturnValue({
        analytics: null,
        isLoading: false,
        error: null,
        generatePresetAnalytics: vi.fn(),
        getAnalyticsSummary: vi.fn().mockReturnValue({
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

      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('Start Your Emotional Awareness Journey')).toBeInTheDocument();
      expect(screen.getByText(/Begin logging your emotions to see meaningful patterns emerge/)).toBeInTheDocument();
      expect(screen.getByText('🌱')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when analytics are being generated', () => {
      mockUseAnalytics.mockReturnValue({
        analytics: null,
        isLoading: true,
        error: null,
        generatePresetAnalytics: vi.fn(),
        getAnalyticsSummary: vi.fn().mockReturnValue(mockSummary),
        hasData: true,
        dataFreshness: mockDataFreshness
      });

      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('Analyzing your emotional patterns...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when analytics generation fails', () => {
      const mockGeneratePresetAnalytics = vi.fn();
      
      mockUseAnalytics.mockReturnValue({
        analytics: null,
        isLoading: false,
        error: 'Failed to generate analytics',
        generatePresetAnalytics: mockGeneratePresetAnalytics,
        getAnalyticsSummary: vi.fn().mockReturnValue(mockSummary),
        hasData: true,
        dataFreshness: mockDataFreshness
      });

      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('Unable to Generate Insights')).toBeInTheDocument();
      expect(screen.getByText('Failed to generate analytics')).toBeInTheDocument();
      
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(mockGeneratePresetAnalytics).toHaveBeenCalledWith('month');
    });
  });

  describe('Insufficient Data State', () => {
    it('should show encouraging message when data is insufficient', () => {
      const insufficientDataAnalytics = {
        ...mockAnalyticsData,
        hasSufficientData: false,
        insufficientDataMessage: 'You\'ve taken the first step in emotional awareness! Keep logging your feelings to see patterns emerge over time.',
        patterns: []
      };

      mockUseAnalytics.mockReturnValue({
        analytics: insufficientDataAnalytics,
        isLoading: false,
        error: null,
        generatePresetAnalytics: vi.fn(),
        getAnalyticsSummary: vi.fn().mockReturnValue(mockSummary),
        hasData: true,
        dataFreshness: mockDataFreshness
      });

      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('🌟')).toBeInTheDocument();
      expect(screen.getByText(/You've taken the first step in emotional awareness/)).toBeInTheDocument();
    });
  });

  describe('Time Range Selection', () => {
    it('should call generatePresetAnalytics when time range is changed', () => {
      const mockGeneratePresetAnalytics = vi.fn();
      
      mockUseAnalytics.mockReturnValue({
        analytics: mockAnalyticsData,
        isLoading: false,
        error: null,
        generatePresetAnalytics: mockGeneratePresetAnalytics,
        getAnalyticsSummary: vi.fn().mockReturnValue(mockSummary),
        hasData: true,
        dataFreshness: mockDataFreshness
      });

      render(<AnalyticsDashboard />);
      
      const weekButton = screen.getByText('Week');
      fireEvent.click(weekButton);
      
      expect(mockGeneratePresetAnalytics).toHaveBeenCalledWith('week');
    });

    it('should highlight active time range button', () => {
      render(<AnalyticsDashboard />);
      
      const monthButton = screen.getByText('Month');
      expect(monthButton.className).toContain('active');
      
      const weekButton = screen.getByText('Week');
      fireEvent.click(weekButton);
      
      expect(weekButton.className).toContain('active');
    });
  });

  describe('Pattern Data Visualization', () => {
    it('should render expression ratio visualization', () => {
      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('Expressed: 8')).toBeInTheDocument();
      expect(screen.getByText('Suppressed: 2')).toBeInTheDocument();
    });

    it('should render common emotions list', () => {
      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('happy')).toBeInTheDocument();
      expect(screen.getByText('3 times')).toBeInTheDocument();
      expect(screen.getByText('calm')).toBeInTheDocument();
      expect(screen.getByText('2 times')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<AnalyticsDashboard />);
      
      expect(screen.getByRole('group', { name: 'Select time period' })).toBeInTheDocument();
      
      const monthButton = screen.getByText('Month');
      expect(monthButton).toHaveAttribute('aria-pressed', 'true');
      
      const weekButton = screen.getByText('Week');
      expect(weekButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should have proper focus management', () => {
      render(<AnalyticsDashboard />);
      
      const weekButton = screen.getByText('Week');
      weekButton.focus();
      expect(weekButton).toHaveFocus();
    });
  });

  describe('Data Freshness', () => {
    it('should display last updated information', () => {
      render(<AnalyticsDashboard />);
      
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    it('should handle null last emotion log', () => {
      mockUseAnalytics.mockReturnValue({
        analytics: mockAnalyticsData,
        isLoading: false,
        error: null,
        generatePresetAnalytics: vi.fn(),
        getAnalyticsSummary: vi.fn().mockReturnValue(mockSummary),
        hasData: true,
        dataFreshness: {
          lastEmotionLog: null,
          lastJournalEntry: null,
          lastAnalyticsView: null
        }
      });

      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('Last updated: No recent data')).toBeInTheDocument();
    });
  });
});