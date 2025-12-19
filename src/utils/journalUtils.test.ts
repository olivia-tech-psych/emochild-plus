/**
 * Tests for Journal Utilities
 * Requirements: 1.3, 1.4, 2.1
 */

import { describe, it, expect } from 'vitest';
import {
  getDayOfYear,
  getDateFromDayOfYear,
  isToday,
  isFuture,
  createJournalPage,
  calculateWordCount,
  createJournalEntry,
  updateJournalEntry,
  findEntryForDate,
  getEntriesInRange,
  sortEntriesByDate,
  getJournalNavigation,
  exportJournalToCSV,
  validateJournalEntry
} from './journalUtils';
import { JournalEntry } from '@/types';

describe('Journal Utilities', () => {
  describe('Date Calculations', () => {
    it('should calculate day of year correctly', () => {
      // January 1st should be day 1
      const jan1 = new Date('2024-01-01');
      expect(getDayOfYear(jan1)).toBe(1);
      
      // December 31st should be day 365 (non-leap year)
      const dec31 = new Date('2023-12-31');
      expect(getDayOfYear(dec31)).toBe(365);
      
      // February 1st should be day 32
      const feb1 = new Date('2024-02-01');
      expect(getDayOfYear(feb1)).toBe(32);
    });

    it('should get date from day of year correctly', () => {
      const date = getDateFromDayOfYear(32, 2024);
      expect(date.getMonth()).toBe(1); // February (0-indexed)
      expect(date.getDate()).toBe(1);
    });

    it('should correctly identify today', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it('should correctly identify future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isFuture(tomorrow)).toBe(true);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isFuture(yesterday)).toBe(false);
    });
  });

  describe('Journal Page Creation', () => {
    it('should create journal page without entry', () => {
      const date = new Date('2024-01-01');
      const page = createJournalPage(date);
      
      expect(page.date).toEqual(date);
      expect(page.dayOfYear).toBe(1);
      expect(page.hasEntry).toBe(false);
      expect(page.entry).toBeUndefined();
    });

    it('should create journal page with entry', () => {
      const date = new Date('2024-01-01');
      const entry: JournalEntry = {
        id: 'test-1',
        content: 'Test content',
        date,
        createdAt: new Date(),
        updatedAt: new Date(),
        linkedEmotions: [],
        wordCount: 2,
        dayOfYear: 1
      };
      
      const page = createJournalPage(date, entry);
      
      expect(page.hasEntry).toBe(true);
      expect(page.entry).toEqual(entry);
    });
  });

  describe('Word Count Calculation', () => {
    it('should calculate word count correctly', () => {
      expect(calculateWordCount('Hello world')).toBe(2);
      expect(calculateWordCount('  Hello   world  ')).toBe(2);
      expect(calculateWordCount('')).toBe(0);
      expect(calculateWordCount('   ')).toBe(0);
      expect(calculateWordCount('Single')).toBe(1);
    });
  });

  describe('Journal Entry Operations', () => {
    it('should create journal entry correctly', () => {
      const content = 'Test journal entry';
      const date = new Date('2024-01-01');
      const linkedEmotions = ['emotion-1'];
      const tags = ['test'];
      
      const entry = createJournalEntry(content, date, linkedEmotions, tags);
      
      expect(entry.content).toBe(content);
      expect(entry.date).toEqual(date);
      expect(entry.linkedEmotions).toEqual(linkedEmotions);
      expect(entry.tags).toEqual(tags);
      expect(entry.wordCount).toBe(3);
      expect(entry.dayOfYear).toBe(1);
      expect(entry.id).toBeDefined();
      expect(entry.createdAt).toBeInstanceOf(Date);
      expect(entry.updatedAt).toBeInstanceOf(Date);
    });

    it('should update journal entry correctly', () => {
      const originalEntry: JournalEntry = {
        id: 'test-1',
        content: 'Original content',
        date: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
        linkedEmotions: [],
        wordCount: 2,
        dayOfYear: 1
      };
      
      const updatedEntry = updateJournalEntry(originalEntry, {
        content: 'Updated content with more words',
        linkedEmotions: ['emotion-1']
      });
      
      expect(updatedEntry.content).toBe('Updated content with more words');
      expect(updatedEntry.linkedEmotions).toEqual(['emotion-1']);
      expect(updatedEntry.wordCount).toBe(5);
      expect(updatedEntry.updatedAt.getTime()).toBeGreaterThan(originalEntry.updatedAt.getTime());
      expect(updatedEntry.id).toBe(originalEntry.id);
    });

    it('should find entry for specific date', () => {
      const entries: JournalEntry[] = [
        {
          id: 'test-1',
          content: 'Entry 1',
          date: new Date('2024-01-01'),
          createdAt: new Date(),
          updatedAt: new Date(),
          linkedEmotions: [],
          wordCount: 2,
          dayOfYear: 1
        },
        {
          id: 'test-2',
          content: 'Entry 2',
          date: new Date('2024-01-02'),
          createdAt: new Date(),
          updatedAt: new Date(),
          linkedEmotions: [],
          wordCount: 2,
          dayOfYear: 2
        }
      ];
      
      const found = findEntryForDate(entries, new Date('2024-01-01'));
      expect(found?.id).toBe('test-1');
      
      const notFound = findEntryForDate(entries, new Date('2024-01-03'));
      expect(notFound).toBeUndefined();
    });

    it('should get entries in date range', () => {
      const entries: JournalEntry[] = [
        {
          id: 'test-1',
          content: 'Entry 1',
          date: new Date('2024-01-01'),
          createdAt: new Date(),
          updatedAt: new Date(),
          linkedEmotions: [],
          wordCount: 2,
          dayOfYear: 1
        },
        {
          id: 'test-2',
          content: 'Entry 2',
          date: new Date('2024-01-15'),
          createdAt: new Date(),
          updatedAt: new Date(),
          linkedEmotions: [],
          wordCount: 2,
          dayOfYear: 15
        },
        {
          id: 'test-3',
          content: 'Entry 3',
          date: new Date('2024-02-01'),
          createdAt: new Date(),
          updatedAt: new Date(),
          linkedEmotions: [],
          wordCount: 2,
          dayOfYear: 32
        }
      ];
      
      const rangeEntries = getEntriesInRange(
        entries,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      
      expect(rangeEntries).toHaveLength(2);
      expect(rangeEntries[0].id).toBe('test-1');
      expect(rangeEntries[1].id).toBe('test-2');
    });

    it('should sort entries by date', () => {
      const entries: JournalEntry[] = [
        {
          id: 'test-2',
          content: 'Entry 2',
          date: new Date('2024-01-02'),
          createdAt: new Date(),
          updatedAt: new Date(),
          linkedEmotions: [],
          wordCount: 2,
          dayOfYear: 2
        },
        {
          id: 'test-1',
          content: 'Entry 1',
          date: new Date('2024-01-01'),
          createdAt: new Date(),
          updatedAt: new Date(),
          linkedEmotions: [],
          wordCount: 2,
          dayOfYear: 1
        }
      ];
      
      // Sort descending (newest first)
      const sortedDesc = sortEntriesByDate(entries);
      expect(sortedDesc[0].id).toBe('test-2');
      expect(sortedDesc[1].id).toBe('test-1');
      
      // Sort ascending (oldest first)
      const sortedAsc = sortEntriesByDate(entries, true);
      expect(sortedAsc[0].id).toBe('test-1');
      expect(sortedAsc[1].id).toBe('test-2');
    });
  });

  describe('Journal Navigation', () => {
    it('should provide correct navigation info', () => {
      const currentDate = new Date('2024-01-15');
      const entries: JournalEntry[] = [];
      
      const nav = getJournalNavigation(currentDate, entries);
      
      expect(nav.currentDate).toEqual(currentDate);
      expect(nav.canTurnPrevious).toBe(true);
      expect(nav.canTurnNext).toBe(true);
      expect(nav.currentDayOfYear).toBe(15);
      expect(nav.totalDaysInYear).toBe(366); // 2024 is a leap year
    });
  });

  describe('CSV Export', () => {
    it('should export entries to CSV format', () => {
      const entries: JournalEntry[] = [
        {
          id: 'test-1',
          content: 'Test content with "quotes"',
          date: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
          linkedEmotions: ['happy', 'excited'],
          wordCount: 4,
          tags: ['test', 'sample'],
          dayOfYear: 1
        }
      ];
      
      const csv = exportJournalToCSV(entries);
      
      expect(csv).toContain('Date,Content,Word Count,Linked Emotions,Tags,Created At,Updated At');
      expect(csv).toContain('2024-01-01');
      expect(csv).toContain('"Test content with ""quotes"""');
      expect(csv).toContain('"happy, excited"');
      expect(csv).toContain('"test, sample"');
    });

    it('should handle empty entries array', () => {
      const csv = exportJournalToCSV([]);
      expect(csv).toBe('Date,Content,Word Count,Linked Emotions,Tags,Created At,Updated At\n');
    });
  });

  describe('Entry Validation', () => {
    it('should validate valid entry', () => {
      const validEntry = {
        content: 'Valid content',
        date: new Date('2024-01-01'),
        linkedEmotions: ['happy'],
        tags: ['test']
      };
      
      const result = validateJournalEntry(validEntry);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject entry with empty content', () => {
      const invalidEntry = {
        content: '',
        date: new Date('2024-01-01')
      };
      
      const result = validateJournalEntry(invalidEntry);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content cannot be empty');
    });

    it('should reject entry with invalid date', () => {
      const invalidEntry = {
        content: 'Valid content',
        date: new Date('invalid')
      };
      
      const result = validateJournalEntry(invalidEntry);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid date is required');
    });

    it('should reject entry with invalid linkedEmotions', () => {
      const invalidEntry = {
        content: 'Valid content',
        date: new Date('2024-01-01'),
        linkedEmotions: 'not an array' as any
      };
      
      const result = validateJournalEntry(invalidEntry);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Linked emotions must be an array');
    });
  });
});