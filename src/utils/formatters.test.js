/**
 * Tests unitaires pour les fonctions de formatage
 */

import { describe, it, expect } from 'vitest';
import { 
  formatDuration, 
  formatBytes, 
  calculateBitrate,
  formatDate 
} from './formatters';

describe('formatDuration', () => {
  it('formate correctement 0 seconde', () => {
    expect(formatDuration(0)).toBe('00:00:00');
  });

  it('formate correctement les secondes', () => {
    expect(formatDuration(45)).toBe('00:00:45');
  });

  it('formate correctement les minutes', () => {
    expect(formatDuration(125)).toBe('00:02:05');
  });

  it('formate correctement les heures', () => {
    expect(formatDuration(3661)).toBe('01:01:01');
  });

  it('formate correctement de grandes durées', () => {
    expect(formatDuration(7384)).toBe('02:03:04');
  });

  it('gère les valeurs null/undefined', () => {
    expect(formatDuration(null)).toBe('00:00:00');
    expect(formatDuration(undefined)).toBe('00:00:00');
  });

  it('arrondit les décimales', () => {
    expect(formatDuration(3661.7)).toBe('01:01:01');
  });
});

describe('formatBytes', () => {
  it('formate correctement 0 byte', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formate correctement les bytes', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formate correctement les kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(2048)).toBe('2 KB');
  });

  it('formate correctement les megabytes', () => {
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(5242880)).toBe('5 MB');
  });

  it('formate correctement les gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1 GB');
    expect(formatBytes(2147483648)).toBe('2 GB');
  });

  it('formate correctement les terabytes', () => {
    expect(formatBytes(1099511627776)).toBe('1 TB');
  });

  it('gère les valeurs null/undefined', () => {
    expect(formatBytes(null)).toBe('0 B');
    expect(formatBytes(undefined)).toBe('0 B');
  });

  it('arrondit correctement les décimales', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
  });
});

describe('calculateBitrate', () => {
  it('calcule correctement le bitrate', () => {
    // 1GB sur 1 heure = 2.22 Mbps environ
    const result = calculateBitrate(1000000000, 3600);
    expect(result).toBe('2.22');
  });

  it('calcule correctement un petit bitrate', () => {
    const result = calculateBitrate(500000000, 3600);
    expect(result).toBe('1.11');
  });

  it('gère les valeurs nulles', () => {
    expect(calculateBitrate(0, 3600)).toBe('N/A');
    expect(calculateBitrate(1000000, 0)).toBe('N/A');
    expect(calculateBitrate(null, 3600)).toBe('N/A');
    expect(calculateBitrate(1000000, null)).toBe('N/A');
  });

  it('retourne un string avec 2 décimales', () => {
    const result = calculateBitrate(1234567890, 3600);
    expect(result).toMatch(/^\d+\.\d{2}$/);
  });
});

describe('formatDate', () => {
  it('formate correctement une Date', () => {
    const date = new Date('2025-12-30T14:30:00');
    const result = formatDate(date);
    expect(result).toContain('30');
    expect(result).toContain('déc');
    expect(result).toContain('2025');
  });

  it('formate correctement une string date', () => {
    const result = formatDate('2025-12-30T14:30:00');
    expect(result).toContain('30');
    expect(result).toContain('déc');
    expect(result).toContain('2025');
  });

  it('gère les valeurs nulles', () => {
    expect(formatDate(null)).toBe('N/A');
    expect(formatDate(undefined)).toBe('N/A');
  });

  it('inclut l\'heure', () => {
    const date = new Date('2025-12-30T14:30:00');
    const result = formatDate(date);
    expect(result).toContain('14');
    expect(result).toContain('30');
  });
});

