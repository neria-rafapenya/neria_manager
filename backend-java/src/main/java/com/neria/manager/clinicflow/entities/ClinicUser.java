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
@Table(name = "clinic_users")
public class ClinicUser {
  @Id
  @Column(length = 36)
  private String id;

  @Column(nullable = false, length = 36)
  private String tenantId;

  @Column(length = 160, nullable = false)
  private String email;

  @Column(length = 120)
  private String name;

  @Column(length = 32, nullable = false)
  private String role;

  @Column(length = 16, nullable = false)
  private String status;

  @Column(name = "passwordHash", length = 255)
  private String passwordHash;

  @Column(name = "mustChangePassword", nullable = false)
  private boolean mustChangePassword;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
