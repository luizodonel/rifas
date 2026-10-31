package com.rifasonline.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
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
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rifas", indexes = {
    @Index(name = "idx_rifa_status", columnList = "status"),
    @Index(name = "idx_rifa_data_sorteio", columnList = "data_hora_sorteio")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Rifa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "O título da rifa é obrigatório")
    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(length = 300)
    private String subtitulo;

    @NotBlank(message = "A descrição vendedora é obrigatória")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @NotNull(message = "O preço por cota é obrigatório")
    @DecimalMin(value = "0.01", message = "O preço da cota deve ser maior que zero")
    @Column(name = "preco_cota", nullable = false, precision = 12, scale = 2)
    private BigDecimal precoCota;

    @NotNull(message = "O total de cotas é obrigatório")
    @Min(value = 1, message = "Deve haver no mínimo 1 cota")
    @Column(name = "total_cotas", nullable = false)
    private Integer totalCotas;

    @Column(name = "cotas_vendidas", nullable = false)
    @Builder.Default
    private Integer cotasVendidas = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StatusRifa status = StatusRifa.ATIVA;

    @NotNull(message = "A data e hora do sorteio são obrigatórias")
    @Column(name = "data_hora_sorteio", nullable = false)
    private LocalDateTime dataHoraSorteio;

    @Enumerated(EnumType.STRING)
    @Column(name = "regra_sorteio_tipo", nullable = false, length = 20)
    @Builder.Default
    private RegraSorteioTipo regraSorteioTipo = RegraSorteioTipo.ALEATORIO;

    /**
     * CPF escolhido pelo Admin quando regraSorteioTipo == DIRECIONADO.
     * Armazenado apenas os 11 dígitos.
     */
    @Column(name = "cpf_direcionado", length = 14)
    private String cpfDirecionado;

    /**
     * Ganhador definitivo após o sorteio
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_ganhador_id")
    private Usuario ganhador;

    @Column(name = "numero_sorteado", length = 20)
    private String numeroSorteado;

    @OneToMany(mappedBy = "rifa", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("ordem ASC")
    @JsonManagedReference
    @Builder.Default
    private List<RifaImagem> imagens = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.cotasVendidas == null) this.cotasVendidas = 0;
        if (this.status == null) this.status = StatusRifa.ATIVA;
        if (this.regraSorteioTipo == null) this.regraSorteioTipo = RegraSorteioTipo.ALEATORIO;
        if (this.cpfDirecionado != null) {
            this.cpfDirecionado = this.cpfDirecionado.replaceAll("\\D", "");
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.cpfDirecionado != null) {
            this.cpfDirecionado = this.cpfDirecionado.replaceAll("\\D", "");
        }
    }

    public void addImagem(RifaImagem img) {
        if (this.imagens == null) {
            this.imagens = new ArrayList<>();
        }
        img.setRifa(this);
        this.imagens.add(img);
    }
}
