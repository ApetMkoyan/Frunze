# 🤖 Пошаговая инструкция: Получение токена Telegram бота

## 📱 Шаг 1: Открыть Telegram

Откройте Telegram на любом устройстве:
- 📱 Мобильное приложение (Android/iOS)
- 💻 Десктоп версия (Windows/Mac/Linux)
- 🌐 Веб-версия: https://web.telegram.org

## 🔍 Шаг 2: Найти BotFather

1. В поиске Telegram введите: **@BotFather**
2. Выберите официального бота с галочкой ✅
3. Нажмите **"Начать"** или отправьте `/start`

![Поиск BotFather](https://core.telegram.org/file/811140015/1/zlN4goPJhfI/9574f2c2bd2385b030)

## 🆕 Шаг 3: Создать нового бота

Отправьте команду:
```
/newbot
```

BotFather ответит:
```
Alright, a new bot. How are we going to call it? 
Please choose a name for your bot.
```

## 📝 Шаг 4: Выбрать имя бота

Введите **название** вашего бота (может быть на русском):
```
Управление парками ВОЛНА
```

## 🔗 Шаг 5: Выбрать username

BotFather попросит username (обязательно должен заканчиваться на "bot"):
```
Good. Now let's choose a username for your bot. 
It must end in `bot`. Like this, for example: TetrisBot or tetris_bot.
```

Примеры хороших username:
```
parks_management_bot
volna_parks_bot
shift_manager_bot
```

## 🎉 Шаг 6: Получить токен

После успешного создания BotFather отправит сообщение с **ТОКЕНОМ**:

```
Done! Congratulations on your new bot. You will find it at 
t.me/parks_management_bot. You can now add a description, 
about section and profile picture for your bot, see /help for a list of commands.

Use this token to access the HTTP API:
1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ-1234567890

Keep your token secure and store it safely, it can be used by 
anyone to control your bot.
```

**ТОКЕН** - это длинная строка вида: `1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ-1234567890`

## 🔐 Шаг 7: Безопасная настройка токена

### Вариант 1: Прямо в коде (простой)
Откройте `telegram-bot/bot.js` и замените:
```javascript
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
```

На ваш токен:
```javascript
const BOT_TOKEN = '1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ-1234567890';
```

### Вариант 2: Через файл .env (безопасный) ⭐ Рекомендуется

1. Создайте файл `.env` в папке `telegram-bot/`:
   ```bash
   cd telegram-bot
   touch .env
   ```

2. Добавьте в файл `.env`:
   ```
   BOT_TOKEN=1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ-1234567890
   API_BASE_URL=http://localhost:4000
   ```

3. Используйте файл `bot-with-env.js` вместо `bot.js`:
   ```bash
   npm install dotenv
   node bot-with-env.js
   ```

## 🚀 Шаг 8: Запуск бота

```bash
cd telegram-bot
npm install
npm start
```

Увидите сообщение:
```
🤖 Telegram бот запущен!
🔑 Используется токен: 1234567890...
🌐 API сервер: http://localhost:4000
```

## ✅ Шаг 9: Проверка работы

1. Найдите вашего бота в Telegram по username (например: @parks_management_bot)
2. Нажмите **"Начать"** или отправьте `/start`
3. Бот должен ответить приветственным сообщением

## 🛡️ Безопасность токена

### ✅ ПРАВИЛЬНО:
- Хранить токен в `.env` файле
- Добавить `.env` в `.gitignore`
- Не показывать токен другим людям

### ❌ НЕ ДЕЛАЙТЕ:
- Не публикуйте токен в открытом коде
- Не отправляйте токен по почте/чату
- Не храните токен в незащищенных местах

## 🔄 Если токен скомпрометирован

1. Найдите своего бота в списке у @BotFather
2. Отправьте `/mybots`
3. Выберите бота → **API Token** → **Revoke current token**
4. Получите новый токен

## 💰 Стоимость

**ВСЁ АБСОЛЮТНО БЕСПЛАТНО!**
- ✅ Создание бота - бесплатно
- ✅ Отправка сообщений - бесплатно  
- ✅ Получение сообщений - бесплатно
- ✅ Файлы до 50 МБ - бесплатно
- ✅ Нет лимитов для обычного использования

## 📋 Лимиты Telegram API

- **Сообщения**: 30 сообщений в секунду
- **Группы**: 20 сообщений в минуту
- **Размер сообщения**: 4096 символов
- **Размер файла**: 50 МБ

Для парков аттракционов этого более чем достаточно!

## 🆘 Помощь при проблемах

### Проблема: "Unauthorized"
**Решение**: Проверьте правильность токена

### Проблема: "Bot not found"  
**Решение**: Убедитесь что бот создан и токен скопирован полностью

### Проблема: "Connection timeout"
**Решение**: Проверьте интернет подключение

### Проблема: Бот не отвечает
**Решение**: 
1. Проверьте что сервер запущен (`node bot.js`)
2. Проверьте что API сервер работает на порту 4000
3. Посмотрите логи в консоли

## 📞 Контакты для помощи

Если что-то не получается:
1. Перечитайте инструкцию еще раз
2. Проверьте все шаги по порядку
3. Посмотрите примеры в файлах проекта

---
*Удачи с настройкой вашего Telegram бота! 🎉*