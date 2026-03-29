from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any
import models
from database import engine, SessionLocal
from worker import process_document_task
import json
import csv
import io

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # We explicitly whitelist your Vercel site and your local laptop!
    allow_origins=[
        "https://async-doc-project.vercel.app", 
        "http://localhost:5173"
    ], 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class FinalizeRequest(BaseModel):
    extracted_data: Dict[str, Any]

@app.get("/")
def read_root():
    return {"message": "Hello from your FastAPI Cashier! The system is online."}

@app.post("/upload/")
def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    new_document = models.Document(filename=file.filename, status="Queued")
    db.add(new_document)
    db.commit()
    db.refresh(new_document)
    process_document_task.delay(new_document.filename, new_document.id)
    return {"message": "File received!", "job_id": new_document.id, "filename": file.filename, "status": "Queued"}

@app.get("/documents/{doc_id}")
def get_document_status(doc_id: int, db: Session = Depends(get_db)):
    document = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@app.get("/documents/")
def get_all_documents(db: Session = Depends(get_db)):
    documents = db.query(models.Document).all()
    return documents

@app.put("/documents/{doc_id}/finalize")
def finalize_document(doc_id: int, request: FinalizeRequest, db: Session = Depends(get_db)):
    document = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    document.extracted_data = request.extracted_data
    document.status = "Finalized"
    db.commit()
    db.refresh(document)
    return document

@app.delete("/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    document = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}

# --- NEW: EXPORT TO JSON ---
@app.get("/export/json")
def export_json(db: Session = Depends(get_db)):
    # Only grab documents the manager has approved
    documents = db.query(models.Document).filter(models.Document.status == "Finalized").all()
    
    export_data = []
    for doc in documents:
        export_data.append({
            "id": doc.id,
            "filename": doc.filename,
            "final_data": doc.extracted_data
        })
        
    # Send it back to the browser as a downloadable file
    return Response(
        content=json.dumps(export_data, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=finalized_documents.json"}
    )

# --- NEW: EXPORT TO CSV ---
@app.get("/export/csv")
def export_csv(db: Session = Depends(get_db)):
    documents = db.query(models.Document).filter(models.Document.status == "Finalized").all()
    
    # Create an invisible spreadsheet in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write the Top Row (Headers)
    writer.writerow(["Job ID", "Original Filename", "Title", "Category", "Summary", "Keywords"])
    
    # Write the data for every finalized document
    for doc in documents:
        data = doc.extracted_data or {}
        title = data.get("title", "")
        category = data.get("category", "")
        summary = data.get("summary", "")
        
        # Keywords is a list, so we combine it into one string with commas
        keywords_list = data.get("keywords", [])
        keywords = ", ".join(keywords_list) if isinstance(keywords_list, list) else ""
        
        writer.writerow([doc.id, doc.filename, title, category, summary, keywords])
        
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=finalized_documents.csv"}
    )