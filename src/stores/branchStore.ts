import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { Branch, UserRole } from '@/types/database';

export interface Unidade {
  id: string;
  name: string;
  code: string;
}

interface BranchState {
  unidadeAtual: Unidade | null;
  unidades: Unidade[];
  isLoadingBranches: boolean;

  // Actions
  setUnidadeAtual: (unidade: Unidade) => void;
  loadBranches: (userId: string, role: UserRole) => Promise<void>;
  clearBranches: () => void;
}

// Fetch user's accessible branches
const fetchUserBranches = async (userId: string, role: UserRole): Promise<Unidade[]> => {
    try {
        let branches: Branch[] = [];

        if (role === 'admin') {
            // Admins can access all branches
            const { data, error } = await supabase
                .from('branches')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            branches = data || [];
        } else {
            // Other users only see their assigned branches
            const { data, error } = await supabase
                .from('user_branch_access')
                .select(`
          branch_id,
          branches!inner (
            id,
            name,
            code,
            is_active
          )
        `)
                .eq('user_id', userId);

            if (error) throw error;

            branches = (data || [])
                .map((item: any) => item.branches)
                .filter((b: Branch) => b.is_active);
        }

        return branches.map((b) => ({
            id: b.id,
            name: b.name,
            code: b.code,
        }));
    } catch (error) {
        console.error('Error fetching user branches:', error);
        return [];
    }
};

export const useBranchStore = create<BranchState>()(
    persist(
        (set, get) => ({
            unidadeAtual: null,
            unidades: [],
            isLoadingBranches: false,

            setUnidadeAtual: (unidade) => {
                set({ unidadeAtual: unidade });
            },

            loadBranches: async (userId, role) => {
                set({ isLoadingBranches: true });

                try {
                    const branches = await fetchUserBranches(userId, role);
                    const currentUnidade = get().unidadeAtual;

                    // Check if current unidade is still valid
                    let newUnidadeAtual = currentUnidade;
                    if (currentUnidade) {
                        const found = branches.find((b) => b.id === currentUnidade.id);
                        if (!found) {
                            newUnidadeAtual = branches[0] || null;
                        }
                    } else {
                        newUnidadeAtual = branches[0] || null;
                    }

                    set({
                        unidades: branches,
                        unidadeAtual: newUnidadeAtual,
                        isLoadingBranches: false,
                    });
                } catch (error) {
                    console.error('Error loading branches:', error);
                    set({ isLoadingBranches: false });
                }
            },

            clearBranches: () => {
                set({
                    unidadeAtual: null,
                    unidades: [],
                });
            },
        }),
        {
            name: 'fincontrol_branch',
            partialize: (state) => ({
                unidadeAtual: state.unidadeAtual,
            }),
        }
    )
);

// Selectors for optimized re-renders
export const useUnidadeAtual = () => useBranchStore((state) => state.unidadeAtual);
export const useUnidades = () => useBranchStore((state) => state.unidades);
