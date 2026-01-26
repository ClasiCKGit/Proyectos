import { useReducer, useState } from "react";
import { BotonReusable } from "./components/BotonReusable";
import { Change } from "./types/cambio";
import { HistorialCambios } from "./components/HistorialCambios";

export type State = {
    count: number;
    history: Change[];
    future: Change[];
    nextId: number;
};

export type Action =
    | { type: "decrement"; payload: number }
    | { type: "increment"; payload: number }
    | { type: "undo" }
    | { type: "redo" }
    | { type: "reset" };

function counterReducer(state: State, action: Action): State {
    switch (action.type) {
        case "increment": {
            const initialValue = state.count;
            const result = initialValue + action.payload;

            const newChange: Change = {
                id: state.nextId,
                initialValue,
                step: action.payload,
                result,
            };
            return {
                count: result,
                history: [...state.history, newChange],
                future: [],
                nextId: state.nextId + 1,
            };
        }
        case "decrement": {
            const initialValue = state.count;
            const result = initialValue - action.payload;

            const newChange: Change = {
                id: state.nextId,
                initialValue,
                step: -action.payload,
                result,
            };
            return {
                count: result,
                history: [...state.history, newChange],
                future: [],
                nextId: state.nextId + 1,
            };
        }
        case "undo": {
            if (state.history.length === 0) {
                return state;
            }
            const lastChange = state.history[state.history.length - 1];
            return {
                count: lastChange.initialValue,
                history: state.history.slice(0, -1),
                future: [...state.future, lastChange],
                nextId: state.nextId - 1,
            };
        }
        case "redo": {
            if (state.future.length === 0) {
                return state;
            }
            const lastUndone = state.future[state.future.length - 1];
            return {
                count: lastUndone.result,
                history: [...state.history, lastUndone],
                future: state.future.slice(0, -1),
                nextId: state.nextId + 1,
            };
        }
        case "reset": {
            return {
                count: 0,
                history: [],
                future: [],
                nextId: 1,
            };
        }
        default:
            return state;
    }
}

export const CounterApp = () => {
    const initialState: State = {
        count: 0,
        history: [],
        future: [],
        nextId: 1
    };
    const [step, setStep] = useState(1);
    const [counter, setCounter] = useReducer(counterReducer, initialState);

    const setInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = Number(e.target.value);
        if (isNaN(value)) {
            value = 0;
        }
        if (value < 0) {
            setStep(0);
        } else {
            setStep(value);
        }
    };

    return (
        <>
            <div className="container-contador">
                <h1>ContadorApp</h1>
                <div className="input-group flex-nowrap">
                    <span className="input-group-text span-step"> Step </span>
                    <input
                        className="form-control"
                        id="input-step"
                        type="text"
                        value={step}
                        onChange={(e) => setInput(e)}
                    />
                </div>
                <span className="counter">{counter.count}</span>
                <div className="container-botones">
                    <BotonReusable
                        css={"btn btn-danger"}
                        onClick={() => {
                            setCounter({ type: "decrement", payload: step });
                        }}
                        text={"-"}
                    />
                    <BotonReusable
                        css={"btn btn-success"}
                        onClick={() => {
                            setCounter({ type: "increment", payload: step });
                        }}
                        text={"+"}
                    />
                </div>
            </div>
            <HistorialCambios counterState={counter} setCounter={setCounter} />
        </>
    );
};
