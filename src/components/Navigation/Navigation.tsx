/**
 * Navigation component
 * Provides navigation links between main and history pages
 * Requirements: 10.3
 */

import Link from 'next/link';
import styles from './Navigation.module.css';

export interface NavigationProps {
  /**
   * Type of navigation link to display
   * - 'toHistory': Shows "View History" link (for main page)
   * - 'toMain': Shows "Back to Creature" link (for history page)
   */
  type: 'toHistory' | 'toMain';
}

/**
 * Navigation component
 * 
 * Requirements:
 * - 10.3: Smooth transitions without page reloads (Next.js Link handles this)
 */
export function Navigation({ type }: NavigationProps) {
  if (type === 'toHistory') {
    return (
      <nav className={styles.navigation}>
        <Link href="/history" className={styles.historyLink}>
          View History
        </Link>
      </nav>
    );
  }

  return (
    <nav className={styles.navigation}>
      <Link href="/" className={styles.backLink}>
        ← Back to Creature
      </Link>
    </nav>
  );
}
