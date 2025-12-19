/**
 * ExportButton Component Tests
 * Tests for CSV export button functionality
 * Requirements: 2.1, 2.2, 2.3
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportButton, ExportButtonSimple } from './ExportButton';
import { JournalEntry, EmotionLog } from '@/types';
import * as exportService from '@/services/exportService';

// Mock the export service
vi.mock('@/services/exportService', () => ({
  exportService: {
    exportJournalToCSV: vi.fn(),
    validateEntriesForExport: vi.fn()
  }
}));

// Mock DOM APIs
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

beforeEach(() => {
  // Mock URL methods
  global.URL = {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL
  } as any;
  
  // Mock document methods
  const mockLink = {
    href: '',
    download: '',
    style: { display: '' },
    click: mockClick
  };
  
  global.document = {
    createElement: vi.fn(() => mockLink),
    body: {
      appendChild: mockAppendChild,
      removeChild: mockRemoveChild
    }
  } as any;
  
  // Mock window
  global.window = {} as any;
  
  // Reset mocks
  mockCreateObjectURL.mockReturnValue('blob:mock-url');
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// Test data
const createTestEntry = (overrides: Partial<JournalEntry> = {}): JournalEntry => ({
  id: 'test-entry-1',
  content: 'This is a test journal entry.',
  date: new Date('2024-01-15'),
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:30:00Z'),
  linkedEmotions: ['emotion-1'],
  wordCount: 7,
  tags: ['test'],
  dayOfYear: 15,
  ...overrides
});

const createTestEmotion = (overrides: Partial<EmotionLog> = {}): EmotionLog => ({
  id: 'emotion-1',
  text: 'feeling happy',
  action: 'expressed',
  timestamp: new Date('2024-01-15T09:00:00Z').getTime(),
  textColor: 'white',
  ...overrides
});

describe('ExportButton', () => {
  const mockValidateEntriesForExport = exportService.exportService.validateEntriesForExport as any;
  const mockExportJournalToCSV = exportService.exportService.exportJournalToCSV as any;

  beforeEach(() => {
    mockValidateEntriesForExport.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });
    
    mockExportJournalToCSV.mockReturnValue({
      success: true,
      filename: 'test_export.csv'
    });
  });

  describe('rendering', () => {
    it('should render export button with default text', () => {
      const entries = [createTestEntry()];
      render(<ExportButton entries={entries} />);
      
      expect(screen.getByRole('button', { name: /export to csv/i })).toBeInTheDocument();
    });

    it('should render custom button text', () => {
      const entries = [createTestEntry()];
      render(<ExportButton entries={entries} buttonText="Download Journal" />);
      
      expect(screen.getByRole('button', { name: /download journal/i })).toBeInTheDocument();
    });

    it('should show export summary', () => {
      const entries = [createTestEntry(), createTestEntry({ id: 'entry-2' })];
      render(<ExportButton entries={entries} />);
      
      expect(screen.getByText(/2 entries with 2 linked emotions/)).toBeInTheDocument();
    });

    it('should show no entries message when empty', () => {
      render(<ExportButton entries={[]} />);
      
      expect(screen.getByText('No entries to export')).toBeInTheDocument();
    });

    it('should disable button when no entries', () => {
      render(<ExportButton entries={[]} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should disable button when disabled prop is true', () => {
      const entries = [createTestEntry()];
      render(<ExportButton entries={entries} disabled={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('export functionality', () => {
    it('should call export service when button is clicked', async () => {
      const entries = [createTestEntry()];
      const emotions = [createTestEmotion()];
      
      render(<ExportButton entries={entries} allEmotions={emotions} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockValidateEntriesForExport).toHaveBeenCalledWith(entries);
        expect(mockExportJournalToCSV).toHaveBeenCalledWith(entries, emotions, {});
      });
    });

    it('should show loading state during export', async () => {
      const entries = [createTestEntry()];
      
      // Make export service return a promise that we can control
      let resolveExport: (value: any) => void;
      const exportPromise = new Promise(resolve => {
        resolveExport = resolve;
      });
      
      mockExportJournalToCSV.mockReturnValue(exportPromise);
      
      render(<ExportButton entries={entries} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Should show loading state
      expect(screen.getByText('Exporting...')).toBeInTheDocument();
      expect(button).toBeDisabled();
      
      // Resolve the export
      resolveExport!({ success: true, filename: 'test.csv' });
      
      await waitFor(() => {
        expect(screen.queryByText('Exporting...')).not.toBeInTheDocument();
      });
    });

    it('should call onExportSuccess callback on successful export', async () => {
      const entries = [createTestEntry()];
      const onExportSuccess = vi.fn();
      
      render(<ExportButton entries={entries} onExportSuccess={onExportSuccess} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(onExportSuccess).toHaveBeenCalledWith('test_export.csv');
      });
    });

    it('should handle export errors', async () => {
      const entries = [createTestEntry()];
      const onExportError = vi.fn();
      
      mockExportJournalToCSV.mockReturnValue({
        success: false,
        error: 'Export failed'
      });
      
      render(<ExportButton entries={entries} onExportError={onExportError} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/export failed/i)).toBeInTheDocument();
        expect(onExportError).toHaveBeenCalledWith('Export failed');
      });
    });

    it('should handle validation errors', async () => {
      const entries = [createTestEntry()];
      
      mockValidateEntriesForExport.mockReturnValue({
        isValid: false,
        errors: ['Invalid entry data'],
        warnings: []
      });
      
      render(<ExportButton entries={entries} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/export validation failed/i)).toBeInTheDocument();
      });
    });

    it('should dismiss error messages', async () => {
      const entries = [createTestEntry()];
      
      mockExportJournalToCSV.mockReturnValue({
        success: false,
        error: 'Export failed'
      });
      
      render(<ExportButton entries={entries} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/export failed/i)).toBeInTheDocument();
      });
      
      const dismissButton = screen.getByRole('button', { name: /dismiss error/i });
      fireEvent.click(dismissButton);
      
      expect(screen.queryByText(/export failed/i)).not.toBeInTheDocument();
    });

    it('should pass custom options to export service', async () => {
      const entries = [createTestEntry()];
      const options = { includeEmotions: false, filename: 'custom_export' };
      
      render(<ExportButton entries={entries} options={options} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockExportJournalToCSV).toHaveBeenCalledWith(entries, [], options);
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      const entries = [createTestEntry()];
      render(<ExportButton entries={entries} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button.getAttribute('aria-label')).toContain('1 entry');
    });

    it('should have live regions for status updates', () => {
      const entries = [createTestEntry()];
      render(<ExportButton entries={entries} />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should announce errors with assertive live region', async () => {
      const entries = [createTestEntry()];
      
      mockExportJournalToCSV.mockReturnValue({
        success: false,
        error: 'Export failed'
      });
      
      render(<ExportButton entries={entries} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveAttribute('aria-live', 'assertive');
      });
    });
  });
});

describe('ExportButtonSimple', () => {
  const mockExportJournalToCSV = exportService.exportService.exportJournalToCSV as any;

  beforeEach(() => {
    mockExportJournalToCSV.mockReturnValue({
      success: true,
      filename: 'test_export.csv'
    });
    
    // Mock alert
    global.alert = vi.fn();
  });

  it('should render simple export button', () => {
    const entries = [createTestEntry()];
    render(<ExportButtonSimple entries={entries} />);
    
    expect(screen.getByRole('button', { name: /export.*csv/i })).toBeInTheDocument();
  });

  it('should call export service when clicked', () => {
    const entries = [createTestEntry()];
    const emotions = [createTestEmotion()];
    
    render(<ExportButtonSimple entries={entries} allEmotions={emotions} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockExportJournalToCSV).toHaveBeenCalledWith(entries, emotions, {});
  });

  it('should show alert for empty entries', () => {
    render(<ExportButtonSimple entries={[]} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(global.alert).toHaveBeenCalledWith('No journal entries to export');
  });

  it('should show alert for export errors', () => {
    const entries = [createTestEntry()];
    
    mockExportJournalToCSV.mockReturnValue({
      success: false,
      error: 'Export failed'
    });
    
    render(<ExportButtonSimple entries={entries} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(global.alert).toHaveBeenCalledWith('Export failed: Export failed');
  });

  it('should disable button when no entries', () => {
    render(<ExportButtonSimple entries={[]} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});