package com.rifasonline.controller;

import com.rifasonline.dto.*;
import com.rifasonline.model.Usuario;
import com.rifasonline.service.AuthService;
import com.rifasonline.service.ChatService;
import com.rifasonline.service.RifaService;
import com.rifasonline.service.SorteioService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    private final RifaService rifaService;
    private final SorteioService sorteioService;
    private final AuthService authService;
    private final ChatService chatService;

    public AdminController(RifaService rifaService,
                           SorteioService sorteioService,
                           AuthService authService,
                           ChatService chatService) {
        this.rifaService = rifaService;
        this.sorteioService = sorteioService;
        this.authService = authService;
        this.chatService = chatService;
    }

    // ==========================================
    // RIFAS & SORTEIOS
    // ==========================================

    @GetMapping("/rifas")
    public ResponseEntity<List<RifaAdminDTO>> listarRifasAdmin() {
        return ResponseEntity.ok(rifaService.listarRifasAdmin());
    }

    @GetMapping("/rifas/{id}")
    public ResponseEntity<RifaAdminDTO> obterRifaAdmin(@PathVariable Long id) {
        return ResponseEntity.ok(rifaService.obterRifaAdmin(id));
    }

    @PostMapping("/rifas")
    public ResponseEntity<RifaAdminDTO> criarRifa(@Valid @RequestBody CriarRifaRequest request) {
        return ResponseEntity.ok(rifaService.criarRifa(request));
    }

    @PutMapping("/rifas/{id}")
    public ResponseEntity<RifaAdminDTO> atualizarRifa(
            @PathVariable Long id,
            @Valid @RequestBody CriarRifaRequest request) {
        return ResponseEntity.ok(rifaService.atualizarRifa(id, request));
    }

    @DeleteMapping("/rifas/{id}")
    public ResponseEntity<Map<String, Object>> excluirRifa(@PathVariable Long id) {
        rifaService.excluirRifa(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Rifa excluída com sucesso!"));
    }

    @PostMapping("/rifas/{id}/parametrizar-sorteio")
    public ResponseEntity<RifaAdminDTO> parametrizarSorteio(
            @PathVariable Long id,
            @Valid @RequestBody ParametrizarSorteioRequest request) {
        return ResponseEntity.ok(rifaService.parametrizarSorteio(id, request));
    }

    @GetMapping("/rifas/{id}/participantes-aptos")
    public ResponseEntity<List<UsuarioSummaryDTO>> listarParticipantesAptos(@PathVariable Long id) {
        List<Usuario> aptos = rifaService.listarParticipantesAptos(id);
        List<UsuarioSummaryDTO> dtos = aptos.stream()
                .map(authService::mapToSummary)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/rifas/{id}/sortear")
    public ResponseEntity<SorteioPublicoDTO> sortearAgora(@PathVariable Long id) {
        return ResponseEntity.ok(sorteioService.executarSorteio(id, true));
    }

    @GetMapping("/sorteio/{rifaId}")
    public ResponseEntity<SorteioAdminDTO> obterDadosCompletosSorteio(@PathVariable Long rifaId) {
        SorteioAdminDTO dto = sorteioService.obterSorteioAdmin(rifaId);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    // ==========================================
    // GESTÃO DE USUÁRIOS
    // ==========================================

    @GetMapping("/usuarios")
    public ResponseEntity<List<UsuarioAdminDTO>> listarUsuarios() {
        return ResponseEntity.ok(authService.listarTodosUsuarios());
    }

    @PostMapping("/usuarios")
    public ResponseEntity<UsuarioAdminDTO> criarUsuario(@Valid @RequestBody CriarUsuarioAdminRequest request) {
        return ResponseEntity.ok(authService.criarUsuarioPeloAdmin(request));
    }

    @PutMapping("/usuarios/{id}/senha")
    public ResponseEntity<Map<String, Object>> trocarSenha(
            @PathVariable Long id,
            @Valid @RequestBody TrocarSenhaAdminRequest request) {
        authService.trocarSenhaUsuarioPeloAdmin(id, request);
        return ResponseEntity.ok(Map.of("success", true, "message", "Senha alterada com sucesso!"));
    }

    @PutMapping("/usuarios/{id}")
    public ResponseEntity<UsuarioAdminDTO> atualizarUsuario(
            @PathVariable Long id,
            @Valid @RequestBody AtualizarUsuarioAdminRequest request) {
        return ResponseEntity.ok(authService.atualizarUsuarioPeloAdmin(id, request));
    }

    @DeleteMapping("/usuarios/{id}")
    public ResponseEntity<Map<String, Object>> excluirUsuario(@PathVariable Long id) {
        authService.excluirUsuarioPeloAdmin(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Usuário excluído com sucesso!"));
    }

    // ==========================================
    // CHAT DE ATENDIMENTO / SUPORTE INTERNO
    // ==========================================

    @GetMapping("/chat/sessoes")
    public ResponseEntity<List<SessaoChatDTO>> listarSessoesChat() {
        return ResponseEntity.ok(chatService.listarSessoesAdmin());
    }

    @GetMapping("/chat/mensagens/{sessaoId}")
    public ResponseEntity<List<MensagemChatDTO>> obterMensagensSessao(@PathVariable String sessaoId) {
        return ResponseEntity.ok(chatService.obterMensagensAdmin(sessaoId));
    }

    @PostMapping("/chat/responder")
    public ResponseEntity<MensagemChatDTO> responderChat(
            @Valid @RequestBody ResponderChatRequest request,
            Authentication auth) {
        String adminNome = auth != null ? auth.getName() : "Atendente Suporte";
        return ResponseEntity.ok(chatService.responderPeloAdmin(request, adminNome));
    }
}
