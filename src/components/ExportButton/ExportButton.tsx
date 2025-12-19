/**
 * ExportButton Component
 * Provides CSV export functionality for journal entries
 * Requirements: 2.1, 2.2, 2.3
 */

import React, { useState, useCallback } from 'react';
import { JournalEntry, EmotionLog } from '@/types';
import { exportService, CSVExportOptions } from '@/services/exportService';
import styles from './ExportButton.module.css';

export interface ExportButtonProps {
  /** Journal entries to export */
  entries: JournalEntry[];
  /** All emotions for linking data */
  allEmotions?: EmotionLog[];
  /** Export options */
  options?: CSVExportOptions;
  /** Custom button text */
  buttonText?: string;
  /** Whether the button should be disabled */
  disabled?: boolean;
  /** Callback when export completes successfully */
  onExportSuccess?: (filename: string) => void;
  /** Callback when export fails */
  onExportError?: (error: string) => void;
  /** Custom CSS class for the button */
  className?: string;
}

/**
 * ExportButton provides a user-friendly interface for exporting journal entries to CSV
 * 
 * Features:
 * - One-click CSV export with local download
 * - Validation of entries before export
 * - Loading state during export process
 * - Error handling with user feedback
 * - Customizable export options
 * - Accessibility support
 * 
 * Requirements: 2.1, 2.2, 2.3
 */
export function ExportButton({
  entries,
  allEmotions = [],
  options = {},
  buttonText = 'Export to CSV',
  disabled = false,
  onExportSuccess,
  onExportError,
  className
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportError, setLastExportError] = useState<string | null>(null);

  // Handle export process
  const handleExport = useCallback(async () => {
    if (isExporting || disabled) return;

    setIsExporting(true);
    setLastExportError(null);

    try {
      // Validate entries before export
      const validation = exportService.validateEntriesForExport(entries);
      
      if (!validation.isValid) {
        const errorMessage = `Export validation failed: ${validation.errors.join(', ')}`;
        setLastExportError(errorMessage);
        onExportError?.(errorMessage);
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Export warnings:', validation.warnings);
      }

      // Perform export
      const result = exportService.exportJournalToCSV(entries, allEmotions, options);

      if (result.success) {
        onExportSuccess?.(result.filename || 'export.csv');
      } else {
        const errorMessage = result.error || 'Export failed for unknown reason';
        setLastExportError(errorMessage);
        onExportError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = `Export error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setLastExportError(errorMessage);
      onExportError?.(errorMessage);
    } finally {
      setIsExporting(false);
    }
  }, [entries, allEmotions, options, isExporting, disabled, onExportSuccess, onExportError]);

  // Get export summary info
  const getExportSummary = () => {
    if (!entries || entries.length === 0) {
      return 'No entries to export';
    }

    const entryCount = entries.length;
    const linkedEmotionCount = entries.reduce((count, entry) => 
      count + (entry.linkedEmotions?.length || 0), 0
    );

    return `${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}${
      linkedEmotionCount > 0 ? ` with ${linkedEmotionCount} linked emotions` : ''
    }`;
  };

  // Check if export is available
  const canExport = entries && entries.length > 0 && !disabled;

  return (
    <div className={styles.exportContainer}>
      <button
        className={`${styles.exportButton} ${className || ''}`}
        onClick={handleExport}
        disabled={!canExport || isExporting}
        aria-label={`${buttonText} - ${getExportSummary()}`}
        title={`${buttonText} - ${getExportSummary()}`}
      >
        {isExporting ? (
          <>
            <span className={styles.loadingSpinner} aria-hidden="true" />
            Exporting...
          </>
        ) : (
          <>
            <span className={styles.exportIcon} aria-hidden="true">📊</span>
            {buttonText}
          </>
        )}
      </button>

      {/* Export summary */}
      <div className={styles.exportSummary} role="status" aria-live="polite">
        {getExportSummary()}
      </div>

      {/* Error display */}
      {lastExportError && (
        <div 
          className={styles.errorMessage} 
          role="alert" 
          aria-live="assertive"
        >
          <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
          {lastExportError}
          <button
            className={styles.dismissError}
            onClick={() => setLastExportError(null)}
            aria-label="Dismiss error message"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * ExportButtonSimple - A simplified version without advanced features
 * Requirements: 2.1, 2.2, 2.3
 */
export function ExportButtonSimple({
  entries,
  allEmotions = [],
  options = {},
  className
}: Pick<ExportButtonProps, 'entries' | 'allEmotions' | 'options' | 'className'>) {
  const handleExport = () => {
    if (!entries || entries.length === 0) {
      alert('No journal entries to export');
      return;
    }

    const result = exportService.exportJournalToCSV(entries, allEmotions, options);
    
    if (!result.success) {
      alert(`Export failed: ${result.error}`);
    }
  };

  return (
    <button
      className={`${styles.exportButtonSimple} ${className || ''}`}
      onClick={handleExport}
      disabled={!entries || entries.length === 0}
      aria-label={`Export ${entries?.length || 0} journal entries to CSV`}
    >
      Export CSV
    </button>
  );
}