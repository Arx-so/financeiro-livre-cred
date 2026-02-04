export function Vendas() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Vendas</h2>
            <p className="text-muted-foreground">
                Gerencie vendas e produtos.
            </p>

            <h3 className="text-lg font-semibold text-foreground">Criar Nova Venda</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Título:</strong>
                    {' '}
                    Identificação da venda/contrato
                </li>
                <li>
                    <strong>Cliente:</strong>
                    {' '}
                    Favorecido vinculado à venda
                </li>
                <li>
                    <strong>Produto:</strong>
                    {' '}
                    Selecione um produto cadastrado (apenas produtos ativos aparecem)
                </li>
                <li>
                    <strong>Valor:</strong>
                    {' '}
                    Valor total da venda
                </li>
                <li>
                    <strong>Período:</strong>
                    {' '}
                    Data de início e término
                </li>
                <li>
                    <strong>Status:</strong>
                    {' '}
                    Criado, Em Aprovação, Aprovado, Ativo, Pendente ou Encerrado
                </li>
                <li>
                    <strong>Vendedor:</strong>
                    {' '}
                    Associe um vendedor responsável pela venda
                </li>
                <li>
                    <strong>Categoria:</strong>
                    {' '}
                    Quando um vendedor é selecionado, a categoria é automaticamente definida como &quot;Vendas&quot;
                </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Regras para Contratos de Vendas</h3>
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-2">
                    Quando um
                    {' '}
                    <strong>vendedor</strong>
                    {' '}
                    é selecionado no contrato:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>
                        ✅ A categoria é
                        {' '}
                        <strong>automaticamente definida como &quot;Vendas&quot;</strong>
                    </li>
                    <li>
                        ✅ O campo &quot;Tipo&quot; se torna um
                        {' '}
                        <strong>select de produtos</strong>
                        {' '}
                        (apenas produtos ativos)
                    </li>
                    <li>
                        📌 Para contratos sem vendedor, a categoria e tipo podem ser escolhidos livremente
                    </li>
                </ul>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6">Fluxo de Aprovação</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Criar contrato e enviar para aprovação</li>
                <li>Gerentes e Admins podem aprovar ou rejeitar</li>
                <li>Após aprovação, o contrato pode ser assinado</li>
                <li>
                    ⚠️
                    {' '}
                    <strong>Contratos aprovados NÃO podem ser editados nem excluídos</strong>
                </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Gestão de Documentos</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Upload de arquivos (PDF, imagens, etc.)</li>
                <li>Download dos documentos anexados</li>
                <li>Exportação do contrato em PDF usando templates</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Produtos</h3>
            <p className="text-sm text-muted-foreground mb-3">
                Cadastro de produtos com informações de valores e comissões:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Nome e Descrição:</strong>
                    {' '}
                    Identificação do produto
                </li>
                <li>
                    <strong>Categoria:</strong>
                    {' '}
                    Organização por categorias
                </li>
                <li>
                    <strong>Valores:</strong>
                    {' '}
                    Valor do banco, percentual do banco, valor da empresa e percentual da empresa
                </li>
                <li>
                    <strong>Status:</strong>
                    {' '}
                    Ativo ou Inativo
                </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Resumo</h3>
            <p className="text-sm text-muted-foreground">
                Visualize cards com o total de vendas, vendas ativas, pendentes e valor total acumulado.
            </p>
        </div>
    );
}
