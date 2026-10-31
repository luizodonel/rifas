package com.rifasonline.repository;

import com.rifasonline.model.HistoricoSorteio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HistoricoSorteioRepository extends JpaRepository<HistoricoSorteio, Long> {
    List<HistoricoSorteio> findTop10ByOrderByDataHoraExecucaoDesc();
    Optional<HistoricoSorteio> findByRifaId(Long rifaId);
}
