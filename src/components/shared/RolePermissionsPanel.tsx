import {
    Check, X, Eye, Plus, Edit, Trash2, CheckCircle
} from 'lucide-react';
import type { UserRole } from '@/types/database';
import { permissionMatrix, getRoleDisplayName } from '@/lib/permissions';
import type { Resource, Action } from '@/lib/permissions';

interface RolePermissionsPanelProps {
    role: UserRole | null;
}

const resourceLabels: Record<Resource, string> = {
    dashboard: 'Dashboard',
    financeiro: 'Financeiro',
    planejamento: 'Planejamento',
    contratos: 'Contratos',
    favorecidos: 'Favorecidos',
    categorias: 'Categorias',
    contas_bancarias: 'Contas Bancárias',
    filiais: 'Filiais',
    usuarios: 'Usuários',
    relatorios: 'Relatórios',
    produtos: 'Produtos',
    agenda: 'Agenda',
};

const actionLabels: Record<Action, { label: string; icon: React.ReactNode }> = {
    view: { label: 'Visualizar', icon: <Eye className="w-3 h-3" /> },
    create: { label: 'Criar', icon: <Plus className="w-3 h-3" /> },
    edit: { label: 'Editar', icon: <Edit className="w-3 h-3" /> },
    delete: { label: 'Excluir', icon: <Trash2 className="w-3 h-3" /> },
    approve: { label: 'Aprovar', icon: <CheckCircle className="w-3 h-3" /> },
};

export function RolePermissionsPanel({ role }: RolePermissionsPanelProps) {
    if (!role) {
        return (
            <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground text-center">
                    Selecione uma função para ver as permissões
                </p>
            </div>
        );
    }

    const permissions = permissionMatrix[role];
    const resources = Object.keys(permissions) as Resource[];
    const actions: Action[] = ['view', 'create', 'edit', 'delete', 'approve'];

    return (
        <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <div className="mb-3">
                <h4 className="text-sm font-semibold text-foreground mb-1">
                    Permissões da função:
                    {' '}
                    {getRoleDisplayName(role)}
                </h4>
                <p className="text-xs text-muted-foreground">
                    Veja abaixo o que esta função permite fazer no sistema
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left py-2.5 px-3 font-medium text-foreground align-middle">
                                Recurso
                            </th>
                            {actions.map((action) => (
                                <th key={action} className="text-center py-2.5 px-2 font-medium text-foreground align-middle min-w-[60px]">
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        {actionLabels[action].icon}
                                        <span className="text-[10px] leading-tight">{actionLabels[action].label}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {resources.map((resource) => {
                            const resourcePerms = permissions[resource];
                            return (
                                <tr key={resource} className="border-b border-border/50 hover:bg-muted/20">
                                    <td className="py-2.5 px-3 font-medium text-foreground align-middle">
                                        {resourceLabels[resource]}
                                    </td>
                                    {actions.map((action) => {
                                        const permission = resourcePerms[action];
                                        const isAllowed = permission === true || permission === 'own';
                                        const isOwnOnly = permission === 'own';

                                        return (
                                            <td key={action} className="text-center py-2.5 px-2 align-middle">
                                                {isAllowed ? (
                                                    <div className="flex items-center justify-center">
                                                        {isOwnOnly ? (
                                                            <span
                                                                className="text-[10px] text-primary font-medium whitespace-nowrap"
                                                                title="Apenas próprios registros"
                                                            >
                                                                Próprio
                                                            </span>
                                                        ) : (
                                                            <Check className="w-4 h-4 text-success" />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <X className="w-4 h-4 text-muted-foreground opacity-50 mx-auto" />
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-success" />
                        <span>Permitido</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-primary font-medium">Próprio</span>
                        <span>Apenas próprios registros</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <X className="w-3 h-3 text-muted-foreground opacity-50" />
                        <span>Negado</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
