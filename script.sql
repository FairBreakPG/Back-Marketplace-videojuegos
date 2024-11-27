CREATE DATABASE tienda;

-- Tabla de Usuarios
CREATE TABLE usuarios (
  id                BIGINT          PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre            VARCHAR(100)    NOT NULL,
  apellido          VARCHAR(100)    NOT NULL,
  email             VARCHAR(255)    UNIQUE NOT NULL,
  contrasena        VARCHAR(255)    NOT NULL,
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


/*
cambios en BD AGREGAR A BD que apunta a render
ALTER TABLE productos
ALTER COLUMN precio TYPE INT USING precio::INT;
ALTER TABLE detalles_pedido
ALTER COLUMN precio TYPE INT USING precio::INT;

ALTER TABLE pedidos
ALTER COLUMN total TYPE INT USING total::INT;

ALTER TABLE carrito
ADD CONSTRAINT unique_usuario_producto UNIQUE (usuario_id, producto_id);
*/