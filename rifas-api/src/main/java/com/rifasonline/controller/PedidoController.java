package com.rifasonline.controller;

import com.rifasonline.dto.ComprarCotasRequest;
import com.rifasonline.dto.PedidoResponseDTO;
import com.rifasonline.model.Usuario;
import com.rifasonline.service.AuthService;
import com.rifasonline.service.PedidoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PedidoService pedidoService;
    private final AuthService authService;

    public PedidoController(PedidoService pedidoService, AuthService authService) {
        this.pedidoService = pedidoService;
        this.authService = authService;
    }

    @PostMapping("/comprar")
    public ResponseEntity<PedidoResponseDTO> comprarCotas(@Valid @RequestBody ComprarCotasRequest request) {
        Usuario usuario = authService.getAuthenticatedUser();
        if (usuario == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(pedidoService.criarPedidoCompra(request, usuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PedidoResponseDTO> obterPedido(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.obterPedido(id));
    }

    /**
     * Endpoint para simulação de confirmação instantânea de Pix ou Webhook bancário
     */
    @PostMapping("/{id}/simular-pagamento")
    public ResponseEntity<PedidoResponseDTO> simularPagamento(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.confirmarPagamento(id));
    }

    @GetMapping("/meus-pedidos")
    public ResponseEntity<List<PedidoResponseDTO>> listarMeusPedidos() {
        Usuario usuario = authService.getAuthenticatedUser();
        if (usuario == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(pedidoService.listarMeusPedidos(usuario));
    }
}
