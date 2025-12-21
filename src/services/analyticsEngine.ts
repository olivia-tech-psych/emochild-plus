/**
 * Analytics Engine for EmoChild v3
 * Implements emotional pattern analysis algorithms with local processing
 * Requirements: 4.1, 4.2, 4.3, 4.5
 */

import { 
  EmotionLog, 
  JournalEntry, 
  EmotionalPattern, 
  ChartData, 
  TimeRange, 
  PatternData,
  AnalyticsPreferences 
} from '@/types';
import { 
  generateAllPatterns,
  hasSufficientData,
  getInsufficientDataMessage,
  generateChartData,
  getPresetTimeRanges,
  createTimeRange,
  filterByTimeRange
} from '@/utils/analyticsUtils';
import { storageServiceV3 } from './storageServiceV3';

/**
 * Analytics engine result interface
 */
export interface AnalyticsResult {
  patterns: EmotionalPattern[];
  chartData: Record<string, ChartData>;
  hasSufficientData: boolean;
  insufficientDataMessage?: string;
  timeRange: TimeRange;
  dataCount: {
    emotionLogs: number;
    journalEntries: number;
    totalDays: number;
  };
}

/**
 * Analytics engine configuration
 */
export interface AnalyticsConfig {
  timeRange?: TimeRange;
  enabledPatterns?: string[];
  includeJournalData?: boolean;
}

/**
 * Main Analytics Engine class
 * Handles all emotional pattern analysis with local processing
 * Requirements: 4.1, 4.2, 4.3, 4.5
 */
export class AnalyticsEngine {
  private emotionLogs: EmotionLog[] = [];
  private journalEntries: JournalEntry[] = [];
  private preferences: AnalyticsPreferences | null = null;

  /**
   * Initialize the analytics engine with data
   * Requirements: 4.2 - All processing occurs locally
   */
  constructor() {
    this.loadData();
  }

  /**
   * Load data from storage
   * Requirements: 4.2 - Local data processing only
   */
  private loadData(): void {
    try {
      // Load emotion logs from v2 storage (backward compatibility)
      const v3Data = storageServiceV3.loadCompleteV3Data();
      
      if (v3Data) {
        this.emotionLogs = v3Data.logs || [];
        this.journalEntries = v3Data.journalEntries || [];
        this.preferences = v3Data.analyticsPreferences;
      } else {
        // Fallback to v2 data only
        this.emotionLogs = storageServiceV3.loadLogs();
        this.journalEntries = [];
        this.preferences = null;
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      this.emotionLogs = [];
      this.journalEntries = [];
      this.preferences = null;
    }
  }

  /**
   * Refresh data from storage
   * Requirements: 4.2 - Local data processing
   */
  public refreshData(): void {
    this.loadData();
  }

  /**
   * Get default analytics preferences
   * Requirements: 4.5 - Default time range and settings
   */
  private getDefaultPreferences(): AnalyticsPreferences {
    const presets = getPresetTimeRanges();
    
    return {
      defaultTimeRange: presets.month,
      enabledInsights: ['expression-ratio', 'common-emotions', 'streak', 'trend'],
      lastViewedInsights: new Date()
    };
  }

  /**
   * Get current analytics preferences
   * Requirements: 4.5 - User preferences for analytics
   */
  public getPreferences(): AnalyticsPreferences {
    return this.preferences || this.getDefaultPreferences();
  }

  /**
   * Update analytics preferences
   * Requirements: 4.5 - Save user preferences
   */
  public updatePreferences(newPreferences: Partial<AnalyticsPreferences>): void {
    const currentPrefs = this.getPreferences();
    const updatedPrefs: AnalyticsPreferences = {
      ...currentPrefs,
      ...newPreferences,
      lastViewedInsights: new Date()
    };
    
    this.preferences = updatedPrefs;
    storageServiceV3.saveAnalyticsPreferences(updatedPrefs);
  }

  /**
   * Generate comprehensive analytics for a time range
   * Requirements: 4.1, 4.2, 4.3, 4.5
   */
  public generateAnalytics(config: AnalyticsConfig = {}): AnalyticsResult {
    // Requirement 4.2: All processing occurs locally without network requests
    const preferences = this.getPreferences();
    const timeRange = config.timeRange || preferences.defaultTimeRange;
    const enabledPatterns = config.enabledPatterns || preferences.enabledInsights;
    const includeJournalData = config.includeJournalData !== false;

    // Filter data by time range
    const filteredLogs = filterByTimeRange(this.emotionLogs, timeRange);
    const filteredJournalEntries = includeJournalData 
      ? filterByTimeRange(this.journalEntries, timeRange)
      : [];

    // Check if we have sufficient data for meaningful analytics
    const sufficient = hasSufficientData(filteredLogs, timeRange);
    
    let patterns: EmotionalPattern[] = [];
    let chartData: Record<string, ChartData> = {};

    if (sufficient) {
      // Generate all patterns using local processing
      // Requirements: 4.1, 4.3 - Calculate expression ratios, emotion frequency, and trends
      const allPatterns = generateAllPatterns(filteredLogs, filteredJournalEntries, timeRange);
      
      // Filter patterns based on enabled insights
      patterns = allPatterns.filter(pattern => enabledPatterns.includes(pattern.type));
      
      // Generate chart data for each pattern
      // Requirement 4.3 - Data visualizations with pastel colors
      patterns.forEach(pattern => {
        chartData[pattern.type] = generateChartData(pattern);
      });
    }

    // Calculate data counts for summary
    const uniqueDays = new Set([
      ...filteredLogs.map(log => new Date(log.timestamp).toDateString()),
      ...filteredJournalEntries.map(entry => entry.date.toDateString())
    ]).size;

    const result: AnalyticsResult = {
      patterns,
      chartData,
      hasSufficientData: sufficient,
      insufficientDataMessage: sufficient ? undefined : getInsufficientDataMessage(filteredLogs, timeRange),
      timeRange,
      dataCount: {
        emotionLogs: filteredLogs.length,
        journalEntries: filteredJournalEntries.length,
        totalDays: uniqueDays
      }
    };

    // Update last viewed insights timestamp
    this.updatePreferences({ lastViewedInsights: new Date() });

    return result;
  }

  /**
   * Generate analytics for preset time ranges
   * Requirements: 4.5 - Preset time ranges (week, month, quarter, year)
   */
  public generatePresetAnalytics(preset: 'week' | 'month' | 'quarter' | 'year'): AnalyticsResult {
    const presets = getPresetTimeRanges();
    const timeRange = presets[preset];
    
    return this.generateAnalytics({ timeRange });
  }

  /**
   * Generate analytics for custom time range
   * Requirements: 4.1, 4.5 - Custom time range selection
   */
  public generateCustomAnalytics(start: Date, end: Date): AnalyticsResult {
    const timeRange = createTimeRange(start, end);
    return this.generateAnalytics({ timeRange });
  }

  /**
   * Get expression ratio for a specific time range
   * Requirements: 4.1, 4.3 - Expression ratios calculation
   */
  public getExpressionRatio(timeRange?: TimeRange): number {
    const range = timeRange || this.getPreferences().defaultTimeRange;
    const filteredLogs = filterByTimeRange(this.emotionLogs, range);
    
    const expressed = filteredLogs.filter(log => log.action === 'expressed').length;
    const total = filteredLogs.length;
    
    return total > 0 ? expressed / total : 0;
  }

  /**
   * Get most common emotions for a time range
   * Requirements: 4.1, 4.3 - Emotion frequency analysis
   */
  public getCommonEmotions(timeRange?: TimeRange, limit: number = 5): Array<{ emotion: string; count: number }> {
    const range = timeRange || this.getPreferences().defaultTimeRange;
    const filteredLogs = filterByTimeRange(this.emotionLogs, range);
    
    const emotionCounts: Record<string, number> = {};
    
    filteredLogs.forEach(log => {
      const emotion = log.text.toLowerCase().trim();
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });
    
    return Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([emotion, count]) => ({ emotion, count }));
  }

  /**
   * Get current emotional expression streak
   * Requirements: 4.1, 4.3, 4.5 - Streak calculations and celebrations
   */
  public getCurrentStreak(): number {
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const timeRange = createTimeRange(oneWeekAgo, today);
    
    const filteredLogs = filterByTimeRange(this.emotionLogs, timeRange);
    
    // Group logs by day
    const logsByDay: Record<string, EmotionLog[]> = {};
    
    filteredLogs.forEach(log => {
      const date = new Date(log.timestamp);
      const dayKey = date.toISOString().split('T')[0];
      
      if (!logsByDay[dayKey]) {
        logsByDay[dayKey] = [];
      }
      logsByDay[dayKey].push(log);
    });
    
    // Find days with expressed emotions
    const daysWithExpressed = Object.entries(logsByDay)
      .filter(([, dayLogs]) => dayLogs.some(log => log.action === 'expressed'))
      .map(([day]) => day)
      .sort();
    
    // Calculate current streak from today backwards
    const todayKey = today.toISOString().split('T')[0];
    const todayIndex = daysWithExpressed.indexOf(todayKey);
    
    if (todayIndex === -1) {
      return 0;
    }
    
    let streak = 1;
    for (let i = todayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(daysWithExpressed[i]);
      const currDate = new Date(daysWithExpressed[i + 1]);
      const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (dayDiff === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  /**
   * Get analytics summary for dashboard
   * Requirements: 4.1, 4.5 - Summary statistics for dashboard display
   */
  public getAnalyticsSummary(timeRange?: TimeRange): {
    totalEmotions: number;
    expressedEmotions: number;
    expressionRatio: number;
    currentStreak: number;
    mostCommonEmotion: string | null;
    activeDays: number;
  } {
    const range = timeRange || this.getPreferences().defaultTimeRange;
    const filteredLogs = filterByTimeRange(this.emotionLogs, range);
    
    const totalEmotions = filteredLogs.length;
    const expressedEmotions = filteredLogs.filter(log => log.action === 'expressed').length;
    const expressionRatio = totalEmotions > 0 ? expressedEmotions / totalEmotions : 0;
    const currentStreak = this.getCurrentStreak();
    
    const commonEmotions = this.getCommonEmotions(range, 1);
    const mostCommonEmotion = commonEmotions.length > 0 ? commonEmotions[0].emotion : null;
    
    const activeDays = new Set(
      filteredLogs.map(log => new Date(log.timestamp).toDateString())
    ).size;
    
    return {
      totalEmotions,
      expressedEmotions,
      expressionRatio,
      currentStreak,
      mostCommonEmotion,
      activeDays
    };
  }

  /**
   * Check if analytics data is available
   * Requirements: 4.5 - Handle insufficient data gracefully
   */
  public hasAnalyticsData(): boolean {
    return this.emotionLogs.length > 0;
  }

  /**
   * Get data freshness information
   * Requirements: 4.5 - Show when data was last updated
   */
  public getDataFreshness(): {
    lastEmotionLog: Date | null;
    lastJournalEntry: Date | null;
    lastAnalyticsView: Date | null;
  } {
    const lastEmotionLog = this.emotionLogs.length > 0 
      ? new Date(Math.max(...this.emotionLogs.map(log => log.timestamp)))
      : null;
    
    const lastJournalEntry = this.journalEntries.length > 0
      ? new Date(Math.max(...this.journalEntries.map(entry => entry.updatedAt.getTime())))
      : null;
    
    const lastAnalyticsView = this.preferences?.lastViewedInsights || null;
    
    return {
      lastEmotionLog,
      lastJournalEntry,
      lastAnalyticsView
    };
  }
}

/**
 * Create a singleton instance of the analytics engine
 * Requirements: 4.2 - Local processing with single instance
 */
let analyticsEngineInstance: AnalyticsEngine | null = null;

/**
 * Get the analytics engine instance
 * Requirements: 4.2 - Singleton pattern for local processing
 */
export function getAnalyticsEngine(): AnalyticsEngine {
  if (!analyticsEngineInstance) {
    analyticsEngineInstance = new AnalyticsEngine();
  }
  return analyticsEngineInstance;
}

/**
 * Reset the analytics engine instance (for testing)
 */
export function resetAnalyticsEngine(): void {
  analyticsEngineInstance = null;
}

/**
 * Export the analytics engine service
 */
export const analyticsEngine = {
  getInstance: getAnalyticsEngine,
  reset: resetAnalyticsEngine
};