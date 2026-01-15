import { Edit, User, Mail, Clock } from 'lucide-react';
import { getRoleText, getRoleBadgeClass } from '@/services/users';

interface UserCardProps {
    userProfile: any;
    currentUserId?: string;
    onEdit: () => void;
}

export function UserCard({ userProfile, currentUserId, onEdit }: UserCardProps) {
    return (
        <div className="card-financial p-5 group">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {userProfile.avatar_url ? (
                        <img
                            src={userProfile.avatar_url}
                            alt={userProfile.name}
                            className="w-12 h-12 rounded-xl object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-foreground">{userProfile.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeClass(userProfile.role)}`}>
                            {getRoleText(userProfile.role)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{userProfile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                        Cadastrado em
                        {' '}
                        {new Date(userProfile.created_at).toLocaleDateString('pt-BR')}
                    </span>
                </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <button
                    className="btn-secondary flex-1 py-2"
                    onClick={onEdit}
                    disabled={userProfile.id === currentUserId}
                >
                    <Edit className="w-4 h-4" />
                    {userProfile.id === currentUserId ? 'Você' : 'Gerenciar'}
                </button>
            </div>
        </div>
    );
}
