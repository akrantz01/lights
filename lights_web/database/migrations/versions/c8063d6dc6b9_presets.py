"""presets

Revision ID: c8063d6dc6b9
Revises: 8d22804670f5
Create Date: 2021-10-10 06:12:38.797419+00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "c8063d6dc6b9"
down_revision = "8d22804670f5"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "presets",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "ranges",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("start", sa.Integer(), nullable=False),
        sa.Column("end", sa.Integer(), nullable=False),
        sa.Column("r", sa.Integer(), nullable=False),
        sa.Column("g", sa.Integer(), nullable=False),
        sa.Column("b", sa.Integer(), nullable=False),
        sa.CheckConstraint("b >= 0 AND b <= 255"),
        sa.CheckConstraint("g >= 0 AND g <= 255"),
        sa.CheckConstraint("r >= 0 AND r <= 255"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.drop_table("strips")
    op.drop_index("ix_pixels_index", table_name="pixels")
    op.drop_table("pixels")
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "pixels",
        sa.Column("index", sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column("r", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("g", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("b", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.PrimaryKeyConstraint("index", name="pixels_pkey"),
    )
    op.create_index("ix_pixels_index", "pixels", ["index"], unique=False)
    op.create_table(
        "strips",
        sa.Column(
            "attribute",
            postgresql.ENUM("length", "brightness", "mode", name="attribute"),
            autoincrement=False,
            nullable=False,
        ),
        sa.Column("value", sa.INTEGER(), autoincrement=False, nullable=True),
        sa.PrimaryKeyConstraint("attribute", name="strips_pkey"),
    )
    op.drop_table("ranges")
    op.drop_table("presets")
    # ### end Alembic commands ###
