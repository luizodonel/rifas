package com.rifasonline.dto;

import com.rifasonline.model.StatusRifa;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RifaPublicDTO {
    private Long id;
    private String titulo;
    private String subtitulo;
    private String descricao;
    private BigDecimal precoCota;
    private Integer totalCotas;
    private Integer cotasVendidas;
    private Integer cotasDisponiveis;
    private Double porcentagemVendida;
    private StatusRifa status;
    private LocalDateTime dataHoraSorteio;
    private String numeroSorteado;
    private List<String> imagens;
    private String imagemPrincipal;
    
    // Informações públicas do ganhador (dados mascarados)
    private GanhadorPublicoDTO ganhador;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GanhadorPublicoDTO {
        private String nome;
        private String cpfMascarado;
        private String telefoneMascarado;
        private String numeroSorteado;
    }
}
