const axios = require('axios');

class AdvancedCommands {
  constructor(bot, userSessions, API_BASE_URL) {
    this.bot = bot;
    this.userSessions = userSessions;
    this.API_BASE_URL = API_BASE_URL;
    this.daysOfWeek = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    
    this.setupCommands();
  }

  setupCommands() {
    // Расписание конкретного сотрудника
    this.bot.onText(/\/employee_schedule/, async (msg) => {
      const chatId = msg.chat.id;
      
      if (!this.checkAuth(chatId)) return;
      
      try {
        const session = this.userSessions[chatId];
        const response = await axios.get(`${this.API_BASE_URL}/employees/${session.park}`);
        const employees = response.data;
        
        if (employees.length === 0) {
          this.bot.sendMessage(chatId, 'В парке нет сотрудников.');
          return;
        }
        
        let message = 'Выберите сотрудника:\n\n';
        employees.forEach((employee, index) => {
          message += `${index + 1}. ${employee}\n`;
        });
        message += '\nВведите номер сотрудника:';
        
        this.bot.sendMessage(chatId, message);
        this.userSessions[chatId].step = 'waiting_employee_number';
        this.userSessions[chatId].employees = employees;
      } catch (error) {
        this.bot.sendMessage(chatId, 'Ошибка при получении списка сотрудников.');
      }
    });

    // Добавление сотрудника
    this.bot.onText(/\/add_employee/, (msg) => {
      const chatId = msg.chat.id;
      
      if (!this.checkAuth(chatId)) return;
      
      this.bot.sendMessage(chatId, 'Введите имя нового сотрудника:');
      this.userSessions[chatId].step = 'waiting_new_employee_name';
    });

    // Удаление сотрудника
    this.bot.onText(/\/remove_employee/, async (msg) => {
      const chatId = msg.chat.id;
      
      if (!this.checkAuth(chatId)) return;
      
      try {
        const session = this.userSessions[chatId];
        const response = await axios.get(`${this.API_BASE_URL}/employees/${session.park}`);
        const employees = response.data;
        
        if (employees.length === 0) {
          this.bot.sendMessage(chatId, 'В парке нет сотрудников для удаления.');
          return;
        }
        
        let message = 'Выберите сотрудника для удаления:\n\n';
        employees.forEach((employee, index) => {
          message += `${index + 1}. ${employee}\n`;
        });
        message += '\nВведите номер сотрудника:';
        
        this.bot.sendMessage(chatId, message);
        this.userSessions[chatId].step = 'waiting_remove_employee_number';
        this.userSessions[chatId].employees = employees;
      } catch (error) {
        this.bot.sendMessage(chatId, 'Ошибка при получении списка сотрудников.');
      }
    });

    // Статистика парка
    this.bot.onText(/\/stats/, async (msg) => {
      const chatId = msg.chat.id;
      
      if (!this.checkAuth(chatId)) return;
      
      try {
        const session = this.userSessions[chatId];
        const [employeesResponse, shiftsResponse] = await Promise.all([
          axios.get(`${this.API_BASE_URL}/employees/${session.park}`),
          axios.get(`${this.API_BASE_URL}/shifts/${session.park}`)
        ]);
        
        const employees = employeesResponse.data;
        const shifts = shiftsResponse.data;
        
        // Подсчет статистики
        const totalEmployees = employees.length;
        let totalShifts = 0;
        let doubleShifts = 0;
        let cashierShifts = 0;
        let supervisorShifts = 0;
        
        Object.values(shifts).forEach(schedule => {
          schedule.forEach(shift => {
            if (shift) {
              totalShifts++;
              if (shift === '++') doubleShifts++;
              if (shift.includes('касса')) cashierShifts++;
              if (shift === 'ст') supervisorShifts++;
            }
          });
        });
        
        const workingThisWeek = Object.values(shifts).filter(schedule => 
          schedule.some(shift => shift)
        ).length;
        
        let message = `📊 Статистика парка ${session.parkName}\n\n`;
        message += `👥 Всего сотрудников: ${totalEmployees}\n`;
        message += `✅ Работают на этой неделе: ${workingThisWeek}\n`;
        message += `📅 Общее количество смен: ${totalShifts}\n`;
        message += `🔥 Двойные смены: ${doubleShifts}\n`;
        message += `💰 Смены на кассе: ${cashierShifts}\n`;
        message += `👑 Смены старшего: ${supervisorShifts}\n`;
        
        if (totalEmployees > 0) {
          const avgShiftsPerEmployee = (totalShifts / totalEmployees).toFixed(1);
          message += `📈 Среднее количество смен на сотрудника: ${avgShiftsPerEmployee}`;
        }
        
        this.bot.sendMessage(chatId, message);
      } catch (error) {
        this.bot.sendMessage(chatId, 'Ошибка при получении статистики.');
      }
    });

    // Отчет по неделе
    this.bot.onText(/\/report_week/, async (msg) => {
      const chatId = msg.chat.id;
      
      if (!this.checkAuth(chatId)) return;
      
      try {
        const session = this.userSessions[chatId];
        const response = await axios.get(`${this.API_BASE_URL}/shifts/${session.park}`);
        const shifts = response.data;
        
        let message = `📋 Недельный отчет - ${session.parkName}\n\n`;
        
        this.daysOfWeek.forEach((day, dayIndex) => {
          const workingToday = [];
          Object.entries(shifts).forEach(([employee, schedule]) => {
            const shift = schedule[dayIndex];
            if (shift) {
              workingToday.push(`${employee} (${this.formatShiftShort(shift)})`);
            }
          });
          
          message += `📅 ${day}:\n`;
          if (workingToday.length === 0) {
            message += '  Никто не работает\n';
          } else {
            message += `  ${workingToday.join(', ')}\n`;
          }
          message += '\n';
        });
        
        if (message.length > 4000) {
          const messages = this.splitMessage(message, 4000);
          for (const msg of messages) {
            await this.bot.sendMessage(chatId, msg);
          }
        } else {
          this.bot.sendMessage(chatId, message);
        }
      } catch (error) {
        this.bot.sendMessage(chatId, 'Ошибка при создании отчета.');
      }
    });

    // Расписание на конкретный день
    this.bot.onText(/\/schedule_day/, (msg) => {
      const chatId = msg.chat.id;
      
      if (!this.checkAuth(chatId)) return;
      
      let message = 'Выберите день недели:\n\n';
      this.daysOfWeek.forEach((day, index) => {
        message += `${index + 1}. ${day}\n`;
      });
      message += '\nВведите номер дня:';
      
      this.bot.sendMessage(chatId, message);
      this.userSessions[chatId].step = 'waiting_day_number';
    });

    // Резервная копия данных
    this.bot.onText(/\/backup_data/, async (msg) => {
      const chatId = msg.chat.id;
      
      if (!this.checkAuth(chatId)) return;
      
      try {
        const session = this.userSessions[chatId];
        const [employeesResponse, shiftsResponse] = await Promise.all([
          axios.get(`${this.API_BASE_URL}/employees/${session.park}`),
          axios.get(`${this.API_BASE_URL}/shifts/${session.park}`)
        ]);
        
        const backupData = {
          park: session.park,
          parkName: session.parkName,
          timestamp: new Date().toISOString(),
          employees: employeesResponse.data,
          shifts: shiftsResponse.data
        };
        
        const backupJson = JSON.stringify(backupData, null, 2);
        const date = new Date().toLocaleDateString('ru-RU');
        
        // Отправляем файл резервной копии
        this.bot.sendDocument(chatId, Buffer.from(backupJson), {
          filename: `backup_${session.park}_${date}.json`
        }, {
          caption: `💾 Резервная копия данных парка ${session.parkName} от ${date}`
        });
        
      } catch (error) {
        this.bot.sendMessage(chatId, 'Ошибка при создании резервной копии.');
      }
    });
  }

  // Обработка текстовых сообщений для расширенных команд
  async handleTextMessage(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const session = this.userSessions[chatId];
    
    if (!session || !session.step) return false;

    try {
      switch (session.step) {
        case 'waiting_employee_number':
          await this.handleEmployeeScheduleRequest(chatId, text);
          break;
          
        case 'waiting_new_employee_name':
          await this.handleAddEmployee(chatId, text);
          break;
          
        case 'waiting_remove_employee_number':
          await this.handleRemoveEmployee(chatId, text);
          break;
          
        case 'waiting_day_number':
          await this.handleDayScheduleRequest(chatId, text);
          break;
          
        default:
          return false;
      }
      return true;
    } catch (error) {
      this.bot.sendMessage(chatId, 'Произошла ошибка при обработке запроса.');
      session.step = null;
      return true;
    }
  }

  async handleEmployeeScheduleRequest(chatId, text) {
    const session = this.userSessions[chatId];
    const employeeIndex = parseInt(text) - 1;
    
    if (isNaN(employeeIndex) || employeeIndex < 0 || employeeIndex >= session.employees.length) {
      this.bot.sendMessage(chatId, 'Неверный номер сотрудника.');
      session.step = null;
      return;
    }
    
    const employeeName = session.employees[employeeIndex];
    const response = await axios.get(`${this.API_BASE_URL}/shifts/${session.park}`);
    const shifts = response.data;
    const employeeSchedule = shifts[employeeName];
    
    if (!employeeSchedule) {
      this.bot.sendMessage(chatId, 'У этого сотрудника нет расписания.');
      session.step = null;
      return;
    }
    
    let message = `📅 Расписание сотрудника: ${employeeName}\n\n`;
    employeeSchedule.forEach((shift, dayIndex) => {
      message += `${this.daysOfWeek[dayIndex]}: ${this.formatShift(shift)}\n`;
    });
    
    // Подсчет статистики для сотрудника
    const workDays = employeeSchedule.filter(shift => shift).length;
    const doubleDays = employeeSchedule.filter(shift => shift === '++').length;
    
    message += `\n📊 Статистика:\n`;
    message += `Рабочих дней: ${workDays}\n`;
    if (doubleDays > 0) message += `Двойных смен: ${doubleDays}\n`;
    
    this.bot.sendMessage(chatId, message);
    session.step = null;
  }

  async handleAddEmployee(chatId, text) {
    const session = this.userSessions[chatId];
    const employeeName = text.trim();
    
    if (!employeeName) {
      this.bot.sendMessage(chatId, 'Имя сотрудника не может быть пустым.');
      session.step = null;
      return;
    }
    
    try {
      await axios.post(`${this.API_BASE_URL}/employees/${session.park}`, {
        name: employeeName
      });
      
      this.bot.sendMessage(chatId, `✅ Сотрудник "${employeeName}" успешно добавлен!`);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        this.bot.sendMessage(chatId, 'Такой сотрудник уже существует.');
      } else {
        this.bot.sendMessage(chatId, 'Ошибка при добавлении сотрудника.');
      }
    }
    
    session.step = null;
  }

  async handleRemoveEmployee(chatId, text) {
    const session = this.userSessions[chatId];
    const employeeIndex = parseInt(text) - 1;
    
    if (isNaN(employeeIndex) || employeeIndex < 0 || employeeIndex >= session.employees.length) {
      this.bot.sendMessage(chatId, 'Неверный номер сотрудника.');
      session.step = null;
      return;
    }
    
    const employeeName = session.employees[employeeIndex];
    
    try {
      await axios.delete(`${this.API_BASE_URL}/employees/${session.park}/${encodeURIComponent(employeeName)}`);
      this.bot.sendMessage(chatId, `✅ Сотрудник "${employeeName}" удален.`);
    } catch (error) {
      this.bot.sendMessage(chatId, 'Ошибка при удалении сотрудника.');
    }
    
    session.step = null;
  }

  async handleDayScheduleRequest(chatId, text) {
    const session = this.userSessions[chatId];
    const dayIndex = parseInt(text) - 1;
    
    if (isNaN(dayIndex) || dayIndex < 0 || dayIndex >= 7) {
      this.bot.sendMessage(chatId, 'Неверный номер дня.');
      session.step = null;
      return;
    }
    
    await this.sendDaySchedule(chatId, dayIndex, this.daysOfWeek[dayIndex]);
    session.step = null;
  }

  async sendDaySchedule(chatId, dayIndex, dayName) {
    try {
      const session = this.userSessions[chatId];
      const response = await axios.get(`${this.API_BASE_URL}/shifts/${session.park}`);
      const shifts = response.data;
      
      let message = `📅 Расписание на ${dayName} - ${session.parkName}\n\n`;
      
      const workingEmployees = [];
      Object.entries(shifts).forEach(([employee, schedule]) => {
        const shift = schedule[dayIndex];
        if (shift) {
          workingEmployees.push(`👤 ${employee}: ${this.formatShift(shift)}`);
        }
      });
      
      if (workingEmployees.length === 0) {
        message += 'Никто не работает 😴';
      } else {
        message += workingEmployees.join('\n');
      }
      
      this.bot.sendMessage(chatId, message);
    } catch (error) {
      this.bot.sendMessage(chatId, 'Ошибка при получении расписания на день.');
    }
  }

  checkAuth(chatId) {
    if (!this.userSessions[chatId] || !this.userSessions[chatId].isAuthenticated) {
      this.bot.sendMessage(chatId, '❌ Необходима авторизация. Используйте /login');
      return false;
    }
    return true;
  }

  formatShift(shift) {
    if (!shift) return '🚫 Выходной';
    if (shift === '+') return '✅ Работает';
    if (shift === '++') return '🔥 Двойная смена';
    if (shift.includes('касса')) return '💰 ' + shift;
    if (shift === 'ст') return '👑 Старший смены';
    return shift;
  }

  formatShiftShort(shift) {
    if (!shift) return 'Выходной';
    if (shift === '+') return 'Работает';
    if (shift === '++') return 'Двойная';
    if (shift.includes('касса')) return shift;
    if (shift === 'ст') return 'Старший';
    return shift;
  }

  splitMessage(message, maxLength) {
    const messages = [];
    let current = '';
    
    const lines = message.split('\n');
    for (const line of lines) {
      if ((current + line + '\n').length > maxLength) {
        if (current) {
          messages.push(current);
          current = '';
        }
      }
      current += line + '\n';
    }
    
    if (current) {
      messages.push(current);
    }
    
    return messages;
  }
}

module.exports = AdvancedCommands;