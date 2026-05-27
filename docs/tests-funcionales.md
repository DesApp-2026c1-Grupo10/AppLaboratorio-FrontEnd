# Tests Funcionales - Sprint 3

## Escenarios de prueba documentados

### 1. Gestión de Pedidos

#### 1.1 Crear un pedido exitosamente
- **Actor:** Profesor
- **Operación:** Completar formulario de nuevo pedido con fecha, horario, laboratorio, alumnos, materiales, reactivos y equipos, y presionar "Crear Pedido"
- **Resultado esperado:** El pedido se crea con estado "Pendiente". Se muestra un Snackbar de éxito. El pedido aparece en la tabla.

#### 1.2 Crear pedido con datos incompletos
- **Actor:** Profesor
- **Operación:** Intentar crear pedido sin completar fecha, hora o laboratorio
- **Resultado esperado:** El formulario muestra un mensaje de error indicando los campos obligatorios. No se crea el pedido.

#### 1.3 Crear pedido con conflicto horario
- **Actor:** Profesor
- **Operación:** Crear un pedido en un laboratorio y horario ya ocupado por otro pedido
- **Resultado esperado:** Backend rechaza con error "ocupado". Frontend muestra Snackbar con el mensaje de error.

#### 1.4 Crear pedido con equipo en mantenimiento
- **Actor:** Profesor
- **Operación:** Crear pedido seleccionando un equipo con estado "Mantenimiento"
- **Resultado esperado:** El selector de equipos solo muestra equipos "Disponibles". El equipo en mantenimiento no aparece en la lista.

#### 1.5 Crear pedido sin stock suficiente
- **Actor:** Profesor
- **Operación:** Crear pedido solicitando una cantidad de material mayor al stock disponible
- **Resultado esperado:** Backend rechaza con error. Frontend muestra el error en Snackbar.

#### 1.6 Aprobar un pedido
- **Actor:** Administrador/Bedel
- **Operación:** Presionar "Aceptar" en un pedido con estado "Pendiente"
- **Resultado esperado:** Pedido cambia a estado "Aprobado". Los equipos seleccionados pasan a "En uso". Se registra en el historial. Snackbar de éxito.

#### 1.7 Rechazar un pedido
- **Actor:** Administrador/Bedel
- **Operación:** Presionar "Rechazar" en un pedido con estado "Pendiente"
- **Resultado esperado:** Pedido cambia a estado "Rechazado". Se registra en el historial. Snackbar de éxito.

#### 1.8 Finalizar una clase
- **Actor:** Administrador/Bedel
- **Operación:** Presionar "Finalizar" en un pedido con estado "Aprobado"
- **Resultado esperado:** Pedido cambia a "Finalizado". Stock de materiales y reactivos se descuenta. Equipos vuelven a "Disponible". Se crean movimientos de stock. Snackbar de éxito.

#### 1.9 Ver historial de un pedido
- **Actor:** Profesor/Administrador
- **Operación:** Presionar "Ver historial" en cualquier pedido
- **Resultado esperado:** Se abre un modal con la lista cronológica de cambios: creación, modificaciones, aprobación/rechazo, finalización. Muestra fecha, tipo, usuario responsable y descripción.

### 2. Gestión de Inventario

#### 2.1 Crear un material
- **Actor:** Administrador
- **Operación:** Completar formulario de nuevo material y guardar
- **Resultado esperado:** Material creado. Snackbar de éxito. Aparece en la tabla.

#### 2.2 Crear material sin nombre
- **Actor:** Administrador
- **Operación:** Intentar crear material con nombre vacío
- **Resultado esperado:** Snackbar de error "El nombre es obligatorio". No se crea.

#### 2.3 Editar un material
- **Actor:** Administrador
- **Operación:** Presionar editar en un material, modificar campos y guardar
- **Resultado esperado:** Material actualizado. Snackbar de éxito. Tabla refleja cambios.

#### 2.4 Eliminar un material
- **Actor:** Administrador
- **Operación:** Presionar eliminar en un material, confirmar en el diálogo
- **Resultado esperado:** Material eliminado. Snackbar de éxito. Desaparece de la tabla.

#### 2.5 Crear un reactivo con slider de litros
- **Actor:** Administrador
- **Operación:** Crear reactivo con unidad "litros". En formulario de pedido, seleccionar ese reactivo.
- **Resultado esperado:** La cantidad del reactivo se selecciona con un slider visual en vez de input numérico.

#### 2.6 Filtrar equipos por estado
- **Actor:** Administrador
- **Operación:** Usar el filtro de estado en la página de Equipos
- **Resultado esperado:** La tabla se filtra mostrando solo equipos del estado seleccionado.

#### 2.7 Ver historial de uso de equipo
- **Actor:** Administrador
- **Operación:** Presionar ícono de historial en un equipo
- **Resultado esperado:** Diálogo con lista de usos del equipo (fecha inicio, fin, pedido asociado, observaciones).

### 3. Movimientos de Stock

#### 3.1 Registrar entrada de stock
- **Actor:** Administrador
- **Operación:** Seleccionar material, tipo "entrada", cantidad positiva, guardar
- **Resultado esperado:** Movimiento creado. Stock del material aumenta. Snackbar de éxito.

#### 3.2 Registrar salida de stock
- **Actor:** Administrador
- **Operación:** Seleccionar material/reactivo, tipo "salida", cantidad, guardar
- **Resultado esperado:** Movimiento creado. Stock disminuye. Snackbar de éxito.

#### 3.3 Registrar salida con stock insuficiente
- **Actor:** Administrador
- **Operación:** Seleccionar material con stock bajo y cantidad mayor al disponible
- **Resultado esperado:** Backend rechaza con error. Snackbar muestra el mensaje.

### 4. Estadísticas

#### 4.1 Visualizar resumen general
- **Actor:** Administrador
- **Operación:** Navegar a la página de Estadísticas
- **Resultado esperado:** Se muestran cards con resumen semanal, laboratorios más usados, equipos más usados, materiales y reactivos más consumidos.

### 5. UX/UI

#### 5.1 Notificaciones visuales
- **Actor:** Cualquier usuario
- **Operación:** Realizar cualquier operación (crear, editar, eliminar, aprobar, rechazar)
- **Resultado esperado:** No se usan alert() nativos. Todas las notificaciones son Snackbars de Material UI con color indicativo (verde éxito, rojo error).

#### 5.2 Indicador de carga
- **Actor:** Cualquier usuario
- **Operación:** Navegar a cualquier página que cargue datos
- **Resultado esperado:** Mientras se cargan los datos, se muestra un indicador visual (texto "Cargando..." o spinner).

#### 5.3 Diseño responsive
- **Actor:** Cualquier usuario
- **Operación:** Visualizar la aplicación en diferentes tamaños de pantalla
- **Resultado esperado:** Sidebar, tablas, formularios y dashboard se adaptan al ancho de pantalla sin romper el layout.
