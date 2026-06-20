/**
 * LIBRO - Library Manager
 * Logic for State Management, DOM Updates, and persistence
 */

// --- State Management ---
let books = JSON.parse(localStorage.getItem('libro_data')) || [];
let deleteId = null;

// --- DOM Elements ---
const bookGrid = document.getElementById('book-grid');
const emptyState = document.getElementById('empty-state');
const addBookForm = document.getElementById('add-book-form');
const addModal = document.getElementById('add-modal');
const deleteModal = document.getElementById('delete-modal');
const themeToggle = document.getElementById('theme-toggle');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const sortSelect = document.getElementById('sort-select');
const toastContainer = document.getElementById('toast-container');

// Stats Elements
const statTotal = document.getElementById('stat-total');
const statAvailable = document.getElementById('stat-available');
const statIssued = document.getElementById('stat-issued');
const statCategories = document.getElementById('stat-categories');

// --- Core Functions ---

const saveToLocalStorage = () => {
    localStorage.setItem('libro_data', JSON.stringify(books));
    renderBooks();
    updateStats();
};

const updateStats = () => {
    const total = books.length;
    const issued = books.filter(b => b.status === 'issued').length;
    const available = total - issued;
    const categories = new Set(books.map(b => b.category)).size;

    statTotal.textContent = total;
    statAvailable.textContent = available;
    statIssued.textContent = issued;
    statCategories.textContent = categories;
};

const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-msg">${message}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
};

const renderBooks = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filterCat = categoryFilter.value;
    const sortBy = sortSelect.value;

    let filteredBooks = books.filter(book => {
        const matchesSearch = book.name.toLowerCase().includes(searchTerm) || 
                             book.author.toLowerCase().includes(searchTerm);
        const matchesCat = filterCat === 'all' || book.category === filterCat;
        return matchesSearch && matchesCat;
    });

    // Sorting Logic
    if (sortBy === 'az') filteredBooks.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'za') filteredBooks.sort((a, b) => b.name.localeCompare(a.name));
    else if (sortBy === 'newest') filteredBooks.sort((a, b) => b.id - a.id);

    bookGrid.innerHTML = '';
    
    if (filteredBooks.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        filteredBooks.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.innerHTML = `
                <div class="card-header">
                    <span class="category-badge">${book.category}</span>
                    <button class="btn-icon" onclick="openDeleteModal(${book.id})" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
                <div class="card-body">
                    <h3 class="book-title">${book.name}</h3>
                    <p class="book-author">by ${book.author}</p>
                    <div style="margin-top: 15px;">
                        <span class="status-badge ${book.status === 'available' ? 'status-available' : 'status-issued'}">
                            ${book.status === 'available' ? '● Available' : '● Issued'}
                        </span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn ${book.status === 'available' ? 'btn-outline' : 'btn-primary'}" onclick="toggleStatus(${book.id})">
                        ${book.status === 'available' ? 'Mark as Issued' : 'Mark Available'}
                    </button>
                </div>
            `;
            bookGrid.appendChild(card);
        });
    }
};

// --- Event Handlers ---

addBookForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newBook = {
        id: Date.now(),
        name: document.getElementById('book-name').value,
        author: document.getElementById('book-author').value,
        category: document.getElementById('book-category').value,
        status: 'available'
    };

    books.push(newBook);
    saveToLocalStorage();
    addBookForm.reset();
    addModal.classList.remove('active');
    showToast(`"${newBook.name}" added to library!`);
});

const toggleStatus = (id) => {
    books = books.map(book => {
        if (book.id === id) {
            const newStatus = book.status === 'available' ? 'issued' : 'available';
            showToast(`Status updated to ${newStatus}`);
            return { ...book, status: newStatus };
        }
        return book;
    });
    saveToLocalStorage();
};

const openDeleteModal = (id) => {
    deleteId = id;
    const book = books.find(b => b.id === id);
    document.getElementById('delete-book-title').textContent = book.name;
    deleteModal.classList.add('active');
};

document.getElementById('confirm-delete-btn').addEventListener('click', () => {
    books = books.filter(b => b.id !== deleteId);
    saveToLocalStorage();
    deleteModal.classList.remove('active');
    showToast('Book deleted successfully', 'danger');
});

// Theme Toggle
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('libro_theme', newTheme);
});

// Import / Export
document.getElementById('export-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(books, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'library-data.json';
    a.click();
    showToast('Data exported successfully');
});

document.getElementById('import-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedBooks = JSON.parse(event.target.result);
            books = importedBooks;
            saveToLocalStorage();
            showToast('Library imported successfully');
        } catch (err) {
            showToast('Invalid JSON file', 'danger');
        }
    };
    reader.readAsText(file);
});

// Modal Logic
document.getElementById('open-add-modal').addEventListener('click', () => addModal.classList.add('active'));
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => addModal.classList.remove('active'));
});
document.querySelector('.close-delete').addEventListener('click', () => deleteModal.classList.remove('active'));

// Search & Filter Listeners
searchInput.addEventListener('input', renderBooks);
categoryFilter.addEventListener('change', renderBooks);
sortSelect.addEventListener('change', renderBooks);

// Initialize
window.onload = () => {
    const savedTheme = localStorage.getItem('libro_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    renderBooks();
    updateStats();
};