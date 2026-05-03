import type React from "react";
import { useRef, useEffect } from "react";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "../../utils/helpers";
import type { Category } from "../../types";
import styles from "../../styles/ui/CategorySelect.module.css";

//Custom select para categorias

interface CategorySelectProps {
  category: Category | undefined;
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;
  setCategory: React.Dispatch<React.SetStateAction<Category>>;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  category,
  open,
  setOpen,
  setCategory,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click afuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`${styles.input} ${styles.select}`} ref={ref}>
      <div
        style={{ display: "flex" }}
        onClick={() => {
          setOpen(!open);
        }}
      >
        <span style={{ marginRight: "20px" }}>
          {CATEGORY_ICONS[category as Category]}{" "}
          {CATEGORY_LABELS[category as Category]}
        </span>
        <span
          className={`${open ? styles.selectArrowUp : styles.selectArrowDown}`}
        >
          ❯
        </span>
      </div>

      <ul className={`${styles.options} ${open ? styles.optionsOpen : ""}`}>
        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
          <li
            key={k}
            value={k}
            className={styles.option}
            onClick={() => {
              setCategory(k as Category);
              setOpen(!open);
            }}
          >
            {CATEGORY_ICONS[k as Category]} {v}
          </li>
        ))}
      </ul>
    </div>
  );
};
