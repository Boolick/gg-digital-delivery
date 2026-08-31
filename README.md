# GG Digital Delivery Platform

> Отказоустойчивая платформа для процессинга платежей и автоматической доставки цифровых товаров в условиях высоких нагрузок и конкурентности.

## 🚀 Описание проекта

**GG Digital Delivery** — полнофункциональная fullstack-платформа, разработанная для надежной доставки цифровых товаров (игровые ключи, лицензии, подписки). Проект построен по принципу **Contract-First (Spec-First)** со строгими гарантиями целостности данных: исключение двойных списаний/выдач, идемпотентная обработка вебхуков платежных систем и детерминированный конечный автомат (FSM) жизненного цикла заказов.

---

## 🏗 Архитектура монорепозитория

Проект организован как монорепозиторий на базе рабочих пространств (npm workspaces):

```
gg-digital-delivery/
├── packages/
│   └── shared/          # Общие Zod-схемы, контракты API, константы и сид-данные
├── backend/             # NestJS бэкенд (REST API, Swagger, PostgreSQL, FSM заказов)
├── frontend/            # Веб-интерфейс на React 19 + Vite + Tailwind CSS
├── package.json         # Скрипты и dev-зависимости корня монорепозитория
├── tsconfig.base.json   # Базовая конфигурация компилятора TypeScript
└── .prettierrc          # Единая конфигурация форматирования Prettier
```

### Пакеты и модули

- **[`@gg/shared`](file:///G:/projects/gg-digital-delivery/packages/shared)** (`packages/shared`): Единый источник правды (Single Source of Truth) для доменных типов, Zod-контрактов валидации, перечислений статусов и тестовых спецификаций.
- **[`@gg/backend`](file:///G:/projects/gg-digital-delivery/backend)** (`backend`): NestJS приложение, реализующее чистую архитектуру, транзакционную логику в PostgreSQL (`FOR UPDATE SKIP LOCKED`) и интеграции с платежными шлюзами.
- **[`@gg/frontend`](file:///G:/projects/gg-digital-delivery/frontend)** (`frontend`): Современный адаптивный UI на React 19, Vite, Tailwind CSS, иконках Lucide и React Router DOM.

---

## 🛠 Стек технологий

- **Бэкенд:** [NestJS](https://nestjs.com/), Node.js, [PostgreSQL](https://www.postgresql.org/) (драйвер `pg`), [Swagger/OpenAPI](https://swagger.io/)
- **Фронтенд:** [React 19](https://react.dev/), [Vite](https://vite.dev/), [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [React Router](https://reactrouter.com/)
- **Контракты и валидация:** [Zod](https://zod.dev/)
- **Тестирование и инструменты:** [Vitest](https://vitest.dev/), [Jest](https://jestjs.io/), [ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [TypeScript](https://www.typescriptlang.org/)

---

## 🔑 Ключевые инженерные принципы

1. **Contract-First разработка:** Общие Zod-схемы в `@gg/shared` определяют форматы запросов/ответов API и валидацию данных как для бэкенда, так и для фронтенда.
2. **Детерминированный State Machine (FSM):** Все переходы состояний заказов строго валидируются и управляются через сервис FSM.
3. **Безопасность при высокой конкурентности (Concurrency Safety):** Атомарное резервирование и выдача ключей с блокировками строк в PostgreSQL (`FOR UPDATE SKIP LOCKED`), а также идемпотентная обработка событий (`ON CONFLICT DO NOTHING`).
4. **Строгая типизация TypeScript:** Режим `strict: true` включен во всех пакетах без использования `any`.

---

## 🚦 Быстрый старт

### Требования к окружению

- **Node.js**: версии `v20.x` или выше
- **npm**: версии `v10.x` или выше
- **PostgreSQL**: версии `v15+`

### Установка зависимостей

Клонируйте репозиторий и установите зависимости всех рабочих пространств:

```bash
npm install
```

### Запуск в режиме разработки

Запуск бэкенда и фронтенда (вместе или по отдельности):

```bash
# Запуск бэкенд API (NestJS в режиме watch)
npm run start:backend

# Запуск фронтенда (Vite dev server)
npm run start:frontend
```

### Команды контроля качества и тестирования

```bash
# Проверка типов во всех пакетах
npm run typecheck

# Запуск всех тестов в монорепозитории
npm run test

# Проверка кода линтером ESLint
npm run lint

# Форматирование кода с помощью Prettier
npm run format
```

---

## 📜 Лицензия

Private & proprietary.
