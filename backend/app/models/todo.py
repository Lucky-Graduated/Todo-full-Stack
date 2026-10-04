from app.core.db import Base
from sqlalchemy import Column, Integer, Float, Date, DateTime, String, Boolean
from datetime import datetime, timezone

class Todo(Base):
    __tablename__ = "todo"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(50), nullable=False)
    description = Column(String(100), nullable=False)
    complete = Column(Boolean, default=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))