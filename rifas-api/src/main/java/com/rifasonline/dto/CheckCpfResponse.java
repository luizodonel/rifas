package com.rifasonline.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckCpfResponse {
    private boolean cadastrado;
    private String cpf;
    private String nome;
}

