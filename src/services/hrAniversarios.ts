import { supabase } from '@/lib/supabase';
import type { Favorecido } from '@/types/database';

export interface FavorecidoWithBirthday extends Pick<Favorecido, 'id' | 'name' | 'type' | 'category' | 'birth_date'> {
    age: number;
    /** ISO YYYY-MM-DD of this employee's birthday in the current calendar year */
    birthdayThisYear: string;
}

type EmployeeRow = Pick<Favorecido, 'id' | 'name' | 'type' | 'category' | 'birth_date'>;

function buildBirthdayRecord(emp: EmployeeRow): FavorecidoWithBirthday {
    const bd = new Date(`${emp.birth_date}T12:00:00`);
    const currentYear = new Date().getFullYear();
    const birthdayThisYear = `${currentYear}-${String(bd.getMonth() + 1).padStart(2, '0')}-${String(bd.getDate()).padStart(2, '0')}`;
    const age = currentYear - bd.getFullYear();
    return { ...emp, age, birthdayThisYear };
}

/** Single shared fetch — all three public functions filter in memory to avoid duplicate network calls.
 *  branchId = undefined means ADM (no branch filter — sees all branches). */
async function fetchAllFuncionariosWithBirthday(branchId: string | undefined): Promise<EmployeeRow[]> {
    let query = supabase
        .from('favorecidos')
        .select('id, name, type, category, birth_date')
        .in('type', ['funcionario', 'ambos'])
        .not('birth_date', 'is', null)
        .limit(1000);

    if (branchId) {
        query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as EmployeeRow[];
}

export async function getBirthdaysToday(branchId: string | undefined): Promise<FavorecidoWithBirthday[]> {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const employees = await fetchAllFuncionariosWithBirthday(branchId);

    return employees
        .filter((emp) => {
            const bd = new Date(`${emp.birth_date}T12:00:00`);
            return (bd.getMonth() + 1) === month && bd.getDate() === day;
        })
        .map(buildBirthdayRecord);
}

export async function getUpcomingBirthdays(branchId: string | undefined, days: number): Promise<FavorecidoWithBirthday[]> {
    const employees = await fetchAllFuncionariosWithBirthday(branchId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    // Build [record, nextOccurrenceMs] pairs so we only compute candidateDate once per employee
    const candidatePairs: { emp: EmployeeRow; nextMs: number }[] = [];

    for (const emp of employees) {
        const bd = new Date(`${emp.birth_date}T12:00:00`);
        const candidateDate = new Date(currentYear, bd.getMonth(), bd.getDate(), 0, 0, 0, 0);

        if (candidateDate < today) {
            candidateDate.setFullYear(currentYear + 1);
        }

        const diffDays = Math.ceil((candidateDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= days) {
            candidatePairs.push({ emp, nextMs: candidateDate.getTime() });
        }
    }

    // Sort by actual next occurrence (handles year-wrap correctly)
    candidatePairs.sort((a, b) => a.nextMs - b.nextMs);
    return candidatePairs.map(({ emp }) => buildBirthdayRecord(emp));
}

export async function getBirthdaysByMonth(branchId: string | undefined, month: number): Promise<FavorecidoWithBirthday[]> {
    const employees = await fetchAllFuncionariosWithBirthday(branchId);

    return employees
        .filter((emp) => new Date(`${emp.birth_date}T12:00:00`).getMonth() + 1 === month)
        .map(buildBirthdayRecord)
        // birthdayThisYear is YYYY-MM-DD — slice the day part directly to avoid Date construction in comparator
        .sort((a, b) => Number(a.birthdayThisYear.slice(8)) - Number(b.birthdayThisYear.slice(8)));
}
