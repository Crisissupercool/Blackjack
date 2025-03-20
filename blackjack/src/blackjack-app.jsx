import React, { useState, useEffect } from 'react';

function BlackjackGame() {
  const [stake, setStake] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [deckId, setDeckId] = useState(null);
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [remaining, setRemaining] = useState(0);
  const [result, setResult] = useState('');
  const [playerStand, setPlayerStand] = useState(false); // Signal, dass der Spieler stehen bleibt

  // Deck initialisieren (6 Decks)
  const initializeDeck = () => {
    fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6')
      .then(res => res.json())
      .then(data => {
        setDeckId(data.deck_id);
        setRemaining(data.remaining);
      })
      .catch(err => console.error("Fehler beim Laden des Decks:", err));
  };

  useEffect(() => {
    if (gameStarted) {
      initializeDeck();
    }
  }, [gameStarted]);

  // Funktion, um Karten zu ziehen (wenn das Spiel läuft)
  const drawCard = async (count = 1) => {
    if (!deckId || result) return;
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
    if (result || playerStand) return;
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

  // Punkteberechnung: Zahlenwerte, Bildkarten = 10, Asse flexibel (11 bzw. 1)
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
    while (points > 21 && aces > 0) {
      points -= 10;
      aces--;
    }
    return points;
  };

  const playerPoints = calculatePoints(playerCards);
  const dealerPoints = calculatePoints(dealerCards);

  // Überprüfe den Spielerstand: Überschreitet er 21, ist das Spiel sofort verloren
  useEffect(() => {
    if (!gameStarted || playerCards.length === 0) return;
    if (playerPoints > 21) {
      setResult("💀 Du hast über 21! Du verlierst.");
    }
  }, [playerCards, playerPoints, gameStarted]);

  // Sobald der Spieler "Stand" wählt, übernimmt der Dealer automatisch
  const handleStand = async () => {
    if (result) return;
    setPlayerStand(true);
  
    let dealerHand = [...dealerCards];
    let dealerTotal = calculatePoints(dealerHand);
  
    while (dealerTotal < 17) {
      const newCard = await drawCard(1);
      dealerHand = [...dealerHand, ...newCard];
      setDealerCards(dealerHand); // State aktualisieren
      await new Promise(resolve => setTimeout(resolve, 500)); // kleine Pause für Realismus
  
      dealerTotal = calculatePoints(dealerHand);
  
      if (dealerTotal > 21) {
        setResult("🎉 Dealer hat über 21! Du gewinnst!");
        return;
      }
    }
  
    // Dealer hat 17+ erreicht, jetzt vergleichen
    if (dealerTotal > playerPoints) {
      setResult("💀 Dealer gewinnt!");
    } else if (dealerTotal === playerPoints) {
      setResult("Unentschieden!");
    } else {
      setResult("🎉 Du gewinnst!");
    }
  };
  

  // Spiel zurücksetzen
  const handleReset = () => {
    setPlayerCards([]);
    setDealerCards([]);
    setDeckId(null);
    setRemaining(0);
    setGameStarted(false);
    setStake('');
    setResult('');
    setPlayerStand(false);
  };

  // Beim Absenden des Einsatzformulars wird das Spiel gestartet
  const handleStartGame = (e) => {
    e.preventDefault();
    if (stake.trim() === '' || isNaN(stake) || Number(stake) <= 0) {
      alert("Bitte gib einen gültigen Einsatz ein.");
      return;
    }
    setGameStarted(true);
  };

  // Falls das Spiel noch nicht gestartet ist, zeige das Einsatzformular
  if (!gameStarted) {
    return (
      <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <h1>Blackjack Spiel</h1>
        <form onSubmit={handleStartGame}>
          <label>
            Einsatz:
            <input 
              type="number" 
              value={stake} 
              onChange={e => setStake(e.target.value)} 
              style={{ margin: '10px', padding: '5px' }} 
            />
          </label>
          <button type="submit" style={{ padding: '10px 20px' }}>Spiel starten</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1>Blackjack Spiel</h1>
      <p>Einsatz: {stake}</p>
      <div style={{ marginBottom: '20px' }}>
        <h2>Spieler ({playerPoints} Punkte)</h2>
        <div>
          {playerCards.map((card, index) => (
            <img key={index} src={card.image} alt={card.code} style={{ margin: '10px', height: '150px' }} />
          ))}
        </div>
        <button 
          onClick={handlePlayerDraw} 
          style={{ padding: '10px 20px', margin: '10px' }} 
          disabled={result || playerStand}
        >
          Karte ziehen
        </button>
        <button 
          onClick={handleStand} 
          style={{ padding: '10px 20px', margin: '10px' }} 
          disabled={result || playerCards.length === 0 || playerStand}
        >
          Stand
        </button>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <h2>Dealer ({dealerPoints} Punkte)</h2>
        <div>
          {dealerCards.map((card, index) => (
            <img key={index} src={card.image} alt={card.code} style={{ margin: '10px', height: '150px' }} />
          ))}
        </div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <p>Verbleibende Karten im Deck: {remaining}</p>
      </div>
      {result && (
        <div style={{ margin: '20px', fontSize: '1.2em', fontWeight: 'bold', color: result.includes("gewinn") ? 'green' : 'red' }}>
          {result}
        </div>
      )}
      <div>
        <button 
          onClick={handleReset} 
          style={{ padding: '10px 20px', backgroundColor: '#f44336', color: '#fff' }}
        >
          Neues Spiel
        </button>
      </div>
    </div>
  );
}

export default BlackjackGame;
