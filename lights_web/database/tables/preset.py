import sqlalchemy
from sqlalchemy.dialects.postgresql import UUID
import uuid

from .base import Base


class Preset(Base):
    __tablename__ = "presets"

    id = sqlalchemy.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = sqlalchemy.Column(sqlalchemy.Text, nullable=False)
