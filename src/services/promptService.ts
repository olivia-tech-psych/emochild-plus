/**
 * Prompt Service for EmoChild v3
 * Handles initialization and management of prompt system data models and storage
 * Requirements: 3.1, 3.2, 3.3
 */

import { PromptTrack, Prompt } from '@/types';
import { 
  initializeAllPrompts, 
  getCurrentDayOfYear, 
  updateTrackProgress,
  getTodaysPrompt,
  getUnlockedPrompts,
  completePrompt,
  skipPrompt,
  getTrackStats
} from '@/utils/promptUtils';
import { 
  savePromptTracks, 
  loadPromptTracks, 
  savePrompts, 
  loadPrompts,
  StorageResult 
} from './storageServiceV3';

/**
 * Initialize prompt tracks with default configuration
 * Requirements: 3.1, 3.2, 3.3
 */
export function initializePromptTracks(): PromptTrack[] {
  const currentDay = getCurrentDayOfYear();
  
  const tracks: PromptTrack[] = [
    {
      id: 'inner-child',
      name: 'Inner Child',
      description: 'Gentle prompts to reconnect with your playful, curious, and authentic self. Explore safety, joy, creativity, and wonder through the lens of your inner child.',
      totalPrompts: 365,
      currentDay: Math.min(currentDay, 365)
    },
    {
      id: 'inner-teenager',
      name: 'Inner Teenager',
      description: 'Reflective prompts to explore identity, values, boundaries, and growth. Connect with your developing sense of self and navigate relationships and authenticity.',
      totalPrompts: 365,
      currentDay: Math.min(currentDay, 365)
    }
  ];
  
  return tracks;
}

/**
 * Initialize the complete prompt system
 * Sets up tracks and generates all prompts for the year
 * Requirements: 3.1, 3.2, 3.3
 */
export function initializePromptSystem(): {
  tracks: PromptTrack[];
  prompts: Prompt[];
  success: boolean;
  error?: string;
} {
  try {
    // Initialize tracks
    const tracks = initializePromptTracks();
    
    // Generate all prompts for both tracks
    const prompts = initializeAllPrompts();
    
    return {
      tracks,
      prompts,
      success: true
    };
  } catch (error) {
    console.error('Failed to initialize prompt system:', error);
    return {
      tracks: [],
      prompts: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Load or initialize prompt system data
 * Loads existing data from storage, or initializes if none exists
 * Requirements: 3.1, 3.2, 3.3
 */
export function loadOrInitializePromptSystem(): {
  tracks: PromptTrack[];
  prompts: Prompt[];
  isNewInitialization: boolean;
  success: boolean;
  error?: string;
} {
  try {
    // Try to load existing data
    let tracks = loadPromptTracks();
    let prompts = loadPrompts();
    let isNewInitialization = false;
    
    // If no tracks exist, initialize the system
    if (tracks.length === 0) {
      const initResult = initializePromptSystem();
      
      if (!initResult.success) {
        return {
          tracks: [],
          prompts: [],
          isNewInitialization: false,
          success: false,
          error: initResult.error
        };
      }
      
      tracks = initResult.tracks;
      prompts = initResult.prompts;
      isNewInitialization = true;
      
      // Save the initialized data
      const saveTracksResult = savePromptTracks(tracks);
      const savePromptsResult = savePrompts(prompts);
      
      if (!saveTracksResult.success || !savePromptsResult.success) {
        console.warn('Failed to save initialized prompt data:', {
          tracksError: saveTracksResult.error,
          promptsError: savePromptsResult.error
        });
      }
    } else {
      // Update track progress for existing data
      tracks = tracks.map(track => updateTrackProgress(track));
      
      // Save updated track progress
      const saveResult = savePromptTracks(tracks);
      if (!saveResult.success) {
        console.warn('Failed to save updated track progress:', saveResult.error);
      }
    }
    
    return {
      tracks,
      prompts,
      isNewInitialization,
      success: true
    };
  } catch (error) {
    console.error('Failed to load or initialize prompt system:', error);
    return {
      tracks: [],
      prompts: [],
      isNewInitialization: false,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get today's available prompts for all tracks
 * Requirements: 3.2, 3.4
 */
export function getTodaysPrompts(prompts: Prompt[]): {
  innerChild: Prompt | null;
  innerTeenager: Prompt | null;
} {
  return {
    innerChild: getTodaysPrompt(prompts, 'inner-child'),
    innerTeenager: getTodaysPrompt(prompts, 'inner-teenager')
  };
}

/**
 * Get all unlocked prompts for all tracks
 * Requirements: 3.2, 3.5
 */
export function getAllUnlockedPrompts(prompts: Prompt[]): {
  innerChild: Prompt[];
  innerTeenager: Prompt[];
} {
  return {
    innerChild: getUnlockedPrompts(prompts, 'inner-child'),
    innerTeenager: getUnlockedPrompts(prompts, 'inner-teenager')
  };
}

/**
 * Complete a prompt and save to storage
 * Requirements: 3.4, 3.5
 */
export function completePromptAndSave(
  prompts: Prompt[], 
  promptId: string, 
  response: string
): {
  updatedPrompts: Prompt[];
  success: boolean;
  error?: string;
} {
  try {
    const promptIndex = prompts.findIndex(p => p.id === promptId);
    
    if (promptIndex === -1) {
      return {
        updatedPrompts: prompts,
        success: false,
        error: 'Prompt not found'
      };
    }
    
    const updatedPrompts = [...prompts];
    updatedPrompts[promptIndex] = completePrompt(prompts[promptIndex], response);
    
    const saveResult = savePrompts(updatedPrompts);
    
    return {
      updatedPrompts,
      success: saveResult.success,
      error: saveResult.error
    };
  } catch (error) {
    console.error('Failed to complete prompt:', error);
    return {
      updatedPrompts: prompts,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Skip a prompt (no penalty, can return later)
 * Requirements: 3.5
 */
export function skipPromptAndSave(
  prompts: Prompt[], 
  promptId: string
): {
  updatedPrompts: Prompt[];
  success: boolean;
  error?: string;
} {
  try {
    const promptIndex = prompts.findIndex(p => p.id === promptId);
    
    if (promptIndex === -1) {
      return {
        updatedPrompts: prompts,
        success: false,
        error: 'Prompt not found'
      };
    }
    
    // For skipped prompts, we don't modify the prompt data
    // This allows users to come back to them later
    const updatedPrompts = [...prompts];
    updatedPrompts[promptIndex] = skipPrompt(prompts[promptIndex]);
    
    // No need to save since skipping doesn't change the prompt
    return {
      updatedPrompts,
      success: true
    };
  } catch (error) {
    console.error('Failed to skip prompt:', error);
    return {
      updatedPrompts: prompts,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get comprehensive statistics for all tracks
 * Requirements: 3.4, 3.5
 */
export function getAllTrackStats(prompts: Prompt[]): {
  innerChild: ReturnType<typeof getTrackStats>;
  innerTeenager: ReturnType<typeof getTrackStats>;
} {
  return {
    innerChild: getTrackStats(prompts, 'inner-child'),
    innerTeenager: getTrackStats(prompts, 'inner-teenager')
  };
}

/**
 * Update prompt tracks progress and save
 * Requirements: 3.2, 3.3
 */
export function updateAndSaveTrackProgress(tracks: PromptTrack[]): {
  updatedTracks: PromptTrack[];
  success: boolean;
  error?: string;
} {
  try {
    const updatedTracks = tracks.map(track => updateTrackProgress(track));
    const saveResult = savePromptTracks(updatedTracks);
    
    return {
      updatedTracks,
      success: saveResult.success,
      error: saveResult.error
    };
  } catch (error) {
    console.error('Failed to update track progress:', error);
    return {
      updatedTracks: tracks,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Reset prompt system (for testing or fresh start)
 * Requirements: 3.1, 3.2, 3.3
 */
export function resetPromptSystem(): {
  tracks: PromptTrack[];
  prompts: Prompt[];
  success: boolean;
  error?: string;
} {
  try {
    const initResult = initializePromptSystem();
    
    if (!initResult.success) {
      return initResult;
    }
    
    // Save the fresh data
    const saveTracksResult = savePromptTracks(initResult.tracks);
    const savePromptsResult = savePrompts(initResult.prompts);
    
    if (!saveTracksResult.success || !savePromptsResult.success) {
      return {
        tracks: initResult.tracks,
        prompts: initResult.prompts,
        success: false,
        error: `Failed to save reset data: ${saveTracksResult.error || savePromptsResult.error}`
      };
    }
    
    return initResult;
  } catch (error) {
    console.error('Failed to reset prompt system:', error);
    return {
      tracks: [],
      prompts: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Validate prompt system integrity
 * Ensures all required prompts exist and tracks are properly configured
 * Requirements: 3.1, 3.2, 3.3
 */
export function validatePromptSystemIntegrity(
  tracks: PromptTrack[], 
  prompts: Prompt[]
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check tracks
  if (tracks.length !== 2) {
    errors.push(`Expected 2 tracks, found ${tracks.length}`);
  }
  
  const expectedTrackIds: ('inner-child' | 'inner-teenager')[] = ['inner-child', 'inner-teenager'];
  const actualTrackIds = tracks.map(t => t.id);
  
  for (const expectedId of expectedTrackIds) {
    if (!actualTrackIds.includes(expectedId)) {
      errors.push(`Missing required track: ${expectedId}`);
    }
  }
  
  // Check prompts
  for (const trackId of expectedTrackIds) {
    const trackPrompts = prompts.filter(p => p.trackId === trackId);
    
    if (trackPrompts.length !== 365) {
      errors.push(`Track ${trackId} has ${trackPrompts.length} prompts, expected 365`);
    }
    
    // Check for missing days
    const dayNumbers = trackPrompts.map(p => p.dayNumber).sort((a, b) => a - b);
    for (let day = 1; day <= 365; day++) {
      if (!dayNumbers.includes(day)) {
        errors.push(`Track ${trackId} missing prompt for day ${day}`);
      }
    }
    
    // Check for duplicate days
    const uniqueDays = new Set(dayNumbers);
    if (uniqueDays.size !== dayNumbers.length) {
      warnings.push(`Track ${trackId} has duplicate day numbers`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Export the prompt service
 */
export const promptService = {
  initializePromptTracks,
  initializePromptSystem,
  loadOrInitializePromptSystem,
  getTodaysPrompts,
  getAllUnlockedPrompts,
  completePromptAndSave,
  skipPromptAndSave,
  getAllTrackStats,
  updateAndSaveTrackProgress,
  resetPromptSystem,
  validatePromptSystemIntegrity
};