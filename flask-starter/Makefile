.PHONY: install run test lint format precommit docker-build docker-run

install:
	python3 -m venv .venv && . .venv/bin/activate && pip install -U pip && pip install -r requirements.txt

run:
	. .venv/bin/activate && python run.py

test:
	. .venv/bin/activate && pytest -q

lint:
	. .venv/bin/activate && flake8 app tests

format:
	. .venv/bin/activate && black . && isort .

precommit:
	. .venv/bin/activate && pre-commit install

docker-build:
	docker build -t flask-starter:latest .

docker-run:
	docker run --rm -p 8000:8000 flask-starter:latest