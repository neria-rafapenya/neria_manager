package com.neria.manager.common.services;

import jakarta.mail.Authenticator;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Properties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
  private static final Logger log = LoggerFactory.getLogger(EmailService.class);

  public void sendPasswordReset(String to, String resetUrl) {
    String subject = "Restablecer contraseña";
    String body =
        "Hola,\n\n"
            + "Para restablecer tu contraseña, visita este enlace:\n"
            + resetUrl
            + "\n";
    sendGeneric(List.of(to), subject, body);
  }

  public void sendGeneric(List<String> to, String subject, String body) {
    String host = unquote(System.getenv("SMTP_HOST"));
    String port = unquote(System.getenv().getOrDefault("SMTP_PORT", "587"));
    String username = unquote(System.getenv("SMTP_USERNAME"));
    String password = unquote(System.getenv("SMTP_PASSWORD"));
    String from = unquote(System.getenv().getOrDefault("SMTP_FROM", username));
    String provider = unquote(System.getenv("EMAIL_PROVIDER"));
    String resendApiKey = unquote(System.getenv("RESEND_API_KEY"));
    String resendFrom = unquote(System.getenv().getOrDefault("RESEND_FROM", from));
    boolean useResend =
        (provider != null && provider.equalsIgnoreCase("resend"))
            || (resendApiKey != null && !resendApiKey.isBlank());
    boolean useTls =
        "true".equalsIgnoreCase(System.getenv().getOrDefault("SMTP_USE_TLS", "true"));
    boolean useSsl =
        "true".equalsIgnoreCase(System.getenv().getOrDefault("SMTP_USE_SSL", "false"));

    if (useResend) {
      boolean sent = sendViaResend(resendApiKey, resendFrom, to, subject, body);
      if (sent) {
        return;
      }
    }

    if (host == null || host.isBlank()) {
      log.info("[email] SMTP not configured. to={} subject={}", to, subject);
      return;
    }
    if (from == null || from.isBlank()) {
      log.warn("[email] SMTP_FROM missing. to={} subject={}", to, subject);
      return;
    }
    try {
      Properties props = new Properties();
      props.put("mail.smtp.host", host);
      props.put("mail.smtp.port", port);
      props.put("mail.smtp.auth", username != null && !username.isBlank());
      props.put("mail.smtp.starttls.enable", String.valueOf(useTls));
      props.put("mail.smtp.ssl.enable", String.valueOf(useSsl));
      props.put("mail.smtp.connectiontimeout", "10000");
      props.put("mail.smtp.timeout", "10000");

      Session session =
          Session.getInstance(
              props,
              username != null && !username.isBlank()
                  ? new Authenticator() {
                    @Override
                    protected PasswordAuthentication getPasswordAuthentication() {
                      return new PasswordAuthentication(username, password);
                    }
                  }
                  : null);
      MimeMessage message = new MimeMessage(session);
      message.setFrom(new InternetAddress(from));
      for (String address : to) {
        if (address != null && !address.isBlank()) {
          message.addRecipient(Message.RecipientType.TO, new InternetAddress(address));
        }
      }
      message.setSubject(subject, StandardCharsets.UTF_8.name());
      message.setText(body, StandardCharsets.UTF_8.name());
      Transport.send(message);
    } catch (MessagingException ex) {
      log.warn("[email] Failed to send email to={} subject={} error={}", to, subject, ex.getMessage());
    }
  }

  private String unquote(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    if ((trimmed.startsWith("\"") && trimmed.endsWith("\""))
        || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.substring(1, trimmed.length() - 1).trim();
    }
    return trimmed;
  }

  private boolean sendViaResend(
      String apiKey, String from, List<String> to, String subject, String body) {
    if (apiKey == null || apiKey.isBlank()) {
      log.warn("[email] RESEND_API_KEY missing. to={} subject={}", to, subject);
      return false;
    }
    if (from == null || from.isBlank()) {
      log.warn("[email] RESEND_FROM missing. to={} subject={}", to, subject);
      return false;
    }
    if (to == null || to.isEmpty()) {
      log.warn("[email] Resend recipients missing. subject={}", subject);
      return false;
    }
    List<String> recipients = to.stream().filter(v -> v != null && !v.isBlank()).toList();
    if (recipients.isEmpty()) {
      log.warn("[email] Resend recipients missing. subject={}", subject);
      return false;
    }
    try {
      String payload = buildResendPayload(from, recipients, subject, body);
      HttpRequest request =
          HttpRequest.newBuilder(URI.create("https://api.resend.com/emails"))
              .header("Authorization", "Bearer " + apiKey)
              .header("Content-Type", "application/json")
              .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
              .build();
      HttpClient client = HttpClient.newHttpClient();
      HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() >= 200 && response.statusCode() < 300) {
        return true;
      }
      log.warn("[email] Resend error status={} body={}", response.statusCode(), truncate(response.body(), 300));
      return false;
    } catch (Exception ex) {
      log.warn("[email] Resend send failed to={} subject={} error={}", to, subject, ex.getMessage());
      return false;
    }
  }

  private String buildResendPayload(
      String from, List<String> to, String subject, String body) {
    StringBuilder sb = new StringBuilder();
    sb.append("{\"from\":\"").append(jsonEscape(from)).append("\",\"to\":[");
    for (int i = 0; i < to.size(); i++) {
      if (i > 0) {
        sb.append(",");
      }
      sb.append("\"").append(jsonEscape(to.get(i))).append("\"");
    }
    sb.append("],\"subject\":\"").append(jsonEscape(subject)).append("\",\"text\":\"");
    sb.append(jsonEscape(body)).append("\"}");
    return sb.toString();
  }

  private String truncate(String value, int max) {
    if (value == null) {
      return null;
    }
    if (value.length() <= max) {
      return value;
    }
    return value.substring(0, max);
  }

  private String jsonEscape(String value) {
    if (value == null) {
      return "";
    }
    return value
        .replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\n", "\\n")
        .replace("\r", "\\r");
  }

  public void sendSubscriptionPaymentEmail(
      String to, String paymentUrl, String tenantName, double amountEur) {
    String subject = "Confirmación de suscripción";
    String body =
        "Hola,\n\n"
            + "Tu suscripción para "
            + tenantName
            + " está pendiente de confirmación.\n"
            + "Importe: "
            + amountEur
            + " EUR\n\n"
            + "Confirma el pago en: "
            + paymentUrl
            + "\n";
    sendGeneric(java.util.List.of(to), subject, body);
  }
}
