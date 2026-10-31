package com.rifasonline.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComprarCotasRequest {

    @NotNull(message = "A rifa é obrigatória")
    private Long rifaId;

    @NotNull(message = "A quantidade de cotas é obrigatória")
    @Min(value = 1, message = "Compre ao menos 1 cota")
    private Integer quantidade;
}
