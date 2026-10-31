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
public class EnviarMensagemRequest {

    private String sessaoId;
    private String nomeRemetente;
    private String cpf;

    @NotBlank(message = "O conteúdo da mensagem é obrigatório")
    private String conteudo;
}
