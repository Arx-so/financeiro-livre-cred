const RECEIPT_STYLES = `
  *{box-sizing:border-box}
  body{font-family:monospace;font-size:13px;padding:24px;color:#111;background:#fff;margin:0}

  /* layout */
  .flex{display:flex}
  .justify-between{justify-content:space-between}
  .items-baseline{align-items:baseline}
  .items-center{align-items:center}
  .gap-2{gap:8px}

  /* spacing */
  .p-6{padding:24px}
  .pt-3{padding-top:12px}
  .pt-4{padding-top:16px}
  .pb-4{padding-bottom:16px}
  .mt-1{margin-top:4px}
  .mt-2{margin-top:8px}
  .space-y-1>*+*{margin-top:4px}
  .space-y-2>*+*{margin-top:8px}
  .space-y-3>*+*{margin-top:12px}
  .space-y-4>*+*{margin-top:16px}

  /* borders */
  .border{border:1px solid #d1d5db}
  .border-b{border-bottom:1px solid #d1d5db}
  .border-t{border-top:1px solid #d1d5db}
  .rounded-lg{border-radius:8px}

  /* text */
  .text-center{text-align:center}
  .text-xs{font-size:11px}
  .text-sm{font-size:13px}
  .text-lg{font-size:18px}
  .font-mono{font-family:monospace}
  .font-semibold{font-weight:600}
  .font-bold{font-weight:700}
  .font-medium{font-weight:500}
  .text-muted-foreground{color:#6b7280}
  .leading-snug{line-height:1.375}

  @media print{
    body{padding:0}
    .border{border:1px solid #999}
    .border-b{border-bottom:1px solid #999}
    .border-t{border-top:1px solid #999}
  }
`;

export function printReceiptElement(elementId: string, title = 'Recibo') {
    const element = document.getElementById(elementId);
    if (!element) return;

    const win = window.open('', '_blank', 'width=480,height=720');
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>${RECEIPT_STYLES}</style>
</head>
<body>${element.outerHTML}</body>
</html>`);

    win.document.close();
    win.focus();
    setTimeout(() => {
        win.print();
        win.close();
    }, 250);
}
