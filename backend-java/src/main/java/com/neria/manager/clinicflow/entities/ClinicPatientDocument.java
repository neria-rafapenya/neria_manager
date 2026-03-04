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
@Table(name = "clinic_patient_documents")
public class ClinicPatientDocument {
  @Id
  @Column(length = 36)
  private String id;

  @Column(nullable = false, length = 36)
  private String tenantId;

  @Column(nullable = false, length = 36)
  private String patientUserId;

  @Column(length = 180)
  private String title;

  @Column(length = 120)
  private String category;

  @Column(length = 512)
  private String url;

  @Column(length = 32)
  private String status;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
