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
      className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 overflow-hidden flex flex-col"
      onClick={startBackgroundMusic} // Try to start music on any click
    >
      {/* Navbar */}
      <nav className="bg-blue-950/30 backdrop-blur-sm border-b border-blue-600/20 h-12 sm:h-16">
        <div className="h-full px-3 sm:px-6 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-white truncate">Culinary Flip</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            {!gameOver && (
              <span className={`text-white ${isPlayerTurn ? 'bg-green-600' : 'bg-orange-500'} px-2 sm:px-5 py-1 sm:py-2 rounded-full text-sm sm:text-md font-bold shadow-lg transition-colors duration-300 animate-pulse`}>
                {isPlayerTurn ? '👤 Your Turn' : '💻 Computer'}
              </span>
            )}
            <button
              onClick={toggleMute}
              className="text-white hover:text-blue-300 transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {gameOver ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-blue-950/30 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full mx-4 text-white text-center">
            <Trophy className="w-20 h-20 mx-auto mb-6 text-yellow-400" />
            <h2 className="text-4xl font-bold mb-2">{getWinnerMessage()}</h2>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center bg-blue-800/20 p-4 rounded-lg">
                <span className="text-lg">Player Score</span>
                <span className="text-2xl font-mono text-blue-300">{playerScore}</span>
              </div>
              <div className="flex justify-between items-center bg-blue-800/20 p-4 rounded-lg">
                <span className="text-lg">Computer Score</span>
                <span className="text-2xl font-mono text-blue-300">{computerScore}</span>
              </div>
            </div>

            <button
              onClick={() => setupGame(gameMode)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors w-full"
            >
              Play Again
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop and Portrait Layout */}
          <div className="flex-1 flex md:flex-row flex-col gap-3 p-3 sm:gap-6 sm:p-6 landscape:md:flex landscape:hidden">
            {/* Sidebar */}
            <div className="md:w-72 md:space-y-4 flex md:flex-col md:block">
              {/* Mobile Controls Bar */}
              <div className="md:hidden flex gap-2 mb-2 w-full">
                <button 
                  onClick={() => setShowInstructions(!showInstructions)}
                  className={`flex-1 flex justify-center items-center gap-1 bg-blue-950/30 backdrop-blur-sm rounded-lg p-2 text-white ${showInstructions ? 'bg-blue-800/50' : ''}`}
                >
                  <HelpCircle size={16} />
                  <span className="text-xs">Help</span>
                </button>
                <button 
                  onClick={() => setShowModes(!showModes)}
                  className={`flex-1 flex justify-center items-center gap-1 bg-blue-950/30 backdrop-blur-sm rounded-lg p-2 text-white ${showModes ? 'bg-blue-800/50' : ''}`}
                >
                  <Settings size={16} />
                  <span className="text-xs">Mode</span>
                </button>
                <div className="flex-1 flex justify-center items-center gap-1 bg-blue-950/30 backdrop-blur-sm rounded-lg p-2 text-white">
                  <Trophy size={16} />
                  <span className="text-xs">{playerScore}-{computerScore}</span>
                </div>
                <button 
                  onClick={() => setShowTime(!showTime)}
                  className={`flex-1 flex justify-center items-center gap-1 bg-blue-950/30 backdrop-blur-sm rounded-lg p-2 text-white ${showTime ? 'bg-blue-800/50' : ''}`}
                >
                  <Timer size={16} />
                  <span className="text-xs">{formatTime(time)}</span>
                </button>
              </div>
              
              {/* Mobile Panels - Only show the expanded one */}
              {(showInstructions || showModes || showTime) && (
                <div className="md:hidden bg-blue-950/30 backdrop-blur-sm rounded-xl p-3 mb-2 text-white">
                  {showInstructions && (
                    <div className="text-xs">
                      <div className="font-medium mb-1">How to Play</div>
                      <ul className="space-y-1 text-blue-100">
                        <li>• Click on two cards to reveal them</li>
                        <li>• Match identical food cards to score</li>
                        <li>• Take turns with the computer</li>
                        <li>• Most matches wins!</li>
                      </ul>
                    </div>
                  )}
                  {showModes && (
                    <div>
                      <div className="font-medium mb-1 text-xs">Game Mode</div>
                      <select
                        value={gameMode}
                        onChange={e => setGameMode(e.target.value)}
                        className="w-full text-xs bg-blue-800/20 border border-blue-600/20 rounded-lg p-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  )}
                  {showTime && (
                    <div className="text-center">
                      <div className="font-medium mb-1 text-xs">Time</div>
                      <div className="text-xl font-mono text-blue-300">
                        {formatTime(time)}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Desktop Sidebar - visible on md+ screens */}
              <div className="hidden md:block space-y-4 flex-1">
                {/* How to Play */}
                <div className="bg-blue-950/30 backdrop-blur-sm rounded-xl p-4 text-white">
                  <button
                    className="w-full flex items-center justify-between"
                    onClick={() => setShowInstructions(!showInstructions)}
                  >
                    <div className="flex items-center gap-2">
                      <HelpCircle size={20} className="text-blue-300" />
                      <span className="font-medium">How to Play</span>
                    </div>
                    <ChevronDown
                      className={`transform transition-transform ${showInstructions ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {showInstructions && (
                    <ul className="mt-4 space-y-2 text-sm text-blue-100">
                      <li>• Click on two cards to reveal them</li>
                      <li>• Match identical food cards to score</li>
                      <li>• Take turns with the computer</li>
                      <li>• Most matches wins!</li>
                    </ul>
                  )}
                </div>

                {/* Game Mode */}
                <div className="bg-blue-950/30 backdrop-blur-sm rounded-xl p-4 text-white">
                  <button
                    className="w-full flex items-center justify-between"
                    onClick={() => setShowModes(!showModes)}
                  >
                    <div className="flex items-center gap-2">
                      <Settings size={20} className="text-blue-300" />
                      <span className="font-medium">Game Mode</span>
                    </div>
                    <ChevronDown className={`transform transition-transform ${showModes ? 'rotate-180' : ''}`} />
                  </button>
                  {showModes && (
                    <div className="mt-4">
                      <select
                        value={gameMode}
                        onChange={e => setGameMode(e.target.value)}
                        className="w-full bg-blue-800/20 border border-blue-600/20 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Timer */}
                <div className="bg-blue-950/30 backdrop-blur-sm rounded-xl p-4 text-white">
                  <button
                    className="w-full flex items-center justify-between"
                    onClick={() => setShowTime(!showTime)}
                  >
                    <div className="flex items-center gap-2">
                      <Timer size={20} className="text-blue-300" />
                      <span className="font-medium">Time</span>
                    </div>
                    <ChevronDown className={`transform transition-transform ${showTime ? 'rotate-180' : ''}`} />
                  </button>
                  {showTime && (
                    <div className="mt-4 text-center text-2xl font-mono text-blue-300">
                      {formatTime(time)}
                    </div>
                  )}
                </div>

                {/* Scoreboard */}
                <div className="bg-blue-950/30 backdrop-blur-sm rounded-xl p-4 text-white flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy size={20} className="text-blue-300" />
                    <span className="font-medium">Scoreboard</span>
                  </div>
                  <div className="space-y-3">
                    <div className={`flex justify-between items-center ${isPlayerTurn ? 'bg-green-700/40 border-l-4 border-green-500' : 'bg-blue-800/20'} p-3 rounded-lg transition-all duration-300`}>
                      <span className="flex items-center gap-2">
                        {isPlayerTurn && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>}
                        Player
                      </span>
                      <span className="font-mono text-blue-300 text-lg">{playerScore}</span>
                    </div>
                    <div className={`flex justify-between items-center ${!isPlayerTurn ? 'bg-orange-700/40 border-l-4 border-orange-500' : 'bg-blue-800/20'} p-3 rounded-lg transition-all duration-300`}>
                      <span className="flex items-center gap-2">
                        {!isPlayerTurn && <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>}
                        Computer
                      </span>
                      <span className="font-mono text-blue-300 text-lg">{computerScore}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Grid - Desktop & Portrait */}
            <div className="flex-1 flex items-center justify-center">
              <div
                className={`grid gap-2 sm:gap-4 ${
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
                    className={`w-full aspect-square relative cursor-pointer hover:scale-105 ${isPlayerTurn ? 'hover:shadow-green-500/30 hover:shadow-lg' : ''}`}
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
                        className="absolute w-full h-full rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 shadow-lg"
                        style={{ backfaceVisibility: 'hidden' }}
                      />
                      
                      {/* Back face */}
                      <div
                        className="absolute w-full h-full rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 shadow-lg"
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

          {/* Mobile Landscape Layout - Only visible in landscape on small devices */}
          <div className="hidden landscape:flex landscape:md:hidden flex-row h-screen">
            {/* Side Controls */}
            <div className="w-36 h-full flex-shrink-0 border-r border-blue-600/20 bg-blue-950/40 flex flex-col justify-between py-2">
              {/* Top area with logo and turn info */}
              <div className="px-2">
                <h1 className="text-md font-bold text-white text-center mb-2">Culinary Flip</h1>
                <div className={`mb-2 text-white ${isPlayerTurn ? 'bg-green-600' : 'bg-orange-500'} px-2 py-1 rounded-lg text-xs font-bold text-center`}>
                  {isPlayerTurn ? '👤 Your Turn' : '💻 Computer'}
                </div>
                
                {/* Scores */}
                <div className="bg-blue-800/30 rounded-lg p-2 mb-2">
                  <div className="flex justify-between text-xs text-white">
                    <span>Player:</span>
                    <span className="font-bold">{playerScore}</span>
                  </div>
                  <div className="flex justify-between text-xs text-white">
                    <span>Computer:</span>
                    <span className="font-bold">{computerScore}</span>
                  </div>
                </div>

                {/* Time */}
                <div className="bg-blue-800/30 rounded-lg p-2 mb-2 text-center">
                  <div className="text-xs text-white mb-1">Time</div>
                  <div className="text-sm font-mono text-white">{formatTime(time)}</div>
                </div>
              </div>
              
              {/* Bottom area with controls */}
              <div className="px-2">
                <select
                  value={gameMode}
                  onChange={e => setGameMode(e.target.value)}
                  className="w-full bg-blue-800/30 border border-blue-600/20 rounded-lg p-1 text-white text-xs mb-2"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                
                <button onClick={toggleMute} className="w-full bg-blue-800/30 rounded-lg p-2 text-white flex justify-center mb-2">
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="w-full bg-blue-800/30 rounded-lg p-2 text-white text-xs flex items-center justify-center"
                >
                  <HelpCircle size={14} className="mr-1" /> Help
                </button>
                
                {/* Help Modal - Only shown when triggered */}
                {showInstructions && (
                  <div className="absolute bottom-2 left-2 right-2 bg-blue-950/90 backdrop-blur-sm rounded-lg p-3 text-white text-xs z-10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold">How to Play</span>
                      <button onClick={() => setShowInstructions(false)}>✕</button>
                    </div>
                    <ul className="space-y-1">
                      <li>• Click on two cards to reveal them</li>
                      <li>• Match identical food cards to score</li>
                      <li>• Take turns with the computer</li>
                      <li>• Most matches wins!</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Game Grid - Landscape Optimized */}
            <div className="flex-1 flex items-center justify-center p-1 overflow-hidden">
              <div
                className={`grid max-h-full max-w-full ${
                  gameMode === 'easy'
                    ? 'grid-cols-4 gap-1'
                    : gameMode === 'medium'
                    ? 'grid-cols-5 gap-1'
                    : 'grid-cols-6 gap-1'
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
                    className="aspect-square relative cursor-pointer"
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
                        className="absolute w-full h-full rounded-sm bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 shadow-sm"
                        style={{ backfaceVisibility: 'hidden' }}
                      />
                      
                      {/* Back face */}
                      <div
                        className="absolute w-full h-full rounded-sm bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 shadow-sm"
                        style={{ 
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)'
                        }}
                      >
                        <div className="w-full h-full bg-cover bg-center rounded-sm" style={{ backgroundImage: `url(${card.img})` }} />
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
      `}</style>
    </div>
  );
}

export default App;
