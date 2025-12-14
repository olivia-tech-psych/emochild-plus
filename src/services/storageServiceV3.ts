/**
 * Extended Storage Service for EmoChild v3
 * Handles v3 features while maintaining backward compatibility with v2
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { 
  JournalEntry, 
  PromptTrack, 
  Prompt, 
  AnalyticsPreferences,
  EmoChildV3Storage 
} from '@/types';
import { storageService as v2StorageService } from './storageService';
import { performMigration, isMigrationNeeded, loadV3Data } from './migrationService';

// Storage keys for v3 features
const V3_STORAGE_KEYS = {
  JOURNAL_ENTRIES: 'emochild_journal_entries',
  PROMPT_TRACKS: 'emochild_prompt_tracks',
  PROMPTS: 'emochild_prompts',
  ANALYTICS_PREFERENCES: 'emochild_analytics_preferences',
} as const;

// Track last error for error handling
let lastError: string | null = null;

/**
 * Storage operation result
 */
export interface StorageResult {
  success: boolean;
  error?: string;
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Initialize v3 storage with migration if needed
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export function initializeV3Storage(): StorageResult {
  try {
    if (isMigrationNeeded()) {
      const migrationResult = performMigration();
      
      if (!migrationResult.success) {
        lastError = migrationResult.error || 'Migration failed';
        return { success: false, error: lastError };
      }
      
      if (migrationResult.warnings && migrationResult.warnings.length > 0) {
        console.log('Migration warnings:', migrationResult.warnings);
      }
    }
    
    return { success: true };
  } catch (error) {
    lastError = `Failed to initialize v3 storage: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(lastError);
    return { success: false, error: lastError };
  }
}

/**
 * Save journal entries to localStorage
 * Requirements: 1.3, 2.1, 5.1
 */
export function saveJournalEntries(entries: JournalEntry[]): StorageResult {
  try {
    if (!isLocalStorageAvailable()) {
      lastError = 'Storage is not available - journal entries won\'t persist between sessions';
      console.error('localStorage is not available');
      return { success: false, error: lastError };
    }
    
    const serialized = JSON.stringify(entries);
    localStorage.setItem(V3_STORAGE_KEYS.JOURNAL_ENTRIES, serialized);
    lastError = null;
    return { success: true };
  } catch (error) {
    console.error('Failed to save journal entries to localStorage:', error);
    
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      lastError = 'Storage full - some journal entries may not save';
    } else {
      lastError = 'Failed to save journal entries - changes may not persist';
    }
    
    return { success: false, error: lastError };
  }
}

/**
 * Load journal entries from localStorage
 * Requirements: 1.3, 2.1, 5.2
 */
export function loadJournalEntries(): JournalEntry[] {
  try {
    if (!isLocalStorageAvailable()) {
      console.error('localStorage is not available');
      return [];
    }
    
    const serialized = localStorage.getItem(V3_STORAGE_KEYS.JOURNAL_ENTRIES);
    
    if (!serialized) {
      return [];
    }
    
    const entries = JSON.parse(serialized);
    
    if (!Array.isArray(entries)) {
      console.error('Invalid journal entries data in localStorage');
      return [];
    }
    
    // Convert date strings back to Date objects
    const migratedEntries = entries.map((entry: any) => ({
      ...entry,
      date: new Date(entry.date),
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt)
    }));
    
    return migratedEntries;
  } catch (error) {
    console.error('Failed to load journal entries from localStorage:', error);
    return [];
  }
}

/**
 * Save prompt tracks to localStorage
 * Requirements: 3.1, 3.2, 5.1
 */
export function savePromptTracks(tracks: PromptTrack[]): StorageResult {
  try {
    if (!isLocalStorageAvailable()) {
      lastError = 'Storage is not available - prompt tracks won\'t persist between sessions';
      console.error('localStorage is not available');
      return { success: false, error: lastError };
    }
    
    const serialized = JSON.stringify(tracks);
    localStorage.setItem(V3_STORAGE_KEYS.PROMPT_TRACKS, serialized);
    lastError = null;
    return { success: true };
  } catch (error) {
    console.error('Failed to save prompt tracks to localStorage:', error);
    lastError = 'Failed to save prompt tracks - changes may not persist';
    return { success: false, error: lastError };
  }
}

/**
 * Load prompt tracks from localStorage
 * Requirements: 3.1, 3.2, 5.2
 */
export function loadPromptTracks(): PromptTrack[] {
  try {
    if (!isLocalStorageAvailable()) {
      console.error('localStorage is not available');
      return [];
    }
    
    const serialized = localStorage.getItem(V3_STORAGE_KEYS.PROMPT_TRACKS);
    
    if (!serialized) {
      return [];
    }
    
    const tracks = JSON.parse(serialized);
    
    if (!Array.isArray(tracks)) {
      console.error('Invalid prompt tracks data in localStorage');
      return [];
    }
    
    return tracks;
  } catch (error) {
    console.error('Failed to load prompt tracks from localStorage:', error);
    return [];
  }
}

/**
 * Save prompts to localStorage
 * Requirements: 3.1, 3.2, 3.4, 5.1
 */
export function savePrompts(prompts: Prompt[]): StorageResult {
  try {
    if (!isLocalStorageAvailable()) {
      lastError = 'Storage is not available - prompts won\'t persist between sessions';
      console.error('localStorage is not available');
      return { success: false, error: lastError };
    }
    
    const serialized = JSON.stringify(prompts);
    localStorage.setItem(V3_STORAGE_KEYS.PROMPTS, serialized);
    lastError = null;
    return { success: true };
  } catch (error) {
    console.error('Failed to save prompts to localStorage:', error);
    lastError = 'Failed to save prompts - changes may not persist';
    return { success: false, error: lastError };
  }
}

/**
 * Load prompts from localStorage
 * Requirements: 3.1, 3.2, 3.4, 5.2
 */
export function loadPrompts(): Prompt[] {
  try {
    if (!isLocalStorageAvailable()) {
      console.error('localStorage is not available');
      return [];
    }
    
    const serialized = localStorage.getItem(V3_STORAGE_KEYS.PROMPTS);
    
    if (!serialized) {
      return [];
    }
    
    const prompts = JSON.parse(serialized);
    
    if (!Array.isArray(prompts)) {
      console.error('Invalid prompts data in localStorage');
      return [];
    }
    
    // Convert date strings back to Date objects
    const migratedPrompts = prompts.map((prompt: any) => ({
      ...prompt,
      completedAt: prompt.completedAt ? new Date(prompt.completedAt) : undefined
    }));
    
    return migratedPrompts;
  } catch (error) {
    console.error('Failed to load prompts from localStorage:', error);
    return [];
  }
}

/**
 * Save analytics preferences to localStorage
 * Requirements: 4.1, 4.5, 5.1
 */
export function saveAnalyticsPreferences(preferences: AnalyticsPreferences): StorageResult {
  try {
    if (!isLocalStorageAvailable()) {
      lastError = 'Storage is not available - analytics preferences won\'t persist between sessions';
      console.error('localStorage is not available');
      return { success: false, error: lastError };
    }
    
    const serialized = JSON.stringify(preferences);
    localStorage.setItem(V3_STORAGE_KEYS.ANALYTICS_PREFERENCES, serialized);
    lastError = null;
    return { success: true };
  } catch (error) {
    console.error('Failed to save analytics preferences to localStorage:', error);
    lastError = 'Failed to save analytics preferences - changes may not persist';
    return { success: false, error: lastError };
  }
}

/**
 * Load analytics preferences from localStorage
 * Requirements: 4.1, 4.5, 5.2
 */
export function loadAnalyticsPreferences(): AnalyticsPreferences | null {
  try {
    if (!isLocalStorageAvailable()) {
      console.error('localStorage is not available');
      return null;
    }
    
    const serialized = localStorage.getItem(V3_STORAGE_KEYS.ANALYTICS_PREFERENCES);
    
    if (!serialized) {
      return null;
    }
    
    const preferences = JSON.parse(serialized);
    
    // Convert date strings back to Date objects
    const migratedPreferences: AnalyticsPreferences = {
      ...preferences,
      defaultTimeRange: {
        ...preferences.defaultTimeRange,
        start: new Date(preferences.defaultTimeRange.start),
        end: new Date(preferences.defaultTimeRange.end)
      },
      lastViewedInsights: new Date(preferences.lastViewedInsights)
    };
    
    return migratedPreferences;
  } catch (error) {
    console.error('Failed to load analytics preferences from localStorage:', error);
    return null;
  }
}

/**
 * Load complete v3 data structure
 * Requirements: 5.2, 5.3, 5.4
 */
export function loadCompleteV3Data(): EmoChildV3Storage | null {
  try {
    // Initialize v3 storage if needed
    const initResult = initializeV3Storage();
    if (!initResult.success) {
      console.error('Failed to initialize v3 storage:', initResult.error);
      return null;
    }
    
    return loadV3Data();
  } catch (error) {
    console.error('Failed to load complete v3 data:', error);
    return null;
  }
}

/**
 * Clear all v3 data (for testing/reset purposes)
 * Requirements: 5.4
 */
export function clearAllV3Data(): void {
  try {
    if (!isLocalStorageAvailable()) {
      console.error('localStorage is not available');
      return;
    }
    
    // Clear v3 specific data
    localStorage.removeItem(V3_STORAGE_KEYS.JOURNAL_ENTRIES);
    localStorage.removeItem(V3_STORAGE_KEYS.PROMPT_TRACKS);
    localStorage.removeItem(V3_STORAGE_KEYS.PROMPTS);
    localStorage.removeItem(V3_STORAGE_KEYS.ANALYTICS_PREFERENCES);
    
    // Clear v2 data using existing service
    v2StorageService.clearAll();
  } catch (error) {
    console.error('Failed to clear v3 data:', error);
  }
}

/**
 * Get the last error that occurred
 */
export function getLastError(): string | null {
  return lastError;
}

/**
 * Export the v3 storage service
 */
export const storageServiceV3 = {
  // v3 specific methods
  initializeV3Storage,
  saveJournalEntries,
  loadJournalEntries,
  savePromptTracks,
  loadPromptTracks,
  savePrompts,
  loadPrompts,
  saveAnalyticsPreferences,
  loadAnalyticsPreferences,
  loadCompleteV3Data,
  clearAllV3Data,
  
  // Re-export v2 methods for backward compatibility (getLastError will come from v2StorageService)
  ...v2StorageService,
  
  // Override getLastError to handle both v2 and v3 errors
  getLastError: () => lastError || v2StorageService.getLastError()
};