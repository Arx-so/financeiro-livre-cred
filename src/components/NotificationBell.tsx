import { useState } from 'react';
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    Cake,
    CalendarDays,
    PartyPopper,
    Info,
    Loader2,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores';
import {
    useUnreadNotifications,
    useUnreadCount,
    useMarkAsRead,
    useMarkAllAsRead,
    useDeleteNotification
} from '@/hooks/useNotifications';

export function NotificationBell() {
    const user = useAuthStore((state) => state.user);
    const [isOpen, setIsOpen] = useState(false);

    const { data: notifications, isLoading } = useUnreadNotifications(user?.id || '');
    const { data: unreadCount } = useUnreadCount(user?.id || '');
    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();
    const deleteNotification = useDeleteNotification();

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await markAsRead.mutateAsync(id);
    };

    const handleMarkAllAsRead = async () => {
        if (user?.id) {
            await markAllAsRead.mutateAsync(user.id);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await deleteNotification.mutateAsync(id);
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'aniversario':
                return <Cake className="w-4 h-4 text-income" />;
            case 'festividade':
                return <PartyPopper className="w-4 h-4 text-pending" />;
            case 'feriado':
                return <CalendarDays className="w-4 h-4 text-expense" />;
            case 'lembrete':
                return <Bell className="w-4 h-4 text-primary" />;
            default:
                return <Info className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins}min`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    {(unreadCount || 0) > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full px-1">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                    <h3 className="font-semibold text-foreground text-sm">Notificações</h3>
                    {(notifications?.length || 0) > 0 && (
                        <button
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                            onClick={handleMarkAllAsRead}
                            disabled={markAllAsRead.isPending}
                        >
                            {markAllAsRead.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <CheckCheck className="w-3 h-3" />
                            )}
                            Marcar todas
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[300px] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : (notifications?.length || 0) === 0 ? (
                        <div className="text-center py-8 px-4">
                            <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                        </div>
                    ) : (
                        notifications?.map((notification) => (
                            <div
                                key={notification.id}
                                className="px-3 py-2 hover:bg-muted/50 border-b border-border last:border-0 cursor-pointer"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground line-clamp-2">
                                            {notification.title}
                                        </p>
                                        {notification.message && (
                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                {notification.message}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatTimeAgo(notification.created_at)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button
                                            className="p-1 hover:bg-income/10 rounded"
                                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                                            title="Marcar como lida"
                                            disabled={markAsRead.isPending}
                                        >
                                            <Check className="w-3 h-3 text-income" />
                                        </button>
                                        <button
                                            className="p-1 hover:bg-destructive/10 rounded"
                                            onClick={(e) => handleDelete(notification.id, e)}
                                            title="Excluir"
                                            disabled={deleteNotification.isPending}
                                        >
                                            <Trash2 className="w-3 h-3 text-destructive" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {(notifications?.length || 0) > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <a
                            href="/agenda"
                            className="block text-center py-2 text-sm text-primary hover:underline"
                            onClick={() => setIsOpen(false)}
                        >
                            Ver agenda completa
                        </a>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
