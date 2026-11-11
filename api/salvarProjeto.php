<?php

require_once __DIR__ . '/../config/conexao.php';
require_once __DIR__ . '/../config/visitante.php';
require_once __DIR__ . '/../config/projeto.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function corValida(mixed $cor): bool
{
    return is_string($cor) && preg_match('/^#[0-9a-f]{6}$/', $cor) === 1;
}

function posicaoValida(mixed $posicao): bool
{
    return is_int($posicao) && $posicao >= 0;
}

function camadaYValida(mixed $camadaY): bool
{
    if (!is_array($camadaY)) {
        return false;
    }

    $nivelY = $camadaY['nivelY'] ?? null;
    $cores = $camadaY['cores'] ?? null;

    if (!is_int($nivelY) || $nivelY < 1 || $nivelY > 99 || !is_array($cores)) {
        return false;
    }

    $vistos = [];

    foreach ($cores as $coresIguais) {
        if (!is_array($coresIguais)) {
            return false;
        }

        $cor = $coresIguais['cor'] ?? null;
        $posicoes = $coresIguais['posicoes'] ?? null;

        if (!corValida($cor) || !is_array($posicoes)) {
            return false;
        }

        foreach ($posicoes as $posicao) {
            if (!posicaoValida($posicao) || isset($vistos[$posicao])) {
                return false;
            }

            $vistos[$posicao] = true;
        }
    }

    return true;
}

function camadasYValidas(mixed $camadasY): bool
{
    if (!is_array($camadasY)) {
        return false;
    }

    $nivelYVistos = [];

    foreach ($camadasY as $camadaY) {
        if (!camadaYValida($camadaY)) {
            return false;
        }

        $nivelY = $camadaY['nivelY'];

        if (isset($nivelYVistos[$nivelY])) {
            return false;
        }

        $nivelYVistos[$nivelY] = true;
    }

    return true;
}

function dentroDosLimites(array $camadasY, int $dimensaoX, int $dimensaoZ): bool
{
    foreach ($camadasY as $camadaY) {
        foreach ($camadaY['cores'] as $cor) {
            foreach ($cor['posicoes'] as $posicao) {
                $celulaX = intdiv($posicao, 1000);
                $celulaZ  = $posicao % 1000;

                if ($celulaX >= $dimensaoX || $celulaZ >= $dimensaoZ) {
                    return false;
                }
            }
        }
    }

    return true;
}

function camadaYTemCelulasPintadas(array $camadaY): bool
{
    foreach ($camadaY['cores'] as $cores) {
        if ($cores['posicoes'] !== []) {
            return true;
        }
    }

    return false;
}

function montarCelulas(array $posicoes, string $cor): array
{
    $celulas = [];

    foreach ($posicoes as $posicao) {
        $celulas[] = [intdiv($posicao, 1000), $posicao % 1000, $cor];
    }

    return $celulas;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

$corpo = json_decode(file_get_contents('php://input'), true);

if (!is_array($corpo)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Dados inválidos.']);
    exit;
}

$idProjeto  = $corpo['id'] ?? null;
$camadasY = $corpo['camadas'] ?? null;

if (!is_string($idProjeto) || !validarID($idProjeto)) {
    http_response_code(400);
    echo json_encode(['erro' => 'ID inválido.']);
    exit;
}

if (!camadasYValidas($camadasY)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Camadas Y inválidas.']);
    exit;
}

try {
    $pdo = abrirConexao();
} catch (RuntimeException $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Não foi possível salvar o projeto.']);
    exit;
}

try {
    $uuid = buscarUsuario($pdo);

    $projeto = $uuid === null ? null : buscarProjeto($pdo, $uuid, $idProjeto);

    if ($projeto === null) {
        http_response_code(404);
        echo json_encode(['erro' => 'Projeto não encontrado.']);
        exit;
    }

    if (!dentroDosLimites($camadasY, $projeto['dimensaoX'], $projeto['dimensaoZ'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'Posição fora dos limites do projeto.']);
        exit;
    }

    $maiorCamadaY = 1;

    foreach ($camadasY as $camadaY) {
        if (camadaYTemCelulasPintadas($camadaY)) {
            $maiorCamadaY = max($maiorCamadaY, $camadaY['nivelY']);
        }
    }

    $pdo->beginTransaction();

    apagarCelulas($pdo, $idProjeto);
    apagarCamadasYAcima($pdo, $idProjeto, $maiorCamadaY);
    criarCamadasYMeio($pdo, $idProjeto, $maiorCamadaY);

    $ids = buscarIdsCamadaY($pdo, $idProjeto);

    foreach ($camadasY as $camadaY) {
        foreach ($camadaY['cores'] as $cores) {
            foreach (array_chunk($cores['posicoes'], 1000) as $celulas) {
                inserirCelulas(
                    $pdo,
                    $ids[$camadaY['nivelY']],
                    montarCelulas($celulas, $cores['cor'])
                );
            }
        }
    }

    atualizarDataProjeto($pdo, $idProjeto);

    $pdo->commit();

    echo json_encode(['salvo' => true]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('Falha ao salvar projeto: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['erro' => 'Não foi possível salvar o projeto.']);
    exit;
}