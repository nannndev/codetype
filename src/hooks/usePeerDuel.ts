import { useState, useEffect, useRef, useCallback } from "react";
import Peer, { DataConnection } from "peerjs";
import { getRandomSnippet } from "@/data";
import type { Snippet, SnippetLength, TestMode, TimedDuration } from "@/types";

export type DuelState = "idle" | "lobby" | "countdown" | "racing" | "finished";

export interface DuelConfig {
  mode: TestMode;
  snippetLength: SnippetLength;
  durationSeconds: TimedDuration;
  selectedLanguage: string;
}

export interface OpponentState {
  name: string;
  cursorIndex: number;
  wpm: number;
  accuracy: number;
  completed: boolean;
  finishTimeMs?: number;
}

interface DuelDataMessage {
  type:
    | "LOBBY_REQUEST"
    | "LOBBY_SYNC"
    | "READY"
    | "START_COUNTDOWN"
    | "PROGRESS"
    | "FINISHED"
    | "REMATCH"
    | "REMATCH_REQUEST";
  payload?: {
    opponentName?: string;
    snippet?: Snippet;
    config?: DuelConfig;
    isReady?: boolean;
    cursorIndex?: number;
    wpm?: number;
    accuracy?: number;
    completed?: boolean;
    finishTimeMs?: number;
  };
}

const DEFAULT_CONFIG: DuelConfig = {
  mode: "snippet",
  snippetLength: "medium",
  durationSeconds: 30,
  selectedLanguage: "All",
};

/** Timed runs always use a long snippet so neither player runs out of code before the clock stops. */
export function snippetForConfig(config: DuelConfig): Snippet {
  const language = config.selectedLanguage === "All" ? undefined : config.selectedLanguage;
  return getRandomSnippet(language, config.mode === "timed" ? "long" : config.snippetLength);
}

export function usePeerDuel(playerName: string = "Typist", initialConfig: DuelConfig = DEFAULT_CONFIG) {
  const [duelState, setDuelState] = useState<DuelState>("idle");
  const [isHost, setIsHost] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [snippet, setSnippet] = useState<Snippet>(() => getRandomSnippet());
  const [duelConfig, setDuelConfig] = useState<DuelConfig>(initialConfig);
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
  const isHostRef = useRef(false);
  const snippetRef = useRef(snippet);
  const configRef = useRef(duelConfig);

  useEffect(() => {
    snippetRef.current = snippet;
  }, [snippet]);

  useEffect(() => {
    configRef.current = duelConfig;
  }, [duelConfig]);

  const sendMessage = useCallback((message: DuelDataMessage) => {
    if (connRef.current?.open) connRef.current.send(message);
  }, []);

  const resetLobby = useCallback(() => {
    setDuelState("lobby");
    setIsReady(false);
    setOpponentReady(false);
    setOpponent((previous) => ({
      ...previous,
      cursorIndex: 0,
      wpm: 0,
      accuracy: 100,
      completed: false,
      finishTimeMs: undefined,
    }));
  }, []);

  const sendAuthoritativeLobby = useCallback((type: "LOBBY_SYNC" | "REMATCH" = "LOBBY_SYNC") => {
    sendMessage({
      type,
      payload: {
        opponentName: playerName,
        snippet: snippetRef.current,
        config: configRef.current,
      },
    });
  }, [playerName, sendMessage]);

  const applyHostState = useCallback((payload?: DuelDataMessage["payload"]) => {
    if (payload?.snippet) {
      setSnippet(payload.snippet);
      snippetRef.current = payload.snippet;
    }
    if (payload?.config) {
      setDuelConfig(payload.config);
      configRef.current = payload.config;
    }
  }, []);

  const handleMessage = useCallback((data: DuelDataMessage) => {
    const payload = data.payload;
    if (payload?.opponentName) {
      setOpponent((previous) => ({ ...previous, name: payload.opponentName! }));
    }

    switch (data.type) {
      case "LOBBY_REQUEST":
        if (isHostRef.current) sendAuthoritativeLobby();
        break;
      case "LOBBY_SYNC":
        if (!isHostRef.current) {
          const changed =
            payload?.snippet?.id !== snippetRef.current.id ||
            JSON.stringify(payload?.config) !== JSON.stringify(configRef.current);
          applyHostState(payload);
          // Settings changed under the guest — re-confirm rather than racing something they never agreed to.
          if (changed) {
            setIsReady(false);
            sendMessage({ type: "READY", payload: { isReady: false } });
          }
        }
        break;
      case "READY":
        setOpponentReady(Boolean(payload?.isReady));
        break;
      case "START_COUNTDOWN":
        if (!isHostRef.current) applyHostState(payload);
        setDuelState("countdown");
        setCountdownSeconds(3);
        break;
      case "PROGRESS":
        setOpponent((previous) => ({
          ...previous,
          cursorIndex: payload?.cursorIndex ?? 0,
          wpm: payload?.wpm ?? 0,
          accuracy: payload?.accuracy ?? 100,
          completed: Boolean(payload?.completed),
          finishTimeMs: payload?.finishTimeMs,
        }));
        if (payload?.completed) {
          setDuelState((previous) => (previous === "racing" ? "finished" : previous));
        }
        break;
      case "FINISHED":
        setDuelState((previous) => (previous === "racing" ? "finished" : previous));
        break;
      case "REMATCH_REQUEST":
        if (isHostRef.current) {
          const nextSnippet = snippetForConfig(configRef.current);
          setSnippet(nextSnippet);
          snippetRef.current = nextSnippet;
          resetLobby();
          sendAuthoritativeLobby("REMATCH");
        }
        break;
      case "REMATCH":
        if (!isHostRef.current) applyHostState(payload);
        resetLobby();
        break;
    }
  }, [applyHostState, resetLobby, sendAuthoritativeLobby, sendMessage]);

  const setupConnection = useCallback((connection: DataConnection, hostConnection: boolean) => {
    connRef.current = connection;
    connection.on("open", () => {
      setConnectionStatus("connected");
      setDuelState("lobby");

      connection.send({
        type: "LOBBY_REQUEST",
        payload: { opponentName: playerName },
      } satisfies DuelDataMessage);

      if (hostConnection) sendAuthoritativeLobby();
    });
    connection.on("data", (data) => handleMessage(data as DuelDataMessage));
    connection.on("close", () => {
      setConnectionStatus("disconnected");
      setDuelState("idle");
    });
  }, [handleMessage, playerName, sendAuthoritativeLobby]);

  const initPeer = useCallback((customId?: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (peerRef.current && !peerRef.current.destroyed) {
        resolve(peerRef.current.id);
        return;
      }

      const id = (customId || `CODEY-${Math.random().toString(36).substring(2, 8)}`).toUpperCase();
      const peer = new Peer(id, { debug: 1 });
      peer.on("open", (peerId) => {
        setRoomCode(peerId.toUpperCase());
        resolve(peerId.toUpperCase());
      });
      peer.on("connection", (connection) => setupConnection(connection, true));
      peer.on("error", (error) => {
        console.error("PeerJS Error:", error);
        setConnectionStatus("disconnected");
        reject(error);
      });
      peerRef.current = peer;
    });
  }, [setupConnection]);

  const createRoom = useCallback(async (selectedSnippet?: Snippet, selectedConfig?: DuelConfig) => {
    isHostRef.current = true;
    setIsHost(true);
    setConnectionStatus("connecting");
    const activeSnippet = selectedSnippet || snippetForConfig(selectedConfig || configRef.current);
    const activeConfig = selectedConfig || configRef.current;
    setSnippet(activeSnippet);
    setDuelConfig(activeConfig);
    snippetRef.current = activeSnippet;
    configRef.current = activeConfig;
    await initPeer();
    setDuelState("lobby");
  }, [initPeer]);

  const joinRoom = useCallback(async (code: string) => {
    isHostRef.current = false;
    setIsHost(false);
    setConnectionStatus("connecting");
    await initPeer();
    const formattedCode = code.trim().toUpperCase();
    setRoomCode(formattedCode);
    setupConnection(peerRef.current!.connect(formattedCode), false);
  }, [initPeer, setupConnection]);

  const toggleReady = useCallback(() => {
    const nextReady = !isReady;
    setIsReady(nextReady);
    sendMessage({ type: "READY", payload: { isReady: nextReady } });
  }, [isReady, sendMessage]);

  const startMatch = useCallback(() => {
    if (!isHostRef.current) return;
    sendMessage({
      type: "START_COUNTDOWN",
      payload: { snippet: snippetRef.current, config: configRef.current },
    });
    setDuelState("countdown");
    setCountdownSeconds(3);
  }, [sendMessage]);

  useEffect(() => {
    if (duelState !== "countdown") return;
    if (countdownSeconds > 0) {
      const timer = setTimeout(() => setCountdownSeconds((seconds) => seconds - 1), 1000);
      return () => clearTimeout(timer);
    }
    setDuelState("racing");
  }, [duelState, countdownSeconds]);

  const sendProgress = useCallback((progress: { cursorIndex: number; wpm: number; accuracy: number; completed: boolean; finishTimeMs?: number }) => {
    sendMessage({ type: "PROGRESS", payload: progress });
  }, [sendMessage]);

  // Ends the local race and tells the opponent the run is over.
  const finishRace = useCallback((summary: { cursorIndex: number; wpm: number; accuracy: number; finishTimeMs: number }) => {
    setDuelState((previous) => (previous === "racing" ? "finished" : previous));
    sendMessage({ type: "PROGRESS", payload: { ...summary, completed: true } });
    sendMessage({ type: "FINISHED", payload: { opponentName: playerName } });
  }, [playerName, sendMessage]);

  const updateLobbyConfig = useCallback((newConfig: DuelConfig, newSnippet?: Snippet) => {
    setDuelConfig(newConfig);
    configRef.current = newConfig;
    if (newSnippet) {
      setSnippet(newSnippet);
      snippetRef.current = newSnippet;
    }
    if (isHostRef.current) sendAuthoritativeLobby();
  }, [sendAuthoritativeLobby]);

  const requestRematch = useCallback((customSnippet?: Snippet) => {
    if (!isHostRef.current) {
      sendMessage({ type: "REMATCH_REQUEST", payload: { opponentName: playerName } });
      return;
    }

    const nextSnippet = customSnippet || snippetForConfig(configRef.current);
    setSnippet(nextSnippet);
    snippetRef.current = nextSnippet;
    resetLobby();
    sendMessage({
      type: "REMATCH",
      payload: { snippet: nextSnippet, config: configRef.current, opponentName: playerName },
    });
  }, [playerName, resetLobby, sendMessage]);

  const leaveDuel = useCallback(() => {
    connRef.current?.close();
    peerRef.current?.destroy();
    connRef.current = null;
    peerRef.current = null;
    isHostRef.current = false;
    setIsHost(false);
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
    duelConfig,
    updateLobbyConfig,
    isReady,
    opponentReady,
    countdownSeconds,
    opponent,
    createRoom,
    joinRoom,
    toggleReady,
    startMatch,
    sendProgress,
    finishRace,
    requestRematch,
    leaveDuel,
  };
}
