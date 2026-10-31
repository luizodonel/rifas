package com.rifasonline.service;

import com.rifasonline.dto.ComprarCotasRequest;
import com.rifasonline.dto.PedidoResponseDTO;
import com.rifasonline.model.*;
import com.rifasonline.repository.NumeroCotaRepository;
import com.rifasonline.repository.PedidoRepository;
import com.rifasonline.repository.RifaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final RifaRepository rifaRepository;
    private final NumeroCotaRepository numeroCotaRepository;

    public PedidoService(PedidoRepository pedidoRepository,
                         RifaRepository rifaRepository,
                         NumeroCotaRepository numeroCotaRepository) {
        this.pedidoRepository = pedidoRepository;
        this.rifaRepository = rifaRepository;
        this.numeroCotaRepository = numeroCotaRepository;
    }

    @Transactional
    public PedidoResponseDTO criarPedidoCompra(ComprarCotasRequest req, Usuario usuario) {
        Rifa rifa = rifaRepository.findById(req.getRifaId())
                .orElseThrow(() -> new IllegalArgumentException("Rifa não encontrada com ID: " + req.getRifaId()));

        if (rifa.getStatus() == StatusRifa.ENCERRADA) {
            throw new IllegalStateException("Esta rifa já foi encerrada e sorteada.");
        }

        int vendidas = rifa.getCotasVendidas() != null ? rifa.getCotasVendidas() : 0;
        int disponiveis = rifa.getTotalCotas() - vendidas;

        if (req.getQuantidade() > disponiveis) {
            throw new IllegalArgumentException("Quantidade indisponível. Restam apenas " + disponiveis + " cotas.");
        }

        BigDecimal valorTotal = rifa.getPrecoCota().multiply(BigDecimal.valueOf(req.getQuantidade()));
        String codigoPedido = "PED-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Módulo bancário PIX desacoplado (Copia e Cola & QR Code dinâmico)
        String chavePix = "00020101021226870014br.gov.bcb.pix2565pix.clube.logistadigital.com.br/pagamento/" + codigoPedido +
                "520400005303986540" + String.format(Locale.US, "%.2f", valorTotal) +
                "5802BR5925CLUBE LOGISTA DIGITAL6009SAO PAULO62070503***6304" +
                UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Pedido pedido = Pedido.builder()
                .codigoPedido(codigoPedido)
                .usuario(usuario)
                .rifa(rifa)
                .quantidade(req.getQuantidade())
                .valorTotal(valorTotal)
                .statusPagamento(StatusPagamento.PENDENTE)
                .chavePixCopiaCola(chavePix)
                .qrCodePix("https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + java.net.URLEncoder.encode(chavePix, java.nio.charset.StandardCharsets.UTF_8))
                .dataCompra(LocalDateTime.now())
                .build();

        pedido = pedidoRepository.save(pedido);

        return mapToResponseDTO(pedido, Collections.emptyList());
    }

    @Transactional
    public PedidoResponseDTO confirmarPagamento(Long pedidoId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado com ID: " + pedidoId));

        if (pedido.getStatusPagamento() == StatusPagamento.PAGO) {
            List<String> numerosExistentes = numeroCotaRepository.findByPedido(pedido)
                    .stream()
                    .map(NumeroCota::getNumero)
                    .collect(Collectors.toList());
            return mapToResponseDTO(pedido, numerosExistentes);
        }

        Rifa rifa = pedido.getRifa();
        int vendidas = rifa.getCotasVendidas() != null ? rifa.getCotasVendidas() : 0;

        // Gerar os números de cotas do pedido
        int totalCotasRifa = rifa.getTotalCotas();
        int digits = String.valueOf(totalCotasRifa).length();
        Set<String> numerosUsados = new HashSet<>(numeroCotaRepository.findNumerosByRifa(rifa));

        List<NumeroCota> novasCotas = new ArrayList<>();
        Random random = new Random();

        // Aloca os números aleatoriamente dentro do total de cotas da rifa
        for (int i = 0; i < pedido.getQuantidade(); i++) {
            String numStr = null;
            int tentativas = 0;
            while (numStr == null && tentativas < totalCotasRifa + 100) {
                tentativas++;
                int candidato = random.nextInt(totalCotasRifa) + 1;
                String formatado = String.format("%0" + Math.max(digits, 4) + "d", candidato);
                if (!numerosUsados.contains(formatado)) {
                    numerosUsados.add(formatado);
                    numStr = formatado;
                }
            }

            // Fallback sequencial se o random demorar a achar
            if (numStr == null) {
                for (int s = 1; s <= totalCotasRifa; s++) {
                    String formatado = String.format("%0" + Math.max(digits, 4) + "d", s);
                    if (!numerosUsados.contains(formatado)) {
                        numerosUsados.add(formatado);
                        numStr = formatado;
                        break;
                    }
                }
            }

            if (numStr != null) {
                NumeroCota cota = NumeroCota.builder()
                        .pedido(pedido)
                        .rifa(rifa)
                        .usuario(pedido.getUsuario())
                        .numero(numStr)
                        .dataGeracao(LocalDateTime.now())
                        .build();
                novasCotas.add(cota);
            }
        }

        numeroCotaRepository.saveAll(novasCotas);

        pedido.setStatusPagamento(StatusPagamento.PAGO);
        pedido.setDataPagamento(LocalDateTime.now());
        pedido = pedidoRepository.save(pedido);

        // Atualiza contagem de cotas vendidas na rifa
        rifa.setCotasVendidas(vendidas + novasCotas.size());
        rifaRepository.save(rifa);

        List<String> numerosGerados = novasCotas.stream().map(NumeroCota::getNumero).collect(Collectors.toList());
        return mapToResponseDTO(pedido, numerosGerados);
    }

    public PedidoResponseDTO obterPedido(Long pedidoId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado."));
        List<String> numeros = numeroCotaRepository.findByPedido(pedido)
                .stream()
                .map(NumeroCota::getNumero)
                .collect(Collectors.toList());
        return mapToResponseDTO(pedido, numeros);
    }

    public List<PedidoResponseDTO> listarMeusPedidos(Usuario usuario) {
        return pedidoRepository.findByUsuarioOrderByDataCompraDesc(usuario)
                .stream()
                .map(p -> {
                    List<String> numeros = numeroCotaRepository.findByPedido(p)
                            .stream()
                            .map(NumeroCota::getNumero)
                            .collect(Collectors.toList());
                    return mapToResponseDTO(p, numeros);
                })
                .collect(Collectors.toList());
    }

    private PedidoResponseDTO mapToResponseDTO(Pedido p, List<String> numeros) {
        String img = (p.getRifa().getImagens() != null && !p.getRifa().getImagens().isEmpty())
                ? p.getRifa().getImagens().get(0).getUrlImagem()
                : "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80";

        return PedidoResponseDTO.builder()
                .id(p.getId())
                .codigoPedido(p.getCodigoPedido())
                .rifaId(p.getRifa().getId())
                .rifaTitulo(p.getRifa().getTitulo())
                .rifaImagemPrincipal(img)
                .quantidade(p.getQuantidade())
                .valorTotal(p.getValorTotal())
                .statusPagamento(p.getStatusPagamento())
                .qrCodePix(p.getQrCodePix())
                .chavePixCopiaCola(p.getChavePixCopiaCola())
                .dataCompra(p.getDataCompra())
                .dataPagamento(p.getDataPagamento())
                .numerosCotas(numeros)
                .build();
    }
}
