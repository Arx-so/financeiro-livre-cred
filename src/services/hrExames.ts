import { supabase } from '@/lib/supabase';
import type {
    OccupationalExam,
    OccupationalExamInsert,
    OccupationalExamUpdate,
    Favorecido,
} from '@/types/database';

export interface ExamWithEmployee extends OccupationalExam {
    employee?: Pick<Favorecido, 'id' | 'name' | 'document'> | null;
}

export interface ExamFilters {
    branchId?: string;
    employeeId?: string;
    examType?: string;
    search?: string;
    /** 'valid' | 'expiring' | 'expired' */
    expiryStatus?: 'valid' | 'expiring' | 'expired';
}

export async function getOccupationalExams(
    filters: ExamFilters = {},
): Promise<ExamWithEmployee[]> {
    let query = supabase
        .from('occupational_exams')
        .select(`
            *,
            employee:favorecidos(id, name, document)
        `)
        .order('exam_date', { ascending: false });

    if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
    }

    if (filters.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
    }

    if (filters.examType) {
        query = query.eq('exam_type', filters.examType);
    }

    const { data, error } = await query;
    if (error) throw error;

    let results = (data ?? []) as ExamWithEmployee[];

    if (filters.search) {
        const term = filters.search.toLowerCase();
        results = results.filter((e) => (
            e.employee?.name?.toLowerCase().includes(term)
            || e.employee?.document?.toLowerCase().includes(term)
        ));
    }

    if (filters.expiryStatus) {
        const today = new Date().toISOString().split('T')[0];
        const future = new Date();
        future.setDate(future.getDate() + 30);
        const futureStr = future.toISOString().split('T')[0];

        results = results.filter((e) => {
            if (e.exam_type !== 'periodico' || !e.exam_expiry_date) return false;
            if (filters.expiryStatus === 'expired') return e.exam_expiry_date < today;
            if (filters.expiryStatus === 'expiring') {
                return e.exam_expiry_date >= today && e.exam_expiry_date <= futureStr;
            }
            return e.exam_expiry_date > futureStr;
        });
    }

    return results;
}

export async function getExamById(id: string): Promise<ExamWithEmployee | null> {
    const { data, error } = await supabase
        .from('occupational_exams')
        .select(`
            *,
            employee:favorecidos(id, name, document)
        `)
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    return data as ExamWithEmployee | null;
}

export async function createExam(data: OccupationalExamInsert): Promise<OccupationalExam> {
    const { data: created, error } = await supabase
        .from('occupational_exams')
        .insert(data)
        .select()
        .single();

    if (error) throw error;
    return created;
}

export async function updateExam(
    id: string,
    data: OccupationalExamUpdate,
): Promise<OccupationalExam> {
    const { data: updated, error } = await supabase
        .from('occupational_exams')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return updated;
}

export async function deleteExam(id: string): Promise<void> {
    const { error } = await supabase.from('occupational_exams').delete().eq('id', id);
    if (error) throw error;
}

/**
 * Uploads an exam document to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadExamDocument(
    file: File,
    branchId: string,
    employeeId: string,
): Promise<{ url: string; name: string; type: string }> {
    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `exames/${branchId}/${employeeId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('documents').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
    });

    if (error) throw error;

    const { data: publicData } = supabase.storage.from('documents').getPublicUrl(path);

    return {
        url: publicData.publicUrl,
        name: file.name,
        type: ext,
    };
}

/**
 * Returns exams expiring within the next `days` calendar days for a branch.
 */
export async function getExpiringExams(
    branchId: string,
    days = 30,
): Promise<ExamWithEmployee[]> {
    const today = new Date().toISOString().split('T')[0];
    const future = new Date();
    future.setDate(future.getDate() + days);
    const futureStr = future.toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('occupational_exams')
        .select(`
            *,
            employee:favorecidos(id, name, document)
        `)
        .eq('branch_id', branchId)
        .eq('exam_type', 'periodico')
        .not('exam_expiry_date', 'is', null)
        .lte('exam_expiry_date', futureStr)
        .order('exam_expiry_date', { ascending: true });

    if (error) throw error;

    const results = (data ?? []) as ExamWithEmployee[];
    return results.map((e) => ({
        ...e,
        _isExpired: (e.exam_expiry_date ?? '') < today,
    } as ExamWithEmployee));
}
