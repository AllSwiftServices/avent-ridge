
export type ApiResponse<T> = {
  data: T | null;
  error: { message: string } | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${path}`;
  
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // In a real app, we might get the token from a cookie or localStorage
  // For now, we'll assume the API handles session via cookies (standard for Next.js)

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: { message: result.message || response.statusText },
      };
    }

    return {
      data: result as T,
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: { message: error.message || 'An unexpected error occurred' },
    };
  }
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => 
    request<T>(path, { ...options, method: 'GET' }),
  
  post: <T>(path: string, body: any, options?: RequestInit) => 
    request<T>(path, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(body) 
    }),
  
  put: <T>(path: string, body: any, options?: RequestInit) => 
    request<T>(path, { 
      ...options, 
      method: 'PUT', 
      body: JSON.stringify(body) 
    }),

  patch: <T>(path: string, body: any, options?: RequestInit) => 
    request<T>(path, { 
      ...options, 
      method: 'PATCH', 
      body: JSON.stringify(body) 
    }),
  
  delete: <T>(path: string, options?: RequestInit) => 
    request<T>(path, { ...options, method: 'DELETE' }),
};
