from celery import Celery
import time
from database import SessionLocal
import models

# 1. Connect the Cook to the Kitchen
celery_app = Celery(
    "worker",
    broker="redis://localhost:6380/0",
    backend="redis://localhost:6380/0"
)

# 2. The Background Recipe
# Notice we now accept the document_id so the cook knows exactly 
# which drawer to open in the Postgres filing cabinet!
@celery_app.task
def process_document_task(filename: str, document_id: int):
    print(f"--> COOK: I received order #{document_id} for '{filename}'!")
    
    # Open the filing cabinet
    db = SessionLocal()
    
    try:
        # Find the exact document the cashier created
        document = db.query(models.Document).filter(models.Document.id == document_id).first()
        if not document:
            print("--> COOK ERROR: Could not find document in database!")
            return
        
        # Mark it as Processing
        document.status = "Processing"
        db.commit()
        print("--> COOK: Status updated to 'Processing'")
        
        # Simulate the heavy extraction work (10 seconds)
        time.sleep(10)
        
        # Mark it as Completed and save the extracted data required by your assignment
        document.status = "Completed"
        document.extracted_data = {
            "title": f"Parsed_{filename}",
            "category": "Invoice",
            "summary": "This is a simulated extraction result.",
            "keywords": ["async", "fastapi", "success"]
        }
        db.commit()
        print("--> COOK: Status updated to 'Completed'!")
        
    finally:
        # Always close the cabinet drawer so the database doesn't crash!
        db.close()
        
    return {"status": "Completed", "filename": filename}