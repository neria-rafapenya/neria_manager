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
@Table(name = "clinic_settings")
public class ClinicSettings {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(length = 180)
  private String name;

  @Column(length = 180)
  private String legalName;

  @Column(length = 120)
  private String email;

  @Column(length = 80)
  private String phone;

  @Column(length = 255)
  private String address;

  @Column(length = 80)
  private String timezone;

  @Column(length = 180)
  private String website;

  @Column(columnDefinition = "text")
  private String emergencyDisclaimer;

  @Column(columnDefinition = "text")
  private String privacyNotice;

  @Column(columnDefinition = "json")
  private String openingHours;

  @Column(columnDefinition = "json")
  private String channels;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
