package com.rifasonline.config;

import com.rifasonline.model.*;
import com.rifasonline.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

        private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

        private final UsuarioRepository usuarioRepository;
        private final RifaRepository rifaRepository;
        private final RifaImagemRepository rifaImagemRepository;
        private final PedidoRepository pedidoRepository;
        private final NumeroCotaRepository numeroCotaRepository;
        private final HistoricoSorteioRepository historicoSorteioRepository;
        private final PasswordEncoder passwordEncoder;

        public DataInitializer(UsuarioRepository usuarioRepository,
                        RifaRepository rifaRepository,
                        RifaImagemRepository rifaImagemRepository,
                        PedidoRepository pedidoRepository,
                        NumeroCotaRepository numeroCotaRepository,
                        HistoricoSorteioRepository historicoSorteioRepository,
                        PasswordEncoder passwordEncoder) {
                this.usuarioRepository = usuarioRepository;
                this.rifaRepository = rifaRepository;
                this.rifaImagemRepository = rifaImagemRepository;
                this.pedidoRepository = pedidoRepository;
                this.numeroCotaRepository = numeroCotaRepository;
                this.historicoSorteioRepository = historicoSorteioRepository;
                this.passwordEncoder = passwordEncoder;
        }

        @Override
        @Transactional
        public void run(String... args) {
                log.info("Inicializando dados mestres da plataforma de Rifas Online...");

                // 1. Criar ou Atualizar Administrador Master (00000000000) e Administrador
                // Suporte (11111111111)
                Usuario admin = usuarioRepository.findByCpf("00000000000").orElse(null);
                if (admin == null) {
                        admin = Usuario.builder()
                                        .cpf("00000000000")
                                        .nome("Administrador Master")
                                        .dataNascimento(LocalDate.of(1990, 1, 1))
                                        .telefone("61982261155")
                                        .senhaHash(passwordEncoder.encode("admin123"))
                                        .role(Role.ROLE_ADMIN)
                                        .build();
                        usuarioRepository.save(admin);
                } else {
                        admin.setNome("Administrador Master");
                        admin.setTelefone("61982261155");
                        admin.setRole(Role.ROLE_ADMIN);
                        admin.setSenhaHash(passwordEncoder.encode("admin123"));
                        usuarioRepository.save(admin);
                }

                Usuario admin2 = usuarioRepository.findByCpf("11111111111").orElse(null);
                if (admin2 == null) {
                        admin2 = Usuario.builder()
                                        .cpf("11111111111")
                                        .nome("Admin Suporte")
                                        .dataNascimento(LocalDate.of(1992, 6, 15))
                                        .telefone("61982261155")
                                        .senhaHash(passwordEncoder.encode("admin123"))
                                        .role(Role.ROLE_USER)
                                        .build();
                        usuarioRepository.save(admin2);
                } else {
                        admin2.setNome("Admin Suporte");
                        admin2.setTelefone("61982261155");
                        admin2.setRole(Role.ROLE_ADMIN);
                        admin2.setSenhaHash(passwordEncoder.encode("admin123"));
                        usuarioRepository.save(admin2);
                }

                // 2. Criar Usuários Concorrentes de Demonstração
                Usuario user1 = usuarioRepository.findByCpf("12345678901").orElseGet(() -> {
                        Usuario u = Usuario.builder()
                                        .cpf("12345678901")
                                        .nome("Carlos Eduardo Silva")
                                        .dataNascimento(LocalDate.of(1995, 5, 12))
                                        .telefone("11987654321")
                                        .senhaHash(passwordEncoder.encode("user123"))
                                        .role(Role.ROLE_USER)
                                        .build();
                        return usuarioRepository.save(u);
                });

                Usuario user2 = usuarioRepository.findByCpf("98765432100").orElseGet(() -> {
                        Usuario u = Usuario.builder()
                                        .cpf("98765432100")
                                        .nome("Mariana Souza Oliveira")
                                        .dataNascimento(LocalDate.of(1998, 8, 24))
                                        .telefone("21976543210")
                                        .senhaHash(passwordEncoder.encode("user123"))
                                        .role(Role.ROLE_USER)
                                        .build();
                        return usuarioRepository.save(u);
                });

                Usuario user3 = usuarioRepository.findByCpf("55544433322").orElseGet(() -> {
                        Usuario u = Usuario.builder()
                                        .cpf("55544433322")
                                        .nome("Lucas Gabriel Ferreira")
                                        .dataNascimento(LocalDate.of(2001, 11, 3))
                                        .telefone("31988887777")
                                        .senhaHash(passwordEncoder.encode("user123"))
                                        .role(Role.ROLE_USER)
                                        .build();
                        return usuarioRepository.save(u);
                });

                // 3. Criar Rifas Iniciais se a base estiver vazia
                if (rifaRepository.count() == 0) {
                        log.info("Cadastrando rifas demonstrativas de alta conversão...");

                        // Rifa 1 - Ao Vivo / Contagem Regressiva Ativa
                        Rifa r1 = Rifa.builder()
                                        .titulo("Toyota Hilux GR-Sport 2024 0km ou R$ 330.000 no PIX")
                                        .subtitulo("A mais potente e bruta da categoria. Emplacada e com frete grátis para todo o Brasil!")
                                        .descricao("Concorra a uma incrível Toyota Hilux GR-Sport V6 Diesel 0km com interior em couro alcântara, som JBL e suspensão esportiva recalibrada. Se preferir, leve R$ 330.000,00 limpos e livres de impostos diretamente no seu PIX no mesmo dia!")
                                        .precoCota(new BigDecimal("0.35"))
                                        .totalCotas(100000)
                                        .cotasVendidas(74200)
                                        .status(StatusRifa.ATIVA)
                                        .dataHoraSorteio(LocalDateTime.now().plusHours(4).plusMinutes(25))
                                        .regraSorteioTipo(RegraSorteioTipo.ALEATORIO)
                                        .build();
                        r1 = rifaRepository.save(r1);

                        salvarImagem(r1, "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
                                        0, true);
                        salvarImagem(r1, "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
                                        1, false);

                        // Rifa 2 - Super Destaque
                        Rifa r2 = Rifa.builder()
                                        .titulo("BMW 320i M Sport 2024 + R$ 50.000 na Conta")
                                        .subtitulo("Sedan esportivo de luxo com IPVA pago e R$ 50 mil para gastar como quiser.")
                                        .descricao("O clássico esportivo alemão na versão top de linha M Sport, faróis Laserlight, cockpit digital de 14.9 polegadas, teto solar e motor TwinPower Turbo. Já sai com tanque cheio e documentação 100% quitada!")
                                        .precoCota(new BigDecimal("0.49"))
                                        .totalCotas(80000)
                                        .cotasVendidas(48900)
                                        .status(StatusRifa.ATIVA)
                                        .dataHoraSorteio(LocalDateTime.now().plusDays(1).plusHours(20))
                                        .regraSorteioTipo(RegraSorteioTipo.ALEATORIO)
                                        .build();
                        r2 = rifaRepository.save(r2);

                        salvarImagem(r2, "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
                                        0, true);
                        salvarImagem(r2, "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
                                        1, false);

                        // Rifa 3 - Tecnologia Rápida
                        Rifa r3 = Rifa.builder()
                                        .titulo("Combo Apple: iPhone 16 Pro Max 1TB + Watch Ultra 2")
                                        .subtitulo("Os melhores gadgets da Apple no menor valor de cota do Brasil.")
                                        .descricao("O smartphone mais potente do mundo com chip A18 Pro, câmera Fusion 48MP e acabamento em titânio aeroespacial, acompanhado do smartwatch indestrutível Apple Watch Ultra 2 com tela de 3000 nits.")
                                        .precoCota(new BigDecimal("0.19"))
                                        .totalCotas(25000)
                                        .cotasVendidas(18340)
                                        .status(StatusRifa.ATIVA)
                                        .dataHoraSorteio(LocalDateTime.now().plusDays(2).plusHours(14))
                                        .regraSorteioTipo(RegraSorteioTipo.ALEATORIO)
                                        .build();
                        r3 = rifaRepository.save(r3);

                        salvarImagem(r3, "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1200&q=80",
                                        0, true);
                        salvarImagem(r3, "https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=1200&q=80",
                                        1, false);

                        // Rifa 4 - Em Breve
                        Rifa r4 = Rifa.builder()
                                        .titulo("Porsche 911 Carrera S ou R$ 800.000 no PIX")
                                        .subtitulo("O esportivo dos sonhos com motor Boxer biturbo de 450cv.")
                                        .descricao("Ação especial de fim de ano! O maior prêmio da história da plataforma de rifas. Apenas cotas limitadas com chances astronômicas de vitória.")
                                        .precoCota(new BigDecimal("0.99"))
                                        .totalCotas(500000)
                                        .cotasVendidas(0)
                                        .status(StatusRifa.EM_BREVE)
                                        .dataHoraSorteio(LocalDateTime.now().plusDays(15).plusHours(20))
                                        .regraSorteioTipo(RegraSorteioTipo.ALEATORIO)
                                        .build();
                        r4 = rifaRepository.save(r4);

                        salvarImagem(r4, "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80",
                                        0, true);

                        // Gerar pedidos e cotas de amostra para r1
                        criarPedidoECotas(r1, user1, 10, "00142");
                        criarPedidoECotas(r1, user2, 25, "00889");
                        criarPedidoECotas(r1, user3, 50, "01540");

                        // 4. Criar Rifas Encerradas para o Histórico Público dos Últimos 10 Sorteios
                        criarHistoricoDemo("Yamaha MT-09 ABS 0km", "00432", user1, LocalDateTime.now().minusDays(1),
                                        "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80");
                        criarHistoricoDemo("Jet Ski Sea-Doo Spark Trixx", "01948", user2,
                                        LocalDateTime.now().minusDays(3),
                                        "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80");
                        criarHistoricoDemo("Honda Civic Touring Turbo", "08712", user3,
                                        LocalDateTime.now().minusDays(6),
                                        "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80");
                        criarHistoricoDemo("MacBook Pro M3 Max 64GB", "03411", user1, LocalDateTime.now().minusDays(9),
                                        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80");
                        criarHistoricoDemo("PlayStation 5 Pro + TV 65 Oled", "00593", user2,
                                        LocalDateTime.now().minusDays(12),
                                        "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80");
                        criarHistoricoDemo("R$ 50.000 direto no PIX", "02781", user3, LocalDateTime.now().minusDays(15),
                                        "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=800&q=80");
                        criarHistoricoDemo("Chevrolet Tracker Premier 0km", "06120", user1,
                                        LocalDateTime.now().minusDays(18),
                                        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80");
                        criarHistoricoDemo("Moto BMW F 850 GS Adventure", "04391", user2,
                                        LocalDateTime.now().minusDays(22),
                                        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80");
                        criarHistoricoDemo("R$ 30.000 direto no PIX", "01209", user3, LocalDateTime.now().minusDays(25),
                                        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80");
                        criarHistoricoDemo("iPhone 15 Pro Max 512GB", "00823", user1, LocalDateTime.now().minusDays(29),
                                        "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=800&q=80");

                        log.info("Base de dados demonstrativa inicializada com sucesso!");
                }
        }

        private void salvarImagem(Rifa r, String url, int ordem, boolean destaque) {
                RifaImagem img = RifaImagem.builder()
                                .rifa(r)
                                .urlImagem(url)
                                .ordem(ordem)
                                .destaque(destaque)
                                .build();
                rifaImagemRepository.save(img);
        }

        private void criarPedidoECotas(Rifa r, Usuario u, int qtd, String numExemplo) {
                Pedido p = Pedido.builder()
                                .codigoPedido("PED-INIT-" + u.getId() + "-" + qtd)
                                .usuario(u)
                                .rifa(r)
                                .quantidade(qtd)
                                .valorTotal(r.getPrecoCota().multiply(BigDecimal.valueOf(qtd)))
                                .statusPagamento(StatusPagamento.PAGO)
                                .dataCompra(LocalDateTime.now().minusHours(2))
                                .dataPagamento(LocalDateTime.now().minusHours(2))
                                .build();
                p = pedidoRepository.save(p);

                NumeroCota cota = NumeroCota.builder()
                                .pedido(p)
                                .rifa(r)
                                .usuario(u)
                                .numero(numExemplo)
                                .dataGeracao(LocalDateTime.now())
                                .build();
                numeroCotaRepository.save(cota);
        }

        private void criarHistoricoDemo(String titulo, String numSorteado, Usuario ganhador, LocalDateTime data,
                        String imgUrl) {
                Rifa r = Rifa.builder()
                                .titulo(titulo)
                                .subtitulo("Sorteio oficial realizado pela Loteria Federal")
                                .descricao("Apresentação e entrega oficial do prêmio ao vencedor com transmissão ao vivo.")
                                .precoCota(new BigDecimal("0.25"))
                                .totalCotas(50000)
                                .cotasVendidas(50000)
                                .status(StatusRifa.ENCERRADA)
                                .dataHoraSorteio(data)
                                .regraSorteioTipo(RegraSorteioTipo.ALEATORIO)
                                .ganhador(ganhador)
                                .numeroSorteado(numSorteado)
                                .build();
                r = rifaRepository.save(r);
                salvarImagem(r, imgUrl, 0, true);

                HistoricoSorteio hist = HistoricoSorteio.builder()
                                .rifa(r)
                                .usuarioGanhador(ganhador)
                                .numeroSorteado(numSorteado)
                                .dataHoraExecucao(data)
                                .hashComprovante(java.util.UUID.randomUUID().toString().replace("-", "")
                                                + java.util.UUID.randomUUID().toString().replace("-", ""))
                                .regraUtilizada(RegraSorteioTipo.ALEATORIO)
                                .build();
                historicoSorteioRepository.save(hist);
        }
}
