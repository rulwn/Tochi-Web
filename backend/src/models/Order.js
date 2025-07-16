import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    cartId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart',
        required: true
    },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, default: '' },
        zipCode: { type: String, default: '' },
        country: { type: String, default: 'USA' },
        addressName: { type: String, default: 'Default' }
    },
    payingMetod: { // Mantengo el typo para compatibilidad
        type: String,
        required: true,
        enum: ['credit-card', 'paypal', 'wompi', 'payphone', 'bank-transfer', 'cash']
    },
    deliveryMethod: {
        type: String,
        default: 'standard',
        enum: ['standard', 'express', 'pickup']
    },
    deliveryCost: {
        type: Number,
        default: 0,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    finalTotal: {
        type: Number,
        required: true,
        min: 0
    },
    promoCode: {
        type: String,
        default: null
    },
    state: {
        type: String,
        default: 'Pendiente',
        enum: ['Pendiente', 'Confirmado', 'Procesando', 'Enviado', 'Entregado', 'Cancelado', 'Pago Fallido']
    },
    paymentId: {
        type: String,
        default: null
    },
    paymentStatus: {
        type: String,
        default: 'pending',
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded']
    },
    paymentConfirmedAt: {
        type: Date,
        default: null
    },
    deliveryStatus: {
        type: String,
        default: 'pending',
        enum: ['pending', 'preparing', 'shipped', 'in_transit', 'delivered', 'failed']
    },
    trackingNumber: {
        type: String,
        default: null
    },
    deliveryDate: {
        type: Date,
        default: null
    },
    cancelReason: {
        type: String,
        default: null
    },
    cancelledAt: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        default: null
    },
    transactionDetails: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, {
    timestamps: true // Esto agrega createdAt y updatedAt automáticamente
});

// Índices para optimizar consultas
orderSchema.index({ 'cartId': 1 });
orderSchema.index({ 'state': 1 });
orderSchema.index({ 'paymentStatus': 1 });
orderSchema.index({ 'createdAt': -1 });

// Método para calcular el total con descuentos
orderSchema.methods.calculateTotal = function() {
    // Si necesitas recalcular basado en el carrito
    return this.finalTotal;
};

// Método para verificar si la orden se puede cancelar
orderSchema.methods.canBeCancelled = function() {
    return !['Entregado', 'Cancelado'].includes(this.state);
};

// Método para verificar si la orden está pagada
orderSchema.methods.isPaid = function() {
    return this.paymentStatus === 'completed';
};

// Virtual para obtener el ID del cliente desde el carrito
orderSchema.virtual('clientId').get(function() {
    return this.cartId?.idClient;
});

// Middleware pre-save para validaciones adicionales
orderSchema.pre('save', function(next) {
    // Validar que el total final sea mayor a 0
    if (this.finalTotal <= 0) {
        return next(new Error('Final total must be greater than 0'));
    }
    
    // Si se está cancelando, agregar fecha de cancelación
    if (this.state === 'Cancelado' && !this.cancelledAt) {
        this.cancelledAt = new Date();
    }
    
    // Si se confirma el pago, agregar fecha de confirmación
    if (this.paymentStatus === 'completed' && !this.paymentConfirmedAt) {
        this.paymentConfirmedAt = new Date();
    }
    
    next();
});

// Configurar el populate por defecto
orderSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'cartId',
        select: 'idClient total Products',
        populate: {
            path: 'Products.idProduct',
            select: 'name price imageUrl'
        }
    });
    next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;