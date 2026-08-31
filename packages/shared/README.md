# @gg/shared

Пакет общих Zod-контрактов, констант, схемы FSM и сид-данных для платформы `gg-digital-delivery`.

## Содержимое пакета

- [`src/contracts.ts`](src/contracts.ts): Канонические Zod-схемы и TypeScript-типы:
  - Сущности: `Product`, `Order`, `PromocodeEntity`
  - Спецификация FSM: матрица `FSM_TRANSITIONS`, `isValidFsmTransition()`
  - Запросы и ответы: `CreateOrderRequest`, `CreateOrderResponse`, `GetOrderStatusResponse`
  - Платежные вебхуки: `PaymentWebhookPayload`, `PaymentWebhookResponse`, `WEBHOOK_SIGNATURE_HEADER`
  - Интеграция провайдеров: `IssueRequest`, `IssueResponseSuccess`, `IssueResponseError`
  - Административные контракты: `AdminRetryDeliveryResponse`, `AdminRestockKeysRequest`, `AdminRestockKeysResponse`
- [`src/seed-data.ts`](src/seed-data.ts): READ-ONLY сид-данные по ТЗ:
  - 12 товаров (`SEED_PRODUCTS`)
  - 50 ключей (`SEED_KEYS`)
  - 4 промокода (`SEED_PROMOCODES`: `LIMIT3`, `DISCOUNT10`, `OFF500`, `SUPER50`)
- [`src/constants.ts`](src/constants.ts): Системные константы валют и статусов.

## Использование

```typescript
import {
  CreateOrderRequestSchema,
  FSM_TRANSITIONS,
  isValidFsmTransition,
  SEED_PRODUCTS,
} from '@gg/shared';
```

## Тестирование

```bash
npm run test --workspace=@gg/shared
```
