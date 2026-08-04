# Redis Live Leaderboard Quiz

A real-time multiplayer quiz application powered by WebSockets and Redis. Players answer questions quickly and watch live leaderboard rankings update instantly.

## What It Does

This is a modern quiz game that demonstrates real-time data synchronization using WebSockets and Redis as the primary data store. Key features:

- **Live Leaderboard**: Watch rankings update in real-time as players answer questions
- **WebSocket Integration**: Instant communication between frontend and backend
- **Redis Storage**: Efficient data persistence using sorted sets for rankings
- **Admin Controls**: Seed test data and manage quiz questions
- **Responsive UI**: Built with React and modern styling

## Tech Stack

```
┌─────────────────────────────────────────────────┐
│                   Frontend                      │
│            React + Vite + TypeScript            │
│         (Real-time UI updates via WS)          │
└────────────────────┬────────────────────────────┘
                     │ WebSocket
                     ▼
┌─────────────────────────────────────────────────┐
│                    Gateway                      │
│              WebSocket Proxy Layer              │
└────────────────────┬────────────────────────────┘
                     │ HTTP / WebSocket
                     ▼
┌─────────────────────────────────────────────────┐
│                    Backend                      │
│   FastAPI + Python (Async request handlers)    │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│                  Redis                          │
│      Sorted Sets (leaderboard:global)          │
│      Hash Sets (player:* data)                 │
│      String Keys (quiz questions)              │
└─────────────────────────────────────────────────┘
```

## Quick Start

### Using Docker (Recommended)

```bash
# Clone and navigate to project
cd redis-live-leaderboard

# Start all services
docker compose up --build
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Redis**: localhost:6380

### First Steps

1. Open http://localhost:5173 in your browser
2. Click the **"Seed"** button on the admin page to populate test players
3. Start answering quiz questions
4. Watch the leaderboard update in real-time

### Local Development

**Frontend:**
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

**Backend:**
```bash
cd backend
pip install -e ".[dev]"
pytest  # Run tests
python -m uvicorn app.main:app --reload --host 0.0.0.0  # Development server
```

## Redis Data Structure

### Leaderboard (Sorted Set)
```bash
redis-cli -p 6380

# View top 10 players
ZREVRANGE leaderboard:global 0 9 WITHSCORES

# View full leaderboard with scores
ZREVRANGE leaderboard:global 0 -1 WITHSCORES
```

### Player Details (Hash Set)
```bash
# Get all player data
HGETALL player:{player_id}

# Get specific player field
HGET player:{player_id} name
HGET player:{player_id} score
```

### Quiz Questions (String/Hashes)
```bash
# List available quizzes
KEYS quiz:*

# Get quiz details
HGETALL quiz:{quiz_id}
```

## Environment Configuration

Create a `.env` file in the project root (see `.env.example`):

```env
REDIS_HOST=redis
REDIS_PORT=6380
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

## Project Structure

```
.
├── frontend/              # React + Vite application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── App.tsx       # Main app component
│   │   └── main.tsx      # Entry point
│   └── package.json
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── main.py       # FastAPI app setup
│   │   ├── game/         # Game logic
│   │   ├── leaderboard/  # Leaderboard operations
│   │   ├── players/      # Player management
│   │   ├── quizzes/      # Quiz management
│   │   └── websocket/    # WebSocket handlers
│   ├── tests/            # Pytest test suite
│   └── pyproject.toml
├── gateway/              # WebSocket proxy
├── docker-compose.yml    # Main orchestration
└── README.md
```

## API Endpoints

### Quiz Operations
- `POST /api/quizzes` - Create a quiz
- `GET /api/quizzes` - List quizzes
- `GET /api/quizzes/{id}` - Get quiz details

### Player Operations
- `POST /api/players` - Register a player
- `GET /api/players` - List all players
- `GET /api/players/{id}` - Get player stats

### Leaderboard
- `GET /api/leaderboard` - Get current rankings
- `WS /ws` - WebSocket connection for real-time updates

## Testing

Run the test suite:
```bash
cd backend
pytest -v
pytest --cov=app  # With coverage report
```

## Performance Considerations

- **Redis Sorted Sets**: O(log N) for insertions and updates on the leaderboard
- **WebSocket Broadcasts**: Efficient real-time score updates to all connected clients
- **Async Backend**: Uvicorn handles multiple concurrent WebSocket connections

## Troubleshooting

**Redis connection refused**
```bash
# Check if Redis is running
docker compose ps

# Restart services
docker compose restart redis
```

**Frontend can't connect to backend**
- Ensure backend is running on http://localhost:8000
- Check CORS settings in backend
- Verify WebSocket connection in browser DevTools (F12)

**Port already in use**
```bash
# Change ports in docker-compose.yml or specify via environment
docker compose up --build -e VITE_PORT=5174
```

## Deployment

### Production Docker Compose
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production
```env
REDIS_HOST=redis-prod.example.com
REDIS_PORT=6379
BACKEND_URL=https://api.quiz.example.com
FRONTEND_URL=https://quiz.example.com
```

## Future Enhancements

- [ ] Player authentication and persistence
- [ ] Multiple quiz rooms
- [ ] Bonus point mechanics
- [ ] Admin panel for real-time quiz management
- [ ] Replay functionality with score graphs
- [ ] Rate limiting and abuse prevention

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!
