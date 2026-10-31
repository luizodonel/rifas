package com.rifasonline.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MensagemChatDTO {
    private Long id;
    private String sessaoId;
    private String nomeRemetente;
    private boolean remetenteAdmin;
    private String conteudo;
    private boolean lida;
    private LocalDateTime createdAt;
}
