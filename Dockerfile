# Use the slim version you requested
FROM python:3.14-slim

# Install uv (The ultra-fast package manager)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy files and install dependencies
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

# Copy the rest of the code
COPY . .

# Run the app (Assumes main.py is your entry point)
CMD ["uv", "run", "gunicorn", "--worker-class", "gevent", "-w", "1", "-b", "0.0.0.0:5000", "app:app"]