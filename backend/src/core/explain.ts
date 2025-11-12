import { StudentInput } from "./types";
import { Decision } from "./types";

export function explainDecision(input: StudentInput, decision: Decision): string {
    const lines: string[] = [];

    lines.push(`System classification: ${decision.status}`);
    lines.push('Reasons: ');
    for (const reason of decision.reasons) lines.push(`${reason}`);

    const tieCount = [
        input.hasCADriverLicense,
        input.registeredToVoteInCA,
        input.filesCATaxes
    ].filter(Boolean).length;

    lines.push('');
    lines.push('Key Input Details: ');
    lines.push(`1. Months lived in California: ${input.monthsInCA}`);
    lines.push(`2. Number of California ties (driver's license / voter registration / tax filing): ${tieCount}`);

    if (decision.status === 'needs_review') {
        lines.push('');
        lines.push('Suggested Next Step:');

        if (input.monthsInCA < 12)
            lines.push('- Continue residing in California until you reach 12 months.');

        if (tieCount < 2)
            lines.push(`- Strengthen California ties (e.g., get a CA driver's license, register to ViewTransitionTypeSet, file CA taxes).`);
    }

    return lines.join('\n');
}