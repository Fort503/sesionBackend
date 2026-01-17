CREATE DATABASE IF NOT EXISTS tareas_db;

USE tareas_db;

CREATE TABLE IF NOT EXISTS tareas (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    isCompleted TINYINT(1) DEFAULT 0,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO tareas (title, description, isCompleted, createdAt, updatedAt) VALUES 
('Estudiar Node.js', 'Repasar los conceptos básicos de Express y Sequelize', 0, NOW(), NOW()),
('Configurar base de datos', 'Crear la base de datos tareas_db y la tabla tareas', 1, NOW(), NOW()),
('Hacer la tarea de backend', 'Terminar el CRUD de tareas', 0, NOW(), NOW());
