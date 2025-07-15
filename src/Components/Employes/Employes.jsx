import React, { useState, useEffect } from 'react';
import './Employes.css';

const Employees = ({ park }) => {
  const [employees, setEmployees] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    fetch(`http://localhost:4000/employees/${park}`)
      .then(res => res.json())
      .then(setEmployees);
  }, [park]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await fetch(`http://localhost:4000/employees/${park}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setName('');
    fetch(`http://localhost:4000/employees/${park}`)
      .then(res => res.json())
      .then(setEmployees);
  };

  const handleDelete = async (empName) => {
    await fetch(`http://localhost:4000/employees/${park}/${empName}`, {
      method: 'DELETE',
    });
    fetch(`http://localhost:4000/employees/${park}`)
      .then(res => res.json())
      .then(setEmployees);
  };

  return (
    <div className="employees-container">
      <h2>Сотрудники</h2>
      <div className="employees-input">
        <input
          placeholder="Имя сотрудника"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={handleAdd}>Добавить</button>
      </div>
      <ul className="employees-list">
        {employees.map((e, i) => (
          <li key={i}>
            {e} <button onClick={() => handleDelete(e)}>Удалить</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Employees;