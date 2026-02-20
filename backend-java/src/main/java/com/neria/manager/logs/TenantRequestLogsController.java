package com.neria.manager.logs;

import com.neria.manager.common.security.AuthContext;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/logs")
public class TenantRequestLogsController {
  private final TenantRequestLogsService service;

  public TenantRequestLogsController(TenantRequestLogsService service) {
    this.service = service;
  }

  @GetMapping
  public List<?> list(
      HttpServletRequest request,
      @RequestParam(value = "limit", required = false) Integer limit,
      @RequestParam(value = "tenantId", required = false) String tenantId,
      @RequestParam(value = "type", required = false) String type,
      @RequestParam(value = "q", required = false) String query) {
    AuthContext auth = requireAuth(request);
    String resolvedTenant = "tenant".equals(auth.getRole()) ? auth.getTenantId() : tenantId;
    int parsed = limit == null ? 200 : Math.min(Math.max(limit, 1), 500);
    return service.list(parsed, resolvedTenant, type, query);
  }

  private AuthContext requireAuth(HttpServletRequest request) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }
    return auth;
  }
}
