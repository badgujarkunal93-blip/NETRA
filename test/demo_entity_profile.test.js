import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDemoPersonById, getDemoPersons, setDemoState } from '../src/services/demoScenario.js';
import { entitiesService } from '../src/services/entitiesService.js';

describe('Demo Mode Entity Profile Synthetic Data & Reveal-Gating', () => {
  beforeEach(() => {
    setDemoState(true, 1);
  });

  afterEach(() => {
    setDemoState(false, 1);
  });

  it('all 5 demo persons (DEMO-PERSON-1 to DEMO-PERSON-5) have synthetic structure', () => {
    const persons = getDemoPersons(4);
    expect(persons.length).toBe(5);

    const personIds = ['DEMO-PERSON-1', 'DEMO-PERSON-2', 'DEMO-PERSON-3', 'DEMO-PERSON-4', 'DEMO-PERSON-5'];
    personIds.forEach(id => {
      const p = getDemoPersonById(id, 4);
      expect(p).toBeDefined();
      expect(p.id).toBe(id);
      expect(p.canonical_name).toBeTruthy();
      expect(Array.isArray(p.timeline)).toBe(true);
      expect(p.timeline.length).toBeGreaterThanOrEqual(3);
      expect(Array.isArray(p.relationships)).toBe(true);
      expect(p.relationships.length).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(p.linkedCases)).toBe(true);
      expect(p.linkedCases.length).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(p.linkedPhones)).toBe(true);
      expect(Array.isArray(p.linkedVehicles)).toBe(true);
      expect(Array.isArray(p.linkedAccounts)).toBe(true);
    });
  });

  it('Farhan Qureshi (DEMO-PERSON-1) reveal-gates timeline and relationships across storyline steps', () => {
    // Step 1: Initial cold period
    const pStep1 = getDemoPersonById('DEMO-PERSON-1', 1);
    expect(pStep1).toBeDefined();
    expect(pStep1.timeline.length).toBe(3); // Initial cold period events
    expect(pStep1.linkedCases.length).toBe(1); // Case X only
    expect(pStep1.relationships.some(r => r.relationship_type === 'SUSPECTED_HANDLER_CONTACT')).toBe(false);

    // Step 4: Full syndicate nexus revealed
    const pStep4 = getDemoPersonById('DEMO-PERSON-1', 4);
    expect(pStep4.timeline.length).toBe(4);
    expect(pStep4.relationships.some(r => r.relationship_type === 'SUSPECTED_HANDLER_CONTACT')).toBe(true);
    expect(pStep4.relationships.some(r => r.relationship_type === 'CO_LOCATED_BURST')).toBe(true);

    // Step 7: Syndicate alert flag
    const pStep7 = getDemoPersonById('DEMO-PERSON-1', 7);
    expect(pStep7.timeline.length).toBe(5);
  });

  it('Vikram "Vicky" Malhotra (DEMO-PERSON-3) mastermind profile has multi-case and mule accounts', () => {
    const p = getDemoPersonById('DEMO-PERSON-3', 4);
    expect(p.canonical_name).toBe('Vikram "Vicky" Malhotra');
    expect(p.linkedCases.length).toBe(3); // Case X, Y, Z
    expect(p.linkedAccounts.some(a => a.account_number === 'HDFC-MULE-88019')).toBe(true);
    expect(p.linkedPhones.some(ph => ph.number === '+91 98201 99887')).toBe(true);
    expect(p.linkedVehicles.some(v => v.registration === 'MH-01-EA-9912')).toBe(true);
    expect(p.relationships.some(r => r.relationship_type === 'FENCING_COORDINATOR')).toBe(true);
  });

  it('entitiesService.getPersonById resolves demo persons when Demo Mode is active', async () => {
    setDemoState(true, 4);
    const result = await entitiesService.getPersonById('DEMO-PERSON-1');
    expect(result).toBeDefined();
    expect(result.id).toBe('DEMO-PERSON-1');
    expect(result.canonical_name).toBe('Farhan Qureshi');
    expect(result.timeline.length).toBeGreaterThan(0);
    expect(result.relationships.length).toBeGreaterThan(0);
  });
});
