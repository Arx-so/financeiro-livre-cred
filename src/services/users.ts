import { supabase } from '@/lib/supabase';
import type {
    Profile, ProfileUpdate, UserRole, UserBranchAccess, Branch
} from '@/types/database';

export interface UserFilters {
  role?: UserRole;
  search?: string;
  isActive?: boolean;
}

export interface UserWithBranches extends Profile {
  branches: Branch[];
}

// Get all users (admin only)
export async function getUsers(filters: UserFilters = {}): Promise<Profile[]> {
    let query = supabase
        .from('profiles')
        .select('*')
        .order('name');

    if (filters.role) {
        query = query.eq('role', filters.role);
    }

    if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching users:', error);
        throw error;
    }

    return data || [];
}

// Get single user with branches
export async function getUserWithBranches(userId: string): Promise<UserWithBranches | null> {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profileError) {
        console.error('Error fetching user:', profileError);
        throw profileError;
    }

    if (!profile) return null;

    // Get user's branch access
    const { data: branchAccess, error: accessError } = await supabase
        .from('user_branch_access')
        .select('branch_id')
        .eq('user_id', userId);

    if (accessError) {
        console.error('Error fetching branch access:', accessError);
        throw accessError;
    }

    // Get branch details
    const branchIds = (branchAccess || []).map((a) => a.branch_id);
    let branches: Branch[] = [];

    if (branchIds.length > 0) {
        const { data: branchData, error: branchError } = await supabase
            .from('branches')
            .select('*')
            .in('id', branchIds);

        if (branchError) {
            console.error('Error fetching branches:', branchError);
            throw branchError;
        }

        branches = branchData || [];
    }

    return {
        ...profile,
        branches,
    };
}

// Update user profile
export async function updateUser(userId: string, data: ProfileUpdate): Promise<Profile> {
    const { data: updated, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating user:', error);
        throw error;
    }

    return updated;
}

// Update user role
export async function updateUserRole(userId: string, role: UserRole): Promise<Profile> {
    return updateUser(userId, { role });
}

// Get user branch access
export async function getUserBranchAccess(userId: string): Promise<UserBranchAccess[]> {
    const { data, error } = await supabase
        .from('user_branch_access')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching branch access:', error);
        throw error;
    }

    return data || [];
}

// Set user branch access (replaces all existing access)
export async function setUserBranchAccess(userId: string, branchIds: string[]): Promise<void> {
    // First, remove all existing access
    const { error: deleteError } = await supabase
        .from('user_branch_access')
        .delete()
        .eq('user_id', userId);

    if (deleteError) {
        console.error('Error removing branch access:', deleteError);
        throw deleteError;
    }

    // Then, add new access
    if (branchIds.length > 0) {
        const accessRecords = branchIds.map((branchId) => ({
            user_id: userId,
            branch_id: branchId,
        }));

        const { error: insertError } = await supabase
            .from('user_branch_access')
            .insert(accessRecords);

        if (insertError) {
            console.error('Error adding branch access:', insertError);
            throw insertError;
        }
    }
}

// Add branch access for a user
export async function addUserBranchAccess(userId: string, branchId: string): Promise<UserBranchAccess> {
    const { data, error } = await supabase
        .from('user_branch_access')
        .insert({ user_id: userId, branch_id: branchId })
        .select()
        .single();

    if (error) {
        console.error('Error adding branch access:', error);
        throw error;
    }

    return data;
}

// Remove branch access for a user
export async function removeUserBranchAccess(userId: string, branchId: string): Promise<void> {
    const { error } = await supabase
        .from('user_branch_access')
        .delete()
        .eq('user_id', userId)
        .eq('branch_id', branchId);

    if (error) {
        console.error('Error removing branch access:', error);
        throw error;
    }
}

// Invite new user (creates auth user and profile)
// Note: This requires admin privileges and may need Supabase Admin API
export async function inviteUser(email: string, name: string, role: UserRole, branchIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
    // Use Supabase auth admin API to invite user
    // Note: This requires the service role key, which should be handled server-side
    // For now, we'll use the standard signUp with a generated password
        const tempPassword = crypto.randomUUID();

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                name,
                role,
            },
        });

        if (authError) {
            console.error('Error creating user:', authError);
            return { success: false, error: authError.message };
        }

        if (!authData.user) {
            return { success: false, error: 'Falha ao criar usuário' };
        }

        // The profile should be created automatically by the trigger
        // Wait a bit for the trigger to execute
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Update the role if needed
        if (role !== 'usuario') {
            await updateUserRole(authData.user.id, role);
        }

        // Set branch access
        if (branchIds.length > 0) {
            await setUserBranchAccess(authData.user.id, branchIds);
        }

        // Send password reset email so user can set their password
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (resetError) {
            console.error('Error sending reset email:', resetError);
            // Don't fail the whole operation, just log
        }

        return { success: true };
    } catch (error) {
        console.error('Error inviting user:', error);
        return { success: false, error: 'Erro ao convidar usuário' };
    }
}

// Get role display text in Portuguese
export function getRoleText(role: UserRole): string {
    const roleTexts: Record<UserRole, string> = {
        admin: 'Administrador',
        gerente: 'Gerente',
        usuario: 'Usuário',
        financeiro: 'Financeiro',
        vendas: 'Vendas',
        leitura: 'Leitura',
    };

    return roleTexts[role] || role;
}

// Get role badge color class
export function getRoleBadgeClass(role: UserRole): string {
    const classes: Record<UserRole, string> = {
        admin: 'bg-expense-muted text-expense',
        gerente: 'bg-pending-muted text-pending',
        usuario: 'bg-muted text-muted-foreground',
        financeiro: 'bg-primary/10 text-primary',
        vendas: 'bg-income-muted text-income',
        leitura: 'bg-muted text-muted-foreground',
    };

    return classes[role] || 'bg-muted text-muted-foreground';
}

// Create new user using a separate Supabase client to avoid affecting current session
export async function createUser(
    email: string,
    password: string,
    name: string,
    role: UserRole,
    branchIds: string[]
): Promise<{ success: boolean; error?: string; userId?: string }> {
    try {
        // First, check if user already exists by email
        const { data: existingProfiles } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', email)
            .limit(1);

        if (existingProfiles && existingProfiles.length > 0) {
            return { success: false, error: 'Este email já está cadastrado no sistema' };
        }

        // Import createClient dynamically to create a separate instance
        const { createClient } = await import('@supabase/supabase-js');

        // Create a separate Supabase client for user creation
        // This won't affect the current admin session
        const signupClient = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                    detectSessionInUrl: false,
                    // Use a separate storage key to not interfere with main client
                    storageKey: 'supabase-signup-temp',
                },
            }
        );

        // Create the user with the separate client
        const { data: authData, error: authError } = await signupClient.auth.signUp({
            email,
            password,
            options: {
                data: { name },
                // Don't require email confirmation for admin-created users
                emailRedirectTo: `${window.location.origin}/login`,
            },
        });

        if (authError) {
            console.error('Error creating user:', authError);
            return { success: false, error: authError.message };
        }

        if (!authData.user) {
            return { success: false, error: 'Falha ao criar usuário' };
        }

        const userId = authData.user.id;

        // Sign out from the temporary client immediately
        await signupClient.auth.signOut();

        // Wait for the trigger to create the profile
        await new Promise((resolve) => { setTimeout(resolve, 1500); });

        // Check if profile was created
        let { data: profileCheck } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .single();

        if (!profileCheck) {
            // Profile not created yet, try to create it manually
            console.log('Profile not created by trigger, creating manually...');
            const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    email,
                    name,
                    role,
                });

            if (insertError) {
                console.error('Error creating profile manually:', insertError);
                return {
                    success: false,
                    error: insertError.message || 'Não foi possível criar o perfil do usuário. Tente novamente.',
                    userId,
                };
            }
            profileCheck = { id: userId };
        } else {
            // Update the role and name using the main client (as admin)
            const { error: roleError } = await supabase
                .from('profiles')
                .update({ role, name })
                .eq('id', userId);

            if (roleError) {
                console.error('Error updating role:', roleError);
            }
        }

        // Only set branch access after we're sure the profile exists (avoids user_branch_access_user_id_fkey)
        if (profileCheck && branchIds.length > 0) {
            await setUserBranchAccess(userId, branchIds);

            // Check which branches already have a favorecido for this user (e.g. created by DB trigger)
            const { data: existingFavorecidos } = await supabase
                .from('favorecidos')
                .select('branch_id')
                .eq('user_id', userId);

            const existingBranchIds = new Set((existingFavorecidos || []).map((f) => f.branch_id));
            const missingBranchIds = branchIds.filter((id) => !existingBranchIds.has(id));

            if (missingBranchIds.length > 0) {
                const favorecidoInserts = missingBranchIds.map((branchId) => ({
                    branch_id: branchId,
                    name,
                    email,
                    type: 'funcionario' as const,
                    user_id: userId,
                }));

                const { error: favorecidoError } = await supabase
                    .from('favorecidos')
                    .insert(favorecidoInserts);

                if (favorecidoError) {
                    console.error('Error creating favorecidos for branches:', favorecidoError);
                }
            }
        }

        // Check if email confirmation is required
        // identities.length === 0 means email is not confirmed yet
        const needsConfirmation = authData.user.identities?.length === 0
            || authData.user.email_confirmed_at === null;

        if (needsConfirmation) {
            return {
                success: true,
                userId,
                error: 'Usuário criado! O email de confirmação foi enviado para o novo usuário.'
            };
        }

        return { success: true, userId };
    } catch (error) {
        console.error('Error creating user:', error);
        return { success: false, error: 'Erro ao criar usuário. Verifique o console.' };
    }
}
