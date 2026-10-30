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

function listarProjetos(PDO $pdo, string $uuid): array
{
    $sql = "SELECT id_projeto AS idProjeto,
                   nome,
                   DATE_FORMAT(data_atualizacao, '%Y-%m-%dT%H:%i:%sZ') AS dataAtualizacao
            FROM projeto
            WHERE id_visitante = :id_visitante
            ORDER BY data_atualizacao DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id_visitante' => $uuid]);

    return $stmt->fetchAll();
}

function buscarProjeto(PDO $pdo, string $uuid, string $idProjeto): ?array
{
    $sql = "SELECT id_projeto AS idProjeto,
                   nome,
                   dimensao_x AS dimensaoX,
                   dimensao_z AS dimensaoZ
            FROM projeto
            WHERE id_projeto = :id_projeto
              AND id_visitante = :id_visitante";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id_projeto'   => $idProjeto,
        ':id_visitante' => $uuid,
    ]);

    $linha = $stmt->fetch();

    if ($linha === false) {
        return null;
    }

    return [
        'idProjeto' => $linha['idProjeto'],
        'nome'    => $linha['nome'],
        'dimensaoX'  => (int) $linha['dimensaoX'],
        'dimensaoZ'  => (int) $linha['dimensaoZ'],
    ];
}