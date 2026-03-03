package com.neria.manager.clinicflow.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "clinic_services")
public class ClinicService {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(length = 80)
  private String code;

  @Column(length = 180, nullable = false)
  private String name;

  @Column(length = 120)
  private String specialty;

  @Column(name = "durationMin")
  private Integer durationMin;

  @Column(name = "priceMin", precision = 10, scale = 2)
  private BigDecimal priceMin;

  @Column(name = "priceMax", precision = 10, scale = 2)
  private BigDecimal priceMax;

  @Column(columnDefinition = "text")
  private String prepNotes;

  @Column(name = "isActive")
  private boolean active = true;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
