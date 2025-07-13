import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import './ShiftTable.css';

const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const initialRows = [];

const ShiftTable = () => {
    const [rows, setRows] = useState(initialRows);
    const [editMode, setEditMode] = useState(false);

    const handleAddRow = () => {
        if (editMode) {
            setEditMode(false);
        } else {
            setRows([
                ...rows,
                {
                    id: uuidv4(),
                    name: '',
                    shifts: Array(7).fill(''),
                },
            ]);
            setEditMode(true);
        }
    };

    const handleDeleteRow = (id) => {
        setRows(rows.filter((row) => row.id !== id));
    };

    const handleChange = (rowId, dayIndex, value) => {
        setRows(rows.map((row) =>
            row.id === rowId
                ? {
                    ...row,
                    shifts: row.shifts.map((s, i) =>
                        i === dayIndex ? value : s
                    ),

                } : row
        ));
    };

    const handleNameChange = (rowId, value) => {
        setRows(rows.map((row) =>
            row.id === rowId ? { ...row, name: value } : row
        ));
    };

    const calculateSalary = (shifts) => {
        return shifts.reduce((sum, value) => {
            if (value === '+') return sum + 1500;
            if (value === '1200') return sum + 1200;
            if (value === '1000') return sum + 1000;
            return sum;
        }, 0);
    };


    return (
        <div>
            <h2>Таблица смен</h2>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Сотрудник</th>
                        {days.map((day, idx) => (
                            <th key={idx}>{day}</th>
                        ))}
                        <th>Зарплата</th>
                        <th>Удалить</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map ((row, rowIndex) => (
                        <tr key={row.id}>
                            <td>{rowIndex + 1 }</td>
                            <td>
                                {editMode ? (
                                    <input
                                    value={row.name}
                                    onChange={(e) => 
                                        handleNameChange(row.id, e.target.value)
                                    }
                                    />
                                ) : (
                                    row.name
                                )}
                            </td>
                            {row.shifts.map((shift, dayIndex) => (
                                <td key={dayIndex}>
                                    {editMode ? (
                                        <input
                                        value={shift}
                                        onChange={(e) =>
                                            handleChange(row.id, dayIndex, e.target.value)
                                        }
                                        style={{width : '50px'}}
                                        />
                                    ) : (
                                        shift
                                    )}
                                </td>
                            ))}
                            <td>{calculateSalary(row.shifts)}</td>
                            <td>
                                <button onClick={() => handleDeleteRow(row.id)}>Удалит</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={handleAddRow}>
                {editMode ? 'Сохранить' : 'Добавить'}
            </button>
        </div>
    )
};
export default ShiftTable;
