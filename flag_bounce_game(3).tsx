import { useState, useEffect, useRef } from 'react';

const FlagBounceGame = () => {
  const canvasRef = useRef(null);
  const [winner, setWinner] = useState(null);
  const [winnerName, setWinnerName] = useState('');
  const [flagsRemaining, setFlagsRemaining] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [recentWinners, setRecentWinners] = useState([]);
  const [showWinner, setShowWinner] = useState(false);
  const flagsRef = useRef(null);
  const resetTimerRef = useRef(null);
  const hasTriggeredResetRef = useRef(false);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = 1200;
    const height = 900;
    
    const centerX = width / 2;
    const centerY = height / 2 - 100;
    const radius = 200;
    
    const rect = {
      width: 650,
      height: 800,
      get x() { return centerX - this.width / 2; },
      get y() { return centerY - this.height / 2 + 130; }
    };
    
    let rotation = 0;
    
    const countryNames = {
      '🇺🇸': 'United States', '🇬🇧': 'United Kingdom', '🇨🇦': 'Canada', '🇦🇺': 'Australia', '🇩🇪': 'Germany',
      '🇫🇷': 'France', '🇮🇹': 'Italy', '🇪🇸': 'Spain', '🇳🇱': 'Netherlands', '🇸🇪': 'Sweden',
      '🇳🇴': 'Norway', '🇩🇰': 'Denmark', '🇫🇮': 'Finland', '🇵🇱': 'Poland', '🇨🇿': 'Czech Republic',
      '🇦🇹': 'Austria', '🇨🇭': 'Switzerland', '🇧🇪': 'Belgium', '🇮🇪': 'Ireland', '🇵🇹': 'Portugal',
      '🇬🇷': 'Greece', '🇷🇴': 'Romania', '🇭🇺': 'Hungary', '🇷🇺': 'Russia', '🇺🇦': 'Ukraine',
      '🇯🇵': 'Japan', '🇰🇷': 'South Korea', '🇨🇳': 'China', '🇮🇳': 'India', '🇹🇭': 'Thailand',
      '🇻🇳': 'Vietnam', '🇵🇭': 'Philippines', '🇮🇩': 'Indonesia', '🇲🇾': 'Malaysia', '🇸🇬': 'Singapore',
      '🇹🇼': 'Taiwan', '🇭🇰': 'Hong Kong', '🇳🇿': 'New Zealand', '🇿🇦': 'South Africa', '🇦🇪': 'UAE',
      '🇸🇦': 'Saudi Arabia', '🇹🇷': 'Turkey', '🇮🇱': 'Israel', '🇪🇬': 'Egypt', '🇲🇽': 'Mexico',
      '🇧🇷': 'Brazil', '🇦🇷': 'Argentina', '🇨🇱': 'Chile', '🇨🇴': 'Colombia', '🇵🇪': 'Peru',
      '🇻🇪': 'Venezuela', '🇪🇨': 'Ecuador', '🇨🇷': 'Costa Rica', '🇵🇦': 'Panama', '🇨🇺': 'Cuba',
      '🇯🇲': 'Jamaica', '🇳🇬': 'Nigeria', '🇰🇪': 'Kenya', '🇬🇭': 'Ghana', '🇪🇹': 'Ethiopia',
      '🇵🇰': 'Pakistan', '🇧🇩': 'Bangladesh', '🇱🇰': 'Sri Lanka', '🇳🇵': 'Nepal', '🇰🇿': 'Kazakhstan',
      '🇲🇦': 'Morocco', '🇹🇳': 'Tunisia', '🇯🇴': 'Jordan', '🇱🇧': 'Lebanon'
    };
    
    const countries = Object.keys(countryNames);
    
    const flags = countries.map((emoji, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * (radius - 50);
      return {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 48,
        vy: (Math.random() - 0.5) * 48,
        size: 26,
        emoji: emoji,
        exitedCircle: false
      };
    });
    
    const gravity = 1.2;
    
    const playBounceSound = () => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 200 + Math.random() * 150;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    };
    
    let isPausedLocal = false;
    let slowMotion = false;
    
    const draw = () => {
      if (isPausedLocal) return;
      
      // Draw linear gradient background (top to bottom)
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#334155');
      gradient.addColorStop(0.5, '#1e293b');
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 6;
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      
      flags.forEach(flag => {
        if (flag.exitedCircle) {
          flag.vy += gravity * (slowMotion ? 0.2 : 1);
        }
        
        // Animate size growth
        if (flag.growStartTime) {
          const elapsed = Date.now() - flag.growStartTime;
          const progress = Math.min(elapsed / flag.growDuration, 1);
          // Ease out cubic for smooth animation
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          flag.size = flag.originalSize + (flag.targetSize - flag.originalSize) * easeProgress;
        }
        
        const speedMultiplier = slowMotion ? 0.2 : 1;
        flag.x += flag.vx * speedMultiplier;
        flag.y += flag.vy * speedMultiplier;
        
        if (!flag.exitedCircle) {
          const dx = flag.x - centerX;
          const dy = flag.y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance + flag.size / 2 > radius) {
            let angle = Math.atan2(dy, dx);
            if (angle < 0) angle += Math.PI * 2;
            
            let normalizedRotation = rotation % (Math.PI * 2);
            if (normalizedRotation < 0) normalizedRotation += Math.PI * 2;
            
            let flagAngle = angle - normalizedRotation;
            if (flagAngle < 0) flagAngle += Math.PI * 2;
            
            const isInGap = flagAngle > (Math.PI * 2 * 0.90);
            
            if (isInGap) {
              flag.exitedCircle = true;
            } else {
              const nx = dx / distance;
              const ny = dy / distance;
              
              const dotProduct = flag.vx * nx + flag.vy * ny;
              flag.vx -= 2 * dotProduct * nx;
              flag.vy -= 2 * dotProduct * ny;
              
              const overlap = distance + flag.size / 2 - radius;
              flag.x -= overlap * nx;
              flag.y -= overlap * ny;
              
              playBounceSound();
            }
          }
        }
        
        if (flag.exitedCircle) {
          const halfSize = flag.size / 2;
          
          if (flag.x - halfSize < rect.x) {
            flag.x = rect.x + halfSize;
            flag.vx *= -0.7;
          }
          if (flag.x + halfSize > rect.x + rect.width) {
            flag.x = rect.x + rect.width - halfSize;
            flag.vx *= -0.7;
          }
          if (flag.y + halfSize >= rect.y + rect.height) {
            flag.y = rect.y + rect.height - halfSize;
            if (flag.vy > 0.5) {
              flag.vy *= -0.6;
            } else {
              flag.vy = 0;
            }
            flag.vx *= 0.85;
          }
        }
      });
      
      for (let i = 0; i < flags.length; i++) {
        for (let j = i + 1; j < flags.length; j++) {
          const flag1 = flags[i];
          const flag2 = flags[j];
          
          // Square collision detection (AABB - Axis-Aligned Bounding Box)
          const halfSize1 = flag1.size / 2;
          const halfSize2 = flag2.size / 2;
          
          const left1 = flag1.x - halfSize1;
          const right1 = flag1.x + halfSize1;
          const top1 = flag1.y - halfSize1;
          const bottom1 = flag1.y + halfSize1;
          
          const left2 = flag2.x - halfSize2;
          const right2 = flag2.x + halfSize2;
          const top2 = flag2.y - halfSize2;
          const bottom2 = flag2.y + halfSize2;
          
          const isColliding = !(right1 < left2 || left1 > right2 || bottom1 < top2 || top1 > bottom2);
          
          if (isColliding) {
            // DVD-style collision - swap velocities
            const tempVx = flag1.vx;
            const tempVy = flag1.vy;
            flag1.vx = flag2.vx;
            flag1.vy = flag2.vy;
            flag2.vx = tempVx;
            flag2.vy = tempVy;
            
            // Separate flags to prevent overlap
            const overlapX = Math.min(right1 - left2, right2 - left1);
            const overlapY = Math.min(bottom1 - top2, bottom2 - top1);
            
            if (overlapX < overlapY) {
              // Separate horizontally
              if (flag1.x < flag2.x) {
                flag1.x -= overlapX / 2;
                flag2.x += overlapX / 2;
              } else {
                flag1.x += overlapX / 2;
                flag2.x -= overlapX / 2;
              }
            } else {
              // Separate vertically
              if (flag1.y < flag2.y) {
                flag1.y -= overlapY / 2;
                flag2.y += overlapY / 2;
              } else {
                flag1.y += overlapY / 2;
                flag2.y -= overlapY / 2;
              }
            }
          }
        }
      }
      
      const flagsInCircle = flags.filter(f => !f.exitedCircle);
      setFlagsRemaining(flagsInCircle.length);
      
      if (flagsInCircle.length === 1 && !slowMotion) {
        slowMotion = true;
        const lastFlag = flagsInCircle[0];
        lastFlag.targetSize = 26 * 5;
        lastFlag.originalSize = 26;
        lastFlag.growStartTime = Date.now();
        lastFlag.growDuration = 2000;
        
        // Set timer to reset after 5 seconds (only once)
        if (!hasTriggeredResetRef.current) {
          hasTriggeredResetRef.current = true;
          resetTimerRef.current = setTimeout(() => {
            // Determine winner (last flag to exit)
            const allExited = flags.filter(f => f.exitedCircle);
            if (allExited.length > 0) {
              const winningFlag = allExited[allExited.length - 1].emoji;
              const winningName = countryNames[winningFlag] || 'Unknown';
              
              setRecentWinners(prev => {
                const newWinners = [{ emoji: winningFlag, name: winningName, round: roundNumber }, ...prev];
                return newWinners.slice(0, 5);
              });
            }
            
            // Reset game
            setWinner(null);
            setWinnerName('');
            setRoundNumber(prev => prev + 1);
            setIsPaused(false);
            setConfetti([]);
            flagsRef.current = null;
            hasTriggeredResetRef.current = false;
          }, 5000);
        }
      }
      
      if (flagsInCircle.length === 0 && !winner) {
        const allExited = flags.filter(f => f.exitedCircle);
        if (allExited.length > 0) {
          const winningFlag = allExited[allExited.length - 1].emoji;
          const winningName = countryNames[winningFlag] || 'Unknown';
          setWinner(winningFlag);
          setWinnerName(winningName);
        }
      }
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);
      
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2 * 0.90);
      ctx.stroke();
      
      ctx.restore();
      
      rotation += slowMotion ? 0.004 : 0.02;
      
      flags.forEach(flag => {
        ctx.font = `${flag.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Measure text to get actual emoji dimensions
        const metrics = ctx.measureText(flag.emoji);
        const textWidth = metrics.width;
        const textHeight = flag.size * 0.9; // Approximate height based on font size
        
        ctx.fillText(flag.emoji, flag.x, flag.y);
        
        // Draw collision box for reference (rectangle matching emoji size)
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(flag.x - textWidth / 2, flag.y - textHeight / 2, textWidth, textHeight);
      });
      
      requestAnimationFrame(draw);
    };
    
    let animationId = requestAnimationFrame(draw);
    
    return () => {
      cancelAnimationFrame(animationId);
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, [roundNumber]);
  
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 gap-4 p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={1200}
          height={900}
          className="border-4 border-gray-700 rounded-lg"
        />
        
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg">
          <div className="text-sm font-bold text-center">Round: {roundNumber}</div>
          <div className="text-sm font-bold text-center">Flags Remaining: {flagsRemaining}</div>
        </div>
        

      </div>
      
      <div className="bg-gray-800 border-4 border-gray-700 rounded-lg p-4 w-80">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4 text-center">🏆 Last 5 Winners</h2>
        <div className="space-y-3">
          {recentWinners.length === 0 ? (
            <p className="text-gray-400 text-center">No winners yet!</p>
          ) : (
            recentWinners.map((w, index) => (
              <div 
                key={index} 
                className="bg-gray-700 rounded-lg p-3 flex items-center gap-3 border-2 border-gray-600"
              >
                <div className="text-5xl">{w.emoji}</div>
                <div className="flex-1">
                  <p className="text-white font-bold text-lg">{w.name}</p>
                  <p className="text-gray-400 text-sm">Round {w.round}</p>
                </div>
                <div className="text-2xl text-yellow-400">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FlagBounceGame;