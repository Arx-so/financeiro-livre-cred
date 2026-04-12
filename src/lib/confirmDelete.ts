import { toast } from 'sonner';

export function confirmDelete(
    message: string,
    onConfirm: () => void,
): void {
    toast(message, {
        action: {
            label: 'Remover',
            onClick: onConfirm,
        },
        cancel: {
            label: 'Cancelar',
            onClick: () => {},
        },
        duration: 8000,
    });
}
