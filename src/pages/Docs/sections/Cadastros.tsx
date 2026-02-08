import { AlertCircle, Lightbulb } from 'lucide-react';

export function Cadastros() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Cadastros</h2>
            <p className="text-muted-foreground">
                Gerenciamento de dados mestres do sistema.
            </p>

            <h3 className="text-lg font-semibold text-foreground">Favorecidos (Clientes/Fornecedores)</h3>
            <p className="text-sm text-muted-foreground mb-3">Cadastre pessoas fisicas ou juridicas:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Dados Basicos:</strong>
                    {' '}
                    Nome, CPF/CNPJ, tipo (Cliente, Fornecedor, Funcionario, Outro)
                </li>
                <li>
                    <strong>Contato:</strong>
                    {' '}
                    E-mail, telefone
                </li>
                <li>
                    <strong>Endereco:</strong>
                    {' '}
                    CEP (preenchimento automatico), rua, cidade, etc.
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
                    Para lembretes de aniversario na agenda
                </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Dados Bancarios do Favorecido</h3>
            <p className="text-sm text-muted-foreground mb-3">Cadastre informacoes bancarias para pagamentos:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Banco, Agencia e Conta:</strong>
                    {' '}
                    Para transferencias TED/DOC
                </li>
                <li>
                    <strong>Tipo de Conta:</strong>
                    {' '}
                    Corrente ou Poupanca
                </li>
                <li>
                    <strong>Chave PIX:</strong>
                    {' '}
                    CPF, CNPJ, E-mail, Telefone ou Chave Aleatoria
                </li>
                <li>
                    <strong>Forma de Pagamento Preferida:</strong>
                    {' '}
                    PIX, TED, Boleto, Cartao ou Dinheiro
                </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Historico de Atividades</h3>
            <p className="text-sm text-muted-foreground mb-3">
                Cada favorecido possui um historico de atividades que registra automaticamente:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Criacao e edicao do cadastro</li>
                <li>Upload e remocao de documentos</li>
                <li>Alteracoes de dados</li>
                <li>Usuario e data/hora de cada acao</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Categorias</h3>
            <p className="text-sm text-muted-foreground mb-3">Organize seus lancamentos por categorias:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Nome e Cor:</strong>
                    {' '}
                    Para identificacao visual
                </li>
                <li>
                    <strong>Tipo:</strong>
                    {' '}
                    Receita, Despesa ou Ambos
                </li>
                <li>
                    <strong>Subcategorias:</strong>
                    {' '}
                    Crie subdivisoes mais especificas
                </li>
                <li>
                    <strong>Recorrencia padrao:</strong>
                    {' '}
                    Defina se a categoria e recorrente por padrao
                </li>
            </ul>

            <div className="p-4 bg-muted rounded-lg">
                <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Dica</h4>
                        <p className="text-sm text-muted-foreground">
                            Ao selecionar uma categoria com recorrencia padrao em um lancamento,
                            os campos de recorrencia sao preenchidos automaticamente.
                        </p>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6">Filiais (Admin)</h3>
            <p className="text-sm text-muted-foreground mb-3">Gerencie as unidades da empresa:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Nome da filial e Codigo</li>
                <li>Endereco completo</li>
                <li>Telefone de contato</li>
                <li>Ativar/Desativar filiais</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Contas Bancarias (Admin/Gerente)</h3>
            <p className="text-sm text-muted-foreground mb-3">Cadastre as contas da empresa:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Nome (identificacao da conta)</li>
                <li>Banco, Agencia e Conta</li>
                <li>Saldo Inicial (para conciliacao)</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Usuarios (Admin)</h3>
            <p className="text-sm text-muted-foreground mb-3">Gerencie os usuarios do sistema:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Visualizar usuarios:</strong>
                    {' '}
                    Lista de todos os usuarios cadastrados
                </li>
                <li>
                    <strong>Alterar funcao:</strong>
                    {' '}
                    Admin, Gerente, Vendas, Financeiro ou Usuario
                </li>
                <li>
                    <strong>Filiais permitidas:</strong>
                    {' '}
                    Defina quais filiais cada usuario pode acessar
                </li>
            </ul>

            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 mt-4">
                <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-foreground">Importante</h4>
                        <p className="text-sm text-muted-foreground">
                            Administradores tem acesso a todas as filiais automaticamente.
                            Gerentes e usuarios so veem dados das filiais atribuidas a eles.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
