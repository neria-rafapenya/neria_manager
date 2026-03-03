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
@Table(name = "clinic_triage_flows")
public class ClinicTriageFlow {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(length = 180, nullable = false)
  private String name;

  @Column(columnDefinition = "text")
  private String description;

  @Column(length = 32)
  private String status;

  @Column(length = 120)
  private String outcome;

  @Column(columnDefinition = "json")
  private String steps;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
