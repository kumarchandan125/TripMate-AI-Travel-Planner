# TripMate AI Travel Planner

TripMate uses FastAPI and a LangGraph workflow to search for flights and hotels,
then generate an itinerary and a final travel plan. PostgreSQL stores graph
checkpoints so a thread can continue across requests.

## Setup

Create and activate a virtual environment, then install dependencies:

```powershell
uv venv
.\.venv\Scripts\Activate.ps1
uv pip install -r requirements.txt
```

Create a `.env` file in the project root and configure:

```text
GOOGLE_API_KEY=your_google_api_key
TAVILY_API_KEY=your_tavily_api_key
AVIATIONSTACK_API_KEY=your_aviationstack_api_key
DATABASE_URL=your_postgresql_connection_url
DEFAULT_ORIGIN_IATA=DAC
```

`DEFAULT_ORIGIN_IATA` accepts an airport code, city, or country. Keep `.env`
private; do not commit real credentials.

## Run

```powershell
uvicorn app:app --reload
```

Open `http://127.0.0.1:8000`. The PostgreSQL connection and checkpoint table
setup are initialized on the first travel request, so the home page and health
endpoint remain available if the database is temporarily unavailable.

## Test

```powershell
python -m unittest discover -s tests -v
```

Flight search returns live flight-status data when available; it does not
provide ticket prices.
