import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | string;
  onChange: (value: number, formatted: string) => void;
}

const brlFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

function formatFromCentsDigits(digits: string) {
    // digits = "1234" => 12.34
    const cents = Number(digits || '0');
    const value = cents / 100;
    return brlFormatter.format(value); // "R$ 12,34"
}

function parseDisplayToNumber(display: string) {
    // "R$ 1.234,56" -> 1234.56
    const digits = (display || '').replace(/\D/g, '');
    return Number(digits || '0') / 100;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({
        className, value, onChange, ...props
    }, ref) => {
        const [displayValue, setDisplayValue] = React.useState('');

        // Sync from prop -> display (without fighting typing)
        const lastNumRef = React.useRef<number | null>(null);

        React.useEffect(() => {
            if (value === '' || value === null || value === undefined) {
                lastNumRef.current = null;
                setDisplayValue('');
                return;
            }

            const num = typeof value === 'string' ? parseDisplayToNumber(value) : value;
            const safeNum = Number.isFinite(num) ? num : 0;

            if (lastNumRef.current === safeNum) return;
            lastNumRef.current = safeNum;

            setDisplayValue(brlFormatter.format(safeNum));
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value ?? '';
            const digits = raw.replace(/\D/g, ''); // cents digits only

            if (!digits) {
                setDisplayValue('');
                lastNumRef.current = 0;
                onChange(0, '');
                return;
            }

            const formatted = formatFromCentsDigits(digits);
            const numeric = Number(digits) / 100;

            setDisplayValue(formatted);
            lastNumRef.current = numeric;
            onChange(numeric, formatted);
        };

        return (
            <input
                type="text"
                inputMode="numeric"
                className={cn('input-financial font-mono-numbers', className)}
                ref={ref}
                value={displayValue}
                onChange={handleChange}
                placeholder="R$ 0,00"
                {...props}
            />
        );
    }
);

CurrencyInput.displayName = 'CurrencyInput';
export { CurrencyInput };
