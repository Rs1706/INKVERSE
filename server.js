const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store for Comics
let comicsDatabase = [
  {
    id: "01",
    title: "The Shadow",
    tag: "Noir / Mystery",
    year: 2026,
    pages: 36,
    likes: 142,
    description: "Таинственный герой появляется на улицах ночного города. Никто не знает его имени, но преступники уже знают его знак.",
    synopsis: "Город погрузился в безмолвную коррупцию. Прокуроры куплены, полиция бессильна. Лишь безымянный вигиланте в маске из застывших чернил начинает планомерную охоту на синдикат 'Глубина'. Первая глава масштабной саги о правосудии без компромиссов."
  },
  {
    id: "02",
    title: "Last Hero",
    tag: "Action / Dystopia",
    year: 2026,
    pages: 48,
    likes: 218,
    description: "Когда старые герои исчезли, остался только один человек, который способен защитить город от наступающей тьмы.",
    synopsis: "Война Титанов стёрла прежний пантеон защитников. Спустя десять лет руины мегаполиса терроризируют техно-культисты. Бывший напарник павшего альянса выходит из добровольного изгнания ради последнего боя."
  },
  {
    id: "03",
    title: "Black City",
    tag: "Cyber-Noir / Thriller",
    year: 2026,
    pages: 40,
    likes: 305,
    description: "Город без света. Город без правил. История о тех, кто пытается найти правду там, где правды больше не существует.",
    synopsis: "Энергетический коллапс отключил все внешние сети. 'Чёрный Город' изолирован от остального мира. В узких переулках разворачивается война за последний неповреждённый квантовый сервер, содержащий код пробуждения стражей."
  }
];

// In-memory submissions store
const submissions = [];

// Weather cache
let weatherCache = {
  timestamp: 0,
  data: null
};

const WEATHER_CODE_DESCRIPTIONS = {
  0: "Ясное небо",
  1: "Преимущественно ясно",
  2: "Переменная облачность",
  3: "Пасмурно",
  45: "Туман",
  48: "Изморозь и туман",
  51: "Лёгкая морось",
  53: "Морось",
  55: "Сильная морось",
  56: "Ледяная морось",
  57: "Сильная ледяная морось",
  61: "Небольшой дождь",
  63: "Дождь",
  65: "Сильный дождь",
  66: "Ледяной дождь",
  67: "Сильный ледяной дождь",
  71: "Небольшой снег",
  73: "Снег",
  75: "Сильный снег",
  77: "Снежные зёрна",
  80: "Кратковременный дождь",
  81: "Ливень",
  82: "Сильный ливень",
  85: "Небольшой снегопад",
  86: "Сильный снегопад",
  95: "Гроза",
  96: "Гроза с градом",
  99: "Сильная гроза с градом"
};

/* ========================================================
   REST API ENDPOINTS
======================================================== */

/**
 * 1. GET /api/comics
 * Получить список всех выпусков комиксов
 */
app.get('/api/comics', (req, res) => {
  res.json({
    success: true,
    count: comicsDatabase.length,
    data: comicsDatabase
  });
});

/**
 * 2. GET /api/comics/:id
 * Получить конкретный выпуск по ID
 */
app.get('/api/comics/:id', (req, res) => {
  const comic = comicsDatabase.find(c => c.id === req.params.id);
  if (!comic) {
    return res.status(404).json({
      success: false,
      error: `Выпуск #${req.params.id} не найден в архиве INKVERSE`
    });
  }
  res.json({
    success: true,
    data: comic
  });
});

/**
 * 3. POST /api/comics/:id/like
 * Поставить лайк комиксу
 */
app.post('/api/comics/:id/like', (req, res) => {
  const comic = comicsDatabase.find(c => c.id === req.params.id);
  if (!comic) {
    return res.status(404).json({
      success: false,
      error: `Выпуск #${req.params.id} не найден`
    });
  }
  comic.likes += 1;
  res.json({
    success: true,
    message: `Голос за выпуск #${comic.id} учтён!`,
    likes: comic.likes
  });
});

/**
 * 4. GET /api/weather
 * Получить погоду в Ташкенте (кэширование 60 секунд)
 */
app.get('/api/weather', async (req, res) => {
  const now = Date.now();
  const CACHE_TTL_MS = 60 * 1000;

  if (weatherCache.data && (now - weatherCache.timestamp < CACHE_TTL_MS)) {
    return res.json({
      success: true,
      cached: true,
      ...weatherCache.data
    });
  }

  try {
    const url = "https://api.open-meteo.com/v1/forecast" +
      "?latitude=41.2995&longitude=69.2401" +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m" +
      "&timezone=Asia%2FTashkent";

    const fetchResponse = await fetch(url);
    if (!fetchResponse.ok) {
      throw new Error(`Open-Meteo returned status ${fetchResponse.status}`);
    }

    const json = await fetchResponse.json();
    const current = json.current;

    const weatherPayload = {
      city: "Tashkent",
      country: "Uzbekistan",
      coordinates: { latitude: 41.2995, longitude: 69.2401 },
      temperature: Math.round(current.temperature_2m),
      apparentTemperature: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      precipitation: current.precipitation,
      weatherCode: current.weather_code,
      description: WEATHER_CODE_DESCRIPTIONS[current.weather_code] || "Нестабильные условия",
      updatedAt: current.time,
      serverTime: new Date().toISOString()
    };

    weatherCache = {
      timestamp: now,
      data: weatherPayload
    };

    res.json({
      success: true,
      cached: false,
      ...weatherPayload
    });
  } catch (error) {
    console.error("Ошибка при запросе погоды:", error.message);
    if (weatherCache.data) {
      return res.json({
        success: true,
        cached: true,
        fallback: true,
        ...weatherCache.data
      });
    }

    res.status(502).json({
      success: false,
      error: "Не удалось получить метеоданные с внешнего сервиса",
      details: error.message
    });
  }
});

/**
 * 5. POST /api/contact
 * Отправка идеи комикса / заявки автора
 */
app.post('/api/contact', (req, res) => {
  const { name, email, heroType, storyIdea } = req.body;

  if (!name || !email || !storyIdea) {
    return res.status(400).json({
      success: false,
      error: "Пожалуйста, заполните имя, email и краткое описание идеи."
    });
  }

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: "Некорректный формат email адреса."
    });
  }

  const submission = {
    ticketId: `INK-${Math.floor(1000 + Math.random() * 9000)}`,
    name: name.trim(),
    email: email.trim(),
    heroType: heroType || "Вигиланте",
    storyIdea: storyIdea.trim(),
    submittedAt: new Date().toISOString()
  };

  submissions.unshift(submission);

  res.status(201).json({
    success: true,
    message: "POW! Твоя заявка принята в редакцию INKVERSE!",
    data: submission
  });
});

/**
 * 6. GET /api/stats
 * Общая статистика вселенной INKVERSE
 */
app.get('/api/stats', (req, res) => {
  const totalLikes = comicsDatabase.reduce((acc, c) => acc + c.likes, 0);

  res.json({
    success: true,
    data: {
      issuesCount: comicsDatabase.length,
      totalLikes: totalLikes,
      submissionsCount: 420 + submissions.length,
      activeReaders: 18450 + totalLikes * 3,
      universeStatus: "ACTIVE / NOIR SECTOR"
    }
  });
});

/**
 * 7. GET /api/health
 * Проверка статуса сервиса
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: "ok",
    service: "INKVERSE API Server",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + "s"
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`⚡ INKVERSE SERVER запущен на порту ${PORT}`);
  console.log(`🌐 Открой в браузере: http://localhost:${PORT}`);
  console.log(`📡 API Endpoints:`);
  console.log(`   - GET  /api/comics`);
  console.log(`   - GET  /api/comics/:id`);
  console.log(`   - POST /api/comics/:id/like`);
  console.log(`   - GET  /api/weather`);
  console.log(`   - POST /api/contact`);
  console.log(`   - GET  /api/stats`);
  console.log(`   - GET  /api/health`);
  console.log(`===============================================`);
});
