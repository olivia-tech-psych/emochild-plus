/**
 * EmotionChart Component Tests
 * Tests for data visualization with pastel color schemes
 * Requirements: 4.1, 4.3
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmotionChart } from './EmotionChart';
import { ChartData } from '@/types';

describe('EmotionChart', () => {
  const mockChartData: ChartData = {
    labels: ['Happy', 'Sad', 'Anxious'],
    datasets: [{
      label: 'Emotions',
      data: [10, 5, 8],
      backgroundColor: ['#C9E4DE', '#fcded3', '#DBCDF0'],
      borderColor: ['#C9E4DE', '#fcded3', '#DBCDF0']
    }]
  };

  const defaultProps = {
    data: mockChartData,
    chartType: 'pie' as const,
    colorScheme: 'pastel' as const,
    accessibleDescription: 'Chart showing emotion distribution'
  };

  describe('Rendering', () => {
    it('renders chart with data', () => {
      render(<EmotionChart {...defaultProps} />);
      
      // Should render accessible data table
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByText('Happy')).toHaveLength(2); // Table and legend
      expect(screen.getAllByText('Sad')).toHaveLength(2);
      expect(screen.getAllByText('Anxious')).toHaveLength(2);
    });

    it('renders title when provided', () => {
      render(<EmotionChart {...defaultProps} title="My Emotions" />);
      
      expect(screen.getByText('My Emotions')).toBeInTheDocument();
    });

    it('renders empty state when no data', () => {
      const emptyData: ChartData = {
        labels: [],
        datasets: [{ label: 'Emotions', data: [], backgroundColor: [], borderColor: [] }]
      };
      
      render(<EmotionChart {...defaultProps} data={emptyData} />);
      
      expect(screen.getByText('No data to visualize yet')).toBeInTheDocument();
      expect(screen.getByText(/keep logging your emotions/i)).toBeInTheDocument();
    });
  });

  describe('Chart Types', () => {
    it('renders pie chart correctly', () => {
      render(<EmotionChart {...defaultProps} chartType="pie" />);
      
      // Should show percentages in legend for pie chart (using getAllByText since they appear in table too)
      expect(screen.getAllByText(/43%/)).toHaveLength(2); // Table and legend
      expect(screen.getAllByText(/22%/)).toHaveLength(2);
      expect(screen.getAllByText(/35%/)).toHaveLength(2);
    });

    it('renders bar chart correctly', () => {
      render(<EmotionChart {...defaultProps} chartType="bar" />);
      
      // Should render accessible data table
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('renders line chart correctly', () => {
      render(<EmotionChart {...defaultProps} chartType="line" />);
      
      // Should render accessible data table
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides accessible data table', () => {
      render(<EmotionChart {...defaultProps} />);
      
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Chart showing emotion distribution');
      
      // Should have proper table structure
      expect(screen.getByRole('columnheader', { name: 'Category' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Value' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Percentage' })).toBeInTheDocument();
    });

    it('hides visual chart from screen readers', () => {
      render(<EmotionChart {...defaultProps} />);
      
      const chartVisual = document.querySelector('[aria-hidden="true"]');
      expect(chartVisual).toBeInTheDocument();
    });

    it('provides proper ARIA labels for chart elements', () => {
      render(<EmotionChart {...defaultProps} chartType="pie" />);
      
      // Should have accessible table with proper labels
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Chart showing emotion distribution');
    });
  });

  describe('Legend', () => {
    it('displays legend with colors and values', () => {
      render(<EmotionChart {...defaultProps} />);
      
      // Should show all emotions in legend (using getAllByText since they appear in table too)
      expect(screen.getAllByText('Happy')).toHaveLength(2);
      expect(screen.getAllByText('Sad')).toHaveLength(2);
      expect(screen.getAllByText('Anxious')).toHaveLength(2);
      
      // Should show values (using getAllByText since they appear in table too)
      expect(screen.getAllByText('10')).toHaveLength(2);
      expect(screen.getAllByText('5')).toHaveLength(2);
      expect(screen.getAllByText('8')).toHaveLength(2);
    });

    it('shows percentages for pie charts', () => {
      render(<EmotionChart {...defaultProps} chartType="pie" />);
      
      // Should show percentages in parentheses
      expect(screen.getByText(/\(43%\)/)).toBeInTheDocument();
      expect(screen.getByText(/\(22%\)/)).toBeInTheDocument();
      expect(screen.getByText(/\(35%\)/)).toBeInTheDocument();
    });

    it('does not show percentages for non-pie charts', () => {
      render(<EmotionChart {...defaultProps} chartType="bar" />);
      
      // Should not show percentages for bar charts
      expect(screen.queryByText(/\(%\)/)).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <EmotionChart {...defaultProps} className="custom-chart" />
      );
      
      expect(container.firstChild).toHaveClass('custom-chart');
    });

    it('applies custom height', () => {
      const { container } = render(
        <EmotionChart {...defaultProps} height={300} />
      );
      
      const chartElement = container.querySelector('[style*="height"]');
      expect(chartElement).toHaveStyle({ height: '300px' });
    });
  });

  describe('Data Validation', () => {
    it('handles single data point', () => {
      const singleData: ChartData = {
        labels: ['Happy'],
        datasets: [{
          label: 'Emotions',
          data: [1],
          backgroundColor: ['#C9E4DE'],
          borderColor: ['#C9E4DE']
        }]
      };
      
      render(<EmotionChart {...defaultProps} data={singleData} />);
      
      expect(screen.getAllByText('Happy')).toHaveLength(2); // Table and legend
      expect(screen.getAllByText('1')).toHaveLength(2); // Table and legend
    });

    it('handles zero values gracefully', () => {
      const zeroData: ChartData = {
        labels: ['Happy', 'Sad'],
        datasets: [{
          label: 'Emotions',
          data: [0, 5],
          backgroundColor: ['#C9E4DE', '#fcded3'],
          borderColor: ['#C9E4DE', '#fcded3']
        }]
      };
      
      render(<EmotionChart {...defaultProps} data={zeroData} />);
      
      expect(screen.getAllByText('Happy')).toHaveLength(2); // Table and legend
      expect(screen.getAllByText('0')).toHaveLength(2); // Table and legend
      expect(screen.getAllByText('5')).toHaveLength(2); // Table and legend
    });
  });
});