import { casesService } from './casesService.js';
import { entitiesService } from './entitiesService.js';
import { graphService } from './graphService.js';
import { alertsService } from './alertsService.js';
import { localDataService } from './localDataService.js';

const remoteService = {
  ...casesService,
  ...entitiesService,
  ...graphService,
  ...alertsService
};

// Resilient wrapper: calls remote Supabase if available, seamlessly falls back to local data
export const dbService = new Proxy(remoteService, {
  get(target, prop) {
    if (typeof target[prop] === 'function') {
      return async function (...args) {
        try {
          const result = await target[prop].apply(target, args);
          // If remote returned valid data, return it
          if (result !== undefined && result !== null) return result;
          // If remote returned empty or null on critical queries, fall back
          if (typeof localDataService[prop] === 'function') {
            return await localDataService[prop](...args);
          }
          return result;
        } catch (err) {
          // On any network / Supabase fetch failure, seamlessly use local dataset
          if (typeof localDataService[prop] === 'function') {
            return await localDataService[prop](...args);
          }
          throw err;
        }
      };
    }
    return target[prop] || localDataService[prop];
  }
});
