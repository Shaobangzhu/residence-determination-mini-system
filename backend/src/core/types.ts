import { z } from 'zod';

export const StudentInputSchema = z.object({
  age: z.number().int().nonnegative(),
  monthsInCA: z.number().int().min(0),
  hasCADriverLicense: z.boolean(),
  registeredToVoteInCA: z.boolean(),
  filesCATaxes: z.boolean(),
  financiallyIndependent: z.boolean().optional().default(false)
});

export type StudentInput = z.infer<typeof StudentInputSchema>;

export type Decision =
  | { status: 'resident'; reasons: string[] }
  | { status: 'nonresident'; reasons: string[] }
  | { status: 'needs_review'; reasons: string[] };