import type { UserRole } from '@/types/database';

// Resource types in the system
export type Resource =
    | 'dashboard'
    | 'financeiro'
    | 'planejamento'
    | 'contratos'
    | 'favorecidos'
    | 'categorias'
    | 'contas_bancarias'
    | 'filiais'
    | 'usuarios'
    | 'relatorios'
    | 'produtos'
    | 'agenda';

// Action types
export type Action = 'view' | 'create' | 'edit' | 'delete' | 'approve';

// Permission matrix
// true = allowed, false = denied, 'own' = only own records
type PermissionValue = boolean | 'own';

export const permissionMatrix: Record<UserRole, Record<Resource, Record<Action, PermissionValue>>> = {
    admin: {
        dashboard: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        financeiro: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        planejamento: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        contratos: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        favorecidos: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        categorias: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        contas_bancarias: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        filiais: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        usuarios: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        relatorios: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        produtos: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        agenda: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
    },
    gerente: {
        dashboard: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        financeiro: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        planejamento: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        contratos: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        favorecidos: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        categorias: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        contas_bancarias: {
            view: true, create: true, edit: true, delete: true, approve: false
        },
        filiais: {
            view: true, create: false, edit: false, delete: false, approve: false
        },
        usuarios: {
            view: true, create: false, edit: false, delete: false, approve: false
        },
        relatorios: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        produtos: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        agenda: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
    },
    financeiro: {
        dashboard: {
            view: true, create: false, edit: false, delete: false, approve: false
        },
        financeiro: {
            view: true, create: true, edit: true, delete: true, approve: true
        },
        planejamento: {
            view: true, create: true, edit: true, delete: true, approve: false
        },
        contratos: {
            view: true, create: false, edit: false, delete: false, approve: false
        },
        favorecidos: {
            view: true, create: true, edit: true, delete: false, approve: false
        },
        categorias: {
            view: true, create: true, edit: true, delete: true, approve: false
        },
        contas_bancarias: {
            view: true, create: true, edit: true, delete: true, approve: false
        },
        filiais: {
            view: false, create: false, edit: false, delete: false, approve: false
        },
        usuarios: {
            view: false, create: false, edit: false, delete: false, approve: false
        },
        relatorios: {
            view: true, create: true, edit: true, delete: true, approve: false
        },
        produtos: {
            view: true, create: false, edit: false, delete: false, approve: false
        },
        agenda: {
            view: true, create: true, edit: true, delete: true, approve: false
        },
    },
    leitura: {
        dashboard: {
            view: true, create: false, edit: false, delete: false, approve: false
        },
        financeiro: {
            view: true, create: false, edit: false, delete: false, approve: false
        },
        planejamento: {
            view: true, create: false, edit: false, delete: false, approve: false
        },
        contratos: {
            view: true, create: false, edit: false, delete: false, approve: false
        },
        favorecidos: {
            view: true, create: false, edit: false, delete: false, approve: false
        },
        categorias: {
            view: true, create: false, edit: false, delete: false, approve: false
        },
        contas_bancarias: {
            view: true, create: false, edit: false, delete: false, approve: false
        },
        filiais: {
            view: true, create: false, edit: false, delete: false, approve: false
        },
        usuarios: {
            view: false, create: false, edit: false, delete: false, approve: false
        },
        relatorios: {
            view: true, create: false, edit: false, delete: false, approve: false
        },
        produtos: {
            view: true, create: false, edit: false, delete: false, approve: false
        },
        agenda: {
            view: true, create: false, edit: false, delete: false, approve: false
        },
    },
    // ── New roles ────────────────────────────────────────────────────────────
    coordenador: {
        dashboard: { view: true, create: false, edit: false, delete: false, approve: false },
        financeiro: { view: true, create: true, edit: true, delete: false, approve: false },
        planejamento: { view: true, create: false, edit: false, delete: false, approve: false },
        contratos: { view: true, create: true, edit: true, delete: false, approve: false },
        favorecidos: { view: true, create: true, edit: true, delete: false, approve: false },
        categorias: { view: true, create: false, edit: false, delete: false, approve: false },
        contas_bancarias: { view: false, create: false, edit: false, delete: false, approve: false },
        filiais: { view: false, create: false, edit: false, delete: false, approve: false },
        usuarios: { view: false, create: false, edit: false, delete: false, approve: false },
        relatorios: { view: true, create: false, edit: false, delete: false, approve: false },
        produtos: { view: true, create: false, edit: false, delete: false, approve: false },
        agenda: { view: true, create: true, edit: true, delete: 'own', approve: false },
    },
    assistente: {
        dashboard: { view: true, create: false, edit: false, delete: false, approve: false },
        financeiro: { view: true, create: true, edit: 'own', delete: false, approve: false },
        planejamento: { view: true, create: false, edit: false, delete: false, approve: false },
        contratos: { view: true, create: true, edit: 'own', delete: false, approve: false },
        favorecidos: { view: true, create: true, edit: true, delete: false, approve: false },
        categorias: { view: true, create: false, edit: false, delete: false, approve: false },
        contas_bancarias: { view: false, create: false, edit: false, delete: false, approve: false },
        filiais: { view: false, create: false, edit: false, delete: false, approve: false },
        usuarios: { view: false, create: false, edit: false, delete: false, approve: false },
        relatorios: { view: true, create: false, edit: false, delete: false, approve: false },
        produtos: { view: true, create: false, edit: false, delete: false, approve: false },
        agenda: { view: true, create: true, edit: 'own', delete: 'own', approve: false },
    },
    vendedor: {
        dashboard: { view: true, create: false, edit: false, delete: false, approve: false },
        financeiro: { view: true, create: false, edit: false, delete: false, approve: false },
        planejamento: { view: true, create: false, edit: false, delete: false, approve: false },
        contratos: { view: true, create: true, edit: true, delete: true, approve: false },
        favorecidos: { view: true, create: true, edit: true, delete: false, approve: false },
        categorias: { view: true, create: false, edit: false, delete: false, approve: false },
        contas_bancarias: { view: false, create: false, edit: false, delete: false, approve: false },
        filiais: { view: false, create: false, edit: false, delete: false, approve: false },
        usuarios: { view: false, create: false, edit: false, delete: false, approve: false },
        relatorios: { view: true, create: false, edit: false, delete: false, approve: false },
        produtos: { view: true, create: true, edit: true, delete: true, approve: false },
        agenda: { view: true, create: true, edit: true, delete: true, approve: false },
    },
    seguranca: {
        dashboard: { view: true, create: false, edit: false, delete: false, approve: false },
        financeiro: { view: false, create: false, edit: false, delete: false, approve: false },
        planejamento: { view: false, create: false, edit: false, delete: false, approve: false },
        contratos: { view: false, create: false, edit: false, delete: false, approve: false },
        favorecidos: { view: true, create: false, edit: false, delete: false, approve: false },
        categorias: { view: false, create: false, edit: false, delete: false, approve: false },
        contas_bancarias: { view: false, create: false, edit: false, delete: false, approve: false },
        filiais: { view: false, create: false, edit: false, delete: false, approve: false },
        usuarios: { view: false, create: false, edit: false, delete: false, approve: false },
        relatorios: { view: true, create: false, edit: false, delete: false, approve: false },
        produtos: { view: false, create: false, edit: false, delete: false, approve: false },
        agenda: { view: true, create: false, edit: false, delete: false, approve: false },
    },
    rh: {
        dashboard: { view: true, create: false, edit: false, delete: false, approve: false },
        financeiro: { view: false, create: false, edit: false, delete: false, approve: false },
        planejamento: { view: false, create: false, edit: false, delete: false, approve: false },
        contratos: { view: false, create: false, edit: false, delete: false, approve: false },
        favorecidos: { view: true, create: true, edit: true, delete: false, approve: false },
        categorias: { view: false, create: false, edit: false, delete: false, approve: false },
        contas_bancarias: { view: false, create: false, edit: false, delete: false, approve: false },
        filiais: { view: false, create: false, edit: false, delete: false, approve: false },
        usuarios: { view: false, create: false, edit: false, delete: false, approve: false },
        relatorios: { view: true, create: false, edit: false, delete: false, approve: false },
        produtos: { view: false, create: false, edit: false, delete: false, approve: false },
        agenda: { view: true, create: true, edit: true, delete: 'own', approve: false },
    },
    // ── Legacy roles (kept for backward compatibility) ────────────────────
    vendas: {
        dashboard: { view: true, create: false, edit: false, delete: false, approve: false },
        financeiro: { view: true, create: false, edit: false, delete: false, approve: false },
        planejamento: { view: true, create: false, edit: false, delete: false, approve: false },
        contratos: { view: true, create: true, edit: true, delete: true, approve: false },
        favorecidos: { view: true, create: true, edit: true, delete: false, approve: false },
        categorias: { view: true, create: false, edit: false, delete: false, approve: false },
        contas_bancarias: { view: false, create: false, edit: false, delete: false, approve: false },
        filiais: { view: false, create: false, edit: false, delete: false, approve: false },
        usuarios: { view: false, create: false, edit: false, delete: false, approve: false },
        relatorios: { view: true, create: false, edit: false, delete: false, approve: false },
        produtos: { view: true, create: true, edit: true, delete: true, approve: false },
        agenda: { view: true, create: true, edit: true, delete: true, approve: false },
    },
    usuario: {
        dashboard: { view: true, create: false, edit: false, delete: false, approve: false },
        financeiro: { view: true, create: true, edit: 'own', delete: false, approve: false },
        planejamento: { view: true, create: false, edit: false, delete: false, approve: false },
        contratos: { view: true, create: true, edit: 'own', delete: false, approve: false },
        favorecidos: { view: true, create: true, edit: true, delete: false, approve: false },
        categorias: { view: true, create: false, edit: false, delete: false, approve: false },
        contas_bancarias: { view: false, create: false, edit: false, delete: false, approve: false },
        filiais: { view: false, create: false, edit: false, delete: false, approve: false },
        usuarios: { view: false, create: false, edit: false, delete: false, approve: false },
        relatorios: { view: true, create: false, edit: false, delete: false, approve: false },
        produtos: { view: true, create: false, edit: false, delete: false, approve: false },
        agenda: { view: true, create: true, edit: 'own', delete: 'own', approve: false },
    },
};

/**
 * Check if a user role has permission for a specific action on a resource
 */
export function hasPermission(
    role: UserRole | undefined | null,
    resource: Resource,
    action: Action
): boolean {
    if (!role) return false;

    const resourcePermissions = permissionMatrix[role]?.[resource];
    if (!resourcePermissions) return false;

    const permission = resourcePermissions[action];

    // 'own' is treated as true for the basic check
    // The caller should implement ownership check separately
    return permission === true || permission === 'own';
}

/**
 * Check if permission is 'own' (meaning user can only access their own records)
 */
export function isOwnOnly(
    role: UserRole | undefined | null,
    resource: Resource,
    action: Action
): boolean {
    if (!role) return false;

    const permission = permissionMatrix[role]?.[resource]?.[action];
    return permission === 'own';
}

/**
 * Get all allowed resources for a role (for menu filtering)
 */
export function getAllowedResources(role: UserRole | undefined | null): Resource[] {
    if (!role) return [];

    const resources: Resource[] = [];

    for (const [resource, actions] of Object.entries(permissionMatrix[role] || {})) {
        if (actions.view) {
            resources.push(resource as Resource);
        }
    }

    return resources;
}

/**
 * Get role display name in Portuguese
 */
export function getRoleDisplayName(role: UserRole): string {
    const names: Record<UserRole, string> = {
        admin: 'Administrador',
        gerente: 'Gerente',
        coordenador: 'Coordenador',
        assistente: 'Assistente',
        vendedor: 'Vendedor',
        seguranca: 'Segurança',
        financeiro: 'Financeiro',
        rh: 'Recursos Humanos',
        leitura: 'Leitura',
        // legacy
        usuario: 'Usuário (legado)',
        vendas: 'Vendas (legado)',
    };

    return names[role] || role;
}

/**
 * Get all available roles for new user creation
 */
export function getAllRoles(): UserRole[] {
    return ['admin', 'gerente', 'coordenador', 'assistente', 'vendedor', 'seguranca', 'financeiro', 'rh', 'leitura'];
}
