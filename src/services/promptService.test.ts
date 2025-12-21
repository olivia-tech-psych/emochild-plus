/**
 * Tests for Prompt Service
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { PromptTrack, Prompt } from '@/types';
import {
  promptService,
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
} from './promptService';

// Mock the storage service
vi.mock('./storageServiceV3', () => ({
  savePromptTracks: vi.fn(),
  loadPromptTracks: vi.fn(),
  savePrompts: vi.fn(),
  loadPrompts: vi.fn()
}));

// Mock the prompt utils
vi.mock('@/utils/promptUtils', () => ({
  getCurrentDayOfYear: vi.fn(),
  updateTrackProgress: vi.fn(),
  getTodaysPrompt: vi.fn(),
  getUnlockedPrompts: vi.fn(),
  completePrompt: vi.fn(),
  skipPrompt: vi.fn(),
  getTrackStats: vi.fn(),
  initializeAllPrompts: vi.fn()
}));

import { 
  savePromptTracks, 
  loadPromptTracks, 
  savePrompts, 
  loadPrompts 
} from './storageServiceV3';
import {
  getCurrentDayOfYear,
  updateTrackProgress,
  getTodaysPrompt,
  getUnlockedPrompts,
  completePrompt,
  skipPrompt,
  getTrackStats,
  initializeAllPrompts
} from '@/utils/promptUtils';

describe('Prompt Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    (getCurrentDayOfYear as Mock).mockReturnValue(100);
    (updateTrackProgress as Mock).mockImplementation((track: PromptTrack) => track);
    (initializeAllPrompts as Mock).mockReturnValue([]);
    (savePromptTracks as Mock).mockReturnValue({ success: true });
    (savePrompts as Mock).mockReturnValue({ success: true });
    (loadPromptTracks as Mock).mockReturnValue([]);
    (loadPrompts as Mock).mockReturnValue([]);
  });

  describe('initializePromptTracks', () => {
    it('should create two prompt tracks with correct configuration', () => {
      (getCurrentDayOfYear as Mock).mockReturnValue(150);
      
      const tracks = initializePromptTracks();
      
      expect(tracks).toHaveLength(2);
      
      // Check Inner Child track
      const innerChildTrack = tracks.find(t => t.id === 'inner-child');
      expect(innerChildTrack).toBeDefined();
      expect(innerChildTrack?.name).toBe('Inner Child');
      expect(innerChildTrack?.totalPrompts).toBe(365);
      expect(innerChildTrack?.currentDay).toBe(150);
      expect(innerChildTrack?.description).toContain('playful');
      
      // Check Inner Teenager track
      const innerTeenagerTrack = tracks.find(t => t.id === 'inner-teenager');
      expect(innerTeenagerTrack).toBeDefined();
      expect(innerTeenagerTrack?.name).toBe('Inner Teenager');
      expect(innerTeenagerTrack?.totalPrompts).toBe(365);
      expect(innerTeenagerTrack?.currentDay).toBe(150);
      expect(innerTeenagerTrack?.description).toContain('identity');
    });

    it('should cap current day at 365 for end of year', () => {
      (getCurrentDayOfYear as Mock).mockReturnValue(400); // Beyond year end
      
      const tracks = initializePromptTracks();
      
      tracks.forEach(track => {
        expect(track.currentDay).toBe(365);
      });
    });
  });

  describe('initializePromptSystem', () => {
    it('should initialize tracks and prompts successfully', () => {
      const mockPrompts: Prompt[] = [
        {
          id: 'test-1',
          trackId: 'inner-child',
          dayNumber: 1,
          content: 'Test prompt',
          category: 'test',
          isCompleted: false
        }
      ];
      
      (initializeAllPrompts as Mock).mockReturnValue(mockPrompts);
      
      const result = initializePromptSystem();
      
      expect(result.success).toBe(true);
      expect(result.tracks).toHaveLength(2);
      expect(result.prompts).toEqual(mockPrompts);
      expect(result.error).toBeUndefined();
    });

    it('should handle initialization errors gracefully', () => {
      (initializeAllPrompts as Mock).mockImplementation(() => {
        throw new Error('Initialization failed');
      });
      
      const result = initializePromptSystem();
      
      expect(result.success).toBe(false);
      expect(result.tracks).toEqual([]);
      expect(result.prompts).toEqual([]);
      expect(result.error).toBe('Initialization failed');
    });
  });

  describe('loadOrInitializePromptSystem', () => {
    it('should load existing data when available', () => {
      const existingTracks: PromptTrack[] = [
        {
          id: 'inner-child',
          name: 'Inner Child',
          description: 'Test',
          totalPrompts: 365,
          currentDay: 50
        }
      ];
      
      const existingPrompts: Prompt[] = [
        {
          id: 'existing-1',
          trackId: 'inner-child',
          dayNumber: 1,
          content: 'Existing prompt',
          category: 'test',
          isCompleted: false
        }
      ];
      
      (loadPromptTracks as Mock).mockReturnValue(existingTracks);
      (loadPrompts as Mock).mockReturnValue(existingPrompts);
      (updateTrackProgress as Mock).mockImplementation((track: PromptTrack) => ({
        ...track,
        currentDay: 100
      }));
      
      const result = loadOrInitializePromptSystem();
      
      expect(result.success).toBe(true);
      expect(result.isNewInitialization).toBe(false);
      expect(result.tracks).toHaveLength(1);
      expect(result.prompts).toEqual(existingPrompts);
      expect(updateTrackProgress).toHaveBeenCalledWith(existingTracks[0]);
    });

    it('should initialize new system when no data exists', () => {
      const mockPrompts: Prompt[] = [
        {
          id: 'new-1',
          trackId: 'inner-child',
          dayNumber: 1,
          content: 'New prompt',
          category: 'test',
          isCompleted: false
        }
      ];
      
      (loadPromptTracks as Mock).mockReturnValue([]);
      (loadPrompts as Mock).mockReturnValue([]);
      (initializeAllPrompts as Mock).mockReturnValue(mockPrompts);
      
      const result = loadOrInitializePromptSystem();
      
      expect(result.success).toBe(true);
      expect(result.isNewInitialization).toBe(true);
      expect(result.tracks).toHaveLength(2);
      expect(result.prompts).toEqual(mockPrompts);
      expect(savePromptTracks).toHaveBeenCalled();
      expect(savePrompts).toHaveBeenCalled();
    });

    it('should handle storage errors during initialization', () => {
      (loadPromptTracks as Mock).mockReturnValue([]);
      (initializeAllPrompts as Mock).mockImplementation(() => {
        throw new Error('Failed to generate prompts');
      });
      
      const result = loadOrInitializePromptSystem();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to generate prompts');
    });
  });

  describe('getTodaysPrompts', () => {
    it('should return today\'s prompts for both tracks', () => {
      const mockPrompts: Prompt[] = [];
      const innerChildPrompt: Prompt = {
        id: 'ic-today',
        trackId: 'inner-child',
        dayNumber: 100,
        content: 'Inner child prompt',
        category: 'test',
        isCompleted: false
      };
      const innerTeenagerPrompt: Prompt = {
        id: 'it-today',
        trackId: 'inner-teenager',
        dayNumber: 100,
        content: 'Inner teenager prompt',
        category: 'test',
        isCompleted: false
      };
      
      (getTodaysPrompt as Mock)
        .mockReturnValueOnce(innerChildPrompt)
        .mockReturnValueOnce(innerTeenagerPrompt);
      
      const result = getTodaysPrompts(mockPrompts);
      
      expect(result.innerChild).toEqual(innerChildPrompt);
      expect(result.innerTeenager).toEqual(innerTeenagerPrompt);
      expect(getTodaysPrompt).toHaveBeenCalledWith(mockPrompts, 'inner-child');
      expect(getTodaysPrompt).toHaveBeenCalledWith(mockPrompts, 'inner-teenager');
    });
  });

  describe('getAllUnlockedPrompts', () => {
    it('should return unlocked prompts for both tracks', () => {
      const mockPrompts: Prompt[] = [];
      const innerChildPrompts: Prompt[] = [
        {
          id: 'ic-1',
          trackId: 'inner-child',
          dayNumber: 1,
          content: 'Prompt 1',
          category: 'test',
          isCompleted: false
        }
      ];
      const innerTeenagerPrompts: Prompt[] = [
        {
          id: 'it-1',
          trackId: 'inner-teenager',
          dayNumber: 1,
          content: 'Prompt 1',
          category: 'test',
          isCompleted: false
        }
      ];
      
      (getUnlockedPrompts as Mock)
        .mockReturnValueOnce(innerChildPrompts)
        .mockReturnValueOnce(innerTeenagerPrompts);
      
      const result = getAllUnlockedPrompts(mockPrompts);
      
      expect(result.innerChild).toEqual(innerChildPrompts);
      expect(result.innerTeenager).toEqual(innerTeenagerPrompts);
    });
  });

  describe('completePromptAndSave', () => {
    it('should complete a prompt and save successfully', () => {
      const mockPrompts: Prompt[] = [
        {
          id: 'test-prompt',
          trackId: 'inner-child',
          dayNumber: 1,
          content: 'Test prompt',
          category: 'test',
          isCompleted: false
        }
      ];
      
      const completedPrompt: Prompt = {
        ...mockPrompts[0],
        isCompleted: true,
        response: 'Test response',
        completedAt: new Date()
      };
      
      (completePrompt as Mock).mockReturnValue(completedPrompt);
      
      const result = completePromptAndSave(mockPrompts, 'test-prompt', 'Test response');
      
      expect(result.success).toBe(true);
      expect(result.updatedPrompts[0]).toEqual(completedPrompt);
      expect(completePrompt).toHaveBeenCalledWith(mockPrompts[0], 'Test response');
      expect(savePrompts).toHaveBeenCalledWith(result.updatedPrompts);
    });

    it('should handle prompt not found error', () => {
      const mockPrompts: Prompt[] = [];
      
      const result = completePromptAndSave(mockPrompts, 'nonexistent', 'Response');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Prompt not found');
      expect(result.updatedPrompts).toEqual(mockPrompts);
    });

    it('should handle storage errors', () => {
      const mockPrompts: Prompt[] = [
        {
          id: 'test-prompt',
          trackId: 'inner-child',
          dayNumber: 1,
          content: 'Test prompt',
          category: 'test',
          isCompleted: false
        }
      ];
      
      (completePrompt as Mock).mockReturnValue(mockPrompts[0]);
      (savePrompts as Mock).mockReturnValue({ success: false, error: 'Storage failed' });
      
      const result = completePromptAndSave(mockPrompts, 'test-prompt', 'Response');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage failed');
    });
  });

  describe('skipPromptAndSave', () => {
    it('should skip a prompt without modifying it', () => {
      const mockPrompts: Prompt[] = [
        {
          id: 'test-prompt',
          trackId: 'inner-child',
          dayNumber: 1,
          content: 'Test prompt',
          category: 'test',
          isCompleted: false
        }
      ];
      
      (skipPrompt as Mock).mockReturnValue(mockPrompts[0]);
      
      const result = skipPromptAndSave(mockPrompts, 'test-prompt');
      
      expect(result.success).toBe(true);
      expect(result.updatedPrompts[0]).toEqual(mockPrompts[0]);
      expect(skipPrompt).toHaveBeenCalledWith(mockPrompts[0]);
      // Should not save since skipping doesn't change the prompt
    });

    it('should handle prompt not found error', () => {
      const mockPrompts: Prompt[] = [];
      
      const result = skipPromptAndSave(mockPrompts, 'nonexistent');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Prompt not found');
    });
  });

  describe('getAllTrackStats', () => {
    it('should return stats for both tracks', () => {
      const mockPrompts: Prompt[] = [];
      const mockStats = {
        totalUnlocked: 10,
        totalCompleted: 5,
        completionRate: 0.5,
        currentStreak: 3
      };
      
      (getTrackStats as Mock).mockReturnValue(mockStats);
      
      const result = getAllTrackStats(mockPrompts);
      
      expect(result.innerChild).toEqual(mockStats);
      expect(result.innerTeenager).toEqual(mockStats);
      expect(getTrackStats).toHaveBeenCalledWith(mockPrompts, 'inner-child');
      expect(getTrackStats).toHaveBeenCalledWith(mockPrompts, 'inner-teenager');
    });
  });

  describe('updateAndSaveTrackProgress', () => {
    it('should update and save track progress', () => {
      const mockTracks: PromptTrack[] = [
        {
          id: 'inner-child',
          name: 'Inner Child',
          description: 'Test',
          totalPrompts: 365,
          currentDay: 50
        }
      ];
      
      const updatedTrack = { ...mockTracks[0], currentDay: 100 };
      (updateTrackProgress as Mock).mockReturnValue(updatedTrack);
      
      const result = updateAndSaveTrackProgress(mockTracks);
      
      expect(result.success).toBe(true);
      expect(result.updatedTracks[0]).toEqual(updatedTrack);
      expect(savePromptTracks).toHaveBeenCalledWith([updatedTrack]);
    });

    it('should handle storage errors', () => {
      const mockTracks: PromptTrack[] = [];
      (savePromptTracks as Mock).mockReturnValue({ success: false, error: 'Storage failed' });
      
      const result = updateAndSaveTrackProgress(mockTracks);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage failed');
    });
  });

  describe('resetPromptSystem', () => {
    it('should reset the prompt system successfully', () => {
      const mockPrompts: Prompt[] = [
        {
          id: 'reset-1',
          trackId: 'inner-child',
          dayNumber: 1,
          content: 'Reset prompt',
          category: 'test',
          isCompleted: false
        }
      ];
      
      (initializeAllPrompts as Mock).mockReturnValue(mockPrompts);
      
      const result = resetPromptSystem();
      
      expect(result.success).toBe(true);
      expect(result.tracks).toHaveLength(2);
      expect(result.prompts).toEqual(mockPrompts);
      expect(savePromptTracks).toHaveBeenCalled();
      expect(savePrompts).toHaveBeenCalled();
    });

    it('should handle reset errors', () => {
      (initializeAllPrompts as Mock).mockImplementation(() => {
        throw new Error('Reset failed');
      });
      
      const result = resetPromptSystem();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Reset failed');
    });
  });

  describe('validatePromptSystemIntegrity', () => {
    it('should validate a complete prompt system', () => {
      const validTracks: PromptTrack[] = [
        {
          id: 'inner-child',
          name: 'Inner Child',
          description: 'Test',
          totalPrompts: 365,
          currentDay: 100
        },
        {
          id: 'inner-teenager',
          name: 'Inner Teenager',
          description: 'Test',
          totalPrompts: 365,
          currentDay: 100
        }
      ];
      
      const validPrompts: Prompt[] = [];
      
      // Generate 365 prompts for each track
      for (let day = 1; day <= 365; day++) {
        validPrompts.push({
          id: `ic-${day}`,
          trackId: 'inner-child',
          dayNumber: day,
          content: `Prompt ${day}`,
          category: 'test',
          isCompleted: false
        });
        
        validPrompts.push({
          id: `it-${day}`,
          trackId: 'inner-teenager',
          dayNumber: day,
          content: `Prompt ${day}`,
          category: 'test',
          isCompleted: false
        });
      }
      
      const result = validatePromptSystemIntegrity(validTracks, validPrompts);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect missing tracks', () => {
      const incompleteTracks: PromptTrack[] = [
        {
          id: 'inner-child',
          name: 'Inner Child',
          description: 'Test',
          totalPrompts: 365,
          currentDay: 100
        }
      ];
      
      const result = validatePromptSystemIntegrity(incompleteTracks, []);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Expected 2 tracks, found 1');
      expect(result.errors).toContain('Missing required track: inner-teenager');
    });

    it('should detect missing prompts', () => {
      const validTracks: PromptTrack[] = [
        {
          id: 'inner-child',
          name: 'Inner Child',
          description: 'Test',
          totalPrompts: 365,
          currentDay: 100
        },
        {
          id: 'inner-teenager',
          name: 'Inner Teenager',
          description: 'Test',
          totalPrompts: 365,
          currentDay: 100
        }
      ];
      
      const incompletePrompts: Prompt[] = [
        {
          id: 'ic-1',
          trackId: 'inner-child',
          dayNumber: 1,
          content: 'Prompt 1',
          category: 'test',
          isCompleted: false
        }
        // Missing 364 prompts for inner-child and all 365 for inner-teenager
      ];
      
      const result = validatePromptSystemIntegrity(validTracks, incompletePrompts);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Track inner-child has 1 prompts, expected 365');
      expect(result.errors).toContain('Track inner-teenager has 0 prompts, expected 365');
      expect(result.errors).toContain('Track inner-child missing prompt for day 2');
    });

    it('should detect duplicate day numbers', () => {
      const validTracks: PromptTrack[] = [
        {
          id: 'inner-child',
          name: 'Inner Child',
          description: 'Test',
          totalPrompts: 365,
          currentDay: 100
        },
        {
          id: 'inner-teenager',
          name: 'Inner Teenager',
          description: 'Test',
          totalPrompts: 365,
          currentDay: 100
        }
      ];
      
      const duplicatePrompts: Prompt[] = [];
      
      // Create valid prompts for inner-teenager
      for (let day = 1; day <= 365; day++) {
        duplicatePrompts.push({
          id: `it-${day}`,
          trackId: 'inner-teenager',
          dayNumber: day,
          content: `Prompt ${day}`,
          category: 'test',
          isCompleted: false
        });
      }
      
      // Create prompts with duplicates for inner-child
      for (let day = 1; day <= 365; day++) {
        duplicatePrompts.push({
          id: `ic-${day}`,
          trackId: 'inner-child',
          dayNumber: day,
          content: `Prompt ${day}`,
          category: 'test',
          isCompleted: false
        });
      }
      
      // Add a duplicate
      duplicatePrompts.push({
        id: 'ic-duplicate',
        trackId: 'inner-child',
        dayNumber: 1, // Duplicate day 1
        content: 'Duplicate prompt',
        category: 'test',
        isCompleted: false
      });
      
      const result = validatePromptSystemIntegrity(validTracks, duplicatePrompts);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Track inner-child has 366 prompts, expected 365');
      expect(result.warnings).toContain('Track inner-child has duplicate day numbers');
    });
  });

  describe('promptService export', () => {
    it('should export all required functions', () => {
      expect(promptService.initializePromptTracks).toBeDefined();
      expect(promptService.initializePromptSystem).toBeDefined();
      expect(promptService.loadOrInitializePromptSystem).toBeDefined();
      expect(promptService.getTodaysPrompts).toBeDefined();
      expect(promptService.getAllUnlockedPrompts).toBeDefined();
      expect(promptService.completePromptAndSave).toBeDefined();
      expect(promptService.skipPromptAndSave).toBeDefined();
      expect(promptService.getAllTrackStats).toBeDefined();
      expect(promptService.updateAndSaveTrackProgress).toBeDefined();
      expect(promptService.resetPromptSystem).toBeDefined();
      expect(promptService.validatePromptSystemIntegrity).toBeDefined();
    });
  });
});