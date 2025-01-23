// Importaciones de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, onValue, remove, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

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
    try {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`No se encontró el contenedor con ID: ${containerId}`);
            return;
        }

        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`Error al cargar el componente desde ${componentPath}: ${response.statusText}`);
        }

        const content = await response.text();
        container.innerHTML = content;
        console.log(`Componente cargado en ${containerId}`);

        // Configurar eventos después de cargar el componente
        if (containerId === 'upload-container') {
            setupUploadForm();
        }

        if (containerId === 'explore-container') {
            setupExploreSongs();
        }

        if (containerId === 'favorites-container') {
            setupFavorites();
        }
    } catch (error) {
        console.error(`Error al cargar el componente en ${containerId}:`, error);
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
            const newSongRef = ref(db, 'songs/' + songTitle);
            await set(newSongRef, { title: songTitle, artist, genre, lyrics, favorite: false });
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

    // Seleccionar elementos del DOM relacionados con la edición
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const closeEditModalButton = document.getElementById('close-edit-modal');
    const editSuccessModal = document.getElementById('edit-success-modal');
    const closeEditSuccessButton = document.getElementById('close-edit-success-btn');

    let currentEditKey = null;
    let songs = {}; // Declarar la variable songs en un alcance accesible

    // Función para abrir el modal de edición con datos precargados
    const openEditModal = (songKey, songData) => {
        currentEditKey = songKey;
        document.getElementById('edit-song-title').value = songData.title;
        document.getElementById('edit-artist').value = songData.artist;
        document.getElementById('edit-genre').value = songData.genre;
        document.getElementById('edit-lyrics').value = songData.lyrics;
        editModal.style.display = 'flex';
    };

    // Función para cerrar el modal de edición
    const closeEditModal = () => {
        editModal.style.display = 'none';
    };

    // Función para mostrar el modal de éxito de edición
    const showEditSuccessModal = () => {
        editSuccessModal.style.display = 'flex';
    };

    // Función para cerrar el modal de éxito de edición
    const closeEditSuccessModal = () => {
        editSuccessModal.style.display = 'none';
    };

    // Eventos para cerrar los modales
    closeEditModalButton.addEventListener('click', closeEditModal);
    closeEditSuccessButton.addEventListener('click', closeEditSuccessModal);

    // Manejo del formulario de edición
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const updatedSong = {
            title: document.getElementById('edit-song-title').value.trim(),
            artist: document.getElementById('edit-artist').value.trim(),
            genre: document.getElementById('edit-genre').value,
            lyrics: document.getElementById('edit-lyrics').value.trim(),
        };

        if (!updatedSong.title || !updatedSong.artist || !updatedSong.genre || !updatedSong.lyrics) {
            alert('Por favor completa todos los campos.');
            return;
        }

        try {
            // Actualizar la canción en Firebase
            const songRef = ref(db, 'songs/' + currentEditKey);
            await set(songRef, updatedSong);

            closeEditModal(); // Cerrar el modal de edición
            showEditSuccessModal(); // Mostrar el modal de éxito
        } catch (error) {
            console.error('Error al editar la canción:', error);
            alert('Hubo un error al guardar los cambios.');
        }
    });

    // Función para manejar favoritos
    const toggleFavorite = async (key, isFavorite) => {
        try {
            const songRef = ref(db, 'songs/' + key);
            await update(songRef, { favorite: !isFavorite });
        } catch (error) {
            console.error('Error al actualizar el favorito:', error);
        }
    };

    // Mostrar canciones en la interfaz
    const displaySongs = (songsToDisplay) => {
        songList.innerHTML = '';
        if (Object.keys(songsToDisplay).length === 0) {
            songList.innerHTML = '<p>No hay canciones disponibles.</p>';
            return;
        }
        Object.keys(songsToDisplay).forEach((key) => {
            const song = songsToDisplay[key];
            const songCard = document.createElement('div');
            songCard.classList.add('song-card');
            songCard.innerHTML = `
                <div class="song-header">
                    <h3>${song.title}</h3>
                    <button class="favorite-btn ${song.favorite ? 'active' : ''}" data-key="${key}">
                        <span class="heart-icon">&#x2764;</span>
                    </button>
                </div>
                <div class="song-card-content">
                    <p><strong>Artista:</strong> ${song.artist}</p>
                    <p><strong>Género:</strong> ${song.genre}</p>
                    <pre>${song.lyrics}</pre>
                    <div class="button-container">
                        <button class="btn view-btn" data-key="${key}">Ver</button>
                        <button class="btn edit-btn" data-key="${key}">Editar</button>
                        <button class="btn delete-btn" data-key="${key}">Eliminar</button>
                    </div>
                </div>
            `;

            // Agregar evento para el botón de visualizar
            songCard.querySelector('.view-btn').addEventListener('click', () => {
                window.location.href = `components/song-details.html?title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist)}&genre=${encodeURIComponent(song.genre)}&lyrics=${encodeURIComponent(song.lyrics)}`;
            });

            // Agregar evento para el botón de editar
            songCard.querySelector('.edit-btn').addEventListener('click', () => {
                openEditModal(key, song);
            });

            // Agregar evento para el botón de eliminar
            songCard.querySelector('.delete-btn').addEventListener('click', async () => {
                try {
                    await remove(ref(db, 'songs/' + key));
                    showDeleteModal();
                } catch (error) {
                    console.error('Error al eliminar la canción:', error);
                    alert('Hubo un error al eliminar la canción.');
                }
            });

            // Agregar evento para el botón de favoritos
            songCard.querySelector('.favorite-btn').addEventListener('click', async (e) => {
                const button = e.currentTarget;
                const key = button.getAttribute('data-key');
                const isFavorite = button.classList.contains('active');
                await toggleFavorite(key, isFavorite);
                button.classList.toggle('active');
            });

            songList.appendChild(songCard);
        });
    };

    // Escuchar cambios en tiempo real
    onValue(songsRef, (snapshot) => {
        songs = snapshot.val(); // Actualizar la variable songs
        console.log(songs); // Verifica que los datos se están cargando correctamente
        displaySongs(songs);
    });

    // Filtrar canciones por búsqueda
    searchBar.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredSongs = {};
        for (const key in songs) {
            const song = songs[key];
            if (song.title.toLowerCase().includes(searchTerm) || song.artist.toLowerCase().includes(searchTerm)) {
                filteredSongs[key] = song;
            }
        }
        displaySongs(filteredSongs);
    });
}

// Configuración para mostrar favoritos
async function setupFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    const songsRef = ref(db, 'songs');

    // Mostrar canciones favoritas en la interfaz
    const displayFavorites = (songsToDisplay) => {
        favoritesList.innerHTML = '';
        if (Object.keys(songsToDisplay).length === 0) {
            favoritesList.innerHTML = '<p>No hay canciones favoritas disponibles.</p>';
            return;
        }
        Object.keys(songsToDisplay).forEach((key) => {
            const song = songsToDisplay[key];
            if (song.favorite) {
                const favoriteItem = document.createElement('div');
                favoriteItem.classList.add('favorite-item');
                favoriteItem.innerHTML = `
                    <h3>${song.title}</h3>
                    <p>${song.artist}</p>
                `;
                favoritesList.appendChild(favoriteItem);
            }
        });
    };

    // Escuchar cambios en tiempo real
    onValue(songsRef, (snapshot) => {
        const songs = snapshot.val();
        displayFavorites(songs);
    });
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    loadComponent('nav-container', 'components/nav.html');
    loadComponent('upload-container', 'components/upload-form.html');
    loadComponent('explore-container', 'components/explore-songs.html');
    loadComponent('favorites-container', 'components/favorites.html');
});