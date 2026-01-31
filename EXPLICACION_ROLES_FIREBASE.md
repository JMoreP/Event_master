# 🔐 Sistema de Roles y Reglas de Seguridad en Firebase - EventMaster

## 📋 Índice
- [Introducción](#-introducción)
- [Roles de Usuario](#-roles-de-usuario)
- [Cómo Funcionan las Reglas de Firebase](#️-cómo-funcionan-las-reglas-de-firebase)
- [Ejemplos Prácticos](#-ejemplos-prácticos)
- [Flujo de Autenticación](#-flujo-de-autenticación)
- [Tabla Resumen de Permisos](#-tabla-resumen-de-permisos)
- [Caso de Uso Real](#-ejemplo-de-caso-de-uso-real)

---

## 🎯 Introducción

EventMaster utiliza un **sistema de control de acceso basado en roles (RBAC - Role-Based Access Control)** implementado en dos niveles:

1. **Frontend (React)**: Controla qué elementos de la interfaz ve cada usuario
2. **Backend (Firebase Firestore Rules)**: Controla qué datos puede leer/escribir cada usuario en la base de datos

Este sistema de doble capa garantiza la seguridad incluso si alguien intenta manipular el código del navegador.

---

## 👥 Roles de Usuario

El sistema maneja **3 roles principales**:

### 1. 👑 Administrador (`admin`)

**Acceso**: Total y sin restricciones

**Puede hacer**:
- ✅ Crear, editar y eliminar eventos
- ✅ Crear, editar y eliminar ponentes
- ✅ Gestionar proyectos y tareas
- ✅ Ver y confirmar pagos
- ✅ Gestionar el inventario de regalos
- ✅ Administrar el equipo (TeamManagement)
- ✅ Ver reportes completos
- ✅ Acceder a todas las funciones del sistema

> **Usuarios hardcodeados como admin**:
> - `jmoredavid@gmail.com`
> - `yorluis15@gmail.com`

### 2. 🎯 Organizador (`organizer`)

**Acceso**: Amplio, enfocado en la gestión de eventos

**Puede hacer**:
- ✅ Crear eventos y ponentes
- ✅ Editar y eliminar **SOLO los eventos y ponentes que él mismo creó**
- ✅ Gestionar proyectos propios
- ✅ Ver tareas y calendario
- ✅ Registrarse en eventos
- ❌ No puede gestionar inventario de regalos (solo admin)
- ❌ No puede gestionar equipo completo (solo admin)
- ❌ **NO puede** editar ni eliminar ponentes creados por otros (ni siquiera de otros organizadores)

### 3. 🎫 Participante (usuario normal) - **ROL POR DEFECTO**

**Acceso**: Limitado, principalmente visualización y participación

**Puede hacer**:
- ✅ Ver eventos públicos
- ✅ Registrarse en eventos
- ✅ Ver su calendario personal
- ✅ Ver sus propias tareas
- ✅ Crear tareas personales
- ✅ Ver ponentes
- ✅ Ver sus regalos ganados
- ✅ Editar su propio perfil

**NO puede hacer**:
- ❌ Crear eventos
- ❌ Crear/editar/eliminar ponentes
- ❌ Crear proyectos
- ❌ Acceder a funciones administrativas

---

## 🛡️ Cómo Funcionan las Reglas de Firebase

### Estructura de las Reglas

Las reglas de Firebase están en el archivo `firestore.rules` y funcionan como un **firewall de base de datos**. Cada vez que alguien intenta leer o escribir datos, Firebase verifica estas reglas.

### Funciones Helper Principales

#### 1. Verificar si el usuario está autenticado
```javascript
function isSignedIn() {
  return request.auth != null;
}
```

#### 2. Obtener datos del usuario desde Firestore
```javascript
function getUserData() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
}
```

#### 3. Verificar si es un Super Admin
```javascript
function isSuperAdmin() {
  return isSignedIn() && 
         request.auth.token.email in ['jmoredavid@gmail.com', 'yorluis15@gmail.com'];
}
```

#### 4. Verificar si tiene un rol específico
```javascript
function hasRole(role) {
  return (role == 'admin' && isSuperAdmin()) || 
         (isSignedIn() && 
          exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
          getUserData().role == role);
}
```

#### 5. Verificar si es un "Power User"
```javascript
function isPowerUser() {
  return isSuperAdmin() || 
         (isSignedIn() && 
          exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
          getUserData().role in ['admin', 'organizer']);
}
```

---

## 📚 Ejemplos Prácticos

### Ejemplo 1: Reglas para Eventos

```javascript
match /events/{eventId} {
  // LECTURA: Todos pueden ver eventos (son públicos)
  allow read: if true;
  
  // CREACIÓN: Solo Power Users (admin, organizer)
  allow create: if isPowerUser();
  
  // ACTUALIZACIÓN/ELIMINACIÓN: Solo Power Users Y (admin O creador del evento)
  allow update, delete: if isPowerUser() && 
                           (hasRole('admin') || resource.data.createdBy == request.auth.uid);
}
```

**Explicación**:
- ✅ **Cualquiera** puede ver eventos (incluso sin login)
- ✅ **Admin/Organizer** pueden crear eventos
- ✅ **Admin** puede editar/eliminar cualquier evento
- ✅ **Organizer** solo puede editar/eliminar sus propios eventos
- ❌ **Participantes** no pueden crear, editar ni eliminar eventos

### Ejemplo 2: Reglas para Ponentes (Speakers)

```javascript
match /speakers/{speakerId} {
  // LECTURA: Todos pueden ver ponentes
  allow read: if true;
  
  // CREACIÓN: Solo Power Users (admin, organizer)
  allow create: if isPowerUser();
  
  // ACTUALIZACIÓN/ELIMINACIÓN: Solo Admin O el creador del ponente
  allow update, delete: if isPowerUser() && (hasRole('admin') || resource.data.createdBy == request.auth.uid);
}
```

**Explicación**:
- ✅ **Cualquiera** puede ver la lista de ponentes
- ✅ Solo **Admin/Organizer** pueden crear ponentes
- ✅ **Organizer** SOLO puede editar/eliminar los ponentes que ÉL creó
- ❌ **Organizer** NO puede modificar ponentes de otros
- ❌ **Participantes** no pueden modificar ponentes

### Ejemplo 3: Reglas para Tareas

```javascript
match /tasks/{taskId} {
  // LECTURA: Usuario dueño, admin, o miembro del proyecto
  allow read: if isSignedIn() && (
    (resource != null && resource.data.userId == request.auth.uid) ||
    hasRole('admin') ||
    (resource != null && resource.data.projectId != null && 
     request.auth.uid in get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.members)
  );
  
  // CREACIÓN: Cualquier usuario autenticado
  allow create: if isSignedIn();
  
  // ACTUALIZACIÓN: Admin, dueño, o miembro del proyecto
  allow update: if isSignedIn() && (
    hasRole('admin') || 
    (resource != null && resource.data.userId == request.auth.uid) ||
    (resource.data.projectId != null && 
     request.auth.uid in get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.members)
  );
  
  // ELIMINACIÓN: Admin o dueño
  allow delete: if isSignedIn() && (
    hasRole('admin') || 
    (resource != null && resource.data.userId == request.auth.uid)
  );
}
```

**Explicación**:
- ✅ Solo puedes ver **tus propias tareas** o tareas de proyectos donde eres miembro
- ✅ **Cualquier usuario autenticado** puede crear tareas
- ✅ Solo puedes **editar tus tareas** o las del proyecto donde participas
- ✅ Solo puedes **eliminar tus propias tareas** (o admin puede eliminar cualquiera)

### Ejemplo 4: Reglas para Usuarios

```javascript
match /users/{userId} {
  // LECTURA: Cualquier usuario autenticado
  allow read: if isSignedIn();
  
  // ESCRITURA: El propio usuario o Power Users
  allow write: if isSignedIn() && 
                  (request.auth.uid == userId || isPowerUser());
}
```

**Explicación**:
- ✅ Usuarios autenticados pueden ver perfiles de otros usuarios
- ✅ Solo puedes **editar tu propio perfil**
- ✅ **Admin/Organizer** pueden editar cualquier perfil (para gestión de equipo)

---

## 🔄 Flujo de Autenticación

### 1. Registro de Usuario

1. **Usuario se registra** → Firebase Authentication crea cuenta
2. **Se crea documento** en Firestore `/users/{uid}`
3. **Se asigna rol por defecto**: `"participante"`
4. **Usuario puede iniciar sesión**

### 2. Verificación de Rol al Iniciar Sesión

**Código en `AuthContext.jsx`**:
```javascript
// Al autenticarse, se verifica el rol
const userRef = doc(db, 'users', user.uid);
const userSnap = await getDoc(userRef);

if (userSnap.exists()) {
  const userData = userSnap.data();
  
  // Forzar rol admin para super admins
  let forcedRole = null;
  if (user.email === 'yorluis15@gmail.com') forcedRole = 'admin';
  if (user.email === 'jmoredavid@gmail.com') forcedRole = 'admin';
  
  setCurrentUser({
    ...user,
    ...userData,
    role: forcedRole || userData.role || 'participante'
  });
}
```

### 3. Verificación de Permisos en Frontend

**Ejemplo en `Speakers.jsx`**:
```javascript
// Solo muestra botones si es admin O si el usuario creó el ponente
{ canManageSpeakers() && (currentUser?.role === 'admin' || speaker.createdBy === currentUser?.uid) && (
  <>
    <button onClick={handleEdit}>Editar</button>
    <button onClick={handleDelete}>Eliminar</button>
  </>
)}
```

### 4. Proceso de Verificación en Firestore

1. **Usuario intenta escribir** en Firestore
2. **¿Está autenticado?**
   - ❌ NO → Permiso denegado
   - ✅ SÍ → Continuar
3. **¿Tiene el rol necesario?**
   - ❌ NO → Permiso denegado
   - ✅ SÍ → Continuar
4. **¿Es dueño del recurso O admin?**
   - ❌ NO → Permiso denegado
   - ✅ SÍ → **Operación permitida**

---

## 📊 Tabla Resumen de Permisos

| Recurso | Admin | Organizer | Participante | Sin Login |
|---------|:-----:|:---------:|:------------:|:---------:|
| **Ver Eventos** | ✅ | ✅ | ✅ | ✅ |
| **Crear Eventos** | ✅ | ✅ | ❌ | ❌ |
| **Editar Eventos** | ✅ (todos) | ✅ (propios) | ❌ | ❌ |
| **Eliminar Eventos** | ✅ (todos) | ✅ (propios) | ❌ | ❌ |
| **Ver Ponentes** | ✅ | ✅ | ✅ | ✅ |
| **Crear Ponentes** | ✅ | ✅ | ❌ | ❌ |
| **Editar Ponentes** | ✅ (todos) | ✅ (propios) | ❌ | ❌ |
| **Eliminar Ponentes** | ✅ (todos) | ✅ (propios) | ❌ | ❌ |
| **Ver Proyectos** | ✅ (todos) | ✅ (propios) | ✅ (propios) | ❌ |
| **Crear Proyectos** | ✅ | ✅ | ❌ | ❌ |
| **Ver Tareas** | ✅ (todas) | ✅ (propias) | ✅ (propias) | ❌ |
| **Crear Tareas** | ✅ | ✅ | ✅ | ❌ |
| **Gestionar Regalos** | ✅ | ❌ | ❌ | ❌ |
| **Gestionar Equipo** | ✅ | ❌ | ❌ | ❌ |
| **Ver Reportes** | ✅ | ✅ | ✅ | ❌ |
| **Confirmar Pagos** | ✅ | ❌ | ❌ | ❌ |

---

## 🔑 Puntos Clave

### 1. 🛡️ Seguridad Multicapa
- **Capa 1 (Frontend)**: Oculta botones y opciones según el rol
- **Capa 2 (Firestore Rules)**: Bloquea operaciones no autorizadas en la base de datos
- **Capa 3 (Authentication)**: Verifica la identidad del usuario

### 2. 🎫 Rol por Defecto
- Cuando un usuario se registra, automáticamente recibe el rol **`participante`**
- Los administradores pueden cambiar roles desde TeamManagement (solo admin)

### 3. 👑 Super Admins
- Los emails `jmoredavid@gmail.com` y `yorluis15@gmail.com` **siempre son admin**
- Esto está hardcodeado tanto en el frontend como en las reglas de Firestore
- No se puede cambiar su rol desde la interfaz

### 4. 🔒 Principio de Menor Privilegio
- Los usuarios solo tienen acceso a lo que necesitan para su función
- Por defecto, todo está bloqueado
- Solo se permiten operaciones específicas según el rol

### 5. ⚡ Validación en Tiempo Real
- Cada operación se valida instantáneamente
- Si alguien intenta manipular el código del navegador, Firestore lo bloquea

---

## 💡 Ejemplo de Caso de Uso Real

### Escenario: Un Organizador intenta eliminar un ponente creado por OTRO organizador

#### Paso 1: Frontend
El botón de eliminar **ni siquiera aparece** porque:
`currentUser.uid !== speaker.createdBy`

```javascript
/* La condición no se cumple */
(currentUser.role === 'admin' || speaker.createdBy === currentUser.uid)
```

#### Paso 2: Firestore Rules
Si intenta burlar la UI y enviar la petición de borrado:

```javascript
allow update, delete: if isPowerUser() && (hasRole('admin') || resource.data.createdBy == request.auth.uid);
```

#### Paso 3: Resultado
- ✅ `isPowerUser()` → **true** (es organizador)
- ❌ `hasRole('admin')` → **false**
- ❌ `resource.data.createdBy == request.auth.uid` → **false** (porque lo creó otro)
- **Resultado Final**: ⛔ **PERMISO DENEGADO**

---

## 🎓 Glosario de Términos

| Término | Definición |
|---------|-----------|
| **RBAC** | Role-Based Access Control (Control de Acceso Basado en Roles) |
| **Firestore** | Base de datos NoSQL de Firebase |
| **Authentication** | Sistema de autenticación de Firebase |
| **Power User** | Usuario con permisos elevados (admin u organizer) |
| **UID** | User ID único asignado por Firebase a cada usuario |
| **Firestore Rules** | Reglas de seguridad que controlan el acceso a la base de datos |
| **Super Admin** | Usuarios con email hardcodeado que siempre tienen rol admin |

---

<div align="center">

**EventMaster** - Sistema de Gestión de Eventos con Seguridad Robusta 🔐

</div>
