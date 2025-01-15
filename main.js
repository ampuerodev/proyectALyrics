// Importaciones de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBtj7ZuObA4y3M9zwp311fvoUUezrqNNvE",
    authDomain: "esp32-pruebas-e2b45.firebaseapp.com",
    databaseURL: "https://esp32-pruebas-e2b45-default-rtdb.firebaseio.com",
    projectId: "esp32-pruebas-e2b45",
    storageBucket: "esp32-pruebas-e2b45.appspot.com",
    messagingSenderId: "291054074279",
    appId: "1:291054074279:web:11dd170c08782",
    measurementId: "G-JKW5843CSF"
};

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

console.log("Firebase inicializado correctamente");

// Función para cargar componentes
async function loadComponent(containerId, componentPath) {
    const container = document.getElementById(containerId);
    const response = await fetch(componentPath);
    const content = await response.text();
    container.innerHTML = content;
    console.log(`Componente cargado en ${containerId}`);

    // Componente para subir canciones
    if (containerId === 'upload-container') {
        setupUploadForm();
    }

    // Componente para explorar canciones
    if (containerId === 'explore-container') {
        setupExploreSongs();
    }
}

// Configuración del formulario de subida
function setupUploadForm() {
    const uploadForm = document.getElementById('upload-form');
    const successModal = document.getElementById('success-modal');
    const closeModalButton = document.getElementById('close-modal');
    const closeModalButtonAlt = document.getElementById('close-btn'); // Botón alternativo de cerrar

    // Mostrar el modal de éxito
    const showModal = () => {
        successModal.style.display = 'flex';
    };

    // Cerrar el modal
    const closeModal = () => {
        successModal.style.display = 'none';
    };

    closeModalButton.addEventListener('click', closeModal);
    closeModalButtonAlt?.addEventListener('click', closeModal);

    // Manejar la lógica del formulario
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página se recargue

        const songTitle = document.getElementById('song-title').value.trim();
        const artist = document.getElementById('artist').value.trim();
        const genre = document.getElementById('genre').value;
        const lyrics = document.getElementById('lyrics').value.trim();

        if (!songTitle || !artist || !genre || !lyrics) {
            alert("Por favor completa todos los campos.");
            return;
        }

        try {
            // Subir la canción a la base de datos
            const newSongRef = ref(db, 'songs/' + songTitle);
            await set(newSongRef, { title: songTitle, artist, genre, lyrics });
            showModal(); // Mostrar el modal
            uploadForm.reset(); // Limpiar el formulario
        } catch (error) {
            console.error("Error al subir la letra: ", error);
            alert("Hubo un error al subir la letra.");
        }
    });
}

// Configuración para explorar canciones
async function setupExploreSongs() {
    const searchBar = document.getElementById('search-bar');
    const songList = document.getElementById('song-list');
    const songsRef = ref(db, 'songs');
    const deleteSuccessModal = document.getElementById('delete-success-modal');
    const closeDeleteModalButton = document.getElementById('close-delete-modal');
    const closeDeleteModalButtonAlt = document.getElementById('close-delete-btn');

    // Mostrar el modal de eliminación exitosa
    const showDeleteModal = () => {
        deleteSuccessModal.style.display = 'flex';
    };

    // Cerrar el modal de eliminación exitosa
    const closeDeleteModal = () => {
        deleteSuccessModal.style.display = 'none';
    };

    closeDeleteModalButton.addEventListener('click', closeDeleteModal);
    closeDeleteModalButtonAlt?.addEventListener('click', closeDeleteModal);

    // Mostrar canciones en la interfaz
    const displaySongs = (songsToDisplay) => {
        songList.innerHTML = ''; // Limpiar lista actual
        if (Object.keys(songsToDisplay).length === 0) {
            songList.innerHTML = "<p>No hay canciones disponibles.</p>";
            return;
        }
        Object.keys(songsToDisplay).forEach((key) => {
            const song = songsToDisplay[key];
            const songCard = document.createElement('div');
            songCard.classList.add('song-card');
            songCard.innerHTML = `
                <h3>${song.title}</h3>
                <div class="song-card-content">
                    <p><strong>Artista:</strong> ${song.artist}</p>
                    <p><strong>Género:</strong> ${song.genre}</p>
                    <pre>${song.lyrics}</pre>
                    <button class="btn delete-btn" data-key="${key}">Eliminar</button>
                </div>
            `;
            songCard.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-btn')) {
                    return; // Evitar redirección si se hace clic en el botón de eliminar
                }
                const queryParams = new URLSearchParams({
                    title: song.title,
                    artist: song.artist,
                    genre: song.genre,
                    lyrics: song.lyrics
                });
                window.location.href = `components/song-details.html?${queryParams.toString()}`;
            });
            songList.appendChild(songCard);
        });

        // Agregar manejador de eventos para los botones de eliminar
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const key = e.target.getAttribute('data-key');
                try {
                    await remove(ref(db, 'songs/' + key));
                    showDeleteModal(); // Mostrar el modal de eliminación exitosa
                } catch (error) {
                    console.error('Error al eliminar la canción:', error);
                    alert('Hubo un error al eliminar la canción');
                }
            });
        });
    };

    // Escuchar cambios en tiempo real
    onValue(songsRef, (snapshot) => {
        const songs = snapshot.val();
        if (songs) {
            displaySongs(songs);
        } else {
            songList.innerHTML = "<p>No hay canciones disponibles.</p>";
        }
    });

    // Filtrar canciones por búsqueda
    searchBar.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        onValue(songsRef, (snapshot) => {
            const songs = snapshot.val();
            if (songs) {
                const filteredSongs = Object.keys(songs).filter((key) => {
                    const song = songs[key];
                    return (
                        song.title.toLowerCase().includes(query) ||
                        song.artist.toLowerCase().includes(query)
                    );
                });
                const filteredResults = filteredSongs.reduce((acc, key) => {
                    acc[key] = songs[key];
                    return acc;
                }, {});
                displaySongs(filteredResults);
            } else {
                displaySongs({});
            }
        });
    });
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    loadComponent('nav-container', 'components/nav.html');
    loadComponent('upload-container', 'components/upload-form.html');
    loadComponent('explore-container', 'components/explore-songs.html');
});