/**
 * DailyPrompt Component
 * Displays a single prompt with optional engagement and gentle styling
 * Requirements: 3.1, 3.4, 3.5
 */

import React, { useState, useRef } from 'react';
import { Prompt } from '@/types';
import styles from './DailyPrompt.module.css';

interface DailyPromptProps {
  /** The prompt to display */
  prompt: Prompt;
  /** Whether engagement with this prompt is optional */
  isOptional?: boolean;
  /** Callback when the prompt is completed with a response */
  onComplete?: (response: string) => void;
  /** Callback when the prompt is skipped */
  onSkip: () => void;
  /** Whether the component is in a loading state */
  isLoading?: boolean;
  /** Whether the component is disabled */
  disabled?: boolean;
}

export const DailyPrompt: React.FC<DailyPromptProps> = ({
  prompt,
  isOptional = true,
  onComplete,
  onSkip,
  isLoading = false,
  disabled = false
}) => {
  const [response, setResponse] = useState(prompt.response || '');
  const [isExpanded, setIsExpanded] = useState(prompt.isCompleted || false);
  const [wordCount, setWordCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update word count when response changes
  React.useEffect(() => {
    const words = response.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [response]);

  const handleResponseChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponse(event.target.value);
  };

  const handleComplete = () => {
    if (response.trim() && onComplete && !disabled) {
      onComplete(response.trim());
    }
  };

  const handleSkip = () => {
    if (!disabled) {
      onSkip();
    }
  };

  const handleExpand = () => {
    setIsExpanded(true);
    // Focus the textarea after expansion
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && event.ctrlKey && response.trim()) {
      event.preventDefault();
      handleComplete();
    }
  };

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <div className={`${styles.container} ${prompt.isCompleted ? styles.completed : ''}`}>
      <div className={styles.header}>
        <div className={styles.promptMeta}>
          <span className={styles.dayNumber}>Day {prompt.dayNumber}</span>
          <span className={styles.category}>{formatCategory(prompt.category)}</span>
          {isOptional && (
            <span className={styles.optionalBadge}>Optional</span>
          )}
        </div>
        
        {prompt.isCompleted && (
          <div className={styles.completedIndicator}>
            <span className={styles.completedIcon} aria-hidden="true">✓</span>
            <span className={styles.completedText}>Reflected</span>
          </div>
        )}
      </div>

      <div className={styles.promptContent}>
        <h3 className={styles.promptText}>{prompt.content}</h3>
        
        {!isExpanded && !prompt.isCompleted && (
          <div className={styles.actions}>
            <button
              className={styles.reflectButton}
              onClick={handleExpand}
              disabled={disabled || isLoading}
              aria-describedby="reflect-description"
            >
              {isLoading ? 'Loading...' : 'Reflect on this'}
            </button>
            
            <button
              className={styles.skipButton}
              onClick={handleSkip}
              disabled={disabled || isLoading}
              aria-describedby="skip-description"
            >
              Skip for now
            </button>
          </div>
        )}

        {(isExpanded || prompt.isCompleted) && (
          <div className={styles.responseSection}>
            <label htmlFor={`prompt-response-${prompt.id}`} className={styles.responseLabel}>
              Your reflection:
            </label>
            
            <textarea
              id={`prompt-response-${prompt.id}`}
              ref={textareaRef}
              className={styles.responseTextarea}
              value={response}
              onChange={handleResponseChange}
              onKeyDown={handleKeyDown}
              placeholder="Take your time... there's no right or wrong answer."
              disabled={disabled || isLoading}
              rows={4}
              aria-describedby={`word-count-${prompt.id} response-help-${prompt.id}`}
            />
            
            <div className={styles.responseFooter}>
              <span id={`word-count-${prompt.id}`} className={styles.wordCount}>
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </span>
              
              {!prompt.isCompleted && (
                <div className={styles.responseActions}>
                  <button
                    className={styles.saveButton}
                    onClick={handleComplete}
                    disabled={!response.trim() || disabled || isLoading}
                  >
                    Save reflection
                  </button>
                  
                  <button
                    className={styles.skipButton}
                    onClick={handleSkip}
                    disabled={disabled || isLoading}
                  >
                    Skip for now
                  </button>
                </div>
              )}
            </div>
            
            <p id={`response-help-${prompt.id}`} className={styles.helpText}>
              {prompt.isCompleted 
                ? `Completed on ${prompt.completedAt ? new Date(prompt.completedAt).toLocaleDateString() : 'Unknown date'}`
                : 'Press Ctrl+Enter to save, or click "Skip for now" to return later.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Hidden descriptions for screen readers */}
      <div className="sr-only">
        <p id="reflect-description">
          Opens a text area where you can write your thoughts about this prompt. This is completely optional.
        </p>
        <p id="skip-description">
          Skips this prompt without any penalty. You can always come back to it later.
        </p>
      </div>
    </div>
  );
};

export default DailyPrompt;