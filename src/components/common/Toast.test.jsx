/**
 * Tests pour le composant Toast
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast from './Toast';

describe('Toast Component', () => {
  it('affiche le message correctement', () => {
    render(<Toast message="Test message" type="info" onClose={() => {}} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('affiche l\'icône success', () => {
    render(<Toast message="Success!" type="success" onClose={() => {}} />);
    
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('affiche l\'icône error', () => {
    render(<Toast message="Error!" type="error" onClose={() => {}} />);
    
    expect(screen.getByText('✗')).toBeInTheDocument();
  });

  it('affiche l\'icône warning', () => {
    render(<Toast message="Warning!" type="warning" onClose={() => {}} />);
    
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('affiche l\'icône info', () => {
    render(<Toast message="Info!" type="info" onClose={() => {}} />);
    
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('applique les bonnes classes CSS selon le type', () => {
    const { container } = render(
      <Toast message="Test" type="success" onClose={() => {}} />
    );
    
    const toastElement = container.firstChild;
    expect(toastElement).toHaveClass('bg-green-500');
  });

  it('appelle onClose quand on clique sur le bouton fermer', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    
    render(<Toast message="Test" type="info" onClose={handleClose} />);
    
    const closeButton = screen.getByLabelText('Fermer');
    await user.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('appelle onClose automatiquement après la durée spécifiée', async () => {
    vi.useFakeTimers();
    const handleClose = vi.fn();
    
    render(<Toast message="Test" type="info" onClose={handleClose} duration={1000} />);
    
    expect(handleClose).not.toHaveBeenCalled();
    
    // Avancer de 1 seconde
    vi.advanceTimersByTime(1000);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
    
    vi.useRealTimers();
  });

  it('ne se ferme pas automatiquement si duration = 0', async () => {
    vi.useFakeTimers();
    const handleClose = vi.fn();
    
    render(<Toast message="Test" type="info" onClose={handleClose} duration={0} />);
    
    // Avancer de 10 secondes
    vi.advanceTimersByTime(10000);
    
    expect(handleClose).not.toHaveBeenCalled();
    
    vi.useRealTimers();
  });

  it('a le role alert pour l\'accessibilité', () => {
    const { container } = render(
      <Toast message="Test" type="info" onClose={() => {}} />
    );
    
    expect(container.firstChild).toHaveAttribute('role', 'alert');
  });
});

