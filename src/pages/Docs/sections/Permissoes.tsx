import { Lightbulb } from 'lucide-react';

export function Permissoes() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Permissões de Acesso</h2>
            <p className="text-muted-foreground">
                O sistema possui diferentes níveis de acesso baseados no perfil do usuário.
            </p>

            <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border rounded-lg">
                    <thead className="bg-muted">
                        <tr>
                            <th className="py-3 px-4 text-left font-medium text-foreground">Perfil</th>
                            <th className="py-3 px-4 text-left font-medium text-foreground">Permissões</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        <tr>
                            <td className="py-3 px-4 font-medium text-foreground">Administrador</td>
                            <td className="py-3 px-4 text-muted-foreground">
                                Acesso total ao sistema: gerencia filiais, usuários, contas bancárias
                                e todas as funcionalidades. Acesso a todas as filiais automaticamente.
                            </td>
                        </tr>
                        <tr>
                            <td className="py-3 px-4 font-medium text-foreground">Gerente</td>
                            <td className="py-3 px-4 text-muted-foreground">
                                Gerencia contas bancárias, visualiza relatórios, cria lançamentos
                                e cadastros. Acesso limitado às filiais atribuídas.
                            </td>
                        </tr>
                        <tr>
                            <td className="py-3 px-4 font-medium text-foreground">Usuário</td>
                            <td className="py-3 px-4 text-muted-foreground">
                                Lançamentos e cadastros básicos. Visualização de relatórios.
                                Acesso limitado às filiais atribuídas.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6">Gestão de Filiais por Usuário</h3>
            <p className="text-sm text-muted-foreground mb-3">
                Administradores podem definir quais filiais cada usuário pode acessar:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Acesse Cadastros → Usuários</li>
                <li>Clique em &quot;Gerenciar&quot; no usuário desejado</li>
                <li>Selecione as filiais que o usuário pode acessar</li>
                <li>Salve as alterações</li>
            </ul>

            <div className="p-4 bg-muted rounded-lg mt-4">
                <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Filial Atual</h4>
                        <p className="text-sm text-muted-foreground">
                            A filial selecionada no cabeçalho determina quais dados são exibidos.
                            O código da filial é mostrado em destaque para fácil identificação.
                        </p>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6">Tema</h3>
            <p className="text-sm text-muted-foreground">
                Alterne entre modo claro e escuro usando o ícone de lua/sol no cabeçalho da página.
            </p>
        </div>
    );
}
