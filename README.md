# ✈️ TripMate AI — A Multi-Agent Travel Planner with LangGraph

TripMate is a FastAPI + LangGraph travel planner that turns a natural-language trip request into a practical travel plan with flight suggestions, hotel ideas, and a day-by-day itinerary. The project combines a browser UI with a multi-agent workflow for travel research and planning.

## Why this project?

Planning a trip usually means jumping between multiple websites, tools, and spreadsheets. This project brings that flow into one experience by combining:

- a flight-search agent,
- a hotel-research agent,
- an itinerary-planning agent, and
- a final response agent,

all coordinated through a LangGraph workflow.

## Features

- ✈️ Flight research using AviationStack
- 🏨 Hotel suggestions using Tavily search
- 🧠 Multi-agent orchestration with LangGraph
- 📝 Structured travel itinerary generation
- 🌐 FastAPI backend with a web interface
- 💾 Conversation thread persistence using PostgreSQL checkpoints
- ⚡ LLM responses powered by Google Gemini
- 📄 Copy and PDF export in the browser

## Tech Stack

- Python 3.10+
- FastAPI
- Jinja2 + HTML/CSS/JavaScript frontend
- LangGraph
- LangChain
- Google Gemini API
- PostgreSQL
- Tavily API
- AviationStack API

## Project Structure

```text
.
├── app.py                # FastAPI app entry point and routes
├── backend.py            # LangGraph workflow, agents, and PostgreSQL checkpointer
├── requirements.txt      # Python dependencies
├── .env                  # Local environment variables (not committed)
├── static/               # CSS and JS frontend assets
├── templates/            # HTML templates
├── tools/
│   ├── flight_tool.py    # AviationStack route & flight parsing logic
│   ├── tavily_tool.py    # Hotel and destination search logic
│   └── __init__.py
├── tests/
│   └── test_response_format.py
└── README.md
```

## Prerequisites

Before running the project locally, make sure you have:

- Python 3.10 or newer installed
- PostgreSQL running and accessible
- API keys for:
  - Google Gemini
  - Tavily
  - AviationStack

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
GOOGLE_API_KEY=your_google_api_key
TAVILY_API_KEY=your_tavily_api_key
AVIATIONSTACK_API_KEY=your_aviationstack_api_key
DATABASE_URL=postgresql://user:password@host:5432/travel_db
DEFAULT_ORIGIN_IATA=DAC
```

Optional LangSmith tracing variables:

```env
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=your_langsmith_key
LANGSMITH_PROJECT_NAME=TripMate-AI-Travel-Planner
```

`DEFAULT_ORIGIN_IATA` can be an airport code, city name, or country code. Keep `.env` private and do not commit real credentials.

## Installation

```bash
python -m venv .venv
source .venv/bin/activate      # On Windows: .venv\Scripts\activate
python -m pip install -r requirements.txt
```

## Running the App

Start the FastAPI server:

```bash
uvicorn app:app --reload
```

Or run the app directly:

```bash
python app.py
```

Then open your browser at:

```text
http://127.0.0.1:8000/
```

## API Endpoints

- `GET /health` — health check
- `POST /api/travel` — submit a travel request
- `GET /` — serves the frontend UI

Example request:

```bash
curl -X POST http://127.0.0.1:8000/api/travel \
  -H "Content-Type: application/json" \
  -d '{"message":"Plan a 3-day trip to Tokyo from Dhaka with flights, hotels, and a budget under $1200","thread_id":"demo-thread"}'
```

## How the Workflow Works

1. The user submits a travel request via the web UI or API.
2. The flight agent gathers flight-related information based on parsed route data.
3. The hotel agent searches for accommodation suggestions.
4. The itinerary agent creates a detailed day-by-day travel plan.
5. The final agent formats the result into a polished response for the user.
6. PostgreSQL checkpointing stores graph state so the same thread can continue across requests.

## Important Notes

- Flight search returns live flight-status data when available; it does not guarantee ticket prices.
- Hotel and destination information depends on the live search results returned by Tavily.
- The app stores thread state in PostgreSQL, so a consistent `thread_id` allows follow-up questions in the same trip session.

## Testing

Run the project tests:

```bash
python -m unittest discover -s tests -v
```

This project includes basic regression tests to validate AI response normalization and document the expected output shape.

## Contributing

Contributions are welcome. If you want to improve the app, add new travel features, or fix issues:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Open a pull request

## Acknowledgments

This project is built with modern LLM tooling, travel APIs, and a LangGraph workflow to create a practical AI travel-planning experience.