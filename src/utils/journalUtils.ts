/**
 * Journal utility functions for EmoChild v3
 * Handles journal entry operations and date calculations
 * Requirements: 1.3, 1.4, 2.1
 */

import { JournalEntry, JournalPage } from '@/types';

/**
 * Calculate day of year (1-365) from a date
 * Requirements: 1.4
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Get date from day of year
 * Requirements: 1.4
 */
export function getDateFromDayOfYear(dayOfYear: number, year?: number): Date {
  const currentYear = year || new Date().getFullYear();
  const date = new Date(currentYear, 0, dayOfYear);
  return date;
}

/**
 * Check if a date is today
 * Requirements: 1.4
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Check if a date is in the future
 * Requirements: 1.4
 */
export function isFuture(date: Date): boolean {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  return date.getTime() > today.getTime();
}

/**
 * Create a journal page object for a given date
 * Requirements: 1.4
 */
export function createJournalPage(date: Date, entry?: JournalEntry): JournalPage {
  return {
    date,
    dayOfYear: getDayOfYear(date),
    hasEntry: !!entry,
    entry,
    isToday: isToday(date),
    isFuture: isFuture(date)
  };
}

/**
 * Calculate word count for journal content
 * Requirements: 1.3
 */
export function calculateWordCount(content: string): number {
  if (!content || content.trim().length === 0) {
    return 0;
  }
  
  // Split by whitespace and filter out empty strings
  const words = content.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Create a new journal entry
 * Requirements: 1.3, 2.1
 */
export function createJournalEntry(
  content: string,
  date: Date,
  linkedEmotions: string[] = [],
  tags: string[] = []
): JournalEntry {
  const now = new Date();
  
  // Generate UUID v4 compatible ID
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
  
  return {
    id: generateId(),
    content,
    date,
    createdAt: now,
    updatedAt: now,
    linkedEmotions,
    wordCount: calculateWordCount(content),
    tags,
    dayOfYear: getDayOfYear(date)
  };
}

/**
 * Update an existing journal entry
 * Requirements: 1.3, 2.1
 */
export function updateJournalEntry(
  entry: JournalEntry,
  updates: Partial<Pick<JournalEntry, 'content' | 'linkedEmotions' | 'tags'>>
): JournalEntry {
  const updatedEntry = {
    ...entry,
    ...updates,
    updatedAt: new Date()
  };
  
  // Recalculate word count if content changed
  if (updates.content !== undefined) {
    updatedEntry.wordCount = calculateWordCount(updates.content);
  }
  
  return updatedEntry;
}

/**
 * Find journal entry for a specific date
 * Requirements: 1.3, 1.4
 */
export function findEntryForDate(entries: JournalEntry[], date: Date): JournalEntry | undefined {
  const targetDayOfYear = getDayOfYear(date);
  const targetYear = date.getFullYear();
  
  return entries.find(entry => {
    const entryYear = entry.date.getFullYear();
    const entryDayOfYear = getDayOfYear(entry.date);
    
    return entryYear === targetYear && entryDayOfYear === targetDayOfYear;
  });
}

/**
 * Get entries within a date range
 * Requirements: 2.1
 */
export function getEntriesInRange(
  entries: JournalEntry[],
  startDate: Date,
  endDate: Date
): JournalEntry[] {
  return entries.filter(entry => {
    const entryTime = entry.date.getTime();
    return entryTime >= startDate.getTime() && entryTime <= endDate.getTime();
  });
}

/**
 * Sort entries by date (newest first)
 * Requirements: 1.4, 2.1
 */
export function sortEntriesByDate(entries: JournalEntry[], ascending = false): JournalEntry[] {
  return [...entries].sort((a, b) => {
    const timeA = a.date.getTime();
    const timeB = b.date.getTime();
    
    return ascending ? timeA - timeB : timeB - timeA;
  });
}

/**
 * Get navigation info for journal pages
 * Requirements: 1.4
 */
export function getJournalNavigation(currentDate: Date, entries: JournalEntry[]) {
  const currentYear = currentDate.getFullYear();
  const currentDayOfYear = getDayOfYear(currentDate);
  
  // Calculate previous and next dates
  const previousDate = new Date(currentDate);
  previousDate.setDate(previousDate.getDate() - 1);
  
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + 1);
  
  // Check if we can navigate
  const canTurnPrevious = getDayOfYear(previousDate) >= 1 && previousDate.getFullYear() === currentYear;
  const canTurnNext = getDayOfYear(nextDate) <= 365 && nextDate.getFullYear() === currentYear && !isFuture(nextDate);
  
  // Find entries for adjacent dates
  const previousEntry = canTurnPrevious ? findEntryForDate(entries, previousDate) : undefined;
  const nextEntry = canTurnNext ? findEntryForDate(entries, nextDate) : undefined;
  
  return {
    currentDate,
    previousDate: canTurnPrevious ? previousDate : null,
    nextDate: canTurnNext ? nextDate : null,
    canTurnPrevious,
    canTurnNext,
    previousEntry,
    nextEntry,
    currentDayOfYear,
    totalDaysInYear: 365
  };
}

/**
 * Export journal entries to CSV format
 * Requirements: 2.1, 2.2
 */
export function exportJournalToCSV(entries: JournalEntry[]): string {
  if (entries.length === 0) {
    return 'Date,Content,Word Count,Linked Emotions,Tags,Created At,Updated At\n';
  }
  
  const headers = ['Date', 'Content', 'Word Count', 'Linked Emotions', 'Tags', 'Created At', 'Updated At'];
  const csvRows = [headers.join(',')];
  
  const sortedEntries = sortEntriesByDate(entries, true); // Ascending order for export
  
  sortedEntries.forEach(entry => {
    const row = [
      entry.date.toISOString().split('T')[0], // Date only
      `"${entry.content.replace(/"/g, '""')}"`, // Escape quotes in content
      entry.wordCount.toString(),
      `"${entry.linkedEmotions.join(', ')}"`,
      `"${(entry.tags || []).join(', ')}"`,
      entry.createdAt.toISOString(),
      entry.updatedAt.toISOString()
    ];
    
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
}

/**
 * Validate journal entry data
 * Requirements: 1.3
 */
export function validateJournalEntry(entry: Partial<JournalEntry>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!entry.content || entry.content.trim().length === 0) {
    errors.push('Content cannot be empty');
  }
  
  if (!entry.date || !(entry.date instanceof Date) || isNaN(entry.date.getTime())) {
    errors.push('Valid date is required');
  }
  
  if (entry.linkedEmotions && !Array.isArray(entry.linkedEmotions)) {
    errors.push('Linked emotions must be an array');
  }
  
  if (entry.tags && !Array.isArray(entry.tags)) {
    errors.push('Tags must be an array');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}