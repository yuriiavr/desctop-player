// renderer.js
let audio = new Audio();
let playlists = {}; // Об’єкт для зберігання кількох плейлистів
let currentPlaylistName = "All";
let currentIndex = 0;

let sortable;

document.addEventListener("DOMContentLoaded", async () => {
    const playlistsDiv = document.getElementById('playlistsDiv');
    const playlistsDropdown = document.getElementById('playlistsDropdown');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');

    playlistsDiv.addEventListener('click', () => {
        playlistsDropdown.style.display = (playlistsDropdown.style.display === 'none' || playlistsDropdown.style.display === '') ? 'block' : 'none';
    });

    playlistsDropdown.addEventListener('click', (event) => {
        event.stopPropagation();
        const selectedPlaylist = event.target.textContent;
        if (selectedPlaylist in playlists) {
            currentPlaylistName = selectedPlaylist;
            playlistsDiv.textContent = selectedPlaylist;
            playlistsDropdown.style.display = 'none';
            displayPlaylist();
        }
    });

    document.addEventListener('click', (event) => {
        if (!playlistsDiv.contains(event.target) && !playlistsDropdown.contains(event.target)) {
            playlistsDropdown.style.display = 'none';
        }
    });

    searchInput.addEventListener('input', () => {
        displayPlaylist();
    });

    sortSelect.addEventListener('change', () => {
        sortPlaylist(sortSelect.value);
        displayPlaylist();
    });

    // Rename modal elements
    const closeRenameModal = document.getElementById('closeRenameModal');
    const cancelRenameButton = document.getElementById('cancelRenameButton');
    const renamePlaylistButton = document.getElementById('renamePlaylistButton');
    const renamePlaylistModal = document.getElementById('renamePlaylistModal');
    const renamePlaylistInput = document.getElementById('renamePlaylistInput');
    const confirmRenameButton = document.getElementById('confirmRenameButton');

    renamePlaylistButton.addEventListener('click', () => {
        renamePlaylistInput.value = currentPlaylistName;
        renamePlaylistModal.style.display = 'block';
    });

    closeRenameModal.addEventListener('click', () => {
        renamePlaylistModal.style.display = 'none';
    });

    cancelRenameButton.addEventListener('click', () => {
        renamePlaylistModal.style.display = 'none';
    });

    confirmRenameButton.addEventListener('click', () => {
        const newName = renamePlaylistInput.value.trim();
        if (newName && newName !== currentPlaylistName && !(newName in playlists)) {
            playlists[newName] = playlists[currentPlaylistName];
            delete playlists[currentPlaylistName];
            currentPlaylistName = newName;
            displayPlaylistsDropdown();
            displayPlaylist();
            saveAllPlaylists();
            renamePlaylistModal.style.display = 'none';
        }
    });

    document.getElementById('createPlaylistButton').addEventListener('click', createPlaylist);
    document.getElementById('savePlaylistButton').addEventListener('click', saveCurrentPlaylist);
    document.getElementById('deletePlaylistButton').addEventListener('click', deleteCurrentPlaylist);

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

    // Enable sorting via drag-and-drop using SortableJS
    sortable = new Sortable(playlistElement, {
        animation: 150,
        onEnd: () => {
            reorderPlaylist();
            saveAllPlaylists();
        }
    });

    // Volume and progress bar controls
    const volumeControl = document.getElementById('volumeControl');
    volumeControl.addEventListener('input', (event) => {
        audio.volume = event.target.value;
    });

    const progressBar = document.getElementById('progressBar');
    progressBar.addEventListener('input', (event) => {
        audio.currentTime = (event.target.value / 100) * audio.duration;
    });

    audio.addEventListener('timeupdate', updateProgressBar);
});

async function loadAllPlaylists() {
    playlists = await window.electronAPI.loadPlaylists() || {};
    if (!("All" in playlists)) {
        playlists["All"] = [];
    }
    updateAllPlaylist();
    displayPlaylist();
}

function saveAllPlaylists() {
    updateAllPlaylist();
    window.electronAPI.savePlaylists(playlists);
}

function createPlaylist() {
    const playlistName = document.getElementById('playlistName').value.trim();
    if (playlistName && !(playlistName in playlists) && playlistName !== "All") {
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
    if (currentPlaylistName in playlists && currentPlaylistName !== "All") {
        delete playlists[currentPlaylistName];
        updateAllPlaylist();
        currentPlaylistName = Object.keys(playlists)[0] || "All";
        displayPlaylistsDropdown();
        displayPlaylist();
        saveAllPlaylists();
    }
}

function displayPlaylistsDropdown() {
    const dropdown = document.getElementById('playlistsDropdown');
    dropdown.innerHTML = "";
    Object.keys(playlists).forEach(name => {
        const option = document.createElement('div');
        option.className = 'playlist-option';
        option.textContent = name;
        dropdown.appendChild(option);
    });
    document.getElementById('playlistsDiv').textContent = currentPlaylistName;
}

function displayPlaylist() {
    const playlistElement = document.getElementById('playlist');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const songs = playlists[currentPlaylistName] || [];
    const filteredSongs = songs.filter(song => song.title.toLowerCase().includes(searchTerm) || song.artist.toLowerCase().includes(searchTerm));

    playlistElement.innerHTML = filteredSongs.map((song, index) => 
        `<li ${index === currentIndex ? 'style="font-weight: bold;"' : ''} data-index="${index}">${song.artist} - ${song.title}</li>`
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
        const song = {
            path: filePath,
            title: title,
            artist: artist,
            addedAt: new Date().toISOString()
        };
        songs.push(song);
        if (currentPlaylistName !== "All") {
            playlists["All"].push(song);
        }
    }

    playlists[currentPlaylistName] = songs;
    updateAllPlaylist();
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

function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    progressBar.value = (audio.currentTime / audio.duration) * 100;
    document.getElementById('currentTime').textContent = formatTime(audio.currentTime);
    document.getElementById('durationTime').textContent = formatTime(audio.duration);
}

function updateAllPlaylist() {
    playlists["All"] = Object.keys(playlists).filter(name => name !== "All").reduce((allSongs, playlistName) => {
        return allSongs.concat(playlists[playlistName]);
    }, []);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function sortPlaylist(criteria) {
    const songs = playlists[currentPlaylistName] || [];
    switch (criteria) {
        case 'title':
            songs.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'artist':
            songs.sort((a, b) => a.artist.localeCompare(b.artist));
            break;
        case 'date':
            songs.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));
            break;
    }
    playlists[currentPlaylistName] = songs;
}

function reorderPlaylist() {
    const playlistElement = document.getElementById('playlist');
    const reorderedSongs = Array.from(playlistElement.children).map(item => {
        const index = parseInt(item.getAttribute('data-index'));
        return playlists[currentPlaylistName][index];
    });
    playlists[currentPlaylistName] = reorderedSongs;
}