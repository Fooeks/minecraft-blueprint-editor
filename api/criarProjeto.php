<?php

require_once __DIR__ . '/../config/conexao.php';
require_once __DIR__ . '/../config/visitante.php';

header('Content-Type: application/json; charset=utf-8');

function medidaValida(mixed $valor): bool
{
    return is_int($valor) && $valor >= 1 && $valor <= 500;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

$corpo = file_get_contents('php://input');
$dados = json_decode($corpo, true);

if (!is_array($dados)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Corpo da requisição inválido.']);
    exit;
}

$x = $dados['dimensaoX'] ?? null;
$z = $dados['dimensaoZ'] ?? null;

if (!medidaValida($x) || !medidaValida($z)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Medidas inválidas.']);
    exit;
}

$nome = $dados['nome'] ?? '';

if (!is_string($nome)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Nome inválido.']);
    exit;
}

$nome = trim($nome);

if ($nome === '') {
    $nome = 'Novo projeto';
}

if (mb_strlen($nome) > 100) {
    http_response_code(400);
    echo json_encode(['erro' => 'Nome muito longo.']);
    exit;
}

try {
    $pdo = abrirConexao();
} catch (RuntimeException $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro interno do servidor.']);
    exit;
}

try {
    $uuid = identificarUsuario($pdo);
} catch (PDOException $e) {
    error_log('Falha ao identificar: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['erro' => 'Erro interno do servidor.']);
    exit;
}