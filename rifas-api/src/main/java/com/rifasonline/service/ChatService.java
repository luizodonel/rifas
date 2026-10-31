package com.rifasonline.service;

import com.rifasonline.dto.EnviarMensagemRequest;
import com.rifasonline.dto.MensagemChatDTO;
import com.rifasonline.dto.ResponderChatRequest;
import com.rifasonline.dto.SessaoChatDTO;
import com.rifasonline.model.MensagemChat;
import com.rifasonline.model.Usuario;
import com.rifasonline.repository.MensagemChatRepository;
import com.rifasonline.repository.UsuarioRepository;
import com.rifasonline.util.MaskUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final MensagemChatRepository chatRepository;
    private final UsuarioRepository usuarioRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatService(MensagemChatRepository chatRepository,
                       UsuarioRepository usuarioRepository,
                       SimpMessagingTemplate messagingTemplate) {
        this.chatRepository = chatRepository;
        this.usuarioRepository = usuarioRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public MensagemChatDTO enviarMensagemCliente(EnviarMensagemRequest req, String userCpf) {
        String sessaoId = req.getSessaoId();
        if (sessaoId == null || sessaoId.isBlank()) {
            sessaoId = "SESS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        Usuario usuario = null;
        String nome = req.getNomeRemetente();

        if (userCpf != null && !userCpf.isBlank()) {
            usuario = usuarioRepository.findByCpf(userCpf).orElse(null);
            if (usuario != null) {
                nome = usuario.getNome();
            }
        }

        if (nome == null || nome.isBlank()) {
            nome = "Visitante " + sessaoId.substring(Math.max(0, sessaoId.length() - 4));
        }

        MensagemChat msg = MensagemChat.builder()
                .sessaoId(sessaoId)
                .usuario(usuario)
                .nomeRemetente(nome)
                .remetenteAdmin(false)
                .conteudo(req.getConteudo().trim())
                .lida(false)
                .createdAt(LocalDateTime.now())
                .build();

        msg = chatRepository.save(msg);
        MensagemChatDTO dto = mapToDTO(msg);

        // Notifica o cliente na sessão e o painel de administradores em tempo real
        try {
            messagingTemplate.convertAndSend("/topic/chat/" + sessaoId, dto);
            messagingTemplate.convertAndSend("/topic/admin/chat", dto);
        } catch (Exception e) {
            log.error("Erro ao emitir evento de chat via WebSocket: {}", e.getMessage());
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public List<MensagemChatDTO> obterMensagensCliente(String sessaoId) {
        return chatRepository.findBySessaoIdOrderByCreatedAtAsc(sessaoId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<MensagemChatDTO> obterMensagensAdmin(String sessaoId) {
        List<MensagemChat> msgs = chatRepository.findBySessaoIdOrderByCreatedAtAsc(sessaoId);
        // Marca mensagens do cliente como lidas pelo suporte
        for (MensagemChat m : msgs) {
            if (!m.isRemetenteAdmin() && !m.isLida()) {
                m.setLida(true);
                chatRepository.save(m);
            }
        }
        return msgs.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public MensagemChatDTO responderPeloAdmin(ResponderChatRequest req, String adminNome) {
        String sessaoId = req.getSessaoId();
        String nome = (adminNome != null && !adminNome.isBlank()) ? adminNome : "Suporte Oficial";

        MensagemChat msg = MensagemChat.builder()
                .sessaoId(sessaoId)
                .nomeRemetente(nome)
                .remetenteAdmin(true)
                .conteudo(req.getResposta().trim())
                .lida(false)
                .createdAt(LocalDateTime.now())
                .build();

        msg = chatRepository.save(msg);
        MensagemChatDTO dto = mapToDTO(msg);

        // Notifica cliente e admin
        try {
            messagingTemplate.convertAndSend("/topic/chat/" + sessaoId, dto);
            messagingTemplate.convertAndSend("/topic/admin/chat", dto);
        } catch (Exception e) {
            log.error("Erro ao emitir resposta de chat via WebSocket: {}", e.getMessage());
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public List<SessaoChatDTO> listarSessoesAdmin() {
        List<String> sessaoIds = chatRepository.findDistinctSessaoIds();
        List<SessaoChatDTO> resultado = new ArrayList<>();

        for (String sessaoId : sessaoIds) {
            MensagemChat ultima = chatRepository.findTop1BySessaoIdOrderByCreatedAtDesc(sessaoId);
            if (ultima != null) {
                long naoLidas = chatRepository.countBySessaoIdAndLidaFalseAndRemetenteAdminFalse(sessaoId);

                String nomeCliente = ultima.getNomeRemetente();
                String cpfCliente = null;

                // Tenta buscar se algum autor da sessão tem vínculo com usuário
                List<MensagemChat> todas = chatRepository.findBySessaoIdOrderByCreatedAtAsc(sessaoId);
                for (MensagemChat m : todas) {
                    if (m.getUsuario() != null) {
                        nomeCliente = m.getUsuario().getNome();
                        cpfCliente = MaskUtils.formatarCpf(m.getUsuario().getCpf());
                        break;
                    }
                }

                resultado.add(SessaoChatDTO.builder()
                        .sessaoId(sessaoId)
                        .nomeCliente(nomeCliente)
                        .cpfCliente(cpfCliente)
                        .ultimaMensagem(ultima.getConteudo())
                        .dataUltimaMensagem(ultima.getCreatedAt())
                        .naoLidas(naoLidas)
                        .build());
            }
        }

        // Ordena pela mensagem mais recente primeiro
        resultado.sort((a, b) -> {
            if (a.getDataUltimaMensagem() == null) return 1;
            if (b.getDataUltimaMensagem() == null) return -1;
            return b.getDataUltimaMensagem().compareTo(a.getDataUltimaMensagem());
        });

        return resultado;
    }

    private MensagemChatDTO mapToDTO(MensagemChat m) {
        return MensagemChatDTO.builder()
                .id(m.getId())
                .sessaoId(m.getSessaoId())
                .nomeRemetente(m.getNomeRemetente())
                .remetenteAdmin(m.isRemetenteAdmin())
                .conteudo(m.getConteudo())
                .lida(m.isLida())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
