from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector

app = FastAPI()

# Autoriser Angular (port 4200) à parler à Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connexion à ta base de données
db = mysql.connector.connect(
    host="127.0.0.1",
    user="root",
    password="",  # Laisse vide si c'est XAMPP par défaut
    database="wassali-backend"
)

@app.get("/client")
def get_tasks():
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM client") # Remplace par ta table
    return cursor.fetchall()
    return results
