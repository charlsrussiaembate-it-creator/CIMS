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

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

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

  if (!response.ok) {
    const message = data.error || data.details || `Error ${response.status}`;
    throw new Error(message);
  }

  return data as T;
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
