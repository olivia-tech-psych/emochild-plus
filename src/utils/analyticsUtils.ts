/**
 * Analytics utility functions for EmoChild v3
 * Handles local emotional pattern analysis and data processing
 * Requirements: 4.1, 4.2, 4.3, 4.5
 */

import { 
  EmotionLog, 
  JournalEntry, 
  EmotionalPattern, 
  ChartData, 
  TimeRange, 
  PatternData,
  PatternType 
} from '@/types';

/**
 * Create a time range for analytics
 * Requirements: 4.1, 4.5
 */
export function createTimeRange(
  start: Date, 
  end: Date, 
  preset?: 'week' | 'month' | 'quarter' | 'year'
): TimeRange {
  return { start, end, preset };
}

/**
 * Get preset time ranges
 * Requirements: 4.5
 */
export function getPresetTimeRanges(): Record<string, TimeRange> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return {
    week: createTimeRange(
      new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      today,
      'week'
    ),
    month: createTimeRange(
      new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      today,
      'month'
    ),
    quarter: createTimeRange(
      new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
      today,
      'quarter'
    ),
    year: createTimeRange(
      new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000),
      today,
      'year'
    )
  };
}

/**
 * Filter data by time range
 * Requirements: 4.1, 4.5
 */
export function filterByTimeRange<T extends { timestamp?: number; date?: Date; createdAt?: Date }>(
  data: T[],
  timeRange: TimeRange
): T[] {
  const startTime = timeRange.start.getTime();
  const endTime = timeRange.end.getTime();
  
  return data.filter(item => {
    let itemTime: number;
    
    if (item.timestamp) {
      itemTime = item.timestamp;
    } else if (item.date) {
      itemTime = item.date.getTime();
    } else if (item.createdAt) {
      itemTime = item.createdAt.getTime();
    } else {
      return false;
    }
    
    return itemTime >= startTime && itemTime <= endTime;
  });
}

/**
 * Calculate expression ratio (expressed vs suppressed emotions)
 * Requirements: 4.1, 4.3
 */
export function calculateExpressionRatio(logs: EmotionLog[], timeRange: TimeRange): EmotionalPattern {
  const filteredLogs = filterByTimeRange(logs, timeRange);
  
  const expressed = filteredLogs.filter(log => log.action === 'expressed').length;
  const suppressed = filteredLogs.filter(log => log.action === 'suppressed').length;
  const total = expressed + suppressed;
  
  const ratio = total > 0 ? expressed / total : 0;
  
  const data: PatternData = {
    expressed,
    suppressed,
    total,
    ratio,
    percentage: Math.round(ratio * 100)
  };
  
  let insight = '';
  let encouragement = '';
  
  if (total === 0) {
    insight = 'No emotion logs found in this time period.';
    encouragement = 'Start logging your emotions to see patterns emerge over time.';
  } else if (ratio >= 0.7) {
    insight = `You expressed ${data.percentage}% of your emotions - that's wonderful emotional awareness!`;
    encouragement = 'Keep up this healthy pattern of emotional expression.';
  } else if (ratio >= 0.5) {
    insight = `You expressed ${data.percentage}% of your emotions - you're building good emotional habits.`;
    encouragement = 'Notice what helps you feel safe to express your emotions.';
  } else {
    insight = `You expressed ${data.percentage}% of your emotions. It's okay to take your time with emotional expression.`;
    encouragement = 'Every step toward emotional awareness is valuable, no matter how small.';
  }
  
  return {
    type: 'expression-ratio',
    timeRange,
    data,
    insight,
    encouragement
  };
}

/**
 * Analyze most common emotions
 * Requirements: 4.1, 4.3
 */
export function analyzeCommonEmotions(logs: EmotionLog[], timeRange: TimeRange): EmotionalPattern {
  const filteredLogs = filterByTimeRange(logs, timeRange);
  
  // Count emotions by text (normalized)
  const emotionCounts: Record<string, number> = {};
  
  filteredLogs.forEach(log => {
    const emotion = log.text.toLowerCase().trim();
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
  });
  
  // Sort by frequency
  const sortedEmotions = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Top 5
  
  const data: PatternData = {
    emotions: sortedEmotions.map(([emotion, count]) => ({ emotion, count })),
    totalLogs: filteredLogs.length,
    uniqueEmotions: Object.keys(emotionCounts).length
  };
  
  let insight = '';
  let encouragement = '';
  
  if (sortedEmotions.length === 0) {
    insight = 'No emotions logged in this time period.';
    encouragement = 'Start exploring your emotional landscape by logging how you feel.';
  } else {
    const topEmotion = sortedEmotions[0];
    insight = `Your most frequent emotion was "${topEmotion[0]}" (${topEmotion[1]} times). You logged ${data.uniqueEmotions} different emotions.`;
    encouragement = 'Notice the variety in your emotional experience - each feeling has value.';
  }
  
  return {
    type: 'common-emotions',
    timeRange,
    data,
    insight,
    encouragement
  };
}

/**
 * Calculate emotional expression streaks
 * Requirements: 4.1, 4.3, 4.5
 */
export function calculateStreaks(logs: EmotionLog[], timeRange: TimeRange): EmotionalPattern {
  const filteredLogs = filterByTimeRange(logs, timeRange);
  
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
  
  // Calculate streaks of days with expressed emotions
  const daysWithExpressed = Object.entries(logsByDay)
    .filter(([, dayLogs]) => dayLogs.some(log => log.action === 'expressed'))
    .map(([day]) => day)
    .sort();
  
  let currentStreak = 0;
  let longestStreak = 0;
  let streakCount = 0;
  
  if (daysWithExpressed.length > 0) {
    let tempStreak = 1;
    
    for (let i = 1; i < daysWithExpressed.length; i++) {
      const prevDate = new Date(daysWithExpressed[i - 1]);
      const currDate = new Date(daysWithExpressed[i]);
      const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        streakCount++;
        tempStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    streakCount++;
    
    // Calculate current streak (from today backwards)
    const today = new Date().toISOString().split('T')[0];
    const todayIndex = daysWithExpressed.indexOf(today);
    
    if (todayIndex !== -1) {
      currentStreak = 1;
      for (let i = todayIndex - 1; i >= 0; i--) {
        const prevDate = new Date(daysWithExpressed[i]);
        const currDate = new Date(daysWithExpressed[i + 1]);
        const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (dayDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }
  
  const data: PatternData = {
    currentStreak,
    longestStreak,
    streakCount,
    daysWithExpressed: daysWithExpressed.length,
    totalDays: Object.keys(logsByDay).length
  };
  
  let insight = '';
  let encouragement = '';
  
  if (data.daysWithExpressed === 0) {
    insight = 'No days with expressed emotions found in this period.';
    encouragement = 'Each time you express an emotion, you\'re building emotional awareness.';
  } else if (currentStreak > 0) {
    insight = `You're on a ${currentStreak}-day streak of emotional expression! Your longest streak was ${longestStreak} days.`;
    encouragement = 'Consistency in emotional expression builds emotional intelligence over time.';
  } else {
    insight = `Your longest streak of emotional expression was ${longestStreak} days across ${streakCount} streaks.`;
    encouragement = 'Every streak, no matter how short, represents growth in emotional awareness.';
  }
  
  return {
    type: 'streak',
    timeRange,
    data,
    insight,
    encouragement
  };
}

/**
 * Analyze emotional trends over time
 * Requirements: 4.1, 4.3
 */
export function analyzeTrends(logs: EmotionLog[], timeRange: TimeRange): EmotionalPattern {
  const filteredLogs = filterByTimeRange(logs, timeRange);
  
  // Group logs by week
  const weeklyData: Record<string, { expressed: number; suppressed: number; total: number }> = {};
  
  filteredLogs.forEach(log => {
    const date = new Date(log.timestamp);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { expressed: 0, suppressed: 0, total: 0 };
    }
    
    weeklyData[weekKey].total++;
    if (log.action === 'expressed') {
      weeklyData[weekKey].expressed++;
    } else {
      weeklyData[weekKey].suppressed++;
    }
  });
  
  const weeks = Object.keys(weeklyData).sort();
  const trendData = weeks.map(week => ({
    week,
    ...weeklyData[week],
    expressionRatio: weeklyData[week].total > 0 ? weeklyData[week].expressed / weeklyData[week].total : 0
  }));
  
  // Calculate trend direction
  let trendDirection = 'stable';
  if (trendData.length >= 2) {
    const firstHalf = trendData.slice(0, Math.floor(trendData.length / 2));
    const secondHalf = trendData.slice(Math.floor(trendData.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, week) => sum + week.expressionRatio, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, week) => sum + week.expressionRatio, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 0.1) {
      trendDirection = 'improving';
    } else if (secondAvg < firstAvg - 0.1) {
      trendDirection = 'declining';
    }
  }
  
  const data: PatternData = {
    weeklyData: trendData,
    trendDirection,
    totalWeeks: weeks.length,
    averageExpressionRatio: trendData.length > 0 
      ? trendData.reduce((sum, week) => sum + week.expressionRatio, 0) / trendData.length 
      : 0
  };
  
  let insight = '';
  let encouragement = '';
  
  if (trendData.length === 0) {
    insight = 'Not enough data to identify trends yet.';
    encouragement = 'Keep logging emotions to see patterns emerge over time.';
  } else if (trendDirection === 'improving') {
    insight = 'Your emotional expression has been trending upward - great progress!';
    encouragement = 'You\'re building stronger emotional awareness habits.';
  } else if (trendDirection === 'declining') {
    insight = 'Your emotional expression has decreased recently. That\'s okay - emotional journeys have ups and downs.';
    encouragement = 'Be gentle with yourself. Every small step toward emotional awareness counts.';
  } else {
    insight = `Your emotional expression has been consistent, averaging ${Math.round(data.averageExpressionRatio * 100)}% over ${data.totalWeeks} weeks.`;
    encouragement = 'Consistency in emotional awareness is a valuable foundation for growth.';
  }
  
  return {
    type: 'trend',
    timeRange,
    data,
    insight,
    encouragement
  };
}

/**
 * Generate chart data for visualizations
 * Requirements: 4.1, 4.3
 */
export function generateChartData(pattern: EmotionalPattern): ChartData {
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
  
  switch (pattern.type) {
    case 'expression-ratio':
      return {
        labels: ['Expressed', 'Suppressed'],
        datasets: [{
          label: 'Emotions',
          data: [pattern.data.expressed, pattern.data.suppressed],
          backgroundColor: [pastelColors[0], pastelColors[3]],
          borderColor: [pastelColors[0], pastelColors[3]]
        }]
      };
      
    case 'common-emotions':
      const emotions = pattern.data.emotions.slice(0, 5); // Top 5
      return {
        labels: emotions.map((e: any) => e.emotion),
        datasets: [{
          label: 'Frequency',
          data: emotions.map((e: any) => e.count),
          backgroundColor: pastelColors.slice(0, emotions.length),
          borderColor: pastelColors.slice(0, emotions.length)
        }]
      };
      
    case 'streak':
      return {
        labels: ['Current Streak', 'Longest Streak'],
        datasets: [{
          label: 'Days',
          data: [pattern.data.currentStreak, pattern.data.longestStreak],
          backgroundColor: [pastelColors[1], pastelColors[4]],
          borderColor: [pastelColors[1], pastelColors[4]]
        }]
      };
      
    case 'trend':
      const weeklyData = pattern.data.weeklyData || [];
      return {
        labels: weeklyData.map((week: any) => new Date(week.week).toLocaleDateString()),
        datasets: [{
          label: 'Expression Ratio',
          data: weeklyData.map((week: any) => Math.round(week.expressionRatio * 100)),
          backgroundColor: [pastelColors[2]],
          borderColor: [pastelColors[2]]
        }]
      };
      
    default:
      return {
        labels: [],
        datasets: []
      };
  }
}

/**
 * Generate all analytics patterns for a dataset
 * Requirements: 4.1, 4.2, 4.3, 4.5
 */
export function generateAllPatterns(
  logs: EmotionLog[], 
  journalEntries: JournalEntry[], 
  timeRange: TimeRange
): EmotionalPattern[] {
  // All processing happens locally - no external requests
  // Requirement 4.2: Analytics local processing privacy
  
  const patterns: EmotionalPattern[] = [];
  
  try {
    patterns.push(calculateExpressionRatio(logs, timeRange));
    patterns.push(analyzeCommonEmotions(logs, timeRange));
    patterns.push(calculateStreaks(logs, timeRange));
    patterns.push(analyzeTrends(logs, timeRange));
  } catch (error) {
    console.error('Error generating analytics patterns:', error);
  }
  
  return patterns;
}

/**
 * Check if there's sufficient data for meaningful analytics
 * Requirements: 4.5
 */
export function hasSufficientData(logs: EmotionLog[], timeRange: TimeRange): boolean {
  const filteredLogs = filterByTimeRange(logs, timeRange);
  return filteredLogs.length >= 3; // Minimum 3 logs for basic patterns
}

/**
 * Get encouraging message for insufficient data
 * Requirements: 4.5
 */
export function getInsufficientDataMessage(logs: EmotionLog[], timeRange: TimeRange): string {
  const filteredLogs = filterByTimeRange(logs, timeRange);
  const count = filteredLogs.length;
  
  if (count === 0) {
    return 'Start your emotional awareness journey by logging how you feel. Every emotion matters and contributes to understanding yourself better.';
  } else if (count === 1) {
    return 'You\'ve taken the first step in emotional awareness! Keep logging your feelings to see patterns emerge over time.';
  } else {
    return 'You\'re building emotional awareness! A few more emotion logs will help reveal meaningful patterns in your emotional journey.';
  }
}