package com.neria.manager.clinicflow.services;

import com.neria.manager.clinicflow.entities.ClinicPatientAppointment;
import com.neria.manager.clinicflow.entities.ClinicPatientDocument;
import com.neria.manager.clinicflow.entities.ClinicPatientInteraction;
import com.neria.manager.clinicflow.entities.ClinicPatientTreatment;
import com.neria.manager.clinicflow.repos.ClinicPatientAppointmentRepository;
import com.neria.manager.clinicflow.repos.ClinicPatientDocumentRepository;
import com.neria.manager.clinicflow.repos.ClinicPatientInteractionRepository;
import com.neria.manager.clinicflow.repos.ClinicPatientTreatmentRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ClinicPatientService {
  private final ClinicPatientInteractionRepository interactionRepository;
  private final ClinicPatientAppointmentRepository appointmentRepository;
  private final ClinicPatientDocumentRepository documentRepository;
  private final ClinicPatientTreatmentRepository treatmentRepository;

  public ClinicPatientService(
      ClinicPatientInteractionRepository interactionRepository,
      ClinicPatientAppointmentRepository appointmentRepository,
      ClinicPatientDocumentRepository documentRepository,
      ClinicPatientTreatmentRepository treatmentRepository) {
    this.interactionRepository = interactionRepository;
    this.appointmentRepository = appointmentRepository;
    this.documentRepository = documentRepository;
    this.treatmentRepository = treatmentRepository;
  }

  public List<ClinicPatientInteraction> listInteractions(String tenantId, String patientUserId) {
    return interactionRepository.findAllByTenantIdAndPatientUserIdOrderByCreatedAtDesc(
        tenantId, patientUserId);
  }

  public ClinicPatientInteraction createInteraction(
      String tenantId, String patientUserId, InteractionRequest dto) {
    if (dto == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing payload");
    }
    ClinicPatientInteraction interaction = new ClinicPatientInteraction();
    interaction.setId(UUID.randomUUID().toString());
    interaction.setTenantId(tenantId);
    interaction.setPatientUserId(patientUserId);
    interaction.setTitle(dto.title);
    interaction.setType(dto.type != null ? dto.type : "note");
    interaction.setStatus(dto.status != null ? dto.status : "open");
    interaction.setSummary(dto.summary);
    interaction.setMetadata(dto.metadata);
    interaction.setCreatedAt(LocalDateTime.now());
    interaction.setUpdatedAt(LocalDateTime.now());
    return interactionRepository.save(interaction);
  }

  public List<ClinicPatientAppointment> listAppointments(String tenantId, String patientUserId) {
    return appointmentRepository.findAllByTenantIdAndPatientUserIdOrderByScheduledAtDesc(
        tenantId, patientUserId);
  }

  public List<ClinicPatientAppointment> listAppointmentsAll(String tenantId) {
    return appointmentRepository.findAllByTenantId(tenantId);
  }

  public ClinicPatientAppointment createAppointment(
      String tenantId, AppointmentRequest dto) {
    if (dto == null || dto.patientUserId == null || dto.patientUserId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing patient");
    }
    ClinicPatientAppointment appt = new ClinicPatientAppointment();
    appt.setId(UUID.randomUUID().toString());
    appt.setTenantId(tenantId);
    appt.setPatientUserId(dto.patientUserId);
    applyAppointment(appt, dto);
    appt.setCreatedAt(LocalDateTime.now());
    appt.setUpdatedAt(LocalDateTime.now());
    return appointmentRepository.save(appt);
  }

  public ClinicPatientAppointment updateAppointment(
      String tenantId, String id, AppointmentRequest dto) {
    ClinicPatientAppointment appt = appointmentRepository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));
    applyAppointment(appt, dto);
    appt.setUpdatedAt(LocalDateTime.now());
    return appointmentRepository.save(appt);
  }

  public void deleteAppointment(String tenantId, String id) {
    ClinicPatientAppointment appt = appointmentRepository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));
    appointmentRepository.delete(appt);
  }

  public List<ClinicPatientDocument> listDocuments(String tenantId, String patientUserId) {
    return documentRepository.findAllByTenantIdAndPatientUserIdOrderByCreatedAtDesc(
        tenantId, patientUserId);
  }

  public List<ClinicPatientDocument> listDocumentsAll(String tenantId) {
    return documentRepository.findAllByTenantId(tenantId);
  }

  public ClinicPatientDocument createDocument(String tenantId, DocumentRequest dto) {
    if (dto == null || dto.patientUserId == null || dto.patientUserId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing patient");
    }
    ClinicPatientDocument doc = new ClinicPatientDocument();
    doc.setId(UUID.randomUUID().toString());
    doc.setTenantId(tenantId);
    doc.setPatientUserId(dto.patientUserId);
    applyDocument(doc, dto);
    doc.setCreatedAt(LocalDateTime.now());
    doc.setUpdatedAt(LocalDateTime.now());
    return documentRepository.save(doc);
  }

  public ClinicPatientDocument updateDocument(String tenantId, String id, DocumentRequest dto) {
    ClinicPatientDocument doc = documentRepository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));
    applyDocument(doc, dto);
    doc.setUpdatedAt(LocalDateTime.now());
    return documentRepository.save(doc);
  }

  public void deleteDocument(String tenantId, String id) {
    ClinicPatientDocument doc = documentRepository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));
    documentRepository.delete(doc);
  }

  public List<ClinicPatientTreatment> listTreatments(String tenantId, String patientUserId) {
    return treatmentRepository.findAllByTenantIdAndPatientUserIdOrderByCreatedAtDesc(
        tenantId, patientUserId);
  }

  public List<ClinicPatientTreatment> listTreatmentsAll(String tenantId) {
    return treatmentRepository.findAllByTenantId(tenantId);
  }

  public ClinicPatientTreatment createTreatment(String tenantId, TreatmentRequest dto) {
    if (dto == null || dto.patientUserId == null || dto.patientUserId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing patient");
    }
    ClinicPatientTreatment treatment = new ClinicPatientTreatment();
    treatment.setId(UUID.randomUUID().toString());
    treatment.setTenantId(tenantId);
    treatment.setPatientUserId(dto.patientUserId);
    applyTreatment(treatment, dto);
    treatment.setCreatedAt(LocalDateTime.now());
    treatment.setUpdatedAt(LocalDateTime.now());
    return treatmentRepository.save(treatment);
  }

  public ClinicPatientTreatment updateTreatment(String tenantId, String id, TreatmentRequest dto) {
    ClinicPatientTreatment treatment = treatmentRepository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Treatment not found"));
    applyTreatment(treatment, dto);
    treatment.setUpdatedAt(LocalDateTime.now());
    return treatmentRepository.save(treatment);
  }

  public void deleteTreatment(String tenantId, String id) {
    ClinicPatientTreatment treatment = treatmentRepository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Treatment not found"));
    treatmentRepository.delete(treatment);
  }

  private void applyAppointment(ClinicPatientAppointment appt, AppointmentRequest dto) {
    if (dto == null) return;
    appt.setTitle(dto.title);
    appt.setPractitionerName(dto.practitionerName);
    appt.setLocation(dto.location);
    appt.setScheduledAt(dto.scheduledAt);
    appt.setDurationMin(dto.durationMin);
    appt.setStatus(dto.status != null ? dto.status : appt.getStatus());
    appt.setNotes(dto.notes);
  }

  private void applyDocument(ClinicPatientDocument doc, DocumentRequest dto) {
    if (dto == null) return;
    doc.setTitle(dto.title);
    doc.setCategory(dto.category);
    doc.setUrl(dto.url);
    doc.setStatus(dto.status);
  }

  private void applyTreatment(ClinicPatientTreatment treatment, TreatmentRequest dto) {
    if (dto == null) return;
    treatment.setName(dto.name);
    treatment.setStatus(dto.status);
    treatment.setNextStep(dto.nextStep);
    treatment.setNotes(dto.notes);
    treatment.setStartedAt(dto.startedAt);
    treatment.setCompletedAt(dto.completedAt);
  }

  public static class InteractionRequest {
    public String patientUserId;
    public String title;
    public String type;
    public String status;
    public String summary;
    public String metadata;
  }

  public static class AppointmentRequest {
    public String patientUserId;
    public String title;
    public String practitionerName;
    public String location;
    public LocalDateTime scheduledAt;
    public Integer durationMin;
    public String status;
    public String notes;
  }

  public static class DocumentRequest {
    public String patientUserId;
    public String title;
    public String category;
    public String url;
    public String status;
  }

  public static class TreatmentRequest {
    public String patientUserId;
    public String name;
    public String status;
    public String nextStep;
    public String notes;
    public LocalDateTime startedAt;
    public LocalDateTime completedAt;
  }
}
