package com.rifasonline.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MaskUtilsTest {

    @Test
    @DisplayName("Deve mascarar CPF exibindo primeiros 2 dígitos e últimos 4 dígitos: 12******3456")
    void testMascararCpf() {
        String cpf = "12345673456";
        String mascarado = MaskUtils.mascararCpf(cpf);
        assertEquals("12******3456", mascarado);

        String cpfFormatado = "123.456.789-01";
        String mascaradoFormatado = MaskUtils.mascararCpf(cpfFormatado);
        assertEquals("12******8901", mascaradoFormatado);
    }

    @Test
    @DisplayName("Deve mascarar telefone exibindo apenas os últimos 4 dígitos: (XX) XXXXX-1234")
    void testMascararTelefone() {
        String tel = "61985821234";
        String mascarado = MaskUtils.mascararTelefone(tel);
        assertEquals("(XX) XXXXX-1234", mascarado);
        assertTrue(mascarado.endsWith("1234"));
    }

    @Test
    @DisplayName("Deve formatar CPF para visão do Administrador: 000.000.000-00")
    void testFormatarCpf() {
        String cpf = "12345678901";
        assertEquals("123.456.789-01", MaskUtils.formatarCpf(cpf));
    }
}
