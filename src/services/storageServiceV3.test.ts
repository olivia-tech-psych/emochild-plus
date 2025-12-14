/**
 * Tests for Storage Service V3
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  saveJournalEntries, 
  loadJournalEntries,
  savePromptTracks,
  loadPromptTracks,
  initializeV3Storage
} from './storageServiceV3';
import { JournalEntry, PromptTrack } from '@/types';

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

describe('Storage Service V3', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Journal Entries', () => {
    it('should save and load journal entries correctly', () => {
      const testEntries: JournalEntry[] = [
        {
          id: 'test-1',
          content: 'Test journal entry',
          date: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
          linkedEmotions: ['emotion-1'],
          wordCount: 3,
          tags: ['test'],
          dayOfYear: 1
        }
      ];

      // Test saving
      const saveResult = saveJournalEntries(testEntries);
      expect(saveResult.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'emochild_journal_entries',
        JSON.stringify(testEntries)
      );

      // Mock loading
      localStorageMock.getItem.mockReturnValue(JSON.stringify(testEntries));
      
      const loadedEntries = loadJournalEntries();
      expect(loadedEntries).toHaveLength(1);
      expect(loadedEntries[0].content).toBe('Test journal entry');
    });

    it('should return empty array when no entries exist', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const entries = loadJournalEntries();
      
      expect(entries).toEqual([]);
    });
  });

  describe('Prompt Tracks', () => {
    it('should save and load prompt tracks correctly', () => {
      const testTracks: PromptTrack[] = [
        {
          id: 'inner-child',
          name: 'Inner Child',
          description: 'Test description',
          totalPrompts: 365,
          currentDay: 1
        }
      ];

      // Test saving
      const saveResult = savePromptTracks(testTracks);
      expect(saveResult.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'emochild_prompt_tracks',
        JSON.stringify(testTracks)
      );

      // Mock loading
      localStorageMock.getItem.mockReturnValue(JSON.stringify(testTracks));
      
      const loadedTracks = loadPromptTracks();
      expect(loadedTracks).toHaveLength(1);
      expect(loadedTracks[0].name).toBe('Inner Child');
    });
  });

  describe('Initialization', () => {
    it('should initialize v3 storage successfully', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = initializeV3Storage();
      
      expect(result.success).toBe(true);
    });
  });
});