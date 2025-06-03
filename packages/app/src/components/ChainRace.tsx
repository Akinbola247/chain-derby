"use client";

import { useChainRaceContext } from "@/providers/ChainRaceProvider";
import { type RaceResult } from "@/hooks/useChainRace";
import { Button, CardContent } from "@/components/ui";
import { Loader2, XCircle, Trophy, Clock, RefreshCw, Play } from "lucide-react";
import Image from "next/image";

export function ChainRace() {
  const { 
    results,
    status, 
    startRace, 
    restartRace,
    isReady, 
    checkBalances, 
    isLoadingBalances
  } = useChainRaceContext();
  
  // Sort by chainId to maintain consistent lane order, regardless of race position
  const sortedResults = [...results];
  
  // We previously checked if the race is finished here, but removed as unused

  const handleAction = () => {
    if (status === "idle") {
      checkBalances();
    } else if (status === "ready") {
      startRace();
    } else if (status === "funding") {
      checkBalances();
    } else if (status === "finished") {
      // Reset to the ready state so the FundingPhase will be shown again
      restartRace(); 
      // The UI will now show FundingPhase again until the user starts a new race
    }
  };
  
  return (
    <div className="flex flex-col">
      {/* Top banner with sky and clouds */}
      <div style={{ fontSize: 0, lineHeight: 0 }}>
        <div className="relative w-full">
          <Image
            src="/top.png"
            alt="Chain Derby Banner"
            width={1000}
            height={400}
            className="w-full block"
            style={{ 
              objectFit: "cover", 
              display: "block", 
              marginBottom: 0
            }}
          />
          <div className="absolute w-full text-center top-[57%]">
          <Button
          size="lg"
          disabled={status === "racing" || (!isReady && status !== "funding") || isLoadingBalances}
          onClick={handleAction}
        >
          {status === "idle" && (
            <>
              <RefreshCw size={16} className={`mr-2 ${isLoadingBalances ? "animate-spin" : ""}`} color="white" />
              {isLoadingBalances ? "Checking Balances..." : "Check Balances"}
            </>
          )}
          
          {status === "funding" && (
            <>
              <RefreshCw size={16} className={`mr-2 ${isLoadingBalances ? "animate-spin" : ""}`} color="white" />
              {isLoadingBalances ? "Checking Balances..." : "Check Again"}
            </>
          )}
          
          {status === "ready" && (
            <>
              <Play size={16} className="mr-2" color="white" />
              Start Race
            </>
          )}
          
          {status === "racing" && (
            <>Racing...</>
          )}
          
          {status === "finished" && (
            <>
              <RefreshCw size={16} className="mr-2" color="white" />
              Reset Race
            </>
          )}
        </Button>
        </div>
        </div>
      </div>
      
      <CardContent className="w-full p-0 relative" style={{ fontSize: 0, lineHeight: 0 }}>
        {/* Race tracks container with absolute positioning for precise control */}
        <div style={{ 
          fontSize: "16px", 
          lineHeight: "normal",
          height: `${Math.min(results.length * 120, 720)}px` // Height based on number of tracks
        }}>
          {sortedResults.map((result, index) => (
            <div 
              key={result.chainId} 
              className="relative transition-all duration-1000 ease-in-out" 
              data-position={result.position}
            >
              <ChainRaceTrack result={result} index={index} />
            </div>
          ))}
        </div>
        
        {/* Bottom grass image */}
        {sortedResults.length &&
          <div className="w-full">
            <div className="relative w-full">
              <Image
                src="/bottom.png"
                alt="Grass"
                width={1000}
                height={120}
                className="w-full"
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
        }
        
        {/* Race results have been removed as requested */}
      </CardContent>
    </div>
  );
}

function ChainRaceTrack({ result, index }: { result: RaceResult, index: number }) {
  // Calculate horse position as percentage with discrete steps
  let position = 0;
  
  if (result.status === "success") {
    position = 100; // Move finish line closer to the right edge
  } else if (result.status === "racing") {
    if (result.txTotal > 1) {
      // Base progress on transaction completion with discrete steps, starting at 25%
      const minPosition = 25; // Start at 25% of the track
      const raceDistance = 70; // Race over the middle 70% of the track (25% to 95%)
      const stepSize = raceDistance / result.txTotal;
      position = minPosition + Math.floor(result.txCompleted * stepSize);
    } else {
      // For single transaction races, set closer positions to avoid big jumps
      position = result.txHash ? 45 : 25;
    }
  } else if (result.status === "error") {
    // If error, show at a fixed position
    position = 30;
  }
  
      
  // Determine if this track should get a highlight effect (just finished)
  const shouldHighlight = result.status === "success" && result.position && result.position <= 3;
  
  return (
    <div className="relative h-30 my-0">
      
      {/* Confetti effect for 1st place */}
      {result.position === 1 && result.status === "success" && (
        <>
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className="absolute z-30 rounded-full pointer-events-none"
              style={{
                width: 'clamp(4px, 1vw, 8px)',
                height: 'clamp(4px, 1vw, 8px)',
                right: `clamp(${40 + (i * 6)}px, ${8 + (i * 2)}vw, ${8 + (i * 6)}px)`,
                top: "clamp(8px, 2vh, 16px)",
                backgroundColor: ['#FFD700', '#FF8C00', '#FF1493', '#00BFFF', '#32CD32', '#FF69B4', '#00FF7F', '#FF4500'][i % 8],
                animation: `confetti-fall ${0.8 + (i * 0.15)}s ease-out forwards`,
                animationDelay: `${0.15 * i}s`
              }}
            />
          ))}
        </>
      )}
      
      {/* Track background image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={index == 0 ? "/track_top.png": "/track.png"}
          alt="Race Track"
          fill
        />
      </div>
      
      {/* Chain name label on the left */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-900/90 rounded-lg px-3 py-2 shadow-md min-w-[240px]">
        <div className="flex items-center gap-3">
          {/* Chain logo */}
          <div className="flex-shrink-0">
            <Image 
              src={result.logo || "/logos/rise.png"}
              alt={`${result.name} Logo`}
              width={36}
              height={36}
              style={{ 
                borderRadius: "50%",
                boxShadow: "0 0 4px rgba(0,0,0,0.2)"
              }}
            />
          </div>
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-black dark:text-white truncate">{result.name}</span>
              {result.status === "success" && result.position && result.position <= 3 && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  result.position === 1 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100" :
                  result.position === 2 ? "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-100" :
                  "bg-amber-100 text-amber-800 dark:bg-amber-600 dark:text-amber-100"
                }`}>
                  {result.position === 1 ? (
                    <span className="flex items-center gap-0.5">
                      <Trophy className="h-2.5 w-2.5" /> 1st
                    </span>
                  ) : result.position === 2 ? "2nd" : "3rd"}
                </span>
              )}
            </div>
            <div className="flex flex-col text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              {result.status === "success" && result.averageLatency && (
                <div className="flex justify-between gap-2">
                  <span className="flex items-center font-medium">
                    <Clock size={10} className="inline mr-1" /> {result.averageLatency}ms avg
                  </span>
                  {result.totalLatency && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {(result.totalLatency / 1000).toFixed(2)}s total
                    </span>
                  )}
                </div>
              )}
              {result.status === "racing" && (
                <span className="flex items-center">
                  <Loader2 size={10} className="inline mr-1 animate-spin" /> 
                  {result.txCompleted}/{result.txTotal} tx
                </span>
              )}
              {result.status === "error" && (
                <span className="flex items-center text-red-500">
                  <XCircle size={10} className="inline mr-1" /> Failed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Horse on the track */}
      <div 
        className="absolute top-1/2 w-full"
        style={{ 
          left: 'clamp(-140px, -12vw, -40px)', // Better positioning across all screens
          transform: `translateX(${position * 0.77}%) translateY(-70%)`,
          zIndex: result.status === "error" ? 1 : 5,
          transition: "transform 0.6s ease-in-out",
          marginLeft: `15%`
        }}
      >
        {result.status !== "pending" && (
          <div className="relative">
            {/* Responsive horse sprite using background image */}
            <div
              className="w-[clamp(60px,15vw,180px)] aspect-[180/172] relative overflow-visible bg-no-repeat bg-[length:600%_100%]"
              style={{ 
                backgroundImage: "url('/horse_sprite.png')",
                animation: result.status === "success" 
                  ? 'none' 
                  : 'horseRun 0.5s steps(6) infinite'
              }}
            >
              {/* Chain logo on the white square of the horse */}
              <div 
                className="absolute top-[58%] left-[37%] -translate-x-1/2 -translate-y-1/2"
              >
                <Image 
                  src={result.logo || "/logos/rise.png"}
                  alt={`${result.name} Logo`}
                  width={20}
                  height={20}
                  className="w-[clamp(8px,2.5vw,20px)] h-[clamp(8px,2.5vw,20px)] rounded-full"
                />
              </div>

              {/* Trophy positioned just behind the horse for top 3 finishers */}
              {shouldHighlight && (
                <div 
                  className="absolute top-1/2 -translate-y-1/2 z-10 animate-drop-in"
                  style={{
                    left: 'clamp(-40px, -8vw, -20px)', // Position behind the horse
                  }}
                >
                  <Image 
                    src={`/trophy_${result.position}.png`} 
                    alt={`${result.position} Trophy`} 
                    width={83} 
                    height={100}
                    className="w-[clamp(20px,6vw,60px)] h-auto object-contain"
                  />         
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}