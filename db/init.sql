-- Script de inicialização do banco com seed
CREATE TABLE IF NOT EXISTS usuario (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(200) NOT NULL,
    tipo_usuario VARCHAR(20) NOT NULL CHECK (tipo_usuario IN ('CLIENTE','CAIXA','CAIXAMOVEL','ADMIN'))
);

CREATE TABLE IF NOT EXISTS restaurante (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    endereco VARCHAR(200) NOT NULL,
    cnpj VARCHAR(20) UNIQUE,
    telefone VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS cliente (
    id SERIAL PRIMARY KEY,
    id_usuario INT UNIQUE NOT NULL REFERENCES usuario(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS administrador (
    id SERIAL PRIMARY KEY,
    id_usuario INT UNIQUE NOT NULL REFERENCES usuario(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS caixa (
    id SERIAL PRIMARY KEY,
    id_usuario INT UNIQUE NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    id_restaurante INT NOT NULL REFERENCES restaurante(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS caixamovel (
    id SERIAL PRIMARY KEY,
    id_usuario INT UNIQUE NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    id_restaurante INT NOT NULL REFERENCES restaurante(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS promocao (
    id SERIAL PRIMARY KEY,
    id_restaurante INT NOT NULL REFERENCES restaurante(id) ON DELETE CASCADE,
    dt_inicio DATE NOT NULL,
    dt_final DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS refeicao (
    id SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    id_caixa INT NOT NULL REFERENCES caixa(id) ON DELETE CASCADE,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    cortesia BOOLEAN DEFAULT FALSE
);

-- Seed inicial
INSERT INTO usuario (nome, cpf, telefone, email, senha, tipo_usuario)
VALUES ('Admin Master', '00000000000', '51999999999', 'admin@restaurante.com', 'admin123', 'ADMIN');

INSERT INTO usuario (nome, cpf, telefone, email, senha, tipo_usuario)
values ('Padrao', '00011122233', '5399966334455', 'padrao@caixa.com', '123456', 'CAIXA');

INSERT INTO administrador (id_usuario)
SELECT id FROM usuario WHERE email = 'admin@restaurante.com';

INSERT INTO restaurante (nome, endereco, cnpj, telefone)
VALUES ('Restaurante Central', 'Rua Principal, 123', '12345678000199', '5133333333');

INSERT INTO caixa (id_restaurante, id_usuario)
VALUES (1, 6);
