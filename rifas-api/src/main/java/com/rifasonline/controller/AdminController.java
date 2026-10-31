package com.rifasonline.controller;

import com.rifasonline.dto.*;
import com.rifasonline.model.Usuario;
import com.rifasonline.service.AuthService;
import com.rifasonline.service.RifaService;
import com.rifasonline.service.SorteioService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    private final RifaService rifaService;
    private final SorteioService sorteioService;
    private final AuthService authService;

    public AdminController(RifaService rifaService,
                           SorteioService sorteioService,
                           AuthService authService) {
        this.rifaService = rifaService;
        this.sorteioService = sorteioService;
        this.authService = authService;
    }

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

    /**
     * Botão exclusivo do Admin: "Sortear Agora"
     */
    @PostMapping("/rifas/{id}/sortear")
    public ResponseEntity<SorteioPublicoDTO> sortearAgora(@PathVariable Long id) {
        return ResponseEntity.ok(sorteioService.executarSorteio(id, true));
    }

    /**
     * Visualização irrestrita de todos os dados do ganhador (apenas para o Admin)
     */
    @GetMapping("/sorteio/{rifaId}")
    public ResponseEntity<SorteioAdminDTO> obterDadosCompletosSorteio(@PathVariable Long rifaId) {
        SorteioAdminDTO dto = sorteioService.obterSorteioAdmin(rifaId);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }
}

