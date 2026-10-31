package com.rifasonline.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrocarSenhaAdminRequest {

    @NotBlank(message = "A nova senha não pode ser vazia")
    @Size(min = 4, message = "A senha deve conter no mínimo 4 caracteres")
    private String novaSenha;
}
