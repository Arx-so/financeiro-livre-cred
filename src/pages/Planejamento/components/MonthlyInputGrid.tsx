import { useCallback, useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/currency-input';
import { MONTHS_SHORT, formatCurrency } from '@/lib/utils';
import type { BudgetFrequency } from '@/types/database';

interface MonthlyInputGridProps {
    values: number[];
    onChange: (values: number[]) => void;
    frequency: BudgetFrequency;
    suggestion?: number[];
    disabled?: boolean;
}

export function MonthlyInputGrid({
    values,
    onChange,
    frequency,
    suggestion,
    disabled,
}: MonthlyInputGridProps) {
    const [localValues, setLocalValues] = useState<number[]>(values);

    useEffect(() => {
        setLocalValues(values);
    }, [values]);

    const handleValueChange = useCallback((month: number, value: number) => {
        const newValues = [...localValues];

        if (frequency === 'mensal') {
            // Apply same value to all months
            for (let i = 0; i < 12; i++) {
                newValues[i] = value;
            }
        } else if (frequency === 'anual') {
            // Apply value only to first month, zero others
            for (let i = 0; i < 12; i++) {
                newValues[i] = i === 0 ? value : 0;
            }
        } else {
            // mes_a_mes: individual month values
            newValues[month] = value;
        }

        setLocalValues(newValues);
        onChange(newValues);
    }, [localValues, frequency, onChange]);

    const applySuggestion = useCallback(() => {
        if (suggestion) {
            setLocalValues(suggestion);
            onChange(suggestion);
        }
    }, [suggestion, onChange]);

    const totalAnnual = localValues.reduce((sum, v) => sum + v, 0);

    const isInputDisabled = (month: number) => {
        if (disabled) return true;
        if (frequency === 'mensal' && month > 0) return true;
        if (frequency === 'anual' && month > 0) return true;
        return false;
    };

    return (
        <div className="space-y-4">
            {suggestion && (
                <button
                    type="button"
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                    onClick={applySuggestion}
                    disabled={disabled}
                >
                    <Lightbulb className="w-4 h-4" />
                    Sugerir baseado nos últimos 12 meses
                </button>
            )}

            <div className="grid grid-cols-2 gap-3">
                {MONTHS_SHORT.map((monthName, index) => (
                    <div key={monthName} className="space-y-1">
                        <label
                            htmlFor={`month-${index}`}
                            className="block text-xs font-medium text-muted-foreground"
                        >
                            {monthName}
                        </label>
                        <CurrencyInput
                            id={`month-${index}`}
                            value={localValues[index] || 0}
                            onChange={(value) => handleValueChange(index, value)}
                            disabled={isInputDisabled(index)}
                            className="text-sm"
                        />
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Previsão Anual</span>
                    <span className="text-lg font-bold font-mono-numbers text-foreground">
                        {formatCurrency(totalAnnual)}
                    </span>
                </div>
            </div>
        </div>
    );
}
