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
  const cents = Number(digits || '0');
  return brlFormatter.format(cents / 100);
}

function numberToCentsDigits(n: number) {
  const cents = Math.round((Number.isFinite(n) ? n : 0) * 100);
  return String(Math.max(0, cents));
}

function parseDisplayToNumber(display: string) {
  if (!display) return 0;

  const str = String(display).trim();

  // Se contém vírgula como separador decimal (formato brasileiro: R$ 89,00 ou 89,00)
  if (str.includes(',')) {
    const cleaned = str
      .replace(/[R$\s]/g, '')  // remove símbolo e espaços
      .replace(/\./g, '')      // remove pontos de milhar
      .replace(',', '.');      // converte vírgula decimal para ponto
    return parseFloat(cleaned) || 0;
  }

  // Se é um número simples em formato inglês (89.00 ou 89)
  const numericStr = str.replace(/[^\d.]/g, '');
  return parseFloat(numericStr) || 0;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, onKeyDown: externalOnKeyDown, ...props }, ref) => {
    const [digits, setDigits] = React.useState<string>(''); // fonte da verdade: "centavos"
    const [isEditing, setIsEditing] = React.useState(false);

    // sync externo -> interno (só quando não está editando)
    React.useEffect(() => {
      // Don't sync while user is actively editing
      if (isEditing) return;

      if (value === '' || value === null || value === undefined) {
        setDigits('');
        return;
      }

      const num = typeof value === 'string' ? parseDisplayToNumber(value) : value;
      const newDigits = numberToCentsDigits(num);
      setDigits(newDigits);
    }, [value, isEditing]);

    const commit = React.useCallback(
      (nextDigits: string) => {
        // manter "" quando vazio; caso contrário, mantém zeros (inclusive finais)
        setDigits(nextDigits);

        if (nextDigits.length === 0) {
          onChange(0, '');
          return;
        }

        const formatted = formatFromCentsDigits(nextDigits);
        const numeric = Number(nextDigits) / 100;
        onChange(numeric, formatted);
      },
      [onChange]
    );

    const appendDigit = React.useCallback((d: string) => {
      // NÃO remover zeros finais. Apenas limita tamanho se quiser.
      const next = (digits + d).replace(/^0+(?=\d)/, ''); // remove zeros à esquerda só quando já tem outros dígitos
      commit(next);
    }, [digits, commit]);

    const backspace = React.useCallback(() => {
      commit(digits.slice(0, -1));
    }, [digits, commit]);

    // Track if we're handling input via onBeforeInput to avoid double processing
    const isHandlingInput = React.useRef(false);

    // Captura digitação (desktop e muitos mobiles)
    const handleBeforeInput = React.useCallback((e: React.FormEvent<HTMLInputElement>) => {
        isHandlingInput.current = true;
        const ne = e.nativeEvent as InputEvent;

        if (ne.inputType === 'insertText' && typeof ne.data === 'string') {
            const chunkDigits = ne.data.replace(/\D/g, ''); // pega "89,00" -> "8900"
            if (chunkDigits.length > 0) {
                e.preventDefault();
                const next = (digits + chunkDigits).replace(/^0+(?=\d)/, '');
                commit(next);
                return;
            }
        }

        if (ne.inputType === 'deleteContentBackward') {
            e.preventDefault();
            backspace();
        }
    }, [digits, commit, backspace]);


    // Fallback (alguns browsers/mobiles)
    const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      // Handle Enter and Escape - let external handler process them first
      if (e.key === 'Enter' || e.key === 'Escape') {
        externalOnKeyDown?.(e);
        // Don't prevent default, let the event propagate
        return;
      }

      // Handle Backspace
      if (e.key === 'Backspace') {
        e.preventDefault();
        backspace();
        return;
      }

      // Handle numeric digits
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        appendDigit(e.key);
        return;
      }

      // Allow navigation keys
      if (['ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key)) {
        externalOnKeyDown?.(e);
        return;
      }

      // Block other keys to prevent breaking the format
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
      }

      // Call external handler for other keys (after processing)
      externalOnKeyDown?.(e);
    }, [appendDigit, backspace, externalOnKeyDown]);

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData('text') || '';
      const pastedDigits = text.replace(/\D/g, '');
      if (!pastedDigits) return;

      e.preventDefault();
      const next = (digits + pastedDigits).replace(/^0+(?=\d)/, '');
      commit(next);
    };

    const displayValue = digits.length ? formatFromCentsDigits(digits) : '';

    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      // Only use onChange as fallback if onBeforeInput didn't work
      // This happens in some browsers or when input is pasted/dragged
      if (isHandlingInput.current) {
        isHandlingInput.current = false;
        return;
      }

      const inputValue = e.target.value;
      // Extract all digits from the formatted value
      const extractedDigits = inputValue.replace(/[^\d]/g, '');

      if (extractedDigits !== digits) {
        const next = extractedDigits.replace(/^0+(?=\d)/, '') || '';
        commit(next);
      }
    }, [digits, commit]);

    return (
      <input
        type="text"
        inputMode="numeric"
        className={cn('input-financial font-mono-numbers', className)}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onBeforeInput={handleBeforeInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={() => setIsEditing(true)}
        onBlur={() => setIsEditing(false)}
        placeholder="R$ 0,00"
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
