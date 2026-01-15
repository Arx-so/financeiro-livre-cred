import { AlertCircle, Lightbulb } from 'lucide-react';

export function Cadastros() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Cadastros</h2>
            <p className="text-muted-foreground">
                Gerenciamento de dados mestres do sistema.
            </p>

            <h3 className="text-lg font-semibold text-foreground">Favorecidos (Clientes/Fornecedores)</h3>
            <p className="text-sm text-muted-foreground mb-3">Cadastre pessoas físicas ou jurídicas:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Dados Básicos:</strong>
                    {' '}
                    Nome, CPF/CNPJ, tipo (Cliente, Fornecedor, Funcionário, Outro)
                </li>
                <li>
                    <strong>Contato:</strong>
                    {' '}
                    E-mail, telefone
                </li>
                <li>
                    <strong>Endereço:</strong>
                    {' '}
                    CEP (preenchimento automático), rua, cidade, etc.
                </li>
                <li>
                    <strong>Foto:</strong>
                    {' '}
                    Upload de imagem do cadastro
                </li>
                <li>
                    <strong>Documentos:</strong>
                    {' '}
                    Anexe contratos, comprovantes, etc.
                </li>
                <li>
                    <strong>Data de Nascimento:</strong>
                    {' '}
                    Para lembretes de aniversário na agenda
                </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Dados Bancários do Favorecido</h3>
            <p className="text-sm text-muted-foreground mb-3">Cadastre informações bancárias para pagamentos:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Banco, Agência e Conta:</strong>
                    {' '}
                    Para transferências TED/DOC
                </li>
                <li>
                    <strong>Tipo de Conta:</strong>
                    {' '}
                    Corrente ou Poupança
                </li>
                <li>
                    <strong>Chave PIX:</strong>
                    {' '}
                    CPF, CNPJ, E-mail, Telefone ou Chave Aleatória
                </li>
                <li>
                    <strong>Forma de Pagamento Preferida:</strong>
                    {' '}
                    PIX, TED, Boleto, Cartão ou Dinheiro
                </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Histórico de Atividades</h3>
            <p className="text-sm text-muted-foreground mb-3">
                Cada favorecido possui um histórico de atividades que registra automaticamente:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Criação e edição do cadastro</li>
                <li>Upload e remoção de documentos</li>
                <li>Alterações de dados</li>
                <li>Usuário e data/hora de cada ação</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Categorias</h3>
            <p className="text-sm text-muted-foreground mb-3">Organize seus lançamentos por categorias:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Nome e Cor:</strong>
                    {' '}
                    Para identificação visual
                </li>
                <li>
                    <strong>Tipo:</strong>
                    {' '}
                    Receita, Despesa ou Ambos
                </li>
                <li>
                    <strong>Subcategorias:</strong>
                    {' '}
                    Crie subdivisões mais específicas
                </li>
                <li>
                    <strong>Recorrência padrão:</strong>
                    {' '}
                    Defina se a categoria é recorrente por padrão
                </li>
            </ul>

            <div className="p-4 bg-muted rounded-lg">
                <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Dica</h4>
                        <p className="text-sm text-muted-foreground">
                            Ao selecionar uma categoria com recorrência padrão em um lançamento,
                            os campos de recorrência são preenchidos automaticamente.
                        </p>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6">Filiais (Admin)</h3>
            <p className="text-sm text-muted-foreground mb-3">Gerencie as unidades da empresa:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Nome da filial e Código</li>
                <li>Endereço completo</li>
                <li>Telefone de contato</li>
                <li>Ativar/Desativar filiais</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Contas Bancárias (Admin/Gerente)</h3>
            <p className="text-sm text-muted-foreground mb-3">Cadastre as contas da empresa:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Nome (identificação da conta)</li>
                <li>Banco, Agência e Conta</li>
                <li>Saldo Inicial (para conciliação)</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Usuários (Admin)</h3>
            <p className="text-sm text-muted-foreground mb-3">Gerencie os usuários do sistema:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Visualizar usuários:</strong>
                    {' '}
                    Lista de todos os usuários cadastrados
                </li>
                <li>
                    <strong>Alterar função:</strong>
                    {' '}
                    Admin, Gerente ou Usuário
                </li>
                <li>
                    <strong>Filiais permitidas:</strong>
                    {' '}
                    Defina quais filiais cada usuário pode acessar
                </li>
            </ul>

            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 mt-4">
                <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Importante</h4>
                        <p className="text-sm text-muted-foreground">
                            Administradores têm acesso a todas as filiais automaticamente.
                            Gerentes e Usuários só veem dados das filiais atribuídas a eles.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
