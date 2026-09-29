from pydantic import BaseSettings, AnyUrl

class Settings(BaseSettings):
    PROJECT_NAME: str = "Visual AI Agent"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "CHANGE_ME"
    DATABASE_URL: AnyUrl = "postgresql+asyncpg://user:pass@db:5432/visual_ai"

    class Config:
        env_file = "../../.env"
        env_file_encoding = 'utf-8'

settings = Settings()

# TODO: Add structured logging, tracing config, and feature flags
