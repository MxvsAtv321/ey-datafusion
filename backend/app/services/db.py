from __future__ import annotations

import json
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Iterator, Optional, List, Dict, Any

from sqlalchemy import create_engine, String, Integer, DateTime, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker, Session

from ..core.config import settings


class Base(DeclarativeBase):
    pass


class Run(Base):
    __tablename__ = "runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    status: Mapped[str] = mapped_column(String(32), default="started")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    artifacts_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class Manifest(Base):
    __tablename__ = "manifests"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(String(64), index=True)
    content_json: Mapped[str] = mapped_column(Text)


class Template(Base):
    __tablename__ = "templates"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), index=True)
    content_json: Mapped[str] = mapped_column(Text)


_dsn = settings.db_dsn or "sqlite:///./ey_datafusion.db"
engine = create_engine(_dsn, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


@contextmanager
def get_session() -> Iterator[Session]:
    init_db()
    session: Session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def create_run(run_id: str) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    with get_session() as s:
        r = Run(run_id=run_id, status="started", started_at=now)
        s.add(r)
    return {"run_id": run_id, "started_at": now.isoformat()}


def complete_run(run_id: str, status: str, artifacts: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    with get_session() as s:
        r: Optional[Run] = s.query(Run).filter(Run.run_id == run_id).one_or_none()
        if r is None:
            r = Run(run_id=run_id, status=status, started_at=now)
            s.add(r)
        r.status = status
        r.completed_at = now
        if artifacts is not None:
            r.artifacts_json = json.dumps(artifacts)
    return {"run_id": run_id, "status": status, "artifacts": artifacts or []}


def get_run(run_id: str) -> Optional[Dict[str, Any]]:
    with get_session() as s:
        r: Optional[Run] = s.query(Run).filter(Run.run_id == run_id).one_or_none()
        if r is None:
            return None
        artifacts = json.loads(r.artifacts_json) if r.artifacts_json else []
        return {
            "run_id": r.run_id,
            "status": r.status,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "artifacts": artifacts,
        }


