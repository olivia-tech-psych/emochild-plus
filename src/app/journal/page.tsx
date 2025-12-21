/**
 * Journal Page
 * Demo page showcasing the JournalSpread component
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

'use client';

import React, { useState, useCallback } from 'react';
import { JournalSpread } from '@/components/JournalSpread';
import { ExportButton } from '@/components/ExportButton';
import { CalendarPicker } from '@/components/CalendarPicker';
import { JournalEntry } from '@/types';
import { useEmotion } from '@/context/EmotionContext';
import styles from './page.module.css';

export default function JournalPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [linkedEmotions, setLinkedEmotions] = useState<string[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Get emotions from context
  const { logs: allEmotions } = useEmotion();

  // Find entry for current date
  const currentEntry = entries.find(entry => 
    entry.date.toDateString() === currentDate.toDateString()
  );
  
  // Update linked emotions when entry changes
  React.useEffect(() => {
    setLinkedEmotions(currentEntry?.linkedEmotions || []);
  }, [currentEntry]);

  // Handle saving an entry with validation
  const handleSave = useCallback((content: string, entryLinkedEmotions: string[] = []) => {
    // Validate content
    if (!content.trim()) {
      console.warn('Cannot save empty journal entry');
      return;
    }

    const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    const newEntry: JournalEntry = {
      id: currentEntry?.id || Date.now().toString(),
      content: content.trim(),
      date: new Date(currentDate),
      createdAt: currentEntry?.createdAt || new Date(),
      updatedAt: new Date(),
      linkedEmotions: entryLinkedEmotions,
      wordCount,
      tags: [],
      dayOfYear: Math.floor((currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
    };

    if (currentEntry) {
      // Update existing entry
      setEntries(prev => prev.map(entry => 
        entry.id === currentEntry.id 
          ? newEntry
          : entry
      ));
    } else {
      // Add new entry
      setEntries(prev => [...prev, newEntry]);
    }
    
    setIsEditing(false);
  }, [currentEntry, currentDate]);

  // Handle emotion linking toggle
  const handleToggleEmotion = useCallback((emotionId: string) => {
    setLinkedEmotions(prev => {
      if (prev.includes(emotionId)) {
        return prev.filter(id => id !== emotionId);
      } else {
        return [...prev, emotionId];
      }
    });
  }, []);

  // Handle page turning
  const handlePageTurn = useCallback((direction: 'next' | 'previous') => {
    const newDate = new Date(currentDate);
    if (direction === 'next') {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
    setIsEditing(false);
  }, [currentDate]);

  // Handle calendar date selection
  const handleCalendarDateSelect = useCallback((date: Date) => {
    setCurrentDate(date);
    setIsEditing(false);
    setIsCalendarOpen(false);
  }, []);

  // Check if we can turn pages
  const today = new Date();
  const canTurnNext = currentDate < today;
  const canTurnPrevious = true; // Can always go back

  return (
    <div className={styles.journalPageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Journal</h1>
        <div className={styles.actions}>
          <button 
            className={styles.calendarButton}
            onClick={() => setIsCalendarOpen(true)}
            aria-label="Open calendar to jump to date"
            title="Jump to date"
          >
            📅
          </button>
          {!isEditing && (
            <button 
              className={styles.editButton}
              onClick={() => setIsEditing(true)}
              disabled={currentDate > today}
            >
              {currentEntry ? 'Edit Entry' : 'Write Entry'}
            </button>
          )}
          <button 
            className={styles.todayButton}
            onClick={() => {
              setCurrentDate(new Date());
              setIsEditing(false);
            }}
          >
            Today
          </button>
          <ExportButton
            entries={entries}
            allEmotions={allEmotions}
            onExportSuccess={(filename) => {
              console.log(`Journal exported successfully: ${filename}`);
            }}
            onExportError={(error) => {
              console.error('Export failed:', error);
            }}
            className={styles.exportButton}
          />
        </div>
      </header>

      <JournalSpread
        currentDate={currentDate}
        entry={currentEntry}
        isEditing={isEditing}
        onSave={(content) => handleSave(content, linkedEmotions)}
        onCancel={() => setIsEditing(false)}
        onPageTurn={handlePageTurn}
        canTurnNext={canTurnNext}
        canTurnPrevious={canTurnPrevious}
        linkedEmotions={linkedEmotions}
        onToggleEmotion={handleToggleEmotion}
        allEmotions={allEmotions}
      />

      <div className={styles.stats}>
        <p>Total entries: {entries.length}</p>
        <p>Words written today: {currentEntry?.wordCount || 0}</p>
      </div>

      {/* Calendar Picker */}
      <CalendarPicker
        selectedDate={currentDate}
        onDateSelect={handleCalendarDateSelect}
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        journalEntries={entries}
      />
    </div>
  );
}