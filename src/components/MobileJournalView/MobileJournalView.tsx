/**
 * MobileJournalView Component
 * Full-screen mobile journal writing experience
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { JournalEntry, EmotionLog } from '@/types';
import { EmotionLinker } from '../EmotionLinker';
import { getSameDayEmotions } from '@/utils/journalUtils';
import styles from './MobileJournalView.module.css';

export interface MobileJournalViewProps {
  /** Current date being viewed */
  currentDate: Date;
  /** Journal entry for the current date, if it exists */
  entry?: JournalEntry;
  /** Whether the view is open */
  isOpen: boolean;
  /** Callback when saving an entry */
  onSave: (content: string, linkedEmotions?: string[]) => void;
  /** Callback when closing the view */
  onClose: () => void;
  /** Optional linked emotions for the current entry */
  linkedEmotions?: string[];
  /** Callback when toggling emotion links */
  onToggleEmotion?: (emotionId: string) => void;
  /** All available emotions for linking */
  allEmotions?: EmotionLog[];
}

/**
 * MobileJournalView provides a full-screen mobile writing experience
 * 
 * Features:
 * - Full-screen overlay for distraction-free writing
 * - Large, readable system font for better mobile readability
 * - Auto-save functionality
 * - Word count display
 * - Emotion linking at the bottom
 * - Smooth slide-up animation
 * - Touch-friendly controls
 */
export function MobileJournalView({
  currentDate,
  entry,
  isOpen,
  onSave,
  onClose,
  linkedEmotions = [],
  onToggleEmotion,
  allEmotions = []
}: MobileJournalViewProps) {
  const [editContent, setEditContent] = useState(entry?.content || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Get same-day emotions for linking
  const sameDayEmotions = getSameDayEmotions(allEmotions, currentDate);
  
  // Calculate word count for current edit content
  const currentWordCount = editContent.trim() 
    ? editContent.trim().split(/\s+/).filter(word => word.length > 0).length 
    : 0;

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Auto-focus textarea when opened
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Small delay to ensure animation completes
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Update content when entry changes
  useEffect(() => {
    setEditContent(entry?.content || '');
  }, [entry]);

  // Handle save action with validation
  const handleSave = useCallback(() => {
    const trimmedContent = editContent.trim();
    
    if (!trimmedContent) {
      onClose();
      return;
    }
    
    onSave(trimmedContent, linkedEmotions);
    onClose();
  }, [editContent, linkedEmotions, onSave, onClose]);

  // Handle cancel action with confirmation for unsaved changes
  const handleCancel = useCallback(() => {
    const hasUnsavedChanges = editContent.trim() !== (entry?.content || '').trim();
    
    if (hasUnsavedChanges && editContent.trim()) {
      const confirmCancel = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmCancel) {
        return;
      }
    }
    
    setEditContent(entry?.content || '');
    onClose();
  }, [editContent, entry?.content, onClose]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Save with Ctrl+S (or Cmd+S on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
      
      // Close with Escape
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSave, handleCancel]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <button
            className={styles.closeButton}
            onClick={handleCancel}
            aria-label="Close journal"
          >
            ✕
          </button>
          
          <div className={styles.dateInfo}>
            <h2 className={styles.date}>{formatDate(currentDate)}</h2>
            <span className={styles.wordCount}>
              {currentWordCount} word{currentWordCount !== 1 ? 's' : ''}
            </span>
          </div>
          
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={!editContent.trim()}
          >
            Save
          </button>
        </div>

        {/* Main writing area */}
        <div className={styles.writingArea}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="What's on your heart today? Let your thoughts flow..."
            aria-label="Journal entry content"
            maxLength={5000}
          />
        </div>

        {/* Emotion linking section */}
        {(sameDayEmotions.length > 0 || linkedEmotions.length > 0) && onToggleEmotion && (
          <div className={styles.emotionSection}>
            <EmotionLinker
              availableEmotions={sameDayEmotions}
              linkedEmotions={linkedEmotions}
              onToggleEmotion={onToggleEmotion}
              initiallyCollapsed={false}
              date={currentDate}
            />
          </div>
        )}

        {/* Bottom actions */}
        <div className={styles.bottomActions}>
          <button
            className={styles.cancelButton}
            onClick={handleCancel}
          >
            Cancel
          </button>
          
          <div className={styles.saveInfo}>
            {editContent.length > 4500 && (
              <span className={styles.charLimit}>
                {5000 - editContent.length} characters remaining
              </span>
            )}
          </div>
          
          <button
            className={styles.primarySaveButton}
            onClick={handleSave}
            disabled={!editContent.trim()}
          >
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
}