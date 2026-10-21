CREATE TABLE usuario (
    id_visitante CHAR(36) PRIMARY KEY,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE projeto (
    id_projeto CHAR(36) PRIMARY KEY,
    id_visitante CHAR(36) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    dimensao_x INT NOT NULL CHECK (dimensao_x BETWEEN 1 AND 500),
    dimensao_z INT NOT NULL CHECK (dimensao_z BETWEEN 1 AND 500),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_visitante) REFERENCES usuario(id_visitante) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE camada_y (
    id_camada INT AUTO_INCREMENT PRIMARY KEY,
    id_projeto CHAR(36) NOT NULL,
    nivel_y INT NOT NULL CHECK (nivel_y BETWEEN 1 AND 99),
    UNIQUE (id_projeto, nivel_y),
    FOREIGN KEY (id_projeto) REFERENCES projeto(id_projeto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE grupo (
    id_grupo INT AUTO_INCREMENT PRIMARY KEY,
    id_camada INT NOT NULL,
    nome VARCHAR(50),
    bloqueado BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (id_camada) REFERENCES camada_y(id_camada) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE forma (
    id_forma INT AUTO_INCREMENT PRIMARY KEY,
    id_camada INT NOT NULL,
    id_grupo INT,
    tipo VARCHAR(30) NOT NULL,
    posicao_x INT NOT NULL,
    posicao_z INT NOT NULL,
    dimensao_x INT NOT NULL,
    dimensao_z INT NOT NULL,
    rotacao FLOAT NOT NULL DEFAULT 0,
    quantidade_lados INT,
    expoente FLOAT,
    estilo VARCHAR(30) NOT NULL,
    cor VARCHAR(20) NOT NULL,
    bloqueado BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (id_camada) REFERENCES camada_y(id_camada) ON DELETE CASCADE,
    FOREIGN KEY (id_grupo) REFERENCES grupo(id_grupo) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE celula (
    id_celula INT AUTO_INCREMENT PRIMARY KEY,
    id_camada INT NOT NULL,
    id_forma INT,
    id_grupo INT,
    posicao_x INT NOT NULL,
    posicao_z INT NOT NULL,
    cor VARCHAR(20) NOT NULL,
    ordem INT NOT NULL DEFAULT 0,
    UNIQUE (id_camada, posicao_x, posicao_z, ordem),
    FOREIGN KEY (id_camada) REFERENCES camada_y(id_camada) ON DELETE CASCADE,
    FOREIGN KEY (id_forma) REFERENCES forma(id_forma) ON DELETE SET NULL,
    FOREIGN KEY (id_grupo) REFERENCES grupo(id_grupo) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;