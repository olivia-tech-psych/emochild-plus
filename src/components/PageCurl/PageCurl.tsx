/**
 * PageCurl Component
 * Animated button for journal page navigation with curl effects
 * Requirements: 1.1, 1.2, 1.4
 */

import React, { useState, useCallback, useRef } from 'react';
import styles from './PageCurl.module.css';

export interface PageCurlProps {
  /** Direction of page curl: 'next' or 'previous' */
  direction: 'next' | 'previous';
  /** Callback when page curl is triggered */
  onCurl: () => void;
  /** Whether the button is disabled */
  disabled: boolean;
  /** Animation duration in milliseconds */
  animationDuration: number;
}

/**
 * PageCurl component provides animated navigation buttons for journal pages
 * 
 * Features:
 * - Realistic page curl animation effects
 * - Direction-specific animations (left/right)
 * - Ripple effect on click for tactile feedback
 * - Accessibility support with proper ARIA labels
 * - Reduced motion support for accessibility
 * - Touch-friendly sizing for mobile devices
 * - Visual feedback with hover and active states
 * 
 * Requirements: 1.1, 1.2, 1.4
 */
export function PageCurl({ 
  direction, 
  onCurl, 
  disabled, 
  animationDuration 
}: PageCurlProps) {
  const [isCurling, setIsCurling] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Handle curl animation and callback
  const handleCurl = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // Create ripple effect
    const button = buttonRef.current;
    if (button) {
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;
      
      const ripple = document.createElement('span');
      ripple.className = styles.ripple;
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      
      button.appendChild(ripple);
      
      // Remove ripple after animation
      setTimeout(() => {
        if (button.contains(ripple)) {
          button.removeChild(ripple);
        }
      }, 600);
    }

    // Trigger curl animation
    setIsCurling(true);
    
    // Call the onCurl callback after a short delay to sync with animation
    setTimeout(() => {
      onCurl();
      setIsCurling(false);
    }, animationDuration * 0.3); // Trigger callback at 30% of animation
  }, [disabled, onCurl, animationDuration]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCurl(event as any);
    }
  }, [handleCurl]);

  // Determine button classes
  const buttonClasses = [
    styles.pageCurlButton,
    styles[direction],
    isCurling ? styles.curling : ''
  ].filter(Boolean).join(' ');

  // Create accessible label
  const ariaLabel = direction === 'next' 
    ? 'Turn to next journal page' 
    : 'Turn to previous journal page';

  // Direction arrow
  const arrow = direction === 'next' ? '→' : '←';

  return (
    <button
      ref={buttonRef}
      className={buttonClasses}
      onClick={handleCurl}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={ariaLabel}
      title={ariaLabel}
      style={{
        '--animation-duration': `${animationDuration}ms`
      } as React.CSSProperties}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      <span aria-hidden="true">{arrow}</span>
    </button>
  );
}