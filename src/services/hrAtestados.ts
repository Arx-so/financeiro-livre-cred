import { supabase } from '@/lib/supabase';
import type {
    MedicalCertificate,
    MedicalCertificateInsert,
    Favorecido,
} from '@/types/database';

export interface CertificateWithEmployee extends MedicalCertificate {
    employee?: Pick<Favorecido, 'id' | 'name' | 'document'> | null;
}

export interface CertificateFilters {
    branchId?: string;
    employeeId?: string;
    certificateType?: string;
    month?: number;
    year?: number;
    search?: string;
}

export interface CertificateReportRow {
    employee_id: string;
    employee_name: string;
    total_days: number;
    record_count: number;
    records: CertificateWithEmployee[];
}

export async function getMedicalCertificates(
    filters: CertificateFilters = {},
): Promise<CertificateWithEmployee[]> {
    let query = supabase
        .from('medical_certificates')
        .select(`
            *,
            employee:favorecidos(id, name, document)
        `)
        .order('certificate_date', { ascending: false });

    if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
    }

    if (filters.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
    }

    if (filters.certificateType) {
        query = query.eq('certificate_type', filters.certificateType);
    }

    if (filters.month && filters.year) {
        const start = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
        const end = new Date(filters.year, filters.month, 0).toISOString().split('T')[0];
        query = query.gte('certificate_date', start).lte('certificate_date', end);
    }

    const { data, error } = await query;
    if (error) throw error;

    let results = (data ?? []) as CertificateWithEmployee[];

    if (filters.search) {
        const term = filters.search.toLowerCase();
        results = results.filter((c) => (
            c.employee?.name?.toLowerCase().includes(term)
            || c.employee?.document?.toLowerCase().includes(term)
        ));
    }

    return results;
}

export async function createMedicalCertificate(
    data: MedicalCertificateInsert,
): Promise<MedicalCertificate> {
    const { data: created, error } = await supabase
        .from('medical_certificates')
        .insert(data)
        .select()
        .single();

    if (error) throw error;
    return created;
}

/**
 * Aggregates certificates by employee for reporting.
 */
export async function getCertificateReport(
    filters: CertificateFilters,
): Promise<{ rows: CertificateReportRow[]; total_days: number; total_records: number }> {
    const records = await getMedicalCertificates(filters);

    const byEmployee = new Map<string, CertificateReportRow>();

    for (const c of records) {
        if (!c.employee_id) continue;
        const existing = byEmployee.get(c.employee_id);
        if (existing) {
            existing.total_days += c.absence_days;
            existing.record_count += 1;
            existing.records.push(c);
        } else {
            byEmployee.set(c.employee_id, {
                employee_id: c.employee_id,
                employee_name: c.employee?.name ?? '',
                total_days: c.absence_days,
                record_count: 1,
                records: [c],
            });
        }
    }

    const rows = Array.from(byEmployee.values()).sort(
        (a, b) => a.employee_name.localeCompare(b.employee_name),
    );

    return {
        rows,
        total_days: rows.reduce((acc, r) => acc + r.total_days, 0),
        total_records: records.length,
    };
}
