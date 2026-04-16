// src/App.tsx
import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { LoginForm, RegisterForm } from "./components/AuthForms";
import { Dashboard } from "./components/Dashboard";
import styles from './App.module.css'

export default function App() {
  const { user, isAuthenticated, loading, login, logout, register } = useAuth();
  const [screen, setScreen] = useState<"login" | "register">("login");

  // Listen for forced logout (expired token + no refresh)
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, [logout]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.authPage}>
        {screen === "login" ? (
          <LoginForm
            onLogin={login}
            onSwitch={() => setScreen("register")}
          />
        ) : (
          <RegisterForm
            onRegister={register}
            onSwitch={() => setScreen("login")}
          />
        )}
      </div>
    );
  }

  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.logo}>💰 ExpensesManager V1</span>
        <div className={styles.userRow}>
          <span className={styles.userName}>{user?.name}</span>
          <button className={styles.logoutBtn} onClick={logout}>
            Salir
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className={styles.main}>
        <Dashboard/>
      </main>
    </div>
  );
}