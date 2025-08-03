const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// Простой тестовый сервер
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Test server is running',
    port: PORT,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    port: PORT
  });
});

app.get('/ping', (req, res) => {
  res.json({ pong: true, timestamp: new Date().toISOString() });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Тестовый сервер запущен на порту ${PORT}`);
  console.log(`🌐 Доступен по адресу: http://localhost:${PORT}`);
  console.log(`🌍 Слушает на всех интерфейсах: 0.0.0.0:${PORT}`);
  console.log(`📊 Endpoints: /, /health, /ping`);
}); 