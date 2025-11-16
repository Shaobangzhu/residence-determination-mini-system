const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export const DECIDE_ENDPOINT = `${API_BASE_URL}/api/decide?explain=true`;