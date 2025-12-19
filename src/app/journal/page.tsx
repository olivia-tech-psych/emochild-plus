/**
 * Journal Page
 * Demo page showcasing the JournalSpread component
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

'use client';

import React, { useState } from 'react';
import { JournalSpread } from '@/components/JournalSpread';
import { JournalEntry } from '@/types';
import styles from './page.module.css';

export default function JournalPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  // Find entry for current date
  const currentEntry = entries.find(entry => 
    entry.date.toDateString() === currentDate.toDateString()
  );

  // Handle saving an entry
  const handleSave = (content: string, linkedEmotions: string[] = []) => {
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      content,
      date: new Date(currentDate),
      createdAt: new Date(),
      updatedAt: new Date(),
      linkedEmotions,
      wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
      tags: [],
      dayOfYear: Math.floor((currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
    };

    if (currentEntry) {
      // Update existing entry
      setEntries(prev => prev.map(entry => 
        entry.id === currentEntry.id 
          ? { ...newEntry, id: currentEntry.id, createdAt: currentEntry.createdAt }
          : entry
      ));
    } else {
      // Add new entry
      setEntries(prev => [...prev, newEntry]);
    }
    
    setIsEditing(false);
  };

  // Handle page turning
  const handlePageTurn = (direction: 'next' | 'previous') => {
    const newDate = new Date(currentDate);
    if (direction === 'next') {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
    setIsEditing(false);
  };

  // Check if we can turn pages
  const today = new Date();
  const canTurnNext = currentDate < today;
  const canTurnPrevious = true; // Can always go back

  return (
    <div className={styles.journalPageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Journal</h1>
        <div className={styles.actions}>
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
        </div>
      </header>

      <JournalSpread
        currentDate={currentDate}
        entry={currentEntry}
        isEditing={isEditing}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
        onPageTurn={handlePageTurn}
        canTurnNext={canTurnNext}
        canTurnPrevious={canTurnPrevious}
        linkedEmotions={currentEntry?.linkedEmotions || []}
      />

      <div className={styles.stats}>
        <p>Total entries: {entries.length}</p>
        <p>Words written today: {currentEntry?.wordCount || 0}</p>
      </div>
    </div>
  );
}