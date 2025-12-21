/**
 * Integration tests for the complete prompt system
 * Tests the interaction between promptService, storageServiceV3, and migrationService
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promptService } from './promptService';
import { storageServiceV3 } from './storageServiceV3';
import { performMigration, clearMigrationData } from './migrationService';

describe('Prompt System Integration', () => {
  beforeEach(() => {
    // Clear all storage before each test
    localStorage.clear();
    clearMigrationData();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
    clearMigrationData();
  });

  describe('Fresh Installation', () => {
    it('should initialize complete prompt system from scratch', () => {
      // Initialize the prompt system
      const result = promptService.loadOrInitializePromptSystem();
      
      expect(result.success).toBe(true);
      expect(result.isNewInitialization).toBe(true);
      expect(result.tracks).toHaveLength(2);
      expect(result.prompts).toHaveLength(730); // 365 * 2 tracks
      
      // Verify tracks are properly configured
      const innerChildTrack = result.tracks.find(t => t.id === 'inner-child');
      const innerTeenagerTrack = result.tracks.find(t => t.id === 'inner-teenager');
      
      expect(innerChildTrack).toBeDefined();
      expect(innerChildTrack?.totalPrompts).toBe(365);
      expect(innerChildTrack?.currentDay).toBeGreaterThan(0);
      expect(innerChildTrack?.currentDay).toBeLessThanOrEqual(365);
      
      expect(innerTeenagerTrack).toBeDefined();
      expect(innerTeenagerTrack?.totalPrompts).toBe(365);
      expect(innerTeenagerTrack?.currentDay).toBeGreaterThan(0);
      expect(innerTeenagerTrack?.currentDay).toBeLessThanOrEqual(365);
      
      // Verify prompts are properly distributed
      const innerChildPrompts = result.prompts.filter(p => p.trackId === 'inner-child');
      const innerTeenagerPrompts = result.prompts.filter(p => p.trackId === 'inner-teenager');
      
      expect(innerChildPrompts).toHaveLength(365);
      expect(innerTeenagerPrompts).toHaveLength(365);
      
      // Verify day numbers are sequential
      const innerChildDays = innerChildPrompts.map(p => p.dayNumber).sort((a, b) => a - b);
      const innerTeenagerDays = innerTeenagerPrompts.map(p => p.dayNumber).sort((a, b) => a - b);
      
      expect(innerChildDays[0]).toBe(1);
      expect(innerChildDays[364]).toBe(365);
      expect(innerTeenagerDays[0]).toBe(1);
      expect(innerTeenagerDays[364]).toBe(365);
    });

    it('should persist data correctly after initialization', () => {
      // Initialize the system
      const initResult = promptService.loadOrInitializePromptSystem();
      expect(initResult.success).toBe(true);
      
      // Load again to verify persistence
      const loadResult = promptService.loadOrInitializePromptSystem();
      
      expect(loadResult.success).toBe(true);
      expect(loadResult.isNewInitialization).toBe(false);
      expect(loadResult.tracks).toHaveLength(2);
      expect(loadResult.prompts).toHaveLength(730);
      
      // Verify basic data integrity (tracks should have same IDs and structure)
      expect(loadResult.tracks.map(t => t.id).sort()).toEqual(['inner-child', 'inner-teenager']);
      expect(loadResult.prompts.length).toBe(initResult.prompts.length);
    });
  });

  describe('Migration Integration', () => {
    it('should initialize prompt system during migration', () => {
      // Simulate v2 data
      localStorage.setItem('emochild_logs', JSON.stringify([
        {
          id: 'test-log',
          text: 'Test emotion',
          action: 'expressed',
          timestamp: Date.now()
        }
      ]));
      localStorage.setItem('emochild_safety', '5');
      
      // Perform migration
      const migrationResult = performMigration();
      expect(migrationResult.success).toBe(true);
      
      // Load prompt system after migration
      const promptResult = promptService.loadOrInitializePromptSystem();
      
      expect(promptResult.success).toBe(true);
      expect(promptResult.tracks).toHaveLength(2);
      expect(promptResult.prompts).toHaveLength(730);
      
      // Verify migration preserved v2 data and added v3 features
      const v3Data = storageServiceV3.loadCompleteV3Data();
      expect(v3Data).toBeDefined();
      expect(v3Data?.logs).toHaveLength(1);
      expect(v3Data?.safetyScore).toBe(5);
      expect(v3Data?.promptTracks).toHaveLength(2);
      expect(v3Data?.prompts).toHaveLength(730);
    });
  });

  describe('Daily Prompt Operations', () => {
    it('should handle today\'s prompts correctly', () => {
      // Initialize system
      const initResult = promptService.loadOrInitializePromptSystem();
      expect(initResult.success).toBe(true);
      
      // Get today's prompts
      const todaysPrompts = promptService.getTodaysPrompts(initResult.prompts);
      
      expect(todaysPrompts.innerChild).toBeDefined();
      expect(todaysPrompts.innerChild?.trackId).toBe('inner-child');
      expect(todaysPrompts.innerChild?.dayNumber).toBeGreaterThan(0);
      expect(todaysPrompts.innerChild?.dayNumber).toBeLessThanOrEqual(365);
      
      expect(todaysPrompts.innerTeenager).toBeDefined();
      expect(todaysPrompts.innerTeenager?.trackId).toBe('inner-teenager');
      expect(todaysPrompts.innerTeenager?.dayNumber).toBeGreaterThan(0);
      expect(todaysPrompts.innerTeenager?.dayNumber).toBeLessThanOrEqual(365);
    });

    it('should handle prompt completion workflow', () => {
      // Initialize system
      const initResult = promptService.loadOrInitializePromptSystem();
      expect(initResult.success).toBe(true);
      
      // Get today's prompt
      const todaysPrompts = promptService.getTodaysPrompts(initResult.prompts);
      const innerChildPrompt = todaysPrompts.innerChild;
      
      expect(innerChildPrompt).toBeDefined();
      expect(innerChildPrompt?.isCompleted).toBe(false);
      
      // Complete the prompt
      const completeResult = promptService.completePromptAndSave(
        initResult.prompts,
        innerChildPrompt!.id,
        'This is my response to the inner child prompt'
      );
      
      expect(completeResult.success).toBe(true);
      
      // Find the completed prompt
      const completedPrompt = completeResult.updatedPrompts.find(
        p => p.id === innerChildPrompt!.id
      );
      
      expect(completedPrompt).toBeDefined();
      expect(completedPrompt?.isCompleted).toBe(true);
      expect(completedPrompt?.response).toBe('This is my response to the inner child prompt');
      expect(completedPrompt?.completedAt).toBeDefined();
      
      // Verify persistence
      const reloadResult = promptService.loadOrInitializePromptSystem();
      const reloadedPrompt = reloadResult.prompts.find(p => p.id === innerChildPrompt!.id);
      
      expect(reloadedPrompt?.isCompleted).toBe(true);
      expect(reloadedPrompt?.response).toBe('This is my response to the inner child prompt');
    });

    it('should handle prompt skipping without penalties', () => {
      // Initialize system
      const initResult = promptService.loadOrInitializePromptSystem();
      expect(initResult.success).toBe(true);
      
      // Get today's prompt
      const todaysPrompts = promptService.getTodaysPrompts(initResult.prompts);
      const innerTeenagerPrompt = todaysPrompts.innerTeenager;
      
      expect(innerTeenagerPrompt).toBeDefined();
      expect(innerTeenagerPrompt?.isCompleted).toBe(false);
      
      // Skip the prompt
      const skipResult = promptService.skipPromptAndSave(
        initResult.prompts,
        innerTeenagerPrompt!.id
      );
      
      expect(skipResult.success).toBe(true);
      
      // Verify prompt remains unchanged (can be completed later)
      const skippedPrompt = skipResult.updatedPrompts.find(
        p => p.id === innerTeenagerPrompt!.id
      );
      
      expect(skippedPrompt).toBeDefined();
      expect(skippedPrompt?.isCompleted).toBe(false);
      expect(skippedPrompt?.response).toBeUndefined();
      expect(skippedPrompt?.completedAt).toBeUndefined();
      
      // User should still be able to complete it later
      const completeResult = promptService.completePromptAndSave(
        skipResult.updatedPrompts,
        innerTeenagerPrompt!.id,
        'I decided to complete this after skipping'
      );
      
      expect(completeResult.success).toBe(true);
      
      const completedPrompt = completeResult.updatedPrompts.find(
        p => p.id === innerTeenagerPrompt!.id
      );
      
      expect(completedPrompt?.isCompleted).toBe(true);
      expect(completedPrompt?.response).toBe('I decided to complete this after skipping');
    });
  });

  describe('System Validation', () => {
    it('should validate prompt system integrity', () => {
      // Initialize system
      const initResult = promptService.loadOrInitializePromptSystem();
      expect(initResult.success).toBe(true);
      
      // Validate integrity
      const validation = promptService.validatePromptSystemIntegrity(
        initResult.tracks,
        initResult.prompts
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toHaveLength(0);
    });

    it('should provide comprehensive track statistics', () => {
      // Initialize system
      const initResult = promptService.loadOrInitializePromptSystem();
      expect(initResult.success).toBe(true);
      
      // Get initial stats
      const stats = promptService.getAllTrackStats(initResult.prompts);
      
      // Should have some unlocked prompts (based on current day of year)
      expect(stats.innerChild.totalUnlocked).toBeGreaterThan(0);
      expect(stats.innerChild.totalUnlocked).toBeLessThanOrEqual(365);
      expect(stats.innerChild.totalCompleted).toBe(0);
      expect(stats.innerChild.completionRate).toBe(0);
      expect(stats.innerChild.currentStreak).toBe(0);
      
      expect(stats.innerTeenager.totalUnlocked).toBeGreaterThan(0);
      expect(stats.innerTeenager.totalUnlocked).toBeLessThanOrEqual(365);
      expect(stats.innerTeenager.totalCompleted).toBe(0);
      expect(stats.innerTeenager.completionRate).toBe(0);
      expect(stats.innerTeenager.currentStreak).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage failures gracefully', () => {
      // Initialize system first
      const initResult = promptService.loadOrInitializePromptSystem();
      expect(initResult.success).toBe(true);
      
      // Create a scenario where we can test error handling
      // by trying to complete a non-existent prompt
      const completeResult = promptService.completePromptAndSave(
        initResult.prompts,
        'non-existent-prompt-id',
        'Test response'
      );
      
      expect(completeResult.success).toBe(false);
      expect(completeResult.error).toBe('Prompt not found');
      expect(completeResult.updatedPrompts).toEqual(initResult.prompts);
    });
  });
});