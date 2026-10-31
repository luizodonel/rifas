package com.rifasonline.dto;

import com.rifasonline.model.StatusPagamento;
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
public class PedidoResponseDTO {
    private Long id;
    private String codigoPedido;
    private Long rifaId;
    private String rifaTitulo;
    private String rifaImagemPrincipal;
    private Integer quantidade;
    private BigDecimal valorTotal;
    private StatusPagamento statusPagamento;
    private String qrCodePix;
    private String chavePixCopiaCola;
    private LocalDateTime dataCompra;
    private LocalDateTime dataPagamento;
    private List<String> numerosCotas;
}
