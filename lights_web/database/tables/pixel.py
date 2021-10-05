import sqlalchemy

from .base import Base


class Pixel(Base):
    __tablename__ = "pixels"
    __table_args = (
        sqlalchemy.CheckConstraint("r >= 0 AND r <= 255"),
        sqlalchemy.CheckConstraint("g >= 0 AND g <= 255"),
        sqlalchemy.CheckConstraint("b >= 0 AND b <= 255"),
    )

    index = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, index=True)
    r = sqlalchemy.Column(sqlalchemy.Integer, nullable=False)
    g = sqlalchemy.Column(sqlalchemy.Integer, nullable=False)
    b = sqlalchemy.Column(sqlalchemy.Integer, nullable=False)
