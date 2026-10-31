package com.rifasonline.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "pedidos", indexes = {
    @Index(name = "idx_pedido_usuario", columnList = "usuario_id"),
    @Index(name = "idx_pedido_rifa", columnList = "rifa_id"),
    @Index(name = "idx_pedido_status", columnList = "status_pagamento"),
    @Index(name = "idx_pedido_codigo", columnList = "codigo_pedido", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo_pedido", nullable = false, unique = true, length = 40)
    private String codigoPedido;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "rifa_id", nullable = false)
    private Rifa rifa;

    @NotNull
    @Min(1)
    @Column(nullable = false)
    private Integer quantidade;

    @NotNull
    @DecimalMin("0.01")
    @Column(name = "valor_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorTotal;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_pagamento", nullable = false, length = 20)
    @Builder.Default
    private StatusPagamento statusPagamento = StatusPagamento.PENDENTE;

    @Column(name = "qr_code_pix", columnDefinition = "TEXT")
    private String qrCodePix;

    @Column(name = "chave_pix_copia_cola", columnDefinition = "TEXT")
    private String chavePixCopiaCola;

    @Column(name = "data_compra", nullable = false)
    private LocalDateTime dataCompra;

    @Column(name = "data_pagamento")
    private LocalDateTime dataPagamento;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    @Builder.Default
    private List<NumeroCota> cotas = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (this.codigoPedido == null) {
            this.codigoPedido = "PED-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        if (this.dataCompra == null) {
            this.dataCompra = LocalDateTime.now();
        }
        if (this.statusPagamento == null) {
            this.statusPagamento = StatusPagamento.PENDENTE;
        }
    }
}
