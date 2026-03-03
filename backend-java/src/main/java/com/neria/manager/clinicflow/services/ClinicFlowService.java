package com.neria.manager.clinicflow.services;

import com.neria.manager.clinicflow.entities.ClinicFaqEntry;
import com.neria.manager.clinicflow.entities.ClinicProtocol;
import com.neria.manager.clinicflow.entities.ClinicReportTemplate;
import com.neria.manager.clinicflow.entities.ClinicService;
import com.neria.manager.clinicflow.entities.ClinicSettings;
import com.neria.manager.clinicflow.entities.ClinicTriageFlow;
import com.neria.manager.clinicflow.repos.ClinicFaqEntryRepository;
import com.neria.manager.clinicflow.repos.ClinicProtocolRepository;
import com.neria.manager.clinicflow.repos.ClinicReportTemplateRepository;
import com.neria.manager.clinicflow.repos.ClinicServiceRepository;
import com.neria.manager.clinicflow.repos.ClinicSettingsRepository;
import com.neria.manager.clinicflow.repos.ClinicTriageFlowRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ClinicFlowService {
  private final ClinicSettingsRepository settingsRepository;
  private final ClinicServiceRepository serviceRepository;
  private final ClinicProtocolRepository protocolRepository;
  private final ClinicFaqEntryRepository faqRepository;
  private final ClinicTriageFlowRepository triageRepository;
  private final ClinicReportTemplateRepository reportRepository;

  public ClinicFlowService(
      ClinicSettingsRepository settingsRepository,
      ClinicServiceRepository serviceRepository,
      ClinicProtocolRepository protocolRepository,
      ClinicFaqEntryRepository faqRepository,
      ClinicTriageFlowRepository triageRepository,
      ClinicReportTemplateRepository reportRepository) {
    this.settingsRepository = settingsRepository;
    this.serviceRepository = serviceRepository;
    this.protocolRepository = protocolRepository;
    this.faqRepository = faqRepository;
    this.triageRepository = triageRepository;
    this.reportRepository = reportRepository;
  }

  public ClinicSettingsResponse getSettings(String tenantId) {
    Optional<ClinicSettings> stored = settingsRepository.findByTenantId(tenantId);
    if (stored.isEmpty()) {
      ClinicSettingsResponse empty = new ClinicSettingsResponse();
      empty.tenantId = tenantId;
      return empty;
    }
    return ClinicSettingsResponse.fromEntity(stored.get());
  }

  public ClinicSettingsResponse upsertSettings(String tenantId, ClinicSettingsRequest request) {
    ClinicSettings entity = settingsRepository.findByTenantId(tenantId)
        .orElseGet(() -> {
          ClinicSettings created = new ClinicSettings();
          created.setId(UUID.randomUUID().toString());
          created.setTenantId(tenantId);
          created.setCreatedAt(LocalDateTime.now());
          return created;
        });

    entity.setName(request.name);
    entity.setLegalName(request.legalName);
    entity.setEmail(request.email);
    entity.setPhone(request.phone);
    entity.setAddress(request.address);
    entity.setTimezone(request.timezone);
    entity.setWebsite(request.website);
    entity.setEmergencyDisclaimer(request.emergencyDisclaimer);
    entity.setPrivacyNotice(request.privacyNotice);
    entity.setOpeningHours(request.openingHours);
    entity.setChannels(request.channels);
    entity.setUpdatedAt(LocalDateTime.now());

    ClinicSettings saved = settingsRepository.save(entity);
    return ClinicSettingsResponse.fromEntity(saved);
  }

  public List<ClinicServiceResponse> listServices(String tenantId) {
    return serviceRepository.findAllByTenantId(tenantId).stream()
        .map(ClinicServiceResponse::fromEntity)
        .collect(Collectors.toList());
  }

  public ClinicServiceResponse createService(String tenantId, ClinicServiceRequest request) {
    ClinicService entity = new ClinicService();
    entity.setId(UUID.randomUUID().toString());
    entity.setTenantId(tenantId);
    applyServiceRequest(entity, request);
    entity.setCreatedAt(LocalDateTime.now());
    entity.setUpdatedAt(LocalDateTime.now());
    return ClinicServiceResponse.fromEntity(serviceRepository.save(entity));
  }

  public ClinicServiceResponse updateService(String tenantId, String id, ClinicServiceRequest request) {
    ClinicService entity = serviceRepository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service not found"));
    applyServiceRequest(entity, request);
    entity.setUpdatedAt(LocalDateTime.now());
    return ClinicServiceResponse.fromEntity(serviceRepository.save(entity));
  }

  public void deleteService(String tenantId, String id) {
    ClinicService entity = serviceRepository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service not found"));
    serviceRepository.delete(entity);
  }

  public List<ClinicProtocolResponse> listProtocols(String tenantId) {
    return protocolRepository.findAllByTenantId(tenantId).stream()
        .map(ClinicProtocolResponse::fromEntity)
        .collect(Collectors.toList());
  }

  public ClinicProtocolResponse createProtocol(String tenantId, ClinicProtocolRequest request) {
    ClinicProtocol entity = new ClinicProtocol();
    entity.setId(UUID.randomUUID().toString());
    entity.setTenantId(tenantId);
    applyProtocolRequest(entity, request);
    entity.setCreatedAt(LocalDateTime.now());
    entity.setUpdatedAt(LocalDateTime.now());
    return ClinicProtocolResponse.fromEntity(protocolRepository.save(entity));
  }

  public ClinicProtocolResponse updateProtocol(String tenantId, String id, ClinicProtocolRequest request) {
    ClinicProtocol entity = protocolRepository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Protocol not found"));
    applyProtocolRequest(entity, request);
    entity.setUpdatedAt(LocalDateTime.now());
    return ClinicProtocolResponse.fromEntity(protocolRepository.save(entity));
  }

  public void deleteProtocol(String tenantId, String id) {
    ClinicProtocol entity = protocolRepository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Protocol not found"));
    protocolRepository.delete(entity);
  }

  public List<ClinicFaqResponse> listFaq(String tenantId) {
    return faqRepository.findAllByTenantId(tenantId).stream()
        .map(ClinicFaqResponse::fromEntity)
        .collect(Collectors.toList());
  }

  public ClinicFaqResponse createFaq(String tenantId, ClinicFaqRequest request) {
    ClinicFaqEntry entity = new ClinicFaqEntry();
    entity.setId(UUID.randomUUID().toString());
    entity.setTenantId(tenantId);
    applyFaqRequest(entity, request);
    entity.setCreatedAt(LocalDateTime.now());
    entity.setUpdatedAt(LocalDateTime.now());
    return ClinicFaqResponse.fromEntity(faqRepository.save(entity));
  }

  public ClinicFaqResponse updateFaq(String tenantId, String id, ClinicFaqRequest request) {
    ClinicFaqEntry entity = faqRepository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "FAQ not found"));
    applyFaqRequest(entity, request);
    entity.setUpdatedAt(LocalDateTime.now());
    return ClinicFaqResponse.fromEntity(faqRepository.save(entity));
  }

  public void deleteFaq(String tenantId, String id) {
    ClinicFaqEntry entity = faqRepository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "FAQ not found"));
    faqRepository.delete(entity);
  }

  public List<ClinicTriageFlowResponse> listTriageFlows(String tenantId) {
    return triageRepository.findAllByTenantId(tenantId).stream()
        .map(ClinicTriageFlowResponse::fromEntity)
        .collect(Collectors.toList());
  }

  public ClinicTriageFlowResponse createTriageFlow(String tenantId, ClinicTriageFlowRequest request) {
    ClinicTriageFlow entity = new ClinicTriageFlow();
    entity.setId(UUID.randomUUID().toString());
    entity.setTenantId(tenantId);
    applyTriageRequest(entity, request);
    entity.setCreatedAt(LocalDateTime.now());
    entity.setUpdatedAt(LocalDateTime.now());
    return ClinicTriageFlowResponse.fromEntity(triageRepository.save(entity));
  }

  public ClinicTriageFlowResponse updateTriageFlow(String tenantId, String id, ClinicTriageFlowRequest request) {
    ClinicTriageFlow entity = triageRepository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Triage flow not found"));
    applyTriageRequest(entity, request);
    entity.setUpdatedAt(LocalDateTime.now());
    return ClinicTriageFlowResponse.fromEntity(triageRepository.save(entity));
  }

  public void deleteTriageFlow(String tenantId, String id) {
    ClinicTriageFlow entity = triageRepository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Triage flow not found"));
    triageRepository.delete(entity);
  }

  public List<ClinicReportTemplateResponse> listReportTemplates(String tenantId) {
    return reportRepository.findAllByTenantId(tenantId).stream()
        .map(ClinicReportTemplateResponse::fromEntity)
        .collect(Collectors.toList());
  }

  public ClinicReportTemplateResponse createReportTemplate(String tenantId, ClinicReportTemplateRequest request) {
    ClinicReportTemplate entity = new ClinicReportTemplate();
    entity.setId(UUID.randomUUID().toString());
    entity.setTenantId(tenantId);
    applyReportRequest(entity, request);
    entity.setCreatedAt(LocalDateTime.now());
    entity.setUpdatedAt(LocalDateTime.now());
    return ClinicReportTemplateResponse.fromEntity(reportRepository.save(entity));
  }

  public ClinicReportTemplateResponse updateReportTemplate(String tenantId, String id, ClinicReportTemplateRequest request) {
    ClinicReportTemplate entity = reportRepository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report template not found"));
    applyReportRequest(entity, request);
    entity.setUpdatedAt(LocalDateTime.now());
    return ClinicReportTemplateResponse.fromEntity(reportRepository.save(entity));
  }

  public void deleteReportTemplate(String tenantId, String id) {
    ClinicReportTemplate entity = reportRepository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report template not found"));
    reportRepository.delete(entity);
  }

  private void applyServiceRequest(ClinicService entity, ClinicServiceRequest request) {
    entity.setCode(request.code);
    entity.setName(request.name);
    entity.setSpecialty(request.specialty);
    entity.setDurationMin(request.durationMin);
    entity.setPriceMin(request.priceMin);
    entity.setPriceMax(request.priceMax);
    entity.setPrepNotes(request.prepNotes);
    entity.setActive(request.active == null || request.active);
  }

  private void applyProtocolRequest(ClinicProtocol entity, ClinicProtocolRequest request) {
    entity.setTitle(request.title);
    entity.setVersion(request.version);
    entity.setStatus(request.status);
    entity.setSummary(request.summary);
    entity.setContent(request.content);
    entity.setApprovedBy(request.approvedBy);
    entity.setApprovedAt(request.approvedAt);
  }

  private void applyFaqRequest(ClinicFaqEntry entity, ClinicFaqRequest request) {
    entity.setQuestion(request.question);
    entity.setAnswer(request.answer);
    entity.setCategory(request.category);
    entity.setPriority(request.priority);
    entity.setActive(request.active == null || request.active);
  }

  private void applyTriageRequest(ClinicTriageFlow entity, ClinicTriageFlowRequest request) {
    entity.setName(request.name);
    entity.setDescription(request.description);
    entity.setStatus(request.status);
    entity.setOutcome(request.outcome);
    entity.setSteps(request.steps);
  }

  private void applyReportRequest(ClinicReportTemplate entity, ClinicReportTemplateRequest request) {
    entity.setName(request.name);
    entity.setSpecialty(request.specialty);
    entity.setStatus(request.status);
    entity.setTemplate(request.template);
  }

  public static class ClinicSettingsRequest {
    public String name;
    public String legalName;
    public String email;
    public String phone;
    public String address;
    public String timezone;
    public String website;
    public String emergencyDisclaimer;
    public String privacyNotice;
    public String openingHours;
    public String channels;
  }

  public static class ClinicSettingsResponse extends ClinicSettingsRequest {
    public String id;
    public String tenantId;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    public static ClinicSettingsResponse fromEntity(ClinicSettings entity) {
      ClinicSettingsResponse response = new ClinicSettingsResponse();
      response.id = entity.getId();
      response.tenantId = entity.getTenantId();
      response.name = entity.getName();
      response.legalName = entity.getLegalName();
      response.email = entity.getEmail();
      response.phone = entity.getPhone();
      response.address = entity.getAddress();
      response.timezone = entity.getTimezone();
      response.website = entity.getWebsite();
      response.emergencyDisclaimer = entity.getEmergencyDisclaimer();
      response.privacyNotice = entity.getPrivacyNotice();
      response.openingHours = entity.getOpeningHours();
      response.channels = entity.getChannels();
      response.createdAt = entity.getCreatedAt();
      response.updatedAt = entity.getUpdatedAt();
      return response;
    }
  }

  public static class ClinicServiceRequest {
    public String code;
    public String name;
    public String specialty;
    public Integer durationMin;
    public BigDecimal priceMin;
    public BigDecimal priceMax;
    public String prepNotes;
    public Boolean active;
  }

  public static class ClinicServiceResponse extends ClinicServiceRequest {
    public String id;
    public String tenantId;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    public static ClinicServiceResponse fromEntity(ClinicService entity) {
      ClinicServiceResponse response = new ClinicServiceResponse();
      response.id = entity.getId();
      response.tenantId = entity.getTenantId();
      response.code = entity.getCode();
      response.name = entity.getName();
      response.specialty = entity.getSpecialty();
      response.durationMin = entity.getDurationMin();
      response.priceMin = entity.getPriceMin();
      response.priceMax = entity.getPriceMax();
      response.prepNotes = entity.getPrepNotes();
      response.active = entity.isActive();
      response.createdAt = entity.getCreatedAt();
      response.updatedAt = entity.getUpdatedAt();
      return response;
    }
  }

  public static class ClinicProtocolRequest {
    public String title;
    public String version;
    public String status;
    public String summary;
    public String content;
    public String approvedBy;
    public LocalDateTime approvedAt;
  }

  public static class ClinicProtocolResponse extends ClinicProtocolRequest {
    public String id;
    public String tenantId;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    public static ClinicProtocolResponse fromEntity(ClinicProtocol entity) {
      ClinicProtocolResponse response = new ClinicProtocolResponse();
      response.id = entity.getId();
      response.tenantId = entity.getTenantId();
      response.title = entity.getTitle();
      response.version = entity.getVersion();
      response.status = entity.getStatus();
      response.summary = entity.getSummary();
      response.content = entity.getContent();
      response.approvedBy = entity.getApprovedBy();
      response.approvedAt = entity.getApprovedAt();
      response.createdAt = entity.getCreatedAt();
      response.updatedAt = entity.getUpdatedAt();
      return response;
    }
  }

  public static class ClinicFaqRequest {
    public String question;
    public String answer;
    public String category;
    public Integer priority;
    public Boolean active;
  }

  public static class ClinicFaqResponse extends ClinicFaqRequest {
    public String id;
    public String tenantId;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    public static ClinicFaqResponse fromEntity(ClinicFaqEntry entity) {
      ClinicFaqResponse response = new ClinicFaqResponse();
      response.id = entity.getId();
      response.tenantId = entity.getTenantId();
      response.question = entity.getQuestion();
      response.answer = entity.getAnswer();
      response.category = entity.getCategory();
      response.priority = entity.getPriority();
      response.active = entity.isActive();
      response.createdAt = entity.getCreatedAt();
      response.updatedAt = entity.getUpdatedAt();
      return response;
    }
  }

  public static class ClinicTriageFlowRequest {
    public String name;
    public String description;
    public String status;
    public String outcome;
    public String steps;
  }

  public static class ClinicTriageFlowResponse extends ClinicTriageFlowRequest {
    public String id;
    public String tenantId;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    public static ClinicTriageFlowResponse fromEntity(ClinicTriageFlow entity) {
      ClinicTriageFlowResponse response = new ClinicTriageFlowResponse();
      response.id = entity.getId();
      response.tenantId = entity.getTenantId();
      response.name = entity.getName();
      response.description = entity.getDescription();
      response.status = entity.getStatus();
      response.outcome = entity.getOutcome();
      response.steps = entity.getSteps();
      response.createdAt = entity.getCreatedAt();
      response.updatedAt = entity.getUpdatedAt();
      return response;
    }
  }

  public static class ClinicReportTemplateRequest {
    public String name;
    public String specialty;
    public String status;
    public String template;
  }

  public static class ClinicReportTemplateResponse extends ClinicReportTemplateRequest {
    public String id;
    public String tenantId;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    public static ClinicReportTemplateResponse fromEntity(ClinicReportTemplate entity) {
      ClinicReportTemplateResponse response = new ClinicReportTemplateResponse();
      response.id = entity.getId();
      response.tenantId = entity.getTenantId();
      response.name = entity.getName();
      response.specialty = entity.getSpecialty();
      response.status = entity.getStatus();
      response.template = entity.getTemplate();
      response.createdAt = entity.getCreatedAt();
      response.updatedAt = entity.getUpdatedAt();
      return response;
    }
  }
}
