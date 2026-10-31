package com.rifasonline.repository;

import com.rifasonline.model.NumeroCota;
import com.rifasonline.model.Pedido;
import com.rifasonline.model.Rifa;
import com.rifasonline.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NumeroCotaRepository extends JpaRepository<NumeroCota, Long> {
    List<NumeroCota> findByRifa(Rifa rifa);
    List<NumeroCota> findByRifaAndUsuario(Rifa rifa, Usuario usuario);
    List<NumeroCota> findByPedido(Pedido pedido);
    boolean existsByRifaAndNumero(Rifa rifa, String numero);
    long countByRifa(Rifa rifa);

    @Query("SELECT DISTINCT c.usuario FROM NumeroCota c WHERE c.rifa = :rifa")
    List<Usuario> findDistinctUsuariosByRifa(@Param("rifa") Rifa rifa);

    @Query("SELECT c.numero FROM NumeroCota c WHERE c.rifa = :rifa")
    List<String> findNumerosByRifa(@Param("rifa") Rifa rifa);

    @Query("SELECT c FROM NumeroCota c WHERE c.rifa = :rifa AND c.usuario.cpf = :cpf")
    List<NumeroCota> findByRifaAndUsuarioCpf(@Param("rifa") Rifa rifa, @Param("cpf") String cpf);
}

