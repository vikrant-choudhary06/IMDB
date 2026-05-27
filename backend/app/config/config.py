import os

# Zero-dependency manual parser to load .env file
def load_env_file():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.abspath(os.path.join(current_dir, "..", "..", ".env"))
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    if key and key not in os.environ:
                        os.environ[key] = val

# Load it
load_env_file()

class Settings:
    # Server configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")
    
    # SQLite Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/api_keys.db")
    
    # Redis configuration
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "")
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "3600"))
    
    # Security / API Keys
    DEMO_API_KEY: str = os.getenv("DEMO_API_KEY", "demo_key_99f2b8")
    DEFAULT_RATE_LIMIT: int = int(os.getenv("DEFAULT_RATE_LIMIT", "60"))

settings = Settings()
