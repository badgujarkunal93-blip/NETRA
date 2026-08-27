import { describe, it, expect, vi, beforeEach } from 'vitest';
import { casesService } from '../src/services/casesService.js';
import { supabase } from '../src/services/supabaseClient.js';

vi.mock('../src/services/supabaseClient.js', () => {
  return {
    isSupabaseConfigured: true,
    supabase: {
      from: vi.fn()
    }
  };
});

describe('casesService.getAllCases and getCases filters', () => {
  let mockQuery;
  const mockCases = [
    {
      id: 'CASE-001',
      crime_no: 'CR/001/2026',
      crime_category: 'Cybercrime',
      status: 'Under Investigation',
      police_station: 'Bandra Police Station',
      brief_facts: 'Online transaction fraud'
    },
    {
      id: 'CASE-002',
      crime_no: 'CR/002/2026',
      crime_category: 'Cybercrime',
      status: 'Closed',
      police_station: 'Bandra Police Station',
      brief_facts: 'Phishing attack resolved'
    },
    {
      id: 'CASE-003',
      crime_no: 'CR/003/2026',
      crime_category: 'Property Crime',
      status: 'Under Investigation',
      police_station: 'Colaba Police Station',
      brief_facts: 'Safe burglary'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockQuery = {
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      then: (resolve) => resolve({ data: mockCases, error: null })
    };

    supabase.from.mockReturnValue(mockQuery);
  });

  it('unfiltered call returns full result set and does not apply any .eq() or .or() clauses', async () => {
    const result = await casesService.getAllCases();

    expect(supabase.from).toHaveBeenCalledWith('cases');
    expect(mockQuery.select).toHaveBeenCalledWith('*');
    expect(mockQuery.or).not.toHaveBeenCalled();
    expect(mockQuery.eq).not.toHaveBeenCalled();
    expect(result).toHaveLength(3);
    expect(result).toEqual(mockCases);
  });

  it('ignores "All" sentinels for category, status, and police_station and returns full result set', async () => {
    const result = await casesService.getAllCases({
      category: 'All',
      status: 'All',
      police_station: 'All'
    });

    expect(mockQuery.or).not.toHaveBeenCalled();
    expect(mockQuery.eq).not.toHaveBeenCalled();
    expect(result).toHaveLength(3);
  });

  it('applies two simultaneous filters (category + status) and asserts returned cases satisfy both', async () => {
    // Mock filtered subset for category='Cybercrime' AND status='Under Investigation'
    const expectedFilteredData = [mockCases[0]];
    mockQuery.then = (resolve) => resolve({ data: expectedFilteredData, error: null });

    const result = await casesService.getAllCases({
      category: 'Cybercrime',
      status: 'Under Investigation'
    });

    expect(mockQuery.eq).toHaveBeenCalledWith('crime_category', 'Cybercrime');
    expect(mockQuery.eq).toHaveBeenCalledWith('status', 'Under Investigation');
    expect(mockQuery.eq).toHaveBeenCalledTimes(2);

    expect(result).toHaveLength(1);
    expect(result[0].crime_category).toBe('Cybercrime');
    expect(result[0].status).toBe('Under Investigation');
    expect(result[0].id).toBe('CASE-001');
  });

  it('compounds all active filters (search, category, status, police_station, limit) in a single query', async () => {
    const result = await casesService.getAllCases({
      search: 'fraud',
      category: 'Cybercrime',
      status: 'Under Investigation',
      police_station: 'Bandra Police Station',
      limit: 10,
      page: 2
    });

    expect(mockQuery.or).toHaveBeenCalledWith('crime_no.ilike.%fraud%,brief_facts.ilike.%fraud%');
    expect(mockQuery.eq).toHaveBeenCalledWith('crime_category', 'Cybercrime');
    expect(mockQuery.eq).toHaveBeenCalledWith('status', 'Under Investigation');
    expect(mockQuery.eq).toHaveBeenCalledWith('police_station', 'Bandra Police Station');
    // page 2 with limit 10 -> offset 10 to 19
    expect(mockQuery.range).toHaveBeenCalledWith(10, 19);
    expect(result).toBeDefined();
  });

  it('getCases alias delegates properly to getAllCases', async () => {
    const expectedData = [mockCases[2]];
    mockQuery.then = (resolve) => resolve({ data: expectedData, error: null });

    const result = await casesService.getCases({
      category: 'Property Crime',
      police_station: 'Colaba Police Station'
    });

    expect(mockQuery.eq).toHaveBeenCalledWith('crime_category', 'Property Crime');
    expect(mockQuery.eq).toHaveBeenCalledWith('police_station', 'Colaba Police Station');
    expect(result).toEqual(expectedData);
  });
});
