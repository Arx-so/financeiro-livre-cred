# Process Recurring Edge Function

Esta Edge Function processa lançamentos recorrentes diariamente.

## Funcionalidades

1. **Gera lançamentos futuros**: Cria automaticamente os próximos 12 meses de lançamentos baseado nos templates recorrentes
2. **Atualiza status de atrasados**: Marca automaticamente como "atrasado" os lançamentos pendentes com vencimento anterior à data atual

## Deploy

```bash
# Na pasta do projeto
supabase functions deploy process-recurring
```

## Configuração do Cron Job

### Opção 1: Via Supabase Dashboard

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Database** → **Extensions** e habilite `pg_cron` se ainda não estiver
4. Vá em **SQL Editor** e execute:

```sql
-- Habilitar extensão pg_cron (se necessário)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar execução diária às 00:05
SELECT cron.schedule(
  'process-recurring-entries',  -- nome do job
  '5 0 * * *',                  -- cron expression: 00:05 todos os dias
  $$
  SELECT
    net.http_post(
      url:='https://<SEU_PROJETO>.supabase.co/functions/v1/process-recurring',
      headers:='{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
    ) AS request_id;
  $$
);
```

Substitua:
- `<SEU_PROJETO>` pelo ID do seu projeto Supabase
- `<SERVICE_ROLE_KEY>` pela chave service_role do projeto

### Opção 2: Via API

```bash
curl -X POST 'https://<SEU_PROJETO>.supabase.co/functions/v1/process-recurring' \
  -H 'Authorization: Bearer <SERVICE_ROLE_KEY>'
```

## Verificar Jobs Agendados

```sql
SELECT * FROM cron.job;
```

## Remover Job

```sql
SELECT cron.unschedule('process-recurring-entries');
```

## Logs

Os logs da Edge Function podem ser visualizados em:
- Dashboard → Functions → process-recurring → Logs

## Teste Manual

Para testar manualmente, faça uma requisição POST para a função:

```bash
curl -X POST 'https://<SEU_PROJETO>.supabase.co/functions/v1/process-recurring' \
  -H 'Authorization: Bearer <SERVICE_ROLE_KEY>' \
  -H 'Content-Type: application/json'
```

Resposta esperada:

```json
{
  "success": true,
  "message": "Recurring entries processed successfully",
  "data": {
    "created_entries": 5,
    "updated_overdue": 2,
    "errors": []
  }
}
```
