const openListBtn = document.getElementById('playlist-btn');
const openDownloadBtn = document.getElementById('ytdownload');
const openListWrap = document.getElementById('playlist-wrap');
const openDownloadWrap = document.getElementById('download-wrap');

function toggleExclusive(openElement, closeElement) {
    // Перевіряємо, чи елемент вже відкритий. Якщо так, то просто закриваємо його.
    if (openElement.style.display === 'flex') {
        openElement.style.display = 'none';
    } else {
        // Закриваємо інший елемент і відкриваємо потрібний
        closeElement.style.display = 'none';
        openElement.style.display = 'flex';
    }
}

openListBtn.addEventListener('click', function() {
    toggleExclusive(openListWrap, openDownloadWrap);
});

openDownloadBtn.addEventListener('click', function() {
    toggleExclusive(openDownloadWrap, openListWrap);
});


const space = document.getElementById('space');
const createPlaylistCont = document.getElementById('createPlaylistCont');
const renamePlaylistCont = document.getElementById('rename-playlist');
const deletePlaylistCont = document.getElementById('delete-playlist');

const renamePlaylistButton = document.getElementById('renamePlaylistButton');
const deletePlaylistButton = document.getElementById('deletePlaylist');
const createPlaylistButton = document.getElementById('createPlaylist');
const notDeleteButton = document.getElementById('notDelete');

function toggleVisibility(button, container) {
    // Якщо контейнер вже відкритий, закриваємо його і показуємо space
    if (container.style.display === 'flex') {
        container.style.display = 'none';
        space.style.display = 'block';
    } else {
        // Закриваємо всі контейнери, залишаючи лише space
        createPlaylistCont.style.display = 'none';
        renamePlaylistCont.style.display = 'none';
        deletePlaylistCont.style.display = 'none';
        space.style.display = 'none';

        // Якщо контейнер був закритий, відкриваємо його
        container.style.display = 'flex';
    }
}

createPlaylistButton.addEventListener('click', () => {
    toggleVisibility(createPlaylistButton, createPlaylistCont);
});

renamePlaylistButton.addEventListener('click', () => {
    toggleVisibility(renamePlaylistButton, renamePlaylistCont);
});

deletePlaylistButton.addEventListener('click', () => {
    toggleVisibility(deletePlaylistButton, deletePlaylistCont);
});

// Додаємо обробник для кнопки notDelete
notDeleteButton.addEventListener('click', () => {
    // При натисканні на кнопку показуємо контейнер space
    createPlaylistCont.style.display = 'none';
    renamePlaylistCont.style.display = 'none';
    deletePlaylistCont.style.display = 'none';
    space.style.display = 'block';     
});    