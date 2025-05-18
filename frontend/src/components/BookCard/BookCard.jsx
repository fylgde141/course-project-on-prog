import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dealsAPI } from '../../services/api';
import './BookCard.css';

const BookCard = ({ book, refreshBooks }) => {
  const { isAuthenticated, currentUser } = useAuth();

  const handleCreateDeal = async () => {
    try {
      await dealsAPI.createDeal({
        recipient_id: book.user_id,
        recipient_book_id: book.id,
        place: 'To be determined'
      });

      alert('Deal request sent!');
    } catch (error) {
      console.error('Failed to create deal:', error);
      alert(`Failed to create deal: ${error.message}`);
    }
  };

  const isOwnBook = isAuthenticated && currentUser && book.user_id === currentUser.id;

  return (
    <div className="book-card card">
      <div className="book-card-image">
        <img
          src={`https://source.unsplash.com/300x400/?book,cover/&${book.id}`}
          alt={book.title}
        />
        {!book.is_available && (
          <div className="book-unavailable-badge">
            Not Available
          </div>
        )}
      </div>

      <div className="book-card-content">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-description">
          {book.description && book.description.length > 100
            ? `${book.description.substring(0, 100)}...`
            : book.description || 'No description available.'}
        </p>

        <div className="book-card-footer">
          <Link to={`/books/${book.id}`} className="btn btn-secondary">
            View Details
          </Link>

          {isAuthenticated && !isOwnBook && book.is_available && (
            <button
              className="btn btn-accent"
              onClick={handleCreateDeal}
            >
              I Want This
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;