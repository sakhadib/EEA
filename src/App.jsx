import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase_config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { collection, getDocs, setDoc, doc, getDoc } from "firebase/firestore";
import AuthPage from "./components/AuthPage";
import RatingPage from "./components/RatingPage";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalSentences, setTotalSentences] = useState(0);
  const [loadingData, setLoadingData] = useState(false);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadSentences();
        await loadUserProgress(currentUser.uid);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load all sentences from Firestore
  const loadSentences = async () => {
    setLoadingData(true);
    try {
      const querySnapshot = await getDocs(collection(db, "bangla_emotions"));
      const sentencesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSentences(sentencesData);
      setTotalSentences(sentencesData.length);
    } catch (error) {
      console.error("Error loading sentences:", error);
      alert("Error loading sentences: " + error.message);
    } finally {
      setLoadingData(false);
    }
  };

  // Load user's progress
  const loadUserProgress = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setCurrentIndex(data.currentIndex || 0);
      }
    } catch (error) {
      console.error("Error loading user progress:", error);
    }
  };

  // Handle login
  const handleLogin = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Create or update user document in Firestore
      await setDoc(
        doc(db, "users", result.user.uid),
        {
          email: email,
          lastLogin: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      throw new Error(error.message);
    }
  };

  // Handle signup
  const handleSignup = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Create user document in Firestore
      await setDoc(doc(db, "users", result.user.uid), {
        email: email,
        currentIndex: 0,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });
    } catch (error) {
      throw new Error(error.message);
    }
  };

  // Handle rating submission
  const handleSubmitRating = async (ratings) => {
    if (!user) return;

    try {
      const sentenceId = sentences[currentIndex].id;

      // Save ratings to user's ratings subcollection
      await setDoc(doc(db, "users", user.uid, "ratings", sentenceId), {
        sentenceId: sentenceId,
        ratings: ratings,
        timestamp: new Date().toISOString(),
      });

      // Update user's current index
      const newIndex = currentIndex + 1;
      await setDoc(
        doc(db, "users", user.uid),
        {
          currentIndex: newIndex,
        },
        { merge: true }
      );

      setCurrentIndex(newIndex);
    } catch (error) {
      console.error("Error submitting rating:", error);
      throw error;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentIndex(0);
      setSentences([]);
    } catch (error) {
      alert("Error logging out: " + error.message);
    }
  };

  // Show loading state
  if (loading || (user && loadingData)) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Not authenticated - show login/signup
  if (!user) {
    return <AuthPage onLogin={handleLogin} onSignup={handleSignup} />;
  }

  // All sentences completed
  if (currentIndex >= sentences.length && sentences.length > 0) {
    return (
      <div className="app">
        <div className="app-header">
          <h1>Emotion Rater</h1>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <div className="completion-screen">
          <h2>🎉 Congratulations! 🎉</h2>
          <p>You have successfully rated all {sentences.length} sentences!</p>
          <p>Thank you for your participation in this research.</p>
          <button className="submit-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Show rating page
  if (sentences.length > 0 && currentIndex < sentences.length) {
    return (
      <div className="app-container">
        <div className="app-header">
          <h1>Emotion Rater</h1>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${((currentIndex + 1) / sentences.length) * 100}%`,
              }}
            />
            <span className="progress-text">
              {currentIndex + 1} / {sentences.length}
            </span>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <RatingPage
          currentSentence={sentences[currentIndex]}
          sentences={sentences}
          onSubmit={handleSubmitRating}
          progress={{
            currentIndex: currentIndex,
            totalSentences: totalSentences,
          }}
        />
      </div>
    );
  }

  // Loading data
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading sentences...</p>
    </div>
  );
}

export default App;
