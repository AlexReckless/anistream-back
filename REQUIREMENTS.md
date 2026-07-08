# Requisitos — anistream-backend (Backend de usuario: auth, progreso, cartas, amigos, manga)

## Sistema

- Node.js 18 LTS o superior (recomendado 20+).
- Una base de datos **MongoDB** accesible (Atlas u otra instancia), con su connection string.

## Dependencias principales (`package.json`)

- `express`, `cors`, `dotenv`, `connect-timeout`
- `mongoose` (ODM de MongoDB)
- `bcryptjs` (hash de contraseñas)
- `jsonwebtoken` (autenticación por token)
- `axios`

Dev: `nodemon`

## Variables de entorno (`.env`)

Ya existe un `.env` en este proyecto (no se versiona su contenido real). Variables usadas:

| Variable | Para qué sirve |
|---|---|
| `PORT` | Puerto del servidor |
| `MONGODB_URI` | Connection string completo de MongoDB (usuario, password, cluster, base de datos) |
| `JWT_SECRET` | Secreto para firmar/verificar los tokens de sesión |
| `JWT_EXPIRE` | Tiempo de expiración de los tokens (ej. `7d`) |
| `FREETHAI_API_KEY` | API key de un servicio externo usado por el backend |

## Instalación y ejecución

```bash
npm install
npm run dev     # con nodemon
# o
npm start
```

## Notas de conectividad a MongoDB

`src/config/db.js` fuerza servidores DNS públicos (`1.1.1.1`, `8.8.8.8`, `8.8.4.4`) antes de conectar con `mongoose.connect`, en vez de depender del DNS del sistema/ISP. Esto es un workaround ya presente en el código para evitar fallos al resolver los registros SRV de MongoDB Atlas en ciertas redes — no hay que tocarlo, pero es bueno saber que existe si algún día la conexión a Mongo falla de forma rara y no es por credenciales.
