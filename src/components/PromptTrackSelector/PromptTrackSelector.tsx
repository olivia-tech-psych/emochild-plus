/**
 * PromptTrackSelector Component
 * Allows users to choose between Inner Child and Inner Teenager prompt tracks
 * Requirements: 3.1, 3.4
 */

import React from 'react';
import { PromptTrack } from '@/types';
import styles from './PromptTrackSelector.module.css';

interface PromptTrackSelectorProps {
  /** Available prompt tracks */
  tracks: PromptTrack[];
  /** Currently selected track ID */
  selectedTrack?: string;
  /** Callback when a track is selected */
  onSelectTrack: (trackId: string) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

export const PromptTrackSelector: React.FC<PromptTrackSelectorProps> = ({
  tracks,
  selectedTrack,
  onSelectTrack,
  disabled = false
}) => {
  const handleTrackSelect = (trackId: string) => {
    if (!disabled && trackId !== selectedTrack) {
      onSelectTrack(trackId);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, trackId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTrackSelect(trackId);
    }
  };

  return (
    <div className={styles.container} role="group" aria-labelledby="track-selector-heading">
      <h2 id="track-selector-heading" className={styles.heading}>
        Choose Your Reflection Journey
      </h2>
      <p className={styles.subtitle}>
        Select a track to explore gentle prompts for self-reflection and emotional growth.
      </p>
      
      <div className={styles.trackGrid}>
        {tracks.map((track) => {
          const isSelected = selectedTrack === track.id;
          
          return (
            <div
              key={track.id}
              className={`${styles.trackCard} ${isSelected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
              onClick={() => handleTrackSelect(track.id)}
              onKeyDown={(e) => handleKeyDown(e, track.id)}
              tabIndex={disabled ? -1 : 0}
              role="button"
              aria-pressed={isSelected}
              aria-describedby={`${track.id}-description`}
            >
              <div className={styles.trackHeader}>
                <h3 className={styles.trackName}>{track.name}</h3>
                <div className={styles.trackProgress}>
                  <span className={styles.progressText}>
                    Day {track.currentDay} of {track.totalPrompts}
                  </span>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${(track.currentDay / track.totalPrompts) * 100}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
              
              <p id={`${track.id}-description`} className={styles.trackDescription}>
                {track.description}
              </p>
              
              <div className={styles.trackFooter}>
                <span className={styles.optionalLabel}>Optional • No pressure</span>
                {isSelected && (
                  <span className={styles.selectedIndicator} aria-hidden="true">
                    ✓ Selected
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {tracks.length === 0 && (
        <div className={styles.emptyState}>
          <p>No prompt tracks available. Please try refreshing the page.</p>
        </div>
      )}
    </div>
  );
};

export default PromptTrackSelector;