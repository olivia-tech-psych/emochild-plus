/**
 * Prompt utility functions for EmoChild v3
 * Handles prompt system operations and daily unlocking logic
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { Prompt, PromptTrack } from '@/types';

/**
 * Get current day of year (1-365)
 * Requirements: 3.2
 */
export function getCurrentDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Check if a prompt should be unlocked based on current date
 * Requirements: 3.2
 */
export function isPromptUnlocked(prompt: Prompt): boolean {
  const currentDay = getCurrentDayOfYear();
  return prompt.dayNumber <= currentDay;
}

/**
 * Get today's prompt for a specific track
 * Requirements: 3.2, 3.4
 */
export function getTodaysPrompt(prompts: Prompt[], trackId: string): Prompt | null {
  const currentDay = getCurrentDayOfYear();
  
  const todaysPrompt = prompts.find(
    prompt => prompt.trackId === trackId && prompt.dayNumber === currentDay
  );
  
  return todaysPrompt || null;
}

/**
 * Get all unlocked prompts for a track
 * Requirements: 3.2, 3.5
 */
export function getUnlockedPrompts(prompts: Prompt[], trackId: string): Prompt[] {
  const currentDay = getCurrentDayOfYear();
  
  return prompts.filter(
    prompt => prompt.trackId === trackId && prompt.dayNumber <= currentDay
  );
}

/**
 * Create a new prompt
 * Requirements: 3.1, 3.3
 */
export function createPrompt(
  trackId: 'inner-child' | 'inner-teenager',
  dayNumber: number,
  content: string,
  category: string
): Prompt {
  // Generate UUID v4 compatible ID
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
  
  return {
    id: generateId(),
    trackId,
    dayNumber,
    content,
    category,
    isCompleted: false
  };
}

/**
 * Complete a prompt with user response
 * Requirements: 3.4, 3.5
 */
export function completePrompt(prompt: Prompt, response: string): Prompt {
  return {
    ...prompt,
    isCompleted: true,
    response,
    completedAt: new Date()
  };
}

/**
 * Skip a prompt (mark as seen but not completed)
 * Requirements: 3.5
 */
export function skipPrompt(prompt: Prompt): Prompt {
  // For skipped prompts, we don't mark them as completed
  // This allows users to come back to them later if they want
  return prompt;
}

/**
 * Update prompt track progress
 * Requirements: 3.2, 3.3
 */
export function updateTrackProgress(track: PromptTrack): PromptTrack {
  const currentDay = getCurrentDayOfYear();
  
  return {
    ...track,
    currentDay: Math.min(currentDay, track.totalPrompts)
  };
}

/**
 * Get completion statistics for a track
 * Requirements: 3.4, 3.5
 */
export function getTrackStats(prompts: Prompt[], trackId: string): {
  totalUnlocked: number;
  totalCompleted: number;
  completionRate: number;
  currentStreak: number;
} {
  const trackPrompts = prompts.filter(p => p.trackId === trackId);
  const unlockedPrompts = getUnlockedPrompts(prompts, trackId);
  const completedPrompts = trackPrompts.filter(p => p.isCompleted);
  
  // Calculate current streak (consecutive completed prompts from today backwards)
  const currentDay = getCurrentDayOfYear();
  let streak = 0;
  
  for (let day = currentDay; day >= 1; day--) {
    const dayPrompt = trackPrompts.find(p => p.dayNumber === day);
    if (dayPrompt && dayPrompt.isCompleted) {
      streak++;
    } else {
      break;
    }
  }
  
  return {
    totalUnlocked: unlockedPrompts.length,
    totalCompleted: completedPrompts.length,
    completionRate: unlockedPrompts.length > 0 ? completedPrompts.length / unlockedPrompts.length : 0,
    currentStreak: streak
  };
}

/**
 * Generate Inner Child prompts for the year
 * Requirements: 3.1, 3.3
 */
export function generateInnerChildPrompts(): Prompt[] {
  const prompts: Prompt[] = [];
  
  // Sample Inner Child prompts - in a real implementation, this would be a comprehensive set
  const promptTemplates = [
    { content: "What made you feel safest as a child? How can you create that feeling today?", category: "safety" },
    { content: "If you could play any game right now without judgment, what would it be?", category: "play" },
    { content: "What's something you've always wanted to try but felt too scared or silly to do?", category: "curiosity" },
    { content: "When did you last feel truly excited about something small and simple?", category: "joy" },
    { content: "What would your younger self want to hear from you today?", category: "comfort" },
    { content: "What's a silly dream or wish you had as a child that still makes you smile?", category: "dreams" },
    { content: "How do you like to be comforted when you're feeling sad or scared?", category: "comfort" },
    { content: "What's your favorite way to be creative without worrying about being 'good' at it?", category: "creativity" },
    { content: "What makes you feel most like yourself, without any masks or pretending?", category: "authenticity" },
    { content: "If you could have a magical day with no responsibilities, what would you do?", category: "play" }
  ];
  
  // Generate 365 prompts by cycling through templates and variations
  for (let day = 1; day <= 365; day++) {
    const template = promptTemplates[(day - 1) % promptTemplates.length];
    
    prompts.push(createPrompt(
      'inner-child',
      day,
      template.content,
      template.category
    ));
  }
  
  return prompts;
}

/**
 * Generate Inner Teenager prompts for the year
 * Requirements: 3.1, 3.3
 */
export function generateInnerTeenagerPrompts(): Prompt[] {
  const prompts: Prompt[] = [];
  
  // Sample Inner Teenager prompts - in a real implementation, this would be a comprehensive set
  const promptTemplates = [
    { content: "What values are most important to you, and how do they show up in your daily life?", category: "identity" },
    { content: "Where do you feel pressure to be someone you're not? How does that feel?", category: "authenticity" },
    { content: "What boundaries do you need to set to protect your energy and well-being?", category: "boundaries" },
    { content: "What's something you believe strongly about, even if others disagree?", category: "values" },
    { content: "How do you want to be seen and understood by others?", category: "identity" },
    { content: "What's a risk you want to take but haven't yet? What's holding you back?", category: "growth" },
    { content: "When do you feel most confident and sure of yourself?", category: "confidence" },
    { content: "What relationships in your life feel most authentic and supportive?", category: "relationships" },
    { content: "How do you handle conflict or disagreement with people you care about?", category: "relationships" },
    { content: "What's changing about you that you're proud of or excited about?", category: "growth" }
  ];
  
  // Generate 365 prompts by cycling through templates and variations
  for (let day = 1; day <= 365; day++) {
    const template = promptTemplates[(day - 1) % promptTemplates.length];
    
    prompts.push(createPrompt(
      'inner-teenager',
      day,
      template.content,
      template.category
    ));
  }
  
  return prompts;
}

/**
 * Initialize all prompts for both tracks
 * Requirements: 3.1, 3.2, 3.3
 */
export function initializeAllPrompts(): Prompt[] {
  return [
    ...generateInnerChildPrompts(),
    ...generateInnerTeenagerPrompts()
  ];
}

/**
 * Get prompts by category for a track
 * Requirements: 3.1, 3.4
 */
export function getPromptsByCategory(
  prompts: Prompt[], 
  trackId: string, 
  category: string
): Prompt[] {
  return prompts.filter(
    prompt => prompt.trackId === trackId && prompt.category === category
  );
}

/**
 * Search prompts by content
 * Requirements: 3.4
 */
export function searchPrompts(prompts: Prompt[], query: string): Prompt[] {
  const lowercaseQuery = query.toLowerCase();
  
  return prompts.filter(prompt => 
    prompt.content.toLowerCase().includes(lowercaseQuery) ||
    prompt.category.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Validate prompt data
 * Requirements: 3.1, 3.4
 */
export function validatePrompt(prompt: Partial<Prompt>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!prompt.trackId || !['inner-child', 'inner-teenager'].includes(prompt.trackId)) {
    errors.push('Valid track ID is required (inner-child or inner-teenager)');
  }
  
  if (!prompt.dayNumber || prompt.dayNumber < 1 || prompt.dayNumber > 365) {
    errors.push('Day number must be between 1 and 365');
  }
  
  if (!prompt.content || prompt.content.trim().length === 0) {
    errors.push('Prompt content cannot be empty');
  }
  
  if (!prompt.category || prompt.category.trim().length === 0) {
    errors.push('Prompt category is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}