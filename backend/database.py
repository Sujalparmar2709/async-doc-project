from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. The Connection String: This is the exact address and password 
# we set up in our docker-compose.yml file.
# Format: postgresql://username:password@host:port/database_name
# Notice we changed the port from 5432 to 5433!
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost:5433/document_db"

# 2. The Engine: This is the actual physical connection to the Postgres database.
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. The Session: This is the "conversation" we have with the database 
# every time we want to save or read data.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. The Base: We will use this later to build our database tables.
Base = declarative_base()