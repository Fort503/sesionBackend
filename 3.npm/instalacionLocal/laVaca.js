import cowsay from 'cowsay';
import lolcat from 'lolcatjs';

const texto = "¡Backend es mi pasión! - Sesión 1 (2026)";

const pavoReal = cowsay.say({
    text: texto,
    f: 'milk', // 'dragon', 'stegosaurus' o 'milk'
});

lolcat.fromString(pavoReal);