import { supabase } from '@/lib/supabase';
import type { Favorecido } from '@/types/database';

export interface FavorecidoWithBirthday extends Pick<Favorecido, 'id' | 'name' | 'type' | 'category' | 'birth_date'> {
    age: number;
    birthdayThisYear: string; // ISO date string for this year's birthday
}

function buildBirthdayRecord(
    emp: Pick<Favorecido, 'id' | 'name' | 'type' | 'category' | 'birth_date'>,
): FavorecidoWithBirthday {
    const bd = new Date(`${emp.birth_date}T12:00:00`);
    const now = new Date();
    const currentYear = now.getFullYear();
    const birthdayThisYear = `${currentYear}-${String(bd.getMonth() + 1).padStart(2, '0')}-${String(bd.getDate()).padStart(2, '0')}`;
    const age = currentYear - bd.getFullYear();

    return {
        ...emp,
        age,
        birthdayThisYear,
    };
}

export async function getBirthdaysToday(branchId: string): Promise<FavorecidoWithBirthday[]> {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const { data, error } = await supabase
        .from('favorecidos')
        .select('id, name, type, category, birth_date')
        .eq('branch_id', branchId)
        .in('type', ['funcionario', 'ambos'])
        .not('birth_date', 'is', null);

    if (error) throw error;

    const employees = (data ?? []) as Array<Pick<Favorecido, 'id' | 'name' | 'type' | 'category' | 'birth_date'>>;

    return employees
        .filter((emp) => {
            if (!emp.birth_date) return false;
            const bd = new Date(`${emp.birth_date}T12:00:00`);
            return (bd.getMonth() + 1) === month && bd.getDate() === day;
        })
        .map(buildBirthdayRecord);
}

export async function getUpcomingBirthdays(branchId: string, days: number): Promise<FavorecidoWithBirthday[]> {
    const { data, error } = await supabase
        .from('favorecidos')
        .select('id, name, type, category, birth_date')
        .eq('branch_id', branchId)
        .in('type', ['funcionario', 'ambos'])
        .not('birth_date', 'is', null);

    if (error) throw error;

    const employees = (data ?? []) as Array<Pick<Favorecido, 'id' | 'name' | 'type' | 'category' | 'birth_date'>>;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    const results: FavorecidoWithBirthday[] = [];

    for (const emp of employees) {
        if (!emp.birth_date) continue;
        const bd = new Date(`${emp.birth_date}T12:00:00`);
        const bMonth = bd.getMonth() + 1;
        const bDay = bd.getDate();

        // Build a candidate date in current year, or next year if already passed
        const candidateDate = new Date(currentYear, bMonth - 1, bDay, 0, 0, 0, 0);

        if (candidateDate < today) {
            candidateDate.setFullYear(currentYear + 1);
        }

        const diffMs = candidateDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= days) {
            results.push(buildBirthdayRecord(emp));
        }
    }

    // Sort by nearest birthday first
    results.sort((a, b) => {
        const da = new Date(a.birthdayThisYear);
        const db = new Date(b.birthdayThisYear);
        return da.getTime() - db.getTime();
    });

    return results;
}

export async function getBirthdaysByMonth(branchId: string, month: number): Promise<FavorecidoWithBirthday[]> {
    const { data, error } = await supabase
        .from('favorecidos')
        .select('id, name, type, category, birth_date')
        .eq('branch_id', branchId)
        .in('type', ['funcionario', 'ambos'])
        .not('birth_date', 'is', null);

    if (error) throw error;

    const employees = (data ?? []) as Array<Pick<Favorecido, 'id' | 'name' | 'type' | 'category' | 'birth_date'>>;

    const results = employees
        .filter((emp) => {
            if (!emp.birth_date) return false;
            const bd = new Date(`${emp.birth_date}T12:00:00`);
            return (bd.getMonth() + 1) === month;
        })
        .map(buildBirthdayRecord);

    // Sort by day of month — extract day once per record before sorting
    const withDay = results.map((r) => ({ r, day: new Date(`${r.birth_date}T12:00:00`).getDate() }));
    withDay.sort((a, b) => a.day - b.day);
    return withDay.map(({ r }) => r);
}
