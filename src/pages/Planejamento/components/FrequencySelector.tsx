import type { BudgetFrequency } from '@/types/database';

interface FrequencySelectorProps {
    value: BudgetFrequency;
    onChange: (value: BudgetFrequency) => void;
    disabled?: boolean;
}

const FREQUENCY_OPTIONS: { value: BudgetFrequency; label: string }[] = [
    { value: 'mes_a_mes', label: 'Mês a mês' },
    { value: 'mensal', label: 'Mensal (valor fixo)' },
    { value: 'anual', label: 'Anual' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'diario', label: 'Diário' },
];

export function FrequencySelector({ value, onChange, disabled }: FrequencySelectorProps) {
    return (
        <div>
            <label htmlFor="frequency-select" className="block text-sm font-medium text-foreground mb-2">
                Frequência
            </label>
            <select
                id="frequency-select"
                className="input-financial w-full"
                value={value}
                onChange={(e) => onChange(e.target.value as BudgetFrequency)}
                disabled={disabled}
            >
                {FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export function getFrequencyLabel(frequency: BudgetFrequency): string {
    const option = FREQUENCY_OPTIONS.find((o) => o.value === frequency);
    return option?.label || frequency;
}

export function getFrequencyShortLabel(frequency: BudgetFrequency): string {
    const labels: Record<BudgetFrequency, string> = {
        mes_a_mes: 'Mês a mês',
        mensal: 'Mensal',
        anual: 'Anual',
        semanal: 'Semanal',
        diario: 'Diário',
    };
    return labels[frequency] || frequency;
}
