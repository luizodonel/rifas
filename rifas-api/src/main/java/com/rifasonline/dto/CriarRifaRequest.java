package com.rifasonline.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CriarRifaRequest {

    @NotBlank(message = "O título é obrigatório")
    private String titulo;

    private String subtitulo;

    @NotBlank(message = "A descrição vendedora é obrigatória")
    private String descricao;

    @NotNull(message = "O preço por cota é obrigatório")
    @DecimalMin(value = "0.01", message = "O preço da cota deve ser no mínimo R$ 0,01")
    private BigDecimal precoCota;

    @NotNull(message = "O total de cotas é obrigatório")
    @Min(value = 1, message = "O total de cotas deve ser no mínimo 1")
    private Integer totalCotas;

    @NotNull(message = "A data e hora do sorteio são obrigatórias")
    private LocalDateTime dataHoraSorteio;

    private List<String> imagensUrls;
}

