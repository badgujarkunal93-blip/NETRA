import { localDB } from './localData.js';
import { 
  isDemoModeActive, 
  getDemoCurrentStep, 
  getDemoPersons, 
  getDemoPersonById 
} from './demoScenario.js';

export const entitiesService = {
  async getPersons(filters = {}) {
    if (isDemoModeActive()) {
      const step = getDemoCurrentStep();
      return getDemoPersons(step, filters);
    }

    let rows = [...localDB.persons];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(p =>
        (p.canonical_name || '').toLowerCase().includes(q) ||
        (p.id || '').toLowerCase().includes(q) ||
        (p.aliases || []).some(a => a.toLowerCase().includes(q))
      );
    }

    if (filters.status_tag && filters.status_tag !== 'All') {
      rows = rows.filter(p => p.status_tag === filters.status_tag);
    }

    return rows;
  },

  async getPersonById(id) {
    if (isDemoModeActive()) {
      const step = getDemoCurrentStep();
      return getDemoPersonById(id, step);
    }

    return localDB.persons.find(p => p.id === id) || null;
  }
};
