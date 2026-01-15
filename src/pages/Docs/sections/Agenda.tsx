import { Lightbulb } from 'lucide-react';

export function Agenda() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Agenda</h2>
            <p className="text-muted-foreground">
                Gerencie lembretes, aniversários, festividades e feriados em um calendário visual.
            </p>

            <h3 className="text-lg font-semibold text-foreground">Tipos de Eventos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <h4 className="font-medium text-foreground">Lembretes</h4>
                    <p className="text-sm text-muted-foreground">
                        Crie lembretes para tarefas, reuniões ou compromissos
                    </p>
                </div>
                <div className="p-3 bg-income/10 rounded-lg border border-income/20">
                    <h4 className="font-medium text-foreground">Aniversários</h4>
                    <p className="text-sm text-muted-foreground">
                        Aniversários de clientes são exibidos automaticamente
                    </p>
                </div>
                <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                    <h4 className="font-medium text-foreground">Festividades</h4>
                    <p className="text-sm text-muted-foreground">
                        Datas comemorativas e eventos especiais
                    </p>
                </div>
                <div className="p-3 bg-expense/10 rounded-lg border border-expense/20">
                    <h4 className="font-medium text-foreground">Feriados</h4>
                    <p className="text-sm text-muted-foreground">
                        Feriados nacionais pré-cadastrados
                    </p>
                </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6">Criar Evento</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Título:</strong>
                    {' '}
                    Nome do evento
                </li>
                <li>
                    <strong>Tipo:</strong>
                    {' '}
                    Lembrete, Aniversário, Festividade ou Feriado
                </li>
                <li>
                    <strong>Data e Horário:</strong>
                    {' '}
                    Quando o evento acontece
                </li>
                <li>
                    <strong>Recorrência:</strong>
                    {' '}
                    Anual, Mensal, Semanal ou única vez
                </li>
                <li>
                    <strong>Lembrar antes:</strong>
                    {' '}
                    Dias de antecedência para notificação
                </li>
                <li>
                    <strong>Descrição:</strong>
                    {' '}
                    Detalhes adicionais do evento
                </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Aniversários Automáticos</h3>
            <p className="text-sm text-muted-foreground mb-3">
                Quando um favorecido tem data de nascimento cadastrada, seu aniversário aparece
                automaticamente no calendário com o ícone 🎂.
            </p>

            <div className="p-4 bg-muted rounded-lg">
                <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Dica</h4>
                        <p className="text-sm text-muted-foreground">
                            Clique em uma data no calendário para ver todos os eventos do dia
                            e adicionar novos eventos diretamente.
                        </p>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6">Notificações</h3>
            <p className="text-sm text-muted-foreground">
                O sino de notificações no cabeçalho exibe alertas de eventos próximos.
                Você pode marcar notificações como lidas ou excluí-las.
            </p>
        </div>
    );
}
