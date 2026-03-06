import { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { Tag } from "../components/Tag";
import { adminApi } from "../../../infrastructure/api/adminApi";
import {
  getServiceCode,
  getTenantId,
  getAdminToken,
  setAdminToken,
} from "../../../infrastructure/config/env";

interface ChatUser {
  id: string;
  tenantId: string;
  email: string;
  name?: string | null;
  status?: string | null;
}

interface ServiceUserAssignment {
  userId: string;
  status?: string | null;
  user: ChatUser;
}

export const AdminPage = () => {
  const tenantId = getTenantId();
  const serviceCode = getServiceCode() || "clinicflow";
  const [adminToken, setAdminTokenState] = useState<string | null>(
    getAdminToken(),
  );
  const [adminUser, setAdminUser] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);

  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [serviceUsers, setServiceUsers] = useState<ServiceUserAssignment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");

  const [assignUserId, setAssignUserId] = useState("");

  const loadUsers = async () => {
    if (!tenantId || !serviceCode) return;
    setBusy(true);
    setError(null);
    try {
      const [users, assignments] = await Promise.all([
        adminApi.listChatUsers(tenantId),
        adminApi.listServiceUsers(tenantId, serviceCode),
      ]);
      setChatUsers((users as ChatUser[]) || []);
      setServiceUsers((assignments as ServiceUserAssignment[]) || []);
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar los usuarios.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!adminToken) return;
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  const handleAdminLogin = async () => {
    if (!adminUser || !adminPassword) return;
    setAdminError(null);
    setBusy(true);
    try {
      const res = await adminApi.login(adminUser, adminPassword);
      setAdminToken(res.accessToken);
      setAdminTokenState(res.accessToken);
    } catch (err: any) {
      setAdminError(err.message || "No se pudo iniciar sesión admin.");
    } finally {
      setBusy(false);
    }
  };

  const handleAdminLogout = () => {
    adminApi.logout();
    setAdminToken(null);
    setAdminTokenState(null);
  };

  const handleCreateUser = async () => {
    if (!tenantId || !serviceCode || !newUserEmail || !newUserPassword) return;
    setBusy(true);
    setError(null);
    try {
      const created = (await adminApi.createChatUser(tenantId, {
        email: newUserEmail,
        name: newUserName || undefined,
        password: newUserPassword,
      })) as ChatUser;
      await adminApi.assignServiceUser(tenantId, serviceCode, {
        userId: created.id,
        status: "active",
      });
      setNewUserEmail("");
      setNewUserName("");
      setNewUserPassword("");
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "No se pudo crear el usuario.");
    } finally {
      setBusy(false);
    }
  };

  const handleAssignExisting = async () => {
    if (!tenantId || !serviceCode || !assignUserId) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi.assignServiceUser(tenantId, serviceCode, {
        userId: assignUserId,
        status: "active",
      });
      setAssignUserId("");
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "No se pudo asignar el usuario.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateAssignment = async (userId: string, status: string) => {
    if (!tenantId || !serviceCode) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi.updateServiceUser(tenantId, serviceCode, userId, {
        status,
      });
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "No se pudo actualizar el usuario.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveAssignment = async (userId: string) => {
    if (!tenantId || !serviceCode) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi.removeServiceUser(tenantId, serviceCode, userId);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "No se pudo eliminar el usuario.");
    } finally {
      setBusy(false);
    }
  };

  const assignedIds = useMemo(
    () => new Set(serviceUsers.map((assignment) => assignment.userId)),
    [serviceUsers],
  );

  const availableUsers = useMemo(
    () => chatUsers.filter((user) => !assignedIds.has(user.id)),
    [chatUsers, assignedIds],
  );

  if (!tenantId) {
    return (
      <div className="page">
        <div className="card">Falta el tenantId del servicio.</div>
      </div>
    );
  }

  return (
    <div className="page">
      <SectionHeader
        title="Administración"
        subtitle="Usuarios, permisos y cumplimiento"
        action="Invitar usuario"
      />

      {!adminToken ? (
        <div className="card admin-card">
          <h3>Acceso administrador/tenant</h3>
          <p className="muted">
            Necesitas credenciales de admin o tenant para gestionar usuarios.
          </p>
          <div className="admin-form">
            <label className="admin-field">
              Usuario
              <input
                value={adminUser}
                onChange={(event) => setAdminUser(event.target.value)}
                placeholder="admin"
              />
            </label>
            <label className="admin-field">
              Contraseña
              <input
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                placeholder="••••••••"
              />
            </label>
            <button
              className="btn btn-primary btn-normal"
              onClick={handleAdminLogin}
              disabled={busy}
            >
              {busy ? "Conectando..." : "Conectar"}
            </button>
            {adminError ? <p className="login-error">{adminError}</p> : null}
          </div>
        </div>
      ) : (
        <div className="admin-toolbar">
          <Tag tone="success">Admin conectado</Tag>
          <button className="btn btn-ghost" onClick={handleAdminLogout}>
            Desconectar
          </button>
        </div>
      )}

      {adminToken ? (
        <section className="grid two-columns">
          <div className="card list-card">
            <h3>Usuarios asignados</h3>
            {error ? <div className="error-banner">{error}</div> : null}
            <div className="list">
              {serviceUsers.length === 0 ? (
                <div className="list-row">
                  <div>
                    <p className="list-title">Sin usuarios asignados</p>
                    <p className="muted">
                      Asigna usuarios para habilitar el login.
                    </p>
                  </div>
                </div>
              ) : (
                serviceUsers.map((assignment) => (
                  <div key={assignment.userId} className="list-row">
                    <div>
                      <p className="list-title">
                        {assignment.user?.name || assignment.user?.email}
                      </p>
                      <p className="muted">{assignment.user?.email}</p>
                    </div>
                    <div className="list-meta">
                      <select
                        className="form-select"
                        value={assignment.status || "active"}
                        onChange={(event) =>
                          handleUpdateAssignment(
                            assignment.userId,
                            event.target.value,
                          )
                        }
                      >
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                        <option value="pending">Pendiente</option>
                      </select>
                      <button
                        className="btn btn-ghost"
                        onClick={() =>
                          handleRemoveAssignment(assignment.userId)
                        }
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card list-card">
            <h3>Crear usuario y asignar</h3>
            <div className="admin-form">
              <label className="admin-field">
                Email
                <input
                  value={newUserEmail}
                  onChange={(event) => setNewUserEmail(event.target.value)}
                  placeholder="nuevo@clinicadental.com"
                />
              </label>
              <label className="admin-field">
                Nombre
                <input
                  value={newUserName}
                  onChange={(event) => setNewUserName(event.target.value)}
                  placeholder="Recepción"
                />
              </label>
              <label className="admin-field">
                Contraseña
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(event) => setNewUserPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </label>
              <button
                className="btn btn-primary btn-normal"
                onClick={handleCreateUser}
                disabled={busy}
              >
                Crear y asignar
              </button>
            </div>

            <div className="divider" />

            <h4>Asignar usuario existente</h4>
            <div className="admin-form">
              <select
                className="select"
                value={assignUserId}
                onChange={(event) => setAssignUserId(event.target.value)}
              >
                <option value="">Selecciona un usuario</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-ghost"
                onClick={handleAssignExisting}
                disabled={!assignUserId || busy}
              >
                Asignar
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="card">
        <h3>Seguridad & RGPD</h3>
        <ul className="checklist">
          <li className="done">Cifrado en tránsito y reposo</li>
          <li className="done">Retención configurable</li>
          <li>Revisión DPA con proveedores</li>
          <li>Auditoría de accesos trimestral</li>
        </ul>
      </section>
    </div>
  );
};
