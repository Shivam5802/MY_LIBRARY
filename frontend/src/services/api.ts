import type { ApiResponse, ApiErrorResponse } from '../types/auth';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export class ApiClientError extends Error {
  public code: string;
  public statusCode: number;
  public details?: unknown;

  constructor(code: string, message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const apiClient = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = localStorage.getItem('my_library_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (_netErr) {
    throw new ApiClientError(
      'NETWORK_ERROR',
      'Unable to connect to the server. Please check your network or server connection.',
      0
    );
  }

  const rawData = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      // Discard invalid/expired token
      localStorage.removeItem('my_library_token');
    }
    const errorData = rawData as ApiErrorResponse | null;
    const errorCode = errorData?.error?.code || 'UNKNOWN_ERROR';
    const errorMessage = errorData?.error?.message || response.statusText || 'Request failed';
    const errorDetails = errorData?.error?.details;
    throw new ApiClientError(errorCode, errorMessage, response.status, errorDetails);
  }

  const result = rawData as ApiResponse<T>;
  return result.data;
};

export const downloadFile = async (
  endpoint: string,
  suggestedFilename: string
): Promise<void> => {
  const token = localStorage.getItem('my_library_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error('Failed to generate export file. Server returned ' + response.status);
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = suggestedFilename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(blobUrl);
  document.body.removeChild(a);
};

