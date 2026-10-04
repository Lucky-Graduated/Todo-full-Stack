from pydantic import BaseModel, Field
from datetime import datetime

class TodoRequestDto(BaseModel):
    title : str = Field(..., description="Enter the title of the task", min_length=1, max_length=50)
    description :str = Field(..., description="What to do in the task")
    complete: bool = Field(..., description="is it complete or not")

class TodoResponseDto(BaseModel):
    id :int = Field(..., description="Id of the task")
    title:str = Field(..., description="Title of the task")
    description:str = Field(..., description="describe the task")
    complete: bool = Field(..., description="is it complete or not")
    created_at : datetime = Field(description="At what time it was created")