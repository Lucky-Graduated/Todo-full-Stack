from app.core.db import Base
from sqlalchemy import Column, Integer, Float, Date, DateTime, String, Boolean
from datetime import datetime, timezone

class User(Base):
    __tablename__ = "user"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False)
    password = Column(String(20), nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))