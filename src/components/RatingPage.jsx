import React, { useState } from "react";

function RatingPage({ currentSentence, sentences, onSubmit, progress }) {
  const [ratings, setRatings] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const modelIndices = [1, 2, 3, 4, 5, 6, 7, 8];

  // Helper function to parse emotion from list format like "['Anger']"
  const parseEmotion = (emotionStr) => {
    if (!emotionStr) return "Unknown";
    try {
      // Remove brackets and quotes, extract emotion
      const match = emotionStr.match(/['"]([^'"]+)['"]/);
      return match ? match[1] : emotionStr;
    } catch {
      return emotionStr;
    }
  };

  const handleRatingChange = (modelIndex, rating) => {
    setRatings((prev) => ({
      ...prev,
      [modelIndex]: rating,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if all models are rated
    if (modelIndices.some((idx) => !ratings[idx])) {
      alert("Please rate all models");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(ratings);
      setRatings({}); // Reset for next sentence
    } catch (error) {
      alert("Error saving rating: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const sentenceNumber = progress.currentIndex + 1;
  const totalSentences = progress.totalSentences;

  return (
    <div className="rating-page">
      <div className="sentence-section">
        <h2>
          Sentence {sentenceNumber} of {totalSentences}
        </h2>
        <p className="sentence-text">{currentSentence.bangla_sentence}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <h3>Rate each model's emotion prediction</h3>

        <div className="models-section">
          {modelIndices.map((idx) => {
            const modelName = currentSentence[`model_${idx}`] || `Model ${idx}`;
            const emotionStr =
              currentSentence[`model_${idx}_emotion`] || "Unknown";
            const emotion = parseEmotion(emotionStr);
            const emojis = currentSentence[`model_${idx}_emojis`] || "❓";

            return (
              <div key={idx} className="model-card">
                <div className="model-header">
                  <h4>{modelName.replace(/_/g, " ")}</h4>
                </div>

                <div className="model-info">
                  <div className="emoji-display">
                    <span className="emoji">{emojis}</span>
                  </div>
                  <div className="emotion-display">
                    <span className="emotion-label">Emotion:</span>
                    <span className="emotion-value">{emotion}</span>
                  </div>
                </div>

                <div className="stars-section">
                  <p className="rating-label">Your Rating:</p>
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-button ${
                          ratings[idx] >= star ? "active" : ""
                        }`}
                        onClick={() => handleRatingChange(idx, star)}
                        title={`${star} star${star > 1 ? "s" : ""}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {ratings[idx] && (
                    <span className="rating-value">{ratings[idx]} / 5</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={submitting || modelIndices.some((idx) => !ratings[idx])}
        >
          {submitting ? "Saving..." : "Submit Rating"}
        </button>
      </form>
    </div>
  );
}

export default RatingPage;
