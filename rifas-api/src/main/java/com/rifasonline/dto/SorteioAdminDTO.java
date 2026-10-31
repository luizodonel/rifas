package com.rifasonline.dto;

import com.rifasonline.model.RegraSorteioTipo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SorteioAdminDTO {
    private Long id;
    private Long rifaId;
    private String rifaTitulo;
    private String numeroSorteado;
    private LocalDateTime dataHoraExecucao;
    private RegraSorteioTipo regraUtilizada;
    private String hashComprovante;

    // Dados Completos e Irrestritos do Ganhador (Admin Only)
    private Long usuarioGanhadorId;
    private String nomeGanhador;
    private String cpfCompleto;
    private String cpfFormatado;
    private String telefoneCompleto;
    private String telefoneFormatado;
    private LocalDate dataNascimento;
    private Integer cotasAdquiridasPeloGanhador;
}
