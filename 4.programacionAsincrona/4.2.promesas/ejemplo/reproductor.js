import cowsay from 'cowsay';

const youtube = (cancion) => cowsay.say({ text: `[YOUTUBE] \nReprod: ${cancion}`, f: 'dragon' });
const spotify = (cancion) => cowsay.say({ text: `[SPOTIFY] \nReprod: ${cancion}`, f: 'cow' });
const soundcloud = (cancion) => cowsay.say({ text: `[SOUNDCLOUD] \nReprod: ${cancion}`, f: 'stegosaurus' });

const reproducirEnPlataforma = (nombreCancion, servicioCallback) => {
    return new Promise((resolve, reject) => {
        let demora = 2000;
        if (servicioCallback.name === 'youtube') demora = 8000;
        if (servicioCallback.name === 'spotify') demora = 4000;
        if (servicioCallback.name === 'soundcloud') demora = 1000;

        console.log(`\nConectando a ${servicioCallback.name}...`);

        setTimeout(() => {
            const arteFinal = servicioCallback(nombreCancion);
            console.log(arteFinal);
            resolve(`Terminó de cargar ${servicioCallback.name}`);
        }, demora);
    });
};

console.log("=== REPRODUCTOR CON PROMESAS ===");

reproducirEnPlataforma('Bohemian Rhapsody', youtube)
    .then((msg) => console.log(msg));

reproducirEnPlataforma('Blinding Lights', spotify)
    .then((msg) => console.log(msg));

reproducirEnPlataforma('Cyberpunk Mix', soundcloud)
    .then((msg) => console.log(msg));

console.log("\nNota: El hilo principal sigue libre.");