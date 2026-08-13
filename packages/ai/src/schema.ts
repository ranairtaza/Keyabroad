import { z } from 'zod';

export const MatcherExplanationSchema = z.object({
  explanation: z.string().describe("A clear, professional explanation of the eligibility result based strictly on the deterministic engine output."),
  matched_criteria: z.array(z.string()).describe("List of requirements the student successfully met."),
  failed_criteria: z.array(z.string()).describe("List of requirements the student failed to meet."),
  unknown_criteria: z.array(z.string()).describe("List of requirements that could not be evaluated due to missing information."),
  evidence: z.array(z.string()).describe("List of specific data points from the student profile used to make this determination.")
});

export type MatcherExplanationResult = z.infer<typeof MatcherExplanationSchema>;

// Extend to full result incorporating authoritative status
export type FinalMatchResult = MatcherExplanationResult & {
  status: 'ELIGIBLE' | 'INELIGIBLE' | 'UNKNOWN';
};
