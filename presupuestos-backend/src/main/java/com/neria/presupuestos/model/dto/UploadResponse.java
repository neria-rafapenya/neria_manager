package com.neria.presupuestos.model.dto;

import lombok.Data;

@Data
public class UploadResponse {
    private String publicId;
    private String url;
    private String secureUrl;
    private String resourceType;
    private String format;
    private Long bytes;
    private Integer width;
    private Integer height;
}
