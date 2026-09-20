import mongoose from 'mongoose';
import { tenantPlugin } from '../../plugins/tenantPlugin.js';

const stockMovementSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
      required: true,
      index: true,
    },
    productoNombre: {
      type: String,
      trim: true,
      default: '',
    },
    talle: {
      type: String,
      trim: true,
      default: '',
    },
    color: {
      type: String,
      trim: true,
      default: '',
    },
    tipo: {
      type: String,
      enum: ['ingreso_deposito', 'ajuste_deposito', 'reposicion', 'retiro_deposito', 'ajuste_salon'],
      required: true,
    },
    cantidad: {
      type: Number,
      required: true,
    },
    empleado: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' } }
);

stockMovementSchema.index({ fechaCreacion: -1 });
stockMovementSchema.index({ tipo: 1, fechaCreacion: -1 });

stockMovementSchema.plugin(tenantPlugin);

export default mongoose.model('MovimientoStock', stockMovementSchema, 'movimientosStock');
