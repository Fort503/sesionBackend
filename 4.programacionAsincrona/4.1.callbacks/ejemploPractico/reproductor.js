import cowsay from 'cowsay';


const reproducirEnPlataforma = (nombreCancion, servicioCallback) => {
    let demora = 2000;
    if (servicioCallback.name === 'youtube') demora = 8000;
    if (servicioCallback.name === 'spotify') demora = 4000;
    if (servicioCallback.name === 'soundcloud') demora = 1000;

    console.log(`\n Conectando al servicio ${servicioCallback.name}...`);

    setTimeout(() => {
        const arteFinal = servicioCallback(nombreCancion);
        console.log(arteFinal);
    }, demora);
};

console.log("=== REPRODUCTOR DINÁMICO ===");

reproducirEnPlataforma('Bohemian Rhapsody', youtube);
reproducirEnPlataforma('Blinding Lights', spotify);
reproducirEnPlataforma('Cyberpunk Mix', soundcloud);

console.log("\n Nota: El motor está libre mientras los servicios cargan...");