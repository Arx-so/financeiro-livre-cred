import * as React from 'react';
import { cn } from '@/lib/utils';
import { formatPhone, parsePhone } from '@/lib/masks';

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string, formatted: string) => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
    ({
        className, value, onChange, ...props
    }, ref) => {
        const [displayValue, setDisplayValue] = React.useState('');

        // Initialize display value from prop
        React.useEffect(() => {
            if (!value) {
                setDisplayValue('');
            } else {
                const formatted = formatPhone(value);
                if (formatted !== displayValue) {
                    setDisplayValue(formatted);
                }
            }
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = e.target.value;
            const digits = parsePhone(rawValue);

            // Limit to 11 digits (mobile)
            if (digits.length > 11) return;

            const formatted = formatPhone(digits);
            setDisplayValue(formatted);
            onChange(digits, formatted);
        };

        return (
            <input
                type="tel"
                className={cn('input-financial', className)}
                ref={ref}
                value={displayValue}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                {...props}
            />
        );
    }
);

PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
