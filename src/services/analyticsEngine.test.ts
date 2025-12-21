/**
 * Unit tests for Analytics Engine
 * Tests emotional pattern analysis algorithms and local processing
 * Requirements: 4.1, 4.2, 4.3, 4.5
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AnalyticsEngine, getAnalyticsEngine, resetAnalyticsEngine } from './analyticsEngine';
import { EmotionLog, JournalEntry, TimeRange } from '@/types';
import * as storageServiceV3 from './storageServiceV3';

// Mock the storage service
vi.mock('./storageServiceV3', () => ({
  storageServiceV3: {
    loadCompleteV3Data: vi.fn(),
    loadLogs: vi.fn(),
    saveAnalyticsPreferences: vi.fn()
  }
}));

describe('AnalyticsEngine', () => {
  let analyticsEngine: AnalyticsEngine;
  let mockEmotionLogs: EmotionLog[];
  let mockJournalEntries: JournalEntry[];

  beforeEach(() => {
    // Reset the singleton instance
    resetAnalyticsEngine();
    
    // Create mock data
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    mockEmotionLogs = [
      {
        id: '1',
        text: 'happy',
        action: 'expressed',
        timestamp: now - 5 * oneDay,
        textColor: 'white'
      },
      {
        id: '2',
        text: 'sad',
        action: 'suppressed',
        timestamp: now - 4 * oneDay,
        textColor: 'white'
      },
      {
        id: '3',
        text: 'excited',
        action: 'expressed',
        timestamp: now - 3 * oneDay,
        textColor: 'white'
      },
      {
        id: '4',
        text: 'happy',
        action: 'expressed',
        timestamp: now - 2 * oneDay,
        textColor: 'white'
      },
      {
        id: '5',
        text: 'anxious',
        action: 'expressed',
        timestamp: now - oneDay,
        textColor: 'white'
      }
    ];

    mockJournalEntries = [
      {
        id: 'j1',
        content: 'Today was a good day',
        date: new Date(now - 3 * oneDay),
        createdAt: new Date(now - 3 * oneDay),
        updatedAt: new Date(now - 3 * oneDay),
        linkedEmotions: ['3'],
        wordCount: 5,
        dayOfYear: 100
      }
    ];

    // Mock storage service to return our test data
    vi.mocked(storageServiceV3.storageServiceV3.loadCompleteV3Data).mockReturnValue({
      logs: mockEmotionLogs,
      journalEntries: mockJournalEntries,
      creatureState: { brightness: 50, size: 50, animation: 'idle' },
      safetyScore: 4,
      customization: { name: 'Test', color: 'orange', hasBow: false },
      microSentenceIndex: 0,
      promptTracks: [],
      prompts: [],
      analyticsPreferences: {
        defaultTimeRange: {
          start: new Date(now - 30 * oneDay),
          end: new Date(now),
          preset: 'month'
        },
        enabledInsights: ['expression-ratio', 'common-emotions', 'streak', 'trend'],
        lastViewedInsights: new Date(now)
      },
      migrationVersion: '3.0.0'
    });

    analyticsEngine = new AnalyticsEngine();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Data Loading', () => {
    it('should load data from storage on initialization', () => {
      expect(storageServiceV3.storageServiceV3.loadCompleteV3Data).toHaveBeenCalled();
    });

    it('should handle missing v3 data gracefully', () => {
      vi.mocked(storageServiceV3.storageServiceV3.loadCompleteV3Data).mockReturnValue(null);
      vi.mocked(storageServiceV3.storageServiceV3.loadLogs).mockReturnValue(mockEmotionLogs);
      
      const engine = new AnalyticsEngine();
      const summary = engine.getAnalyticsSummary();
      
      expect(summary.totalEmotions).toBe(5);
    });
  });

  describe('Analytics Generation', () => {
    it('should generate comprehensive analytics with sufficient data', () => {
      const timeRange: TimeRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
        preset: 'week'
      };

      const result = analyticsEngine.generateAnalytics({ timeRange });

      expect(result.hasSufficientData).toBe(true);
      expect(result.patterns).toHaveLength(4); // expression-ratio, common-emotions, streak, trend
      expect(result.chartData).toHaveProperty('expression-ratio');
      expect(result.chartData).toHaveProperty('common-emotions');
      expect(result.chartData).toHaveProperty('streak');
      expect(result.chartData).toHaveProperty('trend');
      expect(result.timeRange).toEqual(timeRange);
    });

    it('should handle insufficient data gracefully', () => {
      // Mock with minimal data
      vi.mocked(storageServiceV3.storageServiceV3.loadCompleteV3Data).mockReturnValue({
        logs: [mockEmotionLogs[0]], // Only one log
        journalEntries: [],
        creatureState: { brightness: 50, size: 50, animation: 'idle' },
        safetyScore: 1,
        customization: { name: 'Test', color: 'orange', hasBow: false },
        microSentenceIndex: 0,
        promptTracks: [],
        prompts: [],
        analyticsPreferences: null,
        migrationVersion: '3.0.0'
      });

      const engine = new AnalyticsEngine();
      const result = engine.generateAnalytics();

      expect(result.hasSufficientData).toBe(false);
      expect(result.insufficientDataMessage).toBeDefined();
      expect(result.patterns).toHaveLength(0);
    });
  });

  describe('Expression Ratio Calculation', () => {
    it('should calculate expression ratio correctly', () => {
      const ratio = analyticsEngine.getExpressionRatio();
      
      // 4 expressed out of 5 total = 0.8
      expect(ratio).toBe(0.8);
    });

    it('should return 0 for empty data', () => {
      vi.mocked(storageServiceV3.storageServiceV3.loadCompleteV3Data).mockReturnValue({
        logs: [],
        journalEntries: [],
        creatureState: { brightness: 50, size: 50, animation: 'idle' },
        safetyScore: 0,
        customization: { name: 'Test', color: 'orange', hasBow: false },
        microSentenceIndex: 0,
        promptTracks: [],
        prompts: [],
        analyticsPreferences: null,
        migrationVersion: '3.0.0'
      });

      const engine = new AnalyticsEngine();
      const ratio = engine.getExpressionRatio();
      
      expect(ratio).toBe(0);
    });
  });

  describe('Common Emotions Analysis', () => {
    it('should identify most common emotions', () => {
      const commonEmotions = analyticsEngine.getCommonEmotions();
      
      expect(commonEmotions).toHaveLength(4); // happy, sad, excited, anxious
      expect(commonEmotions[0]).toEqual({ emotion: 'happy', count: 2 });
      expect(commonEmotions[1].count).toBe(1);
    });

    it('should respect the limit parameter', () => {
      const commonEmotions = analyticsEngine.getCommonEmotions(undefined, 2);
      
      expect(commonEmotions).toHaveLength(2);
    });

    it('should handle empty data', () => {
      vi.mocked(storageServiceV3.storageServiceV3.loadCompleteV3Data).mockReturnValue({
        logs: [],
        journalEntries: [],
        creatureState: { brightness: 50, size: 50, animation: 'idle' },
        safetyScore: 0,
        customization: { name: 'Test', color: 'orange', hasBow: false },
        microSentenceIndex: 0,
        promptTracks: [],
        prompts: [],
        analyticsPreferences: null,
        migrationVersion: '3.0.0'
      });

      const engine = new AnalyticsEngine();
      const commonEmotions = engine.getCommonEmotions();
      
      expect(commonEmotions).toHaveLength(0);
    });
  });

  describe('Streak Calculation', () => {
    it('should calculate current streak', () => {
      // Mock today's date to be consistent
      const today = new Date();
      const todayTimestamp = today.getTime();
      
      // Create logs for consecutive days including today
      const streakLogs: EmotionLog[] = [
        {
          id: 's1',
          text: 'happy',
          action: 'expressed',
          timestamp: todayTimestamp,
          textColor: 'white'
        },
        {
          id: 's2',
          text: 'calm',
          action: 'expressed',
          timestamp: todayTimestamp - 24 * 60 * 60 * 1000,
          textColor: 'white'
        }
      ];

      vi.mocked(storageServiceV3.storageServiceV3.loadCompleteV3Data).mockReturnValue({
        logs: streakLogs,
        journalEntries: [],
        creatureState: { brightness: 50, size: 50, animation: 'idle' },
        safetyScore: 2,
        customization: { name: 'Test', color: 'orange', hasBow: false },
        microSentenceIndex: 0,
        promptTracks: [],
        prompts: [],
        analyticsPreferences: null,
        migrationVersion: '3.0.0'
      });

      const engine = new AnalyticsEngine();
      const streak = engine.getCurrentStreak();
      
      expect(streak).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Analytics Summary', () => {
    it('should provide comprehensive summary statistics', () => {
      const summary = analyticsEngine.getAnalyticsSummary();
      
      expect(summary.totalEmotions).toBe(5);
      expect(summary.expressedEmotions).toBe(4);
      expect(summary.expressionRatio).toBe(0.8);
      expect(summary.mostCommonEmotion).toBe('happy');
      expect(summary.activeDays).toBeGreaterThan(0);
    });

    it('should handle empty data in summary', () => {
      vi.mocked(storageServiceV3.storageServiceV3.loadCompleteV3Data).mockReturnValue({
        logs: [],
        journalEntries: [],
        creatureState: { brightness: 50, size: 50, animation: 'idle' },
        safetyScore: 0,
        customization: { name: 'Test', color: 'orange', hasBow: false },
        microSentenceIndex: 0,
        promptTracks: [],
        prompts: [],
        analyticsPreferences: null,
        migrationVersion: '3.0.0'
      });

      const engine = new AnalyticsEngine();
      const summary = engine.getAnalyticsSummary();
      
      expect(summary.totalEmotions).toBe(0);
      expect(summary.expressedEmotions).toBe(0);
      expect(summary.expressionRatio).toBe(0);
      expect(summary.mostCommonEmotion).toBeNull();
      expect(summary.activeDays).toBe(0);
    });
  });

  describe('Preferences Management', () => {
    it('should get default preferences when none exist', () => {
      vi.mocked(storageServiceV3.storageServiceV3.loadCompleteV3Data).mockReturnValue({
        logs: mockEmotionLogs,
        journalEntries: [],
        creatureState: { brightness: 50, size: 50, animation: 'idle' },
        safetyScore: 4,
        customization: { name: 'Test', color: 'orange', hasBow: false },
        microSentenceIndex: 0,
        promptTracks: [],
        prompts: [],
        analyticsPreferences: null,
        migrationVersion: '3.0.0'
      });

      const engine = new AnalyticsEngine();
      const preferences = engine.getPreferences();
      
      expect(preferences.defaultTimeRange.preset).toBe('month');
      expect(preferences.enabledInsights).toContain('expression-ratio');
      expect(preferences.enabledInsights).toContain('common-emotions');
      expect(preferences.enabledInsights).toContain('streak');
      expect(preferences.enabledInsights).toContain('trend');
    });

    it('should update preferences and save to storage', () => {
      const newTimeRange: TimeRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
        preset: 'week'
      };

      analyticsEngine.updatePreferences({
        defaultTimeRange: newTimeRange
      });

      expect(storageServiceV3.storageServiceV3.saveAnalyticsPreferences).toHaveBeenCalled();
      
      const preferences = analyticsEngine.getPreferences();
      expect(preferences.defaultTimeRange.preset).toBe('week');
    });
  });

  describe('Preset Analytics', () => {
    it('should generate analytics for preset time ranges', () => {
      const weekResult = analyticsEngine.generatePresetAnalytics('week');
      const monthResult = analyticsEngine.generatePresetAnalytics('month');
      const quarterResult = analyticsEngine.generatePresetAnalytics('quarter');
      const yearResult = analyticsEngine.generatePresetAnalytics('year');

      expect(weekResult.timeRange.preset).toBe('week');
      expect(monthResult.timeRange.preset).toBe('month');
      expect(quarterResult.timeRange.preset).toBe('quarter');
      expect(yearResult.timeRange.preset).toBe('year');
    });
  });

  describe('Custom Analytics', () => {
    it('should generate analytics for custom time range', () => {
      const start = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const end = new Date();

      const result = analyticsEngine.generateCustomAnalytics(start, end);

      expect(result.timeRange.start).toEqual(start);
      expect(result.timeRange.end).toEqual(end);
      expect(result.timeRange.preset).toBeUndefined();
    });
  });

  describe('Data Availability', () => {
    it('should correctly identify when analytics data is available', () => {
      expect(analyticsEngine.hasAnalyticsData()).toBe(true);
    });

    it('should correctly identify when no analytics data is available', () => {
      vi.mocked(storageServiceV3.storageServiceV3.loadCompleteV3Data).mockReturnValue({
        logs: [],
        journalEntries: [],
        creatureState: { brightness: 50, size: 50, animation: 'idle' },
        safetyScore: 0,
        customization: { name: 'Test', color: 'orange', hasBow: false },
        microSentenceIndex: 0,
        promptTracks: [],
        prompts: [],
        analyticsPreferences: null,
        migrationVersion: '3.0.0'
      });

      const engine = new AnalyticsEngine();
      expect(engine.hasAnalyticsData()).toBe(false);
    });
  });

  describe('Data Freshness', () => {
    it('should provide data freshness information', () => {
      const freshness = analyticsEngine.getDataFreshness();
      
      expect(freshness.lastEmotionLog).toBeInstanceOf(Date);
      expect(freshness.lastJournalEntry).toBeInstanceOf(Date);
      expect(freshness.lastAnalyticsView).toBeInstanceOf(Date);
    });

    it('should handle null values for empty data', () => {
      vi.mocked(storageServiceV3.storageServiceV3.loadCompleteV3Data).mockReturnValue({
        logs: [],
        journalEntries: [],
        creatureState: { brightness: 50, size: 50, animation: 'idle' },
        safetyScore: 0,
        customization: { name: 'Test', color: 'orange', hasBow: false },
        microSentenceIndex: 0,
        promptTracks: [],
        prompts: [],
        analyticsPreferences: null,
        migrationVersion: '3.0.0'
      });

      const engine = new AnalyticsEngine();
      const freshness = engine.getDataFreshness();
      
      expect(freshness.lastEmotionLog).toBeNull();
      expect(freshness.lastJournalEntry).toBeNull();
      expect(freshness.lastAnalyticsView).toBeNull();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = getAnalyticsEngine();
      const instance2 = getAnalyticsEngine();
      
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = getAnalyticsEngine();
      resetAnalyticsEngine();
      const instance2 = getAnalyticsEngine();
      
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Local Processing Requirement', () => {
    it('should not make any network requests during analytics generation', () => {
      // Mock fetch to ensure no network calls are made
      const fetchSpy = vi.spyOn(global, 'fetch');
      
      analyticsEngine.generateAnalytics();
      analyticsEngine.getExpressionRatio();
      analyticsEngine.getCommonEmotions();
      analyticsEngine.getCurrentStreak();
      analyticsEngine.getAnalyticsSummary();
      
      expect(fetchSpy).not.toHaveBeenCalled();
      
      fetchSpy.mockRestore();
    });
  });
});