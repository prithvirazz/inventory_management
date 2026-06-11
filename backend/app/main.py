from collections import defaultdict
from decimal import Decimal

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from .config import get_settings
from .database import Base, engine, get_db
from .models import Customer, Order, OrderItem, Product
from .schemas import (
    CustomerCreate,
    CustomerRead,
    DashboardSummary,
    OrderCreate,
    OrderRead,
    ProductCreate,
    ProductRead,
    ProductUpdate,
)

settings = get_settings()

app = FastAPI(
    title="Inventory & Order Management API",
    version="1.0.0",
    description="FastAPI backend for product, customer, order, and inventory tracking.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/dashboard/summary", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db)):
    return DashboardSummary(
        total_products=db.query(func.count(Product.id)).scalar() or 0,
        total_customers=db.query(func.count(Customer.id)).scalar() or 0,
        total_orders=db.query(func.count(Order.id)).scalar() or 0,
        low_stock_products=db.query(func.count(Product.id)).filter(Product.quantity_in_stock <= 5).scalar() or 0,
    )


@app.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    product = Product(**payload.model_dump())
    db.add(product)
    try:
        db.commit()
        db.refresh(product)
        return product
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Product SKU already exists")


@app.get("/products", response_model=list[ProductRead])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id.desc()).all()


@app.get("/products/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@app.put("/products/{product_id}", response_model=ProductRead)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(product, key, value)

    try:
        db.commit()
        db.refresh(product)
        return product
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Product SKU already exists")


@app.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    used_in_order = db.query(OrderItem).filter(OrderItem.product_id == product_id).first()
    if used_in_order:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product is linked to existing orders and cannot be deleted",
        )

    db.delete(product)
    db.commit()
    return None


@app.post("/customers", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    customer = Customer(**payload.model_dump())
    db.add(customer)
    try:
        db.commit()
        db.refresh(customer)
        return customer
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Customer email already exists")


@app.get("/customers", response_model=list[CustomerRead])
def list_customers(db: Session = Depends(get_db)):
    return db.query(Customer).order_by(Customer.id.desc()).all()


@app.get("/customers/{customer_id}", response_model=CustomerRead)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@app.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    db.delete(customer)
    db.commit()
    return None


def _merge_duplicate_order_items(payload: OrderCreate) -> dict[int, int]:
    grouped: dict[int, int] = defaultdict(int)
    for item in payload.items:
        grouped[item.product_id] += item.quantity
    return dict(grouped)


@app.post("/orders", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    customer = db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    requested_items = _merge_duplicate_order_items(payload)
    product_ids = list(requested_items.keys())

    products = (
        db.query(Product)
        .filter(Product.id.in_(product_ids))
        .with_for_update()
        .all()
    )
    product_map = {product.id: product for product in products}

    missing_ids = sorted(set(product_ids) - set(product_map.keys()))
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Products not found: {missing_ids}",
        )

    insufficient = []
    for product_id, quantity in requested_items.items():
        product = product_map[product_id]
        if product.quantity_in_stock < quantity:
            insufficient.append(
                {
                    "product_id": product.id,
                    "sku": product.sku,
                    "available": product.quantity_in_stock,
                    "requested": quantity,
                }
            )

    if insufficient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Insufficient stock", "items": insufficient},
        )

    order = Order(customer_id=payload.customer_id, total_amount=Decimal("0.00"))
    db.add(order)
    db.flush()

    total = Decimal("0.00")
    for product_id, quantity in requested_items.items():
        product = product_map[product_id]
        line_total = Decimal(product.price) * quantity
        total += line_total
        product.quantity_in_stock -= quantity
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=quantity,
                unit_price=product.price,
                line_total=line_total,
            )
        )

    order.total_amount = total
    db.commit()

    created_order = (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order.id)
        .one()
    )
    return created_order


@app.get("/orders", response_model=list[OrderRead])
def list_orders(db: Session = Depends(get_db)):
    return (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
        .order_by(Order.id.desc())
        .all()
    )


@app.get("/orders/{order_id}", response_model=OrderRead)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@app.delete("/orders/{order_id}", response_model=OrderRead)
def cancel_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id)
        .with_for_update()
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status == "CANCELLED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order already cancelled")

    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().one()
        product.quantity_in_stock += item.quantity

    order.status = "CANCELLED"
    db.commit()
    db.refresh(order)
    return order
