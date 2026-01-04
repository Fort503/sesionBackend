CREATE DATABASE IF NOT EXISTS db_ejemplo;

USE db_ejemplo;

CREATE TABLE IF NOT EXISTS canciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    plataforma VARCHAR(50) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO canciones (nombre, plataforma) VALUES 
('Bohemian Rhapsody', 'YouTube Music'),
('Blinding Lights', 'Spotify'),
('Cyberpunk Mix', 'SoundCloud');

SELECT * FROM canciones;