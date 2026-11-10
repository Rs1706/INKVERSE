# 🖤 INKVERSE — Comic Landing Page with REST API

Лендинг в комиксном бруталистском черно-белом стиле с полноценным набором REST API эндпоинтов на Node.js / Express.

## 🚀 Быстрый запуск

В папке проекта выполните:

```bash
# 1. Перейдите в папку проекта (если ещё не там)
cd C:\Users\602.DESKTOP-0VAA5AL\.gemini\antigravity\scratch\inkverse-landing

# 2. Установите зависимости (express, cors уже установлены)
npm install

# 3. Запустите сервер
node server.js
```

После этого откройте в браузере: **`http://localhost:3000`**

---

## 📡 Реализованные REST API Эндпоинты

| Метод | Эндпоинт | Назначение | Пример ответа |
|---|---|---|---|
| **GET** | `/api/comics` | Получить список всех выпусков комиксов с лайками и тегами | `{"success": true, "count": 3, "data": [...]}` |
| **GET** | `/api/comics/:id` | Получить подробный синопсис и данные выпуска по ID | `{"success": true, "data": {"id": "01", "synopsis": "..."}}` |
| **POST** | `/api/comics/:id/like` | Поставить лайк выпуску в реальном времени | `{"success": true, "likes": 143}` |
| **GET** | `/api/weather` | Погода в Ташкенте с серверным кэшем (Open-Meteo) | `{"success": true, "temperature": 18, "humidity": 45, ...}` |
| **POST** | `/api/contact` | Отправка заявки / авторской идеи комикса | `{"success": true, "ticketId": "INK-7391"}` |
| **GET** | `/api/stats` | Динамическая статистика вселенной (лайки, читатели) | `{"success": true, "data": {"activeReaders": 18450}}` |
| **GET** | `/api/health` | Проверка статуса сервера и времени непрерывной работы | `{"status": "ok", "uptime": "120s"}` |

---

## 🧪 Примеры cURL запросов

### 1. Получить все комиксы:
```bash
curl http://localhost:3000/api/comics
```

### 2. Лайкнуть выпуск #01:
```bash
curl -X POST http://localhost:3000/api/comics/01/like
```

### 3. Отправить заявку на выпуск:
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name": "Victor", "email": "victor@noir.com", "heroType": "Вигиланте", "storyIdea": "В Ташкенте выключают свет..."}'
```

### 4. Получить кэшированную погоду:
```bash
curl http://localhost:3000/api/weather
```
