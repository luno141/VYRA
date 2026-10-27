"""VYRA Configuration Settings Module.

Provides system-wide configuration loaded from environment variables or .env files
using Pydantic BaseSettings.
"""

import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings and configuration."""

    APP_NAME: str = "VYRA"
    VERSION: str = "1.0.0"
    DB_URL: str = "sqlite+aiosqlite:///./vyra.db"
    ML_MODEL_PATH: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "ml", "models", "vyra_model.joblib")
    SECRET_KEY: str = "vyra-production-secret-key-32-char-minimum-token-protection"
    CORS_ORIGINS: List[str] = ["*"]
    BLOCKCHAIN_FILE_PATH: str = "./blockchain_data.json"
    BLOCKCHAIN_DIFFICULTY: int = 2

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.strip().startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError("Invalid format for CORS_ORIGINS")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()
