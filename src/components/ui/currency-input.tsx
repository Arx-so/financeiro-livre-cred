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
  ({ className, value, onChange, ...props }, ref) => {
    const [digits, setDigits] = React.useState<string>(''); // fonte da verdade: "centavos"
    const [isEditing, setIsEditing] = React.useState(false);

    // sync externo -> interno (só quando não está editando)
    React.useEffect(() => {
      if (isEditing) return;

      if (value === '' || value === null || value === undefined) {
        setDigits('');
        return;
      }

      const num = typeof value === 'string' ? parseDisplayToNumber(value) : value;
      setDigits(numberToCentsDigits(num));
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

    const appendDigit = (d: string) => {
      // NÃO remover zeros finais. Apenas limita tamanho se quiser.
      const next = (digits + d).replace(/^0+(?=\d)/, ''); // remove zeros à esquerda só quando já tem outros dígitos
      commit(next);
    };

    const backspace = () => {
      commit(digits.slice(0, -1));
    };

    // Captura digitação (desktop e muitos mobiles)
   const handleBeforeInput = (e: React.FormEvent<HTMLInputElement>) => {
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
    };


    // Fallback (alguns browsers/mobiles)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        backspace();
        return;
      }

      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        appendDigit(e.key);
        return;
      }

      // permitir navegação
      if (['ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key)) return;

      // bloqueia o resto pra não “bagunçar” o formato
      if (!e.ctrlKey && !e.metaKey) e.preventDefault();
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData('text') || '';
      const pastedDigits = text.replace(/\D/g, '');
      if (!pastedDigits) return;

      e.preventDefault();
      const next = (digits + pastedDigits).replace(/^0+(?=\d)/, '');
      commit(next);
    };

    const displayValue = digits.length ? formatFromCentsDigits(digits) : '';

    return (
      <input
        type="text"
        inputMode="numeric"
        className={cn('input-financial font-mono-numbers', className)}
        ref={ref}
        value={displayValue}
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
