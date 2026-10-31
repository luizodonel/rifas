package com.rifasonline.service;

import com.rifasonline.dto.CriarRifaRequest;
import com.rifasonline.dto.ParametrizarSorteioRequest;
import com.rifasonline.dto.RifaAdminDTO;
import com.rifasonline.dto.RifaPublicDTO;
import com.rifasonline.model.*;
import com.rifasonline.repository.*;
import com.rifasonline.util.MaskUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class RifaService {

    private final RifaRepository rifaRepository;
    private final RifaImagemRepository rifaImagemRepository;
    private final NumeroCotaRepository numeroCotaRepository;
    private final PedidoRepository pedidoRepository;
    private final HistoricoSorteioRepository historicoSorteioRepository;

    public RifaService(RifaRepository rifaRepository,
                       RifaImagemRepository rifaImagemRepository,
                       NumeroCotaRepository numeroCotaRepository,
                       PedidoRepository pedidoRepository,
                       HistoricoSorteioRepository historicoSorteioRepository) {
        this.rifaRepository = rifaRepository;
        this.rifaImagemRepository = rifaImagemRepository;
        this.numeroCotaRepository = numeroCotaRepository;
        this.pedidoRepository = pedidoRepository;
        this.historicoSorteioRepository = historicoSorteioRepository;
    }

    public List<RifaPublicDTO> listarRifasPublicas() {
        return rifaRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToPublicDTO)
                .collect(Collectors.toList());
    }

    public RifaPublicDTO obterRifaPublica(Long id) {
        Rifa rifa = rifaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rifa não encontrada com o ID: " + id));
        return mapToPublicDTO(rifa);
    }

    public List<RifaAdminDTO> listarRifasAdmin() {
        return rifaRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToAdminDTO)
                .collect(Collectors.toList());
    }

    public RifaAdminDTO obterRifaAdmin(Long id) {
        Rifa rifa = rifaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rifa não encontrada com o ID: " + id));
        return mapToAdminDTO(rifa);
    }

    @Transactional
    public RifaAdminDTO criarRifa(CriarRifaRequest req) {
        Rifa rifa = Rifa.builder()
                .titulo(req.getTitulo().trim())
                .subtitulo(req.getSubtitulo())
                .descricao(req.getDescricao())
                .precoCota(req.getPrecoCota())
                .totalCotas(req.getTotalCotas())
                .cotasVendidas(0)
                .status(StatusRifa.ATIVA)
                .dataHoraSorteio(req.getDataHoraSorteio())
                .regraSorteioTipo(RegraSorteioTipo.ALEATORIO)
                .build();

        rifa = rifaRepository.save(rifa);

        if (req.getImagensUrls() != null && !req.getImagensUrls().isEmpty()) {
            for (int i = 0; i < req.getImagensUrls().size(); i++) {
                String url = req.getImagensUrls().get(i);
                if (url != null && !url.isBlank()) {
                    RifaImagem img = RifaImagem.builder()
                            .rifa(rifa)
                            .urlImagem(url.trim())
                            .ordem(i)
                            .destaque(i == 0)
                            .build();
                    rifaImagemRepository.save(img);
                    rifa.addImagem(img);
                }
            }
        }

        return mapToAdminDTO(rifa);
    }

    @Transactional
    public RifaAdminDTO atualizarRifa(Long id, CriarRifaRequest req) {
        Rifa rifa = rifaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rifa não encontrada com o ID: " + id));

        if (rifa.getStatus() == StatusRifa.ENCERRADA) {
            throw new IllegalStateException("Esta rifa já foi encerrada e não pode mais ser editada.");
        }

        rifa.setTitulo(req.getTitulo().trim());
        rifa.setSubtitulo(req.getSubtitulo());
        rifa.setDescricao(req.getDescricao());
        rifa.setPrecoCota(req.getPrecoCota());
        rifa.setTotalCotas(req.getTotalCotas());
        rifa.setDataHoraSorteio(req.getDataHoraSorteio());

        if (req.getImagensUrls() != null && !req.getImagensUrls().isEmpty()) {
            rifa.getImagens().clear();
            rifaImagemRepository.deleteByRifa(rifa);
            for (int i = 0; i < req.getImagensUrls().size(); i++) {
                String url = req.getImagensUrls().get(i);
                if (url != null && !url.isBlank()) {
                    RifaImagem img = RifaImagem.builder()
                            .rifa(rifa)
                            .urlImagem(url.trim())
                            .ordem(i)
                            .destaque(i == 0)
                            .build();
                    rifa.addImagem(img);
                }
            }
        }

        rifa = rifaRepository.save(rifa);
        return mapToAdminDTO(rifa);
    }

    @Transactional
    public void excluirRifa(Long id) {
        Rifa rifa = rifaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rifa não encontrada com o ID: " + id));

        numeroCotaRepository.deleteByRifa(rifa);
        pedidoRepository.deleteByRifa(rifa);
        historicoSorteioRepository.deleteByRifa(rifa);
        historicoSorteioRepository.deleteByRifaId(id);
        rifaRepository.delete(rifa);
    }

    @Transactional
    public RifaAdminDTO parametrizarSorteio(Long rifaId, ParametrizarSorteioRequest req) {
        Rifa rifa = rifaRepository.findById(rifaId)
                .orElseThrow(() -> new IllegalArgumentException("Rifa não encontrada com o ID: " + rifaId));

        if (rifa.getStatus() == StatusRifa.ENCERRADA) {
            throw new IllegalStateException("Esta rifa já foi encerrada e sorteada.");
        }

        rifa.setRegraSorteioTipo(req.getRegraSorteioTipo());

        if (req.getRegraSorteioTipo() == RegraSorteioTipo.DIRECIONADO) {
            if (req.getCpfDirecionado() == null || req.getCpfDirecionado().isBlank()) {
                throw new IllegalArgumentException("Para o modo direcionado, informe o CPF do vencedor.");
            }
            String cleanCpf = req.getCpfDirecionado().replaceAll("\\D", "");
            rifa.setCpfDirecionado(cleanCpf);
        } else {
            rifa.setCpfDirecionado(null);
        }

        rifa = rifaRepository.save(rifa);
        return mapToAdminDTO(rifa);
    }

    /**
     * Retorna a lista de usuários participantes que possuem cotas pagas na rifa
     */
    public List<Usuario> listarParticipantesAptos(Long rifaId) {
        Rifa rifa = rifaRepository.findById(rifaId)
                .orElseThrow(() -> new IllegalArgumentException("Rifa não encontrada."));
        return numeroCotaRepository.findDistinctUsuariosByRifa(rifa);
    }

    // --- Mapeamentos ---

    public RifaPublicDTO mapToPublicDTO(Rifa r) {
        int vendidas = r.getCotasVendidas() != null ? r.getCotasVendidas() : 0;
        int total = r.getTotalCotas() != null ? r.getTotalCotas() : 1;
        int disponiveis = Math.max(0, total - vendidas);
        double porcentagem = Math.min(100.0, ((double) vendidas / total) * 100.0);

        List<String> imagens = r.getImagens() != null
                ? r.getImagens().stream().map(RifaImagem::getUrlImagem).collect(Collectors.toList())
                : Collections.emptyList();

        String imgPrincipal = !imagens.isEmpty() ? imagens.get(0) : "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80";

        RifaPublicDTO.GanhadorPublicoDTO ganhadorDTO = null;
        if (r.getGanhador() != null) {
            ganhadorDTO = RifaPublicDTO.GanhadorPublicoDTO.builder()
                    .nome(r.getGanhador().getNome())
                    .cpfMascarado(MaskUtils.mascararCpf(r.getGanhador().getCpf()))
                    .telefoneMascarado(MaskUtils.mascararTelefone(r.getGanhador().getTelefone()))
                    .numeroSorteado(r.getNumeroSorteado())
                    .build();
        }

        return RifaPublicDTO.builder()
                .id(r.getId())
                .titulo(r.getTitulo())
                .subtitulo(r.getSubtitulo())
                .descricao(r.getDescricao())
                .precoCota(r.getPrecoCota())
                .totalCotas(total)
                .cotasVendidas(vendidas)
                .cotasDisponiveis(disponiveis)
                .porcentagemVendida(Math.round(porcentagem * 100.0) / 100.0)
                .status(r.getStatus())
                .dataHoraSorteio(r.getDataHoraSorteio())
                .numeroSorteado(r.getNumeroSorteado())
                .imagens(imagens)
                .imagemPrincipal(imgPrincipal)
                .ganhador(ganhadorDTO)
                .build();
    }

    public RifaAdminDTO mapToAdminDTO(Rifa r) {
        int vendidas = r.getCotasVendidas() != null ? r.getCotasVendidas() : 0;
        int total = r.getTotalCotas() != null ? r.getTotalCotas() : 1;
        int disponiveis = Math.max(0, total - vendidas);
        double porcentagem = Math.min(100.0, ((double) vendidas / total) * 100.0);
        BigDecimal arrecadado = r.getPrecoCota().multiply(BigDecimal.valueOf(vendidas));

        List<String> imagens = r.getImagens() != null
                ? r.getImagens().stream().map(RifaImagem::getUrlImagem).collect(Collectors.toList())
                : Collections.emptyList();

        String imgPrincipal = !imagens.isEmpty() ? imagens.get(0) : "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80";

        RifaAdminDTO.GanhadorAdminDTO ganhadorDTO = null;
        if (r.getGanhador() != null) {
            Usuario g = r.getGanhador();
            int cotasGanhador = numeroCotaRepository.findByRifaAndUsuario(r, g).size();
            ganhadorDTO = RifaAdminDTO.GanhadorAdminDTO.builder()
                    .id(g.getId())
                    .nome(g.getNome())
                    .cpfCompleto(g.getCpf())
                    .cpfFormatado(MaskUtils.formatarCpf(g.getCpf()))
                    .telefoneCompleto(g.getTelefone())
                    .telefoneFormatado(MaskUtils.formatarTelefone(g.getTelefone()))
                    .dataNascimento(g.getDataNascimento())
                    .numeroSorteado(r.getNumeroSorteado())
                    .totalCotasCompradas(cotasGanhador)
                    .build();
        }

        return RifaAdminDTO.builder()
                .id(r.getId())
                .titulo(r.getTitulo())
                .subtitulo(r.getSubtitulo())
                .descricao(r.getDescricao())
                .precoCota(r.getPrecoCota())
                .totalCotas(total)
                .cotasVendidas(vendidas)
                .cotasDisponiveis(disponiveis)
                .porcentagemVendida(Math.round(porcentagem * 100.0) / 100.0)
                .totalArrecadado(arrecadado)
                .status(r.getStatus())
                .dataHoraSorteio(r.getDataHoraSorteio())
                .regraSorteioTipo(r.getRegraSorteioTipo())
                .cpfDirecionado(r.getCpfDirecionado())
                .cpfDirecionadoFormatado(MaskUtils.formatarCpf(r.getCpfDirecionado()))
                .numeroSorteado(r.getNumeroSorteado())
                .imagens(imagens)
                .imagemPrincipal(imgPrincipal)
                .createdAt(r.getCreatedAt())
                .ganhador(ganhadorDTO)
                .build();
    }
}
