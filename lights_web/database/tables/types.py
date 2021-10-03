from datetime import datetime, timezone
import sqlalchemy
from sqlalchemy.engine import Dialect
from sqlalchemy.types import TypeDecorator
from typing import Optional


# From https://mike.depalatis.net/blog/sqlalchemy-timestamps.html
class TimeStamp(TypeDecorator):
    impl = sqlalchemy.DateTime
    cache_ok = True
    LOCAL_TIMEZONE = datetime.now().astimezone().tzinfo

    def process_bind_param(
        self, value: Optional[datetime], dialect: Dialect
    ) -> Optional[datetime]:
        if value is None:
            return None

        if value.tzinfo is None:
            value = value.astimezone(self.LOCAL_TIMEZONE)

        return value.astimezone(timezone.utc)

    def process_result_value(
        self, value: Optional[datetime], dialect: Dialect
    ) -> Optional[datetime]:
        if value is None:
            return None

        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)

        return value.astimezone(timezone.utc)
