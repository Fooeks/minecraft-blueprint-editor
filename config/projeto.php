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

function excluirProjeto(PDO $pdo, string $uuid, string $idProjeto): void
{
    $stmt = $pdo->prepare(
        'DELETE FROM projeto
         WHERE id_projeto = :id_projeto
           AND id_visitante = :id_visitante'
    );
    $stmt->execute([
        ':id_projeto'    => $idProjeto,
        ':id_visitante'  => $uuid,
    ]);
}

function apagarCelulas(PDO $pdo, string $idProjeto): void
{
    $stmt = $pdo->prepare(
        'DELETE FROM celula
         WHERE id_camada IN (
             SELECT id_camada
             FROM camada_y
             WHERE id_projeto = :id_projeto
         )'
    );
    $stmt->execute([':id_projeto' => $idProjeto]);
}

function apagarCamadasYAcima(PDO $pdo, string $idProjeto, int $maiorCamada): void
{
    $stmt = $pdo->prepare(
        'DELETE FROM camada_y
         WHERE id_projeto = :id_projeto
           AND nivel_y > :maior_camada'
    );
    $stmt->execute([
        ':id_projeto'    => $idProjeto,
        ':maior_camada' => $maiorCamada,
    ]);
}

function criarCamadasYMeio(PDO $pdo, string $idProjeto, int $maiorCamada): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO camada_y (id_projeto, nivel_y)
         VALUES (:id_projeto, :nivel_y)
         ON DUPLICATE KEY UPDATE nivel_y = nivel_y'
    );

    for ($nivelY = 1; $nivelY <= $maiorCamada; $nivelY++) {
        $stmt->execute([
            ':id_projeto' => $idProjeto,
            ':nivel_y'     => $nivelY,
        ]);
    }
}

function buscarIdsCamadaY(PDO $pdo, string $idProjeto): array
{
    $stmt = $pdo->prepare(
        'SELECT nivel_y, id_camada
         FROM camada_y
         WHERE id_projeto = :id_projeto'
    );
    $stmt->execute([':id_projeto' => $idProjeto]);

    $ids = [];

    foreach ($stmt->fetchAll() as $camada) {
        $ids[(int) $camada['nivel_y']] = (int) $camada['id_camada'];
    }

    return $ids;
}

function inserirCelulas(PDO $pdo, int $idCamadaY, array $celulas): void
{
    $tamanhoMaximo = 1000;

    foreach (array_chunk($celulas, $tamanhoMaximo) as $lista) {
        $valores = [];
        $parametros = [];

        foreach ($lista as $i => $celula) {
            $valores[] = "(:id_camada_$i, :posicao_x_$i, :posicao_z_$i, :cor_$i)";
            $parametros[":id_camada_$i"] = $idCamadaY;
            $parametros[":posicao_x_$i"] = $celula[0];
            $parametros[":posicao_z_$i"] = $celula[1];
            $parametros[":cor_$i"]       = $celula[2];
        }

        $stmt = $pdo->prepare(
            'INSERT INTO celula (id_camada, posicao_x, posicao_z, cor)
             VALUES ' . implode(', ', $valores)
        );
        $stmt->execute($parametros);
    }
}

function atualizarDataProjeto(PDO $pdo, string $idProjeto): void
{
    $stmt = $pdo->prepare(
        'UPDATE projeto
         SET data_atualizacao = NOW()
         WHERE id_projeto = :id_projeto'
    );
    $stmt->execute([':id_projeto' => $idProjeto]);
}

function buscarCamadasY(PDO $pdo, string $idProjeto): array
{
    $stmt = $pdo->prepare(
        'SELECT camada_y.nivel_y, celula.cor, celula.posicao_x, celula.posicao_z
         FROM celula
         INNER JOIN camada_y ON camada_y.id_camada = celula.id_camada
         WHERE camada_y.id_projeto = :id_projeto
         ORDER BY camada_y.nivel_y'
    );
    $stmt->execute([':id_projeto' => $idProjeto]);

    $agrupadas = [];

    foreach ($stmt as $registro) {
        $nivelY   = (int) $registro['nivel_y'];
        $cor = $registro['cor'];
        $posicao  = (int) $registro['posicao_x'] * 1000 + (int) $registro['posicao_z'];

        $agrupadas[$nivelY][$cor][] = $posicao;
    }

    $camadasY = [];

    foreach ($agrupadas as $nivelY => $porCor) {
        $cores = [];

        foreach ($porCor as $cor => $posicoes) {
            $cores[] = [
                'cor' => $cor,
                'posicoes' => $posicoes,
            ];
        }

        $camadasY[] = [
            'nivelY' => $nivelY,
            'cores' => $cores,
        ];
    }

    return $camadasY;
}