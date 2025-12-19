/**
 * EmotionLinker Component
 * Connects emotions to journal entries for same-day linking
 * Requirements: 1.5
 */

import React, { useState, useCallback, useMemo } from 'react';
import { EmotionLog } from '@/types';
import { useEmotion } from '@/context/EmotionContext';
import styles from './EmotionLinker.module.css';

export interface EmotionLinkerProps {
  /** Available emotions that can be linked (same-day emotions) */
  availableEmotions: EmotionLog[];
  /** Currently linked emotion IDs */
  linkedEmotions: string[];
  /** Callback when toggling emotion links */
  onToggleEmotion: (emotionId: string) => void;
  /** Whether the linker is in a collapsed state initially */
  initiallyCollapsed?: boolean;
  /** Date for which emotions are being linked (for display purposes) */
  date?: Date;
}

/**
 * EmotionLinker allows users to connect journal entries with emotions logged on the same day
 * 
 * Features:
 * - Displays same-day emotions available for linking
 * - Visual indicators for linked vs unlinked emotions
 * - Collapsible interface to save space
 * - Accessible checkbox interactions
 * - Emotion metadata display (action type, time)
 * - Visual tags for currently linked emotions
 * - Mobile-responsive design
 * 
 * Requirements: 1.5
 */
export function EmotionLinker({
  availableEmotions,
  linkedEmotions,
  onToggleEmotion,
  initiallyCollapsed = false,
  date
}: EmotionLinkerProps) {
  const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed);
  
  // Format time for display
  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }, []);

  // Get emotion details for linked emotions
  const linkedEmotionDetails = useMemo(() => {
    return linkedEmotions
      .map(emotionId => availableEmotions.find(emotion => emotion.id === emotionId))
      .filter((emotion): emotion is EmotionLog => emotion !== undefined);
  }, [linkedEmotions, availableEmotions]);

  // Handle emotion toggle
  const handleEmotionToggle = useCallback((emotionId: string) => {
    onToggleEmotion(emotionId);
  }, [onToggleEmotion]);

  // Handle keyboard interaction for emotion items
  const handleEmotionKeyDown = useCallback((
    event: React.KeyboardEvent,
    emotionId: string
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleEmotionToggle(emotionId);
    }
  }, [handleEmotionToggle]);

  // Toggle collapsed state
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // Format date for display
  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  }, []);

  return (
    <div className={styles.emotionLinker} role="region" aria-label="Emotion linking">
      <div className={styles.emotionLinkerHeader}>
        <h4 className={styles.emotionLinkerTitle}>
          Connect Emotions
          {date && (
            <span style={{ fontWeight: 'normal', fontSize: '14px', marginLeft: '8px' }}>
              from {formatDate(date)}
            </span>
          )}
        </h4>
        <button
          className={styles.toggleButton}
          onClick={toggleCollapsed}
          aria-expanded={!isCollapsed}
          aria-controls="emotion-linker-content"
          title={isCollapsed ? 'Show emotion linking options' : 'Hide emotion linking options'}
        >
          {isCollapsed ? 'Show' : 'Hide'}
        </button>
      </div>

      <div 
        id="emotion-linker-content"
        className={`${styles.emotionLinkerContent} ${isCollapsed ? styles.collapsed : styles.expanded}`}
        aria-hidden={isCollapsed}
      >
        {availableEmotions.length === 0 ? (
          <div className={styles.noEmotionsMessage} role="status">
            No emotions logged for this day yet. 
            <br />
            Log some emotions first to connect them to your journal entry.
          </div>
        ) : (
          <>
            <div className={styles.emotionsList} role="list" aria-label="Available emotions to link">
              {availableEmotions.map((emotion) => {
                const isLinked = linkedEmotions.includes(emotion.id);
                
                return (
                  <div
                    key={emotion.id}
                    className={`${styles.emotionItem} ${isLinked ? styles.linked : ''}`}
                    role="listitem"
                    onClick={() => handleEmotionToggle(emotion.id)}
                    onKeyDown={(e) => handleEmotionKeyDown(e, emotion.id)}
                    tabIndex={0}
                    aria-label={`${isLinked ? 'Unlink' : 'Link'} emotion: ${emotion.text}`}
                  >
                    <input
                      type="checkbox"
                      className={styles.emotionCheckbox}
                      checked={isLinked}
                      onChange={() => handleEmotionToggle(emotion.id)}
                      aria-label={`${isLinked ? 'Unlink' : 'Link'} emotion: ${emotion.text}`}
                      tabIndex={-1} // Parent handles keyboard interaction
                    />
                    
                    <div className={styles.emotionDetails}>
                      <p className={styles.emotionText}>{emotion.text}</p>
                      <div className={styles.emotionMeta}>
                        <span 
                          className={`${styles.emotionAction} ${styles[emotion.action]}`}
                          aria-label={`Action: ${emotion.action}`}
                        >
                          {emotion.action}
                        </span>
                        <span className={styles.emotionTime}>
                          {formatTime(emotion.timestamp)}
                        </span>
                        {emotion.quickEmotion && (
                          <span 
                            style={{ 
                              background: '#E8F5E8', 
                              color: '#2E7D32', 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              fontSize: '11px' 
                            }}
                            aria-label={`Quick emotion: ${emotion.quickEmotion}`}
                          >
                            {emotion.quickEmotion}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {linkedEmotionDetails.length > 0 && (
              <div className={styles.linkedEmotionsDisplay} role="region" aria-label="Currently linked emotions">
                <h5 className={styles.linkedEmotionsTitle}>
                  Linked Emotions ({linkedEmotionDetails.length})
                </h5>
                <div className={styles.linkedEmotionsTags} role="list">
                  {linkedEmotionDetails.map((emotion) => (
                    <span 
                      key={emotion.id}
                      className={styles.linkedEmotionTag}
                      role="listitem"
                    >
                      <span>{emotion.text}</span>
                      <button
                        className={styles.removeEmotionButton}
                        onClick={() => handleEmotionToggle(emotion.id)}
                        aria-label={`Remove link to emotion: ${emotion.text}`}
                        title={`Remove link to emotion: ${emotion.text}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}