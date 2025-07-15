import React, { useState } from 'react';
import './Login.css';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login: username, password }),
      });

      const data = await res.json();

      if (data.success) {
        onLogin(data.park); // Передаём парк в App.jsx
        localStorage.setItem('park', data.park); // Можно сохранить, если нужно
      } else {
        setError('Неверный логин или пароль');
      }
    } catch (err) {
      console.error(err);
      setError('Ошибка подключения к серверу');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Вход в систему</h2>
        <input
          type="text"
          placeholder="Логин"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div className="error">{error}</div>}
        <button type="submit">Войти</button>
      </form>
    </div>
  );
};

export default LoginPage;