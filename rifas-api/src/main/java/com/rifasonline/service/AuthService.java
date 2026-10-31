package com.rifasonline.service;

import com.rifasonline.config.JwtTokenProvider;
import com.rifasonline.dto.*;
import com.rifasonline.model.Role;
import com.rifasonline.model.Usuario;
import com.rifasonline.repository.UsuarioRepository;
import com.rifasonline.util.MaskUtils;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UsuarioRepository usuarioRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    public CheckCpfResponse checkCpf(String cpfRaw) {
        String cleanCpf = cpfRaw != null ? cpfRaw.replaceAll("\\D", "") : "";
        if (cleanCpf.length() != 11) {
            throw new IllegalArgumentException("CPF inválido. Deve conter 11 dígitos numéricos.");
        }

        return usuarioRepository.findByCpf(cleanCpf)
                .map(u -> CheckCpfResponse.builder()
                        .cadastrado(true)
                        .cpf(cleanCpf)
                        .nome(u.getNome().split(" ")[0])
                        .build())
                .orElseGet(() -> CheckCpfResponse.builder()
                        .cadastrado(false)
                        .cpf(cleanCpf)
                        .nome(null)
                        .build());
    }

    public AuthResponse login(LoginRequest request) {
        String cleanCpf = request.getCpf().replaceAll("\\D", "");
        Usuario usuario = usuarioRepository.findByCpf(cleanCpf)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado com o CPF informado."));

        if (!passwordEncoder.matches(request.getSenha(), usuario.getSenhaHash())) {
            throw new BadCredentialsException("Senha incorreta.");
        }

        String token = tokenProvider.generateToken(usuario);
        return AuthResponse.builder()
                .token(token)
                .usuario(mapToSummary(usuario))
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String cleanCpf = request.getCpf().replaceAll("\\D", "");
        if (cleanCpf.length() != 11) {
            throw new IllegalArgumentException("CPF inválido. Deve possuir 11 dígitos.");
        }

        if (usuarioRepository.existsByCpf(cleanCpf)) {
            throw new IllegalArgumentException("Este CPF já está cadastrado. Por favor, faça login com sua senha.");
        }

        Usuario novoUsuario = Usuario.builder()
                .cpf(cleanCpf)
                .nome(request.getNome().trim())
                .dataNascimento(request.getDataNascimento())
                .telefone(request.getTelefone().replaceAll("\\D", ""))
                .senhaHash(passwordEncoder.encode(request.getSenha()))
                .role(Role.ROLE_USER)
                .build();

        novoUsuario = usuarioRepository.save(novoUsuario);

        String token = tokenProvider.generateToken(novoUsuario);
        return AuthResponse.builder()
                .token(token)
                .usuario(mapToSummary(novoUsuario))
                .build();
    }

    public Usuario getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            return null;
        }

        if (auth.getPrincipal() instanceof Usuario u) {
            return u;
        }

        String cpf = auth.getName();
        return usuarioRepository.findByCpf(cpf).orElse(null);
    }

    public UsuarioSummaryDTO mapToSummary(Usuario u) {
        return UsuarioSummaryDTO.builder()
                .id(u.getId())
                .nome(u.getNome())
                .cpf(u.getCpf())
                .cpfFormatado(MaskUtils.formatarCpf(u.getCpf()))
                .telefone(MaskUtils.formatarTelefone(u.getTelefone()))
                .dataNascimento(u.getDataNascimento())
                .role(u.getRole().name())
                .build();
    }
}

