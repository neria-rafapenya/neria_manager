import { useEffect, useMemo, useState } from "react";
import { patientApi } from "../../../infrastructure/api/clinicflowApi";
import { compressImageToTarget } from "../../../infrastructure/utils/image";
import { IconCamera } from "../components/shared/icons";

type Preferences = {
  preferredTimeOfDay?: string | null;
  preferredPractitionerName?: string | null;
  preferredTreatment?: string | null;
  preferredDays?: string[] | null;
  unavailableDays?: string[] | null;
};

const dayOptions = [
  { label: "L", value: "mon" },
  { label: "M", value: "tue" },
  { label: "X", value: "wed" },
  { label: "J", value: "thu" },
  { label: "V", value: "fri" },
  { label: "S", value: "sat" },
  { label: "D", value: "sun" },
];

const timeOptions = [
  { label: "Cualquiera", value: "any" },
  { label: "Mañana", value: "morning" },
  { label: "Tarde", value: "afternoon" },
  { label: "Noche", value: "evening" },
];

export const PatientSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [prefs, setPrefs] = useState<Preferences>({});
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const avatarPreview = useMemo(() => profile?.avatarUrl || "", [profile]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [profileData, prefData] = await Promise.all([
          patientApi.getProfile(),
          patientApi.getPreferences(),
        ]);
        if (!active) return;
        setProfile(profileData);
        setPrefs(prefData || {});
      } catch (err: any) {
        if (active) {
          setError(err.message || "No se pudo cargar el perfil.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const toggleDay = (key: keyof Preferences, day: string) => {
    setPrefs((prev) => {
      const current = (prev[key] as string[]) || [];
      const exists = current.includes(day);
      const next = exists
        ? current.filter((item) => item !== day)
        : [...current, day];
      return { ...prev, [key]: next };
    });
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await patientApi.updateProfile({
        name: profile.name,
        email: profile.email,
      });
      setProfile(updated);
      window.dispatchEvent(
        new CustomEvent("clinicflow:toast", {
          detail: {
            title: "Perfil actualizado",
            message: "Los datos de tu perfil se guardaron correctamente.",
            variant: "success",
          },
        }),
      );
    } catch (err: any) {
      setError(err.message || "No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await patientApi.updatePreferences(prefs);
      setPrefs(updated);
      window.dispatchEvent(
        new CustomEvent("clinicflow:toast", {
          detail: {
            title: "Preferencias guardadas",
            message: "Actualizamos tus preferencias de cita.",
            variant: "success",
          },
        }),
      );
    } catch (err: any) {
      setError(err.message || "No se pudieron guardar las preferencias.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword) {
      setError("Completa tu contraseña actual y la nueva.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await patientApi.changePassword(passwords);
      setPasswords({ currentPassword: "", newPassword: "" });
      window.dispatchEvent(
        new CustomEvent("clinicflow:toast", {
          detail: {
            title: "Contraseña actualizada",
            message: "Tu contraseña se ha cambiado correctamente.",
            variant: "success",
          },
        }),
      );
    } catch (err: any) {
      setError(err.message || "No se pudo actualizar la contraseña.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const compressed = await compressImageToTarget(file);
      const updated = await patientApi.uploadAvatar(compressed);
      setProfile(updated);
      window.dispatchEvent(
        new CustomEvent("clinicflow:toast", {
          detail: {
            title: "Avatar actualizado",
            message: "Tu nueva foto está guardada.",
            variant: "success",
          },
        }),
      );
    } catch (err: any) {
      setError(err.message || "No se pudo subir la imagen.");
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h3>Mi perfil</h3>
        <p className="muted">
          Actualiza tus datos personales y preferencias de cita.
        </p>
        {loading ? <p>Cargando...</p> : null}
        {error ? <p className="muted">{error}</p> : null}
      </div>

      <section className="grid two-columns">
        <div className="card">
          <h4>Datos personales</h4>

          <div className="row mt-3">
            <div className="col-2">
              <div className="d-flex align-items-center gap-3">
                <label className="avatar-upload">
                  <div className="avatar-preview">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" />
                    ) : (
                      <div className="avatar-placeholder">CF</div>
                    )}

                    <div className="avatar-overlay">
                      <IconCamera size={20} />
                    </div>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
            </div>

            <div className="col-10">
              <div className="form-field">
                <label>Nombre</label>
                <input
                  type="text"
                  value={profile?.name || ""}
                  onChange={(event) =>
                    setProfile((prev: any) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input
                  type="email"
                  value={profile?.email || ""}
                  onChange={(event) =>
                    setProfile((prev: any) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                />
              </div>
              <button
                className="btn btn-primary btn-normal w-100 mt-4"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                Guardar perfil
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <h4>Seguridad</h4>
          <div className="form-field mt-3">
            <label>Contraseña actual</label>
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(event) =>
                setPasswords((prev) => ({
                  ...prev,
                  currentPassword: event.target.value,
                }))
              }
            />
          </div>
          <div className="form-field">
            <label>Nueva contraseña</label>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(event) =>
                setPasswords((prev) => ({
                  ...prev,
                  newPassword: event.target.value,
                }))
              }
            />
          </div>
          <button
            className="btn btn-primary btn-normal w-100 mt-5"
            onClick={handleChangePassword}
            disabled={saving}
          >
            Cambiar contraseña
          </button>
        </div>
      </section>

      <section className="grid two-columns">
        <div className="card">
          <h4>Preferencias de cita</h4>
          <div className="form-field">
            <label>Horario preferido</label>
            <select
              value={prefs.preferredTimeOfDay || "any"}
              onChange={(event) =>
                setPrefs((prev) => ({
                  ...prev,
                  preferredTimeOfDay: event.target.value,
                }))
              }
            >
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Tratamiento habitual</label>
            <input
              type="text"
              value={prefs.preferredTreatment || ""}
              onChange={(event) =>
                setPrefs((prev) => ({
                  ...prev,
                  preferredTreatment: event.target.value,
                }))
              }
            />
          </div>
          <div className="form-field">
            <label>Profesional preferido</label>
            <input
              type="text"
              value={prefs.preferredPractitionerName || ""}
              onChange={(event) =>
                setPrefs((prev) => ({
                  ...prev,
                  preferredPractitionerName: event.target.value,
                }))
              }
            />
          </div>
          <div className="form-field">
            <label>Días preferidos</label>
            <div className="d-flex gap-2 flex-wrap">
              {dayOptions.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  className={`btn ${prefs.preferredDays?.includes(day.value) ? "btn-primary" : "secondary"}`}
                  onClick={() => toggleDay("preferredDays", day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Días no disponibles</label>
            <div className="d-flex gap-2 flex-wrap">
              {dayOptions.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  className={`btn ${prefs.unavailableDays?.includes(day.value) ? "btn-primary" : "secondary"}`}
                  onClick={() => toggleDay("unavailableDays", day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
          <button
            className="btn btn-primary btn-normal w-100 mt-4"
            onClick={handleSavePreferences}
            disabled={saving}
          >
            Guardar preferencias
          </button>
        </div>
      </section>
    </div>
  );
};
