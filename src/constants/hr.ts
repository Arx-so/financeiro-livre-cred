// ============================================
// HR Module Constants
// Constantes do Módulo de Recursos Humanos
// ============================================

export const VACATION_STATUSES = {
    PENDENTE: 'pendente',
    PROGRAMADA: 'programada',
    EM_ANDAMENTO: 'em_andamento',
    CONCLUIDA: 'concluida',
} as const;

export type VacationStatus = typeof VACATION_STATUSES[keyof typeof VACATION_STATUSES];

export const VACATION_STATUS_LABELS: Record<string, string> = {
    pendente: 'Pendente',
    programada: 'Programada',
    em_andamento: 'Em Andamento',
    concluida: 'Concluída',
};

export const VACATION_STATUS_COLORS: Record<string, string> = {
    pendente: 'yellow',
    programada: 'blue',
    em_andamento: 'green',
    concluida: 'gray',
};

export const EXAM_TYPES = {
    ADMISSIONAL: 'admissional',
    PERIODICO: 'periodico',
    DEMISSIONAL: 'demissional',
} as const;

export type ExamType = typeof EXAM_TYPES[keyof typeof EXAM_TYPES];

export const EXAM_TYPE_LABELS: Record<string, string> = {
    admissional: 'Admissional',
    periodico: 'Periódico',
    demissional: 'Demissional',
};

export const CERTIFICATE_TYPES = {
    ATESTADO: 'atestado',
    DECLARACAO: 'declaracao',
} as const;

export type CertificateType = typeof CERTIFICATE_TYPES[keyof typeof CERTIFICATE_TYPES];

export const CERTIFICATE_TYPE_LABELS: Record<string, string> = {
    atestado: 'Atestado',
    declaracao: 'Declaração',
};

export const HOLIDAY_TYPES = {
    NACIONAL: 'nacional',
    ESTADUAL: 'estadual',
    MUNICIPAL: 'municipal',
} as const;

export type HolidayType = typeof HOLIDAY_TYPES[keyof typeof HOLIDAY_TYPES];

export const HOLIDAY_TYPE_LABELS: Record<string, string> = {
    nacional: 'Feriado Nacional',
    estadual: 'Feriado Estadual',
    municipal: 'Feriado Municipal',
};

export const ALERT_TYPES = {
    VACATION_EXPIRING: 'vacation_expiring',
    VACATION_EXPIRED: 'vacation_expired',
    VACATION_UNSCHEDULED: 'vacation_unscheduled',
    EXAM_EXPIRING: 'exam_expiring',
    EXAM_EXPIRED: 'exam_expired',
    BIRTHDAY_UPCOMING: 'birthday_upcoming',
    BIRTHDAY_TODAY: 'birthday_today',
} as const;

export type AlertType = typeof ALERT_TYPES[keyof typeof ALERT_TYPES];

export const ALERT_TYPE_LABELS: Record<string, string> = {
    vacation_expiring: 'Férias vencendo',
    vacation_expired: 'Férias vencidas',
    vacation_unscheduled: 'Férias não programadas',
    exam_expiring: 'Exame vencendo',
    exam_expired: 'Exame vencido',
    birthday_upcoming: 'Aniversário em breve',
    birthday_today: 'Aniversário hoje',
};

export const ALERT_PRIORITY: Record<string, number> = {
    vacation_expired: 1,
    exam_expired: 2,
    vacation_expiring: 3,
    exam_expiring: 4,
    vacation_unscheduled: 5,
    birthday_today: 6,
    birthday_upcoming: 7,
};

/** Days before expiry to trigger the "expiring soon" alert */
export const ALERT_ADVANCE_DAYS = 30;
