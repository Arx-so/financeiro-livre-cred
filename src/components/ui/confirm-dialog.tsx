import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  isLoading = false,
  variant = 'destructive',
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook for easier usage
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<(() => void | Promise<void>) | null>(null);
  const [config, setConfig] = React.useState({
    title: 'Confirmar ação',
    description: 'Tem certeza que deseja continuar?',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'destructive' as 'default' | 'destructive',
  });

  const confirm = React.useCallback((
    action: () => void | Promise<void>,
    options?: Partial<typeof config>
  ) => {
    setPendingAction(() => action);
    setConfig(prev => ({ ...prev, ...options }));
    setIsOpen(true);
  }, []);

  const handleConfirm = React.useCallback(async () => {
    if (pendingAction) {
      await pendingAction();
    }
    setPendingAction(null);
  }, [pendingAction]);

  const handleOpenChange = React.useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setPendingAction(null);
    }
  }, []);

  return {
    isOpen,
    confirm,
    dialogProps: {
      open: isOpen,
      onOpenChange: handleOpenChange,
      onConfirm: handleConfirm,
      ...config,
    },
  };
}
