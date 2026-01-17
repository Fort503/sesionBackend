import { say } from 'cowsay';
import lolcat from 'lolcatjs';

const texto = "¡Backend es mi pasión! - Sesión 1 (2026)";

const pavoReal = say({
    text: texto,// 'dragon', 'stegosaurus' o 'milk'
});

lolcat.fromString(pavoReal);