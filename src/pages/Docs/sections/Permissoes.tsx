import { Lightbulb } from 'lucide-react';

export function Permissoes() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Permissoes de Acesso</h2>
            <p className="text-muted-foreground">
                O sistema possui diferentes niveis de acesso baseados no perfil do usuario.
            </p>

            <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border rounded-lg">
                    <thead className="bg-muted">
                        <tr>
                            <th className="py-3 px-4 text-left font-medium text-foreground">Perfil</th>
                            <th className="py-3 px-4 text-left font-medium text-foreground">Permissoes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        <tr>
                            <td className="py-3 px-4 font-medium text-foreground">Administrador</td>
                            <td className="py-3 px-4 text-muted-foreground">
                                Acesso total ao sistema: gerencia filiais, usuarios, contas bancarias
                                e todas as funcionalidades. Acesso a todas as filiais. Aprovacao de contratos
                                e versoes de orcamento.
                            </td>
                        </tr>
                        <tr>
                            <td className="py-3 px-4 font-medium text-foreground">Gerente</td>
                            <td className="py-3 px-4 text-muted-foreground">
                                Gerencia contas bancarias, relatorios, lancamentos e cadastros.
                                Pode aprovar contratos e versoes de orcamento.
                                Acesso limitado as filiais atribuidas.
                            </td>
                        </tr>
                        <tr>
                            <td className="py-3 px-4 font-medium text-foreground">Vendas</td>
                            <td className="py-3 px-4 text-muted-foreground">
                                Acesso ao modulo de vendas e contratos. Pode criar e gerenciar vendas,
                                visualizar comissoes e metas. Acesso limitado as filiais atribuidas.
                            </td>
                        </tr>
                        <tr>
                            <td className="py-3 px-4 font-medium text-foreground">Financeiro</td>
                            <td className="py-3 px-4 text-muted-foreground">
                                Acesso ao modulo financeiro, lancamentos, conciliacao bancaria
                                e relatorios financeiros. Acesso limitado as filiais atribuidas.
                            </td>
                        </tr>
                        <tr>
                            <td className="py-3 px-4 font-medium text-foreground">Usuario</td>
                            <td className="py-3 px-4 text-muted-foreground">
                                Lancamentos e cadastros basicos. Visualizacao de relatorios.
                                Acesso limitado as filiais atribuidas.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6">Gestao de Filiais por Usuario</h3>
            <p className="text-sm text-muted-foreground mb-3">
                Administradores podem definir quais filiais cada usuario pode acessar:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Acesse Cadastros &rarr; Usuarios</li>
                <li>Clique em &quot;Gerenciar&quot; no usuario desejado</li>
                <li>Selecione as filiais que o usuario pode acessar</li>
                <li>Salve as alteracoes</li>
            </ul>

            <div className="p-4 bg-muted rounded-lg mt-4">
                <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Filial Atual</h4>
                        <p className="text-sm text-muted-foreground">
                            A filial selecionada no cabecalho determina quais dados sao exibidos.
                            O codigo da filial e mostrado em destaque para facil identificacao.
                        </p>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6">Tema</h3>
            <p className="text-sm text-muted-foreground">
                Alterne entre modo claro e escuro usando o icone de lua/sol no cabecalho da pagina.
            </p>
        </div>
    );
}
