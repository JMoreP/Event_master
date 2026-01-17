# EventMaster - Plataforma Integral de Gestión de Eventos

**EventMaster** es una solución web moderna y robusta diseñada para la gestión 360° de eventos, combinando la logística interna de equipos con la experiencia pública de venta de entradas y registro.

## 🌟 Características del Ecosistema

EventMaster se divide en dos grandes áreas funcionales:

### 1. Panel de Control (Dashboard)
El centro de mando para organizadores y usuarios.
- **Vista General**: Resumen inmediato de "Eventos Activos", tareas pendientes y próximos eventos.
- **Verificación de Pagos (Admin)**: Sección exclusiva para administradores donde pueden validar los pagos de tickets realizados por los usuarios.
- **Estadísticas en Tiempo Real**: Visualización de métricas clave sobre el rendimiento de los eventos.

### 2. Gestión de Eventos (Público & Privado)
- **Catalogo de Eventos**: Los usuarios pueden explorar eventos, ver detalles (fecha, lugar, precio) y registrarse.
- **Mis Tickets**: Área personal donde cada usuario gestiona sus entradas y ve el estado de sus pagos.
- **Ponentes (Speakers)**: Módulo para destacar a los expositores de cada evento.

### 3. Gestión de Proyectos (Logística Interna)
Herramientas para que el equipo organizador coordine el "detrás de escena":
- **Proyectos y Tareas**: Creación de pizarras de trabajo para logística, marketing, etc.
- **Asignación de Roles**: Delegación de tareas a miembros específicos del equipo.
- **Control de Progreso**: Barras de estado y listas de verificación para asegurar el cumplimiento de metas.

---

## 👥 Roles de Usuario y Permisos

La plataforma adapta su interfaz según el nivel de acceso:

| Rol | Permisos Principales |
| :--- | :--- |
| **Administrador** | Acceso total. Puede crear eventos, gestionar usuarios, verificar pagos y promover roles. |
| **Organizador** | Gestión de proyectos, tareas y equipos. Puede crear y editar la logística de los eventos. |
| **Asistente / Usuario** | Puede registrarse en eventos, comprar tickets, ver "Mis Eventos" y participar en tareas asignadas básicas. |

> **Nota**: El sistema incluye un usuario "Super Admin" predefinido (`jmoredavid@gmail.com` y `yorluis15@gmail.com`) que siempre tiene privilegios máximos.

---

## 🛠️ Stack Tecnológico

Este proyecto ha sido construido con las tecnologías más modernas del ecosistema React:

- **Core**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) (Rendimiento extremo).
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) + `normalize.css` (Diseño consistente y responsivo "Mobile First").
- **Backend & Base de Datos**: [Firebase](https://firebase.google.com/)
  - **Firestore**: Base de datos NoSQL en tiempo real.
  - **Authentication**: Gestión segura de usuarios.
  - **Storage**: Almacenamiento de imágenes.
- **Integraciones**:
  - **EmailJS**: Envío de correos transaccionales (invitaciones, confirmaciones).
  - **Cloudinary**: Optimización y gestión de media.

---

## 🚀 Instalación y Despliegue

### Requisitos
- Node.js v18+
- Cuenta activa en Firebase

### Pasos para Ejecutar Localmente

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/TU_USUARIO/Event_master.git
   cd Event_master
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno**:
   Crea un archivo `.env` en la raíz con tus credenciales:
   ```env
   VITE_CLOUDINARY_CLOUD_NAME=...
   VITE_EMAILJS_PUBLIC_KEY=...
   # (Añadir resto de keys según firebase.js)
   ```

4. **Iniciar Servidor de Desarrollo**:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## 📄 Licencia
Este proyecto es propiedad privada de EventMaster.
© 2024 - 2025 EventMaster Team
