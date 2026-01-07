import React, { useState } from "react";

type Props = { onAddTodo: (title: string) => void };

export const TodoForm = ({ onAddTodo }: Props) => {
    const [value, setValue] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (value.trim() === "") return;

        onAddTodo(value);
        console.log(`se agrego la tarea "${value}"`)
        setValue("");
    };

    return (
        <form className="todoForm" onSubmit={handleSubmit}>
            <input
                className="form-control"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)} //Cuando se cambia el value del input se lo asigna al estado "value"
            />
            <button className="btn btn-primary" type="submit">Agregar</button>
        </form>
    );
};
