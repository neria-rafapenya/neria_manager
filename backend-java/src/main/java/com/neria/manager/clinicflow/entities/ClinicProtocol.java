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
@Table(name = "clinic_protocols")
public class ClinicProtocol {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(length = 180, nullable = false)
  private String title;

  @Column(length = 32)
  private String version;

  @Column(length = 32)
  private String status;

  @Column(length = 255)
  private String summary;

  @Column(columnDefinition = "text")
  private String content;

  @Column(length = 120)
  private String approvedBy;

  @Column(name = "approvedAt")
  private LocalDateTime approvedAt;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
