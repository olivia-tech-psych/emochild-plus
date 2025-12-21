/**
 * InsightDashboard Component
 * Displays emotional insights with encouraging design and time range selection
 * Requirements: 4.1, 4.5
 */

'use client';

import React, { useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { EmotionChart } from '@/components/EmotionChart';
import { PatternVisualization } from '@/components/PatternVisualization';
import { TimeRange } from '@/types';
import styles from './InsightDashboard.module.css';

/**
 * Props for the InsightDashboard component
 */
export interface InsightDashboardProps {
  className?: string;
}

/**
 * InsightDashboard Component
 * Requirements: 4.1, 4.5 - Dashboard with time range selection and encouraging design
 */
export function InsightDashboard({ className }: InsightDashboardProps) {
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

  // If no data available, show encouraging message with placeholder visualizations
  if (!hasData) {
    return (
      <div className={`${styles.dashboard} ${className || ''}`}>
        <div className={styles.header}>
          <h2>Your Emotional Insights</h2>
          <p className={styles.subtitle}>Building awareness through gentle reflection</p>
        </div>
        
        <div className={styles.noDataContainer}>
          <div className={styles.encouragingMessage}>
            <div className={styles.encouragingIcon}>🌱</div>
            <h3>Your Journey Begins Here</h3>
            <p>
              Start logging your emotions to discover meaningful patterns and insights. 
              Every feeling you acknowledge is a step toward greater self-understanding and emotional wellness.
            </p>
            <div className={styles.encouragingSubtext}>
              Your insights will appear here as you continue your emotional journey.
            </div>
          </div>
          
          {/* Placeholder visualizations for insufficient data */}
          <div className={styles.placeholderVisualizations}>
            <div className={styles.placeholderSection}>
              <h4>Expression Balance</h4>
              <div className={styles.placeholderChart}>
                <div className={styles.placeholderPie}>
                  <div className={styles.placeholderSlice} style={{ backgroundColor: '#C9E4DE' }}></div>
                  <div className={styles.placeholderSlice} style={{ backgroundColor: '#fcded3' }}></div>
                </div>
                <p className={styles.placeholderText}>Your expression balance will appear here</p>
              </div>
            </div>
            
            <div className={styles.placeholderSection}>
              <h4>Common Emotions</h4>
              <div className={styles.placeholderChart}>
                <div className={styles.placeholderBars}>
                  <div className={styles.placeholderBar} style={{ backgroundColor: '#a0d2eb', height: '60%' }}></div>
                  <div className={styles.placeholderBar} style={{ backgroundColor: '#DBCDF0', height: '40%' }}></div>
                  <div className={styles.placeholderBar} style={{ backgroundColor: '#F2C6DE', height: '30%' }}></div>
                </div>
                <p className={styles.placeholderText}>Your most common emotions will be shown here</p>
              </div>
            </div>
            
            <div className={styles.placeholderSection}>
              <h4>Expression Streaks</h4>
              <div className={styles.placeholderChart}>
                <div className={styles.placeholderStreak}>
                  <div className={styles.placeholderStreakDay}></div>
                  <div className={styles.placeholderStreakDay}></div>
                  <div className={styles.placeholderStreakDay}></div>
                  <div className={styles.placeholderStreakDay}></div>
                  <div className={styles.placeholderStreakDay}></div>
                </div>
                <p className={styles.placeholderText}>Your expression streaks will be celebrated here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.dashboard} ${className || ''}`}>
      <div className={styles.header}>
        <h2>Your Emotional Insights</h2>
        <p className={styles.subtitle}>Patterns and growth in your emotional journey</p>
      </div>

      {/* Time Range Selector */}
      <div className={styles.timeRangeSelector}>
        <label htmlFor="timeRange" className={styles.selectorLabel}>
          View insights for:
        </label>
        <div className={styles.timeRangeButtons} role="group" aria-label="Select time period for insights">
          {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
            <button
              key={range}
              className={`${styles.timeRangeButton} ${
                selectedTimeRange === range ? styles.active : ''
              }`}
              onClick={() => handleTimeRangeChange(range)}
              aria-pressed={selectedTimeRange === range}
            >
              {range === 'week' && 'Past Week'}
              {range === 'month' && 'Past Month'}
              {range === 'quarter' && 'Past 3 Months'}
              {range === 'year' && 'Past Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className={styles.loading} role="status" aria-live="polite">
          <div className={styles.loadingSpinner}></div>
          <p>Discovering your emotional patterns...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className={styles.error} role="alert">
          <div className={styles.errorIcon}>🌸</div>
          <h3>Unable to Generate Insights</h3>
          <p>We're having trouble analyzing your emotional patterns right now.</p>
          <button 
            className={styles.retryButton}
            onClick={() => generatePresetAnalytics(selectedTimeRange)}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Insights Content */}
      {!isLoading && !error && analytics && (
        <>
          {/* Quick Overview Stats */}
          <div className={styles.overviewStats}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>💙</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{summary.totalEmotions}</div>
                <div className={styles.statLabel}>Emotions Acknowledged</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🌟</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{Math.round(summary.expressionRatio * 100)}%</div>
                <div className={styles.statLabel}>Expression Rate</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🔥</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{summary.currentStreak}</div>
                <div className={styles.statLabel}>Current Streak</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📅</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{summary.activeDays}</div>
                <div className={styles.statLabel}>Active Days</div>
              </div>
            </div>
          </div>

          {/* Insufficient Data Message with Encouragement */}
          {!analytics.hasSufficientData && analytics.insufficientDataMessage && (
            <div className={styles.insufficientData}>
              <div className={styles.encouragementIcon}>🌱</div>
              <div className={styles.insufficientDataContent}>
                <h3>Building Your Emotional Awareness</h3>
                <p>{analytics.insufficientDataMessage}</p>
                <p className={styles.encouragementText}>
                  Every emotion you log contributes to a deeper understanding of your emotional patterns. 
                  Keep going - your insights are growing with each entry.
                </p>
              </div>
            </div>
          )}

          {/* Main Insights Section */}
          {analytics.hasSufficientData && analytics.patterns.length > 0 && (
            <div className={styles.insightsSection}>
              <h3>Your Emotional Patterns</h3>
              
              {/* Data Visualizations */}
              <div className={styles.visualizations}>
                {/* Expression Balance */}
                {analytics.chartData['expression-ratio'] && (
                  <div className={styles.visualizationCard}>
                    <div className={styles.cardHeader}>
                      <h4>Expression Balance</h4>
                      <p className={styles.cardDescription}>
                        How often you acknowledge vs. suppress your emotions
                      </p>
                    </div>
                    <EmotionChart
                      data={analytics.chartData['expression-ratio']}
                      chartType="pie"
                      colorScheme="pastel"
                      accessibleDescription="Expression balance showing expressed vs suppressed emotions"
                      className={styles.chartContainer}
                    />
                  </div>
                )}

                {/* Most Common Emotions */}
                {analytics.chartData['common-emotions'] && (
                  <div className={styles.visualizationCard}>
                    <div className={styles.cardHeader}>
                      <h4>Most Common Emotions</h4>
                      <p className={styles.cardDescription}>
                        The emotions you experience most frequently
                      </p>
                    </div>
                    <EmotionChart
                      data={analytics.chartData['common-emotions']}
                      chartType="bar"
                      colorScheme="pastel"
                      accessibleDescription="Most common emotions frequency chart"
                      className={styles.chartContainer}
                    />
                  </div>
                )}

                {/* Expression Streaks */}
                <div className={styles.visualizationCard}>
                  <div className={styles.cardHeader}>
                    <h4>Expression Streaks</h4>
                    <p className={styles.cardDescription}>
                      Celebrating your consistency in emotional awareness
                    </p>
                  </div>
                  <PatternVisualization
                    patterns={analytics.patterns}
                    visualType="streak"
                    showEncouragement={true}
                    className={styles.patternContainer}
                  />
                </div>

                {/* Emotional Trends */}
                {analytics.chartData['trend'] && (
                  <div className={styles.visualizationCard}>
                    <div className={styles.cardHeader}>
                      <h4>Emotional Trends</h4>
                      <p className={styles.cardDescription}>
                        How your emotional expression changes over time
                      </p>
                    </div>
                    <EmotionChart
                      data={analytics.chartData['trend']}
                      chartType="line"
                      colorScheme="pastel"
                      accessibleDescription="Emotional expression trends over time"
                      className={styles.chartContainer}
                    />
                  </div>
                )}
              </div>

              {/* Pattern Insights with Encouragement */}
              <div className={styles.patternInsights}>
                <h4>What Your Patterns Tell You</h4>
                {analytics.patterns.map((pattern, index) => (
                  <div key={`${pattern.type}-${index}`} className={styles.insightCard}>
                    <div className={styles.insightContent}>
                      <p className={styles.insightText}>{pattern.insight}</p>
                      
                      {pattern.encouragement && (
                        <div className={styles.encouragementMessage}>
                          <span className={styles.encouragementIcon}>💙</span>
                          <p className={styles.encouragementText}>{pattern.encouragement}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Freshness and Encouragement */}
          <div className={styles.dashboardFooter}>
            <div className={styles.dataInfo}>
              <p className={styles.dataFreshness}>
                Last emotion logged: {dataFreshness.lastEmotionLog 
                  ? dataFreshness.lastEmotionLog.toLocaleDateString()
                  : 'No recent data'
                }
              </p>
            </div>
            
            <div className={styles.footerEncouragement}>
              <p>
                🌟 Remember: Every emotion is valid, and every step toward awareness is meaningful. 
                Your emotional journey is unique and valuable.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default InsightDashboard;