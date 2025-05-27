import React, { useState, useEffect, useRef } from 'react';
import { Settings, Timer, Trophy, HelpCircle, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import backgroundMusic from './audio/background_loop.mp3';
import cardFlipSound from './audio/card_flip2.mp3';

import bread from './images/bread.png';
import carrot from './images/carrot.png';
import cheese from './images/cheese.png';
import chicken from './images/chicken.png';
import corn from './images/corn.png';
import eggs from './images/eggs.png';
import flour from './images/flour.png';
import milk from './images/milk.png';
import olive_oil from './images/olive_oil.png';
import peas from './images/peas.png';
import salt from './images/salt_and_pepper.png';
import sauce from './images/sauce.png';

const easyCardsArray = [
  { name: 'bread', img: bread },
  { name: 'carrot', img: carrot },
  { name: 'cheese', img: cheese },
  { name: 'chicken', img: chicken },
  { name: 'corn', img: corn },
  { name: 'eggs', img: eggs },
  { name: 'flour', img: flour },
  { name: 'milk', img: milk }
];

const mediumCardsArray = [
  ...easyCardsArray,
  { name: 'olive_oil', img: olive_oil },
  { name: 'peas', img: peas }
];

const hardCardsArray = [
  ...mediumCardsArray,
  { name: 'salt', img: salt },
  { name: 'sauce', img: sauce }
];

function App() {
  const [gameMode, setGameMode] = useState('easy');
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState(new Set());
  const [matched, setMatched] = useState(new Set());
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [time, setTime] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showModes, setShowModes] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [memory, setMemory] = useState({}); // { cardName: [indexesSeen...] }
  const [computerTurnStage, setComputerTurnStage] = useState(0);
  const [computerSelectedCards, setComputerSelectedCards] = useState([]);
  const [computerThinking, setComputerThinking] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  
  // Audio references
  const bgMusicRef = useRef(new Audio(backgroundMusic));
  const cardFlipRef = useRef(new Audio(cardFlipSound));
  const [isMuted, setIsMuted] = useState(false);

  // Function to start background music
  const startBackgroundMusic = () => {
    if (!musicStarted && !isMuted) {
      const audio = bgMusicRef.current;
      audio.loop = true;
      audio.play()
        .then(() => {
          setMusicStarted(true);
          console.log("Music started successfully");
        })
        .catch(err => console.log("Audio playback error:", err));
    }
  };

  // Handle document-wide click to start music
  useEffect(() => {
    const handleFirstInteraction = () => {
      startBackgroundMusic();
      document.removeEventListener('click', handleFirstInteraction);
    };
    
    document.addEventListener('click', handleFirstInteraction);
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  // Handle background music control
  useEffect(() => {
    const audio = bgMusicRef.current;
    audio.loop = true;
    
    if (musicStarted) {
      if (isMuted) {
        audio.pause();
      } else {
        audio.play().catch(err => console.log("Audio playback error:", err));
      }
    }
    
    // Clean up
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [isMuted, musicStarted]);

  // Toggle mute function for all audio
  const toggleMute = () => {
    const audio = bgMusicRef.current;
    if (isMuted) {
      if (musicStarted) {
      audio.play().catch(err => console.log("Audio playback error:", err));
      }
    } else {
      audio.pause();
    }
    setIsMuted(!isMuted);
  };

  // Play card flip sound
  const playCardFlipSound = () => {
    if (!isMuted) {
      startBackgroundMusic(); // Attempt to start music on any interaction
      const flipSound = cardFlipRef.current;
      flipSound.currentTime = 0; // Reset to start
      flipSound.play().catch(err => console.log("Card flip sound error:", err));
    }
  };

  // Setup and timer
  useEffect(() => {
    setupGame(gameMode);
    const timer = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [gameMode]);

  useEffect(() => {
    if (cards.length && matched.size === cards.length) {
      setGameOver(true);
    }
  }, [matched, cards]);

  useEffect(() => {
    if (!isPlayerTurn && !computerThinking) {
      handleComputerTurn();
    }
  }, [isPlayerTurn, computerThinking]);

  const setupGame = (mode) => {
    const base =
      mode === 'easy' ? easyCardsArray
      : mode === 'medium' ? mediumCardsArray
      : hardCardsArray;

    const grid = [...base, ...base]
      .sort(() => Math.random() - 0.5)
      .map((c, i) => ({ ...c, id: i }));

    setCards(grid);
    setFlipped(new Set());
    setMatched(new Set());
    setPlayerScore(0);
    setComputerScore(0);
    setIsPlayerTurn(true);
    setTime(0);
    setGameOver(false);
    setMemory({});
    setIsProcessingTurn(false);
  };

  // Player logic unchanged
  const handleCardClick = (i) => {
    // Start music on any card click (user interaction)
    startBackgroundMusic();
    
    // Prevent clicking if processing turn, not player's turn, or card is already flipped/matched
    if (isProcessingTurn || !isPlayerTurn || flipped.has(i) || matched.has(i)) return;

    // If already have 2 cards flipped, prevent flipping a third
    if (flipped.size >= 2) return;

    const next = new Set(flipped).add(i);
    setFlipped(next);
    
    // Play flip sound after state update
    setTimeout(playCardFlipSound, 0);

    if (next.size === 2) {
      // Block additional card flips while processing the turn
      setIsProcessingTurn(true);
      
      const [a, b] = Array.from(next);
      if (cards[a].name === cards[b].name) {
        // Player match
        setMatched(m => new Set(m).add(a).add(b));
        setPlayerScore(s => s + 1);
        
        // Delay to show the matched cards before resetting
        setTimeout(() => {
        setFlipped(new Set());
          setIsProcessingTurn(false);
        }, 800);
        
        // Player gets another turn
      } else {
        // wrong → hand off
        setTimeout(() => {
          setFlipped(new Set());
          setIsPlayerTurn(false);
          setIsProcessingTurn(false);
          setTimeout(computerTurn, 800);
        }, 800);
      }
    }
  };

  // Computer turn stages handler
  const handleComputerTurn = () => {
    setComputerThinking(true);
    
    // If game over, stop
    if (matched.size === cards.length) {
      setIsPlayerTurn(true);
      setComputerThinking(false);
      return;
    }

    // Build list of available (unmatched) cards
    const available = cards
      .map((c, idx) => ({ ...c, idx }))
      .filter(c => !matched.has(c.idx));

    // If no available cards, end turn
    if (available.length < 2) {
      setIsPlayerTurn(true);
      setComputerThinking(false);
      return;
    }

    // Update Computer's Memory
    const newMem = { ...memory };
    available.forEach(c => {
      if (!newMem[c.name]) newMem[c.name] = [];
      if (!newMem[c.name].includes(c.idx)) {
        newMem[c.name].push(c.idx);
      }
    });

    // Remove matched pairs from memory
    for (let name in newMem) {
      if (newMem[name].length === 2 &&
          newMem[name].every(idx => matched.has(idx))) {
        delete newMem[name];
      }
    }
    setMemory(newMem);

    // Decide which two to flip
    let pick1, pick2;
    const errorChance = 0.55; // 45% chance of correct guess
    const knownMatch = Object.entries(newMem).find(([, idxs]) => idxs.length === 2);

    if (Math.random() > errorChance && knownMatch) {
      // use memory
      const [, idxs] = knownMatch;
      pick1 = available.find(c => c.idx === idxs[0]);
      pick2 = available.find(c => c.idx === idxs[1]);
    } else {
      // random picks
      const shuffled = available.sort(() => Math.random() - 0.5);
      pick1 = shuffled[0];
      pick2 = shuffled.find(c => c.idx !== pick1.idx);
    }

    // Safety check
    if (!pick1 || !pick2) {
      setIsPlayerTurn(true);
      setComputerThinking(false);
      return;
    }

    console.log(`Computer selecting cards: ${pick1.idx} (${pick1.name}) and ${pick2.idx} (${pick2.name})`);
    
    // Store the selected cards
    setComputerSelectedCards([pick1, pick2]);
    
    // Start the turn sequence - first flip card 1
    setFlipped(new Set([]));
    setTimeout(() => {
      setFlipped(new Set([pick1.idx]));
      playCardFlipSound();
      
      // Then flip card 2 after a delay
      setTimeout(() => {
        setFlipped(new Set([pick1.idx, pick2.idx]));
        playCardFlipSound();
        
        // Then check for match
        setTimeout(() => {
          // Check if cards match
        if (pick1.name === pick2.name) {
            // It's a match!
            console.log(`Computer found a match: ${pick1.name}`);
            
            // Update matched cards and score
            const newMatched = new Set(matched);
            newMatched.add(pick1.idx);
            newMatched.add(pick2.idx);
            setMatched(newMatched);
            setComputerScore(prev => prev + 1);
            
            // Update memory
            setMemory(prev => {
              const newMem = { ...prev };
              delete newMem[pick1.name];
              return newMem;
            });
            
            // Clear flipped cards
            setTimeout(() => {
              setFlipped(new Set([]));
              
              // Check if game is over
              if (newMatched.size === cards.length) {
                console.log("Game over - computer's turn ends");
                setIsPlayerTurn(true);
                setComputerThinking(false);
              } else {
                // Computer gets another turn
                console.log("Computer gets another turn");
                setTimeout(() => {
                  setComputerThinking(false);
                }, 1000);
              }
            }, 1000);
        } else {
            // No match
            console.log("Computer didn't find a match, player's turn next");
            
            // Show the cards for a moment, then flip them back
            setTimeout(() => {
              setFlipped(new Set([]));
          setIsPlayerTurn(true);
              setComputerThinking(false);
            }, 1000);
          }
        }, 1000);
      }, 1000);
    }, 500);
  };

  // Replace the computerTurn function with this new version
  const computerTurn = () => {
    // This function is now just a trigger for the computer's turn
    if (computerThinking) return;
    setComputerThinking(true);
  };

  const formatTime = s => {
    const m = Math.floor(s/60).toString().padStart(2,'0');
    const sec = (s%60).toString().padStart(2,'0');
    return `${m}:${sec}`;
  };

  const getWinnerMessage = () => {
    if (playerScore === computerScore) return "It's a tie!";
    return playerScore > computerScore ? 'You won!' : 'Computer won!';
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-[#112D4E] to-[#3F72AF] overflow-hidden flex flex-col"
      onClick={startBackgroundMusic}
    >
      {/* Navbar */}
      <nav className="bg-[#112D4E]/80 backdrop-blur-md border-b border-[#DBE2EF]/20 h-16 sm:h-20 shadow-lg">
        <div className="h-full px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <h1 className="text-xl sm:text-3xl font-bold text-[#F9F7F7] drop-shadow-lg">Culinary Flip</h1>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#3F72AF]/30 rounded-full border border-[#DBE2EF]/30 shadow-md">
              <Trophy size={18} className="text-[#F9F7F7]" />
              <span className="text-[#F9F7F7] font-medium">Memory Game</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {!gameOver && (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg ${isPlayerTurn ? 'bg-[#3F72AF]' : 'bg-[#112D4E]'} text-[#F9F7F7] text-sm sm:text-base font-semibold shadow-lg transition-all duration-300 transform hover:scale-105`}>
                  {isPlayerTurn ? '👤 Your Turn' : '💻 Computer'}
                </div>
                <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-[#3F72AF]/30 rounded-full border border-[#DBE2EF]/30 shadow-md">
                  <Timer size={16} className="text-[#F9F7F7] sm:w-[18px] sm:h-[18px]" />
                  <span className="text-[#F9F7F7] font-mono text-sm sm:text-base">{formatTime(time)}</span>
                </div>
              </div>
            )}
            <button
              onClick={toggleMute}
              className="p-1.5 sm:p-2 rounded-lg bg-[#3F72AF]/30 border border-[#DBE2EF]/30 text-[#F9F7F7] hover:bg-[#3F72AF]/40 transition-all duration-300 transform hover:scale-105 shadow-md"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={18} className="sm:w-5 sm:h-5" /> : <Volume2 size={18} className="sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {gameOver ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-[#112D4E]/90 backdrop-blur-md rounded-2xl p-8 max-w-md w-full mx-4 text-[#F9F7F7] text-center border border-[#DBE2EF]/30 shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#3F72AF] flex items-center justify-center shadow-lg">
              <Trophy className="w-12 h-12 text-[#F9F7F7]" />
            </div>
            <h2 className="text-4xl font-bold mb-4 text-[#F9F7F7] drop-shadow-lg">{getWinnerMessage()}</h2>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center bg-[#3F72AF]/30 p-4 rounded-xl border border-[#DBE2EF]/30 shadow-md transform hover:scale-[1.02] transition-all duration-300">
                <span className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#F9F7F7]"></span>
                  Player Score
                </span>
                <span className="text-2xl font-mono text-[#F9F7F7]">{playerScore}</span>
              </div>
              <div className="flex justify-between items-center bg-[#3F72AF]/30 p-4 rounded-xl border border-[#DBE2EF]/30 shadow-md transform hover:scale-[1.02] transition-all duration-300">
                <span className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#F9F7F7]"></span>
                  Computer Score
                </span>
                <span className="text-2xl font-mono text-[#F9F7F7]">{computerScore}</span>
              </div>
            </div>

            <button
              onClick={() => setupGame(gameMode)}
              className="w-full bg-[#3F72AF] hover:bg-[#3F72AF]/90 text-[#F9F7F7] font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-[#3F72AF]/25 transform hover:scale-[1.02]"
            >
              Play Again
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop and Portrait Layout */}
          <div className="flex-1 flex md:flex-row flex-col gap-6 p-6 landscape:md:flex landscape:hidden">
            {/* Sidebar */}
            <div className="md:w-80 md:space-y-6 flex md:flex-col md:block">
              {/* Mobile Controls Bar */}
              <div className="md:hidden flex flex-wrap gap-3 mb-3 w-full">
                <div className="w-full flex gap-3">
                  <button 
                    onClick={() => {
                      setShowInstructions(!showInstructions);
                      setShowModes(false);
                      setShowTime(false);
                    }}
                    className={`flex-1 flex justify-center items-center gap-2 bg-[#112D4E]/80 backdrop-blur-md rounded-xl p-3 text-[#F9F7F7] border ${showInstructions ? 'border-[#DBE2EF]/50 bg-[#3F72AF]/30' : 'border-[#DBE2EF]/30'} shadow-md transform hover:scale-[1.02] transition-all duration-300`}
                  >
                    <HelpCircle size={18} className="text-[#F9F7F7]" />
                    <span className="text-sm font-medium">Help</span>
                  </button>
                  <button 
                    onClick={() => {
                      setShowModes(!showModes);
                      setShowInstructions(false);
                      setShowTime(false);
                    }}
                    className={`flex-1 flex justify-center items-center gap-2 bg-[#112D4E]/80 backdrop-blur-md rounded-xl p-3 text-[#F9F7F7] border ${showModes ? 'border-[#DBE2EF]/50 bg-[#3F72AF]/30' : 'border-[#DBE2EF]/30'} shadow-md transform hover:scale-[1.02] transition-all duration-300`}
                  >
                    <Settings size={18} className="text-[#F9F7F7]" />
                    <span className="text-sm font-medium">Mode</span>
                  </button>
                  <div className="flex-1 flex justify-center items-center gap-2 bg-[#112D4E]/80 backdrop-blur-md rounded-xl p-3 text-[#F9F7F7] border border-[#DBE2EF]/30 shadow-md">
                    <Trophy size={18} className="text-[#F9F7F7]" />
                    <span className="text-sm font-medium">{playerScore}-{computerScore}</span>
                  </div>
                </div>
                
                {/* Help Panel */}
                <div className={`w-full bg-[#112D4E]/90 backdrop-blur-md rounded-xl border border-[#DBE2EF]/30 shadow-lg transition-all duration-300 overflow-hidden ${showInstructions ? 'max-h-60 opacity-100 p-4' : 'max-h-0 opacity-0 p-0 border-0'}`}>
                  <div className="font-medium mb-3 text-sm flex items-center text-[#F9F7F7]">
                    <HelpCircle size={18} className="text-[#F9F7F7] mr-2" />
                    How to Play
                  </div>
                  <ul className="space-y-2 text-sm text-[#F9F7F7] pl-2">
                    <li className="flex items-start transform hover:translate-x-1 transition-transform duration-300">
                      <span className="rounded-full bg-[#3F72AF]/30 w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5 shadow-sm">1</span>
                      <span>Click on two cards to reveal them</span>
                    </li>
                    <li className="flex items-start transform hover:translate-x-1 transition-transform duration-300">
                      <span className="rounded-full bg-[#3F72AF]/30 w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5 shadow-sm">2</span>
                      <span>Match identical food cards to score</span>
                    </li>
                    <li className="flex items-start transform hover:translate-x-1 transition-transform duration-300">
                      <span className="rounded-full bg-[#3F72AF]/30 w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5 shadow-sm">3</span>
                      <span>Take turns with the computer</span>
                    </li>
                    <li className="flex items-start transform hover:translate-x-1 transition-transform duration-300">
                      <span className="rounded-full bg-[#3F72AF]/30 w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5 shadow-sm">4</span>
                      <span>Most matches wins!</span>
                    </li>
                  </ul>
                </div>

                {/* Game Mode Panel */}
                <div className={`w-full bg-[#112D4E]/90 backdrop-blur-md rounded-xl border border-[#DBE2EF]/30 shadow-lg transition-all duration-300 overflow-hidden ${showModes ? 'max-h-40 opacity-100 p-4' : 'max-h-0 opacity-0 p-0 border-0'}`}>
                  <div className="font-medium mb-3 text-sm flex items-center text-[#F9F7F7]">
                    <Settings size={18} className="text-[#F9F7F7] mr-2" />
                    Game Mode
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setGameMode('easy')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${gameMode === 'easy' ? 'bg-[#3F72AF] text-[#F9F7F7]' : 'bg-[#3F72AF]/30 text-[#F9F7F7] border border-[#DBE2EF]/30'} shadow-md transform hover:scale-[1.02] transition-all duration-300`}
                    >
                      Easy
                    </button>
                    <button
                      onClick={() => setGameMode('medium')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${gameMode === 'medium' ? 'bg-[#3F72AF] text-[#F9F7F7]' : 'bg-[#3F72AF]/30 text-[#F9F7F7] border border-[#DBE2EF]/30'} shadow-md transform hover:scale-[1.02] transition-all duration-300`}
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => setGameMode('hard')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${gameMode === 'hard' ? 'bg-[#3F72AF] text-[#F9F7F7]' : 'bg-[#3F72AF]/30 text-[#F9F7F7] border border-[#DBE2EF]/30'} shadow-md transform hover:scale-[1.02] transition-all duration-300`}
                    >
                      Hard
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Desktop Sidebar - visible on md+ screens */}
              <div className="hidden md:block space-y-6 flex-1">
                {/* How to Play */}
                <div className="bg-[#112D4E]/90 backdrop-blur-md rounded-xl p-5 text-[#F9F7F7] border border-[#DBE2EF]/30 shadow-lg transform hover:scale-[1.02] transition-all duration-300">
                  <button
                    className="w-full flex items-center justify-between"
                    onClick={() => setShowInstructions(!showInstructions)}
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle size={20} className="text-[#F9F7F7]" />
                      <span className="font-medium">How to Play</span>
                    </div>
                    <ChevronDown
                      className={`transform transition-transform duration-300 ${showInstructions ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>

                {/* How to Play Modal */}
                {showInstructions && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#112D4E] rounded-2xl p-6 max-w-md w-full mx-4 border border-[#DBE2EF]/30 shadow-2xl transform transition-all duration-300">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <HelpCircle size={24} className="text-[#F9F7F7]" />
                          <h3 className="text-xl font-bold text-[#F9F7F7]">How to Play</h3>
                        </div>
                        <button 
                          onClick={() => setShowInstructions(false)}
                          className="p-2 hover:bg-[#3F72AF]/30 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-[#F9F7F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-[#3F72AF]/20 rounded-xl p-4 border border-[#DBE2EF]/30">
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-[#3F72AF] flex items-center justify-center text-sm font-bold text-[#F9F7F7] flex-shrink-0">1</span>
                            <p className="text-[#F9F7F7]">Click on two cards to reveal them</p>
                          </div>
                        </div>
                        <div className="bg-[#3F72AF]/20 rounded-xl p-4 border border-[#DBE2EF]/30">
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-[#3F72AF] flex items-center justify-center text-sm font-bold text-[#F9F7F7] flex-shrink-0">2</span>
                            <p className="text-[#F9F7F7]">Match identical food cards to score</p>
                          </div>
                        </div>
                        <div className="bg-[#3F72AF]/20 rounded-xl p-4 border border-[#DBE2EF]/30">
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-[#3F72AF] flex items-center justify-center text-sm font-bold text-[#F9F7F7] flex-shrink-0">3</span>
                            <p className="text-[#F9F7F7]">Take turns with the computer</p>
                          </div>
                        </div>
                        <div className="bg-[#3F72AF]/20 rounded-xl p-4 border border-[#DBE2EF]/30">
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-[#3F72AF] flex items-center justify-center text-sm font-bold text-[#F9F7F7] flex-shrink-0">4</span>
                            <p className="text-[#F9F7F7]">Most matches wins!</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Game Mode */}
                <div className="bg-[#112D4E]/90 backdrop-blur-md rounded-xl p-5 text-[#F9F7F7] border border-[#DBE2EF]/30 shadow-lg transform hover:scale-[1.02] transition-all duration-300">
                  <button
                    className="w-full flex items-center justify-between"
                    onClick={() => setShowModes(!showModes)}
                  >
                    <div className="flex items-center gap-3">
                      <Settings size={20} className="text-[#F9F7F7]" />
                      <span className="font-medium">Game Mode</span>
                    </div>
                    <ChevronDown className={`transform transition-transform duration-300 ${showModes ? 'rotate-180' : ''}`} />
                  </button>
                  {showModes && (
                    <div className="mt-4">
                      <select
                        value={gameMode}
                        onChange={e => setGameMode(e.target.value)}
                        className="w-full bg-[#3F72AF]/30 border border-[#DBE2EF]/30 rounded-lg p-2.5 text-[#F9F7F7] focus:outline-none focus:ring-2 focus:ring-[#DBE2EF] shadow-md transform hover:scale-[1.02] transition-all duration-300"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Scoreboard */}
                <div className="bg-[#112D4E]/90 backdrop-blur-md rounded-xl p-5 text-[#F9F7F7] border border-[#DBE2EF]/30 shadow-lg flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy size={20} className="text-[#F9F7F7]" />
                    <span className="font-medium">Scoreboard</span>
                  </div>
                  <div className="space-y-3">
                    <div className={`flex justify-between items-center ${isPlayerTurn ? 'bg-[#3F72AF]/30 border-l-4 border-[#F9F7F7]' : 'bg-[#3F72AF]/20'} p-4 rounded-lg transition-all duration-300 shadow-md transform hover:scale-[1.02]`}>
                      <span className="flex items-center gap-2">
                        {isPlayerTurn && <div className="w-2 h-2 bg-[#F9F7F7] rounded-full animate-pulse shadow-sm"></div>}
                        Player
                      </span>
                      <span className="font-mono text-[#F9F7F7] text-lg">{playerScore}</span>
                    </div>
                    <div className={`flex justify-between items-center ${!isPlayerTurn ? 'bg-[#3F72AF]/30 border-l-4 border-[#F9F7F7]' : 'bg-[#3F72AF]/20'} p-4 rounded-lg transition-all duration-300 shadow-md transform hover:scale-[1.02]`}>
                      <span className="flex items-center gap-2">
                        {!isPlayerTurn && <div className="w-2 h-2 bg-[#F9F7F7] rounded-full animate-pulse shadow-sm"></div>}
                        Computer
                      </span>
                      <span className="font-mono text-[#F9F7F7] text-lg">{computerScore}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Grid - Desktop & Portrait */}
            <div className="flex-1 flex items-center justify-center">
              <div
                className={`grid gap-3 sm:gap-4 ${
                  gameMode === 'easy'
                    ? 'grid-cols-4 w-full max-w-[600px]'
                    : gameMode === 'medium'
                    ? 'grid-cols-4 sm:grid-cols-5 w-full max-w-[750px]'
                    : 'grid-cols-4 sm:grid-cols-6 w-full max-w-[900px]'
                }`}
              >
                {cards.map((card, idx) => (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(idx)}
                    className={`w-full aspect-square relative cursor-pointer hover:scale-105 transition-all duration-300 ${isPlayerTurn ? 'hover:shadow-[#3F72AF]/30 hover:shadow-lg' : ''}`}
                  >
                    {/* Card container with flip effect */}
                    <div 
                      className="w-full h-full transition-transform duration-700 transform-gpu relative"
                      style={{ 
                        transformStyle: 'preserve-3d',
                        transform: flipped.has(idx) || matched.has(idx) ? 'rotateY(180deg)' : 'rotateY(0deg)'
                      }}
                    >
                      {/* Front face */}
                      <div
                        className="absolute w-full h-full rounded-xl bg-[#3F72AF] shadow-lg border border-[#DBE2EF]/30"
                        style={{ backfaceVisibility: 'hidden' }}
                      />
                      
                      {/* Back face */}
                      <div
                        className="absolute w-full h-full rounded-xl bg-[#3F72AF] shadow-lg border border-[#DBE2EF]/30"
                        style={{ 
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)'
                        }}
                      >
                        <div className="w-full h-full bg-cover bg-center rounded-xl" style={{ backgroundImage: `url(${card.img})` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Landscape Layout */}
          <div className="hidden landscape:flex landscape:md:hidden flex-row h-screen">
            {/* Side Controls */}
            <div className="w-40 h-full flex-shrink-0 border-r border-[#DBE2EF]/30 bg-[#112D4E]/90 backdrop-blur-md flex flex-col justify-between py-4 shadow-lg">
              {/* Top area with logo and turn info */}
              <div className="px-3">
                <h1 className="text-lg font-bold text-[#F9F7F7] text-center mb-3 drop-shadow-lg">Culinary Flip</h1>
                <div className={`mb-3 text-[#F9F7F7] ${isPlayerTurn ? 'bg-[#3F72AF]' : 'bg-[#112D4E]'} px-3 py-2 rounded-lg text-sm font-bold text-center shadow-md`}>
                  {isPlayerTurn ? '👤 Your Turn' : '💻 Computer'}
                </div>
                
                {/* Scores */}
                <div className="bg-[#3F72AF]/30 rounded-lg p-3 mb-3 border border-[#DBE2EF]/30 shadow-md">
                  <div className="flex justify-between text-sm text-[#F9F7F7] mb-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F9F7F7] shadow-sm"></span>
                      Player:
                    </span>
                    <span className="font-bold text-[#F9F7F7]">{playerScore}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#F9F7F7]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F9F7F7] shadow-sm"></span>
                      Computer:
                    </span>
                    <span className="font-bold text-[#F9F7F7]">{computerScore}</span>
                  </div>
                </div>
              </div>
              
              {/* Bottom area with controls */}
              <div className="px-3">
                <select
                  value={gameMode}
                  onChange={e => setGameMode(e.target.value)}
                  className="w-full bg-[#3F72AF]/30 border border-[#DBE2EF]/30 rounded-lg p-2 text-[#F9F7F7] text-sm mb-3 shadow-md transform hover:scale-[1.02] transition-all duration-300"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                
                <button onClick={toggleMute} className="w-full bg-[#3F72AF]/30 border border-[#DBE2EF]/30 rounded-lg p-2 text-[#F9F7F7] flex justify-center mb-3 shadow-md transform hover:scale-[1.02] transition-all duration-300">
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="w-full bg-[#3F72AF]/30 border border-[#DBE2EF]/30 rounded-lg p-2 text-[#F9F7F7] text-sm flex items-center justify-center shadow-md transform hover:scale-[1.02] transition-all duration-300"
                >
                  <HelpCircle size={16} className="mr-1.5" /> Help
                </button>
                
                {/* Help Modal */}
                {showInstructions && (
                  <div className="absolute bottom-4 left-4 right-4 bg-[#112D4E]/90 backdrop-blur-md rounded-lg p-4 text-[#F9F7F7] text-sm z-10 border border-[#DBE2EF]/30 shadow-xl">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold">How to Play</span>
                      <button onClick={() => setShowInstructions(false)}>✕</button>
                    </div>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 transform hover:translate-x-1 transition-transform duration-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F9F7F7] shadow-sm"></span>
                        Click on two cards to reveal them
                      </li>
                      <li className="flex items-center gap-2 transform hover:translate-x-1 transition-transform duration-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F9F7F7] shadow-sm"></span>
                        Match identical food cards to score
                      </li>
                      <li className="flex items-center gap-2 transform hover:translate-x-1 transition-transform duration-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F9F7F7] shadow-sm"></span>
                        Take turns with the computer
                      </li>
                      <li className="flex items-center gap-2 transform hover:translate-x-1 transition-transform duration-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F9F7F7] shadow-sm"></span>
                        Most matches wins!
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Game Grid - Landscape Optimized */}
            <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
              <div
                className={`grid max-h-full max-w-full ${
                  gameMode === 'easy'
                    ? 'grid-cols-4 gap-2'
                    : gameMode === 'medium'
                    ? 'grid-cols-5 gap-2'
                    : 'grid-cols-6 gap-2'
                }`}
                style={{
                  width: '100%',
                  height: gameMode === 'easy' ? 'auto' : '100%'
                }}
              >
                {cards.map((card, idx) => (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(idx)}
                    className="aspect-square relative cursor-pointer transform hover:scale-105 transition-all duration-300"
                  >
                    {/* Card container with flip effect */}
                    <div 
                      className="w-full h-full transition-transform duration-700 transform-gpu relative"
                      style={{ 
                        transformStyle: 'preserve-3d',
                        transform: flipped.has(idx) || matched.has(idx) ? 'rotateY(180deg)' : 'rotateY(0deg)'
                      }}
                    >
                      {/* Front face */}
                      <div
                        className="absolute w-full h-full rounded-lg bg-[#3F72AF] shadow-md border border-[#DBE2EF]/30"
                        style={{ backfaceVisibility: 'hidden' }}
                      />
                      
                      {/* Back face */}
                      <div
                        className="absolute w-full h-full rounded-lg bg-[#3F72AF] shadow-md border border-[#DBE2EF]/30"
                        style={{ 
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)'
                        }}
                      >
                        <div className="w-full h-full bg-cover bg-center rounded-lg" style={{ backgroundImage: `url(${card.img})` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Viewport meta tag for proper mobile display */}
      <style jsx>{`
        @media (orientation: landscape) and (max-height: 500px) {
          /* Only apply these styles on mobile devices in landscape */
          html, body {
            height: 100%;
            overflow: hidden;
            touch-action: manipulation;
          }
        }
        
        @keyframes slideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default App;
