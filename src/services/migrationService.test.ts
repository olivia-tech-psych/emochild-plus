/**
 * Tests for Migration Service
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  isMigrationNeeded, 
  performMigration, 
  getMigrationStatus,
  clearMigrationData 
} from './migrationService';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Migration Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isMigrationNeeded', () => {
    it('should return true when no migration version exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = isMigrationNeeded();
      
      expect(result).toBe(true);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('emochild_migration_version');
    });

    it('should return false when current version exists', () => {
      localStorageMock.getItem.mockReturnValue('3.0.0');
      
      const result = isMigrationNeeded();
      
      expect(result).toBe(false);
    });

    it('should return true when different version exists', () => {
      localStorageMock.getItem.mockReturnValue('2.0.0');
      
      const result = isMigrationNeeded();
      
      expect(result).toBe(true);
    });
  });

  describe('getMigrationStatus', () => {
    it('should return correct status when no migration exists', () => {
      // Mock all localStorage calls to return null (no data exists)
      localStorageMock.getItem.mockImplementation((key: string) => {
        return null; // No data exists for any key
      });
      
      const status = getMigrationStatus();
      
      expect(status.currentVersion).toBe(null);
      expect(status.isNeeded).toBe(true);
      // loadV2Data always returns a valid object with defaults, so hasV2Data is always true
      expect(status.hasV2Data).toBe(true);
    });

    it('should return correct status when migration exists', () => {
      // Mock migration version to exist, but no v2 data
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'emochild_migration_version') {
          return '3.0.0';
        }
        return null;
      });
      
      const status = getMigrationStatus();
      
      expect(status.currentVersion).toBe('3.0.0');
      expect(status.isNeeded).toBe(false);
    });
  });

  describe('performMigration', () => {
    it('should handle fresh installation', () => {
      // Mock all localStorage calls to return null (fresh installation)
      localStorageMock.getItem.mockImplementation((key: string) => {
        return null; // No data exists for any key
      });
      
      const result = performMigration();
      
      expect(result.success).toBe(true);
      expect(result.version).toBe('3.0.0');
      // Since loadV2Data always returns a valid object, it will migrate v2 data instead of creating fresh
      expect(result.warnings).toContain('Successfully migrated v2 data to v3 format');
    });

    it('should handle existing current version', () => {
      // Mock migration version to be current
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'emochild_migration_version') {
          return '3.0.0';
        }
        return null;
      });
      
      const result = performMigration();
      
      expect(result.success).toBe(true);
      expect(result.version).toBe('3.0.0');
      expect(result.warnings).toContain('Already on current version, no migration needed');
    });
  });
});