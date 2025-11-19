import OpenAI from 'openai';
import type { StudentInput, Decision } from './core/types';

/**
 * Generate a natural-language explanation using gpt-4o-mini
 * based on the student's input + system decision result.
 */
export async function generateAiExplanation(
  input: StudentInput,
  decision: Decision
): Promise<string> {
    
  // Safety check — no API key
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return (
      "AI explanation is not available on this server (missing OPENAI_API_KEY). " +
      "This is expected for CI tests and development without an API key."
    );
  }

  // Create client only when key exists
  const client = new OpenAI({ apiKey });

  // Build prompt

  const baseFacts = `
Student info:
- Age: ${input.age}
- Months in CA: ${input.monthsInCA}
- CA Driver License: ${input.hasCADriverLicense}
- Registered to vote in CA: ${input.registeredToVoteInCA}
- Files CA taxes: ${input.filesCATaxes}

System decision: ${decision.status}
Reasons:
${decision.reasons.map((r) => `- ${r}`).join('\n')}
`.trim();

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a friendly residency advisor for UC Riverside. ' +
          'Explain residency decisions in clear, student-friendly language, ' +
          'and always include a short disclaimer that this is not official residency determination.',
      },
      {
        role: 'user',
        content:
          'Please explain this residency evaluation in 2–3 short paragraphs, ' +
          'highlighting the key factors that led to the decision:\n\n' + baseFacts,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;

  return (
    content ??
    'AI explanation could not be generated. Please contact the system administrator.'
  );
}
