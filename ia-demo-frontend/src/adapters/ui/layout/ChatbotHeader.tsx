// src/adapters/ui/react/chat/ChatbotHeader.tsx
import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ChatTheme } from "../../../core/domain/constants/chatTheme";
import { IconCog } from "../components/icons";
import {
  LANGUAGE_OPTIONS,
  DEFAULT_LANG,
} from "../../../infrastructure/i18n/langs";
import { useAuthContext } from "../../../infrastructure/contexts/AuthContext";

export interface ChatbotHeaderProps {
  theme: ChatTheme;
  onToggleMinimize?: () => void;
  onLogout?: () => void;
  showLogout?: boolean;
  currentLanguage?: string; // p.ej. "es", "ca", "en", etc.
  onChangeLanguage?: (lang: string) => void;

  /** Estado de ancho del panel (normal / expandido) */
  isWide?: boolean;
  /** Toggle del ancho del panel completo */
  onToggleWidth?: () => void;

  /** Inicio de drag cuando se pulsa en el header izquierdo */
  onDragStart?: (event: ReactMouseEvent<HTMLDivElement>) => void;
}

const ChatbotHeader = ({
  theme,
  onToggleMinimize,
  onLogout,
  showLogout,
  currentLanguage = DEFAULT_LANG,
  onChangeLanguage,
  isWide = false,
  onToggleWidth,
  onDragStart,
}: ChatbotHeaderProps) => {
  const { t } = useTranslation("common");

  // 🔐 Leemos el estado de autenticación desde el contexto
  const { token } = useAuthContext();
  const isLoggedIn = Boolean(token);

  const {
    header: { title, titleKey, subtitle, subtitleKey, logoEmoji },
  } = theme;

  const resolvedTitle = titleKey ? t(titleKey, { defaultValue: title }) : title;
  const resolvedSubtitle = subtitleKey
    ? t(subtitleKey, { defaultValue: subtitle })
    : subtitle;

  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // 🌊 Estado local de expansión de altura del header
  const [isHeaderExpanded, setIsHeaderExpanded] = useState<boolean>(false);

  // 💬 Tooltip de “arrastra para mover”
  const [showDragHint, setShowDragHint] = useState<boolean>(false);

  // Regla:
  // - Si NO estamos loggeados => expandido (80 → 250 con animación).
  // - Si SÍ estamos loggeados => colapsado (250 → 80 con animación).
  useEffect(() => {
    if (!isLoggedIn) {
      setIsHeaderExpanded(true);
    } else {
      setIsHeaderExpanded(false);
    }
  }, [isLoggedIn]);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleLanguageClick = (code: string) => {
    if (onChangeLanguage) {
      onChangeLanguage(code);
    }
    setMenuOpen(false);
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
    setMenuOpen(false);
  };

  const handleMinimizeClick = () => {
    setMenuOpen(false);
    if (onToggleMinimize) {
      onToggleMinimize();
    }
  };

  const handleDragMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (onDragStart) {
      onDragStart(event);
    }
  };

  const handleDragAreaMouseEnter = () => {
    setShowDragHint(true);
  };

  const handleDragAreaMouseLeave = () => {
    setShowDragHint(false);
  };

  const headerClassName = [
    "ia-chatbot-header",
    isHeaderExpanded ? "ia-chatbot-header--expanded" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClassName}>
      {/* Fila superior: logo + textos + acciones */}
      <div className="ia-chatbot-header-top">
        <div
          className="ia-chatbot-header-left"
          onMouseDown={handleDragMouseDown}
          onMouseEnter={handleDragAreaMouseEnter}
          onMouseLeave={handleDragAreaMouseLeave}
        >
          <div className="ia-chatbot-header-title">
            <span className="ia-chatbot-header-logo">{logoEmoji ?? "🤖"}</span>
            {resolvedTitle}
          </div>
          <div className="ia-chatbot-header-subtitle">{resolvedSubtitle}</div>

          {showDragHint && (
            <div className="ia-chatbot-header-drag-tooltip">
              {t("chat_header_drag_hint", {
                defaultValue: "Arrastra aquí para mover el chatbot",
              })}
            </div>
          )}
        </div>

        <div className="ia-chatbot-header-right">
          <div className="ia-chatbot-header-actions">
            {/* Botón de expandir/contraer ANCHO del chatbot */}
            {onToggleWidth && (
              <button
                type="button"
                className="ia-chatbot-header-settings-button"
                onClick={onToggleWidth}
                aria-label={t("chat_header_toggle_width_aria", {
                  defaultValue: "Cambiar ancho del chatbot",
                })}
              >
                <span className="ia-chatbot-header-settings-icon">
                  {isWide ? "⤢" : "⤡"}
                </span>
              </button>
            )}

            {/* Botón de settings / idioma */}
            <button
              type="button"
              className="ia-chatbot-header-settings-button"
              onClick={toggleMenu}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-label={t("chat_header_settings_aria")}
            >
              <span className="ia-chatbot-header-settings-icon">
                <IconCog size={16} />
              </span>
            </button>

            {/* Botón minimizar */}
            {onToggleMinimize && (
              <button
                type="button"
                className="ia-chatbot-header-settings-button"
                onClick={handleMinimizeClick}
                aria-label={t("chat_header_minimize_aria")}
              >
                <span className="ia-chatbot-header-settings-icon">—</span>
              </button>
            )}

            {menuOpen && (
              <div className="ia-chatbot-header-menu" role="menu">
                <div className="ia-chatbot-header-menu-section">
                  <div className="ia-chatbot-header-menu-title">
                    {t("chat_menu_language_title")}
                  </div>
                  <div className="ia-chatbot-header-menu-list">
                    {LANGUAGE_OPTIONS.map((opt) => (
                      <button
                        key={opt.code}
                        type="button"
                        className={
                          "ia-chatbot-header-menu-item" +
                          (currentLanguage === opt.code
                            ? " ia-chatbot-header-menu-item-active"
                            : "")
                        }
                        onClick={() => handleLanguageClick(opt.code)}
                        role="menuitemradio"
                        aria-checked={currentLanguage === opt.code}
                      >
                        <span className="ia-chatbot-header-menu-item-label">
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {showLogout && onLogout && (
                  <>
                    <div className="ia-chatbot-header-menu-separator" />
                    <button
                      type="button"
                      className="ia-chatbot-header-menu-item ia-chatbot-header-menu-item-danger"
                      onClick={handleLogoutClick}
                      role="menuitem"
                    >
                      <span className="ia-chatbot-header-menu-item-label">
                        ⎋ {t("chat_menu_logout_label")}
                      </span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bloque intro sólo cuando NO estamos loggeados, debajo de la fila superior */}
      {!isLoggedIn && (
        <div className="ia-chatbot-header-intro-copy">
          <h2 className="ia-chatbot-header-intro-title mt-2">
            Hola, humano. Soy Neria
          </h2>
          <h3 className="ia-chatbot-header-intro-subtitle">
            Entra para saber más de mí
          </h3>
        </div>
      )}
    </header>
  );
};

export default ChatbotHeader;
