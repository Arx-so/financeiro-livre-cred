export function Vendas() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Vendas</h2>
            <p className="text-muted-foreground">
                Gerencie vendas e produtos com clientes.
            </p>

            <h3 className="text-lg font-semibold text-foreground">Criar Nova Venda</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                    <strong>Título:</strong>
                    {' '}
                    Identificação da venda/produto
                </li>
                <li>
                    <strong>Cliente:</strong>
                    {' '}
                    Favorecido vinculado à venda
                </li>
                <li>
                    <strong>Tipo:</strong>
                    {' '}
                    Categoria da venda (produto, serviço, etc.)
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
                    Ativo, Pendente ou Encerrado
                </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Gestão de Documentos</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Upload de arquivos (PDF, imagens, etc.)</li>
                <li>Download dos documentos anexados</li>
                <li>Exclusão de arquivos</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6">Resumo</h3>
            <p className="text-sm text-muted-foreground">
                Visualize cards com o total de vendas, vendas ativas e valor total acumulado.
            </p>
        </div>
    );
}
