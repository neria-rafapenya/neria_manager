package com.neria.manager.common.services;

import jakarta.mail.Authenticator;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
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
    String host = System.getenv("SMTP_HOST");
    String port = System.getenv().getOrDefault("SMTP_PORT", "587");
    String username = System.getenv("SMTP_USERNAME");
    String password = System.getenv("SMTP_PASSWORD");
    String from = System.getenv().getOrDefault("SMTP_FROM", username);
    boolean useTls =
        "true".equalsIgnoreCase(System.getenv().getOrDefault("SMTP_USE_TLS", "true"));
    boolean useSsl =
        "true".equalsIgnoreCase(System.getenv().getOrDefault("SMTP_USE_SSL", "false"));

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
