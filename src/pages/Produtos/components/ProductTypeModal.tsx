import { CreditCard, Package, Lock } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { PRODUCT_TYPES } from '@/constants/products';

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    generico: Package,
    cartao_credito: CreditCard,
    fgts: Package,
    consignado: Package,
};

interface ProductTypeModalProps {
    open: boolean;
    onSelect: (type: string) => void;
    onClose: () => void;
}

export function ProductTypeModal({ open, onSelect, onClose }: ProductTypeModalProps) {
    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Qual tipo de produto deseja cadastrar?</DialogTitle>
                    <DialogDescription>
                        Cada tipo possui campos específicos destacados no formulário.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {PRODUCT_TYPES.map((pt) => {
                        const Icon = TYPE_ICONS[pt.value] || Package;
                        return (
                            <button
                                key={pt.value}
                                type="button"
                                disabled={!pt.available}
                                onClick={() => pt.available && onSelect(pt.value)}
                                className={[
                                    'relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all',
                                    pt.available
                                        ? 'border-border hover:border-primary hover:bg-primary/5 cursor-pointer'
                                        : 'border-border bg-muted/40 cursor-not-allowed opacity-60',
                                ].join(' ')}
                            >
                                {!pt.available && (
                                    <span className="absolute top-2 right-2 flex items-center gap-1 text-xs text-muted-foreground font-medium bg-muted rounded-full px-2 py-0.5">
                                        <Lock className="w-3 h-3" />
                                        Em breve
                                    </span>
                                )}
                                <div className={[
                                    'p-2 rounded-lg',
                                    pt.available ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                                ].join(' ')}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{pt.label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{pt.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
