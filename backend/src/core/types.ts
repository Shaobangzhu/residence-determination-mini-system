import { z } from 'zod';

// example for financial independent student: 
// 1. Student who works full time, e.g. Alex, a 24 years old full-time SDE, who is pursuing MBA
// 2. Grad Student with a stipend, e.g. Maria, a PhD student who's receiving RA stipend at UCR
// 3. Student who used to serve the country, e.g. John served 4 years in the US Army using GI bills
export const StudentInputSchema = z.object({
  age: z.number().int().nonnegative(),
  monthsInCA: z.number().int().min(0),
  hasCADriverLicense: z.boolean(),
  registeredToVoteInCA: z.boolean(),
  filesCATaxes: z.boolean(),
});

export type StudentInput = z.infer<typeof StudentInputSchema>;

export type Decision =
  { status: 'resident'; reasons: string[] } |
  { status: 'nonresident'; reasons: string[] } |
  { status: 'needs_review'; reasons: string[] };