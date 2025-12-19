/**
 * Export Service Tests
 * Tests for CSV export functionality
 * Requirements: 2.1, 2.2, 2.3
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  exportJournalToCSV, 
  getJournalCSVContent, 
  generateJournalCSV,
  validateEntriesForExport,
  exportService
} from './exportService';
import { JournalEntry, EmotionLog } from '@/types';

// Mock DOM APIs for testing
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

// Setup DOM mocks
beforeEach(() => {
  // Mock URL methods
  global.URL = {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL
  } as any;
  
  // Mock document methods
  const mockLink = {
    href: '',
    download: '',
    style: { display: '' },
    click: mockClick
  };
  
  global.document = {
    createElement: vi.fn(() => mockLink),
    body: {
      appendChild: mockAppendChild,
      removeChild: mockRemoveChild
    }
  } as any;
  
  // Mock window
  global.window = {} as any;
  
  // Reset mocks
  mockCreateObjectURL.mockReturnValue('blob:mock-url');
  mockClick.mockClear();
  mockAppendChild.mockClear();
  mockRemoveChild.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

// Test data
const createTestEntry = (overrides: Partial<JournalEntry> = {}): JournalEntry => ({
  id: 'test-entry-1',
  content: 'This is a test journal entry with some content.',
  date: new Date('2024-01-15'),
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:30:00Z'),
  linkedEmotions: ['emotion-1', 'emotion-2'],
  wordCount: 10,
  tags: ['reflection', 'test'],
  dayOfYear: 15,
  ...overrides
});

const createTestEmotion = (overrides: Partial<EmotionLog> = {}): EmotionLog => ({
  id: 'emotion-1',
  text: 'feeling grateful',
  action: 'expressed',
  timestamp: new Date('2024-01-15T09:00:00Z').getTime(),
  textColor: 'white',
  ...overrides
});

describe('exportService', () => {
  describe('generateJournalCSV', () => {
    it('should generate CSV with headers for empty entries', () => {
      const csv = generateJournalCSV([]);
      expect(csv).toBe('Date,Content,Word Count,Linked Emotions,Tags,Created At,Updated At\n');
    });

    it('should generate CSV with single entry', () => {
      const entries = [createTestEntry()];
      const emotions = [createTestEmotion()];
      
      const csv = generateJournalCSV(entries, emotions);
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('Date,Content,Word Count,Linked Emotions,Tags,Created At,Updated At');
      expect(lines[1]).toContain('2024-01-15');
      expect(lines[1]).toContain('This is a test journal entry with some content.');
      expect(lines[1]).toContain('10');
      expect(lines[1]).toContain('feeling grateful (expressed, 2024-01-15)');
    });

    it('should handle entries with quotes and commas in content', () => {
      const entries = [createTestEntry({
        content: 'This entry has "quotes" and, commas in it.'
      })];
      
      const csv = generateJournalCSV(entries, []);
      expect(csv).toContain('"This entry has ""quotes"" and, commas in it."');
    });

    it('should handle entries with newlines in content', () => {
      const entries = [createTestEntry({
        content: 'This entry has\nmultiple\nlines.'
      })];
      
      const csv = generateJournalCSV(entries, []);
      expect(csv).toContain('"This entry has\nmultiple\nlines."');
    });

    it('should sort entries by date when requested', () => {
      const entries = [
        createTestEntry({ 
          id: 'entry-2', 
          date: new Date('2024-01-20'),
          content: 'Second entry'
        }),
        createTestEntry({ 
          id: 'entry-1', 
          date: new Date('2024-01-10'),
          content: 'First entry'
        })
      ];
      
      const csv = generateJournalCSV(entries, [], { sortByDate: true });
      const lines = csv.split('\n');
      
      expect(lines[1]).toContain('First entry');
      expect(lines[2]).toContain('Second entry');
    });

    it('should exclude emotions when includeEmotions is false', () => {
      const entries = [createTestEntry()];
      const emotions = [createTestEmotion()];
      
      const csv = generateJournalCSV(entries, emotions, { includeEmotions: false });
      const lines = csv.split('\n');
      
      expect(lines[0]).not.toContain('Linked Emotions');
      expect(lines[1]).not.toContain('feeling grateful');
    });

    it('should exclude metadata when includeMetadata is false', () => {
      const entries = [createTestEntry()];
      
      const csv = generateJournalCSV(entries, [], { includeMetadata: false });
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('Date,Content,Word Count,Linked Emotions');
      expect(lines[1]).not.toContain('2024-01-15T10:00:00');
    });

    it('should handle entries with no linked emotions', () => {
      const entries = [createTestEntry({ linkedEmotions: [] })];
      
      const csv = generateJournalCSV(entries, []);
      const lines = csv.split('\n');
      
      expect(lines[1]).toContain('""'); // Empty emotions field
    });

    it('should handle multiple linked emotions', () => {
      const entries = [createTestEntry({ linkedEmotions: ['emotion-1', 'emotion-2'] })];
      const emotions = [
        createTestEmotion({ id: 'emotion-1', text: 'happy' }),
        createTestEmotion({ id: 'emotion-2', text: 'excited', action: 'suppressed' })
      ];
      
      const csv = generateJournalCSV(entries, emotions);
      expect(csv).toContain('happy (expressed, 2024-01-15); excited (suppressed, 2024-01-15)');
    });

    it('should handle missing emotion references gracefully', () => {
      const entries = [createTestEntry({ linkedEmotions: ['missing-emotion'] })];
      const emotions = [createTestEmotion()];
      
      const csv = generateJournalCSV(entries, emotions);
      const lines = csv.split('\n');
      
      expect(lines[1]).toContain('""'); // Empty emotions field since emotion not found
    });
  });

  describe('validateEntriesForExport', () => {
    it('should validate correct entries', () => {
      const entries = [createTestEntry()];
      const result = validateEntriesForExport(entries);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const entries = [createTestEntry({ id: '' })];
      const result = validateEntriesForExport(entries);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Entry at index 0 is missing an ID');
    });

    it('should detect invalid dates', () => {
      const entries = [createTestEntry({ date: new Date('invalid') })];
      const result = validateEntriesForExport(entries);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Entry at index 0 has invalid date');
    });

    it('should warn about empty content', () => {
      const entries = [createTestEntry({ content: '' })];
      const result = validateEntriesForExport(entries);
      
      expect(result.isValid).toBe(true); // Still valid, just a warning
      expect(result.warnings).toContain('Entry at index 0 has empty content');
    });

    it('should detect invalid array fields', () => {
      const entries = [createTestEntry({ 
        linkedEmotions: 'not-an-array' as any,
        tags: 'not-an-array' as any
      })];
      const result = validateEntriesForExport(entries);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Entry at index 0 has invalid linkedEmotions (must be array)');
      expect(result.errors).toContain('Entry at index 0 has invalid tags (must be array)');
    });

    it('should handle non-array input', () => {
      const result = validateEntriesForExport('not-an-array' as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Entries must be an array');
    });

    it('should warn about empty entries array', () => {
      const result = validateEntriesForExport([]);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('No entries to export');
    });
  });

  describe('exportJournalToCSV', () => {
    it('should successfully export entries to CSV', () => {
      const entries = [createTestEntry()];
      const emotions = [createTestEmotion()];
      
      const result = exportJournalToCSV(entries, emotions);
      
      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/emochild_journal_export_\d{4}-\d{2}-\d{2}\.csv/);
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });

    it('should handle custom filename', () => {
      const entries = [createTestEntry()];
      const result = exportJournalToCSV(entries, [], { filename: 'my_custom_export' });
      
      expect(result.success).toBe(true);
      expect(result.filename).toBe('my_custom_export.csv');
    });

    it('should sanitize custom filename', () => {
      const entries = [createTestEntry()];
      const result = exportJournalToCSV(entries, [], { filename: 'my/custom\\export*file' });
      
      expect(result.success).toBe(true);
      expect(result.filename).toBe('my_custom_export_file.csv');
    });

    it('should handle empty entries', () => {
      const result = exportJournalToCSV([]);
      
      expect(result.success).toBe(true);
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('should handle null entries', () => {
      const result = exportJournalToCSV(null as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No journal entries provided for export');
    });

    it('should handle server-side environment', () => {
      // Remove window to simulate server environment
      delete (global as any).window;
      delete (global as any).document;
      
      const entries = [createTestEntry()];
      const result = exportJournalToCSV(entries);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Download functionality is only available in browser environment');
    });
  });

  describe('getJournalCSVContent', () => {
    it('should return CSV content as string', () => {
      const entries = [createTestEntry()];
      const emotions = [createTestEmotion()];
      
      const content = getJournalCSVContent(entries, emotions);
      
      expect(typeof content).toBe('string');
      expect(content).toContain('Date,Content,Word Count');
      expect(content).toContain('This is a test journal entry');
    });

    it('should handle empty entries', () => {
      const content = getJournalCSVContent([]);
      
      expect(content).toBe('Date,Content,Word Count,Linked Emotions,Tags,Created At,Updated At\n');
    });
  });

  describe('edge cases', () => {
    it('should handle entries with special characters', () => {
      const entries = [createTestEntry({
        content: 'Entry with émojis 🎉 and spëcial characters ñ',
        tags: ['émotions', 'spëcial']
      })];
      
      const csv = generateJournalCSV(entries, []);
      expect(csv).toContain('Entry with émojis 🎉 and spëcial characters ñ');
      expect(csv).toContain('émotions, spëcial');
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(10000);
      const entries = [createTestEntry({ content: longContent })];
      
      const csv = generateJournalCSV(entries, []);
      expect(csv).toContain(longContent);
    });

    it('should handle entries with no tags', () => {
      const entries = [createTestEntry({ tags: undefined })];
      
      const csv = generateJournalCSV(entries, []);
      const lines = csv.split('\n');
      
      expect(lines[1]).toContain('""'); // Empty tags field
    });

    it('should handle emotions with different timestamps', () => {
      const entries = [createTestEntry({ linkedEmotions: ['emotion-1'] })];
      const emotions = [createTestEmotion({ 
        id: 'emotion-1',
        timestamp: new Date('2024-01-15T15:30:00Z').getTime()
      })];
      
      const csv = generateJournalCSV(entries, emotions);
      expect(csv).toContain('feeling grateful (expressed, 2024-01-15)');
    });
  });
});