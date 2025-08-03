const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Загрузка переменных окружения
require('dotenv').config();

// Создание Express приложения
const app = express();
const PORT = process.env.PORT || 3001;

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

// Мониторинг системы
function logStatus() {
  const activeUsers = Object.keys(activeSessions).length;
  const totalParks = Object.keys(parksData).length;
  const totalEmployees = Object.values(parksData).reduce((sum, park) => sum + park.employees.length, 0);
  
  console.log(`📊 Статус системы:`);
  console.log(`   👥 Активных пользователей: ${activeUsers}`);
  console.log(`   🎢 Парков: ${totalParks}`);
  console.log(`   👨‍💼 Сотрудников: ${totalEmployees}`);
  console.log(`   💾 Размер данных: ${JSON.stringify(parksData).length} байт`);
}

// Проверка безопасности
function checkSecurity(chatId) {
  const now = Date.now();
  
  // Очистка старых сессий
  Object.keys(activeSessions).forEach(sessionId => {
    if (now - activeSessions[sessionId].timestamp > config.SECURITY.sessionTimeout * 1000) {
      delete activeSessions[sessionId];
      delete userStates[sessionId];
    }
  });
  
  // Проверка лимита пользователей
  if (Object.keys(activeSessions).length >= config.SECURITY.allowedUsers) {
    return false;
  }
  
  return true;
}

// Проверка прав доступа
function checkPermission(userRole, action) {
  const permissions = {
    admin: ['read', 'write', 'delete', 'manage_users', 'view_reports', 'manage_settings'],
    manager: ['read', 'write', 'view_reports'],
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
  
  if (!checkSecurity(chatId)) {
    bot.sendMessage(chatId, '❌ Система перегружена. Попробуйте позже.');
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
  
  if (!userStates[chatId]) {
    userStates[chatId] = { state: 'login', step: 'username' };
  }
  
  const state = userStates[chatId];
  
  if (state.state === 'login') {
    handleLogin(chatId, text, state);
  } else if (state.state === 'main') {
    handleMainMenu(chatId, text, state);
  } else if (state.state === 'employees') {
    handleEmployeesStates(chatId, text, state);
  } else if (state.state === 'shifts') {
    handleShiftsStates(chatId, text, state);
  } else if (state.state === 'machines') {
    handleMachinesStates(chatId, text, state);
  } else {
    handleStates(chatId, text, state);
  }
});

// Обработка входа
function handleLogin(chatId, text, state) {
  if (text === '🔙 Назад') {
    delete userStates[chatId];
    delete loginAttempts[chatId];
    bot.sendMessage(chatId, '👋 До свидания!');
    return;
  }
  
  if (state.step === 'username') {
    const user = config.USERS[text];
    if (user) {
      state.username = text;
      state.step = 'password';
      state.park = user.park;
      state.role = user.role;
      bot.sendMessage(chatId, 'Введите пароль:');
    } else {
      loginAttempts[chatId]++;
      if (loginAttempts[chatId] >= config.SECURITY.maxLoginAttempts) {
        bot.sendMessage(chatId, '❌ Слишком много попыток. Попробуйте позже.');
        delete userStates[chatId];
        delete loginAttempts[chatId];
      } else {
        bot.sendMessage(chatId, '❌ Неверный логин. Попробуйте снова:');
      }
    }
  } else if (state.step === 'password') {
    const user = config.USERS[state.username];
    if (text === user.password) {
      state.state = 'main';
      delete state.step;
      activeSessions[chatId] = {
        username: state.username,
        park: state.park,
        role: state.role,
        timestamp: Date.now()
      };
      showMainMenu(chatId);
    } else {
      loginAttempts[chatId]++;
      if (loginAttempts[chatId] >= config.SECURITY.maxLoginAttempts) {
        bot.sendMessage(chatId, '❌ Слишком много попыток. Попробуйте позже.');
        delete userStates[chatId];
        delete loginAttempts[chatId];
      } else {
        bot.sendMessage(chatId, '❌ Неверный пароль. Попробуйте снова:');
      }
    }
  }
}

// Показать главное меню
function showMainMenu(chatId) {
  const session = activeSessions[chatId];
  const parkName = config.PARKS[session.park].name;
  
  bot.sendMessage(chatId, 
    `🎢 Главное меню\n\n` +
    `🏢 Парк: ${parkName}\n` +
    `👤 Пользователь: ${session.username}\n` +
    `🔐 Роль: ${session.role}\n\n` +
    `Выберите действие:`,
    mainKeyboard
  );
}

// Обработка главного меню
function handleMainMenu(chatId, text, state) {
  const session = activeSessions[chatId];
  
  if (text === '🚪 Выйти') {
    delete userStates[chatId];
    delete activeSessions[chatId];
    bot.sendMessage(chatId, '👋 До свидания!');
    return;
  }
  
  switch (text) {
    case '👥 Сотрудники':
      if (checkPermission(session.role, 'read')) {
        state.state = 'employees';
        showEmployeesMenu(chatId, state);
      } else {
        bot.sendMessage(chatId, '❌ У вас нет прав для просмотра сотрудников');
      }
      break;
    case '📅 Смены':
      if (checkPermission(session.role, 'read')) {
        state.state = 'shifts';
        showShiftsMenu(chatId, state);
      } else {
        bot.sendMessage(chatId, '❌ У вас нет прав для просмотра смен');
      }
      break;
    case '🎮 Хоккей/Боксёр':
      if (checkPermission(session.role, 'read')) {
        state.state = 'machines';
        showMachinesMenu(chatId, state);
      } else {
        bot.sendMessage(chatId, '❌ У вас нет прав для просмотра автоматов');
      }
      break;
    case '📊 Отчёты':
      if (checkPermission(session.role, 'view_reports')) {
        showReports(chatId, state);
      } else {
        bot.sendMessage(chatId, '❌ У вас нет прав для просмотра отчётов');
      }
      break;
    case '⚙️ Настройки':
      if (checkPermission(session.role, 'manage_settings')) {
        showSettings(chatId, state);
      } else {
        bot.sendMessage(chatId, '❌ У вас нет прав для настроек');
      }
      break;
    case 'ℹ️ О программе':
      showAbout(chatId);
      break;
    default:
      bot.sendMessage(chatId, '❌ Неверная команда');
  }
}

// Показать меню сотрудников
function showEmployeesMenu(chatId, state) {
  const session = activeSessions[chatId];
  const park = session.park;
  const employees = parksData[park]?.employees || [];
  
  let message = '👥 Управление сотрудниками\n\n';
  if (employees.length === 0) {
    message += '📝 Список сотрудников пуст\n';
  } else {
    employees.forEach((emp, index) => {
      message += `${index + 1}. ${emp.name} - ${emp.position}\n`;
    });
  }
  
  message += '\nВыберите действие:\n';
  message += '➕ Добавить сотрудника\n';
  message += '✏️ Редактировать\n';
  message += '🗑️ Удалить\n';
  message += '🔙 Назад';
  
  state.subState = 'employees_menu';
  bot.sendMessage(chatId, message, backKeyboard);
}

// Показать меню смен
function showShiftsMenu(chatId, state) {
  const session = activeSessions[chatId];
  const park = session.park;
  const shifts = parksData[park]?.shifts || {};
  
  let message = '📅 Управление сменами\n\n';
  if (Object.keys(shifts).length === 0) {
    message += '📝 Смены не найдены\n';
  } else {
    Object.keys(shifts).forEach(date => {
      message += `📅 ${date}:\n`;
      shifts[date].forEach((shift, index) => {
        message += `  ${index + 1}. ${shift.name} - ${shift.type}\n`;
      });
    });
  }
  
  message += '\nВыберите действие:\n';
  message += '➕ Добавить смену\n';
  message += '📊 Отчёт по сменам\n';
  message += '🔙 Назад';
  
  state.subState = 'shifts_menu';
  bot.sendMessage(chatId, message, backKeyboard);
}

// Показать меню автоматов
function showMachinesMenu(chatId, state) {
  const session = activeSessions[chatId];
  const park = session.park;
  const machines = parksData[park]?.machines || [];
  
  let message = '🎮 Управление автоматами\n\n';
  if (machines.length === 0) {
    message += '📝 Записей нет\n';
  } else {
    machines.forEach((machine, index) => {
      const type = machine.type === 'hockey' ? 'Хоккей' : 'Боксёр';
      message += `${index + 1}. ${type} | ${machine.from}-${machine.to} | ${machine.amount}₽\n`;
    });
  }
  
  message += '\nВыберите действие:\n';
  message += '➕ Добавить запись\n';
  message += '🗑️ Удалить запись\n';
  message += '📊 Отчёт по автоматам\n';
  message += '🔙 Назад';
  
  state.subState = 'machines_menu';
  bot.sendMessage(chatId, message, backKeyboard);
}

// Показать отчёты
function showReports(chatId, state) {
  const session = activeSessions[chatId];
  const park = session.park;
  const employees = parksData[park]?.employees || [];
  const shifts = parksData[park]?.shifts || {};
  const machines = parksData[park]?.machines || [];
  
  let message = '📊 Отчёты\n\n';
  message += `🏢 Парк: ${config.PARKS[park].name}\n`;
  message += `👥 Сотрудников: ${employees.length}\n`;
  message += `📅 Дней со сменами: ${Object.keys(shifts).length}\n`;
  message += `🎮 Записей автоматов: ${machines.length}\n\n`;
  
  // Расчёт зарплат
  let totalSalary = 0;
  Object.keys(shifts).forEach(date => {
    shifts[date].forEach(shift => {
      totalSalary += calculateSalary(shift.name, [shift.type]);
    });
  });
  
  message += `💰 Общая зарплата: ${totalSalary}₽\n`;
  message += `📅 Период: ${Object.keys(shifts).length} дней`;
  
  bot.sendMessage(chatId, message, backKeyboard);
}

// Показать настройки
function showSettings(chatId, state) {
  const session = activeSessions[chatId];
  
  let message = '⚙️ Настройки\n\n';
  message += `👤 Пользователь: ${session.username}\n`;
  message += `🔐 Роль: ${session.role}\n`;
  message += `🏢 Парк: ${config.PARKS[session.park].name}\n`;
  message += `⏰ Таймаут сессии: ${config.SECURITY.sessionTimeout / 60} мин\n`;
  message += `👥 Максимум пользователей: ${config.SECURITY.allowedUsers}\n`;
  message += `💾 Авторезерв: каждые ${config.DATA_SETTINGS.backupInterval / (60 * 60 * 1000)} ч`;
  
  bot.sendMessage(chatId, message, backKeyboard);
}

// Показать информацию о программе
function showAbout(chatId) {
  const message = 
    'ℹ️ О программе\n\n' +
    '🎢 Система управления парком аттракционов\n' +
    '📱 Telegram бот для учёта сотрудников и смен\n' +
    '🎮 Поддержка хоккейных и боксёрских автоматов\n' +
    '📊 Автоматические отчёты и расчёт зарплат\n\n' +
    '🔧 Версия: 1.0.0\n' +
    '📅 Дата: 2024\n' +
    '👨‍💻 Разработчик: Apet Mkoyan';
  
  bot.sendMessage(chatId, message, backKeyboard);
}

// Обработка состояний
function handleStates(chatId, text, state) {
  if (text === '🔙 Назад') {
    state.state = 'main';
    delete state.subState;
    showMainMenu(chatId);
  }
}

// Обработка состояний сотрудников
function handleEmployeesStates(chatId, text, state) {
  const session = activeSessions[chatId];
  const park = session.park;
  
  if (text === '🔙 Назад') {
    state.state = 'main';
    delete state.subState;
    showMainMenu(chatId);
    return;
  }
  
  if (state.subState === 'employees_menu') {
    if (text === '➕ Добавить сотрудника') {
      state.subState = 'adding_employee';
      bot.sendMessage(chatId, 'Введите данные сотрудника в формате: имя,должность');
    } else if (text === '✏️ Редактировать') {
      state.subState = 'editing_employee';
      const employees = parksData[park]?.employees || [];
      if (employees.length === 0) {
        bot.sendMessage(chatId, '❌ Нет сотрудников для редактирования');
        delete state.subState;
        showEmployeesMenu(chatId, state);
      } else {
        let message = 'Выберите сотрудника для редактирования:\n';
        employees.forEach((emp, index) => {
          message += `${index + 1}. ${emp.name} - ${emp.position}\n`;
        });
        bot.sendMessage(chatId, message);
      }
    } else if (text === '🗑️ Удалить') {
      state.subState = 'deleting_employee';
      const employees = parksData[park]?.employees || [];
      if (employees.length === 0) {
        bot.sendMessage(chatId, '❌ Нет сотрудников для удаления');
        delete state.subState;
        showEmployeesMenu(chatId, state);
      } else {
        let message = 'Выберите сотрудника для удаления:\n';
        employees.forEach((emp, index) => {
          message += `${index + 1}. ${emp.name} - ${emp.position}\n`;
        });
        bot.sendMessage(chatId, message);
      }
    }
  } else if (state.subState === 'adding_employee') {
    const parts = text.split(',');
    if (parts.length === 2) {
      const [name, position] = parts;
      if (!parksData[park].employees) {
        parksData[park].employees = [];
      }
      parksData[park].employees.push({ name, position });
      saveData();
      bot.sendMessage(chatId, `✅ Сотрудник добавлен: ${name} - ${position}`);
      delete state.subState;
      showEmployeesMenu(chatId, state);
    } else {
      bot.sendMessage(chatId, '❌ Неверный формат! Используйте: имя,должность');
    }
  } else if (state.subState === 'editing_employee') {
    const employees = parksData[park]?.employees || [];
    const index = parseInt(text) - 1;
    
    if (index >= 0 && index < employees.length) {
      state.editingIndex = index;
      state.subState = 'editing_employee_data';
      bot.sendMessage(chatId, 'Введите новые данные в формате: имя,должность');
    } else {
      bot.sendMessage(chatId, '❌ Неверный номер сотрудника!');
      delete state.subState;
      showEmployeesMenu(chatId, state);
    }
  } else if (state.subState === 'editing_employee_data') {
    const parts = text.split(',');
    if (parts.length === 2) {
      const [name, position] = parts;
      const index = state.editingIndex;
      parksData[park].employees[index] = { name, position };
      saveData();
      bot.sendMessage(chatId, `✅ Сотрудник обновлён: ${name} - ${position}`);
      delete state.subState;
      delete state.editingIndex;
      showEmployeesMenu(chatId, state);
    } else {
      bot.sendMessage(chatId, '❌ Неверный формат! Используйте: имя,должность');
    }
  } else if (state.subState === 'deleting_employee') {
    const employees = parksData[park]?.employees || [];
    const index = parseInt(text) - 1;
    
    if (index >= 0 && index < employees.length) {
      const employee = employees[index];
      parksData[park].employees.splice(index, 1);
      saveData();
      bot.sendMessage(chatId, `✅ Сотрудник удалён: ${employee.name} - ${employee.position}`);
    } else {
      bot.sendMessage(chatId, '❌ Неверный номер сотрудника!');
    }
    delete state.subState;
    showEmployeesMenu(chatId, state);
  }
}

// Обработка состояний смен
function handleShiftsStates(chatId, text, state) {
  const session = activeSessions[chatId];
  const park = session.park;
  
  if (text === '🔙 Назад') {
    state.state = 'main';
    delete state.subState;
    showMainMenu(chatId);
    return;
  }
  
  if (state.subState === 'shifts_menu') {
    if (text === '➕ Добавить смену') {
      state.subState = 'adding_shift';
      bot.sendMessage(chatId, 'Введите данные смены в формате: дата,имя,тип_смены');
    } else if (text === '📊 Отчёт по сменам') {
      const shifts = parksData[park]?.shifts || {};
      let message = '📊 Отчёт по сменам\n\n';
      
      if (Object.keys(shifts).length === 0) {
        message += '📝 Смены не найдены';
      } else {
        Object.keys(shifts).forEach(date => {
          message += `📅 ${date}:\n`;
          shifts[date].forEach((shift, index) => {
            const salary = calculateSalary(shift.name, [shift.type]);
            message += `  ${index + 1}. ${shift.name} - ${shift.type} (${salary}₽)\n`;
          });
          message += '\n';
        });
      }
      bot.sendMessage(chatId, message, backKeyboard);
    }
  } else if (state.subState === 'adding_shift') {
    const parts = text.split(',');
    if (parts.length === 3) {
      const [date, name, type] = parts;
      
      if (!parksData[park].shifts) {
        parksData[park].shifts = {};
      }
      if (!parksData[park].shifts[date]) {
        parksData[park].shifts[date] = [];
      }
      
      parksData[park].shifts[date].push({ name, type });
      saveData();
      
      const salary = calculateSalary(name, [type]);
      bot.sendMessage(chatId, `✅ Смена добавлена: ${date} | ${name} | ${type} (${salary}₽)`);
      delete state.subState;
      showShiftsMenu(chatId, state);
    } else {
      bot.sendMessage(chatId, '❌ Неверный формат! Используйте: дата,имя,тип_смены');
    }
  }
}

// Обработка состояний автоматов
function handleMachinesStates(chatId, text, state) {
  const session = activeSessions[chatId];
  const park = session.park;
  
  if (text === '🔙 Назад') {
    state.state = 'main';
    delete state.subState;
    showMainMenu(chatId);
    return;
  }
  
  if (state.subState === 'machines_menu') {
    if (text === '➕ Добавить запись') {
      state.subState = 'adding_machine_record';
      bot.sendMessage(chatId, 'Введите данные в формате: тип,дата_с,дата_по,сумма\n(тип: hockey или boxer)');
    } else if (text === '🗑️ Удалить запись') {
      const machines = parksData[park]?.machines || [];
      if (machines.length === 0) {
        bot.sendMessage(chatId, '❌ Нет записей для удаления');
        delete state.subState;
        showMachinesMenu(chatId, state);
      } else {
        let message = 'Выберите запись для удаления:\n';
        machines.forEach((machine, index) => {
          const type = machine.type === 'hockey' ? 'Хоккей' : 'Боксёр';
          message += `${index + 1}. ${type} | ${machine.from}-${machine.to} | ${machine.amount}₽\n`;
        });
        bot.sendMessage(chatId, message);
      }
      state.subState = 'deleting_machine_record';
    } else if (text === '📊 Отчёт по автоматам') {
      const machines = parksData[park]?.machines || [];
      let message = '📊 Отчёт по автоматам\n\n';
      
      if (machines.length === 0) {
        message += '📝 Записей нет';
      } else {
        let totalAmount = 0;
        machines.forEach((machine, index) => {
          const type = machine.type === 'hockey' ? 'Хоккей' : 'Боксёр';
          message += `${index + 1}. ${type} | ${machine.from}-${machine.to} | ${machine.amount}₽\n`;
          totalAmount += machine.amount;
        });
        message += `\n💰 Общая сумма: ${totalAmount}₽`;
      }
      bot.sendMessage(chatId, message, backKeyboard);
    }
  } else if (state.subState === 'adding_machine_record') {
    const parts = text.split(',');
    if (parts.length === 4) {
      const [type, from, to, amount] = parts;
      
      if (type !== 'hockey' && type !== 'boxer') {
        bot.sendMessage(chatId, '❌ Неверный тип! Используйте hockey или boxer');
        return;
      }
      
      if (!parksData[park].machines) {
        parksData[park].machines = [];
      }
      
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

// HTTP маршруты
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Telegram Bot for Park Management',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    activeUsers: Object.keys(activeSessions).length,
    totalParks: Object.keys(parksData).length
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    activeUsers: Object.keys(activeSessions).length
  });
});

app.get('/status', (req, res) => {
  res.json({
    botStatus: 'running',
    activeUsers: Object.keys(activeSessions).length,
    totalParks: Object.keys(parksData).length,
    totalEmployees: Object.values(parksData).reduce((sum, park) => sum + (park.employees?.length || 0), 0),
    dataSize: JSON.stringify(parksData).length
  });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 HTTP сервер запущен на порту ${PORT}`);
  console.log(`🌐 Доступен по адресу: http://localhost:${PORT}`);
  
  // Загрузка данных
  loadData();
  
  // Запуск мониторинга
  setInterval(logStatus, 5 * 60 * 1000); // Каждые 5 минут
  setInterval(createBackup, config.DATA_SETTINGS.backupInterval);
  
  console.log('🚀 Продакшн Telegram бот запущен!');
  console.log('🔐 Система ролей и безопасности активна');
  console.log('👥 Максимум пользователей:', config.SECURITY.allowedUsers);
  console.log('⏰ Таймаут сессии:', config.SECURITY.sessionTimeout / 60, 'минут');
  console.log('💾 Авторезерв каждые:', config.DATA_SETTINGS.backupInterval / (60 * 60 * 1000), 'часов');
  console.log('📊 Мониторинг каждые 5 минут');
}); 