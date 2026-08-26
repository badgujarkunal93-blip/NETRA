import { z } from 'zod';

/**
 * Strict Zod Schema for Structured FIR Extraction
 * As specified in CIU Data Ingestion Spec
 */
export const FIROutputSchema = z.object({
  case: z.object({
    crime_no: z.string().min(1, "Crime No is required"),
    case_no: z.string().min(1, "Case No is required"),
    crime_category: z.string().min(1, "Crime Category is required"),
    crime_major_head: z.string().min(1, "Crime Major Head is required"),
    crime_minor_head: z.string().min(1, "Crime Minor Head is required"),
    status: z.string().default("Under Investigation"),
    registered_date: z.string().nullable().optional(),
    incident_from: z.string().nullable().optional(),
    incident_to: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    police_station: z.string().nullable().optional(),
    brief_facts: z.string().min(5, "Brief facts must contain text")
  }),
  persons: z.array(
    z.object({
      canonical_name: z.string().min(1, "Person name is required"),
      aliases: z.array(z.string()).default([]),
      dob: z.string().nullable().optional(),
      gender: z.string().nullable().optional(),
      role_type: z.enum(['accused', 'victim', 'complainant', 'witness', 'co-conspirator', 'suspect']).or(z.string())
    })
  ).default([]),
  phones: z.array(
    z.object({
      number: z.string(),
      owner_name: z.string().nullable().optional()
    })
  ).default([]),
  vehicles: z.array(
    z.object({
      registration: z.string(),
      vehicle_type: z.string().nullable().optional(),
      owner_name: z.string().nullable().optional()
    })
  ).default([]),
  mo_fingerprint: z.object({
    target: z.string().nullable().optional().default(''),
    timing: z.string().nullable().optional().default(''),
    entry_method: z.string().nullable().optional().default(''),
    tools: z.string().nullable().optional().default(''),
    transport: z.string().nullable().optional().default(''),
    concealment: z.string().nullable().optional().default(''),
    action_sequence: z.string().nullable().optional().default(''),
    victim_interaction: z.string().nullable().optional().default(''),
    exit_method: z.string().nullable().optional().default(''),
    group_behavior: z.string().nullable().optional().default('')
  })
});
