import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { booksAPI } from '../../services/api';
import BookCard from '../../components/BookCard/BookCard';
import './MyBooksPage.css';

const MyBooksPage = () => {
  const { isAuthenticated } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyBooks();
    }
  }, [isAuthenticated]);

  const fetchMyBooks = async () => {
    setLoading(true);
    try {
      // Adjust this API call based on your actual API implementation
      // This is a placeholder - you might need to fetch all books and filter client-side
      const myBooks = await booksAPI.getAllBooks();
      // Filter to only show my books
      // This is just a placeholder logic - implement based on your actual API
      setBooks(myBooks);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch my books:', err);
      setError('Failed to load your books. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBook({
      ...newBook,
      [name]: value,
    });
  };

  const handleAddBook = async (e) => {
    e.preventDefault();

    if (!newBook.title.trim()) {
      alert('Please enter a book title');
      return;
    }

    try {
      await booksAPI.createBook(newBook);

      setNewBook({
        title: '',
        description: '',
      });

      setShowAddForm(false);
      fetchMyBooks();
    } catch (err) {
      console.error('Failed to add book:', err);
      alert(`Failed to add book: ${err.message}`);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="my-books-page container">
      <div className="page-header">
        <h1>My Books</h1>
        <button
          className="btn btn-primary add-book-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add New Book'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-book-form card">
          <h2>Add a New Book</h2>
          <form onSubmit={handleAddBook}>
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Title <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={newBook.title}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter book title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={newBook.description}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter book description"
                rows="4"
              ></textarea>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                Save Book
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-indicator">Loading your books...</div>
      ) : error ? (
        <div className="error-message alert alert-error">{error}</div>
      ) : (
        <div className="my-books-content">
          {books.length > 0 ? (
            <div className="books-grid">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  refreshBooks={fetchMyBooks}
                />
              ))}
            </div>
          ) : (
            <div className="no-books-message">
              <p>You haven't added any books yet.</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddForm(true)}
              >
                Add Your First Book
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyBooksPage;