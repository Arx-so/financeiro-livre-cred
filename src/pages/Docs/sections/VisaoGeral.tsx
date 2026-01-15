import {
    CheckCircle2,
    Building2,
    Repeat,
    BarChart3,
    Lightbulb
} from 'lucide-react';

export function VisaoGeral() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Bem-vindo ao Fiscal Compass!</h2>
            <p className="text-muted-foreground">
                O Fiscal Compass é um sistema completo de gestão financeira empresarial que permite controlar
                todas as operações financeiras da sua empresa de forma simples e eficiente.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-income/10 rounded-lg border border-income/20">
                    <CheckCircle2 className="w-6 h-6 text-income mb-2" />
                    <h4 className="font-semibold text-foreground">Controle de Receitas e Despesas</h4>
                    <p className="text-sm text-muted-foreground">Registre e acompanhe todos os lançamentos financeiros</p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <Building2 className="w-6 h-6 text-primary mb-2" />
                    <h4 className="font-semibold text-foreground">Múltiplas Filiais</h4>
                    <p className="text-sm text-muted-foreground">Gerencie várias unidades em um único sistema</p>
                </div>
                <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                    <Repeat className="w-6 h-6 text-warning mb-2" />
                    <h4 className="font-semibold text-foreground">Lançamentos Recorrentes</h4>
                    <p className="text-sm text-muted-foreground">Automatize despesas e receitas que se repetem</p>
                </div>
                <div className="p-4 bg-info/10 rounded-lg border border-info/20">
                    <BarChart3 className="w-6 h-6 text-info mb-2" />
                    <h4 className="font-semibold text-foreground">Relatórios Completos</h4>
                    <p className="text-sm text-muted-foreground">Análises detalhadas para tomada de decisão</p>
                </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
                <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Dica: Seletor de Filial</h4>
                        <p className="text-sm text-muted-foreground">
                            Use o seletor no topo da página para alternar entre as filiais.
                            Todos os dados exibidos serão filtrados pela unidade selecionada.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
