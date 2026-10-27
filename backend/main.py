"""VYRA Phishing Detection Backend Application.

Detect the Unknown. Verify the Evidence. Prevent the Threat.
"""

from contextlib import asynccontextmanager
import logging
from typing import AsyncGenerator, Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from api.routes.blockchain import router as blockchain_router
from api.routes.scan import router as scan_router
from blockchain.audit import blockchain
from core.config import settings
from db.database import init_db

# Configure application logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("vyra.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for managing startup and shutdown tasks."""
    logger.info("Initializing %s v%s...", settings.APP_NAME, settings.VERSION)
    # Initialize SQLite database schema
    await init_db()
    # Initialize / verify blockchain
    blockchain.load_chain()
    logger.info("Startup complete. VYRA is ready to protect against phishing threats.")
    yield
    logger.info("Shutting down %s...", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Next-generation Explainable Phishing Detection & Cryptographic Audit API.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure Cross-Origin Resource Sharing (CORS) for development & extension clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(scan_router, prefix="/api", tags=["Scans"])
app.include_router(blockchain_router, prefix="/api/blockchain", tags=["Blockchain"])


@app.get(
    "/",
    tags=["General"],
    summary="VYRA System Information",
    description="Returns application branding and core tagline.",
)
async def root() -> Dict[str, str]:
    """Root endpoint returning system branding and mission tagline."""
    return {
        "name": settings.APP_NAME,
        "tagline": "Detect the Unknown. Verify the Evidence. Prevent the Threat.",
    }


@app.get(
    "/health",
    tags=["General"],
    summary="Health Check",
    description="Returns real-time service operational status and version.",
)
async def health() -> Dict[str, str]:
    """Service health check endpoint."""
    return {
        "status": "ok",
        "version": settings.VERSION,
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
