package com.rifasonline.dto;

import com.rifasonline.model.RegraSorteioTipo;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParametrizarSorteioRequest {

    @NotNull(message = "O tipo de regra do sorteio é obrigatório")
    private RegraSorteioTipo regraSorteioTipo;

    /**
     * CPF do participante que será o ganhador se regraSorteioTipo == DIRECIONADO
     */
    private String cpfDirecionado;
}
