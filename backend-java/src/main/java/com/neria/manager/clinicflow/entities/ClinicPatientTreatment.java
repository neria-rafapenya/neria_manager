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
@Table(name = "clinic_patient_treatments")
public class ClinicPatientTreatment {
  @Id
  @Column(length = 36)
  private String id;

  @Column(nullable = false, length = 36)
  private String tenantId;

  @Column(nullable = false, length = 36)
  private String patientUserId;

  @Column(length = 180)
  private String name;

  @Column(length = 32)
  private String status;

  @Column(length = 180)
  private String nextStep;

  @Column(columnDefinition = "TEXT")
  private String notes;

  @Column(name = "startedAt")
  private LocalDateTime startedAt;

  @Column(name = "completedAt")
  private LocalDateTime completedAt;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
