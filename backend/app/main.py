from fastapi import FastAPI
import app.models.todo
import app.models.user
from .core.db import Base, engine
from app.routers.todo import todo_routers

# this will create a table 
Base.metadata.create_all(bind = engine)

app = FastAPI()
app.include_router(todo_routers)

@app.get("/root")
def root():
    return {"message":"This is working and perfectly amazing to work with."}