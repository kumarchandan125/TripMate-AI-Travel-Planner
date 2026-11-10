import os
import certifi
from typing import TypedDict,Annotated
import operator
import uuid
import psycopg
from psycopg.rows import dict_row
import operator
from langgraph.graph import StateGraph, START,END
from langgraph.checkpoint.postgres import PostgresSaver
from dotenv import load_dotenv
load_dotenv()

os.environ["SSL_CERT_FILE"] = certifi.where()
os.environ["REQUESTS_CA_BUNDLE"] = certifi.where()