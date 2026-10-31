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
public class SorteioPublicoDTO {
    private Long rifaId;
    private String rifaTitulo;
    private String rifaImagemPrincipal;
    private String status;
    private String numeroSorteado;
    private LocalDateTime dataHoraExecucao;
    private String nomeGanhador;
    private String cpfMascarado;       // Ex: 12******3456
    private String telefoneMascarado;  // Ex: (XX) XXXXX-1234
    private String hashComprovante;
    private Integer totalCotasRifa;
    private Integer totalCotasVendidas;
}
