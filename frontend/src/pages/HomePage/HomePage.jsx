import React, { useState, useEffect } from 'react';
import { booksAPI } from '../../services/api';
import BookCard from '../../components/BookCard/BookCard';
import './HomePage.css';

const HomePage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async (filters = {}) => {
    setLoading(true);
    try {
      const booksData = await booksAPI.getAllBooks(filters);
      setBooks(booksData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch books:', err);
      setError('Failed to load books. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBooks({
      title: searchTerm,
      isAvailable: showOnlyAvailable ? true : undefined
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setShowOnlyAvailable(false);
    fetchBooks();
  };

  return (
    <div className="home-page container">
      <section className="hero">
        <h1>Exchange Books with People Near You</h1>
        <p>Find interesting books and connect with fellow book lovers in your area</p>
      </section>

      <section className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for books..."
              className="form-input search-input"
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>

          <div className="filter-options">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={showOnlyAvailable}
                onChange={(e) => setShowOnlyAvailable(e.target.checked)}
              />
              <span>Show only available books</span>
            </label>

            <button
              type="button"
              className="clear-filters-btn"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        </form>
      </section>

      {loading ? (
        <div className="loading-indicator">Loading books...</div>
      ) : error ? (
        <div className="error-message alert alert-error">{error}</div>
      ) : (
        <section className="books-grid">
          {books.length > 0 ? (
            books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                refreshBooks={() => fetchBooks({
                  title: searchTerm,
                  isAvailable: showOnlyAvailable ? true : undefined
                })}
              />
            ))
          ) : (
            <div className="no-books-message">
              No books found. Try adjusting your search or be the first to add a book!
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default HomePage;