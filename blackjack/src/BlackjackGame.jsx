import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

/* ===== Styled Components ===== */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  background: rgba(0,0,0,0.6);
  border-radius: 16px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.5);
  color: #fff;
  animation: ${fadeIn} 0.6s ease-out;
`;

const Header = styled.h1`
  text-align: center;
  font-size: 2.8rem;
  margin-bottom: 8px;
`;

const StakeForm = styled.form`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 24px;
  gap: 12px;  /* Abstand zwischen Input und Button */
`;

const StakeInput = styled.input`
  width: 120px;
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  background: ${props =>
    props.variant === 'danger'   ? '#e74c3c'  :
    props.variant === 'secondary'? '#f1c40f'  :
                                    '#2ecc71'};
  color: #fff;
  /* Ecken je nach Position im Button‑Set */
  border-radius: ${props =>
    props.position === 'left'  ? '6px 0 0 6px' :
    props.position === 'right' ? '0 6px 6px 0'  :
                                 '6px'};
  transition: background 0.2s, transform 0.1s;
  &:hover {
    background: ${props =>
      props.variant === 'danger'   ? '#c0392b'  :
      props.variant === 'secondary'? '#d4ac0d'  :
                                      '#27ae60'};
  }
  &:active {
    transform: scale(0.98);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled(Button)`
  padding: 10px 20px;
  width: auto;
  border-radius: 6px;
  cursor: pointer;
`;

const Section = styled.section`
  margin: 24px 0;
`;

const SubHeader = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 12px;
`;

const CardRow = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 10px;
  padding-bottom: 8px;
`;

const CardImage = styled.img`
  height: 140px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.4);
  transition: transform 0.2s;
  &:hover {
    transform: scale(1.05);
  }
`;

const Info = styled.p`
  text-align: center;
  font-size: 1rem;
`;

const ResultText = styled.p`
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.win ? '#2ecc71' : '#e74c3c'};
  margin: 16px 0;
`;

/* ===== Component ===== */

export default function BlackjackGame() {
  const [stake, setStake] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [deckId, setDeckId] = useState(null);
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [remaining, setRemaining] = useState(0);
  const [result, setResult] = useState('');
  const [playerStand, setPlayerStand] = useState(false);

  // neues Deck mischen
  useEffect(() => {
    if (!gameStarted) return;
    fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6')
      .then(r => r.json())
      .then(d => {
        setDeckId(d.deck_id);
        setRemaining(d.remaining);
      });
  }, [gameStarted]);

  // API‑Call ziehen
  const drawCard = async count => {
    if (!deckId || result) return [];
    const r = await fetch(
      `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`
    );
    const j = await r.json();
    setRemaining(j.remaining);
    return j.cards;
  };

  // Spieler zieht
  const handlePlayerDraw = async () => {
    if (result || playerStand) return;
    const [card] = await drawCard(1);
    setPlayerCards(pc => [...pc, card]);
  };

  // Dealer zieht (nur in handleStand)
  const handleDealerDraw = async () => {
    const [card] = await drawCard(1);
    setDealerCards(dc => [...dc, card]);
    return card;
  };

  // Punkte zählen
  const calculatePoints = cards => {
    let pts = 0, aces = 0;
    cards.forEach(c => {
      if (['KING','QUEEN','JACK'].includes(c.value)) pts += 10;
      else if (c.value === 'ACE') { aces++; pts += 11; }
      else pts += +c.value;
    });
    while (pts > 21 && aces > 0) { pts -= 10; aces--; }
    return pts;
  };

  const playerPoints = calculatePoints(playerCards);
  const dealerPoints = calculatePoints(dealerCards);

  // Sofort‑Check Spieler
  useEffect(() => {
    if (!gameStarted) return;
    if (playerPoints > 21)       setResult('Du hast über 21! Du verlierst.');
    else if (playerPoints === 21) setResult('Black‑jack!');
  }, [playerPoints, gameStarted]);

  // Player steht — Dealer zieht automatisiert
  const handleStand = async () => {
    if (result) return;
    setPlayerStand(true);

    // lokale Kopie der Dealer-Hand
    let hand = [...dealerCards];
    let total = calculatePoints(hand);

    // Dealer zieht, bis er 17–21 erreicht oder bustet
    while (total < 17) {
      const card = await handleDealerDraw();
      hand.push(card);
      total = calculatePoints(hand);
      // kurze Pause, damit man das Ziehen sieht
      await new Promise(r => setTimeout(r, 300));
    }

    // Ergebnisermittlung
    if (total > 21)                 setResult('🎉 Dealer über 21! Du gewinnst!');
    else if (total > playerPoints)  setResult('Dealer gewinnt!');
    else if (total === playerPoints) setResult('Unentschieden!');
    else                             setResult('🎉 Du gewinnst!');
  };

  // Reset
  const handleReset = () => {
    setGameStarted(false);
    setStake('');
    setDeckId(null);
    setPlayerCards([]);
    setDealerCards([]);
    setRemaining(0);
    setResult('');
    setPlayerStand(false);
  };

  // Start mit Einsatz
  const handleStart = e => {
    e.preventDefault();
    if (!stake || isNaN(stake) || +stake <= 0) return;
    setGameStarted(true);
  };

  /* ===== Render ===== */
  if (!gameStarted) {
    return (
      <Container>
        <Header>Blackjack</Header>
        <StakeForm onSubmit={handleStart}>
          <StakeInput
            type="number"
            placeholder="Einsatz (€)"
            value={stake}
            onChange={e => setStake(e.target.value)}
          />
          <SubmitButton type="submit">Start</SubmitButton>
        </StakeForm>
      </Container>
    );
  }

  return (
    <Container>
      <Header>Blackjack</Header>
      <Info>Einsatz: €{stake}</Info>

      {/* Spieler */}
      <Section>
        <SubHeader>Spieler ({playerPoints})</SubHeader>
        <CardRow>
          {playerCards.map(c => (
            <CardImage key={c.code} src={c.image} alt={c.code} />
          ))}
        </CardRow>
        <div style={{ textAlign: 'center' }}>
          <Button
            position="left"
            onClick={handlePlayerDraw}
            disabled={!!result || playerStand}
          >
            Hit
          </Button>
          <Button
            position="right"
            variant="secondary"
            onClick={handleStand}
            disabled={!!result || !playerCards.length || playerStand}
          >
            Stand
          </Button>
        </div>
      </Section>

      {/* Dealer */}
      <Section>
        <SubHeader>Dealer ({dealerPoints})</SubHeader>
        <CardRow>
          {dealerCards.map(c => (
            <CardImage key={c.code} src={c.image} alt={c.code} />
          ))}
        </CardRow>
      </Section>

      <Info>Verbleibende Karten: {remaining}</Info>

      {result && (
        <ResultText win={result.startsWith('🎉')}>
          {result}
        </ResultText>
      )}

      <Button variant="danger" onClick={handleReset}>
        Neues Spiel
      </Button>
    </Container>
  );
}
