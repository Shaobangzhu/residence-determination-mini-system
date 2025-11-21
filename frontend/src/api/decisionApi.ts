import type { ApiResponse } from '../types/api-types';
import type { StudentInputPayload } from '../types/student-input-payload';
import { DECIDE_ENDPOINT } from '../constants/endpoints';

export async function decideResidency(
  payload: StudentInputPayload
): Promise<ApiResponse> {
  const res = await fetch(DECIDE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const errorMsg =
      (data as { error?: string }).error || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return res.json();
}
