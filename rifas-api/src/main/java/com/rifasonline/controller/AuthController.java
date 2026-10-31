package com.rifasonline.controller;

import com.rifasonline.dto.*;
import com.rifasonline.model.Usuario;
import com.rifasonline.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/check-cpf")
    public ResponseEntity<CheckCpfResponse> checkCpf(@Valid @RequestBody CheckCpfRequest request) {
        return ResponseEntity.ok(authService.checkCpf(request.getCpf()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioSummaryDTO> me() {
        Usuario usuario = authService.getAuthenticatedUser();
        if (usuario == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(authService.mapToSummary(usuario));
    }
}
