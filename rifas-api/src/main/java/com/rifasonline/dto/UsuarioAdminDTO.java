package com.rifasonline.dto;

import com.rifasonline.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioAdminDTO {
    private Long id;
    private String cpf;
    private String cpfFormatado;
    private String nome;
    private LocalDate dataNascimento;
    private String telefone;
    private String telefoneFormatado;
    private Role role;
    private LocalDateTime createdAt;
}
