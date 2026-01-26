
type Props = {
    css: string
    onClick: () => void
    text: string
};

export const BotonReusable = ({onClick, text, css}: Props) => {
    return <button className={css} onClick={onClick} > {text} </button>;
};
