package com.rifasonline.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "historico_sorteios", indexes = {
    @Index(name = "idx_hist_rifa", columnList = "rifa_id"),
    @Index(name = "idx_hist_data", columnList = "data_hora_execucao")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoricoSorteio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "rifa_id", nullable = false, unique = true)
    private Rifa rifa;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_ganhador_id", nullable = false)
    private Usuario usuarioGanhador;

    @NotBlank
    @Column(name = "numero_sorteado", nullable = false, length = 20)
    private String numeroSorteado;

    @NotNull
    @Column(name = "data_hora_execucao", nullable = false)
    private LocalDateTime dataHoraExecucao;

    @Column(name = "hash_comprovante", nullable = false, length = 64)
    private String hashComprovante;

    @Enumerated(EnumType.STRING)
    @Column(name = "regra_utilizada", nullable = false, length = 20)
    private RegraSorteioTipo regraUtilizada;

    @PrePersist
    protected void onCreate() {
        if (this.dataHoraExecucao == null) {
            this.dataHoraExecucao = LocalDateTime.now();
        }
    }
}
