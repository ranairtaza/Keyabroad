import { z } from 'zod';

export const MatcherExplanationSchema = z.object({
  explanation: z.string().describe("A clear, professional explanation of the eligibility result based strictly on the deterministic engine output."),
  matched_criteria: z.array(z.string()).describe("List of requirements the student successfully met."),
  failed_criteria: z.array(z.string()).describe("List of requirements the student failed to meet."),
  unknown_criteria: z.array(z.string()).describe("List of requirements that could not be evaluated due to missing information."),
  evidence: z.array(z.string()).describe("List of specific data points from the student profile used to make this determination."),
  recommended_programs: z.array(z.string()).describe("List of 1 to 3 specific program names that are recommended based on the student's field of interest and the university's subjects offered.")
});

export type MatcherExplanationResult = z.infer<typeof MatcherExplanationSchema>;

// Extend to full result incorporating authoritative status
export type FinalMatchResult = MatcherExplanationResult & {
  status: 'ELIGIBLE' | 'INELIGIBLE' | 'UNKNOWN';
};
