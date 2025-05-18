import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { booksAPI, dealsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './BookDetailsPage.css';

const BookDetailsPage = () => {
  const { id } = useParams();
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newReview, setNewReview] = useState('');

  useEffect(() => {
    fetchBookDetails();
  }, [id]);

  const fetchBookDetails = async () => {
    setLoading(true);
    try {
      const bookData = await booksAPI.getBookById(id);
      setBook(bookData);

      const reviewsData = await booksAPI.getBookReviews(id);
      setReviews(reviewsData);

      setError(null);
    } catch (err) {
      console.error('Failed to fetch book details:', err);
      setError('Failed to load book details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeal = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

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

  const handleAddReview = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!newReview.trim()) {
      alert('Please enter a review');
      return;
    }

    try {
      await booksAPI.addReview({
        book_id: id,
        review_text: newReview
      });

      setNewReview('');
      fetchBookDetails();
    } catch (error) {
      console.error('Failed to add review:', error);
      alert(`Failed to add review: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="loading-indicator container">Loading book details...</div>;
  }

  if (error) {
    return <div className="error-message alert alert-error container">{error}</div>;
  }

  if (!book) {
    return <div className="error-message container">Book not found</div>;
  }

  const isOwnBook = isAuthenticated && currentUser && book.user_id === currentUser.id;

  return (
    <div className="book-details-page container">
      <div className="book-details-container">
        <div className="book-image-container">
          <img
            src={`https://source.unsplash.com/600x800/?book,cover/&${book.id}`}
            alt={book.title}
            className="book-image"
          />
          {!book.is_available && (
            <div className="book-unavailable-badge large">
              Not Available
            </div>
          )}
        </div>

        <div className="book-info">
          <h1 className="book-title">{book.title}</h1>

          <p className="book-owner">
            Shared by: <span>{isOwnBook ? 'You' : 'User'}</span>
          </p>

          <div className="book-description">
            <h2>Description</h2>
            <p>{book.description || 'No description available.'}</p>
          </div>

          {isAuthenticated && !isOwnBook && book.is_available && (
            <button
              className="btn btn-accent request-btn"
              onClick={handleCreateDeal}
            >
              Request to Exchange
            </button>
          )}

          {isOwnBook && (
            <div className="book-actions">
              <button className="btn btn-secondary">
                Edit Book
              </button>
              <button className="btn btn-error">
                Delete Book
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="book-reviews">
        <h2>Reviews</h2>

        {reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.review_id} className="review-item">
                <p className="review-author">User</p>
                <p className="review-text">{review.review_text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-reviews">No reviews yet.</p>
        )}

        {isAuthenticated && (
          <form onSubmit={handleAddReview} className="add-review-form">
            <h3>Add Your Review</h3>
            <textarea
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              placeholder="Write your review..."
              className="form-input"
              rows="4"
              required
            ></textarea>
            <button type="submit" className="btn btn-primary">
              Submit Review
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookDetailsPage;