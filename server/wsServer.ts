/**
 * JiuManager Game Engine - Real-Time WebSocket Server
 * Section 22: WebSocket Sockets for Real-Time Clock & Match Synchronization
 */

import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { LiveMatchManager } from './engine/LiveMatchManager';
import { EngineFighter } from './engine/types';
import { ClockSpeed } from './engine/RealTimeClock';

// Global registry of active live matches on the server
const activeLiveMatches = new Map<string, LiveMatchManager>();

export function getOrCreateLiveMatch(
  matchId: string,
  fighterA: EngineFighter,
  fighterB: EngineFighter,
  options?: { speed?: ClockSpeed; seed?: string }
): LiveMatchManager {
  let liveMatch = activeLiveMatches.get(matchId);
  if (!liveMatch) {
    liveMatch = new LiveMatchManager(fighterA, fighterB, {
      seed: options?.seed,
      initialSpeed: options?.speed || 1,
    });
    activeLiveMatches.set(matchId, liveMatch);
  }
  return liveMatch;
}

export function getLiveMatch(matchId: string): LiveMatchManager | undefined {
  return activeLiveMatches.get(matchId);
}

export function setupWebSocketServer(httpServer: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/combat' });

  wss.on('connection', (ws: WebSocket) => {
    let subscribedMatchId: string | null = null;
    let unsubscribeFn: (() => void) | null = null;

    ws.on('message', (messageRaw: string) => {
      try {
        const message = JSON.parse(messageRaw.toString());
        const { type, matchId, speed } = message;

        switch (type) {
          case 'SUBSCRIBE_MATCH': {
            if (!matchId) return;

            // Unsubscribe from previous if any
            if (unsubscribeFn) {
              unsubscribeFn();
              unsubscribeFn = null;
            }

            subscribedMatchId = matchId;
            const liveMatch = activeLiveMatches.get(matchId);

            if (liveMatch) {
              const currentState = liveMatch.getMatchState();
              const clockSnapshot = liveMatch.getClockSnapshot();

              // Send immediate synchronization state on connection/reconnection
              ws.send(
                JSON.stringify({
                  type: 'CLOCK_SYNC',
                  matchId,
                  serverTimestamp: Date.now(),
                  clockSnapshot,
                  matchState: currentState,
                })
              );

              // Subscribe to real-time events emitted by LiveMatchManager
              unsubscribeFn = liveMatch.subscribe((eventType, payload) => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(
                    JSON.stringify({
                      type: eventType,
                      matchId,
                      serverTimestamp: Date.now(),
                      payload,
                    })
                  );
                }
              });
            } else {
              ws.send(
                JSON.stringify({
                  type: 'ERROR',
                  message: 'Match not found in active live matches registry.',
                })
              );
            }
            break;
          }

          case 'PAUSE_MATCH': {
            if (matchId) {
              const liveMatch = activeLiveMatches.get(matchId);
              if (liveMatch) liveMatch.pause();
            }
            break;
          }

          case 'RESUME_MATCH': {
            if (matchId) {
              const liveMatch = activeLiveMatches.get(matchId);
              if (liveMatch) liveMatch.resume();
            }
            break;
          }

          case 'SET_SPEED': {
            if (matchId && (speed === 1 || speed === 2 || speed === 4 || speed === 8)) {
              const liveMatch = activeLiveMatches.get(matchId);
              if (liveMatch) liveMatch.setSpeed(speed as ClockSpeed);
            }
            break;
          }

          case 'PING': {
            ws.send(JSON.stringify({ type: 'PONG', serverTimestamp: Date.now() }));
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      if (unsubscribeFn) {
        unsubscribeFn();
        unsubscribeFn = null;
      }
    });
  });

  return wss;
}
