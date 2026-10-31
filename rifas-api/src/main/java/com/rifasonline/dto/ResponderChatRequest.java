package com.rifasonline.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResponderChatRequest {

    @NotBlank(message = "O ID da sessão é obrigatório")
    private String sessaoId;

    @NotBlank(message = "A resposta não pode ser vazia")
    private String resposta;
}
