import { DataTable, type DataTableColumn } from "../../components/DataTable";
import type { ChatUserSummary } from "../../types";
import type { TranslateFn } from "./types";

type ChatUsersCardProps = {
  chatUsers: ChatUserSummary[];
  chatUserColumns: DataTableColumn<ChatUserSummary>[];
  t: TranslateFn;
};

export function ChatUsersCard({
  chatUsers,
  chatUserColumns,
  t,
}: ChatUsersCardProps) {
  return (
    <div className="card full-width">
      <div className="card-header">
        <div>
          <h2>{t("Usuarios de chat")}</h2>
          <p className="muted">
            {t(
              "Gestiona todos los usuarios creados para todos los servicios. Para ver los de un servicio concreto, es necesario ir a la página de ese servicio.",
            )}
          </p>
        </div>
      </div>
      <DataTable
        columns={chatUserColumns}
        data={chatUsers}
        getRowId={(user) => user.id}
        pageSize={6}
        filterKeys={["name", "email", "status"]}
      />
      {chatUsers.length === 0 && (
        <div className="muted">{t("Sin usuarios creados.")}</div>
      )}
    </div>
  );
}
