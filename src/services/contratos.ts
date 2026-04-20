import { supabase } from '@/lib/supabase';
import type {
    Contract,
    ContractInsert,
    ContractUpdate,
    ContractFile,
    ContractFileInsert,
    ContractStatus,
    Product,
    FinancialEntryInsert,
} from '@/types/database';
import { createFinancialEntries } from '@/services/financeiro';

export interface ContractWithRelations extends Contract {
  favorecido?: { id: string; name: string } | null;
  category?: { id: string; name: string; color: string } | null;
  product?: { id: string; name: string; code: string | null } | null;
  seller?: { id: string; name: string } | null;
  approver?: { id: string; name: string } | null;
  creator?: { id: string; name: string } | null;
  files?: ContractFile[];
}

export interface ContractFilters {
  branchId?: string;
  status?: ContractStatus;
  favorecidoId?: string;
  productId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// Get all contracts with filters
export async function getContracts(filters: ContractFilters = {}): Promise<ContractWithRelations[]> {
    let query = supabase
        .from('contracts')
        .select(`
            *,
            favorecido:favorecidos!favorecido_id(id, name),
            category:categories!category_id(id, name, color),
            product:products!product_id(id, name, code),
            seller:profiles!seller_id(id, name, email),
            approver:profiles!approved_by(id, name),
            creator:profiles!created_by(id, name),
            files:contract_files(*)
        `)
        .order('created_at', { ascending: false });

    if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
    }

    if (filters.status) {
        query = query.eq('status', filters.status);
    }

    if (filters.favorecidoId) {
        query = query.eq('favorecido_id', filters.favorecidoId);
    }

    if (filters.productId) {
        query = query.eq('product_id', filters.productId);
    }

    if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%`);
    }

    if (filters.startDate) {
        query = query.gte('start_date', filters.startDate);
    }

    if (filters.endDate) {
        query = query.lte('end_date', filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching contracts:', error);
        throw error;
    }

    return data || [];
}

// Get single contract
export async function getContract(id: string): Promise<ContractWithRelations | null> {
    const { data, error } = await supabase
        .from('contracts')
        .select(`
            *,
            favorecido:favorecidos!favorecido_id(id, name),
            category:categories!category_id(id, name, color),
            product:products!product_id(id, name, code),
            seller:profiles!seller_id(id, name, email),
            approver:profiles!approved_by(id, name),
            creator:profiles!created_by(id, name),
            files:contract_files(*)
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching contract:', error);
        throw error;
    }

    return data;
}

// Create contract
export async function createContract(contract: ContractInsert): Promise<Contract> {
    const { data, error } = await supabase
        .from('contracts')
        .insert(contract)
        .select()
        .single();

    if (error) {
        console.error('Error creating contract:', error);
        throw error;
    }

    return data;
}

// Update contract
export async function updateContract(id: string, contract: ContractUpdate): Promise<Contract> {
    // First check if contract is approved - cannot edit approved contracts
    const { data: existingContract } = await supabase
        .from('contracts')
        .select('status')
        .eq('id', id)
        .single();

    if (existingContract?.status === 'aprovado') {
        throw new Error('Não é possível editar um contrato aprovado');
    }

    const { data, error } = await supabase
        .from('contracts')
        .update(contract)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating contract:', error);
        throw error;
    }

    return data;
}

// Delete contract
export async function deleteContract(id: string): Promise<void> {
    // First check if contract is approved - cannot delete approved contracts
    const { data: existingContract } = await supabase
        .from('contracts')
        .select('status')
        .eq('id', id)
        .single();

    if (existingContract?.status === 'aprovado') {
        throw new Error('Não é possível excluir um contrato aprovado');
    }

    // First delete all files from storage
    const { data: files } = await supabase
        .from('contract_files')
        .select('file_url')
        .eq('contract_id', id);

    if (files && files.length > 0) {
        const filePaths = files.map((f) => {
            const parts = f.file_url.split('/contracts/');
            return parts.length > 1 ? parts[1] : null;
        }).filter(Boolean) as string[];

        if (filePaths.length > 0) {
            await supabase.storage.from('contracts').remove(filePaths);
        }
    }

    // Then delete the contract (cascade will delete files from DB)
    const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting contract:', error);
        throw error;
    }
}

// Upload contract file
export async function uploadContractFile(
    contractId: string,
    file: File,
    uploadedBy?: string
): Promise<ContractFile> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${contractId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, file);

    if (uploadError) {
        console.error('Error uploading contract file:', uploadError);
        throw uploadError;
    }

    const { data: urlData } = supabase.storage
        .from('contracts')
        .getPublicUrl(fileName);

    // Create file record
    const fileRecord: ContractFileInsert = {
        contract_id: contractId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: uploadedBy,
    };

    const { data, error } = await supabase
        .from('contract_files')
        .insert(fileRecord)
        .select()
        .single();

    if (error) {
        console.error('Error creating file record:', error);
        throw error;
    }

    return data;
}

// Delete contract file
export async function deleteContractFile(fileId: string): Promise<void> {
    // Get file info first
    const { data: file } = await supabase
        .from('contract_files')
        .select('file_url')
        .eq('id', fileId)
        .single();

    if (file) {
    // Delete from storage
        const parts = file.file_url.split('/contracts/');
        if (parts.length > 1) {
            await supabase.storage.from('contracts').remove([parts[1]]);
        }
    }

    // Delete record
    const { error } = await supabase
        .from('contract_files')
        .delete()
        .eq('id', fileId);

    if (error) {
        console.error('Error deleting contract file:', error);
        throw error;
    }
}

// Get contract summary
export async function getContractsSummary(branchId: string | undefined): Promise<{
  total: number;
  active: number;
  pending: number;
  totalValue: number;
}> {
    let contractsQuery = supabase
        .from('contracts')
        .select('status, value');

    if (branchId) {
        contractsQuery = contractsQuery.eq('branch_id', branchId);
    }

    const { data, error } = await contractsQuery;

    if (error) {
        console.error('Error fetching contracts summary:', error);
        throw error;
    }

    return (data || []).reduce(
        (acc, contract) => {
            acc.total++;
            acc.totalValue += Number(contract.value);
            if (contract.status === 'ativo') acc.active++;
            if (contract.status === 'pendente') acc.pending++;
            return acc;
        },
        {
            total: 0, active: 0, pending: 0, totalValue: 0
        }
    );
}

// Sign contract (change status to active and record signer)
export async function signContract(id: string, signedBy: string): Promise<Contract> {
    return updateContract(id, {
        status: 'ativo',
        signed_by: signedBy,
        signed_at: new Date().toISOString()
    });
}

// Submit contract for approval
export async function submitForApproval(id: string): Promise<Contract> {
    return updateContract(id, { status: 'em_aprovacao' });
}

// Approve contract
export async function approveContract(id: string, approvedBy: string): Promise<Contract> {
    return updateContract(id, {
        status: 'aprovado',
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
    });
}

// Reject contract
export async function rejectContract(id: string): Promise<Contract> {
    return updateContract(id, {
        status: 'rejeitado',
        approved_by: null,
        approved_at: null
    });
}

// End contract
export async function endContract(id: string): Promise<Contract> {
    return updateContract(id, { status: 'encerrado' });
}

// Fee label map for descriptions
const FEE_LABELS: Record<string, string> = {
    cadastro: 'Cadastro',
    operacao: 'Operação',
    seguro: 'Seguro',
};

/**
 * Calculate installment dates for a contract based on recurrence_type, start/end dates,
 * and payment_due_day.
 */
function calculateInstallmentDates(
    startDate: string,
    endDate: string | null,
    recurrenceType: string,
    paymentDueDay: number | null
): string[] {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (recurrenceType === 'unico' || !end) {
        // Single payment — use due day in the start month if provided
        const dueDay = paymentDueDay || start.getDate();
        const date = new Date(start.getFullYear(), start.getMonth(), dueDay);
        return [date.toISOString().split('T')[0]];
    }

    const dates: string[] = [];
    const dueDay = paymentDueDay || start.getDate();

    if (recurrenceType === 'mensal') {
        const current = new Date(start.getFullYear(), start.getMonth(), 1);
        while (current <= end) {
            const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
            const day = Math.min(dueDay, lastDay);
            const dueDate = new Date(current.getFullYear(), current.getMonth(), day);
            if (dueDate >= start && dueDate <= end) {
                dates.push(dueDate.toISOString().split('T')[0]);
            }
            current.setMonth(current.getMonth() + 1);
        }
    } else if (recurrenceType === 'anual') {
        let year = start.getFullYear();
        const month = start.getMonth();
        while (year <= end.getFullYear()) {
            const lastDay = new Date(year, month + 1, 0).getDate();
            const day = Math.min(dueDay, lastDay);
            const dueDate = new Date(year, month, day);
            if (dueDate >= start && dueDate <= end) {
                dates.push(dueDate.toISOString().split('T')[0]);
            }
            year++;
        }
    }

    return dates.length > 0 ? dates : [startDate];
}

/**
 * Calculate installment value using Price Table (Tabela Price).
 * PMT = PV × [i(1+i)^n / ((1+i)^n - 1)]
 * @param principal - loan amount (PV)
 * @param monthlyRate - monthly interest rate as decimal (e.g. 0.02 for 2%)
 * @param numInstallments - number of installments (n)
 */
function calculatePriceTableInstallment(
    principal: number,
    monthlyRate: number,
    numInstallments: number
): number {
    if (monthlyRate === 0 || numInstallments <= 0) {
        return numInstallments > 0 ? principal / numInstallments : principal;
    }
    const factor = (1 + monthlyRate) ** numInstallments;
    const pmt = principal * ((monthlyRate * factor) / (factor - 1));
    return Math.round(pmt * 100) / 100;
}

function resolveMachineFee(product: Product | null, installments: number): number {
    if (!product) return 0;
    const rules = product.specific_rules as Record<string, unknown> | null;
    if (!rules) return 0;
    const tiers = rules.card_machine_fee_tiers as Array<{ from: number; to: number; fee: number }> | undefined;
    if (Array.isArray(tiers) && tiers.length > 0) {
        const tier = tiers.find((t) => installments >= t.from && installments <= t.to);
        if (tier != null) return tier.fee;
    }
    return (rules.card_machine_fee as number) ?? 0;
}

function installmentsFromContract(startDate: string, endDate: string | null | undefined): number {
    if (!endDate) return 1;
    const s = new Date(startDate);
    const e = new Date(endDate);
    return Math.max(1, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1);
}

export interface GeneratedEntriesSummary {
    revenueCount: number;
    revenueInstallmentValue: number;
    totalWithInterest: number;
    interestRate: number;
    expenses: { description: string; value: number }[];
    totalExpenses: number;
    // Credit card specific
    isCartaoCredito: boolean;
    ccGrossValue: number | null;       // valor bruto cobrado na maquineta
    ccMachineFee: number | null;       // taxa da maquineta (%)
    ccMachineFeeValue: number | null;  // valor da taxa em R$
}

/**
 * Preview the financial entries that would be generated for a contract.
 * Does NOT create entries — used for the confirmation dialog.
 */
export function previewContractEntries(
    contract: ContractWithRelations & {
        payment_due_day?: number | null;
        interest_rate?: number | null;
        cc_amount_released?: number | null;
    },
    product: Product | null
): GeneratedEntriesSummary {
    const isCartaoCredito = product?.product_type === 'cartao_credito';

    let revenueCount: number;
    let revenueInstallmentValue: number;
    let totalWithInterest: number;

    const interestRate = contract.interest_rate ?? 0;
    const ccInstallments = isCartaoCredito
        ? installmentsFromContract(contract.start_date, contract.end_date)
        : 0;
    const machineFee = isCartaoCredito ? resolveMachineFee(product, ccInstallments) : 0;

    if (isCartaoCredito) {
        revenueCount = 1;
        const netValue = Math.round(contract.value * (1 - machineFee / 100) * 100) / 100;
        revenueInstallmentValue = netValue;
        totalWithInterest = netValue;
    } else {
        const dates = calculateInstallmentDates(
            contract.start_date,
            contract.end_date,
            contract.recurrence_type,
            contract.payment_due_day ?? null
        );
        revenueCount = dates.length;
        const monthlyRate = interestRate / 100;
        revenueInstallmentValue = monthlyRate > 0 && revenueCount > 1
            ? calculatePriceTableInstallment(contract.value, monthlyRate, revenueCount)
            : (revenueCount > 0 ? Math.round((contract.value / revenueCount) * 100) / 100 : contract.value);
        totalWithInterest = Math.round(revenueInstallmentValue * revenueCount * 100) / 100;
    }

    const expenses: { description: string; value: number }[] = [];

    if (isCartaoCredito) {
        // Credit card: expense = amount released to client
        const amountReleased = contract.cc_amount_released ?? 0;
        if (amountReleased > 0) {
            expenses.push({
                description: 'Valor liberado ao cliente (maquininha)',
                value: amountReleased,
            });
        }
    } else {
        // Product fees
        if (product?.other_fees) {
            Object.entries(product.other_fees).forEach(([key, val]) => {
                if (val && val > 0) {
                    expenses.push({
                        description: `Taxa de ${FEE_LABELS[key] || key}`,
                        value: val,
                    });
                }
            });
        }
    }

    // Seller commission — all product types
    if (contract.seller_id && product?.commission_pct != null && product.commission_pct > 0) {
        const isPercentual = !product.commission_type || product.commission_type === 'percentual';
        const commissionValue = isPercentual
            ? Math.round(((contract.value * product.commission_pct) / 100) * 100) / 100
            : product.commission_pct;
        if (commissionValue > 0) {
            expenses.push({
                description: 'Comissão do vendedor',
                value: commissionValue,
            });
        }
    }

    return {
        revenueCount,
        revenueInstallmentValue,
        totalWithInterest,
        interestRate,
        expenses,
        totalExpenses: expenses.reduce((sum, e) => sum + e.value, 0),
        isCartaoCredito,
        ccGrossValue: isCartaoCredito ? contract.value : null,
        ccMachineFee: isCartaoCredito ? machineFee : null,
        ccMachineFeeValue: isCartaoCredito ? Math.round(contract.value * (machineFee / 100) * 100) / 100 : null,
    };
}

/**
 * Generate financial entries (receita + despesa) for an approved contract.
 */
export async function generateFinancialEntriesFromContract(
    contract: ContractWithRelations & {
        payment_due_day?: number | null;
        interest_rate?: number | null;
        cc_amount_released?: number | null;
    },
    product: Product | null
): Promise<number> {
    const entries: FinancialEntryInsert[] = [];
    const isCartaoCredito = product?.product_type === 'cartao_credito';

    // --- Revenue entry/entries ---
    const ccInstallments = isCartaoCredito
        ? installmentsFromContract(contract.start_date, contract.end_date)
        : 0;
    const machineFee = isCartaoCredito ? resolveMachineFee(product, ccInstallments) : 0;

    if (isCartaoCredito) {
        // Credit card: single receipt = machine total minus machine fee
        const netValue = Math.round(contract.value * (1 - machineFee / 100) * 100) / 100;
        entries.push({
            branch_id: contract.branch_id,
            type: 'receita',
            description: `Cartão: ${contract.title}`,
            value: netValue,
            due_date: contract.start_date,
            status: 'pendente',
            category_id: contract.category_id ?? undefined,
            favorecido_id: contract.favorecido_id ?? undefined,
            contract_id: contract.id,
        });
    } else {
        const dates = calculateInstallmentDates(
            contract.start_date,
            contract.end_date,
            contract.recurrence_type,
            contract.payment_due_day ?? null
        );

        const totalInstallments = dates.length;
        const interestRate = contract.interest_rate ?? 0;
        const monthlyRate = interestRate / 100;

        const installmentValue = monthlyRate > 0 && totalInstallments > 1
            ? calculatePriceTableInstallment(contract.value, monthlyRate, totalInstallments)
            : (totalInstallments > 0
                ? Math.round((contract.value / totalInstallments) * 100) / 100
                : contract.value);

        const totalWithInterest = Math.round(installmentValue * totalInstallments * 100) / 100;

        // Adjust last installment for rounding difference
        const roundingDiff = Math.round(
            (totalWithInterest - installmentValue * totalInstallments) * 100
        ) / 100;

        dates.forEach((dueDate, index) => {
            const isLast = index === totalInstallments - 1;
            const value = isLast ? installmentValue + roundingDiff : installmentValue;
            const suffix = totalInstallments > 1 ? ` (${index + 1}/${totalInstallments})` : '';

            entries.push({
                branch_id: contract.branch_id,
                type: 'receita',
                description: `Venda: ${contract.title}${suffix}`,
                value,
                due_date: dueDate,
                status: 'pendente',
                category_id: contract.category_id ?? undefined,
                favorecido_id: contract.favorecido_id ?? undefined,
                contract_id: contract.id,
            });
        });
    }

    if (isCartaoCredito) {
        // --- Cartão de crédito: expense = amount released to client ---
        const amountReleased = contract.cc_amount_released ?? 0;
        if (amountReleased > 0) {
            entries.push({
                branch_id: contract.branch_id,
                type: 'despesa',
                description: `Cartão (valor ao cliente): ${contract.title}`,
                value: amountReleased,
                due_date: contract.start_date,
                status: 'pendente',
                category_id: contract.category_id ?? undefined,
                favorecido_id: contract.favorecido_id ?? undefined,
                contract_id: contract.id,
            });
        }
    } else {
        // --- Generic: expense entries (fees) ---
        if (product?.other_fees) {
            Object.entries(product.other_fees).forEach(([key, val]) => {
                if (val && val > 0) {
                    entries.push({
                        branch_id: contract.branch_id,
                        type: 'despesa',
                        description: `Custo venda: ${contract.title} - Taxa de ${FEE_LABELS[key] || key}`,
                        value: val,
                        due_date: contract.start_date,
                        status: 'pendente',
                        category_id: contract.category_id ?? undefined,
                        contract_id: contract.id,
                    });
                }
            });
        }
    }

    // --- Expense entry (commission) — applies to all product types ---
    if (contract.seller_id && product?.commission_pct != null && product.commission_pct > 0) {
        const isPercentual = !product.commission_type || product.commission_type === 'percentual';
        const commissionValue = isPercentual
            ? Math.round(((contract.value * product.commission_pct) / 100) * 100) / 100
            : product.commission_pct;

        if (commissionValue > 0) {
            // Commission due date: use commission_payment_day from product if set
            let commissionDueDate = contract.start_date;
            if (product.commission_payment_day) {
                const start = new Date(contract.start_date);
                const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
                const day = Math.min(product.commission_payment_day, lastDay);
                const commDate = new Date(start.getFullYear(), start.getMonth(), day);
                [commissionDueDate] = commDate.toISOString().split('T');
            }

            entries.push({
                branch_id: contract.branch_id,
                type: 'despesa',
                description: `Comissão venda: ${contract.title}`,
                value: commissionValue,
                due_date: commissionDueDate,
                status: 'pendente',
                contract_id: contract.id,
            });
        }
    }

    if (entries.length === 0) return 0;

    await createFinancialEntries(entries);
    return entries.length;
}
