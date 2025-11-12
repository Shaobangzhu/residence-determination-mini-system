import { StudentInput, Decision } from "./types";

/**
 * Determine residency classification based on input data.
 * 
 * Logic summary:
 * - Resident: 12+ months in CA and at least 2 CA ties (driver's license, voter registration, tax filing)
 * - Nonresident: less than 6 months and fewer than 2 ties
 * - Needs Review: everything else
 * @param input 
 */
export function decideResidency(input: StudentInput): Decision {
    // Count number of California ties
    const ties = [
        input.hasCADriverLicense,
        input.registeredToVoteInCA,
        input.filesCATaxes
    ].filter(Boolean).length;

    const reasons: string[] = [];

    // Resident
    if (input.monthsInCA >= 12 && ties >= 2) {
        reasons.push('Lived in California for 12 months or more and has at least two California ties.');
        return { status: 'resident', reasons };
    }

    // Nonresident
    if (input.monthsInCA < 6 || ties < 2) {
        if (input.monthsInCA < 6) reasons.push('Lived in California for less than 6 months.');
        if (ties < 2) reasons.push('Has fewer than two California ties.');
        return { status: 'nonresident', reasons };
    }

    reasons.push('Have more than two California ties, but lived in California between 6-12 months');
    return { status: 'needs_review', reasons };
}