import sqlalchemy
from sqlalchemy.dialects.postgresql import UUID
import uuid

from .base import Base


class Range(Base):
    __tablename__ = "ranges"
    __table_args__ = (
        sqlalchemy.CheckConstraint("r >= 0 AND r <= 255"),
        sqlalchemy.CheckConstraint("g >= 0 AND g <= 255"),
        sqlalchemy.CheckConstraint("b >= 0 AND b <= 255"),
    )

    id = sqlalchemy.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    start = sqlalchemy.Column(sqlalchemy.Integer, nullable=False)
    end = sqlalchemy.Column(sqlalchemy.Integer, nullable=False)

    r = sqlalchemy.Column(sqlalchemy.Integer, nullable=False)
    g = sqlalchemy.Column(sqlalchemy.Integer, nullable=False)
    b = sqlalchemy.Column(sqlalchemy.Integer, nullable=False)
