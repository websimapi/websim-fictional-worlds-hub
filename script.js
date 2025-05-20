// Initialize WebsimSocket for database operations
const room = new WebsimSocket();

// Global state
let currentUser = null;
let currentCategory = 'all';
let currentChannel = 'general';
let mediaCollection = [];
let libraryCollection = [];
let currentMediaDetail = null;

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Get current user
    initializeUser();
    
    // Set up navigation
    setupNavigation();
    
    // Set up media creation
    setupMediaCreation();
    
    // Set up theme toggle
    setupThemeToggle();
    
    // Set up search
    setupSearch();
    
    // Set up community chat
    setupChat();
    
    // Load initial data
    loadMedia();
    
    // Subscribe to changes
    subscribeToChanges();
});

// Initialize current user
async function initializeUser() {
    try {
        const userInfo = await window.websim.getUser();
        if (userInfo) {
            currentUser = userInfo;
            document.getElementById('username').textContent = userInfo.username;
            
            const avatarUrl = `https://images.websim.com/avatar/${userInfo.username}`;
            document.getElementById('user-avatar').src = avatarUrl;
        }
    } catch (error) {
        console.error('Error getting user:', error);
    }
}

// Set up navigation
function setupNavigation() {
    // Main navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.getAttribute('data-view');
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show corresponding view
            const views = document.querySelectorAll('.view');
            views.forEach(v => v.classList.remove('active'));
            document.getElementById(`${view}-view`).classList.add('active');
        });
    });
    
    // Category navigation
    const categoryLinks = document.querySelectorAll('.category');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.getAttribute('data-category');
            currentCategory = category;
            
            // Update active category
            categoryLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Filter media by category
            filterMediaByCategory();
        });
    });
    
    // Channel navigation
    const channelLinks = document.querySelectorAll('.channel');
    channelLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const channel = link.getAttribute('data-channel');
            currentChannel = channel;
            
            // Update active channel
            channelLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Load channel messages
            loadChannelMessages(channel);
        });
    });
    
    // Sort select
    document.getElementById('sort-select').addEventListener('change', (e) => {
        const sortBy = e.target.value;
        sortMedia(sortBy);
    });
}

// Set up media creation
function setupMediaCreation() {
    const createButton = document.getElementById('create-button');
    const modal = document.getElementById('media-creation');
    const closeButton = document.querySelector('.close-button');
    const form = document.getElementById('generation-form');
    
    // Open modal
    createButton.addEventListener('click', () => {
        modal.classList.add('active');
    });
    
    // Close modal
    closeButton.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        generateMedia();
    });
    
    // Media type select - update genre options based on media type
    const mediaTypeSelect = document.getElementById('media-type');
    mediaTypeSelect.addEventListener('change', updateGenreOptions);
}

// Update genre options based on media type
function updateGenreOptions() {
    const mediaType = document.getElementById('media-type').value;
    const genreSelect = document.getElementById('media-genre');
    
    // Clear current options
    genreSelect.innerHTML = '<option value="">Select a genre</option>';
    
    // Add appropriate genres based on media type
    let genres = [];
    
    switch (mediaType) {
        case 'game':
            genres = ['Action', 'Adventure', 'RPG', 'Simulation', 'Strategy', 'Sports', 'Racing', 'Puzzle', 'Horror', 'Sci-Fi', 'Fantasy'];
            break;
        case 'movie':
            genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Fantasy', 'Thriller', 'Mystery', 'Romance', 'Documentary'];
            break;
        case 'book':
            genres = ['Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance', 'Sci-Fi', 'Fantasy', 'Horror', 'Biography', 'History', 'Poetry'];
            break;
        case 'tv-show':
            genres = ['Comedy', 'Drama', 'Action', 'Adventure', 'Sci-Fi', 'Fantasy', 'Horror', 'Mystery', 'Reality', 'Documentary', 'Animation'];
            break;
    }
    
    // Add options
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.toLowerCase();
        option.textContent = genre;
        genreSelect.appendChild(option);
    });
}

// Set up theme toggle
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle-btn');
    const app = document.getElementById('app');
    
    themeToggle.addEventListener('click', () => {
        app.classList.toggle('theme-light');
        
        // Update toggle icon
        if (app.classList.contains('theme-light')) {
            themeToggle.textContent = '☀️';
        } else {
            themeToggle.textContent = '🌙';
        }
    });
}

// Set up search
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim().toLowerCase();
        searchMedia(query);
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim().toLowerCase();
            searchMedia(query);
        }
    });
}

// Search media
function searchMedia(query) {
    if (query === '') {
        // Reset to show all media
        renderMediaGrid(mediaCollection);
        return;
    }
    
    const filtered = mediaCollection.filter(media => {
        return (
            media.title.toLowerCase().includes(query) ||
            media.type.toLowerCase().includes(query) ||
            media.genre.toLowerCase().includes(query) ||
            media.description.toLowerCase().includes(query)
        );
    });
    
    renderMediaGrid(filtered);
}

// Set up chat
function setupChat() {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    
    // Load initial messages
    loadChannelMessages(currentChannel);
    
    // Load online users
    loadOnlineUsers();
    
    // Send message handler
    sendButton.addEventListener('click', () => {
        sendMessage();
    });
    
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// Load channel messages
function loadChannelMessages(channel) {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = '';
    
    // Get messages directly without using .then() since getList() returns the array directly
    const messages = room.collection('message')
        .filter({ channel: channel })
        .getList();
    
    // Sort messages by creation time (oldest first)
    messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    messages.forEach(message => {
        addMessageToChat(message);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Add message to chat
function addMessageToChat(message) {
    const messagesContainer = document.getElementById('chat-messages');
    
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    
    const avatarUrl = `https://images.websim.com/avatar/${message.username}`;
    
    messageElement.innerHTML = `
        <div class="message-avatar">
            <img src="${avatarUrl}" alt="${message.username}">
        </div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-username">${message.username}</span>
                <span class="message-time">${formatDate(message.created_at)}</span>
            </div>
            <div class="message-text">${message.text}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
}

// Send message
async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const text = messageInput.value.trim();
    
    if (text === '') return;
    
    try {
        await room.collection('message').create({
            channel: currentChannel,
            text: text
        });
        
        messageInput.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

// Load online users
async function loadOnlineUsers() {
    const usersList = document.getElementById('online-users');
    usersList.innerHTML = '';
    
    try {
        const info = await room.getPresenceInfo();
        const users = info.users || [];
        
        if (users.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.textContent = 'No users online';
            usersList.appendChild(emptyMessage);
            return;
        }
        
        users.forEach(user => {
            const userElement = document.createElement('li');
            userElement.className = 'online-user';
            
            const avatarUrl = `https://images.websim.com/avatar/${user.username}`;
            
            userElement.innerHTML = `
                <div class="user-avatar">
                    <img src="${avatarUrl}" alt="${user.username}">
                </div>
                <span class="user-name">${user.username}</span>
            `;
            
            usersList.appendChild(userElement);
        });
    } catch (error) {
        console.error('Error loading online users:', error);
    }
}

// Load media from database
function loadMedia() {
    // Get media directly without using .then()
    const media = room.collection('media').getList();
    mediaCollection = media;
    renderMediaGrid(media);
    renderFeaturedMedia(media);
    
    // Get library directly
    const library = room.collection('library')
        .filter({ username: currentUser?.username })
        .getList();
    
    libraryCollection = library;
    renderLibrary();
}

// Render media grid
function renderMediaGrid(media) {
    const mediaGrid = document.getElementById('media-grid');
    mediaGrid.innerHTML = '';
    
    if (media.length === 0) {
        mediaGrid.innerHTML = `
            <div class="empty-media">
                <p>No media found. Create some!</p>
            </div>
        `;
        return;
    }
    
    media.forEach(item => {
        const mediaCard = createMediaCard(item);
        mediaGrid.appendChild(mediaCard);
    });
}

// Render featured media
function renderFeaturedMedia(media) {
    const featuredGrid = document.getElementById('featured-grid');
    featuredGrid.innerHTML = '';
    
    // Get random featured media (up to 3 items)
    const featured = media.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    if (featured.length === 0) {
        featuredGrid.innerHTML = `
            <div class="empty-media">
                <p>No featured media available.</p>
            </div>
        `;
        return;
    }
    
    featured.forEach(item => {
        const mediaCard = createMediaCard(item);
        featuredGrid.appendChild(mediaCard);
    });
}

// Render library
function renderLibrary() {
    const libraryGrid = document.getElementById('library-grid');
    libraryGrid.innerHTML = '';
    
    if (libraryCollection.length === 0) {
        libraryGrid.innerHTML = `
            <div class="empty-library">
                <p>Your library is empty. Generate and save some media!</p>
            </div>
        `;
        return;
    }
    
    // Get full media details for library items
    const libraryItems = libraryCollection.map(lib => {
        return mediaCollection.find(media => media.id === lib.media_id);
    }).filter(Boolean);
    
    libraryItems.forEach(item => {
        const mediaCard = createMediaCard(item);
        libraryGrid.appendChild(mediaCard);
    });
}

// Create media card
function createMediaCard(media) {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.setAttribute('data-id', media.id);
    
    card.innerHTML = `
        <div class="media-image">
            <img src="${media.image_url}" alt="${media.title}">
        </div>
        <div class="media-info">
            <div class="media-type">${capitalizeFirstLetter(media.type)}</div>
            <h3 class="media-title">${media.title}</h3>
            <div class="media-meta">
                <span>${media.year}</span>
                <span>${media.genre}</span>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        showMediaDetail(media);
    });
    
    return card;
}

// Show media detail
function showMediaDetail(media) {
    currentMediaDetail = media;
    
    const detailModal = document.getElementById('media-detail');
    const closeDetail = document.querySelector('.close-detail');
    
    // Set media details
    document.getElementById('detail-image').src = media.image_url;
    document.getElementById('detail-title').textContent = media.title;
    document.getElementById('detail-type').textContent = capitalizeFirstLetter(media.type);
    document.getElementById('detail-year').textContent = media.year;
    document.getElementById('detail-genre').textContent = capitalizeFirstLetter(media.genre);
    document.getElementById('detail-description').textContent = media.description;
    
    // Set type-specific details
    const specificsContainer = document.getElementById('detail-specifics');
    specificsContainer.innerHTML = '';
    
    switch (media.type) {
        case 'game':
            document.getElementById('detail-runtime').textContent = `${media.playtime} hours`;
            document.getElementById('detail-rating').textContent = `${media.rating}/10`;
            document.getElementById('detail-creator-label').textContent = 'Developer:';
            document.getElementById('detail-creator').textContent = media.creator;
            
            specificsContainer.innerHTML = `
                <h3>Features</h3>
                <ul class="detail-features">
                    ${media.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
                <h3>Platforms</h3>
                <p>${media.platforms.join(', ')}</p>
            `;
            break;
            
        case 'movie':
            document.getElementById('detail-runtime').textContent = `${media.runtime} min`;
            document.getElementById('detail-rating').textContent = `${media.rating}/10`;
            document.getElementById('detail-creator-label').textContent = 'Director:';
            document.getElementById('detail-creator').textContent = media.creator;
            
            specificsContainer.innerHTML = `
                <h3>Cast</h3>
                <p>${media.cast.join(', ')}</p>
            `;
            break;
            
        case 'book':
            document.getElementById('detail-runtime').textContent = `${media.pages} pages`;
            document.getElementById('detail-rating').textContent = `${media.rating}/10`;
            document.getElementById('detail-creator-label').textContent = 'Author:';
            document.getElementById('detail-creator').textContent = media.creator;
            
            specificsContainer.innerHTML = `
                <h3>Publisher</h3>
                <p>${media.publisher}</p>
            `;
            break;
            
        case 'tv-show':
            document.getElementById('detail-runtime').textContent = `${media.seasons} seasons`;
            document.getElementById('detail-rating').textContent = `${media.rating}/10`;
            document.getElementById('detail-creator-label').textContent = 'Creator:';
            document.getElementById('detail-creator').textContent = media.creator;
            
            specificsContainer.innerHTML = `
                <h3>Cast</h3>
                <p>${media.cast.join(', ')}</p>
                <h3>Episodes</h3>
                <p>${media.episodes} episodes</p>
            `;
            break;
    }
    
    // Add reviews
    const reviewsContainer = document.getElementById('detail-reviews');
    reviewsContainer.innerHTML = '';
    
    if (media.reviews && media.reviews.length > 0) {
        media.reviews.forEach(review => {
            const reviewElement = document.createElement('div');
            reviewElement.className = 'review';
            
            reviewElement.innerHTML = `
                <div class="review-header">
                    <span class="review-author">${review.author}</span>
                    <span class="review-rating">${review.rating}/10</span>
                </div>
                <p class="review-text">${review.text}</p>
            `;
            
            reviewsContainer.appendChild(reviewElement);
        });
    } else {
        reviewsContainer.innerHTML = '<p>No reviews yet.</p>';
    }
    
    // Setup save and share buttons
    const saveButton = document.getElementById('save-button');
    const shareButton = document.getElementById('share-button');
    
    saveButton.onclick = () => saveToLibrary(media);
    shareButton.onclick = () => shareMedia(media);
    
    // Show modal
    detailModal.classList.add('active');
    
    // Close modal when clicking on X
    closeDetail.addEventListener('click', () => {
        detailModal.classList.remove('active');
    });
    
    // Close modal when clicking outside
    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) {
            detailModal.classList.remove('active');
        }
    });
}

// Generate media
async function generateMedia() {
    const mediaType = document.getElementById('media-type').value;
    const concept = document.getElementById('media-concept').value;
    const genre = document.getElementById('media-genre').value;
    
    // Show loading spinner
    document.getElementById('generation-form').style.display = 'none';
    document.getElementById('generation-loading').style.display = 'flex';
    
    try {
        // Use LLM to generate media details
        const prompt = `Generate a fictional ${mediaType} with the concept "${concept}" in the ${genre} genre. Include title, year, description, creator, rating, and other details appropriate for the type (like playtime for games, runtime for movies, pages for books, seasons for TV shows). For games include platforms and features. For movies and TV shows include cast. Make it sound realistic but entirely fictional. Format as JSON.`;
        
        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an AI that generates detailed fictional media. For each request, create a compelling fictional ${mediaType} in the ${genre} genre based on the concept provided. Be creative and detailed. Return your response as a valid JSON object with appropriate fields for the media type.`,
                },
                {
                    role: "user",
                    content: prompt,
                }
            ],
            json: true
        });
        
        let mediaDetails = JSON.parse(completion.content);
        
        // Generate an image for the media
        const imagePrompt = `Cover art for a ${genre} ${mediaType} titled "${mediaDetails.title}". Professional quality, poster style, dramatic lighting, high detail.`;
        const imageResult = await websim.imageGen({
            prompt: imagePrompt,
            aspect_ratio: "2:3",
        });
        
        // Create final media object
        const media = {
            id: generateUniqueId(),
            type: mediaType,
            title: mediaDetails.title,
            year: mediaDetails.year || new Date().getFullYear(),
            genre: genre,
            description: mediaDetails.description,
            creator: mediaDetails.creator,
            rating: mediaDetails.rating || (Math.floor(Math.random() * 3) + 7),
            image_url: imageResult.url,
            created_by: currentUser.username,
            created_at: new Date().toISOString(),
            published: false
        };
        
        // Add type-specific properties
        switch (mediaType) {
            case 'game':
                media.playtime = mediaDetails.playtime || Math.floor(Math.random() * 50) + 10;
                media.platforms = mediaDetails.platforms || ['PC', 'PlayStation', 'Xbox'];
                media.features = mediaDetails.features || ['Multiplayer', 'Open World', 'RPG Elements'];
                break;
                
            case 'movie':
                media.runtime = mediaDetails.runtime || Math.floor(Math.random() * 60) + 90;
                media.cast = mediaDetails.cast || ['Actor 1', 'Actor 2', 'Actor 3'];
                break;
                
            case 'book':
                media.pages = mediaDetails.pages || Math.floor(Math.random() * 300) + 200;
                media.publisher = mediaDetails.publisher || 'Fictional Press';
                break;
                
            case 'tv-show':
                media.seasons = mediaDetails.seasons || Math.floor(Math.random() * 5) + 1;
                media.episodes = mediaDetails.episodes || (media.seasons * (Math.floor(Math.random() * 10) + 8));
                media.cast = mediaDetails.cast || ['Actor 1', 'Actor 2', 'Actor 3'];
                break;
        }
        
        // Generate reviews
        media.reviews = [];
        for (let i = 0; i < 3; i++) {
            const reviewPrompt = `Write a short review for the ${mediaType} "${media.title}" which is a ${genre} ${mediaType}. The review should be from the perspective of a critic or fan, with a rating out of 10.`;
            
            const reviewCompletion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: reviewPrompt,
                    }
                ]
            });
            
            const reviewText = reviewCompletion.content;
            
            // Extract a rating from the review or generate a random one
            let rating = Math.floor(Math.random() * 3) + 7; // Default rating between 7-10
            const ratingMatch = reviewText.match(/(\d+(\.\d+)?)\s*\/\s*10/);
            if (ratingMatch) {
                rating = parseFloat(ratingMatch[1]);
            }
            
            media.reviews.push({
                author: generateRandomName(),
                rating: rating,
                text: reviewText.replace(/(\d+(\.\d+)?)\s*\/\s*10/, '').trim()
            });
        }
        
        // Save to database
        await room.collection('media').create(media);
        
        // Hide loading spinner
        document.getElementById('generation-form').style.display = 'block';
        document.getElementById('generation-loading').style.display = 'none';
        
        // Close modal
        document.getElementById('media-creation').classList.remove('active');
        
        // Reset form
        document.getElementById('generation-form').reset();
        
        // Show success notification
        showNotification(`${capitalizeFirstLetter(mediaType)} "${media.title}" created successfully!`);
        
        // Show media detail
        showMediaDetail(media);
        
    } catch (error) {
        console.error('Error generating media:', error);
        
        // Hide loading spinner
        document.getElementById('generation-form').style.display = 'block';
        document.getElementById('generation-loading').style.display = 'none';
        
        // Show error notification
        showNotification('Error generating media. Please try again.', 'error');
    }
}

// Save media to library
async function saveToLibrary(media) {
    // Check if already in library
    const alreadySaved = libraryCollection.some(item => item.media_id === media.id);
    
    if (alreadySaved) {
        showNotification(`"${media.title}" is already in your library!`, 'info');
        return;
    }
    
    try {
        await room.collection('library').create({
            media_id: media.id,
            saved_at: new Date().toISOString()
        });
        
        showNotification(`"${media.title}" added to your library!`);
    } catch (error) {
        console.error('Error saving to library:', error);
        showNotification('Error saving to library. Please try again.', 'error');
    }
}

// Share media
async function shareMedia(media) {
    // Create a message with media info
    const message = `Check out this ${media.type}: ${media.title} (${media.year}) - ${media.id}`;
    
    try {
        // Send to current channel
        await room.collection('message').create({
            channel: currentChannel,
            text: message,
            is_share: true,
            media_id: media.id
        });
        
        showNotification(`"${media.title}" shared in ${currentChannel} channel!`);
        
        // Close detail view
        document.getElementById('media-detail').classList.remove('active');
        
        // Switch to community view
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(l => l.classList.remove('active'));
        document.querySelector('[data-view="community"]').classList.add('active');
        
        const views = document.querySelectorAll('.view');
        views.forEach(v => v.classList.remove('active'));
        document.getElementById('community-view').classList.add('active');
    } catch (error) {
        console.error('Error sharing media:', error);
        showNotification('Error sharing media. Please try again.', 'error');
    }
}

// Filter media by category
function filterMediaByCategory() {
    if (currentCategory === 'all') {
        renderMediaGrid(mediaCollection);
        return;
    }
    
    const filtered = mediaCollection.filter(media => {
        return media.type === currentCategory.slice(0, -1); // Remove the 's' from the category
    });
    
    renderMediaGrid(filtered);
}

// Sort media
function sortMedia(sortBy) {
    let sorted = [...mediaCollection];
    
    switch (sortBy) {
        case 'newest':
            sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'popular':
            // Sort by rating and number of reviews
            sorted.sort((a, b) => {
                const aPopularity = a.rating * (a.reviews?.length || 0);
                const bPopularity = b.rating * (b.reviews?.length || 0);
                return bPopularity - aPopularity;
            });
            break;
        case 'rating':
            sorted.sort((a, b) => b.rating - a.rating);
            break;
    }
    
    renderMediaGrid(sorted);
}

// Subscribe to changes in the database
function subscribeToChanges() {
    // Subscribe to media changes
    room.collection('media').subscribe(media => {
        mediaCollection = media;
        renderMediaGrid(media.filter(m => currentCategory === 'all' || m.type === currentCategory.slice(0, -1)));
        renderFeaturedMedia(media);
    });
    
    // Subscribe to library changes
    room.collection('library')
        .filter({ username: currentUser?.username })
        .subscribe(library => {
            libraryCollection = library;
            renderLibrary();
        });
    
    // Subscribe to message changes
    room.collection('message')
        .filter({ channel: currentChannel })
        .subscribe(messages => {
            // Only update if we have new messages
            const messagesContainer = document.getElementById('chat-messages');
            const currentMessageCount = messagesContainer.querySelectorAll('.chat-message').length;
            
            if (messages.length > currentMessageCount) {
                loadChannelMessages(currentChannel);
            }
        });
}

// Helper functions
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function generateRandomName() {
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Skyler', 'Dakota', 'Reese', 'Emery'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Append to body
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: var(--border-radius);
        color: white;
        opacity: 0;
        transform: translateY(-20px);
        transition: opacity 0.3s, transform 0.3s;
        z-index: 1000;
        max-width: 300px;
    }
    .notification.show {
        opacity: 1;
        transform: translateY(0);
    }
    .notification.success {
        background-color: #28a745;
    }
    .notification.error {
        background-color: #dc3545;
    }
    .notification.info {
        background-color: #17a2b8;
    }
`;
document.head.appendChild(notificationStyles);