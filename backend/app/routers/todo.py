from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.todo import Todo
from app.schemas.todo import TodoRequestDto
from app.schemas.todo import TodoResponseDto
from .api_routers import ApiResponse

todo_routers = APIRouter(
    prefix="/todo",
    tags=["todos"]
)

@todo_routers.post("/")
def create_task(task_request_dto: TodoRequestDto, db: Session = Depends(get_db)):
    new_task = Todo(
        title = task_request_dto.title,
        description = task_request_dto.description,
        complete = task_request_dto.complete
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    print("Everything is complete")
    return ApiResponse(
        status="Success",
        message= "This task is added",
        data={"todo": TodoResponseDto.model_validate(new_task, from_attributes=True)}
    )

@todo_routers.get("/")
def get_all_task(db: Session = Depends(get_db)):
    tasks = db.query(Todo).all()
    return ApiResponse(
        status="sucess",
        message="This is the way we get all the task",
        data={"todo": [TodoResponseDto.model_validate(task, from_attributes=True) for task in tasks]}
    )

# to get the tasks that are complete 
@todo_routers.get("/completed", response_model=ApiResponse)
def get_task_completed(db: Session = Depends(get_db)):
    tasks = db.query(Todo).filter(Todo.complete == True).all()
    return ApiResponse(
        status="success",
        message="These are the tasks that are complete",
        data={"todo": [TodoResponseDto.model_validate(task, from_attributes=True) for task in tasks]}
    )


@todo_routers.get("/notcompleted", response_model=ApiResponse)
def get_task_completed(db: Session = Depends(get_db)):
    tasks = db.query(Todo).filter(Todo.complete == False).all()
    return ApiResponse(
        status="success",
        message="These are the tasks that are not complete",
        data={"todo": [TodoResponseDto.model_validate(task, from_attributes=True) for task in tasks]}
    )
    

# to get the task by id
@todo_routers.get("/{todo_id}", response_model=ApiResponse)
def get_task_by_id(todo_id:int, db:Session = Depends(get_db)):
    task = db.query(Todo).filter(Todo.id == todo_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found with this id")
    return ApiResponse(
        status="Success",
        message="This is the way you find the task Good Baby",
        data={"todo": TodoResponseDto.model_validate(task, from_attributes=True)}
    )

@todo_routers.put("/{todo_id}", response_model=ApiResponse)
def update_task(todo_id:int, task_request_dto: TodoRequestDto, db:Session = Depends(get_db)):
    task = db.query(Todo).filter(Todo.id == todo_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This task is not availabe here.")

    task.title = task_request_dto.title
    task.description = task_request_dto.description
    task.complete = task_request_dto.complete

    db.commit()
    db.refresh(task)
    
    return ApiResponse(
        status="Success",
        message="This task is updated",
        data={"todo": TodoResponseDto.model_validate(task, from_attributes=True)}
    )

@todo_routers.delete("/{todo_id}", response_model=ApiResponse)
def delete_task_by_id(todo_id:int, db:Session = Depends(get_db)):
    task = db.query(Todo).filter(Todo.id == todo_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This task is not here")
    db.delete(task)
    db.commit()

    return ApiResponse(
        status="Success",
        message="This is amazing that it is deleted"
    )