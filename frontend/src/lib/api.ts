// API client utility for communicating with Django backend

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface Profile {
  user: User;
  bio: string;
  two_factor_enabled: boolean;
}

interface AuthResponse {
  success?: boolean;
  user?: User;
  access?: string;
  refresh?: string;
  error?: string;
  requires_2fa?: boolean;
  user_id?: number;
  message?: string;
}

interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  data?: T;
  message?: string;
}

class ApiClient {
  private baseURL = '/api';
  private csrfToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  // Get CSRF token from Django
  async getCSRFToken(): Promise<string> {
    if (this.csrfToken) {
      return this.csrfToken;
    }

    try {
      const response = await fetch(`${this.baseURL}/csrf/`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to get CSRF token');
      }
      
      const data = await response.json();
      this.csrfToken = data.csrfToken;
      return this.csrfToken;
    } catch (error) {
      console.error('Error getting CSRF token:', error);
      throw error;
    }
  }

  // Make authenticated requests
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get CSRF token for POST requests
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE') {
      try {
        const csrfToken = await this.getCSRFToken();
        headers['X-CSRFToken'] = csrfToken;
      } catch (error) {
        console.warn('Could not get CSRF token:', error);
      }
    }

    // Add JWT access token if available
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    // If we get a 401 and have a refresh token, try to refresh the access token
    if (response.status === 401 && localStorage.getItem('refresh_token')) {
      try {
        const newAccessToken = await this.refreshAccessToken();
        if (newAccessToken) {
          // Retry the original request with the new token
          headers['Authorization'] = `Bearer ${newAccessToken}`;
          response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
          });
        }
      } catch (error) {
        // Refresh failed, redirect to login or handle accordingly
        this.clearTokens();
        throw new Error('Session expired. Please log in again.');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Authentication methods
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await this.request('/auth/login/', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Check if 2FA is required
      if (response.requires_2fa) {
        return {
          success: true,
          requires_2fa: true,
          user_id: response.user_id,
          message: response.message,
        };
      }

      // Normal login with tokens
      if (response.access && response.refresh) {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        return {
          success: true,
          access: response.access,
          refresh: response.refresh,
          user: response.user,
        };
      }

      // If no access token, treat as error
      return {
        success: false,
        error: response.error || response.message || 'Login failed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async verify2FA(userId: number, code: string): Promise<AuthResponse> {
    try {
      const response = await this.request('/auth/verify-2fa/', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, code }),
      });

      if (response.success && response.access && response.refresh) {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        return {
          success: true,
          access: response.access,
          refresh: response.refresh,
          user: response.user,
          message: response.message,
        };
      }

      return {
        success: false,
        error: response.error || '2FA verification failed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '2FA verification failed',
      };
    }
  }

  async resend2FA(userId: number): Promise<ApiResponse> {
    try {
      const response = await this.request('/auth/resend-2fa/', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resend code',
      };
    }
  }

  async toggle2FA(enable: boolean): Promise<ApiResponse> {
    try {
      const response = await this.request('/auth/toggle-2fa/', {
        method: 'POST',
        body: JSON.stringify({ enable }),
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle 2FA',
      };
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.request('/auth/register/', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Backend sends: { refresh, access, user } on success
      if (response.access && response.refresh) {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        return {
          success: true,
          access: response.access,
          refresh: response.refresh,
          user: response.user,
        };
      }

      return {
        success: false,
        error: response.error || 'Registration failed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      const response = await this.request('/auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh: refreshToken }),
      });

      // Clear local storage
      this.clearTokens();

      return response;
    } catch (error) {
      // Even if the server request fails, clear local storage
      this.clearTokens();
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }

  async getUserProfile(): Promise<ApiResponse<Profile>> {
    try {
      const response = await this.request<Profile>('/auth/profile/');
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user profile',
      };
    }
  }

  // JWT token management
  private async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return null;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseURL}/token/refresh/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: refreshToken }),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        
        if (data.access) {
          localStorage.setItem('access_token', data.access);
          if (data.refresh) {
            localStorage.setItem('refresh_token', data.refresh);
          }
          return data.access;
        }

        throw new Error('No access token in refresh response');
      } catch (error) {
        this.clearTokens();
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.csrfToken = null;
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();
export type { User, Profile, AuthResponse, ApiResponse, LoginData, RegisterData };
