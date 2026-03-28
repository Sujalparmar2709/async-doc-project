from sqlalchemy import Column, Integer, String, DateTime, JSON
from database import Base
import datetime

# We are designing the "Document" form here
class Document(Base):
    __tablename__ = "documents"  # This is the name of the folder in Postgres

    # These are the specific boxes on our form
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    
    # Status can be: Queued, Processing, Completed, or Failed
    status = Column(String, default="Queued") 
    
    # This is where we will eventually save the final parsed results
    extracted_data = Column(JSON, nullable=True) 
    
    # Automatically stamps the exact time the file was uploaded
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    