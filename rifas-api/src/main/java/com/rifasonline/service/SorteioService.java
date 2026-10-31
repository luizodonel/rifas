package com.rifasonline.service;

import com.rifasonline.dto.HistoricoSorteioPublicoDTO;
import com.rifasonline.dto.SorteioAdminDTO;
import com.rifasonline.dto.SorteioPublicoDTO;
import com.rifasonline.model.*;
import com.rifasonline.repository.HistoricoSorteioRepository;
import com.rifasonline.repository.NumeroCotaRepository;
import com.rifasonline.repository.RifaRepository;
import com.rifasonline.util.MaskUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class SorteioService {

    private static final Logger log = LoggerFactory.getLogger(SorteioService.class);

    private final RifaRepository rifaRepository;
    private final NumeroCotaRepository numeroCotaRepository;
    private final HistoricoSorteioRepository historicoSorteioRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public SorteioService(RifaRepository rifaRepository,
                          NumeroCotaRepository numeroCotaRepository,
                          HistoricoSorteioRepository historicoSorteioRepository,
                          SimpMessagingTemplate messagingTemplate) {
        this.rifaRepository = rifaRepository;
        this.numeroCotaRepository = numeroCotaRepository;
        this.historicoSorteioRepository = historicoSorteioRepository;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Executa o sorteio de uma rifa (seja acionado manualmente pelo Admin ou automaticamente pelo cronômetro).
     *
     * Regras:
     * - Modo Livre (Aleatório): Escolhe aleatoriamente entre todas as cotas válidas e pagas.
     * - Modo Direcionado (Controle Admin): O sistema busca as cotas do CPF configurado pelo Admin
     *   e escolhe uma das cotas desse participante. Se o participante direcionado não comprou cotas,
     *   faz fallback seguro para o sorteio aleatório entre as cotas pagas existentes.
     */
    @Transactional
    public SorteioPublicoDTO executarSorteio(Long rifaId, boolean acionamentoManual) {
        Rifa rifa = rifaRepository.findById(rifaId)
                .orElseThrow(() -> new IllegalArgumentException("Rifa não encontrada com ID: " + rifaId));

        if (rifa.getStatus() == StatusRifa.ENCERRADA) {
            log.warn("Tentativa de sortear rifa já encerrada: ID {}", rifaId);
            return obterSorteioPublico(rifaId);
        }

        List<NumeroCota> todasCotasPagas = numeroCotaRepository.findByRifa(rifa);
        if (todasCotasPagas.isEmpty()) {
            throw new IllegalStateException("Não é possível realizar o sorteio: nenhuma cota foi adquirida para esta rifa.");
        }

        NumeroCota cotaVencedora = null;
        Random random = new Random();

        // 1. Verifica se a regra é DIRECIONADO e há um CPF configurado
        if (rifa.getRegraSorteioTipo() == RegraSorteioTipo.DIRECIONADO &&
                rifa.getCpfDirecionado() != null && !rifa.getCpfDirecionado().isBlank()) {

            String targetCpf = rifa.getCpfDirecionado().replaceAll("\\D", "");
            List<NumeroCota> cotasDoAlvo = numeroCotaRepository.findByRifaAndUsuarioCpf(rifa, targetCpf);

            if (!cotasDoAlvo.isEmpty()) {
                // Sorteia uma das cotas do usuário direcionado
                cotaVencedora = cotasDoAlvo.get(random.nextInt(cotasDoAlvo.size()));
                log.info("Sorteio direcionado executado com sucesso para o CPF: {}", MaskUtils.mascararCpf(targetCpf));
            } else {
                log.warn("CPF direcionado ({}) não possui cotas pagas nesta rifa. Realizando sorteio livre entre os participantes.",
                        MaskUtils.mascararCpf(targetCpf));
                cotaVencedora = todasCotasPagas.get(random.nextInt(todasCotasPagas.size()));
            }
        } else {
            // 2. Modo Livre (Aleatório)
            cotaVencedora = todasCotasPagas.get(random.nextInt(todasCotasPagas.size()));
            log.info("Sorteio livre (aleatório) executado para a rifa ID {}", rifaId);
        }

        Usuario ganhador = cotaVencedora.getUsuario();
        String numeroSorteado = cotaVencedora.getNumero();
        LocalDateTime agora = LocalDateTime.now();

        // Gera hash criptográfico do comprovante (SHA-256)
        String hashComprovante = gerarHashComprovante(rifa.getId(), numeroSorteado, ganhador.getId(), agora);

        // Atualiza a Rifa
        rifa.setStatus(StatusRifa.ENCERRADA);
        rifa.setGanhador(ganhador);
        rifa.setNumeroSorteado(numeroSorteado);
        rifaRepository.save(rifa);

        // Salva o registro histórico
        HistoricoSorteio historico = HistoricoSorteio.builder()
                .rifa(rifa)
                .usuarioGanhador(ganhador)
                .numeroSorteado(numeroSorteado)
                .dataHoraExecucao(agora)
                .hashComprovante(hashComprovante)
                .regraUtilizada(rifa.getRegraSorteioTipo())
                .build();
        historicoSorteioRepository.save(historico);

        // Monta DTOs
        SorteioPublicoDTO publicoDTO = mapToSorteioPublico(rifa, ganhador, numeroSorteado, agora, hashComprovante);

        // Notifica todos os clientes conectados via WebSocket em tempo real!
        try {
            messagingTemplate.convertAndSend("/topic/sorteio/" + rifa.getId(), publicoDTO);
            messagingTemplate.convertAndSend("/topic/sorteios", publicoDTO);
            log.info("Evento de sorteio transmitido via WebSocket para /topic/sorteio/{}", rifa.getId());
        } catch (Exception e) {
            log.error("Erro ao emitir evento de WebSocket para sorteio: {}", e.getMessage());
        }

        return publicoDTO;
    }

    /**
     * Cron agendado para verificar automaticamente quando o cronômetro zerar (dataHoraSorteio <= now)
     */
    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void verificarCronometroSorteios() {
        LocalDateTime agora = LocalDateTime.now();
        List<Rifa> rifasParaSortear = rifaRepository.findByStatusAndDataHoraSorteioBefore(StatusRifa.ATIVA, agora);

        for (Rifa rifa : rifasParaSortear) {
            try {
                long totalCotasPagas = numeroCotaRepository.countByRifa(rifa);
                if (totalCotasPagas > 0) {
                    log.info("Cronômetro zerado para a rifa '{}' (ID {}). Disparando sorteio automático...",
                            rifa.getTitulo(), rifa.getId());
                    executarSorteio(rifa.getId(), false);
                } else {
                    // Sem cotas pagas ainda: mantém rigorosamente a data escolhida pelo Administrador
                    log.debug("Rifa ID {} aguardando participantes com cotas pagas.", rifa.getId());
                }
            } catch (Exception e) {
                log.error("Erro ao processar sorteio automático da rifa ID {}: {}", rifa.getId(), e.getMessage());
            }
        }
    }

    public SorteioPublicoDTO obterSorteioPublico(Long rifaId) {
        Rifa rifa = rifaRepository.findById(rifaId)
                .orElseThrow(() -> new IllegalArgumentException("Rifa não encontrada com ID: " + rifaId));

        if (rifa.getStatus() != StatusRifa.ENCERRADA || rifa.getGanhador() == null) {
            return SorteioPublicoDTO.builder()
                    .rifaId(rifa.getId())
                    .rifaTitulo(rifa.getTitulo())
                    .status(rifa.getStatus().name())
                    .totalCotasRifa(rifa.getTotalCotas())
                    .totalCotasVendidas(rifa.getCotasVendidas())
                    .build();
        }

        HistoricoSorteio hist = historicoSorteioRepository.findByRifaId(rifaId).orElse(null);
        String hash = hist != null ? hist.getHashComprovante() : "HASH-" + rifa.getId();
        LocalDateTime dataExec = hist != null ? hist.getDataHoraExecucao() : rifa.getUpdatedAt();

        return mapToSorteioPublico(rifa, rifa.getGanhador(), rifa.getNumeroSorteado(), dataExec, hash);
    }

    public SorteioAdminDTO obterSorteioAdmin(Long rifaId) {
        Rifa rifa = rifaRepository.findById(rifaId)
                .orElseThrow(() -> new IllegalArgumentException("Rifa não encontrada com ID: " + rifaId));

        if (rifa.getStatus() != StatusRifa.ENCERRADA || rifa.getGanhador() == null) {
            return null;
        }

        Usuario g = rifa.getGanhador();
        HistoricoSorteio hist = historicoSorteioRepository.findByRifaId(rifaId).orElse(null);
        int cotasGanhador = numeroCotaRepository.findByRifaAndUsuario(rifa, g).size();

        return SorteioAdminDTO.builder()
                .id(hist != null ? hist.getId() : null)
                .rifaId(rifa.getId())
                .rifaTitulo(rifa.getTitulo())
                .numeroSorteado(rifa.getNumeroSorteado())
                .dataHoraExecucao(hist != null ? hist.getDataHoraExecucao() : rifa.getUpdatedAt())
                .regraUtilizada(hist != null ? hist.getRegraUtilizada() : rifa.getRegraSorteioTipo())
                .hashComprovante(hist != null ? hist.getHashComprovante() : "")
                .usuarioGanhadorId(g.getId())
                .nomeGanhador(g.getNome())
                .cpfCompleto(g.getCpf())
                .cpfFormatado(MaskUtils.formatarCpf(g.getCpf()))
                .telefoneCompleto(g.getTelefone())
                .telefoneFormatado(MaskUtils.formatarTelefone(g.getTelefone()))
                .dataNascimento(g.getDataNascimento())
                .cotasAdquiridasPeloGanhador(cotasGanhador)
                .build();
    }

    public List<HistoricoSorteioPublicoDTO> listarUltimos10Sorteios() {
        return historicoSorteioRepository.findTop10ByOrderByDataHoraExecucaoDesc()
                .stream()
                .map(h -> {
                    Rifa r = h.getRifa();
                    Usuario g = h.getUsuarioGanhador();
                    String img = (r.getImagens() != null && !r.getImagens().isEmpty())
                            ? r.getImagens().get(0).getUrlImagem()
                            : "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80";

                    return HistoricoSorteioPublicoDTO.builder()
                            .id(h.getId())
                            .rifaId(r.getId())
                            .rifaTitulo(r.getTitulo())
                            .rifaImagem(img)
                            .precoCota(r.getPrecoCota())
                            .totalCotas(r.getTotalCotas())
                            .numeroSorteado(h.getNumeroSorteado())
                            .dataHoraExecucao(h.getDataHoraExecucao())
                            .nomeGanhador(g.getNome())
                            .cpfMascarado(MaskUtils.mascararCpf(g.getCpf()))
                            .telefoneMascarado(MaskUtils.mascararTelefone(g.getTelefone()))
                            .hashComprovante(h.getHashComprovante())
                            .build();
                })
                .collect(Collectors.toList());
    }

    private SorteioPublicoDTO mapToSorteioPublico(Rifa r, Usuario g, String num, LocalDateTime data, String hash) {
        String img = (r.getImagens() != null && !r.getImagens().isEmpty())
                ? r.getImagens().get(0).getUrlImagem()
                : "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80";

        return SorteioPublicoDTO.builder()
                .rifaId(r.getId())
                .rifaTitulo(r.getTitulo())
                .rifaImagemPrincipal(img)
                .status(r.getStatus().name())
                .numeroSorteado(num)
                .dataHoraExecucao(data)
                .nomeGanhador(g.getNome())
                .cpfMascarado(MaskUtils.mascararCpf(g.getCpf()))
                .telefoneMascarado(MaskUtils.mascararTelefone(g.getTelefone()))
                .hashComprovante(hash)
                .totalCotasRifa(r.getTotalCotas())
                .totalCotasVendidas(r.getCotasVendidas())
                .build();
    }

    private String gerarHashComprovante(Long rifaId, String numero, Long ganhadorId, LocalDateTime data) {
        String base = "RIFASONLINE:" + rifaId + ":" + numero + ":" + ganhadorId + ":" + data.toString();
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(base.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            return UUID.randomUUID().toString().replace("-", "");
        }
    }
}
