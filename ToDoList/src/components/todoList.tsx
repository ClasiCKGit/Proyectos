import { Filter } from "../todoApp";
import { Todo } from "../types/todo";
import { TodoItem } from "./todoItem";

type Props = {
    filter: Filter;
    todos: Todo[];
    onToggle: (id: number) => void;
    onDelete: (id: number) => void;
};

export const TodoList = ({ filter, todos, onToggle, onDelete }: Props) => {
    const filteredTodos = todos.filter((todo) => {
        if (filter === Filter.Completadas) {
            return todo.completed;
        }
        if (filter === Filter.Pendientes) {
            return !todo.completed;
        }
        return true; //Todas las tareas
    });
    return (
        <div className="todoList">
            {filteredTodos.length === 0 ? (
                <span>
                    Por el momento no hay tareas{" "}
                    {filter === 0
                        ? "completadas"
                        : filter === 1
                        ? "pendientes"
                        : ""}
                </span>
            ) : (
                filteredTodos.map((todo) => (
                    <TodoItem
                        todo={todo}
                        onToggle={onToggle}
                        onDelete={onDelete}
                    />
                ))
            )}
        </div>
    );
};
