"use client";

import React, { useState, useEffect } from "react";

const GRID_SIZE = 5;
const BLOCKED_CELLS = 4;

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

    useEffect(() => {
        setGrid(generateGrid());
        setBlockedCells(generateBlockedCells());
        setUsedWords(new Set());
        setStreak(0);
        setMultiplier(1);
    }, []);

    const regenerate = () => {
        setGrid(generateGrid());
        setBlockedCells(generateBlockedCells());
        setSelected([]);
        setMessage("");
        setUsedWords(new Set());
        setStreak(0);
        setMultiplier(1);
    };

    const handleSelect = (rowIdx: number, colIdx: number) => {
        if (!blockedCells) return;
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
        if (!grid) return;
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
            // Points: 1 per character, times multiplier
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
        <div className="flex flex-col items-center min-h-screen p-8">
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
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={regenerate}
                >
                    Regenerate Grid
                </button>
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
                                disabled={isBlocked}
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
                    disabled={selected.length === 0}
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
        </div>
    );
}