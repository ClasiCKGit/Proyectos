// src/__tests__/components/TransactionForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionForm } from "../components/TransactionForm";
import { StatCard } from "../components/StatCard";

// ─── StatCard ─────────────────────────────────────────────────────────────────

describe("StatCard", () => {
  it("renderiza label y valor", () => {
    render(<StatCard label="Balance" value="$12.500" />);
    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("$12.500")).toBeInTheDocument();
  });

  it("muestra el porcentaje de cambio cuando se pasa", () => {
    render(<StatCard label="Gastos" value="$5.000" change={12.5} />);
    expect(screen.getByText(/12\.5%/)).toBeInTheDocument();
    expect(screen.getByText(/▲/)).toBeInTheDocument();
  });

  it("muestra flecha hacia abajo para cambio negativo", () => {
    render(<StatCard label="Gastos" value="$5.000" change={-8.3} />);
    expect(screen.getByText(/▼/)).toBeInTheDocument();
    expect(screen.getByText(/8\.3%/)).toBeInTheDocument();
  });

  it("muestra el ícono si se pasa", () => {
    render(<StatCard label="Test" value="0" icon="💳" />);
    expect(screen.getByText("💳")).toBeInTheDocument();
  });
});

// ─── TransactionForm ──────────────────────────────────────────────────────────

describe("TransactionForm", () => {
  const mockSubmit = vi.fn();
  const mockCancel = vi.fn();
  const mockDelete = vi.fn();

  const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.clear(screen.getByPlaceholderText("0.00"));
    await user.type(screen.getByPlaceholderText("0.00"), "5000");
    await user.clear(screen.getByPlaceholderText("¿En qué gastaste?"));
    await user.type(screen.getByPlaceholderText("¿En qué gastaste?"), "Supermercado");
  };

  it("renderiza todos los campos del formulario", () => {
    render(<TransactionForm onSubmit={mockSubmit} onCancel={mockCancel} />);
    expect(screen.getByPlaceholderText("0.00")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("¿En qué gastaste?")).toBeInTheDocument();
    expect(screen.getByText("Gasto")).toBeInTheDocument();
    expect(screen.getByText("Ingreso")).toBeInTheDocument();
  });

  it("llama onSubmit con datos correctos al guardar", async () => {
    const user = userEvent.setup();
    mockSubmit.mockResolvedValue(undefined);
    render(<TransactionForm onSubmit={mockSubmit} onCancel={mockCancel} />);

    await fillValidForm(user);
    await user.click(screen.getByText("Agregar"));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Supermercado",
          amount: 5000,
          type: "expense",
        })
      );
    });
  });

  it("muestra error si se envía sin descripción", async () => {
    const user = userEvent.setup();
    render(<TransactionForm onSubmit={mockSubmit} onCancel={mockCancel} />);

    await user.type(screen.getByPlaceholderText("0.00"), "1000");
    await user.click(screen.getByText("Agregar"));

    await waitFor(() => {
      expect(screen.getByText(/obligatoria/i)).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("muestra error si el monto es 0", async () => {
    const user = userEvent.setup();
    render(<TransactionForm onSubmit={mockSubmit} onCancel={mockCancel} />);

    await user.type(screen.getByPlaceholderText("¿En qué gastaste?"), "Test");
    await user.type(screen.getByPlaceholderText("0.00"), "0");
    await user.click(screen.getByText("Agregar"));

    await waitFor(() => {
      expect(screen.getByText(/mayor a 0/i)).toBeInTheDocument();
    });
  });

  it("llama onCancel al hacer click en Cancelar", async () => {
    const user = userEvent.setup();
    render(<TransactionForm onSubmit={mockSubmit} onCancel={mockCancel} />);

    await user.click(screen.getByText("Cancelar"));
    expect(mockCancel).toHaveBeenCalled();
  });

  it("en modo edición muestra 'Guardar cambios' y el botón eliminar", () => {
    const tx = {
      id: "tx-1", type: "expense" as const, amount: 5000,
      description: "Test", category: "food" as const,
      date: "2026-04-10", tags: [], recurrence: "none" as const,
      notes: "", createdAt: "", updatedAt: "",
    };
    render(
      <TransactionForm
        initial={tx}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
        onDelete={mockDelete}
      />
    );
    expect(screen.getByText("Guardar cambios")).toBeInTheDocument();
    expect(screen.getByText("Eliminar")).toBeInTheDocument();
  });

  it("llama onDelete al hacer click en Eliminar", async () => {
    const user = userEvent.setup();
    const tx = {
      id: "tx-1", type: "expense" as const, amount: 5000,
      description: "Test", category: "food" as const,
      date: "2026-04-10", tags: [], recurrence: "none" as const,
      notes: "", createdAt: "", updatedAt: "",
    };
    mockDelete.mockResolvedValue(undefined);
    render(
      <TransactionForm
        initial={tx}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
        onDelete={mockDelete}
      />
    );

    await user.click(screen.getByText("Eliminar"));
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("tx-1"));
  });

  it("cambia el tipo a ingreso al hacer click en el toggle", async () => {
    const user = userEvent.setup();
    mockSubmit.mockResolvedValue(undefined);
    render(<TransactionForm onSubmit={mockSubmit} onCancel={mockCancel} />);

    await user.click(screen.getByText("Ingreso"));
    await user.type(screen.getByPlaceholderText("0.00"), "10000");
    await user.type(screen.getByPlaceholderText("¿De donde ingreso la plata?"), "Sueldo");
    await user.click(screen.getByText("Agregar"));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ type: "income" })
      );
    });
  });
});
