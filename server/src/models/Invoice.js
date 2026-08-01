import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    items: [
      {
        description: String,
        amount: Number,
        quantity: { type: Number, default: 1 },
      },
    ],
    subtotal: Number,
    tax: { type: Number, default: 0 },
    total: Number,
    status: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "online", "insurance"],
    },
    paidAt: Date,
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
invoiceSchema.pre("save", function (next) {
  this.subtotal = this.items.reduce((sum, i) => sum + i.amount * i.quantity, 0);
  this.total = this.subtotal + this.tax;
});

invoiceSchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null });
});

export default mongoose.model("Invoice", invoiceSchema);
