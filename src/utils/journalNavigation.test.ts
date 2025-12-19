/**
 * Tests for journal page navigation system
 * Requirements: 1.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  JournalPageNavigator,
  getDayOfYear,
  getDateFromDayOfYear,
  isLeapYear,
  getDaysInYear,
  getJournalNavigation,
  createJournalEntry
} from './journalUtils';
import { JournalEntry } from '@/types';

describe('Journal Navigation System', () => {
  describe('Leap Year Calculations', () => {
    it('should correctly identify leap years', () => {
      expect(isLeapYear(2024)).toBe(true);  // Divisible by 4, not by 100
      expect(isLeapYear(2023)).toBe(false); // Not divisible by 4
      expect(isLeapYear(1900)).toBe(false); // Divisible by 100, not by 400
      expect(isLeapYear(2000)).toBe(true);  // Divisible by 400
    });

    it('should return correct days in year', () => {
      expect(getDaysInYear(2024)).toBe(366); // Leap year
      expect(getDaysInYear(2023)).toBe(365); // Regular year
      expect(getDaysInYear(2000)).toBe(366); // Leap year
      expect(getDaysInYear(1900)).toBe(365); // Not a leap year
    });
  });

  describe('Day of Year Calculations', () => {
    it('should calculate day of year correctly for regular year', () => {
      expect(getDayOfYear(new Date(2023, 0, 1))).toBe(1);   // January 1st
      expect(getDayOfYear(new Date(2023, 11, 31))).toBe(365); // December 31st
      expect(getDayOfYear(new Date(2023, 1, 28))).toBe(59);  // February 28th
    });

    it('should calculate day of year correctly for leap year', () => {
      expect(getDayOfYear(new Date(2024, 0, 1))).toBe(1);   // January 1st
      expect(getDayOfYear(new Date(2024, 11, 31))).toBe(366); // December 31st
      expect(getDayOfYear(new Date(2024, 1, 29))).toBe(60);  // February 29th (leap day)
    });

    it('should convert day of year back to date correctly', () => {
      const date1 = getDateFromDayOfYear(1, 2023);
      expect(date1.getMonth()).toBe(0); // January
      expect(date1.getDate()).toBe(1);

      const date365 = getDateFromDayOfYear(365, 2023);
      expect(date365.getMonth()).toBe(11); // December
      expect(date365.getDate()).toBe(31);

      // Leap year test
      const date366 = getDateFromDayOfYear(366, 2024);
      expect(date366.getMonth()).toBe(11); // December
      expect(date366.getDate()).toBe(31);
    });

    it('should throw error for invalid day of year', () => {
      expect(() => getDateFromDayOfYear(0, 2023)).toThrow();
      expect(() => getDateFromDayOfYear(366, 2023)).toThrow(); // 2023 is not a leap year
      expect(() => getDateFromDayOfYear(367, 2024)).toThrow(); // Even leap years only have 366 days
    });
  });

  describe('JournalPageNavigator', () => {
    let navigator: JournalPageNavigator;
    let testEntries: JournalEntry[];

    beforeEach(() => {
      // Create test entries for 2024 (leap year)
      testEntries = [
        createJournalEntry('Entry 1', new Date(2024, 0, 1)), // January 1st
        createJournalEntry('Entry 2', new Date(2024, 0, 15)), // January 15th
        createJournalEntry('Entry 3', new Date(2024, 1, 29)), // February 29th (leap day)
        createJournalEntry('Entry 4', new Date(2024, 11, 31)), // December 31st
      ];
      
      navigator = new JournalPageNavigator(testEntries, 2024);
    });

    it('should initialize with correct year and entries', () => {
      expect(navigator.getCurrentYear()).toBe(2024);
      expect(navigator.getTotalPages()).toBe(366); // Leap year
    });

    it('should get correct page numbers for dates', () => {
      expect(navigator.getPageNumber(new Date(2024, 0, 1))).toBe(1);
      expect(navigator.getPageNumber(new Date(2024, 1, 29))).toBe(60); // Leap day
      expect(navigator.getPageNumber(new Date(2024, 11, 31))).toBe(366);
    });

    it('should get correct dates for page numbers', () => {
      const date1 = navigator.getDateForPage(1);
      expect(date1.getMonth()).toBe(0);
      expect(date1.getDate()).toBe(1);

      const date60 = navigator.getDateForPage(60);
      expect(date60.getMonth()).toBe(1);
      expect(date60.getDate()).toBe(29); // February 29th in leap year
    });

    it('should navigate to next page correctly', () => {
      const currentDate = new Date(2024, 0, 1); // January 1st
      const nextDate = navigator.getNextPage(currentDate);
      
      expect(nextDate).not.toBeNull();
      expect(nextDate!.getMonth()).toBe(0);
      expect(nextDate!.getDate()).toBe(2); // January 2nd
    });

    it('should navigate to previous page correctly', () => {
      const currentDate = new Date(2024, 0, 2); // January 2nd
      const previousDate = navigator.getPreviousPage(currentDate);
      
      expect(previousDate).not.toBeNull();
      expect(previousDate!.getMonth()).toBe(0);
      expect(previousDate!.getDate()).toBe(1); // January 1st
    });

    it('should return null when trying to go beyond boundaries', () => {
      const firstDay = new Date(2024, 0, 1);
      const lastDay = new Date(2024, 11, 31);
      
      expect(navigator.getPreviousPage(firstDay)).toBeNull();
      expect(navigator.getNextPage(lastDay)).toBeNull();
    });

    it('should jump to today correctly', () => {
      const today = navigator.jumpToToday();
      const actualToday = new Date();
      
      expect(today.toDateString()).toBe(actualToday.toDateString());
      expect(navigator.getCurrentYear()).toBe(actualToday.getFullYear());
    });

    it('should identify pages with entries', () => {
      expect(navigator.hasEntryForPage(new Date(2024, 0, 1))).toBe(true);
      expect(navigator.hasEntryForPage(new Date(2024, 0, 2))).toBe(false);
      expect(navigator.hasEntryForPage(new Date(2024, 1, 29))).toBe(true); // Leap day
    });

    it('should get pages with entries in chronological order', () => {
      const pagesWithEntries = navigator.getPagesWithEntries();
      
      expect(pagesWithEntries).toHaveLength(4);
      expect(pagesWithEntries[0].getTime()).toBeLessThan(pagesWithEntries[1].getTime());
      expect(pagesWithEntries[1].getTime()).toBeLessThan(pagesWithEntries[2].getTime());
      expect(pagesWithEntries[2].getTime()).toBeLessThan(pagesWithEntries[3].getTime());
    });

    it('should find next and previous pages with entries', () => {
      const currentDate = new Date(2024, 0, 10); // January 10th (between entries)
      
      const nextWithEntry = navigator.getNextPageWithEntry(currentDate);
      expect(nextWithEntry).not.toBeNull();
      expect(nextWithEntry!.getDate()).toBe(15); // January 15th
      
      const previousWithEntry = navigator.getPreviousPageWithEntry(currentDate);
      expect(previousWithEntry).not.toBeNull();
      expect(previousWithEntry!.getDate()).toBe(1); // January 1st
    });

    it('should provide comprehensive navigation state', () => {
      const currentDate = new Date(2024, 0, 15); // January 15th (has entry)
      const state = navigator.getNavigationState(currentDate);
      
      expect(state.currentDate).toEqual(currentDate);
      expect(state.currentPageNumber).toBe(15);
      expect(state.totalPages).toBe(366);
      expect(state.canGoNext).toBe(true);
      expect(state.canGoPrevious).toBe(true);
      expect(state.hasCurrentEntry).toBe(true);
      expect(state.currentEntry).toBeDefined();
      expect(state.nextPageWithEntry).not.toBeNull();
      expect(state.previousPageWithEntry).not.toBeNull();
    });

    it('should handle year changes correctly', () => {
      navigator.setYear(2023); // Non-leap year
      expect(navigator.getCurrentYear()).toBe(2023);
      expect(navigator.getTotalPages()).toBe(365);
      
      // Should not find entries from 2024 when looking in 2023
      expect(navigator.hasEntryForPage(new Date(2023, 0, 1))).toBe(false);
    });

    it('should handle future date restrictions', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10); // 10 days in the future
      
      expect(navigator.jumpToDate(futureDate)).toBeNull();
    });
  });

  describe('getJournalNavigation (legacy function)', () => {
    it('should work with leap year considerations', () => {
      const testEntries = [
        createJournalEntry('Test', new Date(2024, 1, 29)) // February 29th, 2024
      ];
      
      const navigation = getJournalNavigation(new Date(2024, 1, 29), testEntries);
      
      expect(navigation.totalDaysInYear).toBe(366);
      expect(navigation.currentDayOfYear).toBe(60);
    });

    it('should handle regular year correctly', () => {
      const navigation = getJournalNavigation(new Date(2023, 1, 28), []); // February 28th, 2023
      
      expect(navigation.totalDaysInYear).toBe(365);
      expect(navigation.currentDayOfYear).toBe(59);
    });
  });

  describe('Edge Cases', () => {
    it('should handle December 31st in leap year', () => {
      const navigator = new JournalPageNavigator([], 2024);
      const lastDay = new Date(2024, 11, 31);
      
      expect(navigator.getPageNumber(lastDay)).toBe(366);
      expect(navigator.getNextPage(lastDay)).toBeNull();
    });

    it('should handle February 29th correctly', () => {
      const navigator = new JournalPageNavigator([], 2024);
      const leapDay = new Date(2024, 1, 29);
      
      expect(navigator.getPageNumber(leapDay)).toBe(60);
      
      const nextDay = navigator.getNextPage(leapDay);
      expect(nextDay).not.toBeNull();
      expect(nextDay!.getMonth()).toBe(2); // March
      expect(nextDay!.getDate()).toBe(1);
    });

    it('should handle year boundary correctly', () => {
      const navigator = new JournalPageNavigator([], 2024);
      
      // Should not allow navigation to different year
      expect(() => navigator.getPageNumber(new Date(2023, 11, 31))).toThrow();
      expect(navigator.jumpToDate(new Date(2023, 0, 1))).toBeNull();
    });
  });
});