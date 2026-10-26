<?php

function inserirProjeto(PDO $pdo, string $uuid, string $nome, int $dimensaoX, int $dimensaoZ): string
{
    $idProjeto = gerarID();
    $stmt = $pdo->prepare(
        'INSERT INTO projeto (id_projeto, id_visitante, nome, dimensao_x, dimensao_z)
         VALUES (:id_projeto, :id_visitante, :nome, :dimensao_x, :dimensao_z)'
    );
    $stmt->execute([
        ':id_projeto'    => $idProjeto,
        ':id_visitante'  => $uuid,
        ':nome'          => $nome,
        ':dimensao_x'    => $dimensaoX,
        ':dimensao_z'    => $dimensaoZ,
    ]);

    return $idProjeto;
}

function inserirCamadaY(PDO $pdo, string $idProjeto, int $nivelY): int
{
    $stmt = $pdo->prepare(
        'INSERT INTO camada_y (id_projeto, nivel_y)
         VALUES (:id_projeto, :nivel_y)'
    );
    $stmt->execute([
        ':id_projeto' => $idProjeto,
        ':nivel_y'    => $nivelY,
    ]);

    return (int) $pdo->lastInsertId();
}