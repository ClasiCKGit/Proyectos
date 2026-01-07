
import { Todo } from '../types/todo'
import { TodoItem } from './todoItem'

type Props = {
    todos: Todo[]
    onToggle: (id: number) => void
    onDelete: (id: number) => void
}

export const TodoList = ({todos, onToggle, onDelete}: Props) => {
    return (
        <div className='todoList'>
            { todos.length === 0 
            ? <span> Por el momento no hay nada para hacer</span>
            : todos.map(todo=>(
                <TodoItem 
                todo={todo}
                onToggle={onToggle}
                onDelete={onDelete}
                />
            ))}
        </div>
    )
}