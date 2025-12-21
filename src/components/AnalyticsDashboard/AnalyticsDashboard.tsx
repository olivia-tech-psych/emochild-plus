/**
 * Analytics Dashboard Component
 * Displays emotional pattern analysis and insights
 * Requirements: 4.1, 4.3, 4.5
 */

'use client';

import React, { useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { TimeRange } from '@/types';
import styles from './AnalyticsDashboard.module.css';

/**
 * Props for the AnalyticsDashboard component
 */
export interface AnalyticsDashboardProps {
  className?: string;
}

/**
 * Analytics Dashboard Component
 * Requirements: 4.1, 4.3, 4.5
 */
export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  
  const {
    analytics,
    isLoading,
    error,
    generatePresetAnalytics,
    getAnalyticsSummary,
    hasData,
    dataFreshness
  } = useAnalytics();

  // Get summary for quick stats
  const summary = getAnalyticsSummary();

  // Handle time range change
  const handleTimeRangeChange = (range: 'week' | 'month' | 'quarter' | 'year') => {
    setSelectedTimeRange(range);
    generatePresetAnalytics(range);
  };

  // If no data available, show encouraging message
  if (!hasData) {
    return (
      <div className={`${styles.dashboard} ${className || ''}`}>
        <div className={styles.header}>
          <h2>Your Emotional Journey</h2>
          <p className={styles.subtitle}>Insights into your emotional patterns</p>
        </div>
        
        <div className={styles.noData}>
          <div className={styles.noDataIcon}>🌱</div>
          <h3>Start Your Emotional Awareness Journey</h3>
          <p>
            Begin logging your emotions to see meaningful patterns emerge. 
            Every feeling you acknowledge is a step toward greater self-understanding.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.dashboard} ${className || ''}`}>
      <div className={styles.header}>
        <h2>Your Emotional Journey</h2>
        <p className={styles.subtitle}>Insights into your emotional patterns</p>
      </div>

      {/* Time Range Selector */}
      <div className={styles.timeRangeSelector}>
        <label htmlFor="timeRange" className={styles.selectorLabel}>
          Time Period:
        </label>
        <div className={styles.timeRangeButtons} role="group" aria-label="Select time period">
          {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
            <button
              key={range}
              className={`${styles.timeRangeButton} ${
                selectedTimeRange === range ? styles.active : ''
              }`}
              onClick={() => handleTimeRangeChange(range)}
              aria-pressed={selectedTimeRange === range}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className={styles.loading} role="status" aria-live="polite">
          <div className={styles.loadingSpinner}></div>
          <p>Analyzing your emotional patterns...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className={styles.error} role="alert">
          <h3>Unable to Generate Insights</h3>
          <p>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={() => generatePresetAnalytics(selectedTimeRange)}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Analytics Content */}
      {!isLoading && !error && analytics && (
        <>
          {/* Quick Stats */}
          <div className={styles.quickStats}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{summary.totalEmotions}</div>
              <div className={styles.statLabel}>Emotions Logged</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{Math.round(summary.expressionRatio * 100)}%</div>
              <div className={styles.statLabel}>Expression Rate</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{summary.currentStreak}</div>
              <div className={styles.statLabel}>Current Streak</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{summary.activeDays}</div>
              <div className={styles.statLabel}>Active Days</div>
            </div>
          </div>

          {/* Insufficient Data Message */}
          {!analytics.hasSufficientData && analytics.insufficientDataMessage && (
            <div className={styles.insufficientData}>
              <div className={styles.encouragementIcon}>🌟</div>
              <p>{analytics.insufficientDataMessage}</p>
            </div>
          )}

          {/* Patterns and Insights */}
          {analytics.hasSufficientData && analytics.patterns.length > 0 && (
            <div className={styles.patterns}>
              <h3>Your Emotional Patterns</h3>
              
              {analytics.patterns.map((pattern, index) => (
                <div key={`${pattern.type}-${index}`} className={styles.patternCard}>
                  <div className={styles.patternHeader}>
                    <h4 className={styles.patternTitle}>
                      {getPatternTitle(pattern.type)}
                    </h4>
                  </div>
                  
                  <div className={styles.patternContent}>
                    <p className={styles.patternInsight}>{pattern.insight}</p>
                    
                    {pattern.encouragement && (
                      <p className={styles.patternEncouragement}>
                        💙 {pattern.encouragement}
                      </p>
                    )}
                    
                    {/* Simple data visualization */}
                    <div className={styles.patternData}>
                      {renderPatternData(pattern)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Data Freshness Info */}
          <div className={styles.dataInfo}>
            <p className={styles.dataFreshness}>
              Last updated: {dataFreshness.lastEmotionLog 
                ? dataFreshness.lastEmotionLog.toLocaleDateString()
                : 'No recent data'
              }
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Get user-friendly title for pattern type
 */
function getPatternTitle(type: string): string {
  switch (type) {
    case 'expression-ratio':
      return 'Expression Balance';
    case 'common-emotions':
      return 'Most Common Emotions';
    case 'streak':
      return 'Expression Streaks';
    case 'trend':
      return 'Emotional Trends';
    default:
      return 'Pattern Analysis';
  }
}

/**
 * Render simple data visualization for patterns
 * Requirements: 4.3 - Soft, non-judgmental data visualizations
 */
function renderPatternData(pattern: any): React.ReactNode {
  switch (pattern.type) {
    case 'expression-ratio':
      return (
        <div className={styles.ratioVisualization}>
          <div className={styles.ratioBar}>
            <div 
              className={styles.ratioFill}
              style={{ width: `${pattern.data.percentage}%` }}
              aria-label={`${pattern.data.percentage}% expression rate`}
            />
          </div>
          <div className={styles.ratioLabels}>
            <span>Expressed: {pattern.data.expressed}</span>
            <span>Suppressed: {pattern.data.suppressed}</span>
          </div>
        </div>
      );
      
    case 'common-emotions':
      return (
        <div className={styles.emotionsList}>
          {pattern.data.emotions.slice(0, 3).map((emotion: any, index: number) => (
            <div key={emotion.emotion} className={styles.emotionItem}>
              <span className={styles.emotionName}>{emotion.emotion}</span>
              <span className={styles.emotionCount}>{emotion.count} times</span>
            </div>
          ))}
        </div>
      );
      
    case 'streak':
      return (
        <div className={styles.streakVisualization}>
          <div className={styles.streakItem}>
            <span className={styles.streakLabel}>Current:</span>
            <span className={styles.streakValue}>{pattern.data.currentStreak} days</span>
          </div>
          <div className={styles.streakItem}>
            <span className={styles.streakLabel}>Best:</span>
            <span className={styles.streakValue}>{pattern.data.longestStreak} days</span>
          </div>
        </div>
      );
      
    case 'trend':
      return (
        <div className={styles.trendVisualization}>
          <div className={styles.trendDirection}>
            <span className={styles.trendLabel}>Direction:</span>
            <span className={`${styles.trendValue} ${styles[pattern.data.trendDirection]}`}>
              {pattern.data.trendDirection === 'improving' && '📈 Improving'}
              {pattern.data.trendDirection === 'declining' && '📉 Declining'}
              {pattern.data.trendDirection === 'stable' && '➡️ Stable'}
            </span>
          </div>
        </div>
      );
      
    default:
      return null;
  }
}

export default AnalyticsDashboard;