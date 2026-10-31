package com.rifasonline.dto;

import com.rifasonline.model.RegraSorteioTipo;
import com.rifasonline.model.StatusRifa;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RifaAdminDTO {
    private Long id;
    private String titulo;
    private String subtitulo;
    private String descricao;
    private BigDecimal precoCota;
    private Integer totalCotas;
    private Integer cotasVendidas;
    private Integer cotasDisponiveis;
    private Double porcentagemVendida;
    private BigDecimal totalArrecadado;
    private StatusRifa status;
    private LocalDateTime dataHoraSorteio;
    private RegraSorteioTipo regraSorteioTipo;
    private String cpfDirecionado;
    private String cpfDirecionadoFormatado;
    private String numeroSorteado;
    private List<String> imagens;
    private String imagemPrincipal;
    private LocalDateTime createdAt;

    // Dados irrestritos do ganhador (apenas Admin)
    private GanhadorAdminDTO ganhador;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GanhadorAdminDTO {
        private Long id;
        private String nome;
        private String cpfCompleto;
        private String cpfFormatado;
        private String telefoneCompleto;
        private String telefoneFormatado;
        private LocalDate dataNascimento;
        private String numeroSorteado;
        private Integer totalCotasCompradas;
    }
}
