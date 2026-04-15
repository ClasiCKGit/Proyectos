// src/components/AuthForms.tsx
import React, { useState } from "react";
import styles from './../styles/AuthForms.module.css'
import type { AuthUser } from "../api/auth";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<AuthUser>;
  onSwitch: () => void;
}

interface RegisterFormProps {
  onRegister: (data: { name: string; email: string; password: string }) => Promise<AuthUser>;
  onSwitch: () => void;
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────


// ─── LOGIN FORM ───────────────────────────────────────────────────────────────

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onSwitch }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) { setError("Completá todos los campos"); return; }
    setError(""); setLoading(true);
    try {
      await onLogin(email, password);
    } catch (e: any) {
      setError(e.message ?? "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div>
        <h1 className={styles.heading}>Bienvenido</h1>
        <p className={styles.sub}>Iniciá sesión para continuar</p>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Email</label>
        <input
          className={styles.input}
          type="email"
          placeholder="vos@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoComplete="email"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Contraseña</label>
        <input
          className={styles.input}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoComplete="current-password"
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <button
        className={styles.btnPrimary}
        style={{ opacity: loading ? 0.7 : 1 }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>

      <p className={styles.switchRow}>
        ¿No tenés cuenta?{" "}
        <button className={styles.switchLink} onClick={onSwitch}>
          Registrate
        </button>
      </p>
    </div>
  );
};

// ─── REGISTER FORM ────────────────────────────────────────────────────────────

export const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onSwitch }) => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.length < 2) e.name = "Mínimo 2 caracteres";
    if (!form.email.includes("@")) e.email = "Email inválido";
    if (form.password.length < 8) e.password = "Mínimo 8 caracteres";
    else if (!/[A-Z]/.test(form.password)) e.password = "Debe tener al menos una mayúscula";
    else if (!/[0-9]/.test(form.password)) e.password = "Debe tener al menos un número";
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setLoading(true);
    try {
      await onRegister(form);
    } catch (e: any) {
      setErrors({ general: e.message ?? "Error al registrarse" });
    } finally {
      setLoading(false);
    }
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className={styles.wrapper}>
      <div>
        <h1 className={styles.heading}>Crear cuenta</h1>
        <p className={styles.sub}>Es gratis y toma un minuto</p>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Nombre</label>
        <input
          className={errors.name ? `${styles.input} ${styles.inputError}` : styles.input}
          type="text" placeholder="Tu nombre" value={form.name} onChange={set("name")}
          autoComplete="name"
        />
        {errors.name && <span className={styles.error}>{errors.name}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Email</label>
        <input
          className={errors.email ? `${styles.input} ${styles.inputError}` : styles.input}
          type="email" placeholder="vos@email.com" value={form.email} onChange={set("email")}
          autoComplete="email"
        />
        {errors.email && <span className={styles.error}>{errors.email}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Contraseña</label>
        <input
          className={errors.password ? `${styles.input} ${styles.inputError}` : styles.input}
          type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={set("password")}
          autoComplete="new-password"
        />
        {errors.password
          ? <span className={styles.error}>{errors.password}</span>
          : <span className={styles.hint}>Mínimo 8 caracteres, una mayúscula y un número</span>
        }
      </div>

      {errors.general && <div className={styles.error}>{errors.general}</div>}

      <button
        className={styles.btnPrimary}
        style={{opacity: loading ? 0.7 : 1 }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className={styles.switchRow}>
        ¿Ya tenés cuenta?{" "}
        <button className={styles.switchLink} onClick={onSwitch}>
          Iniciá sesión
        </button>
      </p>
    </div>
  );
};
