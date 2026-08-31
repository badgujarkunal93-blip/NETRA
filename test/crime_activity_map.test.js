import { describe, it, expect, vi } from 'vitest';
import { getActivityLevel } from '../src/utils/activityLevels.js';
import { alertsService } from '../src/services/alertsService.js';
import { localDataService } from '../src/services/localDataService.js';
import { supabase } from '../src/services/supabaseClient.js';

vi.mock('../src/services/supabaseClient.js', () => {
  return {
    isSupabaseConfigured: true,
    supabase: {
      from: vi.fn()
    }
  };
});

describe('Crime Activity Map Intelligence & Synchronization', () => {
  it('correctly calculates activity levels according to severity thresholds', () => {
    expect(getActivityLevel(95, 100)).toBe('VERY HIGH');
    expect(getActivityLevel(80, 100)).toBe('VERY HIGH');
    expect(getActivityLevel(60, 100)).toBe('HIGH');
    expect(getActivityLevel(30, 100)).toBe('MEDIUM');
    expect(getActivityLevel(10, 100)).toBe('LOW');
    expect(getActivityLevel(0, 100)).toBe('LOW');
  });

  it('aggregates real crime activity zones with valid Mumbai coordinates and station jurisdictions', async () => {
    const mockCases = [
      { id: 'C-BKC-1', status: 'Under Investigation', latitude: 19.0657, longitude: 72.8687, police_station: 'Bandra Police Station', crime_major_head: 'FINANCIAL FRAUD' },
      { id: 'C-BKC-2', status: 'Open', latitude: 19.0650, longitude: 72.8680, police_station: 'Bandra Police Station', crime_major_head: 'FINANCIAL FRAUD' },
      { id: 'C-BKC-3', status: 'Open', latitude: 19.0660, longitude: 72.8690, police_station: 'Bandra Police Station', crime_major_head: 'FINANCIAL FRAUD' },
      { id: 'C-CLB-1', status: 'Under Investigation', latitude: 18.9067, longitude: 72.8147, police_station: 'Colaba Police Station', crime_major_head: 'PROPERTY CRIME' },
      { id: 'C-MLD-1', status: 'Open', latitude: 19.1860, longitude: 72.8485, police_station: 'Malad Police Station', crime_major_head: 'CYBERCRIME' }
    ];

    supabase.from.mockImplementation((table) => {
      if (table === 'cases') {
        return { select: vi.fn().mockResolvedValue({ data: mockCases, error: null }) };
      }
      if (table === 'persons') return { select: vi.fn().mockResolvedValue({ count: 10, error: null }) };
      if (table === 'alerts') return { select: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) };
      if (table === 'findings') return { select: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: [], error: null }) }) }) };

      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    });

    const metrics = await alertsService.getDashboardMetrics();

    expect(metrics.hotspots).toBeDefined();
    expect(metrics.hotspots.length).toBe(3);

    // Verify first zone (Bandra)
    const bandra = metrics.hotspots[0];
    expect(bandra.name).toBe('Bandra');
    expect(bandra.stationJurisdiction).toBe('Bandra Police Station');
    expect(bandra.reportedCrimes).toBe(3);
    expect(bandra.latitude).toBeCloseTo(19.0655, 3);
    expect(bandra.longitude).toBeCloseTo(72.8685, 3);
    expect(bandra.region).toBe('Mumbai Metro Region');
    expect(bandra.activityLevel).toBeDefined();
    expect(bandra.id).toBe('zone-bandra');

    // Verify Colaba
    const colaba = metrics.hotspots.find(h => h.name === 'Colaba');
    expect(colaba).toBeDefined();
    expect(colaba.stationJurisdiction).toBe('Colaba Police Station');
    expect(colaba.reportedCrimes).toBe(1);
    expect(colaba.latitude).toBeCloseTo(18.9067, 3);
    expect(colaba.longitude).toBeCloseTo(72.8147, 3);

    // Verify Malad
    const malad = metrics.hotspots.find(h => h.name === 'Malad');
    expect(malad).toBeDefined();
    expect(malad.stationJurisdiction).toBe('Malad Police Station');
    expect(malad.reportedCrimes).toBe(1);
    expect(malad.latitude).toBeCloseTo(19.1860, 3);
    expect(malad.longitude).toBeCloseTo(72.8485, 3);
  });

  it('localDataService generates complete synchronized hotspot structures', async () => {
    const metrics = await localDataService.getDashboardMetrics();
    expect(metrics.hotspots).toBeDefined();
    expect(metrics.hotspots.length).toBeGreaterThan(0);

    metrics.hotspots.forEach(h => {
      expect(h.id).toMatch(/^zone-/);
      expect(typeof h.name).toBe('string');
      expect(typeof h.latitude).toBe('number');
      expect(typeof h.longitude).toBe('number');
      expect(typeof h.reportedCrimes).toBe('number');
      expect(['VERY HIGH', 'HIGH', 'MEDIUM', 'LOW']).toContain(h.activityLevel);
      expect(h.stationJurisdiction).toContain('Police Station');
      expect(h.region).toBe('Mumbai Metro Region');
    });
  });
});
