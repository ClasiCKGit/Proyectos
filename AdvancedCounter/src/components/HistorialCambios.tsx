import { State, Action } from "../CounterApp";
import { Change } from "../types/cambio";

type Props = {
    counterState: State;
    setCounter: React.ActionDispatch<[action: Action]>;
};

export const HistorialCambios = ({ counterState, setCounter }: Props) => {
    const future:Change[] =  counterState.future.map(cambio => {
        return cambio
    })
    const orderedFuture = future.sort((a,b) => a.id-b.id)
    return (
        <div className="container-history">
            <div className="container-botones2">
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setCounter({ type: "undo" });
                    }}
                    disabled={counterState.history.length === 0 ? true : false}
                >
                    Deshacer
                </button>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setCounter({ type: "reset" });
                    }}
                    disabled={counterState.history.length === 0 ? true : false}
                >
                    Reset
                </button>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setCounter({ type: "redo" });
                    }}
                    disabled={counterState.future.length === 0 ? true : false}
                >
                    Redo
                </button>
            </div>
            <div className="history">
                {counterState.history.length === 0 && counterState.future.length === 0 
                ? <span> No hay cambios en el historial </span>
                : counterState.history.map((change) => (
                    <span className={change.id === counterState.history.length ? "cambio" : ""}>
                        Initial value: {change.initialValue}, step: {change.step}, result: {change.result}
                    </span>
                ))
                }
                {orderedFuture.map((change) => (
                    <span >
                        Initial value: {change.initialValue}, step: {change.step}, result: {change.result}
                    </span>
                ))
                }
            </div>
        </div>
    );
};
