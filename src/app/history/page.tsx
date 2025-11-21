'use client';

import { useEmotion } from '@/context/EmotionContext';
import { LogHistory } from '@/components/LogHistory';
import { Navigation } from '@/components/Navigation';
import styles from './page.module.css';

export default function HistoryPage() {
  const { logs } = useEmotion();

  return (
    <div className={styles.container}>
      <div className={styles.navigation}>
        <Navigation type="toMain" />
      </div>
      
      <h1 className={styles.title}>Your Emotional Journey</h1>
      
      <div className={styles.historyContainer}>
        <LogHistory logs={logs} />
      </div>
    </div>
  );
}
