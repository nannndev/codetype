import { useState, useEffect, useRef, useCallback } from "react";
import Peer, { DataConnection } from "peerjs";
import { getRandomSnippet } from "@/data";
import type { Snippet } from "@/types";

export type DuelState = "idle" | "lobby" | "countdown" | "racing" | "finished";

export interface OpponentState {
  name: string;
  cursorIndex: number;
  wpm: number;
  accuracy: number;
  completed: boolean;
  finishTimeMs?: number;
}

export interface DuelDataMessage {
  type: "LOBBY_SYNC" | "READY" | "START_COUNTDOWN" | "PROGRESS" | "FINISHED" | "REMATCH";
  payload?: any;
}

export function usePeerDuel(playerName: string = "Typist") {
  const [duelState, setDuelState] = useState<DuelState>("idle");
  const [isHost, setIsHost] = useState(false);
  const [roomCode, setRoomCode] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  
  const [snippet, setSnippet] = useState<Snippet>(() => getRandomSnippet());
  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(3);
  
  const [opponent, setOpponent] = useState<OpponentState>({
    name: "Opponent",
    cursorIndex: 0,
    wpm: 0,
    accuracy: 100,
    completed: false,
  });

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  // Initialize PeerJS
  const initPeer = useCallback((customId?: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (peerRef.current && !peerRef.current.destroyed) {
        resolve(peerRef.current.id);
        return;
      }

      const id = (customId || `CODEY-${Math.random().toString(36).substring(2, 8)}`).toUpperCase();
      const peer = new Peer(id, {
        debug: 1,
      });

      peer.on("open", (peerId) => {
        setRoomCode(peerId.toUpperCase());
        resolve(peerId.toUpperCase());
      });

      peer.on("connection", (conn) => {
        connRef.current = conn;
        setupConnection(conn);
      });

      peer.on("error", (err) => {
        console.error("PeerJS Error:", err);
        setConnectionStatus("disconnected");
        reject(err);
      });

      peerRef.current = peer;
    });
  }, []);

  const handleMessage = useCallback((data: DuelDataMessage) => {
    switch (data.type) {
      case "LOBBY_SYNC":
        if (data.payload.snippet) setSnippet(data.payload.snippet);
        if (data.payload.opponentName) {
          setOpponent((prev) => ({ ...prev, name: data.payload.opponentName }));
        }
        break;

      case "READY":
        setOpponentReady(data.payload.isReady);
        break;

      case "START_COUNTDOWN":
        setDuelState("countdown");
        setCountdownSeconds(3);
        break;

      case "PROGRESS":
        setOpponent((prev) => ({
          ...prev,
          cursorIndex: data.payload.cursorIndex,
          wpm: data.payload.wpm,
          accuracy: data.payload.accuracy,
          completed: data.payload.completed,
          finishTimeMs: data.payload.finishTimeMs,
        }));
        break;

      case "REMATCH":
        setDuelState("lobby");
        setIsReady(false);
        setOpponentReady(false);
        setOpponent((prev) => ({ ...prev, cursorIndex: 0, wpm: 0, accuracy: 100, completed: false }));
        break;
    }
  }, []);

  const setupConnection = useCallback((conn: DataConnection) => {
    conn.on("open", () => {
      setConnectionStatus("connected");
      setDuelState("lobby");

      // Send initial lobby info
      conn.send({
        type: "LOBBY_SYNC",
        payload: { opponentName: playerName, snippet },
      });
    });

    conn.on("data", (data: any) => {
      handleMessage(data as DuelDataMessage);
    });

    conn.on("close", () => {
      setConnectionStatus("disconnected");
      setDuelState("idle");
    });
  }, [playerName, snippet, handleMessage]);

  // Host creates room
  const createRoom = useCallback(async (selectedSnippet?: Snippet) => {
    setIsHost(true);
    setConnectionStatus("connecting");
    const activeSnippet = selectedSnippet || getRandomSnippet();
    setSnippet(activeSnippet);
    await initPeer();
    setDuelState("lobby");
  }, [initPeer]);

  // Guest joins room
  const joinRoom = useCallback(async (code: string) => {
    setIsHost(false);
    setConnectionStatus("connecting");
    await initPeer();
    const formattedCode = code.trim().toUpperCase();
    setRoomCode(formattedCode);

    const conn = peerRef.current!.connect(formattedCode);
    connRef.current = conn;
    setupConnection(conn);
  }, [initPeer, setupConnection]);

  // Broadcast data to opponent
  const sendMessage = useCallback((msg: DuelDataMessage) => {
    if (connRef.current && connRef.current.open) {
      connRef.current.send(msg);
    }
  }, []);

  // Update ready state
  const toggleReady = useCallback(() => {
    const nextReady = !isReady;
    setIsReady(nextReady);
    sendMessage({ type: "READY", payload: { isReady: nextReady } });
  }, [isReady, sendMessage]);

  // Host starts countdown
  const startMatch = useCallback(() => {
    if (!isHost) return;
    sendMessage({ type: "START_COUNTDOWN" });
    setDuelState("countdown");
    setCountdownSeconds(3);
  }, [isHost, sendMessage]);

  // Countdown timer logic
  useEffect(() => {
    if (duelState !== "countdown") return;
    if (countdownSeconds > 0) {
      const timer = setTimeout(() => setCountdownSeconds((s) => s - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setDuelState("racing");
    }
  }, [duelState, countdownSeconds]);

  // Send live progress during race
  const sendProgress = useCallback((progress: { cursorIndex: number; wpm: number; accuracy: number; completed: boolean; finishTimeMs?: number }) => {
    sendMessage({
      type: "PROGRESS",
      payload: progress,
    });
  }, [sendMessage]);

  // Request rematch
  const requestRematch = useCallback(() => {
    const nextSnippet = getRandomSnippet();
    setSnippet(nextSnippet);
    setIsReady(false);
    setOpponentReady(false);
    setDuelState("lobby");
    sendMessage({ type: "REMATCH", payload: { snippet: nextSnippet } });
  }, [sendMessage]);

  // Leave / close connection
  const leaveDuel = useCallback(() => {
    if (connRef.current) connRef.current.close();
    if (peerRef.current) peerRef.current.destroy();
    connRef.current = null;
    peerRef.current = null;
    setDuelState("idle");
    setConnectionStatus("disconnected");
    setIsReady(false);
    setOpponentReady(false);
  }, []);

  return {
    duelState,
    isHost,
    roomCode,
    connectionStatus,
    snippet,
    setSnippet,
    isReady,
    opponentReady,
    countdownSeconds,
    opponent,
    createRoom,
    joinRoom,
    toggleReady,
    startMatch,
    sendProgress,
    requestRematch,
    leaveDuel,
  };
}
