// Конфигурация для Telegram бота
module.exports = {
  // Токен вашего Telegram бота (получите у @BotFather)
  BOT_TOKEN: '8403584306:AAH4Ur6s46KYaUrjGOk3DRjT4d6AjbqKzj8',
  
  // Пользователи системы
  USERS: {
    // Администраторы парков
    adminApet: { password: '1234', park: 'parkFrunze', role: 'admin' },
    adminNarek: { password: '4321', park: 'parkMorVokzal', role: 'admin' },
    adminXunk: { password: '9999', park: 'parkNeptun', role: 'admin' },
    
    // Дополнительные пользователи для парка Фрунзе
    manager1: { password: '5678', park: 'parkFrunze', role: 'manager' },
    manager2: { password: '8765', park: 'parkFrunze', role: 'manager' },
    supervisor1: { password: '1111', park: 'parkFrunze', role: 'supervisor' },
    supervisor2: { password: '2222', park: 'parkFrunze', role: 'supervisor' },
    
    // Пользователи для других парков
    managerMorVokzal: { password: '3333', park: 'parkMorVokzal', role: 'manager' },
    managerNeptun: { password: '4444', park: 'parkNeptun', role: 'manager' },
    
    // Тестовые пользователи
    testUser1: { password: 'test1', park: 'parkFrunze', role: 'viewer' },
    testUser2: { password: 'test2', park: 'parkFrunze', role: 'viewer' }
  },
  
  // Настройки зарплаты
  SALARY_RATES: {
    '++': 2000,      // Двойная смена
    'ст': 1000,      // Стандартная смена
    'касса1': 2500,  // Касса 1
    'касса2': 3000,  // Касса 2
    '+': 1500,       // Дополнительная смена
    '1200': 1200,    // Смена 1200
    '1000': 1000,    // Смена 1000
  },
  
  // Настройки парков
  PARKS: {
    parkFrunze: {
      name: 'Парк Фрунзе',
      hockeyMachines: 5,  // Количество хоккейных автоматов
      boxerMachines: 1,   // Количество боксёрских автоматов
    },
    parkMorVokzal: {
      name: 'Парк Морской Вокзал',
      hockeyMachines: 1,
      boxerMachines: 1,
    },
    parkNeptun: {
      name: 'Парк Нептун',
      hockeyMachines: 1,
      boxerMachines: 1,
    },
  },
  
  // Настройки бота
  BOT_SETTINGS: {
    polling: true,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  },
  
  // Настройки данных
  DATA_SETTINGS: {
    dataFile: './bot-data.json',
    backupInterval: 24 * 60 * 60 * 1000, // 24 часа
  },
  
  // Настройки безопасности
  SECURITY: {
    maxLoginAttempts: 3,        // Максимальное количество попыток входа
    sessionTimeout: 30 * 60,    // Таймаут сессии в секундах (30 минут)
    allowedUsers: 10,           // Максимальное количество пользователей
  }
}; 