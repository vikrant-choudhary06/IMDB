import os
import sys

# System-level stdout/stderr wrapper to prevent UnicodeEncodeError in Windows consoles
class UnicodeSafeWriter:
    def __init__(self, original_stream):
        self.original_stream = original_stream
        self.encoding = original_stream.encoding or 'utf-8'

    def write(self, data):
        if not data:
            return
        try:
            self.original_stream.write(data)
        except UnicodeEncodeError:
            # Safely encode with 'replace' to strip unencodable characters like emojis
            encoded = data.encode(self.encoding, errors='replace')
            decoded = encoded.decode(self.encoding)
            self.original_stream.write(decoded)

    def flush(self):
        try:
            self.original_stream.flush()
        except Exception:
            pass

# Apply stream redirectors
sys.stdout = UnicodeSafeWriter(sys.stdout)
sys.stderr = UnicodeSafeWriter(sys.stderr)

# Locate root project path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "..", "..", ".."))

# Add project root to sys.path
if project_root not in sys.path:
    sys.path.append(project_root)

# Locate ImdbDataExtraction directory
imdb_dir = os.path.join(project_root, "ImdbDataExtraction")
if os.path.isdir(imdb_dir):
    if imdb_dir not in sys.path:
        sys.path.append(imdb_dir)
        
    # Selectively add only the specific subfolders that perform adjacent imports
    # to avoid shadowing namespace packages like search_by_string, chart_downloader, etc.
    subdirs_to_add = [
        "rottentomatoes_downloader",
        "videos_downloader",
        "streaming_availability"
    ]
    
    for subdir in subdirs_to_add:
        subdir_path = os.path.join(imdb_dir, subdir)
        if os.path.isdir(subdir_path) and subdir_path not in sys.path:
            sys.path.append(subdir_path)
                
    print("Loaded sys.path with project root and selective scraper subdirectories to prevent shadowing.")
else:
    print(f"Warning: ImdbDataExtraction directory not found at {imdb_dir}")
