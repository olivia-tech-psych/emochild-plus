/**
 * React hook for accessing analytics engine functionality
 * Provides easy access to emotional pattern analysis in React components
 * Requirements: 4.1, 4.2, 4.3, 4.5
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  getAnalyticsEngine, 
  AnalyticsResult, 
  AnalyticsConfig 
} from '@/services/analyticsEngine';
import { 
  TimeRange, 
  AnalyticsPreferences, 
  EmotionalPattern 
} from '@/types';

/**
 * Hook return type
 */
export interface UseAnalyticsReturn {
  // Analytics data
  analytics: AnalyticsResult | null;
  isLoading: boolean;
  error: string | null;
  
  // Analytics functions
  generateAnalytics: (config?: AnalyticsConfig) => void;
  generatePresetAnalytics: (preset: 'week' | 'month' | 'quarter' | 'year') => void;
  generateCustomAnalytics: (start: Date, end: Date) => void;
  refreshData: () => void;
  
  // Quick access functions
  getExpressionRatio: (timeRange?: TimeRange) => number;
  getCommonEmotions: (timeRange?: TimeRange, limit?: number) => Array<{ emotion: string; count: number }>;
  getCurrentStreak: () => number;
  getAnalyticsSummary: (timeRange?: TimeRange) => {
    totalEmotions: number;
    expressedEmotions: number;
    expressionRatio: number;
    currentStreak: number;
    mostCommonEmotion: string | null;
    activeDays: number;
  };
  
  // Preferences
  preferences: AnalyticsPreferences;
  updatePreferences: (newPreferences: Partial<AnalyticsPreferences>) => void;
  
  // Data availability
  hasData: boolean;
  dataFreshness: {
    lastEmotionLog: Date | null;
    lastJournalEntry: Date | null;
    lastAnalyticsView: Date | null;
  };
}

/**
 * Hook options
 */
export interface UseAnalyticsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  defaultConfig?: AnalyticsConfig;
}

/**
 * React hook for analytics functionality
 * Requirements: 4.1, 4.2, 4.3, 4.5
 */
export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const {
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
    defaultConfig = {}
  } = options;

  // State
  const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<AnalyticsPreferences | null>(null);

  // Get analytics engine instance
  const analyticsEngine = useMemo(() => getAnalyticsEngine(), []);

  // Load initial preferences
  useEffect(() => {
    try {
      const prefs = analyticsEngine.getPreferences();
      setPreferences(prefs);
    } catch (err) {
      console.error('Failed to load analytics preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    }
  }, [analyticsEngine]);

  // Generate analytics with error handling
  const generateAnalytics = useCallback(async (config: AnalyticsConfig = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Requirement 4.2: All processing occurs locally
      const result = analyticsEngine.generateAnalytics({ ...defaultConfig, ...config });
      setAnalytics(result);
    } catch (err) {
      console.error('Failed to generate analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate analytics');
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  }, [analyticsEngine, defaultConfig]);

  // Generate preset analytics
  const generatePresetAnalytics = useCallback(async (preset: 'week' | 'month' | 'quarter' | 'year') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = analyticsEngine.generatePresetAnalytics(preset);
      setAnalytics(result);
    } catch (err) {
      console.error('Failed to generate preset analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate analytics');
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  }, [analyticsEngine]);

  // Generate custom analytics
  const generateCustomAnalytics = useCallback(async (start: Date, end: Date) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = analyticsEngine.generateCustomAnalytics(start, end);
      setAnalytics(result);
    } catch (err) {
      console.error('Failed to generate custom analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate analytics');
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  }, [analyticsEngine]);

  // Refresh data from storage
  const refreshData = useCallback(() => {
    try {
      analyticsEngine.refreshData();
      // Regenerate analytics with current config if we have analytics loaded
      if (analytics) {
        generateAnalytics();
      }
    } catch (err) {
      console.error('Failed to refresh analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    }
  }, [analyticsEngine, analytics, generateAnalytics]);

  // Quick access functions with error handling
  const getExpressionRatio = useCallback((timeRange?: TimeRange): number => {
    try {
      return analyticsEngine.getExpressionRatio(timeRange);
    } catch (err) {
      console.error('Failed to get expression ratio:', err);
      return 0;
    }
  }, [analyticsEngine]);

  const getCommonEmotions = useCallback((timeRange?: TimeRange, limit?: number) => {
    try {
      return analyticsEngine.getCommonEmotions(timeRange, limit);
    } catch (err) {
      console.error('Failed to get common emotions:', err);
      return [];
    }
  }, [analyticsEngine]);

  const getCurrentStreak = useCallback((): number => {
    try {
      return analyticsEngine.getCurrentStreak();
    } catch (err) {
      console.error('Failed to get current streak:', err);
      return 0;
    }
  }, [analyticsEngine]);

  const getAnalyticsSummary = useCallback((timeRange?: TimeRange) => {
    try {
      return analyticsEngine.getAnalyticsSummary(timeRange);
    } catch (err) {
      console.error('Failed to get analytics summary:', err);
      return {
        totalEmotions: 0,
        expressedEmotions: 0,
        expressionRatio: 0,
        currentStreak: 0,
        mostCommonEmotion: null,
        activeDays: 0
      };
    }
  }, [analyticsEngine]);

  // Update preferences
  const updatePreferences = useCallback((newPreferences: Partial<AnalyticsPreferences>) => {
    try {
      analyticsEngine.updatePreferences(newPreferences);
      const updatedPrefs = analyticsEngine.getPreferences();
      setPreferences(updatedPrefs);
      
      // Regenerate analytics if default time range changed
      if (newPreferences.defaultTimeRange && analytics) {
        generateAnalytics();
      }
    } catch (err) {
      console.error('Failed to update preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    }
  }, [analyticsEngine, analytics, generateAnalytics]);

  // Get data availability and freshness
  const hasData = useMemo(() => {
    try {
      return analyticsEngine.hasAnalyticsData();
    } catch (err) {
      console.error('Failed to check data availability:', err);
      return false;
    }
  }, [analyticsEngine]);

  const dataFreshness = useMemo(() => {
    try {
      return analyticsEngine.getDataFreshness();
    } catch (err) {
      console.error('Failed to get data freshness:', err);
      return {
        lastEmotionLog: null,
        lastJournalEntry: null,
        lastAnalyticsView: null
      };
    }
  }, [analyticsEngine]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) {
      return;
    }

    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshData]);

  // Load initial analytics on mount
  useEffect(() => {
    if (preferences && hasData) {
      generateAnalytics(defaultConfig);
    }
  }, [preferences, hasData, generateAnalytics, defaultConfig]);

  return {
    // Analytics data
    analytics,
    isLoading,
    error,
    
    // Analytics functions
    generateAnalytics,
    generatePresetAnalytics,
    generateCustomAnalytics,
    refreshData,
    
    // Quick access functions
    getExpressionRatio,
    getCommonEmotions,
    getCurrentStreak,
    getAnalyticsSummary,
    
    // Preferences
    preferences: preferences || {
      defaultTimeRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
        preset: 'month'
      },
      enabledInsights: ['expression-ratio', 'common-emotions', 'streak', 'trend'],
      lastViewedInsights: new Date()
    },
    updatePreferences,
    
    // Data availability
    hasData,
    dataFreshness
  };
}

/**
 * Hook for getting analytics summary only (lighter weight)
 * Requirements: 4.1, 4.5
 */
export function useAnalyticsSummary(timeRange?: TimeRange) {
  const analyticsEngine = useMemo(() => getAnalyticsEngine(), []);
  
  const [summary, setSummary] = useState(() => {
    try {
      return analyticsEngine.getAnalyticsSummary(timeRange);
    } catch (err) {
      console.error('Failed to get analytics summary:', err);
      return {
        totalEmotions: 0,
        expressedEmotions: 0,
        expressionRatio: 0,
        currentStreak: 0,
        mostCommonEmotion: null,
        activeDays: 0
      };
    }
  });

  const refreshSummary = useCallback(() => {
    try {
      analyticsEngine.refreshData();
      const newSummary = analyticsEngine.getAnalyticsSummary(timeRange);
      setSummary(newSummary);
    } catch (err) {
      console.error('Failed to refresh analytics summary:', err);
    }
  }, [analyticsEngine, timeRange]);

  return {
    summary,
    refreshSummary
  };
}

/**
 * Hook for getting current streak only (very lightweight)
 * Requirements: 4.1, 4.3, 4.5
 */
export function useCurrentStreak() {
  const analyticsEngine = useMemo(() => getAnalyticsEngine(), []);
  
  const [streak, setStreak] = useState(() => {
    try {
      return analyticsEngine.getCurrentStreak();
    } catch (err) {
      console.error('Failed to get current streak:', err);
      return 0;
    }
  });

  const refreshStreak = useCallback(() => {
    try {
      analyticsEngine.refreshData();
      const newStreak = analyticsEngine.getCurrentStreak();
      setStreak(newStreak);
    } catch (err) {
      console.error('Failed to refresh current streak:', err);
    }
  }, [analyticsEngine]);

  return {
    streak,
    refreshStreak
  };
}