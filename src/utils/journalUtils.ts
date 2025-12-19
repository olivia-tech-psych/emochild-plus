/**
 * Journal utility functions for EmoChild v3
 * Handles journal entry operations and date calculations
 * Requirements: 1.3, 1.4, 2.1
 */

import { JournalEntry, JournalPage } from '@/types';

/**
 * Calculate day of year (1-365/366) from a date with leap year support
 * Requirements: 1.4
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Check if a year is a leap year
 * Requirements: 1.4
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Get the total number of days in a year (365 or 366 for leap years)
 * Requirements: 1.4
 */
export function getDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/**
 * Get date from day of year with leap year support
 * Requirements: 1.4
 */
export function getDateFromDayOfYear(dayOfYear: number, year?: number): Date {
  const currentYear = year || new Date().getFullYear();
  const maxDays = getDaysInYear(currentYear);
  
  // Validate day of year is within valid range
  if (dayOfYear < 1 || dayOfYear > maxDays) {
    throw new Error(`Day of year must be between 1 and ${maxDays} for year ${currentYear}`);
  }
  
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
 * Get navigation info for journal pages with leap year support
 * Requirements: 1.4
 */
export function getJournalNavigation(currentDate: Date, entries: JournalEntry[]) {
  const currentYear = currentDate.getFullYear();
  const currentDayOfYear = getDayOfYear(currentDate);
  const totalDaysInYear = getDaysInYear(currentYear);
  
  // Calculate previous and next dates
  const previousDate = new Date(currentDate);
  previousDate.setDate(previousDate.getDate() - 1);
  
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + 1);
  
  // Check if we can navigate (stay within the same year)
  const canTurnPrevious = getDayOfYear(previousDate) >= 1 && previousDate.getFullYear() === currentYear;
  const canTurnNext = getDayOfYear(nextDate) <= totalDaysInYear && nextDate.getFullYear() === currentYear && !isFuture(nextDate);
  
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
    totalDaysInYear
  };
}

/**
 * Journal page navigation system
 * Handles date-based page calculation and chronological ordering
 * Requirements: 1.4
 */
export class JournalPageNavigator {
  private currentYear: number;
  private entries: JournalEntry[];
  
  constructor(entries: JournalEntry[] = [], year?: number) {
    this.entries = entries;
    this.currentYear = year || new Date().getFullYear();
  }
  
  /**
   * Get the current year being navigated
   */
  getCurrentYear(): number {
    return this.currentYear;
  }
  
  /**
   * Set the year for navigation
   */
  setYear(year: number): void {
    this.currentYear = year;
  }
  
  /**
   * Update the entries collection
   */
  updateEntries(entries: JournalEntry[]): void {
    this.entries = entries;
  }
  
  /**
   * Get total number of pages (days) in the current year
   */
  getTotalPages(): number {
    return getDaysInYear(this.currentYear);
  }
  
  /**
   * Get page number (day of year) for a given date
   */
  getPageNumber(date: Date): number {
    if (date.getFullYear() !== this.currentYear) {
      throw new Error(`Date must be in the current navigation year (${this.currentYear})`);
    }
    return getDayOfYear(date);
  }
  
  /**
   * Get date for a given page number (day of year)
   */
  getDateForPage(pageNumber: number): Date {
    return getDateFromDayOfYear(pageNumber, this.currentYear);
  }
  
  /**
   * Navigate to the next page (chronologically)
   */
  getNextPage(currentDate: Date): Date | null {
    const currentPageNumber = this.getPageNumber(currentDate);
    const totalPages = this.getTotalPages();
    
    if (currentPageNumber >= totalPages) {
      return null; // Already at the last page
    }
    
    const nextDate = this.getDateForPage(currentPageNumber + 1);
    
    // Don't allow navigation to future dates
    if (isFuture(nextDate)) {
      return null;
    }
    
    return nextDate;
  }
  
  /**
   * Navigate to the previous page (chronologically)
   */
  getPreviousPage(currentDate: Date): Date | null {
    const currentPageNumber = this.getPageNumber(currentDate);
    
    if (currentPageNumber <= 1) {
      return null; // Already at the first page
    }
    
    return this.getDateForPage(currentPageNumber - 1);
  }
  
  /**
   * Jump to a specific page by date
   */
  jumpToDate(targetDate: Date): Date | null {
    if (targetDate.getFullYear() !== this.currentYear) {
      return null; // Date not in current year
    }
    
    if (isFuture(targetDate)) {
      return null; // Don't allow navigation to future dates
    }
    
    return targetDate;
  }
  
  /**
   * Jump to today's page
   */
  jumpToToday(): Date {
    const today = new Date();
    
    // If today is not in the current navigation year, set year to current year
    if (today.getFullYear() !== this.currentYear) {
      this.setYear(today.getFullYear());
    }
    
    return today;
  }
  
  /**
   * Get the first page of the year (January 1st)
   */
  getFirstPage(): Date {
    return this.getDateForPage(1);
  }
  
  /**
   * Get the last accessible page (either December 31st or today, whichever is earlier)
   */
  getLastAccessiblePage(): Date {
    const today = new Date();
    const lastDayOfYear = this.getDateForPage(this.getTotalPages());
    
    // If we're in the current year, the last accessible page is today or the last day of year
    if (this.currentYear === today.getFullYear()) {
      return today.getTime() < lastDayOfYear.getTime() ? today : lastDayOfYear;
    }
    
    // If we're in a past year, all pages are accessible
    if (this.currentYear < today.getFullYear()) {
      return lastDayOfYear;
    }
    
    // If we're in a future year, no pages are accessible
    return this.getFirstPage();
  }
  
  /**
   * Check if a page has an entry
   */
  hasEntryForPage(date: Date): boolean {
    return !!findEntryForDate(this.entries, date);
  }
  
  /**
   * Get entry for a specific page
   */
  getEntryForPage(date: Date): JournalEntry | undefined {
    return findEntryForDate(this.entries, date);
  }
  
  /**
   * Get all pages with entries in chronological order
   */
  getPagesWithEntries(): Date[] {
    const currentYearEntries = this.entries.filter(entry => 
      entry.date.getFullYear() === this.currentYear
    );
    
    return sortEntriesByDate(currentYearEntries, true).map(entry => entry.date);
  }
  
  /**
   * Find the next page with an entry after the given date
   */
  getNextPageWithEntry(currentDate: Date): Date | null {
    const pagesWithEntries = this.getPagesWithEntries();
    const currentTime = currentDate.getTime();
    
    for (const pageDate of pagesWithEntries) {
      if (pageDate.getTime() > currentTime) {
        return pageDate;
      }
    }
    
    return null;
  }
  
  /**
   * Find the previous page with an entry before the given date
   */
  getPreviousPageWithEntry(currentDate: Date): Date | null {
    const pagesWithEntries = this.getPagesWithEntries().reverse(); // Reverse for backward search
    const currentTime = currentDate.getTime();
    
    for (const pageDate of pagesWithEntries) {
      if (pageDate.getTime() < currentTime) {
        return pageDate;
      }
    }
    
    return null;
  }
  
  /**
   * Get comprehensive navigation state for the current page
   */
  getNavigationState(currentDate: Date): {
    currentDate: Date;
    currentPageNumber: number;
    totalPages: number;
    canGoNext: boolean;
    canGoPrevious: boolean;
    nextDate: Date | null;
    previousDate: Date | null;
    hasCurrentEntry: boolean;
    currentEntry?: JournalEntry;
    nextPageWithEntry: Date | null;
    previousPageWithEntry: Date | null;
    isToday: boolean;
    isFuture: boolean;
  } {
    const currentPageNumber = this.getPageNumber(currentDate);
    const totalPages = this.getTotalPages();
    const nextDate = this.getNextPage(currentDate);
    const previousDate = this.getPreviousPage(currentDate);
    const currentEntry = this.getEntryForPage(currentDate);
    
    return {
      currentDate,
      currentPageNumber,
      totalPages,
      canGoNext: nextDate !== null,
      canGoPrevious: previousDate !== null,
      nextDate,
      previousDate,
      hasCurrentEntry: !!currentEntry,
      currentEntry,
      nextPageWithEntry: this.getNextPageWithEntry(currentDate),
      previousPageWithEntry: this.getPreviousPageWithEntry(currentDate),
      isToday: isToday(currentDate),
      isFuture: isFuture(currentDate)
    };
  }
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
 * Get emotions logged on the same day as the given date
 * Requirements: 1.5
 */
export function getSameDayEmotions(emotions: any[], date: Date): any[] {
  const targetDateString = date.toDateString();
  
  return emotions.filter(emotion => {
    const emotionDate = new Date(emotion.timestamp);
    return emotionDate.toDateString() === targetDateString;
  });
}

/**
 * Check if two dates are on the same day
 * Requirements: 1.5
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

/**
 * Get emotion details by IDs
 * Requirements: 1.5
 */
export function getEmotionsByIds(emotions: any[], emotionIds: string[]): any[] {
  return emotionIds
    .map(id => emotions.find(emotion => emotion.id === id))
    .filter((emotion): emotion is any => emotion !== undefined);
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