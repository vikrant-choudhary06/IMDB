import os
import sqlite3
import uuid
from datetime import datetime
from backend.app.config.config import settings

def get_db_path():
    # Convert database URL to filepath
    # e.g., sqlite:///./data/api_keys.db
    db_url = settings.DATABASE_URL
    if db_url.startswith("sqlite:///"):
        path = db_url.replace("sqlite:///", "")
    else:
        path = "./data/api_keys.db"
        
    # Handle relative to backend/ root
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
    
    # Resolve absolute path
    if path.startswith("./") or not os.path.isabs(path):
        abs_path = os.path.abspath(os.path.join(backend_root, path))
    else:
        abs_path = path
        
    # Ensure directory exists
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    return abs_path

def get_connection():
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def initialize_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Create api_keys table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS api_keys (
        api_key TEXT PRIMARY KEY,
        owner_name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        is_active INTEGER DEFAULT 1
    )
    """)
    
    # Create api_logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS api_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        api_key TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        response_time REAL NOT NULL,
        status_code INTEGER NOT NULL
    )
    """)
    
    # Insert the demo key if it doesn't exist
    demo_key = settings.DEMO_API_KEY
    cursor.execute("SELECT 1 FROM api_keys WHERE api_key = ?", (demo_key,))
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO api_keys (api_key, owner_name, created_at, is_active) VALUES (?, ?, ?, 1)",
            (demo_key, "Demo User / Frontend Client", datetime.utcnow().isoformat())
        )
        
    conn.commit()
    conn.close()
    print("SQLite Database initialized successfully.")

def create_api_key(owner_name: str) -> str:
    conn = get_connection()
    cursor = conn.cursor()
    
    # Generate random key
    new_key = f"apikey_{uuid.uuid4().hex[:16]}"
    created_at = datetime.utcnow().isoformat()
    
    cursor.execute(
        "INSERT INTO api_keys (api_key, owner_name, created_at) VALUES (?, ?, ?)",
        (new_key, owner_name, created_at)
    )
    
    conn.commit()
    conn.close()
    return new_key

def validate_api_key(api_key: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT is_active FROM api_keys WHERE api_key = ? AND is_active = 1",
        (api_key,)
    )
    row = cursor.fetchone()
    conn.close()
    return row is not None

def log_request(api_key: str, endpoint: str, response_time: float, status_code: int):
    conn = get_connection()
    cursor = conn.cursor()
    
    timestamp = datetime.utcnow().isoformat()
    cursor.execute(
        "INSERT INTO api_logs (api_key, endpoint, timestamp, response_time, status_code) VALUES (?, ?, ?, ?, ?)",
        (api_key, endpoint, timestamp, response_time, status_code)
    )
    
    conn.commit()
    conn.close()

def get_developer_stats(api_key: str) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    
    # Total requests
    cursor.execute(
        "SELECT COUNT(*) FROM api_logs WHERE api_key = ?",
        (api_key,)
    )
    total_requests = cursor.fetchone()[0]
    
    # Endpoint usage breakdown
    cursor.execute(
        "SELECT endpoint, COUNT(*) as count FROM api_logs WHERE api_key = ? GROUP BY endpoint ORDER BY count DESC",
        (api_key,)
    )
    endpoint_usage = [{"endpoint": r["endpoint"], "count": r["count"]} for r in cursor.fetchall()]
    
    # Hourly usage over last 24 hours
    cursor.execute("""
        SELECT strftime('%Y-%m-%dT%H:00:00', timestamp) as hour, COUNT(*) as count 
        FROM api_logs 
        WHERE api_key = ? AND timestamp >= datetime('now', '-1 day')
        GROUP BY hour 
        ORDER BY hour ASC
    """, (api_key,))
    hourly_usage = [{"time": r["hour"], "count": r["count"]} for r in cursor.fetchall()]
    
    # Average response time
    cursor.execute(
        "SELECT AVG(response_time) FROM api_logs WHERE api_key = ?",
        (api_key,)
    )
    avg_response_time = cursor.fetchone()[0] or 0.0
    
    conn.close()
    
    return {
        "api_key": api_key,
        "total_requests": total_requests,
        "average_response_time_ms": round(avg_response_time * 1000, 2),
        "endpoint_usage": endpoint_usage,
        "hourly_usage": hourly_usage
    }
