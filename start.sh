#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "=========================================================="
echo " Starting VYRA Cyber Defense System (Academic Project)"
echo " 'Detect the Unknown. Verify the Evidence. Prevent the Threat.'"
echo "=========================================================="

cleanup() {
    echo ""
    echo "Stopping VYRA services..."
    kill 0
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

echo "[1/2] Launching Backend FastAPI API on http://localhost:8000..."
cd "$DIR/backend"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "[2/2] Launching Next.js 14 Dashboard on http://localhost:3000..."
cd "$DIR/dashboard"
npm run dev -- -p 3000 &
FRONTEND_PID=$!

echo ""
echo "VYRA services are running:"
echo " - Backend REST API & Docs : http://localhost:8000/docs"
echo " - Web Dashboard           : http://localhost:3000"
echo " - Browser Extension       : Load unpacked from $DIR/extension"
echo ""
echo "Press Ctrl+C to stop all services."
wait
