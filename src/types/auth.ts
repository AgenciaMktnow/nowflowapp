export interface IUserProfile {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    role: 'ADMIN' | 'MANAGER' | 'MEMBER' | 'CLIENT';
    is_super_admin?: boolean;
    organization_id: string;
    organization?: {
        id: string;
        plan_type: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
    };
    needs_password_change?: boolean;
}
