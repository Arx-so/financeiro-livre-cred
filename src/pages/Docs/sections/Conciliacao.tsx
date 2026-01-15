import { CheckCircle2, FileText } from 'lucide-react';

export function Conciliacao() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Conciliação Bancária</h2>
            <p className="text-muted-foreground">
                Compare extratos bancários com lançamentos do sistema para garantir que todos os
                valores estão corretamente registrados.
            </p>

            <h3 className="text-lg font-semibold text-foreground">Como Usar</h3>
            <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
                <li>
                    <strong>Selecione a Conta Bancária</strong>
                    <p className="ml-5 mt-1">Escolha a conta que deseja conciliar no seletor.</p>
                </li>
                <li>
                    <strong>Importe o Extrato</strong>
                    <p className="ml-5 mt-1">
                        Clique em &quot;Importar Extrato&quot; e selecione um arquivo Excel (.xlsx) ou CSV.
                    </p>
                </li>
                <li>
                    <strong>Concilie os Itens</strong>
                    <p className="ml-5 mt-1">Para cada item do extrato, vincule ao lançamento correspondente no sistema.</p>
                </li>
            </ol>

            <h3 className="text-lg font-semibold text-foreground mt-6">Formato do Arquivo de Extrato</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border rounded-lg">
                    <thead className="bg-muted">
                        <tr>
                            <th className="py-2 px-3 text-left font-medium text-foreground">Data</th>
                            <th className="py-2 px-3 text-left font-medium text-foreground">Descricao</th>
                            <th className="py-2 px-3 text-left font-medium text-foreground">Valor</th>
                            <th className="py-2 px-3 text-left font-medium text-foreground">Tipo</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t border-border">
                            <td className="py-2 px-3 text-muted-foreground">2026-01-05</td>
                            <td className="py-2 px-3 text-muted-foreground">PIX RECEBIDO</td>
                            <td className="py-2 px-3 text-muted-foreground">1500.00</td>
                            <td className="py-2 px-3 text-muted-foreground">credito</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6">Ações Disponíveis</h3>
            <div className="space-y-3">
                <div className="flex gap-3 p-3 bg-income/10 rounded-lg border border-income/20">
                    <CheckCircle2 className="w-5 h-5 text-income shrink-0" />
                    <div>
                        <h4 className="font-medium text-foreground">Conciliar</h4>
                        <p className="text-sm text-muted-foreground">Vincule um item do extrato ao lançamento correspondente</p>
                    </div>
                </div>
                <div className="flex gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <div>
                        <h4 className="font-medium text-foreground">Criar Lançamento</h4>
                        <p className="text-sm text-muted-foreground">Crie um novo lançamento a partir de um item do extrato sem correspondência</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
