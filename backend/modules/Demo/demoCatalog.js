export const DEMO_CATEGORIES = ['Remeras', 'Buzos', 'Pantalones', 'Accesorios'];

export const DEMO_PRODUCTS = [
  {
    nombre: 'Remera básica algodón',
    precio: 8500,
    categoria: 'Remeras',
    stockMinimo: 3,
    colores: ['Blanco', 'Negro'],
    variantes: [
      { talle: 'S', color: 'Blanco', cantidad: 6 },
      { talle: 'M', color: 'Blanco', cantidad: 5 },
      { talle: 'L', color: 'Blanco', cantidad: 4 },
      { talle: 'S', color: 'Negro', cantidad: 5 },
      { talle: 'M', color: 'Negro', cantidad: 4 },
      { talle: 'L', color: 'Negro', cantidad: 3 },
    ],
    cantidad: 27,
  },
  {
    nombre: 'Jean skinny',
    precio: 28000,
    categoria: 'Pantalones',
    stockMinimo: 3,
    colores: ['Azul'],
    variantes: [
      { talle: '38', color: 'Azul', cantidad: 5 },
      { talle: '40', color: 'Azul', cantidad: 6 },
      { talle: '42', color: 'Azul', cantidad: 4 },
    ],
    cantidad: 15,
  },
  {
    nombre: 'Buzo canguro classic',
    precio: 24500,
    categoria: 'Buzos',
    stockMinimo: 4,
    colores: ['Azul', 'Gris'],
    variantes: [
      { talle: 'S', color: 'Azul', cantidad: 2 },
      { talle: 'M', color: 'Azul', cantidad: 2 },
      { talle: 'L', color: 'Gris', cantidad: 2 },
    ],
    cantidad: 6,
  },
  {
    nombre: 'Buzo con capucha premium',
    precio: 29900,
    categoria: 'Buzos',
    stockMinimo: 4,
    colores: ['Negro'],
    variantes: [
      { talle: 'M', color: 'Negro', cantidad: 1 },
      { talle: 'L', color: 'Negro', cantidad: 1 },
    ],
    cantidad: 2,
  },
  {
    nombre: 'Gorra urbana',
    precio: 9900,
    categoria: 'Accesorios',
    stockMinimo: 2,
    variantes: [],
    cantidad: 0,
  },
];
