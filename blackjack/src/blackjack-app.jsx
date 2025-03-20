import React, { useState, useEffect } from 'react';

function BlackjackGame() {
  // States für Deck, Spieler- und Dealer-Karten, verbleibende Karten
  const [deckId, setDeckId] = useState(null);
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [remaining, setRemaining] = useState(0);

  // Beim Laden des Components: Neues Deck initialisieren (6 Decks)
  useEffect(() => {
    fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6')
      .then(res => res.json())
      .then(data => {
        setDeckId(data.deck_id);
        setRemaining(data.remaining);
      })
      .catch(err => console.error("Fehler beim Laden des Decks:", err));
  }, []);

  // Funktion, um eine oder mehrere Karten zu ziehen
  const drawCard = async (count = 1) => {
    if (!deckId) return;
    try {
      const response = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`);
      const data = await response.json();
      if (data.success) {
        setRemaining(data.remaining);
        return data.cards;
      }
    } catch (error) {
      console.error("Fehler beim Karten ziehen:", error);
    }
  };

  // Spieler zieht eine Karte
  const handlePlayerDraw = async () => {
    const cards = await drawCard(1);
    if (cards) {
      setPlayerCards(prev => [...prev, ...cards]);
    }
  };

  // Dealer zieht eine Karte
  const handleDealerDraw = async () => {
    const cards = await drawCard(1);
    if (cards) {
      setDealerCards(prev => [...prev, ...cards]);
    }
  };

  // Funktion zur Punkteberechnung (Asse als 1 oder 11)
  const calculatePoints = (cards) => {
    let points = 0;
    let aces = 0;
    cards.forEach(card => {
      const value = card.value;
      if (["KING", "QUEEN", "JACK"].includes(value)) {
        points += 10;
      } else if (value === "ACE") {
        aces += 1;
        points += 11;
      } else {
        points += parseInt(value, 10);
      }
    });
    // Korrigiere Punkte, falls Asse zu hoch zählen
    while (points > 21 && aces > 0) {
      points -= 10;
      aces--;
    }
    return points;
  };

  const playerPoints = calculatePoints(playerCards);
  const dealerPoints = calculatePoints(dealerCards);

  // Funktion für einen Reset des Spiels (neues Deck und leere Hände)
  const handleReset = () => {
    setPlayerCards([]);
    setDealerCards([]);
    fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6')
      .then(res => res.json())
      .then(data => {
        setDeckId(data.deck_id);
        setRemaining(data.remaining);
      })
      .catch(err => console.error("Fehler beim Reset des Spiels:", err));
  };

  return (
    <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1>Blackjack Spiel</h1>
      <div style={{ marginBottom: '20px' }}>
        <h2>Spieler ({playerPoints} Punkte)</h2>
        <div>
          {playerCards.map((card, index) => (
            <img key={index} src={card.image} alt={card.code} style={{ margin: '10px', height: '150px' }} />
          ))}
        </div>
        <button onClick={handlePlayerDraw} style={{ padding: '10px 20px', margin: '10px' }}>
          Karte ziehen
        </button>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <h2>Dealer ({dealerPoints} Punkte)</h2>
        <div>
          {dealerCards.map((card, index) => (
            <img key={index} src={card.image} alt={card.code} style={{ margin: '10px', height: '150px' }} />
          ))}
        </div>
        <button onClick={handleDealerDraw} style={{ padding: '10px 20px', margin: '10px' }}>
          Dealer zieht
        </button>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <p>Verbleibende Karten im Deck: {remaining}</p>
      </div>
      <div>
        <button onClick={handleReset} style={{ padding: '10px 20px', backgroundColor: '#f44336', color: '#fff' }}>
          Neues Spiel
        </button>
      </div>
    </div>
  );
}

export default BlackjackGame;
