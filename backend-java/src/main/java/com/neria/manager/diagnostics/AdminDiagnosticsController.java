package com.neria.manager.diagnostics;

import com.neria.manager.common.security.AuthContext;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/admin/diagnostics")
public class AdminDiagnosticsController {

  @GetMapping("/tesseract")
  public Map<String, Object> tesseractDiagnostics(HttpServletRequest request) {
    requireAdmin(request);

    Map<String, Object> out = new LinkedHashMap<>();
    out.put("tessdataPrefixEnv", System.getenv("TESSDATA_PREFIX"));
    out.put("tesseractLangEnv", System.getenv("TESSERACT_LANG"));

    out.put("which", runCommand("which", "tesseract"));
    out.put("version", runCommand("tesseract", "--version"));
    out.put("printTessdataDir", runCommand("tesseract", "--print-tessdata-dir"));
    out.put("listLangs", runCommand("tesseract", "--list-langs"));

    List<String> candidates =
        List.of(
            "/usr/share/tesseract-ocr/5/tessdata",
            "/usr/share/tesseract-ocr/4.00/tessdata",
            "/usr/share/tesseract-ocr/tessdata",
            "/usr/share/tessdata",
            "/opt/homebrew/share/tessdata");
    Map<String, Object> paths = new LinkedHashMap<>();
    for (String candidate : candidates) {
      paths.put(candidate, Files.isDirectory(Path.of(candidate)));
    }
    out.put("candidatePaths", paths);

    return out;
  }

  private AuthContext requireAdmin(HttpServletRequest request) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }
    if (auth.getRole() == null || !auth.getRole().equals("admin")) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required");
    }
    return auth;
  }

  private Map<String, Object> runCommand(String... command) {
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("command", String.join(" ", command));
    try {
      Process process = new ProcessBuilder(command).redirectErrorStream(true).start();
      byte[] bytes = process.getInputStream().readAllBytes();
      int code = process.waitFor();
      result.put("exitCode", code);
      result.put("output", new String(bytes, StandardCharsets.UTF_8));
    } catch (IOException | InterruptedException ex) {
      result.put("error", ex.getClass().getSimpleName() + ": " + ex.getMessage());
    }
    return result;
  }
}
