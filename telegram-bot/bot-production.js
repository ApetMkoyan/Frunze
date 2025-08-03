const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Загрузка переменных окружения
require('dotenv').config();

// Конфигурация
const config = {
  BOT_TOKEN: process.env.BOT_TOKEN || '8403584306:AAH4Ur6s46KYaUrjGOk3DRjT4d6AjbqKzj8',
  USERS: {
    adminApet: { password: '1234', park: 'parkFrunze', role: 'admin' },
    adminNarek: { password: '4321', park: 'parkMorVokzal', role: 'admin' },
    adminXunk: { password: '9999', park: 'parkNeptun', role: 'admin' },
    manager1: { password: '5678', park: 'parkFrunze', role: 'manager' },
    manager2: { password: '8765', park: 'parkFrunze', role: 'manager' },
    supervisor1: { password: '1111', park: 'parkFrunze', role: 'supervisor' },
    supervisor2: { password: '2222', park: 'parkFrunze', role: 'supervisor' },
    managerMorVokzal: { password: '3333', park: 'parkMorVokzal', role: 'manager' },
    managerNeptun: { password: '4444', park: 'parkNeptun', role: 'manager' },
    testUser1: { password: 'test1', park: 'parkFrunze', role: 'viewer' },
    testUser2: { password: 'test2', park: 'parkFrunze', role: 'viewer' }
  },
  PARKS: {
    parkFrunze: { name: 'Парк Фрунзе', hockeyMachines: 5, boxerMachines: 1 },
    parkMorVokzal: { name: 'Парк Морской Вокзал', hockeyMachines: 1, boxerMachines: 1 },
    parkNeptun: { name: 'Парк Нептун', hockeyMachines: 1, boxerMachines: 1 }
  },
  SECURITY: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 3,
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 30 * 60,
    allowedUsers: parseInt(process.env.ALLOWED_USERS) || 10
  },
  DATA_SETTINGS: {
    dataFile: process.env.DATA_FILE || './bot-data.json',
    backupInterval: parseInt(process.env.BACKUP_INTERVAL) || 24 * 60 * 60 * 1000
  },
  BOT_SETTINGS: {
    polling: true,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  }
};

const bot = new TelegramBot(config.BOT_TOKEN, config.BOT_SETTINGS);

// Структура данных
let parksData = {};
const userStates = {};
const loginAttempts = {};
const activeSessions = {};

// Загрузка данных
function loadData() {
  try {
    if (fs.existsSync(config.DATA_SETTINGS.dataFile)) {
      const raw = fs.readFileSync(config.DATA_SETTINGS.dataFile);
      parksData = JSON.parse(raw);
      console.log('✅ Данные загружены успешно');
    } else {
      parksData = {
        parkFrunze: { employees: [], shifts: {}, machines: [] },
        parkMorVokzal: { employees: [], shifts: {}, machines: [] },
        parkNeptun: { employees: [], shifts: {}, machines: [] }
      };
      saveData();
      console.log('✅ Создан новый файл данных');
    }
  } catch (error) {
    console.log('❌ Ошибка загрузки данных:', error);
    parksData = {
      parkFrunze: { employees: [], shifts: {}, machines: [] },
      parkMorVokzal: { employees: [], shifts: {}, machines: [] },
      parkNeptun: { employees: [], shifts: {}, machines: [] }
    };
  }
}

// Сохранение данных
function saveData() {
  try {
    fs.writeFileSync(config.DATA_SETTINGS.dataFile, JSON.stringify(parksData, null, 2));
    console.log('💾 Данные сохранены');
  } catch (error) {
    console.log('❌ Ошибка сохранения данных:', error);
  }
}

// Автоматическое резервное копирование
function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup-${timestamp}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(parksData, null, 2));
    console.log(`💾 Резервная копия создана: ${backupFile}`);
  } catch (error) {
    console.log('❌ Ошибка создания резервной копии:', error);
  }
}

// Мониторинг
function logStatus() {
  const activeUsers = Object.keys(activeSessions).length;
  const totalEmployees = Object.values(parksData).reduce((sum, park) => sum + park.employees.length, 0);
  const totalMachines = Object.values(parksData).reduce((sum, park) => sum + park.machines.length, 0);
  
  console.log(`🟢 Статус бота:`);
  console.log(`   👥 Активных пользователей: ${activeUsers}/${config.SECURITY.allowedUsers}`);
  console.log(`   🏢 Всего сотрудников: ${totalEmployees}`);
  console.log(`   🎮 Всего записей автоматов: ${totalMachines}`);
  console.log(`   ⏰ Время: ${new Date().toLocaleString()}`);
}

loadData();

// Настройка автоматических задач
setInterval(createBackup, config.DATA_SETTINGS.backupInterval);
setInterval(logStatus, 5 * 60 * 1000); // Каждые 5 минут

// Проверка безопасности
function checkSecurity(chatId) {
  const now = Date.now();
  
  // Очистка старых сессий
  Object.keys(activeSessions).forEach(sessionId => {
    if (now - activeSessions[sessionId].timestamp > config.SECURITY.sessionTimeout * 1000) {
      delete activeSessions[sessionId];
      delete userStates[sessionId];
      console.log(`⏰ Сессия ${sessionId} истекла`);
    }
  });
  
  // Проверка количества активных пользователей
  const activeUsers = Object.keys(activeSessions).length;
  if (activeUsers >= config.SECURITY.allowedUsers) {
    return { allowed: false, reason: 'Достигнут лимит активных пользователей' };
  }
  
  return { allowed: true };
}

// Проверка роли пользователя
function checkPermission(userRole, action) {
  const permissions = {
    admin: ['read', 'write', 'delete', 'manage_users'],
    manager: ['read', 'write'],
    supervisor: ['read', 'write'],
    viewer: ['read']
  };
  
  return permissions[userRole]?.includes(action) || false;
}

// Клавиатуры
const mainKeyboard = {
  reply_markup: {
    keyboard: [
      ['👥 Сотрудники', '📅 Смены'],
      ['🎮 Хоккей/Боксёр', '📊 Отчёты'],
      ['⚙️ Настройки', 'ℹ️ О программе'],
      ['🚪 Выйти']
    ],
    resize_keyboard: true
  }
};

const backKeyboard = {
  reply_markup: {
    keyboard: [['🔙 Назад']],
    resize_keyboard: true
  }
};

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const securityCheck = checkSecurity(chatId);
  
  if (!securityCheck.allowed) {
    bot.sendMessage(chatId, `❌ ${securityCheck.reason}. Попробуйте позже.`);
    return;
  }
  
  userStates[chatId] = { state: 'login', step: 'username' };
  loginAttempts[chatId] = 0;
  
  bot.sendMessage(chatId, 
    '🎢 Добро пожаловать в систему управления парком аттракционов!\n\n' +
    'Для входа введите логин:',
    backKeyboard
  );
});

// Обработка текстовых сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Проверка безопасности
  const securityCheck = checkSecurity(chatId);
  if (!securityCheck.allowed) {
    bot.sendMessage(chatId, `❌ ${securityCheck.reason}. Попробуйте позже.`);
    return;
  }
  
  if (!userStates[chatId]) {
    userStates[chatId] = { state: 'login', step: 'username' };
    loginAttempts[chatId] = 0;
  }
  
  const state = userStates[chatId];
  
  // Обработка выхода
  if (text === '🚪 Выйти') {
    delete userStates[chatId];
    delete activeSessions[chatId];
    delete loginAttempts[chatId];
    bot.sendMessage(chatId, 'Вы вышли из системы. Введите /start для повторного входа.');
    return;
  }
  
  // Обработка возврата
  if (text === '🔙 Назад') {
    if (state.state === 'logged_in') {
      showMainMenu(chatId);
    } else {
      userStates[chatId] = { state: 'login', step: 'username' };
      bot.sendMessage(chatId, 'Введите логин:', backKeyboard);
    }
    return;
  }
  
  // Обработка авторизации
  if (state.state === 'login') {
    handleLogin(chatId, text, state);
    return;
  }
  
  // Обработка главного меню
  if (state.state === 'logged_in') {
    handleMainMenu(chatId, text, state);
    return;
  }
  
  // Обработка состояний
  handleStates(chatId, text, state);
});

// Обработка авторизации
function handleLogin(chatId, text, state) {
  if (state.step === 'username') {
    if (config.USERS[text]) {
      state.username = text;
      state.step = 'password';
      bot.sendMessage(chatId, 'Введите пароль:');
    } else {
      loginAttempts[chatId] = (loginAttempts[chatId] || 0) + 1;
      if (loginAttempts[chatId] >= config.SECURITY.maxLoginAttempts) {
        bot.sendMessage(chatId, '❌ Слишком много попыток входа. Попробуйте позже.');
        delete userStates[chatId];
        return;
      }
      bot.sendMessage(chatId, `❌ Неверный логин. Попыток осталось: ${config.SECURITY.maxLoginAttempts - loginAttempts[chatId]}`);
    }
  } else if (state.step === 'password') {
    if (config.USERS[state.username] && config.USERS[state.username].password === text) {
      state.state = 'logged_in';
      state.park = config.USERS[state.username].park;
      state.role = config.USERS[state.username].role;
      delete state.step;
      delete state.username;
      delete loginAttempts[chatId];
      
      // Создание сессии
      activeSessions[chatId] = {
        user: state.username,
        park: state.park,
        role: state.role,
        timestamp: Date.now()
      };
      
      const parkName = config.PARKS[state.park]?.name || state.park;
      bot.sendMessage(chatId, 
        `✅ Успешный вход!\n🏢 Парк: ${parkName}\n👤 Роль: ${state.role}`,
        mainKeyboard
      );
      showMainMenu(chatId);
    } else {
      loginAttempts[chatId] = (loginAttempts[chatId] || 0) + 1;
      if (loginAttempts[chatId] >= config.SECURITY.maxLoginAttempts) {
        bot.sendMessage(chatId, '❌ Слишком много попыток входа. Попробуйте позже.');
        delete userStates[chatId];
        return;
      }
      bot.sendMessage(chatId, `❌ Неверный пароль. Попыток осталось: ${config.SECURITY.maxLoginAttempts - loginAttempts[chatId]}`);
    }
  }
}

// Показать главное меню
function showMainMenu(chatId) {
  const state = userStates[chatId];
  const park = state.park;
  const parkName = config.PARKS[park]?.name || park;
  
  bot.sendMessage(chatId, 
    `🏢 Парк: ${parkName}\n👤 Роль: ${state.role}\n\nВыберите действие:`,
    mainKeyboard
  );
}

// Обработка главного меню
function handleMainMenu(chatId, text, state) {
  switch (text) {
    case '👥 Сотрудники':
      if (checkPermission(state.role, 'read')) {
        showEmployeesMenu(chatId, state);
      } else {
        bot.sendMessage(chatId, '❌ У вас нет прав для просмотра сотрудников.');
      }
      break;
    case '📅 Смены':
      if (checkPermission(state.role, 'read')) {
        showShiftsMenu(chatId, state);
      } else {
        bot.sendMessage(chatId, '❌ У вас нет прав для просмотра смен.');
      }
      break;
    case '🎮 Хоккей/Боксёр':
      if (checkPermission(state.role, 'read')) {
        showMachinesMenu(chatId, state);
      } else {
        bot.sendMessage(chatId, '❌ У вас нет прав для просмотра автоматов.');
      }
      break;
    case '📊 Отчёты':
      if (checkPermission(state.role, 'read')) {
        showReports(chatId, state);
      } else {
        bot.sendMessage(chatId, '❌ У вас нет прав для просмотра отчётов.');
      }
      break;
    case '⚙️ Настройки':
      showSettings(chatId, state);
      break;
    case 'ℹ️ О программе':
      showAbout(chatId);
      break;
  }
}

// Меню сотрудников
function showEmployeesMenu(chatId, state) {
  const park = state.park;
  const employees = parksData[park]?.employees || [];
  const parkName = config.PARKS[park]?.name || park;
  
  let message = `👥 Сотрудники парка ${parkName}:\n\n`;
  if (employees.length === 0) {
    message += 'Список сотрудников пуст';
  } else {
    employees.forEach((emp, index) => {
      message += `${index + 1}. ${emp}\n`;
    });
  }
  
  const keyboard = {
    reply_markup: {
      keyboard: [
        ['➕ Добавить сотрудника'],
        ['🗑️ Удалить сотрудника'],
        ['🔙 Назад']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, keyboard);
  state.currentSection = 'employees';
}

// Меню смен
function showShiftsMenu(chatId, state) {
  const park = state.park;
  const employees = parksData[park]?.employees || [];
  const shifts = parksData[park]?.shifts || {};
  const parkName = config.PARKS[park]?.name || park;
  
  let message = `📅 Таблица смен парка ${parkName}:\n\n`;
  
  if (employees.length === 0) {
    message += 'Нет сотрудников для отображения смен';
  } else {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    message += 'Сотрудник | ' + days.join(' | ') + ' | Зарплата\n';
    message += '─'.repeat(50) + '\n';
    
    employees.forEach(name => {
      const row = shifts[name] || Array(7).fill('');
      const salary = calculateSalary(name, row);
      message += `${name} | ${row.join(' | ')} | ${salary}₽\n`;
    });
  }
  
  const keyboard = {
    reply_markup: {
      keyboard: [
        ['✏️ Редактировать смены'],
        ['💰 Расчёт зарплаты'],
        ['🔙 Назад']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, keyboard);
  state.currentSection = 'shifts';
}

// Меню автоматов
function showMachinesMenu(chatId, state) {
  const park = state.park;
  const machines = parksData[park]?.machines || [];
  const parkName = config.PARKS[park]?.name || park;
  
  let message = `🎮 Хоккей/Боксёр парка ${parkName}:\n\n`;
  
  if (machines.length === 0) {
    message += 'История пуста';
  } else {
    message += 'Тип | С | По | Сумма\n';
    message += '─'.repeat(30) + '\n';
    
    machines.forEach(entry => {
      const type = entry.type === 'hockey' ? 'Хоккей' : 'Боксёр';
      message += `${type} | ${entry.from} | ${entry.to} | ${entry.amount}₽\n`;
    });
  }
  
  const keyboard = {
    reply_markup: {
      keyboard: [
        ['➕ Добавить запись'],
        ['🗑️ Удалить запись'],
        ['🔙 Назад']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, keyboard);
  state.currentSection = 'machines';
}

// Отчёты
function showReports(chatId, state) {
  const park = state.park;
  const employees = parksData[park]?.employees || [];
  const shifts = parksData[park]?.shifts || {};
  const machines = parksData[park]?.machines || [];
  const parkName = config.PARKS[park]?.name || park;
  
  // Расчёт общей зарплаты
  let totalSalary = 0;
  employees.forEach(name => {
    const row = shifts[name] || Array(7).fill('');
    totalSalary += calculateSalary(name, row);
  });
  
  // Расчёт доходов с автоматов
  const hockeyIncome = machines
    .filter(m => m.type === 'hockey')
    .reduce((sum, m) => sum + m.amount, 0);
  
  const boxerIncome = machines
    .filter(m => m.type === 'boxer')
    .reduce((sum, m) => sum + m.amount, 0);
  
  const message = `📊 Отчёт по парку ${parkName}:\n\n` +
    `👥 Сотрудников: ${employees.length}\n` +
    `💰 Общая зарплата: ${totalSalary}₽\n` +
    `🏒 Доход с хоккея: ${hockeyIncome}₽\n` +
    `🥊 Доход с боксёра: ${boxerIncome}₽\n` +
    `📈 Общий доход: ${hockeyIncome + boxerIncome}₽\n` +
    `💵 Прибыль: ${hockeyIncome + boxerIncome - totalSalary}₽`;
  
  const keyboard = {
    reply_markup: {
      keyboard: [['🔙 Назад']],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, keyboard);
}

// Настройки
function showSettings(chatId, state) {
  const park = state.park;
  const parkName = config.PARKS[park]?.name || park;
  
  const message = `⚙️ Настройки\n\n` +
    `🏢 Парк: ${parkName}\n` +
    `👤 Пользователь: ${Object.keys(config.USERS).find(u => config.USERS[u].park === park)}\n` +
    `🔐 Роль: ${state.role}\n` +
    `⏰ Активных сессий: ${Object.keys(activeSessions).length}/${config.SECURITY.allowedUsers}\n` +
    `🔄 Авторезерв: ${config.DATA_SETTINGS.backupInterval / (60 * 60 * 1000)}ч\n` +
    `🔒 Попыток входа: ${config.SECURITY.maxLoginAttempts}\n` +
    `⏱️ Таймаут сессии: ${config.SECURITY.sessionTimeout / 60}мин`;
  
  const keyboard = {
    reply_markup: {
      keyboard: [['🔙 Назад']],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, keyboard);
}

// О программе
function showAbout(chatId) {
  const message = `ℹ️ О программе\n\n` +
    `🎢 Система управления парком аттракционов\n` +
    `Версия: 3.0.0 (Продакшн)\n\n` +
    `📋 Функции:\n` +
    `• Управление сотрудниками\n` +
    `• Планирование смен\n` +
    `• Учёт доходов с автоматов\n` +
    `• Формирование отчётов\n` +
    `• Система ролей и безопасности\n` +
    `• Автоматическое резервное копирование\n` +
    `• Мониторинг работы\n\n` +
    `🔐 Роли:\n` +
    `• admin - полный доступ\n` +
    `• manager - чтение и запись\n` +
    `• supervisor - чтение и запись\n` +
    `• viewer - только чтение\n\n` +
    `🏢 Парки: ${Object.keys(config.PARKS).map(park => config.PARKS[park].name).join(', ')}\n\n` +
    `🔄 Авторезерв: ${config.DATA_SETTINGS.backupInterval / (60 * 60 * 1000)}ч\n` +
    `👥 Лимит пользователей: ${config.SECURITY.allowedUsers}`;
  
  const keyboard = {
    reply_markup: {
      keyboard: [['🔙 Назад']],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, keyboard);
}

// Обработка состояний
function handleStates(chatId, text, state) {
  if (!state.currentSection) return;
  
  switch (state.currentSection) {
    case 'employees':
      handleEmployeesStates(chatId, text, state);
      break;
    case 'shifts':
      handleShiftsStates(chatId, text, state);
      break;
    case 'machines':
      handleMachinesStates(chatId, text, state);
      break;
  }
}

// Обработка состояний сотрудников
function handleEmployeesStates(chatId, text, state) {
  if (text === '➕ Добавить сотрудника') {
    if (!checkPermission(state.role, 'write')) {
      bot.sendMessage(chatId, '❌ У вас нет прав для добавления сотрудников.');
      return;
    }
    state.subState = 'adding_employee';
    bot.sendMessage(chatId, 'Введите имя сотрудника:');
  } else if (text === '🗑️ Удалить сотрудника') {
    if (!checkPermission(state.role, 'delete')) {
      bot.sendMessage(chatId, '❌ У вас нет прав для удаления сотрудников.');
      return;
    }
    const employees = parksData[state.park]?.employees || [];
    if (employees.length === 0) {
      bot.sendMessage(chatId, 'Нет сотрудников для удаления');
      return;
    }
    
    let message = 'Выберите сотрудника для удаления:\n\n';
    employees.forEach((emp, index) => {
      message += `${index + 1}. ${emp}\n`;
    });
    
    state.subState = 'deleting_employee';
    bot.sendMessage(chatId, message);
  } else if (state.subState === 'adding_employee') {
    const park = state.park;
    if (!parksData[park].employees.includes(text)) {
      parksData[park].employees.push(text);
      parksData[park].shifts[text] = Array(7).fill('');
      saveData();
      bot.sendMessage(chatId, `✅ Сотрудник "${text}" добавлен!`);
    } else {
      bot.sendMessage(chatId, '❌ Сотрудник с таким именем уже существует!');
    }
    delete state.subState;
    showEmployeesMenu(chatId, state);
  } else if (state.subState === 'deleting_employee') {
    const park = state.park;
    const employees = parksData[park]?.employees || [];
    const index = parseInt(text) - 1;
    
    if (index >= 0 && index < employees.length) {
      const employeeName = employees[index];
      parksData[park].employees.splice(index, 1);
      delete parksData[park].shifts[employeeName];
      saveData();
      bot.sendMessage(chatId, `✅ Сотрудник "${employeeName}" удалён!`);
    } else {
      bot.sendMessage(chatId, '❌ Неверный номер сотрудника!');
    }
    delete state.subState;
    showEmployeesMenu(chatId, state);
  }
}

// Обработка состояний смен
function handleShiftsStates(chatId, text, state) {
  if (text === '✏️ Редактировать смены') {
    if (!checkPermission(state.role, 'write')) {
      bot.sendMessage(chatId, '❌ У вас нет прав для редактирования смен.');
      return;
    }
    const employees = parksData[state.park]?.employees || [];
    if (employees.length === 0) {
      bot.sendMessage(chatId, 'Нет сотрудников для редактирования смен');
      return;
    }
    
    let message = 'Выберите сотрудника для редактирования смен:\n\n';
    employees.forEach((emp, index) => {
      message += `${index + 1}. ${emp}\n`;
    });
    
    state.subState = 'selecting_employee_for_shifts';
    bot.sendMessage(chatId, message);
  } else if (text === '💰 Расчёт зарплаты') {
    const park = state.park;
    const employees = parksData[park]?.employees || [];
    const shifts = parksData[park]?.shifts || {};
    
    let message = '💰 Расчёт зарплаты:\n\n';
    let totalSalary = 0;
    
    employees.forEach(name => {
      const row = shifts[name] || Array(7).fill('');
      const salary = calculateSalary(name, row);
      totalSalary += salary;
      message += `${name}: ${salary}₽\n`;
    });
    
    message += `\n💵 Общая зарплата: ${totalSalary}₽`;
    bot.sendMessage(chatId, message);
  } else if (state.subState === 'selecting_employee_for_shifts') {
    const park = state.park;
    const employees = parksData[park]?.employees || [];
    const index = parseInt(text) - 1;
    
    if (index >= 0 && index < employees.length) {
      const employeeName = employees[index];
      state.selectedEmployee = employeeName;
      state.subState = 'editing_shifts';
      
      const shifts = parksData[park]?.shifts?.[employeeName] || Array(7).fill('');
      const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      
      let message = `Редактирование смен для ${employeeName}:\n\n`;
      days.forEach((day, i) => {
        message += `${day}: ${shifts[i] || ''}\n`;
      });
      message += '\nВведите новые значения через запятую (7 значений):';
      
      bot.sendMessage(chatId, message);
    } else {
      bot.sendMessage(chatId, '❌ Неверный номер сотрудника!');
      delete state.subState;
      showShiftsMenu(chatId, state);
    }
  } else if (state.subState === 'editing_shifts') {
    const park = state.park;
    const values = text.split(',').map(v => v.trim());
    
    if (values.length === 7) {
      const employeeName = state.selectedEmployee;
      parksData[park].shifts[employeeName] = values;
      saveData();
      
      bot.sendMessage(chatId, `✅ Смены для ${employeeName} обновлены!`);
      delete state.subState;
      delete state.selectedEmployee;
      showShiftsMenu(chatId, state);
    } else {
      bot.sendMessage(chatId, '❌ Неверный формат! Введите 7 значений через запятую.');
    }
  }
}

// Обработка состояний автоматов
function handleMachinesStates(chatId, text, state) {
  if (text === '➕ Добавить запись') {
    if (!checkPermission(state.role, 'write')) {
      bot.sendMessage(chatId, '❌ У вас нет прав для добавления записей.');
      return;
    }
    state.subState = 'adding_machine_record';
    bot.sendMessage(chatId, 
      'Введите данные в формате:\n' +
      'тип,дата_с,дата_по,сумма\n\n' +
      'Пример: hockey,2024-01-01,2024-01-07,5000\n' +
      'Типы: hockey, boxer'
    );
  } else if (text === '🗑️ Удалить запись') {
    if (!checkPermission(state.role, 'delete')) {
      bot.sendMessage(chatId, '❌ У вас нет прав для удаления записей.');
      return;
    }
    const machines = parksData[state.park]?.machines || [];
    if (machines.length === 0) {
      bot.sendMessage(chatId, 'Нет записей для удаления');
      return;
    }
    
    let message = 'Выберите запись для удаления:\n\n';
    machines.forEach((entry, index) => {
      const type = entry.type === 'hockey' ? 'Хоккей' : 'Боксёр';
      message += `${index + 1}. ${type} | ${entry.from}-${entry.to} | ${entry.amount}₽\n`;
    });
    
    state.subState = 'deleting_machine_record';
    bot.sendMessage(chatId, message);
  } else if (state.subState === 'adding_machine_record') {
    const parts = text.split(',');
    if (parts.length === 4) {
      const [type, from, to, amount] = parts;
      
      if (type !== 'hockey' && type !== 'boxer') {
        bot.sendMessage(chatId, '❌ Неверный тип! Используйте hockey или boxer');
        return;
      }
      
      const park = state.park;
      parksData[park].machines.push({
        type,
        from,
        to,
        amount: parseInt(amount)
      });
      saveData();
      
      const typeName = type === 'hockey' ? 'Хоккей' : 'Боксёр';
      bot.sendMessage(chatId, `✅ Запись добавлена: ${typeName} | ${from}-${to} | ${amount}₽`);
      delete state.subState;
      showMachinesMenu(chatId, state);
    } else {
      bot.sendMessage(chatId, '❌ Неверный формат! Используйте: тип,дата_с,дата_по,сумма');
    }
  } else if (state.subState === 'deleting_machine_record') {
    const park = state.park;
    const machines = parksData[park]?.machines || [];
    const index = parseInt(text) - 1;
    
    if (index >= 0 && index < machines.length) {
      const entry = machines[index];
      const typeName = entry.type === 'hockey' ? 'Хоккей' : 'Боксёр';
      
      parksData[park].machines.splice(index, 1);
      saveData();
      
      bot.sendMessage(chatId, `✅ Запись удалена: ${typeName} | ${entry.from}-${entry.to} | ${entry.amount}₽`);
    } else {
      bot.sendMessage(chatId, '❌ Неверный номер записи!');
    }
    delete state.subState;
    showMachinesMenu(chatId, state);
  }
}

// Функция расчёта зарплаты
function calculateSalary(name, row) {
  const total = row.reduce((sum, val) => {
    if (val === '++') return sum + 2000;
    if (val === 'ст') return sum + 1000;
    if (val === 'касса1') return sum + 2500;
    if (val === 'касса2') return sum + 3000;
    if (val === '+') return sum + 1500;
    if (val === '1200') return sum + 1200;
    if (val === '1000') return sum + 1000;
    return sum;
  }, 0);
  return total;
}

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.log('❌ Polling error:', error);
});

bot.on('error', (error) => {
  console.log('❌ Bot error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  saveData();
  createBackup();
  console.log('✅ Данные сохранены, бот завершает работу');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  saveData();
  createBackup();
  console.log('✅ Данные сохранены, бот завершает работу');
  process.exit(0);
});

console.log('🚀 Продакшн Telegram бот запущен!');
console.log('🔐 Система ролей и безопасности активна');
console.log('👥 Максимум пользователей:', config.SECURITY.allowedUsers);
console.log('⏰ Таймаут сессии:', config.SECURITY.sessionTimeout / 60, 'минут');
console.log('💾 Авторезерв каждые:', config.DATA_SETTINGS.backupInterval / (60 * 60 * 1000), 'часов');
console.log('📊 Мониторинг каждые 5 минут'); 