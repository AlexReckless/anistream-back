# AniStream Backend

Este backend está listo para conectarse con React Native Expo. Solo necesitas configurar la URL de tu API en la app móvil.

## Endpoints disponibles

### 1) Registrar usuario

POST /api/auth/register

```json
{
  "name": "Juan Perez",
  "user": "juanperez",
  "email": "juan@email.com",
  "password": "123456",
  "securityQuestions": [
    {
      "question": "nombre_mascota",
      "answer": "firulais"
    },
    {
      "question": "nombre_madre",
      "answer": "maria"
    },
    {
      "question": "serie_favorita",
      "answer": "breaking bad"
    },
    {
      "question": "pelicula_favorita",
      "answer": "inception"
    }
  ]
}
```

### 2) Iniciar sesión

POST /api/auth/login

```json
{
  "user": "juanperez",
  "password": "123456"
}
```

### 3) Obtener preguntas de seguridad

POST /api/auth/get-security-questions

```json
{
  "user": "juanperez"
}
```

### 4) Verificar respuestas de seguridad

POST /api/auth/verify-security-answers

```json
{
  "userId": "id_del_usuario",
  "answers": ["firulais", "maria", "breaking bad", "inception"]
}
```

### 5) Restablecer contraseña

POST /api/auth/reset-password

```json
{
  "resetToken": "token_recibido",
  "newPassword": "nueva123"
}
```

### 6) Obtener perfil

GET /api/auth/profile

Requiere token Bearer.
