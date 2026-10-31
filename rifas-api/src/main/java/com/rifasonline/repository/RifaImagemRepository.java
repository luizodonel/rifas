package com.rifasonline.repository;

import com.rifasonline.model.RifaImagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RifaImagemRepository extends JpaRepository<RifaImagem, Long> {
    List<RifaImagem> findByRifaIdOrderByOrdemAsc(Long rifaId);
}

