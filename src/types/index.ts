/**
 * Type definitions for EmoChild application
 * These types define the core data models used throughout the application
 */

/**
 * Represents the type of action taken on an emotion
 * - 'expressed': User acknowledged and processed the emotion
 * - 'suppressed': User avoided or pushed down the emotion
 */
export type EmotionAction = 'expressed' | 'suppressed';

/**
 * Represents the available pastel colors for creature and text customization
 * Requirements: 2.6, 4.3
 */
export type PastelColor = 
  | 'mint'      // #C9E4DE
  | 'blue'      // #a0d2eb
  | 'lavender'  // #DBCDF0
  | 'peach'     // #fcded3
  | 'pink'      // #F2C6DE
  | 'yellow'    // #ffeaa7
  | 'red'       // #f35d69
  | 'orange';   // #ff964f

/**
 * Represents the quick emotion options for faster logging
 * Requirements: 3.2
 */
export type QuickEmotion = 
  | 'stressed'
  | 'anxious'
  | 'calm'
  | 'excited'
  | 'sad'
  | 'angry'
  | 'confused'
  | 'grateful'
  | 'curious'
  | 'scared';

/**
 * Represents creature customization settings
 * Requirements: 2.6, 8.1
 */
export interface CreatureCustomization {
  /** Creature name (1-50 characters) */
  name: string;
  
  /** Selected pastel color for the creature */
  color: PastelColor;
  
  /** Whether the creature has a dark pink bow accessory */
  hasBow: boolean;
}

/**
 * Represents a single emotion log entry
 * Requirements: 2.2, 2.3, 4.3, 5.3
 */
export interface EmotionLog {
  /** Unique identifier (UUID v4) */
  id: string;
  
  /** Emotion description text (1-100 characters) */
  text: string;
  
  /** Action taken: expressed or suppressed */
  action: EmotionAction;
  
  /** Unix timestamp in milliseconds when the log was created */
  timestamp: number;
  
  /** Text color for the log entry (defaults to 'white') */
  textColor?: PastelColor | 'white';
  
  /** Quick emotion label if a quick emotion button was used */
  quickEmotion?: QuickEmotion;
}

/**
 * Represents the current state of the EmoChild creature
 * Requirements: 3.1, 3.2
 */
export interface CreatureState {
  /** Brightness level (0-100), affects visual glow */
  brightness: number;
  
  /** Size level (0-100), affects creature scale */
  size: number;
  
  /** Current animation state */
  animation: 'idle' | 'grow' | 'curl' | 'celebrate';
}

/**
 * Represents the complete application state (v2 compatibility)
 * Requirements: 2.2, 2.3, 2.6, 3.1, 3.2, 4.1, 8.1
 */
export interface AppState {
  /** Array of all emotion logs */
  logs: EmotionLog[];
  
  /** Current creature state */
  creatureState: CreatureState;
  
  /** Safety score: count of expressed emotions */
  safetyScore: number;
  
  /** Creature customization settings */
  customization: CreatureCustomization;
  
  /** Current index for cycling through micro-sentences (0-9) */
  microSentenceIndex: number;
}

// ===== V3 EXTENSIONS =====

/**
 * Represents a single journal entry for a specific day
 * Requirements: 1.3, 2.1
 */
export interface JournalEntry {
  /** Unique identifier (UUID v4) */
  id: string;
  
  /** Journal entry content text */
  content: string;
  
  /** Specific day this entry represents (one per day max) */
  date: Date;
  
  /** When the entry was created */
  createdAt: Date;
  
  /** When the entry was last updated */
  updatedAt: Date;
  
  /** References to EmotionLog IDs linked to this entry */
  linkedEmotions: string[];
  
  /** Word count of the content */
  wordCount: number;
  
  /** Optional tags for categorization */
  tags?: string[];
  
  /** Day of year (1-365) for easy page navigation */
  dayOfYear: number;
}

/**
 * Represents a journal page in the visual interface
 * Requirements: 1.4
 */
export interface JournalPage {
  /** Date this page represents */
  date: Date;
  
  /** Day of year (1-365) */
  dayOfYear: number;
  
  /** Whether this page has an entry */
  hasEntry: boolean;
  
  /** The journal entry for this page, if it exists */
  entry?: JournalEntry;
  
  /** Whether this page represents today */
  isToday: boolean;
  
  /** Whether this page represents a future date */
  isFuture: boolean;
}

/**
 * Represents a prompt track (Inner Child or Inner Teenager)
 * Requirements: 3.1, 3.2, 3.3
 */
export interface PromptTrack {
  /** Track identifier */
  id: 'inner-child' | 'inner-teenager';
  
  /** Display name for the track */
  name: string;
  
  /** Description of what this track focuses on */
  description: string;
  
  /** Total number of prompts in this track (365 for full year) */
  totalPrompts: number;
  
  /** Current day in the track (1-365) */
  currentDay: number;
}

/**
 * Represents a single prompt within a track
 * Requirements: 3.1, 3.2, 3.4, 3.5
 */
export interface Prompt {
  /** Unique identifier */
  id: string;
  
  /** Which track this prompt belongs to */
  trackId: 'inner-child' | 'inner-teenager';
  
  /** Day number within the track (1-365) */
  dayNumber: number;
  
  /** The prompt content/question */
  content: string;
  
  /** Category of the prompt (e.g., 'safety', 'play', 'identity', 'boundaries') */
  category: string;
  
  /** Whether the user has completed this prompt */
  isCompleted: boolean;
  
  /** User's response to the prompt, if completed */
  response?: string;
  
  /** When the prompt was completed */
  completedAt?: Date;
}

/**
 * Represents different types of emotional patterns for analytics
 * Requirements: 4.1, 4.3
 */
export type PatternType = 'expression-ratio' | 'common-emotions' | 'streak' | 'trend';

/**
 * Represents an emotional pattern detected by analytics
 * Requirements: 4.1, 4.3, 4.5
 */
export interface EmotionalPattern {
  /** Type of pattern detected */
  type: PatternType;
  
  /** Time range this pattern covers */
  timeRange: TimeRange;
  
  /** The pattern data */
  data: PatternData;
  
  /** Insight text describing the pattern */
  insight: string;
  
  /** Optional encouraging message */
  encouragement?: string;
}

/**
 * Represents chart data for visualizations
 * Requirements: 4.1, 4.3
 */
export interface ChartData {
  /** Labels for chart axes */
  labels: string[];
  
  /** Datasets for the chart */
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
  }[];
}

/**
 * Represents a time range for analytics
 * Requirements: 4.1, 4.5
 */
export interface TimeRange {
  /** Start date of the range */
  start: Date;
  
  /** End date of the range */
  end: Date;
  
  /** Preset range type, if applicable */
  preset?: 'week' | 'month' | 'quarter' | 'year';
}

/**
 * Generic pattern data interface
 * Requirements: 4.1, 4.3
 */
export interface PatternData {
  [key: string]: any;
}

/**
 * Analytics preferences for the user
 * Requirements: 4.1, 4.5
 */
export interface AnalyticsPreferences {
  /** Default time range for analytics views */
  defaultTimeRange: TimeRange;
  
  /** Which insights are enabled */
  enabledInsights: string[];
  
  /** When insights were last viewed */
  lastViewedInsights: Date;
}

/**
 * Extended storage schema for v3 features
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export interface EmoChildV3Storage extends AppState {
  /** Array of all journal entries */
  journalEntries: JournalEntry[];
  
  /** Available prompt tracks */
  promptTracks: PromptTrack[];
  
  /** All prompts across all tracks */
  prompts: Prompt[];
  
  /** User's analytics preferences */
  analyticsPreferences: AnalyticsPreferences;
  
  /** Migration version for backward compatibility */
  migrationVersion: string;
}

/**
 * Legacy v2 storage interface for migration compatibility
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export interface EmoChildV2Storage {
  /** Legacy emotion logs */
  logs: EmotionLog[];
  
  /** Legacy creature state */
  creatureState: CreatureState;
  
  /** Legacy safety score */
  safetyScore: number;
  
  /** Legacy customization */
  customization: CreatureCustomization;
  
  /** Legacy micro-sentence index */
  microSentenceIndex: number;
  
  /** Legacy text color preference */
  textColorPreference?: string;
}
