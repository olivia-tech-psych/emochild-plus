/**
 * CalendarPicker Component
 * Mobile-first calendar date picker for journal navigation
 * Pastel pink + dark pink color palette
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { JournalEntry } from '@/types';
import styles from './CalendarPicker.module.css';

export interface CalendarPickerProps {
  /** Currently selected date */
  selectedDate: Date;
  /** Callback when a date is selected */
  onDateSelect: (date: Date) => void;
  /** Whether the calendar is open */
  isOpen: boolean;
  /** Callback to close the calendar */
  onClose: () => void;
  /** Journal entries to show which dates have content */
  journalEntries?: JournalEntry[];
  /** Optional callback for URL sync */
  onUrlSync?: (date: Date) => void;
}

/**
 * CalendarPicker provides a mobile-first date picker for journal navigation
 * 
 * Features:
 * - Soft pastel pink background with dark pink accents
 * - Mobile: bottom sheet with rounded corners
 * - Desktop: floating popover with soft shadow
 * - Swipe left/right to change months on mobile
 * - Visual indicators for dates with journal entries
 * - Smooth animations and accessibility support
 * - "Feels like opening a soft paper insert inside a journal"
 * 
 * Color Palette:
 * - Primary: soft pastel pink (paper-like)
 * - Accent: muted dark pink/rose for highlights
 * - Text: deep rose or muted plum
 * - Selected: filled dark pink circle
 * - Today: dark pink outline
 * - Has entry: small dark pink dot
 */
export function CalendarPicker({
  selectedDate,
  onDateSelect,
  isOpen,
  onClose,
  journalEntries = [],
  onUrlSync
}: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Hook to detect mobile screen size
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Close calendar on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Check if a date has a journal entry
  const hasJournalEntry = useCallback((date: Date) => {
    return journalEntries.some(entry => 
      entry.date.toDateString() === date.toDateString()
    );
  }, [journalEntries]);

  // Check if date is today
  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);

  // Check if date is selected
  const isSelected = useCallback((date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  }, [selectedDate]);

  // Check if date is in future
  const isFuture = useCallback((date: Date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return date > today;
  }, []);

  // Handle date selection
  const handleDateSelect = useCallback((date: Date) => {
    if (isFuture(date)) return; // Don't allow future dates
    
    onDateSelect(date);
    if (onUrlSync) {
      onUrlSync(date);
    }
    onClose();
  }, [onDateSelect, onUrlSync, onClose, isFuture]);

  // Navigate to previous month
  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  // Navigate to next month
  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  // Handle touch events for swipe navigation on mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNextMonth();
    }
    if (isRightSwipe) {
      goToPreviousMonth();
    }
  }, [touchStart, touchEnd, goToNextMonth, goToPreviousMonth]);

  // Generate calendar days
  const generateCalendarDays = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // End at the last Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [currentMonth]);

  const calendarDays = generateCalendarDays();

  // Format month/year header
  const monthYearText = currentMonth.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  if (!isOpen) return null;

  return (
    <div className={styles.calendarOverlay}>
      <div 
        ref={calendarRef}
        className={`${styles.calendarContainer} ${isMobile ? styles.mobile : styles.desktop}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-label="Calendar date picker"
        aria-modal="true"
      >
        {/* Header with month/year and navigation */}
        <div className={styles.calendarHeader}>
          <button
            className={styles.navButton}
            onClick={goToPreviousMonth}
            aria-label="Previous month"
            title="Previous month"
          >
            ←
          </button>
          
          <h2 className={styles.monthYear}>{monthYearText}</h2>
          
          <button
            className={styles.navButton}
            onClick={goToNextMonth}
            aria-label="Next month"
            title="Next month"
          >
            →
          </button>
        </div>

        {/* Swipe hint for mobile */}
        {isMobile && (
          <div className={styles.swipeHint}>
            Swipe left or right to change months
          </div>
        )}

        {/* Day labels */}
        <div className={styles.dayLabels}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className={styles.dayLabel}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className={styles.calendarGrid}>
          {calendarDays.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isDateToday = isToday(date);
            const isDateSelected = isSelected(date);
            const isDateFuture = isFuture(date);
            const hasEntry = hasJournalEntry(date);

            const dayClasses = [
              styles.calendarDay,
              !isCurrentMonth ? styles.otherMonth : '',
              isDateToday ? styles.today : '',
              isDateSelected ? styles.selected : '',
              isDateFuture ? styles.future : '',
              hasEntry ? styles.hasEntry : ''
            ].filter(Boolean).join(' ');

            return (
              <button
                key={index}
                className={dayClasses}
                onClick={() => handleDateSelect(date)}
                disabled={isDateFuture}
                aria-label={`${date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}${hasEntry ? ', has journal entry' : ''}${isDateToday ? ', today' : ''}`}
                title={date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              >
                <span className={styles.dayNumber}>{date.getDate()}</span>
                {hasEntry && <span className={styles.entryDot} aria-hidden="true"></span>}
              </button>
            );
          })}
        </div>

        {/* Close button for mobile */}
        {isMobile && (
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close calendar"
            title="Close calendar"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}