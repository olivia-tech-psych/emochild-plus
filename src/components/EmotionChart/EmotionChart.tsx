/**
 * EmotionChart Component
 * Displays emotional data in various chart formats with pastel color schemes
 * Requirements: 4.1, 4.3
 */

'use client';

import React from 'react';
import { ChartData } from '@/types';
import styles from './EmotionChart.module.css';

/**
 * Props for the EmotionChart component
 */
export interface EmotionChartProps {
  /** Chart data to display */
  data: ChartData;
  
  /** Type of chart to render */
  chartType: 'pie' | 'line' | 'bar';
  
  /** Color scheme (always pastel for gentle design) */
  colorScheme: 'pastel';
  
  /** Accessible description for screen readers */
  accessibleDescription: string;
  
  /** Optional title for the chart */
  title?: string;
  
  /** Optional className for styling */
  className?: string;
  
  /** Height of the chart in pixels */
  height?: number;
}

/**
 * EmotionChart Component
 * Requirements: 4.1, 4.3 - Data visualizations with pastel colors and non-judgmental design
 */
export function EmotionChart({
  data,
  chartType,
  colorScheme,
  accessibleDescription,
  title,
  className,
  height = 200
}: EmotionChartProps) {
  // If no data, show encouraging empty state
  if (!data.datasets.length || data.datasets[0].data.length === 0) {
    return (
      <div className={`${styles.chart} ${styles.emptyChart} ${className || ''}`}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <p>No data to visualize yet</p>
          <p className={styles.emptyEncouragement}>
            Keep logging your emotions to see beautiful patterns emerge
          </p>
        </div>
      </div>
    );
  }

  const dataset = data.datasets[0];
  const maxValue = Math.max(...dataset.data);
  const totalValue = dataset.data.reduce((sum, value) => sum + value, 0);

  return (
    <div className={`${styles.chart} ${className || ''}`} style={{ height }}>
      {title && <h4 className={styles.chartTitle}>{title}</h4>}
      
      {/* Screen reader accessible data table */}
      <table className={styles.accessibleTable} aria-label={accessibleDescription}>
        <caption className={styles.srOnly}>{accessibleDescription}</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Value</th>
            {chartType === 'pie' && <th scope="col">Percentage</th>}
          </tr>
        </thead>
        <tbody>
          {data.labels.map((label, index) => (
            <tr key={label}>
              <td>{label}</td>
              <td>{dataset.data[index]}</td>
              {chartType === 'pie' && (
                <td>{Math.round((dataset.data[index] / totalValue) * 100)}%</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Visual chart representation */}
      <div className={styles.chartVisual} aria-hidden="true">
        {chartType === 'pie' && (
          <PieChart 
            data={data} 
            dataset={dataset} 
            totalValue={totalValue}
          />
        )}
        
        {chartType === 'bar' && (
          <BarChart 
            data={data} 
            dataset={dataset} 
            maxValue={maxValue}
          />
        )}
        
        {chartType === 'line' && (
          <LineChart 
            data={data} 
            dataset={dataset} 
            maxValue={maxValue}
          />
        )}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {data.labels.map((label, index) => (
          <div key={label} className={styles.legendItem}>
            <div 
              className={styles.legendColor}
              style={{ backgroundColor: dataset.backgroundColor[index] }}
            />
            <span className={styles.legendLabel}>{label}</span>
            <span className={styles.legendValue}>
              {dataset.data[index]}
              {chartType === 'pie' && (
                <span className={styles.legendPercentage}>
                  ({Math.round((dataset.data[index] / totalValue) * 100)}%)
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Pie Chart Component
 * Requirements: 4.3 - Soft pie charts with pastel color segments
 */
function PieChart({ data, dataset, totalValue }: {
  data: ChartData;
  dataset: ChartData['datasets'][0];
  totalValue: number;
}) {
  let cumulativePercentage = 0;
  const radius = 80;
  const centerX = 100;
  const centerY = 100;

  return (
    <svg 
      className={styles.pieChart} 
      viewBox="0 0 200 200"
      role="img"
      aria-label="Pie chart visualization"
    >
      {dataset.data.map((value, index) => {
        const percentage = value / totalValue;
        const startAngle = cumulativePercentage * 2 * Math.PI;
        const endAngle = (cumulativePercentage + percentage) * 2 * Math.PI;
        
        const x1 = centerX + radius * Math.cos(startAngle);
        const y1 = centerY + radius * Math.sin(startAngle);
        const x2 = centerX + radius * Math.cos(endAngle);
        const y2 = centerY + radius * Math.sin(endAngle);
        
        const largeArcFlag = percentage > 0.5 ? 1 : 0;
        
        const pathData = [
          `M ${centerX} ${centerY}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z'
        ].join(' ');
        
        cumulativePercentage += percentage;
        
        return (
          <path
            key={index}
            d={pathData}
            fill={dataset.backgroundColor[index]}
            stroke="white"
            strokeWidth="2"
            className={styles.pieSlice}
          />
        );
      })}
    </svg>
  );
}

/**
 * Bar Chart Component
 * Requirements: 4.3 - Gentle bar charts with rounded corners
 */
function BarChart({ data, dataset, maxValue }: {
  data: ChartData;
  dataset: ChartData['datasets'][0];
  maxValue: number;
}) {
  const barWidth = 80 / data.labels.length;
  const chartHeight = 120;
  
  return (
    <svg 
      className={styles.barChart} 
      viewBox="0 0 100 140"
      role="img"
      aria-label="Bar chart visualization"
    >
      {/* Y-axis grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
        <line
          key={ratio}
          x1="10"
          y1={10 + (1 - ratio) * chartHeight}
          x2="90"
          y2={10 + (1 - ratio) * chartHeight}
          stroke="#f0f0f0"
          strokeWidth="0.5"
        />
      ))}
      
      {/* Bars */}
      {dataset.data.map((value, index) => {
        const barHeight = (value / maxValue) * chartHeight;
        const x = 10 + (index * barWidth) + (barWidth * 0.1);
        const y = 10 + chartHeight - barHeight;
        const width = barWidth * 0.8;
        
        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={width}
            height={barHeight}
            fill={dataset.backgroundColor[index]}
            rx="2"
            ry="2"
            className={styles.barRect}
          />
        );
      })}
      
      {/* X-axis labels */}
      {data.labels.map((label, index) => (
        <text
          key={index}
          x={10 + (index * barWidth) + (barWidth * 0.5)}
          y={135}
          textAnchor="middle"
          className={styles.axisLabel}
          fontSize="3"
        >
          {label.length > 8 ? `${label.substring(0, 8)}...` : label}
        </text>
      ))}
    </svg>
  );
}

/**
 * Line Chart Component
 * Requirements: 4.3 - Smooth line charts with soft gradients
 */
function LineChart({ data, dataset, maxValue }: {
  data: ChartData;
  dataset: ChartData['datasets'][0];
  maxValue: number;
}) {
  const chartWidth = 80;
  const chartHeight = 120;
  const pointSpacing = chartWidth / (data.labels.length - 1);
  
  // Generate path for line
  const pathData = dataset.data.map((value, index) => {
    const x = 10 + (index * pointSpacing);
    const y = 10 + chartHeight - (value / maxValue) * chartHeight;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  return (
    <svg 
      className={styles.lineChart} 
      viewBox="0 0 100 140"
      role="img"
      aria-label="Line chart visualization"
    >
      {/* Y-axis grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
        <line
          key={ratio}
          x1="10"
          y1={10 + (1 - ratio) * chartHeight}
          x2="90"
          y2={10 + (1 - ratio) * chartHeight}
          stroke="#f0f0f0"
          strokeWidth="0.5"
        />
      ))}
      
      {/* Line */}
      <path
        d={pathData}
        fill="none"
        stroke={dataset.borderColor[0]}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.linePath}
      />
      
      {/* Data points */}
      {dataset.data.map((value, index) => {
        const x = 10 + (index * pointSpacing);
        const y = 10 + chartHeight - (value / maxValue) * chartHeight;
        
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="2"
            fill={dataset.backgroundColor[0]}
            stroke="white"
            strokeWidth="1"
            className={styles.dataPoint}
          />
        );
      })}
      
      {/* X-axis labels */}
      {data.labels.map((label, index) => (
        <text
          key={index}
          x={10 + (index * pointSpacing)}
          y={135}
          textAnchor="middle"
          className={styles.axisLabel}
          fontSize="3"
        >
          {label.length > 8 ? `${label.substring(0, 8)}...` : label}
        </text>
      ))}
    </svg>
  );
}

export default EmotionChart;