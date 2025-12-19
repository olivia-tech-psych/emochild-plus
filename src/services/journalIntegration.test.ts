/**
 * Integration tests for Journal functionality
 * Tests the integration between journal utilities and storage service
 * Requirements: 1.3, 2.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  saveJournalEntries, 
  loadJournalEntries,
  initializeV3Storage
} from './storageServiceV3';
import {
  createJournalEntry,
  updateJournalEntry,
  findEntryForDate,
  exportJournalToCSV
} from '../utils/journalUtils';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Journal Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create, save, and load journal entries', () => {
    // Initialize v3 storage
    localStorageMock.getItem.mockImplementation((key: string) => {
      return null; // Fresh installation
    });
    
    const initResult = initializeV3Storage();
    expect(initResult.success).toBe(true);
    
    // Create a journal entry
    const content = 'Today I felt happy and grateful for the sunshine.';
    const date = new Date('2024-01-15');
    const linkedEmotions = ['happy', 'grateful'];
    
    const entry = createJournalEntry(content, date, linkedEmotions);
    
    expect(entry.content).toBe(content);
    expect(entry.linkedEmotions).toEqual(linkedEmotions);
    expect(entry.wordCount).toBe(9);
    expect(entry.dayOfYear).toBe(15);
    
    // Save the entry
    const saveResult = saveJournalEntries([entry]);
    expect(saveResult.success).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'emochild_journal_entries',
      expect.any(String)
    );
    
    // Mock loading the entry back
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'emochild_journal_entries') {
        return JSON.stringify([entry]);
      }
      return null;
    });
    
    const loadedEntries = loadJournalEntries();
    expect(loadedEntries).toHaveLength(1);
    expect(loadedEntries[0].content).toBe(content);
    expect(loadedEntries[0].linkedEmotions).toEqual(linkedEmotions);
  });

  it('should update journal entries and maintain data integrity', async () => {
    // Create an initial entry
    const originalContent = 'Original entry content';
    const date = new Date('2024-01-15');
    const entry = createJournalEntry(originalContent, date);
    
    expect(entry.wordCount).toBe(3);
    
    // Add a small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));
    
    // Update the entry
    const updatedContent = 'Updated entry content with more words';
    const updatedEntry = updateJournalEntry(entry, {
      content: updatedContent,
      linkedEmotions: ['happy']
    });
    
    expect(updatedEntry.content).toBe(updatedContent);
    expect(updatedEntry.wordCount).toBe(6);
    expect(updatedEntry.linkedEmotions).toEqual(['happy']);
    expect(updatedEntry.id).toBe(entry.id); // ID should remain the same
    expect(updatedEntry.updatedAt.getTime()).toBeGreaterThanOrEqual(entry.updatedAt.getTime());
  });

  it('should find entries by date', () => {
    // Create multiple entries
    const entry1 = createJournalEntry('Entry 1', new Date('2024-01-15'));
    const entry2 = createJournalEntry('Entry 2', new Date('2024-01-16'));
    const entry3 = createJournalEntry('Entry 3', new Date('2024-01-17'));
    
    const entries = [entry1, entry2, entry3];
    
    // Find entry for specific date
    const found = findEntryForDate(entries, new Date('2024-01-16'));
    expect(found).toBeDefined();
    expect(found?.content).toBe('Entry 2');
    
    // Try to find non-existent entry
    const notFound = findEntryForDate(entries, new Date('2024-01-20'));
    expect(notFound).toBeUndefined();
  });

  it('should export journal entries to CSV format', () => {
    // Create entries with various data
    const entry1 = createJournalEntry(
      'First entry with "quotes"',
      new Date('2024-01-15'),
      ['happy', 'excited'],
      ['personal', 'growth']
    );
    
    const entry2 = createJournalEntry(
      'Second entry',
      new Date('2024-01-16'),
      ['calm'],
      ['reflection']
    );
    
    const entries = [entry1, entry2];
    
    // Export to CSV
    const csv = exportJournalToCSV(entries);
    
    // Verify CSV structure
    expect(csv).toContain('Date,Content,Word Count,Linked Emotions,Tags,Created At,Updated At');
    expect(csv).toContain('2024-01-15');
    expect(csv).toContain('2024-01-16');
    expect(csv).toContain('"First entry with ""quotes"""'); // Quotes should be escaped
    expect(csv).toContain('"happy, excited"');
    expect(csv).toContain('"personal, growth"');
  });

  it('should handle empty journal entries gracefully', () => {
    // Save empty array
    const saveResult = saveJournalEntries([]);
    expect(saveResult.success).toBe(true);
    
    // Mock loading empty array
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'emochild_journal_entries') {
        return JSON.stringify([]);
      }
      return null;
    });
    
    const loadedEntries = loadJournalEntries();
    expect(loadedEntries).toEqual([]);
    
    // Export empty entries
    const csv = exportJournalToCSV([]);
    expect(csv).toBe('Date,Content,Word Count,Linked Emotions,Tags,Created At,Updated At\n');
  });

  it('should maintain date-based organization', () => {
    // Create entries for different dates
    const entries = [
      createJournalEntry('Entry 1', new Date('2024-01-01')),
      createJournalEntry('Entry 2', new Date('2024-02-01')),
      createJournalEntry('Entry 3', new Date('2024-03-01'))
    ];
    
    // Verify day of year calculations
    expect(entries[0].dayOfYear).toBe(1);
    expect(entries[1].dayOfYear).toBe(32);
    expect(entries[2].dayOfYear).toBe(61);
    
    // Save and verify
    const saveResult = saveJournalEntries(entries);
    expect(saveResult.success).toBe(true);
  });
});
