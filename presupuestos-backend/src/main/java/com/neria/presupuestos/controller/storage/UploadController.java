package com.neria.presupuestos.controller.storage;

import com.neria.presupuestos.model.dto.UploadResponse;
import com.neria.presupuestos.service.storage.CloudinaryUploadService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/uploads")
public class UploadController {

    private final CloudinaryUploadService uploadService;

    public UploadController(CloudinaryUploadService uploadService) {
        this.uploadService = uploadService;
    }

    @PostMapping
    public ResponseEntity<UploadResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false) String folder
    ) {
        return ResponseEntity.ok(uploadService.upload(file, folder));
    }
}
