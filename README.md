# LexTrail: Word Pathfinder

LexTrail is a word puzzle game where players find valid paths in a letter grid to spell words. The game uses BFS/DFS for path validation and scoring, integrating a dictionary API for word verification.

## Features

- **Dynamic Letter Grid**: Randomized 5x5 grid with blocked cells for added challenge.
- **Path Validation**: DFS ensures paths are contiguous.
- **Word Verification**: Uses dictionary API to validate words.
- **Scoring System**: Earn points for longer words and streaks.
- **Leaderboard**: Submit scores and compete globally.

## Tech Stack

- **Frontend**: Next.js, Tailwind CSS
- **Backend**: Node.js, MySQL
- **API Integration**: Dictionary API for word validation

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/Armaan016/lextrail.git
   cd lextrail
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   - Create a MySQL database named `lextrail`.
   - Add a `leaderboard` table with columns `username` (VARCHAR) and `score` (INT).

4. Configure environment variables:
   - Create a `.env` file and set `DB_PASSWORD`.

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) to play the game.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Dictionary API](https://dictionaryapi.dev/)

## License

This project is licensed under the MIT License.