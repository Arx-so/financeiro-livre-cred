import * as React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDocument, parseDocument } from '@/lib/masks';
import { validateDocument, getDocumentType } from '@/lib/validators';

export interface DocumentInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string, formatted: string) => void;
  onValidation?: (isValid: boolean, type: 'cpf' | 'cnpj' | 'unknown') => void;
  showValidation?: boolean;
}

const DocumentInput = React.forwardRef<HTMLInputElement, DocumentInputProps>(
    ({
        className, value, onChange, onValidation, showValidation = true, ...props
    }, ref) => {
        const [displayValue, setDisplayValue] = React.useState('');
        const [validationState, setValidationState] = React.useState<{
      isValid: boolean | null;
      type: 'cpf' | 'cnpj' | 'unknown';
    }>({ isValid: null, type: 'unknown' });
        const [isTouched, setIsTouched] = React.useState(false);

        // Initialize display value from prop
        React.useEffect(() => {
            if (!value) {
                setDisplayValue('');
                setValidationState({ isValid: null, type: 'unknown' });
            } else {
                const formatted = formatDocument(value);
                if (formatted !== displayValue) {
                    setDisplayValue(formatted);
                }
            }
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = e.target.value;
            const digits = parseDocument(rawValue);

            // Limit to 14 digits (CNPJ max)
            if (digits.length > 14) return;

            const formatted = formatDocument(digits);
            const type = getDocumentType(digits);

            setDisplayValue(formatted);
            onChange(digits, formatted);

            // Reset validation on change (will validate on blur)
            if (isTouched) {
                setValidationState({ isValid: null, type });
            }
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsTouched(true);
            const digits = parseDocument(displayValue);

            if (digits.length === 0) {
                setValidationState({ isValid: null, type: 'unknown' });
                onValidation?.(true, 'unknown'); // Empty is valid (optional field)
                return;
            }

            const result = validateDocument(digits);
            setValidationState({ isValid: result.isValid, type: result.type });
            onValidation?.(result.isValid, result.type);

            props.onBlur?.(e);
        };

        const getPlaceholder = () => {
            const type = getDocumentType(displayValue || '');
            if (type === 'cnpj' || parseDocument(displayValue).length > 11) {
                return '00.000.000/0000-00';
            }
            return '000.000.000-00';
        };

        const showError = showValidation && isTouched && validationState.isValid === false;
        const showSuccess = showValidation && isTouched && validationState.isValid === true && displayValue.length > 0;

        return (
            <div className="relative">
                <input
                    type="text"
                    inputMode="numeric"
                    className={cn(
                        'input-financial pr-10',
                        showError && 'border-destructive focus:ring-destructive/20',
                        showSuccess && 'border-income focus:ring-income/20',
                        className
                    )}
                    ref={ref}
                    value={displayValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={getPlaceholder()}
                    {...props}
                />
                {showValidation && isTouched && displayValue && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {showError && (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                        )}
                        {showSuccess && (
                            <CheckCircle2 className="w-4 h-4 text-income" />
                        )}
                    </div>
                )}
                {showError && (
                    <p className="text-xs text-destructive mt-1">
                        {validationState.type === 'cpf' ? 'CPF inválido'
                            : validationState.type === 'cnpj' ? 'CNPJ inválido'
                                : 'Documento inválido'}
                    </p>
                )}
            </div>
        );
    }
);

DocumentInput.displayName = 'DocumentInput';

export { DocumentInput };
