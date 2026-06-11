from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    sku: str = Field(..., min_length=2, max_length=60)
    price: Decimal = Field(..., gt=0, max_digits=10, decimal_places=2)
    quantity_in_stock: int = Field(..., ge=0)

    @field_validator("sku")
    @classmethod
    def normalize_sku(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return value.strip()


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    sku: str | None = Field(default=None, min_length=2, max_length=60)
    price: Decimal | None = Field(default=None, gt=0, max_digits=10, decimal_places=2)
    quantity_in_stock: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def at_least_one_field(self):
        if not any(getattr(self, field) is not None for field in self.model_fields):
            raise ValueError("At least one field must be provided for update")
        return self

    @field_validator("sku")
    @classmethod
    def normalize_sku(cls, value: str | None) -> str | None:
        return value.strip().upper() if value else value

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        return value.strip() if value else value


class ProductRead(ProductBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CustomerCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(..., min_length=7, max_length=30)

    @field_validator("full_name", "phone")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).lower().strip()


class CustomerRead(CustomerCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ProductBrief(BaseModel):
    id: int
    name: str
    sku: str
    model_config = ConfigDict(from_attributes=True)


class OrderItemCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    customer_id: int = Field(..., gt=0)
    items: list[OrderItemCreate] = Field(..., min_length=1)


class OrderItemRead(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    line_total: Decimal
    product: ProductBrief
    model_config = ConfigDict(from_attributes=True)


class CustomerBrief(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    model_config = ConfigDict(from_attributes=True)


class OrderRead(BaseModel):
    id: int
    customer_id: int
    total_amount: Decimal
    status: str
    created_at: datetime
    customer: CustomerBrief
    items: list[OrderItemRead]
    model_config = ConfigDict(from_attributes=True)


class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: int
