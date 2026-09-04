import type { AppData, AuditLog, Computer, Maintenance, Problem } from "./data";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.port === "5173" || window.location.port === "5174"
    ? "http://127.0.0.1:8000/index.php"
    : "/api/index.php");

export interface AuthUser {
  email: string;
  name: string;
  role: "admin" | "staff";
}

export interface LoginResponse {
  user: AuthUser;
}

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status?: number;
  durationMs: number;
  payload?: any;
  response?: any;
  error?: string;
}

type ApiLogListener = (log: ApiLogEntry) => void;
const apiLogListeners = new Set<ApiLogListener>();

export function onApiLog(listener: ApiLogListener): () => void {
  apiLogListeners.add(listener);
  return () => {
    apiLogListeners.delete(listener);
  };
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const startTime = performance.now();
  const logId = Math.random().toString(36).slice(2, 9);
  const method = options.method || "GET";
  let payload: any = undefined;
  if (options.body && typeof options.body === "string") {
    try {
      payload = JSON.parse(options.body);
    } catch {
      payload = options.body;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      throw new Error(text || `Server responded with status ${response.status}`);
    }

    const durationMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const message = data.error || data.details || `Error ${response.status}`;
      const logEntry: ApiLogEntry = {
        id: logId,
        timestamp: new Date().toLocaleTimeString(),
        method,
        url,
        status: response.status,
        durationMs,
        payload,
        error: message,
      };
      apiLogListeners.forEach(fn => fn(logEntry));
      throw new Error(message);
    }

    const logEntry: ApiLogEntry = {
      id: logId,
      timestamp: new Date().toLocaleTimeString(),
      method,
      url,
      status: response.status,
      durationMs,
      payload,
      response: data,
    };
    apiLogListeners.forEach(fn => fn(logEntry));

    return data as T;
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - startTime);
    const logEntry: ApiLogEntry = {
      id: logId,
      timestamp: new Date().toLocaleTimeString(),
      method,
      url,
      status: 0,
      durationMs,
      payload,
      error: err.message || "Network Error",
    };
    apiLogListeners.forEach(fn => fn(logEntry));
    throw err;
  }
}

export const api = {
  baseUrl: API_BASE_URL,

  async checkHealth(): Promise<boolean> {
    try {
      await request<any>(`${API_BASE_URL}?resource=computers`);
      return true;
    } catch {
      return false;
    }
  },

  async devReset(): Promise<AppData> {
    return request<AppData>(`${API_BASE_URL}?resource=dev-reset`, {
      method: "POST",
    });
  },

  async devStatus(): Promise<any> {
    return request<any>(`${API_BASE_URL}?resource=dev-status`);
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>(`${API_BASE_URL}?resource=login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async fetchAllData(): Promise<AppData> {
    return request<AppData>(`${API_BASE_URL}?resource=all`);
  },

  // Computers
  async fetchComputers(): Promise<Computer[]> {
    return request<Computer[]>(`${API_BASE_URL}?resource=computers`);
  },

  async createComputer(computer: Computer): Promise<Computer> {
    return request<Computer>(`${API_BASE_URL}?resource=computers`, {
      method: "POST",
      body: JSON.stringify(computer),
    });
  },

  async updateComputer(id: string, updates: Partial<Computer>): Promise<Computer> {
    return request<Computer>(`${API_BASE_URL}?resource=computers&id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  async deleteComputer(id: string): Promise<{ success: boolean; id: string }> {
    return request<{ success: boolean; id: string }>(
      `${API_BASE_URL}?resource=computers&id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  },

  // Problems
  async fetchProblems(): Promise<Problem[]> {
    return request<Problem[]>(`${API_BASE_URL}?resource=problems`);
  },

  async createProblem(problem: Problem): Promise<Problem> {
    return request<Problem>(`${API_BASE_URL}?resource=problems`, {
      method: "POST",
      body: JSON.stringify(problem),
    });
  },

  async updateProblem(id: string, updates: Partial<Problem>): Promise<Problem> {
    return request<Problem>(`${API_BASE_URL}?resource=problems&id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  async deleteProblem(id: string): Promise<{ success: boolean; id: string }> {
    return request<{ success: boolean; id: string }>(
      `${API_BASE_URL}?resource=problems&id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  },

  // Maintenance
  async fetchMaintenance(): Promise<Maintenance[]> {
    return request<Maintenance[]>(`${API_BASE_URL}?resource=maintenance`);
  },

  async createMaintenance(maintenance: Maintenance): Promise<Maintenance> {
    return request<Maintenance>(`${API_BASE_URL}?resource=maintenance`, {
      method: "POST",
      body: JSON.stringify(maintenance),
    });
  },

  async updateMaintenance(id: string, updates: Partial<Maintenance>): Promise<Maintenance> {
    return request<Maintenance>(`${API_BASE_URL}?resource=maintenance&id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  async deleteMaintenance(id: string): Promise<{ success: boolean; id: string }> {
    return request<{ success: boolean; id: string }>(
      `${API_BASE_URL}?resource=maintenance&id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  },

  // Audit Logs
  async fetchAuditLogs(): Promise<AuditLog[]> {
    return request<AuditLog[]>(`${API_BASE_URL}?resource=audit-logs`);
  },

  async createAuditLog(log: AuditLog): Promise<AuditLog> {
    return request<AuditLog>(`${API_BASE_URL}?resource=audit-logs`, {
      method: "POST",
      body: JSON.stringify(log),
    });
  },
};
