import { Fragment, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { productsService } from "../services/productsService";
import { quotesService } from "../services/quotesService";
import { uploadFile } from "../services/uploadService";
import { customersService } from "../services/customersService";
import { sectorsService } from "../services/sectorsService";
import { Customer } from "../types/customer";
import { OptionValue, Product, ProductOption } from "../types/product";
import {
  Quote,
  QuoteAttachment,
  QuoteItemCreateRequest,
  QuoteStatus,
} from "../types/quote";
import { useAuth } from "../contexts/AuthContext";
import { Sector } from "../types/sector";

interface ItemForm {
  id: string;
  productId: string;
  quantity: number;
  options: Record<string, string>;
}

export default function Quotes() {
  const { session } = useAuth();
  const isAdmin = session?.user.role === "ADMIN";

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [attachments, setAttachments] = useState<QuoteAttachment[]>([]);
  const [attachmentsByQuote, setAttachmentsByQuote] = useState<Record<string, QuoteAttachment[]>>({});
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sectorFilter, setSectorFilter] = useState("");

  const [form, setForm] = useState<{
    customerId: string;
    status: QuoteStatus;
    items: ItemForm[];
    sector: string;
  }>({
    customerId: "",
    status: "DRAFT",
    items: [],
    sector: "",
  });

  const [productOptions, setProductOptions] = useState<
    Record<
      string,
      {
        options: ProductOption[];
        valuesByOptionId: Record<string, OptionValue[]>;
      }
    >
  >({});

  async function loadQuotes() {
    try {
      const data = await quotesService.list("");
      setQuotes(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error cargando presupuestos",
      );
    }
  }

  async function loadProducts() {
    try {
      const data = await productsService.list("");
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando productos/servicios");
    }
  }

  async function loadCustomers() {
    try {
      const data = await customersService.list("");
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando clientes");
    }
  }

  async function loadSectors() {
    try {
      const data = await sectorsService.list("");
      setSectors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando sectores");
    }
  }

  async function loadAttachments(quoteId: string) {
    try {
      const data = await quotesService.listAttachments("", quoteId);
      setAttachments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando adjuntos");
    }
  }

  async function loadAttachmentsForQuote(quoteId: string) {
    try {
      const data = await quotesService.listAttachments("", quoteId);
      setAttachmentsByQuote((prev) => ({ ...prev, [quoteId]: data }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando adjuntos");
    }
  }

  async function ensureProductOptions(productId: string) {
    if (productOptions[productId]) return;
    try {
      const options = await productsService.listOptions("", productId);
      const valuesByOptionId: Record<string, OptionValue[]> = {};
      for (const option of options) {
        if (option.optionType === "SELECT") {
          valuesByOptionId[option.id] = await productsService.listOptionValues(
            "",
            option.id,
          );
        }
      }
      setProductOptions((prev) => ({
        ...prev,
        [productId]: { options, valuesByOptionId },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando opciones");
    }
  }

  function toggleExpanded(quoteId: string) {
    setExpandedId((prev) => (prev === quoteId ? null : quoteId));
    const quote = quotes.find((q) => q.id === quoteId);
    if (quote?.items) {
      quote.items.forEach((item) => {
        if (item.productId) {
          ensureProductOptions(item.productId);
        }
      });
    }
    loadAttachmentsForQuote(quoteId);
  }

  function getProductName(productId?: string) {
    if (!productId) return "-";
    return products.find((product) => product.id === productId)?.name ?? productId;
  }

  function getOptionName(productId: string | undefined, optionId: string) {
    if (!productId) return optionId;
    const optionData = productOptions[productId];
    return optionData?.options.find((option) => option.id === optionId)?.name ?? optionId;
  }

  function formatMoney(value: number) {
    return value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function calcSubtotal(quote: Quote) {
    return (quote.items ?? []).reduce((sum, item) => {
      const qty = item.quantity ?? 1;
      const unit = item.unitPrice ?? 0;
      const total = item.totalPrice ?? unit * qty;
      return sum + total;
    }, 0);
  }

  useEffect(() => {
    loadQuotes();
    loadProducts();
    if (isAdmin) {
      loadCustomers();
      loadSectors();
    }
  }, [isAdmin]);

  useEffect(() => {
    form.items.forEach((item) => {
      if (item.productId) {
        ensureProductOptions(item.productId);
      }
    });
  }, [form.items]);

  const selectedQuote = useMemo(
    () => quotes.find((q) => q.id === editingId) ?? null,
    [quotes, editingId],
  );

  async function startEdit(quoteId: string) {
    if (!isAdmin) return;
    try {
      const full = await quotesService.get("", quoteId);
      setEditingId(full.id);
      setForm({
        customerId: full.customerId ?? "",
        status: full.status,
        sector: full.sector ?? "",
        items:
          full.items?.map((item) => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity ?? 1,
            options: (item.options ?? []).reduce<Record<string, string>>(
              (acc, opt) => {
                if (opt.optionId) {
                  acc[opt.optionId] = opt.value ?? "";
                }
                return acc;
              },
              {},
            ),
          })) ?? [],
      });
      await loadAttachments(full.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error cargando presupuesto",
      );
    }
  }

  function startNew() {
    setEditingId(null);
    setAttachments([]);
    setForm({ customerId: "", status: "DRAFT", items: [], sector: "" });
  }

  function addItem() {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: `${Date.now()}`, productId: "", quantity: 1, options: {} },
      ],
    }));
  }

  function updateItem(index: number, patch: Partial<ItemForm>) {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], ...patch };
      return { ...prev, items };
    });
  }

  function removeItem(index: number) {
    setForm((prev) => {
      const items = prev.items.filter((_, i) => i !== index);
      return { ...prev, items };
    });
  }

  function buildItemsPayload(): QuoteItemCreateRequest[] {
    return form.items
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        options: Object.entries(item.options).map(([optionId, value]) => ({
          optionId,
          value,
        })),
      }));
  }

  function validateForm(): string[] {
    const errors: string[] = [];
    if (form.items.length === 0) {
      errors.push("Debes añadir al menos un item.");
    }
    form.items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: selecciona producto/servicio.`);
        return;
      }
      if (!item.quantity || item.quantity < 1) {
        errors.push(`Item ${index + 1}: cantidad inválida.`);
      }
      const optionData = productOptions[item.productId];
      if (!optionData) return;
      optionData.options.forEach((option) => {
        if (!option.required) return;
        const value = item.options[option.id];
        if (value == null || value === "") {
          errors.push(
            `Item ${index + 1}: opción obligatoria '${option.name}' sin valor.`,
          );
          return;
        }
        if (option.optionType === "NUMBER" && isNaN(Number(value))) {
          errors.push(`Item ${index + 1}: '${option.name}' debe ser numérico.`);
        }
        if (
          option.optionType === "BOOLEAN" &&
          value !== "true" &&
          value !== "false"
        ) {
          errors.push(
            `Item ${index + 1}: '${option.name}' debe ser true/false.`,
          );
        }
      });
    });
    return errors;
  }

  async function handleSave() {
    setError(null);
    const validationErrors = validateForm();
    if (validationErrors.length) {
      setError(validationErrors.join(" "));
      return;
    }
    try {
      const payload = {
        customerId: form.customerId || undefined,
        items: buildItemsPayload(),
        status: form.status,
        sector: form.sector || undefined,
      };
      if (editingId) {
        await quotesService.update("", editingId, {
          status: payload.status,
          items: payload.items,
          sector: payload.sector,
        });
      } else {
        const created = await quotesService.create("", {
          customerId: payload.customerId,
          items: payload.items,
          sector: payload.sector,
        });
        setEditingId(created.id);
        await loadAttachments(created.id);
      }
      await loadQuotes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error guardando presupuesto",
      );
    }
  }

  async function handleUpload() {
    if (!file || !editingId) return;
    setUploading(true);
    setError(null);
    try {
      const upload = await uploadFile(file, "presupuestos/quotes");
      const url = upload.secureUrl ?? upload.url;
      if (!url) {
        throw new Error("URL de subida vacia");
      }
      await quotesService.addAttachment("", editingId, {
        url,
        fileName: file.name,
        contentType: file.type,
      });
      setFile(null);
      await loadAttachments(editingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error subiendo adjunto");
    } finally {
      setUploading(false);
    }
  }

  async function handleSendEmail() {
    if (!editingId) return;
    setSendingEmail(true);
    setError(null);
    try {
      await quotesService.sendEmail("", editingId);
      await loadAttachments(editingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error enviando email");
    } finally {
      setSendingEmail(false);
    }
  }

  const filteredQuotes = sectorFilter
    ? quotes.filter((quote) => (quote.sector ?? "") === sectorFilter)
    : quotes;

  const selectedSectorId = form.sector
    ? sectors.find((sector) => sector.name === form.sector)?.id
    : "";
  const productsForSector = selectedSectorId
    ? products.filter((product) => product.sectorId === selectedSectorId)
    : products;

  return (
    <section>
      <h2>Quotes</h2>
      {isAdmin ? (
        <>
          <p>
            El menú Quotes del backoffice es la pantalla de gestión de
            presupuestos. Te permite:
          </p>
          <ul>
            <li>
              Listar todos los presupuestos del tenant (con filtro por sector).
            </li>
            <li>
              Ver el detalle de cada presupuesto (items, opciones, cantidades y
              estado).
            </li>
            <li>
              Crear nuevos presupuestos manuales (seleccionando sector, cliente
              y productos/servicios).
            </li>
            <li>
              Editar presupuestos existentes (cambiar estado, items y opciones).
            </li>
            <li>Subir adjuntos (PDF/imagen) a un presupuesto.</li>
            <li>Exportar PDF automático del presupuesto.</li>
            <li>Enviar PDF por email al cliente y registrar el envío.</li>
          </ul>
          <p>
            En resumen: es el panel donde el admin controla el ciclo completo
            del presupuesto (creación → edición → envío).
          </p>
        </>
      ) : (
        <p>
          En esta página puedes ver tus presupuestos solicitados anteriormente.
        </p>
      )}
      {error && <div className="auth-error">{error}</div>}
      {isAdmin ? (
        <div className="split">
          <div className="list-panel">
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <button onClick={startNew}>Nuevo presupuesto</button>
              <select
                className="form-select light"
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
              >
                <option value="">Todos</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="card">
          <table className="table table-hover w-100">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Sector</th>
                <th>Precio</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={6}>Sin datos</td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => (
                  <Fragment key={quote.id}>
                    <tr
                      onClick={() => startEdit(quote.id)}
                      className={
                        quote.id === editingId ? "row-active" : undefined
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <td>{quote.id.slice(0, 8)}</td>
                      <td>{quote.customerId ?? "-"}</td>
                      <td>{quote.sector ?? "-"}</td>
                      <td>{quote.totalPrice ?? 0}</td>
                      <td>{quote.status}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-dark"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleExpanded(quote.id);
                          }}
                        >
                          {expandedId === quote.id ? "Ocultar" : "Detalle"}
                        </button>
                      </td>
                    </tr>
                    {expandedId === quote.id && (
                      <tr>
                        <td colSpan={6}>
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={`${quote.id}-details`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeOut" }}
                              style={{ overflow: "hidden" }}
                            >
                              <div className="card" style={{ marginTop: "8px" }}>
                                <strong>Detalle del presupuesto</strong>
                                {quote.items?.length ? (
                                  <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
                                    {quote.items.map((item) => (
                                      <div key={item.id} className="card" style={{ padding: "12px" }}>
                                        <div>
                                          <strong>{getProductName(item.productId)}</strong>
                                        </div>
                                        <div className="helper-text">
                                          Cantidad: {item.quantity ?? 1} · Unitario: {item.unitPrice ?? 0} · Total: {item.totalPrice ?? 0}
                                        </div>
                                        {item.options && item.options.length > 0 && (
                                          <div className="helper-text">
                                            {item.options
                                              .map((opt) => `${getOptionName(item.productId, opt.optionId)}: ${opt.value ?? "-"}`)
                                              .join(" · ")}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="helper-text" style={{ marginTop: "8px" }}>
                                    Sin items registrados.
                                  </div>
                                )}
                                {(() => {
                                  const subtotal = calcSubtotal(quote);
                                  const discount = 0;
                                  const vat = subtotal * 0.21;
                                  const total = subtotal - discount + vat;
                                  const pdf = (attachmentsByQuote[quote.id] ?? []).find(
                                    (att) => att.contentType?.includes("pdf") || att.fileName?.toLowerCase().endsWith(".pdf"),
                                  );
                                  return (
                                    <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
                                      <div className="quote-summary-breakdown">
                                        <div>
                                          <span>Subtotal</span>
                                          <strong>{formatMoney(subtotal)} €</strong>
                                        </div>
                                        <div>
                                          <span>Descuento</span>
                                          <strong>{formatMoney(discount)} €</strong>
                                        </div>
                                        <div>
                                          <span>IVA (21%)</span>
                                          <strong>{formatMoney(vat)} €</strong>
                                        </div>
                                        <div className="quote-summary-total-row">
                                          <span>Total</span>
                                          <strong>{formatMoney(total)} €</strong>
                                        </div>
                                      </div>
                                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                        {pdf ? (
                                          <a className="btn btn-outline-dark btn-sm" href={pdf.url} target="_blank" rel="noreferrer">
                                            Descargar PDF
                                          </a>
                                        ) : (
                                          <span className="helper-text">PDF no disponible.</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </motion.div>
                          </AnimatePresence>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
            </div>
          </div>
          <div className="detail-panel">
            <div className="card">
              <h3>
                {editingId
                  ? `Editar ${selectedQuote?.id.slice(0, 8)}`
                  : "Nuevo presupuesto"}
              </h3>
              <label>
                Sector
                <select
                  className="form-select light"
                  value={form.sector}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, sector: e.target.value }))
                  }
                >
                  <option value="">Sin sector</option>
                  {sectors
                    .filter((s) => s.active)
                    .map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Cliente
                <select
                  className="form-select light"
                  value={form.customerId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, customerId: e.target.value }))
                  }
                >
                  <option value="">Sin cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name ?? customer.email ?? customer.id}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Estado
                <select
                  className="form-select light"
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value as QuoteStatus,
                    }))
                  }
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SENT">SENT</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </label>

              <div style={{ marginTop: "12px" }}>
                <h4>Items</h4>
                {form.items.map((item, index) => {
                  const optionData = item.productId
                    ? productOptions[item.productId]
                    : undefined;
                  return (
                    <div
                      key={item.id}
                      className="card"
                      style={{ marginTop: "8px" }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gap: "8px",
                          gridTemplateColumns: "1fr 120px auto",
                        }}
                      >
                        <select
                          className="form-select light"
                          value={item.productId}
                          onChange={(e) =>
                            updateItem(index, {
                              productId: e.target.value,
                              options: {},
                            })
                          }
                        >
                          <option value="">Selecciona producto/servicio</option>
                          {productsForSector.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                        <input
                          className="form-control light"
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, {
                              quantity: Number(e.target.value),
                            })
                          }
                        />
                        <button onClick={() => removeItem(index)}>
                          Eliminar
                        </button>
                      </div>

                      {optionData?.options?.length ? (
                        <div
                          style={{
                            marginTop: "8px",
                            display: "grid",
                            gap: "8px",
                          }}
                        >
                          {optionData.options.map((option) => {
                            const currentValue = item.options[option.id] ?? "";
                            const values =
                              optionData.valuesByOptionId[option.id] ?? [];
                            if (option.optionType === "SELECT") {
                              return (
                                <label key={option.id}>
                                  {option.name} {option.required ? "*" : ""}
                                  <select
                                    className="form-select light"
                                    value={currentValue}
                                    onChange={(e) =>
                                      updateItem(index, {
                                        options: {
                                          ...item.options,
                                          [option.id]: e.target.value,
                                        },
                                      })
                                    }
                                  >
                                    <option value="">Selecciona</option>
                                    {values.map((value) => (
                                      <option
                                        key={value.id}
                                        value={value.value ?? ""}
                                      >
                                        {value.value}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              );
                            }
                            if (option.optionType === "NUMBER") {
                              return (
                                <label key={option.id}>
                                  {option.name} {option.required ? "*" : ""}
                                  <input
                                    className="form-control light"
                                    type="number"
                                    value={currentValue}
                                    onChange={(e) =>
                                      updateItem(index, {
                                        options: {
                                          ...item.options,
                                          [option.id]: e.target.value,
                                        },
                                      })
                                    }
                                  />
                                </label>
                              );
                            }
                            return (
                              <label key={option.id}>
                                {option.name} {option.required ? "*" : ""}
                                <select
                                  className="form-select light"
                                  value={currentValue}
                                  onChange={(e) =>
                                    updateItem(index, {
                                      options: {
                                        ...item.options,
                                        [option.id]: e.target.value,
                                      },
                                    })
                                  }
                                >
                                  <option value="">Selecciona</option>
                                  <option value="true">true</option>
                                  <option value="false">false</option>
                                </select>
                              </label>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                <button onClick={addItem} style={{ marginTop: "8px" }}>
                  Añadir item
                </button>
              </div>

              <button onClick={handleSave} style={{ marginTop: "16px" }}>
                Guardar
              </button>
            </div>

            {editingId && (
              <div className="card" style={{ marginTop: "16px" }}>
                <h3>Adjuntos</h3>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <input
                    className="form-control light"
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <button onClick={handleUpload} disabled={!file || uploading}>
                    {uploading ? "Subiendo..." : "Subir PDF/Imagen"}
                  </button>
                  <button onClick={handleSendEmail} disabled={sendingEmail}>
                    {sendingEmail ? "Enviando..." : "Enviar PDF por email"}
                  </button>
                </div>
                <ul>
                  {attachments.map((att) => (
                    <li key={att.id}>
                      <a href={att.url} target="_blank" rel="noreferrer">
                        {att.fileName ?? att.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="list-panel full-width">
          <div className="card">
            <table className="table table-hover w-100">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Sector</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={6}>Sin datos</td>
                  </tr>
                ) : (
                  filteredQuotes.map((quote) => (
                    <Fragment key={quote.id}>
                      <tr>
                        <td>{quote.id.slice(0, 8)}</td>
                        <td>
                          {quote.createdAt
                            ? new Date(quote.createdAt).toLocaleDateString()
                            : "-"}
                        </td>
                        <td>{quote.sector ?? "-"}</td>
                        <td>{quote.totalPrice ?? 0}</td>
                        <td>{quote.status}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-dark"
                            onClick={() => toggleExpanded(quote.id)}
                          >
                            {expandedId === quote.id ? "Ocultar" : "Detalle"}
                          </button>
                        </td>
                      </tr>
                      {expandedId === quote.id && (
                        <tr>
                          <td colSpan={6}>
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={`${quote.id}-details`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                style={{ overflow: "hidden" }}
                              >
                                <div className="card" style={{ marginTop: "8px" }}>
                                  <strong>Detalle del presupuesto</strong>
                                  {quote.items?.length ? (
                                    <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
                                      {quote.items.map((item) => (
                                        <div key={item.id} className="card" style={{ padding: "12px" }}>
                                          <div>
                                            <strong>{getProductName(item.productId)}</strong>
                                          </div>
                                          <div className="helper-text">
                                            Cantidad: {item.quantity ?? 1} · Unitario: {item.unitPrice ?? 0} · Total: {item.totalPrice ?? 0}
                                          </div>
                                          {item.options && item.options.length > 0 && (
                                            <div className="helper-text">
                                              {item.options
                                                .map((opt) => `${getOptionName(item.productId, opt.optionId)}: ${opt.value ?? "-"}`)
                                                .join(" · ")}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="helper-text" style={{ marginTop: "8px" }}>
                                      Sin items registrados.
                                    </div>
                                  )}
                                  {(() => {
                                    const subtotal = calcSubtotal(quote);
                                    const discount = 0;
                                    const vat = subtotal * 0.21;
                                    const total = subtotal - discount + vat;
                                    const pdf = (attachmentsByQuote[quote.id] ?? []).find(
                                      (att) => att.contentType?.includes("pdf") || att.fileName?.toLowerCase().endsWith(".pdf"),
                                    );
                                    return (
                                      <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
                                        <div className="quote-summary-breakdown">
                                          <div>
                                            <span>Subtotal</span>
                                            <strong>{formatMoney(subtotal)} €</strong>
                                          </div>
                                          <div>
                                            <span>Descuento</span>
                                            <strong>{formatMoney(discount)} €</strong>
                                          </div>
                                          <div>
                                            <span>IVA (21%)</span>
                                            <strong>{formatMoney(vat)} €</strong>
                                          </div>
                                          <div className="quote-summary-total-row">
                                            <span>Total</span>
                                            <strong>{formatMoney(total)} €</strong>
                                          </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                          {pdf ? (
                                            <a className="btn btn-outline-dark btn-sm" href={pdf.url} target="_blank" rel="noreferrer">
                                              Descargar PDF
                                            </a>
                                          ) : (
                                            <span className="helper-text">PDF no disponible.</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </motion.div>
                            </AnimatePresence>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
