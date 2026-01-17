import cowsay from 'cowsay';

const reproducirConRetraso = (cancion, servicio, animal, callback) => {
    console.log(`Cargando "${cancion}" en ${servicio}...`);
    setTimeout(() => {
        console.log(cowsay.say({ text: `Sonando: ${cancion}\nServicio: ${servicio}`, f: animal }));
        if (callback) callback();
    }, 2000);
};

console.log("=== INICIO DE PLAYLIST SECUENCIAL (CALLBACKS) ===");

reproducirConRetraso("Bohemian Rhapsody", "YouTube", "dragon", () => {
    
    reproducirConRetraso("Blinding Lights", "Spotify", "meow", () => {
        
        reproducirConRetraso("Cyberpunk Mix", "SoundCloud", "stegosaurus", () => {
            
            console.log("✅ Fin de la playlist. ¡Mira qué hacia la derecha se fue el código!");
            
        });
    });
});