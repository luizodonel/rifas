package com.rifasonline.util;

public final class MaskUtils {

    private MaskUtils() {
        // Utilitário estático
    }

    /**
     * Mascara CPF exibindo apenas os primeiros 2 dígitos e os últimos 4 dígitos.
     * Exemplo: '12345678901' -> '12******8901' ou '12******3456'
     */
    public static String mascararCpf(String cpf) {
        if (cpf == null || cpf.isBlank()) {
            return "******";
        }
        String clean = cpf.replaceAll("\\D", "");
        if (clean.length() < 6) {
            return "******";
        }
        if (clean.length() == 11) {
            String first2 = clean.substring(0, 2);
            String last4 = clean.substring(7);
            return first2 + "******" + last4;
        }
        // Se tamanho diferente mas maior que 6
        String first2 = clean.substring(0, Math.min(2, clean.length()));
        String last4 = clean.substring(Math.max(2, clean.length() - 4));
        return first2 + "******" + last4;
    }

    /**
     * Mascara Telefone exibindo apenas os últimos 4 dígitos.
     * Exemplo: '(61) 98582-1234' -> '(XX) XXXXX-1234' ou '*****1234'
     */
    public static String mascararTelefone(String telefone) {
        if (telefone == null || telefone.isBlank()) {
            return "(XX) XXXXX-****";
        }
        String clean = telefone.replaceAll("\\D", "");
        if (clean.length() < 4) {
            return "(XX) XXXXX-****";
        }
        String last4 = clean.substring(clean.length() - 4);
        return "(XX) XXXXX-" + last4;
    }

    /**
     * Formata CPF com pontos e traço (para visão Admin): 000.000.000-00
     */
    public static String formatarCpf(String cpf) {
        if (cpf == null) return "";
        String clean = cpf.replaceAll("\\D", "");
        if (clean.length() == 11) {
            return clean.substring(0, 3) + "." +
                   clean.substring(3, 6) + "." +
                   clean.substring(6, 9) + "-" +
                   clean.substring(9);
        }
        return cpf;
    }

    /**
     * Formata Telefone (para visão Admin): (XX) XXXXX-XXXX
     */
    public static String formatarTelefone(String telefone) {
        if (telefone == null) return "";
        String clean = telefone.replaceAll("\\D", "");
        if (clean.length() == 11) {
            return "(" + clean.substring(0, 2) + ") " + clean.substring(2, 7) + "-" + clean.substring(7);
        } else if (clean.length() == 10) {
            return "(" + clean.substring(0, 2) + ") " + clean.substring(2, 6) + "-" + clean.substring(6);
        }
        return telefone;
    }
}
