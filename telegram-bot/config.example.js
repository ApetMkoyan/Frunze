// Пример конфигурации для Telegram бота
// Скопируйте этот файл как config.js и заполните своими данными

module.exports = {
  // Токен вашего Telegram бота (получите у @BotFather)
  BOT_TOKEN: '8403584306:AAH4Ur6s46KYaUrjGOk3DRjT4d6AjbqKzj8',
  
  // Пользователи системы
  USERS: {
    adminApet: { password: '1234', park: 'parkFrunze' },
    adminNarek: { password: '4321', park: 'parkMorVokzal' },
    adminXunk: { password: '9999', park: 'parkNeptun' },
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
}; 