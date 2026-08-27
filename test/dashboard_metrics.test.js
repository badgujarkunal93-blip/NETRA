import { describe, it, expect, vi, beforeEach } from 'vitest';
import { alertsService } from '../src/services/alertsService.js';
import { supabase } from '../src/services/supabaseClient.js';

vi.mock('../src/services/supabaseClient.js', () => {
  return {
    isSupabaseConfigured: true,
    supabase: {
      from: vi.fn()
    }
  };
});

describe('alertsService.getDashboardMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const HARDCODED_FINDING_STRINGS = [
    'Transit Hub Cluster: Bandra & Dharavi networks share common logistics conduit',
    'Safe-Cracking Signature: Pneumatic shear & RF jammer signature identical in Colaba and Bandra',
    'Mule Layering Velocity: ₹4.8Cr drained across 38 accounts routed through Nariman Point shell advisory',
    '₹4.8Cr',
    'CASE-2026-0811',
    'CASE-2026-0924',
    'CASE-2026-0615',
    '3 mutual burner SIM hops & Charoti toll plaza FASTag correlations',
    'Tool mark striations & RF spectrum sweep records match within 0.05mm tolerance',
    'FIU-IND Suspicious Transaction Report #STR-8801'
  ];

  const HARDCODED_HOTSPOT_NAMES = [
    'Bandra-BKC Corridor',
    'Colaba - Fort District',
    'Dharavi - Sion Transit Hub',
    'Andheri MIDC - SEEPZ',
    'Kurla CST Road Belts',
    'Worli Sea-Face Commercial'
  ];

  const HARDCODED_HOTSPOT_COORDS = [
    { x: 48, y: 38 },
    { x: 42, y: 88 },
    { x: 55, y: 46 },
    { x: 58, y: 24 },
    { x: 62, y: 40 },
    { x: 38, y: 62 }
  ];

  it('never returns legacy hardcoded findings or hotspots when database returns empty findings and real cases', async () => {
    supabase.from.mockImplementation((table) => {
      if (table === 'cases') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'CASE-001',
                crime_no: 'CR/001/2026',
                status: 'Under Investigation',
                latitude: 19.0543,
                longitude: 72.8402,
                police_station: 'Khar Police Station',
                crime_major_head: 'CYBER FRAUD',
                crime_category: 'CRIMINAL'
              },
              {
                id: 'CASE-002',
                crime_no: 'CR/002/2026',
                status: 'Open',
                latitude: 19.0550,
                longitude: 72.8410,
                police_station: 'Khar Police Station',
                crime_major_head: 'CYBER FRAUD',
                crime_category: 'CRIMINAL'
              }
            ],
            error: null
          })
        };
      }
      if (table === 'persons') {
        return {
          select: vi.fn().mockResolvedValue({ count: 12, error: null })
        };
      }
      if (table === 'alerts') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { id: 'AL-1', severity: 'High', status: 'New', title: 'Test Alert', created_at: new Date().toISOString() }
              ],
              error: null
            })
          })
        };
      }
      if (table === 'findings') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        };
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    });

    const metrics = await alertsService.getDashboardMetrics();

    // 1. Assert findings are empty (no silent fallback to legacy hardcoded array)
    expect(metrics.aiFindings).toEqual([]);

    // 2. Assert none of the legacy hardcoded finding strings exist in output
    const serialized = JSON.stringify(metrics);
    HARDCODED_FINDING_STRINGS.forEach((str) => {
      expect(serialized).not.toContain(str);
    });

    // 3. Assert none of the legacy hardcoded hotspot names exist in output
    HARDCODED_HOTSPOT_NAMES.forEach((name) => {
      expect(serialized).not.toContain(name);
    });

    // 4. Assert hotspots are dynamically aggregated from the mock cases
    expect(metrics.hotspots.length).toBe(1);
    expect(metrics.hotspots[0].name).toBe('Khar');
    expect(metrics.hotspots[0].count).toBe(2);
    expect(metrics.hotspots[0].type).toBe('CYBER FRAUD');
    expect(metrics.hotspots[0].lat).toBeCloseTo(19.0546, 2);
    expect(metrics.hotspots[0].lng).toBeCloseTo(72.8406, 2);

    // 5. Assert coordinates are computed, not identical to the legacy hardcoded list
    HARDCODED_HOTSPOT_COORDS.forEach((coord) => {
      const match = metrics.hotspots.find((h) => h.x === coord.x && h.y === coord.y);
      expect(match).toBeUndefined();
    });
  });

  it('correctly maps real findings from database table with required Finding schema attributes', async () => {
    const mockFindings = [
      {
        id: 'FND-REAL-001',
        finding_id: 'FND-REAL-001',
        title: 'Syndicate Logistics Node Discovered',
        finding_type: 'GRAPH_COMMUNITY_CLUSTER',
        confidence: 93,
        evidence_refs: ['EVI-101', 'EVI-102'],
        description: 'Multi-point CDR convergence at Byculla warehouse.',
        case_id: 'CASE-2025_0042',
        created_at: '2026-08-27T10:00:00.000Z'
      }
    ];

    supabase.from.mockImplementation((table) => {
      if (table === 'cases') {
        return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
      }
      if (table === 'persons') {
        return { select: vi.fn().mockResolvedValue({ count: 5, error: null }) };
      }
      if (table === 'alerts') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        };
      }
      if (table === 'findings') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: mockFindings, error: null })
            })
          })
        };
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    });

    const metrics = await alertsService.getDashboardMetrics();

    expect(metrics.aiFindings.length).toBe(1);
    const finding = metrics.aiFindings[0];

    // Verify required finding schema attributes
    expect(finding.finding_id).toBe('FND-REAL-001');
    expect(finding.finding_type).toBe('GRAPH_COMMUNITY_CLUSTER');
    expect(finding.confidence).toBe(93);
    expect(finding.evidence_ids).toEqual(['EVI-101', 'EVI-102']);
    expect(finding.case_id).toBe('CASE-2025_0042');
    expect(finding.created_at).toBe('2026-08-27T10:00:00.000Z');

    // Verify UI compatibility attributes
    expect(finding.id).toBe('FND-REAL-001');
    expect(finding.title).toBe('Syndicate Logistics Node Discovered');
    expect(finding.caseId).toBe('CASE-2025_0042');
  });

  it('aggregates multiple cases into geographic hotspots with dynamically derived severity and real lat/lng', async () => {
    const mockCases = [
      // 4 cases in Bandra (Escalated -> High severity)
      { id: 'C1', status: 'Escalated', latitude: 19.060, longitude: 72.836, police_station: 'Bandra Police Station', crime_major_head: 'HAWALA SYNDICATE' },
      { id: 'C2', status: 'Under Investigation', latitude: 19.062, longitude: 72.838, police_station: 'Bandra Police Station', crime_major_head: 'HAWALA SYNDICATE' },
      { id: 'C3', status: 'Open', latitude: 19.059, longitude: 72.835, police_station: 'Bandra Police Station', crime_major_head: 'HAWALA SYNDICATE' },
      { id: 'C4', status: 'Chargesheet Filed', latitude: 19.061, longitude: 72.837, police_station: 'Bandra Police Station', crime_major_head: 'THEFT' },
      // 1 case in Dadar (Low severity)
      { id: 'C5', status: 'Chargesheet Filed', latitude: 19.018, longitude: 72.842, police_station: 'Dadar Police Station', crime_major_head: 'ASSAULT' }
    ];

    supabase.from.mockImplementation((table) => {
      if (table === 'cases') {
        return { select: vi.fn().mockResolvedValue({ data: mockCases, error: null }) };
      }
      if (table === 'persons') {
        return { select: vi.fn().mockResolvedValue({ count: 20, error: null }) };
      }
      if (table === 'alerts') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        };
      }
      if (table === 'findings') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        };
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    });

    const metrics = await alertsService.getDashboardMetrics();

    expect(metrics.hotspots.length).toBe(2);
    
    // Top hotspot is Bandra
    const bandra = metrics.hotspots[0];
    expect(bandra.name).toBe('Bandra');
    expect(bandra.count).toBe(4);
    expect(bandra.type).toBe('HAWALA SYNDICATE');
    expect(bandra.severity).toBe('High');
    expect(bandra.lat).toBeCloseTo(19.0605, 3);
    expect(bandra.lng).toBeCloseTo(72.8365, 3);

    // Second hotspot is Dadar
    const dadar = metrics.hotspots[1];
    expect(dadar.name).toBe('Dadar');
    expect(dadar.count).toBe(1);
    expect(dadar.severity).toBe('Low');
    expect(dadar.lat).toBeCloseTo(19.018, 3);
  });
});
