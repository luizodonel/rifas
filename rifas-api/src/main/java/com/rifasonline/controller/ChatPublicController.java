package com.rifasonline.controller;

import com.rifasonline.dto.EnviarMensagemRequest;
import com.rifasonline.dto.MensagemChatDTO;
import com.rifasonline.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/chat")
public class ChatPublicController {

    private final ChatService chatService;

    public ChatPublicController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/enviar")
    public ResponseEntity<MensagemChatDTO> enviarMensagem(@Valid @RequestBody EnviarMensagemRequest req,
                                                         Authentication auth) {
        String cpf = (auth != null && auth.isAuthenticated()) ? auth.getName() : req.getCpf();
        MensagemChatDTO resposta = chatService.enviarMensagemCliente(req, cpf);
        return ResponseEntity.ok(resposta);
    }

    @GetMapping("/mensagens/{sessaoId}")
    public ResponseEntity<List<MensagemChatDTO>> obterMensagens(@PathVariable String sessaoId) {
        return ResponseEntity.ok(chatService.obterMensagensCliente(sessaoId));
    }
}
