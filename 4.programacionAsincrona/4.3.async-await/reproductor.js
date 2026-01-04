import cowsay from 'cowsay';

const youtube = (cancion) => cowsay.say({ text: `[YOUTUBE] \nReprod: ${cancion}`, f: 'dragon' });
const spotify = (cancion) => cowsay.say({ text: `[SPOTIFY] \nReprod: ${cancion}` });
const soundcloud = (cancion) => cowsay.say({ text: `[SOUNDCLOUD] \nReprod: ${cancion}`, f: 'stegosaurus' });

const reproducirEnPlataforma = (nombreCancion, servicioCallback) => {
    return new Promise((resolve) => {
        let demora = 2000;
        if (servicioCallback.name === 'youtube') demora = 8000;
        if (servicioCallback.name === 'spotify') demora = 4000;
        if (servicioCallback.name === 'soundcloud') demora = 1000;

        console.log(`\nCargando en ${servicioCallback.name}...`);

        setTimeout(() => {
            console.log(servicioCallback(nombreCancion));
            resolve();
        }, demora);
    });
};

async function iniciarPlaylist() {
    console.log("=== PLAYLIST CON ASYNC/AWAIT ===");

    await reproducirEnPlataforma('Bohemian Rhapsody', youtube);
    await reproducirEnPlataforma('Blinding Lights', spotify);
    await reproducirEnPlataforma('Cyberpunk Mix', soundcloud);

    console.log("\nPlaylist finalizada con éxito.");
}

iniciarPlaylist();

console.log("\Nota: El servidor sigue atendiendo otros procesos mientras la playlist suena.");