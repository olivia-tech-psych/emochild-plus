/**
 * Analytics Dashboard Component
 * Displays emotional pattern analysis and insights
 * Requirements: 4.1, 4.3, 4.5
 */

'use client';

import React, { useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { EmotionChart } from '@/components/EmotionChart';
import { PatternVisualization } from '@/components/PatternVisualization';
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
              
              {/* Data Visualizations using new components */}
              <div className={styles.visualizations}>
                {/* Expression Ratio Chart */}
                {analytics.chartData['expression-ratio'] && (
                  <div className={styles.visualizationSection}>
                    <EmotionChart
                      data={analytics.chartData['expression-ratio']}
                      chartType="pie"
                      colorScheme="pastel"
                      accessibleDescription="Expression ratio showing expressed vs suppressed emotions"
                      title="Expression Balance"
                      className={styles.chartContainer}
                    />
                  </div>
                )}

                {/* Common Emotions Chart */}
                {analytics.chartData['common-emotions'] && (
                  <div className={styles.visualizationSection}>
                    <EmotionChart
                      data={analytics.chartData['common-emotions']}
                      chartType="bar"
                      colorScheme="pastel"
                      accessibleDescription="Most common emotions frequency chart"
                      title="Most Common Emotions"
                      className={styles.chartContainer}
                    />
                  </div>
                )}

                {/* Streak Visualization */}
                <div className={styles.visualizationSection}>
                  <PatternVisualization
                    patterns={analytics.patterns}
                    visualType="streak"
                    showEncouragement={true}
                    title="Expression Streaks"
                    className={styles.patternContainer}
                  />
                </div>

                {/* Trend Chart */}
                {analytics.chartData['trend'] && (
                  <div className={styles.visualizationSection}>
                    <EmotionChart
                      data={analytics.chartData['trend']}
                      chartType="line"
                      colorScheme="pastel"
                      accessibleDescription="Emotional expression trends over time"
                      title="Expression Trends"
                      className={styles.chartContainer}
                    />
                  </div>
                )}
              </div>

              {/* Pattern Insights */}
              <div className={styles.patternInsights}>
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
                    </div>
                  </div>
                ))}
              </div>
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

export default AnalyticsDashboard;