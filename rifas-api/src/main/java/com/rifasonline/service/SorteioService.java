package com.rifasonline.service;

import com.rifasonline.dto.HistoricoSorteioPublicoDTO;
import com.rifasonline.dto.SorteioAdminDTO;
import com.rifasonline.dto.SorteioPublicoDTO;
import com.rifasonline.model.*;
import com.rifasonline.repository.*;
import com.rifasonline.util.MaskUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class SorteioService {

    private static final Logger log = LoggerFactory.getLogger(SorteioService.class);

    private static final String[] NOMES_FICTICIOS = {
        "Marcos Vinicius Ribeiro", "Juliana Mendes Castilho", "Rodrigo Alves Penteado",
        "Aline Pereira Nogueira", "Bruno Henrique Santoro", "Camila Rocha Guimarães",
        "Felipe Gabriel Siqueira", "Larissa Duarte Miranda", "Thiago Batista Silveira",
        "Fernanda Vasconcelos Lima", "Gabriel Souza Rezende", "Beatriz Martins Fonseca",
        "Matheus Moreira Neves", "Patricia Cardoso Viana", "Lucas Farias Tavares",
        "Renata Carvalho Azevedo", "Gustavo Ramos Barbosa", "Debora Antunes Prado"
    };

    private static final String[] DDD_LIST = { "61", "11", "21", "31", "41", "71", "81", "85" };

    private final RifaRepository rifaRepository;
    private final NumeroCotaRepository numeroCotaRepository;
    private final HistoricoSorteioRepository historicoSorteioRepository;
    private final UsuarioRepository usuarioRepository;
    private final PedidoRepository pedidoRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public SorteioService(RifaRepository rifaRepository,
                          NumeroCotaRepository numeroCotaRepository,
                          HistoricoSorteioRepository historicoSorteioRepository,
                          UsuarioRepository usuarioRepository,
                          PedidoRepository pedidoRepository,
                          SimpMessagingTemplate messagingTemplate) {
        this.rifaRepository = rifaRepository;
        this.numeroCotaRepository = numeroCotaRepository;
        this.historicoSorteioRepository = historicoSorteioRepository;
        this.usuarioRepository = usuarioRepository;
        this.pedidoRepository = pedidoRepository;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Executa o sorteio de uma rifa (seja acionado manualmente pelo Admin ou automaticamente pelo cronômetro).
     *
     * Regras:
     * - Modo Livre (Aleatório): Escolhe aleatoriamente entre todas as cotas válidas e pagas.
     *   Se não houver nenhuma cota paga, gera automaticamente um participante com CPF válido e nome fictício.
     * - Modo Direcionado (Controle Admin): O sistema busca as cotas do CPF configurado pelo Admin.
     *   Se não houver cotas, vincula ao CPF direcionado ou realiza sorteio automático sem falhas.
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
        NumeroCota cotaVencedora = null;
        Random random = new Random();

        // Se não houver cotas compradas, cria participante demonstrativo com CPF válido para realizar o sorteio
        if (todasCotasPagas.isEmpty()) {
            String cpfAlvo = (rifa.getRegraSorteioTipo() == RegraSorteioTipo.DIRECIONADO) ? rifa.getCpfDirecionado() : null;
            cotaVencedora = criarCotaParticipanteFicticio(rifa, cpfAlvo);
            log.info("Sorteio executado com participante oficial gerado: {} (CPF: {})",
                    cotaVencedora.getUsuario().getNome(), MaskUtils.mascararCpf(cotaVencedora.getUsuario().getCpf()));
        } else {
            // 1. Verifica se a regra é DIRECIONADO e há um CPF configurado
            if (rifa.getRegraSorteioTipo() == RegraSorteioTipo.DIRECIONADO &&
                    rifa.getCpfDirecionado() != null && !rifa.getCpfDirecionado().isBlank()) {

                String targetCpf = rifa.getCpfDirecionado().replaceAll("\\D", "");
                List<NumeroCota> cotasDoAlvo = numeroCotaRepository.findByRifaAndUsuarioCpf(rifa, targetCpf);

                if (!cotasDoAlvo.isEmpty()) {
                    cotaVencedora = cotasDoAlvo.get(random.nextInt(cotasDoAlvo.size()));
                    log.info("Sorteio direcionado executado para o CPF: {}", MaskUtils.mascararCpf(targetCpf));
                } else {
                    log.warn("CPF direcionado ({}) não possui cotas pagas. Sorteando entre os participantes pagantes.",
                            MaskUtils.mascararCpf(targetCpf));
                    cotaVencedora = todasCotasPagas.get(random.nextInt(todasCotasPagas.size()));
                }
            } else {
                // 2. Modo Livre (Aleatório)
                cotaVencedora = todasCotasPagas.get(random.nextInt(todasCotasPagas.size()));
                log.info("Sorteio livre (aleatório) executado para a rifa ID {}", rifaId);
            }
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
        rifa = rifaRepository.save(rifa);

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
     * Gera participante e bilhete com CPF matematicamente válido caso a rifa encerre sem vendas
     */
    private NumeroCota criarCotaParticipanteFicticio(Rifa rifa, String cpfAlvo) {
        Random random = new Random();
        Usuario ganhador;

        if (cpfAlvo != null && !cpfAlvo.isBlank()) {
            String cleanCpf = cpfAlvo.replaceAll("\\D", "");
            ganhador = usuarioRepository.findByCpf(cleanCpf).orElseGet(() -> {
                String nome = NOMES_FICTICIOS[random.nextInt(NOMES_FICTICIOS.length)];
                String ddd = DDD_LIST[random.nextInt(DDD_LIST.length)];
                String telefone = ddd + "9" + (10000000 + random.nextInt(90000000));
                Usuario u = Usuario.builder()
                        .cpf(cleanCpf)
                        .nome(nome)
                        .dataNascimento(LocalDate.of(1990 + random.nextInt(12), 1 + random.nextInt(12), 1 + random.nextInt(28)))
                        .telefone(telefone)
                        .senhaHash("$2a$10$w8.1/f4uJ9pT9s7A1K5c7.yH1mF3j2L5p8X2v7q1r0")
                        .role(Role.ROLE_USER)
                        .build();
                return usuarioRepository.save(u);
            });
        } else {
            String cpfValido = gerarCpfValido();
            String nome = NOMES_FICTICIOS[random.nextInt(NOMES_FICTICIOS.length)];
            String ddd = DDD_LIST[random.nextInt(DDD_LIST.length)];
            String telefone = ddd + "9" + (10000000 + random.nextInt(90000000));
            ganhador = Usuario.builder()
                    .cpf(cpfValido)
                    .nome(nome)
                    .dataNascimento(LocalDate.of(1988 + random.nextInt(15), 1 + random.nextInt(12), 1 + random.nextInt(28)))
                    .telefone(telefone)
                    .senhaHash("$2a$10$w8.1/f4uJ9pT9s7A1K5c7.yH1mF3j2L5p8X2v7q1r0")
                    .role(Role.ROLE_USER)
                    .build();
            ganhador = usuarioRepository.save(ganhador);
        }

        int maxCotas = (rifa.getTotalCotas() != null && rifa.getTotalCotas() > 0) ? rifa.getTotalCotas() : 10000;
        int digitos = String.valueOf(maxCotas).length();
        String formatMask = "%0" + Math.max(5, digitos) + "d";
        String numeroSorteado = String.format(formatMask, random.nextInt(maxCotas));

        Pedido pedido = Pedido.builder()
                .codigoPedido("PED-SIM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .usuario(ganhador)
                .rifa(rifa)
                .quantidade(1)
                .valorTotal(rifa.getPrecoCota())
                .statusPagamento(StatusPagamento.PAGO)
                .dataCompra(LocalDateTime.now().minusMinutes(5))
                .dataPagamento(LocalDateTime.now().minusMinutes(4))
                .build();
        pedido = pedidoRepository.save(pedido);

        NumeroCota cota = NumeroCota.builder()
                .pedido(pedido)
                .rifa(rifa)
                .usuario(ganhador)
                .numero(numeroSorteado)
                .dataGeracao(LocalDateTime.now().minusMinutes(4))
                .build();
        cota = numeroCotaRepository.save(cota);

        int vendidas = rifa.getCotasVendidas() != null ? rifa.getCotasVendidas() : 0;
        rifa.setCotasVendidas(vendidas + 1);

        return cota;
    }

    /**
     * Gera CPF brasileiro matematicamente válido com os dois dígitos verificadores corretos
     */
    public static String gerarCpfValido() {
        Random random = new Random();
        int[] digits = new int[11];
        for (int i = 0; i < 9; i++) {
            digits[i] = random.nextInt(10);
        }

        // 1º dígito verificador
        int soma1 = 0;
        for (int i = 0; i < 9; i++) {
            soma1 += digits[i] * (10 - i);
        }
        int resto1 = soma1 % 11;
        digits[9] = (resto1 < 2) ? 0 : (11 - resto1);

        // 2º dígito verificador
        int soma2 = 0;
        for (int i = 0; i < 10; i++) {
            soma2 += digits[i] * (11 - i);
        }
        int resto2 = soma2 % 11;
        digits[10] = (resto2 < 2) ? 0 : (11 - resto2);

        StringBuilder sb = new StringBuilder();
        for (int d : digits) sb.append(d);
        return sb.toString();
    }

    /**
     * Cron agendado para verificar automaticamente quando o cronômetro zerar (dataHoraSorteio <= now)
     */
    @Scheduled(fixedDelay = 2000)
    @Transactional
    public void verificarCronometroSorteios() {
        LocalDateTime agora = LocalDateTime.now();
        List<Rifa> rifasParaSortear = rifaRepository.findByStatusInAndDataHoraSorteioBefore(
                List.of(StatusRifa.ATIVA, StatusRifa.EM_BREVE, StatusRifa.AO_VIVO), agora);

        for (Rifa rifa : rifasParaSortear) {
            try {
                log.info("Cronômetro zerado para a rifa '{}' (ID {}). Disparando sorteio automático...",
                        rifa.getTitulo(), rifa.getId());
                executarSorteio(rifa.getId(), false);
            } catch (Exception e) {
                log.error("Erro ao processar sorteio automático da rifa ID {}: {}", rifa.getId(), e.getMessage());
            }
        }
    }

    @Transactional
    public SorteioPublicoDTO obterSorteioPublico(Long rifaId) {
        Rifa rifa = rifaRepository.findById(rifaId)
                .orElseThrow(() -> new IllegalArgumentException("Rifa não encontrada com ID: " + rifaId));

        if (rifa.getStatus() != StatusRifa.ENCERRADA || rifa.getGanhador() == null) {
            LocalDateTime agora = LocalDateTime.now();
            if (rifa.getDataHoraSorteio() != null && !rifa.getDataHoraSorteio().isAfter(agora)) {
                log.info("Horário do sorteio atingido para a rifa ID {}. Executando sorteio agora...", rifaId);
                return executarSorteio(rifaId, false);
            }

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
