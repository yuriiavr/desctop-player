const openListBtn = document.getElementById('playlist-btn');
const openDownloadBtn = document.getElementById('ytdownload');
const openListWrap = document.getElementById('playlist-wrap');
const openDownloadWrap = document.getElementById('download-wrap');

function toggleExclusive(openElement, closeElement) {
    if (openElement.style.display === 'flex') {
        openElement.style.display = 'none';
    } else {
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

    if (container.style.display === 'flex') {
        container.style.display = 'none';
        space.style.display = 'block';
    } else {
        createPlaylistCont.style.display = 'none';
        renamePlaylistCont.style.display = 'none';
        deletePlaylistCont.style.display = 'none';
        space.style.display = 'none';

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

notDeleteButton.addEventListener('click', () => {
    createPlaylistCont.style.display = 'none';
    renamePlaylistCont.style.display = 'none';
    deletePlaylistCont.style.display = 'none';
    space.style.display = 'block';     
});    