package com.neria.presupuestos.ai.prompts;

public final class PromptTemplates {
    public static final String SYSTEM_PROMPT = "You are an assistant that extracts structured quote requests. "
            + "Return ONLY valid JSON. Never invent products. If information is missing, return null. "
            + "Include a confidence value between 0 and 1.";

    private PromptTemplates() {
    }

    public static String buildDynamicPrompt(String sector, String products, String options) {
        return buildDynamicPrompt(sector, products, options, null);
    }

    public static String buildDynamicPrompt(String sector, String products, String options, String extraInstructions) {
        String sectorLine = (sector == null || sector.isBlank()) ? "" : "Sector: " + sector + "\n";
        String extra = (extraInstructions == null || extraInstructions.isBlank())
                ? ""
                : "\nExtra instructions:\n" + extraInstructions + "\n";
        return sectorLine +
                "Available products:\n" + products + "\n\n" +
                "Available options:\n" + options + "\n\n" +
                extra +
                "Rules:\n" +
                "- Only use products from the list\n" +
                "- If a product appears in plural, map it to the listed product name\n" +
                "- Only use option values from the list\n" +
                "- If information is missing, return null\n" +
                "- Include confidence between 0 and 1\n" +
                "Extract quote parameters from the request.";
    }
}
