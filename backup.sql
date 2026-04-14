--
-- PostgreSQL database dump
--

\restrict 8DcLfZLjMMtur3cPuabuYrm9ZlkMyiyUOiSrhQHTRuJa1SXXehcbAVM6Pnhi3c8

-- Dumped from database version 16.12 (8dbf2dd)
-- Dumped by pg_dump version 16.13 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO neondb_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: neondb_owner
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AddOnType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."AddOnType" AS ENUM (
    'EXTRA',
    'ADDON'
);


ALTER TYPE public."AddOnType" OWNER TO neondb_owner;

--
-- Name: BalanceType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."BalanceType" AS ENUM (
    'DEBIT',
    'CREDIT'
);


ALTER TYPE public."BalanceType" OWNER TO neondb_owner;

--
-- Name: DishType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."DishType" AS ENUM (
    'VEG',
    'NON_VEG',
    'SNACK',
    'DRINK'
);


ALTER TYPE public."DishType" OWNER TO neondb_owner;

--
-- Name: KOTType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."KOTType" AS ENUM (
    'KITCHEN',
    'BAR'
);


ALTER TYPE public."KOTType" OWNER TO neondb_owner;

--
-- Name: LedgerType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."LedgerType" AS ENUM (
    'SALE',
    'PAYMENT_IN',
    'PAYMENT_OUT',
    'RETURN',
    'ADJUSTMENT',
    'OPENING_BALANCE'
);


ALTER TYPE public."LedgerType" OWNER TO neondb_owner;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'PREPARING',
    'READYTOPICK',
    'SERVED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."OrderStatus" OWNER TO neondb_owner;

--
-- Name: OrderType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."OrderType" AS ENUM (
    'DINE_IN',
    'PICKUP',
    'DELIVERY',
    'RESERVATION',
    'QUICK_BILLING',
    'TAKE_AWAY'
);


ALTER TYPE public."OrderType" OWNER TO neondb_owner;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'ESEWA',
    'QR',
    'BANK_TRANSFER',
    'CREDIT',
    'CARD'
);


ALTER TYPE public."PaymentMethod" OWNER TO neondb_owner;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'CREDIT'
);


ALTER TYPE public."PaymentStatus" OWNER TO neondb_owner;

--
-- Name: ReservationStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."ReservationStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CANCELLED',
    'COMPLETED'
);


ALTER TYPE public."ReservationStatus" OWNER TO neondb_owner;

--
-- Name: ReturnPaymentStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."ReturnPaymentStatus" AS ENUM (
    'PAID',
    'UNPAID',
    'CREDIT'
);


ALTER TYPE public."ReturnPaymentStatus" OWNER TO neondb_owner;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'MANAGER',
    'CASHIER'
);


ALTER TYPE public."Role" OWNER TO neondb_owner;

--
-- Name: SessionStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."SessionStatus" AS ENUM (
    'OPEN',
    'CLOSED'
);


ALTER TYPE public."SessionStatus" OWNER TO neondb_owner;

--
-- Name: Shift; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."Shift" AS ENUM (
    'MORNING',
    'EVENING',
    'DAY'
);


ALTER TYPE public."Shift" OWNER TO neondb_owner;

--
-- Name: SupplierLedgerType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."SupplierLedgerType" AS ENUM (
    'PURCHASE',
    'PAYMENT',
    'RETURN',
    'ADJUSTMENT',
    'OPENING_BALANCE'
);


ALTER TYPE public."SupplierLedgerType" OWNER TO neondb_owner;

--
-- Name: TableStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."TableStatus" AS ENUM (
    'ACTIVE',
    'OCCUPIED',
    'INACTIVE'
);


ALTER TYPE public."TableStatus" OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AddOn; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."AddOn" (
    id text NOT NULL,
    name text NOT NULL,
    image text,
    description text,
    type public."AddOnType" NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "categoryId" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "storeId" text NOT NULL
);


ALTER TABLE public."AddOn" OWNER TO neondb_owner;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    image text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "storeId" text NOT NULL
);


ALTER TABLE public."Category" OWNER TO neondb_owner;

--
-- Name: ComboItem; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ComboItem" (
    id text NOT NULL,
    "comboId" text NOT NULL,
    "dishId" text NOT NULL,
    quantity integer NOT NULL,
    "unitPrice" double precision NOT NULL
);


ALTER TABLE public."ComboItem" OWNER TO neondb_owner;

--
-- Name: ComboOffer; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ComboOffer" (
    id text NOT NULL,
    name text NOT NULL,
    hscode text,
    "preparationTime" integer NOT NULL,
    description text,
    "categoryId" text NOT NULL,
    "subMenuId" text,
    "kotType" public."KOTType" NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    image text[],
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "storeId" text NOT NULL
);


ALTER TABLE public."ComboOffer" OWNER TO neondb_owner;

--
-- Name: Customer; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Customer" (
    id text NOT NULL,
    "fullName" text NOT NULL,
    phone text,
    email text,
    "openingBalance" double precision DEFAULT 0 NOT NULL,
    "creditLimit" double precision DEFAULT 0,
    "creditTermDays" integer DEFAULT 0,
    "loyaltyPoints" integer DEFAULT 0 NOT NULL,
    "loyaltyDiscount" double precision DEFAULT 0 NOT NULL,
    "legalName" text,
    "taxNumber" text,
    address text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dob timestamp(3) without time zone,
    "loyaltyId" text,
    "storeId" text
);


ALTER TABLE public."Customer" OWNER TO neondb_owner;

--
-- Name: CustomerLedger; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."CustomerLedger" (
    id text NOT NULL,
    "customerId" text NOT NULL,
    "txnNo" text NOT NULL,
    type public."LedgerType" NOT NULL,
    amount double precision NOT NULL,
    "closingBalance" double precision NOT NULL,
    "referenceId" text,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "storeId" text
);


ALTER TABLE public."CustomerLedger" OWNER TO neondb_owner;

--
-- Name: DailySession; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."DailySession" (
    id text NOT NULL,
    "openedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "closedAt" timestamp(3) without time zone,
    "openedById" text NOT NULL,
    "closedById" text,
    "openingBalance" double precision DEFAULT 0 NOT NULL,
    "expectedClosingBalance" double precision,
    "actualClosingBalance" double precision,
    difference double precision,
    status public."SessionStatus" DEFAULT 'OPEN'::public."SessionStatus" NOT NULL,
    "storeId" text NOT NULL,
    notes text,
    "cashOnDrawer" double precision
);


ALTER TABLE public."DailySession" OWNER TO neondb_owner;

--
-- Name: Dish; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Dish" (
    id text NOT NULL,
    name text NOT NULL,
    hscode text,
    "preparationTime" integer NOT NULL,
    description text,
    "categoryId" text NOT NULL,
    "subMenuId" text,
    type public."DishType" NOT NULL,
    "kotType" public."KOTType" NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    image text[],
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "storeId" text NOT NULL
);


ALTER TABLE public."Dish" OWNER TO neondb_owner;

--
-- Name: DishAddOn; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."DishAddOn" (
    id text NOT NULL,
    "dishId" text NOT NULL,
    "addOnId" text NOT NULL
);


ALTER TABLE public."DishAddOn" OWNER TO neondb_owner;

--
-- Name: Expense; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Expense" (
    id text NOT NULL,
    title text NOT NULL,
    amount double precision NOT NULL,
    category text,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "storeId" text NOT NULL,
    "dailySessionId" text
);


ALTER TABLE public."Expense" OWNER TO neondb_owner;

--
-- Name: MeasuringUnit; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."MeasuringUnit" (
    id text NOT NULL,
    name text NOT NULL,
    "shortName" text NOT NULL,
    description text,
    "storeId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MeasuringUnit" OWNER TO neondb_owner;

--
-- Name: Menu; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Menu" (
    id text NOT NULL,
    name text NOT NULL,
    "storeId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Menu" OWNER TO neondb_owner;

--
-- Name: MenuSet; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."MenuSet" (
    id text NOT NULL,
    name text NOT NULL,
    service text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "storeId" text NOT NULL
);


ALTER TABLE public."MenuSet" OWNER TO neondb_owner;

--
-- Name: MenuSetSubMenu; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."MenuSetSubMenu" (
    id text NOT NULL,
    "menuSetId" text NOT NULL,
    "subMenuId" text NOT NULL
);


ALTER TABLE public."MenuSetSubMenu" OWNER TO neondb_owner;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "tableId" text,
    type public."OrderType" NOT NULL,
    total double precision NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "customerId" text,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "paymentId" text,
    "sessionId" text,
    "staffId" text,
    "storeId" text,
    guests integer,
    "kotRemarks" text,
    "dailySessionId" text
);


ALTER TABLE public."Order" OWNER TO neondb_owner;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "dishId" text,
    "comboId" text,
    quantity integer NOT NULL,
    "unitPrice" double precision NOT NULL,
    "totalPrice" double precision NOT NULL,
    remarks text,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    "complimentaryQuantity" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."OrderItem" OWNER TO neondb_owner;

--
-- Name: OrderItemAddOn; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."OrderItemAddOn" (
    id text NOT NULL,
    "orderItemId" text NOT NULL,
    "addOnId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "unitPrice" double precision NOT NULL
);


ALTER TABLE public."OrderItemAddOn" OWNER TO neondb_owner;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    method public."PaymentMethod" NOT NULL,
    amount double precision NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "sessionId" text,
    "esewaRefId" text,
    "transactionUuid" text,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "storeId" text NOT NULL,
    "staffId" text,
    "dailySessionId" text
);


ALTER TABLE public."Payment" OWNER TO neondb_owner;

--
-- Name: Price; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Price" (
    id text NOT NULL,
    "actualPrice" double precision NOT NULL,
    "discountPrice" double precision DEFAULT 0,
    "listedPrice" double precision NOT NULL,
    cogs double precision NOT NULL,
    "grossProfit" double precision NOT NULL,
    "dishId" text,
    "addOnId" text,
    "comboId" text
);


ALTER TABLE public."Price" OWNER TO neondb_owner;

--
-- Name: Purchase; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Purchase" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "storeId" text NOT NULL,
    attachment text,
    discount double precision DEFAULT 0 NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "paymentMode" public."PaymentMethod",
    "paymentStatus" public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "referenceNumber" text NOT NULL,
    remark text,
    "roundOff" double precision DEFAULT 0 NOT NULL,
    "supplierId" text NOT NULL,
    "taxableAmount" double precision NOT NULL,
    "totalAmount" double precision NOT NULL,
    "txnDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "staffId" text,
    "dailySessionId" text
);


ALTER TABLE public."Purchase" OWNER TO neondb_owner;

--
-- Name: PurchaseItem; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."PurchaseItem" (
    id text NOT NULL,
    "purchaseId" text NOT NULL,
    "itemName" text NOT NULL,
    quantity double precision NOT NULL,
    rate double precision NOT NULL,
    amount double precision NOT NULL,
    "stockId" text
);


ALTER TABLE public."PurchaseItem" OWNER TO neondb_owner;

--
-- Name: PurchaseReturn; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."PurchaseReturn" (
    id text NOT NULL,
    "referenceNumber" text NOT NULL,
    "supplierId" text NOT NULL,
    "txnDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "purchaseReference" text,
    "taxableAmount" double precision NOT NULL,
    "totalAmount" double precision NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    "roundOff" double precision DEFAULT 0 NOT NULL,
    "paymentStatus" public."ReturnPaymentStatus" DEFAULT 'UNPAID'::public."ReturnPaymentStatus" NOT NULL,
    "paymentMode" public."PaymentMethod",
    remark text,
    attachment text,
    "storeId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "staffId" text
);


ALTER TABLE public."PurchaseReturn" OWNER TO neondb_owner;

--
-- Name: PurchaseReturnItem; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."PurchaseReturnItem" (
    id text NOT NULL,
    "purchaseReturnId" text NOT NULL,
    "itemName" text NOT NULL,
    quantity double precision NOT NULL,
    rate double precision NOT NULL,
    amount double precision NOT NULL,
    "stockId" text
);


ALTER TABLE public."PurchaseReturnItem" OWNER TO neondb_owner;

--
-- Name: QRCode; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."QRCode" (
    id text NOT NULL,
    "tableId" text NOT NULL,
    value text NOT NULL,
    assigned boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."QRCode" OWNER TO neondb_owner;

--
-- Name: QrPayment; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."QrPayment" (
    id text NOT NULL,
    image text[],
    "storeId" text NOT NULL
);


ALTER TABLE public."QrPayment" OWNER TO neondb_owner;

--
-- Name: Reservation; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Reservation" (
    id text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    "customerId" text,
    images text,
    remark text,
    "tableId" text NOT NULL,
    guests integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status public."ReservationStatus" DEFAULT 'PENDING'::public."ReservationStatus" NOT NULL
);


ALTER TABLE public."Reservation" OWNER TO neondb_owner;

--
-- Name: ReservationTime; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ReservationTime" (
    id text NOT NULL,
    "reservationId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ReservationTime" OWNER TO neondb_owner;

--
-- Name: SalesReturn; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."SalesReturn" (
    id text NOT NULL,
    "referenceNumber" text NOT NULL,
    "customerId" text,
    "txnDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "billReference" text NOT NULL,
    "salesStaff" text,
    "taxableAmount" double precision NOT NULL,
    "totalAmount" double precision NOT NULL,
    "roundOff" double precision DEFAULT 0 NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    attachment text,
    remark text,
    "paymentStatus" public."ReturnPaymentStatus" DEFAULT 'UNPAID'::public."ReturnPaymentStatus" NOT NULL,
    "paymentMode" public."PaymentMethod",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "staffId" text,
    "storeId" text NOT NULL
);


ALTER TABLE public."SalesReturn" OWNER TO neondb_owner;

--
-- Name: SalesReturnItem; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."SalesReturnItem" (
    id text NOT NULL,
    "salesReturnId" text NOT NULL,
    "dishName" text NOT NULL,
    quantity integer NOT NULL,
    rate double precision NOT NULL,
    amount double precision NOT NULL
);


ALTER TABLE public."SalesReturnItem" OWNER TO neondb_owner;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO neondb_owner;

--
-- Name: Space; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Space" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "storeId" text NOT NULL
);


ALTER TABLE public."Space" OWNER TO neondb_owner;

--
-- Name: Staff; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Staff" (
    id text NOT NULL,
    name text NOT NULL,
    role text DEFAULT 'Staff'::text NOT NULL,
    phone text,
    email text,
    "isActive" boolean DEFAULT true NOT NULL,
    image text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "storeId" text NOT NULL,
    "roleId" text,
    "joinDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    shift public."Shift" DEFAULT 'DAY'::public."Shift"
);


ALTER TABLE public."Staff" OWNER TO neondb_owner;

--
-- Name: StaffRole; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."StaffRole" (
    id text NOT NULL,
    name text NOT NULL,
    "storeId" text NOT NULL
);


ALTER TABLE public."StaffRole" OWNER TO neondb_owner;

--
-- Name: Stock; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Stock" (
    id text NOT NULL,
    name text NOT NULL,
    quantity double precision NOT NULL,
    amount double precision NOT NULL,
    "storeId" text NOT NULL,
    "groupId" text,
    "unitId" text
);


ALTER TABLE public."Stock" OWNER TO neondb_owner;

--
-- Name: StockConsumption; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."StockConsumption" (
    id text NOT NULL,
    "stockId" text NOT NULL,
    quantity double precision NOT NULL,
    "dishId" text,
    "addOnId" text,
    "comboId" text
);


ALTER TABLE public."StockConsumption" OWNER TO neondb_owner;

--
-- Name: StockGroup; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."StockGroup" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "storeId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."StockGroup" OWNER TO neondb_owner;

--
-- Name: Store; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Store" (
    id text NOT NULL,
    name text NOT NULL,
    "ownerId" text NOT NULL
);


ALTER TABLE public."Store" OWNER TO neondb_owner;

--
-- Name: SubMenu; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."SubMenu" (
    id text NOT NULL,
    name text NOT NULL,
    image text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "categoryId" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "storeId" text NOT NULL
);


ALTER TABLE public."SubMenu" OWNER TO neondb_owner;

--
-- Name: Supplier; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Supplier" (
    id text NOT NULL,
    "fullName" text NOT NULL,
    phone text,
    email text,
    "legalName" text,
    "taxNumber" text,
    address text,
    "openingBalance" double precision DEFAULT 0 NOT NULL,
    "openingBalanceType" public."BalanceType" DEFAULT 'CREDIT'::public."BalanceType" NOT NULL,
    "storeId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Supplier" OWNER TO neondb_owner;

--
-- Name: SupplierLedger; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."SupplierLedger" (
    id text NOT NULL,
    "supplierId" text NOT NULL,
    "storeId" text NOT NULL,
    "txnNo" text NOT NULL,
    type public."SupplierLedgerType" NOT NULL,
    amount double precision NOT NULL,
    "closingBalance" double precision NOT NULL,
    "referenceId" text,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SupplierLedger" OWNER TO neondb_owner;

--
-- Name: SystemSetting; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."SystemSetting" (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "storeId" text NOT NULL
);


ALTER TABLE public."SystemSetting" OWNER TO neondb_owner;

--
-- Name: Table; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Table" (
    id text NOT NULL,
    name text NOT NULL,
    capacity integer NOT NULL,
    status public."TableStatus" DEFAULT 'ACTIVE'::public."TableStatus" NOT NULL,
    "spaceId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "tableTypeId" text,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "storeId" text NOT NULL
);


ALTER TABLE public."Table" OWNER TO neondb_owner;

--
-- Name: TableSession; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."TableSession" (
    id text NOT NULL,
    "tableId" text NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endedAt" timestamp(3) without time zone,
    total double precision DEFAULT 0 NOT NULL,
    "serviceCharge" double precision DEFAULT 0 NOT NULL,
    tax double precision DEFAULT 0 NOT NULL,
    "grandTotal" double precision DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    "storeId" text
);


ALTER TABLE public."TableSession" OWNER TO neondb_owner;

--
-- Name: TableType; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."TableType" (
    id text NOT NULL,
    name text NOT NULL,
    "storeId" text NOT NULL
);


ALTER TABLE public."TableType" OWNER TO neondb_owner;

--
-- Name: User; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text,
    email text NOT NULL,
    password text NOT NULL,
    role public."Role" DEFAULT 'CASHIER'::public."Role" NOT NULL,
    "storeId" text,
    "emailVerified" timestamp(3) without time zone,
    "isSetupComplete" boolean DEFAULT false NOT NULL,
    "trialEndsAt" timestamp(3) without time zone,
    "verificationCode" text,
    "verificationCodeExpires" timestamp(3) without time zone,
    permissions text[] DEFAULT ARRAY[]::text[]
);


ALTER TABLE public."User" OWNER TO neondb_owner;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO neondb_owner;

--
-- Data for Name: AddOn; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AddOn" (id, name, image, description, type, "isAvailable", "createdAt", "categoryId", "sortOrder", "storeId") FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Category" (id, name, image, description, "createdAt", "sortOrder", "storeId") FROM stdin;
9087ceea-5ed0-4183-83a0-6c8c271ca72f	Coffee	\N		2026-03-02 12:03:08.111	1	cmm7kijlt000111fe6p8fx3q9
68096a4d-7aaf-4136-8a32-55d2a0dc32f2	Test 1	https://res.cloudinary.com/dvvtvhgop/image/upload/v1772798190/categories/yytnhsj5cwf6pgfu27vz.jpg		2026-03-01 09:43:45.525	1	cmm7kb82i0002ku1gbbh63hr0
b8609d64-e619-408e-967e-aef10aaf9da3	Biryani	\N		2026-03-23 08:18:15.997	2	cmm7kijlt000111fe6p8fx3q9
a31194dc-1266-4e5e-8b78-4774c554a09f	Cold Drinks	\N		2026-03-30 03:01:25.314	3	cmm7kijlt000111fe6p8fx3q9
9e6f6aec-5ccd-484b-aa4e-417936648652	Iced/Blended Beverage	\N		2026-03-30 03:01:55.42	4	cmm7kijlt000111fe6p8fx3q9
fcae4a3d-2856-417d-aed8-20b6d5bc673f	Breakfast - Extras	\N		2026-03-30 03:02:53.773	5	cmm7kijlt000111fe6p8fx3q9
490d44e0-8b21-4aac-8d94-ad5d9a54a237	Snacks	\N		2026-03-30 03:06:42.526	6	cmm7kijlt000111fe6p8fx3q9
57e397f0-e32b-4f75-b191-7dd59cc17b66	Non-Veg Snacks	\N		2026-03-30 03:10:38.468	7	cmm7kijlt000111fe6p8fx3q9
ab987602-7eb4-4319-943e-717693fa0c98	Tea	\N		2026-03-30 03:13:11.839	8	cmm7kijlt000111fe6p8fx3q9
c18e0d05-e3c7-4309-a9ce-ece3df632153	Momos	\N		2026-03-30 03:20:57.612	9	cmm7kijlt000111fe6p8fx3q9
05857179-5967-40bb-8f2e-9d51fb4bd07d	All Day Breakfast	\N		2026-03-30 03:26:42.651	10	cmm7kijlt000111fe6p8fx3q9
1fbd4e52-b465-4551-b4d3-46cc6bc12f93	Soups and Salads	\N		2026-03-30 03:29:08.837	11	cmm7kijlt000111fe6p8fx3q9
9d50bdc1-4cf6-45cc-b50a-69fa1f754065	Noodles	\N		2026-03-30 03:32:50.332	12	cmm7kijlt000111fe6p8fx3q9
2e9ffa9d-50dc-4aa8-8f69-16c4e2aacbbb	Burgers and Sandwiches	\N		2026-03-30 04:18:00.196	13	cmm7kijlt000111fe6p8fx3q9
5e468923-dc18-4114-af67-3c1b3ac735c9	Bakery	\N		2026-03-30 04:21:38.584	14	cmm7kijlt000111fe6p8fx3q9
02e93a86-8dc1-4881-be50-c8bd90928bf9	Veg Snacks	\N		2026-03-30 04:38:11.782	15	cmm7kijlt000111fe6p8fx3q9
30b4ae97-8712-430a-9ddd-943c144aa1e1	Fried rice	\N		2026-03-30 04:42:00.415	16	cmm7kijlt000111fe6p8fx3q9
4e4d923a-8ca1-4395-b561-2b421f57a55f	Books	\N		2026-03-30 04:45:56.975	17	cmm7kijlt000111fe6p8fx3q9
2627e01c-41f3-453f-8767-93ea4bd9f1b2	Food	\N		2026-03-30 04:47:24.044	18	cmm7kijlt000111fe6p8fx3q9
e1ae26b7-6713-432e-9529-4c026538737f	Coffee Beans	\N		2026-03-30 04:57:55.727	19	cmm7kijlt000111fe6p8fx3q9
119c3840-07b2-4b0b-9922-73c9ddf876c9	Wrap	\N		2026-03-30 04:59:05.56	20	cmm7kijlt000111fe6p8fx3q9
a0a76873-13c4-4eb1-97ca-a149acbc0f89	Hot Drinks	\N		2026-04-04 12:05:53.86	1	cmnka6xqp0001emd4z20d0lds
3515c41e-90d5-4e08-8523-8da5384a482e	Drinks 	\N		2026-04-05 06:04:07.329	1	cmnlcvfo70002lt8xmmgez07z
\.


--
-- Data for Name: ComboItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ComboItem" (id, "comboId", "dishId", quantity, "unitPrice") FROM stdin;
\.


--
-- Data for Name: ComboOffer; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ComboOffer" (id, name, hscode, "preparationTime", description, "categoryId", "subMenuId", "kotType", "isAvailable", "createdAt", image, "sortOrder", "storeId") FROM stdin;
\.


--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Customer" (id, "fullName", phone, email, "openingBalance", "creditLimit", "creditTermDays", "loyaltyPoints", "loyaltyDiscount", "legalName", "taxNumber", address, notes, "createdAt", dob, "loyaltyId", "storeId") FROM stdin;
abb995c6-f41c-42ec-9e84-bdaddd62f552	youndhen	9843094860	\N	0	0	0	19	0	\N	\N	\N	\N	2026-03-05 17:57:24.743	\N	LOY-ABB995C6	cmm7kb82i0002ku1gbbh63hr0
98294b2c-8db7-4060-81f3-f5de23c457e2	Pathao		patho@rajbiryani.com	0	0	0	10	25	\N	\N	\N	\N	2026-03-23 08:17:54.523	\N	LOY-98294B2C	cmm7kijlt000111fe6p8fx3q9
ff0cf30c-499d-4201-b64f-deaa68c6d327	Ram	9851058472	bhuban.acharya@gmail.com	0	0	0	1	0	\N	\N	\N	\N	2026-03-01 10:14:53.931	1990-01-11 00:00:00	LOY-FF0CF30C	cmm7kijlt000111fe6p8fx3q9
61fcd1d9-13ef-4dc5-a385-9720caceb532	Laras Cafe	9765350257		0	0	0	0	0	\N	\N	\N	\N	2026-03-30 05:20:52.559	\N	LOY-61FCD1D9	cmm7kijlt000111fe6p8fx3q9
941d1381-cfb3-435c-8051-4a0813c67c96	Biraj	123456789	bbbbb@gmail.com	0	0	0	5	0	\N	\N	\N	\N	2026-04-08 07:05:37.375	\N	LOY-941D1381	cmm7kijlt000111fe6p8fx3q9
d641e12c-a637-4c31-9eb4-045893f3d142	Suman Dai	98888888	test@test.com	0	0	0	4	0	\N	\N	\N	\N	2026-03-24 01:05:49.922	\N	LOY-D641E12C	cmm7kijlt000111fe6p8fx3q9
\.


--
-- Data for Name: CustomerLedger; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."CustomerLedger" (id, "customerId", "txnNo", type, amount, "closingBalance", "referenceId", remarks, "createdAt", "storeId") FROM stdin;
be7fa900-baf4-4f3b-b448-d0cc62242e47	abb995c6-f41c-42ec-9e84-bdaddd62f552	SALE-1772794711925-af1a	SALE	720	720	af1a38ce-9a64-49df-98a5-86161dd840a4	Table Checkout - 9e26f846-ee14-42dc-b6d3-948acfe8f18f (CASH)	2026-03-06 10:58:31.926	cmm7kb82i0002ku1gbbh63hr0
2d7c2708-e815-4bcf-acef-13c0eb2a4337	abb995c6-f41c-42ec-9e84-bdaddd62f552	PAY-1772794711958-7d42	PAYMENT_IN	720	0	7d4285a7-41a0-48b2-bb65-a2c24d075249	Payment for Order - CASH	2026-03-06 10:58:31.959	cmm7kb82i0002ku1gbbh63hr0
6cb17ff9-84c3-4f8b-a73e-3869f4f1e693	abb995c6-f41c-42ec-9e84-bdaddd62f552	SALE-1774281346406-7b97	SALE	623	623	7b97c586-8053-49de-8897-c068f8b0c552	Table Checkout - b5a88dd0-b84c-4202-99bf-928a7fa5d6e3 (CREDIT)	2026-03-23 15:55:46.407	cmm7kb82i0002ku1gbbh63hr0
8ba77ecc-9882-4f3f-be72-a3ab0de494bf	abb995c6-f41c-42ec-9e84-bdaddd62f552	SALE-1774282434322-TA	SALE	623	1246	661fad87-50e6-4ed8-b959-5a4dd1fbfa9f	Take Away Checkout (CREDIT)	2026-03-23 16:13:54.324	cmm7kb82i0002ku1gbbh63hr0
edb06484-a716-4a7a-a085-117b43dd592a	98294b2c-8db7-4060-81f3-f5de23c457e2	SALE-1774313131726-TA	SALE	637.5	637.5	cf37f288-de84-4dd4-8cc5-4d717b3e18c3	Take Away Checkout (CREDIT)	2026-03-24 00:45:31.727	cmm7kijlt000111fe6p8fx3q9
a6372ec4-fd04-4488-a469-baefb370f9be	98294b2c-8db7-4060-81f3-f5de23c457e2	SALE-1774313675544-TA	SALE	442.5	1080	d57b077f-61a4-49d3-8c2c-891340ee437a	Take Away Checkout (CREDIT)	2026-03-24 00:54:35.544	cmm7kijlt000111fe6p8fx3q9
c604834f-d84c-478a-a91e-3c952902bfd7	ff0cf30c-499d-4201-b64f-deaa68c6d327	SALE-1774613203153-fe2f	SALE	150	150	fe2f6f57-0d67-4273-9841-abb91c935548	Table Checkout - 36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6 (CREDIT)	2026-03-27 12:06:43.154	cmm7kijlt000111fe6p8fx3q9
310fd076-f405-465d-b539-ac59240592ad	d641e12c-a637-4c31-9eb4-045893f3d142	SALE-1775554892394-60d4	SALE	150	150	60d4f20d-a21e-4ab7-9b04-101b8eb8426e	Table Checkout - 36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6 (CREDIT)	2026-04-07 09:41:32.395	cmm7kijlt000111fe6p8fx3q9
dee10069-f882-42d0-8033-74f39139708c	941d1381-cfb3-435c-8051-4a0813c67c96	SALE-1775631974040-980e	SALE	500	500	980e056a-b0f4-4464-afce-12829b1cff14	Table Checkout - 8b27d168-361c-40b0-9d75-fc3585635e8a (CREDIT)	2026-04-08 07:06:14.041	cmm7kijlt000111fe6p8fx3q9
b192d5b3-1f17-459a-b917-e3977730ee0c	d641e12c-a637-4c31-9eb4-045893f3d142	SALE-1775816633569-4280	SALE	300	450	4280e152-8d83-43cc-b5a4-4e490a3dd80d	Table Checkout - 8b27d168-361c-40b0-9d75-fc3585635e8a (CREDIT)	2026-04-10 10:23:53.57	cmm7kijlt000111fe6p8fx3q9
\.


--
-- Data for Name: DailySession; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."DailySession" (id, "openedAt", "closedAt", "openedById", "closedById", "openingBalance", "expectedClosingBalance", "actualClosingBalance", difference, status, "storeId", notes, "cashOnDrawer") FROM stdin;
1d29351f-6c43-43b2-87b8-2a588f36373d	2026-04-05 06:05:35.582	2026-04-05 06:31:47.63	cmnlcuorj0000lt8xuszlhaly	cmnlcuorj0000lt8xuszlhaly	1000	12820	12820	0	CLOSED	cmnlcvfo70002lt8xmmgez07z	System Calculation:\n- Cash Sales: 11820\n- Digital Sales: 10720\n- Notes:	\N
eb45547d-3e64-4781-a4e7-58c66a9d2833	2026-03-31 18:14:52.455	2026-04-05 07:11:07.21	cmm7khlgy0000psrrkqq4fx2r	cmm7khlgy0000psrrkqq4fx2r	10000	15825	15000	-825	CLOSED	cmm7kijlt000111fe6p8fx3q9	Session Revenue Breakdown:\n- CASH: 5825.00\n- QR: 300.00\n- Total Revenue: 6125.00\n\nFinal Reconciliation:\n- Cash in Drawer: 15000\n- Expected Cash: 15825\n- Difference: -825.00\n- User Notes: None	\N
15a162f1-843c-4d0b-bb61-11993c9e50c7	2026-04-05 10:33:09.664	2026-04-05 10:47:34.596	cmnlcuorj0000lt8xuszlhaly	cmnlcuorj0000lt8xuszlhaly	1000	2460	2060	-400	CLOSED	cmnlcvfo70002lt8xmmgez07z	Session Revenue Breakdown:\n- CASH: 2060.00\n- Total Revenue: 2060.00\n\nCash Purchases (-):\n- PUR-1775385929066-422: 600.00\n\nFinal Reconciliation:\n- Opening Cash: 1000.00\n- Cash Sales (+): 2060.00\n- Cash Purchases (-): 600.00\n- Expected Cash: 2460.00\n- Actual Cash in Drawer: 2060\n- Difference: -400.00\n- User Notes: None	\N
0d36f545-b61c-4304-9b87-f74c08a8cfb8	2026-04-05 07:11:48.632	2026-04-05 12:22:19.133	cmm7khlgy0000psrrkqq4fx2r	cmm7khlgy0000psrrkqq4fx2r	1000	1000	1000	0	CLOSED	cmm7kijlt000111fe6p8fx3q9	Session Revenue Breakdown:\n\n- Total Revenue: 0.00\n\nFinal Reconciliation:\n- Opening Cash: 1000.00\n- Cash Sales (+): 0.00\n- Cash Purchases (-): 0.00\n- Expected Cash: 1000.00\n- Actual Cash in Drawer: 1000\n- Difference: 0.00\n- User Notes: None	\N
1476a7e3-4c10-4a48-b8ac-2440e42fb807	2026-04-06 12:51:22.981	2026-04-06 13:51:32.778	cmnlcuorj0000lt8xuszlhaly	cmnlcuorj0000lt8xuszlhaly	1000	1100	1100	0	CLOSED	cmnlcvfo70002lt8xmmgez07z	Session Revenue Breakdown:\n- CASH: 300.00\n- QR: 60.00\n- Total Revenue: 360.00\n\nCash Purchases (-):\n- PUR-1775480509832-957: 200.00\n\nFinal Reconciliation:\n- Opening Cash: 1000.00\n- Cash Sales (+): 300.00\n- Cash Purchases (-): 200.00\n- Expected Cash: 1100.00\n- Actual Cash in Drawer: 1100\n- Difference: 0.00\n- User Notes: None	100
ba53d095-5f4d-48bc-bc52-c3427922cdfa	2026-04-06 13:56:28.924	2026-04-06 13:56:44.555	cmnlcuorj0000lt8xuszlhaly	cmnlcuorj0000lt8xuszlhaly	100	100	100	0	CLOSED	cmnlcvfo70002lt8xmmgez07z	Session Revenue Breakdown:\n\n- Total Revenue: 0.00\n\nFinal Reconciliation:\n- Opening Cash: 100.00\n- Cash Sales (+): 0.00\n- Cash Purchases (-): 0.00\n- Expected Cash: 100.00\n- Actual Cash in Drawer: 100\n- Difference: 0.00\n- User Notes: None	0
13fe8f08-4602-430a-91de-f6cad1937cf8	2026-04-05 12:22:25.404	2026-04-07 08:55:27.131	cmm7khlgy0000psrrkqq4fx2r	cmm7khlgy0000psrrkqq4fx2r	5000	2500	0	-2500	CLOSED	cmm7kijlt000111fe6p8fx3q9	Session Revenue Breakdown:\n\n- Total Revenue: 0.00\n\nCash Purchases (-):\n- PUR-1775391899738-535: 2500.00\n\nFinal Reconciliation:\n- Opening Cash: 5000.00\n- Cash Sales (+): 0.00\n- Cash Purchases (-): 2500.00\n- Expected Cash: 2500.00\n- Actual Cash in Drawer: 0\n- Difference: -2500.00\n- User Notes: None	-2500
d5c9ceba-34ff-4084-bfd5-29e2546575b7	2026-04-07 11:11:32.989	\N	cmnlcuorj0000lt8xuszlhaly	\N	100	\N	\N	\N	OPEN	cmnlcvfo70002lt8xmmgez07z		\N
f88c840e-779f-4c90-b15c-66842d72971b	2026-04-07 08:55:41.302	2026-04-08 06:27:48.449	cmm7khlgy0000psrrkqq4fx2r	cmm7khlgy0000psrrkqq4fx2r	1500	1755	1755	0	CLOSED	cmm7kijlt000111fe6p8fx3q9	Session Revenue Breakdown:\n- CASH: 300.00\n- QR: 150.00\n- CREDIT: 150.00\n- Total Revenue: 600.00\n\nCash Purchases (-):\n- PUR-1775552523014-484: 45.00\n\nFinal Reconciliation:\n- Opening Cash: 1500.00\n- Cash Sales (+): 300.00\n- Cash Purchases (-): 45.00\n- Expected Cash: 1755.00\n- Actual Cash in Drawer: 1755\n- Difference: 0.00\n- User Notes: None	255
a106914f-f37c-4bb0-8c1c-4df0c19bfc74	2026-04-08 06:27:59.633	2026-04-09 00:42:31.769	cmm7khlgy0000psrrkqq4fx2r	cmm7khlgy0000psrrkqq4fx2r	1000	865	865	0	CLOSED	cmm7kijlt000111fe6p8fx3q9	Session Revenue Breakdown:\n- CASH: 360.00\n- QR: 2060.00\n- CREDIT: 500.00\n- Total Revenue: 2920.00\n\nCash Purchases (-):\n- PUR-1775630996799-732: 110.00\n- PUR-1775631082126-513: 135.00\n- PUR-1775655605716-761: 90.00\n- PUR-1775655882585-748: 160.00\n\nFinal Reconciliation:\n- Opening Cash: 1000.00\n- Cash Sales (+): 360.00\n- Cash Purchases (-): 495.00\n- Expected Cash: 865.00\n- Actual Cash in Drawer: 865\n- Difference: 0.00\n- User Notes: None	-135
f7de8892-d6a2-4acb-b1eb-0c0f39c782ec	2026-04-09 00:42:39.835	2026-04-10 01:58:57.14	cmm7khlgy0000psrrkqq4fx2r	cmm7khlgy0000psrrkqq4fx2r	1000	1000	1000	0	CLOSED	cmm7kijlt000111fe6p8fx3q9	Session Revenue Breakdown:\n\n- Total Revenue: 0.00\n\nFinal Reconciliation:\n- Opening Cash: 1000.00\n- Cash Sales (+): 0.00\n- Cash Purchases (-): 0.00\n- Expected Cash: 1000.00\n- Actual Cash in Drawer: 1000\n- Difference: 0.00\n- User Notes: None	0
dad032d3-0d9a-4159-ad72-4fb545d44f8e	2026-04-10 01:59:07.574	2026-04-10 02:51:36.406	cmm7khlgy0000psrrkqq4fx2r	cmm7khlgy0000psrrkqq4fx2r	1000	1000	1000	0	CLOSED	cmm7kijlt000111fe6p8fx3q9	Session Revenue Breakdown:\n\n- Total Revenue: 0.00\n\nFinal Reconciliation:\n- Opening Cash: 1000.00\n- Cash Sales (+): 0.00\n- Cash Purchases (-): 0.00\n- Expected Cash: 1000.00\n- Actual Cash in Drawer: 1000\n- Difference: 0.00\n- User Notes: None	0
e95c98fd-f737-4650-ad49-abc7b29eb4f3	2026-04-10 02:51:46.42	2026-04-11 01:33:15.673	cmm7khlgy0000psrrkqq4fx2r	cmm7khlgy0000psrrkqq4fx2r	1000	2186	2186	0	CLOSED	cmm7kijlt000111fe6p8fx3q9	Session Revenue Breakdown:\n- CASH: 1606.00\n- QR: 1690.00\n- CREDIT: 300.00\n- Total Revenue: 3596.00\n\nCash Purchases (-):\n- PUR-1775828241943-516: 90.00\n- PUR-1775829108345-0: 60.00\n- PUR-1775829267435-585: 150.00\n- PUR-1775829657409-762: 120.00\n\nFinal Reconciliation:\n- Opening Cash: 1000.00\n- Cash Sales (+): 1606.00\n- Cash Purchases (-): 420.00\n- Expected Cash: 2186.00\n- Actual Cash in Drawer: 2186\n- Difference: 0.00\n- User Notes: None	1186
0c70cb42-ba56-45ec-a7e2-b794d41edc6e	2026-04-11 01:33:25.597	2026-04-12 01:48:51.949	cmm7khlgy0000psrrkqq4fx2r	cmm7khlgy0000psrrkqq4fx2r	1000	-178	-178	0	CLOSED	cmm7kijlt000111fe6p8fx3q9	Session Revenue Breakdown:\n- CASH: 725.00\n- QR: 4925.00\n- Total Revenue: 5650.00\n\nCash Purchases (-):\n- PUR-1775884391021-561: 90.00\n- PUR-1775884423614-334: 210.00\n- PUR-1775890517996-277: 120.00\n- PUR-1775917242391-768: 1263.00\n- PUR-1775917396405-852: 120.00\n- PUR-1775920855385-939: 100.00\n\nFinal Reconciliation:\n- Opening Cash: 1000.00\n- Cash Sales (+): 725.00\n- Cash Purchases (-): 1903.00\n- Expected Cash: -178.00\n- Actual Cash in Drawer: -178\n- Difference: 0.00\n- User Notes: None	-1178
9b70d049-8b12-4795-85a3-a200ea01de1a	2026-04-12 01:48:59.256	\N	cmm7khlgy0000psrrkqq4fx2r	\N	1000	\N	\N	\N	OPEN	cmm7kijlt000111fe6p8fx3q9		\N
\.


--
-- Data for Name: Dish; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Dish" (id, name, hscode, "preparationTime", description, "categoryId", "subMenuId", type, "kotType", "isAvailable", "createdAt", image, "sortOrder", "storeId") FROM stdin;
2902edeb-9187-47af-a173-89ee6d773a18	Americano Single 		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	VEG	KITCHEN	t	2026-03-02 12:03:30.028	{}	1	cmm7kijlt000111fe6p8fx3q9
72a48e6b-107b-443f-a635-8ec10f287b91	Bullet Coffee		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:37:47.58	{}	10	cmm7kijlt000111fe6p8fx3q9
7b8c9855-bbe0-423f-8a0d-13ea7660eeca	Doppio		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:38:18.254	{}	11	cmm7kijlt000111fe6p8fx3q9
75f2944c-7088-49c4-a597-6f27438d08b6	Ristretto Single 		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:39:19.378	{}	12	cmm7kijlt000111fe6p8fx3q9
b84f58ef-4512-4589-b866-08503d6be214	Ristretto Double		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:39:59.761	{}	13	cmm7kijlt000111fe6p8fx3q9
2235fa27-ca99-4a86-9345-cfdd1e445210	Americano		0		68096a4d-7aaf-4136-8a32-55d2a0dc32f2	\N	VEG	KITCHEN	t	2026-03-01 09:44:18.949	{https://res.cloudinary.com/dvvtvhgop/image/upload/v1773658542/dishes/cga1dmqzt0bzxgxzw9xe.jpg}	1	cmm7kb82i0002ku1gbbh63hr0
dc5cbd92-fcd6-4f17-9887-e06a10a55a64	Cappuccino		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:40:31.418	{}	14	cmm7kijlt000111fe6p8fx3q9
ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	Pokumbap		0		68096a4d-7aaf-4136-8a32-55d2a0dc32f2	\N	VEG	KITCHEN	t	2026-03-05 18:22:38.877	{https://res.cloudinary.com/dvvtvhgop/image/upload/v1773660403/dishes/rv07xdsq1ohcjcinvxbe.jpg}	2	cmm7kb82i0002ku1gbbh63hr0
f2b35900-f478-417c-8b38-a27a21f457f9	Chicken Biryani	ch	0		b8609d64-e619-408e-967e-aef10aaf9da3	\N	NON_VEG	KITCHEN	t	2026-03-23 08:19:19.124	{}	1	cmm7kijlt000111fe6p8fx3q9
dc139f65-7a70-4c1b-b9ca-12e257f718b8	Mutton Biryani	mb	0		b8609d64-e619-408e-967e-aef10aaf9da3	\N	SNACK	KITCHEN	t	2026-03-23 08:19:58.559	{}	2	cmm7kijlt000111fe6p8fx3q9
e1f8cc47-aa0b-45ed-9bed-08e551184500	Veg Biryani	vb	0		b8609d64-e619-408e-967e-aef10aaf9da3	\N	VEG	KITCHEN	t	2026-03-23 08:20:33.953	{}	3	cmm7kijlt000111fe6p8fx3q9
53264545-0e07-4d4f-8c6c-e313c622b2a6	Paneer Biryani		0		b8609d64-e619-408e-967e-aef10aaf9da3	\N	VEG	KITCHEN	t	2026-03-23 08:21:16.049	{}	4	cmm7kijlt000111fe6p8fx3q9
277dc67c-82bf-4e77-89f5-96713bbf6b0e	Cafe Mocha		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:40:59.28	{}	15	cmm7kijlt000111fe6p8fx3q9
5b7e473a-1220-4dfb-a7b5-6fe3540df3d8	Latte Macchiato Single		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:41:27.76	{}	16	cmm7kijlt000111fe6p8fx3q9
8acd8f4b-bf0e-4934-b2f5-5e2f318d3b67	Latte Macchiato Double		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:41:58.652	{}	17	cmm7kijlt000111fe6p8fx3q9
ec405c03-3a8e-4ae5-b525-9554e4e80588	Espresso Affogato		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:43:01.059	{}	18	cmm7kijlt000111fe6p8fx3q9
f5d85fbd-34d9-4456-8554-4e855ce503ad	Flat White		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:43:33.952	{}	19	cmm7kijlt000111fe6p8fx3q9
360b5fa0-d248-4181-b429-6e899d6ae2d2	Espresso		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	VEG	KITCHEN	t	2026-03-30 02:25:56.553	{}	2	cmm7kijlt000111fe6p8fx3q9
be6605f3-c30a-4c76-abac-d75e5964855b	Lungo Single		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:30:44.046	{}	3	cmm7kijlt000111fe6p8fx3q9
7672cf98-cd74-4677-92b9-5e076a3ea64f	Americano Double		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:32:43.719	{}	4	cmm7kijlt000111fe6p8fx3q9
c26bd99c-d80d-42ce-8c0d-80ea7a050bee	Cafe Latte Single		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:33:33.562	{}	5	cmm7kijlt000111fe6p8fx3q9
f042ce1e-0ee5-4b27-9fc7-2b65e5200a69	Cafe Latte Double		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:34:11.192	{}	6	cmm7kijlt000111fe6p8fx3q9
0abd5ade-a3f4-4c4c-9f6d-177fac646ce8	Espresso Macchiato Single		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:35:10.207	{}	7	cmm7kijlt000111fe6p8fx3q9
ffd570d1-6425-4f6c-ad3b-a57ca3341975	Caramel  Macchiato 		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:36:19.541	{}	8	cmm7kijlt000111fe6p8fx3q9
0a64784a-9de6-41b0-a044-cf93651c79b1	Mocha Madness		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:36:59.695	{}	9	cmm7kijlt000111fe6p8fx3q9
653b6221-ef68-4bf0-8726-76cdafe4ca0f	Kund Coffee french press		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:44:10.856	{}	20	cmm7kijlt000111fe6p8fx3q9
a0fef3c8-d473-4cb8-a504-e18c19dbd9f4	Espresso Macchiato Double		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:44:54.731	{}	21	cmm7kijlt000111fe6p8fx3q9
35090232-f866-4d68-9e4b-79da5b35bf02	Iced Americano		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:50:28.316	{}	22	cmm7kijlt000111fe6p8fx3q9
94ebd05c-11d5-4e1e-b1b4-8e7f9787922f	Iced Latte		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:50:57.133	{}	23	cmm7kijlt000111fe6p8fx3q9
91c02f87-cb1d-4bdb-9cbd-373ff0e4075a	Iced Caramel Macchiato		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:51:21.065	{}	24	cmm7kijlt000111fe6p8fx3q9
8c7a4f93-7856-43b6-943e-0b245f32b319	Boiled Eggs - 2 Pieces		0		fcae4a3d-2856-417d-aed8-20b6d5bc673f	\N	VEG	KITCHEN	t	2026-03-30 02:46:17.199	{}	6	cmm7kijlt000111fe6p8fx3q9
663c710f-5cf2-487e-8890-f76ec75bcbe3	Omelette - 2 Eggs		0		fcae4a3d-2856-417d-aed8-20b6d5bc673f	\N	VEG	KITCHEN	t	2026-03-30 02:47:18.539	{}	7	cmm7kijlt000111fe6p8fx3q9
f7344287-79da-41b7-822a-937c2a412a4a	Chicken Sausages -2 Pieces		0		fcae4a3d-2856-417d-aed8-20b6d5bc673f	\N	NON_VEG	KITCHEN	t	2026-03-30 02:47:54.21	{}	8	cmm7kijlt000111fe6p8fx3q9
c4b8d126-210f-47d7-805d-ae212b27a159	chips spicy		0		490d44e0-8b21-4aac-8d94-ad5d9a54a237	\N	VEG	KITCHEN	t	2026-03-30 02:49:48.982	{}	12	cmm7kijlt000111fe6p8fx3q9
d50c80db-ceb5-456b-9b07-93840d195265	Slice Cheess Extra		0		fcae4a3d-2856-417d-aed8-20b6d5bc673f	\N	VEG	KITCHEN	t	2026-03-30 02:48:46.926	{}	1	cmm7kijlt000111fe6p8fx3q9
b04422b7-8c6f-4263-8ff1-09ed76e31761	Toast (2 Slices)		0		fcae4a3d-2856-417d-aed8-20b6d5bc673f	\N	VEG	KITCHEN	t	2026-03-30 02:48:23.38	{}	2	cmm7kijlt000111fe6p8fx3q9
f8a808ee-6e22-4b5c-a96c-d6c37b097367	Veg Sandwich		0		fcae4a3d-2856-417d-aed8-20b6d5bc673f	\N	VEG	KITCHEN	t	2026-03-30 02:49:25.875	{}	3	cmm7kijlt000111fe6p8fx3q9
15ca899e-b415-4b1e-8600-2edfc78dbd45	Iced Mocha Madness		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:52:37.166	{}	26	cmm7kijlt000111fe6p8fx3q9
513ec023-6989-4cb8-afd5-d9ba52b23aef	Frappé		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:53:12.766	{}	27	cmm7kijlt000111fe6p8fx3q9
83fac231-3baa-40d6-9496-38e86564162c	Iced Cappuccino		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:55:10.211	{}	31	cmm7kijlt000111fe6p8fx3q9
b911a839-f357-454c-a394-9d01f8b2f7e8	Lungo Double		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	KITCHEN	t	2026-03-30 02:31:56.947	{}	5	cmm7kijlt000111fe6p8fx3q9
fa1462e4-b300-4316-aea0-1333d7740129	Virgin Mojito		0		9e6f6aec-5ccd-484b-aa4e-417936648652	\N	DRINK	BAR	t	2026-03-30 02:52:06.25	{}	25	cmm7kijlt000111fe6p8fx3q9
90c22876-2026-4b38-bd17-b5c6bfceec69	Lemonade		0		9e6f6aec-5ccd-484b-aa4e-417936648652	\N	DRINK	BAR	t	2026-03-30 02:53:45.458	{}	28	cmm7kijlt000111fe6p8fx3q9
02dd1b15-b3dd-472c-b440-2564212ffd3a	Mint Lemonade		0		9e6f6aec-5ccd-484b-aa4e-417936648652	\N	DRINK	BAR	t	2026-03-30 02:54:08.878	{}	29	cmm7kijlt000111fe6p8fx3q9
acf02252-d148-46da-a861-7865338912ed	Seasonal Smoothie		0		9e6f6aec-5ccd-484b-aa4e-417936648652	\N	DRINK	BAR	t	2026-03-30 02:54:45.349	{}	30	cmm7kijlt000111fe6p8fx3q9
c800ad98-4177-4bfd-8f5b-32e6777ba85b	Milkshake		0		9e6f6aec-5ccd-484b-aa4e-417936648652	\N	DRINK	BAR	t	2026-03-30 02:56:29.238	{}	34	cmm7kijlt000111fe6p8fx3q9
26627435-aeca-44ce-9b96-0c7ac9be76bc	Banana Lassi		0		9e6f6aec-5ccd-484b-aa4e-417936648652	\N	DRINK	BAR	t	2026-03-30 02:56:59.588	{}	35	cmm7kijlt000111fe6p8fx3q9
4cdbcc79-6173-4649-8cdd-7abea45be296	Oreo Cookies Shakes		0		9e6f6aec-5ccd-484b-aa4e-417936648652	\N	DRINK	BAR	t	2026-03-30 02:57:22.812	{}	36	cmm7kijlt000111fe6p8fx3q9
a90dec47-7286-439b-91bc-1ce147a0f397	Peach Iced Tea		0		9e6f6aec-5ccd-484b-aa4e-417936648652	\N	DRINK	BAR	t	2026-03-30 02:58:57.633	{}	37	cmm7kijlt000111fe6p8fx3q9
32fb18bc-0356-4a64-a3fc-f20513cbffb5	Coca Cola		0		a31194dc-1266-4e5e-8b78-4774c554a09f	\N	DRINK	BAR	t	2026-03-30 02:59:37.432	{}	38	cmm7kijlt000111fe6p8fx3q9
6a1f8e93-53c9-4b0b-b338-234dfca892e7	Fresh sesanol juice		0		9e6f6aec-5ccd-484b-aa4e-417936648652	\N	DRINK	BAR	t	2026-03-30 03:00:21.788	{}	39	cmm7kijlt000111fe6p8fx3q9
b81b0b82-cc3f-40eb-864c-b29f95f93ed9	Iced Mocha		0		9087ceea-5ed0-4183-83a0-6c8c271ca72f	\N	DRINK	BAR	t	2026-03-30 02:55:39.326	{}	32	cmm7kijlt000111fe6p8fx3q9
c9344261-217e-4699-955c-6452bf036fa5	Lassi - Plain or Sweet		0		9e6f6aec-5ccd-484b-aa4e-417936648652	\N	DRINK	BAR	t	2026-03-30 02:56:03.641	{}	33	cmm7kijlt000111fe6p8fx3q9
9a0a811f-500d-428d-ae6a-7bb03dbab3fa	Iced Matcha		0		9e6f6aec-5ccd-484b-aa4e-417936648652	\N	DRINK	BAR	t	2026-03-30 03:00:52.465	{}	40	cmm7kijlt000111fe6p8fx3q9
c0a00c74-d081-4b96-97d8-308a4b543922	Crispy Fried Chicken		0		57e397f0-e32b-4f75-b191-7dd59cc17b66	\N	NON_VEG	KITCHEN	t	2026-03-30 03:11:04.312	{}	1	cmm7kijlt000111fe6p8fx3q9
ca072fe0-9a08-4b97-aaa3-642682f84c37	Chicken Chilly		0		57e397f0-e32b-4f75-b191-7dd59cc17b66	\N	NON_VEG	KITCHEN	t	2026-03-30 03:11:36.498	{}	2	cmm7kijlt000111fe6p8fx3q9
39d48abd-7eeb-48b9-9326-6c4403c077d3	Fried Chicken Basic		0		57e397f0-e32b-4f75-b191-7dd59cc17b66	\N	NON_VEG	KITCHEN	t	2026-03-30 03:12:15.744	{}	3	cmm7kijlt000111fe6p8fx3q9
e0c4d75f-ce9d-4d8a-9de0-72d0d0169621	Masala Milk Tea		0		ab987602-7eb4-4319-943e-717693fa0c98	\N	DRINK	BAR	t	2026-03-30 03:13:40.375	{}	1	cmm7kijlt000111fe6p8fx3q9
eb983157-5e01-4753-9bc5-f558e756151f	Green Tea and Tulsi Tea		0		ab987602-7eb4-4319-943e-717693fa0c98	\N	DRINK	BAR	t	2026-03-30 03:14:07.059	{}	2	cmm7kijlt000111fe6p8fx3q9
c81021de-0d36-4f09-af81-06622fcf9a20	Hot Lemon with Ginger Honey		0		ab987602-7eb4-4319-943e-717693fa0c98	\N	DRINK	BAR	t	2026-03-30 03:14:38.443	{}	3	cmm7kijlt000111fe6p8fx3q9
e80bdb04-fc46-4ffc-af43-a15674fbcdd3	Black Tea - Masala		0		ab987602-7eb4-4319-943e-717693fa0c98	\N	DRINK	BAR	t	2026-03-30 03:15:14.602	{}	4	cmm7kijlt000111fe6p8fx3q9
70d8f4b7-e5b3-4ca5-b998-d085e787638c	Lemon Tea		0		ab987602-7eb4-4319-943e-717693fa0c98	\N	DRINK	BAR	t	2026-03-30 03:15:44.405	{}	5	cmm7kijlt000111fe6p8fx3q9
1734a148-9333-4175-8534-edde0320f45f	Hot Chocolate		0		ab987602-7eb4-4319-943e-717693fa0c98	\N	DRINK	BAR	t	2026-03-30 03:16:07.685	{}	6	cmm7kijlt000111fe6p8fx3q9
159d8015-982b-488a-9425-1c525c11281b	Water		0		ab987602-7eb4-4319-943e-717693fa0c98	\N	DRINK	BAR	t	2026-03-30 03:16:40.629	{}	7	cmm7kijlt000111fe6p8fx3q9
5b346bdc-76d4-4032-9332-5b7bf5a09e8c	Hot Lemon		0		ab987602-7eb4-4319-943e-717693fa0c98	\N	DRINK	BAR	t	2026-03-30 03:17:07.923	{}	8	cmm7kijlt000111fe6p8fx3q9
0fdbe404-3808-47ac-858c-fcfe51d52460	Hot Lemon with Honey		0		ab987602-7eb4-4319-943e-717693fa0c98	\N	DRINK	BAR	t	2026-03-30 03:17:33.918	{}	9	cmm7kijlt000111fe6p8fx3q9
225c0466-3753-426a-a214-42288d5b4257	Green Tea Big Pot		0		ab987602-7eb4-4319-943e-717693fa0c98	\N	DRINK	BAR	t	2026-03-30 03:18:20.076	{}	10	cmm7kijlt000111fe6p8fx3q9
d8a37de8-4053-46e3-9ba3-87c50dea87d3	Chicken Momo		0		c18e0d05-e3c7-4309-a9ce-ece3df632153	\N	NON_VEG	KITCHEN	t	2026-03-30 03:21:26.66	{}	1	cmm7kijlt000111fe6p8fx3q9
e34eb1ba-a49b-43d1-b890-4a8c40bf42e6	Veg Momo		0		c18e0d05-e3c7-4309-a9ce-ece3df632153	\N	VEG	KITCHEN	t	2026-03-30 03:23:34.949	{}	2	cmm7kijlt000111fe6p8fx3q9
05149e4b-a857-44bb-9b80-d55b0410c431	Chicken Jhol Momo		0		c18e0d05-e3c7-4309-a9ce-ece3df632153	\N	NON_VEG	KITCHEN	t	2026-03-30 03:24:06.539	{}	3	cmm7kijlt000111fe6p8fx3q9
ca4c82ad-b840-458a-82ab-8ce53def3db3	Veg Jhol Momo		0		c18e0d05-e3c7-4309-a9ce-ece3df632153	\N	VEG	KITCHEN	t	2026-03-30 03:24:51.867	{}	4	cmm7kijlt000111fe6p8fx3q9
097f421e-3f71-4061-a7ed-4cd1ae29ede7	Chicken Chilly Momo		0		c18e0d05-e3c7-4309-a9ce-ece3df632153	\N	NON_VEG	KITCHEN	t	2026-03-30 03:25:38.646	{}	5	cmm7kijlt000111fe6p8fx3q9
e8de9cb4-1ceb-49a5-a7e0-086f43d68d2f	Chicken kothe MOMO		0		c18e0d05-e3c7-4309-a9ce-ece3df632153	\N	NON_VEG	KITCHEN	t	2026-03-30 03:26:17.073	{}	6	cmm7kijlt000111fe6p8fx3q9
2c220c0d-9aab-46dd-8ea1-1bb8dc359984	Kund Breakfast Set		0		05857179-5967-40bb-8f2e-9d51fb4bd07d	\N	NON_VEG	KITCHEN	t	2026-03-30 03:27:12.391	{}	1	cmm7kijlt000111fe6p8fx3q9
568c69a6-ecce-4bff-8f5a-d46c623a9080	Toast		0		05857179-5967-40bb-8f2e-9d51fb4bd07d	\N	VEG	KITCHEN	t	2026-03-30 03:27:40.38	{}	2	cmm7kijlt000111fe6p8fx3q9
9ba8cd96-b5c2-4ea2-963c-681391855903	Pancake Paradise		0		05857179-5967-40bb-8f2e-9d51fb4bd07d	\N	VEG	KITCHEN	t	2026-03-30 03:28:10.359	{}	3	cmm7kijlt000111fe6p8fx3q9
7d37f070-3e96-4bf5-b517-1e1a2ddcbbb0	Yogurt Fruit Bowl		0		05857179-5967-40bb-8f2e-9d51fb4bd07d	\N	VEG	KITCHEN	t	2026-03-30 03:28:41.494	{}	4	cmm7kijlt000111fe6p8fx3q9
648ecf49-b848-4c1a-a57e-8cc5b5709d75	Himalayan Herb Salad		0		1fbd4e52-b465-4551-b4d3-46cc6bc12f93	\N	VEG	KITCHEN	t	2026-03-30 03:29:38.975	{}	1	cmm7kijlt000111fe6p8fx3q9
0d5c1352-af88-4576-96fb-f566f08ebe71	Seasonal Fruit Delight		0		1fbd4e52-b465-4551-b4d3-46cc6bc12f93	\N	VEG	KITCHEN	t	2026-03-30 03:30:07.84	{}	2	cmm7kijlt000111fe6p8fx3q9
fad8ac12-0aa5-452d-a634-541df2feb1e8	Herbed Mushroom Soup		0		1fbd4e52-b465-4551-b4d3-46cc6bc12f93	\N	VEG	KITCHEN	t	2026-03-30 03:30:52.267	{}	3	cmm7kijlt000111fe6p8fx3q9
f7c5be7c-0aa6-4881-8b96-4540281a96c5	Alpine Chicken Soup		0		1fbd4e52-b465-4551-b4d3-46cc6bc12f93	\N	NON_VEG	KITCHEN	t	2026-03-30 03:31:14.694	{}	4	cmm7kijlt000111fe6p8fx3q9
a93ea9ee-aebe-4a57-85cc-99d94f7dbe62	Chicken Salad		0		1fbd4e52-b465-4551-b4d3-46cc6bc12f93	\N	NON_VEG	KITCHEN	t	2026-03-30 03:31:56.829	{}	5	cmm7kijlt000111fe6p8fx3q9
8b49b262-0af8-4d53-9774-09180dac0130	Spaghetti Marinara with Chicken		0		9d50bdc1-4cf6-45cc-b50a-69fa1f754065	\N	NON_VEG	KITCHEN	t	2026-03-30 03:33:14.218	{}	1	cmm7kijlt000111fe6p8fx3q9
636dee1e-d8ea-4edc-a006-337df02fc0b3	Veg Keema Noodles		0		9d50bdc1-4cf6-45cc-b50a-69fa1f754065	\N	VEG	KITCHEN	t	2026-03-30 03:34:31.27	{}	2	cmm7kijlt000111fe6p8fx3q9
c78283e8-dc79-494c-b6b5-21b1073876ee	Chicken Keema Noodles		0		9d50bdc1-4cf6-45cc-b50a-69fa1f754065	\N	NON_VEG	KITCHEN	t	2026-03-30 03:35:03.377	{}	3	cmm7kijlt000111fe6p8fx3q9
23e4f428-3879-43ad-b5af-1e91ac45660d	Vegetable Spaghetti with Marinara		0		9d50bdc1-4cf6-45cc-b50a-69fa1f754065	\N	VEG	KITCHEN	t	2026-03-30 03:35:36.526	{}	4	cmm7kijlt000111fe6p8fx3q9
ea4ebd6f-c319-4f28-97e0-d1d8c0ad9b34	Chicken Chowmein		0		9d50bdc1-4cf6-45cc-b50a-69fa1f754065	\N	NON_VEG	KITCHEN	t	2026-03-30 03:36:17.87	{}	5	cmm7kijlt000111fe6p8fx3q9
689aa7f6-9cfe-465e-a485-9d2f8745e16f	Veg chowmein		0		9d50bdc1-4cf6-45cc-b50a-69fa1f754065	\N	VEG	KITCHEN	t	2026-03-30 04:16:52.147	{}	6	cmm7kijlt000111fe6p8fx3q9
f47a9452-158f-4ea2-8371-6da4d9ba4a18	Veggie Cheese Burger		0		2e9ffa9d-50dc-4aa8-8f69-16c4e2aacbbb	\N	VEG	KITCHEN	t	2026-03-30 04:18:27.445	{}	1	cmm7kijlt000111fe6p8fx3q9
696a89e5-c6cb-47e7-b427-467ce8616050	Classic Chicken Cheese Burger		0		2e9ffa9d-50dc-4aa8-8f69-16c4e2aacbbb	\N	NON_VEG	KITCHEN	t	2026-03-30 04:18:57.383	{}	2	cmm7kijlt000111fe6p8fx3q9
8b8a2541-3cfa-4a1a-ac88-a7b327b87020	Crunchy Cheesy Chicken Burger		0		2e9ffa9d-50dc-4aa8-8f69-16c4e2aacbbb	\N	NON_VEG	KITCHEN	t	2026-03-30 04:19:20.568	{}	3	cmm7kijlt000111fe6p8fx3q9
9b535db0-2092-4f34-8391-a3d7c6edd5b9	Veg Cheese Sandwich		0		2e9ffa9d-50dc-4aa8-8f69-16c4e2aacbbb	\N	VEG	KITCHEN	t	2026-03-30 04:19:44.254	{}	4	cmm7kijlt000111fe6p8fx3q9
a1804e42-78a8-48a2-8cd8-2e71fe0e4c27	Chicken Sandwich		0		2e9ffa9d-50dc-4aa8-8f69-16c4e2aacbbb	\N	NON_VEG	KITCHEN	t	2026-03-30 04:20:09.256	{}	5	cmm7kijlt000111fe6p8fx3q9
50cf10e0-7f25-4024-b02e-0d8376acd294	Cookies		0		5e468923-dc18-4114-af67-3c1b3ac735c9	\N	NON_VEG	KITCHEN	t	2026-03-30 04:25:54.876	{}	4	cmm7kijlt000111fe6p8fx3q9
2c70fda1-b5a0-44fe-87bc-c70a0c75b120	Cookie		0		5e468923-dc18-4114-af67-3c1b3ac735c9	\N	NON_VEG	KITCHEN	t	2026-03-30 04:27:29.356	{}	5	cmm7kijlt000111fe6p8fx3q9
a3a43f16-4ab6-4ea0-b822-0662f2828d3c	Croissant		0		5e468923-dc18-4114-af67-3c1b3ac735c9	\N	NON_VEG	KITCHEN	t	2026-03-30 04:27:52.178	{}	6	cmm7kijlt000111fe6p8fx3q9
595f2006-73a9-4e39-944a-dd92fe423a72	Brownie		0		5e468923-dc18-4114-af67-3c1b3ac735c9	\N	VEG	KITCHEN	t	2026-03-30 04:28:13.561	{}	7	cmm7kijlt000111fe6p8fx3q9
2d22351a-f309-44b1-a8a9-d198d218a8e6	Chocolate Croissant		0		5e468923-dc18-4114-af67-3c1b3ac735c9	\N	VEG	KITCHEN	t	2026-03-30 04:28:39.95	{}	8	cmm7kijlt000111fe6p8fx3q9
d9cf0fcc-93bb-4d1b-8285-ecd9ee3ff914	Vanilla cookies		0		5e468923-dc18-4114-af67-3c1b3ac735c9	\N	VEG	KITCHEN	t	2026-03-30 04:29:08.9	{}	9	cmm7kijlt000111fe6p8fx3q9
8414f37e-0e30-4a58-a1e6-41c6c826ba86	Buns		0		5e468923-dc18-4114-af67-3c1b3ac735c9	\N	VEG	KITCHEN	t	2026-03-30 04:36:14.358	{}	10	cmm7kijlt000111fe6p8fx3q9
828bbb41-373e-450a-985d-e30829710fad	French Fries		0		02e93a86-8dc1-4881-be50-c8bd90928bf9	\N	VEG	KITCHEN	t	2026-03-30 04:39:18.56	{}	2	cmm7kijlt000111fe6p8fx3q9
c005dfbf-a3b9-4c82-b9f7-fa6ea1240719	Paneer Chilly		0		02e93a86-8dc1-4881-be50-c8bd90928bf9	\N	VEG	KITCHEN	t	2026-03-30 04:40:28.083	{}	5	cmm7kijlt000111fe6p8fx3q9
0209b863-e624-410d-9886-9d5fbcd529fe	Aalu Sadeko		0		490d44e0-8b21-4aac-8d94-ad5d9a54a237	\N	VEG	KITCHEN	t	2026-03-30 04:41:08.832	{}	13	cmm7kijlt000111fe6p8fx3q9
4f10f17b-6e3b-4a16-b9d0-b845cb07ce33	Paratha		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	VEG	KITCHEN	t	2026-03-30 04:47:55.86	{}	1	cmm7kijlt000111fe6p8fx3q9
c7f1aca1-28e2-4da1-a77d-4b87757ddc01	Egg Burger		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	VEG	KITCHEN	t	2026-03-30 04:48:33.793	{}	2	cmm7kijlt000111fe6p8fx3q9
9460f6b3-102d-4780-8a7b-0499cd8541c8	Add cheese		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	VEG	KITCHEN	t	2026-03-30 04:48:56.826	{}	3	cmm7kijlt000111fe6p8fx3q9
639fb067-777d-48f4-90a8-e5f5a2276aba	Crunchy Spicy Cheesy Chicken Burger		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	NON_VEG	KITCHEN	t	2026-03-30 04:49:29.114	{}	4	cmm7kijlt000111fe6p8fx3q9
cf856af7-6ef2-4aca-aa25-75ba69a3a463	Chicken Sadeko		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	NON_VEG	KITCHEN	t	2026-03-30 04:49:55.369	{}	5	cmm7kijlt000111fe6p8fx3q9
fb27fac5-cdc1-4f73-b14d-76192753cc98	Spicy Chicken Wings		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	NON_VEG	KITCHEN	t	2026-03-30 04:50:18.661	{}	6	cmm7kijlt000111fe6p8fx3q9
363ed91d-a74a-428e-8928-b879581f7750	Sandwich		0		2e9ffa9d-50dc-4aa8-8f69-16c4e2aacbbb	\N	VEG	KITCHEN	t	2026-03-30 04:21:06.976	{}	6	cmm7kijlt000111fe6p8fx3q9
a5845d7f-e71f-4ce5-9420-93af48f15109	Apple Tart		0		5e468923-dc18-4114-af67-3c1b3ac735c9	\N	NON_VEG	KITCHEN	t	2026-03-30 04:23:11.474	{}	1	cmm7kijlt000111fe6p8fx3q9
689a24ed-04ca-4cff-95df-4493552a6531	Chocolate Muffin		0		5e468923-dc18-4114-af67-3c1b3ac735c9	\N	NON_VEG	KITCHEN	t	2026-03-30 04:24:35.637	{}	2	cmm7kijlt000111fe6p8fx3q9
bcca19b9-bfb1-4f09-9a1b-c06bba578ea2	Cheese Cake		0		5e468923-dc18-4114-af67-3c1b3ac735c9	\N	NON_VEG	KITCHEN	t	2026-03-30 04:25:05.985	{}	3	cmm7kijlt000111fe6p8fx3q9
f2b074b5-750f-4886-971f-4547771131da	Peanuts Sadeko		0		02e93a86-8dc1-4881-be50-c8bd90928bf9	\N	VEG	KITCHEN	t	2026-03-30 04:38:56.873	{}	1	cmm7kijlt000111fe6p8fx3q9
5c52bb2f-280e-403c-b69c-5303ef88b793	Chips Chilly		0		02e93a86-8dc1-4881-be50-c8bd90928bf9	\N	VEG	KITCHEN	t	2026-03-30 04:39:44.95	{}	3	cmm7kijlt000111fe6p8fx3q9
8887738d-e6e9-46fb-85b9-df79782a47b8	Mustang Aloo		0		02e93a86-8dc1-4881-be50-c8bd90928bf9	\N	VEG	KITCHEN	t	2026-03-30 04:40:06.96	{}	4	cmm7kijlt000111fe6p8fx3q9
3c5d8566-9e5a-4d80-a108-0a375b4bc813	Chicken Fry Rice		0		30b4ae97-8712-430a-9ddd-943c144aa1e1	\N	NON_VEG	KITCHEN	t	2026-03-30 03:22:56.752	{}	4	cmm7kijlt000111fe6p8fx3q9
d7886085-ef8d-456f-8249-4120e5718210	Veg fry rice		0		30b4ae97-8712-430a-9ddd-943c144aa1e1	\N	VEG	KITCHEN	t	2026-03-30 04:43:54.68	{}	5	cmm7kijlt000111fe6p8fx3q9
d32f13fe-fefa-41d3-947f-7a63d51d3add	Apple Salad		0		1fbd4e52-b465-4551-b4d3-46cc6bc12f93	\N	VEG	KITCHEN	t	2026-03-30 04:44:43.013	{}	6	cmm7kijlt000111fe6p8fx3q9
64dbf16f-7ea2-4dd3-bfa7-6fbaf1617242	Chicken Thukpaa		0		9d50bdc1-4cf6-45cc-b50a-69fa1f754065	\N	NON_VEG	KITCHEN	t	2026-03-30 04:45:31.638	{}	7	cmm7kijlt000111fe6p8fx3q9
802909f8-7bcc-4d97-9360-aa57787edcba	Books		0		4e4d923a-8ca1-4395-b561-2b421f57a55f	\N	VEG	BAR	t	2026-03-30 04:46:26.479	{}	1	cmm7kijlt000111fe6p8fx3q9
fbd0c4f2-b5a7-4e1f-b1fe-f6a53e29ae77	Chicken Lollipop		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	NON_VEG	KITCHEN	t	2026-03-30 04:50:43.008	{}	7	cmm7kijlt000111fe6p8fx3q9
0067380c-ed75-4cd1-b7a4-9e4f4c6917f3	Chicken Sausage Chilly		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	NON_VEG	KITCHEN	t	2026-03-30 04:51:13.045	{}	8	cmm7kijlt000111fe6p8fx3q9
0e21d172-67bb-42e7-88a7-b85a2c38c928	Chicken Tawa		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	NON_VEG	KITCHEN	t	2026-03-30 04:52:26.407	{}	9	cmm7kijlt000111fe6p8fx3q9
732cc04f-ef5e-4bce-b3d6-bb8d08db6b8f	Chicken Wings Fry		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	NON_VEG	KITCHEN	t	2026-03-30 04:52:49.785	{}	10	cmm7kijlt000111fe6p8fx3q9
c08a2e57-db8c-4497-b01b-045c0d5815c7	Chicken Leg Piece Fry		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	NON_VEG	KITCHEN	t	2026-03-30 04:53:10.922	{}	11	cmm7kijlt000111fe6p8fx3q9
133b3dc3-5be5-41ae-b16e-43e4b97f33c1	Timur Chicken		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	NON_VEG	KITCHEN	t	2026-03-30 04:53:32.142	{}	12	cmm7kijlt000111fe6p8fx3q9
a7c866b2-a466-4f48-9151-463ecf38b45d	Chicken Roast (8 piece)		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	NON_VEG	KITCHEN	t	2026-03-30 04:53:57.339	{}	13	cmm7kijlt000111fe6p8fx3q9
33abb7b2-8c5e-44e9-addf-6b28ecbf0d50	Chicken Sekuwa		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	NON_VEG	KITCHEN	t	2026-03-30 04:54:23.517	{}	14	cmm7kijlt000111fe6p8fx3q9
1b235649-33f9-4eda-98c7-413ac9212d8d	Chicken Leg Piece Spicy		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	NON_VEG	KITCHEN	t	2026-03-30 04:54:44.5	{}	15	cmm7kijlt000111fe6p8fx3q9
40698626-a629-47a5-8c0d-6b29050a2080	Crispy Leg Piece		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	NON_VEG	KITCHEN	t	2026-03-30 04:55:07.385	{}	16	cmm7kijlt000111fe6p8fx3q9
2ffcfc59-0251-4531-9da0-36d3bcc8ae7f	Chicken Finger Crispy		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	NON_VEG	KITCHEN	t	2026-03-30 04:55:28.616	{}	17	cmm7kijlt000111fe6p8fx3q9
f7c8a581-89c4-408b-a81b-a653b97cba28	Chicken Popcorn		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	NON_VEG	KITCHEN	t	2026-03-30 04:55:49.026	{}	18	cmm7kijlt000111fe6p8fx3q9
155e7a62-899d-45f0-9345-aeb8c26abe87	Crispy Chicken		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	NON_VEG	KITCHEN	t	2026-03-30 04:56:12.152	{}	19	cmm7kijlt000111fe6p8fx3q9
dbb9f2db-68b6-4792-a565-019d2ee195ea	Chinese Chopsuey Veg		0		9d50bdc1-4cf6-45cc-b50a-69fa1f754065	\N	VEG	KITCHEN	t	2026-03-30 04:56:43.03	{}	8	cmm7kijlt000111fe6p8fx3q9
7fe8e531-8fb4-4729-80c6-a99cdcb99955	Ground Beans		0		e1ae26b7-6713-432e-9529-4c026538737f	\N	DRINK	KITCHEN	t	2026-03-30 04:58:24.892	{}	1	cmm7kijlt000111fe6p8fx3q9
2b9020f1-2a11-4274-bdbf-771f8de09e01	Paneer Wrap		0		119c3840-07b2-4b0b-9922-73c9ddf876c9	\N	VEG	KITCHEN	t	2026-03-30 04:59:23.98	{}	1	cmm7kijlt000111fe6p8fx3q9
53c59df7-3499-4bab-b75c-98d0f48a1e41	Egg Wrap		0		119c3840-07b2-4b0b-9922-73c9ddf876c9	\N	VEG	KITCHEN	t	2026-03-30 04:59:46.408	{}	2	cmm7kijlt000111fe6p8fx3q9
0c6c2af6-3495-4303-8e83-d30f08a160ac	Chicken Wrap		0		119c3840-07b2-4b0b-9922-73c9ddf876c9	\N	NON_VEG	KITCHEN	t	2026-03-30 05:00:07.851	{}	3	cmm7kijlt000111fe6p8fx3q9
c0355621-9d63-4e4f-a5e0-b4a2961bfc9b	Veg Wrap		0		119c3840-07b2-4b0b-9922-73c9ddf876c9	\N	VEG	KITCHEN	t	2026-03-30 05:00:27.977	{}	4	cmm7kijlt000111fe6p8fx3q9
e4ec151e-870c-4410-bd79-50ce6bd7c5cd	Potato Cheese Balls		0		490d44e0-8b21-4aac-8d94-ad5d9a54a237	\N	VEG	KITCHEN	t	2026-03-30 05:01:03.855	{}	14	cmm7kijlt000111fe6p8fx3q9
cb3cfaf2-8461-4a21-8c5c-3ef3ab320e1a	Mushroom Chilly		0		02e93a86-8dc1-4881-be50-c8bd90928bf9	\N	VEG	KITCHEN	t	2026-03-30 05:01:36.813	{}	6	cmm7kijlt000111fe6p8fx3q9
95597cb5-45aa-4b61-9403-24d1b4263cb1	Onion Pakoda		0		02e93a86-8dc1-4881-be50-c8bd90928bf9	\N	VEG	KITCHEN	t	2026-03-30 05:02:02.433	{}	7	cmm7kijlt000111fe6p8fx3q9
4f242de6-2b74-4e38-b235-cc781233faf0	Piro Aalu		0		02e93a86-8dc1-4881-be50-c8bd90928bf9	\N	VEG	KITCHEN	t	2026-03-30 05:03:07.78	{}	8	cmm7kijlt000111fe6p8fx3q9
c2c784e0-595a-47a1-ac69-1ccd3a95df0d	Veg. Pakoda		0		02e93a86-8dc1-4881-be50-c8bd90928bf9	\N	VEG	KITCHEN	t	2026-03-30 05:03:30.491	{}	9	cmm7kijlt000111fe6p8fx3q9
174ef5a8-64ab-4706-ab40-d7fcc5bdf3b1	Aalu Jeera		0		02e93a86-8dc1-4881-be50-c8bd90928bf9	\N	VEG	KITCHEN	t	2026-03-30 05:03:51.879	{}	10	cmm7kijlt000111fe6p8fx3q9
6e12864e-0ae3-493a-b170-7a5043069e12	Veg Tempura		0		02e93a86-8dc1-4881-be50-c8bd90928bf9	\N	VEG	KITCHEN	t	2026-03-30 05:04:17.013	{}	11	cmm7kijlt000111fe6p8fx3q9
c40605bd-0382-497e-b094-462aa3a49eef	Crispy Finger Fry Potato		0		02e93a86-8dc1-4881-be50-c8bd90928bf9	\N	VEG	KITCHEN	t	2026-03-30 05:04:56.873	{}	12	cmm7kijlt000111fe6p8fx3q9
315095ac-14e2-4714-bdb9-4f933eb1321b	Paneer Pakoda		0		02e93a86-8dc1-4881-be50-c8bd90928bf9	\N	VEG	KITCHEN	t	2026-03-30 05:05:37.202	{}	13	cmm7kijlt000111fe6p8fx3q9
8d23ecf0-287d-40b2-b4e9-36e4559cd666	Aalu Chop		0		02e93a86-8dc1-4881-be50-c8bd90928bf9	\N	VEG	KITCHEN	t	2026-03-30 05:05:58.043	{}	14	cmm7kijlt000111fe6p8fx3q9
76457b0a-01b3-48a0-bc57-30442a60c0fb	Plain Roti Per Piece		0		fcae4a3d-2856-417d-aed8-20b6d5bc673f	\N	VEG	KITCHEN	t	2026-03-30 05:06:35.303	{}	9	cmm7kijlt000111fe6p8fx3q9
60c8ab6d-dc01-49ba-ac51-ab2b4ecb867d	Plain Rice		0		30b4ae97-8712-430a-9ddd-943c144aa1e1	\N	VEG	KITCHEN	t	2026-03-30 05:07:14.337	{}	6	cmm7kijlt000111fe6p8fx3q9
f8d2cf87-3ef9-4ceb-af46-9b1ffc6413a3	Chicken Keema Paratha		0		2627e01c-41f3-453f-8767-93ea4bd9f1b2	\N	NON_VEG	KITCHEN	t	2026-03-30 05:07:42.88	{}	20	cmm7kijlt000111fe6p8fx3q9
19efd40d-48ee-40e6-b2c5-cf04048bfc89	Milk Masala Tea		0		a0a76873-13c4-4eb1-97ca-a149acbc0f89	\N	DRINK	KITCHEN	t	2026-04-04 12:06:17.527	{}	1	cmnka6xqp0001emd4z20d0lds
dc66fea9-43c5-4006-b6d5-49af4a5e2f97	Milk Masala Tea		6		3515c41e-90d5-4e08-8523-8da5384a482e	\N	DRINK	KITCHEN	t	2026-04-05 06:04:36.664	{}	1	cmnlcvfo70002lt8xmmgez07z
61ef3fea-5769-4ae7-8540-ed331f016461	Milk Masala Tea		6		3515c41e-90d5-4e08-8523-8da5384a482e	\N	DRINK	KITCHEN	t	2026-04-05 06:04:36.887	{}	1	cmnlcvfo70002lt8xmmgez07z
dc7abdf2-dea2-40d3-851f-2eeb47065db7	Smoothie		6		3515c41e-90d5-4e08-8523-8da5384a482e	\N	DRINK	KITCHEN	t	2026-04-05 06:28:48.621	{}	2	cmnlcvfo70002lt8xmmgez07z
\.


--
-- Data for Name: DishAddOn; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."DishAddOn" (id, "dishId", "addOnId") FROM stdin;
\.


--
-- Data for Name: Expense; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Expense" (id, title, amount, category, date, description, "createdAt", "storeId", "dailySessionId") FROM stdin;
\.


--
-- Data for Name: MeasuringUnit; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."MeasuringUnit" (id, name, "shortName", description, "storeId", "createdAt") FROM stdin;
ab21151d-0b68-47c7-90b6-c1cd29baef9f	Kilogram	Kg		cmm7kb82i0002ku1gbbh63hr0	2026-03-06 10:20:51.948
363ef4a3-2957-4c07-bb92-fe85fe3bcb0c	KG	KG		cmm7kijlt000111fe6p8fx3q9	2026-03-29 07:49:05.191
\.


--
-- Data for Name: Menu; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Menu" (id, name, "storeId", "createdAt") FROM stdin;
\.


--
-- Data for Name: MenuSet; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."MenuSet" (id, name, service, "isActive", "createdAt", "sortOrder", "storeId") FROM stdin;
\.


--
-- Data for Name: MenuSetSubMenu; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."MenuSetSubMenu" (id, "menuSetId", "subMenuId") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Order" (id, "tableId", type, total, status, "createdAt", "customerId", "isDeleted", "paymentId", "sessionId", "staffId", "storeId", guests, "kotRemarks", "dailySessionId") FROM stdin;
2dd63987-4c5e-4c97-a12f-1341fc64d2f5	51085af7-c452-435a-9bcd-6038aba00da7	DINE_IN	150	COMPLETED	2026-03-23 06:49:44.279	\N	f	fd5775c1-6729-458b-831c-4b26eb977b5b	ba389e4e-2012-4505-8707-1bfa26e8e500	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
a3a84c9b-333f-4cd1-8836-c17a80ec6b71	\N	TAKE_AWAY	280	COMPLETED	2026-04-11 13:57:54.409	\N	f	50ae5c5b-5e1a-4e5a-8e81-313de3cc94ce	\N	\N	cmm7kijlt000111fe6p8fx3q9	1		0c70cb42-ba56-45ec-a7e2-b794d41edc6e
18bcf7f5-6fcf-46dc-8544-4b02052db78d	15511477-7788-47a7-9171-c6562425da72	DINE_IN	1500	COMPLETED	2026-03-02 12:12:37.255	\N	f	e166e4c7-8235-49a8-9ab4-da0e1fc7740d	7ced9b6b-7b5a-450e-98da-29d5ad7fe12e	\N	cmm7kijlt000111fe6p8fx3q9	\N	\N	\N
91e8a5ec-095d-413a-9475-cb1191cc3450	15511477-7788-47a7-9171-c6562425da72	DINE_IN	450	COMPLETED	2026-03-02 12:16:10.095	\N	f	c5d44921-22a6-43cb-afda-c43dd8b6fe0d	f5f633d0-49af-4fde-897d-589cf07d254a	\N	cmm7kijlt000111fe6p8fx3q9	\N	\N	\N
870d9576-bcff-4aaa-b8cf-cd3c9368ea63	980a2582-3dbc-4d26-96ca-be0f4ae3a9f0	DINE_IN	150	COMPLETED	2026-03-21 13:11:25.46	\N	f	58413fb6-ed2f-49ad-9d5f-20b50b6ef400	96ac8b64-1d81-4919-8589-ed0c22aebf62	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
356a00ad-bb09-48ca-9b0d-59b58a6d5891	2255ea55-e0db-4084-8fdf-393033c04c48	DINE_IN	180	COMPLETED	2026-03-01 09:45:20.504	\N	f	203ffa8f-fa35-4df3-8c26-1ccf86d265b5	cfaff52f-5760-46c6-85f2-2d6de967d618	\N	cmm7kb82i0002ku1gbbh63hr0	\N	\N	\N
f520d60a-a3f4-473b-8d59-1f931e55f301	9e26f846-ee14-42dc-b6d3-948acfe8f18f	DINE_IN	180	COMPLETED	2026-03-05 17:56:37.576	\N	f	368f4fb1-f91e-4033-9b0f-7a56f2a4f53c	5321dcdf-3721-4bed-b13a-61e62cf6123d	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
e2c025ef-11f5-466c-ae53-e3df0fb559a4	\N	TAKE_AWAY	623	PENDING	2026-03-23 15:19:13.672	\N	f	\N	\N	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
cfcc285c-3961-4f90-9022-015706971f74	\N	TAKE_AWAY	623	PENDING	2026-03-23 15:19:14.022	\N	f	\N	\N	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
b55b5554-7f29-4f21-8e00-01b12f0d1c56	\N	TAKE_AWAY	623	PENDING	2026-03-23 15:19:14.642	\N	f	\N	\N	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
7ad24679-5a13-423e-b11b-daac24bccf3a	9e26f846-ee14-42dc-b6d3-948acfe8f18f	DINE_IN	980	COMPLETED	2026-03-05 18:33:15.979	\N	f	86a0ba87-a271-42d0-92a4-d5ea49b85c74	0c1a6032-cd10-4a05-8831-a078cae66cd0	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
72c22cdf-3f68-4c47-97d6-c6cfe0e7cae5	9e26f846-ee14-42dc-b6d3-948acfe8f18f	DINE_IN	800	COMPLETED	2026-03-06 10:58:00.629	abb995c6-f41c-42ec-9e84-bdaddd62f552	f	7d4285a7-41a0-48b2-bb65-a2c24d075249	af1a38ce-9a64-49df-98a5-86161dd840a4	3d37b2cf-a074-45b5-8edc-616a16637ad6	cmm7kb82i0002ku1gbbh63hr0	1		\N
cbc6ddb8-379d-4395-8aa3-58cc5d418f09	9e26f846-ee14-42dc-b6d3-948acfe8f18f	DINE_IN	440	PENDING	2026-03-06 10:59:44.257	\N	f	\N	5baf50a7-38bd-440c-b455-5045b8f0bcaa	3d37b2cf-a074-45b5-8edc-616a16637ad6	cmm7kb82i0002ku1gbbh63hr0	1		\N
49c5ff16-afc4-4012-9770-4cfd57196fc2	\N	TAKE_AWAY	623	PENDING	2026-03-23 15:19:14.851	\N	f	\N	\N	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
3fe9cbc3-81ca-4feb-8be8-4db8d9383337	\N	TAKE_AWAY	623	PENDING	2026-03-23 15:19:15.373	\N	f	\N	\N	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
d1251bc9-24fd-440e-8514-2b3765120e9a	\N	TAKE_AWAY	623	PENDING	2026-03-23 15:19:15.793	\N	f	\N	\N	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
c8a06ce1-e9be-487a-81a8-3a2d0f5d46db	\N	TAKE_AWAY	623	PENDING	2026-03-23 15:19:19.876	\N	f	\N	\N	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
d76a2c45-0241-4441-b2e4-ba0e88c12293	9e26f846-ee14-42dc-b6d3-948acfe8f18f	DINE_IN	4100	PENDING	2026-03-06 11:00:14.226	\N	f	\N	5baf50a7-38bd-440c-b455-5045b8f0bcaa	3d37b2cf-a074-45b5-8edc-616a16637ad6	cmm7kb82i0002ku1gbbh63hr0	1		\N
c21c7d45-6dd0-4017-a0d1-aec6a50a1d61	\N	TAKE_AWAY	623	PENDING	2026-03-23 15:19:20.094	\N	f	\N	\N	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
915df846-d499-4401-ab34-623befa5f5a1	\N	TAKE_AWAY	623	PENDING	2026-03-23 15:19:20.521	\N	f	\N	\N	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
0ee9c731-70ca-4997-8b45-81f555ccbcf8	980a2582-3dbc-4d26-96ca-be0f4ae3a9f0	DINE_IN	150	COMPLETED	2026-03-06 07:10:11.489	\N	f	49a9bba6-59bc-42fc-bb00-b40ee8dd3908	c4512671-d745-4517-b145-4af70ab7af5f	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
460a0c94-4b57-41f2-bdbb-f45a4a17b3a0	15511477-7788-47a7-9171-c6562425da72	DINE_IN	600	COMPLETED	2026-03-06 06:42:20.931	\N	f	dbce9d70-c785-4ba5-a86a-4e48a24b8412	4837dac4-085b-4c3e-af3e-a2b1a8bb4f38	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
043315c0-3d22-4733-926a-1362f042ffc9	\N	TAKE_AWAY	623	PENDING	2026-03-23 15:19:21.364	\N	f	\N	\N	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
83f9b16f-ebe5-43f4-8763-fea7d94a6345	15511477-7788-47a7-9171-c6562425da72	DINE_IN	300	COMPLETED	2026-03-21 13:02:44.191	\N	f	aa2b8c07-206a-404d-8c4b-61b6577217d9	b1970bae-7989-443a-84df-140e503f48da	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
d3879d02-f2f0-43aa-bcdb-0a77040b8074	\N	DINE_IN	623	COMPLETED	2026-03-23 15:55:25.168	abb995c6-f41c-42ec-9e84-bdaddd62f552	f	363d9fe7-7a60-4e9e-870e-15124ce34726	\N	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
63222fcc-93ae-445f-92dd-4dce9787e5ef	\N	TAKE_AWAY	623	COMPLETED	2026-03-23 15:19:22.506	abb995c6-f41c-42ec-9e84-bdaddd62f552	f	661fad87-50e6-4ed8-b959-5a4dd1fbfa9f	\N	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
85386e4b-e806-4831-90d1-a8d6aece56ed	\N	TAKE_AWAY	850	COMPLETED	2026-03-23 08:21:51.826	98294b2c-8db7-4060-81f3-f5de23c457e2	f	cf37f288-de84-4dd4-8cc5-4d717b3e18c3	\N	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
83dc8249-bde4-4035-ab20-09fe5d682f02	\N	TAKE_AWAY	590	COMPLETED	2026-03-23 08:21:36.259	98294b2c-8db7-4060-81f3-f5de23c457e2	f	d57b077f-61a4-49d3-8c2c-891340ee437a	\N	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
04fbf8b4-c842-4d1e-b4ca-80cedbfa00da	15511477-7788-47a7-9171-c6562425da72	DINE_IN	150	COMPLETED	2026-03-04 07:06:43.395	\N	f	43f32094-e891-4a42-b3d1-394d139852ed	56c758e8-e408-4fb5-9c87-d1bdd716ae6c	\N	cmm7kijlt000111fe6p8fx3q9	\N	\N	\N
5464ef14-403d-4879-a6c0-7240637680f7	8b27d168-361c-40b0-9d75-fc3585635e8a	DINE_IN	450	COMPLETED	2026-03-24 02:09:33.103	\N	f	5c1934b5-b5c6-476e-9ffc-1b217af51539	b8cc8229-85e6-4418-b2b8-386c06bb8ffb	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
a3918a4f-3de4-4d61-96bc-64952f39091f	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	DINE_IN	150	COMPLETED	2026-03-24 11:27:42.104	\N	f	63fb3dd9-6562-44ff-a2fc-d79b65c867e6	65e3bfa5-a2e7-4a6c-a45c-88ab22e87cbb	9c63bb2d-f340-41fc-87ef-9835e2307967	cmm7kijlt000111fe6p8fx3q9	1		\N
d69e8a5c-adc2-4430-9331-bfe73e0aecd7	\N	TAKE_AWAY	590	COMPLETED	2026-03-25 04:32:21.712	\N	f	5b351d0c-43ff-4526-9b91-f89bd619aaaa	\N	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
ae3afa7e-cc88-4e9b-935e-095209c0e4dd	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	DINE_IN	150	COMPLETED	2026-03-25 04:31:58.117	ff0cf30c-499d-4201-b64f-deaa68c6d327	f	70ac16b3-d027-4e8c-af0d-25d495b70b98	fe2f6f57-0d67-4273-9841-abb91c935548	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
3bf741af-6236-497c-a093-90cef911ab57	\N	TAKE_AWAY	2530	COMPLETED	2026-03-27 12:07:15.663	\N	f	dfe18fef-16bb-4cb6-b147-29415c605552	\N	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
d7d692a8-f516-4dd8-b424-3b4d7af711be	8b27d168-361c-40b0-9d75-fc3585635e8a	DINE_IN	150	COMPLETED	2026-03-28 04:08:21.987	\N	f	4ff1d29a-700e-4bc4-8945-c1c97e526d72	0034cb45-b082-4892-825f-a759c4c2b345	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
d81be67b-31d2-4bd3-86fa-009b01482363	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	DINE_IN	300	COMPLETED	2026-03-28 04:23:44.559	\N	f	5df00eb3-42ce-44f6-a2b4-54901d173692	1db95613-3b8b-4521-b417-48828d717f35	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
f4d4da9f-05d1-4ece-a7ad-68339e15841b	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	DINE_IN	0	COMPLETED	2026-03-28 11:49:01.243	\N	f	52760ca1-3b7b-4890-8019-db48b0241239	28ea4a7f-c542-4325-8e66-9f132723e9bf	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
655559ff-9ef4-4479-89aa-01bb279ce664	bf416ec2-8e42-4516-9ca6-8961492b4458	DINE_IN	300	PENDING	2026-04-06 12:53:28.116	\N	f	\N	617ec160-f48d-48b3-9e81-7f488cbfdb61	\N	cmnlcvfo70002lt8xmmgez07z	1		\N
e480d2a3-415a-4d1a-9274-59466090bbc6	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	DINE_IN	0	COMPLETED	2026-03-28 12:20:02.455	\N	f	2b3357bb-791a-4120-85a7-9c97269e4cd8	41aa14b1-1dd8-48a3-b6c1-b6827701cc73	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
07d8a8bf-461a-49d6-a7d9-843a659c4d74	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	DINE_IN	590	COMPLETED	2026-03-28 12:22:53.856	\N	f	c26a2740-6eb1-4781-9f93-46c3c915b8f0	83c1e40b-06f0-4d18-8220-c194985f0a71	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
9db8bbd6-d3eb-40b9-a2c0-a8327ef6d213	bf416ec2-8e42-4516-9ca6-8961492b4458	DINE_IN	300	COMPLETED	2026-04-06 12:53:27.709	\N	f	1e1a9e47-c3cb-4e22-8b87-bc41d1c6eacd	e5d70a3c-242b-4720-887d-134e06eb7393	\N	cmnlcvfo70002lt8xmmgez07z	1		1476a7e3-4c10-4a48-b8ac-2440e42fb807
dba757e6-eb35-4cbd-b1fe-d641df1f71ad	bf416ec2-8e42-4516-9ca6-8961492b4458	DINE_IN	300	COMPLETED	2026-04-06 12:53:29.773	\N	f	1e1a9e47-c3cb-4e22-8b87-bc41d1c6eacd	e5d70a3c-242b-4720-887d-134e06eb7393	\N	cmnlcvfo70002lt8xmmgez07z	1		1476a7e3-4c10-4a48-b8ac-2440e42fb807
c1eb0f6a-fb2b-4bb8-83b4-bee21282d0cc	980a2582-3dbc-4d26-96ca-be0f4ae3a9f0	DINE_IN	0	COMPLETED	2026-03-28 12:26:25.709	\N	f	662320ea-21f2-4f03-b52d-96c252169f58	795ac5e8-9d62-4999-b413-c0d9501a95e4	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
71f20e9f-98b1-4d5c-af57-90bcf1cf013c	88391a93-eaa8-4e0e-a27b-fd8cb1478d8a	DINE_IN	0	COMPLETED	2026-03-29 06:55:21.68	\N	f	29d56693-80dd-48ec-8fc2-928efd4a6ac3	a5e544ff-a949-4b75-aaf5-c389483ae5b6	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
91bdde52-094d-42f4-841d-09da1624247e	8b27d168-361c-40b0-9d75-fc3585635e8a	DINE_IN	300	COMPLETED	2026-04-03 02:46:59.442	\N	f	52bc8c71-8140-42eb-b861-01f85cf35dce	a3fdba39-b51e-4905-897a-27c344d4bcb1	\N	cmm7kijlt000111fe6p8fx3q9	1		f88c840e-779f-4c90-b15c-66842d72971b
d0d76bc5-7daf-4d5b-bc6c-bf04ebb06d30	980a2582-3dbc-4d26-96ca-be0f4ae3a9f0	DINE_IN	1940	COMPLETED	2026-03-29 07:46:51.301	\N	f	86140c22-f356-4915-be67-132a0e99258a	94d6e522-c207-4fe8-9acb-5da5f48c585e	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
cf588f61-8849-4560-85de-a0ba6dea5865	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	DINE_IN	150	COMPLETED	2026-03-29 06:59:46.459	\N	f	a3f490a8-07bd-4d97-8eaa-b3ea0364f092	7e9a3c88-c057-4a34-9135-e2d8cac4e70d	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
1dada481-3634-4eee-af7f-fe6a0d51fb45	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	DINE_IN	175	COMPLETED	2026-03-30 05:50:39.369	\N	f	30d2abe0-5bf7-4c62-99db-3275df3dd642	cdcf0e08-60b7-493b-b243-a7e134860a40	\N	cmm7kijlt000111fe6p8fx3q9	1		\N
e4fc5fc8-710a-446f-a73f-137b3c5e05db	8b1b6b1f-1839-4641-9d6c-ea28f262a8d9	DINE_IN	450	COMPLETED	2026-04-08 06:34:06.224	\N	f	5222039f-f13e-4a9f-912e-8dd7b53b4a34	5e511ad4-f183-45ec-ac4d-638c5338da80	\N	cmm7kijlt000111fe6p8fx3q9	1		a106914f-f37c-4bb0-8c1c-4df0c19bfc74
da45cbd4-774d-436d-833b-5089be71acb0	980a2582-3dbc-4d26-96ca-be0f4ae3a9f0	DINE_IN	590	COMPLETED	2026-03-30 11:57:01.833	\N	f	cc49999e-c44d-43dd-b954-4bc1830a653d	f526a57c-25c6-4c7a-b7d1-de89db25d32e	\N	cmm7kijlt000111fe6p8fx3q9	1		eb45547d-3e64-4781-a4e7-58c66a9d2833
4455d53a-f107-4705-8d07-c77eb7e5de2f	\N	TAKE_AWAY	883	PENDING	2026-04-01 08:45:29.929	\N	f	\N	\N	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
2b3a4d8e-429f-4cb7-9fcf-38a2f99d6ae9	\N	TAKE_AWAY	883	PENDING	2026-04-01 08:45:30.588	\N	f	\N	\N	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
802d8748-50d8-48f0-b1ed-2a6bf295a200	\N	TAKE_AWAY	623	COMPLETED	2026-03-23 15:19:21.977	\N	f	feb7ee3e-91d6-48e5-b2fc-d5033ac2957f	\N	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
49a3c683-3d8b-4085-8a8f-2b143e756f09	\N	TAKE_AWAY	883	COMPLETED	2026-04-01 08:45:31.272	\N	f	98366d6d-2a73-4b35-91ee-7f6817fcc024	\N	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
fbae647e-338b-4e32-aa40-1310827e87a4	\N	TAKE_AWAY	883	COMPLETED	2026-04-01 08:45:31.614	\N	f	dab9ca99-ae7f-4cb3-9992-ff902450f39d	\N	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
1d8e0fbd-b927-487c-9d78-907e8e368209	\N	TAKE_AWAY	883	COMPLETED	2026-04-01 08:45:31.009	\N	f	5cbe0d6c-2602-4679-95f3-dcd0dd819691	\N	\N	cmm7kb82i0002ku1gbbh63hr0	1		\N
0429bf9b-c30b-4a8a-b620-31e4e51c2147	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	DINE_IN	300	COMPLETED	2026-03-30 06:08:25.795	\N	f	0986acd0-892c-4c37-b012-b8ee906ec728	49637432-0a64-4341-8c69-a543d944761b	\N	cmm7kijlt000111fe6p8fx3q9	1		eb45547d-3e64-4781-a4e7-58c66a9d2833
1df6d5b4-1e4f-4580-b172-184f948d8937	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	DINE_IN	5085	COMPLETED	2026-04-02 01:00:19.267	\N	f	c0b7b9fe-b84e-4ed6-9170-c831490be5a6	5c90dc18-a877-4801-b3a1-7129c6a00a8d	\N	cmm7kijlt000111fe6p8fx3q9	1		eb45547d-3e64-4781-a4e7-58c66a9d2833
53b7f79c-b144-4966-90a4-339df6959149	88391a93-eaa8-4e0e-a27b-fd8cb1478d8a	DINE_IN	150	COMPLETED	2026-04-03 02:46:38.477	\N	f	d41020b1-8c09-4f76-8e10-6e300818edcc	536d96d1-64e1-4627-9ae2-4d3b457fa346	\N	cmm7kijlt000111fe6p8fx3q9	1		eb45547d-3e64-4781-a4e7-58c66a9d2833
8240b265-58f1-406c-9192-31271ba60ad1	dd5d5a48-ff9e-43ea-a88d-450192cf2537	DINE_IN	40	PENDING	2026-04-04 12:06:27.093	\N	f	\N	a547495d-3fde-470c-b0f3-ad3c00ac79d3	\N	cmnka6xqp0001emd4z20d0lds	1		\N
a9bb3a39-5d94-4064-91ac-e62932d991bf	bf416ec2-8e42-4516-9ca6-8961492b4458	DINE_IN	120	COMPLETED	2026-04-05 06:05:55.598	\N	f	c9c3b588-0b82-466d-b5ab-e87a133b119b	c0375656-19d6-4347-8dec-601f23120284	\N	cmnlcvfo70002lt8xmmgez07z	1		1d29351f-6c43-43b2-87b8-2a588f36373d
517f361d-aa49-4f75-a67a-4c667e6d6dd4	bf416ec2-8e42-4516-9ca6-8961492b4458	DINE_IN	10720	COMPLETED	2026-04-05 06:29:25.838	\N	f	32271bbf-f184-4963-8262-7a86682a885e	af878a88-63c3-4267-ab65-438d447a5838	\N	cmnlcvfo70002lt8xmmgez07z	1		1d29351f-6c43-43b2-87b8-2a588f36373d
e5c54ab7-1733-4741-9769-e813b17a6522	bf416ec2-8e42-4516-9ca6-8961492b4458	DINE_IN	11700	COMPLETED	2026-04-05 06:31:13.305	\N	f	0c35c9bb-139b-41ef-98c8-74bc23280189	c2814292-f496-4e9b-9b9d-ba3209ef0f9d	\N	cmnlcvfo70002lt8xmmgez07z	1		1d29351f-6c43-43b2-87b8-2a588f36373d
2a5e55cf-a414-4e75-acea-bac590aed783	bf416ec2-8e42-4516-9ca6-8961492b4458	DINE_IN	2060	COMPLETED	2026-04-05 10:46:16.405	\N	f	3148d7b9-e9cd-4325-805c-348f806adcd4	b262e374-07f9-4041-b57c-8ec8ece07816	\N	cmnlcvfo70002lt8xmmgez07z	1		15a162f1-843c-4d0b-bb61-11993c9e50c7
7043133a-fc8a-4063-9245-b0a02b47c9b7	bf416ec2-8e42-4516-9ca6-8961492b4458	DINE_IN	60	COMPLETED	2026-04-06 12:52:04.913	\N	f	60fbc4d0-8c9d-4ebd-a430-01bf9bd2db00	47fc9c92-ae5d-46c1-a211-50cf1ab77e87	0d011ad7-ac05-4a1f-9fbd-80742f4972aa	cmnlcvfo70002lt8xmmgez07z	1		1476a7e3-4c10-4a48-b8ac-2440e42fb807
98a31681-9026-4fcd-88dd-4f093b9e4ab0	bf416ec2-8e42-4516-9ca6-8961492b4458	DINE_IN	60	COMPLETED	2026-04-06 12:51:59.423	\N	f	60fbc4d0-8c9d-4ebd-a430-01bf9bd2db00	47fc9c92-ae5d-46c1-a211-50cf1ab77e87	\N	cmnlcvfo70002lt8xmmgez07z	1		1476a7e3-4c10-4a48-b8ac-2440e42fb807
15653b43-7b06-4dc5-a3e6-9ba9a8699fc6	bf416ec2-8e42-4516-9ca6-8961492b4458	DINE_IN	60	COMPLETED	2026-04-06 12:52:00.036	\N	f	60fbc4d0-8c9d-4ebd-a430-01bf9bd2db00	47fc9c92-ae5d-46c1-a211-50cf1ab77e87	\N	cmnlcvfo70002lt8xmmgez07z	1		1476a7e3-4c10-4a48-b8ac-2440e42fb807
68c27001-7452-4e10-8e7d-ada386c3add9	8b27d168-361c-40b0-9d75-fc3585635e8a	DINE_IN	150	COMPLETED	2026-04-07 09:39:20.86	\N	f	611c612d-207d-4f85-91a8-1088988087d7	8a80b238-9d6f-43bb-9d7d-b91b0ce1e920	4488829b-72fc-4b6d-9cf3-b7a20f99a085	cmm7kijlt000111fe6p8fx3q9	1		f88c840e-779f-4c90-b15c-66842d72971b
23585b1b-f964-42d5-9056-46754c153577	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	DINE_IN	150	COMPLETED	2026-04-07 09:41:16.923	d641e12c-a637-4c31-9eb4-045893f3d142	f	fd3cabb3-3dfb-4633-8903-8be06c11c430	60d4f20d-a21e-4ab7-9b04-101b8eb8426e	\N	cmm7kijlt000111fe6p8fx3q9	1		f88c840e-779f-4c90-b15c-66842d72971b
fb1ab470-ab5e-4e58-84c2-9463c503398a	15511477-7788-47a7-9171-c6562425da72	DINE_IN	360	COMPLETED	2026-04-08 06:37:35.496	\N	f	09fb9ab4-44b4-4576-aff0-85ff6790406e	fb7a35fb-bc87-4b86-bd8b-855c605553ec	\N	cmm7kijlt000111fe6p8fx3q9	1		a106914f-f37c-4bb0-8c1c-4df0c19bfc74
cf82761d-0438-4c2c-8db7-deb796c956dc	d1f87f20-7913-41dc-b03a-4db6fd01dafc	DINE_IN	220	COMPLETED	2026-04-08 06:38:58.795	\N	f	c66f0bed-6c60-47a5-9d97-3293131c9adc	57fdb571-bc39-42ab-a574-e49ef7ed1775	\N	cmm7kijlt000111fe6p8fx3q9	1		a106914f-f37c-4bb0-8c1c-4df0c19bfc74
76608c4f-4e24-4b8e-bb7c-8a8b0612a869	88391a93-eaa8-4e0e-a27b-fd8cb1478d8a	DINE_IN	575	COMPLETED	2026-04-08 06:45:39.578	\N	f	5c0ad4e7-a5c0-4f11-bdc4-1b541849a3ea	13267c44-6243-409d-8390-b0f1f077fe78	\N	cmm7kijlt000111fe6p8fx3q9	1		a106914f-f37c-4bb0-8c1c-4df0c19bfc74
75f008fa-2ba0-4253-b101-9127c1206cd8	980a2582-3dbc-4d26-96ca-be0f4ae3a9f0	DINE_IN	815	COMPLETED	2026-04-08 06:41:58.862	\N	f	1ef5bd09-f24b-44f5-a028-d7e30c2b34d8	39c18f91-e87a-42c3-8634-98af1b5a3a53	\N	cmm7kijlt000111fe6p8fx3q9	1		a106914f-f37c-4bb0-8c1c-4df0c19bfc74
0586af10-22f8-4855-86f5-b612d396329c	8b27d168-361c-40b0-9d75-fc3585635e8a	DINE_IN	750	COMPLETED	2026-04-08 07:04:46.985	941d1381-cfb3-435c-8051-4a0813c67c96	f	74c0ac90-3493-403a-af33-a2ec6065c5f7	980e056a-b0f4-4464-afce-12829b1cff14	9c63bb2d-f340-41fc-87ef-9835e2307967	cmm7kijlt000111fe6p8fx3q9	1		a106914f-f37c-4bb0-8c1c-4df0c19bfc74
9cc77044-c962-41c2-9c00-b2885e5575c3	8b27d168-361c-40b0-9d75-fc3585635e8a	DINE_IN	150	COMPLETED	2026-04-10 09:52:52.734	\N	f	399be7a4-6760-4836-ab94-8d265023e155	025ac296-2857-4a1c-8196-a7951f420d08	9c63bb2d-f340-41fc-87ef-9835e2307967	cmm7kijlt000111fe6p8fx3q9	1		e95c98fd-f737-4650-ad49-abc7b29eb4f3
c44f98d3-3e55-4554-9bc7-c9a19285a012	8b27d168-361c-40b0-9d75-fc3585635e8a	DINE_IN	100	COMPLETED	2026-04-10 10:16:18.165	\N	f	2103d22c-7ed7-4f45-a0ef-5b2fa6cd1500	55b93113-f66b-4c17-ad23-da57928b19aa	\N	cmm7kijlt000111fe6p8fx3q9	1		e95c98fd-f737-4650-ad49-abc7b29eb4f3
0d7e69fe-9550-4c0e-8dc1-be95c972b23f	8b27d168-361c-40b0-9d75-fc3585635e8a	DINE_IN	150	COMPLETED	2026-04-10 10:19:07.792	\N	f	ac847946-7e65-4e6b-b648-ad0580946fc7	b0e9ad93-2a25-484f-8d84-20f198baf549	\N	cmm7kijlt000111fe6p8fx3q9	1		e95c98fd-f737-4650-ad49-abc7b29eb4f3
5b6d52c4-c2ca-4dcd-930c-fd6b845b5c07	d1f87f20-7913-41dc-b03a-4db6fd01dafc	DINE_IN	200	COMPLETED	2026-04-10 10:21:28.115	\N	f	f8aaa91a-7c0d-4c1c-a4c4-9dd4cecd3ad4	e1ec832f-ccb2-4fc8-b1f6-556ba4c1d8f4	\N	cmm7kijlt000111fe6p8fx3q9	1		e95c98fd-f737-4650-ad49-abc7b29eb4f3
63f42c2a-2daa-4379-aa02-b2bc33743b22	8b27d168-361c-40b0-9d75-fc3585635e8a	DINE_IN	300	COMPLETED	2026-04-10 10:23:10.196	d641e12c-a637-4c31-9eb4-045893f3d142	f	7184e318-de2b-4ce7-bfc8-0a052dc3abd5	4280e152-8d83-43cc-b5a4-4e490a3dd80d	\N	cmm7kijlt000111fe6p8fx3q9	1		e95c98fd-f737-4650-ad49-abc7b29eb4f3
f85f9176-94fa-4c37-bad3-193ccdfbc5e0	88391a93-eaa8-4e0e-a27b-fd8cb1478d8a	DINE_IN	840	COMPLETED	2026-04-10 13:15:13.971	\N	f	39a4a943-827f-44e3-9807-a245d2c34539	1efbcd23-5a7a-41de-959c-f0253d9bc75c	\N	cmm7kijlt000111fe6p8fx3q9	1		e95c98fd-f737-4650-ad49-abc7b29eb4f3
93225579-b065-40ec-858a-db02f410dfc2	980a2582-3dbc-4d26-96ca-be0f4ae3a9f0	DINE_IN	960	COMPLETED	2026-04-10 10:28:38.223	\N	f	1d01eb34-ccdc-4cf8-9ee2-c8ed8ab94414	3e97fbe0-8625-405e-8507-41ebe754764e	\N	cmm7kijlt000111fe6p8fx3q9	1		e95c98fd-f737-4650-ad49-abc7b29eb4f3
346dff86-489e-4531-bf56-16b7dd3d2615	d1f87f20-7913-41dc-b03a-4db6fd01dafc	DINE_IN	150	COMPLETED	2026-04-10 11:05:52.055	\N	f	2f882db5-eb4e-4bd9-906b-920897ca5932	26c69a46-1482-4b6b-8ce0-e7f784000651	\N	cmm7kijlt000111fe6p8fx3q9	1		e95c98fd-f737-4650-ad49-abc7b29eb4f3
322863e5-34b4-4cd6-8158-ab35a58213de	88391a93-eaa8-4e0e-a27b-fd8cb1478d8a	DINE_IN	150	COMPLETED	2026-04-10 11:08:52.888	\N	f	edc6f224-6f77-4636-bb57-5ce7f746e5be	f737ea66-10a4-492a-90f8-a82aa44dc1c2	\N	cmm7kijlt000111fe6p8fx3q9	1		e95c98fd-f737-4650-ad49-abc7b29eb4f3
34a0be6a-517c-4103-a818-996f39feb4aa	51085af7-c452-435a-9bcd-6038aba00da7	DINE_IN	150	COMPLETED	2026-04-10 11:10:14.494	\N	f	00daf569-36ca-4fcb-b66e-d5a87f635266	81d5f827-d97b-4c94-8d03-88e913c096e7	\N	cmm7kijlt000111fe6p8fx3q9	1		e95c98fd-f737-4650-ad49-abc7b29eb4f3
af890f53-e958-4ce2-94e5-303a52ac9fea	d1f87f20-7913-41dc-b03a-4db6fd01dafc	DINE_IN	50	COMPLETED	2026-04-10 11:11:30.606	\N	f	3c96b134-14a4-4c11-8562-3943acd80978	a313017f-9f22-4807-b79f-fe2c38e9ab0e	\N	cmm7kijlt000111fe6p8fx3q9	1		e95c98fd-f737-4650-ad49-abc7b29eb4f3
82405ff6-7fd1-4319-a178-747986f8b8b2	a60205e9-e82c-44a9-9428-51bdbce25776	DINE_IN	100	COMPLETED	2026-04-10 11:12:41.978	\N	f	0ad2b592-720a-4ff1-846c-1824490e3885	9112b463-e7d6-4f19-ae5d-e5364cba7a92	\N	cmm7kijlt000111fe6p8fx3q9	1		e95c98fd-f737-4650-ad49-abc7b29eb4f3
d86d8f2f-1113-47ea-b210-8fe8b28473c6	51085af7-c452-435a-9bcd-6038aba00da7	DINE_IN	480	COMPLETED	2026-04-10 11:16:24.517	\N	f	a2f8d138-3b88-4e35-b89a-8afa164f77cc	fbb0fdec-0615-4f1b-9e3c-b2b5f255788e	\N	cmm7kijlt000111fe6p8fx3q9	1		e95c98fd-f737-4650-ad49-abc7b29eb4f3
5793ca2c-0218-42c8-ae99-1f29c00480d7	ea658cd0-6791-4a60-b46f-75658968cdfb	DINE_IN	50	COMPLETED	2026-04-10 13:20:30.833	\N	f	e4ba26dd-af1f-416b-8762-68a56e4b5ba0	be5ce2fe-d9d2-476d-a552-001b43f95eb9	\N	cmm7kijlt000111fe6p8fx3q9	1		e95c98fd-f737-4650-ad49-abc7b29eb4f3
86823a16-d926-49c2-9aa1-2588322bcac6	8b27d168-361c-40b0-9d75-fc3585635e8a	DINE_IN	750	COMPLETED	2026-04-11 13:44:04.717	\N	f	ae18520e-c801-44d4-824c-278ec913c5be	2717ac8c-b739-4a96-9f2a-1cec3ed90d38	\N	cmm7kijlt000111fe6p8fx3q9	1		0c70cb42-ba56-45ec-a7e2-b794d41edc6e
3a21bcc5-58d8-440c-a918-5adbcf16df94	d1f87f20-7913-41dc-b03a-4db6fd01dafc	DINE_IN	270	COMPLETED	2026-04-11 13:46:25.985	\N	f	af1a1add-fa4e-4931-b9e7-6bc48d451d0e	e75d56a5-9a75-4d41-9ea0-1f4054dbd362	\N	cmm7kijlt000111fe6p8fx3q9	1		0c70cb42-ba56-45ec-a7e2-b794d41edc6e
685e6fc4-16ca-43fb-a154-6d099729204b	88391a93-eaa8-4e0e-a27b-fd8cb1478d8a	DINE_IN	900	COMPLETED	2026-04-11 13:48:11.302	\N	f	d66f7898-e447-484c-8ead-6467ea994a2d	e2d5e759-cb18-4071-9a99-6f0c0c589a34	\N	cmm7kijlt000111fe6p8fx3q9	1		0c70cb42-ba56-45ec-a7e2-b794d41edc6e
c8196bf5-7eb5-4c71-81a7-f721797ec555	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	DINE_IN	300	COMPLETED	2026-04-11 13:49:27.132	\N	f	37416500-e68f-46f5-9a3a-d9befbcddce9	519ffec8-4e48-474b-84c3-bfd639aa565f	\N	cmm7kijlt000111fe6p8fx3q9	1		0c70cb42-ba56-45ec-a7e2-b794d41edc6e
aff2727f-8d80-40a6-b895-13fe29d559bf	3aa90282-df15-4e32-8996-9f575e1226ef	DINE_IN	325	COMPLETED	2026-04-11 13:50:39.259	\N	f	bd7048c7-c2c9-417c-99fe-7442a2901701	a73f1c4d-c785-4dd8-81cb-444a65d13b9c	\N	cmm7kijlt000111fe6p8fx3q9	1		0c70cb42-ba56-45ec-a7e2-b794d41edc6e
2e7e463c-660b-4331-9334-370cc06510c8	d1f87f20-7913-41dc-b03a-4db6fd01dafc	DINE_IN	250	COMPLETED	2026-04-11 13:57:07.792	\N	f	104fddce-529f-4f10-936e-e27190f08a7c	eb856a3f-3ee1-488d-854d-7ca354dc1a09	\N	cmm7kijlt000111fe6p8fx3q9	1		0c70cb42-ba56-45ec-a7e2-b794d41edc6e
bd98298d-fb2b-496a-8b76-015ca4fd1b39	a60205e9-e82c-44a9-9428-51bdbce25776	DINE_IN	890	COMPLETED	2026-04-11 13:59:22.421	\N	f	0ee37798-bfd1-48ee-aca7-7982be3b0a00	89b00304-4449-4f11-9539-dba1fea5138d	\N	cmm7kijlt000111fe6p8fx3q9	1		0c70cb42-ba56-45ec-a7e2-b794d41edc6e
16abee62-c912-4a04-98a5-b37e0534ead5	88391a93-eaa8-4e0e-a27b-fd8cb1478d8a	DINE_IN	150	COMPLETED	2026-04-11 14:00:32.847	\N	f	34129f71-90c2-4e61-99a2-9dc1db4111bc	7659f3d3-5d0e-448c-a568-563251fc3f2b	\N	cmm7kijlt000111fe6p8fx3q9	1		0c70cb42-ba56-45ec-a7e2-b794d41edc6e
ea057f92-cbe8-40ff-8e3e-821d23099a8f	d1f87f20-7913-41dc-b03a-4db6fd01dafc	DINE_IN	1535	COMPLETED	2026-04-11 14:03:28.679	\N	f	dcb0af61-c499-479d-954f-ac0cd059700b	0af6b812-e3f1-4a6b-a603-6d5412ba8934	\N	cmm7kijlt000111fe6p8fx3q9	1		0c70cb42-ba56-45ec-a7e2-b794d41edc6e
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."OrderItem" (id, "orderId", "dishId", "comboId", quantity, "unitPrice", "totalPrice", remarks, status, "complimentaryQuantity") FROM stdin;
ad757e95-2201-4586-a7f3-8578adbafc2f	356a00ad-bb09-48ca-9b0d-59b58a6d5891	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	1	180	180	\N	PENDING	0
2f425c50-867e-4c29-9dce-5a86d2a15587	18bcf7f5-6fcf-46dc-8544-4b02052db78d	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
17c75877-4479-4aa9-b6cd-0002e04ca5ee	18bcf7f5-6fcf-46dc-8544-4b02052db78d	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
82273f19-f213-4366-b1ec-74ab5aa451c6	18bcf7f5-6fcf-46dc-8544-4b02052db78d	2902edeb-9187-47af-a173-89ee6d773a18	\N	8	150	1200	\N	PENDING	0
bebc6c01-e9fc-441c-b289-edb52e38a7bb	91e8a5ec-095d-413a-9475-cb1191cc3450	2902edeb-9187-47af-a173-89ee6d773a18	\N	3	150	450	\N	READYTOPICK	0
7d24c9e3-261e-41ba-bfb6-f5d9908b4f05	04fbf8b4-c842-4d1e-b4ca-80cedbfa00da	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
08187e5d-5c4a-43f0-92cf-009bed11eca4	f520d60a-a3f4-473b-8d59-1f931e55f301	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	1	180	180	\N	PENDING	0
f8e77c5e-5575-44cf-9963-e12ac8cf729c	7ad24679-5a13-423e-b11b-daac24bccf3a	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	4	180	720	\N	PENDING	0
b10ef6ba-a067-40ae-be81-a355263f7ca8	7ad24679-5a13-423e-b11b-daac24bccf3a	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	260	260	\N	PENDING	0
5372cce0-2969-4ba2-ae70-6d2f5dfc67c1	460a0c94-4b57-41f2-bdbb-f45a4a17b3a0	2902edeb-9187-47af-a173-89ee6d773a18	\N	3	150	450	\N	PENDING	0
96f25c36-a928-41da-83eb-4b04cf3d1cb7	460a0c94-4b57-41f2-bdbb-f45a4a17b3a0	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
3c8b3278-50d7-45bc-8a8f-c6f02f7035e7	0ee9c731-70ca-4997-8b45-81f555ccbcf8	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
233d71f3-5cd9-46bc-8f9e-6fb09eb4a5bd	72c22cdf-3f68-4c47-97d6-c6cfe0e7cae5	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	3	180	540	\N	PENDING	0
a47b246d-62a5-4fce-9aab-5d37f43dc1ec	72c22cdf-3f68-4c47-97d6-c6cfe0e7cae5	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	260	260	\N	PENDING	0
f6712fd6-08d2-43f1-b4a5-332f1361f26a	d76a2c45-0241-4441-b2e4-ba0e88c12293	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	2	260	520	\N	PENDING	0
1c1b741d-55ea-43b1-ac12-a18f41224ee0	d76a2c45-0241-4441-b2e4-ba0e88c12293	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	260	260	\N	PENDING	0
6e9a9bf4-3cae-4609-b2f7-c9367670e763	d76a2c45-0241-4441-b2e4-ba0e88c12293	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	3	260	780	\N	READYTOPICK	0
3dd14156-c461-469f-a210-5b0748084840	d76a2c45-0241-4441-b2e4-ba0e88c12293	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	260	260	\N	PENDING	0
dd7f6b81-14f6-49fc-ab56-b06fab67119b	d76a2c45-0241-4441-b2e4-ba0e88c12293	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	260	260	\N	PENDING	0
b8cbae7e-0d96-47d7-85f0-f200fad7edd7	d76a2c45-0241-4441-b2e4-ba0e88c12293	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	260	260	\N	PENDING	0
24e97bb1-0260-4948-bc9d-4030d14b86e3	83f9b16f-ebe5-43f4-8763-fea7d94a6345	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
a1267639-d160-452a-ad95-c9f641feddf3	d76a2c45-0241-4441-b2e4-ba0e88c12293	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	2	180	360	\N	READYTOPICK	0
35625f9e-8b05-4e0f-9c45-bcbb093c6f5f	d76a2c45-0241-4441-b2e4-ba0e88c12293	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	2	180	360	\N	READYTOPICK	0
4c25aceb-dcd2-43cc-91c5-b763bade635b	cbc6ddb8-379d-4395-8aa3-58cc5d418f09	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	1	180	180	\N	READYTOPICK	0
fb39cde6-692f-44a2-bdd6-531ddae9538b	cbc6ddb8-379d-4395-8aa3-58cc5d418f09	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	260	260	\N	READYTOPICK	0
d14a0a70-2264-481d-b21b-f3233ce24aba	d76a2c45-0241-4441-b2e4-ba0e88c12293	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	2	260	520	\N	CANCELLED	0
b866eb33-a86b-435d-8de9-621b00a6d70a	d76a2c45-0241-4441-b2e4-ba0e88c12293	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	260	260	\N	PENDING	0
5e06e312-e999-4243-a0c6-a1c14ae303d4	d76a2c45-0241-4441-b2e4-ba0e88c12293	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	260	260	\N	PENDING	0
29704347-2746-4f55-ac05-10b243a7a84c	d76a2c45-0241-4441-b2e4-ba0e88c12293	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	260	260	\N	PENDING	0
23e66b51-a074-4ca0-8801-137e2a8d0fed	d76a2c45-0241-4441-b2e4-ba0e88c12293	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	260	260	\N	PENDING	0
118551df-baab-4d9c-ab04-8dc9ca8e29b2	d76a2c45-0241-4441-b2e4-ba0e88c12293	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	260	260	\N	PENDING	0
a75acd36-7014-46e7-a59d-24208a768336	83f9b16f-ebe5-43f4-8763-fea7d94a6345	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
1e287e0e-213c-4751-ad2a-68e3ebf47513	e2c025ef-11f5-466c-ae53-e3df0fb559a4	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	363	363	\N	PENDING	0
1ab13064-9a53-4466-9e4f-0b6a4e1dfda6	cfcc285c-3961-4f90-9022-015706971f74	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	363	363	\N	PENDING	0
0712a024-86f7-4f9e-89ee-9b2fa0bc7d64	870d9576-bcff-4aaa-b8cf-cd3c9368ea63	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	READYTOPICK	0
5b79459c-ad1b-4882-a398-974503b3dcac	2dd63987-4c5e-4c97-a12f-1341fc64d2f5	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
06b7f1fc-39c0-4b07-a008-c7e89f65ebe4	83dc8249-bde4-4035-ab20-09fe5d682f02	f2b35900-f478-417c-8b38-a27a21f457f9	\N	1	590	590	\N	PENDING	0
d8fc7d98-c269-43dc-b798-acb63e388026	85386e4b-e806-4831-90d1-a8d6aece56ed	dc139f65-7a70-4c1b-b9ca-12e257f718b8	\N	1	850	850	\N	PENDING	0
8e2095d4-a2a4-45ed-9e3f-06a639270eeb	e2c025ef-11f5-466c-ae53-e3df0fb559a4	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	1	260	260	\N	PENDING	0
ae5c773a-7995-413a-926c-2b8d8209576f	cfcc285c-3961-4f90-9022-015706971f74	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	1	260	260	\N	PENDING	0
861c852d-2fa7-4569-a412-73b5255213ec	b55b5554-7f29-4f21-8e00-01b12f0d1c56	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	363	363	\N	PENDING	0
4e5533b9-8887-4cc1-84c7-3d9d92ff2bf7	49c5ff16-afc4-4012-9770-4cfd57196fc2	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	363	363	\N	PENDING	0
392940cb-c638-4b0f-9aee-8043eede9901	b55b5554-7f29-4f21-8e00-01b12f0d1c56	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	1	260	260	\N	PENDING	0
1c3137f5-0685-480c-b79b-c2062236387f	49c5ff16-afc4-4012-9770-4cfd57196fc2	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	1	260	260	\N	PENDING	0
8f2394e2-bde1-4dc4-9582-4a6945be0cf9	3fe9cbc3-81ca-4feb-8be8-4db8d9383337	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	363	363	\N	PENDING	0
0e49be0f-4bf3-4302-a5cd-cb7b598c345f	3fe9cbc3-81ca-4feb-8be8-4db8d9383337	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	1	260	260	\N	PENDING	0
7231f328-abb0-431f-80aa-50d57a688be1	d1251bc9-24fd-440e-8514-2b3765120e9a	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	363	363	\N	PENDING	0
e0113917-13b7-4fbc-95e5-8a2b7eb978eb	d1251bc9-24fd-440e-8514-2b3765120e9a	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	1	260	260	\N	PENDING	0
bcf0306f-d03f-4596-a31a-4e439d763f00	c8a06ce1-e9be-487a-81a8-3a2d0f5d46db	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	363	363	\N	PENDING	0
212be2e4-247f-4f71-a921-5332404d95c8	c8a06ce1-e9be-487a-81a8-3a2d0f5d46db	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	1	260	260	\N	PENDING	0
f48a9c0e-6461-4cd7-af01-e95f15c1489e	802d8748-50d8-48f0-b1ed-2a6bf295a200	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	363	363	\N	PENDING	0
7ff4a74d-7959-4b5d-b849-873444c29f2b	802d8748-50d8-48f0-b1ed-2a6bf295a200	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	1	260	260	\N	PENDING	0
97b2d237-c346-4c83-9966-4cb810162c07	63222fcc-93ae-445f-92dd-4dce9787e5ef	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	363	363	\N	PENDING	0
6857e92c-44cd-45c7-b2c6-2cec4f77733c	63222fcc-93ae-445f-92dd-4dce9787e5ef	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	1	260	260	\N	PENDING	0
eaadb441-5475-4278-bf81-6c1f9ae3cfd6	c21c7d45-6dd0-4017-a0d1-aec6a50a1d61	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	363	363	\N	PENDING	0
50ad56de-a8c5-45fc-9107-e5c54e8eaf8e	c21c7d45-6dd0-4017-a0d1-aec6a50a1d61	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	1	260	260	\N	PENDING	0
47902e7b-5846-4074-bb2a-67d982d34e04	915df846-d499-4401-ab34-623befa5f5a1	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	363	363	\N	PENDING	0
5ae5b711-a448-4512-9100-1613c9e37d47	915df846-d499-4401-ab34-623befa5f5a1	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	1	260	260	\N	PENDING	0
5f418b89-c325-4ab2-8f67-10abfa1a28b7	043315c0-3d22-4733-926a-1362f042ffc9	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	363	363	\N	PENDING	0
59bf9464-35d1-40a9-b4ac-76b55d5b7df6	043315c0-3d22-4733-926a-1362f042ffc9	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	1	260	260	\N	PENDING	0
eedb53b5-9c85-45af-a285-cf6a2e154ed1	d3879d02-f2f0-43aa-bcdb-0a77040b8074	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	363	363	\N	PENDING	0
59396c3f-7d6b-4b6c-8b49-b3f9470f41e1	d3879d02-f2f0-43aa-bcdb-0a77040b8074	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	1	260	260	\N	PENDING	0
730bdb6e-87cb-4e69-91fb-474baba698dd	5464ef14-403d-4879-a6c0-7240637680f7	2902edeb-9187-47af-a173-89ee6d773a18	\N	3	150	450	\N	PENDING	0
5e77733c-88fa-4000-81d4-f7c7eb279691	a3918a4f-3de4-4d61-96bc-64952f39091f	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
701b8cad-c297-4468-b7e7-594655a90ddd	ae3afa7e-cc88-4e9b-935e-095209c0e4dd	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
9ce3a6c8-ff11-4df8-840e-3f63c25a8173	d69e8a5c-adc2-4430-9331-bfe73e0aecd7	f2b35900-f478-417c-8b38-a27a21f457f9	\N	1	590	590	\N	PENDING	0
05ceaa07-e7bc-4d4b-bb3f-b337d874bd68	3bf741af-6236-497c-a093-90cef911ab57	f2b35900-f478-417c-8b38-a27a21f457f9	\N	1	590	590	\N	PENDING	0
77fd62a3-d08d-40e3-b3ff-c68ad158da78	3bf741af-6236-497c-a093-90cef911ab57	dc139f65-7a70-4c1b-b9ca-12e257f718b8	\N	1	850	850	\N	PENDING	0
93265041-41e0-4af3-a2b0-f70cb21cd75b	3bf741af-6236-497c-a093-90cef911ab57	e1f8cc47-aa0b-45ed-9bed-08e551184500	\N	1	500	500	\N	PENDING	0
b17d1846-9265-413c-a6d1-370ceca36c31	3bf741af-6236-497c-a093-90cef911ab57	53264545-0e07-4d4f-8c6c-e313c622b2a6	\N	1	590	590	\N	PENDING	0
c4339d4a-ab64-426e-be98-0ea762892f54	d7d692a8-f516-4dd8-b424-3b4d7af711be	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
fa5060a5-b344-437b-be18-d448ac515f97	d81be67b-31d2-4bd3-86fa-009b01482363	2902edeb-9187-47af-a173-89ee6d773a18	\N	2	150	300	\N	READYTOPICK	0
112cae23-a1c9-484c-9a77-defb81fab9f9	f4d4da9f-05d1-4ece-a7ad-68339e15841b	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	0	0	\N	PENDING	0
f5eed99c-0dc8-4361-a78c-155f9c81edf3	e480d2a3-415a-4d1a-9274-59466090bbc6	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	0	0	\N	PENDING	0
92d713fa-0304-41c7-a0b8-b897df5b7264	07d8a8bf-461a-49d6-a7d9-843a659c4d74	53264545-0e07-4d4f-8c6c-e313c622b2a6	\N	1	590	590	\N	PENDING	0
f7bebef5-512a-4590-aa40-e9653c2f38fd	c1eb0f6a-fb2b-4bb8-83b4-bee21282d0cc	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	0	0	\N	PENDING	0
6ab82af2-424f-4d74-8b23-92f64a7e94d1	71f20e9f-98b1-4d5c-af57-90bcf1cf013c	2902edeb-9187-47af-a173-89ee6d773a18	\N	2	0	0	\N	PENDING	0
d3e7c975-d42f-47fd-9eb0-b86caf5ef917	cf588f61-8849-4560-85de-a0ba6dea5865	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
0345d608-e53e-47d0-bece-d5a7629b6134	d0d76bc5-7daf-4d5b-bc6c-bf04ebb06d30	f2b35900-f478-417c-8b38-a27a21f457f9	\N	1	590	590	\N	PENDING	0
e47bca11-37d1-475b-9177-d11d30f0cbd8	d0d76bc5-7daf-4d5b-bc6c-bf04ebb06d30	dc139f65-7a70-4c1b-b9ca-12e257f718b8	\N	1	850	850	\N	PENDING	0
df9fdf16-ba61-405d-a5bf-ac3cd9494ac1	d0d76bc5-7daf-4d5b-bc6c-bf04ebb06d30	e1f8cc47-aa0b-45ed-9bed-08e551184500	\N	1	500	500	\N	PENDING	0
7754db96-618c-4cfb-8524-0784417eedf7	1dada481-3634-4eee-af7f-fe6a0d51fb45	7672cf98-cd74-4677-92b9-5e076a3ea64f	\N	1	175	175	\N	PENDING	0
bad5c53a-6082-4e78-9687-cd3aa47065a7	0429bf9b-c30b-4a8a-b620-31e4e51c2147	4f10f17b-6e3b-4a16-b9d0-b845cb07ce33	\N	1	300	300	\N	PENDING	0
368d42fb-5863-42e4-92e2-d27cba83f9bf	da45cbd4-774d-436d-833b-5089be71acb0	f2b35900-f478-417c-8b38-a27a21f457f9	\N	1	590	590	\N	PENDING	0
4efc2bfd-3ca2-41dc-992c-d8c607cabd3e	4455d53a-f107-4705-8d07-c77eb7e5de2f	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	2	260	520	\N	PENDING	0
75e00af5-16e5-4525-b741-6f50fda30925	4455d53a-f107-4705-8d07-c77eb7e5de2f	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	363	363	\N	PENDING	0
807eddd6-1322-448d-af16-0620b973b50f	2b3a4d8e-429f-4cb7-9fcf-38a2f99d6ae9	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	2	260	520	\N	PENDING	0
89cd207a-44bb-47f0-87db-b2a76b6b8972	2b3a4d8e-429f-4cb7-9fcf-38a2f99d6ae9	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	363	363	\N	PENDING	0
d8619274-53a7-44bf-a6b2-9bbba8956ba2	1d8e0fbd-b927-487c-9d78-907e8e368209	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	2	260	520	\N	PENDING	0
c740259c-32b3-4eb1-a517-2947183b48ed	49a3c683-3d8b-4085-8a8f-2b143e756f09	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	2	260	520	\N	PENDING	0
cf38adb5-8642-4187-8a68-1f867b4ca9ef	1d8e0fbd-b927-487c-9d78-907e8e368209	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	363	363	\N	PENDING	0
7c694eec-fb4b-46c9-b90d-ffd89626a66d	49a3c683-3d8b-4085-8a8f-2b143e756f09	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	363	363	\N	PENDING	0
6cd1efb4-74b9-4459-9cd1-c11e1eff3153	fbae647e-338b-4e32-aa40-1310827e87a4	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	2	260	520	\N	PENDING	0
107c217a-90a8-4584-b39e-6acd31803b09	fbae647e-338b-4e32-aa40-1310827e87a4	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	1	363	363	\N	PENDING	0
c0427af2-8931-4184-a7a7-284c7eb450ea	1df6d5b4-1e4f-4580-b172-184f948d8937	4f10f17b-6e3b-4a16-b9d0-b845cb07ce33	\N	5	300	1500	\N	PENDING	0
edfab4a9-9acc-4d0a-812a-9b525f9f88c4	1df6d5b4-1e4f-4580-b172-184f948d8937	7fe8e531-8fb4-4729-80c6-a99cdcb99955	\N	1	900	900	\N	PENDING	0
b82e77a0-227d-406e-934c-5587c36da240	1df6d5b4-1e4f-4580-b172-184f948d8937	f2b35900-f478-417c-8b38-a27a21f457f9	\N	1	590	590	\N	PENDING	0
77748d31-4564-474d-9b5a-6cf56cf6691f	1df6d5b4-1e4f-4580-b172-184f948d8937	2c220c0d-9aab-46dd-8ea1-1bb8dc359984	\N	1	595	595	\N	PENDING	0
7d66c9cd-55c1-491d-8c9d-1429abee11e5	1df6d5b4-1e4f-4580-b172-184f948d8937	f2b074b5-750f-4886-971f-4547771131da	\N	1	180	180	\N	PENDING	0
638b03f5-b922-45ea-8851-487a91761af5	1df6d5b4-1e4f-4580-b172-184f948d8937	696a89e5-c6cb-47e7-b427-467ce8616050	\N	1	295	295	\N	PENDING	0
6cc67a90-b62f-458f-b2f1-7790b64042fa	1df6d5b4-1e4f-4580-b172-184f948d8937	b04422b7-8c6f-4263-8ff1-09ed76e31761	\N	1	90	90	\N	PENDING	0
5b50d4fb-e4a2-4b1c-ab36-90aec469bc13	1df6d5b4-1e4f-4580-b172-184f948d8937	636dee1e-d8ea-4edc-a006-337df02fc0b3	\N	1	275	275	\N	PENDING	0
121762d5-8baa-4b89-9c49-df7452ad2893	1df6d5b4-1e4f-4580-b172-184f948d8937	696a89e5-c6cb-47e7-b427-467ce8616050	\N	1	295	295	\N	PENDING	0
dd3adff7-c613-4291-9770-b5ea8794afe3	1df6d5b4-1e4f-4580-b172-184f948d8937	b04422b7-8c6f-4263-8ff1-09ed76e31761	\N	1	90	90	\N	PENDING	0
d7f2eb9a-bc94-4c54-96df-8988a981236c	1df6d5b4-1e4f-4580-b172-184f948d8937	636dee1e-d8ea-4edc-a006-337df02fc0b3	\N	1	275	275	\N	PENDING	0
ffa92d30-b633-4490-9662-e6b27049eabb	53b7f79c-b144-4966-90a4-339df6959149	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
74d1319e-f40d-415a-85e4-a00d0fce6f34	91bdde52-094d-42f4-841d-09da1624247e	2902edeb-9187-47af-a173-89ee6d773a18	\N	2	150	300	\N	PENDING	0
20453fda-e2e6-428f-830b-39a9d9ea9ff2	8240b265-58f1-406c-9192-31271ba60ad1	19efd40d-48ee-40e6-b2c5-cf04048bfc89	\N	1	40	40	\N	PENDING	0
6eda7271-d6e0-46a5-9005-a4b11bf3bb5b	a9bb3a39-5d94-4064-91ac-e62932d991bf	dc66fea9-43c5-4006-b6d5-49af4a5e2f97	\N	1	60	60	\N	PENDING	0
5ddef067-71d4-48f9-af37-af20d8aec8a9	a9bb3a39-5d94-4064-91ac-e62932d991bf	61ef3fea-5769-4ae7-8540-ed331f016461	\N	1	60	60	\N	PENDING	0
98c9913f-ec4a-4741-8972-ef8dea5a10bb	517f361d-aa49-4f75-a67a-4c667e6d6dd4	dc66fea9-43c5-4006-b6d5-49af4a5e2f97	\N	27	60	1620	\N	PENDING	0
87a244e8-bf06-4eb1-8e72-348b8dccf22d	517f361d-aa49-4f75-a67a-4c667e6d6dd4	dc7abdf2-dea2-40d3-851f-2eeb47065db7	\N	26	350	9100	\N	PENDING	0
966216e2-58c3-44ea-b3c1-32d0be9fb47d	e5c54ab7-1733-4741-9769-e813b17a6522	61ef3fea-5769-4ae7-8540-ed331f016461	\N	20	60	1200	\N	PENDING	0
90525a0d-f8e4-4421-88f5-7a97e0e7a54f	e5c54ab7-1733-4741-9769-e813b17a6522	dc7abdf2-dea2-40d3-851f-2eeb47065db7	\N	30	350	10500	\N	PENDING	0
1ed7da32-7604-4e38-b03c-a0b6d03add19	2a5e55cf-a414-4e75-acea-bac590aed783	dc66fea9-43c5-4006-b6d5-49af4a5e2f97	\N	1	60	60	\N	PENDING	0
260a06a1-33f0-4f92-b9b6-cae16482ca81	2a5e55cf-a414-4e75-acea-bac590aed783	61ef3fea-5769-4ae7-8540-ed331f016461	\N	10	60	600	\N	PENDING	0
1950b28f-dd13-4720-83c9-e230d882967e	2a5e55cf-a414-4e75-acea-bac590aed783	dc7abdf2-dea2-40d3-851f-2eeb47065db7	\N	4	350	1400	\N	PENDING	0
f6fc89e2-20d2-46bb-bd75-9662a7825740	98a31681-9026-4fcd-88dd-4f093b9e4ab0	61ef3fea-5769-4ae7-8540-ed331f016461	\N	1	60	60	\N	PENDING	0
5aa97288-c81b-41ef-aae4-3db876c6f24b	15653b43-7b06-4dc5-a3e6-9ba9a8699fc6	61ef3fea-5769-4ae7-8540-ed331f016461	\N	1	60	60	\N	PENDING	0
c766c1b4-d165-4592-9c83-c62823d87d44	7043133a-fc8a-4063-9245-b0a02b47c9b7	61ef3fea-5769-4ae7-8540-ed331f016461	\N	1	60	60	\N	PENDING	0
a1463448-5c2c-4ea6-b32b-1171e3df5ba1	655559ff-9ef4-4479-89aa-01bb279ce664	61ef3fea-5769-4ae7-8540-ed331f016461	\N	5	60	300	\N	PENDING	0
1b6b8f76-d23e-43ee-ab0c-3b035fad7666	9db8bbd6-d3eb-40b9-a2c0-a8327ef6d213	61ef3fea-5769-4ae7-8540-ed331f016461	\N	5	60	300	\N	PENDING	0
655a9e25-4928-4ab2-bf04-21944f2b7461	dba757e6-eb35-4cbd-b1fe-d641df1f71ad	61ef3fea-5769-4ae7-8540-ed331f016461	\N	5	60	300	\N	PENDING	0
5477ce23-82b3-403d-be70-ce5c015ab7eb	68c27001-7452-4e10-8e7d-ada386c3add9	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
26fa3282-5503-4ee3-a0b7-a7902cdb33ad	23585b1b-f964-42d5-9056-46754c153577	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
36c1dfc2-5477-419b-bc34-daa56b9f911b	e4fc5fc8-710a-446f-a73f-137b3c5e05db	2902edeb-9187-47af-a173-89ee6d773a18	\N	3	150	450	\N	PENDING	0
e1100fce-6364-4f3e-acdd-2081fb1580b7	fb1ab470-ab5e-4e58-84c2-9463c503398a	dc5cbd92-fcd6-4f17-9887-e06a10a55a64	\N	2	180	360	\N	PENDING	0
27dcf9ca-3b44-4dd1-8567-4379891a8cb6	cf82761d-0438-4c2c-8db7-deb796c956dc	d8a37de8-4053-46e3-9ba3-87c50dea87d3	\N	1	220	220	\N	PENDING	0
8a75eb55-409d-4606-9853-dfda40bd418b	75f008fa-2ba0-4253-b101-9127c1206cd8	2902edeb-9187-47af-a173-89ee6d773a18	\N	3	150	450	\N	PENDING	0
c94cd286-ce2b-42b5-ae5a-4bce9a0845f0	75f008fa-2ba0-4253-b101-9127c1206cd8	c81021de-0d36-4f09-af81-06622fcf9a20	\N	1	175	175	\N	PENDING	0
e3426ce2-6c98-4852-80ff-27229fb8aae8	75f008fa-2ba0-4253-b101-9127c1206cd8	a3a43f16-4ab6-4ea0-b822-0662f2828d3c	\N	2	95	190	\N	PENDING	0
9871be99-f632-461c-bda8-9ec02a5f4973	76608c4f-4e24-4b8e-bb7c-8a8b0612a869	c26bd99c-d80d-42ce-8c0d-80ea7a050bee	\N	2	190	380	\N	PENDING	0
b5ef8b0f-111a-41b1-a23a-40f711bbc102	76608c4f-4e24-4b8e-bb7c-8a8b0612a869	568c69a6-ecce-4bff-8f5a-d46c623a9080	\N	1	195	195	\N	PENDING	0
c8030803-94af-4b15-95a4-2ab4cbb60dee	0586af10-22f8-4855-86f5-b612d396329c	2902edeb-9187-47af-a173-89ee6d773a18	\N	5	150	750	\N	PENDING	0
844ca642-06ba-4da2-a3b5-cdfda0379c04	9cc77044-c962-41c2-9c00-b2885e5575c3	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
2ed7d992-c363-4b80-8f9f-37330977a576	c44f98d3-3e55-4554-9bc7-c9a19285a012	e0c4d75f-ce9d-4d8a-9de0-72d0d0169621	\N	1	100	100	\N	PENDING	0
0166b065-ba30-48e9-ad7e-9b71b09f2911	0d7e69fe-9550-4c0e-8dc1-be95c972b23f	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
7fc1c941-14f8-4d54-a706-fd311b1b42d4	5b6d52c4-c2ca-4dcd-930c-fd6b845b5c07	e0c4d75f-ce9d-4d8a-9de0-72d0d0169621	\N	2	100	200	\N	PENDING	0
28196cf5-a60c-499a-9a0a-2b307df468fe	63f42c2a-2daa-4379-aa02-b2bc33743b22	2902edeb-9187-47af-a173-89ee6d773a18	\N	2	150	300	\N	PENDING	0
0ad67fc2-1e91-462f-a87e-9facc38c4c5f	93225579-b065-40ec-858a-db02f410dfc2	32fb18bc-0356-4a64-a3fc-f20513cbffb5	\N	1	120	120	\N	PENDING	0
a258ad48-200e-4531-9e43-517acf81dd63	93225579-b065-40ec-858a-db02f410dfc2	a1804e42-78a8-48a2-8cd8-2e71fe0e4c27	\N	1	295	295	\N	PENDING	0
a00ab013-5d82-4f84-8e5d-7dea29875565	93225579-b065-40ec-858a-db02f410dfc2	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
513a2cf2-0478-4762-abc7-815059297164	93225579-b065-40ec-858a-db02f410dfc2	a1804e42-78a8-48a2-8cd8-2e71fe0e4c27	\N	1	295	295	\N	PENDING	0
15300f3a-eb20-4c56-affc-4794dbe09d65	93225579-b065-40ec-858a-db02f410dfc2	5b346bdc-76d4-4032-9332-5b7bf5a09e8c	\N	1	100	100	\N	PENDING	0
8ba6c602-179c-4735-a9ce-84e2f34e97c0	346dff86-489e-4531-bf56-16b7dd3d2615	0fdbe404-3808-47ac-858c-fcfe51d52460	\N	1	150	150	\N	PENDING	0
92451f7b-7627-4084-a033-605bd571b2ed	322863e5-34b4-4cd6-8158-ab35a58213de	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
5f41862a-7fb5-4acc-b965-d1f82e23db4c	34a0be6a-517c-4103-a818-996f39feb4aa	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
fa39f67f-d02d-4aad-8632-a4264ed1161f	af890f53-e958-4ce2-94e5-303a52ac9fea	e80bdb04-fc46-4ffc-af43-a15674fbcdd3	\N	1	50	50	\N	PENDING	0
38353bdd-360a-4b7a-92f0-c2345abe0ae4	82405ff6-7fd1-4319-a178-747986f8b8b2	e0c4d75f-ce9d-4d8a-9de0-72d0d0169621	\N	1	100	100	\N	PENDING	0
3f14d8ed-096b-4831-a157-d41834b5b8c5	d86d8f2f-1113-47ea-b210-8fe8b28473c6	2902edeb-9187-47af-a173-89ee6d773a18	\N	2	150	300	\N	PENDING	0
647858bc-c99f-4348-afdc-f0abc340f016	d86d8f2f-1113-47ea-b210-8fe8b28473c6	e34eb1ba-a49b-43d1-b890-4a8c40bf42e6	\N	1	180	180	\N	PENDING	0
0673d97a-0f0f-452a-b1f9-6cb763c522dd	f85f9176-94fa-4c37-bad3-193ccdfbc5e0	e0c4d75f-ce9d-4d8a-9de0-72d0d0169621	\N	2	100	200	\N	PENDING	0
7e348991-847a-435c-82d7-5b58b11ec3ad	f85f9176-94fa-4c37-bad3-193ccdfbc5e0	35090232-f866-4d68-9e4b-79da5b35bf02	\N	1	200	200	\N	PENDING	0
63fc70e0-0f8b-400b-86fd-f8f8d643e48e	f85f9176-94fa-4c37-bad3-193ccdfbc5e0	d8a37de8-4053-46e3-9ba3-87c50dea87d3	\N	2	220	440	\N	PENDING	0
62912f5b-288b-446a-956a-bfef6ed68bc1	5793ca2c-0218-42c8-ae99-1f29c00480d7	e80bdb04-fc46-4ffc-af43-a15674fbcdd3	\N	1	50	50	\N	PENDING	0
528d8559-5a84-48b8-a930-c43ffd4baec1	86823a16-d926-49c2-9aa1-2588322bcac6	2902edeb-9187-47af-a173-89ee6d773a18	\N	3	150	450	\N	PENDING	0
202e97b2-c650-4763-adea-53a504298bdf	86823a16-d926-49c2-9aa1-2588322bcac6	0fdbe404-3808-47ac-858c-fcfe51d52460	\N	2	150	300	\N	PENDING	0
0834e982-0fa7-4aba-b116-96bb80d25d09	3a21bcc5-58d8-440c-a918-5adbcf16df94	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
0ae2fb9d-4e51-4523-9037-aeafea37b3c9	3a21bcc5-58d8-440c-a918-5adbcf16df94	32fb18bc-0356-4a64-a3fc-f20513cbffb5	\N	1	120	120	\N	PENDING	0
3d2d4f45-6dca-4cce-b539-46eec65b9179	685e6fc4-16ca-43fb-a154-6d099729204b	7672cf98-cd74-4677-92b9-5e076a3ea64f	\N	1	175	175	\N	PENDING	0
db2d6e44-4341-443f-8f0e-2951bece5938	685e6fc4-16ca-43fb-a154-6d099729204b	a90dec47-7286-439b-91bc-1ce147a0f397	\N	1	195	195	\N	PENDING	0
4c72d893-24a2-445a-ae36-bdb8bd9a517c	685e6fc4-16ca-43fb-a154-6d099729204b	15ca899e-b415-4b1e-8600-2edfc78dbd45	\N	1	380	380	\N	PENDING	0
dac46de7-a472-4141-9c37-c9e2f2a27d20	685e6fc4-16ca-43fb-a154-6d099729204b	a5845d7f-e71f-4ce5-9420-93af48f15109	\N	1	150	150	\N	PENDING	0
ed704b0d-63a3-4c04-8e2e-71d2248ea8ec	c8196bf5-7eb5-4c71-81a7-f721797ec555	2902edeb-9187-47af-a173-89ee6d773a18	\N	2	150	300	\N	PENDING	0
f12b264d-3894-4534-9f5a-7c777c398394	aff2727f-8d80-40a6-b895-13fe29d559bf	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
afb1074d-bc99-4c5a-a964-48ed4246d52b	aff2727f-8d80-40a6-b895-13fe29d559bf	7672cf98-cd74-4677-92b9-5e076a3ea64f	\N	1	175	175	\N	PENDING	0
38ba0461-400c-470a-b6e2-072f70016a63	2e7e463c-660b-4331-9334-370cc06510c8	e80bdb04-fc46-4ffc-af43-a15674fbcdd3	\N	1	50	50	\N	PENDING	0
9d180c74-147a-4be9-9b32-f5aa2e86538b	2e7e463c-660b-4331-9334-370cc06510c8	35090232-f866-4d68-9e4b-79da5b35bf02	\N	1	200	200	\N	PENDING	0
b29616cf-6673-473d-b126-a8c3a37cea6b	a3a84c9b-333f-4cd1-8836-c17a80ec6b71	bcca19b9-bfb1-4f09-9a1b-c06bba578ea2	\N	1	280	280	\N	PENDING	0
4b627ebe-857b-49f2-951c-401e4aba9b44	bd98298d-fb2b-496a-8b76-015ca4fd1b39	fa1462e4-b300-4316-aea0-1333d7740129	\N	1	250	250	\N	PENDING	0
637f923c-3a25-4ebe-a655-1e1f1d3cef45	bd98298d-fb2b-496a-8b76-015ca4fd1b39	8b49b262-0af8-4d53-9774-09180dac0130	\N	1	350	350	\N	PENDING	0
74aa3d6b-30e8-4992-8a56-f6fc31e73dc2	bd98298d-fb2b-496a-8b76-015ca4fd1b39	c005dfbf-a3b9-4c82-b9f7-fa6ea1240719	\N	1	290	290	\N	PENDING	0
be2a853f-b2b1-4d15-9473-49ae8efffb36	16abee62-c912-4a04-98a5-b37e0534ead5	2902edeb-9187-47af-a173-89ee6d773a18	\N	1	150	150	\N	PENDING	0
218904f3-fd8d-4d38-b4f0-98474cdbda51	ea057f92-cbe8-40ff-8e3e-821d23099a8f	fa1462e4-b300-4316-aea0-1333d7740129	\N	1	250	250	\N	PENDING	0
48425999-8182-48fc-954b-830b09dfa78f	ea057f92-cbe8-40ff-8e3e-821d23099a8f	0fdbe404-3808-47ac-858c-fcfe51d52460	\N	1	150	150	\N	PENDING	0
25764d49-c081-4426-b266-efb65045da38	ea057f92-cbe8-40ff-8e3e-821d23099a8f	83fac231-3baa-40d6-9496-38e86564162c	\N	1	220	220	\N	PENDING	0
80b45133-7d2c-4b63-974c-dfd6f6f3ee11	ea057f92-cbe8-40ff-8e3e-821d23099a8f	8b8a2541-3cfa-4a1a-ac88-a7b327b87020	\N	1	325	325	\N	PENDING	0
aaf2e9dc-4a00-41e6-932a-ac205e44faa8	ea057f92-cbe8-40ff-8e3e-821d23099a8f	696a89e5-c6cb-47e7-b427-467ce8616050	\N	1	295	295	\N	PENDING	0
8315ced7-30ef-4dc6-bd37-37fac461f932	ea057f92-cbe8-40ff-8e3e-821d23099a8f	23e4f428-3879-43ad-b5af-1e91ac45660d	\N	1	295	295	\N	PENDING	0
\.


--
-- Data for Name: OrderItemAddOn; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."OrderItemAddOn" (id, "orderItemId", "addOnId", quantity, "unitPrice") FROM stdin;
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Payment" (id, method, amount, status, "createdAt", "sessionId", "esewaRefId", "transactionUuid", "isDeleted", "storeId", "staffId", "dailySessionId") FROM stdin;
e166e4c7-8235-49a8-9ab4-da0e1fc7740d	CASH	1350	PAID	2026-03-02 12:14:23.743	7ced9b6b-7b5a-450e-98da-29d5ad7fe12e	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
c5d44921-22a6-43cb-afda-c43dd8b6fe0d	QR	450	PAID	2026-03-03 18:28:20.046	f5f633d0-49af-4fde-897d-589cf07d254a	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
203ffa8f-fa35-4df3-8c26-1ccf86d265b5	CASH	180	PAID	2026-03-05 17:33:41.48	cfaff52f-5760-46c6-85f2-2d6de967d618	\N	\N	f	cmm7kb82i0002ku1gbbh63hr0	\N	\N
368f4fb1-f91e-4033-9b0f-7a56f2a4f53c	QR	180	PAID	2026-03-05 18:09:16.488	5321dcdf-3721-4bed-b13a-61e62cf6123d	\N	\N	f	cmm7kb82i0002ku1gbbh63hr0	\N	\N
43f32094-e891-4a42-b3d1-394d139852ed	CASH	150	PAID	2026-03-06 06:42:06.705	56c758e8-e408-4fb5-9c87-d1bdd716ae6c	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
86a0ba87-a271-42d0-92a4-d5ea49b85c74	CASH	500	PAID	2026-03-06 10:52:35.364	0c1a6032-cd10-4a05-8831-a078cae66cd0	\N	\N	f	cmm7kb82i0002ku1gbbh63hr0	\N	\N
5dcd840b-5610-451c-afe0-e9eb5436085e	QR	480	PAID	2026-03-06 10:52:35.975	0c1a6032-cd10-4a05-8831-a078cae66cd0	\N	\N	f	cmm7kb82i0002ku1gbbh63hr0	\N	\N
7d4285a7-41a0-48b2-bb65-a2c24d075249	CASH	720	PAID	2026-03-06 10:58:31.648	af1a38ce-9a64-49df-98a5-86161dd840a4	\N	\N	f	cmm7kb82i0002ku1gbbh63hr0	3d37b2cf-a074-45b5-8edc-616a16637ad6	\N
49a9bba6-59bc-42fc-bb00-b40ee8dd3908	QR	150	PAID	2026-03-21 13:01:59.41	c4512671-d745-4517-b145-4af70ab7af5f	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
dbce9d70-c785-4ba5-a86a-4e48a24b8412	QR	600	PAID	2026-03-21 13:02:28.938	4837dac4-085b-4c3e-af3e-a2b1a8bb4f38	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
aa2b8c07-206a-404d-8c4b-61b6577217d9	CASH	200	PAID	2026-03-21 13:11:16.025	b1970bae-7989-443a-84df-140e503f48da	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
fd5775c1-6729-458b-831c-4b26eb977b5b	CASH	100	PAID	2026-03-23 06:50:19.247	ba389e4e-2012-4505-8707-1bfa26e8e500	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
c8b788bf-eee7-4087-bea6-1f0d8bb49dce	QR	50	PAID	2026-03-23 06:50:19.282	ba389e4e-2012-4505-8707-1bfa26e8e500	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
58413fb6-ed2f-49ad-9d5f-20b50b6ef400	QR	150	PAID	2026-03-23 08:30:39.186	96ac8b64-1d81-4919-8589-ed0c22aebf62	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
363d9fe7-7a60-4e9e-870e-15124ce34726	CREDIT	623	CREDIT	2026-03-23 15:55:40.43	\N	\N	\N	f	cmm7kb82i0002ku1gbbh63hr0	\N	\N
661fad87-50e6-4ed8-b959-5a4dd1fbfa9f	CREDIT	623	CREDIT	2026-03-23 16:13:50.259	\N	\N	\N	f	cmm7kb82i0002ku1gbbh63hr0	\N	\N
cf37f288-de84-4dd4-8cc5-4d717b3e18c3	CREDIT	637.5	CREDIT	2026-03-24 00:45:31.528	\N	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
d57b077f-61a4-49d3-8c2c-891340ee437a	CREDIT	442.5	CREDIT	2026-03-24 00:54:35.359	\N	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
5c1934b5-b5c6-476e-9ffc-1b217af51539	CASH	450	PAID	2026-03-24 14:00:29.725	b8cc8229-85e6-4418-b2b8-386c06bb8ffb	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
63fb3dd9-6562-44ff-a2fc-d79b65c867e6	CASH	150	PAID	2026-03-24 14:00:40.035	65e3bfa5-a2e7-4a6c-a45c-88ab22e87cbb	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
5b351d0c-43ff-4526-9b91-f89bd619aaaa	CASH	590	PAID	2026-03-27 12:06:06.103	\N	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
70ac16b3-d027-4e8c-af0d-25d495b70b98	CREDIT	150	CREDIT	2026-03-27 12:06:42.866	fe2f6f57-0d67-4273-9841-abb91c935548	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
dfe18fef-16bb-4cb6-b147-29415c605552	CASH	2530	PAID	2026-03-28 04:08:53.589	\N	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
4ff1d29a-700e-4bc4-8945-c1c97e526d72	QR	150	PAID	2026-03-28 04:09:04.158	0034cb45-b082-4892-825f-a759c4c2b345	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
5df00eb3-42ce-44f6-a2b4-54901d173692	QR	300	PAID	2026-03-28 11:45:26.075	1db95613-3b8b-4521-b417-48828d717f35	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
52760ca1-3b7b-4890-8019-db48b0241239	CASH	0	PAID	2026-03-28 11:49:18.332	28ea4a7f-c542-4325-8e66-9f132723e9bf	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
2b3357bb-791a-4120-85a7-9c97269e4cd8	CASH	0	PAID	2026-03-28 12:20:11.432	41aa14b1-1dd8-48a3-b6c1-b6827701cc73	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
c26a2740-6eb1-4781-9f93-46c3c915b8f0	QR	590	PAID	2026-03-28 12:25:17.216	83c1e40b-06f0-4d18-8220-c194985f0a71	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
662320ea-21f2-4f03-b52d-96c252169f58	CASH	0	PAID	2026-03-29 06:59:23.298	795ac5e8-9d62-4999-b413-c0d9501a95e4	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
29d56693-80dd-48ec-8fc2-928efd4a6ac3	CASH	0	PAID	2026-03-29 06:59:31.027	a5e544ff-a949-4b75-aaf5-c389483ae5b6	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
86140c22-f356-4915-be67-132a0e99258a	QR	1940	PAID	2026-03-29 14:10:14.811	94d6e522-c207-4fe8-9acb-5da5f48c585e	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
a3f490a8-07bd-4d97-8eaa-b3ea0364f092	CASH	150	PAID	2026-03-29 14:41:46.71	7e9a3c88-c057-4a34-9135-e2d8cac4e70d	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
30d2abe0-5bf7-4c62-99db-3275df3dd642	CASH	175	PAID	2026-03-30 05:51:02.988	cdcf0e08-60b7-493b-b243-a7e134860a40	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	\N
cc49999e-c44d-43dd-b954-4bc1830a653d	CASH	590	PAID	2026-03-31 18:18:27.76	f526a57c-25c6-4c7a-b7d1-de89db25d32e	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	eb45547d-3e64-4781-a4e7-58c66a9d2833
feb7ee3e-91d6-48e5-b2fc-d5033ac2957f	CASH	623	PAID	2026-04-01 08:44:42.742	\N	\N	\N	f	cmm7kb82i0002ku1gbbh63hr0	\N	\N
98366d6d-2a73-4b35-91ee-7f6817fcc024	CASH	883	PAID	2026-04-01 08:45:49.976	\N	\N	\N	f	cmm7kb82i0002ku1gbbh63hr0	\N	\N
dab9ca99-ae7f-4cb3-9992-ff902450f39d	CASH	883	PAID	2026-04-01 08:46:02.283	\N	\N	\N	f	cmm7kb82i0002ku1gbbh63hr0	\N	\N
5cbe0d6c-2602-4679-95f3-dcd0dd819691	CASH	883	PAID	2026-04-01 08:46:24.143	\N	\N	\N	f	cmm7kb82i0002ku1gbbh63hr0	\N	\N
c9c3b588-0b82-466d-b5ab-e87a133b119b	CASH	120	PAID	2026-04-05 06:06:18.958	c0375656-19d6-4347-8dec-601f23120284	\N	\N	f	cmnlcvfo70002lt8xmmgez07z	\N	1d29351f-6c43-43b2-87b8-2a588f36373d
32271bbf-f184-4963-8262-7a86682a885e	QR	10720	PAID	2026-04-05 06:29:47.336	af878a88-63c3-4267-ab65-438d447a5838	\N	\N	f	cmnlcvfo70002lt8xmmgez07z	\N	1d29351f-6c43-43b2-87b8-2a588f36373d
0c35c9bb-139b-41ef-98c8-74bc23280189	CASH	11700	PAID	2026-04-05 06:31:30.522	c2814292-f496-4e9b-9b9d-ba3209ef0f9d	\N	\N	f	cmnlcvfo70002lt8xmmgez07z	\N	1d29351f-6c43-43b2-87b8-2a588f36373d
3148d7b9-e9cd-4325-805c-348f806adcd4	CASH	2060	PAID	2026-04-05 10:46:38.712	b262e374-07f9-4041-b57c-8ec8ece07816	\N	\N	f	cmnlcvfo70002lt8xmmgez07z	\N	15a162f1-843c-4d0b-bb61-11993c9e50c7
60fbc4d0-8c9d-4ebd-a430-01bf9bd2db00	QR	60	PAID	2026-04-06 12:52:21.559	47fc9c92-ae5d-46c1-a211-50cf1ab77e87	\N	\N	f	cmnlcvfo70002lt8xmmgez07z	\N	1476a7e3-4c10-4a48-b8ac-2440e42fb807
c0b7b9fe-b84e-4ed6-9170-c831490be5a6	CASH	5085	PAID	2026-04-03 02:46:19.357	5c90dc18-a877-4801-b3a1-7129c6a00a8d	\N	\N	t	cmm7kijlt000111fe6p8fx3q9	\N	eb45547d-3e64-4781-a4e7-58c66a9d2833
0986acd0-892c-4c37-b012-b8ee906ec728	QR	300	PAID	2026-04-02 00:59:52.37	49637432-0a64-4341-8c69-a543d944761b	\N	\N	t	cmm7kijlt000111fe6p8fx3q9	\N	eb45547d-3e64-4781-a4e7-58c66a9d2833
1e1a9e47-c3cb-4e22-8b87-bc41d1c6eacd	CASH	300	PAID	2026-04-06 12:53:57.812	e5d70a3c-242b-4720-887d-134e06eb7393	\N	\N	t	cmnlcvfo70002lt8xmmgez07z	\N	1476a7e3-4c10-4a48-b8ac-2440e42fb807
74c0ac90-3493-403a-af33-a2ec6065c5f7	CREDIT	500	CREDIT	2026-04-08 07:06:13.679	980e056a-b0f4-4464-afce-12829b1cff14	\N	\N	t	cmm7kijlt000111fe6p8fx3q9	\N	a106914f-f37c-4bb0-8c1c-4df0c19bfc74
399be7a4-6760-4836-ab94-8d265023e155	CASH	100	PAID	2026-04-10 10:10:42.956	025ac296-2857-4a1c-8196-a7951f420d08	\N	\N	t	cmm7kijlt000111fe6p8fx3q9	\N	e95c98fd-f737-4650-ad49-abc7b29eb4f3
2103d22c-7ed7-4f45-a0ef-5b2fa6cd1500	CASH	100	PAID	2026-04-10 10:18:01.469	55b93113-f66b-4c17-ad23-da57928b19aa	\N	\N	t	cmm7kijlt000111fe6p8fx3q9	\N	e95c98fd-f737-4650-ad49-abc7b29eb4f3
ac847946-7e65-4e6b-b648-ad0580946fc7	QR	100	PAID	2026-04-10 10:20:05.653	b0e9ad93-2a25-484f-8d84-20f198baf549	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	e95c98fd-f737-4650-ad49-abc7b29eb4f3
f8aaa91a-7c0d-4c1c-a4c4-9dd4cecd3ad4	CASH	200	PAID	2026-04-10 10:22:07.306	e1ec832f-ccb2-4fc8-b1f6-556ba4c1d8f4	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	e95c98fd-f737-4650-ad49-abc7b29eb4f3
7184e318-de2b-4ce7-bfc8-0a052dc3abd5	CREDIT	300	CREDIT	2026-04-10 10:23:53.326	4280e152-8d83-43cc-b5a4-4e490a3dd80d	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	e95c98fd-f737-4650-ad49-abc7b29eb4f3
1d01eb34-ccdc-4cf8-9ee2-c8ed8ab94414	QR	960	PAID	2026-04-10 11:03:21.589	3e97fbe0-8625-405e-8507-41ebe754764e	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	e95c98fd-f737-4650-ad49-abc7b29eb4f3
2f882db5-eb4e-4bd9-906b-920897ca5932	CASH	150	PAID	2026-04-10 11:06:12.082	26c69a46-1482-4b6b-8ce0-e7f784000651	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	e95c98fd-f737-4650-ad49-abc7b29eb4f3
edc6f224-6f77-4636-bb57-5ce7f746e5be	CASH	150	PAID	2026-04-10 11:09:39.439	f737ea66-10a4-492a-90f8-a82aa44dc1c2	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	e95c98fd-f737-4650-ad49-abc7b29eb4f3
00daf569-36ca-4fcb-b66e-d5a87f635266	CASH	100	PAID	2026-04-10 11:10:46.041	81d5f827-d97b-4c94-8d03-88e913c096e7	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	e95c98fd-f737-4650-ad49-abc7b29eb4f3
3c96b134-14a4-4c11-8562-3943acd80978	CASH	50	PAID	2026-04-10 11:11:59.028	a313017f-9f22-4807-b79f-fe2c38e9ab0e	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	e95c98fd-f737-4650-ad49-abc7b29eb4f3
0ad2b592-720a-4ff1-846c-1824490e3885	QR	100	PAID	2026-04-10 11:14:21.277	9112b463-e7d6-4f19-ae5d-e5364cba7a92	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	e95c98fd-f737-4650-ad49-abc7b29eb4f3
a2f8d138-3b88-4e35-b89a-8afa164f77cc	QR	480	PAID	2026-04-10 11:16:43.772	fbb0fdec-0615-4f1b-9e3c-b2b5f255788e	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	e95c98fd-f737-4650-ad49-abc7b29eb4f3
39a4a943-827f-44e3-9807-a245d2c34539	CASH	756	PAID	2026-04-10 13:17:14.37	1efbcd23-5a7a-41de-959c-f0253d9bc75c	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	e95c98fd-f737-4650-ad49-abc7b29eb4f3
e4ba26dd-af1f-416b-8762-68a56e4b5ba0	QR	50	PAID	2026-04-10 13:20:45.275	be5ce2fe-d9d2-476d-a552-001b43f95eb9	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	e95c98fd-f737-4650-ad49-abc7b29eb4f3
5c0ad4e7-a5c0-4f11-bdc4-1b541849a3ea	QR	575	PAID	2026-04-08 06:48:14.088	13267c44-6243-409d-8390-b0f1f077fe78	\N	\N	t	cmm7kijlt000111fe6p8fx3q9	\N	a106914f-f37c-4bb0-8c1c-4df0c19bfc74
1ef5bd09-f24b-44f5-a028-d7e30c2b34d8	QR	815	PAID	2026-04-08 06:42:24.576	39c18f91-e87a-42c3-8634-98af1b5a3a53	\N	\N	t	cmm7kijlt000111fe6p8fx3q9	\N	a106914f-f37c-4bb0-8c1c-4df0c19bfc74
c66f0bed-6c60-47a5-9d97-3293131c9adc	QR	220	PAID	2026-04-08 06:39:38.154	57fdb571-bc39-42ab-a574-e49ef7ed1775	\N	\N	t	cmm7kijlt000111fe6p8fx3q9	\N	a106914f-f37c-4bb0-8c1c-4df0c19bfc74
09fb9ab4-44b4-4576-aff0-85ff6790406e	CASH	360	PAID	2026-04-08 06:37:52.776	fb7a35fb-bc87-4b86-bd8b-855c605553ec	\N	\N	t	cmm7kijlt000111fe6p8fx3q9	\N	a106914f-f37c-4bb0-8c1c-4df0c19bfc74
5222039f-f13e-4a9f-912e-8dd7b53b4a34	QR	450	PAID	2026-04-08 06:36:35.033	5e511ad4-f183-45ec-ac4d-638c5338da80	\N	\N	t	cmm7kijlt000111fe6p8fx3q9	\N	a106914f-f37c-4bb0-8c1c-4df0c19bfc74
fd3cabb3-3dfb-4633-8903-8be06c11c430	CREDIT	150	CREDIT	2026-04-07 09:41:32.173	60d4f20d-a21e-4ab7-9b04-101b8eb8426e	\N	\N	t	cmm7kijlt000111fe6p8fx3q9	\N	f88c840e-779f-4c90-b15c-66842d72971b
611c612d-207d-4f85-91a8-1088988087d7	QR	150	PAID	2026-04-07 09:39:31.392	8a80b238-9d6f-43bb-9d7d-b91b0ce1e920	\N	\N	t	cmm7kijlt000111fe6p8fx3q9	\N	f88c840e-779f-4c90-b15c-66842d72971b
52bc8c71-8140-42eb-b861-01f85cf35dce	CASH	300	PAID	2026-04-07 09:38:25.534	a3fdba39-b51e-4905-897a-27c344d4bcb1	\N	\N	t	cmm7kijlt000111fe6p8fx3q9	\N	f88c840e-779f-4c90-b15c-66842d72971b
d41020b1-8c09-4f76-8e10-6e300818edcc	CASH	150	PAID	2026-04-03 02:46:46.873	536d96d1-64e1-4627-9ae2-4d3b457fa346	\N	\N	t	cmm7kijlt000111fe6p8fx3q9	\N	eb45547d-3e64-4781-a4e7-58c66a9d2833
ae18520e-c801-44d4-824c-278ec913c5be	QR	750	PAID	2026-04-11 13:44:39.765	2717ac8c-b739-4a96-9f2a-1cec3ed90d38	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	0c70cb42-ba56-45ec-a7e2-b794d41edc6e
af1a1add-fa4e-4931-b9e7-6bc48d451d0e	QR	270	PAID	2026-04-11 13:46:35.394	e75d56a5-9a75-4d41-9ea0-1f4054dbd362	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	0c70cb42-ba56-45ec-a7e2-b794d41edc6e
d66f7898-e447-484c-8ead-6467ea994a2d	QR	900	PAID	2026-04-11 13:48:39.383	e2d5e759-cb18-4071-9a99-6f0c0c589a34	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	0c70cb42-ba56-45ec-a7e2-b794d41edc6e
37416500-e68f-46f5-9a3a-d9befbcddce9	QR	300	PAID	2026-04-11 13:49:46.653	519ffec8-4e48-474b-84c3-bfd639aa565f	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	0c70cb42-ba56-45ec-a7e2-b794d41edc6e
bd7048c7-c2c9-417c-99fe-7442a2901701	CASH	325	PAID	2026-04-11 13:51:07.963	a73f1c4d-c785-4dd8-81cb-444a65d13b9c	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	0c70cb42-ba56-45ec-a7e2-b794d41edc6e
104fddce-529f-4f10-936e-e27190f08a7c	CASH	250	PAID	2026-04-11 13:57:23.989	eb856a3f-3ee1-488d-854d-7ca354dc1a09	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	0c70cb42-ba56-45ec-a7e2-b794d41edc6e
50ae5c5b-5e1a-4e5a-8e81-313de3cc94ce	QR	280	PAID	2026-04-11 13:58:12.863	\N	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	0c70cb42-ba56-45ec-a7e2-b794d41edc6e
0ee37798-bfd1-48ee-aca7-7982be3b0a00	QR	890	PAID	2026-04-11 13:59:41.684	89b00304-4449-4f11-9539-dba1fea5138d	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	0c70cb42-ba56-45ec-a7e2-b794d41edc6e
34129f71-90c2-4e61-99a2-9dc1db4111bc	CASH	150	PAID	2026-04-11 14:01:04.149	7659f3d3-5d0e-448c-a568-563251fc3f2b	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	0c70cb42-ba56-45ec-a7e2-b794d41edc6e
dcb0af61-c499-479d-954f-ac0cd059700b	QR	1535	PAID	2026-04-11 14:03:56.394	0af6b812-e3f1-4a6b-a603-6d5412ba8934	\N	\N	f	cmm7kijlt000111fe6p8fx3q9	\N	0c70cb42-ba56-45ec-a7e2-b794d41edc6e
\.


--
-- Data for Name: Price; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Price" (id, "actualPrice", "discountPrice", "listedPrice", cogs, "grossProfit", "dishId", "addOnId", "comboId") FROM stdin;
c77094b3-e317-4c9f-b823-3ec3181052b0	260	0	260	0	260	\N	\N	\N
cee89abe-d201-47d4-8660-13ab72a6cac7	260	0	260	0	260	2235fa27-ca99-4a86-9345-cfdd1e445210	\N	\N
104b178d-4b74-4ab2-9dfb-840a59167327	200	0	200	0	200	35090232-f866-4d68-9e4b-79da5b35bf02	\N	\N
68038b44-75b6-4fe4-8684-e730a2a2cb52	363	0	363	0	363	ddd6d3f2-9029-458d-b1dd-46d5645f9e4d	\N	\N
1c602fc4-d0e2-4af0-883d-bbf697d22e45	590	0	590	0	590	f2b35900-f478-417c-8b38-a27a21f457f9	\N	\N
3a680025-c685-45b2-94a7-c457564726ba	850	0	850	0	850	dc139f65-7a70-4c1b-b9ca-12e257f718b8	\N	\N
ca30518d-27a3-4031-b358-ea7c285262b9	500	0	500	0	500	e1f8cc47-aa0b-45ed-9bed-08e551184500	\N	\N
67258526-513d-4892-8e51-2f62e4e60ad8	590	0	590	0	590	53264545-0e07-4d4f-8c6c-e313c622b2a6	\N	\N
365396db-e382-4959-94b0-6ffe22da653b	230	0	230	0	230	94ebd05c-11d5-4e1e-b1b4-8e7f9787922f	\N	\N
e1007cde-ddc6-4378-843b-6f18944dcc24	300	0	300	0	300	91c02f87-cb1d-4bdb-9cbd-373ff0e4075a	\N	\N
1ccc9169-7944-42bd-86bf-c0d7415c561e	380	0	380	0	380	15ca899e-b415-4b1e-8600-2edfc78dbd45	\N	\N
a80e40fd-ebf2-4ba2-9a2d-1d34051ef10a	335	0	335	0	335	513ec023-6989-4cb8-afd5-d9ba52b23aef	\N	\N
673cfc39-a53a-443b-a448-976aa0a29ceb	125	0	125	0	125	360b5fa0-d248-4181-b429-6e899d6ae2d2	\N	\N
73735ff5-f69c-4cef-af77-39f09f320e37	125	0	125	0	125	be6605f3-c30a-4c76-abac-d75e5964855b	\N	\N
f06d4745-db68-4c81-b400-a16aaef3cc41	175	0	175	0	175	7672cf98-cd74-4677-92b9-5e076a3ea64f	\N	\N
13aa9c13-25a7-47b7-bebc-02d950cd6bd7	190	0	190	0	190	c26bd99c-d80d-42ce-8c0d-80ea7a050bee	\N	\N
7b677355-8100-4f0c-ada5-b7e4a1144c16	215	0	215	0	215	f042ce1e-0ee5-4b27-9fc7-2b65e5200a69	\N	\N
8bc39d2a-f00f-4219-a193-edc80695916a	150	0	150	0	150	0abd5ade-a3f4-4c4c-9f6d-177fac646ce8	\N	\N
9689a221-1cae-4c42-85f9-448767b5576c	280	0	280	0	280	ffd570d1-6425-4f6c-ad3b-a57ca3341975	\N	\N
eda2b9f3-ea3a-4a35-84bb-792f7a4449c4	350	0	350	0	350	0a64784a-9de6-41b0-a044-cf93651c79b1	\N	\N
47525b3a-2d48-42be-b6c2-2499f189f8b5	150	0	150	0	150	2902edeb-9187-47af-a173-89ee6d773a18	\N	\N
8aa8d514-4b56-4f71-86b5-f245bdc83aab	220	0	220	0	220	72a48e6b-107b-443f-a635-8ec10f287b91	\N	\N
40a5c7c2-a734-4290-bc9a-b7c7daff44e3	175	0	175	0	175	7b8c9855-bbe0-423f-8a0d-13ea7660eeca	\N	\N
490f5b8f-c54c-4bea-ad96-8ddaff5f76cf	125	0	125	0	125	75f2944c-7088-49c4-a597-6f27438d08b6	\N	\N
c19351c2-7b6a-4705-9f39-ab3f810d5d41	175	0	175	0	175	b84f58ef-4512-4589-b866-08503d6be214	\N	\N
626a3f06-ccf3-4b04-8d9f-cd99139db32c	180	0	180	0	180	dc5cbd92-fcd6-4f17-9887-e06a10a55a64	\N	\N
19aed397-4169-4f9b-a0f9-e9cd87d75633	280	0	280	0	280	277dc67c-82bf-4e77-89f5-96713bbf6b0e	\N	\N
366fa312-4c2f-475f-8c4a-d0d68a21763a	200	0	200	0	200	5b7e473a-1220-4dfb-a7b5-6fe3540df3d8	\N	\N
9354421d-391a-4fe8-901a-e8f21abb61fc	220	0	220	0	220	8acd8f4b-bf0e-4934-b2f5-5e2f318d3b67	\N	\N
bbbbd4b4-7a6e-4da5-be67-34815069e496	250	0	250	0	250	ec405c03-3a8e-4ae5-b525-9554e4e80588	\N	\N
bf9c6e97-8dc4-4563-829d-9f3e99c4ae15	220	0	220	0	220	f5d85fbd-34d9-4456-8554-4e855ce503ad	\N	\N
77a04733-c213-4e99-adef-ae71607e83b1	200	0	200	0	200	653b6221-ef68-4bf0-8726-76cdafe4ca0f	\N	\N
56b49f19-0e85-4933-b039-9a90a804c13e	175	0	175	0	175	a0fef3c8-d473-4cb8-a504-e18c19dbd9f4	\N	\N
ffc8741c-32ea-47f9-9131-fa83e8703d3d	220	0	220	0	220	83fac231-3baa-40d6-9496-38e86564162c	\N	\N
35d5d091-d5d2-4292-89ba-0b62f1d7d623	300	0	300	0	300	b81b0b82-cc3f-40eb-864c-b29f95f93ed9	\N	\N
8f6d497f-8d24-4f10-b2b4-f40039ed8c6c	195	0	195	0	195	a90dec47-7286-439b-91bc-1ce147a0f397	\N	\N
0d207a3e-97dc-4928-9879-2f205b71d1f8	100	0	100	0	100	8c7a4f93-7856-43b6-943e-0b245f32b319	\N	\N
cac7ee52-53d4-41f3-99c7-39584e5fed5a	150	0	150	0	150	663c710f-5cf2-487e-8890-f76ec75bcbe3	\N	\N
b258383c-68b2-4aef-80a4-6fa9dc826fbd	150	0	150	0	150	f7344287-79da-41b7-822a-937c2a412a4a	\N	\N
b8214f10-9833-4577-977b-21cb49ecab8b	85	0	85	0	85	f8a808ee-6e22-4b5c-a96c-d6c37b097367	\N	\N
0241add1-edf0-463a-bb3a-23ded03bb19f	90	0	90	0	90	b04422b7-8c6f-4263-8ff1-09ed76e31761	\N	\N
69eaedfa-fd95-4f39-b213-47f0efac36eb	50	0	50	0	50	c4b8d126-210f-47d7-805d-ae212b27a159	\N	\N
807dade3-d356-4a73-b220-0fbb4f5de0be	250	0	250	0	250	fa1462e4-b300-4316-aea0-1333d7740129	\N	\N
2296fe06-6a43-4051-8c9e-6093c52c269b	140	0	140	0	140	90c22876-2026-4b38-bd17-b5c6bfceec69	\N	\N
9fdd7700-3c17-4cd7-b9ab-38b3bf86d6c8	170	0	170	0	170	02dd1b15-b3dd-472c-b440-2564212ffd3a	\N	\N
24b5d149-a076-41c0-828e-a1b2417598dd	295	0	295	0	295	acf02252-d148-46da-a861-7865338912ed	\N	\N
c34d4389-d610-43cd-b863-be3862f4cc68	200	0	200	0	200	c9344261-217e-4699-955c-6452bf036fa5	\N	\N
d6d2176a-27a5-4e42-8e25-eb2fcee16b0c	250	0	250	0	250	c800ad98-4177-4bfd-8f5b-32e6777ba85b	\N	\N
12c33e41-3a33-4bfd-9769-e537bb5d2f3d	250	0	250	0	250	26627435-aeca-44ce-9b96-0c7ac9be76bc	\N	\N
c1643638-3d52-49a3-97dd-2cff4e5a60dc	295	0	295	0	295	4cdbcc79-6173-4649-8cdd-7abea45be296	\N	\N
a54c75fe-6809-4fc1-9a5c-de8a53a8e090	50	0	50	0	50	d50c80db-ceb5-456b-9b07-93840d195265	\N	\N
78a97dbb-59e0-4f30-b7f6-eebefca3e835	175	0	175	0	175	b911a839-f357-454c-a394-9d01f8b2f7e8	\N	\N
2ef140b8-d83f-4c2d-ae7e-afaf478d10ba	120	0	120	0	120	32fb18bc-0356-4a64-a3fc-f20513cbffb5	\N	\N
d0caaf39-fe42-4028-bed8-3f68d925b6b0	350	0	350	0	350	6a1f8e93-53c9-4b0b-b338-234dfca892e7	\N	\N
790eec8b-b52c-4916-90bc-61f535558e86	350	0	350	0	350	9a0a811f-500d-428d-ae6a-7bb03dbab3fa	\N	\N
e5cf29a9-ff59-4177-b683-d151a866b3a7	310	0	310	0	310	c0a00c74-d081-4b96-97d8-308a4b543922	\N	\N
16412b3f-bd35-462b-aca2-64c2ed3916b8	280	0	280	0	280	ca072fe0-9a08-4b97-aaa3-642682f84c37	\N	\N
48a23987-dd3f-4f2b-b367-104b7df4b6cb	250	0	250	0	250	39d48abd-7eeb-48b9-9326-6c4403c077d3	\N	\N
df729198-af7a-45ba-8a71-9391aeb48021	100	0	100	0	100	e0c4d75f-ce9d-4d8a-9de0-72d0d0169621	\N	\N
5a459d59-1325-4bf4-a371-b35e6b945bd9	100	0	100	0	100	eb983157-5e01-4753-9bc5-f558e756151f	\N	\N
5d351d15-cd47-4622-bca9-325e31613211	175	0	175	0	175	c81021de-0d36-4f09-af81-06622fcf9a20	\N	\N
992ebb21-7b4c-4058-84e4-7b647ed79076	50	0	50	0	50	e80bdb04-fc46-4ffc-af43-a15674fbcdd3	\N	\N
ce022b2f-a52c-4201-8a68-3a668ac8758e	70	0	70	0	70	70d8f4b7-e5b3-4ca5-b998-d085e787638c	\N	\N
b7c22538-76ae-4989-8387-ddf73c1fd4cf	195	0	195	0	195	1734a148-9333-4175-8534-edde0320f45f	\N	\N
621ebb54-e877-4100-976b-fa5843232b8c	45	0	45	0	45	159d8015-982b-488a-9425-1c525c11281b	\N	\N
0ee70fa1-b22e-43ef-a63e-72406ea717d3	100	0	100	0	100	5b346bdc-76d4-4032-9332-5b7bf5a09e8c	\N	\N
af5a4e51-50ca-4a61-b84c-fffee37eab08	150	0	150	0	150	0fdbe404-3808-47ac-858c-fcfe51d52460	\N	\N
9e09f583-30d1-4f20-a0c7-5d0a36891abc	350	0	350	0	350	225c0466-3753-426a-a214-42288d5b4257	\N	\N
ba528774-9f40-40da-817d-d7da8c3beda0	220	0	220	0	220	d8a37de8-4053-46e3-9ba3-87c50dea87d3	\N	\N
d58832ad-be84-4387-8e80-85d2ef320da3	180	0	180	0	180	e34eb1ba-a49b-43d1-b890-4a8c40bf42e6	\N	\N
d724057f-a691-4524-995e-341feaf0ba2d	250	0	250	0	250	05149e4b-a857-44bb-9b80-d55b0410c431	\N	\N
2990e32e-08c8-4cc6-a16b-1db9573bec4b	210	0	210	0	210	ca4c82ad-b840-458a-82ab-8ce53def3db3	\N	\N
7ebd7c56-0991-4bd2-8a17-32e6e75377bd	300	0	300	0	300	097f421e-3f71-4061-a7ed-4cd1ae29ede7	\N	\N
249e76a4-0827-4654-a596-3511f9bd1d50	280	0	280	0	280	e8de9cb4-1ceb-49a5-a7e0-086f43d68d2f	\N	\N
cf36424d-62d9-43fc-bdb9-a0af5f7d8441	595	0	595	0	595	2c220c0d-9aab-46dd-8ea1-1bb8dc359984	\N	\N
79530f08-9275-478e-89d2-11370506f7a6	195	0	195	0	195	568c69a6-ecce-4bff-8f5a-d46c623a9080	\N	\N
26c708c5-964e-4b7c-a7f7-ca105f0c83be	315	0	315	0	315	9ba8cd96-b5c2-4ea2-963c-681391855903	\N	\N
8fac1399-dbef-4f78-8bd6-c3df7ffd2c46	345	0	345	0	345	7d37f070-3e96-4bf5-b517-1e1a2ddcbbb0	\N	\N
54117cdb-4c02-45d6-a53e-cf502acfd4f1	295	0	295	0	295	648ecf49-b848-4c1a-a57e-8cc5b5709d75	\N	\N
d1560b38-9324-4b99-a677-959060d5ebfe	335	0	335	0	335	0d5c1352-af88-4576-96fb-f566f08ebe71	\N	\N
d75aa3a6-155d-4f86-bcc9-2679057f7fda	350	0	350	0	350	fad8ac12-0aa5-452d-a634-541df2feb1e8	\N	\N
68e348d6-549d-493b-a0c0-0d81a93a46d1	350	0	350	0	350	f7c5be7c-0aa6-4881-8b96-4540281a96c5	\N	\N
6ce9a552-569b-4326-b728-44925ef008be	395	0	395	0	395	a93ea9ee-aebe-4a57-85cc-99d94f7dbe62	\N	\N
d26f9471-cd0c-4e66-80e1-4c7292c26d7a	350	0	350	0	350	8b49b262-0af8-4d53-9774-09180dac0130	\N	\N
524ee4b4-e519-4f29-870f-d36dca66def7	275	0	275	0	275	636dee1e-d8ea-4edc-a006-337df02fc0b3	\N	\N
f6513611-9631-4b0b-89c1-d8b41ef7367f	295	0	295	0	295	c78283e8-dc79-494c-b6b5-21b1073876ee	\N	\N
f25fc5d7-9ba7-463c-bdba-d1bb54d3be88	295	0	295	0	295	23e4f428-3879-43ad-b5af-1e91ac45660d	\N	\N
4ba909bd-f6dd-446e-8815-094b285eb8cd	250	0	250	0	250	ea4ebd6f-c319-4f28-97e0-d1d8c0ad9b34	\N	\N
68cfc35b-81ef-416a-a71d-9387edc5a62c	230	0	230	0	230	689aa7f6-9cfe-465e-a485-9d2f8745e16f	\N	\N
1cd30198-5f3f-4ce2-9a27-5b0c1eb5bc05	250	0	250	0	250	f47a9452-158f-4ea2-8371-6da4d9ba4a18	\N	\N
5007ff3d-4401-4737-b98d-3e756589289c	295	0	295	0	295	696a89e5-c6cb-47e7-b427-467ce8616050	\N	\N
ed6c0bf6-be5d-40fb-9355-f3ede6c60864	325	0	325	0	325	8b8a2541-3cfa-4a1a-ac88-a7b327b87020	\N	\N
ae1dc810-ae8d-45cd-ae17-edca858f9539	250	0	250	0	250	9b535db0-2092-4f34-8391-a3d7c6edd5b9	\N	\N
a52acb70-37c1-4936-86a2-3bbf02e0d4c2	295	0	295	0	295	a1804e42-78a8-48a2-8cd8-2e71fe0e4c27	\N	\N
a0ed31d6-2007-4d83-a490-b84e10932711	150	0	150	0	150	363ed91d-a74a-428e-8928-b879581f7750	\N	\N
35a897a8-a9af-40b0-9878-5060c0db1a0c	150	0	150	0	150	a5845d7f-e71f-4ce5-9420-93af48f15109	\N	\N
52689b57-af3a-4c4c-bfac-a3c346bbc84b	70	0	70	0	70	689a24ed-04ca-4cff-95df-4493552a6531	\N	\N
c9e75d06-e9ed-479f-afeb-c161047f7f17	280	0	280	0	280	bcca19b9-bfb1-4f09-9a1b-c06bba578ea2	\N	\N
d798a381-fa92-4a86-ba76-6747ab70d213	95	0	95	0	95	a3a43f16-4ab6-4ea0-b822-0662f2828d3c	\N	\N
cfbf9dbb-a8ab-4c11-bca3-b63eb973cb1d	15	0	15	0	15	50cf10e0-7f25-4024-b02e-0d8376acd294	\N	\N
68a91db8-d663-4911-acfc-075c1288d0de	75	0	75	0	75	2c70fda1-b5a0-44fe-87bc-c70a0c75b120	\N	\N
7a0b4170-cfa2-461d-ba99-f21615459473	190	0	190	0	190	595f2006-73a9-4e39-944a-dd92fe423a72	\N	\N
98f87636-86c4-4d75-8236-9c42f67c2493	125	0	125	0	125	2d22351a-f309-44b1-a8a9-d198d218a8e6	\N	\N
a336d4c0-83f0-441b-86f0-0083ffb9b75f	35	0	35	0	35	d9cf0fcc-93bb-4d1b-8285-ecd9ee3ff914	\N	\N
77a376b7-a0b1-44fd-8b92-3b162cb9975a	100	0	100	0	100	8414f37e-0e30-4a58-a1e6-41c6c826ba86	\N	\N
5d5090d8-2a2b-46c9-a786-48c544df0468	180	0	180	0	180	f2b074b5-750f-4886-971f-4547771131da	\N	\N
573a4411-01f2-42ac-b052-a69de6ea17e5	250	0	250	0	250	5c52bb2f-280e-403c-b69c-5303ef88b793	\N	\N
bff0f0ee-a131-4222-af5d-d6b1acd0f64b	250	0	250	0	250	8887738d-e6e9-46fb-85b9-df79782a47b8	\N	\N
3af5b84f-3805-46b8-a5c6-908b5eaa965a	350	0	350	0	350	3c5d8566-9e5a-4d80-a108-0a375b4bc813	\N	\N
4e731f92-5665-4df3-a862-0c8aafb55f27	280	0	280	0	280	d7886085-ef8d-456f-8249-4120e5718210	\N	\N
8822aa48-360c-4cfe-9a35-3617b11ed90f	250	0	250	0	250	d32f13fe-fefa-41d3-947f-7a63d51d3add	\N	\N
ddaa97cb-84ce-4d1e-9cc5-a957a534663a	300	0	300	0	300	64dbf16f-7ea2-4dd3-bfa7-6fbaf1617242	\N	\N
a42dfcb7-c9d9-4cf1-a5ce-5ae4b50f69fc	295	0	295	0	295	802909f8-7bcc-4d97-9360-aa57787edcba	\N	\N
ad1e0c2d-5549-4dbd-9f73-dace46d57306	220	0	220	0	220	828bbb41-373e-450a-985d-e30829710fad	\N	\N
0a9c3533-ba65-4e17-9639-40e3874bbf8a	290	0	290	0	290	c005dfbf-a3b9-4c82-b9f7-fa6ea1240719	\N	\N
37e445c7-7119-4eb9-8407-e51d0939d2de	170	0	170	0	170	0209b863-e624-410d-9886-9d5fbcd529fe	\N	\N
8c53691d-bb72-498e-8dca-56313fbc4c39	300	0	300	0	300	4f10f17b-6e3b-4a16-b9d0-b845cb07ce33	\N	\N
894189b3-18f7-40dd-b7b7-8e1f275da10d	270	0	270	0	270	c7f1aca1-28e2-4da1-a77d-4b87757ddc01	\N	\N
7839c8ea-b6e2-4f5b-82c6-514e46936bb6	60	0	60	0	60	9460f6b3-102d-4780-8a7b-0499cd8541c8	\N	\N
11051223-b1bb-43cd-b273-b7d1b8ec6444	360	0	360	0	360	639fb067-777d-48f4-90a8-e5f5a2276aba	\N	\N
dd961689-ca79-49d6-9867-db596c33f1a3	380	0	380	0	380	cf856af7-6ef2-4aca-aa25-75ba69a3a463	\N	\N
9199498f-234d-4122-8411-fa2ece965734	550	0	550	0	550	fb27fac5-cdc1-4f73-b14d-76192753cc98	\N	\N
873e0ec7-49c4-4944-8e24-ca964106f8ec	450	0	450	0	450	fbd0c4f2-b5a7-4e1f-b1fe-f6a53e29ae77	\N	\N
4fe401d6-5d02-4171-8174-3684cf65135d	350	0	350	0	350	0067380c-ed75-4cd1-b7a4-9e4f4c6917f3	\N	\N
18e7c16c-f412-4bf0-9a60-25d78d90b4a0	450	0	450	0	450	0e21d172-67bb-42e7-88a7-b85a2c38c928	\N	\N
0f3ed625-3513-4601-9690-70127bb42861	450	0	450	0	450	732cc04f-ef5e-4bce-b3d6-bb8d08db6b8f	\N	\N
4cd8555c-8861-48d4-ae80-1418c13c442b	550	0	550	0	550	c08a2e57-db8c-4497-b01b-045c0d5815c7	\N	\N
eb8357e5-314a-4447-b940-41d098d3a2ad	450	0	450	0	450	133b3dc3-5be5-41ae-b16e-43e4b97f33c1	\N	\N
7a67f2f3-a690-42b0-867e-0709cee32cc8	350	0	350	0	350	a7c866b2-a466-4f48-9151-463ecf38b45d	\N	\N
4d7807f7-efd2-4489-8276-8fed0a255feb	480	0	480	0	480	33abb7b2-8c5e-44e9-addf-6b28ecbf0d50	\N	\N
ce2b2b1f-1a71-4bcc-9cdf-26b8832fd55a	580	0	580	0	580	1b235649-33f9-4eda-98c7-413ac9212d8d	\N	\N
571d6535-bbfc-4a1a-a308-790c278048f7	600	0	600	0	600	40698626-a629-47a5-8c0d-6b29050a2080	\N	\N
64b00ff7-9f53-4d6c-a976-a3e240baef98	480	0	480	0	480	2ffcfc59-0251-4531-9da0-36d3bcc8ae7f	\N	\N
33b551c3-a746-4fa1-82d9-6d9434e3e47d	450	0	450	0	450	f7c8a581-89c4-408b-a81b-a653b97cba28	\N	\N
b872fcc7-c419-4524-88e0-e56170c3b5e1	450	0	450	0	450	155e7a62-899d-45f0-9345-aeb8c26abe87	\N	\N
f807dca0-83ac-4dd1-863a-64116e287118	350	0	350	0	350	dbb9f2db-68b6-4792-a565-019d2ee195ea	\N	\N
d0b2c14f-bc2c-4218-ae44-7178563d2925	900	0	900	0	900	7fe8e531-8fb4-4729-80c6-a99cdcb99955	\N	\N
51a9fb59-e803-4ea0-9e14-e682eb21de3b	380	0	380	0	380	2b9020f1-2a11-4274-bdbf-771f8de09e01	\N	\N
b97625d1-f7cf-428a-9803-5c4098260ca1	350	0	350	0	350	53c59df7-3499-4bab-b75c-98d0f48a1e41	\N	\N
a70e44e1-7993-4e57-aa41-87cb4e254d0c	380	0	380	0	380	0c6c2af6-3495-4303-8e83-d30f08a160ac	\N	\N
bc3e7c1e-df79-4684-a99e-c56ccca7d852	300	0	300	0	300	c0355621-9d63-4e4f-a5e0-b4a2961bfc9b	\N	\N
b8e65664-ca1b-43fa-880b-03691fd8b860	480	0	480	0	480	e4ec151e-870c-4410-bd79-50ce6bd7c5cd	\N	\N
3d6c5d8d-5abf-4cca-a4bd-0fed7aefcc70	300	0	300	0	300	cb3cfaf2-8461-4a21-8c5c-3ef3ab320e1a	\N	\N
fdb770e9-0580-41b9-9c6a-68e35ba2c0d2	250	0	250	0	250	95597cb5-45aa-4b61-9403-24d1b4263cb1	\N	\N
abc31634-b388-45a2-87fe-dc75ae405977	230	0	230	0	230	4f242de6-2b74-4e38-b235-cc781233faf0	\N	\N
4d29f0ee-917a-4de1-adaf-aaa3c9c418d3	250	0	250	0	250	c2c784e0-595a-47a1-ac69-1ccd3a95df0d	\N	\N
76029b67-c0b2-465c-91e4-3a92ec66298e	230	0	230	0	230	174ef5a8-64ab-4706-ab40-d7fcc5bdf3b1	\N	\N
f3302518-0228-45c9-b300-d026575bc9e6	330	0	330	0	330	6e12864e-0ae3-493a-b170-7a5043069e12	\N	\N
24ac302c-070c-451d-beed-eacf24ca3562	350	0	350	0	350	c40605bd-0382-497e-b094-462aa3a49eef	\N	\N
47239a6d-e169-41e2-b354-dfafef8d871b	300	0	300	0	300	315095ac-14e2-4714-bdb9-4f933eb1321b	\N	\N
21e1bab8-b964-47ca-98f0-9966974099bb	300	0	300	0	300	8d23ecf0-287d-40b2-b4e9-36e4559cd666	\N	\N
e24a7151-28e4-4bca-a850-baf234db2864	50	0	50	0	50	76457b0a-01b3-48a0-bc57-30442a60c0fb	\N	\N
4525f7ac-73cb-40c4-951b-32f466c14ef6	190	0	190	0	190	60c8ab6d-dc01-49ba-ac51-ab2b4ecb867d	\N	\N
d29c53d0-9ec9-4517-9207-6e5c5c5a19c1	270	0	270	0	270	f8d2cf87-3ef9-4ceb-af46-9b1ffc6413a3	\N	\N
72387dd4-33cb-4805-bed6-d8eb852acc9f	40	0	40	0	40	19efd40d-48ee-40e6-b2c5-cf04048bfc89	\N	\N
e1becc81-c6d0-4100-b698-22cefa8732f4	60	0	60	0	60	dc66fea9-43c5-4006-b6d5-49af4a5e2f97	\N	\N
a6dbafc1-ddac-468e-958c-e021bc74ed3e	60	0	60	0	60	61ef3fea-5769-4ae7-8540-ed331f016461	\N	\N
fa3fc59f-de7d-4cb7-8c75-50b9137e0044	350	0	350	0	350	dc7abdf2-dea2-40d3-851f-2eeb47065db7	\N	\N
\.


--
-- Data for Name: Purchase; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Purchase" (id, "createdAt", "storeId", attachment, discount, "isDeleted", "paymentMode", "paymentStatus", "referenceNumber", remark, "roundOff", "supplierId", "taxableAmount", "totalAmount", "txnDate", "staffId", "dailySessionId") FROM stdin;
e95a91e7-f53c-438b-8fa6-9505f2817b5d	2026-04-05 06:27:39.745	cmnlcvfo70002lt8xmmgez07z		0	f	CASH	PAID	PUR-1775370457967-327		0	2e620443-8461-4726-94a6-dca45c316a55	6000	6000	2026-04-05 00:00:00	0d011ad7-ac05-4a1f-9fbd-80742f4972aa	\N
d746d484-8656-4928-9bc7-ae15105e326e	2026-04-05 10:45:30.397	cmnlcvfo70002lt8xmmgez07z		0	f	CASH	PAID	PUR-1775385929066-422		0	2e620443-8461-4726-94a6-dca45c316a55	600	600	2026-04-05 00:00:00	0d011ad7-ac05-4a1f-9fbd-80742f4972aa	15a162f1-843c-4d0b-bb61-11993c9e50c7
83929329-6b9f-43b9-9b7b-65d8cd9492a1	2026-03-01 10:07:26.516	cmm7kijlt000111fe6p8fx3q9	\N	0	t	CASH	PENDING	PUR-1772359646474-433		0	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	1000	1000	2026-03-01 00:00:00	\N	\N
dd9acc1c-7ec2-4bcc-82ca-2f5b8c785c5b	2026-04-05 07:12:15.498	cmm7kijlt000111fe6p8fx3q9		0	t	CASH	PENDING	PUR-1775373135469-910		0	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	150	150	2026-04-05 00:00:00	4488829b-72fc-4b6d-9cf3-b7a20f99a085	\N
c8cf4afa-1e5a-46fc-a510-7d98d57d7405	2026-04-06 13:01:49.881	cmnlcvfo70002lt8xmmgez07z		0	f	CASH	PAID	PUR-1775480509832-957		0	2e620443-8461-4726-94a6-dca45c316a55	200	200	2026-04-06 00:00:00	0d011ad7-ac05-4a1f-9fbd-80742f4972aa	1476a7e3-4c10-4a48-b8ac-2440e42fb807
19fc53fe-fffc-4e0c-bf70-5ce8e4cea4ba	2026-04-07 08:56:21.624	cmm7kijlt000111fe6p8fx3q9		0	t	CASH	PENDING	PUR-1775552181565-913		0	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	150	150	2026-04-07 00:00:00	4488829b-72fc-4b6d-9cf3-b7a20f99a085	f88c840e-779f-4c90-b15c-66842d72971b
2dcb5ab0-2932-4a31-852c-b23baacb00bb	2026-04-05 12:24:59.782	cmm7kijlt000111fe6p8fx3q9		0	t	CASH	PAID	PUR-1775391899738-535		0	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	2500	2500	2026-04-05 00:00:00	915ea075-2410-4a16-ba1b-9d24488021a5	13fe8f08-4602-430a-91de-f6cad1937cf8
70e917dc-266e-4823-ac2d-a6e67f57bd7a	2026-04-07 09:02:03.074	cmm7kijlt000111fe6p8fx3q9		0	t	CASH	PAID	PUR-1775552523014-484		0	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	45	45	2026-04-07 00:00:00	4488829b-72fc-4b6d-9cf3-b7a20f99a085	f88c840e-779f-4c90-b15c-66842d72971b
c6b2aeda-6bfc-4c05-a066-7a03c5267f63	2026-04-08 06:49:13.62	cmm7kijlt000111fe6p8fx3q9		0	t	CASH	PENDING	PUR-1775630953473-349		0	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	110	110	2026-04-08 00:00:00	9c63bb2d-f340-41fc-87ef-9835e2307967	a106914f-f37c-4bb0-8c1c-4df0c19bfc74
e539e8a8-6f77-4cec-9620-d76bb5983aed	2026-04-08 13:42:50.754	cmm7kijlt000111fe6p8fx3q9		0	t	CASH	PENDING	PUR-1775655770689-308		0	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	160	160	2026-04-08 00:00:00	9c63bb2d-f340-41fc-87ef-9835e2307967	a106914f-f37c-4bb0-8c1c-4df0c19bfc74
d9e73b72-9e60-438d-8b1d-df2e1ca77fe6	2026-04-08 13:48:38.577	cmm7kijlt000111fe6p8fx3q9		0	t	CASH	PENDING	PUR-1775656118515-588		0	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	294	294	2026-04-08 00:00:00	4488829b-72fc-4b6d-9cf3-b7a20f99a085	a106914f-f37c-4bb0-8c1c-4df0c19bfc74
71c165f8-4fbb-4af7-953c-e9db7251dc2e	2026-04-10 12:09:16.124	cmm7kijlt000111fe6p8fx3q9		0	t	CASH	PAID	PUR-1775822956054-645		0	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	150	150	2026-04-10 00:00:00	9c63bb2d-f340-41fc-87ef-9835e2307967	e95c98fd-f737-4650-ad49-abc7b29eb4f3
1ae90713-217d-463f-97dc-a9feaed717b7	2026-04-08 06:49:56.864	cmm7kijlt000111fe6p8fx3q9		0	t	CASH	PAID	PUR-1775630996799-732		0	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	110	110	2026-04-08 00:00:00	9c63bb2d-f340-41fc-87ef-9835e2307967	a106914f-f37c-4bb0-8c1c-4df0c19bfc74
2d293b04-1191-42cb-9d3c-0095e952bf36	2026-04-08 06:51:22.187	cmm7kijlt000111fe6p8fx3q9		0	t	CASH	PAID	PUR-1775631082126-513		0	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	135	135	2026-04-08 00:00:00	9c63bb2d-f340-41fc-87ef-9835e2307967	a106914f-f37c-4bb0-8c1c-4df0c19bfc74
d22313bd-0322-4b02-b337-cfb914e6d6bf	2026-04-08 13:40:05.787	cmm7kijlt000111fe6p8fx3q9		0	t	CASH	PAID	PUR-1775655605716-761		0	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	90	90	2026-04-08 00:00:00	9c63bb2d-f340-41fc-87ef-9835e2307967	a106914f-f37c-4bb0-8c1c-4df0c19bfc74
994f1d66-2446-4436-b580-bbb594a7c6ad	2026-04-08 13:44:42.731	cmm7kijlt000111fe6p8fx3q9		0	t	CASH	PAID	PUR-1775655882585-748		0	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	160	160	2026-04-08 00:00:00	9c63bb2d-f340-41fc-87ef-9835e2307967	a106914f-f37c-4bb0-8c1c-4df0c19bfc74
e90446b3-0dad-44e9-a690-053329c78aa2	2026-04-10 13:37:21.985	cmm7kijlt000111fe6p8fx3q9		0	f	CASH	PAID	PUR-1775828241943-516		0	8398e9aa-83f2-4639-94f3-d9526fe52e21	90	90	2026-04-10 00:00:00	9c63bb2d-f340-41fc-87ef-9835e2307967	e95c98fd-f737-4650-ad49-abc7b29eb4f3
0575a1eb-e7be-4a9d-aa06-b90b34ec5bc2	2026-04-10 13:41:13.014	cmm7kijlt000111fe6p8fx3q9		0	f	QR	PAID	PUR-1775828472982-631		0	dba2b2ca-eb04-4b1d-ba31-19966c688ef8	1235	1235	2026-04-10 00:00:00	4488829b-72fc-4b6d-9cf3-b7a20f99a085	e95c98fd-f737-4650-ad49-abc7b29eb4f3
d1119f3a-e762-4805-9862-7494081add66	2026-04-10 13:51:48.375	cmm7kijlt000111fe6p8fx3q9		0	f	CASH	PAID	PUR-1775829108345-0		0	a75bf7f2-2fd8-4306-8f9a-963dc7544195	60	60	2026-04-10 00:00:00	4488829b-72fc-4b6d-9cf3-b7a20f99a085	e95c98fd-f737-4650-ad49-abc7b29eb4f3
fbb526a6-5a25-47f4-b8dd-31447af2f381	2026-04-10 13:54:27.606	cmm7kijlt000111fe6p8fx3q9		0	f	CASH	PAID	PUR-1775829267435-585		0	c16c29cf-bb96-49e4-bb79-3ee43da025d1	150	150	2026-04-10 00:00:00	915ea075-2410-4a16-ba1b-9d24488021a5	e95c98fd-f737-4650-ad49-abc7b29eb4f3
c542856c-62a0-4c0a-9845-dd9598fdc166	2026-04-10 14:00:57.466	cmm7kijlt000111fe6p8fx3q9		0	f	CASH	PAID	PUR-1775829657409-762		0	1c335e7c-79f8-4277-acf0-7789be5cee9d	120	120	2026-04-10 00:00:00	915ea075-2410-4a16-ba1b-9d24488021a5	e95c98fd-f737-4650-ad49-abc7b29eb4f3
2aacf2bc-4a78-4c12-ba71-e16e36089aa1	2026-04-11 05:13:11.112	cmm7kijlt000111fe6p8fx3q9		0	f	CASH	PAID	PUR-1775884391021-561		0	8398e9aa-83f2-4639-94f3-d9526fe52e21	90	90	2026-04-11 00:00:00	9c63bb2d-f340-41fc-87ef-9835e2307967	0c70cb42-ba56-45ec-a7e2-b794d41edc6e
169a9301-6648-468e-b5f7-37ca3c615cbc	2026-04-11 05:13:43.671	cmm7kijlt000111fe6p8fx3q9		0	f	CASH	PAID	PUR-1775884423614-334		0	8398e9aa-83f2-4639-94f3-d9526fe52e21	210	210	2026-04-11 00:00:00	9c63bb2d-f340-41fc-87ef-9835e2307967	0c70cb42-ba56-45ec-a7e2-b794d41edc6e
d8d9d582-e999-4ee0-9b1f-4b8318b446f3	2026-04-11 06:55:18.046	cmm7kijlt000111fe6p8fx3q9		0	f	CASH	PAID	PUR-1775890517996-277		0	a75bf7f2-2fd8-4306-8f9a-963dc7544195	120	120	2026-04-11 00:00:00	9c63bb2d-f340-41fc-87ef-9835e2307967	0c70cb42-ba56-45ec-a7e2-b794d41edc6e
d69c80c3-7534-4751-a241-def2a991ed55	2026-04-11 14:20:43.252	cmm7kijlt000111fe6p8fx3q9		0	f	CASH	PAID	PUR-1775917242391-768		0	8398e9aa-83f2-4639-94f3-d9526fe52e21	1263	1263	2026-04-11 00:00:00	4488829b-72fc-4b6d-9cf3-b7a20f99a085	0c70cb42-ba56-45ec-a7e2-b794d41edc6e
e7da0b31-5ab1-4313-85c2-4df0870061d3	2026-04-11 14:23:16.465	cmm7kijlt000111fe6p8fx3q9		0	f	CASH	PAID	PUR-1775917396405-852		0	e7010fc4-4780-425a-92ef-16a65270daa4	120	120	2026-04-11 00:00:00	915ea075-2410-4a16-ba1b-9d24488021a5	0c70cb42-ba56-45ec-a7e2-b794d41edc6e
fe93438d-9649-4d7d-bbbc-886f25fa2395	2026-04-11 14:24:00.705	cmm7kijlt000111fe6p8fx3q9		0	t	CASH	PAID	PUR-1775917440674-306		0	c2c8394e-8d44-4949-9314-83634fa70839	1300	1300	2026-04-11 00:00:00	4488829b-72fc-4b6d-9cf3-b7a20f99a085	0c70cb42-ba56-45ec-a7e2-b794d41edc6e
244ec25d-1665-4f1d-bc6c-5f66b4a8ec42	2026-04-11 14:25:05.008	cmm7kijlt000111fe6p8fx3q9		0	f	CREDIT	PENDING	PUR-1775917504965-715		0	c2c8394e-8d44-4949-9314-83634fa70839	1300	1300	2026-04-11 00:00:00	4488829b-72fc-4b6d-9cf3-b7a20f99a085	0c70cb42-ba56-45ec-a7e2-b794d41edc6e
48903fd9-a883-4f48-b5f2-8901c35fa6c9	2026-04-11 15:20:55.42	cmm7kijlt000111fe6p8fx3q9		0	f	CASH	PAID	PUR-1775920855385-939		0	b5f527ea-7d74-4613-82e9-f72a4b28f004	100	100	2026-04-11 00:00:00	9c63bb2d-f340-41fc-87ef-9835e2307967	0c70cb42-ba56-45ec-a7e2-b794d41edc6e
02534f90-9e4d-48d2-87f4-7a311badf167	2026-04-12 02:08:16.283	cmm7kijlt000111fe6p8fx3q9		0	t	CASH	PAID	PUR-1775959696196-916		0	1b5859a3-ca83-461f-ae9e-0b7b57c03be6	7200	7200	2026-04-12 00:00:00	9c63bb2d-f340-41fc-87ef-9835e2307967	9b70d049-8b12-4795-85a3-a200ea01de1a
6a9b0d1e-09f7-42ee-9f7a-e6f0b064db21	2026-04-12 02:10:26.372	cmm7kijlt000111fe6p8fx3q9		0	f	CREDIT	PENDING	PUR-1775959826307-145		0	1b5859a3-ca83-461f-ae9e-0b7b57c03be6	7200	7200	2026-04-12 00:00:00	9c63bb2d-f340-41fc-87ef-9835e2307967	9b70d049-8b12-4795-85a3-a200ea01de1a
1dc5c1d4-6572-494e-8cbf-3b93a4dce1bb	2026-04-12 02:17:31.241	cmm7kijlt000111fe6p8fx3q9		0	f	CASH	PAID	PUR-1775960251163-211		0	ca95fd47-ce0b-455e-bd90-88cbe152436a	200	200	2026-04-12 00:00:00	9c63bb2d-f340-41fc-87ef-9835e2307967	9b70d049-8b12-4795-85a3-a200ea01de1a
c1cac9a5-2619-40c6-9b18-a61e2beb9ea7	2026-04-12 02:18:21.371	cmm7kijlt000111fe6p8fx3q9		0	f	CASH	PAID	PUR-1775960301317-463		0	b5f527ea-7d74-4613-82e9-f72a4b28f004	330	330	2026-04-12 00:00:00	9c63bb2d-f340-41fc-87ef-9835e2307967	9b70d049-8b12-4795-85a3-a200ea01de1a
ad9992da-89c5-447b-bab8-c624e4cfceef	2026-04-12 05:15:41.034	cmm7kijlt000111fe6p8fx3q9		0	f	CASH	PAID	PUR-1775970940944-323		0	8398e9aa-83f2-4639-94f3-d9526fe52e21	25	25	2026-04-12 00:00:00	9c63bb2d-f340-41fc-87ef-9835e2307967	9b70d049-8b12-4795-85a3-a200ea01de1a
\.


--
-- Data for Name: PurchaseItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PurchaseItem" (id, "purchaseId", "itemName", quantity, rate, amount, "stockId") FROM stdin;
2250be0e-5f07-4e53-a8ce-c9db6aa58121	83929329-6b9f-43b9-9b7b-65d8cd9492a1	Coffee	4	250	1000	\N
244828eb-4951-4446-92b8-fe0f82f7d6f4	e95a91e7-f53c-438b-8fa6-9505f2817b5d	Milk	100	60	6000	\N
5103e474-488a-4703-9909-5baf23881fe2	dd9acc1c-7ec2-4bcc-82ca-2f5b8c785c5b	test	1	150	150	\N
0288188b-3c60-48f5-89ed-46b3b49b19bc	d746d484-8656-4928-9bc7-ae15105e326e	milk	10	60	600	\N
77713ea4-9a03-4bdc-bb5e-2693936c475b	2dcb5ab0-2932-4a31-852c-b23baacb00bb	Coffee beans	1	2500	2500	\N
c6ddbb3e-528f-4a21-aecc-4dc8d40c2818	c8cf4afa-1e5a-46fc-a510-7d98d57d7405	Hrelo	2	100	200	\N
d4f21db9-4201-4e9f-951b-80182a644829	19fc53fe-fffc-4e0c-bf70-5ce8e4cea4ba	test	1	150	150	\N
1dd60e4e-e7d9-4249-bb6d-b02e847a07bc	70e917dc-266e-4823-ac2d-a6e67f57bd7a	Milk	1	45	45	\N
fe2d84a0-9a2f-42be-af68-d9b4c30208e9	c6b2aeda-6bfc-4c05-a066-7a03c5267f63	Brown Bread	1	110	110	\N
5d652ff9-67dc-4646-96c4-79d3f15e42f6	1ae90713-217d-463f-97dc-a9feaed717b7	Brown Bread	1	110	110	\N
57b6e44e-06a0-4c0a-9a20-7ca9e2641390	2d293b04-1191-42cb-9d3c-0095e952bf36	Milk	3	45	135	\N
8caa3e5c-f01c-4d32-949a-d623ef4c4923	d22313bd-0322-4b02-b337-cfb914e6d6bf	Milk	2	45	90	\N
8a9db9c5-dd8b-4925-a4d0-fefb6e80bee3	e539e8a8-6f77-4cec-9620-d76bb5983aed	Water	1	160	160	\N
1ed2ad07-6440-42c2-b5e6-253a69f77e15	994f1d66-2446-4436-b580-bbb594a7c6ad	Oil	1	160	160	\N
3833cd51-d1c2-4c27-9879-98b79da2d807	d9e73b72-9e60-438d-8b1d-df2e1ca77fe6	Oil	1	294	294	\N
17c902a4-3a17-4ab4-acce-42cb7430df0e	71c165f8-4fbb-4af7-953c-e9db7251dc2e	dahi	1	150	150	\N
86d73f27-2e3e-421a-8f6d-c0c1f629481e	e90446b3-0dad-44e9-a690-053329c78aa2	milk	2	45	90	\N
deb3218a-a56e-4bcf-991f-f67b3e31e57c	0575a1eb-e7be-4a9d-aa06-b90b34ec5bc2	coke, fanta, sprite	1	1235	1235	\N
58504318-60aa-4c37-b9db-8a5b75fc7966	d1119f3a-e762-4805-9862-7494081add66	pumpkin	1	60	60	\N
1dc8dbaa-e5f3-4cf4-9236-af7dc31d506c	fbb526a6-5a25-47f4-b8dd-31447af2f381	Curd	1	150	150	\N
a6ea7587-1aa7-46ec-991f-ce3016104e7d	c542856c-62a0-4c0a-9845-dd9598fdc166	Milk	1	120	120	\N
541f960f-fede-46c1-8c60-72d1fcbfd010	2aacf2bc-4a78-4c12-ba71-e16e36089aa1	milk	2	45	90	\N
58941907-5e21-40d5-bd7a-d989077748dc	169a9301-6648-468e-b5f7-37ca3c615cbc	maida	1	210	210	\N
27a40e52-5bc4-4bd1-9f7f-49e4d6dce160	d8d9d582-e999-4ee0-9b1f-4b8318b446f3	water	3	40	120	\N
e60ded59-1277-421a-b020-efa76880de3c	d69c80c3-7534-4751-a241-def2a991ed55	Milk	2	45	90	\N
ead58912-0353-4b07-9fa3-4be8d1eb031f	d69c80c3-7534-4751-a241-def2a991ed55	flour	2	105	210	\N
776b8540-8b65-400d-b4da-10459e2bbb4f	d69c80c3-7534-4751-a241-def2a991ed55	Chicken masala	1	70	70	\N
5c22b40c-1d3d-426b-ab25-cd2ac8d219d2	d69c80c3-7534-4751-a241-def2a991ed55	momo masala	1	120	120	\N
64430d84-c54c-4999-a5a0-97fdfcb1b5c7	d69c80c3-7534-4751-a241-def2a991ed55	panner	1	428	428	\N
bde86e95-9d2c-473d-92aa-782419155d9e	d69c80c3-7534-4751-a241-def2a991ed55	Spagetthi noodles	1	275	275	\N
7e88ccc5-4883-46ec-88ab-5afa18d337e0	d69c80c3-7534-4751-a241-def2a991ed55	Buns	1	70	70	\N
8c5f3c98-1a42-4d04-bb0b-a60456c453dd	e7da0b31-5ab1-4313-85c2-4df0870061d3	water	3	40	120	\N
f28fea4a-3756-480d-bf85-38984457dd23	fe93438d-9649-4d7d-bbbc-886f25fa2395	chicken	2	650	1300	\N
26bc6cbb-4d53-40e5-9f69-a50b19c7b7b7	244ec25d-1665-4f1d-bc6c-5f66b4a8ec42	chicken	2	650	1300	\N
de8cd845-93ac-41c7-9bce-5b12682de130	48903fd9-a883-4f48-b5f2-8901c35fa6c9	Star Masala	1	100	100	\N
e60a8433-3c14-4d5b-8571-609cd3aabcc6	02534f90-9e4d-48d2-87f4-7a311badf167	coffee beans	3	2400	7200	\N
bc228a58-fdc1-48ba-89f1-843c8db04d78	6a9b0d1e-09f7-42ee-9f7a-e6f0b064db21	coffee beans	3	2400	7200	\N
5d4bf812-a353-4866-998a-41b0a4e62eea	1dc5c1d4-6572-494e-8cbf-3b93a4dce1bb	croissant	4	50	200	\N
ccacf75a-d180-4e5e-86f2-048d0272ba04	c1cac9a5-2619-40c6-9b18-a61e2beb9ea7	vegetables	1	330	330	\N
35e98585-6b74-4976-ba7d-f3daf9b65960	ad9992da-89c5-447b-bab8-c624e4cfceef	biscuits	1	25	25	\N
\.


--
-- Data for Name: PurchaseReturn; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PurchaseReturn" (id, "referenceNumber", "supplierId", "txnDate", "purchaseReference", "taxableAmount", "totalAmount", discount, "roundOff", "paymentStatus", "paymentMode", remark, attachment, "storeId", "createdAt", "isDeleted", "staffId") FROM stdin;
7aad5422-3b9d-4bf0-949c-b1d7105ee34f	PRT-1772359785982-848	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	2026-03-01 00:00:00	001	250	250	0	0	UNPAID	CASH		\N	cmm7kijlt000111fe6p8fx3q9	2026-03-01 10:09:46.013	f	\N
\.


--
-- Data for Name: PurchaseReturnItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PurchaseReturnItem" (id, "purchaseReturnId", "itemName", quantity, rate, amount, "stockId") FROM stdin;
52070c80-f6cf-42c2-92ab-acef4ab4e7d1	7aad5422-3b9d-4bf0-949c-b1d7105ee34f	coffee	250	1	250	\N
\.


--
-- Data for Name: QRCode; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."QRCode" (id, "tableId", value, assigned, "createdAt") FROM stdin;
e889b592-c2f6-4947-a76f-7c15ab127db7	2255ea55-e0db-4084-8fdf-393033c04c48	68d6002a-4cd9-413f-ae45-03d5b2a2981c	t	2026-03-01 09:45:02.639
97f0bb7d-d647-4d66-ab60-d543959c69fb	15511477-7788-47a7-9171-c6562425da72	14d85ec1-cf96-46ee-8662-aed278ae85f5	t	2026-03-02 11:59:48.925
437608f3-ccd6-413e-9d6f-643c5e9c6e15	06eaa489-29d7-4f1d-b03b-320a422e09c6	8199fb9c-457f-43cd-bb7c-7e6932a9bac8	t	2026-03-05 17:51:07.537
42036e2f-82cc-46f0-bee6-7447c1d0f52b	9e26f846-ee14-42dc-b6d3-948acfe8f18f	c402ed31-f980-44d2-b9ac-99144f17da1c	t	2026-03-05 17:56:18.448
5973c2f2-1c81-406e-82e1-07c6a9979034	980a2582-3dbc-4d26-96ca-be0f4ae3a9f0	608dcd76-e3a2-4506-9410-55efdf93b1b2	t	2026-03-06 07:03:18.682
3af316d8-4ab5-4eea-99f3-4fcc9e52750a	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	d831bfe5-3014-4d15-bb12-fbaab4322407	t	2026-03-22 02:00:43.915
cd76ce70-2692-4d0a-beda-cde73ba2d5bd	51085af7-c452-435a-9bcd-6038aba00da7	448dd60b-2f84-4b82-b11a-ee691cc52c1a	t	2026-03-22 02:21:58.887
e6a1dd94-d875-4db0-b534-c8aadae88a42	3aa90282-df15-4e32-8996-9f575e1226ef	9bd3918a-6b24-4f50-b043-c09a566f2608	t	2026-03-22 02:48:48.044
6f0c7c7c-4ca9-40b9-8da8-d278bbf17476	8b1b6b1f-1839-4641-9d6c-ea28f262a8d9	3420db9f-70d9-486a-8185-4b5ea71bc7a5	t	2026-03-22 02:50:14.302
b16dfad9-f9dc-4e00-a9b7-97d6b8fc8a58	88391a93-eaa8-4e0e-a27b-fd8cb1478d8a	690dd2a5-0245-4257-aa3f-8d928ad2938f	t	2026-03-22 02:51:56.343
4ebdc0e8-2174-4e23-8403-e33a95d28373	d1f87f20-7913-41dc-b03a-4db6fd01dafc	c16a03da-40f1-4eba-9032-8297a2efb200	t	2026-03-22 02:52:38.56
f14f1674-57fd-480e-9a03-da459a95eedd	a60205e9-e82c-44a9-9428-51bdbce25776	2606d60b-17df-4341-9e7c-ae524c7f5514	t	2026-03-22 02:53:08.714
b1806607-2bf6-4002-8cae-2eb8afd875e4	ea658cd0-6791-4a60-b46f-75658968cdfb	aa262367-d1c4-498a-b6da-2aa68ba2fb5e	t	2026-03-22 02:54:19.213
385a41e7-0c04-4510-a007-ebc61b460d96	8b27d168-361c-40b0-9d75-fc3585635e8a	db8f68fb-e246-4a44-9cb1-cbf9e264e2d4	t	2026-03-24 00:50:18.447
785e0bf0-3334-4767-af33-74a303949cf8	dd5d5a48-ff9e-43ea-a88d-450192cf2537	4f193e32-d18f-477a-80d4-5691cf972e1d	t	2026-04-04 12:04:19.52
22e5d88c-aa50-4fe6-aa8f-38aed58af9c3	bf416ec2-8e42-4516-9ca6-8961492b4458	d21f8d0d-8f7f-461c-88cd-60a52737c79a	t	2026-04-05 06:05:18.042
\.


--
-- Data for Name: QrPayment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."QrPayment" (id, image, "storeId") FROM stdin;
cmmby11p50004y14n7qztin73	{https://res.cloudinary.com/dvvtvhgop/image/upload/v1772798171/settings/ws47yx7gtc35aea6nss3.jpg}	cmm7kb82i0002ku1gbbh63hr0
cmnbfdvq40001ph11uudin8h0	{https://res.cloudinary.com/dvvtvhgop/image/upload/v1774768573/settings/k9fkzyskqpv9mhkyvqqn.jpg}	cmm7kijlt000111fe6p8fx3q9
\.


--
-- Data for Name: Reservation; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Reservation" (id, name, phone, "customerId", images, remark, "tableId", guests, "createdAt", status) FROM stdin;
\.


--
-- Data for Name: ReservationTime; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ReservationTime" (id, "reservationId", date, "startTime", "endTime") FROM stdin;
\.


--
-- Data for Name: SalesReturn; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SalesReturn" (id, "referenceNumber", "customerId", "txnDate", "billReference", "salesStaff", "taxableAmount", "totalAmount", "roundOff", discount, attachment, remark, "paymentStatus", "paymentMode", "createdAt", "isDeleted", "staffId", "storeId") FROM stdin;
\.


--
-- Data for Name: SalesReturnItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SalesReturnItem" (id, "salesReturnId", "dishName", quantity, rate, amount) FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Session" (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: Space; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Space" (id, name, description, "createdAt", "sortOrder", "storeId") FROM stdin;
5575fccf-fb8f-4141-ade6-00b51cf13a1e	Garden		2026-03-01 09:44:39.608	1	cmm7kb82i0002ku1gbbh63hr0
bdc46d48-99f9-495b-9922-d7d62c2299ff	Rooftop		2026-03-05 17:50:24.442	0	cmm7kb82i0002ku1gbbh63hr0
c83a4f26-ec30-4b0e-ac11-50e2405a3b95	Dining		2026-03-02 11:59:19.2	1	cmm7kijlt000111fe6p8fx3q9
1528024f-cd91-477a-8219-444746bcf15b	Outside		2026-03-22 02:00:41.794	2	cmm7kijlt000111fe6p8fx3q9
ec693543-8eb2-44bd-9990-3e8d70fc4db4	Indoor		2026-04-04 12:03:37.063	1	cmnka6xqp0001emd4z20d0lds
c4975df4-a95e-488d-844c-217670013ae4	Main		2026-04-04 12:03:53.353	2	cmnka6xqp0001emd4z20d0lds
ae9981f7-322a-4909-96ca-308175274d8b	indoor		2026-04-05 06:05:00.132	1	cmnlcvfo70002lt8xmmgez07z
\.


--
-- Data for Name: Staff; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Staff" (id, name, role, phone, email, "isActive", image, "createdAt", "storeId", "roleId", "joinDate", shift) FROM stdin;
3d37b2cf-a074-45b5-8edc-616a16637ad6	Youndhen	Staff	9843094860	younsyt929@gmail.com	t		2026-03-06 10:09:35.608	cmm7kb82i0002ku1gbbh63hr0	cc8c9454-d5de-459f-a6dc-9a6961ab1761	2026-03-25 00:00:00	DAY
9c63bb2d-f340-41fc-87ef-9835e2307967	Sarita Thapa Magar	Staff	9828527404	saritathapamagar@gmail.com	t		2026-03-06 06:43:29.102	cmm7kijlt000111fe6p8fx3q9	78b3847c-b607-4d65-b82c-d63ef2461c6e	2026-03-23 00:00:00	MORNING
0d011ad7-ac05-4a1f-9fbd-80742f4972aa	Youndhen	Staff	9843094860	lamayoundhen929@gmail.com	t		2026-04-05 06:26:55.067	cmnlcvfo70002lt8xmmgez07z	8831298a-e192-4c7e-a2ff-f8f413701d19	2026-04-05 00:00:00	DAY
915ea075-2410-4a16-ba1b-9d24488021a5	Nirma Gurung	Staff	9846760028	nirmagurung73@gmail.com	t		2026-03-27 14:54:12.401	cmm7kijlt000111fe6p8fx3q9	78b3847c-b607-4d65-b82c-d63ef2461c6e	2026-03-27 00:00:00	EVENING
4488829b-72fc-4b6d-9cf3-b7a20f99a085	Babita	Staff	+977 984-0524204	bishbabita@gmail.com	t		2026-03-30 05:23:35.402	cmm7kijlt000111fe6p8fx3q9	c9bef836-a238-4187-92af-20f504219fd2	2026-03-30 00:00:00	DAY
\.


--
-- Data for Name: StaffRole; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."StaffRole" (id, name, "storeId") FROM stdin;
3d7b6e1c-e2d3-4670-8d71-c67450aa2ed3	Manager	cmm7kijlt000111fe6p8fx3q9
78b3847c-b607-4d65-b82c-d63ef2461c6e	Barista	cmm7kijlt000111fe6p8fx3q9
c9bef836-a238-4187-92af-20f504219fd2	Chef	cmm7kijlt000111fe6p8fx3q9
7e112994-1c77-460a-a1fc-d9284f17a59d	Waiter	cmm7kijlt000111fe6p8fx3q9
a2d5ab2e-75cc-411f-bde8-8e14b8cfc434	Manager	cmm7kb82i0002ku1gbbh63hr0
cc8c9454-d5de-459f-a6dc-9a6961ab1761	Barista	cmm7kb82i0002ku1gbbh63hr0
c7d2bad1-78c1-4c9a-b16b-ef4ebba0f539	Chef	cmm7kb82i0002ku1gbbh63hr0
8831298a-e192-4c7e-a2ff-f8f413701d19	Manager	cmnlcvfo70002lt8xmmgez07z
\.


--
-- Data for Name: Stock; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Stock" (id, name, quantity, amount, "storeId", "groupId", "unitId") FROM stdin;
\.


--
-- Data for Name: StockConsumption; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."StockConsumption" (id, "stockId", quantity, "dishId", "addOnId", "comboId") FROM stdin;
\.


--
-- Data for Name: StockGroup; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."StockGroup" (id, name, description, "storeId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Store; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Store" (id, name, "ownerId") FROM stdin;
cmm7kb82i0002ku1gbbh63hr0	Authentic	cmm7k96530000ku1gr2m3p0nd
cmm7kijlt000111fe6p8fx3q9	KundCoffee	cmm7khlgy0000psrrkqq4fx2r
cmmgbodh000014lx7fomr3a5w	Oregon 	cmmgbl6h50000y2h0dapf4uuz
cmmt5o3f800029kqdwwypongu	Test resturant 	cmmt5n3yb00009kqd59qsf9e8
store-a-id	Store A	owner-a
store-b-id	Store B	owner-b
cmnka6xqp0001emd4z20d0lds	Rimjhim Chautari	cmnka52y30000e2cd8h56aut9
cmnlcvfo70002lt8xmmgez07z	Youndhen	cmnlcuorj0000lt8xuszlhaly
cmnwtzlj70001rzknw31i84kl	Cafe Central	cmnwtuk020000kaot7onhpdj8
\.


--
-- Data for Name: SubMenu; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SubMenu" (id, name, image, "isActive", "createdAt", "categoryId", "sortOrder", "storeId") FROM stdin;
\.


--
-- Data for Name: Supplier; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Supplier" (id, "fullName", phone, email, "legalName", "taxNumber", address, "openingBalance", "openingBalanceType", "storeId", "createdAt") FROM stdin;
35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	Ram Jee	123456789	kundcoffee@gmail.com	Abc Trade	123456789	Kathmandu	3000	DEBIT	cmm7kijlt000111fe6p8fx3q9	2026-03-01 10:06:26.321
50011aff-1dac-4567-96da-2efd2b96a415	Youndhen Ghacho Tamang	+9779843094860	lamayoundhen929@gmail.com			Boudha, Ramhiti	0	CREDIT	cmm7kb82i0002ku1gbbh63hr0	2026-03-07 13:02:56.382
2e620443-8461-4726-94a6-dca45c316a55	Jhon	9841643429	younsyt929@gmail.com	ABC Test	123456789	Boudha, Ramhiti	0	CREDIT	cmnlcvfo70002lt8xmmgez07z	2026-04-05 06:24:19.722
8398e9aa-83f2-4639-94f3-d9526fe52e21	Kk Mart	\N	\N				0	CREDIT	cmm7kijlt000111fe6p8fx3q9	2026-04-10 13:35:34.416
dba2b2ca-eb04-4b1d-ba31-19966c688ef8	Cold Drinks	9808377069	\N				0	CREDIT	cmm7kijlt000111fe6p8fx3q9	2026-04-10 13:39:01.562
a75bf7f2-2fd8-4306-8f9a-963dc7544195	Parbat Store	\N	\N				0	CREDIT	cmm7kijlt000111fe6p8fx3q9	2026-04-10 13:51:08.467
c16c29cf-bb96-49e4-bb79-3ee43da025d1	Golfu- Vinayak Dairy Products	\N	\N				0	CREDIT	cmm7kijlt000111fe6p8fx3q9	2026-04-10 13:53:45.991
1c335e7c-79f8-4277-acf0-7789be5cee9d	Dairy Near Basketball Court	\N	\N				0	CREDIT	cmm7kijlt000111fe6p8fx3q9	2026-04-10 14:00:00.321
4a42fc8e-a17b-4fbe-a44a-1c772898ca8f	Hygienic Enterprises P. Ltd	\N	\N				0	CREDIT	cmm7kijlt000111fe6p8fx3q9	2026-04-11 14:09:38.426
c2c8394e-8d44-4949-9314-83634fa70839	Hygine Meat (masu Supplier)	\N	\N				0	CREDIT	cmm7kijlt000111fe6p8fx3q9	2026-04-11 14:10:16.459
1b5859a3-ca83-461f-ae9e-0b7b57c03be6	Coffee Roaster	\N	\N				0	CREDIT	cmm7kijlt000111fe6p8fx3q9	2026-04-11 14:11:44.951
ca95fd47-ce0b-455e-bd90-88cbe152436a	Bakers Leaf	\N	\N				0	CREDIT	cmm7kijlt000111fe6p8fx3q9	2026-04-11 14:12:12.313
e7010fc4-4780-425a-92ef-16a65270daa4	Water Jar	\N	\N				0	CREDIT	cmm7kijlt000111fe6p8fx3q9	2026-04-11 14:12:48.531
b5f527ea-7d74-4613-82e9-f72a4b28f004	Others	\N	\N				0	CREDIT	cmm7kijlt000111fe6p8fx3q9	2026-04-11 15:20:00.215
\.


--
-- Data for Name: SupplierLedger; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SupplierLedger" (id, "supplierId", "storeId", "txnNo", type, amount, "closingBalance", "referenceId", remarks, "createdAt") FROM stdin;
9a46cb07-c361-458c-991a-9b063df4540c	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	OPB-35E7C8A3	OPENING_BALANCE	3000	-3000	\N	Opening Balance	2026-03-01 10:06:26.355
417a5b7e-50d4-4195-9dad-4d6f09e8b2f7	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PUR-1772359646474-433	PURCHASE	1000	0	83929329-6b9f-43b9-9b7b-65d8cd9492a1	Purchase Bill PUR-1772359646474-433	2026-03-01 10:07:26.622
f108ae79-7ef8-44bd-b25a-f7fbceee6800	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PRT-1772359785982-848	RETURN	250	0	7aad5422-3b9d-4bf0-949c-b1d7105ee34f	Purchase Return PRT-1772359785982-848	2026-03-01 10:09:46.116
4a9aecf4-e133-4f6e-9f66-ec5fb6b72c18	2e620443-8461-4726-94a6-dca45c316a55	cmnlcvfo70002lt8xmmgez07z	PUR-1775370457967-327	PURCHASE	6000	0	e95a91e7-f53c-438b-8fa6-9505f2817b5d	Purchase Bill PUR-1775370457967-327	2026-04-05 06:27:41.61
96412309-ba99-4746-8d60-26c479aab0b3	2e620443-8461-4726-94a6-dca45c316a55	cmnlcvfo70002lt8xmmgez07z	PAY-P-E95A91E7	PAYMENT	6000	0	e95a91e7-f53c-438b-8fa6-9505f2817b5d	Immediate payment for bill PUR-1775370457967-327	2026-04-05 06:27:42.44
427600b2-9fa9-4467-be75-e7a5d2e0da31	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PUR-1775373135469-910	PURCHASE	150	0	dd9acc1c-7ec2-4bcc-82ca-2f5b8c785c5b	Purchase Bill PUR-1775373135469-910	2026-04-05 07:12:15.586
ea273b83-d7f3-45bf-9349-73c943c9e7dd	2e620443-8461-4726-94a6-dca45c316a55	cmnlcvfo70002lt8xmmgez07z	PUR-1775385929066-422	PURCHASE	600	0	d746d484-8656-4928-9bc7-ae15105e326e	Purchase Bill PUR-1775385929066-422	2026-04-05 10:45:33.329
43c8930e-4fa0-431a-a4f9-bfd3fc6414bb	2e620443-8461-4726-94a6-dca45c316a55	cmnlcvfo70002lt8xmmgez07z	PAY-P-D746D484	PAYMENT	600	0	d746d484-8656-4928-9bc7-ae15105e326e	Immediate payment for bill PUR-1775385929066-422	2026-04-05 10:45:34.167
0b97030d-ef3b-4de4-9172-d6ebda363f9d	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PUR-1775391899738-535	PURCHASE	2500	0	2dcb5ab0-2932-4a31-852c-b23baacb00bb	Purchase Bill PUR-1775391899738-535	2026-04-05 12:24:59.852
07ee3a64-4141-4d16-b736-19718d30f644	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PAY-P-2DCB5AB0	PAYMENT	2500	0	2dcb5ab0-2932-4a31-852c-b23baacb00bb	Immediate payment for bill PUR-1775391899738-535	2026-04-05 12:24:59.879
730aca85-59cf-4ca1-94d8-4497ff64b31e	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	REV-PUR-1772359646474-433	RETURN	1000	0	83929329-6b9f-43b9-9b7b-65d8cd9492a1	Reversal of deleted purchase PUR-1772359646474-433	2026-04-05 12:25:06.69
160943d8-3100-4f29-8ae3-992dcb9715e5	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	REV-PUR-1775373135469-910	RETURN	150	0	dd9acc1c-7ec2-4bcc-82ca-2f5b8c785c5b	Reversal of deleted purchase PUR-1775373135469-910	2026-04-05 12:25:09.772
a1324de0-5a76-4a08-8ca6-da78411a719d	2e620443-8461-4726-94a6-dca45c316a55	cmnlcvfo70002lt8xmmgez07z	PUR-1775480509832-957	PURCHASE	200	0	c8cf4afa-1e5a-46fc-a510-7d98d57d7405	Purchase Bill PUR-1775480509832-957	2026-04-06 13:01:50.02
45cceb58-32ba-43bc-9770-5db2047f8f0f	2e620443-8461-4726-94a6-dca45c316a55	cmnlcvfo70002lt8xmmgez07z	PAY-P-C8CF4AFA	PAYMENT	200	0	c8cf4afa-1e5a-46fc-a510-7d98d57d7405	Immediate payment for bill PUR-1775480509832-957	2026-04-06 13:01:50.06
0fd908d6-f01c-4963-bde7-1cf20ce3773f	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PUR-1775552181565-913	PURCHASE	150	0	19fc53fe-fffc-4e0c-bf70-5ce8e4cea4ba	Purchase Bill PUR-1775552181565-913	2026-04-07 08:56:21.719
24dcbd43-bc66-45e6-9944-3b7033e71302	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	REV-PUR-1775552181565-913	RETURN	150	0	19fc53fe-fffc-4e0c-bf70-5ce8e4cea4ba	Reversal of deleted purchase PUR-1775552181565-913	2026-04-07 09:01:19.626
5e8d1ddc-2910-4a97-ad59-4eacc8bd1fcf	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	REV-PUR-1775391899738-535	RETURN	2500	0	2dcb5ab0-2932-4a31-852c-b23baacb00bb	Reversal of deleted purchase PUR-1775391899738-535	2026-04-07 09:01:23.485
b899293c-882e-40f7-a759-369a7c468221	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PUR-1775552523014-484	PURCHASE	45	0	70e917dc-266e-4823-ac2d-a6e67f57bd7a	Purchase Bill PUR-1775552523014-484	2026-04-07 09:02:03.157
66c0785f-fad2-4920-b7a7-3269121c8aa3	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PAY-P-70E917DC	PAYMENT	45	0	70e917dc-266e-4823-ac2d-a6e67f57bd7a	Immediate payment for bill PUR-1775552523014-484	2026-04-07 09:02:03.186
c0c2d067-90a8-4f79-9c23-f52950595d81	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PUR-1775630953473-349	PURCHASE	110	0	c6b2aeda-6bfc-4c05-a066-7a03c5267f63	Purchase Bill PUR-1775630953473-349	2026-04-08 06:49:13.723
9e3db304-c0e0-44fd-ae33-12db1250754a	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	REV-PUR-1775552523014-484	RETURN	45	0	70e917dc-266e-4823-ac2d-a6e67f57bd7a	Reversal of deleted purchase PUR-1775552523014-484	2026-04-08 06:49:25.817
3e5aad5e-c2b8-4d9a-b15e-896dd5b85cd8	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PUR-1775630996799-732	PURCHASE	110	0	1ae90713-217d-463f-97dc-a9feaed717b7	Purchase Bill PUR-1775630996799-732	2026-04-08 06:49:56.957
84389108-4a79-438c-8145-7726d98d38a1	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PAY-P-1AE90713	PAYMENT	110	0	1ae90713-217d-463f-97dc-a9feaed717b7	Immediate payment for bill PUR-1775630996799-732	2026-04-08 06:49:56.989
9b77158e-90a6-4b38-a618-d36930a5b001	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PUR-1775631082126-513	PURCHASE	135	0	2d293b04-1191-42cb-9d3c-0095e952bf36	Purchase Bill PUR-1775631082126-513	2026-04-08 06:51:22.275
76cd480d-3ab8-4435-b127-b7075fd2872e	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PAY-P-2D293B04	PAYMENT	135	0	2d293b04-1191-42cb-9d3c-0095e952bf36	Immediate payment for bill PUR-1775631082126-513	2026-04-08 06:51:22.305
fc3b1d74-8484-482f-99d0-5b63ac0058b8	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	REV-PUR-1775630953473-349	RETURN	110	0	c6b2aeda-6bfc-4c05-a066-7a03c5267f63	Reversal of deleted purchase PUR-1775630953473-349	2026-04-08 07:00:08.912
f9d039b6-3f8a-4056-8f15-a3babe874e0a	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PUR-1775655605716-761	PURCHASE	90	0	d22313bd-0322-4b02-b337-cfb914e6d6bf	Purchase Bill PUR-1775655605716-761	2026-04-08 13:40:05.9
8ac61921-5c34-44fe-9ffc-452bd172f045	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PAY-P-D22313BD	PAYMENT	90	0	d22313bd-0322-4b02-b337-cfb914e6d6bf	Immediate payment for bill PUR-1775655605716-761	2026-04-08 13:40:05.937
baa501a0-0802-43db-bd1f-47769588028e	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PUR-1775655770689-308	PURCHASE	160	0	e539e8a8-6f77-4cec-9620-d76bb5983aed	Purchase Bill PUR-1775655770689-308	2026-04-08 13:42:50.849
c373cf03-d439-4b92-b52f-fc0935b1f279	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PUR-1775655882585-748	PURCHASE	160	0	994f1d66-2446-4436-b580-bbb594a7c6ad	Purchase Bill PUR-1775655882585-748	2026-04-08 13:44:42.813
cbd2ec83-08b3-42cb-9b17-f3e385dbea85	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PAY-P-994F1D66	PAYMENT	160	0	994f1d66-2446-4436-b580-bbb594a7c6ad	Immediate payment for bill PUR-1775655882585-748	2026-04-08 13:44:42.841
93cbb995-f7f6-4172-acbe-210e46a89c61	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	REV-PUR-1775655770689-308	RETURN	160	0	e539e8a8-6f77-4cec-9620-d76bb5983aed	Reversal of deleted purchase PUR-1775655770689-308	2026-04-08 13:44:52.665
c6444494-895d-4d61-ac11-89ab05988a2f	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PUR-1775656118515-588	PURCHASE	294	0	d9e73b72-9e60-438d-8b1d-df2e1ca77fe6	Purchase Bill PUR-1775656118515-588	2026-04-08 13:48:38.666
b56b4919-79f9-4ae2-96d9-909b9df2c168	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	REV-PUR-1775656118515-588	RETURN	294	0	d9e73b72-9e60-438d-8b1d-df2e1ca77fe6	Reversal of deleted purchase PUR-1775656118515-588	2026-04-08 13:48:57.365
bce48649-ca18-4041-aaf0-5f366f5d21ea	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PUR-1775822956054-645	PURCHASE	150	0	71c165f8-4fbb-4af7-953c-e9db7251dc2e	Purchase Bill PUR-1775822956054-645	2026-04-10 12:09:16.241
d62179f8-503b-4e41-b942-9d2e42fb143a	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	PAY-P-71C165F8	PAYMENT	150	0	71c165f8-4fbb-4af7-953c-e9db7251dc2e	Immediate payment for bill PUR-1775822956054-645	2026-04-10 12:09:16.275
8d822107-603e-4473-8fb5-4b9594c4f6e3	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	REV-PUR-1775822956054-645	RETURN	150	0	71c165f8-4fbb-4af7-953c-e9db7251dc2e	Reversal of deleted purchase PUR-1775822956054-645	2026-04-10 13:22:56.519
9dbc30bb-a0bd-43f4-a0b9-ce6f01c4e063	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	REV-PUR-1775630996799-732	RETURN	110	0	1ae90713-217d-463f-97dc-a9feaed717b7	Reversal of deleted purchase PUR-1775630996799-732	2026-04-10 13:23:00.489
c9b8af3d-a16d-4645-a555-a3dee0b7e6a9	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	REV-PUR-1775631082126-513	RETURN	135	0	2d293b04-1191-42cb-9d3c-0095e952bf36	Reversal of deleted purchase PUR-1775631082126-513	2026-04-10 13:23:04.298
7263b085-7ee4-4cca-a810-9725f731b4a6	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	REV-PUR-1775655605716-761	RETURN	90	0	d22313bd-0322-4b02-b337-cfb914e6d6bf	Reversal of deleted purchase PUR-1775655605716-761	2026-04-10 13:23:09.344
ebd53921-f697-48a2-825f-88c29403300c	35e7c8a3-6ba7-429a-adb5-40dc7ad0128f	cmm7kijlt000111fe6p8fx3q9	REV-PUR-1775655882585-748	RETURN	160	0	994f1d66-2446-4436-b580-bbb594a7c6ad	Reversal of deleted purchase PUR-1775655882585-748	2026-04-10 13:23:12.729
40c35510-8b7e-4ef3-b239-a6d2aa4d2805	8398e9aa-83f2-4639-94f3-d9526fe52e21	cmm7kijlt000111fe6p8fx3q9	PUR-1775828241943-516	PURCHASE	90	0	e90446b3-0dad-44e9-a690-053329c78aa2	Purchase Bill PUR-1775828241943-516	2026-04-10 13:37:22.062
d40a4cd2-6cb0-4744-82e1-695ca1bee670	8398e9aa-83f2-4639-94f3-d9526fe52e21	cmm7kijlt000111fe6p8fx3q9	PAY-P-E90446B3	PAYMENT	90	0	e90446b3-0dad-44e9-a690-053329c78aa2	Immediate payment for bill PUR-1775828241943-516	2026-04-10 13:37:22.089
f267cbb5-b46d-4f4c-909c-d4679f5733b3	dba2b2ca-eb04-4b1d-ba31-19966c688ef8	cmm7kijlt000111fe6p8fx3q9	PUR-1775828472982-631	PURCHASE	1235	0	0575a1eb-e7be-4a9d-aa06-b90b34ec5bc2	Purchase Bill PUR-1775828472982-631	2026-04-10 13:41:13.083
03af1b0a-5e1c-4e79-a86a-d96117fe3ef1	dba2b2ca-eb04-4b1d-ba31-19966c688ef8	cmm7kijlt000111fe6p8fx3q9	PAY-P-0575A1EB	PAYMENT	1235	0	0575a1eb-e7be-4a9d-aa06-b90b34ec5bc2	Immediate payment for bill PUR-1775828472982-631	2026-04-10 13:41:13.111
bc14c166-cef9-4e8a-bbdf-3cf4021a9d5c	a75bf7f2-2fd8-4306-8f9a-963dc7544195	cmm7kijlt000111fe6p8fx3q9	PUR-1775829108345-0	PURCHASE	60	0	d1119f3a-e762-4805-9862-7494081add66	Purchase Bill PUR-1775829108345-0	2026-04-10 13:51:48.461
4a451f53-241f-4f70-92b4-a94b97d09884	a75bf7f2-2fd8-4306-8f9a-963dc7544195	cmm7kijlt000111fe6p8fx3q9	PAY-P-D1119F3A	PAYMENT	60	0	d1119f3a-e762-4805-9862-7494081add66	Immediate payment for bill PUR-1775829108345-0	2026-04-10 13:51:48.49
ad784de5-6147-4a9a-b0a6-61583c780560	c16c29cf-bb96-49e4-bb79-3ee43da025d1	cmm7kijlt000111fe6p8fx3q9	PUR-1775829267435-585	PURCHASE	150	0	fbb526a6-5a25-47f4-b8dd-31447af2f381	Purchase Bill PUR-1775829267435-585	2026-04-10 13:54:27.701
36b4187d-59cc-4c65-945f-dccaa9ff6354	c16c29cf-bb96-49e4-bb79-3ee43da025d1	cmm7kijlt000111fe6p8fx3q9	PAY-P-FBB526A6	PAYMENT	150	0	fbb526a6-5a25-47f4-b8dd-31447af2f381	Immediate payment for bill PUR-1775829267435-585	2026-04-10 13:54:27.733
48a6f891-13be-4bf0-8b38-9384a96bd426	1c335e7c-79f8-4277-acf0-7789be5cee9d	cmm7kijlt000111fe6p8fx3q9	PUR-1775829657409-762	PURCHASE	120	0	c542856c-62a0-4c0a-9845-dd9598fdc166	Purchase Bill PUR-1775829657409-762	2026-04-10 14:00:57.551
6307bf61-c4ba-4d86-9910-ff7291c3e8e9	1c335e7c-79f8-4277-acf0-7789be5cee9d	cmm7kijlt000111fe6p8fx3q9	PAY-P-C542856C	PAYMENT	120	0	c542856c-62a0-4c0a-9845-dd9598fdc166	Immediate payment for bill PUR-1775829657409-762	2026-04-10 14:00:57.579
e0870413-87dd-4729-9597-ed00612cccee	8398e9aa-83f2-4639-94f3-d9526fe52e21	cmm7kijlt000111fe6p8fx3q9	PUR-1775884391021-561	PURCHASE	90	0	2aacf2bc-4a78-4c12-ba71-e16e36089aa1	Purchase Bill PUR-1775884391021-561	2026-04-11 05:13:11.207
ed0ee6fb-494a-4fe9-b3fb-44e1e5673987	8398e9aa-83f2-4639-94f3-d9526fe52e21	cmm7kijlt000111fe6p8fx3q9	PAY-P-2AACF2BC	PAYMENT	90	0	2aacf2bc-4a78-4c12-ba71-e16e36089aa1	Immediate payment for bill PUR-1775884391021-561	2026-04-11 05:13:11.239
b17704fe-fc0e-4827-9c26-a0d72f2e5d8e	8398e9aa-83f2-4639-94f3-d9526fe52e21	cmm7kijlt000111fe6p8fx3q9	PUR-1775884423614-334	PURCHASE	210	0	169a9301-6648-468e-b5f7-37ca3c615cbc	Purchase Bill PUR-1775884423614-334	2026-04-11 05:13:43.751
3b56b621-981f-449a-bccb-3e53e95a921f	8398e9aa-83f2-4639-94f3-d9526fe52e21	cmm7kijlt000111fe6p8fx3q9	PAY-P-169A9301	PAYMENT	210	0	169a9301-6648-468e-b5f7-37ca3c615cbc	Immediate payment for bill PUR-1775884423614-334	2026-04-11 05:13:43.778
3221b23c-ee6c-4823-98e3-d90dbf5498d7	a75bf7f2-2fd8-4306-8f9a-963dc7544195	cmm7kijlt000111fe6p8fx3q9	PUR-1775890517996-277	PURCHASE	120	0	d8d9d582-e999-4ee0-9b1f-4b8318b446f3	Purchase Bill PUR-1775890517996-277	2026-04-11 06:55:18.127
ed0e9ebd-79b4-49f2-a947-7735544d2e85	a75bf7f2-2fd8-4306-8f9a-963dc7544195	cmm7kijlt000111fe6p8fx3q9	PAY-P-D8D9D582	PAYMENT	120	0	d8d9d582-e999-4ee0-9b1f-4b8318b446f3	Immediate payment for bill PUR-1775890517996-277	2026-04-11 06:55:18.161
548e6747-7f82-4c32-bf7c-1e2b59ea2e4e	8398e9aa-83f2-4639-94f3-d9526fe52e21	cmm7kijlt000111fe6p8fx3q9	PUR-1775917242391-768	PURCHASE	1263	0	d69c80c3-7534-4751-a241-def2a991ed55	Purchase Bill PUR-1775917242391-768	2026-04-11 14:20:43.417
fe18a468-d05e-490d-901b-d5b9707b2b2c	8398e9aa-83f2-4639-94f3-d9526fe52e21	cmm7kijlt000111fe6p8fx3q9	PAY-P-D69C80C3	PAYMENT	1263	0	d69c80c3-7534-4751-a241-def2a991ed55	Immediate payment for bill PUR-1775917242391-768	2026-04-11 14:20:43.456
1ee4383e-56a3-42f6-ac2a-4f5d77e06450	e7010fc4-4780-425a-92ef-16a65270daa4	cmm7kijlt000111fe6p8fx3q9	PUR-1775917396405-852	PURCHASE	120	0	e7da0b31-5ab1-4313-85c2-4df0870061d3	Purchase Bill PUR-1775917396405-852	2026-04-11 14:23:16.549
a8ff1b57-9e95-4579-b331-ef49b0cc85f0	e7010fc4-4780-425a-92ef-16a65270daa4	cmm7kijlt000111fe6p8fx3q9	PAY-P-E7DA0B31	PAYMENT	120	0	e7da0b31-5ab1-4313-85c2-4df0870061d3	Immediate payment for bill PUR-1775917396405-852	2026-04-11 14:23:16.578
b898d34c-e636-455e-a8d1-fb123f44b5f5	c2c8394e-8d44-4949-9314-83634fa70839	cmm7kijlt000111fe6p8fx3q9	PUR-1775917440674-306	PURCHASE	1300	0	fe93438d-9649-4d7d-bbbc-886f25fa2395	Purchase Bill PUR-1775917440674-306	2026-04-11 14:24:00.779
3e8efb3f-4ef6-4ddb-b01c-2f8bed728828	c2c8394e-8d44-4949-9314-83634fa70839	cmm7kijlt000111fe6p8fx3q9	PAY-P-FE93438D	PAYMENT	1300	0	fe93438d-9649-4d7d-bbbc-886f25fa2395	Immediate payment for bill PUR-1775917440674-306	2026-04-11 14:24:00.809
b26b08d6-03bb-4570-98f6-618b9a346758	c2c8394e-8d44-4949-9314-83634fa70839	cmm7kijlt000111fe6p8fx3q9	REV-PUR-1775917440674-306	RETURN	1300	0	fe93438d-9649-4d7d-bbbc-886f25fa2395	Reversal of deleted purchase PUR-1775917440674-306	2026-04-11 14:24:16.983
179186d9-ef73-43ef-bf81-88cbad658081	c2c8394e-8d44-4949-9314-83634fa70839	cmm7kijlt000111fe6p8fx3q9	PUR-1775917504965-715	PURCHASE	1300	0	244ec25d-1665-4f1d-bc6c-5f66b4a8ec42	Purchase Bill PUR-1775917504965-715	2026-04-11 14:25:05.05
9e97c7a9-74f8-49f3-9819-7da5c377a2b5	b5f527ea-7d74-4613-82e9-f72a4b28f004	cmm7kijlt000111fe6p8fx3q9	PUR-1775920855385-939	PURCHASE	100	0	48903fd9-a883-4f48-b5f2-8901c35fa6c9	Purchase Bill PUR-1775920855385-939	2026-04-11 15:20:55.51
20a328f4-dccb-429c-800c-314d1bdbcc43	b5f527ea-7d74-4613-82e9-f72a4b28f004	cmm7kijlt000111fe6p8fx3q9	PAY-P-48903FD9	PAYMENT	100	0	48903fd9-a883-4f48-b5f2-8901c35fa6c9	Immediate payment for bill PUR-1775920855385-939	2026-04-11 15:20:55.546
5aa27d8e-eb02-4758-b11b-7ffb56a708db	1b5859a3-ca83-461f-ae9e-0b7b57c03be6	cmm7kijlt000111fe6p8fx3q9	PUR-1775959696196-916	PURCHASE	7200	0	02534f90-9e4d-48d2-87f4-7a311badf167	Purchase Bill PUR-1775959696196-916	2026-04-12 02:08:16.399
38d004ed-271d-44ae-adbd-a1e41a28e481	1b5859a3-ca83-461f-ae9e-0b7b57c03be6	cmm7kijlt000111fe6p8fx3q9	PAY-P-02534F90	PAYMENT	7200	0	02534f90-9e4d-48d2-87f4-7a311badf167	Immediate payment for bill PUR-1775959696196-916	2026-04-12 02:08:16.434
a9c76aa4-846f-45ac-b12f-63b58f1df678	1b5859a3-ca83-461f-ae9e-0b7b57c03be6	cmm7kijlt000111fe6p8fx3q9	REV-PUR-1775959696196-916	RETURN	7200	0	02534f90-9e4d-48d2-87f4-7a311badf167	Reversal of deleted purchase PUR-1775959696196-916	2026-04-12 02:08:57.959
beeea283-5b5d-4dea-8530-3b787edf00ca	1b5859a3-ca83-461f-ae9e-0b7b57c03be6	cmm7kijlt000111fe6p8fx3q9	PUR-1775959826307-145	PURCHASE	7200	0	6a9b0d1e-09f7-42ee-9f7a-e6f0b064db21	Purchase Bill PUR-1775959826307-145	2026-04-12 02:10:26.466
e13a2d07-1ee5-4643-91f8-dc6187a5778d	ca95fd47-ce0b-455e-bd90-88cbe152436a	cmm7kijlt000111fe6p8fx3q9	PUR-1775960251163-211	PURCHASE	200	0	1dc5c1d4-6572-494e-8cbf-3b93a4dce1bb	Purchase Bill PUR-1775960251163-211	2026-04-12 02:17:31.347
78e0c599-9bdf-4e9e-9e2d-0f6c26dd62fa	ca95fd47-ce0b-455e-bd90-88cbe152436a	cmm7kijlt000111fe6p8fx3q9	PAY-P-1DC5C1D4	PAYMENT	200	0	1dc5c1d4-6572-494e-8cbf-3b93a4dce1bb	Immediate payment for bill PUR-1775960251163-211	2026-04-12 02:17:31.375
2dc8ea9b-b756-41b4-a05f-75fabf95ab80	b5f527ea-7d74-4613-82e9-f72a4b28f004	cmm7kijlt000111fe6p8fx3q9	PUR-1775960301317-463	PURCHASE	330	0	c1cac9a5-2619-40c6-9b18-a61e2beb9ea7	Purchase Bill PUR-1775960301317-463	2026-04-12 02:18:21.449
26972784-7f9c-42f9-9878-b3bef2d20f65	b5f527ea-7d74-4613-82e9-f72a4b28f004	cmm7kijlt000111fe6p8fx3q9	PAY-P-C1CAC9A5	PAYMENT	330	0	c1cac9a5-2619-40c6-9b18-a61e2beb9ea7	Immediate payment for bill PUR-1775960301317-463	2026-04-12 02:18:21.476
b2bcf8c5-1171-439b-bca8-7bdc1fdab6b2	8398e9aa-83f2-4639-94f3-d9526fe52e21	cmm7kijlt000111fe6p8fx3q9	PUR-1775970940944-323	PURCHASE	25	0	ad9992da-89c5-447b-bab8-c624e4cfceef	Purchase Bill PUR-1775970940944-323	2026-04-12 05:15:41.137
9bc5123c-9e07-4cc2-80e6-28b6593d9832	8398e9aa-83f2-4639-94f3-d9526fe52e21	cmm7kijlt000111fe6p8fx3q9	PAY-P-AD9992DA	PAYMENT	25	0	ad9992da-89c5-447b-bab8-c624e4cfceef	Immediate payment for bill PUR-1775970940944-323	2026-04-12 05:15:41.168
\.


--
-- Data for Name: SystemSetting; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SystemSetting" (id, key, value, "updatedAt", "createdAt", "storeId") FROM stdin;
43ae3188-e281-441d-9bb3-984aaf764be6	panNumber	622404879	2026-04-10 12:32:29.51	2026-03-31 18:13:45.272	cmm7kijlt000111fe6p8fx3q9
a7fa3ec6-12b4-40f4-a545-3a875a8b6d13	name	Kund Coffee Private Limited	2026-04-10 12:32:29.512	2026-03-31 18:13:45.272	cmm7kijlt000111fe6p8fx3q9
186b82d1-1690-453e-91e7-c296f2d33ee1	currency	NPR	2026-04-13 06:48:11.269	2026-04-13 06:48:11.269	cmnwtzlj70001rzknw31i84kl
7c2c7690-5455-4069-9022-764096bd413e	currency	NPR	2026-04-04 12:00:47.249	2026-04-04 12:00:47.249	cmnka6xqp0001emd4z20d0lds
87d178d2-b8d6-43cb-9f0d-6fde44e4b7ff	currency	NPR	2026-04-05 06:26:37.335	2026-04-05 06:03:36.861	cmnlcvfo70002lt8xmmgez07z
80eb8b11-e9c9-4cb4-bfdb-1eda4ee2fbe0	name		2026-04-05 06:26:37.344	2026-04-05 06:26:37.344	cmnlcvfo70002lt8xmmgez07z
1a3176a6-9b92-4d95-8eda-c50b4a3afe97	email		2026-04-05 06:26:37.349	2026-04-05 06:26:37.349	cmnlcvfo70002lt8xmmgez07z
bb8641f3-a488-4c88-88b1-7fc51d6fc753	phone		2026-04-05 06:26:37.346	2026-04-05 06:26:37.346	cmnlcvfo70002lt8xmmgez07z
e87cfcc1-7bda-4d54-9e59-36fdf635508e	address		2026-04-05 06:26:37.345	2026-04-05 06:26:37.345	cmnlcvfo70002lt8xmmgez07z
06f7604d-0c45-42cd-a23e-427fba08a6d9	panNumber		2026-04-05 06:26:37.347	2026-04-05 06:26:37.347	cmnlcvfo70002lt8xmmgez07z
805aca8d-a583-45d4-94cb-215635b0c925	logo	https://res.cloudinary.com/dvvtvhgop/image/upload/v1775823933/settings/ogwuetenrccbnbkytrlm.png	2026-04-10 12:25:33.967	2026-03-31 18:13:56.914	cmm7kijlt000111fe6p8fx3q9
fe85e84a-4aec-4f46-a01d-83c3a03541dd	phone	9763681946	2026-04-10 12:32:28.413	2026-03-31 18:13:45.272	cmm7kijlt000111fe6p8fx3q9
e4ec0c9b-994e-4760-a432-910e7e25a331	currency	Rs.	2026-04-10 12:32:28.424	2026-03-31 18:13:45.272	cmm7kijlt000111fe6p8fx3q9
627ca1ef-b919-4f6c-8363-1612b0cf9f45	address	Golfutar, Kathmandu, Nepal	2026-04-10 12:32:28.439	2026-03-31 18:13:45.272	cmm7kijlt000111fe6p8fx3q9
b7de4124-3872-47a0-94dc-6769c6fe34e3	email	kundcoffee@gmail.com	2026-04-10 12:32:29.509	2026-03-31 18:13:45.272	cmm7kijlt000111fe6p8fx3q9
bd3ea34c-f3b9-4819-9b5d-653dfc8ac533	logo	https://res.cloudinary.com/dvvtvhgop/image/upload/v1774765874/settings/jamrluhpipsxdg1oidol.png	2026-03-29 06:31:15.161	2026-03-29 06:00:02.079	cmm7kb82i0002ku1gbbh63hr0
119d4b3e-56f4-48fa-bf0b-0394427b4903	currency	NPR	2026-03-29 07:16:11.717	2026-03-01 09:43:22.056	cmm7kb82i0002ku1gbbh63hr0
0410fae5-e5bd-4b61-a8ad-54bdd3f95b81	panNumber	622404879	2026-03-29 07:16:11.746	2026-03-29 05:59:55.637	cmm7kb82i0002ku1gbbh63hr0
3eaac327-7d15-423b-8dff-2bef3bbd8679	address	Golfutar Height, Kathmnadu Nepal	2026-03-29 07:16:11.763	2026-03-29 05:59:55.637	cmm7kb82i0002ku1gbbh63hr0
28aa2d65-c083-4e1a-9cce-a9e78bd7ee9c	name	Kund Coffee Private Limited	2026-03-29 07:16:11.766	2026-03-29 05:59:55.637	cmm7kb82i0002ku1gbbh63hr0
8cfcf8a6-4a30-4570-9401-d6a83c235524	phone	9763681946	2026-03-29 07:16:11.735	2026-03-29 05:59:55.637	cmm7kb82i0002ku1gbbh63hr0
2a5eed68-3593-464a-8383-32104d359beb	email	kundcoffee@gmail.com	2026-03-29 07:16:12.018	2026-03-29 05:59:55.643	cmm7kb82i0002ku1gbbh63hr0
cc8fc955-043d-43e5-a59f-b19da9e1b7d2	includeTaxByDefault	false	2026-03-29 07:18:06.147	2026-03-02 12:13:09.457	cmm7kb82i0002ku1gbbh63hr0
be9efbdc-18cb-4a5f-9d8c-f33fa838f000	restaurantName	A's Coffee Shop	2026-03-31 17:12:35.405	2026-03-31 17:12:35.405	store-a-id
7acdcce5-d4f5-4b51-b174-980a6158c767	restaurantName	B's Bakery	2026-03-31 17:12:36.513	2026-03-31 17:12:36.513	store-b-id
\.


--
-- Data for Name: Table; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Table" (id, name, capacity, status, "spaceId", "createdAt", "tableTypeId", "isDeleted", "sortOrder", "storeId") FROM stdin;
dd5d5a48-ff9e-43ea-a88d-450192cf2537	T-1	4	OCCUPIED	c4975df4-a95e-488d-844c-217670013ae4	2026-04-04 12:04:19.428	db84aa7f-1a25-4e41-9246-3629dcf81de0	f	1	cmnka6xqp0001emd4z20d0lds
a60205e9-e82c-44a9-9428-51bdbce25776	Outside Table-03	2	ACTIVE	1528024f-cd91-477a-8219-444746bcf15b	2026-03-22 02:53:08.681	b91db767-fc71-43fd-8c75-4d023e54ebc5	f	3	cmm7kijlt000111fe6p8fx3q9
ea658cd0-6791-4a60-b46f-75658968cdfb	Outside Table-04	2	ACTIVE	1528024f-cd91-477a-8219-444746bcf15b	2026-03-22 02:54:19.18	1d8b4cfc-01d1-4efc-82e6-0bfce56e0f3a	f	4	cmm7kijlt000111fe6p8fx3q9
8b27d168-361c-40b0-9d75-fc3585635e8a	Dining Table	6	ACTIVE	c83a4f26-ec30-4b0e-ac11-50e2405a3b95	2026-03-24 00:50:18.397	b91db767-fc71-43fd-8c75-4d023e54ebc5	f	6	cmm7kijlt000111fe6p8fx3q9
36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	Inside Table -01	2	ACTIVE	c83a4f26-ec30-4b0e-ac11-50e2405a3b95	2026-03-22 02:00:43.833	2bf930da-3338-4065-b63e-c13743db72ff	f	1	cmm7kijlt000111fe6p8fx3q9
3aa90282-df15-4e32-8996-9f575e1226ef	Inside Table-05	2	ACTIVE	c83a4f26-ec30-4b0e-ac11-50e2405a3b95	2026-03-22 02:48:47.992	2bf930da-3338-4065-b63e-c13743db72ff	f	5	cmm7kijlt000111fe6p8fx3q9
06eaa489-29d7-4f1d-b03b-320a422e09c6	T2	6	ACTIVE	bdc46d48-99f9-495b-9922-d7d62c2299ff	2026-03-05 17:51:05.816	394a7c5d-57d0-47e9-9ad6-1b45c0eda1da	f	1	cmm7kb82i0002ku1gbbh63hr0
2255ea55-e0db-4084-8fdf-393033c04c48	Table 1	4	ACTIVE	5575fccf-fb8f-4141-ade6-00b51cf13a1e	2026-03-01 09:45:00.586	394a7c5d-57d0-47e9-9ad6-1b45c0eda1da	f	1	cmm7kb82i0002ku1gbbh63hr0
bf416ec2-8e42-4516-9ca6-8961492b4458	T-1	4	ACTIVE	ae9981f7-322a-4909-96ca-308175274d8b	2026-04-05 06:05:16.046	465bf372-616f-410e-92a2-dfce6de441dc	f	1	cmnlcvfo70002lt8xmmgez07z
9e26f846-ee14-42dc-b6d3-948acfe8f18f	t3	4	OCCUPIED	5575fccf-fb8f-4141-ade6-00b51cf13a1e	2026-03-05 17:56:16.815	394a7c5d-57d0-47e9-9ad6-1b45c0eda1da	f	2	cmm7kb82i0002ku1gbbh63hr0
88391a93-eaa8-4e0e-a27b-fd8cb1478d8a	Outside Table-01	4	ACTIVE	1528024f-cd91-477a-8219-444746bcf15b	2026-03-22 02:51:56.305	2bf930da-3338-4065-b63e-c13743db72ff	f	1	cmm7kijlt000111fe6p8fx3q9
8b1b6b1f-1839-4641-9d6c-ea28f262a8d9	Inside Table-07	3	ACTIVE	c83a4f26-ec30-4b0e-ac11-50e2405a3b95	2026-03-22 02:50:14.264	40a90b3c-c3ea-44c5-8c69-f15960a74b55	f	7	cmm7kijlt000111fe6p8fx3q9
d1f87f20-7913-41dc-b03a-4db6fd01dafc	Outside Table-02	4	ACTIVE	1528024f-cd91-477a-8219-444746bcf15b	2026-03-22 02:52:38.495	2bf930da-3338-4065-b63e-c13743db72ff	f	2	cmm7kijlt000111fe6p8fx3q9
15511477-7788-47a7-9171-c6562425da72	Inside Table-03	4	ACTIVE	c83a4f26-ec30-4b0e-ac11-50e2405a3b95	2026-03-02 11:59:48.838	b91db767-fc71-43fd-8c75-4d023e54ebc5	f	3	cmm7kijlt000111fe6p8fx3q9
980a2582-3dbc-4d26-96ca-be0f4ae3a9f0	Inside Table-02	4	ACTIVE	c83a4f26-ec30-4b0e-ac11-50e2405a3b95	2026-03-06 07:03:18.603	54037063-f612-4461-9a09-802e4f40764a	f	2	cmm7kijlt000111fe6p8fx3q9
51085af7-c452-435a-9bcd-6038aba00da7	Inside Table-04	4	ACTIVE	c83a4f26-ec30-4b0e-ac11-50e2405a3b95	2026-03-22 02:21:58.807	ba2c9e26-a9ea-4c61-9e67-1dd19fd5dbb1	f	4	cmm7kijlt000111fe6p8fx3q9
\.


--
-- Data for Name: TableSession; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."TableSession" (id, "tableId", "startedAt", "endedAt", total, "serviceCharge", tax, "grandTotal", "isActive", discount, "storeId") FROM stdin;
7ced9b6b-7b5a-450e-98da-29d5ad7fe12e	15511477-7788-47a7-9171-c6562425da72	2026-03-02 12:12:37.2	2026-03-02 12:14:23.919	1500	0	0	1350	f	150	cmm7kijlt000111fe6p8fx3q9
65e3bfa5-a2e7-4a6c-a45c-88ab22e87cbb	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	2026-03-24 11:27:42.04	2026-03-24 14:00:40.16	150	0	0	150	f	0	cmm7kijlt000111fe6p8fx3q9
f5f633d0-49af-4fde-897d-589cf07d254a	15511477-7788-47a7-9171-c6562425da72	2026-03-02 12:16:10.04	2026-03-03 18:28:21.943	450	0	0	450	f	0	cmm7kijlt000111fe6p8fx3q9
cfaff52f-5760-46c6-85f2-2d6de967d618	2255ea55-e0db-4084-8fdf-393033c04c48	2026-03-01 09:45:18.699	2026-03-05 17:33:41.608	180	0	0	180	f	0	cmm7kb82i0002ku1gbbh63hr0
87e14be8-88bc-45c0-944b-f3bf1f58b6eb	2255ea55-e0db-4084-8fdf-393033c04c48	2026-03-05 17:48:26.432	\N	0	0	0	0	t	0	cmm7kb82i0002ku1gbbh63hr0
66b20951-7abb-4512-bb1d-1b4e91e72e50	06eaa489-29d7-4f1d-b03b-320a422e09c6	2026-03-05 17:51:24.707	\N	0	0	0	0	t	0	cmm7kb82i0002ku1gbbh63hr0
fe2f6f57-0d67-4273-9841-abb91c935548	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	2026-03-25 04:31:58.051	2026-03-27 12:06:43.03	150	0	0	150	f	0	cmm7kijlt000111fe6p8fx3q9
5321dcdf-3721-4bed-b13a-61e62cf6123d	9e26f846-ee14-42dc-b6d3-948acfe8f18f	2026-03-05 17:56:36.124	2026-03-05 18:09:20.177	180	0	0	180	f	0	cmm7kb82i0002ku1gbbh63hr0
56c758e8-e408-4fb5-9c87-d1bdd716ae6c	15511477-7788-47a7-9171-c6562425da72	2026-03-04 07:06:33.235	2026-03-06 06:42:06.893	150	0	0	150	f	0	cmm7kijlt000111fe6p8fx3q9
0c1a6032-cd10-4a05-8831-a078cae66cd0	9e26f846-ee14-42dc-b6d3-948acfe8f18f	2026-03-05 18:33:14.388	2026-03-06 10:52:38.926	980	0	0	980	f	0	cmm7kb82i0002ku1gbbh63hr0
af1a38ce-9a64-49df-98a5-86161dd840a4	9e26f846-ee14-42dc-b6d3-948acfe8f18f	2026-03-06 10:58:00.572	2026-03-06 10:58:31.808	800	0	0	720	f	80	cmm7kb82i0002ku1gbbh63hr0
5baf50a7-38bd-440c-b455-5045b8f0bcaa	9e26f846-ee14-42dc-b6d3-948acfe8f18f	2026-03-06 10:59:43.056	\N	0	0	0	0	t	0	cmm7kb82i0002ku1gbbh63hr0
c4512671-d745-4517-b145-4af70ab7af5f	980a2582-3dbc-4d26-96ca-be0f4ae3a9f0	2026-03-06 07:10:11.407	2026-03-21 13:01:59.578	150	0	0	150	f	0	cmm7kijlt000111fe6p8fx3q9
4837dac4-085b-4c3e-af3e-a2b1a8bb4f38	15511477-7788-47a7-9171-c6562425da72	2026-03-06 06:42:20.871	2026-03-21 13:02:29.081	600	0	0	600	f	0	cmm7kijlt000111fe6p8fx3q9
b1970bae-7989-443a-84df-140e503f48da	15511477-7788-47a7-9171-c6562425da72	2026-03-21 13:02:44.137	2026-03-21 13:11:16.195	300	0	0	200	f	100	cmm7kijlt000111fe6p8fx3q9
ba389e4e-2012-4505-8707-1bfa26e8e500	51085af7-c452-435a-9bcd-6038aba00da7	2026-03-23 06:49:44.213	2026-03-23 06:50:19.412	150	0	0	150	f	0	cmm7kijlt000111fe6p8fx3q9
96ac8b64-1d81-4919-8589-ed0c22aebf62	980a2582-3dbc-4d26-96ca-be0f4ae3a9f0	2026-03-21 13:11:25.404	2026-03-23 08:30:39.344	150	0	0	150	f	0	cmm7kijlt000111fe6p8fx3q9
b8cc8229-85e6-4418-b2b8-386c06bb8ffb	8b27d168-361c-40b0-9d75-fc3585635e8a	2026-03-24 02:09:33.041	2026-03-24 14:00:29.883	450	0	0	450	f	0	cmm7kijlt000111fe6p8fx3q9
0034cb45-b082-4892-825f-a759c4c2b345	8b27d168-361c-40b0-9d75-fc3585635e8a	2026-03-28 04:08:21.911	2026-03-28 04:09:04.311	150	0	0	150	f	0	cmm7kijlt000111fe6p8fx3q9
1db95613-3b8b-4521-b417-48828d717f35	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	2026-03-28 04:23:44.48	2026-03-28 11:45:26.227	300	0	0	300	f	0	cmm7kijlt000111fe6p8fx3q9
28ea4a7f-c542-4325-8e66-9f132723e9bf	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	2026-03-28 11:49:01.186	2026-03-28 11:49:18.478	0	0	0	0	f	0	cmm7kijlt000111fe6p8fx3q9
41aa14b1-1dd8-48a3-b6c1-b6827701cc73	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	2026-03-28 12:20:02.386	2026-03-28 12:20:11.594	0	0	0	0	f	0	cmm7kijlt000111fe6p8fx3q9
83c1e40b-06f0-4d18-8220-c194985f0a71	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	2026-03-28 12:22:53.802	2026-03-28 12:25:17.359	590	0	0	590	f	0	cmm7kijlt000111fe6p8fx3q9
795ac5e8-9d62-4999-b413-c0d9501a95e4	980a2582-3dbc-4d26-96ca-be0f4ae3a9f0	2026-03-28 12:26:25.661	2026-03-29 06:59:23.508	0	0	0	0	f	0	cmm7kijlt000111fe6p8fx3q9
a5e544ff-a949-4b75-aaf5-c389483ae5b6	88391a93-eaa8-4e0e-a27b-fd8cb1478d8a	2026-03-29 06:55:21.616	2026-03-29 06:59:31.205	0	0	0	0	f	0	cmm7kijlt000111fe6p8fx3q9
94d6e522-c207-4fe8-9acb-5da5f48c585e	980a2582-3dbc-4d26-96ca-be0f4ae3a9f0	2026-03-29 07:46:51.235	2026-03-29 14:10:15.076	1940	0	0	1940	f	0	cmm7kijlt000111fe6p8fx3q9
7e9a3c88-c057-4a34-9135-e2d8cac4e70d	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	2026-03-29 06:59:46.403	2026-03-29 14:41:46.859	150	0	0	150	f	0	cmm7kijlt000111fe6p8fx3q9
cdcf0e08-60b7-493b-b243-a7e134860a40	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	2026-03-30 05:50:39.288	2026-03-30 05:51:03.157	175	0	0	175	f	0	cmm7kijlt000111fe6p8fx3q9
f526a57c-25c6-4c7a-b7d1-de89db25d32e	980a2582-3dbc-4d26-96ca-be0f4ae3a9f0	2026-03-30 11:57:01.763	2026-03-31 18:18:31.857	590	0	0	590	f	0	cmm7kijlt000111fe6p8fx3q9
49637432-0a64-4341-8c69-a543d944761b	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	2026-03-30 06:08:23.986	2026-04-02 00:59:52.528	300	0	0	300	f	0	cmm7kijlt000111fe6p8fx3q9
5c90dc18-a877-4801-b3a1-7129c6a00a8d	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	2026-04-02 01:00:19.211	2026-04-03 02:46:19.501	5085	0	0	5085	f	0	cmm7kijlt000111fe6p8fx3q9
536d96d1-64e1-4627-9ae2-4d3b457fa346	88391a93-eaa8-4e0e-a27b-fd8cb1478d8a	2026-04-03 02:46:38.423	2026-04-03 02:46:47.003	150	0	0	150	f	0	cmm7kijlt000111fe6p8fx3q9
a547495d-3fde-470c-b0f3-ad3c00ac79d3	dd5d5a48-ff9e-43ea-a88d-450192cf2537	2026-04-04 12:06:27.034	\N	0	0	0	0	t	0	cmnka6xqp0001emd4z20d0lds
c0375656-19d6-4347-8dec-601f23120284	bf416ec2-8e42-4516-9ca6-8961492b4458	2026-04-05 06:05:54.432	2026-04-05 06:06:22.336	120	0	0	120	f	0	cmnlcvfo70002lt8xmmgez07z
af878a88-63c3-4267-ab65-438d447a5838	bf416ec2-8e42-4516-9ca6-8961492b4458	2026-04-05 06:29:24.58	2026-04-05 06:29:51.265	10720	0	0	10720	f	0	cmnlcvfo70002lt8xmmgez07z
c2814292-f496-4e9b-9b9d-ba3209ef0f9d	bf416ec2-8e42-4516-9ca6-8961492b4458	2026-04-05 06:31:11.824	2026-04-05 06:31:33.941	11700	0	0	11700	f	0	cmnlcvfo70002lt8xmmgez07z
b262e374-07f9-4041-b57c-8ec8ece07816	bf416ec2-8e42-4516-9ca6-8961492b4458	2026-04-05 10:46:14.865	2026-04-05 10:46:42.514	2060	0	0	2060	f	0	cmnlcvfo70002lt8xmmgez07z
a3fdba39-b51e-4905-897a-27c344d4bcb1	8b27d168-361c-40b0-9d75-fc3585635e8a	2026-04-03 02:46:59.393	2026-04-07 09:38:25.706	300	0	0	300	f	0	cmm7kijlt000111fe6p8fx3q9
47fc9c92-ae5d-46c1-a211-50cf1ab77e87	bf416ec2-8e42-4516-9ca6-8961492b4458	2026-04-06 12:51:58.721	2026-04-06 12:52:26.016	60	0	0	60	f	0	cmnlcvfo70002lt8xmmgez07z
617ec160-f48d-48b3-9e81-7f488cbfdb61	bf416ec2-8e42-4516-9ca6-8961492b4458	2026-04-06 12:53:26.587	\N	0	0	0	0	t	0	cmnlcvfo70002lt8xmmgez07z
e5d70a3c-242b-4720-887d-134e06eb7393	bf416ec2-8e42-4516-9ca6-8961492b4458	2026-04-06 12:53:26.274	2026-04-06 12:54:01.803	300	0	0	300	f	0	cmnlcvfo70002lt8xmmgez07z
8a80b238-9d6f-43bb-9d7d-b91b0ce1e920	8b27d168-361c-40b0-9d75-fc3585635e8a	2026-04-07 09:39:20.806	2026-04-07 09:39:31.543	150	0	0	150	f	0	cmm7kijlt000111fe6p8fx3q9
60d4f20d-a21e-4ab7-9b04-101b8eb8426e	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	2026-04-07 09:41:16.863	2026-04-07 09:41:32.295	150	0	0	150	f	0	cmm7kijlt000111fe6p8fx3q9
5e511ad4-f183-45ec-ac4d-638c5338da80	8b1b6b1f-1839-4641-9d6c-ea28f262a8d9	2026-04-08 06:34:06.07	2026-04-08 06:36:35.21	450	0	0	450	f	0	cmm7kijlt000111fe6p8fx3q9
fb7a35fb-bc87-4b86-bd8b-855c605553ec	15511477-7788-47a7-9171-c6562425da72	2026-04-08 06:37:35.421	2026-04-08 06:37:52.946	360	0	0	360	f	0	cmm7kijlt000111fe6p8fx3q9
57fdb571-bc39-42ab-a574-e49ef7ed1775	d1f87f20-7913-41dc-b03a-4db6fd01dafc	2026-04-08 06:38:58.736	2026-04-08 06:39:38.327	220	0	0	220	f	0	cmm7kijlt000111fe6p8fx3q9
39c18f91-e87a-42c3-8634-98af1b5a3a53	980a2582-3dbc-4d26-96ca-be0f4ae3a9f0	2026-04-08 06:41:58.799	2026-04-08 06:42:24.717	815	0	0	815	f	0	cmm7kijlt000111fe6p8fx3q9
13267c44-6243-409d-8390-b0f1f077fe78	88391a93-eaa8-4e0e-a27b-fd8cb1478d8a	2026-04-08 06:45:39.514	2026-04-08 06:48:14.262	575	0	0	575	f	0	cmm7kijlt000111fe6p8fx3q9
980e056a-b0f4-4464-afce-12829b1cff14	8b27d168-361c-40b0-9d75-fc3585635e8a	2026-04-08 07:04:46.924	2026-04-08 07:06:13.836	750	0	0	500	f	250	cmm7kijlt000111fe6p8fx3q9
025ac296-2857-4a1c-8196-a7951f420d08	8b27d168-361c-40b0-9d75-fc3585635e8a	2026-04-10 09:52:52.594	2026-04-10 10:10:43.192	150	0	0	100	f	50	cmm7kijlt000111fe6p8fx3q9
55b93113-f66b-4c17-ad23-da57928b19aa	8b27d168-361c-40b0-9d75-fc3585635e8a	2026-04-10 10:16:18.098	2026-04-10 10:18:01.605	100	0	0	100	f	0	cmm7kijlt000111fe6p8fx3q9
b0e9ad93-2a25-484f-8d84-20f198baf549	8b27d168-361c-40b0-9d75-fc3585635e8a	2026-04-10 10:19:07.737	2026-04-10 10:20:05.804	150	0	0	100	f	50	cmm7kijlt000111fe6p8fx3q9
e1ec832f-ccb2-4fc8-b1f6-556ba4c1d8f4	d1f87f20-7913-41dc-b03a-4db6fd01dafc	2026-04-10 10:21:28.057	2026-04-10 10:22:07.458	200	0	0	200	f	0	cmm7kijlt000111fe6p8fx3q9
4280e152-8d83-43cc-b5a4-4e490a3dd80d	8b27d168-361c-40b0-9d75-fc3585635e8a	2026-04-10 10:23:10.14	2026-04-10 10:23:53.413	300	0	0	300	f	0	cmm7kijlt000111fe6p8fx3q9
3e97fbe0-8625-405e-8507-41ebe754764e	980a2582-3dbc-4d26-96ca-be0f4ae3a9f0	2026-04-10 10:28:38.163	2026-04-10 11:03:21.766	960	0	0	960	f	0	cmm7kijlt000111fe6p8fx3q9
26c69a46-1482-4b6b-8ce0-e7f784000651	d1f87f20-7913-41dc-b03a-4db6fd01dafc	2026-04-10 11:05:51.988	2026-04-10 11:06:12.259	150	0	0	150	f	0	cmm7kijlt000111fe6p8fx3q9
f737ea66-10a4-492a-90f8-a82aa44dc1c2	88391a93-eaa8-4e0e-a27b-fd8cb1478d8a	2026-04-10 11:08:52.833	2026-04-10 11:09:39.569	150	0	0	150	f	0	cmm7kijlt000111fe6p8fx3q9
81d5f827-d97b-4c94-8d03-88e913c096e7	51085af7-c452-435a-9bcd-6038aba00da7	2026-04-10 11:10:14.436	2026-04-10 11:10:46.181	150	0	0	100	f	50	cmm7kijlt000111fe6p8fx3q9
a313017f-9f22-4807-b79f-fe2c38e9ab0e	d1f87f20-7913-41dc-b03a-4db6fd01dafc	2026-04-10 11:11:30.546	2026-04-10 11:11:59.173	50	0	0	50	f	0	cmm7kijlt000111fe6p8fx3q9
9112b463-e7d6-4f19-ae5d-e5364cba7a92	a60205e9-e82c-44a9-9428-51bdbce25776	2026-04-10 11:12:41.924	2026-04-10 11:14:21.43	100	0	0	100	f	0	cmm7kijlt000111fe6p8fx3q9
fbb0fdec-0615-4f1b-9e3c-b2b5f255788e	51085af7-c452-435a-9bcd-6038aba00da7	2026-04-10 11:16:24.458	2026-04-10 11:16:43.946	480	0	0	480	f	0	cmm7kijlt000111fe6p8fx3q9
1efbcd23-5a7a-41de-959c-f0253d9bc75c	88391a93-eaa8-4e0e-a27b-fd8cb1478d8a	2026-04-10 13:15:13.883	2026-04-10 13:17:14.516	840	0	0	756	f	84	cmm7kijlt000111fe6p8fx3q9
be5ce2fe-d9d2-476d-a552-001b43f95eb9	ea658cd0-6791-4a60-b46f-75658968cdfb	2026-04-10 13:20:30.777	2026-04-10 13:20:45.419	50	0	0	50	f	0	cmm7kijlt000111fe6p8fx3q9
2717ac8c-b739-4a96-9f2a-1cec3ed90d38	8b27d168-361c-40b0-9d75-fc3585635e8a	2026-04-11 13:44:04.624	2026-04-11 13:44:39.918	750	0	0	750	f	0	cmm7kijlt000111fe6p8fx3q9
e75d56a5-9a75-4d41-9ea0-1f4054dbd362	d1f87f20-7913-41dc-b03a-4db6fd01dafc	2026-04-11 13:46:25.926	2026-04-11 13:46:35.57	270	0	0	270	f	0	cmm7kijlt000111fe6p8fx3q9
e2d5e759-cb18-4071-9a99-6f0c0c589a34	88391a93-eaa8-4e0e-a27b-fd8cb1478d8a	2026-04-11 13:48:11.266	2026-04-11 13:48:39.528	900	0	0	900	f	0	cmm7kijlt000111fe6p8fx3q9
519ffec8-4e48-474b-84c3-bfd639aa565f	36b0ccc8-1ebc-4f38-8ddf-9aa49a9ca1f6	2026-04-11 13:49:27.078	2026-04-11 13:49:46.8	300	0	0	300	f	0	cmm7kijlt000111fe6p8fx3q9
a73f1c4d-c785-4dd8-81cb-444a65d13b9c	3aa90282-df15-4e32-8996-9f575e1226ef	2026-04-11 13:50:39.199	2026-04-11 13:51:08.109	325	0	0	325	f	0	cmm7kijlt000111fe6p8fx3q9
eb856a3f-3ee1-488d-854d-7ca354dc1a09	d1f87f20-7913-41dc-b03a-4db6fd01dafc	2026-04-11 13:57:07.612	2026-04-11 13:57:24.165	250	0	0	250	f	0	cmm7kijlt000111fe6p8fx3q9
89b00304-4449-4f11-9539-dba1fea5138d	a60205e9-e82c-44a9-9428-51bdbce25776	2026-04-11 13:59:22.388	2026-04-11 13:59:41.834	890	0	0	890	f	0	cmm7kijlt000111fe6p8fx3q9
7659f3d3-5d0e-448c-a568-563251fc3f2b	88391a93-eaa8-4e0e-a27b-fd8cb1478d8a	2026-04-11 14:00:32.785	2026-04-11 14:01:04.296	150	0	0	150	f	0	cmm7kijlt000111fe6p8fx3q9
0af6b812-e3f1-4a6b-a603-6d5412ba8934	d1f87f20-7913-41dc-b03a-4db6fd01dafc	2026-04-11 14:03:28.631	2026-04-11 14:03:56.56	1535	0	0	1535	f	0	cmm7kijlt000111fe6p8fx3q9
\.


--
-- Data for Name: TableType; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."TableType" (id, name, "storeId") FROM stdin;
394a7c5d-57d0-47e9-9ad6-1b45c0eda1da	chair	cmm7kb82i0002ku1gbbh63hr0
d3492015-be3c-4df7-b56b-d0b591f95c02	Chairs	cmm7kijlt000111fe6p8fx3q9
ba2c9e26-a9ea-4c61-9e67-1dd19fd5dbb1	Good for premium vibe	cmm7kijlt000111fe6p8fx3q9
54037063-f612-4461-9a09-802e4f40764a	Good for families or meetings	cmm7kijlt000111fe6p8fx3q9
b91db767-fc71-43fd-8c75-4d023e54ebc5	Flexible	cmm7kijlt000111fe6p8fx3q9
65cede94-6b2c-4df1-8ec9-dcfe58c32311	Standards table for small groups	cmm7kijlt000111fe6p8fx3q9
2bf930da-3338-4065-b63e-c13743db72ff	More comfort, longer stay	cmm7kijlt000111fe6p8fx3q9
40a90b3c-c3ea-44c5-8c69-f15960a74b55	Small table with couch seating	cmm7kijlt000111fe6p8fx3q9
1d8b4cfc-01d1-4efc-82e6-0bfce56e0f3a	Narrow table facing window	cmm7kijlt000111fe6p8fx3q9
db84aa7f-1a25-4e41-9246-3629dcf81de0	chair	cmnka6xqp0001emd4z20d0lds
465bf372-616f-410e-92a2-dfce6de441dc	Chair	cmnlcvfo70002lt8xmmgez07z
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."User" (id, name, email, password, role, "storeId", "emailVerified", "isSetupComplete", "trialEndsAt", "verificationCode", "verificationCodeExpires", permissions) FROM stdin;
cmm7khlgy0000psrrkqq4fx2r	\N	kundcoffee@gmail.com	$2b$10$zl3owHCPz/f9B/TWseJt0OrHz/E95.jEQT2.nDS8TsmRCakpkaQ5O	ADMIN	cmm7kijlt000111fe6p8fx3q9	2026-03-01 09:48:54.046	t	2026-03-08 09:48:54.046	\N	\N	{}
cmmgbl6h50000y2h0dapf4uuz	\N	oregon@gmail.com	$2b$10$VRG1Z7aqy7QS2QCOS5gRf.Vu6KQcV/7HgpcE1/Ao5TBbLfe/5Cgny	ADMIN	cmmgbodh000014lx7fomr3a5w	2026-03-07 12:51:23.728	t	2026-03-14 12:51:23.727	\N	\N	{}
cmmt5n3yb00009kqd59qsf9e8	\N	test@gmail.com	$2b$10$PXY6Y8ZNwDZuPDh5xlp0s.d9bKp238KVlc5xllILVmS4BcSKjdylG	ADMIN	cmmt5o3f800029kqdwwypongu	2026-03-16 12:24:10.579	t	2026-03-23 12:24:10.577	\N	\N	{}
cmn06x1yw000131tt2rdz8soe	ram	info@kundcoffee.com	$2b$10$dtFFCJMQ106MmnqcZ1oakeoOg2VSxPPqXmfWRBnHb2qsTdAxL0ztC	CASHIER	cmm7kijlt000111fe6p8fx3q9	2026-03-21 10:33:43.734	t	\N	\N	\N	{manage_menu,pos_access}
cmnka52y30000e2cd8h56aut9	\N	rimjhimChautari@gmail.com	$2b$10$koiMERKiN6kG0ZIxmxfbk./aAJktXWdSsHTy2G8Kz9L75yhMtVSzW	ADMIN	cmnka6xqp0001emd4z20d0lds	2026-04-04 12:00:17.049	t	2026-04-11 12:00:17.049	\N	\N	{}
cmnlcuorj0000lt8xuszlhaly	\N	lamayoundhen929@gmail.com	$2b$10$SuE8DrcNla.G3NRd.rxCbuoXlDKWb8k/6/Ro2OHdd005kJXrz/drm	ADMIN	cmnlcvfo70002lt8xmmgez07z	2026-04-05 06:03:28.173	t	2026-04-12 06:03:28.171	\N	\N	{}
cmnwtuk020000kaot7onhpdj8	\N	bhuban.acharya@gmail.com	$2b$10$S5j.ZLDpHAhi0djQSrkwBeNG4Ki8pkmc/JCINyJczbmbTmMCLkzTC	ADMIN	cmnwtzlj70001rzknw31i84kl	2026-04-13 06:47:56.452	t	2026-04-20 06:47:56.452	\N	\N	{}
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
7bc6facb-e6e8-4195-bb4b-589d005d1aa1	d50b707e2fbdc6bce7ccc43376fc19c2d4679e4c6e13b8eb1adefed6950220fb	2026-03-01 09:25:55.13467+00	20260301092551_crm_and_erm_and_inventory	\N	\N	2026-03-01 09:25:53.299737+00	1
c00a6023-1eaa-4d13-a3b4-677865645503	17d6b75a2b5882b3a4bfbe00b31e869a61e68c657b522c6c9b978a3bc784a594	2026-03-01 09:23:54.979342+00	20260115173249_init	\N	\N	2026-03-01 09:23:53.352187+00	1
75deb8af-5eb2-48b5-bf20-5bd0985ec7db	2d7137102b7c7bdb1995d83c9bb4a82c2b643f3c4a19833bb89693849b155723	2026-03-01 09:24:23.159292+00	20260127123604_add_reservation_schema_and_reservation_time_and_reseravtion_status	\N	\N	2026-03-01 09:24:21.643926+00	1
c76ed206-5c17-4624-9216-5147ca74497c	6fe43a4a4fc05448cc7e278bcf83dba5fe0689cd0ee98efd81514d88fa356481	2026-03-01 09:23:57.151421+00	20260116121851_add_table_type_optional	\N	\N	2026-03-01 09:23:55.61676+00	1
cac4da6f-4c46-4c96-aebe-f32eb1cec0d8	e4b33fddf58f792309c3a7e32858c5aef3d0285f77045f19d8871254eb8208e5	2026-03-01 09:23:59.39595+00	20260118120838_fix_schema_relations	\N	\N	2026-03-01 09:23:57.76262+00	1
13dcbf00-636f-4035-97c3-a49a01f7570c	ed309e2fd02a83cd5e82e0b6fd13aa989e0bc3a0317244e8f765f58b1754d604	2026-03-01 09:24:40.734783+00	20260208044824_credit_category_option	\N	\N	2026-03-01 09:24:38.923491+00	1
b6f5ad01-a526-46da-9426-545ab7d2a959	009faa17cf716696afe7cc05b2a6916229d6fb4dbac84fb7ba41024693a25bdf	2026-03-01 09:24:01.648483+00	20260121094057_fix_image_array	\N	\N	2026-03-01 09:24:00.004738+00	1
62325824-b9ee-432c-ba71-fdaeb7226c00	32f9749801705a5cf43c85c10f5624bac09bf52bf3c21d232fab6100e644ee56	2026-03-01 09:24:25.285402+00	20260127124157_add_reservation_schema_and_reservation_time_and_reseravtion_status	\N	\N	2026-03-01 09:24:23.765139+00	1
9223061a-d42c-42ca-814a-d020e74dfd3b	5483a26b58377249287c0f1a17bd2115f2856ea34b3e332a2cc8f92543c8e24d	2026-03-01 09:24:03.779968+00	20260121113416_update_measuring_unit	\N	\N	2026-03-01 09:24:02.264488+00	1
7b098d19-e777-42b7-b083-6b4eaebfe393	47a5c717f9a5d2f3f5328621bfb9ce6d1c3663c5e0661b1cc822edf0201b3042	2026-03-01 09:24:05.988334+00	20260121114630_add_unique_to_stock_name	\N	\N	2026-03-01 09:24:04.387206+00	1
c01aad9b-c53d-4cbe-a3ed-f541c0f78fe5	43666efc5c675079c65b80a8e260fde6f46aea242afed49c8b0dbaa4ffaa31d3	2026-03-01 09:24:08.124052+00	20260121121420_add_order_and_payment_schema	\N	\N	2026-03-01 09:24:06.601557+00	1
347e85a7-6692-4cdc-8c88-3b96baf2a3b3	b1c9603258cb6a73ac73b8473c9d00f3f95a975dc4e81a4574a8bb62c470870e	2026-03-01 09:24:27.422206+00	20260128162544_fix_payment_session_relation	\N	\N	2026-03-01 09:24:25.891617+00	1
07aa2563-1e95-43ba-b5ca-c3ef7bbf28fc	8045d7512a6fdc10ea766ac70314e1cc9e1db7f79cfda603aa41eaf5c0ff08d2	2026-03-01 09:24:10.258531+00	20260121130512_add_order_and_order_adon_and_full_schema	\N	\N	2026-03-01 09:24:08.729097+00	1
b647763e-553a-4a05-8298-b4ee0d8e70ba	4db19e6667f10388fcbadff30a6a5f8110a22845a5557d5757f1b21bd26f5b71	2026-03-01 09:24:12.460489+00	20260121130903_update_order_type	\N	\N	2026-03-01 09:24:10.865161+00	1
4518f275-f0ef-4056-b157-dad3f584bbd9	01cc46b8191473d0d4da4d1f552b889e337907219aec47cad9d4b8679b341356	2026-03-01 09:24:51.710777+00	20260213131020_add_auth_verification	\N	\N	2026-03-01 09:24:50.184346+00	1
463dffdd-48e7-4aac-b4a6-b792f19b7775	276760e9a222a33522f8e0c42b2fbce0af1f34878242ca69229b6915b1e7f375	2026-03-01 09:24:14.590182+00	20260123082453_add_customer	\N	\N	2026-03-01 09:24:13.065898+00	1
d7816f74-29af-4b38-a84b-c2c9f125b93b	93b7148d74a4ae96a316dddba84bbe793ea756b1a24f2149410f43f53e5a6d45	2026-03-01 09:24:29.547026+00	20260129125549_fix_payment_session_relation	\N	\N	2026-03-01 09:24:28.029829+00	1
4fb5bc12-3513-4f0f-860b-2562d305051f	0ddb0160e6089b06d89f0432e37970460ec798e5a5ad12c6312dad61bde4ce01	2026-03-01 09:24:16.722661+00	20260124140428_update_and	\N	\N	2026-03-01 09:24:15.197915+00	1
9f534c28-413c-4a7d-9720-986d5aae1426	48d9107a028b641b6ebb6bbe10057f3fd0178ccb7f7476e5db4689138eb92451	2026-03-01 09:24:18.876254+00	20260125111403_updated_order_item	\N	\N	2026-03-01 09:24:17.336954+00	1
0e005408-2df0-4693-ae23-85326a3993d1	eca667f6b4fafa5aee377ff290764d21ca124665d151feac1034fa835417a44b	2026-03-01 09:24:42.916336+00	20260208065036_sort_order	\N	\N	2026-03-01 09:24:41.34266+00	1
4ac05256-f1da-49fa-9434-75749db968d0	e65f2fd1512e18b5add118d1be47d4058ca6d1e381cbdd2e7c6fab3e0c3d0e2d	2026-03-01 09:24:21.030742+00	20260127121200_add_reservation_schema	\N	\N	2026-03-01 09:24:19.501897+00	1
086b391e-3889-4ce3-b05a-a65bcc1c627a	8b77f4148519e0f5b41f9dabaf0daa8dfc50f4a8c4f974c9569dfc6bef919422	2026-03-01 09:24:31.685352+00	20260201123818_add_order_id_to_payment	\N	\N	2026-03-01 09:24:30.156096+00	1
6347bc77-a97a-4607-bf37-e843eaa24798	18032d62949ea2cd2037db990820085b0446ef8fc99f3ea5c7bba6cdbd09330c	2026-03-01 09:24:33.819457+00	20260203075021_added_is_deleted_to_table	\N	\N	2026-03-01 09:24:32.294788+00	1
35887d11-a3ea-468d-9b62-90ea3e347c0e	25554000faeb0d37a897585183e9403cc889a83a5d27690d94d1f8ce8a5bd6e0	2026-03-01 09:24:36.155209+00	20260204095859_credit_category_option	\N	\N	2026-03-01 09:24:34.521315+00	1
15ae4818-a658-445a-ab07-afd3be926f39	2d429d03b0293dee337749b80d4f7a58cbd575ec1c3a1178ef48d10cafb49b68	2026-03-01 09:24:45.159635+00	20260208072150_add_sort_on_combo	\N	\N	2026-03-01 09:24:43.529541+00	1
d8818e95-ff7f-4deb-8a09-a9d9f461db74	a0ff396f32a8ba59f6e2c2b818abb49f7daab966865aeede5057159c12748b6d	2026-03-01 09:24:38.286739+00	20260206120000_add_sort_order	\N	\N	2026-03-01 09:24:36.764172+00	1
2107dde7-5f66-4267-8c2d-d26f3da9be4c	1cfbedf53447afbb33b2b15b59894d9308fde5edb218f29f0f6816974076ea3c	2026-03-01 09:24:47.3199+00	20260209122911_sortings_settings_checkout_fix_and_custom_tax_payment_fix	\N	\N	2026-03-01 09:24:45.765523+00	1
12590098-e31d-4874-a28d-5ec0407db42c	248d6cc68199c1b8e13bff671a4cf92296b5b1bda3be2bac2eb3d015f22c8a7c	2026-03-01 09:24:53.90683+00	20260213140716_add_store_id_to_models	\N	\N	2026-03-01 09:24:52.338654+00	1
81ca1a1b-ef48-4e76-b6ca-4c3a6bd43899	7e274d89571474f92ace530b7598c7a839cbcb6be5a8648729e24ba49ef5a329	2026-03-01 09:24:49.572099+00	20260213115949_user_modeland_store	\N	\N	2026-03-01 09:24:47.931902+00	1
f8423d5e-349f-4368-bc4e-291f64454484	5137f2e3429b3416fb5abd49a4419155400ba9e9149396be45d7efeca328c4a7	2026-03-01 09:24:56.112392+00	20260213150102_store_isolationand_multiple_vendor_support	\N	\N	2026-03-01 09:24:54.51452+00	1
da4e563c-0e9b-41a4-804d-9556191a17bb	a1b2dbfa357d7dae9a2a57e99cbecf8ac7ef0a05a507a852915f358004b8f0b5	2026-03-03 03:35:52.54673+00	20260303033343_added_staff_roles_and_logic	\N	\N	2026-03-03 03:35:50.815743+00	1
\.


--
-- Name: AddOn AddOn_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AddOn"
    ADD CONSTRAINT "AddOn_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: ComboItem ComboItem_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ComboItem"
    ADD CONSTRAINT "ComboItem_pkey" PRIMARY KEY (id);


--
-- Name: ComboOffer ComboOffer_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ComboOffer"
    ADD CONSTRAINT "ComboOffer_pkey" PRIMARY KEY (id);


--
-- Name: CustomerLedger CustomerLedger_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CustomerLedger"
    ADD CONSTRAINT "CustomerLedger_pkey" PRIMARY KEY (id);


--
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);


--
-- Name: DailySession DailySession_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."DailySession"
    ADD CONSTRAINT "DailySession_pkey" PRIMARY KEY (id);


--
-- Name: DishAddOn DishAddOn_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."DishAddOn"
    ADD CONSTRAINT "DishAddOn_pkey" PRIMARY KEY (id);


--
-- Name: Dish Dish_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Dish"
    ADD CONSTRAINT "Dish_pkey" PRIMARY KEY (id);


--
-- Name: Expense Expense_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_pkey" PRIMARY KEY (id);


--
-- Name: MeasuringUnit MeasuringUnit_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."MeasuringUnit"
    ADD CONSTRAINT "MeasuringUnit_pkey" PRIMARY KEY (id);


--
-- Name: MenuSetSubMenu MenuSetSubMenu_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."MenuSetSubMenu"
    ADD CONSTRAINT "MenuSetSubMenu_pkey" PRIMARY KEY (id);


--
-- Name: MenuSet MenuSet_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."MenuSet"
    ADD CONSTRAINT "MenuSet_pkey" PRIMARY KEY (id);


--
-- Name: Menu Menu_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Menu"
    ADD CONSTRAINT "Menu_pkey" PRIMARY KEY (id);


--
-- Name: OrderItemAddOn OrderItemAddOn_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderItemAddOn"
    ADD CONSTRAINT "OrderItemAddOn_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: Price Price_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Price"
    ADD CONSTRAINT "Price_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseItem PurchaseItem_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PurchaseItem"
    ADD CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseReturnItem PurchaseReturnItem_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PurchaseReturnItem"
    ADD CONSTRAINT "PurchaseReturnItem_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseReturn PurchaseReturn_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PurchaseReturn"
    ADD CONSTRAINT "PurchaseReturn_pkey" PRIMARY KEY (id);


--
-- Name: Purchase Purchase_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Purchase"
    ADD CONSTRAINT "Purchase_pkey" PRIMARY KEY (id);


--
-- Name: QRCode QRCode_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."QRCode"
    ADD CONSTRAINT "QRCode_pkey" PRIMARY KEY (id);


--
-- Name: QrPayment QrPayment_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."QrPayment"
    ADD CONSTRAINT "QrPayment_pkey" PRIMARY KEY (id);


--
-- Name: ReservationTime ReservationTime_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ReservationTime"
    ADD CONSTRAINT "ReservationTime_pkey" PRIMARY KEY (id);


--
-- Name: Reservation Reservation_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Reservation"
    ADD CONSTRAINT "Reservation_pkey" PRIMARY KEY (id);


--
-- Name: SalesReturnItem SalesReturnItem_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SalesReturnItem"
    ADD CONSTRAINT "SalesReturnItem_pkey" PRIMARY KEY (id);


--
-- Name: SalesReturn SalesReturn_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SalesReturn"
    ADD CONSTRAINT "SalesReturn_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Space Space_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Space"
    ADD CONSTRAINT "Space_pkey" PRIMARY KEY (id);


--
-- Name: StaffRole StaffRole_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."StaffRole"
    ADD CONSTRAINT "StaffRole_pkey" PRIMARY KEY (id);


--
-- Name: Staff Staff_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_pkey" PRIMARY KEY (id);


--
-- Name: StockConsumption StockConsumption_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."StockConsumption"
    ADD CONSTRAINT "StockConsumption_pkey" PRIMARY KEY (id);


--
-- Name: StockGroup StockGroup_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."StockGroup"
    ADD CONSTRAINT "StockGroup_pkey" PRIMARY KEY (id);


--
-- Name: Stock Stock_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Stock"
    ADD CONSTRAINT "Stock_pkey" PRIMARY KEY (id);


--
-- Name: Store Store_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Store"
    ADD CONSTRAINT "Store_pkey" PRIMARY KEY (id);


--
-- Name: SubMenu SubMenu_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SubMenu"
    ADD CONSTRAINT "SubMenu_pkey" PRIMARY KEY (id);


--
-- Name: SupplierLedger SupplierLedger_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SupplierLedger"
    ADD CONSTRAINT "SupplierLedger_pkey" PRIMARY KEY (id);


--
-- Name: Supplier Supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Supplier"
    ADD CONSTRAINT "Supplier_pkey" PRIMARY KEY (id);


--
-- Name: SystemSetting SystemSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SystemSetting"
    ADD CONSTRAINT "SystemSetting_pkey" PRIMARY KEY (id);


--
-- Name: TableSession TableSession_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."TableSession"
    ADD CONSTRAINT "TableSession_pkey" PRIMARY KEY (id);


--
-- Name: TableType TableType_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."TableType"
    ADD CONSTRAINT "TableType_pkey" PRIMARY KEY (id);


--
-- Name: Table Table_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Table"
    ADD CONSTRAINT "Table_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AddOn_categoryId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AddOn_categoryId_idx" ON public."AddOn" USING btree ("categoryId");


--
-- Name: AddOn_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AddOn_storeId_idx" ON public."AddOn" USING btree ("storeId");


--
-- Name: Category_name_storeId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Category_name_storeId_key" ON public."Category" USING btree (name, "storeId");


--
-- Name: Category_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Category_storeId_idx" ON public."Category" USING btree ("storeId");


--
-- Name: ComboItem_comboId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ComboItem_comboId_idx" ON public."ComboItem" USING btree ("comboId");


--
-- Name: ComboItem_dishId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ComboItem_dishId_idx" ON public."ComboItem" USING btree ("dishId");


--
-- Name: ComboOffer_categoryId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ComboOffer_categoryId_idx" ON public."ComboOffer" USING btree ("categoryId");


--
-- Name: ComboOffer_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ComboOffer_storeId_idx" ON public."ComboOffer" USING btree ("storeId");


--
-- Name: ComboOffer_subMenuId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ComboOffer_subMenuId_idx" ON public."ComboOffer" USING btree ("subMenuId");


--
-- Name: CustomerLedger_customerId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CustomerLedger_customerId_idx" ON public."CustomerLedger" USING btree ("customerId");


--
-- Name: CustomerLedger_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CustomerLedger_storeId_idx" ON public."CustomerLedger" USING btree ("storeId");


--
-- Name: CustomerLedger_txnNo_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "CustomerLedger_txnNo_key" ON public."CustomerLedger" USING btree ("txnNo");


--
-- Name: Customer_loyaltyId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Customer_loyaltyId_key" ON public."Customer" USING btree ("loyaltyId");


--
-- Name: Customer_phone_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Customer_phone_key" ON public."Customer" USING btree (phone);


--
-- Name: DailySession_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "DailySession_status_idx" ON public."DailySession" USING btree (status);


--
-- Name: DailySession_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "DailySession_storeId_idx" ON public."DailySession" USING btree ("storeId");


--
-- Name: DishAddOn_addOnId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "DishAddOn_addOnId_idx" ON public."DishAddOn" USING btree ("addOnId");


--
-- Name: DishAddOn_dishId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "DishAddOn_dishId_idx" ON public."DishAddOn" USING btree ("dishId");


--
-- Name: Dish_categoryId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Dish_categoryId_idx" ON public."Dish" USING btree ("categoryId");


--
-- Name: Dish_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Dish_storeId_idx" ON public."Dish" USING btree ("storeId");


--
-- Name: Dish_subMenuId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Dish_subMenuId_idx" ON public."Dish" USING btree ("subMenuId");


--
-- Name: Expense_dailySessionId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Expense_dailySessionId_idx" ON public."Expense" USING btree ("dailySessionId");


--
-- Name: Expense_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Expense_storeId_idx" ON public."Expense" USING btree ("storeId");


--
-- Name: MeasuringUnit_name_storeId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "MeasuringUnit_name_storeId_key" ON public."MeasuringUnit" USING btree (name, "storeId");


--
-- Name: MeasuringUnit_shortName_storeId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "MeasuringUnit_shortName_storeId_key" ON public."MeasuringUnit" USING btree ("shortName", "storeId");


--
-- Name: MeasuringUnit_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "MeasuringUnit_storeId_idx" ON public."MeasuringUnit" USING btree ("storeId");


--
-- Name: MenuSetSubMenu_menuSetId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "MenuSetSubMenu_menuSetId_idx" ON public."MenuSetSubMenu" USING btree ("menuSetId");


--
-- Name: MenuSetSubMenu_subMenuId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "MenuSetSubMenu_subMenuId_idx" ON public."MenuSetSubMenu" USING btree ("subMenuId");


--
-- Name: MenuSet_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "MenuSet_storeId_idx" ON public."MenuSet" USING btree ("storeId");


--
-- Name: OrderItemAddOn_addOnId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "OrderItemAddOn_addOnId_idx" ON public."OrderItemAddOn" USING btree ("addOnId");


--
-- Name: OrderItemAddOn_orderItemId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "OrderItemAddOn_orderItemId_idx" ON public."OrderItemAddOn" USING btree ("orderItemId");


--
-- Name: OrderItem_comboId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "OrderItem_comboId_idx" ON public."OrderItem" USING btree ("comboId");


--
-- Name: OrderItem_dishId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "OrderItem_dishId_idx" ON public."OrderItem" USING btree ("dishId");


--
-- Name: OrderItem_orderId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "OrderItem_orderId_idx" ON public."OrderItem" USING btree ("orderId");


--
-- Name: Order_createdAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Order_createdAt_idx" ON public."Order" USING btree ("createdAt");


--
-- Name: Order_customerId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Order_customerId_idx" ON public."Order" USING btree ("customerId");


--
-- Name: Order_dailySessionId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Order_dailySessionId_idx" ON public."Order" USING btree ("dailySessionId");


--
-- Name: Order_paymentId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Order_paymentId_idx" ON public."Order" USING btree ("paymentId");


--
-- Name: Order_sessionId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Order_sessionId_idx" ON public."Order" USING btree ("sessionId");


--
-- Name: Order_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Order_status_idx" ON public."Order" USING btree (status);


--
-- Name: Order_tableId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Order_tableId_idx" ON public."Order" USING btree ("tableId");


--
-- Name: Payment_dailySessionId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Payment_dailySessionId_idx" ON public."Payment" USING btree ("dailySessionId");


--
-- Name: Payment_sessionId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Payment_sessionId_idx" ON public."Payment" USING btree ("sessionId");


--
-- Name: Payment_staffId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Payment_staffId_idx" ON public."Payment" USING btree ("staffId");


--
-- Name: Payment_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Payment_storeId_idx" ON public."Payment" USING btree ("storeId");


--
-- Name: Payment_transactionUuid_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Payment_transactionUuid_key" ON public."Payment" USING btree ("transactionUuid");


--
-- Name: Price_addOnId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Price_addOnId_idx" ON public."Price" USING btree ("addOnId");


--
-- Name: Price_addOnId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Price_addOnId_key" ON public."Price" USING btree ("addOnId");


--
-- Name: Price_comboId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Price_comboId_idx" ON public."Price" USING btree ("comboId");


--
-- Name: Price_comboId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Price_comboId_key" ON public."Price" USING btree ("comboId");


--
-- Name: Price_dishId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Price_dishId_idx" ON public."Price" USING btree ("dishId");


--
-- Name: Price_dishId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Price_dishId_key" ON public."Price" USING btree ("dishId");


--
-- Name: PurchaseItem_purchaseId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "PurchaseItem_purchaseId_idx" ON public."PurchaseItem" USING btree ("purchaseId");


--
-- Name: PurchaseItem_stockId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "PurchaseItem_stockId_idx" ON public."PurchaseItem" USING btree ("stockId");


--
-- Name: PurchaseReturnItem_purchaseReturnId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "PurchaseReturnItem_purchaseReturnId_idx" ON public."PurchaseReturnItem" USING btree ("purchaseReturnId");


--
-- Name: PurchaseReturnItem_stockId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "PurchaseReturnItem_stockId_idx" ON public."PurchaseReturnItem" USING btree ("stockId");


--
-- Name: PurchaseReturn_referenceNumber_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "PurchaseReturn_referenceNumber_key" ON public."PurchaseReturn" USING btree ("referenceNumber");


--
-- Name: PurchaseReturn_staffId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "PurchaseReturn_staffId_idx" ON public."PurchaseReturn" USING btree ("staffId");


--
-- Name: PurchaseReturn_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "PurchaseReturn_storeId_idx" ON public."PurchaseReturn" USING btree ("storeId");


--
-- Name: PurchaseReturn_supplierId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "PurchaseReturn_supplierId_idx" ON public."PurchaseReturn" USING btree ("supplierId");


--
-- Name: Purchase_dailySessionId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Purchase_dailySessionId_idx" ON public."Purchase" USING btree ("dailySessionId");


--
-- Name: Purchase_referenceNumber_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Purchase_referenceNumber_key" ON public."Purchase" USING btree ("referenceNumber");


--
-- Name: Purchase_staffId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Purchase_staffId_idx" ON public."Purchase" USING btree ("staffId");


--
-- Name: Purchase_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Purchase_storeId_idx" ON public."Purchase" USING btree ("storeId");


--
-- Name: Purchase_supplierId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Purchase_supplierId_idx" ON public."Purchase" USING btree ("supplierId");


--
-- Name: QRCode_tableId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "QRCode_tableId_key" ON public."QRCode" USING btree ("tableId");


--
-- Name: ReservationTime_reservationId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ReservationTime_reservationId_idx" ON public."ReservationTime" USING btree ("reservationId");


--
-- Name: Reservation_customerId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Reservation_customerId_idx" ON public."Reservation" USING btree ("customerId");


--
-- Name: Reservation_tableId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Reservation_tableId_idx" ON public."Reservation" USING btree ("tableId");


--
-- Name: SalesReturnItem_salesReturnId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "SalesReturnItem_salesReturnId_idx" ON public."SalesReturnItem" USING btree ("salesReturnId");


--
-- Name: SalesReturn_customerId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "SalesReturn_customerId_idx" ON public."SalesReturn" USING btree ("customerId");


--
-- Name: SalesReturn_referenceNumber_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "SalesReturn_referenceNumber_key" ON public."SalesReturn" USING btree ("referenceNumber");


--
-- Name: SalesReturn_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "SalesReturn_storeId_idx" ON public."SalesReturn" USING btree ("storeId");


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: Space_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Space_storeId_idx" ON public."Space" USING btree ("storeId");


--
-- Name: StaffRole_name_storeId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "StaffRole_name_storeId_key" ON public."StaffRole" USING btree (name, "storeId");


--
-- Name: StaffRole_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "StaffRole_storeId_idx" ON public."StaffRole" USING btree ("storeId");


--
-- Name: Staff_createdAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Staff_createdAt_idx" ON public."Staff" USING btree ("createdAt");


--
-- Name: Staff_isActive_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Staff_isActive_idx" ON public."Staff" USING btree ("isActive");


--
-- Name: Staff_roleId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Staff_roleId_idx" ON public."Staff" USING btree ("roleId");


--
-- Name: Staff_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Staff_storeId_idx" ON public."Staff" USING btree ("storeId");


--
-- Name: StockConsumption_addOnId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "StockConsumption_addOnId_idx" ON public."StockConsumption" USING btree ("addOnId");


--
-- Name: StockConsumption_comboId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "StockConsumption_comboId_idx" ON public."StockConsumption" USING btree ("comboId");


--
-- Name: StockConsumption_dishId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "StockConsumption_dishId_idx" ON public."StockConsumption" USING btree ("dishId");


--
-- Name: StockConsumption_stockId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "StockConsumption_stockId_idx" ON public."StockConsumption" USING btree ("stockId");


--
-- Name: StockGroup_name_storeId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "StockGroup_name_storeId_key" ON public."StockGroup" USING btree (name, "storeId");


--
-- Name: StockGroup_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "StockGroup_storeId_idx" ON public."StockGroup" USING btree ("storeId");


--
-- Name: Stock_groupId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Stock_groupId_idx" ON public."Stock" USING btree ("groupId");


--
-- Name: Stock_name_storeId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Stock_name_storeId_key" ON public."Stock" USING btree (name, "storeId");


--
-- Name: Stock_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Stock_storeId_idx" ON public."Stock" USING btree ("storeId");


--
-- Name: Stock_unitId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Stock_unitId_idx" ON public."Stock" USING btree ("unitId");


--
-- Name: Store_ownerId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Store_ownerId_key" ON public."Store" USING btree ("ownerId");


--
-- Name: SubMenu_categoryId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "SubMenu_categoryId_idx" ON public."SubMenu" USING btree ("categoryId");


--
-- Name: SubMenu_name_storeId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "SubMenu_name_storeId_key" ON public."SubMenu" USING btree (name, "storeId");


--
-- Name: SubMenu_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "SubMenu_storeId_idx" ON public."SubMenu" USING btree ("storeId");


--
-- Name: SupplierLedger_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "SupplierLedger_storeId_idx" ON public."SupplierLedger" USING btree ("storeId");


--
-- Name: SupplierLedger_supplierId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "SupplierLedger_supplierId_idx" ON public."SupplierLedger" USING btree ("supplierId");


--
-- Name: SupplierLedger_txnNo_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "SupplierLedger_txnNo_key" ON public."SupplierLedger" USING btree ("txnNo");


--
-- Name: Supplier_phone_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Supplier_phone_key" ON public."Supplier" USING btree (phone);


--
-- Name: Supplier_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Supplier_storeId_idx" ON public."Supplier" USING btree ("storeId");


--
-- Name: SystemSetting_key_storeId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "SystemSetting_key_storeId_key" ON public."SystemSetting" USING btree (key, "storeId");


--
-- Name: TableSession_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "TableSession_storeId_idx" ON public."TableSession" USING btree ("storeId");


--
-- Name: TableSession_tableId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "TableSession_tableId_idx" ON public."TableSession" USING btree ("tableId");


--
-- Name: TableType_name_storeId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "TableType_name_storeId_key" ON public."TableType" USING btree (name, "storeId");


--
-- Name: TableType_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "TableType_storeId_idx" ON public."TableType" USING btree ("storeId");


--
-- Name: Table_sortOrder_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Table_sortOrder_idx" ON public."Table" USING btree ("sortOrder");


--
-- Name: Table_spaceId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Table_spaceId_idx" ON public."Table" USING btree ("spaceId");


--
-- Name: Table_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Table_status_idx" ON public."Table" USING btree (status);


--
-- Name: Table_storeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Table_storeId_idx" ON public."Table" USING btree ("storeId");


--
-- Name: Table_tableTypeId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Table_tableTypeId_idx" ON public."Table" USING btree ("tableTypeId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: AddOn AddOn_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AddOn"
    ADD CONSTRAINT "AddOn_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AddOn AddOn_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AddOn"
    ADD CONSTRAINT "AddOn_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Category Category_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ComboItem ComboItem_comboId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ComboItem"
    ADD CONSTRAINT "ComboItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES public."ComboOffer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ComboItem ComboItem_dishId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ComboItem"
    ADD CONSTRAINT "ComboItem_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES public."Dish"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ComboOffer ComboOffer_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ComboOffer"
    ADD CONSTRAINT "ComboOffer_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ComboOffer ComboOffer_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ComboOffer"
    ADD CONSTRAINT "ComboOffer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ComboOffer ComboOffer_subMenuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ComboOffer"
    ADD CONSTRAINT "ComboOffer_subMenuId_fkey" FOREIGN KEY ("subMenuId") REFERENCES public."SubMenu"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CustomerLedger CustomerLedger_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CustomerLedger"
    ADD CONSTRAINT "CustomerLedger_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CustomerLedger CustomerLedger_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CustomerLedger"
    ADD CONSTRAINT "CustomerLedger_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Customer Customer_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DailySession DailySession_closedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."DailySession"
    ADD CONSTRAINT "DailySession_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DailySession DailySession_openedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."DailySession"
    ADD CONSTRAINT "DailySession_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DailySession DailySession_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."DailySession"
    ADD CONSTRAINT "DailySession_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DishAddOn DishAddOn_addOnId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."DishAddOn"
    ADD CONSTRAINT "DishAddOn_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES public."AddOn"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DishAddOn DishAddOn_dishId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."DishAddOn"
    ADD CONSTRAINT "DishAddOn_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES public."Dish"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Dish Dish_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Dish"
    ADD CONSTRAINT "Dish_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Dish Dish_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Dish"
    ADD CONSTRAINT "Dish_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Dish Dish_subMenuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Dish"
    ADD CONSTRAINT "Dish_subMenuId_fkey" FOREIGN KEY ("subMenuId") REFERENCES public."SubMenu"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Expense Expense_dailySessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_dailySessionId_fkey" FOREIGN KEY ("dailySessionId") REFERENCES public."DailySession"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Expense Expense_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MeasuringUnit MeasuringUnit_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."MeasuringUnit"
    ADD CONSTRAINT "MeasuringUnit_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MenuSetSubMenu MenuSetSubMenu_menuSetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."MenuSetSubMenu"
    ADD CONSTRAINT "MenuSetSubMenu_menuSetId_fkey" FOREIGN KEY ("menuSetId") REFERENCES public."MenuSet"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MenuSetSubMenu MenuSetSubMenu_subMenuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."MenuSetSubMenu"
    ADD CONSTRAINT "MenuSetSubMenu_subMenuId_fkey" FOREIGN KEY ("subMenuId") REFERENCES public."SubMenu"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MenuSet MenuSet_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."MenuSet"
    ADD CONSTRAINT "MenuSet_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Menu Menu_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Menu"
    ADD CONSTRAINT "Menu_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderItemAddOn OrderItemAddOn_addOnId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderItemAddOn"
    ADD CONSTRAINT "OrderItemAddOn_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES public."AddOn"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderItemAddOn OrderItemAddOn_orderItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderItemAddOn"
    ADD CONSTRAINT "OrderItemAddOn_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES public."OrderItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_comboId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES public."ComboOffer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrderItem OrderItem_dishId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES public."Dish"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_dailySessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_dailySessionId_fkey" FOREIGN KEY ("dailySessionId") REFERENCES public."DailySession"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_paymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES public."Payment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."TableSession"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_tableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES public."Table"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_dailySessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_dailySessionId_fkey" FOREIGN KEY ("dailySessionId") REFERENCES public."DailySession"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."TableSession"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Price Price_addOnId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Price"
    ADD CONSTRAINT "Price_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES public."AddOn"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Price Price_comboId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Price"
    ADD CONSTRAINT "Price_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES public."ComboOffer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Price Price_dishId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Price"
    ADD CONSTRAINT "Price_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES public."Dish"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PurchaseItem PurchaseItem_purchaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PurchaseItem"
    ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES public."Purchase"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PurchaseItem PurchaseItem_stockId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PurchaseItem"
    ADD CONSTRAINT "PurchaseItem_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES public."Stock"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PurchaseReturnItem PurchaseReturnItem_purchaseReturnId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PurchaseReturnItem"
    ADD CONSTRAINT "PurchaseReturnItem_purchaseReturnId_fkey" FOREIGN KEY ("purchaseReturnId") REFERENCES public."PurchaseReturn"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PurchaseReturnItem PurchaseReturnItem_stockId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PurchaseReturnItem"
    ADD CONSTRAINT "PurchaseReturnItem_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES public."Stock"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PurchaseReturn PurchaseReturn_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PurchaseReturn"
    ADD CONSTRAINT "PurchaseReturn_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PurchaseReturn PurchaseReturn_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PurchaseReturn"
    ADD CONSTRAINT "PurchaseReturn_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseReturn PurchaseReturn_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PurchaseReturn"
    ADD CONSTRAINT "PurchaseReturn_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Purchase Purchase_dailySessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Purchase"
    ADD CONSTRAINT "Purchase_dailySessionId_fkey" FOREIGN KEY ("dailySessionId") REFERENCES public."DailySession"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Purchase Purchase_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Purchase"
    ADD CONSTRAINT "Purchase_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Purchase Purchase_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Purchase"
    ADD CONSTRAINT "Purchase_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Purchase Purchase_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Purchase"
    ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QRCode QRCode_tableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."QRCode"
    ADD CONSTRAINT "QRCode_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES public."Table"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QrPayment QrPayment_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."QrPayment"
    ADD CONSTRAINT "QrPayment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ReservationTime ReservationTime_reservationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ReservationTime"
    ADD CONSTRAINT "ReservationTime_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES public."Reservation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Reservation Reservation_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Reservation"
    ADD CONSTRAINT "Reservation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Reservation Reservation_tableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Reservation"
    ADD CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES public."Table"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SalesReturnItem SalesReturnItem_salesReturnId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SalesReturnItem"
    ADD CONSTRAINT "SalesReturnItem_salesReturnId_fkey" FOREIGN KEY ("salesReturnId") REFERENCES public."SalesReturn"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SalesReturn SalesReturn_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SalesReturn"
    ADD CONSTRAINT "SalesReturn_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SalesReturn SalesReturn_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SalesReturn"
    ADD CONSTRAINT "SalesReturn_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SalesReturn SalesReturn_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SalesReturn"
    ADD CONSTRAINT "SalesReturn_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Space Space_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Space"
    ADD CONSTRAINT "Space_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StaffRole StaffRole_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."StaffRole"
    ADD CONSTRAINT "StaffRole_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Staff Staff_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."StaffRole"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Staff Staff_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockConsumption StockConsumption_addOnId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."StockConsumption"
    ADD CONSTRAINT "StockConsumption_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES public."AddOn"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StockConsumption StockConsumption_comboId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."StockConsumption"
    ADD CONSTRAINT "StockConsumption_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES public."ComboOffer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StockConsumption StockConsumption_dishId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."StockConsumption"
    ADD CONSTRAINT "StockConsumption_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES public."Dish"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StockConsumption StockConsumption_stockId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."StockConsumption"
    ADD CONSTRAINT "StockConsumption_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES public."Stock"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockGroup StockGroup_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."StockGroup"
    ADD CONSTRAINT "StockGroup_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Stock Stock_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Stock"
    ADD CONSTRAINT "Stock_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public."StockGroup"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Stock Stock_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Stock"
    ADD CONSTRAINT "Stock_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Stock Stock_unitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Stock"
    ADD CONSTRAINT "Stock_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES public."MeasuringUnit"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SubMenu SubMenu_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SubMenu"
    ADD CONSTRAINT "SubMenu_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SubMenu SubMenu_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SubMenu"
    ADD CONSTRAINT "SubMenu_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SupplierLedger SupplierLedger_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SupplierLedger"
    ADD CONSTRAINT "SupplierLedger_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SupplierLedger SupplierLedger_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SupplierLedger"
    ADD CONSTRAINT "SupplierLedger_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Supplier Supplier_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Supplier"
    ADD CONSTRAINT "Supplier_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SystemSetting SystemSetting_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SystemSetting"
    ADD CONSTRAINT "SystemSetting_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TableSession TableSession_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."TableSession"
    ADD CONSTRAINT "TableSession_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TableSession TableSession_tableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."TableSession"
    ADD CONSTRAINT "TableSession_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES public."Table"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TableType TableType_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."TableType"
    ADD CONSTRAINT "TableType_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Table Table_spaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Table"
    ADD CONSTRAINT "Table_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES public."Space"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Table Table_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Table"
    ADD CONSTRAINT "Table_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Table Table_tableTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Table"
    ADD CONSTRAINT "Table_tableTypeId_fkey" FOREIGN KEY ("tableTypeId") REFERENCES public."TableType"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: neondb_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict 8DcLfZLjMMtur3cPuabuYrm9ZlkMyiyUOiSrhQHTRuJa1SXXehcbAVM6Pnhi3c8

