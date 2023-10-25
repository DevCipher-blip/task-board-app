FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN useradd --system --uid 10001 --create-home app
USER app

EXPOSE 8001
ENTRYPOINT ["sh", "./entrypoint.sh"]
CMD ["gunicorn", "mini_trello_be.wsgi", "--bind", "0.0.0.0:8001", "--workers", "2", "--access-logfile", "-"]
