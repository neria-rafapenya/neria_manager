package com.neria.manager.clinicflow.controllers;

import com.neria.manager.clinicflow.entities.ClinicPatientAppointment;
import com.neria.manager.clinicflow.entities.ClinicPatientDocument;
import com.neria.manager.clinicflow.entities.ClinicPatientInteraction;
import com.neria.manager.clinicflow.entities.ClinicPatientTreatment;
import com.neria.manager.clinicflow.services.ClinicPatientService;
import com.neria.manager.clinicflow.services.ClinicUserService;
import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/clinicflow/patient")
public class ClinicFlowPatientController {
  private final ClinicPatientService clinicPatientService;
  private final ClinicUserService clinicUserService;

  public ClinicFlowPatientController(
      ClinicPatientService clinicPatientService, ClinicUserService clinicUserService) {
    this.clinicPatientService = clinicPatientService;
    this.clinicUserService = clinicUserService;
  }

  @GetMapping("/summary")
  public Object summary(HttpServletRequest request) {
    AuthContext auth = requirePatient(request);
    var user = clinicUserService.getById(auth.getTenantId(), auth.getSub());
    List<ClinicPatientAppointment> appointments =
        clinicPatientService.listAppointments(auth.getTenantId(), auth.getSub());
    List<ClinicPatientDocument> documents =
        clinicPatientService.listDocuments(auth.getTenantId(), auth.getSub());
    List<ClinicPatientTreatment> treatments =
        clinicPatientService.listTreatments(auth.getTenantId(), auth.getSub());
    Map<String, Object> payload = new HashMap<>();
    payload.put("user", user);
    payload.put("appointments", appointments);
    payload.put("documents", documents);
    payload.put("treatments", treatments);
    payload.put("interactions", clinicPatientService.listInteractions(auth.getTenantId(), auth.getSub()));
    return payload;
  }

  @GetMapping("/appointments")
  public Object listAppointments(HttpServletRequest request) {
    AuthContext auth = requirePatient(request);
    return clinicPatientService.listAppointments(auth.getTenantId(), auth.getSub());
  }

  @GetMapping("/documents")
  public Object listDocuments(HttpServletRequest request) {
    AuthContext auth = requirePatient(request);
    return clinicPatientService.listDocuments(auth.getTenantId(), auth.getSub());
  }

  @GetMapping("/treatments")
  public Object listTreatments(HttpServletRequest request) {
    AuthContext auth = requirePatient(request);
    return clinicPatientService.listTreatments(auth.getTenantId(), auth.getSub());
  }

  @GetMapping("/interactions")
  public Object listInteractions(HttpServletRequest request) {
    AuthContext auth = requirePatient(request);
    List<Map<String, Object>> rows =
        clinicPatientService.listInteractions(auth.getTenantId(), auth.getSub()).stream()
            .map(
                item -> {
                  Map<String, Object> row = new HashMap<>();
                  row.put("id", item.getId());
                  row.put("title", item.getTitle());
                  row.put("type", item.getType());
                  row.put("status", item.getStatus());
                  row.put("summary", item.getSummary());
                  row.put("metadata", item.getMetadata());
                  row.put("createdAt", item.getCreatedAt());
                  row.put("updatedAt", item.getUpdatedAt());
                  return row;
                })
            .collect(Collectors.toList());
    return rows;
  }

  @PostMapping("/interactions")
  public Object createInteraction(
      HttpServletRequest request,
      @RequestBody ClinicPatientService.InteractionRequest dto) {
    AuthContext auth = requirePatient(request);
    return clinicPatientService.createInteraction(auth.getTenantId(), auth.getSub(), dto);
  }

  @PostMapping("/appointments/{id}/request-change")
  public Object requestChange(
      HttpServletRequest request, @PathVariable String id, @RequestBody Map<String, String> dto) {
    AuthContext auth = requirePatient(request);
    ClinicPatientService.InteractionRequest req = new ClinicPatientService.InteractionRequest();
    req.type = "appointment_change";
    req.status = "requested";
    req.title = "Solicitud de cambio de cita";
    req.summary = dto != null ? dto.getOrDefault("message", "") : "";
    req.metadata = id != null ? String.format("{\"appointmentId\":\"%s\"}", id) : null;
    return clinicPatientService.createInteraction(auth.getTenantId(), auth.getSub(), req);
  }

  @PostMapping("/appointments/{id}/request-cancel")
  public Object requestCancel(
      HttpServletRequest request, @PathVariable String id, @RequestBody Map<String, String> dto) {
    AuthContext auth = requirePatient(request);
    ClinicPatientService.InteractionRequest req = new ClinicPatientService.InteractionRequest();
    req.type = "appointment_cancel";
    req.status = "requested";
    req.title = "Solicitud de cancelación";
    req.summary = dto != null ? dto.getOrDefault("message", "") : "";
    req.metadata = id != null ? String.format("{\"appointmentId\":\"%s\"}", id) : null;
    return clinicPatientService.createInteraction(auth.getTenantId(), auth.getSub(), req);
  }

  private AuthContext requirePatient(HttpServletRequest request) {
    AuthContext auth = AuthUtils.requireAuth(request);
    AuthUtils.requireRole(auth, "clinicflow");
    if (auth.getTenantId() == null || auth.getTenantId().isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing tenant");
    }
    if (auth.getClinicRole() == null || !"patient".equalsIgnoreCase(auth.getClinicRole())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Patient access required");
    }
    return auth;
  }
}
