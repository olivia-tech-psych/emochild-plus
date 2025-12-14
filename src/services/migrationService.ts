/**
 * Migration Service for EmoChild v3
 * Handles backward compatibility with v2 data and schema migrations
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { 
  EmoChildV2Storage, 
  EmoChildV3Storage, 
  EmotionLog, 
  CreatureState, 
  CreatureCustomization,
  JournalEntry,
  PromptTrack,
  Prompt,
  AnalyticsPreferences,
  TimeRange
} from '@/types';

// Current migration version
const CURRENT_MIGRATION_VERSION = '3.0.0';

// Storage keys for migration
const MIGRATION_STORAGE_KEYS = {
  MIGRATION_VERSION: 'emochild_migration_version',
  JOURNAL_ENTRIES: 'emochild_journal_entries',
  PROMPT_TRACKS: 'emochild_prompt_tracks',
  PROMPTS: 'emochild_prompts',
  ANALYTICS_PREFERENCES: 'emochild_analytics_preferences',
} as const;

/**
 * Migration result interface
 */
export interface MigrationResult {
  success: boolean;
  version: string;
  migratedData?: EmoChildV3Storage;
  error?: string;
  warnings?: string[];
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
 * Get the current migration version from storage
 * Requirements: 5.3, 5.4
 */
function getCurrentMigrationVersion(): string | null {
  try {
    if (!isLocalStorageAvailable()) {
      return null;
    }
    
    return localStorage.getItem(MIGRATION_STORAGE_KEYS.MIGRATION_VERSION);
  } catch (error) {
    console.error('Failed to get migration version:', error);
    return null;
  }
}

/**
 * Set the migration version in storage
 * Requirements: 5.3, 5.4
 */
function setMigrationVersion(version: string): boolean {
  try {
    if (!isLocalStorageAvailable()) {
      return false;
    }
    
    localStorage.setItem(MIGRATION_STORAGE_KEYS.MIGRATION_VERSION, version);
    return true;
  } catch (error) {
    console.error('Failed to set migration version:', error);
    return false;
  }
}

/**
 * Create default analytics preferences
 * Requirements: 4.1, 4.5
 */
function createDefaultAnalyticsPreferences(): AnalyticsPreferences {
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  return {
    defaultTimeRange: {
      start: oneMonthAgo,
      end: now,
      preset: 'month'
    },
    enabledInsights: ['expression-ratio', 'common-emotions', 'streak'],
    lastViewedInsights: now
  };
}

/**
 * Create default prompt tracks
 * Requirements: 3.1, 3.2, 3.3
 */
function createDefaultPromptTracks(): PromptTrack[] {
  return [
    {
      id: 'inner-child',
      name: 'Inner Child',
      description: 'Gentle prompts to reconnect with your playful, curious, and authentic self',
      totalPrompts: 365,
      currentDay: 1
    },
    {
      id: 'inner-teenager',
      name: 'Inner Teenager',
      description: 'Reflective prompts to explore identity, boundaries, and emotional growth',
      totalPrompts: 365,
      currentDay: 1
    }
  ];
}

/**
 * Migrate v2 data to v3 format
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
function migrateV2ToV3(v2Data: EmoChildV2Storage): EmoChildV3Storage {
  const warnings: string[] = [];
  
  // Migrate existing v2 data with defaults for missing fields
  const migratedData: EmoChildV3Storage = {
    // Preserve existing v2 data
    logs: v2Data.logs || [],
    creatureState: v2Data.creatureState || {
      brightness: 50,
      size: 50,
      animation: 'idle'
    },
    safetyScore: v2Data.safetyScore || 0,
    customization: v2Data.customization || {
      name: '',
      color: 'orange',
      hasBow: false
    },
    microSentenceIndex: v2Data.microSentenceIndex || 0,
    
    // Add new v3 features with defaults
    journalEntries: [],
    promptTracks: createDefaultPromptTracks(),
    prompts: [], // Will be populated when prompt system is initialized
    analyticsPreferences: createDefaultAnalyticsPreferences(),
    migrationVersion: CURRENT_MIGRATION_VERSION
  };
  
  // Handle missing text color preference
  if (!v2Data.textColorPreference) {
    warnings.push('Text color preference not found, defaulting to white');
  }
  
  return migratedData;
}

/**
 * Load v2 data from localStorage using existing storage keys
 * Requirements: 5.1, 5.2, 5.4
 */
function loadV2Data(): EmoChildV2Storage | null {
  try {
    if (!isLocalStorageAvailable()) {
      return null;
    }
    
    // Use the same storage keys as the existing storageService
    const logs = localStorage.getItem('emochild_logs');
    const creature = localStorage.getItem('emochild_creature');
    const safety = localStorage.getItem('emochild_safety');
    const customization = localStorage.getItem('emochild_customization');
    const microIndex = localStorage.getItem('emochild_micro_index');
    const textColorPref = localStorage.getItem('emochild_text_color_pref');
    
    const v2Data: EmoChildV2Storage = {
      logs: logs ? JSON.parse(logs) : [],
      creatureState: creature ? JSON.parse(creature) : {
        brightness: 50,
        size: 50,
        animation: 'idle'
      },
      safetyScore: safety ? parseInt(safety, 10) : 0,
      customization: customization ? JSON.parse(customization) : {
        name: '',
        color: 'orange',
        hasBow: false
      },
      microSentenceIndex: microIndex ? parseInt(microIndex, 10) : 0,
      textColorPreference: textColorPref || 'white'
    };
    
    return v2Data;
  } catch (error) {
    console.error('Failed to load v2 data:', error);
    return null;
  }
}

/**
 * Save v3 data to localStorage
 * Requirements: 5.1, 5.4
 */
function saveV3Data(v3Data: EmoChildV3Storage): boolean {
  try {
    if (!isLocalStorageAvailable()) {
      return false;
    }
    
    // Save new v3 data
    localStorage.setItem(MIGRATION_STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(v3Data.journalEntries));
    localStorage.setItem(MIGRATION_STORAGE_KEYS.PROMPT_TRACKS, JSON.stringify(v3Data.promptTracks));
    localStorage.setItem(MIGRATION_STORAGE_KEYS.PROMPTS, JSON.stringify(v3Data.prompts));
    localStorage.setItem(MIGRATION_STORAGE_KEYS.ANALYTICS_PREFERENCES, JSON.stringify(v3Data.analyticsPreferences));
    
    return true;
  } catch (error) {
    console.error('Failed to save v3 data:', error);
    return false;
  }
}

/**
 * Check if migration is needed
 * Requirements: 5.3, 5.4
 */
export function isMigrationNeeded(): boolean {
  const currentVersion = getCurrentMigrationVersion();
  
  // If no migration version exists, we need to migrate
  if (!currentVersion) {
    return true;
  }
  
  // If version is different from current, we need to migrate
  return currentVersion !== CURRENT_MIGRATION_VERSION;
}

/**
 * Perform migration from v2 to v3
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export function performMigration(): MigrationResult {
  try {
    const currentVersion = getCurrentMigrationVersion();
    const warnings: string[] = [];
    
    // If already on current version, no migration needed
    if (currentVersion === CURRENT_MIGRATION_VERSION) {
      return {
        success: true,
        version: currentVersion,
        warnings: ['Already on current version, no migration needed']
      };
    }
    
    // Load existing v2 data
    const v2Data = loadV2Data();
    
    if (!v2Data) {
      // No existing data, create fresh v3 data
      const freshV3Data: EmoChildV3Storage = {
        logs: [],
        creatureState: {
          brightness: 50,
          size: 50,
          animation: 'idle'
        },
        safetyScore: 0,
        customization: {
          name: '',
          color: 'orange',
          hasBow: false
        },
        microSentenceIndex: 0,
        journalEntries: [],
        promptTracks: createDefaultPromptTracks(),
        prompts: [],
        analyticsPreferences: createDefaultAnalyticsPreferences(),
        migrationVersion: CURRENT_MIGRATION_VERSION
      };
      
      // Save fresh data
      if (!saveV3Data(freshV3Data)) {
        return {
          success: false,
          version: 'unknown',
          error: 'Failed to save fresh v3 data'
        };
      }
      
      // Set migration version
      if (!setMigrationVersion(CURRENT_MIGRATION_VERSION)) {
        warnings.push('Failed to set migration version');
      }
      
      return {
        success: true,
        version: CURRENT_MIGRATION_VERSION,
        migratedData: freshV3Data,
        warnings: ['Created fresh v3 data structure']
      };
    }
    
    // Migrate v2 data to v3
    const migratedData = migrateV2ToV3(v2Data);
    
    // Save migrated data
    if (!saveV3Data(migratedData)) {
      return {
        success: false,
        version: currentVersion || 'unknown',
        error: 'Failed to save migrated v3 data'
      };
    }
    
    // Set migration version
    if (!setMigrationVersion(CURRENT_MIGRATION_VERSION)) {
      warnings.push('Failed to set migration version');
    }
    
    warnings.push('Successfully migrated v2 data to v3 format');
    
    return {
      success: true,
      version: CURRENT_MIGRATION_VERSION,
      migratedData,
      warnings
    };
    
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      version: getCurrentMigrationVersion() || 'unknown',
      error: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Load v3 data from localStorage
 * Requirements: 5.2, 5.4
 */
export function loadV3Data(): EmoChildV3Storage | null {
  try {
    if (!isLocalStorageAvailable()) {
      return null;
    }
    
    // Load v2 data first (for backward compatibility)
    const v2Data = loadV2Data();
    if (!v2Data) {
      return null;
    }
    
    // Load v3 extensions
    const journalEntries = localStorage.getItem(MIGRATION_STORAGE_KEYS.JOURNAL_ENTRIES);
    const promptTracks = localStorage.getItem(MIGRATION_STORAGE_KEYS.PROMPT_TRACKS);
    const prompts = localStorage.getItem(MIGRATION_STORAGE_KEYS.PROMPTS);
    const analyticsPreferences = localStorage.getItem(MIGRATION_STORAGE_KEYS.ANALYTICS_PREFERENCES);
    
    const v3Data: EmoChildV3Storage = {
      // v2 data
      ...v2Data,
      
      // v3 extensions with defaults
      journalEntries: journalEntries ? JSON.parse(journalEntries) : [],
      promptTracks: promptTracks ? JSON.parse(promptTracks) : createDefaultPromptTracks(),
      prompts: prompts ? JSON.parse(prompts) : [],
      analyticsPreferences: analyticsPreferences ? JSON.parse(analyticsPreferences) : createDefaultAnalyticsPreferences(),
      migrationVersion: getCurrentMigrationVersion() || '2.0.0'
    };
    
    return v3Data;
  } catch (error) {
    console.error('Failed to load v3 data:', error);
    return null;
  }
}

/**
 * Clear all migration data (for testing/reset purposes)
 * Requirements: 5.4
 */
export function clearMigrationData(): void {
  try {
    if (!isLocalStorageAvailable()) {
      return;
    }
    
    localStorage.removeItem(MIGRATION_STORAGE_KEYS.MIGRATION_VERSION);
    localStorage.removeItem(MIGRATION_STORAGE_KEYS.JOURNAL_ENTRIES);
    localStorage.removeItem(MIGRATION_STORAGE_KEYS.PROMPT_TRACKS);
    localStorage.removeItem(MIGRATION_STORAGE_KEYS.PROMPTS);
    localStorage.removeItem(MIGRATION_STORAGE_KEYS.ANALYTICS_PREFERENCES);
  } catch (error) {
    console.error('Failed to clear migration data:', error);
  }
}

/**
 * Get migration status information
 * Requirements: 5.3, 5.4
 */
export function getMigrationStatus(): {
  currentVersion: string | null;
  isNeeded: boolean;
  hasV2Data: boolean;
} {
  const currentVersion = getCurrentMigrationVersion();
  const isNeeded = isMigrationNeeded();
  const v2Data = loadV2Data();
  
  return {
    currentVersion,
    isNeeded,
    hasV2Data: v2Data !== null
  };
}