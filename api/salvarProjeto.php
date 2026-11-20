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

function coresValidas(mixed $cores, array &$vistos): bool
{
    if (!is_array($cores)) {
        return false;
    }

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

function formaValida(mixed $forma, array &$vistos, array &$idsFormaVistos): bool
{
    if (!is_array($forma)) {
        return false;
    }

    $idForma = $forma['idForma'] ?? null;
    $tipo = $forma['tipo'] ?? null;
    $estilo = $forma['estilo'] ?? null;

    if (!is_int($idForma) || $idForma < 1 || isset($idsFormaVistos[$idForma])) {
        return false;
    }

    if (!in_array($tipo, ['poligono', 'superelipse'], true)) {
        return false;
    }

    $lados = $forma['lados'] ?? null;
    $expoente = $forma['expoente'] ?? null;

    if ($tipo === 'poligono') {
        if (!is_int($lados) || $lados < 3 || $lados > 32 || $expoente !== null) {
            return false;
        }
    } else {
        if (!(is_int($expoente) || is_float($expoente)) || $expoente < 0.5 || $expoente > 10 || $lados !== null) {
            return false;
        }
    }

    $posicaoX = $forma['posicaoX'] ?? null;
    $posicaoZ = $forma['posicaoZ'] ?? null;
    $dimensaoX = $forma['dimensaoX'] ?? null;
    $dimensaoZ = $forma['dimensaoZ'] ?? null;
    $rotacao = $forma['rotacao'] ?? null;
    $bloqueado = $forma['bloqueado'] ?? null;
    $cor = $forma['cor'] ?? null;

    if (!posicaoValida($posicaoX) || !posicaoValida($posicaoZ)) {
        return false;
    }

    if (!is_int($dimensaoX) || $dimensaoX < 1 || !is_int($dimensaoZ) || $dimensaoZ < 1) {
        return false;
    }

    if (!(is_int($rotacao) || is_float($rotacao)) || $rotacao < 0 || $rotacao >= 360) {
        return false;
    }

    if (!is_bool($bloqueado)) {
        return false;
    }

    if (!corValida($cor)) {
        return false;
    }

    if (!in_array($estilo, ['preenchida', 'contorno'], true)) {
        return false;
    }

    if (!coresValidas($forma['cores'] ?? null, $vistos)) { 
        return false; 
    }
    
    $idsFormaVistos[$idForma] = true;
    return true;
}

function camadaYValida(mixed $camadaY, array &$idsFormaVistos): bool
{
    if (!is_array($camadaY)) {
        return false;
    }

    $nivelY = $camadaY['nivelY'] ?? null;
    $cores = $camadaY['cores'] ?? null;
    $formas = $camadaY['formas'] ?? [];

    if (!is_int($nivelY) || $nivelY < 1 || $nivelY > 99 || !is_array($formas)) {
        return false;
    }

    $vistos = [];

    if (!coresValidas($cores, $vistos)) {
        return false;
    }

    foreach ($formas as $forma) {
        if (!formaValida($forma, $vistos, $idsFormaVistos)) {
            return false;
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
    $idsFormaVistos = [];

    foreach ($camadasY as $camadaY) {
        if (!camadaYValida($camadaY, $idsFormaVistos)) {
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

function coresDentroDosLimites(array $cores, int $dimensaoX, int $dimensaoZ): bool
{
    foreach ($cores as $cor) {
        foreach ($cor['posicoes'] as $posicao) {
            $celulaX = intdiv($posicao, 1000);
            $celulaZ  = $posicao % 1000;

            if ($celulaX >= $dimensaoX || $celulaZ >= $dimensaoZ) {
                return false;
            }
        }
    }

    return true;
}

function dentroDosLimites(array $camadasY, int $dimensaoX, int $dimensaoZ): bool
{
    foreach ($camadasY as $camadaY) {
        if (!coresDentroDosLimites($camadaY['cores'], $dimensaoX, $dimensaoZ)) {
            return false;
        }

        foreach ($camadaY['formas'] ?? [] as $forma) {
            if (!coresDentroDosLimites($forma['cores'], $dimensaoX, $dimensaoZ)) {
                return false;
            }

            if ($forma['posicaoX'] >= $dimensaoX || $forma['posicaoZ'] >= $dimensaoZ) {
                return false;
            }

            if ($forma['dimensaoX'] > $dimensaoX || $forma['dimensaoZ'] > $dimensaoZ) {
                return false;
            }
        }
    }

    return true;
}

function camadaYTemConteudo(array $camadaY): bool
{
    if (($camadaY['formas'] ?? []) !== []) {
        return true;
    }

    foreach ($camadaY['cores'] as $cores) {
        if ($cores['posicoes'] !== []) {
            return true;
        }
    }

    return false;
}

function montarCelulas(array $posicoes, string $cor, ?int $idForma): array
{
    $celulas = [];

    foreach ($posicoes as $posicao) {
        $celulas[] = [intdiv($posicao, 1000), $posicao % 1000, $cor, $idForma];
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
        if (camadaYTemConteudo($camadaY)) {
            $maiorCamadaY = max($maiorCamadaY, $camadaY['nivelY']);
        }
    }

    $pdo->beginTransaction();

    apagarCelulas($pdo, $idProjeto);
    apagarFormas($pdo, $idProjeto);
    apagarCamadasYAcima($pdo, $idProjeto, $maiorCamadaY);
    criarCamadasYMeio($pdo, $idProjeto, $maiorCamadaY);

    $ids = buscarIdsCamadaY($pdo, $idProjeto);

    $lista = [];

    foreach ($camadasY as $camadaY) {
        foreach ($camadaY['formas'] ?? [] as $forma) {
            $lista[$forma['idForma']] = [
                'nivelY'   => $camadaY['nivelY'],
                'forma' => $forma,
            ];
        }
    }

    ksort($lista);

    $idsReais = [];

    foreach ($lista as $idForma => $item) {
        $idsReais[$idForma] = inserirForma(
            $pdo,
            $ids[$item['nivelY']],
            $item['forma']
        );
    }

    foreach ($camadasY as $camadaY) {
        foreach ($camadaY['cores'] as $cores) {
            foreach (array_chunk($cores['posicoes'], 1000) as $celulas) {
                inserirCelulas(
                    $pdo,
                    $ids[$camadaY['nivelY']],
                    montarCelulas($celulas, $cores['cor'], null)
                );
            }
        }
    }

    foreach ($camadasY as $camadaY) {
        foreach ($camadaY['formas'] ?? [] as $forma) {
            foreach ($forma['cores'] as $cores) {
                foreach (array_chunk($cores['posicoes'], 1000) as $celulas) {
                    inserirCelulas( 
                        $pdo,
                        $ids[$camadaY['nivelY']],
                        montarCelulas($celulas, $cores['cor'], $idsReais[$forma['idForma']])
                    );
                }
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