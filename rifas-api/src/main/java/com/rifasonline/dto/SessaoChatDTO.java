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
public class SessaoChatDTO {
    private String sessaoId;
    private String nomeCliente;
    private String cpfCliente;
    private String ultimaMensagem;
    private LocalDateTime dataUltimaMensagem;
    private long naoLidas;
}
