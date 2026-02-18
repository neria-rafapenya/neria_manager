package com.neria.manager.emailautomation;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class EmailAutomationScheduler {
  private final TenantServiceEmailService emailService;

  public EmailAutomationScheduler(TenantServiceEmailService emailService) {
    this.emailService = emailService;
  }

  @Scheduled(fixedDelayString = "${app.emailAutomation.pollIntervalMs:60000}")
  public void pollEmailAccounts() {
    emailService.pollAllEnabledAccounts();
  }
}
