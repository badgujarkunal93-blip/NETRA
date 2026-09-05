import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { graphService } from '../src/services/graphService.js';
import { setDemoState } from '../src/services/demoScenario.js';

describe('Demo Mode Knowledge Graph and Canvas Persistence', () => {
  beforeEach(() => {
    // Enable demo mode at step 3
    setDemoState(true, 3);
  });

  afterEach(() => {
    setDemoState(false, 1);
  });

  it('getCaseCanvas returns synthetic nodes and edges with 2D positions for DEMO-CASE-X at step 3', async () => {
    const canvas = await graphService.getCaseCanvas('DEMO-CASE-X');

    expect(canvas).toBeDefined();
    expect(canvas.caseId).toBe('DEMO-CASE-X');
    expect(Array.isArray(canvas.nodes)).toBe(true);
    expect(Array.isArray(canvas.edges)).toBe(true);

    // Initial step 3 has local case nodes
    expect(canvas.nodes.length).toBeGreaterThanOrEqual(5);
    const farhanNode = canvas.nodes.find(n => n.id === 'DEMO-PERSON-1');
    expect(farhanNode).toBeDefined();
    expect(farhanNode.type).toBe('personCard');
    expect(farhanNode.position).toHaveProperty('x');
    expect(farhanNode.position).toHaveProperty('y');
    expect(farhanNode.data.label).toBe('Farhan Qureshi');
  });

  it('getCaseCanvas dynamically updates layout and nodes when advancing to step 4', async () => {
    setDemoState(true, 4);
    const canvas = await graphService.getCaseCanvas('DEMO-CASE-X');

    // Step 4 reveals cross-case entities (Case Y, Case Z, Vikram mastermind, etc.)
    const caseYNode = canvas.nodes.find(n => n.id === 'DEMO-CASE-Y');
    const caseZNode = canvas.nodes.find(n => n.id === 'DEMO-CASE-Z');
    const burnerPhone = canvas.nodes.find(n => n.id === 'DEMO-PHONE-1');

    expect(caseYNode).toBeDefined();
    expect(caseZNode).toBeDefined();
    expect(burnerPhone).toBeDefined();
    expect(canvas.edges.length).toBeGreaterThanOrEqual(10);
  });

  it('saveCaseCanvas does not throw and skips real Supabase persistence in Demo Mode', async () => {
    const consoleSpy = vi.spyOn(console, 'log');

    const result = await graphService.saveCaseCanvas('DEMO-CASE-X', {
      nodes: [{ id: 'DEMO-PERSON-1', position: { x: 100, y: 100 }, data: { label: 'Test' } }],
      edges: [],
      caseNotes: 'Demo note'
    });

    expect(result).toBeDefined();
    expect(result.caseId).toBe('DEMO-CASE-X');
    expect(consoleSpy).toHaveBeenCalledWith('Demo Mode: canvas save skipped');

    consoleSpy.mockRestore();
  });

  it('getCaseIntelligenceNetwork returns caseData and coordinates on every node and edge', async () => {
    const net = await graphService.getCaseIntelligenceNetwork('DEMO-CASE-X');

    expect(net.caseData).toBeDefined();
    expect(net.caseData.id).toBe('DEMO-CASE-X');
    expect(Array.isArray(net.nodes)).toBe(true);
    expect(Array.isArray(net.edges)).toBe(true);

    // Ensure all nodes have valid lat and lng for Leaflet marker rendering
    net.nodes.forEach(node => {
      expect(typeof node.lat).toBe('number');
      expect(typeof node.lng).toBe('number');
      expect(node.lat).toBeGreaterThan(18.0);
      expect(node.lng).toBeGreaterThan(72.0);
    });

    // Ensure all edges have resolved coordinates
    net.edges.forEach(edge => {
      expect(Array.isArray(edge.sourceCoords)).toBe(true);
      expect(Array.isArray(edge.targetCoords)).toBe(true);
      expect(edge.sourceCoords.length).toBe(2);
      expect(edge.targetCoords.length).toBe(2);
    });
  });
});
