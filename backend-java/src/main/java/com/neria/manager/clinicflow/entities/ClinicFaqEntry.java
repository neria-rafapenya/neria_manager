package com.neria.manager.clinicflow.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "clinic_faq_entries")
public class ClinicFaqEntry {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(length = 255, nullable = false)
  private String question;

  @Column(columnDefinition = "text")
  private String answer;

  @Column(length = 120)
  private String category;

  @Column(name = "priority")
  private Integer priority;

  @Column(name = "isActive")
  private boolean active = true;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
