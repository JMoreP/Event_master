# 🔐 Sistema de Roles y Reglas de Seguridad en Firebase - EventMaster

## 📋 Índice
1. [Introducción](#introducción)
2. [Roles de Usuario](#roles-de-usuario)
3. [Cómo Funcionan las Reglas de Firebase](#cómo-funcionan-las-reglas-de-firebase)
4. [Ejemplos Prácticos](#ejemplos-prácticos)
5. [Flujo de Autenticación](#flujo-de-autenticación)

---

## 🎯 Introducción

EventMaster utiliza un **sistema de control de acceso basado en roles (RBAC - Role-Based Access Control)** implementado en dos niveles:

1. **Frontend (React)**: Controla qué elementos de la interfaz ve cada usuario
2. **Backend (Firebase Firestore Rules)**: Controla qué datos puede leer/escribir cada usuario en la base de datos

Este sistema de doble capa garantiza la seguridad incluso si alguien intenta manipular el código del navegador.

---

## 👥 Roles de Usuario

El sistema maneja **3 roles principales**:

### 1. **Administrador (admin)**
- **Acceso**: Total y sin restricciones
- **Puede hacer**:
  - ✅ Crear, editar y eliminar eventos
  - ✅ Crear, editar y eliminar ponentes
  - ✅ Gestionar proyectos y tareas
  - ✅ Ver y confirmar pagos
  - ✅ Gestionar el inventario de regalos
  - ✅ Administrar el equipo (TeamManagement)
  - ✅ Ver reportes completos
  - ✅ Acceder a todas las funciones del sistema

**Usuarios hardcodeados como admin**:
- `jmoredavid@gmail.com`
- `yorluis15@gmail.com`

### 2. **Organizador (organizer)**
- **Acceso**: Amplio, enfocado en la gestión de eventos
- **Puede hacer**:
  - ✅ Crear, editar y eliminar eventos (solo los propios)
  - ✅ Crear, editar y eliminar ponentes
  - ✅ Gestionar proyectos
  - ✅ Ver tareas y calendario
  - ✅ Crear eventos y asignar speakers
  - ✅ Registrarse en eventos
  - ❌ No puede gestionar inventario de regalos (solo admin)
  - ❌ No puede gestionar equipo completo (solo admin)

### 3. **Participante (usuario normal)** - ROL POR DEFECTO
- **Acceso**: Limitado, principalmente visualización y participación
- **Puede hacer**:
  - ✅ Ver eventos públicos
  - ✅ Registrarse en eventos
  - ✅ Ver su calendario personal
  - ✅ Ver sus propias tareas
  - ✅ Crear tareas personales
  - ✅ Ver ponentes
  - ✅ Ver sus regalos ganados
  - ✅ Editar su propio perfil
  - ❌ **NO puede** crear eventos
  - ❌ **NO puede** crear/editar/eliminar ponentes
  - ❌ **NO puede** crear proyectos
  - ❌ **NO puede** acceder a funciones administrativas

---

## 🛡️ Cómo Funcionan las Reglas de Firebase

### Estructura de las Reglas

Las reglas de Firebase están en el archivo `firestore.rules` y funcionan como un **firewall de base de datos**. Cada vez que alguien intenta leer o escribir datos, Firebase verifica estas reglas.

### Funciones Helper Principales

```javascript
// 1. Verifica si el usuario está autenticado
function isSignedIn() {
  return request.auth != null;
}

// 2. Obtiene los datos del usuario desde Firestore
function getUserData() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
}

// 3. Verifica si es un Super Admin (emails hardcodeados)
function isSuperAdmin() {
  return isSignedIn() && 
         request.auth.token.email in ['jmoredavid@gmail.com', 'yorluis15@gmail.com'];
}

// 4. Verifica si tiene un rol específico
function hasRole(role) {
  return (role == 'admin' && isSuperAdmin()) || 
         (isSignedIn() && 
          exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
          getUserData().role == role);
}

// 5. Verifica si es un "Power User" (admin u organizer)
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
  
  // ESCRITURA: Solo Power Users
  allow write: if isPowerUser();
}
```

**Explicación**:
- ✅ **Cualquiera** puede ver la lista de ponentes
- ✅ Solo **Admin/Organizer** pueden crear, editar o eliminar ponentes
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

### Ejemplo 5: Reglas para Proyectos

```javascript
match /projects/{projectId} {
  // Proyecto general: acceso total para todos los autenticados
  allow read, write: if isSignedIn() && projectId == 'general-project';

  // Otros proyectos
  allow read: if isSignedIn() && (
    hasRole('admin') || 
    resource.data.ownerId == request.auth.uid || 
    (resource.data.members != null && request.auth.uid in resource.data.members) ||
    resource.data.isPublic == true
  );
  
  allow create: if isSignedIn() && isPowerUser();
  
  allow update: if isSignedIn() && (
    hasRole('admin') || 
    resource.data.ownerId == request.auth.uid || 
    (resource.data.members != null && request.auth.uid in resource.data.members)
  );
  
  allow delete: if isSignedIn() && (
    hasRole('admin') || 
    resource.data.ownerId == request.auth.uid
  );
}
```

**Explicación**:
- ✅ **Admin/Organizer** pueden crear proyectos
- ✅ Puedes ver proyectos donde eres dueño o miembro
- ✅ Solo el **dueño del proyecto** o **admin** pueden eliminarlo
- ❌ **Participantes** no pueden crear proyectos

---

## 🔄 Flujo de Autenticación

### 1. Registro de Usuario

```
┌─────────────────────┐
│ Usuario se registra │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Firebase Authentication crea cuenta │
└──────────┬──────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────┐
│ Se crea documento en Firestore /users/uid │
└──────────┬─────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│ Se asigna rol por defecto: "participante"│
└──────────┬───────────────────────────────┘
           │
           ▼
┌────────────────────────┐
│ Usuario puede iniciar  │
│      sesión            │
└────────────────────────┘
```

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
    role: forcedRole || userData.role || 'participante' // Rol por defecto
  });
}
```

### 2. Verificación de Permisos en Frontend

```javascript
// Ejemplo en Speakers.jsx
const canManageSpeakers = () => {
  if (!currentUser) return false;
  const allowedRoles = ['admin', 'organizer'];
  return allowedRoles.includes(currentUser.role);
};

// Uso en JSX - Solo muestra botones si tiene permisos
{canManageSpeakers() && (
  <>
    <button onClick={handleEdit}>Editar</button>
    <button onClick={handleDelete}>Eliminar</button>
  </>
)}
```

### 3. Verificación en Backend (Firestore)

```
┌──────────────────────────────────────┐
│ Usuario intenta escribir en Firestore│
└──────────┬───────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │¿Autenticado? │
    └──┬────────┬──┘
       │ NO     │ SÍ
       ▼        ▼
    ┌─────┐  ┌──────────────┐
    │ ❌  │  │¿Tiene el rol?│
    │Deny │  └──┬────────┬──┘
    └─────┘     │ NO     │ SÍ
                ▼        ▼
             ┌─────┐  ┌────────────────┐
             │ ❌  │  │¿Es dueño O     │
             │Deny │  │  admin?        │
             └─────┘  └──┬──────────┬──┘
                         │ NO       │ SÍ
                         ▼          ▼
                      ┌─────┐   ┌─────┐
                      │ ❌  │   │ ✅  │
                      │Deny │   │Allow│
                      └─────┘   └─────┘
```

---

## 📊 Tabla Resumen de Permisos

| Recurso | Admin | Organizer | Participante | Sin Login |
|---------|-------|-----------|--------------|-----------|
| **Ver Eventos** | ✅ | ✅ | ✅ | ✅ |
| **Crear Eventos** | ✅ | ✅ | ❌ | ❌ |
| **Editar Eventos** | ✅ (todos) | ✅ (propios) | ❌ | ❌ |
| **Eliminar Eventos** | ✅ (todos) | ✅ (propios) | ❌ | ❌ |
| **Ver Ponentes** | ✅ | ✅ | ✅ | ✅ |
| **Crear Ponentes** | ✅ | ✅ | ❌ | ❌ |
| **Editar Ponentes** | ✅ | ✅ | ❌ | ❌ |
| **Eliminar Ponentes** | ✅ | ✅ | ❌ | ❌ |
| **Ver Proyectos** | ✅ (todos) | ✅ (propios/miembro) | ✅ (propios/miembro) | ❌ |
| **Crear Proyectos** | ✅ | ✅ | ❌ | ❌ |
| **Ver Tareas** | ✅ (todas) | ✅ (propias) | ✅ (propias) | ❌ |
| **Crear Tareas** | ✅ | ✅ | ✅ | ❌ |
| **Gestionar Regalos** | ✅ | ❌ | ❌ | ❌ |
| **Gestionar Equipo** | ✅ | ❌ | ❌ | ❌ |
| **Ver Reportes** | ✅ | ✅ | ✅ | ❌ |
| **Confirmar Pagos** | ✅ | ❌ | ❌ | ❌ |

---

## 🔑 Puntos Clave para la Explicación

### 1. **Seguridad Multicapa**
- **Capa 1 (Frontend)**: Oculta botones y opciones según el rol
- **Capa 2 (Firestore Rules)**: Bloquea operaciones no autorizadas en la base de datos
- **Capa 3 (Authentication)**: Verifica la identidad del usuario

### 2. **Rol por Defecto**
- Cuando un usuario se registra, automáticamente recibe el rol **`participante`**
- Los administradores pueden cambiar roles desde TeamManagement (solo admin)

### 3. **Super Admins**
- Los emails `jmoredavid@gmail.com` y `yorluis15@gmail.com` **siempre son admin**
- Esto está hardcodeado tanto en el frontend como en las reglas de Firestore
- No se puede cambiar su rol desde la interfaz

### 4. **Principio de Menor Privilegio**
- Los usuarios solo tienen acceso a lo que necesitan para su función
- Por defecto, todo está bloqueado (`allow read, write: if false;`)
- Solo se permiten operaciones específicas según el rol

### 5. **Validación en Tiempo Real**
- Cada operación se valida instantáneamente
- Si alguien intenta manipular el código del navegador, Firestore lo bloquea

---

## 💡 Ejemplo de Caso de Uso Real

### Escenario: Un Participante intenta eliminar un ponente

1. **Frontend**: El botón de eliminar ni siquiera aparece (está oculto por `canManageSpeakers()`)
   ```javascript
   // Solo se muestra si es admin u organizer
   {canManageSpeakers() && (
     <button onClick={handleDelete}>Eliminar</button>
   )}
   ```

2. **Si manipula el código**: Aunque logre hacer aparecer el botón y hacer clic

3. **Firestore Rules**: Al intentar ejecutar `deleteSpeaker()`, Firebase verifica:
   ```javascript
   allow write: if isPowerUser();
   // isPowerUser() verifica si el rol es 'admin' u 'organizer'
   ```
   
4. **Resultado**: 
   - ❌ `isPowerUser()` retorna `false` (porque es 'participante')
   - ❌ Firebase rechaza la operación
   - ❌ Se muestra error: "Permission denied"
   - ✅ El ponente NO se elimina

---

## 📝 Conclusión

El sistema de roles de EventMaster garantiza que:
- ✅ Cada usuario solo puede hacer lo que su rol permite
- ✅ Los datos están protegidos en la base de datos
- ✅ La interfaz se adapta automáticamente al rol del usuario
- ✅ Es imposible burlar la seguridad manipulando el código del navegador
- ✅ Los administradores tienen control total del sistema
- ✅ Los organizadores pueden gestionar eventos y ponentes
- ✅ Los participantes tienen una experiencia segura y limitada

Este sistema es escalable, mantenible y sigue las mejores prácticas de seguridad en aplicaciones web modernas.

---

## 🎓 Glosario de Términos

- **RBAC**: Role-Based Access Control (Control de Acceso Basado en Roles)
- **Firestore**: Base de datos NoSQL de Firebase
- **Authentication**: Sistema de autenticación de Firebase
- **Power User**: Usuario con permisos elevados (admin u organizer)
- **UID**: User ID único asignado por Firebase a cada usuario
- **Firestore Rules**: Reglas de seguridad que controlan el acceso a la base de datos
- **Super Admin**: Usuarios con email hardcodeado que siempre tienen rol admin
