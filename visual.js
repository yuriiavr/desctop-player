// renderer.js
let audio = new Audio();
let playlists = {}; // Об’єкт для зберігання кількох плейлистів
let currentPlaylistName = "Default Playlist";
let currentIndex = 0;

document.addEventListener("DOMContentLoaded", async () => {
    // Rename modal elements
    const closeRenameModal = document.getElementById('closeRenameModal');
    const cancelRenameButton = document.getElementById('cancelRenameButton');
    closeRenameModal.addEventListener('click', () => {
        document.getElementById('renamePlaylistModal').style.display = 'none';
    });
    cancelRenameButton.addEventListener('click', () => {
        document.getElementById('renamePlaylistModal').style.display = 'none';
    });
    document.getElementById('createPlaylistButton').addEventListener('click', createPlaylist);
    document.getElementById('savePlaylistButton').addEventListener('click', saveCurrentPlaylist);
    document.getElementById('renamePlaylistButton').addEventListener('click', () => {
        const renamePlaylistModal = document.getElementById('renamePlaylistModal');
        const renamePlaylistInput = document.getElementById('renamePlaylistInput');
        renamePlaylistInput.value = currentPlaylistName;
        renamePlaylistModal.style.display = 'block';
    });
    document.getElementById('confirmRenameButton').addEventListener('click', renameCurrentPlaylist);
    document.getElementById('deletePlaylistButton').addEventListener('click', deleteCurrentPlaylist);

    // Додаємо обробник події для автоматичного завантаження при виборі плейлиста
    document.getElementById('playlistsDropdown').addEventListener('change', (event) => {
        const selectedPlaylist = event.target.value;
        if (selectedPlaylist in playlists) {
            currentPlaylistName = selectedPlaylist;
            displayPlaylist();
        }
    });

    await loadAllPlaylists(); // Завантаження всіх збережених плейлистів при запуску
    displayPlaylistsDropdown();

    // Додаємо обробник для клікабельних пісень у плейлисті
    const playlistElement = document.getElementById('playlist');
    playlistElement.addEventListener('click', (event) => {
        if (event.target.tagName === 'LI') {
            const songIndex = Array.from(playlistElement.children).indexOf(event.target);
            playSongAtIndex(songIndex);
        }
    });
});

async function loadAllPlaylists() {
    playlists = await window.electronAPI.loadPlaylists() || {};
    if (!(currentPlaylistName in playlists)) {
        playlists[currentPlaylistName] = [];
    }
    displayPlaylist();
}

function saveAllPlaylists() {
    window.electronAPI.savePlaylists(playlists);
}

function createPlaylist() {
    const playlistName = document.getElementById('playlistName').value.trim();
    if (playlistName && !(playlistName in playlists)) {
        playlists[playlistName] = [];
        currentPlaylistName = playlistName;
        displayPlaylistsDropdown();
        displayPlaylist();
        saveAllPlaylists();
    }
}

function renameCurrentPlaylist() {
    const newName = document.getElementById('renamePlaylistInput').value.trim();
    if (newName && newName !== currentPlaylistName && !(newName in playlists)) {
        playlists[newName] = playlists[currentPlaylistName];
        delete playlists[currentPlaylistName];
        currentPlaylistName = newName;
        displayPlaylistsDropdown();
        displayPlaylist();
        saveAllPlaylists();
        document.getElementById('renamePlaylistModal').style.display = 'none';
    }
}


function deleteCurrentPlaylist() {
    if (currentPlaylistName in playlists) {
        delete playlists[currentPlaylistName];
        currentPlaylistName = Object.keys(playlists)[0] || "Default Playlist";
        displayPlaylistsDropdown();
        displayPlaylist();
        saveAllPlaylists();
    }
}

function displayPlaylistsDropdown() {
    const dropdown = document.getElementById('playlistsDropdown');
    dropdown.innerHTML = "";
    Object.keys(playlists).forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        dropdown.appendChild(option);
    });
    dropdown.value = currentPlaylistName;
}

function displayPlaylist() {
    const playlistElement = document.getElementById('playlist');
    const songs = playlists[currentPlaylistName] || [];
    playlistElement.innerHTML = songs.map((song, index) => 
        `<li ${index === currentIndex ? 'style="font-weight: bold;"' : ''}>${song.artist} - ${song.title}</li>`
    ).join('');
}

function saveCurrentPlaylist() {
    playlists[currentPlaylistName] = playlists[currentPlaylistName] || [];
    saveAllPlaylists();
}

function play() {
    const songs = playlists[currentPlaylistName] || [];
    if (songs.length > 0) {
        audio.src = `file://${songs[currentIndex].path}`;
        audio.play();
        audio.onended = () => next();
        displayPlaylist();
    } else {
        console.error("Playlist is empty. Please add songs to the playlist before playing.");
    }
}

function playSongAtIndex(index) {
    currentIndex = index;
    play();
}

function next() {
    const songs = playlists[currentPlaylistName] || [];
    currentIndex = (currentIndex + 1) % songs.length;
    play();
}

function previous() {
    const songs = playlists[currentPlaylistName] || [];
    currentIndex = (currentIndex - 1 + songs.length) % songs.length;
    play();
}

async function selectFiles() {
    const filePaths = await window.electronAPI.selectAudioFiles();
    const songs = playlists[currentPlaylistName] || [];

    for (const filePath of filePaths) {
        const fileName = getFileName(filePath);
        const { artist, title } = parseFileName(fileName);
        
        songs.push({
            path: filePath,
            title: title,
            artist: artist
        });
    }

    playlists[currentPlaylistName] = songs;
    displayPlaylist();
    saveAllPlaylists();
}

// Функція для витягування імені файлу без шляху
function getFileName(filePath) {
    return filePath.split('/').pop().split('\\').pop();
}

// Функція для парсингу імені файлу на виконавця та назву
function parseFileName(fileName) {
    const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
    const parts = nameWithoutExtension.split(" - ");
    
    if (parts.length === 2) {
        return {
            artist: parts[0].trim(),
            title: parts[1].trim()
        };
    } else {
        return {
            artist: "Unknown Artist",
            title: nameWithoutExtension
        };
    }
}
