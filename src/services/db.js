import { casesService } from './casesService.js';
import { entitiesService } from './entitiesService.js';
import { graphService } from './graphService.js';
import { alertsService } from './alertsService.js';

export const dbService = {
  ...casesService,
  ...entitiesService,
  ...graphService,
  ...alertsService
};
