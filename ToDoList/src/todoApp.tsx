import { useState } from "react";
import { Todo } from "./types/todo";
import { TodoList } from "./components/todoList";
import { TodoForm } from "./components/todoForm";

export const TodoApp = () => {
    const [todos, setTodos] = useState<Todo[]>([]);

    const addTodo = (title: string) => {
        const newTodo: Todo = {
            id: todos.length + 1,
            title: title,
            completed: false,
        };
        setTodos((prev) => [...prev, newTodo]);
    };

    const toggleTodo = (id: number) => {
        setTodos((prev) =>
            prev.map((todo) =>
                todo.id === id ? { ...todo, completed: !todo.completed } : todo
            )
        );
    };

    const deleteTodo = (id: number) => {
        setTodos((prev) => prev.filter((todo) => todo.id !== id));
    };

    return (
        <>
            <h1>todoApp</h1>
            <TodoForm onAddTodo={addTodo} />
            <TodoList 
                todos={todos}
                onToggle={toggleTodo}
                onDelete= {deleteTodo}
            />
        </>
    );
};
