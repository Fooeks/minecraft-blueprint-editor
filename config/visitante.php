<?php

function gerarID(): string
{
    $bytes = random_bytes(16); 
    
    $byte = ord($bytes[6]);
    $byte = ($byte & 0x0F) | 0x40;
    $bytes[6] = chr($byte);

    $byte = ord($bytes[8]);
    $byte = ($byte & 0x3F) | 0x80;
    $bytes[8] = chr($byte);
    
    $hex   = bin2hex($bytes);
    $uuid  = substr($hex, 0, 8) .'-'. substr($hex, 8, 4) .'-'. substr($hex, 12, 4) .'-'. substr($hex, 16, 4) .'-'. substr($hex, 20, 12);

    return $uuid;
}

function validarID(string $uuid): bool
{
    $valido = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/', $uuid) === 1;
    return $valido;
}