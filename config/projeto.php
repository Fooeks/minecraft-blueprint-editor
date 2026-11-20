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

function apagarFormas(PDO $pdo, string $idProjeto): void
{
    $stmt = $pdo->prepare(
        'DELETE FROM forma
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
            $valores[] = "(:id_camada_$i, :posicao_x_$i, :posicao_z_$i, :cor_$i, :id_forma_$i)";
            $parametros[":id_camada_$i"] = $idCamadaY;
            $parametros[":posicao_x_$i"] = $celula[0];
            $parametros[":posicao_z_$i"] = $celula[1];
            $parametros[":cor_$i"]       = $celula[2];
            $parametros[":id_forma_$i"]  = $celula[3];
        }

        $stmt = $pdo->prepare(
            'INSERT INTO celula (id_camada, posicao_x, posicao_z, cor, id_forma)
             VALUES ' . implode(', ', $valores)
        );
        $stmt->execute($parametros);
    }
}

function inserirForma(PDO $pdo, int $idCamadaY, array $forma): int
{
    $stmt = $pdo->prepare(
        'INSERT INTO forma (id_camada, tipo, posicao_x, posicao_z, dimensao_x, dimensao_z, rotacao, quantidade_lados, expoente, estilo, cor, bloqueado)
         VALUES (:id_camada, :tipo, :posicao_x, :posicao_z, :dimensao_x, :dimensao_z, :rotacao, :quantidade_lados, :expoente, :estilo, :cor, :bloqueado)'
    );
    $stmt->execute([
        ':id_camada'        => $idCamadaY,
        ':tipo'             => $forma['tipo'],
        ':posicao_x'        => $forma['posicaoX'],
        ':posicao_z'        => $forma['posicaoZ'],
        ':dimensao_x'       => $forma['dimensaoX'],
        ':dimensao_z'       => $forma['dimensaoZ'],
        ':rotacao'          => $forma['rotacao'],
        ':quantidade_lados' => $forma['lados'],
        ':expoente'         => $forma['expoente'],
        ':estilo'           => $forma['estilo'],
        ':cor'              => $forma['cor'],
        ':bloqueado'        => (int) $forma['bloqueado'],
    ]);

    return (int) $pdo->lastInsertId();
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
        'SELECT camada_y.nivel_y, celula.cor, celula.posicao_x, celula.posicao_z, celula.id_forma
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
        $idForma = (int) $registro['id_forma'];

        $agrupadas[$nivelY][$idForma][$cor][] = $posicao;
    }

    $camadasY = [];

    foreach ($agrupadas as $nivelY => $porForma) {
        $cores = [];
        $celulasDasFormas = [];

        foreach ($porForma as $idForma => $porCor) {
            $lista = [];

            foreach ($porCor as $cor => $posicoes) {
                $lista[] = [
                    'cor' => $cor,
                    'posicoes' => $posicoes,
                ];
            }

            if ($idForma === 0) {
                $cores = $lista;
            } else {
                $celulasDasFormas[] = ['idForma' => $idForma, 'cores' => $lista];
            }
        }

        $camadasY[] = [
            'nivelY'           => $nivelY,
            'cores'            => $cores,
            'celulasDasFormas' => $celulasDasFormas,
        ];
    }

    return $camadasY;
}

function buscarFormas(PDO $pdo, string $idProjeto): array
{
    $stmt = $pdo->prepare(
        'SELECT camada_y.nivel_y AS nivelY,
                forma.id_forma AS idForma,
                forma.tipo,
                forma.posicao_x AS posicaoX,
                forma.posicao_z AS posicaoZ,
                forma.dimensao_x AS dimensaoX,
                forma.dimensao_z AS dimensaoZ,
                forma.rotacao,
                forma.quantidade_lados AS lados,
                forma.expoente,
                forma.estilo,
                forma.cor,
                forma.bloqueado
         FROM forma
         INNER JOIN camada_y ON camada_y.id_camada = forma.id_camada
         WHERE camada_y.id_projeto = :id_projeto
         ORDER BY forma.id_forma'
    );
    $stmt->execute([':id_projeto' => $idProjeto]);

    return $stmt->fetchAll();
}

function converterForma(array $linha, int $idForma, array $cores): array
{
    return [
        'idForma'   => $idForma,
        'tipo'      => $linha['tipo'],
        'estilo'    => $linha['estilo'],
        'cor'       => $linha['cor'],
        'posicaoX'  => (int) $linha['posicaoX'],
        'posicaoZ'  => (int) $linha['posicaoZ'],
        'dimensaoX' => (int) $linha['dimensaoX'],
        'dimensaoZ' => (int) $linha['dimensaoZ'],
        'rotacao'   => (float) $linha['rotacao'],
        'lados'     => $linha['lados'] === null ? null : (int) $linha['lados'],
        'expoente'  => $linha['expoente'] === null ? null : (float) $linha['expoente'],
        'bloqueado' => (bool) $linha['bloqueado'],
        'cores'     => $cores,
    ];
}

function renumerarFormas(array $linhas): array
{
    $novosIds = [];

    foreach ($linhas as $posicao => $linha) {
        $novosIds[(int) $linha['idForma']] = $posicao + 1;
    }

    return $novosIds;
}

function mapearCoresDasFormas(array $camadasY): array
{
    $coresPorForma = [];

    foreach ($camadasY as $camadaY) {
        foreach ($camadaY['celulasDasFormas'] as $celulasDaForma) {
            $coresPorForma[$celulasDaForma['idForma']] = $celulasDaForma['cores'];
        }
    }

    return $coresPorForma;
}

function montarCamadas(array $camadasY, array $linhasFormas): array
{
    $novosIds = renumerarFormas($linhasFormas);
    $coresPorForma = mapearCoresDasFormas($camadasY);
    $porNivel = [];

    foreach ($camadasY as $camadaY) {
        $porNivel[$camadaY['nivelY']] = [
            'nivelY' => $camadaY['nivelY'],
            'cores'  => $camadaY['cores'],
            'formas' => [],
        ];
    }

    foreach ($linhasFormas as $linha) {
        $nivelY = (int) $linha['nivelY'];
        $idReal = (int) $linha['idForma'];

        if (!isset($porNivel[$nivelY])) {
            $porNivel[$nivelY] = [
                'nivelY' => $nivelY,
                'cores'  => [],
                'formas' => [],
            ];
        }

        $porNivel[$nivelY]['formas'][] = converterForma(
            $linha,
            $novosIds[$idReal],
            $coresPorForma[$idReal] ?? []
        );
    }

    ksort($porNivel);

    return array_values($porNivel);
}