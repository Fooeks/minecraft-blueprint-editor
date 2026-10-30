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

try {
    $pdo = abrirConexao();
} catch (RuntimeException $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Não foi possível listar os projetos.']);
    exit;
}

try {
    $uuid = buscarUsuario($pdo);

    if ($uuid === null) {
        echo json_encode(['projetos' => []]);
        exit;
    }

    echo json_encode(['projetos' => listarProjetos($pdo, $uuid)]);
} catch (PDOException $e) {
    error_log('Falha ao listar projetos: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['erro' => 'Não foi possível listar os projetos.']);
    exit;
}