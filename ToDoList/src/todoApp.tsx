import { useEffect, useState } from "react";
import { Todo } from "./types/todo";
import { TodoList } from "./components/todoList";
import { TodoForm } from "./components/todoForm";

export enum Filter {
    Completadas,
    Pendientes,
    Todas,
}

export const TodoApp = () => {
    const [todos, setTodos] = useState<Todo[]>(()=>{
        const data = localStorage.getItem("todos")      //Obtener Todos si hay en el localSotrage
        return data ? JSON.parse(data) : []             //Si no hay, el estado "todos" se inicializa como []
    });
    const [filter, setFilter] = useState<Filter>(Filter.Todas);

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

    useEffect(()=>{     //useEffect: cada vez que se modifica "todos" se ejecuta lo de abajo
        localStorage.setItem("todos", JSON.stringify(todos))    //se guarda los todos en "todos" del localStorage
    }, [todos])
    return (
        <>
            <h1>todoApp</h1>
            <TodoForm onAddTodo={addTodo} />
            <div className="containerBotones">
                <button
                    className="btn btn-success"
                    onClick={() => setFilter(Filter.Completadas)}
                >
                    Mostrar solo completadas
                </button>
                <button
                    className="btn btn-danger"
                    onClick={() => setFilter(Filter.Pendientes)}
                >
                    Mostrar solo pendientes
                </button>
                <button
                    className="btn btn-primary"
                    onClick={() => setFilter(Filter.Todas)}
                >
                    Mostrar todas las tareas
                </button>
            </div>
            <TodoList
                filter={filter}
                todos={todos}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
            />
        </>
    );
};
