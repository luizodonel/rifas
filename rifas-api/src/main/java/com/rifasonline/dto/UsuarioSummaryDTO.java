package com.rifasonline.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioSummaryDTO {
    private Long id;
    private String nome;
    private String cpf;
    private String cpfFormatado;
    private String telefone;
    private LocalDate dataNascimento;
    private String role;
}

