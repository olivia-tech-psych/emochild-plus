/**
 * PromptTrackSelector Component Tests
 * Requirements: 3.1, 3.4
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PromptTrackSelector } from './PromptTrackSelector';
import { PromptTrack } from '@/types';

const mockTracks: PromptTrack[] = [
  {
    id: 'inner-child',
    name: 'Inner Child',
    description: 'Gentle prompts to reconnect with your playful, curious, and authentic self.',
    totalPrompts: 365,
    currentDay: 15
  },
  {
    id: 'inner-teenager',
    name: 'Inner Teenager',
    description: 'Reflective prompts to explore identity, values, boundaries, and growth.',
    totalPrompts: 365,
    currentDay: 8
  }
];

describe('PromptTrackSelector', () => {
  it('renders track selection interface with heading', () => {
    const mockOnSelect = vi.fn();
    
    render(
      <PromptTrackSelector
        tracks={mockTracks}
        onSelectTrack={mockOnSelect}
      />
    );
    
    expect(screen.getByText('Choose Your Reflection Journey')).toBeInTheDocument();
    expect(screen.getByText('Select a track to explore gentle prompts for self-reflection and emotional growth.')).toBeInTheDocument();
  });

  it('displays all provided tracks with their information', () => {
    const mockOnSelect = vi.fn();
    
    render(
      <PromptTrackSelector
        tracks={mockTracks}
        onSelectTrack={mockOnSelect}
      />
    );
    
    // Check Inner Child track
    expect(screen.getByText('Inner Child')).toBeInTheDocument();
    expect(screen.getByText('Gentle prompts to reconnect with your playful, curious, and authentic self.')).toBeInTheDocument();
    expect(screen.getByText('Day 15 of 365')).toBeInTheDocument();
    
    // Check Inner Teenager track
    expect(screen.getByText('Inner Teenager')).toBeInTheDocument();
    expect(screen.getByText('Reflective prompts to explore identity, values, boundaries, and growth.')).toBeInTheDocument();
    expect(screen.getByText('Day 8 of 365')).toBeInTheDocument();
  });

  it('shows optional labels for all tracks', () => {
    const mockOnSelect = vi.fn();
    
    render(
      <PromptTrackSelector
        tracks={mockTracks}
        onSelectTrack={mockOnSelect}
      />
    );
    
    const optionalLabels = screen.getAllByText('Optional • No pressure');
    expect(optionalLabels).toHaveLength(2);
  });

  it('calls onSelectTrack when a track is clicked', () => {
    const mockOnSelect = vi.fn();
    
    render(
      <PromptTrackSelector
        tracks={mockTracks}
        onSelectTrack={mockOnSelect}
      />
    );
    
    const innerChildCard = screen.getByText('Inner Child').closest('[role="button"]');
    fireEvent.click(innerChildCard!);
    
    expect(mockOnSelect).toHaveBeenCalledWith('inner-child');
  });

  it('handles keyboard navigation with Enter and Space keys', () => {
    const mockOnSelect = vi.fn();
    
    render(
      <PromptTrackSelector
        tracks={mockTracks}
        onSelectTrack={mockOnSelect}
      />
    );
    
    const innerTeenagerCard = screen.getByText('Inner Teenager').closest('[role="button"]');
    
    // Test Enter key
    fireEvent.keyDown(innerTeenagerCard!, { key: 'Enter' });
    expect(mockOnSelect).toHaveBeenCalledWith('inner-teenager');
    
    // Test Space key
    fireEvent.keyDown(innerTeenagerCard!, { key: ' ' });
    expect(mockOnSelect).toHaveBeenCalledTimes(2);
    expect(mockOnSelect).toHaveBeenLastCalledWith('inner-teenager');
  });

  it('shows selected state for the selected track', () => {
    const mockOnSelect = vi.fn();
    
    render(
      <PromptTrackSelector
        tracks={mockTracks}
        selectedTrack="inner-child"
        onSelectTrack={mockOnSelect}
      />
    );
    
    const selectedIndicator = screen.getByText('✓ Selected');
    expect(selectedIndicator).toBeInTheDocument();
    
    const innerChildCard = screen.getByText('Inner Child').closest('[role="button"]');
    expect(innerChildCard).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not call onSelectTrack when clicking the already selected track', () => {
    const mockOnSelect = vi.fn();
    
    render(
      <PromptTrackSelector
        tracks={mockTracks}
        selectedTrack="inner-child"
        onSelectTrack={mockOnSelect}
      />
    );
    
    const innerChildCard = screen.getByText('Inner Child').closest('[role="button"]');
    fireEvent.click(innerChildCard!);
    
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('disables interaction when disabled prop is true', () => {
    const mockOnSelect = vi.fn();
    
    render(
      <PromptTrackSelector
        tracks={mockTracks}
        onSelectTrack={mockOnSelect}
        disabled={true}
      />
    );
    
    const innerChildCard = screen.getByText('Inner Child').closest('[role="button"]');
    expect(innerChildCard).toHaveAttribute('tabIndex', '-1');
    
    fireEvent.click(innerChildCard!);
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('displays empty state when no tracks are provided', () => {
    const mockOnSelect = vi.fn();
    
    render(
      <PromptTrackSelector
        tracks={[]}
        onSelectTrack={mockOnSelect}
      />
    );
    
    expect(screen.getByText('No prompt tracks available. Please try refreshing the page.')).toBeInTheDocument();
  });

  it('displays progress bars with correct width based on current day', () => {
    const mockOnSelect = vi.fn();
    
    render(
      <PromptTrackSelector
        tracks={mockTracks}
        onSelectTrack={mockOnSelect}
      />
    );
    
    // Find progress fill elements by their class
    const progressFills = document.querySelectorAll('[class*="progressFill"]');
    
    // Inner Child: 15/365 = ~4.1%
    expect(progressFills[0]).toHaveStyle({ width: '4.10958904109589%' });
    
    // Inner Teenager: 8/365 = ~2.2%
    expect(progressFills[1]).toHaveStyle({ width: '2.191780821917808%' });
  });

  it('has proper accessibility attributes', () => {
    const mockOnSelect = vi.fn();
    
    render(
      <PromptTrackSelector
        tracks={mockTracks}
        onSelectTrack={mockOnSelect}
      />
    );
    
    // Check group role and labeling
    const container = screen.getByRole('group');
    expect(container).toHaveAttribute('aria-labelledby', 'track-selector-heading');
    
    // Check track cards have proper button roles
    const trackCards = screen.getAllByRole('button');
    expect(trackCards).toHaveLength(2);
    
    trackCards.forEach((card, index) => {
      expect(card).toHaveAttribute('aria-pressed', 'false');
      expect(card).toHaveAttribute('aria-describedby', `${mockTracks[index].id}-description`);
    });
  });
});