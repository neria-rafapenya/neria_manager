package com.neria.manager.tenants;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantCleanupService {
  private static final Logger log = LoggerFactory.getLogger(TenantCleanupService.class);

  private static final List<String> TENANT_TABLES =
      List.of(
          "tenant_service_survey_answers",
          "tenant_service_survey_responses",
          "tenant_service_survey_questions",
          "tenant_service_survey_insights",
          "tenant_service_surveys",
          "tenant_service_email_messages",
          "tenant_service_email_accounts",
          "tenant_service_embeddings",
          "tenant_service_files",
          "tenant_service_storage",
          "tenant_service_jira",
          "tenant_service_endpoints",
          "tenant_service_users",
          "tenant_service_api_keys",
          "tenant_service_configs",
          "tenant_service_financial_simulations",
          "tenant_service_operational_support",
          "tenant_service_pre_evaluations",
          "tenant_service_self_assessments",
          "chat_messages",
          "chat_conversations",
          "chat_users",
          "usage_events",
          "audit_events",
          "tenant_login_logs",
          "tenant_request_logs",
          "ocr_documents",
          "policies",
          "providers",
          "tenant_pricings",
          "api_keys",
          "db_connections",
          "notification_channels",
          "webhooks",
          "subscription_history",
          "subscription_payment_requests",
          "tenant_invoices",
          "subscriptions");

  private final JdbcTemplate jdbcTemplate;

  public TenantCleanupService(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @Transactional
  public Map<String, Integer> purgeTenant(String tenantId) {
    Map<String, Integer> results = new LinkedHashMap<>();

    // Remove dependent rows that do not have tenantId.
    safeUpdate(
        "DELETE ti FROM tenant_invoice_items ti JOIN tenant_invoices t ON ti.invoiceId = t.id WHERE t.tenantId = ?",
        tenantId,
        results,
        "tenant_invoice_items");

    safeUpdate(
        "DELETE ss FROM subscription_services ss JOIN subscriptions s ON ss.subscriptionId = s.id WHERE s.tenantId = ?",
        tenantId,
        results,
        "subscription_services");

    for (String table : TENANT_TABLES) {
      safeUpdate("DELETE FROM " + table + " WHERE tenantId = ?", tenantId, results, table);
    }

    return results;
  }

  private void safeUpdate(
      String sql, String tenantId, Map<String, Integer> results, String key) {
    try {
      int count = jdbcTemplate.update(sql, tenantId);
      results.put(key, count);
    } catch (DataAccessException ex) {
      log.warn("Tenant cleanup skipped {}: {}", key, ex.getMessage());
      results.put(key, 0);
    }
  }
}
