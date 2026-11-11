<?php

require_once __DIR__ . '/../config/conexao.php';
require_once __DIR__ . '/../config/visitante.php';
require_once __DIR__ . '/../config/projeto.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

$idProjeto = $_GET['id'] ?? null;

if (!is_string($idProjeto) || !validarID($idProjeto)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Identificador inválido.']);
    exit;
}

try {
    $pdo = abrirConexao();
} catch (RuntimeException $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Não foi possível abrir o projeto.']);
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

    $projeto['camadas'] = buscarCamadasY($pdo, $idProjeto);

    echo json_encode($projeto);
} catch (PDOException $e) {
    error_log('Falha ao abrir projeto: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['erro' => 'Não foi possível abrir o projeto.']);
    exit;
}