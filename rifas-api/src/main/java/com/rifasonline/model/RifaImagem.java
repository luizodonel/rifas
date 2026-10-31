package com.rifasonline.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "rifa_imagens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RifaImagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rifa_id", nullable = false)
    @JsonBackReference
    private Rifa rifa;

    @NotBlank
    @Column(name = "url_imagem", nullable = false, length = 1000)
    private String urlImagem;

    @Column(nullable = false)
    @Builder.Default
    private Integer ordem = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean destaque = false;
}
