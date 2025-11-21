'use client';

import Link from 'next/link';
import { useEmotion } from '@/context/EmotionContext';
import { LogHistory } from '@/components/LogHistory';
import styles from './page.module.css';

export default function HistoryPage() {
  const { logs } = useEmotion();

  return (
    <div className={styles.container}>
      <nav className={styles.navigation}>
        <Link href="/" className={styles.backLink}>
          ← Back to Creature
        </Link>
      </nav>
      
      <h1 className={styles.title}>Your Emotional Journey</h1>
      
      <div className={styles.historyContainer}>
        <LogHistory logs={logs} />
      </div>
    </div>
  );
}
