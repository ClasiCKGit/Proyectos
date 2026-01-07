
import { Todo } from "../types/todo";

type Props = {
    todo: Todo;
    onToggle: (id: number) => void;
    onDelete: (id: number) => void;
};

export const TodoItem = ({ todo, onToggle, onDelete }: Props) => {
    return (
        <span className="todoItem">
            <label className="form-check-label">
                <input
                    className="form-check-input"
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => onToggle(todo.id)}
                />
                <span>
                    {todo.title}
                </span>
            </label>
            <button className="botonItem" onClick={() => onDelete(todo.id)}>🗑️</button>
        </span>
    );
};
