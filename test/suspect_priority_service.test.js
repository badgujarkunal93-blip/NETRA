import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/services/supabaseClient.js', () => ({
  isSupabaseConfigured: false,
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        or: vi.fn().mockResolvedValue({ data: [] }),
        eq: vi.fn().mockResolvedValue({ data: [], count: 0 }),
        limit: vi.fn().mockResolvedValue({ data: [] })
      }))
    }))
  }
}));

import { 
  computePersonCanvasFeatures, 
  fetchSuspectPriorityScore, 
  fetchSuspectExplanation, 
  analyzeAllCanvasPersons 
} from '../src/services/suspectPriorityService.js';

describe('suspectPriorityService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchSuspectPriorityScore calls /score and returns numeric score', async () => {
    const mockScoreResponse = {
      priority_score: 84.5,
      model_name: 'CIU-XGBoost-Priority',
      model_version: '1.0',
      model_mode: 'production',
      feature_version: '10',
      generated_at: '2026-08-31T00:00:00Z'
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockScoreResponse
    });

    const features = {
      network_centrality: 0.8,
      direct_connection_count: 5,
      observed_vs_inferred_ratio: 0.8,
      avg_relationship_confidence: 85.0,
      role_weight: 1.0,
      prior_case_count: 3,
      mo_case_match_flag: 1,
      evidence_count: 4.0,
      alert_count: 2,
      avg_alert_confidence: 80.0
    };

    const score = await fetchSuspectPriorityScore(features);
    expect(score).toBe(84.5);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/score'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' })
      })
    );
  });

  it('fetchSuspectExplanation calls /explain and returns AI reasoning and source', async () => {
    const mockExplainResponse = {
      priority_score: 84.5,
      reasoning: 'Ranked as elevated priority primarily due to central graph connectivity and a matching prior MO pattern.',
      reasoning_source: 'llm',
      top_contributions: [
        { feature: 'network_centrality', label: 'network bridge centrality', shap_value: 18.2, impact: 'positive' }
      ],
      generated_at: '2026-08-31T00:00:00Z'
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockExplainResponse
    });

    const features = {
      network_centrality: 0.8,
      direct_connection_count: 5,
      observed_vs_inferred_ratio: 0.8,
      avg_relationship_confidence: 85.0,
      role_weight: 1.0,
      prior_case_count: 3,
      mo_case_match_flag: 1,
      evidence_count: 4.0,
      alert_count: 2,
      avg_alert_confidence: 80.0
    };

    const result = await fetchSuspectExplanation({
      features,
      priority_score: 84.5,
      person_name: 'Test Suspect',
      role: 'Accused'
    });

    expect(result.reasoning).toBe(mockExplainResponse.reasoning);
    expect(result.reasoning_source).toBe('llm');
    expect(result.top_contributions).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/explain'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('analyzeAllCanvasPersons executes scoring + explainability without silent fake scores on failure', async () => {
    // Mock fetch failure to simulate backend down
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error connecting to model service'));

    const nodes = [
      {
        id: 'node-person-1',
        type: 'personCard',
        data: { label: 'Vikram Sethi', role: 'Accused', status: 'hypothesis' }
      }
    ];
    const edges = [];

    const results = await analyzeAllCanvasPersons(nodes, edges, 'CASE-001');

    expect(results).toHaveLength(1);
    // Explicit failure reporting - NOT a silent fake number
    expect(results[0].success).toBe(false);
    expect(results[0].priority_score).toBeNull();
    expect(results[0].error).toBe('Priority model unavailable');
    expect(results[0].isHeuristic).toBe(false);
  });

  it('analyzeAllCanvasPersons attaches reasoning and reasoning_source when backend succeeds', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/score')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ priority_score: 78.5 })
        });
      }
      if (url.includes('/explain')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            priority_score: 78.5,
            reasoning: 'Evaluated based on direct connections and high role severity.',
            reasoning_source: 'llm',
            top_contributions: [{ feature: 'role_weight', label: 'role severity', shap_value: 12.0 }]
          })
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    const nodes = [
      {
        id: 'node-person-1',
        type: 'personCard',
        data: { label: 'Suresh Kumar', role: 'Accused', status: 'confirmed' }
      }
    ];
    const edges = [];

    const results = await analyzeAllCanvasPersons(nodes, edges, 'CASE-001');

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
    expect(results[0].priority_score).toBe(78.5);
    expect(results[0].reasoning).toBe('Evaluated based on direct connections and high role severity.');
    expect(results[0].reasoning_source).toBe('llm');
    expect(results[0].top_contributions).toHaveLength(1);
  });
});
