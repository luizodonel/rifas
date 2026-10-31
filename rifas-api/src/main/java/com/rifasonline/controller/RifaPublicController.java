package com.rifasonline.controller;

import com.rifasonline.dto.HistoricoSorteioPublicoDTO;
import com.rifasonline.dto.RifaPublicDTO;
import com.rifasonline.dto.SorteioPublicoDTO;
import com.rifasonline.service.RifaService;
import com.rifasonline.service.SorteioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public")
public class RifaPublicController {

    private final RifaService rifaService;
    private final SorteioService sorteioService;

    public RifaPublicController(RifaService rifaService, SorteioService sorteioService) {
        this.rifaService = rifaService;
        this.sorteioService = sorteioService;
    }

    @GetMapping("/rifas")
    public ResponseEntity<List<RifaPublicDTO>> listarRifas() {
        return ResponseEntity.ok(rifaService.listarRifasPublicas());
    }

    @GetMapping("/rifas/{id}")
    public ResponseEntity<RifaPublicDTO> obterRifa(@PathVariable Long id) {
        return ResponseEntity.ok(rifaService.obterRifaPublica(id));
    }

    @GetMapping("/historico-sorteios")
    public ResponseEntity<List<HistoricoSorteioPublicoDTO>> listarUltimos10Sorteios() {
        return ResponseEntity.ok(sorteioService.listarUltimos10Sorteios());
    }

    @GetMapping("/sorteio-ao-vivo/{rifaId}")
    public ResponseEntity<SorteioPublicoDTO> obterSorteioAoVivo(@PathVariable Long rifaId) {
        return ResponseEntity.ok(sorteioService.obterSorteioPublico(rifaId));
    }
}
