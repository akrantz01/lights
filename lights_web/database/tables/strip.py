from enum import Enum
import sqlalchemy
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from .base import Base


class Attribute(Enum):
    brightness = 1
    mode = 2


class Mode(Enum):
    queue = 1
    insert = 2


class Strip(Base):
    __tablename__ = "strips"

    attribute = sqlalchemy.Column(sqlalchemy.Enum(Attribute), primary_key=True)
    value = sqlalchemy.Column(sqlalchemy.Integer)

    @staticmethod
    async def __get_or_default(
        attribute: Attribute, default: int, s: AsyncSession
    ) -> int:
        # Determine the type of transaction to use when updating if necessary
        txn_beginner = s.begin_nested if s.in_transaction else s.begin

        # Attempt to get the key
        async with s.begin_nested():
            statement = select(Strip.value).where(Strip.attribute == attribute)
            result = await s.execute(statement)
            value = result.scalars().first()

        # Insert the default value if DNE
        if value is None:
            strip = Strip(attribute=attribute, value=default)

            async with txn_beginner():
                s.add(strip)
                await s.commit()

            return default

        return value

    @staticmethod
    async def brightness(s: AsyncSession) -> int:
        return await Strip.__get_or_default(Attribute.brightness, 100, s)

    @staticmethod
    async def mode(s: AsyncSession) -> Mode:
        value = await Strip.__get_or_default(Attribute.mode, Mode.queue.value, s)
        return Mode(value)
