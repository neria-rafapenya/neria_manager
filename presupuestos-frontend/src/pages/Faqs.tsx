import { useEffect, useState } from "react";
import { faqsService } from "../services/faqsService";
import { Faq } from "../types/faq";
import { useAuth } from "../contexts/AuthContext";

export default function Faqs() {
  const { session } = useAuth();
  const isAdmin = session?.user.role === "ADMIN";
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [orderIndex, setOrderIndex] = useState("1");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadFaqs() {
    try {
      const data = await faqsService.list("");
      setFaqs(data);
      if (page > 1 && (page - 1) * pageSize >= data.length) {
        setPage(1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando FAQs");
    }
  }

  useEffect(() => {
    loadFaqs();
  }, []);

  function resetForm() {
    setQuestion("");
    setAnswer("");
    setOrderIndex("1");
    setEditingId(null);
  }

  async function handleSave() {
    setError(null);
    try {
      if (!question.trim()) {
        setError("La pregunta es obligatoria");
        return;
      }
      const payload = { question, answer, orderIndex: Number(orderIndex) };
      if (editingId) {
        await faqsService.update("", editingId, payload);
      } else {
        await faqsService.create("", payload);
      }
      resetForm();
      await loadFaqs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando FAQ");
    }
  }

  function startEdit(faq: Faq) {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer ?? "");
    setOrderIndex(faq.orderIndex?.toString() ?? "1");
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await faqsService.remove("", id);
      await loadFaqs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando FAQ");
    }
  }

  const totalPages = Math.max(1, Math.ceil(faqs.length / pageSize));
  const start = (page - 1) * pageSize;
  const visibleFaqs = isAdmin ? faqs.slice(start, start + pageSize) : faqs;

  return (
    <section>
      <h2>FAQs</h2>
      {isAdmin && (
        <div className="card" style={{ marginBottom: "16px" }}>
          <h3>{editingId ? "Editar FAQ" : "Nueva FAQ"}</h3>
          <div style={{ display: "grid", gap: "8px" }}>
            <input
              className="form-control light"
              placeholder="Pregunta"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <textarea
              className="form-control light"
              rows={3}
              placeholder="Respuesta"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <input
              className="form-control light"
              type="number"
              placeholder="Orden"
              value={orderIndex}
              onChange={(e) => setOrderIndex(e.target.value)}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleSave}>{editingId ? "Actualizar" : "Crear"}</button>
              {editingId && <button onClick={resetForm}>Cancelar</button>}
            </div>
          </div>
          {error && <div className="auth-error">{error}</div>}
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Orden</th>
            <th>Pregunta</th>
            <th>Respuesta</th>
            {isAdmin && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {visibleFaqs.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 4 : 3}>Sin datos</td>
            </tr>
          ) : (
            visibleFaqs.map((faq) => (
              <tr key={faq.id}>
                <td>{faq.orderIndex ?? "-"}</td>
                <td style={{ fontWeight: 600 }}>{faq.question}</td>
                <td>{faq.answer}</td>
                {isAdmin && (
                  <td>
                    <button onClick={() => startEdit(faq)}>Editar</button>
                    <button onClick={() => handleDelete(faq.id)} style={{ marginLeft: "8px" }}>
                      Borrar
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isAdmin && totalPages > 1 && (
        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
            Anterior
          </button>
          <span>
            Página {page} / {totalPages}
          </span>
          <button onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page === totalPages}>
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
}
