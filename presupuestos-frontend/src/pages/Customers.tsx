import { useEffect, useState } from "react";
import { customersService } from "../services/customersService";
import { Customer } from "../types/customer";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadCustomers() {
    try {
      const data = await customersService.list("");
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando clientes");
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function handleCreate() {
    setError(null);
    try {
      await customersService.create("", { name, email, phone });
      setName("");
      setEmail("");
      setPhone("");
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando cliente");
    }
  }

  function startEdit(customer: Customer) {
    setEditingId(customer.id);
    setEditName(customer.name ?? "");
    setEditEmail(customer.email ?? "");
    setEditPhone(customer.phone ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditEmail("");
    setEditPhone("");
  }

  async function saveEdit(id: string) {
    setError(null);
    try {
      await customersService.update("", id, {
        name: editName,
        email: editEmail,
        phone: editPhone,
      });
      cancelEdit();
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando cliente");
    }
  }

  return (
    <section>
      <h2>Customers</h2>
      <div className="card" style={{ marginBottom: "16px" }}>
        <h3>Nuevo cliente</h3>
        <p>
          Este cliente tendrá usuario con password maestro y deberá cambiarlo al primer login.
        </p>
        <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          <input className="form-control light" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="form-control light" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="form-control light" placeholder="Telefono" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button onClick={handleCreate}>Crear</button>
        </div>
        {error && <div className="auth-error">{error}</div>}
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Telefono</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 ? (
            <tr>
              <td colSpan={4}>Sin datos</td>
            </tr>
          ) : (
            customers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  {editingId === customer.id ? (
                    <input className="form-control light" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  ) : (
                    customer.name ?? "-"
                  )}
                </td>
                <td>
                  {editingId === customer.id ? (
                    <input className="form-control light" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                  ) : (
                    customer.email ?? "-"
                  )}
                </td>
                <td>
                  {editingId === customer.id ? (
                    <input className="form-control light" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                  ) : (
                    customer.phone ?? "-"
                  )}
                </td>
                <td>
                  {editingId === customer.id ? (
                    <>
                      <button onClick={() => saveEdit(customer.id)}>Guardar</button>
                      <button onClick={cancelEdit} style={{ marginLeft: "8px" }}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(customer)}>Editar</button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
