# Flask Starter

A minimal, production-ready Flask project scaffold with tests, linting, and Docker.

## Quickstart

```bash
cd flask-starter
python3 -m venv .venv
. .venv/bin/activate
pip install -U pip
pip install -r requirements.txt
python run.py  # http://localhost:5000
```

## CLI

```bash
# Run the dev server
FLASK_APP=wsgi:app flask run -h 0.0.0.0 -p 5000

# Run tests
pytest

# Lint & format
flake8 app tests
black . && isort .
```

## Docker

```bash
docker build -t flask-starter:latest .
docker run --rm -p 8000:8000 flask-starter:latest
```

## Configuration

Set environment variables (see `.env.example`). Defaults are sensible for local development.