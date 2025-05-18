const API_URL = 'http://localhost:5000/api';

// Helper for handling fetch requests
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    // Check if the response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return {};
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: (credentials) => request('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  register: (userData) => request('/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
};

// Books API
export const booksAPI = {
  getAllBooks: (filters = {}) => {
    const queryParams = new URLSearchParams();

    if (filters.title) {
      queryParams.append('title', filters.title);
    }

    if (filters.isAvailable !== undefined) {
      queryParams.append('is_available', filters.isAvailable);
    }

    const queryString = queryParams.toString();
    return request(`/books${queryString ? `?${queryString}` : ''}`);
  },

  getBookById: (bookId) => request(`/books/${bookId}`),

  createBook: (bookData) => request('/books', {
    method: 'POST',
    body: JSON.stringify(bookData),
  }),

  updateBook: (bookId, bookData) => request(`/books/${bookId}`, {
    method: 'PUT',
    body: JSON.stringify(bookData),
  }),

  deleteBook: (bookId) => request(`/books/${bookId}`, {
    method: 'DELETE',
  }),

  getBookReviews: (bookId) => request(`/books/${bookId}/reviews`),

  addReview: (reviewData) => request('/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData),
  }),
};

// Deals API
export const dealsAPI = {
  createDeal: (dealData) => request('/deals', {
    method: 'POST',
    body: JSON.stringify(dealData),
  }),

  acceptDeal: (dealId, acceptData) => request(`/deals/${dealId}/accept`, {
    method: 'PUT',
    body: JSON.stringify(acceptData),
  }),

  completeDeal: (dealId) => request(`/deals/${dealId}/complete`, {
    method: 'PUT',
  }),
};

// User API
export const userAPI = {
  getUserBooks: () => request('/books?user_id=current'), // This endpoint might need adjustment

  getUserDeals: () => request('/deals?user_id=current'), // This endpoint might need adjustment
};