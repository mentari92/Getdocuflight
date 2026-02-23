-- Sprint 3: Integrated Booking Flow
-- Adds Booking + BookingPassenger models and DUMMY_TICKET product type

-- New enums
CREATE TYPE "BookingStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "TripType" AS ENUM ('ONE_WAY', 'ROUND_TRIP');
CREATE TYPE "NotifChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'TELEGRAM');
CREATE TYPE "BookingSource" AS ENUM ('WEB_FORM', 'CHATBOT');

-- Extend ProductType enum
ALTER TYPE "ProductType" ADD VALUE 'DUMMY_TICKET';

-- Booking table
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'DRAFT',
    "departureCity" TEXT NOT NULL,
    "arrivalCity" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "tripType" "TripType" NOT NULL DEFAULT 'ONE_WAY',
    "passengerCount" INTEGER NOT NULL DEFAULT 1,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactWhatsApp" TEXT,
    "contactTelegram" TEXT,
    "preferredNotif" "NotifChannel" NOT NULL DEFAULT 'EMAIL',
    "orderId" TEXT,
    "amountUSD" DOUBLE PRECISION NOT NULL DEFAULT 3.00,
    "amountIDR" DOUBLE PRECISION,
    "source" "BookingSource" NOT NULL DEFAULT 'WEB_FORM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- BookingPassenger table
CREATE TABLE "BookingPassenger" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "passportNo" TEXT,

    CONSTRAINT "BookingPassenger_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BookingPassenger" ADD CONSTRAINT "BookingPassenger_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
