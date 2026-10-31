package com.rifasonline.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoricoSorteioPublicoDTO {
    private Long id;
    private Long rifaId;
    private String rifaTitulo;
    private String rifaImagem;
    private BigDecimal precoCota;
    private Integer totalCotas;
    private String numeroSorteado;
    private LocalDateTime dataHoraExecucao;
    private String nomeGanhador;
    private String cpfMascarado;       // 12******3456
    private String telefoneMascarado;  // (XX) XXXXX-1234
    private String hashComprovante;
}

