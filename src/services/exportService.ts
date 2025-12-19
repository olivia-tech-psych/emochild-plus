/**
 * Export Service for EmoChild v3
 * Handles CSV export functionality for journal entries with linked emotion data
 * Requirements: 2.1, 2.2, 2.3
 */

import { JournalEntry, EmotionLog } from '@/types';
import { sortEntriesByDate } from '@/utils/journalUtils';

/**
 * Export result interface
 */
export interface ExportResult {
  success: boolean;
  error?: string;
  filename?: string;
  downloadUrl?: string;
}

/**
 * CSV export options
 */
export interface CSVExportOptions {
  /** Include linked emotion data in export */
  includeEmotions?: boolean;
  /** Include entry metadata (created/updated timestamps) */
  includeMetadata?: boolean;
  /** Sort entries by date (ascending by default) */
  sortByDate?: boolean;
  /** Custom filename (without extension) */
  filename?: string;
}

/**
 * Escape CSV field content to handle quotes and commas
 * Requirements: 2.1, 2.2
 */
function escapeCSVField(field: string): string {
  if (!field) return '""';
  
  // Convert to string and handle null/undefined
  const stringField = String(field);
  
  // If field contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (stringField.includes('"') || stringField.includes(',') || stringField.includes('\n') || stringField.includes('\r')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  
  return stringField;
}

/**
 * Format date for CSV export
 * Requirements: 2.1, 2.2
 */
function formatDateForCSV(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

/**
 * Format timestamp for CSV export
 * Requirements: 2.1, 2.2
 */
function formatTimestampForCSV(date: Date): string {
  return date.toISOString(); // Full ISO timestamp
}

/**
 * Get emotion details by IDs for CSV export
 * Requirements: 2.2
 */
function getEmotionDetailsForCSV(emotionIds: string[], allEmotions: EmotionLog[]): string {
  if (!emotionIds || emotionIds.length === 0) {
    return '';
  }
  
  const emotionDetails = emotionIds
    .map(id => {
      const emotion = allEmotions.find(e => e.id === id);
      if (!emotion) return null;
      
      // Format: "emotion_text (action, timestamp)"
      const emotionDate = new Date(emotion.timestamp);
      return `${emotion.text} (${emotion.action}, ${formatDateForCSV(emotionDate)})`;
    })
    .filter(detail => detail !== null);
  
  return emotionDetails.join('; ');
}

/**
 * Generate CSV content from journal entries
 * Requirements: 2.1, 2.2
 */
export function generateJournalCSV(
  entries: JournalEntry[], 
  allEmotions: EmotionLog[] = [],
  options: CSVExportOptions = {}
): string {
  const {
    includeEmotions = true,
    includeMetadata = true,
    sortByDate = true
  } = options;
  
  // Handle empty entries
  if (!entries || entries.length === 0) {
    const headers = ['Date', 'Content', 'Word Count'];
    if (includeEmotions) {
      headers.push('Linked Emotions');
    }
    if (includeMetadata) {
      headers.push('Tags', 'Created At', 'Updated At');
    }
    return headers.join(',') + '\n';
  }
  
  // Sort entries if requested
  const processedEntries = sortByDate ? sortEntriesByDate(entries, true) : [...entries];
  
  // Build headers
  const headers = ['Date', 'Content', 'Word Count'];
  if (includeEmotions) {
    headers.push('Linked Emotions');
  }
  if (includeMetadata) {
    headers.push('Tags', 'Created At', 'Updated At');
  }
  
  // Build CSV rows
  const csvRows = [headers.join(',')];
  
  processedEntries.forEach(entry => {
    const row = [
      formatDateForCSV(entry.date),
      escapeCSVField(entry.content),
      entry.wordCount.toString()
    ];
    
    if (includeEmotions) {
      const emotionDetails = getEmotionDetailsForCSV(entry.linkedEmotions, allEmotions);
      row.push(escapeCSVField(emotionDetails));
    }
    
    if (includeMetadata) {
      const tags = (entry.tags || []).join(', ');
      row.push(escapeCSVField(tags));
      row.push(formatTimestampForCSV(entry.createdAt));
      row.push(formatTimestampForCSV(entry.updatedAt));
    }
    
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
}

/**
 * Generate filename for CSV export
 * Requirements: 2.1, 2.3
 */
function generateExportFilename(customFilename?: string): string {
  if (customFilename) {
    // Sanitize custom filename
    const sanitized = customFilename.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${sanitized}.csv`;
  }
  
  // Default filename with current date
  const now = new Date();
  const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return `emochild_journal_export_${dateString}.csv`;
}

/**
 * Create and trigger download of CSV file (browser-only)
 * Requirements: 2.1, 2.3
 */
function triggerCSVDownload(csvContent: string, filename: string): ExportResult {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return {
        success: false,
        error: 'Download functionality is only available in browser environment'
      };
    }
    
    // Create blob with CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download URL
    const url = URL.createObjectURL(blob);
    
    // Create temporary download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      filename,
      downloadUrl: url
    };
  } catch (error) {
    console.error('Failed to trigger CSV download:', error);
    return {
      success: false,
      error: `Failed to download CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Export journal entries to CSV file with local download
 * Requirements: 2.1, 2.2, 2.3
 */
export function exportJournalToCSV(
  entries: JournalEntry[],
  allEmotions: EmotionLog[] = [],
  options: CSVExportOptions = {}
): ExportResult {
  try {
    // Validate inputs
    if (!entries) {
      return {
        success: false,
        error: 'No journal entries provided for export'
      };
    }
    
    // Generate CSV content
    const csvContent = generateJournalCSV(entries, allEmotions, options);
    
    // Generate filename
    const filename = generateExportFilename(options.filename);
    
    // Trigger download (browser-only)
    return triggerCSVDownload(csvContent, filename);
    
  } catch (error) {
    console.error('Failed to export journal to CSV:', error);
    return {
      success: false,
      error: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get CSV content as string (for testing or server-side use)
 * Requirements: 2.1, 2.2
 */
export function getJournalCSVContent(
  entries: JournalEntry[],
  allEmotions: EmotionLog[] = [],
  options: CSVExportOptions = {}
): string {
  return generateJournalCSV(entries, allEmotions, options);
}

/**
 * Validate entries before export
 * Requirements: 2.1
 */
export function validateEntriesForExport(entries: JournalEntry[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!entries || !Array.isArray(entries)) {
    errors.push('Entries must be an array');
    return { isValid: false, errors, warnings };
  }
  
  if (entries.length === 0) {
    warnings.push('No entries to export');
  }
  
  // Validate each entry
  entries.forEach((entry, index) => {
    if (!entry.id) {
      errors.push(`Entry at index ${index} is missing an ID`);
    }
    
    if (!entry.content || entry.content.trim().length === 0) {
      warnings.push(`Entry at index ${index} has empty content`);
    }
    
    if (!entry.date || !(entry.date instanceof Date) || isNaN(entry.date.getTime())) {
      errors.push(`Entry at index ${index} has invalid date`);
    }
    
    if (!entry.createdAt || !(entry.createdAt instanceof Date) || isNaN(entry.createdAt.getTime())) {
      errors.push(`Entry at index ${index} has invalid createdAt timestamp`);
    }
    
    if (!entry.updatedAt || !(entry.updatedAt instanceof Date) || isNaN(entry.updatedAt.getTime())) {
      errors.push(`Entry at index ${index} has invalid updatedAt timestamp`);
    }
    
    if (entry.linkedEmotions && !Array.isArray(entry.linkedEmotions)) {
      errors.push(`Entry at index ${index} has invalid linkedEmotions (must be array)`);
    }
    
    if (entry.tags && !Array.isArray(entry.tags)) {
      errors.push(`Entry at index ${index} has invalid tags (must be array)`);
    }
    
    if (typeof entry.wordCount !== 'number' || entry.wordCount < 0) {
      warnings.push(`Entry at index ${index} has invalid word count`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Export service interface
 */
export const exportService = {
  exportJournalToCSV,
  getJournalCSVContent,
  generateJournalCSV,
  validateEntriesForExport,
  generateExportFilename
};