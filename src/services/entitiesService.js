import { localDB } from './localData.js';

export const entitiesService = {
  async getPersons(filters = {}) {
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
    return localDB.persons.find(p => p.id === id) || null;
  }
};
