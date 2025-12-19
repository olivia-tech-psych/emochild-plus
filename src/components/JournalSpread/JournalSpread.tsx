/**
 * JournalSpread Component
 * Two-page journal layout with cozy stationery aesthetic
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import React, { useState, useCallback, useEffect } from 'react';
import { JournalEntry, EmotionLog } from '@/types';
import { PageCurl } from '../PageCurl';
import { EmotionLinker } from '../EmotionLinker';
import { getSameDayEmotions } from '@/utils/journalUtils';
import styles from './JournalSpread.module.css';

export interface JournalSpreadProps {
  /** Current date being viewed */
  currentDate: Date;
  /** Journal entry for the current date, if it exists */
  entry?: JournalEntry;
  /** Whether the journal is in editing mode */
  isEditing: boolean;
  /** Callback when saving an entry */
  onSave: (content: string, linkedEmotions?: string[]) => void;
  /** Callback when canceling edit mode */
  onCancel: () => void;
  /** Callback when turning pages */
  onPageTurn: (direction: 'next' | 'previous') => void;
  /** Whether the next page can be turned to */
  canTurnNext: boolean;
  /** Whether the previous page can be turned to */
  canTurnPrevious: boolean;
  /** Optional linked emotions for the current entry */
  linkedEmotions?: string[];
  /** Callback when toggling emotion links */
  onToggleEmotion?: (emotionId: string) => void;
  /** All available emotions for linking */
  allEmotions?: EmotionLog[];
}

/**
 * JournalSpread displays a two-page journal interface with cozy stationery aesthetic
 * 
 * Features:
 * - Two-page spread layout matching the design specification
 * - Dark pink borders (#D4567A) with light pink pages (#F8E8ED)
 * - Handwriting-style font (Kalam) for authentic journal feel
 * - Tilde placeholders (~) for empty content areas
 * - Page curl animations for navigation
 * - Date headers showing day of year
 * - Responsive design for mobile compatibility
 * - Accessibility support with proper ARIA labels
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export function JournalSpread({
  currentDate,
  entry,
  isEditing,
  onSave,
  onCancel,
  onPageTurn,
  canTurnNext,
  canTurnPrevious,
  linkedEmotions = [],
  onToggleEmotion,
  allEmotions = []
}: JournalSpreadProps) {
  const [editContent, setEditContent] = useState(entry?.content || '');
  
  // Get same-day emotions for linking
  const sameDayEmotions = getSameDayEmotions(allEmotions, currentDate);
  
  // Calculate word count for current edit content
  const currentWordCount = editContent.trim() 
    ? editContent.trim().split(/\s+/).filter(word => word.length > 0).length 
    : 0;

  // Calculate day of year (1-365)
  const dayOfYear = Math.floor((currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Handle save action with validation
  const handleSave = useCallback(() => {
    const trimmedContent = editContent.trim();
    
    // Validate entry content
    if (!trimmedContent) {
      return; // Don't save empty entries
    }
    
    // Additional validation: minimum word count (optional)
    if (trimmedContent.split(/\s+/).filter(word => word.length > 0).length < 1) {
      return; // Ensure at least one meaningful word
    }
    
    onSave(trimmedContent, linkedEmotions);
    setEditContent('');
  }, [editContent, linkedEmotions, onSave]);

  // Handle cancel action with confirmation for unsaved changes
  const handleCancel = useCallback(() => {
    const hasUnsavedChanges = editContent.trim() !== (entry?.content || '').trim();
    
    if (hasUnsavedChanges && editContent.trim()) {
      const confirmCancel = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmCancel) {
        return;
      }
    }
    
    setEditContent(entry?.content || '');
    onCancel();
  }, [editContent, entry?.content, onCancel]);

  // Generate tilde pattern for empty pages
  const generateTildePattern = () => {
    const tildes = [];
    for (let i = 0; i < 15; i++) {
      tildes.push(<span key={i} className={styles.tilde}>~</span>);
    }
    return tildes;
  };

  // Check if current date is in the future
  const isFuture = currentDate > new Date();

  // Handle keyboard shortcuts when editing
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Save with Ctrl+S (or Cmd+S on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (editContent.trim() && currentWordCount > 0) {
          handleSave();
        }
      }
      
      // Cancel with Escape
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, editContent, currentWordCount, handleSave, handleCancel]);

  return (
    <div className={styles.journalContainer}>
      <div className={styles.journalSpread} role="main" aria-label="Journal spread">
        {/* Left Page */}
        <div className={styles.journalPage} role="article" aria-label={`Left journal page for ${formatDate(currentDate)}`}>
          <div className={styles.pageHeader}>
            <h2 className={styles.pageDate}>{formatDate(currentDate)}</h2>
            <span className={styles.dayOfYear} aria-label={`Day ${dayOfYear} of the year`}>
              Day {dayOfYear}
            </span>
          </div>
          
          <div className={styles.pageContent}>
            {isEditing ? (
              <textarea
                className={styles.contentArea}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="What's on your heart today? Let your thoughts flow..."
                aria-label="Journal entry content"
                aria-describedby="word-count-display"
                autoFocus
                maxLength={5000} // Reasonable limit for journal entries
                rows={12} // Minimum rows for better UX
              />
            ) : entry?.content ? (
              <div 
                className={styles.contentArea}
                style={{ whiteSpace: 'pre-wrap' }}
                role="article"
                aria-label="Journal entry content"
              >
                {entry.content}
              </div>
            ) : (
              <div className={styles.emptyPlaceholder} role="img" aria-label="Empty journal page with decorative tildes">
                <div>Ready for your thoughts...</div>
                <div className={styles.tildePattern}>
                  {generateTildePattern()}
                </div>
              </div>
            )}
          </div>

          {isEditing && (
            <>
              <div 
                id="word-count-display"
                className={styles.wordCountDisplay} 
                role="status" 
                aria-live="polite"
              >
                <span className={styles.wordCount}>
                  {currentWordCount} word{currentWordCount !== 1 ? 's' : ''}
                </span>
                {currentWordCount === 0 && (
                  <span className={styles.validationHint}>
                    Start writing to save your entry
                  </span>
                )}
                {editContent.length > 4500 && (
                  <span className={styles.validationHint}>
                    {5000 - editContent.length} characters remaining
                  </span>
                )}
              </div>
              <div className={styles.pageActions}>
                <button 
                  className={`${styles.actionButton} ${styles.secondaryButton}`}
                  onClick={handleCancel}
                  aria-label="Cancel editing (Esc)"
                  title="Cancel editing (Esc)"
                >
                  Cancel
                </button>
                <button 
                  className={styles.actionButton}
                  onClick={handleSave}
                  disabled={!editContent.trim() || currentWordCount === 0}
                  aria-label={`Save journal entry (${currentWordCount} words) - Ctrl+S`}
                  title={`Save journal entry (${currentWordCount} words) - Ctrl+S`}
                >
                  Save Entry
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Page */}
        <div className={styles.journalPage} role="article" aria-label="Right journal page">
          <div className={styles.pageHeader}>
            <h3 className={styles.pageDate}>Reflections</h3>
            {entry && (
              <span className={styles.dayOfYear} aria-label={`${entry.wordCount} words written`}>
                {entry.wordCount} words
              </span>
            )}
          </div>
          
          <div className={styles.pageContent}>
            {/* Emotion Linking Section */}
            {(isEditing || sameDayEmotions.length > 0) && onToggleEmotion && (
              <EmotionLinker
                availableEmotions={sameDayEmotions}
                linkedEmotions={linkedEmotions}
                onToggleEmotion={onToggleEmotion}
                initiallyCollapsed={!isEditing}
                date={currentDate}
              />
            )}
            
            {/* Linked Emotions Display (when not editing and has linked emotions) */}
            {!isEditing && entry && linkedEmotions.length > 0 && (
              <div role="region" aria-label="Linked emotions for this entry" style={{ marginTop: 'var(--spacing-sm)' }}>
                <h4 style={{ 
                  fontFamily: 'var(--font-kalam), Kalam, cursive, sans-serif', 
                  color: 'var(--color-journal-binding)', 
                  marginBottom: 'var(--spacing-sm)',
                  fontSize: '16px'
                }}>
                  Connected Emotions:
                </h4>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 'var(--spacing-xs)' 
                }}>
                  {linkedEmotions.map((emotionId, index) => {
                    const emotion = allEmotions.find(e => e.id === emotionId);
                    return (
                      <span 
                        key={emotionId}
                        style={{
                          background: '#E5C2D1',
                          color: '#5A3A4A',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontFamily: 'var(--font-kalam), Kalam, cursive, sans-serif'
                        }}
                        role="listitem"
                        aria-label={`Linked emotion ${index + 1}: ${emotion?.text || emotionId}`}
                        title={emotion?.text || emotionId}
                      >
                        {emotion?.text || emotionId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Empty state when no emotions and not editing */}
            {!isEditing && sameDayEmotions.length === 0 && linkedEmotions.length === 0 && (
              <div className={styles.emptyPlaceholder} role="img" aria-label="Empty reflection page with decorative tildes">
                <div>Space for reflection...</div>
                <div className={styles.tildePattern}>
                  {generateTildePattern()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className={styles.navigationControls} role="navigation" aria-label="Journal page navigation">
        <PageCurl
          direction="previous"
          onCurl={() => onPageTurn('previous')}
          disabled={!canTurnPrevious}
          animationDuration={500}
        />
        
        <div className={styles.pageIndicator} role="status" aria-live="polite">
          {formatDate(currentDate)}
        </div>
        
        <PageCurl
          direction="next"
          onCurl={() => onPageTurn('next')}
          disabled={!canTurnNext || isFuture}
          animationDuration={500}
        />
      </div>
    </div>
  );
}