import { supabase } from '@/lib/supabase';
import type { HrAlert, HrAlertInsert, Favorecido } from '@/types/database';
import {
    ALERT_TYPES, ALERT_ADVANCE_DAYS, VACATION_STATUSES, EXAM_TYPES,
} from '@/constants/hr';
import { getExpiringVacations } from '@/services/hrFerias';
import { getExpiringExams } from '@/services/hrExames';

export interface HrAlertWithEmployee extends HrAlert {
    employee?: Pick<Favorecido, 'id' | 'name'> | null;
}

export interface AlertFilters {
    branchId?: string;
    dismissed?: boolean;
    alertType?: string;
}

export async function getHrAlerts(filters: AlertFilters = {}): Promise<HrAlertWithEmployee[]> {
    let query = supabase
        .from('hr_alerts')
        .select(`
            *,
            employee:favorecidos(id, name)
        `)
        .order('alert_date', { ascending: false });

    if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
    }

    if (filters.dismissed !== undefined) {
        query = query.eq('dismissed', filters.dismissed);
    }

    if (filters.alertType) {
        query = query.eq('alert_type', filters.alertType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as HrAlertWithEmployee[];
}

export async function dismissAlert(id: string): Promise<void> {
    const { error } = await supabase
        .from('hr_alerts')
        .update({ dismissed: true, dismissed_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
}

export async function upsertAlert(data: HrAlertInsert): Promise<HrAlert> {
    const { data: result, error } = await supabase
        .from('hr_alerts')
        .upsert(data, { onConflict: 'branch_id,employee_id,alert_type,alert_date' })
        .select()
        .single();

    if (error) throw error;
    return result;
}

/**
 * Computes on-demand HR alerts for a branch.
 * Checks vacation expiry, exam expiry, and birthdays.
 * Upserts results into hr_alerts table.
 * Returns the active (non-dismissed) alerts.
 */
export async function generateHrAlerts(branchId: string): Promise<HrAlertWithEmployee[]> {
    const today = new Date().toISOString().split('T')[0];
    const inserts: HrAlertInsert[] = [];

    const [expiringVacations, expiringExams] = await Promise.all([
        getExpiringVacations(branchId, ALERT_ADVANCE_DAYS),
        getExpiringExams(branchId, ALERT_ADVANCE_DAYS),
    ]);

    for (const v of expiringVacations) {
        const isExpired = v.vacation_expiry_date < today;
        const isUnscheduled = v.status === VACATION_STATUSES.PENDENTE;

        if (isExpired && isUnscheduled) {
            inserts.push({
                branch_id: branchId,
                alert_type: ALERT_TYPES.VACATION_EXPIRED,
                employee_id: v.employee_id,
                related_entity_type: 'vacation',
                related_entity_id: v.id,
                alert_title: 'Férias vencidas',
                alert_message: `${v.employee?.name ?? 'Funcionário'} — férias vencidas em ${v.vacation_expiry_date}`,
                alert_date: today,
                dismissed: false,
            });
        } else if (!isExpired) {
            inserts.push({
                branch_id: branchId,
                alert_type: ALERT_TYPES.VACATION_EXPIRING,
                employee_id: v.employee_id,
                related_entity_type: 'vacation',
                related_entity_id: v.id,
                alert_title: 'Férias vencendo',
                alert_message: `${v.employee?.name ?? 'Funcionário'} — férias vencem em ${v.vacation_expiry_date}`,
                alert_date: today,
                dismissed: false,
            });
        }
    }

    for (const e of expiringExams) {
        const isExpired = (e.exam_expiry_date ?? '') < today;
        inserts.push({
            branch_id: branchId,
            alert_type: isExpired ? ALERT_TYPES.EXAM_EXPIRED : ALERT_TYPES.EXAM_EXPIRING,
            employee_id: e.employee_id,
            related_entity_type: 'exam',
            related_entity_id: e.id,
            alert_title: isExpired ? 'Exame vencido' : 'Exame vencendo',
            alert_message: `${e.employee?.name ?? 'Funcionário'} — exame periódico ${isExpired ? 'vencido' : 'vence'} em ${e.exam_expiry_date}`,
            alert_date: today,
            dismissed: false,
        });
    }

    const { data: birthdayEmployees } = await supabase
        .from('favorecidos')
        .select('id, name, birth_date')
        .in('type', ['funcionario', 'ambos'])
        .eq('branch_id', branchId)
        .not('birth_date', 'is', null);

    if (birthdayEmployees) {
        const todayMonth = new Date().getMonth() + 1;
        const todayDay = new Date().getDate();

        for (const emp of birthdayEmployees) {
            if (!emp.birth_date) continue;
            const bd = new Date(emp.birth_date);
            const bMonth = bd.getMonth() + 1;
            const bDay = bd.getDate();

            if (bMonth === todayMonth && bDay === todayDay) {
                inserts.push({
                    branch_id: branchId,
                    alert_type: ALERT_TYPES.BIRTHDAY_TODAY,
                    employee_id: emp.id,
                    related_entity_type: 'favorecido',
                    related_entity_id: emp.id,
                    alert_title: 'Aniversário hoje',
                    alert_message: `${emp.name} faz aniversário hoje!`,
                    alert_date: today,
                    dismissed: false,
                });
            }
        }
    }

    if (inserts.length > 0) {
        await supabase
            .from('hr_alerts')
            .upsert(inserts, { ignoreDuplicates: true });
    }

    return getHrAlerts({ branchId, dismissed: false });
}

export interface HrDashboardSummary {
    vacationsExpiring: number;
    vacationsInProgress: number;
    examsExpiring: number;
    birthdaysThisMonth: number;
    certificatesThisMonth: number;
    certificateDaysThisMonth: number;
}

export async function getHrDashboardSummary(branchId: string): Promise<HrDashboardSummary> {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const future = new Date();
    future.setDate(today.getDate() + 30);
    const futureStr = future.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const [vacExpiring, vacInProgress, examsExp, birthdays, certs] = await Promise.all([
        supabase
            .from('employee_vacations')
            .select('id', { count: 'exact', head: true })
            .eq('branch_id', branchId)
            .in('status', [VACATION_STATUSES.PENDENTE, VACATION_STATUSES.PROGRAMADA])
            .lte('vacation_expiry_date', futureStr),

        supabase
            .from('employee_vacations')
            .select('id', { count: 'exact', head: true })
            .eq('branch_id', branchId)
            .eq('status', VACATION_STATUSES.EM_ANDAMENTO),

        supabase
            .from('occupational_exams')
            .select('id', { count: 'exact', head: true })
            .eq('branch_id', branchId)
            .eq('exam_type', EXAM_TYPES.PERIODICO)
            .not('exam_expiry_date', 'is', null)
            .lte('exam_expiry_date', futureStr),

        supabase
            .from('favorecidos')
            .select('id, birth_date')
            .in('type', ['funcionario', 'ambos'])
            .eq('branch_id', branchId)
            .not('birth_date', 'is', null),

        supabase
            .from('medical_certificates')
            .select('absence_days')
            .eq('branch_id', branchId)
            .gte('certificate_date', `${year}-${String(month).padStart(2, '0')}-01`)
            .lte('certificate_date', todayStr),
    ]);

    const birthdaysThisMonth = (birthdays.data ?? []).filter((e) => {
        if (!e.birth_date) return false;
        const bd = new Date(e.birth_date);
        return (bd.getMonth() + 1) === month;
    }).length;

    type CertRow = { absence_days: number | null };
    const certRecords: CertRow[] = certs.data ?? [];
    const certificateDaysThisMonth = certRecords.reduce((acc: number, c: CertRow) => acc + (c.absence_days ?? 0), 0);

    return {
        vacationsExpiring: vacExpiring.count ?? 0,
        vacationsInProgress: vacInProgress.count ?? 0,
        examsExpiring: examsExp.count ?? 0,
        birthdaysThisMonth,
        certificatesThisMonth: certRecords.length,
        certificateDaysThisMonth,
    };
}
