<?php
function abrirConexao(): PDO
{
    $cfg = require __DIR__ . '/database.php';

    $dsn = "mysql:host={$cfg['host']};dbname={$cfg['dbname']};charset={$cfg['charset']}";

    $opcoes = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    try {
        return new PDO($dsn, $cfg['user'], $cfg['pass'], $opcoes);
    } catch (PDOException $e) {
        error_log('Falha de conexão: ' . $e->getMessage());
        throw new RuntimeException('Não foi possível conectar ao banco de dados.');
    }
}