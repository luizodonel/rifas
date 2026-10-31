package com.rifasonline.config;

import com.rifasonline.model.Role;
import com.rifasonline.model.Usuario;
import com.rifasonline.repository.UsuarioRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @PersistenceContext
    private EntityManager entityManager;

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Executando DataInitializer...");

        final String adminCpf = "00741052130";
        final String adminSenha = "00741052130";

        // Verifica se a base já possui o administrador oficial configurado
        boolean precisaZerarBanco = usuarioRepository.findByCpf(adminCpf).isEmpty();

        if (precisaZerarBanco) {
            log.info("Limpando integralmente todos os dados do banco de dados (TRUNCATE CASCADE)...");
            try {
                entityManager.createNativeQuery(
                    "TRUNCATE TABLE historico_sorteios, numeros_cotas, pedidos, rifa_imagens, rifas, usuarios RESTART IDENTITY CASCADE"
                ).executeUpdate();
                log.info("Todas as tabelas do banco de dados foram apagadas com sucesso.");
            } catch (Exception e) {
                log.error("Erro ao executar TRUNCATE CASCADE: {}", e.getMessage());
            }

            // Cadastra o Administrador Oficial
            Usuario admin = Usuario.builder()
                    .cpf(adminCpf)
                    .nome("Administrador")
                    .dataNascimento(LocalDate.of(1985, 1, 1))
                    .telefone("61982261155")
                    .senhaHash(passwordEncoder.encode(adminSenha))
                    .role(Role.ROLE_ADMIN)
                    .build();

            usuarioRepository.save(admin);
            log.info("Administrador oficial (CPF: {}) cadastrado com sucesso!", adminCpf);
        } else {
            // Assegura que as credenciais do admin continuem válidas
            Usuario admin = usuarioRepository.findByCpf(adminCpf).get();
            admin.setNome("Administrador");
            admin.setRole(Role.ROLE_ADMIN);
            admin.setSenhaHash(passwordEncoder.encode(adminSenha));
            usuarioRepository.save(admin);
            log.info("Administrador oficial (CPF: {}) validado com sucesso.", adminCpf);
        }
    }
}
