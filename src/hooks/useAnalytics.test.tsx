/**
 * Tests for useAnalytics React hook
 * Requirements: 4.1, 4.2, 4.3, 4.5
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAnalytics, useAnalyticsSummary, useCurrentStreak } from './useAnalytics';
import { EmotionLog, TimeRange } from '@/types';
import * as analyticsEngineModule from '@/services/analyticsEngine';

// Mock the analytics engine
const mockAnalyticsEngine = {
  generateAnalytics: vi.fn(),
  generatePresetAnalytics: vi.fn(),
  generateCustomAnalytics: vi.fn(),
  refreshData: vi.fn(),
  getExpressionRatio: vi.fn(),
  getCommonEmotions: vi.fn(),
  getCurrentStreak: vi.fn(),
  getAnalyticsSummary: vi.fn(),
  getPreferences: vi.fn(),
  updatePreferences: vi.fn(),
  hasAnalyticsData: vi.fn(),
  getDataFreshness: vi.fn()
};

vi.mock('@/services/analyticsEngine', () => ({
  getAnalyticsEngine: () => mockAnalyticsEngine,
  resetAnalyticsEngine: vi.fn()
}));

describe('useAnalytics', () => {
  const mockAnalyticsResult = {
    patterns: [],
    chartData: {},
    hasSufficientData: true,
    timeRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
      preset: 'month' as const
    },
    dataCount: {
      emotionLogs: 5,
      journalEntries: 2,
      totalDays: 7
    }
  };

  const mockPreferences = {
    defaultTimeRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
      preset: 'month' as const
    },
    enabledInsights: ['expression-ratio', 'common-emotions', 'streak', 'trend'],
    lastViewedInsights: new Date()
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
    // Reset all mocks
    vi.clearAllMocks();
    
    // Set up default mock returns
    mockAnalyticsEngine.generateAnalytics.mockReturnValue(mockAnalyticsResult);
    mockAnalyticsEngine.generatePresetAnalytics.mockReturnValue(mockAnalyticsResult);
    mockAnalyticsEngine.generateCustomAnalytics.mockReturnValue(mockAnalyticsResult);
    mockAnalyticsEngine.getPreferences.mockReturnValue(mockPreferences);
    mockAnalyticsEngine.getExpressionRatio.mockReturnValue(0.8);
    mockAnalyticsEngine.getCommonEmotions.mockReturnValue([
      { emotion: 'happy', count: 3 },
      { emotion: 'calm', count: 2 }
    ]);
    mockAnalyticsEngine.getCurrentStreak.mockReturnValue(3);
    mockAnalyticsEngine.getAnalyticsSummary.mockReturnValue(mockSummary);
    mockAnalyticsEngine.hasAnalyticsData.mockReturnValue(true);
    mockAnalyticsEngine.getDataFreshness.mockReturnValue(mockDataFreshness);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should initialize with correct default state', async () => {
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.preferences).toEqual(mockPreferences);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasData).toBe(true);
      expect(result.current.dataFreshness).toEqual(mockDataFreshness);
    });

    it('should load initial analytics when data is available', async () => {
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.analytics).toEqual(mockAnalyticsResult);
      });

      expect(mockAnalyticsEngine.generateAnalytics).toHaveBeenCalled();
    });

    it('should not load initial analytics when no data is available', async () => {
      mockAnalyticsEngine.hasAnalyticsData.mockReturnValue(false);

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.hasData).toBe(false);
      });

      expect(mockAnalyticsEngine.generateAnalytics).not.toHaveBeenCalled();
    });
  });

  describe('Analytics Generation', () => {
    it('should generate analytics with custom config', async () => {
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.analytics).toBeDefined();
      });

      const customConfig = { enabledPatterns: ['expression-ratio'] };

      await act(async () => {
        result.current.generateAnalytics(customConfig);
      });

      expect(mockAnalyticsEngine.generateAnalytics).toHaveBeenCalledWith(customConfig);
    });

    it('should generate preset analytics', async () => {
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.analytics).toBeDefined();
      });

      await act(async () => {
        result.current.generatePresetAnalytics('week');
      });

      expect(mockAnalyticsEngine.generatePresetAnalytics).toHaveBeenCalledWith('week');
    });

    it('should generate custom time range analytics', async () => {
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.analytics).toBeDefined();
      });

      const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = new Date();

      await act(async () => {
        result.current.generateCustomAnalytics(start, end);
      });

      expect(mockAnalyticsEngine.generateCustomAnalytics).toHaveBeenCalledWith(start, end);
    });

    it('should handle analytics generation errors', async () => {
      mockAnalyticsEngine.generateAnalytics.mockImplementation(() => {
        throw new Error('Analytics generation failed');
      });

      const { result } = renderHook(() => useAnalytics());

      await act(async () => {
        result.current.generateAnalytics();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Analytics generation failed');
        expect(result.current.analytics).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Quick Access Functions', () => {
    it('should provide expression ratio', async () => {
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.analytics).toBeDefined();
      });

      const ratio = result.current.getExpressionRatio();
      expect(ratio).toBe(0.8);
      expect(mockAnalyticsEngine.getExpressionRatio).toHaveBeenCalled();
    });

    it('should provide common emotions', async () => {
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.analytics).toBeDefined();
      });

      const emotions = result.current.getCommonEmotions();
      expect(emotions).toEqual([
        { emotion: 'happy', count: 3 },
        { emotion: 'calm', count: 2 }
      ]);
      expect(mockAnalyticsEngine.getCommonEmotions).toHaveBeenCalled();
    });

    it('should provide current streak', async () => {
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.analytics).toBeDefined();
      });

      const streak = result.current.getCurrentStreak();
      expect(streak).toBe(3);
      expect(mockAnalyticsEngine.getCurrentStreak).toHaveBeenCalled();
    });

    it('should provide analytics summary', async () => {
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.analytics).toBeDefined();
      });

      const summary = result.current.getAnalyticsSummary();
      expect(summary).toEqual(mockSummary);
      expect(mockAnalyticsEngine.getAnalyticsSummary).toHaveBeenCalled();
    });

    it('should handle errors in quick access functions gracefully', async () => {
      mockAnalyticsEngine.getExpressionRatio.mockImplementation(() => {
        throw new Error('Failed to get ratio');
      });

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.analytics).toBeDefined();
      });

      const ratio = result.current.getExpressionRatio();
      expect(ratio).toBe(0); // Should return default value
    });
  });

  describe('Preferences Management', () => {
    it('should update preferences', async () => {
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.preferences).toEqual(mockPreferences);
      });

      const newPreferences = {
        enabledInsights: ['expression-ratio', 'streak']
      };

      await act(async () => {
        result.current.updatePreferences(newPreferences);
      });

      expect(mockAnalyticsEngine.updatePreferences).toHaveBeenCalledWith(newPreferences);
      expect(mockAnalyticsEngine.getPreferences).toHaveBeenCalled();
    });

    it('should regenerate analytics when default time range changes', async () => {
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.analytics).toBeDefined();
      });

      // Clear the initial call
      mockAnalyticsEngine.generateAnalytics.mockClear();

      const newTimeRange: TimeRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
        preset: 'week'
      };

      await act(async () => {
        result.current.updatePreferences({ defaultTimeRange: newTimeRange });
      });

      expect(mockAnalyticsEngine.generateAnalytics).toHaveBeenCalled();
    });
  });

  describe('Data Refresh', () => {
    it('should refresh data and regenerate analytics', async () => {
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.analytics).toBeDefined();
      });

      // Clear the initial call
      mockAnalyticsEngine.generateAnalytics.mockClear();

      await act(async () => {
        result.current.refreshData();
      });

      expect(mockAnalyticsEngine.refreshData).toHaveBeenCalled();
      expect(mockAnalyticsEngine.generateAnalytics).toHaveBeenCalled();
    });

    it('should handle refresh errors gracefully', async () => {
      mockAnalyticsEngine.refreshData.mockImplementation(() => {
        throw new Error('Refresh failed');
      });

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.analytics).toBeDefined();
      });

      await act(async () => {
        result.current.refreshData();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Refresh failed');
      });
    });
  });

  describe('Auto Refresh', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto refresh when enabled', async () => {
      const { result } = renderHook(() => 
        useAnalytics({ autoRefresh: true, refreshInterval: 1000 })
      );

      await waitFor(() => {
        expect(result.current.analytics).toBeDefined();
      });

      // Clear initial calls
      mockAnalyticsEngine.refreshData.mockClear();

      // Fast forward time
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockAnalyticsEngine.refreshData).toHaveBeenCalled();
    });

    it('should not auto refresh when disabled', async () => {
      const { result } = renderHook(() => 
        useAnalytics({ autoRefresh: false })
      );

      await waitFor(() => {
        expect(result.current.analytics).toBeDefined();
      });

      // Clear initial calls
      mockAnalyticsEngine.refreshData.mockClear();

      // Fast forward time
      act(() => {
        vi.advanceTimersByTime(60000);
      });

      expect(mockAnalyticsEngine.refreshData).not.toHaveBeenCalled();
    });
  });
});

describe('useAnalyticsSummary', () => {
  const mockSummary = {
    totalEmotions: 10,
    expressedEmotions: 8,
    expressionRatio: 0.8,
    currentStreak: 3,
    mostCommonEmotion: 'happy',
    activeDays: 5
  };

  beforeEach(() => {
    mockAnalyticsEngine.getAnalyticsSummary.mockReturnValue(mockSummary);
  });

  it('should provide analytics summary', () => {
    const { result } = renderHook(() => useAnalyticsSummary());

    expect(result.current.summary).toEqual(mockSummary);
    expect(mockAnalyticsEngine.getAnalyticsSummary).toHaveBeenCalled();
  });

  it('should refresh summary', () => {
    const { result } = renderHook(() => useAnalyticsSummary());

    act(() => {
      result.current.refreshSummary();
    });

    expect(mockAnalyticsEngine.refreshData).toHaveBeenCalled();
    expect(mockAnalyticsEngine.getAnalyticsSummary).toHaveBeenCalledTimes(2); // Initial + refresh
  });

  it('should handle errors gracefully', () => {
    mockAnalyticsEngine.getAnalyticsSummary.mockImplementation(() => {
      throw new Error('Summary failed');
    });

    const { result } = renderHook(() => useAnalyticsSummary());

    expect(result.current.summary).toEqual({
      totalEmotions: 0,
      expressedEmotions: 0,
      expressionRatio: 0,
      currentStreak: 0,
      mostCommonEmotion: null,
      activeDays: 0
    });
  });
});

describe('useCurrentStreak', () => {
  beforeEach(() => {
    mockAnalyticsEngine.getCurrentStreak.mockReturnValue(5);
  });

  it('should provide current streak', () => {
    const { result } = renderHook(() => useCurrentStreak());

    expect(result.current.streak).toBe(5);
    expect(mockAnalyticsEngine.getCurrentStreak).toHaveBeenCalled();
  });

  it('should refresh streak', () => {
    const { result } = renderHook(() => useCurrentStreak());

    act(() => {
      result.current.refreshStreak();
    });

    expect(mockAnalyticsEngine.refreshData).toHaveBeenCalled();
    expect(mockAnalyticsEngine.getCurrentStreak).toHaveBeenCalledTimes(2); // Initial + refresh
  });

  it('should handle errors gracefully', () => {
    mockAnalyticsEngine.getCurrentStreak.mockImplementation(() => {
      throw new Error('Streak failed');
    });

    const { result } = renderHook(() => useCurrentStreak());

    expect(result.current.streak).toBe(0);
  });
});