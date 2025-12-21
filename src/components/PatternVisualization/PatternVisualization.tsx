/**
 * PatternVisualization Component
 * Displays emotional patterns like streaks and trends with encouraging design
 * Requirements: 4.1, 4.3, 4.5
 */

'use client';

import React from 'react';
import { EmotionalPattern } from '@/types';
import styles from './PatternVisualization.module.css';

/**
 * Props for the PatternVisualization component
 */
export interface PatternVisualizationProps {
  /** Emotional patterns to visualize */
  patterns: EmotionalPattern[];
  
  /** Type of visualization to show */
  visualType: 'streak' | 'frequency' | 'ratio';
  
  /** Whether to show encouraging messages */
  showEncouragement: boolean;
  
  /** Optional className for styling */
  className?: string;
  
  /** Optional title for the visualization */
  title?: string;
}

/**
 * PatternVisualization Component
 * Requirements: 4.1, 4.3, 4.5 - Soft, non-judgmental visual design with encouragement
 */
export function PatternVisualization({
  patterns,
  visualType,
  showEncouragement,
  className,
  title
}: PatternVisualizationProps) {
  // Filter patterns by the requested visual type
  const relevantPatterns = patterns.filter(pattern => {
    switch (visualType) {
      case 'streak':
        return pattern.type === 'streak';
      case 'frequency':
        return pattern.type === 'common-emotions';
      case 'ratio':
        return pattern.type === 'expression-ratio';
      default:
        return false;
    }
  });

  // If no relevant patterns, show encouraging empty state
  if (relevantPatterns.length === 0) {
    return (
      <div className={`${styles.visualization} ${styles.emptyVisualization} ${className || ''}`}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            {visualType === 'streak' && '🔥'}
            {visualType === 'frequency' && '📈'}
            {visualType === 'ratio' && '⚖️'}
          </div>
          <h3>Building Your Pattern</h3>
          <p>
            {visualType === 'streak' && 'Your emotional expression streaks will appear here as you continue your journey.'}
            {visualType === 'frequency' && 'Your most common emotions will be visualized here as you log more feelings.'}
            {visualType === 'ratio' && 'Your expression balance will be shown here as you build emotional awareness.'}
          </p>
          {showEncouragement && (
            <p className={styles.encouragement}>
              Every emotion you log contributes to understanding your unique emotional landscape.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.visualization} ${className || ''}`}>
      {title && <h3 className={styles.visualizationTitle}>{title}</h3>}
      
      {relevantPatterns.map((pattern, index) => (
        <div key={`${pattern.type}-${index}`} className={styles.patternContainer}>
          {/* Pattern insight */}
          <div className={styles.patternInsight}>
            <p>{pattern.insight}</p>
          </div>

          {/* Visual representation based on type */}
          <div className={styles.patternVisual}>
            {visualType === 'streak' && (
              <StreakVisualization pattern={pattern} />
            )}
            
            {visualType === 'frequency' && (
              <FrequencyVisualization pattern={pattern} />
            )}
            
            {visualType === 'ratio' && (
              <RatioVisualization pattern={pattern} />
            )}
          </div>

          {/* Encouragement message */}
          {showEncouragement && pattern.encouragement && (
            <div className={styles.encouragementMessage}>
              <span className={styles.encouragementIcon}>💙</span>
              <p>{pattern.encouragement}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Streak Visualization Component
 * Requirements: 4.3, 4.5 - Visual streak representation with celebration
 */
function StreakVisualization({ pattern }: { pattern: EmotionalPattern }) {
  const { currentStreak, longestStreak, daysWithExpressed } = pattern.data;
  
  // Create visual representation of streak
  const maxDisplayDays = 14; // Show up to 2 weeks
  const streakDays = Math.min(currentStreak, maxDisplayDays);
  
  return (
    <div className={styles.streakContainer}>
      {/* Current streak visualization */}
      <div className={styles.streakSection}>
        <h4 className={styles.streakLabel}>Current Streak</h4>
        <div className={styles.streakDays}>
          {Array.from({ length: maxDisplayDays }, (_, index) => (
            <div
              key={index}
              className={`${styles.streakDay} ${
                index < streakDays ? styles.activeStreak : styles.inactiveStreak
              }`}
              aria-label={`Day ${index + 1} ${index < streakDays ? 'active' : 'inactive'}`}
            >
              {index < streakDays && <span className={styles.streakEmoji}>🔥</span>}
            </div>
          ))}
        </div>
        <div className={styles.streakValue}>
          {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
        </div>
      </div>

      {/* Streak statistics */}
      <div className={styles.streakStats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Longest Streak:</span>
          <span className={styles.statValue}>{longestStreak} days</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Active Days:</span>
          <span className={styles.statValue}>{daysWithExpressed}</span>
        </div>
      </div>

      {/* Celebration for good streaks */}
      {currentStreak >= 3 && (
        <div className={styles.celebration}>
          <span className={styles.celebrationEmoji}>🎉</span>
          <span>Great consistency!</span>
        </div>
      )}
    </div>
  );
}

/**
 * Frequency Visualization Component
 * Requirements: 4.3 - Gentle emotion frequency display
 */
function FrequencyVisualization({ pattern }: { pattern: EmotionalPattern }) {
  const { emotions, totalLogs } = pattern.data;
  const maxCount = emotions.length > 0 ? emotions[0].count : 0;
  
  return (
    <div className={styles.frequencyContainer}>
      <div className={styles.frequencyList}>
        {emotions.slice(0, 5).map((emotion: any, index: number) => {
          const percentage = totalLogs > 0 ? (emotion.count / totalLogs) * 100 : 0;
          const barWidth = maxCount > 0 ? (emotion.count / maxCount) * 100 : 0;
          
          return (
            <div key={emotion.emotion} className={styles.frequencyItem}>
              <div className={styles.emotionInfo}>
                <span className={styles.emotionName}>{emotion.emotion}</span>
                <span className={styles.emotionCount}>
                  {emotion.count} {emotion.count === 1 ? 'time' : 'times'}
                </span>
              </div>
              <div className={styles.frequencyBar}>
                <div 
                  className={styles.frequencyFill}
                  style={{ 
                    width: `${barWidth}%`,
                    backgroundColor: getEmotionColor(index)
                  }}
                  aria-label={`${emotion.emotion}: ${Math.round(percentage)}% of emotions`}
                />
              </div>
              <span className={styles.emotionPercentage}>
                {Math.round(percentage)}%
              </span>
            </div>
          );
        })}
      </div>
      
      {emotions.length > 5 && (
        <div className={styles.moreEmotions}>
          <span>+ {emotions.length - 5} more emotions explored</span>
        </div>
      )}
    </div>
  );
}

/**
 * Ratio Visualization Component
 * Requirements: 4.3 - Non-judgmental expression ratio display
 */
function RatioVisualization({ pattern }: { pattern: EmotionalPattern }) {
  const { expressed, suppressed, total, percentage } = pattern.data;
  
  return (
    <div className={styles.ratioContainer}>
      {/* Visual ratio bar */}
      <div className={styles.ratioBar}>
        <div 
          className={styles.expressedPortion}
          style={{ width: `${percentage}%` }}
          aria-label={`${percentage}% expressed emotions`}
        />
        <div 
          className={styles.suppressedPortion}
          style={{ width: `${100 - percentage}%` }}
          aria-label={`${100 - percentage}% suppressed emotions`}
        />
      </div>
      
      {/* Ratio labels */}
      <div className={styles.ratioLabels}>
        <div className={styles.ratioLabel}>
          <div className={styles.ratioColorIndicator} style={{ backgroundColor: '#C9E4DE' }} />
          <span>Expressed: {expressed}</span>
        </div>
        <div className={styles.ratioLabel}>
          <div className={styles.ratioColorIndicator} style={{ backgroundColor: '#fcded3' }} />
          <span>Suppressed: {suppressed}</span>
        </div>
      </div>
      
      {/* Total count */}
      <div className={styles.ratioTotal}>
        Total emotions logged: {total}
      </div>
      
      {/* Gentle interpretation */}
      <div className={styles.ratioInterpretation}>
        {percentage >= 70 && (
          <span className={styles.positiveInterpretation}>
            🌟 Wonderful emotional awareness
          </span>
        )}
        {percentage >= 50 && percentage < 70 && (
          <span className={styles.neutralInterpretation}>
            🌱 Growing emotional expression
          </span>
        )}
        {percentage < 50 && (
          <span className={styles.gentleInterpretation}>
            🤗 Every step toward expression matters
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Get pastel color for emotion visualization
 * Requirements: 4.3 - Pastel color scheme
 */
function getEmotionColor(index: number): string {
  const pastelColors = [
    '#C9E4DE', // mint
    '#a0d2eb', // blue
    '#DBCDF0', // lavender
    '#fcded3', // peach
    '#F2C6DE', // pink
    '#ffeaa7', // yellow
    '#f35d69', // red
    '#ff964f'  // orange
  ];
  
  return pastelColors[index % pastelColors.length];
}

export default PatternVisualization;