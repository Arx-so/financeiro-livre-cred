import { supabase } from '@/lib/supabase';
import type { 
  Contract, 
  ContractInsert, 
  ContractUpdate,
  ContractFile,
  ContractFileInsert,
  ContractStatus 
} from '@/types/database';

export interface ContractWithRelations extends Contract {
  favorecido?: { id: string; name: string } | null;
  files?: ContractFile[];
}

export interface ContractFilters {
  branchId?: string;
  status?: ContractStatus;
  favorecidoId?: string;
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
      favorecido:favorecidos(id, name),
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
      favorecido:favorecidos(id, name),
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
  // First delete all files from storage
  const { data: files } = await supabase
    .from('contract_files')
    .select('file_url')
    .eq('contract_id', id);

  if (files && files.length > 0) {
    const filePaths = files.map(f => {
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
export async function getContractsSummary(branchId: string): Promise<{
  total: number;
  active: number;
  pending: number;
  totalValue: number;
}> {
  const { data, error } = await supabase
    .from('contracts')
    .select('status, value')
    .eq('branch_id', branchId);

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
    { total: 0, active: 0, pending: 0, totalValue: 0 }
  );
}

// Sign contract (change status to active)
export async function signContract(id: string): Promise<Contract> {
  return updateContract(id, { status: 'ativo' });
}

// End contract
export async function endContract(id: string): Promise<Contract> {
  return updateContract(id, { status: 'encerrado' });
}
