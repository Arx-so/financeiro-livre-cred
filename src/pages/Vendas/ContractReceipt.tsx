import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    TERMINAL_LABELS, CARD_BRAND_LABELS, PAYMENT_METHOD_LABELS, TRANSFER_SOURCE_LABELS,
} from '@/constants/sales';

interface ContractReceiptProps {
    contract: any;
    branchName?: string;
    open: boolean;
    onClose: () => void;
}

function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(date: string): string {
    try {
        const d = date.includes('T') ? new Date(date) : new Date(`${date}T00:00:00`);
        return format(d, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
        return date;
    }
}

export function ContractReceipt({
    contract, branchName, open, onClose,
}: ContractReceiptProps) {
    const terminalAmount = contract.value ?? 0;
    const saleValue = contract.cc_amount_released ?? terminalAmount;
    const fee = terminalAmount - saleValue;
    const feePercent = saleValue > 0 ? ((fee / saleValue) * 100).toFixed(1) : '0';

    const handlePrint = () => window.print();

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Recibo de Venda</DialogTitle>
                </DialogHeader>

                {/* Printable area */}
                <div id="receipt-print" className="border rounded-lg p-6 font-mono text-sm space-y-4">
                    <div className="text-center border-b pb-4">
                        <h2 className="text-lg font-bold">LIVRECRED</h2>
                        {branchName && <p className="text-xs text-muted-foreground">{branchName}</p>}
                        <p className="text-xs font-semibold mt-1">NOTA DE VENDA</p>
                    </div>

                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Data:</span>
                            <span>{formatDate(contract.start_date ?? contract.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Vendedor:</span>
                            <span>{contract.seller?.name ?? '—'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Cliente:</span>
                            <span>{contract.favorecido?.name ?? '—'}</span>
                        </div>
                    </div>

                    <div className="border-t pt-3 space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Terminal:</span>
                            <span>{TERMINAL_LABELS[contract.cc_terminal] ?? contract.cc_terminal ?? '—'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Bandeira:</span>
                            <span>{CARD_BRAND_LABELS[contract.cc_card_brand] ?? contract.cc_card_brand ?? '—'}</span>
                        </div>
                        {contract.cc_card_last_four && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Cartão:</span>
                                <span>
                                    {'**** '}
                                    {contract.cc_card_last_four}
                                </span>
                            </div>
                        )}
                        {contract.cc_card_holder_name && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Titular:</span>
                                <span>{contract.cc_card_holder_name}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-3 space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Valor da venda:</span>
                            <span className="font-semibold">{formatCurrency(saleValue)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Taxa (
                                {feePercent}
                                %):
                            </span>
                            <span>{formatCurrency(fee)}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                            <span>Valor maquineta:</span>
                            <span>{formatCurrency(terminalAmount)}</span>
                        </div>
                    </div>

                    <div className="border-t pt-3 text-xs space-y-1">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Forma de pagamento:</span>
                            <span>{PAYMENT_METHOD_LABELS[contract.cc_payment_method] ?? contract.cc_payment_method ?? '—'}</span>
                        </div>
                        {contract.cc_payment_account && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Conta:</span>
                                <span>{TRANSFER_SOURCE_LABELS[contract.cc_payment_account] ?? contract.cc_payment_account}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-3 text-center text-xs text-muted-foreground">
                        <p>
                            {'Nº '}
                            {contract.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="mt-2">________________________</p>
                        <p>Assinatura do Cliente</p>
                    </div>
                </div>

                <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={onClose}>Fechar</Button>
                    <Button onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
