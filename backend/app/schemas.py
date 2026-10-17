from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator

class Creds(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)

class RegisterIn(Creds):
    name: str = Field(min_length=1, max_length=150)

    @field_validator("name")
    @classmethod
    def trim_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be blank")
        return value

class RegistrationResult(BaseModel):
    message: str

class Token(BaseModel):
    access_token: str
    role: str

class ProductIn(BaseModel):
    name: str = Field(min_length=1)
    description: str = ""
    category: str = "general"
    price: float = Field(ge=0)
    stock: int = Field(ge=0)

class ProductOut(ProductIn):
    model_config = ConfigDict(from_attributes=True)
    pid: int

class CartItem(BaseModel):
    product_pid: int = Field(gt=0)
    quantity: int = Field(gt=0)

class CartReplace(BaseModel):
    items: list[CartItem] = Field(default_factory=list)

class CartLineOut(BaseModel):
    product: ProductOut
    quantity: int

class CartOut(BaseModel):
    items: list[CartLineOut]

class AddressFields(BaseModel):
    label: str | None = Field(default=None, max_length=50)
    recipient_name: str = Field(min_length=1, max_length=150)
    phone: str = Field(min_length=1, max_length=40)
    address_line1: str = Field(min_length=1, max_length=200)
    address_line2: str | None = Field(default=None, max_length=200)
    city: str = Field(min_length=1, max_length=100)
    region: str | None = Field(default=None, max_length=100)
    postal_code: str = Field(min_length=1, max_length=30)
    country: str = Field(min_length=2, max_length=2)

    @field_validator("country")
    @classmethod
    def normalize_country(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("recipient_name", "phone", "address_line1", "city", "postal_code")
    @classmethod
    def trim_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value

class AddressIn(AddressFields):
    is_default: bool = False

class AddressOut(AddressFields):
    model_config = ConfigDict(from_attributes=True)
    address_id: int
    is_default: bool

class OrderIn(BaseModel):
    items: list[CartItem] = Field(min_length=1)
    address: AddressFields

class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    product_name: str
    quantity: int
    price: float

class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    method: str
    status: str
    amount: float

class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    oid: int
    total: float
    status: str
    created_at: datetime
    items: list[OrderItemOut]
    delivery_recipient_name: str | None
    delivery_phone: str | None
    delivery_address_line1: str | None
    delivery_address_line2: str | None
    delivery_city: str | None
    delivery_region: str | None
    delivery_postal_code: str | None
    delivery_country: str | None
    payment: "PaymentOut | None" = None

class StatusIn(BaseModel):
    status: Literal["placed", "packed", "shipped", "delivered", "cancelled"]
