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
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/clinicflow/staff")
public class ClinicFlowStaffController {
  private final ClinicUserService clinicUserService;
  private final ClinicPatientService clinicPatientService;

  public ClinicFlowStaffController(
      ClinicUserService clinicUserService, ClinicPatientService clinicPatientService) {
    this.clinicUserService = clinicUserService;
    this.clinicPatientService = clinicPatientService;
  }

  @GetMapping("/patients")
  public Object listPatients(HttpServletRequest request) {
    AuthContext auth = requireStaff(request);
    return clinicUserService.listPatients(auth.getTenantId());
  }

  @GetMapping("/appointments")
  public List<ClinicPatientAppointment> listAppointments(
      HttpServletRequest request, @RequestParam(required = false) String patientUserId) {
    AuthContext auth = requireStaff(request);
    if (patientUserId == null || patientUserId.isBlank()) {
      return clinicPatientService.listAppointmentsAll(auth.getTenantId());
    }
    return clinicPatientService.listAppointments(auth.getTenantId(), patientUserId);
  }

  @PostMapping("/appointments")
  public ClinicPatientAppointment createAppointment(
      HttpServletRequest request,
      @RequestBody ClinicPatientService.AppointmentRequest dto) {
    AuthContext auth = requireStaff(request);
    requireAppointmentManager(auth);
    return clinicPatientService.createAppointment(auth.getTenantId(), dto);
  }

  @PatchMapping("/appointments/{id}")
  public ClinicPatientAppointment updateAppointment(
      HttpServletRequest request,
      @PathVariable String id,
      @RequestBody ClinicPatientService.AppointmentRequest dto) {
    AuthContext auth = requireStaff(request);
    requireAppointmentManager(auth);
    return clinicPatientService.updateAppointment(auth.getTenantId(), id, dto);
  }

  @DeleteMapping("/appointments/{id}")
  public Object deleteAppointment(HttpServletRequest request, @PathVariable String id) {
    AuthContext auth = requireStaff(request);
    requireAppointmentManager(auth);
    clinicPatientService.deleteAppointment(auth.getTenantId(), id);
    return null;
  }

  @GetMapping("/documents")
  public List<ClinicPatientDocument> listDocuments(
      HttpServletRequest request, @RequestParam(required = false) String patientUserId) {
    AuthContext auth = requireStaff(request);
    if (patientUserId == null || patientUserId.isBlank()) {
      return clinicPatientService.listDocumentsAll(auth.getTenantId());
    }
    return clinicPatientService.listDocuments(auth.getTenantId(), patientUserId);
  }

  @PostMapping("/documents")
  public ClinicPatientDocument createDocument(
      HttpServletRequest request,
      @RequestBody ClinicPatientService.DocumentRequest dto) {
    AuthContext auth = requireStaff(request);
    requireDocumentManager(auth);
    return clinicPatientService.createDocument(auth.getTenantId(), dto);
  }

  @PatchMapping("/documents/{id}")
  public ClinicPatientDocument updateDocument(
      HttpServletRequest request,
      @PathVariable String id,
      @RequestBody ClinicPatientService.DocumentRequest dto) {
    AuthContext auth = requireStaff(request);
    requireDocumentManager(auth);
    return clinicPatientService.updateDocument(auth.getTenantId(), id, dto);
  }

  @DeleteMapping("/documents/{id}")
  public Object deleteDocument(HttpServletRequest request, @PathVariable String id) {
    AuthContext auth = requireStaff(request);
    requireDocumentManager(auth);
    clinicPatientService.deleteDocument(auth.getTenantId(), id);
    return null;
  }

  @GetMapping("/treatments")
  public List<ClinicPatientTreatment> listTreatments(
      HttpServletRequest request, @RequestParam(required = false) String patientUserId) {
    AuthContext auth = requireStaff(request);
    if (patientUserId == null || patientUserId.isBlank()) {
      return clinicPatientService.listTreatmentsAll(auth.getTenantId());
    }
    return clinicPatientService.listTreatments(auth.getTenantId(), patientUserId);
  }

  @PostMapping("/treatments")
  public ClinicPatientTreatment createTreatment(
      HttpServletRequest request,
      @RequestBody ClinicPatientService.TreatmentRequest dto) {
    AuthContext auth = requireStaff(request);
    requireTreatmentManager(auth);
    return clinicPatientService.createTreatment(auth.getTenantId(), dto);
  }

  @PatchMapping("/treatments/{id}")
  public ClinicPatientTreatment updateTreatment(
      HttpServletRequest request,
      @PathVariable String id,
      @RequestBody ClinicPatientService.TreatmentRequest dto) {
    AuthContext auth = requireStaff(request);
    requireTreatmentManager(auth);
    return clinicPatientService.updateTreatment(auth.getTenantId(), id, dto);
  }

  @DeleteMapping("/treatments/{id}")
  public Object deleteTreatment(HttpServletRequest request, @PathVariable String id) {
    AuthContext auth = requireStaff(request);
    requireTreatmentManager(auth);
    clinicPatientService.deleteTreatment(auth.getTenantId(), id);
    return null;
  }

  @GetMapping("/interactions")
  public List<ClinicPatientInteraction> listInteractions(
      HttpServletRequest request, @RequestParam(required = false) String patientUserId) {
    AuthContext auth = requireStaff(request);
    if (patientUserId == null || patientUserId.isBlank()) {
      return List.of();
    }
    return clinicPatientService.listInteractions(auth.getTenantId(), patientUserId);
  }

  @PostMapping("/interactions")
  public ClinicPatientInteraction createInteraction(
      HttpServletRequest request,
      @RequestBody ClinicPatientService.InteractionRequest dto) {
    AuthContext auth = requireStaff(request);
    requireInteractionManager(auth);
    if (dto == null || dto.summary == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing interaction data");
    }
    if (dto.patientUserId == null || dto.patientUserId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing patientUserId");
    }
    if (dto.title == null) {
      dto.title = "Nota";
    }
    if (dto.type == null) {
      dto.type = "note";
    }
    if (dto.status == null) {
      dto.status = "open";
    }
    return clinicPatientService.createInteraction(auth.getTenantId(), dto.patientUserId, dto);
  }

  private AuthContext requireStaff(HttpServletRequest request) {
    AuthContext auth = AuthUtils.requireAuth(request);
    AuthUtils.requireRole(auth, "clinicflow");
    if (auth.getTenantId() == null || auth.getTenantId().isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing tenant");
    }
    String role = normalizeRole(auth.getClinicRole());
    if (role.isEmpty() || "patient".equals(role)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Staff access required");
    }
    return auth;
  }

  private void requireAppointmentManager(AuthContext auth) {
    requireRole(auth, "manager", "staff");
  }

  private void requireDocumentManager(AuthContext auth) {
    requireRole(auth, "manager", "staff");
  }

  private void requireTreatmentManager(AuthContext auth) {
    requireRole(auth, "manager");
  }

  private void requireInteractionManager(AuthContext auth) {
    requireRole(auth, "manager", "staff", "assistant");
  }

  private void requireRole(AuthContext auth, String... allowed) {
    String role = normalizeRole(auth.getClinicRole());
    for (String candidate : allowed) {
      if (candidate.equals(role)) {
        return;
      }
    }
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient clinic role");
  }

  private String normalizeRole(String role) {
    if (role == null) return "";
    String value = role.trim().toLowerCase();
    return switch (value) {
      case "gestor", "manager" -> "manager";
      case "personal", "staff" -> "staff";
      case "asistente", "assistant" -> "assistant";
      case "patient" -> "patient";
      default -> value;
    };
  }
}
