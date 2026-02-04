#!/bin/bash
# Start both frontend and backend servers

echo "🚀 Starting RoomHy Platform..."
echo ""

# Start backend on port 5001
echo "📦 Starting Backend on port 5001..."
cd roomhy-backend
node server.js &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend on port 5000
echo "🌐 Starting Frontend on port 5000..."
cd ..
node frontend-server.js &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers started!"
echo "   Frontend:  http://localhost:5000"
echo "   Backend:   http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
