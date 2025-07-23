export type UserRole = "USER" | "CORDY";

export interface AuthSession {
  user: {
    id: string;
    role: UserRole;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires: string;
}

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  recentUsers: number;
}

export interface UserWithCounts {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  createdAt: Date;
  _count: {
    accounts: number;
  };
}

export interface PaginatedUsers {
  users: UserWithCounts[];
  total: number;
  pages: number;
  currentPage: number;
}
