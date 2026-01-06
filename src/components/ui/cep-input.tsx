import * as React from 'react';
import { cn } from '@/lib/utils';
import { formatCEP, parseCEP } from '@/lib/masks';
import { fetchAddress, isCEPComplete, AddressData } from '@/lib/viacep';
import { Loader2, MapPin, AlertCircle } from 'lucide-react';

export interface CepInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string, formatted: string) => void;
  onAddressFound?: (address: AddressData) => void;
  onAddressError?: (error: string) => void;
}

const CepInput = React.forwardRef<HTMLInputElement, CepInputProps>(
  ({ className, value, onChange, onAddressFound, onAddressError, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [foundAddress, setFoundAddress] = React.useState(false);
    const lastFetchedCep = React.useRef<string>('');

    // Initialize display value from prop
    React.useEffect(() => {
      if (!value) {
        setDisplayValue('');
        setFoundAddress(false);
        setError(null);
      } else {
        const formatted = formatCEP(value);
        if (formatted !== displayValue) {
          setDisplayValue(formatted);
        }
      }
    }, [value]);

    const fetchCepData = async (cep: string) => {
      if (lastFetchedCep.current === cep) return; // Avoid duplicate fetches
      
      lastFetchedCep.current = cep;
      setIsLoading(true);
      setError(null);
      setFoundAddress(false);
      
      try {
        const address = await fetchAddress(cep);
        
        if (address) {
          setFoundAddress(true);
          onAddressFound?.(address);
        } else {
          setError('CEP não encontrado');
          onAddressError?.('CEP não encontrado');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar CEP';
        setError(errorMessage);
        onAddressError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const digits = parseCEP(rawValue);
      
      // Limit to 8 digits
      if (digits.length > 8) return;
      
      const formatted = formatCEP(digits);
      setDisplayValue(formatted);
      onChange(digits, formatted);
      
      // Reset states when user modifies
      setError(null);
      setFoundAddress(false);
      lastFetchedCep.current = '';
      
      // Auto-fetch when complete
      if (isCEPComplete(digits)) {
        fetchCepData(digits);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const digits = parseCEP(displayValue);
      
      // Fetch on blur if complete and not already fetched
      if (isCEPComplete(digits) && lastFetchedCep.current !== digits) {
        fetchCepData(digits);
      }
      
      props.onBlur?.(e);
    };

    return (
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          className={cn(
            'input-financial pr-10',
            error && 'border-destructive focus:ring-destructive/20',
            foundAddress && 'border-income focus:ring-income/20',
            className
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="00000-000"
          {...props}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading && (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          )}
          {!isLoading && foundAddress && (
            <MapPin className="w-4 h-4 text-income" />
          )}
          {!isLoading && error && (
            <AlertCircle className="w-4 h-4 text-destructive" />
          )}
        </div>
        {error && (
          <p className="text-xs text-destructive mt-1">{error}</p>
        )}
      </div>
    );
  }
);

CepInput.displayName = 'CepInput';

export { CepInput };
