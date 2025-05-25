"use client";

import React, { useState, useEffect, useRef } from "react";

const GRID_SIZE = 5;
const BLOCKED_CELLS = 4;
const TIMER_SECONDS = 60;

const randomLetter = () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26));

const generateGrid = () =>
    Array.from({ length: GRID_SIZE }, () =>
        Array.from({ length: GRID_SIZE }, randomLetter)
    );

const generateBlockedCells = () => {
    const blocked = new Set<string>();
    while (blocked.size < BLOCKED_CELLS) {
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);
        blocked.add(`${row},${col}`);
    }
    return blocked;
};

// Helper to check adjacency (4 directions)
const isAdjacent = (a: string, b: string) => {
    const [ar, ac] = a.split(",").map(Number);
    const [br, bc] = b.split(",").map(Number);
    return (
        (Math.abs(ar - br) === 1 && ac === bc) ||
        (Math.abs(ac - bc) === 1 && ar === br)
    );
};

// Simple dictionary API call (using dictionaryapi.dev)
const checkWord = async (word: string) => {
    if (!word) return false;
    try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
        return res.ok;
    } catch {
        return false;
    }
};

// ...existing code...

export default function GamePage() {
    const [grid, setGrid] = useState<string[][] | null>(null);
    const [blockedCells, setBlockedCells] = useState<Set<string> | null>(null);
    const [selected, setSelected] = useState<string[]>([]);
    const [score, setScore] = useState<number>(0);
    const [message, setMessage] = useState<string>("");
    const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
    const [streak, setStreak] = useState<number>(0);
    const [multiplier, setMultiplier] = useState<number>(1);
    const [timeLeft, setTimeLeft] = useState<number>(TIMER_SECONDS);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [started, setStarted] = useState(false);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [username, setUsername] = useState("");
    const [leaderboard, setLeaderboard] = useState<{ username: string, score: number }[]>([]);
    const [scoreSubmitted, setScoreSubmitted] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setGrid(generateGrid());
        setBlockedCells(generateBlockedCells());
        setUsedWords(new Set());
        setStreak(0);
        setMultiplier(1);
        setTimeLeft(TIMER_SECONDS);
        setGameOver(false);
        setMessage("");
    }, []);


    // Timer effect
    useEffect(() => {
        if (!started || gameOver) return;
        if (timeLeft <= 0) {
            setGameOver(true);
            setMessage("⏰ Time's up!");
            return;
        }
        timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [timeLeft, gameOver, started]);

    useEffect(() => {
        if (gameOver && !scoreSubmitted) setShowUsernameModal(true);
    }, [gameOver, scoreSubmitted]);

    const submitScore = async () => {
        if (!username.trim()) return;
        await fetch("/api/leaderboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, score }),
        });
        setScoreSubmitted(true);
        setShowUsernameModal(false);
        // Fetch leaderboard
        const res = await fetch("/api/leaderboard");
        setLeaderboard(await res.json());
    };

    // Fetch leaderboard after submitting score
    useEffect(() => {
        if (scoreSubmitted) {
            fetch("/api/leaderboard")
                .then(res => res.json())
                .then(setLeaderboard);
        }
    }, [scoreSubmitted]);

    const regenerate = () => {
        setGrid(generateGrid());
        setBlockedCells(generateBlockedCells());
        setSelected([]);
        setMessage("");
        setUsedWords(new Set());
        setStreak(0);
        setMultiplier(1);
        setTimeLeft(TIMER_SECONDS);
        setGameOver(false);
        setStarted(false);
        setScore(0);
    };

    const regenerateGrid = () => {
        setGrid(generateGrid());
        setBlockedCells(generateBlockedCells());
        setSelected([]);
        setMessage("");
        setMultiplier(1);
    };

    const handleSelect = (rowIdx: number, colIdx: number) => {
        if (!blockedCells || gameOver || !started) return;
        const key = `${rowIdx},${colIdx}`;
        if (blockedCells.has(key)) return;

        if (selected.length === 0) {
            setSelected([key]);
            return;
        }

        const idx = selected.indexOf(key);
        if (idx !== -1) {
            setSelected(selected.slice(0, idx));
            return;
        }

        const last = selected[selected.length - 1];
        if (isAdjacent(last, key)) {
            setSelected([...selected, key]);
        } else {
            setSelected([key]);
        }
    };

    const handleSubmit = async () => {
        if (!grid || gameOver || !started) return;
        const word = selected
            .map((key) => {
                const [row, col] = key.split(",").map(Number);
                return grid[row][col];
            })
            .join("");
        if (word.length < 2) {
            setMessage("Select at least 2 letters.");
            return;
        }
        if (usedWords.has(word.toLowerCase())) {
            setMessage(`⚠️ "${word}" has already been used!`);
            setSelected([]);
            setStreak(0);
            setMultiplier(1);
            return;
        }
        setMessage("Checking...");
        const exists = await checkWord(word);
        if (exists) {
            const basePoints = word.length;
            const totalPoints = Math.round(basePoints * multiplier);
            setScore((s) => s + totalPoints);
            setUsedWords(prev => new Set(prev).add(word.toLowerCase()));
            setStreak((prev) => prev + 1);
            setMultiplier((prev) => prev + 0.5);
            setMessage(`✅ "${word}" is valid! +${totalPoints} points (x${multiplier.toFixed(1)})`);
        } else {
            setScore((s) => Math.max(0, s - 3));
            setStreak(0);
            setMultiplier(1);
            setMessage(`❌ "${word}" is not a valid word. -3 points`);
        }
        setSelected([]);
    };

    if (!grid || !blockedCells) {
        return <div className="flex flex-col items-center min-h-screen p-8">Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center min-h-screen p-8 relative">
            <h1 className="text-2xl font-bold mb-2">Word Pathfinder: Grid Lexicon</h1>
            <div className="mb-4 flex items-center gap-6">
                <span className="text-lg font-semibold bg-blue-100 text-blue-800 px-4 py-2 rounded">
                    Score: {score}
                </span>
                <span className="text-lg font-semibold bg-yellow-100 text-yellow-800 px-4 py-2 rounded">
                    Multiplier: x{multiplier.toFixed(1)}
                </span>
                <span className="text-lg font-semibold bg-green-100 text-green-800 px-4 py-2 rounded">
                    Streak: {streak}
                </span>
                <span className={`text-lg font-semibold px-4 py-2 rounded ${timeLeft <= 10 ? "bg-red-200 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                    ⏰ {timeLeft}s
                </span>
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={regenerateGrid}
                    disabled={gameOver}
                >
                    Regenerate Grid
                </button>
                <button
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                    onClick={regenerate}
                >
                    Reset Game
                </button>
                {!started && !gameOver && (
                    <button
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        onClick={() => setStarted(true)}
                    >
                        Start
                    </button>
                )}
            </div>
            <div className="grid grid-cols-5 gap-2 mb-4">
                {grid.map((row, rowIdx) =>
                    row.map((letter, colIdx) => {
                        const key = `${rowIdx},${colIdx}`;
                        const isBlocked = blockedCells.has(key);
                        const isSelected = selected.includes(key);
                        return (
                            <button
                                key={key}
                                className={`w-12 h-12 rounded text-xl font-mono flex items-center justify-center border select-none
                                    transition-colors
                                    ${isBlocked
                                        ? "bg-gray-400 text-gray-300 border-gray-400 cursor-not-allowed"
                                        : isSelected
                                            ? "bg-gray-600 text-white border-gray-700"
                                            : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                                    }`}
                                disabled={isBlocked || gameOver || !started}
                                onClick={() => handleSelect(rowIdx, colIdx)}
                            >
                                {isBlocked ? "✖" : letter}
                            </button>
                        );
                    })
                )}
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="text-lg font-mono tracking-widest min-h-[2rem]">
                    {selected
                        .map((key) => {
                            const [row, col] = key.split(",").map(Number);
                            return grid[row][col];
                        })
                        .join("")}
                </div>
                <button
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    onClick={handleSubmit}
                    disabled={selected.length === 0 || gameOver || !started}
                >
                    Submit Word
                </button>
                {message && (
                    <div className="mt-2 text-base text-center">{message}</div>
                )}
                {usedWords.size > 0 && (
                    <div className="mt-4 w-full max-w-xs">
                        <div className="font-semibold mb-1 text-gray-700">Used Words:</div>
                        <ul className="flex flex-wrap gap-2">
                            {[...usedWords].map((word) => (
                                <li key={word} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                                    {word}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            {/* Modal for Game Over */}
            {gameOver && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl shadow-2xl p-8 flex flex-col items-center max-w-xs w-full border-4 border-blue-700">
                        <h2 className="text-3xl font-extrabold mb-3 text-white text-center drop-shadow">⏰ Time&apos;s Up!</h2>
                        <div className="text-lg mb-4 text-center text-white font-semibold">
                            Your Score: <span className="font-extrabold text-yellow-300 text-2xl">{score}</span>
                        </div>
                        {!scoreSubmitted && showUsernameModal && (
                            <div className="w-full flex flex-col items-center">
                                <input
                                    className="mb-2 px-3 py-2 rounded text-blue-900 w-full"
                                    placeholder="Enter your name"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    maxLength={32}
                                />
                                <button
                                    className="px-6 py-2 bg-yellow-400 text-blue-900 font-bold rounded shadow hover:bg-yellow-300 transition"
                                    onClick={submitScore}
                                    disabled={!username.trim()}
                                >
                                    Submit Score
                                </button>
                            </div>
                        )}
                        {scoreSubmitted && (
                            <div className="w-full mt-4">
                                <h3 className="text-xl text-white font-bold mb-2 text-center">🏆 Leaderboard</h3>
                                <ul className="bg-white rounded p-2 text-blue-900 text-center">
                                    {leaderboard.map((entry, i) => (
                                        <li key={i} className="py-1">
                                            <span className="font-bold">{entry.username}</span>: {entry.score}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <button
                            className="mt-4 px-6 py-2 bg-blue-900 text-white font-bold rounded shadow hover:bg-blue-800 transition"
                            onClick={regenerate}
                        >
                            Play Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}