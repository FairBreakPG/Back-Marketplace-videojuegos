CREATE DATABASE tienda;

-- Tabla de Usuarios
CREATE TABLE usuarios (
  id                BIGINT          PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre            VARCHAR(100)    NOT NULL,
  apellido          VARCHAR(100)    NOT NULL,
  email             VARCHAR(255)    UNIQUE NOT NULL,
  contraseña        VARCHAR(255)    NOT NULL,
  direccion         VARCHAR(255),
  telefono          VARCHAR(20),
  fecha_registro    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estado            CHAR(1) DEFAULT '1', -- estado de la cuenta (1: activo, 0: inactivo)
  rol               VARCHAR(20)     NOT NULL -- rol del usuario (admin o cliente)
);

-- Tabla de juegos
CREATE TABLE juegos (
  id                BIGINT          PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre            VARCHAR(100)    NOT NULL UNIQUE,
  descripcion       VARCHAR(255)
);

-- Tabla de Productos 
CREATE TABLE productos (
  id                BIGINT          PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre            VARCHAR(100)    NOT NULL,
  descripcion       VARCHAR(255),
  precio            DECIMAL(10, 2)  NOT NULL,
  descuento         DECIMAL(5, 2)   DEFAULT 0.00, -- Porcentaje de descuento
  stock             INT NOT NULL,
  juegos_id      BIGINT          REFERENCES juegos(id), -- Tipo de juegos
  imagen            VARCHAR(1000),  -- URL de la imagen del producto
  fecha_creacion    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Pedidos
CREATE TABLE pedidos (
  id                BIGINT          PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  usuario_id        BIGINT REFERENCES usuarios(id),
  fecha             TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total             DECIMAL(10, 2)  NOT NULL,
  estado            CHAR(1) DEFAULT '0', -- estado del pedido (0: pendiente, 1: completado)
  metodo_pago       VARCHAR(50)     NOT NULL -- Tipo de pago (tarjeta, PayPal)
);

-- Tabla de Detalles de Pedido
CREATE TABLE detalles_pedido (
  id                BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  pedido_id         BIGINT REFERENCES pedidos(id),
  producto_id       BIGINT REFERENCES productos(id),
  cantidad          INT NOT NULL,
  precio            DECIMAL(10, 2) NOT NULL
);

-- Tabla de Historial de Pedidos
CREATE TABLE historial_pedidos (
  id                BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  pedido_id         BIGINT REFERENCES pedidos(id),
  estado            CHAR(1),
  fecha_cambio      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Tabla de Carrito

CREATE TABLE carrito (
  id                BIGINT          PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  usuario_id        BIGINT REFERENCES usuarios(id),
  producto_id       BIGINT REFERENCES productos(id),
  cantidad          INT NOT NULL DEFAULT 1,
  fecha_agregado    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



-- INSERT TABLAS PRUEBAS


-- JUEGOS
INSERT INTO juegos (nombre, descripcion) VALUES
(nombre, descripcion);


-- PRODUCTOS
INSERT INTO productos (nombre, descripcion, precio, descuento, stock, juegos_id, imagen) VALUES
(nombre, descripcion, precio, descuento, stock, juegos_id, imagen);

-- USUARIOS
INSERT INTO usuarios (nombre, apellido, email, contrasena, direccion, telefono, rol) VALUES
(nombre, apellido, email, contrasena, direccion, telefono, rol);

-- PEDIDOS
INSERT INTO pedidos (usuario_id, total, metodo_pago) VALUES
(1, 42000, 'Tarjeta'),
(2, 108000, 'PayPal');

-- DETALLES PEDIDOS
INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES
(pedido_id, producto_id, cantidad, precio_unitario);

--- script carrito
INSERT INTO carrito (usuario_id, producto_id, cantidad)
VALUES (2, 3, 2); -- Usuario con id 1 agrega 1 unidad del producto con id 2 al carrito
INSERT INTO carrito (usuario_id, producto_id, cantidad)
VALUES (1, 2, 1); -- Usuario con id 1 agrega 1 unidad del producto con id 2 al carrito
---