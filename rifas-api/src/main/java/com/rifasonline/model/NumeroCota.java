package com.rifasonline.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "numeros_cotas", indexes = {
    @Index(name = "idx_cota_rifa_numero", columnList = "rifa_id, numero", unique = true),
    @Index(name = "idx_cota_usuario", columnList = "usuario_id"),
    @Index(name = "idx_cota_pedido", columnList = "pedido_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NumeroCota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    @JsonBackReference
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rifa_id", nullable = false)
    private Rifa rifa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @NotBlank
    @Column(nullable = false, length = 20)
    private String numero;

    @Column(name = "data_geracao", nullable = false)
    private LocalDateTime dataGeracao;

    @PrePersist
    protected void onCreate() {
        if (this.dataGeracao == null) {
            this.dataGeracao = LocalDateTime.now();
        }
    }
}
